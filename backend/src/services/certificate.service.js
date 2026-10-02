/**
 * Certificate Generator Service — Executive UK Registry Edition
 * Pixx Bicycle Owner's Declaration System
 *
 * Generates an official, beautifully-formatted UK commercial registry certificate
 * for bicycle declarations, ready for mobile viewing, print, and PDF export.
 */

function escapeHtml(str) {
  if (!str && str !== 0) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

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

/**
 * Generate full standalone HTML for the Official Declaration Certificate.
 */
function generateCertificateHtml(declaration, attachments = [], token = '', scriptNonce = '') {
  const refCode = declaration._id ? declaration._id.toString().slice(-8).toUpperCase() : 'UNKNOWN';
  const shopName = declaration.shopId?.name || declaration.shopId?.shopCode || 'Authorized Bicycle Shop';
  const shopLocation = declaration.shopId?.location || declaration.shopId?.address || 'United Kingdom';
  const staffName = declaration.createdBy?.name || 'Authorized Staff';
  const dateStr = formatDate(declaration.date || declaration.createdAt);

  const bicycleAttachments = attachments.filter((a) => a.category === 'BICYCLE');
  const customerAttachments = attachments.filter((a) => a.category === 'CUSTOMER');
  const idAttachments = attachments.filter((a) => a.category === 'ID');
  const additionalAttachments = attachments.filter((a) => a.category === 'ADDITIONAL');

  const renderPhotoGrid = (items, label, icon) => {
    if (!items || items.length === 0) return '';
    return `
      <div class="photo-category-block">
        <div class="photo-category-header">
          <span class="photo-cat-icon">${icon}</span>
          <span class="photo-cat-title">${escapeHtml(label)}</span>
          <span class="photo-cat-badge">${items.length} ${items.length === 1 ? 'file' : 'files'}</span>
        </div>
        <div class="photo-grid">
          ${items
            .map(
              (item) => `
            <div class="photo-card">
              <div class="photo-img-wrapper">
                <img src="${escapeHtml(item.storageUrl)}" alt="${escapeHtml(item.originalFileName || label)}" loading="lazy" />
              </div>
              <div class="photo-meta">
                <span class="photo-name">${escapeHtml(item.originalFileName || label)}</span>
              </div>
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
  <title>Declaration Certificate #${refCode} — ${escapeHtml(declaration.customerName || 'Customer')}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>
    @page {
      size: A4 portrait;
      margin: 10mm 12mm;
    }
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #0f172a;
      background: #f1f5f9;
      padding: 16px 10px 40px 10px;
      font-size: 13px;
      line-height: 1.45;
      -webkit-font-smoothing: antialiased;
    }

    /* ── Floating Action Toolbar (Hidden in Print) ── */
    .toolbar-container {
      max-width: 820px;
      margin: 0 auto 16px auto;
    }
    .print-toolbar {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 16px;
      padding: 14px 16px;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.06);
      display: flex;
      flex-direction: column;
      gap: 10px;
      align-items: center;
    }
    .btn-row {
      display: flex;
      flex-direction: column;
      gap: 10px;
      width: 100%;
      max-width: 540px;
    }
    @media (min-width: 540px) {
      .btn-row {
        flex-direction: row;
      }
    }
    .btn-action-pdf {
      flex: 2;
      height: 48px;
      background: #1a56db;
      color: #ffffff;
      border: none;
      border-radius: 12px;
      font-size: 14.5px;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      box-shadow: 0 4px 12px rgba(26, 86, 219, 0.3);
      touch-action: manipulation;
      text-decoration: none;
    }
    .btn-action-print {
      flex: 1.3;
      height: 48px;
      background: #0f172a;
      color: #ffffff;
      border: none;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      touch-action: manipulation;
    }
    .btn-action-close {
      flex: 1;
      height: 48px;
      background: #f8fafc;
      color: #334155;
      border: 1px solid #cbd5e1;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      touch-action: manipulation;
      text-decoration: none;
    }
    .toolbar-guide {
      font-size: 12px;
      color: #475569;
      text-align: center;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 10px;
      padding: 8px 12px;
      width: 100%;
      box-sizing: border-box;
      line-height: 1.4;
    }

    /* ── Main Certificate Container ── */
    .cert-container {
      max-width: 820px;
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 20px;
      padding: 24px 20px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);
      position: relative;
      overflow: hidden;
    }
    .cert-top-stripe {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 6px;
      background: linear-gradient(90deg, #1e3a8a 0%, #1a56db 50%, #0d9488 100%);
    }

    /* ── Certificate Header ── */
    .cert-header {
      display: flex;
      flex-direction: column;
      gap: 14px;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 18px;
      margin-bottom: 20px;
    }
    @media (min-width: 600px) {
      .cert-header {
        flex-direction: row;
        justify-content: space-between;
        align-items: flex-start;
      }
    }
    .brand-block h1 {
      font-size: 20px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.3px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .brand-block p {
      font-size: 11.5px;
      color: #64748b;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      margin-top: 3px;
    }
    .cert-meta-block {
      display: flex;
      flex-direction: column;
      gap: 6px;
      align-items: flex-start;
    }
    @media (min-width: 600px) {
      .cert-meta-block {
        align-items: flex-end;
      }
    }
    .cert-ref-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      color: #1e40af;
      font-weight: 800;
      font-size: 13px;
      padding: 5px 12px;
      border-radius: 8px;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    }
    .cert-timestamp {
      font-size: 11px;
      color: #64748b;
      font-weight: 500;
    }
    .cert-status-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      background: #ecfdf5;
      color: #065f46;
      border: 1px solid #a7f3d0;
      font-size: 10.5px;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 6px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* ── Frame Number High-Impact Security Card ── */
    .frame-security-card {
      background: linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%);
      border: 2px solid #bfdbfe;
      border-radius: 14px;
      padding: 16px;
      margin-bottom: 20px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .frame-sec-label {
      font-size: 11px;
      font-weight: 800;
      color: #1e40af;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .frame-sec-value {
      font-size: 22px;
      font-weight: 900;
      color: #0f172a;
      letter-spacing: 1.5px;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      word-break: break-all;
    }
    .frame-sec-sub {
      font-size: 11px;
      color: #64748b;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    /* ── Content Grid (Mobile 1-col, Desktop 2-col) ── */
    .content-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 16px;
      margin-bottom: 20px;
    }
    @media (min-width: 640px) {
      .content-grid {
        grid-template-columns: 1fr 1fr;
        gap: 16px;
      }
    }
    .section-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .card-title {
      font-size: 13px;
      font-weight: 800;
      color: #1e3a8a;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      display: flex;
      align-items: center;
      gap: 6px;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 8px;
    }
    .field-pair {
      display: flex;
      flex-direction: column;
      gap: 2px;
      border-bottom: 1px dashed #e2e8f0;
      padding-bottom: 6px;
    }
    .field-pair:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }
    .field-label {
      font-size: 10.5px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .field-val {
      font-size: 13.5px;
      font-weight: 700;
      color: #0f172a;
      word-break: break-word;
    }
    .price-val {
      color: #b45309;
      font-size: 15px;
    }

    /* ── Legal Declaration Statement ── */
    .legal-card {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-left: 5px solid #16a34a;
      border-radius: 12px;
      padding: 14px 16px;
      margin-bottom: 20px;
    }
    .legal-card h4 {
      color: #15803d;
      font-size: 13px;
      font-weight: 800;
      margin-bottom: 6px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .legal-card p {
      font-size: 11.5px;
      color: #166534;
      line-height: 1.5;
    }

    /* ── Photo Evidence Gallery ── */
    .photo-section {
      margin-top: 10px;
      margin-bottom: 24px;
      page-break-inside: avoid;
    }
    .photo-section-main-title {
      font-size: 14px;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 14px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .photo-category-block {
      margin-bottom: 16px;
    }
    .photo-category-header {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 8px;
    }
    .photo-cat-title {
      font-size: 12px;
      font-weight: 700;
      color: #334155;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .photo-cat-badge {
      font-size: 10px;
      background: #e2e8f0;
      color: #475569;
      padding: 1px 6px;
      border-radius: 10px;
      font-weight: 600;
    }
    .photo-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
    }
    @media (min-width: 600px) {
      .photo-grid {
        grid-template-columns: repeat(4, 1fr);
        gap: 12px;
      }
    }
    .photo-card {
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      overflow: hidden;
      background: #ffffff;
      box-shadow: 0 1px 3px rgba(0,0,0,0.03);
    }
    .photo-img-wrapper {
      width: 100%;
      height: 130px;
      background: #e2e8f0;
      overflow: hidden;
    }
    @media (min-width: 600px) {
      .photo-img-wrapper {
        height: 110px;
      }
    }
    .photo-img-wrapper img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    .photo-meta {
      padding: 6px 8px;
      background: #f8fafc;
      border-top: 1px solid #f1f5f9;
    }
    .photo-name {
      font-size: 10px;
      color: #475569;
      display: block;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      font-weight: 600;
    }

    /* ── Signatures & Attestation ── */
    .signatures-block {
      display: grid;
      grid-template-columns: 1fr;
      gap: 14px;
      margin-top: 20px;
      padding-top: 18px;
      border-top: 2px solid #e2e8f0;
      page-break-inside: avoid;
    }
    @media (min-width: 600px) {
      .signatures-block {
        grid-template-columns: 1fr 1fr;
        gap: 20px;
      }
    }
    .sig-box {
      border: 1.5px dashed #cbd5e1;
      border-radius: 12px;
      padding: 14px;
      background: #fafafa;
    }
    .sig-title {
      font-size: 11px;
      font-weight: 800;
      color: #475569;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 24px;
    }
    .sig-line {
      border-bottom: 1.5px solid #0f172a;
      height: 1px;
      margin-bottom: 8px;
    }
    .sig-name {
      font-size: 12.5px;
      font-weight: 800;
      color: #0f172a;
    }
    .sig-role {
      font-size: 10.5px;
      color: #64748b;
    }

    /* ── Footer ── */
    .cert-footer {
      text-align: center;
      margin-top: 24px;
      padding-top: 14px;
      border-top: 1px solid #f1f5f9;
      font-size: 10.5px;
      color: #94a3b8;
      line-height: 1.4;
    }

    /* ── PRINT MEDIA QUERIES (A4 / PDF Export) ── */
    @media print {
      body {
        background: #ffffff !important;
        padding: 0 !important;
      }
      .no-print {
        display: none !important;
      }
      .cert-container {
        border: none !important;
        box-shadow: none !important;
        padding: 0 !important;
        max-width: 100% !important;
      }
      .cert-top-stripe {
        display: none !important;
      }
      .content-grid {
        grid-template-columns: 1fr 1fr !important;
        gap: 12px !important;
      }
      .photo-grid {
        grid-template-columns: repeat(4, 1fr) !important;
        gap: 10px !important;
      }
      .photo-img-wrapper {
        height: 90px !important;
      }
      .signatures-block {
        grid-template-columns: 1fr 1fr !important;
      }
    }
  </style>
</head>
<body>

  <!-- Floating Action Bar for Mobile & Desktop (Hidden on Print) -->
  <div class="toolbar-container no-print">
    <div class="print-toolbar">
      <div class="btn-row">
        <button type="button" class="btn-action-pdf" id="download-pdf">
          <span>📥</span>
          <span>Download PDF File</span>
        </button>
        <button type="button" class="btn-action-print" id="print-certificate">
          <span>🖨️</span>
          <span>Print</span>
        </button>
        <button type="button" class="btn-action-close" id="close-certificate">
          <span>✕ Close</span>
        </button>
      </div>
      <div class="toolbar-guide">
        💡 <strong>Direct PDF Download:</strong> Tap <em>"Download PDF File"</em> to directly save this customer's official certificate to your device or mobile phone.
      </div>
    </div>
  </div>

  <!-- Official Certificate Document -->
  <div class="cert-container">
    <div class="cert-top-stripe"></div>

    <!-- Header -->
    <div class="cert-header">
      <div class="brand-block">
        <h1>🚲 PixxTechnologiees</h1>
        <p>Bicycle Owner Declaration Certificate • Commercial Registry</p>
      </div>
      <div class="cert-meta-block">
        <div class="cert-ref-pill">DEC-${escapeHtml(refCode)}</div>
        <div class="cert-timestamp">Date: ${escapeHtml(dateStr)}</div>
        <div class="cert-status-badge">✓ Authenticated Record</div>
      </div>
    </div>

    <!-- High-Impact Frame / Serial Number Badge -->
    <div class="frame-security-card">
      <div class="frame-sec-label">
        <span>🔒</span>
        <span>Registered Bicycle Frame / Serial Number</span>
      </div>
      <div class="frame-sec-value">${escapeHtml(declaration.frameNumber || 'NO FRAME NUMBER RECORDED')}</div>
      <div class="frame-sec-sub">
        <span>🛡️</span>
        <span>Anti-theft identification recorded across PixxTechnologiees network stores & retrieval database.</span>
      </div>
    </div>

    <!-- Details Grid -->
    <div class="content-grid">
      <!-- Customer Information Block -->
      <div class="section-card">
        <div class="card-title">
          <span>👤</span>
          <span>Declarant / Customer Information</span>
        </div>
        <div class="field-pair">
          <span class="field-label">Full Legal Name</span>
          <span class="field-val">${escapeHtml(declaration.customerName || 'N/A')}</span>
        </div>
        <div class="field-pair">
          <span class="field-label">Telephone Number</span>
          <span class="field-val">${escapeHtml(declaration.phone || declaration.mobile || 'Not Provided')}</span>
        </div>
        ${
          declaration.email
            ? `
        <div class="field-pair">
          <span class="field-label">Email Address</span>
          <span class="field-val">${escapeHtml(declaration.email)}</span>
        </div>
        `
            : ''
        }
        <div class="field-pair">
          <span class="field-label">Residential Address</span>
          <span class="field-val">${escapeHtml(declaration.address || 'Not Provided')}${
            declaration.postcode ? ` (${escapeHtml(declaration.postcode)})` : ''
          }</span>
        </div>
        <div class="field-pair">
          <span class="field-label">Issuing Store Branch</span>
          <span class="field-val">${escapeHtml(shopName)} — ${escapeHtml(shopLocation)}</span>
        </div>
      </div>

      <!-- Bicycle Specifications Block -->
      <div class="section-card">
        <div class="card-title">
          <span>🚲</span>
          <span>Bicycle Specifications</span>
        </div>
        <div class="field-pair">
          <span class="field-label">Bicycle Model</span>
          <span class="field-val">${escapeHtml(declaration.bicycleModel || 'N/A')}</span>
        </div>
        <div class="field-pair">
          <span class="field-label">Manufacturer / Make</span>
          <span class="field-val">${escapeHtml(declaration.bicycleMake || 'Not Specified')}</span>
        </div>
        ${
          declaration.cyclePrice
            ? `
        <div class="field-pair">
          <span class="field-label">Declared Valuation / Price</span>
          <span class="field-val price-val">£${escapeHtml(declaration.cyclePrice)}</span>
        </div>
        `
            : ''
        }
        <div class="field-pair">
          <span class="field-label">Bicycle Colour</span>
          <span class="field-val">${escapeHtml(declaration.bicycleColour || 'Not Specified')}</span>
        </div>
        ${
          declaration.ownershipDuration
            ? `
        <div class="field-pair">
          <span class="field-label">Ownership Duration</span>
          <span class="field-val">${escapeHtml(declaration.ownershipDuration)}</span>
        </div>
        `
            : ''
        }
        ${
          declaration.bicycleSource
            ? `
        <div class="field-pair">
          <span class="field-label">Acquisition Source</span>
          <span class="field-val">${escapeHtml(declaration.bicycleSource)}</span>
        </div>
        `
            : ''
        }
      </div>
    </div>

    <!-- Official Legal Declaration -->
    <div class="legal-card">
      <h4>🛡️ Proof of Ownership Attestation</h4>
      <p>
        I, the undersigned declarant, hereby confirm that I am the legal owner of the bicycle described in this document, that it was lawfully acquired, and that it is not subject to any theft report, lien, or encumbrance. I authorize PixxTechnologiees to retain this photographic and documentary record in its central registry for anti-theft identification and law enforcement verification.
      </p>
    </div>

    <!-- Photographic Evidence Gallery -->
    ${
      attachments.length > 0
        ? `
      <div class="photo-section">
        <div class="photo-section-main-title">
          <span>📸</span>
          <span>Attached Photographic Evidence (${attachments.length} Verified Files)</span>
        </div>
        ${renderPhotoGrid(bicycleAttachments, 'Bicycle Evidence Photos', '🚴')}
        ${renderPhotoGrid(customerAttachments, 'Customer Portrait Verification', '👤')}
        ${renderPhotoGrid(idAttachments, 'Government Photo ID / Passport', '🪪')}
        ${renderPhotoGrid(additionalAttachments, 'Proof of Purchase / Additional Invoices', '📄')}
      </div>
    `
        : ''
    }

    <!-- Signatures & Verification Block -->
    <div class="signatures-block">
      <div class="sig-box">
        <div class="sig-title">Declarant / Customer Signature</div>
        <div class="sig-line"></div>
        <div class="sig-name">${escapeHtml(declaration.customerName || 'Customer Signature')}</div>
        <div class="sig-role">Date of Declaration: ${escapeHtml(dateStr.split(',')[0])}</div>
      </div>
      <div class="sig-box">
        <div class="sig-title">Store Verification & Attestation</div>
        <div class="sig-line"></div>
        <div class="sig-name">Verified by: ${escapeHtml(staffName)}</div>
        <div class="sig-role">Authorized Branch: ${escapeHtml(shopName)}</div>
      </div>
    </div>

    <!-- Footer Note -->
    <div class="cert-footer">
      Official Commercial Record generated by PixxTechnologiees UK Bicycle Owner Registry System.<br>
      System Audit ID: ${escapeHtml(declaration._id?.toString() || 'N/A')} • Issued under UK Commercial Records Regulations.
    </div>
  </div>

  <script nonce="${escapeHtml(scriptNonce)}">
    function downloadPdf() {
      var params = new URLSearchParams(window.location.search);
      var currentToken = params.get('token') || '${escapeHtml(token)}';
      var pdfUrl = '/api/declarations/${declaration._id}/pdf';
      window.location.href = currentToken
        ? pdfUrl + '?token=' + encodeURIComponent(currentToken)
        : pdfUrl;
    }

    function handleClose() {
      // 1. Try closing if opened in new tab or popup
      try {
        window.close();
      } catch (e) {}

      // 2. If tab is still open (browser blocked window.close), navigate back to app
      setTimeout(function() {
        if (document.referrer && document.referrer.indexOf('/declarations') !== -1) {
          window.location.href = document.referrer;
        } else {
          window.location.href = 'https://bicycle-ymym.vercel.app/declarations/${declaration._id}';
        }
      }, 150);
    }

    document.getElementById('download-pdf').addEventListener('click', downloadPdf);
    document.getElementById('print-certificate').addEventListener('click', function() {
      window.print();
    });
    document.getElementById('close-certificate').addEventListener('click', handleClose);
  </script>
</body>
</html>`;
}

module.exports = {
  generateCertificateHtml,
};
