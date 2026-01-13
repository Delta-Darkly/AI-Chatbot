import React from 'react';

interface Props {
  title?: string;
  subtitle?: string;
  isClearing: boolean;
  isLoading: boolean;
  isLoadingHistory: boolean;
  hasConversations: boolean;
  onClear: () => void;
  onRefresh: () => void;
}

const styles = {
  wrapper: {
    background: '#0a0a0a',
    borderBottom: '1px solid #1a1a1a',
    padding: '1rem 1.5rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleBlock: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.15rem',
  },
  title: { fontSize: '0.95rem', fontWeight: 500, color: '#e5e5e5' },
  subtitle: { fontSize: '0.75rem', color: '#737373' },
  actions: { display: 'flex', gap: '0.5rem', alignItems: 'center' },
  btn: {
    padding: '0.5rem 0.75rem',
    borderRadius: '10px',
    border: '1px solid #1a1a1a',
    background: 'transparent',
    color: '#737373',
    cursor: 'pointer',
    fontSize: '0.9rem',
    transition: 'all 0.15s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
  },
  btnDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
};

const ChatHeader: React.FC<Props> = ({
  title = 'AI Assistant',
  subtitle = 'Powered by Dank AI',
  isClearing,
  isLoading,
  isLoadingHistory,
  hasConversations,
  onClear,
  onRefresh,
}) => {
  const clearDisabled = isClearing || isLoading || isLoadingHistory || !hasConversations;
  return (
    <div style={styles.wrapper}>
      <div style={styles.titleBlock}>
        <div style={styles.title}>{title}</div>
        <div style={styles.subtitle}>{subtitle}</div>
      </div>
      <div style={styles.actions}>
        <button
          style={{
            ...styles.btn,
            ...(clearDisabled ? styles.btnDisabled : {}),
          }}
          onClick={onClear}
          disabled={clearDisabled}
          title="Clear conversation history"
        >
          {isClearing ? '⏳' : '🗑️'} Clear
        </button>
        <button
          style={{
            ...styles.btn,
            ...(isLoadingHistory ? styles.btnDisabled : {}),
            padding: '0.5rem 0.6rem',
          }}
          onClick={onRefresh}
          disabled={isLoadingHistory}
          title="Reload conversation history"
        >
          ↻
        </button>
      </div>
    </div>
  );
};

export default ChatHeader;

