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
