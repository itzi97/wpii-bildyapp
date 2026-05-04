// src/services/storage.service.js

import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'node:stream';
import AppError from '../utils/AppError.js';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
