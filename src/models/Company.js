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
  }
}, { timestamps: true });

export default mongoose.model('Company', companySchema);
