import React, { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function AdminLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const navItemStyle = ({ isActive }) => ({
    padding: '8px 16px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    color: isActive ? '#2563eb' : '#64748b',
    backgroundColor: isActive ? '#eff6ff' : 'transparent',
    transition: 'all 0.15s ease-in-out',
    textDecoration: 'none',
  });

  return (
    <div style={styles.container}>
      {/* ── Top Navigation Bar ────────────────────────────── */}
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <div style={styles.brandRow}>
            <Link to="/admin/dashboard" style={styles.brandLink}>
              <div style={styles.brandLogo}>🚲</div>
              <div>
                <span style={styles.brandTag}>PixxTechnologiees UK</span>
                <h1 style={styles.brandTitle}>Bicycle Owner Declarations</h1>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav style={styles.desktopNav}>
            <NavLink to="/admin/dashboard" style={navItemStyle}>
              Dashboard
            </NavLink>
            <NavLink to="/admin/declarations" style={navItemStyle}>
              Declarations
            </NavLink>
            <NavLink to="/admin/shops" style={navItemStyle}>
              Shops
            </NavLink>
            <NavLink to="/admin/users" style={navItemStyle}>
              Users
            </NavLink>
          </nav>

          {/* User Profile & Sign Out */}
          <div style={styles.userSection}>
            <div style={styles.userInfo}>
              <span style={styles.userName}>{user?.name || 'Administrator'}</span>
              <span style={styles.roleBadge}>ADMIN</span>
            </div>
            <button onClick={handleLogout} style={styles.logoutBtn} title="Sign Out">
              Sign Out
            </button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen((v) => !v)}
              style={styles.mobileMenuToggle}
              aria-label="Toggle navigation"
            >
              {mobileMenuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div style={styles.mobileNavDropdown}>
            <NavLink
              to="/admin/dashboard"
              style={navItemStyle}
              onClick={() => setMobileMenuOpen(false)}
            >
              Dashboard
            </NavLink>
            <NavLink
              to="/admin/declarations"
              style={navItemStyle}
              onClick={() => setMobileMenuOpen(false)}
            >
              Declarations
            </NavLink>
            <NavLink
              to="/admin/shops"
              style={navItemStyle}
              onClick={() => setMobileMenuOpen(false)}
            >
              Shops
            </NavLink>
            <NavLink
              to="/admin/users"
              style={navItemStyle}
              onClick={() => setMobileMenuOpen(false)}
            >
              Users
            </NavLink>
            <div style={styles.mobileUserDivider}>
              <button
                onClick={handleLogout}
                style={{ ...styles.logoutBtn, width: '100%', marginTop: '8px' }}
              >
                Sign Out ({user?.name})
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ── Page Content ─────────────────────────────────── */}
      <main style={styles.main}>{children}</main>

      {/* ── Footer ───────────────────────────────────────── */}
      <footer style={styles.footer}>
        <div style={styles.footerInner}>
          <p>© {new Date().getFullYear()} PixxTechnologiees UK — Central Administration System.</p>
          <p style={styles.footerNotice}>
            🔒 Strict Shop-Level Isolation & Role-Based Access Control Active.
          </p>
        </div>
      </footer>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #e2e8f0',
    position: 'sticky',
    top: 0,
    zIndex: 40,
    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.04)',
  },
  headerInner: {
    maxWidth: '1280px',
    margin: '0 auto',
    padding: '12px 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
  },
  brandRow: {
    display: 'flex',
    alignItems: 'center',
  },
  brandLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    textDecoration: 'none',
  },
  brandLogo: {
    width: '42px',
    height: '42px',
    borderRadius: '10px',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '22px',
  },
  brandTag: {
    display: 'block',
    fontSize: '11px',
    fontWeight: '700',
    letterSpacing: '0.8px',
    textTransform: 'uppercase',
    color: '#2563eb',
  },
  brandTitle: {
    margin: 0,
    fontSize: '16px',
    fontWeight: '700',
    color: '#0f172a',
  },
  desktopNav: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  userSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },
  userInfo: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '2px',
  },
  userName: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#1e293b',
  },
  roleBadge: {
    fontSize: '10px',
    fontWeight: '700',
    padding: '1px 6px',
    borderRadius: '4px',
    backgroundColor: '#dbeafe',
    color: '#1d4ed8',
  },
  logoutBtn: {
    backgroundColor: '#fee2e2',
    color: '#dc2626',
    border: '1px solid #fecaca',
    padding: '7px 14px',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  mobileMenuToggle: {
    display: 'none',
    background: 'none',
    border: 'none',
    fontSize: '22px',
    color: '#0f172a',
    cursor: 'pointer',
    padding: '4px',
  },
  mobileNavDropdown: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    padding: '12px 24px',
    borderTop: '1px solid #e2e8f0',
    backgroundColor: '#ffffff',
  },
  mobileUserDivider: {
    borderTop: '1px solid #e2e8f0',
    paddingTop: '8px',
  },
  main: {
    flex: 1,
    maxWidth: '1280px',
    width: '100%',
    margin: '0 auto',
    padding: '24px',
    boxSizing: 'border-box',
  },
  footer: {
    backgroundColor: '#ffffff',
    borderTop: '1px solid #e2e8f0',
    padding: '16px 24px',
    marginTop: 'auto',
  },
  footerInner: {
    maxWidth: '1280px',
    margin: '0 auto',
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
    fontSize: '12px',
    color: '#64748b',
  },
  footerNotice: {
    fontWeight: '500',
  },
};

export default AdminLayout;
