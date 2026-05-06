// src/controllers/user.controller.js
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Company from '../models/Company.js';
import AppError from '../utils/AppError.js';
import config from '../config/index.js';
import notificationService from '../services/notification.service.js';

const generateTokens = (userId) => ({
  accessToken: jwt.sign(
    { id: userId },
    config.JWT_SECRET,
    { expiresIn: config.JWT_EXPIRES_IN }
  ),
  refreshToken: jwt.sign(
    { id: userId },
    config.JWT_REFRESH_SECRET,
    { expiresIn: config.JWT_REFRESH_EXPIRES_IN }
  )
});

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

    notificationService.emit('user:registered', user);

    const { accessToken, refreshToken } = generateTokens(user._id);

    user.refreshToken = refreshToken;
    await user.save();

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
    const { email, password } = req.body;

    const user = await User.findOne({ email: email }).select('+password +refreshToken');
    if (!user) {
      return next(AppError.unauthorized('Invalid credentials'));
    }

    if (user.status !== 'verified') {
      return next(AppError.unauthorized('Email not verified'));
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return next(AppError.unauthorized('Invalid credentials'));
    }

    const { accessToken, refreshToken } = generateTokens(user._id);

    user.refreshToken = refreshToken;
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
    const { code } = req.body;

    const user = await User.findById(req.user._id);

    if (!user || user.status === 'verified') {
      return next(AppError.badRequest('Invalid or already verified'));
    }

    if (user.verificationAttempts <= 0) {
      return next(AppError.tooManyRequests('Too many attempts'));
    }

    // Check if code is wrong
    if (user.verificationCode !== code) {
      user.verificationAttempts -= 1;
      await user.save();

      if (user.verificationAttempts <= 0) {
        return next(AppError.tooManyRequests('Too many attempts'));
      }

      return next(AppError.badRequest(
        `Invalid code. Attempts left: ${user.verificationAttempts}`
      ));
    }

    user.status = 'verified';
    user.verificationCode = null;
    await user.save();

    notificationService.emit('user:verified', {
      userId: user._id,
      email: user.email
    });

    res.status(200).json({
      ack: true,
      message: 'Email verified successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const getCurrentUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('company')
      .select('-password -verificationCode -verificationAttempts');

    if (!user) {
      return next(AppError.notFound('User not found'));
    }

    res.status(200).json({ user });
  } catch (error) {
    next(error)
  }
};

export const logout = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { refreshToken: null });

    res.json({ ack: true, message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

export const updatePersonalData = async (req, res, next) => {
  try {
    const { name, lastName, nif } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, lastName, nif },
      { returnDocument: 'after', runValidators: true },
    );

    notificationService.emit('user:updated', {
      userId: user._id,
      updatedFields: ['name', 'lastName', 'nif']
    });

    res.status(200).json({
      message: 'Personal data updated successfully',
      user: {
        email: user.email,
        fullName: user.fullName,
        status: user.status,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
}

export const updateCompany = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return next(AppError.notFound('User not found'));
    }

    const { name, cif, address, isFreelance } = req.body;

    // Handle freelance case
    if (isFreelance) {
      user.isFreelance = true;
      await user.save();
      return res.status(200).json({
        message: 'Freelance profile updated',
        isFreelance: true
      });
    }

    let company = await Company.findOne({ cif });

    if (!company) {
      company = await Company.create({
        owner: user._id,
        name,
        cif,
        address,
        isFreelance
      });

      user.company = company._id;
    } else {
      user.company = company._id;
      user.role = 'guest';
    }

    await user.save();

    res.status(200).json({
      message: user.role === 'guest' ? 'Company created successfully' : 'Joined existing company',
      company: {
        _id: company._id,
        name: company.name,
        cif: company.cif,
        isFreelance: company.isFreelance
      },
      role: user.role
    });
  } catch (error) {
    if (error.code === 11000) {
      return next(AppError.conflict('Company already exists'));
    }
    next(error);
  }
};

export const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return next(AppError.unauthorized('Refresh token required'));
    }

    const decoded = jwt.verify(refreshToken, config.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id).select('+refreshToken');

    if (!user || user.refreshToken !== refreshToken) {
      return next(AppError.unauthorized('Invalid refresh token'));
    }

    const {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    } = generateTokens(user._id);

    user.refreshToken = newRefreshToken;
    await user.save();

    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return next(AppError.unauthorized('Invalid refresh token'));
    }
    next(error);
  }
};

export const uploadLogo = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(AppError.badRequest('No file uploaded'));
    }

    const user = await User.findById(req.user._id).populate('company');

    if (!user.company) {
      return next(AppError.badRequest('User has no company'));
    }

    const logoUrl = `/uploads/${req.file.filename}`;
    await Company.findByIdAndUpdate(user.company._id, { logo: logoUrl });

    res.json({
      ack: true,
      message: 'Logo uploaded successfully',
      logo: logoUrl
    });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const soft = req.query.soft === 'true';

    if (soft) {
      await User.findByIdAndUpdate(
        req.user._id,
        { deleted: true },
        { returnDocument: 'after', runValidators: true, withDeleted: true },
      );

      notificationService.emit('user:deleted', {
        userId: req.user._id,
        email: req.user.email,
        soft: true
      });

      return res.json({ ack: true, message: 'User soft deleted successfully' });
    }

    await User
      .findByIdAndDelete(req.user._id)
      .setOptions({ withDeleted: true });

    notificationService.emit('user:deleted', {
      userId: req.user._id,
      email: req.user.email,
      soft: soft
    });

    return res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password');

    if (!user) return next(AppError.notFound('User not found'));

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) {
      return next(AppError.unauthorized('Current password incorrect'));
    }

    user.password = newPassword;
    await user.save();

    res.json({
      ack: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    next(error)
  }
};

export const inviteUser = async (req, res, next) => {
  try {
    const inviter = await User.findById(req.user._id);

    if (!inviter) {
      return next(AppError.notFound('Inviter not found'));
    }

    if (!inviter.company) {
      return next(AppError.badRequest('Admin must belong to a company'));
    }

    const { email, name, lastName } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(AppError.conflict('Email already registered or invited'));
    }

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const tempPassword = Math.random().toString(36).slice(-10);

    const invitedUser = new User({
      email,
      password: tempPassword,
      name,
      lastName,
      company: inviter.company,
      role: 'guest',
      status: 'pending',
      verificationCode,
      verificationAttempts: 3
    });

    await invitedUser.save();

    notificationService.emit('user:invited', {
      email: invitedUser.email,
      invitedBy: inviter._id,
      company: inviter.company
    });

    res.status(201).json({
      ack: true,
      message: 'User invited successfully',
      user: {
        email: invitedUser.email,
        role: invitedUser.role,
        status: invitedUser.status,
        company: invitedUser.company
      },
      tempPassword
    });
  } catch (error) {
    if (error.code === 11000) {
      return next(AppError.conflict('Email already registered'));
    }
    next(error);
  }
};
