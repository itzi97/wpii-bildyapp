import mongoose from 'mongoose';

const companySchema = new mongoose.Schema({
  // References User (schema declared in User.js).
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  // Prevent duplicates, create new document if none exist beforehand.
  cif: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  address: {
    street: String,
    number: String, // Maybe a number is "13A".
    postal: String,
    city: String,
    province: String
  },
  logo: { type: String },
  isFreelance: { type: Boolean, default: false },
  deleted: { type: Boolean, default: false, index: true }
}, { timestamps: true });

export default mongoose.model('Company', companySchema);
