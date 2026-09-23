/**
 * Mobile PDF Certificate Generation & Sharing Service
 * Pixx Bicycle Owner's Declaration System
 *
 * Utilizes expo-print to generate a crisp vector PDF from an official UK declaration
 * certificate template and expo-sharing to trigger native iOS/Android sharing & saving.
 */

import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import type { Attachment, Declaration } from '@/types';

function escapeHtml(str?: string | null): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatDate(iso?: string | null): string {
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

export function buildMobileCertificateHtml(
  declaration: Declaration,
  attachments: Attachment[] = []
): string {
  const refCode = declaration._id ? declaration._id.slice(-8).toUpperCase() : 'UNKNOWN';
  const shopName =
    typeof declaration.shopId === 'object' && declaration.shopId !== null
      ? declaration.shopId.name
      : 'Authorized Bicycle Shop';
  const shopLocation =
    typeof declaration.shopId === 'object' && declaration.shopId !== null
      ? declaration.shopId.address || 'United Kingdom'
      : 'United Kingdom';
  const staffName =
    typeof declaration.createdBy === 'object' && declaration.createdBy !== null
      ? declaration.createdBy.name
      : 'Authorized Staff';
  const dateStr = formatDate(declaration.date || declaration.createdAt);

  const bicycleAttachments = attachments.filter((a) => a.category === 'BICYCLE');
  const customerAttachments = attachments.filter((a) => a.category === 'CUSTOMER');
  const idAttachments = attachments.filter((a) => a.category === 'ID');
  const additionalAttachments = attachments.filter((a) => a.category === 'ADDITIONAL');

  const renderPhotoGrid = (items: Attachment[], label: string) => {
    if (!items || items.length === 0) return '';
    return `
      <div class="photo-category">
        <div class="photo-cat-title">${label} (${items.length})</div>
        <div class="photo-grid">
          ${items
            .map(
              (item) => `
            <div class="photo-card">
              <img src="${escapeHtml(item.storageUrl)}" alt="${escapeHtml(item.originalFileName || label)}" />
              <div class="photo-meta">${escapeHtml(item.originalFileName || 'Evidence')}</div>
            </div>
          `
            )
            .join('')}
        </div>
      </div>
    `;
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Bicycle Declaration Certificate — #${refCode}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 10mm 12mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      padding: 12px;
      font-size: 12px;
      line-height: 1.45;
    }
    .cert-container {
      max-width: 100%;
      margin: 0 auto;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 24px 28px;
    }
    .cert-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #1e3a8a;
      padding-bottom: 14px;
      margin-bottom: 18px;
    }
    .brand-block h1 {
      font-size: 19px;
      font-weight: 800;
      color: #1e3a8a;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .brand-block p {
      font-size: 10.5px;
      color: #64748b;
      margin-top: 2px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .cert-meta {
      text-align: right;
    }
    .ref-badge {
      display: inline-block;
      background: #eff6ff;
      color: #1d4ed8;
      border: 1px solid #bfdbfe;
      font-weight: 700;
      font-size: 12px;
      padding: 3px 8px;
      border-radius: 5px;
      font-family: "Courier New", Courier, monospace;
    }
    .cert-date {
      font-size: 10.5px;
      color: #64748b;
      margin-top: 4px;
    }
    .badge-status {
      display: inline-block;
      background: #dcfce7;
      color: #15803d;
      font-size: 9.5px;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 4px;
      margin-top: 3px;
      text-transform: uppercase;
    }
    .section-title {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #1e3a8a;
      margin-bottom: 8px;
    }
    .card-grid {
      display: flex;
      gap: 12px;
      margin-bottom: 16px;
    }
    .detail-card {
      flex: 1;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 12px 14px;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 3.5px 0;
      border-bottom: 1px dotted #e2e8f0;
      font-size: 11px;
    }
    .detail-row:last-child {
      border-bottom: none;
    }
    .label {
      color: #64748b;
      font-weight: 500;
    }
    .val {
      font-weight: 600;
      color: #0f172a;
      text-align: right;
    }
    .highlight-frame {
      background: #fef3c7;
      color: #92400e;
      padding: 1px 5px;
      border-radius: 3px;
      font-family: "Courier New", Courier, monospace;
      font-weight: 700;
    }
    .declaration-statement {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-left: 4px solid #16a34a;
      border-radius: 6px;
      padding: 12px 14px;
      margin-bottom: 16px;
    }
    .declaration-statement h4 {
      color: #15803d;
      font-size: 11.5px;
      font-weight: 700;
      margin-bottom: 4px;
    }
    .declaration-statement p {
      font-size: 10.5px;
      color: #166534;
      line-height: 1.4;
    }
    .legal-badge {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      margin-top: 6px;
      background: #16a34a;
      color: #ffffff;
      padding: 2px 8px;
      border-radius: 10px;
      font-size: 9.5px;
      font-weight: 700;
    }
    .photo-section {
      margin-top: 12px;
      margin-bottom: 16px;
      page-break-inside: avoid;
    }
    .photo-category {
      margin-bottom: 8px;
    }
    .photo-cat-title {
      font-size: 10px;
      font-weight: 700;
      color: #475569;
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    .photo-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .photo-card {
      width: calc(25% - 6px);
      border: 1px solid #e2e8f0;
      border-radius: 4px;
      overflow: hidden;
      background: #f8fafc;
      text-align: center;
    }
    .photo-card img {
      width: 100%;
      height: 75px;
      object-fit: cover;
      display: block;
      background: #e2e8f0;
    }
    .photo-meta {
      font-size: 8.5px;
      color: #64748b;
      padding: 3px 4px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .signatures-block {
      display: flex;
      gap: 16px;
      margin-top: 16px;
      padding-top: 14px;
      border-top: 1px solid #e2e8f0;
      page-break-inside: avoid;
    }
    .sig-card {
      flex: 1;
      border: 1px dashed #cbd5e1;
      border-radius: 6px;
      padding: 10px 12px;
      background: #fafafa;
    }
    .sig-card .sig-title {
      font-size: 9.5px;
      text-transform: uppercase;
      color: #64748b;
      font-weight: 700;
      margin-bottom: 12px;
    }
    .sig-line {
      border-bottom: 1px solid #94a3b8;
      height: 20px;
      margin-bottom: 4px;
    }
    .sig-name {
      font-size: 10.5px;
      font-weight: 600;
      color: #1e293b;
    }
    .footer-note {
      text-align: center;
      margin-top: 16px;
      font-size: 9px;
      color: #94a3b8;
      border-top: 1px solid #f1f5f9;
      padding-top: 8px;
    }
  </style>
</head>
<body>
  <div class="cert-container">
    <div class="cert-header">
      <div class="brand-block">
        <h1>🚲 PixxTechnologiees</h1>
        <p>Official Bicycle Owner Declaration Certificate • UK</p>
      </div>
      <div class="cert-meta">
        <div class="ref-badge">DEC-${escapeHtml(refCode)}</div>
        <div class="cert-date">Issued: ${escapeHtml(dateStr)}</div>
        <div class="badge-status">✓ Authenticated Record</div>
      </div>
    </div>

    <div class="card-grid">
      <div class="detail-card">
        <div class="section-title">👤 Declarant Information</div>
        <div class="detail-row">
          <span class="label">Full Legal Name</span>
          <span class="val">${escapeHtml(declaration.customerName || 'N/A')}</span>
        </div>
        <div class="detail-row">
          <span class="label">Contact Telephone</span>
          <span class="val">${escapeHtml(declaration.phone || 'Not Provided')}</span>
        </div>
        <div class="detail-row">
          <span class="label">Email Address</span>
          <span class="val">${escapeHtml(declaration.email || 'Not Provided')}</span>
        </div>
        <div class="detail-row">
          <span class="label">Residential Address</span>
          <span class="val">${escapeHtml(declaration.address || 'Not Provided')}</span>
        </div>
        <div class="detail-row">
          <span class="label">Issuing Shop</span>
          <span class="val">${escapeHtml(shopName)} (${escapeHtml(shopLocation)})</span>
        </div>
      </div>

      <div class="detail-card">
        <div class="section-title">🚲 Bicycle Specifications</div>
        <div class="detail-row">
          <span class="label">Bicycle Model</span>
          <span class="val">${escapeHtml(declaration.bicycleModel || 'N/A')}</span>
        </div>
        <div class="detail-row">
          <span class="label">Bicycle Make</span>
          <span class="val">${escapeHtml(declaration.bicycleMake || 'Unspecified')}</span>
        </div>
        <div class="detail-row">
          <span class="label">Frame / Serial No.</span>
          <span class="val ${declaration.frameNumber ? 'highlight-frame' : ''}">
            ${escapeHtml(declaration.frameNumber || 'NO SERIAL RECORDED')}
          </span>
        </div>
        <div class="detail-row">
          <span class="label">Colour</span>
          <span class="val">${escapeHtml(declaration.bicycleColour || 'Unspecified')}</span>
        </div>
        <div class="detail-row">
          <span class="label">Source</span>
          <span class="val">${escapeHtml(declaration.bicycleSource || 'Customer Owned')}</span>
        </div>
      </div>
    </div>

    <div class="declaration-statement">
      <h4>⚖️ Statutory Ownership Declaration</h4>
      <p>
        "I hereby solemnly declare and affirm that I am the legal and lawful owner of the bicycle described in this document. 
        I confirm that the bicycle is not stolen, encumbered by hire purchase or dispute, and that all information provided to the bicycle shop 
        is accurate and truthful under the provisions of the UK Theft Act."
      </p>
      <div class="legal-badge">
        ✓ Legal Ownership Confirmed: ${declaration.legalOwnerConfirmed ? 'YES (Affirmed)' : 'Pending'}
      </div>
    </div>

    ${
      attachments.length > 0
        ? `
      <div class="photo-section">
        <div class="section-title">📷 Attached Photographic Evidence (${attachments.length} files)</div>
        ${renderPhotoGrid(bicycleAttachments, 'Bicycle Photos')}
        ${renderPhotoGrid(customerAttachments, 'Customer Photos')}
        ${renderPhotoGrid(idAttachments, 'Identity Verification Photos')}
        ${renderPhotoGrid(additionalAttachments, 'Receipts & Documents')}
      </div>
    `
        : ''
    }

    <div class="signatures-block">
      <div class="sig-card">
        <div class="sig-title">Declarant Signature</div>
        <div class="sig-line"></div>
        <div class="sig-name">${escapeHtml(declaration.customerName || 'Customer Signature')}</div>
        <div class="label" style="font-size: 9px;">Date: ${escapeHtml(dateStr.split(',')[0])}</div>
      </div>
      <div class="sig-card">
        <div class="sig-title">Shop Verification</div>
        <div class="sig-line"></div>
        <div class="sig-name">Verified by: ${escapeHtml(staffName)}</div>
        <div class="label" style="font-size: 9px;">Shop: ${escapeHtml(shopName)}</div>
      </div>
    </div>

    <div class="footer-note">
      Official record generated by PixxTechnologiees UK • ID: ${escapeHtml(declaration._id || 'N/A')}
    </div>
  </div>
</body>
</html>`;
}

/**
 * Generate PDF and open native share sheet to save or send.
 */
export async function generateAndSharePdf(
  declaration: Declaration,
  attachments: Attachment[] = []
): Promise<void> {
  const html = buildMobileCertificateHtml(declaration, attachments);

  // 1. Generate PDF file via expo-print (writes to a private temp directory)
  const { uri: tempUri } = await Print.printToFileAsync({ html });

  // 2. Copy to cacheDirectory so Android sharing can read it
  //    (Android blocks shareAsync on files in expo-print's private dir)
  const safeFileName = `declaration_${(declaration._id || 'cert').slice(-8).toUpperCase()}.pdf`;
  const destUri = `${FileSystem.cacheDirectory}${safeFileName}`;
  await FileSystem.copyAsync({ from: tempUri, to: destUri });

  // 3. Share / save
  const isAvailable = await Sharing.isAvailableAsync();
  if (isAvailable) {
    await Sharing.shareAsync(destUri, {
      UTI: '.pdf',
      mimeType: 'application/pdf',
      dialogTitle: `Bicycle Declaration — ${declaration.customerName || 'Certificate'}`,
    });
  } else {
    // Fallback: trigger print dialog directly
    await Print.printAsync({ html });
  }
}
