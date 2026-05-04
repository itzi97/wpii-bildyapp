// src/services/storage.service.js

import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'node:stream';
import AppError from '../utils/AppError.js';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

function uploadBuffer(buffer, { folder, resource_type = 'auto', public_id } = {}) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type, public_id },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    Readable.from(buffer).pipe(stream);
  });
}

export async function uploadSignatureBuffer(buffer, filename = 'signature') {
  if (!buffer) throw AppError.badRequest('Signature file is required');

  return uploadBuffer(buffer, {
    folder: 'bildyapp/signatures',
    resource_type: 'image',
    public_id: `${Date.now()}-${filename}`
  });
}

export async function uploadPdfBuffer(buffer, filename = 'delivery-note') {
  if (!buffer) throw AppError.badRequest('PDF buffer is required');

  return uploadBuffer(buffer, {
    folder: 'bildyapp/pdfs',
    resource_type: 'raw',
    public_id: `${Date.now()}-${filename}.pdf`
  });
}
