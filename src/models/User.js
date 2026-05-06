// src/models/User.js
// Mongoose model for application users.
// A User always belongs to one Company (via the company ref). Users are never
// truly deleted — the 'deleted' flag enables soft deletion so audit trails and
// delivery note authorship remain intact even after an account is deactivated.
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true, // normalise to lowercase before saving
      trim: true,
      index: true,     // indexed for fast login lookups
    },
    // select: false means the password field is NEVER returned in query results
    // unless explicitly requested with .select('+password'). This prevents
    // accidental password exposure in API responses.
    password: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: ['admin', 'guest'],
      default: 'admin',
      index: true,
    },
    // 'pending' until the user enters their email verification code.
    // Protected routes check for status === 'verified' before allowing access.
    status: {
      type: String,
      enum: ['pending', 'verified'],
      default: 'pending',
      index: true,
    },
    // One-time code sent by email. Cleared once the user verifies.
    verificationCode: { type: String },
    // Remaining verification attempts before the code is invalidated
    verificationAttempts: { type: Number, default: 3 },

    // Profile fields, filled in by the user after registration
    name: { type: String, trim: true },
    lastName: { type: String, trim: true },
    nif: { type: String, trim: true },

    // Embedded address sub-document. Using an embedded object (not a ref)
    // since address data is always fetched together with the user.
    address: {
      street: String,
      number: String, // string to support values like "13A"
      postal: String,
      city: String,
      province: String,
    },

    // Foreign key to the Company this user belongs to.
    // Populated via .populate('company') in controller queries.
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      index: true,
    },

    // Refresh token stored server-side to support token rotation.
    // select: false prevents it from appearing in API responses.
    refreshToken: {
      type: String,
      select: false,
    },

    // Soft-delete flag. When true the user is excluded from all queries
    // automatically via the pre-query middleware hooks below.
    deleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt automatically
    toJSON: { virtuals: true }, // include virtual fields when serialising to JSON
    toObject: { virtuals: true },
  }
);

// -- Virtual fields
// Virtuals are computed properties that are not stored in MongoDB.
// fullName combines name + lastName for convenience in responses and PDFs.
userSchema.virtual('fullName').get(function() {
  return `${this.name || ''} ${this.lastName || ''}`.trim();
});

// -- Pre-save hook: password hashing
// Runs automatically before every .save() call. bcrypt.hash() is a one-way
// function — the original password cannot be recovered from the stored hash.
// isModified() prevents re-hashing an already-hashed password on unrelated saves.
userSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  // Salt rounds = 10: a standard balance between security and performance
  this.password = await bcrypt.hash(this.password, 10);
});

// -- Query middleware: automatic soft-delete filter
// These hooks run before every find-type query and transparently add a
// { deleted: { $ne: true } } condition so soft-deleted users are invisible
// to all controllers without any extra filter code.
// Pass { withDeleted: true } in query options to bypass this filter (e.g. admin restores).
const excludeDeleted = function() {
  if (!this.getOptions().withDeleted) {
    this.where({ deleted: { $ne: true } });
  }
};

userSchema.pre('find', excludeDeleted);
userSchema.pre('findOne', excludeDeleted);
userSchema.pre('findOneAndUpdate', excludeDeleted);
userSchema.pre('countDocuments', excludeDeleted);

export default mongoose.model('User', userSchema);
