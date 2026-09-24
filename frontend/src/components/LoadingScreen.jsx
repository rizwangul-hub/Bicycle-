import React from 'react';

export const LoadingScreen = ({ message = 'Loading Pixx Bicycle...' }) => {
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logoWrapper}>
          <img
            src="/logo.png"
            alt="Pixx Bicycle Logo"
            style={styles.logo}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
        <h2 style={styles.brandTitle}>PixxTechnologiees</h2>
        <p style={styles.appTitle}>Bicycle Owner's Declaration</p>
        <div style={styles.spinner} />
        <p style={styles.message}>{message}</p>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    width: '100%',
    backgroundColor: '#f8fafc',
    padding: '20px',
    boxSizing: 'border-box',
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  card: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    maxWidth: '340px',
    width: '100%',
    padding: '32px 24px',
    borderRadius: '24px',
    backgroundColor: '#ffffff',
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.03)',
    border: '1px solid #e2e8f0',
  },
  logoWrapper: {
    width: '84px',
    height: '84px',
    borderRadius: '20px',
    backgroundColor: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '16px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
    border: '1px solid #f1f5f9',
    overflow: 'hidden',
  },
  logo: {
    width: '80%',
    height: '80%',
    objectFit: 'contain',
  },
  brandTitle: {
    margin: '0 0 4px 0',
    fontSize: '13px',
    fontWeight: '700',
    color: '#1a56db',
    textTransform: 'uppercase',
    letterSpacing: '1.2px',
  },
  appTitle: {
    margin: '0 0 24px 0',
    fontSize: '18px',
    fontWeight: '700',
    color: '#0f172a',
  },
  spinner: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    border: '3px solid #e2e8f0',
    borderTopColor: '#1a56db',
    animation: 'spin 0.8s linear infinite',
    marginBottom: '14px',
  },
  message: {
    margin: 0,
    fontSize: '14px',
    color: '#64748b',
    fontWeight: '500',
  },
};
