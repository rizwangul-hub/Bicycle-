import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // PWA Install State
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [showGenericModal, setShowGenericModal] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  useEffect(() => {
    // Check if running in standalone mode (already installed as PWA)
    const checkStandalone = () => {
      const isStandaloneMode =
        window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true ||
        document.referrer.includes('android-app://');
      setIsInstalled(Boolean(isStandaloneMode));
    };
    checkStandalone();

    // Detect iOS
    const ua = window.navigator.userAgent.toLowerCase();
    const isAppleDevice = /iphone|ipad|ipod/.test(ua);
    setIsIOS(isAppleDevice);

    // Listen for Chromium PWA install prompt event
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    // Listen for successful PWA install
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice && choice.outcome === 'accepted') {
          setIsInstalled(true);
        }
        setDeferredPrompt(null);
      } catch (err) {
        console.warn('Install prompt error:', err);
      }
    } else if (isIOS) {
      setShowIOSModal(true);
    } else {
      setShowGenericModal(true);
    }
  };

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
            alt="Bicycle Purchases system Logo"
            style={styles.logo}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>

        <span style={styles.brandSubtitle}>PixxTechnologiees</span>
        <h1 style={styles.brandTitle}>Bicycle Purchases system</h1>
        <p style={styles.brandSubheading}>Owner's Declaration & Commercial Registry</p>
        <p style={styles.loginPill}>Shop Staff Sign In</p>

        {/* ── PWA Install App Section ─────────────────────────── */}
        <div style={styles.installBanner}>
          <div style={styles.installBannerHeader}>
            <div style={styles.installLogoThumb}>
              <img
                src="/logo.png"
                alt="App Icon"
                style={styles.installThumbImg}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
            <div style={styles.installMeta}>
              <span style={styles.installBadge}>Home Screen Shortcut</span>
              <strong style={styles.installAppName}>Bicycle Purchases system</strong>
              <span style={styles.installAppDesc}>
                Install with official logo for 1-tap mobile access
              </span>
            </div>
          </div>

          {isInstalled ? (
            <div style={styles.installedBadge}>
              <span style={{ fontSize: '15px' }}>✓</span>
              <span>App Installed on this device</span>
            </div>
          ) : (
            <button
              type="button"
              style={styles.installBtn}
              onClick={handleInstallClick}
              title="Add Bicycle Purchases system to home screen"
            >
              <span style={{ fontSize: '16px' }}>📲</span>
              <span>Install App on Mobile</span>
            </button>
          )}
        </div>

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
            <div style={styles.passwordWrapper}>
              <input
                type={showPassword ? 'text' : 'password'}
                style={styles.passwordInput}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                style={styles.eyeBtn}
                title={showPassword ? 'Hide password' : 'Show password'}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
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
            Official bicycle ownership verification and anti-theft registry system for authorized retail stores:
          </p>
          <ul style={styles.infoList}>
            <li style={styles.infoListItem}>
              <strong>📄 Digital Declaration Form:</strong> Customer details, bicycle specs, and signed proof-of-purchase.
            </li>
            <li style={styles.infoListItem}>
              <strong>📸 4-Point Photo Evidence:</strong> Customer portrait, Photo ID, Bicycle frame, and Invoices.
            </li>
            <li style={styles.infoListItem}>
              <strong>📥 Native PDF Generation:</strong> One-tap downloadable customer declaration certificate.
            </li>
            <li style={styles.infoListItem}>
              <strong>🚲 Anti-Theft Registry:</strong> Police & shop retrieval records across all partner branches.
            </li>
          </ul>

          <div style={styles.pwaTip} onClick={handleInstallClick} role="button" tabIndex={0}>
            <span style={styles.pwaTipIcon}>📲</span>
            <span style={styles.pwaTipText}>
              <strong>Install Shortcut:</strong> Tap the <em>"Install App on Mobile"</em> button above to place the <strong>Bicycle Purchases system</strong> icon with official logo on your home screen.
            </span>
          </div>
        </div>

        <p style={styles.footerNote}>
          Authorized shop staff portal &copy; {new Date().getFullYear()} PixxTechnologiees. All rights reserved.
        </p>
      </div>

      {/* ── iOS Install Guide Modal ───────────────────────────── */}
      {showIOSModal && (
        <div style={styles.modalOverlay} onClick={() => setShowIOSModal(false)}>
          <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div style={styles.modalIconWrap}>
                <img src="/logo.png" alt="App Logo" style={styles.modalLogo} />
              </div>
              <div style={styles.modalHeaderText}>
                <h3 style={styles.modalTitle}>Install on iPhone</h3>
                <span style={styles.modalSubtitle}>Bicycle Purchases system</span>
              </div>
              <button
                type="button"
                style={styles.modalCloseBtn}
                onClick={() => setShowIOSModal(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <p style={styles.modalInstructionIntro}>
              Follow these simple steps in Safari to add the app icon with its official logo to your home screen:
            </p>

            <div style={styles.stepsContainer}>
              <div style={styles.stepItem}>
                <div style={styles.stepNum}>1</div>
                <div style={styles.stepDetails}>
                  <span style={styles.stepTitle}>Tap Safari Share Button</span>
                  <span style={styles.stepDesc}>
                    Look at the bottom toolbar of Safari and tap the Share icon (
                    <span style={{ color: '#007aff', fontSize: '16px' }}>⬆️</span> square with arrow pointing up).
                  </span>
                </div>
              </div>

              <div style={styles.stepItem}>
                <div style={styles.stepNum}>2</div>
                <div style={styles.stepDetails}>
                  <span style={styles.stepTitle}>Select "Add to Home Screen"</span>
                  <span style={styles.stepDesc}>
                    Scroll down the sharing options and tap{' '}
                    <strong>"Add to Home Screen"</strong> (
                    <span style={{ fontSize: '15px' }}>➕</span>).
                  </span>
                </div>
              </div>

              <div style={styles.stepItem}>
                <div style={styles.stepNum}>3</div>
                <div style={styles.stepDetails}>
                  <span style={styles.stepTitle}>Tap "Add" in Top Right</span>
                  <span style={styles.stepDesc}>
                    Confirm the name <strong>"Bicycle Purchases system"</strong> and tap <strong>Add</strong>.
                  </span>
                </div>
              </div>
            </div>

            <div style={styles.modalHighlightBox}>
              <span>✨</span>
              <span>The app logo will appear on your iPhone home screen and open in full-screen mode like a native app!</span>
            </div>

            <button
              type="button"
              style={styles.modalDoneBtn}
              onClick={() => setShowIOSModal(false)}
            >
              Done / Got It
            </button>
          </div>
        </div>
      )}

      {/* ── Generic / Desktop Browser Install Guide Modal ────── */}
      {showGenericModal && (
        <div style={styles.modalOverlay} onClick={() => setShowGenericModal(false)}>
          <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div style={styles.modalIconWrap}>
                <img src="/logo.png" alt="App Logo" style={styles.modalLogo} />
              </div>
              <div style={styles.modalHeaderText}>
                <h3 style={styles.modalTitle}>Install App Shortcut</h3>
                <span style={styles.modalSubtitle}>Bicycle Purchases system</span>
              </div>
              <button
                type="button"
                style={styles.modalCloseBtn}
                onClick={() => setShowGenericModal(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <p style={styles.modalInstructionIntro}>
              Add <strong>Bicycle Purchases system</strong> to your home screen or desktop:
            </p>

            <div style={styles.stepsContainer}>
              <div style={styles.stepItem}>
                <div style={styles.stepNum}>1</div>
                <div style={styles.stepDetails}>
                  <span style={styles.stepTitle}>Open Browser Menu</span>
                  <span style={styles.stepDesc}>
                    Tap the browser menu icon (<strong>⋮</strong> or <strong>⋯</strong>) in the top or bottom corner of your screen.
                  </span>
                </div>
              </div>

              <div style={styles.stepItem}>
                <div style={styles.stepNum}>2</div>
                <div style={styles.stepDetails}>
                  <span style={styles.stepTitle}>Tap "Install App" or "Add to Home Screen"</span>
                  <span style={styles.stepDesc}>
                    Look for <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.
                  </span>
                </div>
              </div>

              <div style={styles.stepItem}>
                <div style={styles.stepNum}>3</div>
                <div style={styles.stepDetails}>
                  <span style={styles.stepTitle}>Confirm Installation</span>
                  <span style={styles.stepDesc}>
                    Tap <strong>Install</strong> to place the official logo shortcut on your device!
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              style={styles.modalDoneBtn}
              onClick={() => setShowGenericModal(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
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
    padding: '20px 16px',
    boxSizing: 'border-box',
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  card: {
    width: '100%',
    maxWidth: '400px',
    backgroundColor: '#ffffff',
    borderRadius: '24px',
    padding: '28px 20px',
    boxShadow:
      '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.03)',
    border: '1px solid #e2e8f0',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    boxSizing: 'border-box',
  },
  logoBox: {
    width: '84px',
    height: '84px',
    borderRadius: '22px',
    backgroundColor: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '14px',
    boxShadow: '0 4px 14px rgba(0, 0, 0, 0.08)',
    border: '1px solid #f1f5f9',
    overflow: 'hidden',
  },
  logo: {
    width: '88%',
    height: '88%',
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
    margin: '0 0 4px 0',
    fontSize: '22px',
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
    lineHeight: '1.25',
    letterSpacing: '-0.3px',
  },
  brandSubheading: {
    margin: '0 0 10px 0',
    fontSize: '12.5px',
    color: '#64748b',
    fontWeight: '500',
    textAlign: 'center',
  },
  loginPill: {
    margin: '0 0 16px 0',
    fontSize: '12px',
    color: '#1e40af',
    backgroundColor: '#eff6ff',
    border: '1px solid #dbeafe',
    padding: '4px 14px',
    borderRadius: '16px',
    fontWeight: '700',
  },

  /* ── PWA Install App Section ───────────────────────────── */
  installBanner: {
    width: '100%',
    backgroundColor: '#f8fafc',
    border: '1.5px solid #bfdbfe',
    borderRadius: '16px',
    padding: '14px',
    marginBottom: '18px',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    background: 'linear-gradient(180deg, #f0f7ff 0%, #ffffff 100%)',
    boxShadow: '0 2px 8px rgba(26, 86, 219, 0.08)',
  },
  installBannerHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  installLogoThumb: {
    width: '46px',
    height: '46px',
    borderRadius: '12px',
    backgroundColor: '#ffffff',
    border: '1px solid #dbeafe',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.06)',
    flexShrink: 0,
    overflow: 'hidden',
  },
  installThumbImg: {
    width: '85%',
    height: '85%',
    objectFit: 'contain',
  },
  installMeta: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    textAlign: 'left',
    flex: 1,
    minWidth: 0,
  },
  installBadge: {
    fontSize: '9.5px',
    fontWeight: '800',
    color: '#1a56db',
    textTransform: 'uppercase',
    letterSpacing: '0.6px',
  },
  installAppName: {
    fontSize: '14px',
    fontWeight: '800',
    color: '#0f172a',
    lineHeight: '1.25',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  installAppDesc: {
    fontSize: '11px',
    color: '#64748b',
    lineHeight: '1.3',
  },
  installBtn: {
    width: '100%',
    height: '44px',
    backgroundColor: '#1a56db',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: '700',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    boxShadow: '0 3px 10px rgba(26, 86, 219, 0.28)',
    touchAction: 'manipulation',
    transition: 'transform 0.1s ease',
  },
  installedBadge: {
    width: '100%',
    height: '40px',
    backgroundColor: '#ecfdf5',
    border: '1px solid #a7f3d0',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    color: '#065f46',
    fontSize: '12.5px',
    fontWeight: '700',
    boxSizing: 'border-box',
  },

  /* ── Form Elements ─────────────────────────────────────── */
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
    marginBottom: '16px',
    boxSizing: 'border-box',
  },
  errorIcon: {
    fontSize: '16px',
  },
  form: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    textAlign: 'left',
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
    fontSize: '16px', // Prevents iOS Safari from zooming on focus
    boxSizing: 'border-box',
    backgroundColor: '#f8fafc',
    color: '#0f172a',
    outline: 'none',
  },
  passwordWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    width: '100%',
  },
  passwordInput: {
    width: '100%',
    height: '48px',
    borderRadius: '12px',
    border: '1px solid #cbd5e1',
    padding: '0 48px 0 14px',
    fontSize: '16px', // Prevents iOS Safari from zooming on focus
    boxSizing: 'border-box',
    backgroundColor: '#f8fafc',
    color: '#0f172a',
    outline: 'none',
  },
  eyeBtn: {
    position: 'absolute',
    right: '10px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'transparent',
    border: 'none',
    padding: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#64748b',
    borderRadius: '8px',
    outline: 'none',
    touchAction: 'manipulation',
    transition: 'color 0.15s ease',
  },
  submitBtn: {
    width: '100%',
    height: '48px',
    borderRadius: '12px',
    backgroundColor: '#0f172a',
    color: '#ffffff',
    fontSize: '15px',
    fontWeight: '700',
    border: 'none',
    cursor: 'pointer',
    marginTop: '4px',
    boxShadow: '0 4px 12px rgba(15, 23, 42, 0.25)',
    touchAction: 'manipulation',
  },
  footerNote: {
    margin: '20px 0 0 0',
    fontSize: '11px',
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: '1.4',
  },

  /* ── Info Card ─────────────────────────────────────────── */
  infoCard: {
    marginTop: '20px',
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
    cursor: 'pointer',
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

  /* ── Modal Overlay & Guide ─────────────────────────────── */
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    backdropFilter: 'blur(4px)',
    zIndex: 99999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px',
    boxSizing: 'border-box',
  },
  modalCard: {
    width: '100%',
    maxWidth: '380px',
    backgroundColor: '#ffffff',
    borderRadius: '20px',
    padding: '24px 20px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    animation: 'fadeIn 0.2s ease-out',
  },
  modalHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    position: 'relative',
    textAlign: 'left',
  },
  modalIconWrap: {
    width: '44px',
    height: '44px',
    borderRadius: '12px',
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.05)',
    flexShrink: 0,
    overflow: 'hidden',
  },
  modalLogo: {
    width: '85%',
    height: '85%',
    objectFit: 'contain',
  },
  modalHeaderText: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minWidth: 0,
  },
  modalTitle: {
    margin: 0,
    fontSize: '16px',
    fontWeight: '800',
    color: '#0f172a',
  },
  modalSubtitle: {
    fontSize: '12px',
    color: '#1a56db',
    fontWeight: '700',
  },
  modalCloseBtn: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    border: 'none',
    backgroundColor: '#f1f5f9',
    color: '#64748b',
    fontSize: '14px',
    fontWeight: '700',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalInstructionIntro: {
    margin: '0 0 4px 0',
    fontSize: '12.5px',
    color: '#475569',
    lineHeight: '1.45',
    textAlign: 'left',
  },
  stepsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    textAlign: 'left',
  },
  stepItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
  },
  stepNum: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    backgroundColor: '#1a56db',
    color: '#ffffff',
    fontSize: '12px',
    fontWeight: '800',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: '2px',
  },
  stepDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    flex: 1,
  },
  stepTitle: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#0f172a',
  },
  stepDesc: {
    fontSize: '11.5px',
    color: '#64748b',
    lineHeight: '1.4',
  },
  modalHighlightBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#f0fdf4',
    border: '1px solid #bbf7d0',
    borderRadius: '10px',
    padding: '10px',
    fontSize: '11.5px',
    color: '#166534',
    textAlign: 'left',
    lineHeight: '1.4',
  },
  modalDoneBtn: {
    width: '100%',
    height: '44px',
    backgroundColor: '#1a56db',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: '700',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    touchAction: 'manipulation',
  },
};
