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

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  allowed.includes(file.mimetype)
    ? cb(null, true)
    : cb(new Error('Only images (jpeg, png, webp)'));
};

// Initial multer setup for logo uploads.
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB max file size
  }
});
