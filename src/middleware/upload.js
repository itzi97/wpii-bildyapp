// src/middleware/upload.js
// Multer configuration for handling file uploads.
// Only images (jpeg, jpg, png, webp) are accepted, capped at 5 MB.
// Files are kept in memory as a Buffer (req.file.buffer) so they can be
// piped directly to Cloudinary without writing anything to disk.
import multer from 'multer';
import AppError from '../utils/AppError.js';

/**
 * Multer file filter, rejects any file whose MIME type is not an allowed image type.
 * Passing an AppError to cb() causes Multer to forward it to the error handler.
 */
export const imageFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  if (!allowed.includes(file.mimetype)) {
    return cb(AppError.badRequest('Only images (jpeg, jpg, png, webp) are allowed'));
  }

  cb(null, true);
};

// memoryStorage keeps the uploaded file in req.file.buffer (no disk writes).
// This is the correct approach when the file is immediately forwarded to a
// cloud storage service like Cloudinary.
const memoryStorage = multer.memoryStorage();

/**
 * Ready-to-use Multer instance for in-memory image uploads.
 * Use as route middleware: router.patch('/sign', uploadMemory.single('signature'), handler)
 */
export const uploadMemory = multer({
  storage: memoryStorage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB maximum file size
  },
});
