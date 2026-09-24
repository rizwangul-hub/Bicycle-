import React from 'react';

export const ImageViewerModal = ({ src, alt = 'Photo preview', onClose }) => {
  if (!src) return null;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.topBar}>
        <span style={styles.filename} numberOfLines={1}>{alt}</span>
        <button
          type="button"
          style={styles.closeBtn}
          onClick={onClose}
          aria-label="Close photo viewer"
        >
          ✕
        </button>
      </div>
      <div style={styles.content} onClick={(e) => e.stopPropagation()}>
        <img src={src} alt={alt} style={styles.image} />
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.92)',
    zIndex: 9999,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 'env(safe-area-inset-top, 16px) 16px env(safe-area-inset-bottom, 16px)',
    backdropFilter: 'blur(8px)',
  },
  topBar: {
    position: 'absolute',
    top: 'calc(env(safe-area-inset-top, 0px) + 12px)',
    left: 0,
    right: 0,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 20px',
    zIndex: 10000,
  },
  filename: {
    color: '#f8fafc',
    fontSize: '14px',
    fontWeight: '600',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: '75%',
  },
  closeBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    border: 'none',
    color: '#ffffff',
    fontSize: '20px',
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: 1,
  },
  content: {
    maxWidth: '96vw',
    maxHeight: '85vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    maxWidth: '100%',
    maxHeight: '85vh',
    objectFit: 'contain',
    borderRadius: '12px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
  },
};
