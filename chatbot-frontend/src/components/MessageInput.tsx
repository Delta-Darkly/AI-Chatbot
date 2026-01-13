import React from 'react';

interface Props {
  value: string;
  onChange: (val: string) => void;
  onSubmit: () => void;
  disabled: boolean;
}

const styles = {
  form: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '1rem 1.25rem',
    borderTop: '1px solid #1a1a1a',
    background: '#0a0a0a',
  },
  input: {
    flex: 1,
    padding: '0.85rem 1rem',
    border: '1px solid #1a1a1a',
    borderRadius: '10px',
    fontSize: '0.9375rem',
    outline: 'none',
    transition: 'all 0.15s ease',
    background: '#0a0a0a',
    color: '#e5e5e5',
    fontFamily: 'inherit',
  },
  sendButton: {
    padding: '0.85rem 1rem',
    borderRadius: '10px',
    border: '1px solid #1a1a1a',
    background: '#141414',
    color: '#e5e5e5',
    fontSize: '0.875rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.15s ease',
    flexShrink: 0,
  },
  sendButtonDisabled: {
    opacity: 0.4,
    cursor: 'not-allowed',
    background: '#0a0a0a',
  },
};

const MessageInput: React.FC<Props> = ({ value, onChange, onSubmit, disabled }) => {
  return (
    <form
      style={styles.form}
      onSubmit={(e) => {
        e.preventDefault();
        if (!disabled && value.trim()) {
          onSubmit();
        }
      }}
    >
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Type your message..."
        disabled={disabled}
        style={{
          ...styles.input,
          ...(disabled ? { opacity: 0.5, cursor: 'not-allowed' } : {}),
        }}
      />
      <button
        type="submit"
        disabled={disabled || !value.trim()}
        style={{
          ...styles.sendButton,
          ...((disabled || !value.trim()) ? styles.sendButtonDisabled : {}),
        }}
      >
        {disabled ? <span style={{ animation: 'spin 0.8s linear infinite', fontSize: '0.75rem' }}>⟳</span> : <span style={{ fontSize: '0.875rem' }}>→</span>}
      </button>
    </form>
  );
};

export default MessageInput;

