import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import AppError from '../utils/AppError.js';
import config from '../config/index.js';
import notificationService from '../services/notification.service.js';

export const register = async (req, res, next) => {
  try {
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Create user with random verification code
    const user = new User({
      ...req.body,
      verificationCode,
      verificationAttempts: 3
    });

    await user.save();

    // User registered notification being sent after user is saved
    notificationService.emit('user:registered', user);

    const accessToken = jwt.sign(
      { id: user._id },
      config.JWT_SECRET,
      { expiresIn: config.JWT_EXPIRES_IN }
    );

    const refreshToken = jwt.sign(
      { id: user._id },
      config.JWT_REFRESH_SECRET,
      { expiresIn: config.JWT_REFRESH_EXPIRES_IN }
    );

    res.status(201).json({
      user: {
        email: user.email,
        status: user.status,
        role: user.role
      },
      accessToken,
      refreshToken
    });
  } catch (error) {
    if (error.code === 11000) return next(AppError.conflict('Email exists'));
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email }).select('+password +refreshToken');
    if (!user || !(await bcrypt.compare(req.body.password, user.password))) {
      return next(AppError.unauthorized('Invalid credentials'));
    }

    // Generate tokens (same as register)
    const accessToken = jwt.sign(
      { id: user._id },
      config.JWT_SECRET,
      { expiresIn: config.JWT_EXPIRES_IN }
    );
    const refreshToken = jwt.sign(
      { id: user._id },
      config.JWT_REFRESH_SECRET,
      { expiresIn: config.JWT_REFRESH_EXPIRES_IN }
    );

    user.refreshToken = refreshToken; // Store for logout
    await user.save();

    res.json({
      user: { email: user.email, status: user.status, role: user.role },
      accessToken,
      refreshToken
    });

  } catch (error) {
    next(error);
  }
};

export const validateEmail = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

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

    notificationService.emite('user:verified', user);

    res.json({ message: 'Email verified succesfully' });
  } catch (error) {
    next(error);
  }
};
