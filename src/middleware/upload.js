// src/middleware/upload.js
import multer from 'multer';
import AppError from '../utils/AppError.js';

const imageFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

  if (!allowed.includes(file.mimetype)) {
    return cb(AppError.badRequest('Only images (jpeg, jpg, png, webp) are allowed'));
  }

  cb(null, true);
};

const memoryStorage = multer.memoryStorage();

const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

export const uploadMemory = multer({
  storage: memoryStorage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});

export const uploadDisk = multer({
  storage: diskStorage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});

// TODO: remove
// compatibility export in case some older routes still import { upload }
export const upload = uploadMemory;
