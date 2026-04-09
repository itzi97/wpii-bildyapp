import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true // Explicit for clarity
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
  nif: {
    type: String,
    trim: true
  },
  address: {
    street: String,
    number: String, // Could be 13A, for example
    postal: String,
    city: String,
    province: String
  },
  // References Company model
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    index: true
  },
  refreshToken: {
    type: String,
    select: false // Don't return in queries by default
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

// Allow empty name/lastName without breaking fullName
userSchema.virtual('fullName').get(function() {
  return `${this.name || ''} ${this.lastName || ''}`.trim();
});

// Hash password on save
userSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

// Auto filter deleted users from queries
const excludeDeleted = function() {
  if (!this.getOptions().withDeleted) {
    this.where({ deleted: { $ne: true } });
  }
}

// Don't find soft deleted entries
userSchema.pre('find', excludeDeleted);
userSchema.pre('findOne', excludeDeleted);
userSchema.pre('findOneAndUpdate', excludeDeleted);
userSchema.pre('countDocuments', excludeDeleted);

export default mongoose.model('User', userSchema);
