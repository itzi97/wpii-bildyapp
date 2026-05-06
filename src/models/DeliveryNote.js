// src/models/DeliveryNote.js
// Mongoose model for delivery notes. A delivery note documents work done
// (hours or materials) on a specific project for a client.
//
// Key business rules enforced at the model level:
//  - format is either 'hours' or 'material', never both active at once
//  - once signed (signed: true), the note is immutable (enforced in the controller)
//  - soft deletion preserves the document for audit purposes
import mongoose from 'mongoose';

// Sub-schema for a single material line item.
// { _id: false } prevents Mongoose adding redundant _id fields to each array entry.
const materialEntrySchema = new mongoose.Schema(
  {
    material: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 0 },
    unit: { type: String, required: true, trim: true }, // e.g. "kg", "m²", "units"
  },
  { _id: false }
);

// Sub-schema for a single worker entry (used in 'hours' format notes)
const workerEntrySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    hours: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const deliveryNoteSchema = new mongoose.Schema(
  {
    // All four refs are required, a note must always be traceable to its
    // user, company, client, and project for PDF generation and access control.
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },

    // 'format' determines which set of fields is relevant:
    //   'hours'    -> uses the hours + workers fields
    //   'material' -> uses the materials array
    format: { type: String, enum: ['material', 'hours'], required: true },
    description: { type: String, trim: true },
    workDate: { type: Date, required: true },

    // -- Material format fields
    // Array of material line items, only populated when format === 'material'
    materials: [materialEntrySchema],

    // -- Hours format fields
    // Total hours for the note, only used when format === 'hours'
    hours: { type: Number, min: 0 },
    // Optional per-worker breakdown within the hours total
    workers: [workerEntrySchema],

    // -- Signing fields
    // Once signed is set to true, the controller rejects any further edits or deletes.
    signed: { type: Boolean, default: false },
    signedAt: { type: Date, default: null },
    // Cloudinary URL of the signature image uploaded during signing
    signatureUrl: { type: String, default: null },

    // -- PDF fields
    // Cloudinary URL of the generated PDF — populated after the first PDF download
    pdfUrl: { type: String, default: null },

    // Soft-delete flag — deleted notes are hidden but kept for audit trails
    deleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Supporting indexes for the most common query patterns
deliveryNoteSchema.index({ company: 1, deleted: 1 }); // list active notes
deliveryNoteSchema.index({ company: 1, project: 1 }); // filter by project
deliveryNoteSchema.index({ company: 1, client: 1 }); // filter by client
deliveryNoteSchema.index({ company: 1, signed: 1 }); // filter signed / unsigned
deliveryNoteSchema.index({ workDate: -1 }); // sort by most recent work date

export default mongoose.model('DeliveryNote', deliveryNoteSchema);
