import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { declarationService } from '../services/declaration.service';
import AdminLayout from '../components/AdminLayout';

export default function Shops() {
  const { token } = useAuth();
  const [shops, setShops] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadShops = async () => {
      if (!token) return;
      setIsLoading(true);
      setError(null);
      try {
        const shopsList = await declarationService.getShops(token);
        setShops(shopsList || []);
      } catch (err) {
        setError(err.message || 'Failed to load shops.');
      } finally {
        setIsLoading(false);
      }
    };

    loadShops();
  }, [token]);

  return (
    <AdminLayout>
      <div style={styles.pageHeader}>
        <div>
          <h2 style={styles.pageTitle}>UK Bicycle Shop Network</h2>
          <p style={styles.pageSubtitle}>
            Overview of the 6 authorized PixxTechnologiees bicycle shops, declaration volume, and active personnel.
          </p>
        </div>
      </div>

      {error ? (
        <div style={styles.errorBox}>
          <p>⚠️ {error}</p>
        </div>
      ) : isLoading ? (
        <div style={styles.loadingBox}>
          <div style={styles.spinner} />
          <p>Loading shops data...</p>
        </div>
      ) : (
        <div style={styles.grid}>
          {shops.map((shop) => (
            <div key={shop._id} style={styles.shopCard}>
              <div style={styles.shopCardHeader}>
                <div>
                  <span style={styles.codeBadge}>{shop.code}</span>
                  <h3 style={styles.shopName}>{shop.name}</h3>
                </div>
                <span
                  style={
                    shop.isActive ? styles.activeBadge : styles.inactiveBadge
                  }
                >
                  {shop.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div style={styles.detailSection}>
                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}>📍 Address:</span>
                  <span style={styles.detailValue}>
                    {shop.address || 'Address on file'}
                  </span>
                </div>
                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}>📞 Phone:</span>
                  <span style={styles.detailValue}>
                    {shop.phone || 'Phone on file'}
                  </span>
                </div>
                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}>✉️ Email:</span>
                  <span style={styles.detailValue}>
                    {shop.email || 'Email on file'}
                  </span>
                </div>
              </div>

              {/* Two metrics: Declaration count & User count */}
              <div style={styles.metricRow}>
                <div style={styles.metricItem}>
                  <span style={styles.metricNumber}>{shop.declarationCount ?? 0}</span>
                  <span style={styles.metricLabel}>Total Declarations</span>
                </div>
                <div style={styles.metricItem}>
                  <span style={styles.metricNumber}>{shop.userCount ?? 0}</span>
                  <span style={styles.metricLabel}>Assigned Users</span>
                </div>
              </div>

              <div style={styles.cardFooter}>
                <Link
                  to={`/admin/declarations?shopId=${shop._id}`}
                  style={styles.viewLink}
                >
                  View Shop Declarations &rarr;
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}

const styles = {
  pageHeader: {
    marginBottom: '24px',
  },
  pageTitle: {
    fontSize: '26px',
    fontWeight: '800',
    color: '#0f172a',
    margin: '0 0 6px 0',
  },
  pageSubtitle: {
    fontSize: '14px',
    color: '#64748b',
    margin: 0,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '24px',
  },
  shopCard: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    padding: '24px',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.04)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  shopCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '16px',
  },
  codeBadge: {
    fontFamily: 'monospace',
    fontSize: '11px',
    fontWeight: '700',
    color: '#475569',
    backgroundColor: '#f1f5f9',
    padding: '2px 6px',
    borderRadius: '4px',
  },
  shopName: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#0f172a',
    margin: '6px 0 0 0',
  },
  activeBadge: {
    fontSize: '12px',
    fontWeight: '700',
    color: '#166534',
    backgroundColor: '#dcfce7',
    padding: '3px 8px',
    borderRadius: '12px',
  },
  inactiveBadge: {
    fontSize: '12px',
    fontWeight: '700',
    color: '#991b1b',
    backgroundColor: '#fee2e2',
    padding: '3px 8px',
    borderRadius: '12px',
  },
  detailSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    padding: '12px 0',
    borderTop: '1px solid #f1f5f9',
    borderBottom: '1px solid #f1f5f9',
    marginBottom: '16px',
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '13px',
    gap: '8px',
  },
  detailLabel: {
    color: '#64748b',
    fontWeight: '500',
    whiteSpace: 'nowrap',
  },
  detailValue: {
    color: '#1e293b',
    fontWeight: '600',
    textAlign: 'right',
  },
  metricRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
    marginBottom: '16px',
  },
  metricItem: {
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    padding: '12px',
    textAlign: 'center',
    border: '1px solid #e2e8f0',
  },
  metricNumber: {
    display: 'block',
    fontSize: '22px',
    fontWeight: '800',
    color: '#2563eb',
  },
  metricLabel: {
    display: 'block',
    fontSize: '11px',
    color: '#64748b',
    fontWeight: '600',
    marginTop: '2px',
  },
  cardFooter: {
    paddingTop: '8px',
  },
  viewLink: {
    display: 'block',
    textAlign: 'center',
    backgroundColor: '#eff6ff',
    color: '#2563eb',
    fontWeight: '600',
    fontSize: '13px',
    padding: '10px 16px',
    borderRadius: '8px',
    textDecoration: 'none',
    transition: 'background-color 0.15s ease',
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
};
