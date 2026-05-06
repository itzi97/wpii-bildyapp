// src/controllers/client.controller.js
import Client from '../models/Client.js';
import AppError from '../utils/AppError.js';

// -- POST /api/client
// Creates a new client and links it to the authenticated user's company.
// Before inserting, checks if a client with the same CIF already exists in the
// company to prevent duplicates. On success, emits a Socket.IO 'client:new'
// event to the company room so connected clients receive it in real time.
export const createClient = async (req, res, next) => {
  try {
    // Extract user and company IDs from the JWT payload attached by auth middleware
    const userId = req.user._id || req.user.id;
    const company = req.user.company?._id || req.user.company;

    // CIFs are stored uppercase — normalise before comparing
    const existing = await Client.findOne({
      company,
      cif: req.body.cif.toUpperCase(),
    });

    if (existing)
      return next(AppError.conflict('A client with this CIF already exists in your company'));

    const client = await Client.create({ ...req.body, user: userId, company });

    // Notify all sockets currently in the company room about the new client
    req.app.get('io')?.to(company.toString()).emit('client:new', client);

    res.status(201).json({ data: client });
  } catch (err) {
    next(err);
  }
};

// -- PUT /api/client/:id
// Updates an existing active (non-deleted) client that belongs to the
// authenticated user's company. If the CIF is being changed, a duplicate check
// is performed first to maintain uniqueness within the company.
export const updateClient = async (req, res, next) => {
  try {
    const company = req.user.company?._id || req.user.company;

    const client = await Client.findOne({
      _id: req.params.id,
      company,
      deleted: false,
    });

    if (!client) return next(AppError.notFound('Client not found'));

    // Only run the duplicate check when the incoming CIF is different from the current one
    if (req.body.cif && req.body.cif.toUpperCase() !== client.cif) {
      const duplicate = await Client.findOne({
        company,
        cif: req.body.cif.toUpperCase(),
      });

      if (duplicate)
        return next(AppError.conflict('A client with this CIF already exists in your company'));
    }

    // Merge the request body fields onto the existing document and persist
    Object.assign(client, req.body);
    await client.save();

    res.json({ data: client });
  } catch (err) {
    next(err);
  }
};

// -- GET /api/client
// Returns a paginated list of active clients belonging to the authenticated
// user's company. Supports optional filtering by name (case-insensitive regex)
// and sorting via query params.
export const listClients = async (req, res, next) => {
  try {
    const company = req.user.company?._id || req.user.company;
    const { page = 1, limit = 10, name, sort = '-createdAt' } = req.query;

    // Build the filter: always scope to company and exclude soft-deleted records
    const filter = { company, deleted: false };
    if (name) filter.name = { $regex: name, $options: 'i' };

    const skip = (Number(page) - 1) * Number(limit);

    // Run both queries in parallel to avoid sequential round-trips to MongoDB
    const [clients, totalItems] = await Promise.all([
      Client.find(filter).sort(sort).skip(skip).limit(Number(limit)),
      Client.countDocuments(filter),
    ]);

    res.json({
      data: clients,
      currentPage: Number(page),
      totalPages: Math.ceil(totalItems / Number(limit)),
      totalItems,
    });
  } catch (err) {
    next(err);
  }
};

// -- GET /api/client/:id
// Fetches a single active client by ID, scoped to the authenticated user's
// company. Returns 404 if not found or already soft-deleted.
export const getClient = async (req, res, next) => {
  try {
    const company = req.user.company?._id || req.user.company;

    const client = await Client.findOne({
      _id: req.params.id,
      company,
      deleted: false,
    });

    if (!client) return next(AppError.notFound('Client not found'));

    res.json({ data: client });
  } catch (err) {
    next(err);
  }
};

// -- DELETE /api/client/:id
// Deletes a client. Behaviour depends on the ?soft=true query param:
//   - soft=true  -> marks the client as deleted (archived), keeps the DB record
//   - soft=false -> permanently removes the document from the database
export const deleteClient = async (req, res, next) => {
  try {
    const company = req.user.company?._id || req.user.company;

    const client = await Client.findOne({
      _id: req.params.id,
      company,
      deleted: false,
    });

    if (!client) return next(AppError.notFound('Client not found'));

    if (req.query.soft === 'true') {
      client.deleted = true;
      await client.save();
      return res.json({ message: 'Client archived' });
    }

    await client.deleteOne();
    res.json({ message: 'Client deleted' });
  } catch (err) {
    next(err);
  }
};

// -- GET /api/client/archived
// Returns all soft-deleted (archived) clients for the authenticated user's
// company. Useful for reviewing or restoring previously archived records.
export const listArchivedClients = async (req, res, next) => {
  try {
    const company = req.user.company?._id || req.user.company;

    const clients = await Client.find({ company, deleted: true }).sort('-createdAt');

    res.json({ data: clients });
  } catch (err) {
    next(err);
  }
};

// -- PATCH /api/client/:id/restore
// Restores a previously soft-deleted client by setting deleted=false.
// Returns 404 if the client doesn't exist or is not currently archived.
export const restoreClient = async (req, res, next) => {
  try {
    const company = req.user.company?._id || req.user.company;

    const client = await Client.findOne({
      _id: req.params.id,
      company,
      deleted: true,
    });

    if (!client) return next(AppError.notFound('Archived client not found'));

    client.deleted = false;
    await client.save();

    res.json({ data: client });
  } catch (err) {
    next(err);
  }
};
