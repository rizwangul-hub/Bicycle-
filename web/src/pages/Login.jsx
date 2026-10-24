import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import logoImg from '../assets/image/logo.png';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // PWA Install State
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [showGenericModal, setShowGenericModal] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  const from = location.state?.from?.pathname || '/dashboard';

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
      setError('Please enter both email and password.');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      await login(email.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.pageContainer}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.logoWrapper}>
            <img src={logoImg} alt="Pixx Logo" style={styles.logoImage} />
          </div>
          <span style={styles.brandTitle}>PixxTechnologiees</span>
          <h1 style={styles.mainTitle}>Bicycle Purchases system</h1>
          <p style={styles.subtitle}>Admin Dashboard & Management Portal</p>
        </div>

        {/* ── PWA Install App Section ─────────────────────────── */}
        <div style={styles.installBanner}>
          <div style={styles.installBannerHeader}>
            <div style={styles.installLogoThumb}>
              <img src={logoImg} alt="App Logo" style={styles.installThumbImg} />
            </div>
            <div style={styles.installMeta}>
              <span style={styles.installBadge}>App Shortcut</span>
              <strong style={styles.installAppName}>Bicycle Purchases system</strong>
              <span style={styles.installAppDesc}>
                Install admin shortcut on your mobile or desktop
              </span>
            </div>
          </div>

          {isInstalled ? (
            <div style={styles.installedBadge}>
              <span style={{ fontSize: '15px' }}>✓</span>
              <span>Admin App Installed on this device</span>
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
          <div style={styles.errorAlert}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Admin Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. fahad@gmail.com"
              required
              style={styles.input}
              disabled={isLoading}
              autoComplete="username"
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={styles.input}
              disabled={isLoading}
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              ...styles.button,
              opacity: isLoading ? 0.7 : 1,
              cursor: isLoading ? 'not-allowed' : 'pointer',
            }}
          >
            {isLoading ? 'Signing In...' : 'Sign In as Administrator'}
          </button>
        </form>

        <div style={styles.footerNote}>
          <p>Authorized administrator access &copy; {new Date().getFullYear()} PixxTechnologiees.</p>
        </div>
      </div>

      {/* ── iOS Install Guide Modal ───────────────────────────── */}
      {showIOSModal && (
        <div style={styles.modalOverlay} onClick={() => setShowIOSModal(false)}>
          <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div style={styles.modalIconWrap}>
                <img src={logoImg} alt="App Logo" style={styles.modalLogo} />
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
              Follow these simple steps in Safari to add the Admin App with its official logo to your home screen:
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
              <span>The admin app icon will appear directly on your home screen and open in full-screen mode!</span>
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
                <img src={logoImg} alt="App Logo" style={styles.modalLogo} />
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
}

const styles = {
  pageContainer: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
    padding: '20px 16px',
    boxSizing: 'border-box',
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
  },
  card: {
    width: '100%',
    maxWidth: '420px',
    background: '#ffffff',
    borderRadius: '20px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
    padding: '32px 24px',
    boxSizing: 'border-box',
  },
  header: {
    textAlign: 'center',
    marginBottom: '20px',
  },
  logoWrapper: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '76px',
    height: '76px',
    background: '#ffffff',
    borderRadius: '16px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
    padding: '8px',
    marginBottom: '12px',
    border: '1px solid #e2e8f0',
    overflow: 'hidden',
  },
  logoImage: {
    maxWidth: '100%',
    maxHeight: '100%',
    objectFit: 'contain',
  },
  brandTitle: {
    display: 'block',
    fontSize: '11px',
    fontWeight: '700',
    color: '#2563eb',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    marginBottom: '4px',
  },
  mainTitle: {
    fontSize: '22px',
    fontWeight: '800',
    color: '#0f172a',
    margin: '0 0 4px 0',
    letterSpacing: '-0.3px',
  },
  subtitle: {
    fontSize: '13px',
    color: '#64748b',
    margin: 0,
    fontWeight: '500',
  },

  /* ── PWA Install App Section ───────────────────────────── */
  installBanner: {
    width: '100%',
    backgroundColor: '#f8fafc',
    border: '1.5px solid #bfdbfe',
    borderRadius: '14px',
    padding: '12px 14px',
    marginBottom: '20px',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    background: 'linear-gradient(180deg, #eff6ff 0%, #ffffff 100%)',
    boxShadow: '0 2px 6px rgba(37, 99, 235, 0.08)',
  },
  installBannerHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  installLogoThumb: {
    width: '42px',
    height: '42px',
    borderRadius: '10px',
    backgroundColor: '#ffffff',
    border: '1px solid #dbeafe',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
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
    color: '#2563eb',
    textTransform: 'uppercase',
    letterSpacing: '0.6px',
  },
  installAppName: {
    fontSize: '13.5px',
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
    height: '42px',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    fontSize: '13.5px',
    fontWeight: '700',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    boxShadow: '0 3px 8px rgba(37, 99, 235, 0.28)',
    touchAction: 'manipulation',
  },
  installedBadge: {
    width: '100%',
    height: '38px',
    backgroundColor: '#ecfdf5',
    border: '1px solid #a7f3d0',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    color: '#065f46',
    fontSize: '12px',
    fontWeight: '700',
    boxSizing: 'border-box',
  },

  /* ── Form Elements ─────────────────────────────────────── */
  errorAlert: {
    background: '#fef2f2',
    border: '1px solid #fecaca',
    color: '#dc2626',
    padding: '12px 14px',
    borderRadius: '10px',
    fontSize: '13.5px',
    marginBottom: '18px',
    fontWeight: '500',
    textAlign: 'left',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  formGroup: {
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
    padding: '11px 14px',
    borderRadius: '10px',
    border: '1px solid #cbd5e1',
    fontSize: '15px',
    outline: 'none',
    backgroundColor: '#f8fafc',
    boxSizing: 'border-box',
  },
  button: {
    background: '#0f172a',
    color: '#ffffff',
    padding: '13px',
    borderRadius: '10px',
    border: 'none',
    fontSize: '14.5px',
    fontWeight: '700',
    marginTop: '4px',
    boxShadow: '0 4px 12px rgba(15, 23, 42, 0.25)',
    touchAction: 'manipulation',
  },
  footerNote: {
    marginTop: '24px',
    textAlign: 'center',
    fontSize: '11.5px',
    color: '#94a3b8',
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
    color: '#2563eb',
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
    backgroundColor: '#2563eb',
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
    height: '42px',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: '700',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    touchAction: 'manipulation',
  },
};
