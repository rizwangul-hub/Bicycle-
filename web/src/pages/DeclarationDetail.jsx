import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { declarationService } from '../services/declaration.service';
import AdminLayout from '../components/AdminLayout';

function formatDate(iso) {
  if (!iso) return 'Not provided';
  try {
    return new Date(iso).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return 'Not provided';
  }
}

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function InfoRow({ label, value }) {
  const display = value && String(value).trim().length > 0 ? value : 'Not provided';
  const isDefault = display === 'Not provided';

  return (
    <div style={styles.infoRow}>
      <span style={styles.infoLabel}>{label}</span>
      <span style={{ ...styles.infoValue, color: isDefault ? '#94a3b8' : '#0f172a' }}>
        {display}
      </span>
    </div>
  );
}

export default function DeclarationDetail() {
  const { id } = useParams();
  const { token, user } = useAuth();
  const navigate = useNavigate();

  const [declaration, setDeclaration] = useState(null);
  const [attachmentsData, setAttachmentsData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [editError, setEditError] = useState(null);

  // Delete State
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Image Viewer Modal State
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [imageGalleryList, setImageGalleryList] = useState([]);

  // Downloading State
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);

  // Load declaration and attachments
  const loadData = useCallback(async () => {
    if (!token || !id) return;
    setIsLoading(true);
    setError(null);
    try {
      const [decl, atts] = await Promise.all([
        declarationService.getDeclarationById(token, id),
        declarationService.getAttachments(token, id).catch(() => null),
      ]);
      setDeclaration(decl);
      setAttachmentsData(atts);

      // Populate flat list of images for image lightbox
      if (atts?.all) {
        const imagesOnly = atts.all.filter((a) => a.fileType === 'image' || a.mimeType.startsWith('image/'));
        setImageGalleryList(imagesOnly);
      }
    } catch (err) {
      setError(err.message || 'Failed to load declaration record.');
    } finally {
      setIsLoading(false);
    }
  }, [token, id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Edit initiation
  const startEditing = () => {
    setEditFormData({
      customerName: declaration.customerName || '',
      date: declaration.date ? declaration.date.split('T')[0] : '',
      address: declaration.address || '',
      phone: declaration.phone || '',
      mobile: declaration.mobile || '',
      email: declaration.email || '',
      postcode: declaration.postcode || '',
      cashPurchasePageNo: declaration.cashPurchasePageNo || '',
      bicycleMake: declaration.bicycleMake || '',
      bicycleModel: declaration.bicycleModel || '',
      bicycleColour: declaration.bicycleColour || '',
      frameNumber: declaration.frameNumber || '',
      distinguishingMarkings: declaration.distinguishingMarkings || '',
      bicycleSource: declaration.bicycleSource || '',
      ownershipDuration: declaration.ownershipDuration || '',
      bicycleCost: declaration.bicycleCost || '',
      bicycleFault: declaration.bicycleFault || '',
      legalOwnerConfirmed: declaration.legalOwnerConfirmed || false,
    });
    setEditError(null);
    setIsEditing(true);
  };

  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editFormData.customerName?.trim() || !editFormData.bicycleModel?.trim()) {
      setEditError('Customer Name and Bicycle Model are required.');
      return;
    }

    setIsSaving(true);
    setEditError(null);
    try {
      await declarationService.updateDeclaration(token, id, editFormData);
      setActionSuccess('Declaration updated successfully.');
      setIsEditing(false);
      await loadData();
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err) {
      setEditError(err.message || 'Failed to update declaration.');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Delete
  const handleDeleteDeclaration = async () => {
    setIsDeleting(true);
    try {
      await declarationService.deleteDeclaration(token, id);
      navigate('/admin/declarations', { replace: true });
    } catch (err) {
      setError(err.message || 'Failed to delete declaration.');
      setShowDeleteConfirm(false);
      setIsDeleting(false);
    }
  };

  // Handle Individual Download
  const handleDownloadAttachment = async (att) => {
    setDownloadingId(att._id);
    try {
      await declarationService.downloadAttachment(token, att._id, att.originalFileName);
    } catch (err) {
      alert(`Download failed: ${err.message}`);
    } finally {
      setDownloadingId(null);
    }
  };

  // Handle Download All ZIP
  const handleDownloadAllZip = async () => {
    setIsDownloadingZip(true);
    try {
      await declarationService.downloadAllAttachments(token, id, declaration?.frameNumber);
    } catch (err) {
      alert(`ZIP Download failed: ${err.message}`);
    } finally {
      setIsDownloadingZip(false);
    }
  };

  // Lightbox Viewer Navigation
  const openViewerForImage = (att) => {
    const idx = imageGalleryList.findIndex((item) => item._id === att._id);
    if (idx !== -1) {
      setViewerIndex(idx);
      setViewerOpen(true);
    }
  };

  const nextViewerImage = () => {
    setViewerIndex((prev) => (prev + 1) % imageGalleryList.length);
  };

  const prevViewerImage = () => {
    setViewerIndex((prev) => (prev - 1 + imageGalleryList.length) % imageGalleryList.length);
  };

  const shopName =
    typeof declaration?.shopId === 'object' && declaration?.shopId !== null
      ? declaration.shopId.name
      : 'Bicycle Shop';

  const createdByName =
    typeof declaration?.createdBy === 'object' && declaration?.createdBy !== null
      ? declaration.createdBy.name
      : 'Shop Staff';

  const grouped = attachmentsData?.grouped || {
    BICYCLE: [],
    CUSTOMER: [],
    ID: [],
    ADDITIONAL: [],
  };

  const totalAttachments = attachmentsData?.totalAttachments || 0;

  return (
    <AdminLayout>
      <div style={styles.backNav}>
        <button onClick={() => navigate('/admin/declarations')} style={styles.backBtn}>
          &larr; Back to Declarations Registry
        </button>
      </div>

      {actionSuccess && <div style={styles.successBanner}>✓ {actionSuccess}</div>}

      {isLoading ? (
        <div style={styles.loadingBox}>
          <div style={styles.spinner} />
          <p>Loading declaration details...</p>
        </div>
      ) : error || !declaration ? (
        <div style={styles.errorBox}>
          <h3>Declaration Not Found</h3>
          <p>{error || 'The requested declaration does not exist or access was denied.'}</p>
          <Link to="/admin/declarations" style={styles.returnBtn}>
            Return to Registry
          </Link>
        </div>
      ) : (
        <div style={styles.contentWrap}>
          {/* ── Top Header Banner ────────────────────────── */}
          <div style={styles.bannerCard}>
            <div style={styles.bannerTop}>
              <div>
                <span style={styles.refTag}>Ref: #{declaration._id.slice(-6).toUpperCase()}</span>
                <h2 style={styles.customerHeader}>{declaration.customerName}</h2>
                <span style={styles.dateMeta}>
                  Submitted on {formatDate(declaration.date || declaration.createdAt)}
                </span>
              </div>
              <div style={styles.topActions}>
                <span style={styles.shopBadge}>{shopName}</span>
                <button onClick={startEditing} style={styles.editBtn}>
                  ✏️ Edit Declaration
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  style={styles.deleteBtn}
                >
                  🗑️ Delete
                </button>
              </div>
            </div>

            <div style={styles.legalStatusRow}>
              <span
                style={
                  declaration.legalOwnerConfirmed
                    ? styles.confirmedBadge
                    : styles.unconfirmedBadge
                }
              >
                {declaration.legalOwnerConfirmed
                  ? '✓ Legal Owner Confirmed'
                  : '✗ Legal Owner Not Confirmed'}
              </span>
              <span style={styles.recordIdText}>Record ID: {declaration._id}</span>
            </div>
          </div>

          {/* ── Two Columns: Customer & Bicycle Info ──────── */}
          <div style={styles.gridTwoCol}>
            {/* Customer Details */}
            <div style={styles.sectionCard}>
              <h3 style={styles.sectionTitle}>Customer Information</h3>
              <div style={styles.infoList}>
                <InfoRow label="Full Name" value={declaration.customerName} />
                <InfoRow label="Declaration Date" value={formatDate(declaration.date)} />
                <InfoRow label="Address" value={declaration.address} />
                <InfoRow label="Postcode" value={declaration.postcode} />
                <InfoRow label="Phone" value={declaration.phone} />
                <InfoRow label="Mobile" value={declaration.mobile} />
                <InfoRow label="Email" value={declaration.email} />
                <InfoRow label="Cash Purchase Page #" value={declaration.cashPurchasePageNo} />
                <InfoRow label="Customer Signature" value={declaration.signature} />
                <InfoRow label="Seller / Staff Signature" value={declaration.sellerSignature} />
              </div>
            </div>

            {/* Bicycle Details */}
            <div style={styles.sectionCard}>
              <h3 style={styles.sectionTitle}>Bicycle Information</h3>
              <div style={styles.infoList}>
                <InfoRow label="Make" value={declaration.bicycleMake} />
                <InfoRow label="Model" value={declaration.bicycleModel} />
                <InfoRow label="Colour" value={declaration.bicycleColour} />
                <InfoRow label="Frame Number" value={declaration.frameNumber} />
                <InfoRow label="Distinguishing Marks" value={declaration.distinguishingMarkings} />
                <InfoRow label="Where did you get bike?" value={declaration.bicycleSource} />
                <InfoRow label="How long have you had it?" value={declaration.ownershipDuration} />
                <InfoRow
                  label="Purchase Cost"
                  value={declaration.bicycleCost ? `£${declaration.bicycleCost}` : null}
                />
                <InfoRow label="Known Faults / Condition" value={declaration.bicycleFault} />
              </div>
            </div>
          </div>

          {/* ── Legal & Shop Context ──────────────────────── */}
          <div style={styles.gridTwoCol}>
            {/* Legal Owner Card */}
            <div style={styles.sectionCard}>
              <h3 style={styles.sectionTitle}>Legal Owner Declaration</h3>
              <div style={styles.infoList}>
                <InfoRow
                  label="Legal Owner Confirmed"
                  value={declaration.legalOwnerConfirmed ? 'Yes — Confirmed by customer' : 'No'}
                />
                <div style={styles.legalBox}>
                  <p style={styles.legalDisclaimer}>
                    "I hereby declare that I am the legal and rightful owner of the bicycle described above,
                    and I have full authority to sell or transfer ownership."
                  </p>
                </div>
              </div>
            </div>

            {/* Shop & Origin Card */}
            <div style={styles.sectionCard}>
              <h3 style={styles.sectionTitle}>Shop & Submission Audit</h3>
              <div style={styles.infoList}>
                <InfoRow label="Branch Location" value={shopName} />
                <InfoRow label="Recorded By" value={createdByName} />
                <InfoRow label="Creation Timestamp" value={formatDate(declaration.createdAt)} />
                <InfoRow label="Last Updated" value={formatDate(declaration.updatedAt)} />
              </div>
            </div>
          </div>

          {/* ── Phase 10: Attachments, Images & Downloads ──── */}
          <div style={styles.attachmentsSection}>
            <div style={styles.attachmentsHeader}>
              <div>
                <h3 style={styles.attachmentsTitle}>
                  Attachments & Evidence ({totalAttachments})
                </h3>
                <p style={styles.attachmentsSubtitle}>
                  View, inspect, and download evidentiary photos and documents for this declaration.
                </p>
              </div>

              {totalAttachments > 0 && (
                <button
                  onClick={handleDownloadAllZip}
                  disabled={isDownloadingZip}
                  style={styles.downloadAllBtn}
                >
                  {isDownloadingZip ? '📦 Generating ZIP...' : '📦 Download All (ZIP)'}
                </button>
              )}
            </div>

            {/* 4 Categorized Attachment Groups */}
            <div style={styles.categoryGrid}>
              {/* Category 1: BICYCLE */}
              <AttachmentCategoryCard
                title="🚲 Bicycle Photos"
                categoryKey="BICYCLE"
                attachments={grouped.BICYCLE}
                onViewImage={openViewerForImage}
                onDownload={handleDownloadAttachment}
                downloadingId={downloadingId}
              />

              {/* Category 2: CUSTOMER */}
              <AttachmentCategoryCard
                title="👤 Customer Photos"
                categoryKey="CUSTOMER"
                attachments={grouped.CUSTOMER}
                onViewImage={openViewerForImage}
                onDownload={handleDownloadAttachment}
                downloadingId={downloadingId}
              />

              {/* Category 3: ID */}
              <AttachmentCategoryCard
                title="🪪 ID / Documents"
                categoryKey="ID"
                attachments={grouped.ID}
                onViewImage={openViewerForImage}
                onDownload={handleDownloadAttachment}
                downloadingId={downloadingId}
              />

              {/* Category 4: ADDITIONAL */}
              <AttachmentCategoryCard
                title="📄 Additional Documents"
                categoryKey="ADDITIONAL"
                attachments={grouped.ADDITIONAL}
                onViewImage={openViewerForImage}
                onDownload={handleDownloadAttachment}
                downloadingId={downloadingId}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Lightbox Image Viewer Modal ───────────────────── */}
      {viewerOpen && imageGalleryList.length > 0 && (
        <div style={styles.lightboxOverlay} onClick={() => setViewerOpen(false)}>
          <div style={styles.lightboxContent} onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setViewerOpen(false)}
              style={styles.lightboxCloseBtn}
              title="Close image viewer"
            >
              ✕
            </button>

            <div style={styles.lightboxImageWrap}>
              <img
                src={imageGalleryList[viewerIndex]?.storageUrl}
                alt={imageGalleryList[viewerIndex]?.originalFileName || 'Attachment'}
                style={styles.lightboxImage}
              />
            </div>

            <div style={styles.lightboxFooter}>
              <div style={styles.lightboxMeta}>
                <strong>{imageGalleryList[viewerIndex]?.originalFileName}</strong>
                <span>
                  Category: {imageGalleryList[viewerIndex]?.category} &bull;{' '}
                  {formatBytes(imageGalleryList[viewerIndex]?.fileSize)} &bull;{' '}
                  {formatDate(imageGalleryList[viewerIndex]?.createdAt)}
                </span>
              </div>

              <div style={styles.lightboxNav}>
                {imageGalleryList.length > 1 && (
                  <>
                    <button onClick={prevViewerImage} style={styles.lightboxNavBtn}>
                      &larr; Prev
                    </button>
                    <span style={styles.lightboxCounter}>
                      {viewerIndex + 1} / {imageGalleryList.length}
                    </span>
                    <button onClick={nextViewerImage} style={styles.lightboxNavBtn}>
                      Next &rarr;
                    </button>
                  </>
                )}
                <button
                  onClick={() => handleDownloadAttachment(imageGalleryList[viewerIndex])}
                  style={styles.lightboxDownloadBtn}
                >
                  Download
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Declaration Modal ────────────────────────── */}
      {isEditing && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalBox}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Edit Bicycle Declaration</h3>
              <button onClick={() => setIsEditing(false)} style={styles.modalCloseBtn}>
                ✕
              </button>
            </div>

            {editError && <div style={styles.modalError}>⚠️ {editError}</div>}

            <form onSubmit={handleSaveEdit} style={styles.modalForm}>
              <h4 style={styles.formSectionTitle}>Customer Details</h4>
              <div style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Customer Name *</label>
                  <input
                    type="text"
                    name="customerName"
                    value={editFormData.customerName}
                    onChange={handleEditChange}
                    required
                    style={styles.formInput}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Date</label>
                  <input
                    type="date"
                    name="date"
                    value={editFormData.date}
                    onChange={handleEditChange}
                    style={styles.formInput}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Phone</label>
                  <input
                    type="text"
                    name="phone"
                    value={editFormData.phone}
                    onChange={handleEditChange}
                    style={styles.formInput}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Mobile</label>
                  <input
                    type="text"
                    name="mobile"
                    value={editFormData.mobile}
                    onChange={handleEditChange}
                    style={styles.formInput}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={editFormData.email}
                    onChange={handleEditChange}
                    style={styles.formInput}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Postcode</label>
                  <input
                    type="text"
                    name="postcode"
                    value={editFormData.postcode}
                    onChange={handleEditChange}
                    style={styles.formInput}
                  />
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Address</label>
                <input
                  type="text"
                  name="address"
                  value={editFormData.address}
                  onChange={handleEditChange}
                  style={styles.formInput}
                />
              </div>

              <h4 style={styles.formSectionTitle}>Bicycle Details</h4>
              <div style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Bicycle Model *</label>
                  <input
                    type="text"
                    name="bicycleModel"
                    value={editFormData.bicycleModel}
                    onChange={handleEditChange}
                    required
                    style={styles.formInput}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Bicycle Make</label>
                  <input
                    type="text"
                    name="bicycleMake"
                    value={editFormData.bicycleMake}
                    onChange={handleEditChange}
                    style={styles.formInput}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Colour</label>
                  <input
                    type="text"
                    name="bicycleColour"
                    value={editFormData.bicycleColour}
                    onChange={handleEditChange}
                    style={styles.formInput}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Frame Number</label>
                  <input
                    type="text"
                    name="frameNumber"
                    value={editFormData.frameNumber}
                    onChange={handleEditChange}
                    style={styles.formInput}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Cost (£)</label>
                  <input
                    type="text"
                    name="bicycleCost"
                    value={editFormData.bicycleCost}
                    onChange={handleEditChange}
                    style={styles.formInput}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>How long owned?</label>
                  <input
                    type="text"
                    name="ownershipDuration"
                    value={editFormData.ownershipDuration}
                    onChange={handleEditChange}
                    style={styles.formInput}
                  />
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Where did you get the bicycle?</label>
                <input
                  type="text"
                  name="bicycleSource"
                  value={editFormData.bicycleSource}
                  onChange={handleEditChange}
                  style={styles.formInput}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Distinguishing Markings</label>
                <input
                  type="text"
                  name="distinguishingMarkings"
                  value={editFormData.distinguishingMarkings}
                  onChange={handleEditChange}
                  style={styles.formInput}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Known Faults</label>
                <input
                  type="text"
                  name="bicycleFault"
                  value={editFormData.bicycleFault}
                  onChange={handleEditChange}
                  style={styles.formInput}
                />
              </div>

              <div style={styles.checkboxRow}>
                <input
                  type="checkbox"
                  id="legalConfirm"
                  name="legalOwnerConfirmed"
                  checked={editFormData.legalOwnerConfirmed}
                  onChange={handleEditChange}
                  style={styles.checkbox}
                />
                <label htmlFor="legalConfirm" style={styles.checkboxLabel}>
                  Confirm legal owner declaration verified
                </label>
              </div>

              <div style={styles.modalActions}>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  style={styles.modalCancelBtn}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  style={styles.modalSaveBtn}
                >
                  {isSaving ? 'Saving Changes...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Dialog ────────────────────── */}
      {showDeleteConfirm && (
        <div style={styles.modalOverlay}>
          <div style={styles.confirmBox}>
            <h3 style={styles.confirmTitle}>Delete Declaration</h3>
            <p style={styles.confirmText}>
              Are you sure you want to delete this declaration?
            </p>
            <p style={styles.confirmSubtext}>
              This will permanently delete this declaration and all associated image/document evidence.
              This action cannot be undone.
            </p>
            <div style={styles.confirmActions}>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                style={styles.cancelBtn}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteDeclaration}
                disabled={isDeleting}
                style={styles.confirmDeleteBtn}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

/**
 * Reusable Attachment Group Card Component
 */
function AttachmentCategoryCard({
  title,
  categoryKey,
  attachments = [],
  onViewImage,
  onDownload,
  downloadingId,
}) {
  return (
    <div style={styles.catCard}>
      <div style={styles.catHeader}>
        <h4 style={styles.catTitle}>{title}</h4>
        <span style={styles.catCount}>{attachments.length} files</span>
      </div>

      {attachments.length === 0 ? (
        <div style={styles.catEmpty}>No attachments</div>
      ) : (
        <div style={styles.catFilesList}>
          {attachments.map((att) => {
            const isImg = att.fileType === 'image' || att.mimeType.startsWith('image/');
            const isDownloading = downloadingId === att._id;

            return (
              <div key={att._id} style={styles.fileItem}>
                {isImg ? (
                  <div
                    style={styles.thumbWrapper}
                    onClick={() => onViewImage(att)}
                    title="Click to view image"
                  >
                    <img
                      src={att.storageUrl}
                      alt={att.originalFileName}
                      style={styles.thumbImage}
                    />
                    <div style={styles.thumbOverlay}>🔍 View</div>
                  </div>
                ) : (
                  <div style={styles.docWrapper}>
                    <span style={styles.docIcon}>📄</span>
                    <span style={styles.docType}>PDF / Doc</span>
                  </div>
                )}

                <div style={styles.fileDetails}>
                  <span style={styles.fileName} title={att.originalFileName}>
                    {att.originalFileName}
                  </span>
                  <span style={styles.fileMeta}>
                    {formatBytes(att.fileSize)} &bull; {formatDate(att.createdAt)}
                  </span>
                </div>

                <button
                  onClick={() => onDownload(att)}
                  disabled={isDownloading}
                  style={styles.downloadFileBtn}
                  title="Download attachment"
                >
                  {isDownloading ? '...' : 'Download'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const styles = {
  backNav: {
    marginBottom: '16px',
  },
  backBtn: {
    background: 'none',
    border: 'none',
    color: '#2563eb',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    padding: 0,
  },
  successBanner: {
    backgroundColor: '#dcfce7',
    color: '#166534',
    padding: '12px 16px',
    borderRadius: '8px',
    marginBottom: '16px',
    fontWeight: '600',
    fontSize: '14px',
  },
  contentWrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  bannerCard: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    padding: '24px',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.04)',
  },
  bannerTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '16px',
    marginBottom: '16px',
    flexWrap: 'wrap',
  },
  refTag: {
    fontFamily: 'monospace',
    fontWeight: '700',
    fontSize: '12px',
    color: '#475569',
    backgroundColor: '#f1f5f9',
    padding: '2px 6px',
    borderRadius: '4px',
  },
  customerHeader: {
    margin: '6px 0 2px 0',
    fontSize: '26px',
    fontWeight: '800',
    color: '#0f172a',
  },
  dateMeta: {
    fontSize: '13px',
    color: '#64748b',
  },
  topActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap',
  },
  shopBadge: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#1d4ed8',
    backgroundColor: '#eff6ff',
    padding: '6px 12px',
    borderRadius: '6px',
  },
  editBtn: {
    backgroundColor: '#ffffff',
    border: '1px solid #cbd5e1',
    borderRadius: '6px',
    padding: '6px 14px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#0f172a',
    cursor: 'pointer',
  },
  deleteBtn: {
    backgroundColor: '#fee2e2',
    border: '1px solid #fecaca',
    borderRadius: '6px',
    padding: '6px 14px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#dc2626',
    cursor: 'pointer',
  },
  legalStatusRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '16px',
    borderTop: '1px solid #f1f5f9',
    flexWrap: 'wrap',
    gap: '8px',
  },
  confirmedBadge: {
    fontSize: '12px',
    fontWeight: '700',
    color: '#166534',
    backgroundColor: '#dcfce7',
    padding: '4px 10px',
    borderRadius: '12px',
  },
  unconfirmedBadge: {
    fontSize: '12px',
    fontWeight: '700',
    color: '#991b1b',
    backgroundColor: '#fee2e2',
    padding: '4px 10px',
    borderRadius: '12px',
  },
  recordIdText: {
    fontSize: '12px',
    fontFamily: 'monospace',
    color: '#94a3b8',
  },
  gridTwoCol: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
    gap: '24px',
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    padding: '24px',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.04)',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 0,
    marginBottom: '16px',
    paddingBottom: '10px',
    borderBottom: '1px solid #f1f5f9',
  },
  infoList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    fontSize: '14px',
    gap: '16px',
  },
  infoLabel: {
    color: '#64748b',
    fontWeight: '500',
    minWidth: '150px',
  },
  infoValue: {
    fontWeight: '600',
    textAlign: 'right',
    wordBreak: 'break-word',
  },
  legalBox: {
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '14px',
    marginTop: '12px',
  },
  legalDisclaimer: {
    fontSize: '13px',
    color: '#334155',
    fontStyle: 'italic',
    margin: 0,
    lineHeight: 1.5,
  },
  attachmentsSection: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    padding: '24px',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.04)',
  },
  attachmentsHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '20px',
    flexWrap: 'wrap',
    gap: '12px',
  },
  attachmentsTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#0f172a',
    margin: '0 0 4px 0',
  },
  attachmentsSubtitle: {
    fontSize: '14px',
    color: '#64748b',
    margin: 0,
  },
  downloadAllBtn: {
    backgroundColor: '#2563eb',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    padding: '8px 16px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: '0 1px 2px 0 rgba(37, 99, 235, 0.2)',
  },
  categoryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '16px',
  },
  catCard: {
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    minHeight: '160px',
  },
  catHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
    paddingBottom: '8px',
    borderBottom: '1px solid #e2e8f0',
  },
  catTitle: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#1e293b',
    margin: 0,
  },
  catCount: {
    fontSize: '12px',
    color: '#64748b',
    fontWeight: '600',
  },
  catEmpty: {
    fontSize: '13px',
    color: '#94a3b8',
    fontStyle: 'italic',
    padding: '24px 0',
    textAlign: 'center',
  },
  catFilesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  fileItem: {
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    padding: '10px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  thumbWrapper: {
    width: '56px',
    height: '56px',
    borderRadius: '4px',
    overflow: 'hidden',
    position: 'relative',
    cursor: 'pointer',
    flexShrink: 0,
    backgroundColor: '#e2e8f0',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  thumbOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    color: '#ffffff',
    fontSize: '10px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0,
    transition: 'opacity 0.2s',
  },
  docWrapper: {
    width: '56px',
    height: '56px',
    borderRadius: '4px',
    backgroundColor: '#f1f5f9',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  docIcon: {
    fontSize: '20px',
  },
  docType: {
    fontSize: '9px',
    color: '#64748b',
    fontWeight: '700',
    marginTop: '2px',
  },
  fileDetails: {
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    flex: 1,
  },
  fileName: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#0f172a',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  fileMeta: {
    fontSize: '11px',
    color: '#64748b',
    marginTop: '2px',
  },
  downloadFileBtn: {
    backgroundColor: '#f1f5f9',
    border: '1px solid #cbd5e1',
    borderRadius: '4px',
    padding: '4px 8px',
    fontSize: '12px',
    fontWeight: '600',
    color: '#2563eb',
    cursor: 'pointer',
    flexShrink: 0,
  },
  lightboxOverlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
  },
  lightboxContent: {
    backgroundColor: '#0f172a',
    borderRadius: '12px',
    maxWidth: '900px',
    width: '100%',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    overflow: 'hidden',
  },
  lightboxCloseBtn: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    background: 'rgba(255, 255, 255, 0.2)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '50%',
    width: '32px',
    height: '32px',
    cursor: 'pointer',
    fontSize: '16px',
    zIndex: 10,
  },
  lightboxImageWrap: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    maxHeight: '65vh',
    overflow: 'hidden',
    backgroundColor: '#000000',
  },
  lightboxImage: {
    maxWidth: '100%',
    maxHeight: '60vh',
    objectFit: 'contain',
    borderRadius: '4px',
  },
  lightboxFooter: {
    padding: '16px 24px',
    backgroundColor: '#1e293b',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px',
  },
  lightboxMeta: {
    display: 'flex',
    flexDirection: 'column',
    color: '#f8fafc',
    fontSize: '13px',
    gap: '2px',
  },
  lightboxNav: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  lightboxNavBtn: {
    backgroundColor: '#334155',
    color: '#ffffff',
    border: 'none',
    borderRadius: '4px',
    padding: '6px 12px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  lightboxCounter: {
    color: '#94a3b8',
    fontSize: '12px',
    fontWeight: '600',
    padding: '0 6px',
  },
  lightboxDownloadBtn: {
    backgroundColor: '#2563eb',
    color: '#ffffff',
    border: 'none',
    borderRadius: '4px',
    padding: '6px 14px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    zIndex: 999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
  },
  modalBox: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    maxWidth: '750px',
    width: '100%',
    maxHeight: '90vh',
    overflowY: 'auto',
    padding: '24px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    paddingBottom: '12px',
    borderBottom: '1px solid #e2e8f0',
  },
  modalTitle: {
    fontSize: '20px',
    fontWeight: '800',
    color: '#0f172a',
    margin: 0,
  },
  modalCloseBtn: {
    background: 'none',
    border: 'none',
    fontSize: '18px',
    color: '#64748b',
    cursor: 'pointer',
  },
  modalError: {
    backgroundColor: '#fee2e2',
    color: '#b91c1c',
    padding: '10px 14px',
    borderRadius: '6px',
    fontSize: '13px',
    marginBottom: '16px',
  },
  modalForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  formSectionTitle: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    margin: '12px 0 4px 0',
    borderBottom: '1px dashed #e2e8f0',
    paddingBottom: '4px',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '12px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  formLabel: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#475569',
  },
  formInput: {
    height: '38px',
    border: '1px solid #cbd5e1',
    borderRadius: '6px',
    padding: '0 10px',
    fontSize: '13px',
    color: '#0f172a',
    outline: 'none',
    backgroundColor: '#f8fafc',
  },
  checkboxRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    margin: '8px 0',
  },
  checkbox: {
    width: '16px',
    height: '16px',
    cursor: 'pointer',
  },
  checkboxLabel: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#1e293b',
    cursor: 'pointer',
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '16px',
    paddingTop: '16px',
    borderTop: '1px solid #e2e8f0',
  },
  modalCancelBtn: {
    backgroundColor: '#f1f5f9',
    border: '1px solid #cbd5e1',
    borderRadius: '6px',
    padding: '8px 16px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#475569',
    cursor: 'pointer',
  },
  modalSaveBtn: {
    backgroundColor: '#2563eb',
    border: 'none',
    borderRadius: '6px',
    padding: '8px 20px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#ffffff',
    cursor: 'pointer',
  },
  confirmBox: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    maxWidth: '440px',
    width: '100%',
    padding: '24px',
    textAlign: 'center',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  },
  confirmTitle: {
    fontSize: '18px',
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 0,
    marginBottom: '8px',
  },
  confirmText: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1e293b',
    margin: '0 0 6px 0',
  },
  confirmSubtext: {
    fontSize: '12px',
    color: '#64748b',
    margin: '0 0 20px 0',
    lineHeight: 1.4,
  },
  confirmActions: {
    display: 'flex',
    justifyContent: 'center',
    gap: '12px',
  },
  cancelBtn: {
    backgroundColor: '#f1f5f9',
    border: '1px solid #cbd5e1',
    borderRadius: '6px',
    padding: '8px 18px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#475569',
    cursor: 'pointer',
  },
  confirmDeleteBtn: {
    backgroundColor: '#dc2626',
    border: 'none',
    borderRadius: '6px',
    padding: '8px 20px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#ffffff',
    cursor: 'pointer',
  },
  loadingBox: {
    padding: '60px 20px',
    textAlign: 'center',
    color: '#64748b',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
  },
  spinner: {
    width: '32px',
    height: '32px',
    border: '3px solid #e2e8f0',
    borderTopColor: '#2563eb',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  errorBox: {
    padding: '40px 20px',
    textAlign: 'center',
    color: '#dc2626',
  },
  returnBtn: {
    marginTop: '12px',
    display: 'inline-block',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    borderRadius: '6px',
    padding: '8px 16px',
    fontWeight: '600',
    textDecoration: 'none',
  },
};
