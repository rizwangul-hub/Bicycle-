import React from 'react';
import logoImg from '../assets/image/logo.png';

export function LoadingScreen({ message = 'Loading application...' }) {
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logoBadge}>
          <img
            src={logoImg}
            alt="Pixx Logo"
            style={styles.logoImage}
          />
        </div>
        <h3 style={styles.title}>PixxTechnologiees</h3>
        <p style={styles.subtitle}>Bicycle Management System</p>
        <div style={styles.spinnerWrapper}>
          <div style={styles.spinner} />
        </div>
        <p style={styles.messageText}>{message}</p>
      </div>

      <style>{`
        @keyframes pulseGlow {
          0%, 100% { transform: scale(1); opacity: 0.95; }
          50% { transform: scale(1.04); opacity: 1; filter: drop-shadow(0 10px 20px rgba(37, 99, 235, 0.25)); }
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    minHeight: '100vh',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f172a',
    backgroundImage: 'radial-gradient(circle at 50% 30%, #1e293b 0%, #0f172a 100%)',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    padding: '20px',
  },
  card: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    maxWidth: '420px',
    width: '100%',
  },
  logoBadge: {
    width: '100px',
    height: '100px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderRadius: '24px',
    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.25)',
    marginBottom: '20px',
    animation: 'pulseGlow 2.4s ease-in-out infinite',
  },
  logoImage: {
    width: '80px',
    height: '80px',
    objectFit: 'contain',
  },
  spinnerWrapper: {
    marginTop: '16px',
    marginBottom: '12px',
  },
  spinner: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    border: '3px solid rgba(255, 255, 255, 0.15)',
    borderTopColor: '#38bdf8',
    animation: 'spin 0.8s linear infinite',
  },
  title: {
    margin: '0 0 4px 0',
    fontSize: '22px',
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: '-0.3px',
  },
  subtitle: {
    margin: '0 0 8px 0',
    fontSize: '14px',
    color: '#94a3b8',
    fontWeight: '500',
  },
  messageText: {
    margin: 0,
    fontSize: '13px',
    color: '#64748b',
  },
};

export default LoadingScreen;
