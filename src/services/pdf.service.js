// src/services/pdf.service.js
import PDFDocument from 'pdfkit';
import axios from 'axios';

// Fetches a remote image and returns it as a Buffer for embedding in the PDF.
async function loadImageBufferFromUrl(url) {
  if (!url) return null;
  const response = await axios.get(url, { responseType: 'arraybuffer' });
  return Buffer.from(response.data);
}

/**
 * Generates a PDF buffer for a given delivery note.
 * Uses pdfkit to build the document in memory and returns it as a Buffer.
 * If the note is signed and has a signatureUrl, the signature image is embedded.
 */
export async function generateDeliveryNotePdfBuffer(deliveryNote) {
  const doc = new PDFDocument({ margin: 50 });
  const chunks = [];

  // Collect PDF data chunks as they are emitted by pdfkit
  doc.on('data', chunk => chunks.push(chunk));

  // Wait for the stream to finish before resolving
  const streamDone = new Promise((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });

  doc.fontSize(20).text('Delivery Note', { align: 'center' });
  doc.moveDown();

  doc.fontSize(12).text(`ID: ${deliveryNote._id}`);
  doc.text(`Format: ${deliveryNote.format}`);
  doc.text(`Description: ${deliveryNote.description || '-'}`);
  doc.text(`Work date: ${deliveryNote.workDate ? new Date(deliveryNote.workDate).toISOString().slice(0, 10) : '-'}`);
  doc.moveDown();

  doc.fontSize(14).text('User', { underline: true });
  doc.fontSize(12).text(`Name: ${deliveryNote.user?.name || ''} ${deliveryNote.user?.lastName || ''}`);
  doc.text(`Email: ${deliveryNote.user?.email || '-'}`);
  doc.moveDown();

  doc.fontSize(14).text('Client', { underline: true });
  doc.fontSize(12).text(`Name: ${deliveryNote.client?.name || '-'}`);
  doc.text(`CIF: ${deliveryNote.client?.cif || '-'}`);
  doc.text(`Email: ${deliveryNote.client?.email || '-'}`);
  doc.moveDown();

  doc.fontSize(14).text('Project', { underline: true });
  doc.fontSize(12).text(`Name: ${deliveryNote.project?.name || '-'}`);
  doc.text(`Code: ${deliveryNote.project?.projectCode || '-'}`);
  doc.moveDown();

  doc.fontSize(14).text('Details', { underline: true });
  doc.fontSize(12);

  if (deliveryNote.format === 'hours') {
    doc.text(`Hours: ${deliveryNote.hours ?? 0}`);
    if (deliveryNote.workers?.length) {
      doc.moveDown(0.5).text('Workers:');
      deliveryNote.workers.forEach((worker, index) => {
        doc.text(`${index + 1}. ${worker.name} - ${worker.hours}h`);
      });
    }
  }

  if (deliveryNote.format === 'material') {
    doc.text(`Material: ${deliveryNote.material || '-'}`);
    doc.text(`Quantity: ${deliveryNote.quantity ?? 0}`);
    doc.text(`Unit: ${deliveryNote.unit || '-'}`);
  }

  doc.moveDown();

  // If the note has been signed, embed the signature image from Cloudinary
  if (deliveryNote.signed && deliveryNote.signatureUrl) {
    doc.fontSize(14).text('Signature', { underline: true });
    const signatureBuffer = await loadImageBufferFromUrl(deliveryNote.signatureUrl);
    if (signatureBuffer) {
      doc.moveDown(0.5);
      doc.image(signatureBuffer, { fit: [200, 100], align: 'left' });
    }
    doc.moveDown();
    doc.fontSize(12).text(`Signed at: ${new Date(deliveryNote.signedAt).toISOString()}`);
  }

  // Signal pdfkit that all content has been added, triggers the 'end' event
  doc.end();

  return streamDone;
}
