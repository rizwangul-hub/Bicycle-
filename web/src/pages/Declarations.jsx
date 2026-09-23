import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { declarationService } from '../services/declaration.service';
import AdminLayout from '../components/AdminLayout';

function formatDate(iso) {
  if (!iso) return 'Not provided';
  try {
    return new Date(iso).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return 'Not provided';
  }
}

export default function Declarations() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialShopId = searchParams.get('shopId') || '';

  const [declarations, setDeclarations] = useState([]);
  const [shops, setShops] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  
  // Search & Filter State
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedShop, setSelectedShop] = useState(initialShopId);
  const [bicycleMake, setBicycleMake] = useState('');
  const [bicycleModel, setBicycleModel] = useState('');
  const [bicycleColour, setBicycleColour] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Load shops list for the filter dropdown
  useEffect(() => {
    const fetchShops = async () => {
      if (!token) return;
      try {
        const list = await declarationService.getShops(token);
        setShops(list || []);
      } catch (err) {
        console.error('Failed to load shops:', err);
      }
    };
    fetchShops();
  }, [token]);

  // Fetch declarations when filters or page change
  const fetchDeclarations = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await declarationService.getDeclarations(token, {
        page: currentPage,
        limit: 20,
        search: debouncedSearch || undefined,
        shopId: selectedShop || undefined,
        bicycleMake: bicycleMake.trim() || undefined,
        bicycleModel: bicycleModel.trim() || undefined,
        bicycleColour: bicycleColour.trim() || undefined,
        date: filterDate || undefined,
      });

      setDeclarations(res.data || []);
      if (res.pagination) {
        setPagination(res.pagination);
      }
    } catch (err) {
      setError(err.message || 'Failed to retrieve declarations.');
    } finally {
      setIsLoading(false);
    }
  }, [token, currentPage, debouncedSearch, selectedShop, bicycleMake, bicycleModel, bicycleColour, filterDate]);

  useEffect(() => {
    fetchDeclarations();
  }, [fetchDeclarations]);

  const handleShopChange = (e) => {
    const newShopId = e.target.value;
    setSelectedShop(newShopId);
    setCurrentPage(1);
    if (newShopId) {
      setSearchParams({ shopId: newShopId });
    } else {
      setSearchParams({});
    }
  };

  const handleClearFilters = () => {
    setSearch('');
    setSelectedShop('');
    setBicycleMake('');
    setBicycleModel('');
    setBicycleColour('');
    setFilterDate('');
    setCurrentPage(1);
    setSearchParams({});
  };

  const hasActiveFilters = Boolean(
    search || selectedShop || bicycleMake || bicycleModel || bicycleColour || filterDate
  );

  return (
    <AdminLayout>
      <div style={styles.pageHeader}>
        <div>
          <h2 style={styles.pageTitle}>Declarations Registry</h2>
          <p style={styles.pageSubtitle}>
            Browse, search, and manage all Bicycle Owner Declarations across all 6 shops.
          </p>
        </div>
      </div>

      {/* ── Search & Filter Controls ──────────────────────── */}
      <div style={styles.controlsCard}>
        {/* Search bar */}
        <div style={styles.searchBox}>
          <span style={styles.searchIcon}>🔍</span>
          <input
            type="text"
            placeholder="Search by customer name, model, make, frame #, phone, mobile, email, cash purchase page #..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={styles.searchInput}
          />
          {search && (
            <button onClick={() => setSearch('')} style={styles.clearSearchBtn} title="Clear search">
              ✕
            </button>
          )}
        </div>

        {/* Filter bar */}
        <div style={styles.filtersGrid}>
          {/* Shop Filter */}
          <div style={styles.filterItem}>
            <label style={styles.filterLabel}>Shop Location</label>
            <select
              value={selectedShop}
              onChange={handleShopChange}
              style={styles.selectFilter}
            >
              <option value="">All Shops (6 Locations)</option>
              {shops.map((shop) => (
                <option key={shop._id} value={shop._id}>
                  {shop.name}
                </option>
              ))}
            </select>
          </div>

          {/* Bicycle Make Filter */}
          <div style={styles.filterItem}>
            <label style={styles.filterLabel}>Bicycle Make</label>
            <input
              type="text"
              placeholder="e.g. Trek, Giant..."
              value={bicycleMake}
              onChange={(e) => {
                setBicycleMake(e.target.value);
                setCurrentPage(1);
              }}
              style={styles.inputFilter}
            />
          </div>

          {/* Bicycle Model Filter */}
          <div style={styles.filterItem}>
            <label style={styles.filterLabel}>Bicycle Model</label>
            <input
              type="text"
              placeholder="e.g. Marlin 5..."
              value={bicycleModel}
              onChange={(e) => {
                setBicycleModel(e.target.value);
                setCurrentPage(1);
              }}
              style={styles.inputFilter}
            />
          </div>

          {/* Colour Filter */}
          <div style={styles.filterItem}>
            <label style={styles.filterLabel}>Colour</label>
            <input
              type="text"
              placeholder="e.g. Black, Blue..."
              value={bicycleColour}
              onChange={(e) => {
                setBicycleColour(e.target.value);
                setCurrentPage(1);
              }}
              style={styles.inputFilter}
            />
          </div>

          {/* Date Filter */}
          <div style={styles.filterItem}>
            <label style={styles.filterLabel}>Declaration Date</label>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => {
                setFilterDate(e.target.value);
                setCurrentPage(1);
              }}
              style={styles.inputFilter}
            />
          </div>

          {hasActiveFilters && (
            <div style={styles.filterActionWrap}>
              <button onClick={handleClearFilters} style={styles.resetBtn}>
                Clear All Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Declarations Table ────────────────────────────── */}
      <div style={styles.tableCard}>
        {error ? (
          <div style={styles.errorBox}>
            <p>⚠️ {error}</p>
            <button onClick={fetchDeclarations} style={styles.retryBtn}>
              Retry
            </button>
          </div>
        ) : isLoading ? (
          <div style={styles.loadingBox}>
            <div style={styles.spinner} />
            <p>Loading declarations from database...</p>
          </div>
        ) : declarations.length === 0 ? (
          <div style={styles.emptyBox}>
            <h3>No Declarations Found</h3>
            <p>
              {hasActiveFilters
                ? 'No records match your filters or search criteria. Try adjusting or clearing filters.'
                : 'No declarations recorded in the system yet.'}
            </p>
            {hasActiveFilters && (
              <button onClick={handleClearFilters} style={styles.resetBtn}>
                Reset All Filters
              </button>
            )}
          </div>
        ) : (
          <div style={styles.tableResponsive}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Customer Name</th>
                  <th style={styles.th}>Bicycle Model</th>
                  <th style={styles.th}>Bicycle Make</th>
                  <th style={styles.th}>Colour</th>
                  <th style={styles.th}>Frame Number</th>
                  <th style={styles.th}>Shop</th>
                  <th style={styles.th}>Date</th>
                  <th style={styles.th}>Created Date</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {declarations.map((decl) => {
                  const shopName =
                    typeof decl.shopId === 'object' && decl.shopId !== null
                      ? decl.shopId.name
                      : 'Shop';

                  return (
                    <tr
                      key={decl._id}
                      style={styles.tr}
                      onClick={() => navigate(`/admin/declarations/${decl._id}`)}
                    >
                      <td style={styles.td}>
                        <strong>{decl.customerName || 'Not provided'}</strong>
                      </td>
                      <td style={styles.td}>
                        {decl.bicycleModel || 'Not provided'}
                      </td>
                      <td style={styles.td}>
                        {decl.bicycleMake || 'Not provided'}
                      </td>
                      <td style={styles.td}>
                        {decl.bicycleColour || 'Not provided'}
                      </td>
                      <td style={styles.td}>
                        <span style={styles.mono}>{decl.frameNumber || 'Not provided'}</span>
                      </td>
                      <td style={styles.td}>
                        <span style={styles.shopBadge}>{shopName}</span>
                      </td>
                      <td style={styles.td}>{formatDate(decl.date)}</td>
                      <td style={styles.td}>{formatDate(decl.createdAt)}</td>
                      <td style={styles.td}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/admin/declarations/${decl._id}`);
                          }}
                          style={styles.viewBtn}
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

        {/* ── Pagination Controls ─────────────────────────── */}
        {!isLoading && declarations.length > 0 && (
          <div style={styles.paginationRow}>
            <span style={styles.paginationInfo}>
              Showing page <strong>{pagination.page}</strong> of <strong>{pagination.totalPages}</strong> (
              <strong>{pagination.total}</strong> total records — 20 per page)
            </span>
            <div style={styles.paginationButtons}>
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                style={{
                  ...styles.pageBtn,
                  opacity: currentPage <= 1 ? 0.45 : 1,
                  cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
                }}
              >
                &larr; Previous
              </button>
              <button
                disabled={currentPage >= pagination.totalPages}
                onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                style={{
                  ...styles.pageBtn,
                  opacity: currentPage >= pagination.totalPages ? 0.45 : 1,
                  cursor: currentPage >= pagination.totalPages ? 'not-allowed' : 'pointer',
                }}
              >
                Next &rarr;
              </button>
            </div>
          </div>
        )}
      </div>
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
  controlsCard: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    padding: '20px',
    marginBottom: '24px',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.04)',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    padding: '0 14px',
    height: '46px',
    width: '100%',
    boxSizing: 'border-box',
  },
  searchIcon: {
    fontSize: '16px',
    marginRight: '10px',
    color: '#94a3b8',
  },
  searchInput: {
    border: 'none',
    outline: 'none',
    backgroundColor: 'transparent',
    fontSize: '14px',
    color: '#0f172a',
    width: '100%',
  },
  clearSearchBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#94a3b8',
    fontSize: '14px',
    padding: '4px',
  },
  filtersGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '12px',
    alignItems: 'flex-end',
  },
  filterItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  filterLabel: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#475569',
  },
  selectFilter: {
    height: '38px',
    border: '1px solid #cbd5e1',
    borderRadius: '6px',
    padding: '0 10px',
    fontSize: '13px',
    color: '#0f172a',
    backgroundColor: '#ffffff',
    outline: 'none',
    cursor: 'pointer',
  },
  inputFilter: {
    height: '38px',
    border: '1px solid #cbd5e1',
    borderRadius: '6px',
    padding: '0 10px',
    fontSize: '13px',
    color: '#0f172a',
    backgroundColor: '#ffffff',
    outline: 'none',
    boxSizing: 'border-box',
  },
  filterActionWrap: {
    display: 'flex',
    alignItems: 'flex-end',
  },
  resetBtn: {
    height: '38px',
    padding: '0 14px',
    borderRadius: '6px',
    border: '1px solid #cbd5e1',
    backgroundColor: '#f1f5f9',
    color: '#475569',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  tableCard: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    overflow: 'hidden',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.04)',
  },
  tableResponsive: {
    overflowX: 'auto',
    width: '100%',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
    fontSize: '14px',
  },
  th: {
    backgroundColor: '#f8fafc',
    color: '#475569',
    fontWeight: '600',
    padding: '12px 16px',
    borderBottom: '1px solid #e2e8f0',
    fontSize: '12px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    whiteSpace: 'nowrap',
  },
  tr: {
    borderBottom: '1px solid #f1f5f9',
    cursor: 'pointer',
    transition: 'background-color 0.15s ease',
  },
  td: {
    padding: '14px 16px',
    color: '#1e293b',
    whiteSpace: 'nowrap',
  },
  mono: {
    fontFamily: 'monospace',
    fontWeight: '600',
    color: '#334155',
  },
  shopBadge: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#2563eb',
    backgroundColor: '#eff6ff',
    padding: '3px 8px',
    borderRadius: '4px',
  },
  viewBtn: {
    backgroundColor: '#f1f5f9',
    color: '#2563eb',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  paginationRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    borderTop: '1px solid #e2e8f0',
    backgroundColor: '#f8fafc',
    flexWrap: 'wrap',
    gap: '12px',
  },
  paginationInfo: {
    fontSize: '13px',
    color: '#64748b',
  },
  paginationButtons: {
    display: 'flex',
    gap: '8px',
  },
  pageBtn: {
    backgroundColor: '#ffffff',
    border: '1px solid #cbd5e1',
    borderRadius: '6px',
    padding: '6px 14px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#1e293b',
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
  retryBtn: {
    marginTop: '12px',
    backgroundColor: '#dc2626',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    padding: '8px 16px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  emptyBox: {
    padding: '60px 20px',
    textAlign: 'center',
    color: '#64748b',
  },
};
