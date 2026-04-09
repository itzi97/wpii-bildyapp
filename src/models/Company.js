import mongoose from 'mongoose';

const companySchema = new mongoose.Schema({
  // Reference to User model.
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
  // Used to match or create companies.
  cif: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true // Explicit for clarity.
  },
  address: {
    street: String,
    number: String, // Could be 13A, for example.
    postal: String,
    city: String,
    province: String
  },
  logo: {
    type: String
  },
  isFreelance: {
    type: Boolean,
    default: false
  },
  deleted: {
    type: Boolean,
    default: false,
    index: true
  }
}, {
  timestamps: true
});

export default mongoose.model('Company', companySchema);
