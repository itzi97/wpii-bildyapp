import multer from 'multer';

// Basic disk storage for uploaded company logos.
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    //  Save uploaded files in a local uploads folder for now.
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    // Keep original extension and prepend timestamp.
    const uniqueSuffix = Date.now();
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  }
});

// Initial multer setup for logo uploads.
export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB max file size
  }
});
