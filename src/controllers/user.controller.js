import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import AppError from '../utils/AppError.js';

export const register = async (req, res, next) => {
  try {
    const user = new User(req.body);
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

    // TEST: Testing user login request body
    console.log('login email:', req.body.email);
    console.log('user found:', !!user);
    console.log('has password field:', !!user?.password);
    console.log('stored password:', user?.password);

    const isMatch = user ? await bcrypt.compare(req.body.password, user.password) : false;
    console.log('compare result:', isMatch);

    if (!user || !(await bcrypt.compare(req.body.password, user.password))) {
      return next(AppError.unauthorized('Invalid credentials'));
    }
    res.json({ user: { email: user.email, status: user.status, role: user.role } });
  } catch (error) {
    next(error);
  }
};
