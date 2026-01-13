import React from 'react';

interface Props {
  show: boolean;
  title: string;
  subtitle?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const styles = {
  overlay: {
    position: 'fixed' as const,
    inset: 0,
    background: 'rgba(0,0,0,0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  modal: {
    background: '#0f0f0f',
    border: '1px solid #1f1f1f',
    borderRadius: '12px',
    padding: '1.5rem',
    width: '360px',
    boxShadow: '0 10px 40px rgba(0,0,0,0.35)',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.75rem',
    color: '#e5e5e5',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', sans-serif",
  },
  title: { margin: 0, fontSize: '1rem', fontWeight: 600 },
  subtitle: { margin: 0, color: '#9ca3af', fontSize: '0.9rem', lineHeight: 1.4 },
  actions: {
    display: 'flex',
    gap: '0.75rem',
    justifyContent: 'flex-end',
    marginTop: '0.25rem',
  },
  buttonGhost: {
    padding: '0.75rem 0.9rem',
    borderRadius: '8px',
    border: '1px solid #1f1f1f',
    background: '#0c0c0c',
    color: '#e5e5e5',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '0.95rem',
    transition: 'all 0.15s ease',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', sans-serif",
  },
  buttonPrimary: {
    padding: '0.75rem 0.9rem',
    borderRadius: '8px',
    border: '1px solid #2563eb',
    background: '#2563eb',
    color: '#fff',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '0.95rem',
    transition: 'all 0.15s ease',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', sans-serif",
  },
};

const ConfirmModal: React.FC<Props> = ({
  show,
  title,
  subtitle,
  confirmLabel = 'Clear',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
}) => {
  if (!show) return null;
  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h3 style={styles.title}>{title}</h3>
        {subtitle && <p style={styles.subtitle}>{subtitle}</p>}
        <div style={styles.actions}>
          <button style={styles.buttonGhost} onClick={onCancel}>
            {cancelLabel}
          </button>
          <button style={styles.buttonPrimary} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;

