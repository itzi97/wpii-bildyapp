// src/models/DeliveryNote.js
import mongoose from 'mongoose';

const materialEntrySchema = new mongoose.Schema(
  {
    material: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 0 },
    unit: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const workerEntrySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    hours: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const deliveryNoteSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },

    format: { type: String, enum: ['material', 'hours'], required: true },
    description: { type: String, trim: true },
    workDate: { type: Date, required: true },

    // format === 'material'
    materials: [materialEntrySchema],

    // format === 'hours'
    hours: { type: Number, min: 0 },
    workers: [workerEntrySchema],

    // Signing
    signed: { type: Boolean, default: false },
    signedAt: { type: Date },
    signatureData: { type: String }, // Base64 image string

    // PDF
    pdfPath: { type: String },

    deleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for frequent query fields
deliveryNoteSchema.index({ company: 1, deleted: 1 });
deliveryNoteSchema.index({ company: 1, project: 1 });
deliveryNoteSchema.index({ company: 1, client: 1 });
deliveryNoteSchema.index({ company: 1, signed: 1 });
deliveryNoteSchema.index({ workDate: -1 });

const DeliveryNote = mongoose.model('DeliveryNote', deliveryNoteSchema);

export default DeliveryNote;
