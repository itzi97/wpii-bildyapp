// src/controllers/deliverynote.controller.js
import DeliveryNote from '../models/DeliveryNote.js';
import Client from '../models/Client.js';
import Project from '../models/Project.js';
import AppError from '../utils/AppError.js';

// -- POST /api/deliverynote
// Creates a new delivery note linked to the authenticated user's company.
// Both the referenced client and project must exist and belong to the same
// company. The created note is populated and returned. A Socket.IO event
// 'delivery-note:new' is emitted to the company room on success.
export const createDeliveryNote = async (req, res, next) => {
  try {
    const { clientId, projectId, format, description, workDate, hours, workers, materials } = req.body;

    const companyId = req.user.company?._id || req.user.company;
    const userId = req.user._id;

    // Validate both client and project in parallel to reduce round-trips
    const [client, project] = await Promise.all([
      Client.findOne({ _id: clientId, company: companyId, deleted: false }),
      Project.findOne({ _id: projectId, company: companyId, deleted: false }),
    ]);

    if (!client) return next(AppError.notFound('Client not found in your company'));
    if (!project) return next(AppError.notFound('Project not found in your company'));

    const note = await DeliveryNote.create({
      user: userId,
      company: companyId,
      client: clientId,
      project: projectId,
      format,
      description,
      workDate,
      hours,
      workers,
      materials,
    });

    // Populate references so the response contains full client/project/user details
    const populatedNote = await DeliveryNote.findById(note._id)
      .populate('user', 'fullName email')
      .populate('client', 'name cif email')
      .populate('project', 'name projectCode');

    req.app.get('io')?.to(String(companyId)).emit('delivery-note:new', populatedNote);

    return res.status(201).json({ data: populatedNote });
  } catch (error) {
    next(error);
  }
};

// -- GET /api/deliverynote
// Returns a paginated list of delivery notes for the authenticated user's
// company. Supports filtering by project, client, format, signed status, and
// date range. Sort direction is inferred from a leading '-' on the sort param.
export const getDeliveryNotes = async (req, res, next) => {
  try {
    const companyId = req.user.company?._id || req.user.company;

    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit, 10) || 10, 1);
    const skip = (page - 1) * limit;

    // Build query filter, always scope to company and exclude soft-deleted records
    const query = { company: companyId, deleted: false };
    if (req.query.project) query.project = req.query.project;
    if (req.query.client) query.client = req.query.client;
    if (req.query.format) query.format = req.query.format;
    if (req.query.signed !== undefined) query.signed = req.query.signed === 'true';

    // Date range filter, supports ?from and ?to as ISO date strings
    if (req.query.from || req.query.to) {
      query.workDate = {};
      if (req.query.from) query.workDate.$gte = new Date(req.query.from);
      if (req.query.to) query.workDate.$lte = new Date(req.query.to);
    }

    // Parse sort direction: '-field' means descending, 'field' means ascending
    let sort = { workDate: -1 };
    if (req.query.sort) {
      const field = req.query.sort.startsWith('-') ? req.query.sort.slice(1) : req.query.sort;
      const direction = req.query.sort.startsWith('-') ? -1 : 1;
      sort = { [field]: direction };
    }

    // Run count and find in parallel to avoid sequential DB round-trips
    const [notes, totalItems] = await Promise.all([
      DeliveryNote.find(query)
        .populate('user', 'fullName email')
        .populate('client', 'name cif email')
        .populate('project', 'name projectCode')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      DeliveryNote.countDocuments(query),
    ]);

    return res.status(200).json({
      data: notes,
      currentPage: page,
      totalPages: Math.ceil(totalItems / limit),
      totalItems,
      itemsPerPage: limit,
    });
  } catch (error) {
    next(error);
  }
};

// -- GET /api/deliverynote/:id
// Fetches a single delivery note by ID, scoped to the authenticated user's
// company. Populates user, client, and project with extended field sets for
// display in the frontend delivery note view.
export const getDeliveryNote = async (req, res, next) => {
  try {
    const companyId = req.user.company?._id || req.user.company;

    const note = await DeliveryNote.findOne({
      _id: req.params.id,
      company: companyId,
      deleted: false,
    })
      .populate('user', 'fullName email')
      .populate('client', 'name cif email phone address')
      .populate('project', 'name projectCode email address notes active');

    if (!note) return next(AppError.notFound('Delivery note not found'));

    return res.status(200).json({ data: note });
  } catch (error) {
    next(error);
  }
};

