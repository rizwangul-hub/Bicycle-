import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MobileLayout } from '../../components/MobileLayout';
import { adminService } from '../../services/admin.service';

export const AdminShops = () => {
  const navigate = useNavigate();
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchShops = async () => {
      try {
        const data = await adminService.getShops();
        setShops(data);
      } catch (err) {
        setError(err.message || 'Failed to fetch shops.');
      } finally {
        setLoading(false);
      }
    };
    fetchShops();
  }, []);

  return (
    <MobileLayout title="Authorized Shops Network" showBack>
      <div style={styles.introCard}>
        <p style={styles.introText}>
          The 6 authorized PixxTechnologiees bicycle shops across London. Tap any shop to view its declarations.
        </p>
      </div>

      {loading ? (
        <div style={styles.loadingBox}>
          <div style={styles.spinner} />
          <span>Loading shop locations...</span>
        </div>
      ) : error ? (
        <div style={styles.errorBox}>
          <span>⚠️ {error}</span>
        </div>
      ) : (
        <div style={styles.shopsList}>
          {shops.map((shop) => (
            <div key={shop._id} style={styles.shopCard}>
              <div style={styles.cardHeader}>
                <div style={styles.nameGroup}>
                  <span style={styles.codeTag}>{shop.code}</span>
                  <h3 style={styles.shopName}>{shop.name}</h3>
                </div>
                <span
                  style={{
                    ...styles.statusTag,
                    backgroundColor: shop.isActive ? '#ecfdf5' : '#fef2f2',
                    color: shop.isActive ? '#16a34a' : '#b91c1c',
                  }}
                >
                  {shop.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              {/* Shop Metadata */}
              <div style={styles.infoGrid}>
                {shop.address && (
                  <div style={styles.infoRow}>
                    <span style={styles.infoIcon}>📍</span>
                    <span style={styles.infoText}>{shop.address}</span>
                  </div>
                )}
                {shop.phone && (
                  <div style={styles.infoRow}>
                    <span style={styles.infoIcon}>📞</span>
                    <a href={`tel:${shop.phone}`} style={styles.phoneLink}>
                      {shop.phone}
                    </a>
                  </div>
                )}
                {shop.email && (
                  <div style={styles.infoRow}>
                    <span style={styles.infoIcon}>✉️</span>
                    <span style={styles.infoText}>{shop.email}</span>
                  </div>
                )}
              </div>

              {/* Metrics Pill & Action */}
              <div style={styles.footerRow}>
                <div style={styles.metricsPill}>
                  <span style={styles.statCount}>
                    {shop.declarationCount ?? 0}
                  </span>
                  <span style={styles.statTag}>Declarations</span>
                  <span style={styles.dot}>•</span>
                  <span style={styles.statCount}>
                    {shop.userCount ?? 0}
                  </span>
                  <span style={styles.statTag}>Staff</span>
                </div>

                <button
                  type="button"
                  style={styles.viewRecordsBtn}
                  onClick={() => navigate(`/admin/declarations?shopId=${shop._id}`)}
                >
                  View Records ›
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </MobileLayout>
  );
};

const styles = {
  introCard: {
    backgroundColor: '#eff6ff',
    border: '1px solid #bfdbfe',
    borderRadius: '14px',
    padding: '12px 14px',
    marginBottom: '14px',
  },
  introText: {
    margin: 0,
    fontSize: '13px',
    color: '#1e40af',
    lineHeight: '1.4',
  },
  loadingBox: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '36px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
    color: '#64748b',
    border: '1px solid #e2e8f0',
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
    borderRadius: '12px',
    padding: '14px',
    color: '#b91c1c',
    fontSize: '13px',
    fontWeight: '600',
  },
  shopsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  shopCard: {
    backgroundColor: '#ffffff',
    borderRadius: '18px',
    padding: '16px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.02)',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '10px',
  },
  nameGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  codeTag: {
    backgroundColor: '#eff6ff',
    color: '#1a56db',
    fontSize: '11px',
    fontWeight: '800',
    borderRadius: '6px',
    padding: '3px 7px',
  },
  shopName: {
    margin: 0,
    fontSize: '16px',
    fontWeight: '800',
    color: '#0f172a',
  },
  statusTag: {
    fontSize: '11px',
    fontWeight: '700',
    borderRadius: '6px',
    padding: '3px 8px',
  },
  infoGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    marginBottom: '14px',
  },
  infoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '12px',
    color: '#475569',
  },
  infoIcon: {
    fontSize: '13px',
  },
  infoText: {
    lineHeight: '1.3',
  },
  phoneLink: {
    color: '#1a56db',
    fontWeight: '600',
    textDecoration: 'none',
  },
  footerRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTop: '1px solid #f1f5f9',
    paddingTop: '10px',
  },
  metricsPill: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '12px',
    backgroundColor: '#f8fafc',
    padding: '4px 10px',
    borderRadius: '8px',
  },
  statCount: {
    fontWeight: '800',
    color: '#0f172a',
  },
  statTag: {
    color: '#64748b',
    fontSize: '11px',
  },
  dot: {
    color: '#cbd5e1',
    margin: '0 2px',
  },
  viewRecordsBtn: {
    backgroundColor: '#ffffff',
    border: '1px solid #cbd5e1',
    borderRadius: '10px',
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: '700',
    color: '#1a56db',
    cursor: 'pointer',
    touchAction: 'manipulation',
  },
};
