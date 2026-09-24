import React from 'react';
import loadingImg from '../assets/image/loading.png';

export function LoadingScreen({ message = 'Loading application...' }) {
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.imageWrapper}>
          <img
            src={loadingImg}
            alt="Loading..."
            style={styles.image}
          />
        </div>
        <div style={styles.spinnerWrapper}>
          <div style={styles.spinner} />
        </div>
        <h3 style={styles.title}>Pixx Bicycle Management</h3>
        <p style={styles.subtitle}>{message}</p>
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
  imageWrapper: {
    width: '180px',
    height: '180px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '24px',
    animation: 'pulseGlow 2.4s ease-in-out infinite',
  },
  image: {
    maxWidth: '100%',
    maxHeight: '100%',
    objectFit: 'contain',
    borderRadius: '16px',
  },
  spinnerWrapper: {
    marginBottom: '16px',
  },
  spinner: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    border: '3px solid rgba(255, 255, 255, 0.15)',
    borderTopColor: '#38bdf8',
    animation: 'spin 0.8s linear infinite',
  },
  title: {
    margin: '0 0 6px 0',
    fontSize: '20px',
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: '-0.3px',
  },
  subtitle: {
    margin: 0,
    fontSize: '14px',
    color: '#94a3b8',
  },
};

export default LoadingScreen;
