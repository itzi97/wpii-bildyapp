// src/services/pdf.service.js
import PDFDocument from 'pdfkit';

export const generateDeliveryNotePDF = (deliveryNote, { client, project, company, user }) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks = [];

    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Header
    doc.fontSize(20).text('Delivery Note', { align: 'center' });
    doc.moveDown();

    // Meta
    doc.fontSize(12)
      .text(`Company: ${company.name}`)
      .text(`Client: ${client.name}`)
      .text(`Project: ${project.name}`)
      .text(`Date: ${new Date(deliveryNote.workdate).toLocaleDateString()}`)
      .text(`Format: ${deliveryNote.format}`)
      .text(`Description: ${deliveryNote.description}`)
      .moveDown();

    if (deliveryNote.format === 'hours') {
      doc.text(`Hours: ${deliveryNote.hours}`);
    } else {
      doc.text(`Quantity: ${deliveryNote.quantity} ${deliveryNote.unit ?? ''}`);
      doc.text(`Unit price: ${deliveryNote.unitPrice}`);
    }

    // Signature block
    if (deliveryNote.signed && deliveryNote.signatureUrl) {
      doc.moveDown().text('Signature:');
      // signatureUrl is a base64 data URL or a file path
      doc.image(deliveryNote.signatureUrl, { width: 150 });
    }

    doc.end();
  });
};
