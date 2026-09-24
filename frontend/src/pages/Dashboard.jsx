import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MobileLayout } from '../components/MobileLayout';
import { useAuth } from '../contexts/AuthContext';
import { declarationService } from '../services/declaration.service';

export const Dashboard = () => {
  const { shopName } = useAuth();
  const navigate = useNavigate();

  const [recentDeclarations, setRecentDeclarations] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await declarationService.list({ limit: 5 });
        setRecentDeclarations(response.data || []);
        setTotalCount(response.pagination?.total || response.count || 0);
      } catch (err) {
        console.warn('Dashboard fetch error:', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/declarations?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/declarations');
    }
  };

  return (
    <MobileLayout>
      {/* ── Shop Banner Card ─────────────────────────── */}
      <div style={styles.shopCard}>
        <div style={styles.shopCardHeader}>
          <div style={styles.logoBadge}>
            <img
              src="/logo.png"
              alt="Logo"
              style={styles.logoMini}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
          <div>
            <span style={styles.verifiedTag}>Official Shop Portal</span>
            <h2 style={styles.shopHeading}>{shopName}</h2>
          </div>
        </div>

        <div style={styles.statsRow}>
          <div style={styles.statBox}>
            <span style={styles.statValue}>{loading ? '...' : totalCount}</span>
            <span style={styles.statLabel}>Total Declarations</span>
          </div>
          <div style={styles.statDivider} />
          <div style={styles.statBox}>
            <span style={styles.statValue}>100%</span>
            <span style={styles.statLabel}>Protected Records</span>
          </div>
        </div>
      </div>

      {/* ── Big Action Buttons ───────────────────────── */}
      <div style={styles.actionGrid}>
        <button
          type="button"
          style={styles.primaryActionBtn}
          onClick={() => navigate('/create-declaration')}
        >
          <span style={styles.btnHugeIcon}>＋</span>
          <div style={styles.btnTextGroup}>
            <span style={styles.primaryBtnTitle}>New Declaration</span>
            <span style={styles.primaryBtnSub}>Record buyer, bike & attach photos</span>
          </div>
        </button>

        <button
          type="button"
          style={styles.secondaryActionBtn}
          onClick={() => navigate('/declarations')}
        >
          <span style={styles.btnHugeIcon}>📋</span>
          <div style={styles.btnTextGroup}>
            <span style={styles.secondaryBtnTitle}>My Declarations</span>
            <span style={styles.secondaryBtnSub}>Search & view saved shop forms</span>
          </div>
        </button>
      </div>

      {/* ── Search Bar ──────────────────────────────── */}
      <form onSubmit={handleSearchSubmit} style={styles.searchForm}>
        <input
          type="text"
          style={styles.searchInput}
          placeholder="Search by buyer, model, frame #..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button type="submit" style={styles.searchBtn} aria-label="Search">
          🔍
        </button>
      </form>

      {/* ── Recent Declarations List ────────────────── */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h3 style={styles.sectionTitle}>Recent Declarations</h3>
          <button
            type="button"
            style={styles.viewAllBtn}
            onClick={() => navigate('/declarations')}
          >
            View All ›
          </button>
        </div>

        {loading ? (
          <div style={styles.loadingBox}>
            <div style={styles.miniSpinner} />
            <span>Loading records...</span>
          </div>
        ) : recentDeclarations.length === 0 ? (
          <div style={styles.emptyCard}>
            <span style={styles.emptyIcon}>📝</span>
            <p style={styles.emptyTitle}>No declarations recorded yet</p>
            <p style={styles.emptySub}>
              Tap the <strong>New Declaration</strong> button above to record your first bicycle owner form.
            </p>
          </div>
        ) : (
          <div style={styles.cardList}>
            {recentDeclarations.map((item) => (
              <div
                key={item._id}
                style={styles.recordCard}
                onClick={() => navigate(`/declarations/${item._id}`)}
              >
                <div style={styles.recordInfo}>
                  <div style={styles.nameRow}>
                    <span style={styles.customerName}>{item.customerName}</span>
                    <span style={styles.dateTag}>
                      {item.date
                        ? new Date(item.date).toLocaleDateString('en-GB')
                        : new Date(item.createdAt).toLocaleDateString('en-GB')}
                    </span>
                  </div>
                  <span style={styles.bikeModel}>
                    🚴 {item.bicycleMake ? `${item.bicycleMake} ` : ''}
                    {item.bicycleModel}
                  </span>
                  <div style={styles.metaRow}>
                    {item.frameNumber && (
                      <span style={styles.metaBadge}>Frame: {item.frameNumber}</span>
                    )}
                    {item.cyclePrice && (
                      <span style={styles.metaBadge}>£{item.cyclePrice}</span>
                    )}
                  </div>
                </div>
                <div style={styles.arrowIcon}>›</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </MobileLayout>
  );
};

const styles = {
  shopCard: {
    backgroundColor: '#ffffff',
    borderRadius: '20px',
    padding: '20px',
    marginBottom: '16px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.03)',
  },
  shopCardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '16px',
  },
  logoBadge: {
    width: '46px',
    height: '46px',
    borderRadius: '12px',
    backgroundColor: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid #e2e8f0',
    boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
    overflow: 'hidden',
  },
  logoMini: {
    width: '80%',
    height: '80%',
    objectFit: 'contain',
  },
  verifiedTag: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#1a56db',
    textTransform: 'uppercase',
    letterSpacing: '0.8px',
  },
  shopHeading: {
    margin: '2px 0 0 0',
    fontSize: '20px',
    fontWeight: '800',
    color: '#0f172a',
  },
  statsRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#f8fafc',
    borderRadius: '14px',
    padding: '12px 16px',
    border: '1px solid #f1f5f9',
  },
  statBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  statValue: {
    fontSize: '22px',
    fontWeight: '800',
    color: '#1a56db',
  },
  statLabel: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#64748b',
    marginTop: '2px',
  },
  statDivider: {
    width: '1px',
    height: '32px',
    backgroundColor: '#e2e8f0',
  },
  actionGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '16px',
  },
  primaryActionBtn: {
    backgroundColor: '#1a56db',
    borderRadius: '16px',
    padding: '16px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    border: 'none',
    color: '#ffffff',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(26, 86, 219, 0.3)',
    touchAction: 'manipulation',
    textAlign: 'left',
  },
  secondaryActionBtn: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '16px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    border: '1px solid #e2e8f0',
    color: '#0f172a',
    cursor: 'pointer',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.02)',
    touchAction: 'manipulation',
    textAlign: 'left',
  },
  btnHugeIcon: {
    fontSize: '28px',
    lineHeight: 1,
  },
  btnTextGroup: {
    display: 'flex',
    flexDirection: 'column',
  },
  primaryBtnTitle: {
    fontSize: '17px',
    fontWeight: '700',
    color: '#ffffff',
  },
  primaryBtnSub: {
    fontSize: '12px',
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: '2px',
  },
  secondaryBtnTitle: {
    fontSize: '17px',
    fontWeight: '700',
    color: '#0f172a',
  },
  secondaryBtnSub: {
    fontSize: '12px',
    color: '#64748b',
    marginTop: '2px',
  },
  searchForm: {
    display: 'flex',
    gap: '8px',
    marginBottom: '20px',
  },
  searchInput: {
    flex: 1,
    height: '46px',
    borderRadius: '14px',
    border: '1px solid #cbd5e1',
    backgroundColor: '#ffffff',
    padding: '0 16px',
    fontSize: '16px', // Prevents iOS Safari zoom
    color: '#0f172a',
    boxSizing: 'border-box',
    outline: 'none',
  },
  searchBtn: {
    width: '46px',
    height: '46px',
    borderRadius: '14px',
    backgroundColor: '#ffffff',
    border: '1px solid #cbd5e1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
    cursor: 'pointer',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 4px',
  },
  sectionTitle: {
    margin: 0,
    fontSize: '16px',
    fontWeight: '700',
    color: '#0f172a',
  },
  viewAllBtn: {
    background: 'none',
    border: 'none',
    color: '#1a56db',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer',
    padding: 0,
  },
  loadingBox: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '30px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '10px',
    color: '#64748b',
    fontSize: '14px',
  },
  miniSpinner: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    border: '2px solid #e2e8f0',
    borderTopColor: '#1a56db',
    animation: 'spin 0.8s linear infinite',
  },
  emptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '32px 20px',
    textAlign: 'center',
    border: '1px dashed #cbd5e1',
  },
  emptyIcon: {
    fontSize: '32px',
  },
  emptyTitle: {
    margin: '10px 0 4px 0',
    fontSize: '15px',
    fontWeight: '700',
    color: '#0f172a',
  },
  emptySub: {
    margin: 0,
    fontSize: '13px',
    color: '#64748b',
    lineHeight: '1.4',
  },
  cardList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  recordCard: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '14px 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    border: '1px solid #e2e8f0',
    cursor: 'pointer',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
    touchAction: 'manipulation',
  },
  recordInfo: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  nameRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: '12px',
  },
  customerName: {
    fontSize: '15px',
    fontWeight: '700',
    color: '#0f172a',
  },
  dateTag: {
    fontSize: '11px',
    color: '#94a3b8',
    fontWeight: '500',
  },
  bikeModel: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#1a56db',
  },
  metaRow: {
    display: 'flex',
    gap: '6px',
    marginTop: '2px',
  },
  metaBadge: {
    backgroundColor: '#f1f5f9',
    color: '#475569',
    fontSize: '10px',
    fontWeight: '600',
    borderRadius: '6px',
    padding: '2px 6px',
  },
  arrowIcon: {
    fontSize: '20px',
    color: '#94a3b8',
    fontWeight: '300',
  },
};
