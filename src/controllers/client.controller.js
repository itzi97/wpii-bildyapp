// src/controllers/client.controller.js
import Client from '../models/Client.js';
import AppError from '../utils/AppError.js';

// POST /api/client
export const createClient = async (req, res, next) => {
  try {
    const { id: userId } = req.user;
    const company = req.user.company?._id || req.user.company;

    const existing = await Client.findOne({
      company,
      cif: req.body.cif.toUpperCase()
    }
    );

    if (existing)
      return next(AppError.conflict('A client with this CIF already exists in your company'));

    const client = await Client.create({ ...req.body, user: userId, company });

    // Socker.IO - emit to company room
    req.app.get('io')?.to(company.toString()).emit('clientnew', client);

    res.status(201).json({ ok: true, client });
  } catch (err) {
    next(err);
  }
};

// PUT /api/client/:id
export const updateClient = async (req, res, next) => {
  try {
    const company = req.user.company?._id || req.user.company;
    const client = await Client.findOne({
      _id: req.params.id,
      company: company,
      deleted: false
    });

    if (!client) return next(AppError.notFound('Client not found'));

    // If CIF is changing, check it isn't already taken
    if (req.body.cif && req.body.cif.toUpperCase() !== client.cif) {
      const duplicate = await Client.findOne({
        company: company
        cif: req.body.cif.toUpperCase()
      });

      if (duplicate)
        return next(AppError.conflict('A client with this CIF already exists in your company'));
    }

    Object.assign(client, req.body);
    await client.save();

    res.json({ ok: true, client });
  } catch (err) {
    next(err);
  }
};

// GET /api/client
export const listClients = async (req, res, next) => {
  try {
    const company = req.user.company?._id || req.user.company;
    const { page = 1, limit = 10, name, sort = '-createdAt' } = req.query;

    const filter = { company, deleted: false };
    if (name) filter.name = { $regex: name, $options: 'i' };

    const skip = (Number(page) - 1) * Number(limit);
    const [clients, totalItems] = await Promise.all([
      Client.find(filter).sort(sort).skip(skip).limit(Number(limit)),
      Client.countDocuments(filter),
    ]);

    res.json({
      ok: true,
      clients,
      currentPage: Number(page),
      totalPages: Math.ceil(totalItems / Number(limit)),
      totalItems,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/client/:id
export const getClient = async (req, res, next) => {
  try {
    const company = req.user.company?._id || req.user.company;
    const client = await Client.findOne({
      _id: req.params.id,
      company: company,
      deleted: false
    });

    if (!client)
      return next(AppError.notFound('Client not found'));
    res.json({ ok: true, client });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/client/:id (?soft=true for soft delete)
export const deleteClient = async (req, res, next) => {
  try {
    const company = req.user.company?._id || req.user.company;
    const client = await Client.findOne({
      _id: req.params.id,
      company: company,
      deleted: false
    });

    if (!client)
      return next(AppError.notFound('Client not found'));

    if (req.query.soft === 'true') {
      client.deleted = true;
      await client.save();
      return res.json({ ok: true, message: 'Client archived' });
    }

    await client.deleteOne();
    res.json({ ok: true, message: 'Client deleted' });
  } catch (err) {
    next(err);
  }
};

// GET /api/client/archived
export const listArchivedClients = async (req, res, next) => {
  try {
    const company = req.user.company?._id || req.user.company;
    const clients = await Client.find({
      company: company,
      deleted: true
    }).sort('-createdAt');

    res.json({ ok: true, clients });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/client/:id/restore
export const restoreClient = async (req, res, next) => {
  try {
    const company = req.user.company?._id || req.user.company;
    const client = await Client.findOne({
      _id: req.params.id,
      company: company,
      deleted: true
    });

    if (!client)
      return next(AppError.notFound('Archived client not found'));

    client.deleted = false;
    await client.save();

    res.json({ ok: true, client });
  } catch (err) {
    next(err);
  }
}
