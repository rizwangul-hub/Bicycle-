/**
 * PDF Generator Service — Executive UK Commercial Registry
 * Pixx Bicycle Owner's Declaration System
 *
 * Generates an official, print-perfect vector PDF document for bicycle declarations.
 */

const PDFDocument = require('pdfkit');

// Statically require standard fonts so Vercel Serverless File Trace bundles them
require('pdfkit/standard-fonts/Helvetica');
require('pdfkit/standard-fonts/HelveticaBold');
require('pdfkit/standard-fonts/Courier');
require('pdfkit/standard-fonts/TimesRoman');

function formatDate(iso) {
  if (!iso) return 'N/A';
  try {
    return new Date(iso).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return String(iso);
  }
}

async function fetchImageBuffer(url) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000); // 4s timeout per image
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!response.ok) return null;
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (err) {
    return null;
  }
}

/**
 * Generate a PDF Buffer for a given declaration and its attachments.
 */
async function generateDeclarationPdf(declaration, attachments = []) {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 36, // 0.5 inch margins
        info: {
          Title: `Declaration Certificate - ${declaration.customerName || 'Customer'}`,
          Author: 'PixxTechnologiees UK',
          Subject: 'Official Bicycle Owner Declaration Certificate',
          Keywords: 'bicycle, declaration, ownership, registry, anti-theft',
        },
      });

      const buffers = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      const refCode = declaration._id ? declaration._id.toString().slice(-8).toUpperCase() : 'UNKNOWN';
      const shopName = declaration.shopId?.name || declaration.shopId?.shopCode || 'Authorized Bicycle Shop';
      const shopLocation = declaration.shopId?.location || declaration.shopId?.address || 'United Kingdom';
      const staffName = declaration.createdBy?.name || 'Authorized Staff';
      const dateStr = formatDate(declaration.date || declaration.createdAt);

      // ── Colors ──
      const navy = '#1e3a8a';
      const darkSlate = '#0f172a';
      const mutedSlate = '#64748b';
      const lightBg = '#f8fafc';
      const borderColor = '#cbd5e1';
      const gold = '#b45309';

      // ── Header Banner ──
      doc.rect(36, 36, 523, 56).fill('#0f172a');

      doc.fillColor('#ffffff').fontSize(16).font('Helvetica-Bold')
        .text('PIXXTECHNOLOGIEES', 50, 48);

      doc.fillColor('#93c5fd').fontSize(8.5).font('Helvetica-Bold')
        .text("OFFICIAL BICYCLE OWNER DECLARATION • UK COMMERCIAL REGISTRY", 50, 68);

      doc.fillColor('#ffffff').fontSize(11).font('Helvetica-Bold')
        .text(`DEC-${refCode}`, 420, 48, { align: 'right', width: 125 });

      doc.fillColor('#cbd5e1').fontSize(8).font('Helvetica')
        .text(`Issued: ${dateStr.split(',')[0]}`, 420, 66, { align: 'right', width: 125 });

      let currentY = 104;

      // ── High-Impact Frame / Serial Number Security Card ──
      doc.roundedRect(36, currentY, 523, 44, 6).fillAndStroke('#eff6ff', '#3b82f6');
      
      doc.fillColor(navy).fontSize(8.5).font('Helvetica-Bold')
        .text('REGISTERED BICYCLE FRAME / SERIAL NUMBER (ANTI-THEFT REGISTRY)', 48, currentY + 8);

      const frameText = declaration.frameNumber ? String(declaration.frameNumber).toUpperCase() : 'NO FRAME NUMBER RECORDED';
      doc.fillColor(darkSlate).fontSize(14).font('Helvetica-Bold')
        .text(frameText, 48, currentY + 22);

      currentY += 56;

      // ── Section 1 & 2: Two-Column Data Layout ──
      const colWidth = 254;
      const leftColX = 36;
      const rightColX = 305;
      const startCardY = currentY;

      // Left Box: Customer Info
      doc.roundedRect(leftColX, startCardY, colWidth, 142, 6).fillAndStroke(lightBg, borderColor);
      doc.fillColor(navy).fontSize(9.5).font('Helvetica-Bold').text('DECLARANT / CUSTOMER DETAILS', leftColX + 10, startCardY + 10);
      
      let leftY = startCardY + 28;
      const printField = (label, val, x, y) => {
        doc.fillColor(mutedSlate).fontSize(7.5).font('Helvetica-Bold').text(label.toUpperCase(), x, y);
        doc.fillColor(darkSlate).fontSize(9).font('Helvetica-Bold').text(val || 'Not Provided', x, y + 9, { width: colWidth - 20, ellipsis: true });
        return y + 23;
      };

      leftY = printField('Full Legal Name', declaration.customerName || 'N/A', leftColX + 10, leftY);
      leftY = printField('Contact Phone / Mobile', declaration.phone || declaration.mobile || 'Not Provided', leftColX + 10, leftY);
      leftY = printField('Email Address', declaration.email || 'Not Provided', leftColX + 10, leftY);
      leftY = printField('Residential Address', `${declaration.address || 'Not Provided'}${declaration.postcode ? ' (' + declaration.postcode + ')' : ''}`, leftColX + 10, leftY);
      printField('Issuing Store Branch', `${shopName} (${shopLocation})`, leftColX + 10, leftY);

      // Right Box: Bicycle Specs
      doc.roundedRect(rightColX, startCardY, colWidth, 142, 6).fillAndStroke(lightBg, borderColor);
      doc.fillColor(navy).fontSize(9.5).font('Helvetica-Bold').text('BICYCLE SPECIFICATIONS', rightColX + 10, startCardY + 10);

      let rightY = startCardY + 28;
      rightY = printField('Bicycle Model', declaration.bicycleModel || 'N/A', rightColX + 10, rightY);
      rightY = printField('Manufacturer / Make', declaration.bicycleMake || 'Not Specified', rightColX + 10, rightY);
      rightY = printField('Colour & Markings', `${declaration.bicycleColour || 'Not Specified'} ${declaration.distinguishingMarkings ? '• ' + declaration.distinguishingMarkings : ''}`, rightColX + 10, rightY);
      rightY = printField('Declared Valuation', declaration.cyclePrice ? `£${declaration.cyclePrice}` : 'Not Stated', rightColX + 10, rightY);
      printField('Acquisition Source', declaration.bicycleSource || 'Customer Owned', rightColX + 10, rightY);

      currentY = startCardY + 152;

      // ── Proof of Ownership Attestation ──
      doc.roundedRect(36, currentY, 523, 42, 6).fillAndStroke('#f0fdf4', '#86efac');
      doc.fillColor('#15803d').fontSize(8.5).font('Helvetica-Bold').text('LEGAL ATTESTATION OF LAWFUL OWNERSHIP', 48, currentY + 7);
      doc.fillColor('#166534').fontSize(7.5).font('Helvetica').text(
        'The declarant confirms lawful ownership of the bicycle described herein, free from theft reports, liens, or encumbrances, and authorizes retention of this photographic record in the central registry for police and loss-prevention verification.',
        48,
        currentY + 19,
        { width: 500, lineGap: 1 }
      );

      currentY += 52;

      // ── Photographic Evidence Gallery (if present) ──
      if (attachments && attachments.length > 0) {
        doc.fillColor(darkSlate).fontSize(9.5).font('Helvetica-Bold')
          .text(`ATTACHED EVIDENCE PHOTOS (${attachments.length} Verified Files)`, 36, currentY);
        currentY += 14;

        // Render up to 4 preview thumbnails
        const previewItems = attachments.slice(0, 4);
        const photoWidth = 120;
        const photoHeight = 85;
        const gap = 14;

        for (let i = 0; i < previewItems.length; i++) {
          const item = previewItems[i];
          const px = 36 + i * (photoWidth + gap);
          
          doc.roundedRect(px, currentY, photoWidth, photoHeight, 4).fillAndStroke('#ffffff', borderColor);
          
          let imgBuffer = null;
          if (item.storageUrl) {
            imgBuffer = await fetchImageBuffer(item.storageUrl);
          }

          if (imgBuffer) {
            try {
              doc.image(imgBuffer, px + 2, currentY + 2, {
                fit: [photoWidth - 4, photoHeight - 18],
                align: 'center',
                valign: 'center',
              });
            } catch (imgErr) {
              doc.fillColor(mutedSlate).fontSize(8).text('[Image Preview]', px + 10, currentY + 30);
            }
          } else {
            doc.fillColor(mutedSlate).fontSize(8).text('[Image File]', px + 10, currentY + 30);
          }

          // Category tag
          doc.rect(px, currentY + photoHeight - 16, photoWidth, 16).fill('#f1f5f9');
          doc.fillColor(darkSlate).fontSize(6.5).font('Helvetica-Bold')
            .text(item.category || 'EVIDENCE', px + 4, currentY + photoHeight - 12, { width: photoWidth - 8, align: 'center', ellipsis: true });
        }

        currentY += photoHeight + 16;
      }

      // ── Signatures & Authorization ──
      const sigBoxWidth = 254;
      const sigHeight = 58;

      // Customer Sig Box
      doc.roundedRect(leftColX, currentY, sigBoxWidth, sigHeight, 6).fillAndStroke('#fafafa', borderColor);
      doc.fillColor(mutedSlate).fontSize(7.5).font('Helvetica-Bold').text('DECLARANT SIGNATURE', leftColX + 10, currentY + 8);
      doc.moveTo(leftColX + 10, currentY + 34).lineTo(leftColX + sigBoxWidth - 10, currentY + 34).strokeColor('#94a3b8').stroke();
      doc.fillColor(darkSlate).fontSize(8.5).font('Helvetica-Bold').text(declaration.customerName || 'Customer Signature', leftColX + 10, currentY + 39);
      doc.fillColor(mutedSlate).fontSize(7).font('Helvetica').text(`Date: ${dateStr.split(',')[0]}`, leftColX + sigBoxWidth - 80, currentY + 39, { align: 'right' });

      // Shop Sig Box
      doc.roundedRect(rightColX, currentY, sigBoxWidth, sigHeight, 6).fillAndStroke('#fafafa', borderColor);
      doc.fillColor(mutedSlate).fontSize(7.5).font('Helvetica-Bold').text('SHOP ATTESTATION & STAMP', rightColX + 10, currentY + 8);
      doc.moveTo(rightColX + 10, currentY + 34).lineTo(rightColX + sigBoxWidth - 10, currentY + 34).strokeColor('#94a3b8').stroke();
      doc.fillColor(darkSlate).fontSize(8.5).font('Helvetica-Bold').text(`Verified by: ${staffName}`, rightColX + 10, currentY + 39);
      doc.fillColor(mutedSlate).fontSize(7).font('Helvetica').text(shopName, rightColX + sigBoxWidth - 120, currentY + 39, { align: 'right', width: 110, ellipsis: true });

      currentY += sigHeight + 16;

      // ── Footer ──
      doc.fillColor(mutedSlate).fontSize(7.5).font('Helvetica').text(
        `Official Business Record • PixxTechnologiees Commercial Bicycle Registry • System Audit ID: ${declaration._id || 'N/A'}`,
        36,
        currentY,
        { align: 'center', width: 523 }
      );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = {
  generateDeclarationPdf,
};
