import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MobileLayout } from '../../components/MobileLayout';
import { declarationService } from '../../services/declaration.service';
import { adminService } from '../../services/admin.service';

export const AdminDeclarations = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialShopId = searchParams.get('shopId') || '';
  const initialSearch = searchParams.get('search') || '';

  const [declarations, setDeclarations] = useState([]);
  const [shops, setShops] = useState([]);
  const [selectedShopId, setSelectedShopId] = useState(initialShopId);
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    const fetchShops = async () => {
      try {
        const data = await adminService.getShops();
        setShops(data);
      } catch (err) {
        console.warn('Failed to fetch shops for filter:', err.message);
      }
    };
    fetchShops();
  }, []);

  const fetchDeclarations = async (targetShopId = selectedShopId, query = searchTerm, targetPage = 1) => {
    setLoading(true);
    try {
      const response = await declarationService.list({
        shopId: targetShopId || undefined,
        search: query.trim() || undefined,
        page: targetPage,
        limit: 15,
      });
      setDeclarations(response.data || []);
      setTotalPages(response.pagination?.totalPages || 1);
      setTotalCount(response.pagination?.total || response.count || 0);
      setPage(targetPage);
    } catch (err) {
      console.warn('Error loading declarations:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeclarations(selectedShopId, searchTerm, 1);
  }, [selectedShopId]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const params = {};
    if (selectedShopId) params.shopId = selectedShopId;
    if (searchTerm.trim()) params.search = searchTerm.trim();
    setSearchParams(params);
    fetchDeclarations(selectedShopId, searchTerm, 1);
  };

  const handleShopFilterChange = (e) => {
    const shopId = e.target.value;
    setSelectedShopId(shopId);
    const params = {};
    if (shopId) params.shopId = shopId;
    if (searchTerm.trim()) params.search = searchTerm.trim();
    setSearchParams(params);
  };

  return (
    <MobileLayout title="Network Declarations" showBack>
      {/* ── Filters Card ────────────────────────────── */}
      <div style={styles.filterCard}>
        {/* Shop Select Dropdown */}
        <div style={styles.shopFilterRow}>
          <label style={styles.filterLabel}>Filter by Shop:</label>
          <select
            style={styles.shopSelect}
            value={selectedShopId}
            onChange={handleShopFilterChange}
          >
            <option value="">All 6 Shops (Network View)</option>
            {shops.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name} ({s.code})
              </option>
            ))}
          </select>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} style={styles.searchRow}>
          <input
            type="text"
            style={styles.searchInput}
            placeholder="Search buyer, bike, frame #..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button type="submit" style={styles.searchBtn}>
            Filter
          </button>
        </form>
      </div>

      {/* ── Results Header ──────────────────────────── */}
      <div style={styles.resultsHeader}>
        <span style={styles.resultsCount}>
          {totalCount} Total Declarations
        </span>
      </div>

      {/* ── Declarations List ───────────────────────── */}
      {loading ? (
        <div style={styles.loadingBox}>
          <div style={styles.spinner} />
          <span>Loading declarations...</span>
        </div>
      ) : declarations.length === 0 ? (
        <div style={styles.emptyState}>
          <span style={styles.emptyIcon}>📂</span>
          <h3 style={styles.emptyTitle}>No Declarations Found</h3>
          <p style={styles.emptySub}>
            No records matched your shop and search filters.
          </p>
        </div>
      ) : (
        <div style={styles.list}>
          {declarations.map((item) => (
            <div
              key={item._id}
              style={styles.card}
              onClick={() => navigate(`/declarations/${item._id}`)}
            >
              <div style={styles.cardTop}>
                <span style={styles.shopBadge}>
                  {item.shopId?.name || 'Shop'}
                </span>
                <span style={styles.dateTag}>
                  {item.date
                    ? new Date(item.date).toLocaleDateString('en-GB')
                    : new Date(item.createdAt).toLocaleDateString('en-GB')}
                </span>
              </div>

              <h4 style={styles.customerName}>{item.customerName}</h4>

              <div style={styles.bikeLine}>
                <span style={styles.bikeIcon}>🚴</span>
                <span style={styles.bikeTitle}>
                  {item.bicycleMake ? `${item.bicycleMake} ` : ''}
                  {item.bicycleModel}
                </span>
              </div>

              <div style={styles.tagsRow}>
                {item.frameNumber && (
                  <span style={styles.tag}>Frame: {item.frameNumber}</span>
                )}
                {item.cyclePrice && (
                  <span style={styles.tagPrice}>£{item.cyclePrice}</span>
                )}
              </div>

              <div style={styles.cardFooter}>
                <span style={styles.refId}>Ref: #{item._id.slice(-6).toUpperCase()}</span>
                <span style={styles.viewLink}>View Declaration ›</span>
              </div>
            </div>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={styles.paginationRow}>
              <button
                type="button"
                style={styles.pageBtn}
                disabled={page <= 1}
                onClick={() => fetchDeclarations(selectedShopId, searchTerm, page - 1)}
              >
                ‹ Previous
              </button>
              <span style={styles.pageIndicator}>
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                style={styles.pageBtn}
                disabled={page >= totalPages}
                onClick={() => fetchDeclarations(selectedShopId, searchTerm, page + 1)}
              >
                Next ›
              </button>
            </div>
          )}
        </div>
      )}
    </MobileLayout>
  );
};

