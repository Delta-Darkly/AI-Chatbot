import React, { useEffect, useRef } from 'react';
import { parseBoldText } from '../utils/text';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  text: string;
  timestamp?: string;
}

interface Props {
  messages: Message[];
  isLoadingHistory: boolean;
  isLoading: boolean;
  error: string | null;
}

const styles = {
  container: {
    flex: 1,
    overflowY: 'auto' as const,
    padding: '1rem 1.25rem',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.75rem',
  },
  loadingIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    color: '#9ca3af',
    fontSize: '0.95rem',
  },
  spinner: {
    width: '18px',
    height: '18px',
    border: '2px solid #1f2937',
    borderTop: '2px solid #ffffff',
    borderRadius: '50%',
    animation: 'spin 0.9s linear infinite',
  },
  empty: { color: '#737373', fontSize: '0.95rem', padding: '1rem' },
  message: {
    borderRadius: '12px',
    padding: '0.9rem 1rem',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.35rem',
  },
  assistant: {
    background: '#111111',
    border: '1px solid #1a1a1a',
    alignSelf: 'flex-start' as const,
    maxWidth: '90%',
  },
  user: {
    background: '#0f172a',
    border: '1px solid #1e293b',
    alignSelf: 'flex-end' as const,
    maxWidth: '90%',
  },
  text: { color: '#e5e7eb', fontSize: '0.98rem', lineHeight: 1.6, whiteSpace: 'pre-line' as const },
  timestamp: { color: '#6b7280', fontSize: '0.75rem' },
  typingWrapper: {}, // unused placeholder
  typingIndicator: {
    display: 'flex',
    gap: '4px',
    alignItems: 'center',
  },
  typingDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: '#e5e5e5',
    opacity: 0.6,
    animation: 'typing 1s infinite',
  },
  error: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    color: '#f87171',
    background: '#1b0f0f',
    border: '1px solid #7f1d1d',
    borderRadius: '10px',
    padding: '0.75rem 1rem',
  },
};

const ChatMessages: React.FC<Props> = ({ messages, isLoadingHistory, isLoading, error }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom whenever messages change or typing indicator shows
  useEffect(() => {
    const el = containerRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, isLoading]);

  return (
    <div ref={containerRef} className="chatbot-messages" style={styles.container}>
      {isLoadingHistory && (
        <div style={styles.loadingIndicator}>
          <div style={styles.spinner}></div>
          <span>Loading conversation history...</span>
        </div>
      )}

      {!isLoadingHistory && messages.length === 0 && (
        <div style={styles.empty}>Start a new conversation.</div>
      )}

      {messages.map((message) => (
        <div
          key={message.id}
          style={{
            ...styles.message,
            ...(message.type === 'assistant' ? styles.assistant : styles.user),
          }}
        >
          <div style={styles.text}>
            {message.type === 'assistant' ? parseBoldText(message.text) : message.text}
          </div>
          {message.timestamp && (
            <div style={styles.timestamp}>
              {new Date(message.timestamp).toLocaleString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
              })}
            </div>
          )}
        </div>
      ))}

      {isLoading && (
        <div style={{ ...styles.message, ...styles.assistant }}>
          <div style={styles.typingIndicator}>
            <span style={{ ...styles.typingDot, animationDelay: '0s' }}></span>
            <span style={{ ...styles.typingDot, animationDelay: '0.2s' }}></span>
            <span style={{ ...styles.typingDot, animationDelay: '0.4s' }}></span>
          </div>
        </div>
      )}

      {error && (
        <div style={styles.error}>
          <span>⚠</span>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default ChatMessages;

