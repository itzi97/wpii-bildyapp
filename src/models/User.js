import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true // Redundant, keep explicit for clarity.
  },
  password: {
    type: String,
    required: true,
    select: false
  },
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
  },
  verificationCode: {
    type: String
  },
  verificationAttempts: {
    type: Number,
    default: 3
  },
  name: {
    type: String,
    trim: true
  },
  lastName: {
    type: String,
    trim: true
  },
  // References Company model (declared in Company.js).
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    index: true
  },
  deleted: {
    type: Boolean,
    default: false,
    index: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Allow empty name/lastName without breaking fullName.
userSchema.virtual('fullName').get(function() {
  return `${this.name || ''} ${this.lastName || ''}`.trim();
});

export default mongoose.model('User', userSchema);
