import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  password: { type: String, required: true, select: false },
  role: {
    type: String,
    enum: ['admin', 'guest'],
    default: 'admin',
    index: true
  },
  status: {
    type: String,
    enum: ['pending', 'verified'],
    default: 'pending',
    index: true
  }
}, { timestamps: true });

export default mongoose.model('User', userSchema);
