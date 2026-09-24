import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await login(email.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Brand Header */}
        <div style={styles.logoBox}>
          <img
            src="/logo.png"
            alt="Pixx Logo"
            style={styles.logo}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>

        <span style={styles.brandSubtitle}>PixxTechnologiees</span>
        <h1 style={styles.brandTitle}>Bicycle Owner's<br />Declaration System</h1>
        <p style={styles.loginPill}>Shop Staff Sign In</p>

        {error && (
          <div style={styles.errorBox}>
            <span style={styles.errorIcon}>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Email Address</label>
            <input
              type="email"
              style={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. camden@pixx.co.uk"
              required
              autoCapitalize="none"
              autoComplete="email"
              disabled={isSubmitting}
            />
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              style={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
              disabled={isSubmitting}
            />
          </div>

          <button
            type="submit"
            style={{
              ...styles.submitBtn,
              opacity: isSubmitting ? 0.7 : 1,
            }}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={styles.infoCard}>
          <div style={styles.infoHeader}>
            <span style={styles.infoIcon}>📋</span>
            <span style={styles.infoTitle}>What is Included in This Portal?</span>
          </div>
          <p style={styles.infoDescription}>
            Official bicycle ownership verification and anti-theft registry system for authorized PixxTechnologiees retail stores:
          </p>
          <ul style={styles.infoList}>
            <li style={styles.infoListItem}>
              <strong>📄 Digital Declaration Form:</strong> Customer contact details and signed proof-of-purchase declaration.
            </li>
            <li style={styles.infoListItem}>
              <strong>📸 4-Point Photo Verification:</strong> Customer Photo, Photo ID, Bicycle, and Purchase Documentation.
            </li>
            <li style={styles.infoListItem}>
              <strong>🚲 Frame & Serial Tracking:</strong> Anti-theft ownership records retrievable by police and shop staff.
            </li>
            <li style={styles.infoListItem}>
              <strong>🏪 6 Partner Branches:</strong> Station Cycles, Camden Cycles, Chelsea Bikes, Edgware Cycles, Southwark Cycles, and Leebridge Cycles.
            </li>
          </ul>

          <div style={styles.pwaTip}>
            <span style={styles.pwaTipIcon}>📲</span>
            <span style={styles.pwaTipText}>
              <strong>iPhone / Mobile App:</strong> Tap Safari Share (<span style={{ fontSize: '13px' }}>⬆️</span>) &rarr; <strong>"Add to Home Screen"</strong> to use as an app without App Store fees.
            </span>
          </div>
        </div>

        <p style={styles.footerNote}>
          Authorized shop staff portal &copy; {new Date().getFullYear()} PixxTechnologiees. All rights reserved.
        </p>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    padding: '20px',
    boxSizing: 'border-box',
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  card: {
    width: '100%',
    maxWidth: '380px',
    backgroundColor: '#ffffff',
    borderRadius: '24px',
    padding: '32px 24px',
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.03)',
    border: '1px solid #e2e8f0',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  logoBox: {
    width: '80px',
    height: '80px',
    borderRadius: '20px',
    backgroundColor: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '16px',
    boxShadow: '0 4px 14px rgba(0, 0, 0, 0.08)',
    border: '1px solid #f1f5f9',
    overflow: 'hidden',
  },
  logo: {
    width: '85%',
    height: '85%',
    objectFit: 'contain',
  },
  brandSubtitle: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#1a56db',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    marginBottom: '4px',
  },
  brandTitle: {
    margin: '0 0 10px 0',
    fontSize: '20px',
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
    lineHeight: '1.25',
  },
  loginPill: {
    margin: '0 0 24px 0',
    fontSize: '13px',
    color: '#64748b',
    backgroundColor: '#f1f5f9',
    padding: '4px 14px',
    borderRadius: '16px',
    fontWeight: '600',
  },
  errorBox: {
    width: '100%',
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '12px',
    padding: '12px',
    color: '#b91c1c',
    fontSize: '13px',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '18px',
    boxSizing: 'border-box',
  },
  errorIcon: {
    fontSize: '16px',
  },
  form: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#334155',
  },
  input: {
    width: '100%',
    height: '48px',
    borderRadius: '12px',
    border: '1px solid #cbd5e1',
    padding: '0 14px',
    fontSize: '16px', // Prevents iOS Safari from zooming on focus!
    boxSizing: 'border-box',
    backgroundColor: '#f8fafc',
    color: '#0f172a',
    outline: 'none',
  },
  submitBtn: {
    width: '100%',
    height: '50px',
    borderRadius: '12px',
    backgroundColor: '#1a56db',
    color: '#ffffff',
    fontSize: '16px',
    fontWeight: '700',
    border: 'none',
    cursor: 'pointer',
    marginTop: '6px',
    boxShadow: '0 4px 12px rgba(26, 86, 219, 0.3)',
    touchAction: 'manipulation',
  },
  footerNote: {
    margin: '20px 0 0 0',
    fontSize: '11px',
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: '1.4',
  },
  infoCard: {
    marginTop: '24px',
    padding: '16px',
    backgroundColor: '#f8fafc',
    borderRadius: '16px',
    border: '1px solid #e2e8f0',
    width: '100%',
    boxSizing: 'border-box',
    textAlign: 'left',
  },
  infoHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px',
  },
  infoIcon: {
    fontSize: '16px',
  },
  infoTitle: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#1e293b',
  },
  infoDescription: {
    fontSize: '12px',
    color: '#64748b',
    margin: '0 0 10px 0',
    lineHeight: '1.45',
  },
  infoList: {
    margin: '0 0 12px 0',
    paddingLeft: '18px',
    fontSize: '12px',
    color: '#334155',
    lineHeight: '1.5',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  infoListItem: {
    lineHeight: '1.4',
  },
  pwaTip: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
    backgroundColor: '#eff6ff',
    border: '1px solid #bfdbfe',
    borderRadius: '10px',
    padding: '10px 12px',
    marginTop: '8px',
  },
  pwaTipIcon: {
    fontSize: '16px',
    lineHeight: '1.2',
  },
  pwaTipText: {
    fontSize: '11.5px',
    color: '#1e40af',
    lineHeight: '1.45',
  },
};
