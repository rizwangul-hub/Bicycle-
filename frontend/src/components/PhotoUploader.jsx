import React, { useRef, useState } from 'react';
import { ImageViewerModal } from './ImageViewerModal';

export const PhotoUploader = ({
  title,
  subtitle,
  takeBtnText = 'Take Photo',
  chooseBtnText = 'Choose Gallery',
  required = false,
  single = false,
  files = [],
  onChange,
  cameraFacing = 'environment',
}) => {
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  const [activePreview, setActivePreview] = useState(null);

  const handleFiles = (selectedFileList) => {
    if (!selectedFileList || selectedFileList.length === 0) return;

    const newEntries = Array.from(selectedFileList).map((file) => ({
      file,
      name: file.name,
      previewUrl: URL.createObjectURL(file),
    }));

    if (single) {
      // Release old preview URL if needed
      if (files[0]?.previewUrl) {
        URL.revokeObjectURL(files[0].previewUrl);
      }
      onChange([newEntries[0]]);
    } else {
      onChange([...files, ...newEntries]);
    }
  };

  const handleRemove = (index) => {
    const toRemove = files[index];
    if (toRemove?.previewUrl) {
      URL.revokeObjectURL(toRemove.previewUrl);
    }
    const updated = files.filter((_, idx) => idx !== index);
    onChange(updated);
  };

  const triggerCamera = () => {
    if (cameraInputRef.current) {
      cameraInputRef.current.value = '';
      cameraInputRef.current.click();
    }
  };

  const triggerGallery = () => {
    if (galleryInputRef.current) {
      galleryInputRef.current.value = '';
      galleryInputRef.current.click();
    }
  };

  return (
    <div style={styles.container}>
      {/* Hidden native HTML5 file inputs for Safari camera and gallery */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture={cameraFacing}
        style={{ display: 'none' }}
        onChange={(e) => handleFiles(e.target.files)}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        multiple={!single}
        style={{ display: 'none' }}
        onChange={(e) => handleFiles(e.target.files)}
      />

      {/* Header */}
      <div style={styles.header}>
        <div style={styles.titleRow}>
          <span style={styles.title}>{title}</span>
          {required && <span style={styles.requiredStar}>*</span>}
        </div>
        {subtitle && <p style={styles.subtitle}>{subtitle}</p>}
      </div>

      {/* Previews */}
      {single && files.length > 0 ? (
        <div style={styles.singlePreviewBox}>
          <div
            style={styles.thumbnailWrapper}
            onClick={() => setActivePreview(files[0])}
            title="Tap to enlarge"
          >
            <img
              src={files[0].previewUrl}
              alt={files[0].name}
              style={styles.singleThumb}
            />
            <span style={styles.tapToView}>🔍 Tap to enlarge</span>
          </div>

          <div style={styles.singleDetails}>
            <p style={styles.fileName}>{files[0].name}</p>
            <span style={styles.attachedPill}>✓ Photo Attached</span>

            <div style={styles.actionRow}>
              <button
                type="button"
                style={styles.retakeBtn}
                onClick={triggerCamera}
              >
                📷 Retake
              </button>
              <button
                type="button"
                style={styles.retakeBtn}
                onClick={triggerGallery}
              >
                🖼️ Change
              </button>
              <button
                type="button"
                style={styles.removeBtn}
                onClick={() => handleRemove(0)}
              >
                🗑 Remove
              </button>
            </div>
          </div>
        </div>
      ) : !single && files.length > 0 ? (
        <div style={styles.multiThumbList}>
          {files.map((item, idx) => (
            <div key={idx} style={styles.multiCard}>
              <div
                style={styles.multiThumbWrapper}
                onClick={() => setActivePreview(item)}
              >
                <img
                  src={item.previewUrl}
                  alt={item.name}
                  style={styles.multiThumb}
                />
              </div>
              <button
                type="button"
                style={styles.deleteThumbBtn}
                onClick={() => handleRemove(idx)}
                aria-label="Remove photo"
              >
                ✕
              </button>
              <span style={styles.multiName}>{item.name}</span>
            </div>
          ))}
        </div>
      ) : null}

      {/* Buttons (Show if empty, or if multiple upload allows adding more) */}
      {(files.length === 0 || !single) && (
        <div style={styles.buttonRow}>
          <button
            type="button"
            style={styles.cameraBtn}
            onClick={triggerCamera}
          >
            <span style={styles.btnIcon}>📷</span>
            <span>{files.length > 0 ? `Take Another` : takeBtnText}</span>
          </button>
          <button
            type="button"
            style={styles.galleryBtn}
            onClick={triggerGallery}
          >
            <span style={styles.btnIcon}>🖼️</span>
            <span>{chooseBtnText}</span>
          </button>
        </div>
      )}

      {/* Full-Screen Mobile Lightbox Viewer */}
      {activePreview && (
        <ImageViewerModal
          src={activePreview.previewUrl}
          alt={activePreview.name}
          onClose={() => setActivePreview(null)}
        />
      )}
    </div>
  );
};

const styles = {
  container: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '16px',
    border: '1px solid #e2e8f0',
    marginBottom: '16px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.02)',
  },
  header: {
    marginBottom: '12px',
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  title: {
    fontSize: '15px',
    fontWeight: '700',
    color: '#0f172a',
  },
  requiredStar: {
    color: '#dc2626',
    fontWeight: '700',
    fontSize: '16px',
  },
  subtitle: {
    margin: '4px 0 0 0',
    fontSize: '12px',
    color: '#64748b',
    lineHeight: '1.4',
  },
  buttonRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px',
    marginTop: '10px',
  },
  cameraBtn: {
    backgroundColor: '#1a56db',
    color: '#ffffff',
    border: 'none',
    borderRadius: '12px',
    padding: '14px 10px',
    fontSize: '14px',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    cursor: 'pointer',
    touchAction: 'manipulation',
    boxShadow: '0 2px 6px rgba(26, 86, 219, 0.25)',
  },
  galleryBtn: {
    backgroundColor: '#334155',
    color: '#ffffff',
    border: 'none',
    borderRadius: '12px',
    padding: '14px 10px',
    fontSize: '14px',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    cursor: 'pointer',
    touchAction: 'manipulation',
  },
  btnIcon: {
    fontSize: '16px',
  },
  singlePreviewBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    backgroundColor: '#f8fafc',
    borderRadius: '14px',
    padding: '12px',
    border: '1px solid #e2e8f0',
    marginBottom: '12px',
  },
  thumbnailWrapper: {
    position: 'relative',
    width: '84px',
    height: '84px',
    borderRadius: '10px',
    overflow: 'hidden',
    flexShrink: 0,
    cursor: 'pointer',
    backgroundColor: '#000',
  },
  singleThumb: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  tapToView: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    color: '#fff',
    fontSize: '8px',
    textAlign: 'center',
    padding: '2px 0',
  },
  singleDetails: {
    flex: 1,
    minWidth: 0,
  },
  fileName: {
    margin: '0 0 4px 0',
    fontSize: '13px',
    fontWeight: '600',
    color: '#1e293b',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  attachedPill: {
    display: 'inline-block',
    backgroundColor: '#dcfce7',
    color: '#15803d',
    fontSize: '11px',
    fontWeight: '700',
    borderRadius: '6px',
    padding: '2px 8px',
    marginBottom: '8px',
  },
  actionRow: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap',
  },
  retakeBtn: {
    backgroundColor: '#ffffff',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    padding: '6px 10px',
    fontSize: '12px',
    fontWeight: '600',
    color: '#334155',
    cursor: 'pointer',
  },
  removeBtn: {
    backgroundColor: '#fee2e2',
    border: '1px solid #fecaca',
    borderRadius: '8px',
    padding: '6px 10px',
    fontSize: '12px',
    fontWeight: '600',
    color: '#b91c1c',
    cursor: 'pointer',
  },
  multiThumbList: {
    display: 'flex',
    gap: '10px',
    overflowX: 'auto',
    paddingBottom: '8px',
    marginBottom: '10px',
    WebkitOverflowScrolling: 'touch',
  },
  multiCard: {
    position: 'relative',
    flexShrink: 0,
    width: '80px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  multiThumbWrapper: {
    width: '76px',
    height: '76px',
    borderRadius: '10px',
    overflow: 'hidden',
    backgroundColor: '#000',
    cursor: 'pointer',
  },
  multiThumb: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  deleteThumbBtn: {
    position: 'absolute',
    top: '-6px',
    right: '-2px',
    width: '22px',
    height: '22px',
    borderRadius: '50%',
    backgroundColor: '#ef4444',
    color: '#ffffff',
    border: '2px solid #ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '11px',
    fontWeight: 'bold',
    cursor: 'pointer',
    padding: 0,
    lineHeight: 1,
  },
  multiName: {
    fontSize: '10px',
    color: '#64748b',
    textAlign: 'center',
    marginTop: '4px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    width: '100%',
  },
};
