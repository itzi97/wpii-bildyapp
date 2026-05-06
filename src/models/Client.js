// src/models/Client.js
// Mongoose model for clients. Clients belong to a company and are created by
// a specific user within that company. The CIF must be unique per company
// (enforced via a compound index) but the same CIF can exist in different companies.
// Soft deletion is used so that existing delivery notes still reference valid client data.
import mongoose from 'mongoose';

// Reusable embedded address sub-schema.
// { _id: false } prevents Mongoose from adding a redundant _id to the sub-document.
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

const clientSchema = new mongoose.Schema(
  {
    // The user who created this client record
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // The company this client belongs to, used to scope all queries
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },

    name: { type: String, required: true, trim: true },
    // CIF is forced to uppercase for consistent duplicate detection
    cif: { type: String, required: true, trim: true, uppercase: true },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },

    address: addressSchema,

    // Soft-delete flag. Controllers filter by { deleted: false } in active queries
    // and { deleted: true } in the /archived endpoint.
    deleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound unique index: prevents the same CIF appearing twice within one company.
// Two different companies CAN have a client with the same CIF.
clientSchema.index({ company: 1, cif: 1 }, { unique: true });

// Supporting indexes for the most common query patterns in the controller
clientSchema.index({ company: 1, deleted: 1 }); // list active / list archived
clientSchema.index({ company: 1, name: 1 });     // name-based searches

export default mongoose.model('Client', clientSchema);
