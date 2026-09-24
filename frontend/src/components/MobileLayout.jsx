import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const MobileLayout = ({ children, title, showBack = false }) => {
  const { user, logout, shopName, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to sign out?')) {
      logout();
      navigate('/login');
    }
  };

  const inAdminSection = location.pathname.startsWith('/admin');

  return (
    <div style={styles.appWrapper}>
      {/* ── Fixed Mobile Header ───────────────────────── */}
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <div style={styles.headerLeft}>
            {showBack ? (
              <button
                type="button"
                style={styles.backBtn}
                onClick={() => navigate(-1)}
                aria-label="Go back"
              >
                ‹ Back
              </button>
            ) : (
              <div
                style={styles.brandRow}
                onClick={() => navigate(inAdminSection ? '/admin' : '/')}
              >
                <img
                  src="/logo.png"
                  alt="Pixx Logo"
                  style={styles.headerLogo}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <div style={styles.headerTitles}>
                  <span style={styles.headerBrand}>
                    PixxTechnologiees {isAdmin && '• ADMIN'}
                  </span>
                  <span style={styles.headerShop}>
                    {inAdminSection ? 'Central Management' : shopName}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div style={styles.headerRight}>
            {isAdmin && (
              <button
                type="button"
                style={{
                  ...styles.adminSwitchBtn,
                  backgroundColor: inAdminSection ? '#eff6ff' : '#0f172a',
                  color: inAdminSection ? '#1a56db' : '#ffffff',
                }}
                onClick={() => navigate(inAdminSection ? '/' : '/admin')}
              >
                {inAdminSection ? '🏪 Shop View' : '⚙️ Admin'}
              </button>
            )}

            <div style={styles.userBadge}>
              <span style={styles.userDot} />
              <span style={styles.userName}>
                {user?.name?.split(' ')[0] || 'Staff'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* ── Main Scrollable Body ───────────────────────── */}
      <main style={styles.mainContent}>
        {title && (
          <div style={styles.pageTitleBar}>
            <h1 style={styles.pageTitle}>{title}</h1>
          </div>
        )}
        {children}
      </main>

      {/* ── Sticky Bottom Mobile Navigation Bar ─────────── */}
      <nav style={styles.bottomNav}>
        <div style={styles.bottomNavInner}>
          {inAdminSection ? (
            /* ── Admin Mode Navigation ── */
            <>
              <NavLink
                to="/admin"
                end
                style={({ isActive }) => ({
                  ...styles.navItem,
                  ...(isActive ? styles.navItemActive : {}),
                })}
              >
                <span style={styles.navIcon}>📊</span>
                <span style={styles.navLabel}>Admin</span>
              </NavLink>

              <NavLink
                to="/admin/declarations"
                style={({ isActive }) => ({
                  ...styles.navItem,
                  ...(isActive ? styles.navItemActive : {}),
                })}
              >
                <span style={styles.navIcon}>📋</span>
                <span style={styles.navLabel}>All Records</span>
              </NavLink>

              <NavLink
                to="/admin/shops"
                style={({ isActive }) => ({
                  ...styles.navItem,
                  ...(isActive ? styles.navItemActive : {}),
                })}
              >
                <span style={styles.navIcon}>🏪</span>
                <span style={styles.navLabel}>Shops</span>
              </NavLink>

              <NavLink
                to="/admin/users"
                style={({ isActive }) => ({
                  ...styles.navItem,
                  ...(isActive ? styles.navItemActive : {}),
                })}
              >
                <span style={styles.navIcon}>👥</span>
                <span style={styles.navLabel}>Users</span>
              </NavLink>

              <NavLink
                to="/"
                style={styles.navItem}
              >
                <span style={styles.navIcon}>🚲</span>
                <span style={styles.navLabel}>Shop Form</span>
              </NavLink>
            </>
          ) : (
            /* ── Shop Staff Mode Navigation ── */
            <>
              <NavLink
                to="/"
                end
                style={({ isActive }) => ({
                  ...styles.navItem,
                  ...(isActive ? styles.navItemActive : {}),
                })}
              >
                <span style={styles.navIcon}>🏠</span>
                <span style={styles.navLabel}>Home</span>
              </NavLink>

              <NavLink
                to="/create-declaration"
                style={({ isActive }) => ({
                  ...styles.navItem,
                  ...(isActive ? styles.navItemActive : {}),
                })}
              >
                <div style={styles.newActionIcon}>＋</div>
                <span style={styles.navLabel}>New Form</span>
              </NavLink>

              <NavLink
                to="/declarations"
                style={({ isActive }) => ({
                  ...styles.navItem,
                  ...(isActive ? styles.navItemActive : {}),
                })}
              >
                <span style={styles.navIcon}>📋</span>
                <span style={styles.navLabel}>Records</span>
              </NavLink>

              {isAdmin && (
                <NavLink
                  to="/admin"
                  style={({ isActive }) => ({
                    ...styles.navItem,
                    ...(isActive ? styles.navItemActive : {}),
                  })}
                >
                  <span style={styles.navIcon}>⚙️</span>
                  <span style={styles.navLabel}>Admin</span>
                </NavLink>
              )}

              <button
                type="button"
                style={styles.navItemBtn}
                onClick={handleLogout}
                aria-label="Sign out"
              >
                <span style={styles.navIcon}>🚪</span>
                <span style={styles.navLabel}>Sign Out</span>
              </button>
            </>
          )}
        </div>
      </nav>
    </div>
  );
};

const styles = {
  appWrapper: {
    minHeight: '100vh',
    backgroundColor: '#f8fafc',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  header: {
    position: 'sticky',
    top: 0,
    zIndex: 100,
    width: '100%',
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #e2e8f0',
    paddingTop: 'env(safe-area-inset-top, 0px)',
    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
  },
  headerInner: {
    maxWidth: '640px',
    margin: '0 auto',
    height: '56px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 16px',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
  },
  brandRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    cursor: 'pointer',
  },
  headerLogo: {
    width: '34px',
    height: '34px',
    borderRadius: '8px',
    objectFit: 'contain',
    border: '1px solid #e2e8f0',
  },
  headerTitles: {
    display: 'flex',
    flexDirection: 'column',
  },
  headerBrand: {
    fontSize: '10px',
    fontWeight: '700',
    color: '#1a56db',
    textTransform: 'uppercase',
    letterSpacing: '0.8px',
  },
  headerShop: {
    fontSize: '14px',
    fontWeight: '800',
    color: '#0f172a',
    lineHeight: '1.2',
  },
  backBtn: {
    background: 'none',
    border: 'none',
    color: '#1a56db',
    fontSize: '16px',
    fontWeight: '700',
    cursor: 'pointer',
    padding: '8px 0',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  adminSwitchBtn: {
    border: 'none',
    borderRadius: '10px',
    padding: '5px 9px',
    fontSize: '11px',
    fontWeight: '700',
    cursor: 'pointer',
    touchAction: 'manipulation',
  },
  userBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#f1f5f9',
    borderRadius: '20px',
    padding: '4px 10px',
  },
  userDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#16a34a',
  },
  userName: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#334155',
  },
  mainContent: {
    width: '100%',
    maxWidth: '640px',
    flex: 1,
    padding: '16px 16px calc(env(safe-area-inset-bottom, 0px) + 84px) 16px',
    boxSizing: 'border-box',
  },
  pageTitleBar: {
    marginBottom: '16px',
  },
  pageTitle: {
    margin: 0,
    fontSize: '22px',
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: '-0.3px',
  },
  bottomNav: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    backdropFilter: 'blur(10px)',
    borderTop: '1px solid #e2e8f0',
    paddingBottom: 'env(safe-area-inset-bottom, 0px)',
  },
  bottomNavInner: {
    maxWidth: '640px',
    margin: '0 auto',
    height: '62px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-around',
    padding: '0 4px',
  },
  navItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textDecoration: 'none',
    color: '#64748b',
    flex: 1,
    height: '100%',
    touchAction: 'manipulation',
    cursor: 'pointer',
  },
  navItemActive: {
    color: '#1a56db',
    fontWeight: '700',
  },
  navItemBtn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'none',
    border: 'none',
    color: '#64748b',
    flex: 1,
    height: '100%',
    touchAction: 'manipulation',
    cursor: 'pointer',
    padding: 0,
  },
  navIcon: {
    fontSize: '20px',
    marginBottom: '2px',
    lineHeight: 1,
  },
  navLabel: {
    fontSize: '10px',
    fontWeight: '600',
  },
  newActionIcon: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    backgroundColor: '#1a56db',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
    fontWeight: 'bold',
    marginBottom: '2px',
    boxShadow: '0 2px 5px rgba(26, 86, 219, 0.3)',
  },
};