const styles = {
  filterCard: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '14px',
    border: '1px solid #e2e8f0',
    marginBottom: '14px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
  },
  shopFilterRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    marginBottom: '10px',
  },
  filterLabel: {
    fontSize: '12px',
    fontWeight: '700',
    color: '#334155',
  },
  shopSelect: {
    width: '100%',
    height: '44px',
    borderRadius: '10px',
    border: '1px solid #cbd5e1',
    padding: '0 12px',
    fontSize: '14px',
    backgroundColor: '#f8fafc',
    color: '#0f172a',
    outline: 'none',
  },
  searchRow: {
    display: 'flex',
    gap: '8px',
  },
  searchInput: {
    flex: 1,
    height: '42px',
    borderRadius: '10px',
    border: '1px solid #cbd5e1',
    padding: '0 12px',
    fontSize: '15px',
    boxSizing: 'border-box',
    outline: 'none',
    backgroundColor: '#f8fafc',
  },
  searchBtn: {
    backgroundColor: '#1a56db',
    color: '#ffffff',
    border: 'none',
    borderRadius: '10px',
    padding: '0 14px',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  resultsHeader: {
    marginBottom: '10px',
    padding: '0 2px',
  },
  resultsCount: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#64748b',
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
  emptyState: {
    backgroundColor: '#ffffff',
    borderRadius: '18px',
    padding: '36px 20px',
    textAlign: 'center',
    border: '1px dashed #cbd5e1',
  },
  emptyIcon: {
    fontSize: '36px',
  },
  emptyTitle: {
    margin: '10px 0 4px 0',
    fontSize: '16px',
    fontWeight: '700',
    color: '#0f172a',
  },
  emptySub: {
    margin: 0,
    fontSize: '13px',
    color: '#64748b',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '16px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
    cursor: 'pointer',
    touchAction: 'manipulation',
  },
  cardTop: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '6px',
  },
  shopBadge: {
    backgroundColor: '#eff6ff',
    color: '#1a56db',
    fontSize: '11px',
    fontWeight: '800',
    borderRadius: '6px',
    padding: '3px 8px',
  },
  dateTag: {
    fontSize: '11px',
    color: '#94a3b8',
    fontWeight: '500',
  },
  customerName: {
    margin: '0 0 4px 0',
    fontSize: '16px',
    fontWeight: '800',
    color: '#0f172a',
  },
  bikeLine: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginBottom: '6px',
  },
  bikeIcon: {
    fontSize: '13px',
  },
  bikeTitle: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#1a56db',
  },
  tagsRow: {
    display: 'flex',
    gap: '6px',
    marginBottom: '8px',
  },
  tag: {
    backgroundColor: '#f1f5f9',
    color: '#334155',
    fontSize: '11px',
    fontWeight: '600',
    padding: '2px 6px',
    borderRadius: '6px',
  },
  tagPrice: {
    backgroundColor: '#fef3c7',
    color: '#92400e',
    fontSize: '11px',
    fontWeight: '700',
    padding: '2px 6px',
    borderRadius: '6px',
  },
  cardFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTop: '1px solid #f1f5f9',
    paddingTop: '8px',
  },
  refId: {
    fontSize: '11px',
    color: '#94a3b8',
    fontWeight: '600',
  },
  viewLink: {
    fontSize: '12px',
    color: '#1a56db',
    fontWeight: '700',
  },
  paginationRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: '12px',
    padding: '12px 4px',
  },
  pageBtn: {
    backgroundColor: '#ffffff',
    border: '1px solid #cbd5e1',
    borderRadius: '10px',
    padding: '8px 14px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#334155',
    cursor: 'pointer',
  },
  pageIndicator: {
    fontSize: '13px',
    color: '#64748b',
    fontWeight: '600',
  },
};
