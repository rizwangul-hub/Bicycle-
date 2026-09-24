import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MobileLayout } from '../components/MobileLayout';
import { ImageViewerModal } from '../components/ImageViewerModal';
import { declarationService } from '../services/declaration.service';
import { uploadService } from '../services/upload.service';

export const DeclarationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [declaration, setDeclaration] = useState(null);
  const [attachments, setAttachments] = useState({
    BICYCLE: [],
    CUSTOMER: [],
    ID: [],
    ADDITIONAL: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activePhoto, setActivePhoto] = useState(null);

  // Quick photo upload state from detail screen
  const [uploadingCategory, setUploadingCategory] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await declarationService.getById(id);
      setDeclaration(data);

      try {
        const attachRes = await uploadService.getDeclarationAttachments(id);
        if (attachRes?.grouped) {
          setAttachments(attachRes.grouped);
        }
      } catch (attErr) {
        console.warn('Attachments fetch note:', attErr.message);
      }
    } catch (err) {
      setError(err.message || 'Could not load declaration.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleQuickUpload = async (category, fileList) => {
    if (!fileList || fileList.length === 0) return;
    setUploadingCategory(category);
    try {
      await uploadService.uploadAttachments(id, category, Array.from(fileList));
      await loadData();
    } catch (err) {
      alert(err.message || 'Failed to upload photo.');
    } finally {
      setUploadingCategory(null);
    }
  };

  const handlePrintCertificate = () => {
    const certUrl = declarationService.getCertificateUrl(id);
    window.open(certUrl, '_blank');
  };

  if (loading) {
    return (
      <MobileLayout title="Declaration Details" showBack>
        <div style={styles.loadingBox}>
          <div style={styles.spinner} />
          <span>Loading declaration details...</span>
        </div>
      </MobileLayout>
    );
  }

  if (error || !declaration) {
    return (
      <MobileLayout title="Declaration Details" showBack>
        <div style={styles.errorBox}>
          <span style={styles.errorIcon}>⚠️</span>
          <span>{error || 'Declaration not found.'}</span>
          <button
            type="button"
            style={styles.retryBtn}
            onClick={() => navigate('/declarations')}
          >
            Back to Records
          </button>
        </div>
      </MobileLayout>
    );
  }

  const shopDisplay =
    declaration.shopId?.name ||
    (typeof declaration.shopId === 'string' ? declaration.shopId : 'Shop Record');

  return (
    <MobileLayout title="Declaration Details" showBack>
      {/* ── Status Banner ────────────────────────────── */}
      <div style={styles.bannerCard}>
        <div style={styles.bannerTop}>
          <span style={styles.shopPill}>{shopDisplay}</span>
          <span style={styles.statusPill}>✓ Active Record</span>
        </div>
        <h2 style={styles.bannerCustomer}>{declaration.customerName}</h2>
        <p style={styles.bannerBike}>
          🚴 {declaration.bicycleMake ? `${declaration.bicycleMake} ` : ''}
          {declaration.bicycleModel}
        </p>
        <div style={styles.bannerMeta}>
          <span>
            Date:{' '}
            {declaration.date
              ? new Date(declaration.date).toLocaleDateString('en-GB')
              : new Date(declaration.createdAt).toLocaleDateString('en-GB')}
          </span>
          <span>•</span>
          <span>Ref: #{declaration._id.slice(-6).toUpperCase()}</span>
        </div>
      </div>

      {/* ── Action Toolbar (Certificate / Print) ──────── */}
      <div style={styles.actionToolbar}>
        <button
          type="button"
          style={styles.certBtn}
          onClick={handlePrintCertificate}
        >
          <span>📄</span>
          <span>Print / View Official Certificate</span>
        </button>
      </div>

      {/* ── Section 1: Customer Details ──────────────── */}
      <div style={styles.detailCard}>
        <h3 style={styles.cardHeading}>👤 Customer Information</h3>
        <div style={styles.detailGrid}>
          <div style={styles.detailRow}>
            <span style={styles.detailLabel}>Full Name:</span>
            <span style={styles.detailValue}>{declaration.customerName}</span>
          </div>
          {declaration.phone && (
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Phone:</span>
              <a href={`tel:${declaration.phone}`} style={styles.linkValue}>
                {declaration.phone}
              </a>
            </div>
          )}
          {declaration.mobile && (
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Mobile:</span>
              <a href={`tel:${declaration.mobile}`} style={styles.linkValue}>
                {declaration.mobile}
              </a>
            </div>
          )}
          {declaration.email && (
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Email:</span>
              <a href={`mailto:${declaration.email}`} style={styles.linkValue}>
                {declaration.email}
              </a>
            </div>
          )}
          {declaration.address && (
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Address:</span>
              <span style={styles.detailValue}>{declaration.address}</span>
            </div>
          )}
          {declaration.postcode && (
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Postcode:</span>
              <span style={styles.detailValue}>{declaration.postcode}</span>
            </div>
          )}
          {declaration.cashPurchasePageNo && (
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Page No:</span>
              <span style={styles.detailValue}>{declaration.cashPurchasePageNo}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Section 2: Bicycle Details ───────────────── */}
      <div style={styles.detailCard}>
        <h3 style={styles.cardHeading}>🚲 Bicycle Information</h3>
        <div style={styles.detailGrid}>
          <div style={styles.detailRow}>
            <span style={styles.detailLabel}>Model:</span>
            <span style={styles.detailValueBold}>{declaration.bicycleModel}</span>
          </div>
          {declaration.bicycleMake && (
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Make:</span>
              <span style={styles.detailValue}>{declaration.bicycleMake}</span>
            </div>
          )}
          {declaration.cyclePrice && (
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Cycle Price:</span>
              <span style={styles.priceValue}>£{declaration.cyclePrice}</span>
            </div>
          )}
          {declaration.bicycleColour && (
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Colour:</span>
              <span style={styles.detailValue}>{declaration.bicycleColour}</span>
            </div>
          )}
          {declaration.frameNumber && (
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Frame Number:</span>
              <span style={styles.frameValue}>{declaration.frameNumber}</span>
            </div>
          )}
          {declaration.distinguishingMarkings && (
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Markings:</span>
              <span style={styles.detailValue}>{declaration.distinguishingMarkings}</span>
            </div>
          )}
          {declaration.bicycleSource && (
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Source:</span>
              <span style={styles.detailValue}>{declaration.bicycleSource}</span>
            </div>
          )}
          {declaration.ownershipDuration && (
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Owned For:</span>
              <span style={styles.detailValue}>{declaration.ownershipDuration}</span>
            </div>
          )}
          {declaration.bicycleFault && (
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Faults:</span>
              <span style={styles.detailValue}>{declaration.bicycleFault}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Section 3: Legal Owner Confirmation ──────── */}
      <div style={styles.detailCard}>
        <h3 style={styles.cardHeading}>⚖️ Ownership Declaration</h3>
        <p style={styles.legalStatement}>
          {declaration.legalOwnerConfirmed ? (
            <span style={{ color: '#16a34a', fontWeight: '700' }}>
              ✓ Legal owner declaration signed & confirmed by customer.
            </span>
          ) : (
            <span style={{ color: '#64748b' }}>
              Legal owner declaration recorded on physical store form.
            </span>
          )}
        </p>
      </div>

      {/* ── Section 4: Grouped Photo Galleries ───────── */}
      <div style={styles.photosSection}>
        <h3 style={styles.mainPhotosHeading}>📷 Attached Photo Evidence</h3>

        {/* 1. Bicycle Photos */}
        <PhotoGallerySection
          title="Bicycle Photos"
          subtitle="Frame, markings, and overall angles"
          items={attachments.BICYCLE || []}
          category="BICYCLE"
          onView={(item) => setActivePhoto(item)}
          onUpload={(files) => handleQuickUpload('BICYCLE', files)}
          isUploading={uploadingCategory === 'BICYCLE'}
        />

        {/* 2. Customer Photos */}
        <PhotoGallerySection
          title="Customer Photos"
          subtitle="Customer photograph at transaction"
          items={attachments.CUSTOMER || []}
          category="CUSTOMER"
          onView={(item) => setActivePhoto(item)}
          onUpload={(files) => handleQuickUpload('CUSTOMER', files)}
          isUploading={uploadingCategory === 'CUSTOMER'}
        />

        {/* 3. ID Photos */}
        <PhotoGallerySection
          title="Customer ID Photos"
          subtitle="Driving licence, passport, national ID"
          items={attachments.ID || []}
          category="ID"
          onView={(item) => setActivePhoto(item)}
          onUpload={(files) => handleQuickUpload('ID', files)}
          isUploading={uploadingCategory === 'ID'}
        />

        {/* 4. Additional Photos / Other Documents */}
        <PhotoGallerySection
          title="Other Document Pictures"
          subtitle="Receipts, invoices, purchase proof"
          items={attachments.ADDITIONAL || []}
          category="ADDITIONAL"
          onView={(item) => setActivePhoto(item)}
          onUpload={(files) => handleQuickUpload('ADDITIONAL', files)}
          isUploading={uploadingCategory === 'ADDITIONAL'}
        />
      </div>

      {/* Lightbox Modal */}
      {activePhoto && (
        <ImageViewerModal
          src={activePhoto.url}
          alt={activePhoto.originalName || 'Photo'}
          onClose={() => setActivePhoto(null)}
        />
      )}
    </MobileLayout>
  );
};

// ── Subcomponent: PhotoGallerySection ──────────────────────────
const PhotoGallerySection = ({
  title,
  subtitle,
  items,
  onView,
  onUpload,
  isUploading,
}) => {
  const fileInputRef = React.useRef(null);

  return (
    <div style={styles.galleryCard}>
      <div style={styles.galleryHeader}>
        <div>
          <h4 style={styles.galleryTitle}>{title}</h4>
          <p style={styles.gallerySubtitle}>{subtitle}</p>
        </div>
        <button
          type="button"
          style={styles.addPhotoBtn}
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          {isUploading ? 'Uploading...' : '＋ Add Photo'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          style={{ display: 'none' }}
          onChange={(e) => {
            if (e.target.files?.length > 0) {
              onUpload(e.target.files);
            }
          }}
        />
      </div>

      {items.length === 0 ? (
        <div style={styles.galleryEmpty}>
          <span>No {title.toLowerCase()} attached yet.</span>
        </div>
      ) : (
        <div style={styles.galleryGrid}>
          {items.map((item, idx) => (
            <div
              key={item._id || idx}
              style={styles.galleryItem}
              onClick={() => onView(item)}
              title="Tap to enlarge"
            >
              <img
                src={item.url}
                alt={item.originalName || `Photo ${idx + 1}`}
                style={styles.galleryThumb}
              />
              <span style={styles.tapLabel}>🔍 Enlarge</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const styles = {
  loadingBox: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '40px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
    color: '#64748b',
  },
  spinner: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    border: '3px solid #e2e8f0',
    borderTopColor: '#1a56db',
    animation: 'spin 0.8s linear infinite',
  },
  errorBox: {
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '16px',
    padding: '24px',
    textAlign: 'center',
    color: '#b91c1c',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
  },
  errorIcon: {
    fontSize: '32px',
  },
  retryBtn: {
    backgroundColor: '#1a56db',
    color: '#ffffff',
    border: 'none',
    borderRadius: '10px',
    padding: '10px 18px',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  bannerCard: {
    backgroundColor: '#ffffff',
    borderRadius: '20px',
    padding: '20px',
    marginBottom: '14px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.02)',
  },
  bannerTop: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '8px',
  },
  shopPill: {
    backgroundColor: '#eff6ff',
    color: '#1a56db',
    fontSize: '11px',
    fontWeight: '700',
    borderRadius: '8px',
    padding: '3px 8px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  statusPill: {
    backgroundColor: '#ecfdf5',
    color: '#16a34a',
    fontSize: '11px',
    fontWeight: '700',
    borderRadius: '8px',
    padding: '3px 8px',
  },
  bannerCustomer: {
    margin: '0 0 4px 0',
    fontSize: '22px',
    fontWeight: '800',
    color: '#0f172a',
  },
  bannerBike: {
    margin: '0 0 8px 0',
    fontSize: '15px',
    fontWeight: '700',
    color: '#1a56db',
  },
  bannerMeta: {
    display: 'flex',
    gap: '8px',
    fontSize: '12px',
    color: '#94a3b8',
    fontWeight: '500',
  },
  actionToolbar: {
    marginBottom: '14px',
  },
  certBtn: {
    width: '100%',
    height: '48px',
    borderRadius: '14px',
    backgroundColor: '#0f172a',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 2px 6px rgba(15, 23, 42, 0.2)',
    touchAction: 'manipulation',
  },
  detailCard: {
    backgroundColor: '#ffffff',
    borderRadius: '18px',
    padding: '18px 16px',
    marginBottom: '14px',
    border: '1px solid #e2e8f0',
  },
  cardHeading: {
    margin: '0 0 12px 0',
    fontSize: '15px',
    fontWeight: '800',
    color: '#0f172a',
    borderBottom: '1px solid #f1f5f9',
    paddingBottom: '8px',
  },
  detailGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '12px',
  },
  detailLabel: {
    fontSize: '13px',
    color: '#64748b',
    fontWeight: '500',
    flexShrink: 0,
  },
  detailValue: {
    fontSize: '13px',
    color: '#0f172a',
    fontWeight: '600',
    textAlign: 'right',
  },
  detailValueBold: {
    fontSize: '14px',
    color: '#1a56db',
    fontWeight: '800',
    textAlign: 'right',
  },
  linkValue: {
    fontSize: '13px',
    color: '#1a56db',
    fontWeight: '600',
    textAlign: 'right',
    textDecoration: 'none',
  },
  priceValue: {
    fontSize: '14px',
    color: '#b45309',
    fontWeight: '800',
    textAlign: 'right',
  },
  frameValue: {
    fontSize: '13px',
    color: '#0f172a',
    fontWeight: '700',
    backgroundColor: '#f1f5f9',
    padding: '2px 6px',
    borderRadius: '6px',
    fontFamily: 'monospace',
  },
  legalStatement: {
    margin: 0,
    fontSize: '13px',
    lineHeight: '1.4',
  },
  photosSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  mainPhotosHeading: {
    margin: '8px 0 2px 4px',
    fontSize: '17px',
    fontWeight: '800',
    color: '#0f172a',
  },
  galleryCard: {
    backgroundColor: '#ffffff',
    borderRadius: '18px',
    padding: '16px',
    border: '1px solid #e2e8f0',
  },
  galleryHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '12px',
  },
  galleryTitle: {
    margin: 0,
    fontSize: '14px',
    fontWeight: '700',
    color: '#0f172a',
  },
  gallerySubtitle: {
    margin: '2px 0 0 0',
    fontSize: '11px',
    color: '#64748b',
  },
  addPhotoBtn: {
    backgroundColor: '#eff6ff',
    color: '#1a56db',
    border: '1px solid #bfdbfe',
    borderRadius: '8px',
    padding: '6px 10px',
    fontSize: '11px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  galleryEmpty: {
    padding: '18px',
    backgroundColor: '#f8fafc',
    borderRadius: '12px',
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: '12px',
    border: '1px dashed #cbd5e1',
  },
  galleryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '10px',
  },
  galleryItem: {
    position: 'relative',
    aspectRatio: '1',
    borderRadius: '12px',
    overflow: 'hidden',
    backgroundColor: '#000',
    cursor: 'pointer',
  },
  galleryThumb: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  tapLabel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    color: '#ffffff',
    fontSize: '9px',
    textAlign: 'center',
    padding: '2px 0',
    fontWeight: '600',
  },
};
