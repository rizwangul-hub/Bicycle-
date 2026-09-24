import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MobileLayout } from '../components/MobileLayout';
import { declarationService } from '../services/declaration.service';

export const Declarations = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [declarations, setDeclarations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(() => searchParams.get('search') || '');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchDeclarations = async (term = searchTerm, targetPage = 1) => {
    setLoading(true);
    try {
      const response = await declarationService.list({
        search: term.trim() || undefined,
        page: targetPage,
        limit: 15,
      });
      setDeclarations(response.data || []);
      setTotalPages(response.pagination?.totalPages || 1);
      setTotalCount(response.pagination?.total || response.count || 0);
      setPage(targetPage);
    } catch (err) {
      console.warn('Error fetching declarations:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initialQuery = searchParams.get('search') || '';
    fetchDeclarations(initialQuery, 1);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      setSearchParams({ search: searchTerm.trim() });
    } else {
      setSearchParams({});
    }
    fetchDeclarations(searchTerm, 1);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setSearchParams({});
    fetchDeclarations('', 1);
  };

  return (
    <MobileLayout title="Declaration Records">
      {/* ── Search Bar ──────────────────────────────── */}
      <form onSubmit={handleSearchSubmit} style={styles.searchContainer}>
        <div style={styles.inputWrapper}>
          <span style={styles.searchIcon}>🔍</span>
          <input
            type="text"
            style={styles.searchInput}
            placeholder="Search by buyer, model, frame #..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              type="button"
              style={styles.clearBtn}
              onClick={handleClearSearch}
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>
        <button type="submit" style={styles.filterBtn}>
          Search
        </button>
      </form>

      {/* ── Summary & New Button ────────────────────── */}
      <div style={styles.toolbar}>
        <span style={styles.countLabel}>
          {totalCount} {totalCount === 1 ? 'Record' : 'Records'} Found
        </span>
        <button
          type="button"
          style={styles.newBtn}
          onClick={() => navigate('/create-declaration')}
        >
          ＋ New Declaration
        </button>
      </div>

      {/* ── Declarations Mobile Cards List ─────────── */}
      {loading ? (
        <div style={styles.loadingBox}>
          <div style={styles.spinner} />
          <span>Loading declarations...</span>
        </div>
      ) : declarations.length === 0 ? (
        <div style={styles.emptyState}>
          <span style={styles.emptyIcon}>📂</span>
          <h3 style={styles.emptyTitle}>No Records Found</h3>
          <p style={styles.emptySubtitle}>
            {searchTerm
              ? `No declaration matches "${searchTerm}". Try a different keyword.`
              : 'Your shop has not recorded any declarations yet.'}
          </p>
          <button
            type="button"
            style={styles.emptyActionBtn}
            onClick={() => navigate('/create-declaration')}
          >
            ＋ Add First Declaration
          </button>
        </div>
      ) : (
        <div style={styles.recordsList}>
          {declarations.map((item) => (
            <div
              key={item._id}
              style={styles.card}
              onClick={() => navigate(`/declarations/${item._id}`)}
            >
              <div style={styles.cardMain}>
                <div style={styles.cardHeader}>
                  <h4 style={styles.customerName}>{item.customerName}</h4>
                  <span style={styles.dateBadge}>
                    {item.date
                      ? new Date(item.date).toLocaleDateString('en-GB')
                      : new Date(item.createdAt).toLocaleDateString('en-GB')}
                  </span>
                </div>

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
                  {item.phone && (
                    <span style={styles.tagPhone}>📞 {item.phone}</span>
                  )}
                </div>

                <div style={styles.cardFooter}>
                  <span style={styles.refId}>ID: #{item._id.slice(-6).toUpperCase()}</span>
                  <span style={styles.viewLink}>View Details ›</span>
                </div>
              </div>
            </div>
          ))}

          {/* ── Pagination ────────────────────────────── */}
          {totalPages > 1 && (
            <div style={styles.paginationRow}>
              <button
                type="button"
                style={styles.pageBtn}
                disabled={page <= 1}
                onClick={() => fetchDeclarations(searchTerm, page - 1)}
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
                onClick={() => fetchDeclarations(searchTerm, page + 1)}
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
  searchContainer: {
    display: 'flex',
    gap: '8px',
    marginBottom: '12px',
  },
  inputWrapper: {
    position: 'relative',
    flex: 1,
    display: 'flex',
    alignItems: 'center',
  },
  searchIcon: {
    position: 'absolute',
    left: '12px',
    fontSize: '15px',
    color: '#94a3b8',
    pointerEvents: 'none',
  },
  searchInput: {
    width: '100%',
    height: '46px',
    borderRadius: '12px',
    border: '1px solid #cbd5e1',
    backgroundColor: '#ffffff',
    padding: '0 36px 0 36px',
    fontSize: '16px', // Prevents iOS Safari zoom
    color: '#0f172a',
    boxSizing: 'border-box',
    outline: 'none',
  },
  clearBtn: {
    position: 'absolute',
    right: '10px',
    background: 'none',
    border: 'none',
    fontSize: '14px',
    color: '#94a3b8',
    cursor: 'pointer',
    padding: '4px',
  },
  filterBtn: {
    backgroundColor: '#1a56db',
    color: '#ffffff',
    border: 'none',
    borderRadius: '12px',
    padding: '0 16px',
    fontSize: '14px',
    fontWeight: '700',
    cursor: 'pointer',
    touchAction: 'manipulation',
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '14px',
    padding: '0 2px',
  },
  countLabel: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#64748b',
  },
  newBtn: {
    backgroundColor: '#ffffff',
    border: '1px solid #cbd5e1',
    borderRadius: '10px',
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: '700',
    color: '#1a56db',
    cursor: 'pointer',
  },
  loadingBox: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '40px 20px',
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
    borderRadius: '20px',
    padding: '40px 20px',
    textAlign: 'center',
    border: '1px dashed #cbd5e1',
  },
  emptyIcon: {
    fontSize: '36px',
  },
  emptyTitle: {
    margin: '12px 0 6px 0',
    fontSize: '16px',
    fontWeight: '700',
    color: '#0f172a',
  },
  emptySubtitle: {
    margin: '0 0 18px 0',
    fontSize: '13px',
    color: '#64748b',
    lineHeight: '1.4',
  },
  emptyActionBtn: {
    backgroundColor: '#1a56db',
    color: '#ffffff',
    border: 'none',
    borderRadius: '12px',
    padding: '12px 20px',
    fontSize: '14px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  recordsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '16px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.02)',
    cursor: 'pointer',
    touchAction: 'manipulation',
  },
  cardMain: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  customerName: {
    margin: 0,
    fontSize: '16px',
    fontWeight: '800',
    color: '#0f172a',
  },
  dateBadge: {
    fontSize: '12px',
    color: '#64748b',
    fontWeight: '500',
  },
  bikeLine: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginTop: '2px',
  },
  bikeIcon: {
    fontSize: '14px',
  },
  bikeTitle: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#1a56db',
  },
  tagsRow: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap',
    marginTop: '4px',
  },
  tag: {
    backgroundColor: '#f1f5f9',
    color: '#334155',
    fontSize: '11px',
    fontWeight: '600',
    padding: '3px 8px',
    borderRadius: '6px',
  },
  tagPrice: {
    backgroundColor: '#fef3c7',
    color: '#92400e',
    fontSize: '11px',
    fontWeight: '700',
    padding: '3px 8px',
    borderRadius: '6px',
  },
  tagPhone: {
    backgroundColor: '#ecfdf5',
    color: '#065f46',
    fontSize: '11px',
    fontWeight: '600',
    padding: '3px 8px',
    borderRadius: '6px',
  },
  cardFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: '8px',
    paddingTop: '8px',
    borderTop: '1px solid #f1f5f9',
  },
  refId: {
    fontSize: '11px',
    color: '#94a3b8',
    fontWeight: '600',
    letterSpacing: '0.5px',
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
