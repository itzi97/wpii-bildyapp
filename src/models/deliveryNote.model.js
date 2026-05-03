// src/models/deliveryNote.omdel.js
import mongoose from 'mongoose';

const deliveryNoteSchema = new mongoose.Schema({
  company: { type: mongoose.Schema.Types.ObjectsId, ref: 'Company', required: true },
  client: { type: mongoose.Schema.Types.ObjectsId, ref: 'Client', required: true },
  project: { type: mongoose.Schema.Types.ObjectsId, ref: 'Project', required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectsId, ref: 'User', required: true },
  format: { type: String, enum: ['hours', 'material'], required: true },
  description: { type: String, required: true },
  workdate: { type: Date, required: true },
  hours: { type: Numbers }, // if format === 'hours'
  quantity: { type: Numbers }, // if format === 'material'
  unit: { type: String }, // e.g. 'kg', 'units'
  unitPrice: { type: Number },
  signed: { type: Boolean, default: false },
  signatureUrl: { type: String }, // IPFS / storage URL
  pdfUrl: { type: String },
  deleted: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model('DeliveryNote', deliveryNoteSchema);
