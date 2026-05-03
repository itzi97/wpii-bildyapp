// src/controllers/deliverynote.controller.js 
import DeliveryNote from '../models/DeliveryNote.js';
import Client from '../models/Client.js';
import Project from '../models/Project.js';
import Company from '../models/Company.js';
import { generateDeliveryNotePDF } from '../services/pdf.service.js';
import { createDeliveryNoteSchema } from '../validators/deliverynote.validator.js';

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
    const note = await DeliveryNote.findOne({
      _id: req.params.id,
      company: req.user.company._id,
      deleted: false
    });
    if (!note) return res.status(404).json({ error: 'Not found' });
    if (note.signed) return res.status(409).json({ error: 'Already signed' });
    const { signatureData } = req.body;
    if (!signatureData) return res.status(400).json({ error: 'signatureData required' });
    note.signed = true;
    note.signatureData = signatureData;
    note.signedAt = new Date();
    await note.save();
    res.json(note);
  } catch (err) { next(err); }
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
    const note = await DeliveryNote.findOne({
      _id: req.params.id,
      company: req.user.company._id,
      deleted: false
    });
    if (!note) return res.status(404).json({ error: 'Not found' });
    if (note.signed)
      return res.status(403).json({ error: 'Cannot delete a signed delivery note' });
    note.deleted = true;
    await note.save();
    res.json({ message: 'Deleted' });
  } catch (err) { next(err); }
};
