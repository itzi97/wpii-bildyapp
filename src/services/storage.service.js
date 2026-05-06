// src/services/storage.service.js
// Cloudinary upload helpers used by the delivery note controller.
// All uploads go through the shared uploadBuffer() helper which wraps
// Cloudinary's upload_stream API in a Promise so it can be awaited.
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'node:stream';
import AppError from '../utils/AppError.js';

// Configure Cloudinary once at module load time using environment variables.
// CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET must
// be set in .env, see .env.example.
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Internal helper: uploads a Buffer to Cloudinary using upload_stream.
 * upload_stream is the correct approach when the data is already in memory
 * (as opposed to a file path on disk). We convert the Buffer to a Readable
 * stream and pipe it into Cloudinary's upload stream.
 *
 * @param {Buffer} buffer: The file data to upload
 * @param {object} options: Cloudinary upload options (folder, resource_type, public_id)
 * @returns {Promise<object>} Cloudinary upload result (includes secure_url)
 */
function uploadBuffer(buffer, { folder, resource_type = 'auto', public_id } = {}) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type, public_id },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    // Readable.from() converts a Buffer into a readable stream compatible with pipe()
    Readable.from(buffer).pipe(stream);
  });
}

/**
 * Uploads a signature image buffer to the bildyapp/signatures Cloudinary folder.
 * Called by the delivery note controller when a user signs a note.
 *
 * @param {Buffer} buffer: PNG/JPEG signature image as a Buffer
 * @param {string} filename: Base name used to build the public_id
 * @returns {Promise<object>} Cloudinary result with secure_url
 */
export async function uploadSignatureBuffer(buffer, filename = 'signature') {
  if (!buffer) throw AppError.badRequest('Signature file is required');

  return uploadBuffer(buffer, {
    folder: 'bildyapp/signatures',
    resource_type: 'image',
    public_id: `${Date.now()}-${filename}`,
  });
}

/**
 * Uploads a generated PDF buffer to the bildyapp/pdfs Cloudinary folder.
 * Called after PDF generation to persist the file in cloud storage.
 *
 * @param {Buffer} buffer: PDF file as a Buffer
 * @param {string} filename: Base name used to build the public_id
 * @returns {Promise<object>} Cloudinary result with secure_url
 */
export async function uploadPdfBuffer(buffer, filename = 'delivery-note') {
  if (!buffer) throw AppError.badRequest('PDF buffer is required');

  return uploadBuffer(buffer, {
    folder: 'bildyapp/pdfs',
    resource_type: 'raw',
    public_id: `${Date.now()}-${filename}.pdf`,
  });
}
