import React from 'react';

interface Props {
  show: boolean;
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
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
  input: {
    width: '100%',
    padding: '0.7rem 0.85rem',
    borderRadius: '8px',
    border: '1px solid #1f1f1f',
    background: '#0c0c0c',
    color: '#e5e5e5',
    outline: 'none',
    fontSize: '0.95rem',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', sans-serif",
  },
  button: {
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

const UserModal: React.FC<Props> = ({ show, value, onChange, onSubmit, onKeyDown }) => {
  if (!show) return null;
  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h3 style={styles.title}>Set your user ID</h3>
        <p style={styles.subtitle}>Used to keep conversations separated. You can use any string.</p>
        <input
          style={styles.input}
          autoFocus
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="e.g. alice-123"
        />
        <button style={styles.button} onClick={onSubmit}>
          Continue
        </button>
      </div>
    </div>
  );
};

export default UserModal;

