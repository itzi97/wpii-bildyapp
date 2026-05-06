// src/services/pdf.service.js
// Generates a PDF buffer for a delivery note using PDFKit.
// The document is built in memory (never written to disk) and returned as a
// Buffer so the controller can stream it directly to the client or upload it
// to Cloudinary. If the note is signed, the signature image is fetched from
// its Cloudinary URL and embedded in the PDF.
import PDFDocument from 'pdfkit';
import axios from 'axios';

/**
 * Fetches a remote image (e.g. from Cloudinary) and returns it as a Buffer
 * so PDFKit can embed it. Returns null if no URL is provided.
 *
 * @param {string|null} url: The public image URL to fetch
 * @returns {Promise<Buffer|null>}
 */
async function loadImageBufferFromUrl(url) {
  if (!url) return null;
  // responseType: 'arraybuffer' tells axios to return raw binary data
  const response = await axios.get(url, { responseType: 'arraybuffer' });
  return Buffer.from(response.data);
}

/**
 * Builds a complete delivery note PDF and returns it as a Buffer.
 *
 * Structure of the generated PDF:
 *  1. Header: document title
 *  2. Note metadata: ID, format, description, work date
 *  3. User section: name and email of the worker who created the note
 *  4. Client section: name, CIF, email
 *  5. Project section: name and project code
 *  6. Work details: hours (with optional worker list) or material info
 *  7. Signature section: embedded image + timestamp (only if signed)
 *
 * @param {object} deliveryNote: A populated DeliveryNote Mongoose document
 * @returns {Promise<Buffer>} The complete PDF as a Buffer
 */
export async function generateDeliveryNotePdfBuffer(deliveryNote) {
  const doc = new PDFDocument({ margin: 50 });
  const chunks = [];

  // PDFKit emits 'data' events as it writes each chunk of the document.
  // We collect them in an array and concatenate at the end.
  doc.on('data', chunk => chunks.push(chunk));

  // Wrap the stream completion in a Promise so we can await it below.
  // The 'end' event fires after doc.end() has flushed all content.
  const streamDone = new Promise((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });

  // -- 1. Header
  doc.fontSize(20).text('Delivery Note', { align: 'center' });
  doc.moveDown();

  // -- 2. Note metadata
  doc.fontSize(12).text(`ID: ${deliveryNote._id}`);
  doc.text(`Format: ${deliveryNote.format}`);
  doc.text(`Description: ${deliveryNote.description || '-'}`);
  doc.text(`Work date: ${deliveryNote.workDate
    ? new Date(deliveryNote.workDate).toISOString().slice(0, 10)
    : '-'}`);
  doc.moveDown();

  // -- 3. User
  doc.fontSize(14).text('User', { underline: true });
  doc.fontSize(12).text(`Name: ${deliveryNote.user?.name || ''} ${deliveryNote.user?.lastName || ''}`);
  doc.text(`Email: ${deliveryNote.user?.email || '-'}`);
  doc.moveDown();

  // -- 4. Client
  doc.fontSize(14).text('Client', { underline: true });
  doc.fontSize(12).text(`Name: ${deliveryNote.client?.name || '-'}`);
  doc.text(`CIF: ${deliveryNote.client?.cif || '-'}`);
  doc.text(`Email: ${deliveryNote.client?.email || '-'}`);
  doc.moveDown();

  // -- 5. Project
  doc.fontSize(14).text('Project', { underline: true });
  doc.fontSize(12).text(`Name: ${deliveryNote.project?.name || '-'}`);
  doc.text(`Code: ${deliveryNote.project?.projectCode || '-'}`);
  doc.moveDown();

  // -- 6. Work details
  doc.fontSize(14).text('Details', { underline: true });
  doc.fontSize(12);

  if (deliveryNote.format === 'hours') {
    doc.text(`Hours: ${deliveryNote.hours ?? 0}`);
    // Optional worker breakdown, only rendered if the note includes a workers array
    if (deliveryNote.workers?.length) {
      doc.moveDown(0.5).text('Workers:');
      deliveryNote.workers.forEach((worker, index) => {
        doc.text(`  ${index + 1}. ${worker.name} — ${worker.hours}h`);
      });
    }
  }

  if (deliveryNote.format === 'material') {
    doc.text(`Material: ${deliveryNote.material || '-'}`);
    doc.text(`Quantity: ${deliveryNote.quantity ?? 0}`);
    doc.text(`Unit: ${deliveryNote.unit || '-'}`);
  }

  doc.moveDown();

  // -- 7. Signature
  // Only rendered if the delivery note has been digitally signed.
  // The signature image is fetched from Cloudinary and embedded directly.
  if (deliveryNote.signed && deliveryNote.signatureUrl) {
    doc.fontSize(14).text('Signature', { underline: true });
    const signatureBuffer = await loadImageBufferFromUrl(deliveryNote.signatureUrl);
    if (signatureBuffer) {
      doc.moveDown(0.5);
      // fit: [200, 100] constrains the image to a max bounding box while preserving aspect ratio
      doc.image(signatureBuffer, { fit: [200, 100], align: 'left' });
    }
    doc.moveDown();
    doc.fontSize(12).text(`Signed at: ${new Date(deliveryNote.signedAt).toISOString()}`);
  }

  // Signal PDFKit that all content has been added.
  // This flushes the internal buffer and triggers the 'end' event.
  doc.end();

  return streamDone;
}
