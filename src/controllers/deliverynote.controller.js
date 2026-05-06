// src/controllers/deliverynote.controller.js
import DeliveryNote from '../models/DeliveryNote.js';
import Client from '../models/Client.js';
import Project from '../models/Project.js';
import Company from '../models/Company.js';
import AppError from '../utils/AppError.js';

export const createDeliveryNote = async (req, res, next) => {
  try {
    const {
      clientId,
      projectId,
      format,
      description,
      workDate,
      hours,
      workers,
      materials,
    } = req.body;

    const companyId = req.user.company?._id || req.user.company;
    const userId = req.user._id;

    const [client, project] = await Promise.all([
      Client.findOne({ _id: clientId, company: companyId, deleted: false }),
      Project.findOne({ _id: projectId, company: companyId, deleted: false }),
    ]);

    if (!client) {
      return next(AppError.notFound('Client not found in your company'));
    }

    if (!project) {
      return next(AppError.notFound('Project not found in your company'));
    }

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

    const populatedNote = await DeliveryNote.findById(note._id)
      .populate('user', 'fullName email')
      .populate('client', 'name cif email')
      .populate('project', 'name projectCode');

    req.app.get('io')?.to(String(companyId)).emit('delivery-note:new', populatedNote);

    return res.status(201).json({
      status: 'success',
      data: populatedNote,
    });
  } catch (error) {
    next(error);
  }
};

export const getDeliveryNotes = async (req, res, next) => {
  try {
    const companyId = req.user.company?._id || req.user.company;

    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit, 10) || 10, 1);
    const skip = (page - 1) * limit;

    const query = {
      company: companyId,
      deleted: false,
    };

    if (req.query.project) query.project = req.query.project;
    if (req.query.client) query.client = req.query.client;
    if (req.query.format) query.format = req.query.format;
    if (req.query.signed !== undefined) query.signed = req.query.signed === 'true';

    if (req.query.from || req.query.to) {
      query.workDate = {};
      if (req.query.from) query.workDate.$gte = new Date(req.query.from);
      if (req.query.to) query.workDate.$lte = new Date(req.query.to);
    }

    let sort = { workDate: -1 };
    if (req.query.sort) {
      const field = req.query.sort.startsWith('-')
        ? req.query.sort.slice(1)
        : req.query.sort;
      const direction = req.query.sort.startsWith('-') ? -1 : 1;
      sort = { [field]: direction };
    }

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
      status: 'success',
      currentPage: page,
      totalPages: Math.ceil(totalItems / limit),
      totalItems,
      itemsPerPage: limit,
      data: notes,
    });
  } catch (error) {
    next(error);
  }
};

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

    if (!note) {
      return next(AppError.notFound('Delivery note not found'));
    }

    return res.status(200).json({
      status: 'success',
      data: note,
    });
  } catch (error) {
    next(error);
  }
};

export const signDeliveryNote = async (req, res, next) => {
  try {
    const companyId = req.user.company?._id || req.user.company;

    const deliveryNote = await DeliveryNote.findOne({
      _id: req.params.id, company: companyId, deleted: false,
    }).populate('user', 'fullName email').populate('client').populate('project');

    if (!deliveryNote) return next(AppError.notFound('Delivery note not found'));

    if (deliveryNote.signed) {
      return next(AppError.conflict('Deliery note is already signed'));
    }

    if (!req.file) return next(AppError.badRequest('Signature file is required'));

    // Dynamic imports so for jeck unstable_mockModule
    const { uploadSignatureBuffer, uploadPdfBuffer } = await import('../services/storage.service.js');
    const { generateDeliveryNotePdfBuffer } = await import('../services/pdf.service.js');

    const signatureUpload = await uploadSignatureBuffer(
      req.file.buffer,
      req.file.originalname?.split('.')[0] || `signature-${deliveryNote._id}`
    );

    deliveryNote.signatureUrl = signatureUpload.secure_url;
    deliveryNote.signed = true;
    deliveryNote.signedAt = new Date();

    const pdfBuffer = await generateDeliveryNotePdfBuffer(deliveryNote);
    const pdfUpload = await uploadPdfBuffer(pdfBuffer, `delivery-note-${deliveryNote._id}`);
    deliveryNote.pdfUrl = pdfUpload.secure_url;

    await deliveryNote.save();
    req.app.get('io')?.to(String(companyId)).emit('delivery-note:signed', deliveryNote);

    return res.status(200).json({ status: 'success', message: 'Delivery note signed successfully', data: deliveryNote });
  } catch (error) {
    next(error);
  }
};

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

    if (!note)
      return next(AppError.notFound('Delivery note not found'));

    // If already uploaded to cloud, redirect it
    if (note.pdfUrl && note.signed) {
      return res.redirect(note.pdfUrl);
    }

    const company = await Company.findById(note.company);

    // Dynamic imports so for jeck unstable_mockModule
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

export const deleteDeliveryNote = async (req, res, next) => {
  try {
    const companyId = req.user.company?._id || req.user.company;

    const deliveryNote = await DeliveryNote.findOne({
      _id: req.params.id,
      company: companyId,
      deleted: false,
    });

    if (!deliveryNote) {
      return next(AppError.notFound('Delivery note not found'));
    }

    if (deliveryNote.signed) {
      return next(AppError.forbidden('Cannot delete a signed delivery note'));
    }

    // Soft delete (unless param is required)
    deliveryNote.deleted = true;
    await deliveryNote.save();

    return res.status(200).json({
      status: 'success',
      message: 'Delivery note deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
