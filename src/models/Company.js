// src/models/Company.js
// Mongoose model for companies. Each company groups together one or more users,
// their clients, projects, and delivery notes. The 'owner' field points to the
// user who created the company; additional members reference the company via
// their own 'company' field in the User model.
import mongoose from 'mongoose';

const companySchema = new mongoose.Schema(
  {
    // The user who created and owns this company
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    // CIF is the Spanish company tax identifier, unique across the entire system
    // so two companies cannot share the same fiscal identity.
    cif: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    // Embedded address sub-document, always fetched with the company
    address: {
      street: String,
      number: String, // string to support values like "13A"
      postal: String,
      city: String,
      province: String,
    },
    // Optional Cloudinary URL for the company logo
    logo: { type: String },
    // Freelancers operate without a formal company structure but still need
    // a company record to group their clients and projects
    isFreelance: {
      type: Boolean,
      default: false,
    },
    // Soft-delete flag, deleted companies are hidden but not removed from the DB
    deleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt automatically
  }
);

export default mongoose.model('Company', companySchema);