// -- PATCH /api/deliverynote/:id/sign
// Signs a delivery note by uploading the signature image to cloud storage,
// generating a PDF of the note (including the signature), and uploading the PDF.
// Once signed, a delivery note cannot be modified or deleted.
// Uses dynamic imports so Jest can mock storage and pdf services per test.
export const signDeliveryNote = async (req, res, next) => {
  try {
    const companyId = req.user.company?._id || req.user.company;

    const deliveryNote = await DeliveryNote.findOne({
      _id: req.params.id,
      company: companyId,
      deleted: false,
    })
      .populate('user', 'fullName email')
      .populate('client')
      .populate('project');

    if (!deliveryNote) return next(AppError.notFound('Delivery note not found'));

    // A note can only be signed once — return 409 Conflict if already signed
    if (deliveryNote.signed) return next(AppError.conflict('Delivery note is already signed'));

    if (!req.file) return next(AppError.badRequest('Signature file is required'));

    // Dynamic imports allow Jest to intercept these modules via unstable_mockModule
    const { uploadSignatureBuffer, uploadPdfBuffer } = await import('../services/storage.service.js');
    const { generateDeliveryNotePdfBuffer } = await import('../services/pdf.service.js');

    // Upload the signature image and store the resulting cloud URL
    const signatureUpload = await uploadSignatureBuffer(
      req.file.buffer,
      req.file.originalname?.split('.')[0] || `signature-${deliveryNote._id}`
    );

    deliveryNote.signatureUrl = signatureUpload.secure_url;
    deliveryNote.signed = true;
    deliveryNote.signedAt = new Date();

    // Generate the PDF with the signature embedded, then upload it
    const pdfBuffer = await generateDeliveryNotePdfBuffer(deliveryNote);
    const pdfUpload = await uploadPdfBuffer(pdfBuffer, `delivery-note-${deliveryNote._id}`);
    deliveryNote.pdfUrl = pdfUpload.secure_url;

    await deliveryNote.save();

    req.app.get('io')?.to(String(companyId)).emit('delivery-note:signed', deliveryNote);

    return res.status(200).json({
      message: 'Delivery note signed successfully',
      data: deliveryNote,
    });
  } catch (error) {
    next(error);
  }
};

// -- GET /api/deliverynote/pdf/:id
// Returns the delivery note as a PDF. If the note has already been signed and
// its PDF was uploaded to cloud storage, the client is redirected to that URL.
// Otherwise, a PDF is generated on the fly and streamed as a response.
export const getDeliveryNotePDF = async (req, res, next) => {
  try {
    const companyId = req.user.company?._id || req.user.company;

    const note = await DeliveryNote.findOne({
      _id: req.params.id,
      company: companyId,
      deleted: false,
    })
      .populate('user', 'fullName email')
      .populate('client')
      .populate('project');

    if (!note) return next(AppError.notFound('Delivery note not found'));

    // If the note is signed and a cloud PDF already exists, redirect to it directly
    if (note.pdfUrl && note.signed) return res.redirect(note.pdfUrl);

    const company = await Company.findById(note.company);

    // Dynamic import allows Jest to mock the pdf service in tests
    const { generateDeliveryNotePdfBuffer } = await import('../services/pdf.service.js');

    const pdfBuffer = await generateDeliveryNotePdfBuffer(note, {
      client: note.client,
      project: note.project,
      company,
      user: note.user,
    });

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="deliverynote-${note._id}.pdf"`,
    });

    return res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};

// -- DELETE /api/deliverynote/:id
// Soft-deletes a delivery note by setting deleted=true.
// Signed notes are protected — attempting to delete one returns 403 Forbidden.
// This ensures the integrity of signed documents and their audit trail.
export const deleteDeliveryNote = async (req, res, next) => {
  try {
    const companyId = req.user.company?._id || req.user.company;

    const deliveryNote = await DeliveryNote.findOne({
      _id: req.params.id,
      company: companyId,
      deleted: false,
    });

    if (!deliveryNote) return next(AppError.notFound('Delivery note not found'));

    // Signed notes are immutable, their PDF and signature must remain intact
    if (deliveryNote.signed) return next(AppError.forbidden('Cannot delete a signed delivery note'));

    deliveryNote.deleted = true;
    await deliveryNote.save();

    return res.status(200).json({ message: 'Delivery note deleted successfully' });
  } catch (error) {
    next(error);
  }
};
