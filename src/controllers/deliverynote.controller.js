// src/controllers/deliverynote.controller.js 
import DeliveryNote from '../models/DeliveryNote.js';
import AppError from '../utils/AppError.js';
import Client from '../models/Client.js';
import Project from '../models/Project.js';
import Company from '../models/Company.js';
import { generateDeliveryNotePdfBuffer } from '../services/pdf.service.js';
import { createDeliveryNoteSchema } from '../validators/deliverynote.validator.js';
import { uploadSignatureBuffer, uploadPdfBuffer } from '../services/storage.service.js';

export const createDeliveryNote = async (req, res, next) => {
  try {
    const parsed = createDeliveryNoteSchema.safeParse(req.body);
    if (!parsed.success)
      return res.status(400).json({ error: parsed.error.flatten() });

    const { clientId, projectId, workdate, ...rest } = parsed.data;
    const note = await DeliveryNote.create({
      ...rest,
      workDate: workdate,
      client: clientId,
      project: projectId,
      company: req.user.company._id,
      user: req.user._id,
    });
    res.status(201).json(note);
  } catch (err) { next(err); }
};

export const getDeliveryNotes = async (req, res, next) => {
  try {
    const notes = await DeliveryNote.find({
      company: req.user.company._id,
      deleted: false
    }).populate('client project user', 'name email');
    res.json(notes);
  } catch (err) { next(err); }
};

export const getDeliveryNote = async (req, res, next) => {
  try {
    const note = await DeliveryNote.findOne({
      _id: req.params.id,
      company: req.user.company._id,
      deleted: false
    });
    if (!note) return res.status(404).json({ error: 'Not found' });
    res.json(note);
  } catch (err) { next(err); }
};

export const signDeliveryNote = async (req, res, next) => {
  try {
    const deliveryNote = await DeliveryNote.findOne({
      _id: req.params.id,
      company: req.user.company,
      deleted: false
    })
      .populate('user')
      .populate('client')
      .populate('project');

    if (!deliveryNote) {
      return next(AppError.notFound('Delivery note not found'));
    }

    if (deliveryNote.signed) {
      return next(AppError.badRequest('Delivery note is already signed'));
    }

    if (!req.file) {
      return next(AppError.badRequest('Signature file is required'));
    }

    const signatureUpload = await uploadSignatureBuffer(
      req.file.buffer,
      req.file.originalname?.split('.')[0] || 'signature'
    );

    deliveryNote.signatureUrl = signatureUpload.secure_url;
    deliveryNote.signed = true;
    deliveryNote.signedAt = new Date();

    const pdfBuffer = await generateDeliveryNotePdfBuffer(deliveryNote);

    const pdfUpload = await uploadPdfBuffer(
      pdfBuffer,
      `delivery-note-${deliveryNote._id}`
    );

    deliveryNote.pdfUrl = pdfUpload.secure_url;

    await deliveryNote.save();

    res.status(200).json({
      status: 'success',
      message: 'Delivery note signed successfully',
      data: deliveryNote
    });
  } catch (error) {
    next(error);
  }
};

export const getDeliveryNotePDF = async (req, res, next) => {
  try {
    const note = await DeliveryNote.findOne({
      _id: req.params.id,
      company: req.user.company._id,
      deleted: false
    });
    if (!note) return res.status(404).json({ error: 'Not found' });
    const [client, project, company] = await Promise.all([
      Client.findById(note.client),
      Project.findById(note.project),
      Company.findById(note.company),
    ]);
    const pdfBuffer = await generateDeliveryNotePDF(note, {
      client,
      project,
      company,
      user: req.user
    });
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="deliverynote-${note._id}.pdf"`
    });
    res.send(pdfBuffer);
  } catch (err) { next(err); }
};

export const deleteDeliveryNote = async (req, res, next) => {
  try {
    const deliveryNote = await DeliveryNote.findOne({
      _id: req.params.id,
      company: req.user.company,
      deleted: false
    });

    if (!deliveryNote) {
      return next(AppError.notFound('Delivery note not found'));
    }

    if (deliveryNote.signed) {
      return next(AppError.badRequest('Signed delivery notes cannot be deleted'));
    }

    await deliveryNote.deleteOne();

    res.status(200).json({
      status: 'success',
      message: 'Delivery note deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
