import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import AppError from '../utils/AppError.js';

export const register = async (req, res, next) => {
  try {
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    const user = new User({
      ...req.body,
      verificationCode,
      verificationAttempts: 3
    });

    await user.save();
    res.status(201).json({ message: 'User created', id: user._id });
  } catch (error) {
    if (error.code === 11000) return next(AppError.conflict('Email exists'));
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email }).select('+password');
    if (!user || !(await bcrypt.compare(req.body.password, user.password))) {
      return next(AppError.unauthorized('Invalid credentials'));
    }
    res.json({ user: { email: user.email, status: user.status, role: user.role } });
  } catch (error) {
    next(error);
  }
};

export const validateEmail = async (req, res, next) => {
  try {
    // TODO: Get user from auth middleware (req.user)
    // TEST: Hardcoded user, remove later
    const user = await User.findById('69d665ce7bbb1def04637317');

    if (!user || user.status === 'verified') {
      return next(AppError.badRequest('Invalid or already verified'));
    }

    if (user.verificationCode !== req.body.code) {
      user.verificationAttempts -= 1;
      await user.save();

      if (user.verificationAttempts <= 0) {
        return next(AppError.tooManyRequests('Too many attempts'));
      }
      return next(AppError.badRequest('Invalid code'));
    }

    user.status = 'verified';
    user.verificationCode = undefined;
    user.verificationAttempts = 0;
    await user.save();

    res.json({ message: 'Email verified succesfully' });
  } catch (error) {
    next(error);
  }
};
