// src/models/Project.js
// Mongoose model for projects. Each project belongs to a company and is linked
// to a specific client. The projectCode must be unique per company (compound index).
// Projects support soft deletion so existing delivery notes keep their reference intact.
import mongoose from 'mongoose';

// Reusable embedded address sub-schema (same structure as Client).
// { _id: false } prevents Mongoose from adding a redundant _id field.
const addressSchema = new mongoose.Schema(
  {
    street: { type: String, trim: true },
    number: { type: String, trim: true }, // string to support values like "13A"
    postal: { type: String, trim: true },
    city: { type: String, trim: true },
    province: { type: String, trim: true },
  },
  { _id: false }
);

const projectSchema = new mongoose.Schema(
  {
    // The user who created this project
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // The company this project belongs to — used to scope all queries
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    // The client this project is for — required so delivery notes inherit the client
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },

    name: { type: String, required: true, trim: true },
    // Forced to uppercase for consistent duplicate detection across the company
    projectCode: { type: String, required: true, trim: true, uppercase: true },

    address: addressSchema,

    email: { type: String, trim: true, lowercase: true },
    notes: { type: String, trim: true },

    // 'active' tracks whether work is ongoing, separate from 'deleted'
    active: { type: Boolean, default: true },
    // Soft-delete flag. Deleted projects are hidden but kept for delivery note references.
    deleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound unique index: prevents the same project code within one company.
// Two different companies CAN share the same project code.
projectSchema.index({ company: 1, projectCode: 1 }, { unique: true });

// Supporting indexes for the most common query patterns in the controller
projectSchema.index({ company: 1, deleted: 1 }); // list active / list archived
projectSchema.index({ company: 1, client: 1 }); // filter by client
projectSchema.index({ company: 1, active: 1 }); // filter by active status

export default mongoose.model('Project', projectSchema);
