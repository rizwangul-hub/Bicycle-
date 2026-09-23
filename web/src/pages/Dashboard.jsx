import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { declarationService } from '../services/declaration.service';
import AdminLayout from '../components/AdminLayout';

function formatDate(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
}

export default function Dashboard() {
  const { token, user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [recentDeclarations, setRecentDeclarations] = useState([]);
  const [selectedShopFilter, setSelectedShopFilter] = useState('');
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingRecent, setLoadingRecent] = useState(true);
  const [error, setError] = useState(null);

  // Fetch summary stats & shop cards
  const fetchDashboardStats = useCallback(async () => {
    if (!token) return;
    setLoadingStats(true);
    setError(null);
    try {
      const data = await declarationService.getDashboardStats(token);
      setStats(data);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard overview data.');
    } finally {
      setLoadingStats(false);
    }
  }, [token]);

  // Fetch recent declarations (optionally filtered by shopId)
  const fetchRecentDeclarations = useCallback(
    async (shopId = '') => {
      if (!token) return;
      setLoadingRecent(true);
      try {
        const res = await declarationService.getDeclarations(token, {
          shopId: shopId || undefined,
          limit: 8,
          sortBy: 'createdAt',
          sortOrder: 'desc',
        });
        setRecentDeclarations(res.data || []);
      } catch (err) {
        console.error('Failed to load recent declarations:', err);
      } finally {
        setLoadingRecent(false);
      }
    },
    [token]
  );

  useEffect(() => {
    fetchDashboardStats();
  }, [fetchDashboardStats]);

  useEffect(() => {
    fetchRecentDeclarations(selectedShopFilter);
  }, [selectedShopFilter, fetchRecentDeclarations]);

  const handleShopFilterChange = (e) => {
    setSelectedShopFilter(e.target.value);
  };

  return (
    <AdminLayout>
      <div style={styles.pageHeader}>
        <div>
          <h2 style={styles.pageTitle}>Executive Admin Dashboard</h2>
          <p style={styles.pageSubtitle}>
            Central oversight and record verification across all 6 PixxTechnologiees bicycle shops.
          </p>
        </div>
        <div style={styles.headerMeta}>
          <span style={styles.liveBadge}>● System Online</span>
          <span style={styles.adminBadge}>Admin: {user?.email}</span>
        </div>
      </div>

      {error && (
        <div style={styles.errorAlert}>
          <span>⚠️ {error}</span>
          <button onClick={fetchDashboardStats} style={styles.retryBtn}>
            Retry
          </button>
        </div>
      )}

      {/* ── 1. Summary Statistics Cards ────────────────── */}
      <section style={styles.statsGrid}>
        {/* Total Shops */}
        <div style={styles.statCard}>
          <div style={styles.statIconWrap}>🏪</div>
          <div style={styles.statInfo}>
            <span style={styles.statLabel}>Total Shops</span>
            <span style={styles.statValue}>
              {loadingStats ? '...' : stats?.totalShops ?? 6}
            </span>
            <span style={styles.statMeta}>Pixx UK Network</span>
          </div>
        </div>

        {/* Total Declarations */}
        <div style={styles.statCard}>
          <div style={{ ...styles.statIconWrap, backgroundColor: '#eff6ff', color: '#2563eb' }}>
            📋
          </div>
          <div style={styles.statInfo}>
            <span style={styles.statLabel}>Total Declarations</span>
            <span style={styles.statValue}>
              {loadingStats ? '...' : stats?.totalDeclarations ?? 0}
            </span>
            <span style={styles.statMeta}>Stored in MongoDB Atlas</span>
          </div>
        </div>

        {/* Recent Declarations (30 Days) */}
        <div style={styles.statCard}>
          <div style={{ ...styles.statIconWrap, backgroundColor: '#f0fdf4', color: '#16a34a' }}>
            📅
          </div>
          <div style={styles.statInfo}>
            <span style={styles.statLabel}>Recent Declarations</span>
            <span style={styles.statValue}>
              {loadingStats ? '...' : stats?.recentDeclarationsCount ?? 0}
            </span>
            <span style={styles.statMeta}>Created in last 30 days</span>
          </div>
        </div>

        {/* Active Shops */}
        <div style={styles.statCard}>
          <div style={{ ...styles.statIconWrap, backgroundColor: '#faf5ff', color: '#9333ea' }}>
            🛡️
          </div>
          <div style={styles.statInfo}>
            <span style={styles.statLabel}>Active Shops</span>
            <span style={styles.statValue}>
              {loadingStats ? '...' : stats?.activeShops ?? 6}
            </span>
            <span style={styles.statMeta}>Shop Isolation Active</span>
          </div>
        </div>
      </section>

      {/* ── 2. The Six Shops Grid ──────────────────────── */}
      <section style={styles.sectionCard}>
        <div style={styles.sectionHeaderRow}>
          <div>
            <h3 style={styles.sectionTitle}>The 6 Bicycle Shops Overview</h3>
            <p style={styles.sectionSubtitle}>
              Real-time declaration counts per shop location.
            </p>
          </div>
          <Link to="/admin/shops" style={styles.textLink}>
            View Shop Details &rarr;
          </Link>
        </div>

        {loadingStats ? (
          <div style={styles.loadingBox}>Loading shop metrics...</div>
        ) : (
          <div style={styles.shopsGrid}>
            {(stats?.shops || []).map((shop) => (
              <div key={shop._id} style={styles.shopItemCard}>
                <div style={styles.shopItemHeader}>
                  <h4 style={styles.shopName}>{shop.name}</h4>
                  <span style={styles.codeBadge}>{shop.code}</span>
                </div>
                <div style={styles.shopMetricsRow}>
                  <div>
                    <span style={styles.countNumber}>{shop.declarationCount}</span>
                    <span style={styles.countLabel}>Declarations</span>
                  </div>
                  <span style={styles.activePill}>Active</span>
                </div>
                <div style={styles.shopItemFooter}>
                  <button
                    onClick={() => {
                      setSelectedShopFilter(shop._id);
                      const el = document.getElementById('recent-declarations-section');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                    style={styles.filterByShopBtn}
                  >
                    View in table ↓
                  </button>
                  <Link
                    to={`/admin/declarations?shopId=${shop._id}`}
                    style={styles.allShopDeclLink}
                  >
                    All Records &rarr;
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── 3. Recent Declarations & Filter ────────────── */}
      <section id="recent-declarations-section" style={styles.sectionCard}>
        <div style={styles.sectionHeaderRow}>
          <div>
            <h3 style={styles.sectionTitle}>Recent Bicycle Declarations</h3>
            <p style={styles.sectionSubtitle}>
              Latest records submitted by shop employees across the UK network.
            </p>
          </div>

          {/* Shop Filter Selector */}
          <div style={styles.filterControls}>
            <label style={styles.filterLabel}>Filter by Shop:</label>
            <select
              value={selectedShopFilter}
              onChange={handleShopFilterChange}
              style={styles.selectInput}
            >
              <option value="">All Shops (6 Locations)</option>
              {(stats?.shops || []).map((shop) => (
                <option key={shop._id} value={shop._id}>
                  {shop.name}
                </option>
              ))}
            </select>
            {selectedShopFilter && (
              <button
                onClick={() => setSelectedShopFilter('')}
                style={styles.resetFilterBtn}
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Declarations Table */}
        {loadingRecent ? (
          <div style={styles.loadingBox}>Fetching declarations from backend...</div>
        ) : recentDeclarations.length === 0 ? (
          <div style={styles.emptyBox}>
            <p>No declarations found {selectedShopFilter ? 'for this shop' : 'in the system yet'}.</p>
          </div>
        ) : (
          <div style={styles.tableResponsive}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Customer</th>
                  <th style={styles.th}>Bicycle</th>
                  <th style={styles.th}>Frame #</th>
                  <th style={styles.th}>Shop</th>
                  <th style={styles.th}>Date</th>
                  <th style={styles.th}>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentDeclarations.map((decl) => {
                  const shopName =
                    typeof decl.shopId === 'object' && decl.shopId !== null
                      ? decl.shopId.name
                      : 'Shop';
                  const bike = [decl.bicycleMake, decl.bicycleModel]
                    .filter(Boolean)
                    .join(' ');

                  return (
                    <tr
                      key={decl._id}
                      style={styles.tr}
                      onClick={() => navigate(`/admin/declarations/${decl._id}`)}
                    >
                      <td style={styles.td}>
                        <strong>{decl.customerName}</strong>
                      </td>
                      <td style={styles.td}>🚲 {bike || '—'}</td>
                      <td style={styles.td}>
                        <span style={styles.mono}>{decl.frameNumber || 'Not specified'}</span>
                      </td>
                      <td style={styles.td}>
                        <span style={styles.shopBadge}>{shopName}</span>
                      </td>
                      <td style={styles.td}>{formatDate(decl.date || decl.createdAt)}</td>
                      <td style={styles.td}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/admin/declarations/${decl._id}`);
                          }}
                          style={styles.viewRowBtn}
                        >
                          View &rarr;
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div style={styles.sectionFooterRow}>
          <span style={styles.footerNote}>
            Showing {recentDeclarations.length} recent records
          </span>
          <Link to="/admin/declarations" style={styles.primaryLinkBtn}>
            Open Declarations Center &rarr;
          </Link>
        </div>
      </section>
    </AdminLayout>
  );
}

const styles = {
  pageHeader: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '24px',
  },
  pageTitle: {
    margin: 0,
    fontSize: '24px',
    fontWeight: '700',
    color: '#0f172a',
  },
  pageSubtitle: {
    margin: '4px 0 0 0',
    fontSize: '14px',
    color: '#64748b',
  },
  headerMeta: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
  },
  liveBadge: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#16a34a',
    backgroundColor: '#dcfce7',
    padding: '4px 10px',
    borderRadius: '12px',
  },
  adminBadge: {
    fontSize: '12px',
    color: '#475569',
    backgroundColor: '#e2e8f0',
    padding: '4px 10px',
    borderRadius: '12px',
  },
  errorAlert: {
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    color: '#dc2626',
    padding: '12px 16px',
    borderRadius: '8px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    fontSize: '14px',
  },
  retryBtn: {
    backgroundColor: '#dc2626',
    color: '#ffffff',
    border: 'none',
    padding: '4px 10px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '600',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '20px',
    marginBottom: '28px',
  },
  statCard: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    padding: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.04)',
  },
  statIconWrap: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    backgroundColor: '#f1f5f9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '22px',
  },
  statInfo: {
    display: 'flex',
    flexDirection: 'column',
  },
  statLabel: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  statValue: {
    fontSize: '26px',
    fontWeight: '800',
    color: '#0f172a',
    margin: '2px 0',
  },
  statMeta: {
    fontSize: '12px',
    color: '#94a3b8',
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    padding: '24px',
    marginBottom: '28px',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.04)',
  },
  sectionHeaderRow: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '20px',
  },
  sectionTitle: {
    margin: 0,
    fontSize: '18px',
    fontWeight: '700',
    color: '#0f172a',
  },
  sectionSubtitle: {
    margin: '4px 0 0 0',
    fontSize: '13px',
    color: '#64748b',
  },
  textLink: {
    color: '#2563eb',
    fontSize: '14px',
    fontWeight: '600',
    textDecoration: 'none',
  },
  shopsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: '16px',
  },
  shopItemCard: {
    backgroundColor: '#f8fafc',
    borderRadius: '10px',
    border: '1px solid #e2e8f0',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  shopItemHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  shopName: {
    margin: 0,
    fontSize: '15px',
    fontWeight: '700',
    color: '#1e293b',
  },
  codeBadge: {
    fontSize: '10px',
    fontWeight: '700',
    padding: '2px 6px',
    borderRadius: '4px',
    backgroundColor: '#e2e8f0',
    color: '#475569',
  },
  shopMetricsRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  countNumber: {
    display: 'block',
    fontSize: '22px',
    fontWeight: '800',
    color: '#0f172a',
  },
  countLabel: {
    fontSize: '12px',
    color: '#64748b',
  },
  activePill: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#166534',
    backgroundColor: '#dcfce7',
    padding: '2px 8px',
    borderRadius: '10px',
  },
  shopItemFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '8px',
    borderTop: '1px solid #e2e8f0',
  },
  filterByShopBtn: {
    background: 'none',
    border: 'none',
    color: '#2563eb',
    fontSize: '12px',
    fontWeight: '600',
    padding: 0,
    cursor: 'pointer',
  },
  allShopDeclLink: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#64748b',
    textDecoration: 'none',
  },
  filterControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  filterLabel: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#475569',
  },
  selectInput: {
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid #cbd5e1',
    backgroundColor: '#ffffff',
    fontSize: '13px',
    color: '#0f172a',
    outline: 'none',
  },
  resetFilterBtn: {
    backgroundColor: '#f1f5f9',
    border: '1px solid #cbd5e1',
    color: '#475569',
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    cursor: 'pointer',
  },
  tableResponsive: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
    fontSize: '14px',
  },
  th: {
    backgroundColor: '#f8fafc',
    padding: '12px 14px',
    borderBottom: '2px solid #e2e8f0',
    fontSize: '12px',
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  tr: {
    borderBottom: '1px solid #f1f5f9',
    cursor: 'pointer',
    transition: 'background-color 0.1s',
  },
  td: {
    padding: '12px 14px',
    color: '#334155',
    verticalAlign: 'middle',
  },
  mono: {
    fontFamily: 'monospace',
    fontSize: '13px',
    backgroundColor: '#f1f5f9',
    padding: '2px 6px',
    borderRadius: '4px',
  },
  shopBadge: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#2563eb',
    backgroundColor: '#eff6ff',
    padding: '3px 8px',
    borderRadius: '4px',
  },
  viewRowBtn: {
    backgroundColor: '#f8fafc',
    border: '1px solid #cbd5e1',
    color: '#0f172a',
    padding: '4px 10px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  sectionFooterRow: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
    marginTop: '16px',
    paddingTop: '16px',
    borderTop: '1px solid #f1f5f9',
  },
  footerNote: {
    fontSize: '13px',
    color: '#64748b',
  },
  primaryLinkBtn: {
    backgroundColor: '#2563eb',
    color: '#ffffff',
    padding: '8px 16px',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '600',
    textDecoration: 'none',
  },
  loadingBox: {
    textAlign: 'center',
    padding: '36px',
    color: '#64748b',
    fontSize: '14px',
  },
  emptyBox: {
    textAlign: 'center',
    padding: '36px',
    color: '#94a3b8',
    fontSize: '14px',
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
  },
};
