import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MobileLayout } from '../../components/MobileLayout';
import { adminService } from '../../services/admin.service';

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await adminService.getDashboardStats();
        setStats(data);
      } catch (err) {
        setError(err.message || 'Failed to load admin stats.');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <MobileLayout title="Admin Control Center">
      {/* ── Admin Mode Banner ────────────────────────── */}
      <div style={styles.adminBanner}>
        <div style={styles.bannerRow}>
          <span style={styles.adminBadge}>ADMINISTRATOR PORTAL</span>
          <button
            type="button"
            style={styles.switchModeBtn}
            onClick={() => navigate('/')}
          >
            Switch to Shop View ›
          </button>
        </div>
        <h2 style={styles.bannerTitle}>Pixx Bicycle Network</h2>
        <p style={styles.bannerSub}>
          Managing declarations, 6 authorized shops, and shop personnel.
        </p>
      </div>

      {loading ? (
        <div style={styles.loadingBox}>
          <div style={styles.spinner} />
          <span>Loading network metrics...</span>
        </div>
      ) : error ? (
        <div style={styles.errorBox}>
          <span>⚠️ {error}</span>
        </div>
      ) : (
        <>
          {/* ── High-Level Network Metrics ────────────── */}
          <div style={styles.metricsGrid}>
            <div style={styles.metricCard}>
              <span style={styles.metricValue}>{stats?.totalDeclarations ?? 0}</span>
              <span style={styles.metricLabel}>Total Declarations</span>
            </div>
            <div style={styles.metricCard}>
              <span style={styles.metricValue}>{stats?.shops?.length ?? 6}</span>
              <span style={styles.metricLabel}>Active Shops</span>
            </div>
            <div style={styles.metricCard}>
              <span style={styles.metricValue}>{stats?.userCount ?? 0}</span>
              <span style={styles.metricLabel}>Staff Users</span>
            </div>
            <div style={styles.metricCard}>
              <span style={styles.metricValue}>{stats?.recentCount ?? 0}</span>
              <span style={styles.metricLabel}>Last 30 Days</span>
            </div>
          </div>

          {/* ── Quick Admin Navigation Cards ──────────── */}
          <div style={styles.quickNavList}>
            <div
              style={styles.quickNavCard}
              onClick={() => navigate('/admin/declarations')}
            >
              <div style={styles.quickNavLeft}>
                <span style={styles.quickNavIcon}>📋</span>
                <div>
                  <h4 style={styles.quickNavTitle}>All Declarations</h4>
                  <p style={styles.quickNavSub}>Browse & filter by shop</p>
                </div>
              </div>
              <span style={styles.arrow}>›</span>
            </div>

            <div
              style={styles.quickNavCard}
              onClick={() => navigate('/admin/shops')}
            >
              <div style={styles.quickNavLeft}>
                <span style={styles.quickNavIcon}>🏪</span>
                <div>
                  <h4 style={styles.quickNavTitle}>Bicycle Shop Network</h4>
                  <p style={styles.quickNavSub}>View the 6 registered shop locations</p>
                </div>
              </div>
              <span style={styles.arrow}>›</span>
            </div>

            <div
              style={styles.quickNavCard}
              onClick={() => navigate('/admin/users')}
            >
              <div style={styles.quickNavLeft}>
                <span style={styles.quickNavIcon}>👥</span>
                <div>
                  <h4 style={styles.quickNavTitle}>Staff Accounts</h4>
                  <p style={styles.quickNavSub}>Manage shop staff logins & roles</p>
                </div>
              </div>
              <span style={styles.arrow}>›</span>
            </div>
          </div>

          {/* ── Per-Shop Declaration Breakdown ───────── */}
          <div style={styles.shopSection}>
            <h3 style={styles.shopSectionTitle}>Declarations by Shop</h3>
            <div style={styles.shopGrid}>
              {stats?.shops?.map((shop) => (
                <div
                  key={shop._id}
                  style={styles.shopItem}
                  onClick={() => navigate(`/admin/declarations?shopId=${shop._id}`)}
                >
                  <div style={styles.shopItemTop}>
                    <span style={styles.shopItemCode}>{shop.code}</span>
                    <span style={styles.shopItemCount}>
                      {shop.declarationCount || 0} Records
                    </span>
                  </div>
                  <h4 style={styles.shopItemName}>{shop.name}</h4>
                  <span style={styles.shopItemLink}>View Records ›</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </MobileLayout>
  );
};

const styles = {
  adminBanner: {
    backgroundColor: '#0f172a',
    borderRadius: '20px',
    padding: '20px',
    color: '#ffffff',
    marginBottom: '16px',
    boxShadow: '0 4px 12px rgba(15, 23, 42, 0.25)',
  },
  bannerRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '10px',
  },
  adminBadge: {
    backgroundColor: '#3b82f6',
    color: '#ffffff',
    fontSize: '10px',
    fontWeight: '800',
    letterSpacing: '0.8px',
    borderRadius: '6px',
    padding: '3px 8px',
  },
  switchModeBtn: {
    background: 'none',
    border: 'none',
    color: '#93c5fd',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer',
    padding: 0,
  },
  bannerTitle: {
    margin: '0 0 4px 0',
    fontSize: '20px',
    fontWeight: '800',
  },
  bannerSub: {
    margin: 0,
    fontSize: '12px',
    color: '#94a3b8',
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
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px',
    marginBottom: '16px',
  },
  metricCard: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '16px',
    border: '1px solid #e2e8f0',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
  },
  metricValue: {
    fontSize: '24px',
    fontWeight: '800',
    color: '#1a56db',
  },
  metricLabel: {
    fontSize: '11px',
    color: '#64748b',
    fontWeight: '600',
    marginTop: '4px',
  },
  quickNavList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginBottom: '20px',
  },
  quickNavCard: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '16px',
    border: '1px solid #e2e8f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    cursor: 'pointer',
    touchAction: 'manipulation',
    boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
  },
  quickNavLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },
  quickNavIcon: {
    fontSize: '24px',
  },
  quickNavTitle: {
    margin: 0,
    fontSize: '15px',
    fontWeight: '700',
    color: '#0f172a',
  },
  quickNavSub: {
    margin: '2px 0 0 0',
    fontSize: '12px',
    color: '#64748b',
  },
  arrow: {
    fontSize: '20px',
    color: '#94a3b8',
  },
  shopSection: {
    marginTop: '8px',
  },
  shopSectionTitle: {
    fontSize: '16px',
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: '12px',
  },
  shopGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px',
  },
  shopItem: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '14px',
    border: '1px solid #e2e8f0',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  shopItemTop: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '8px',
  },
  shopItemCode: {
    backgroundColor: '#eff6ff',
    color: '#1a56db',
    fontSize: '10px',
    fontWeight: '800',
    borderRadius: '6px',
    padding: '2px 6px',
  },
  shopItemCount: {
    fontSize: '11px',
    color: '#16a34a',
    fontWeight: '700',
  },
  shopItemName: {
    margin: '0 0 10px 0',
    fontSize: '14px',
    fontWeight: '800',
    color: '#0f172a',
  },
  shopItemLink: {
    fontSize: '11px',
    color: '#1a56db',
    fontWeight: '700',
  },
};
