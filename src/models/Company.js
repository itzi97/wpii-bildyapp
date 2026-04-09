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
  }
}, { timestamps: true });

export default mongoose.model('Company', companySchema);
