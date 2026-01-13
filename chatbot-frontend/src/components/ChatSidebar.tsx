import React, { useState } from 'react';

interface SidebarProps {
  conversations: string[];
  activeConversationId: string;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onRename: (oldId: string, newId: string) => void;
  isLoadingConversations: boolean;
  userId: string;
}

const styles = {
  container: {
    width: '260px',
    borderRight: '1px solid #1a1a1a',
    background: '#0a0a0a',
    padding: '1rem',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.75rem',
    overflowY: 'auto' as const,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '0.5rem',
    color: '#e5e5e5',
    fontWeight: 600,
    fontSize: '0.95rem',
  },
  newChatButton: {
    padding: '0.5rem 0.75rem',
    borderRadius: '8px',
    border: '1px solid #1a1a1a',
    background: '#141414',
    color: '#e5e5e5',
    cursor: 'pointer',
    fontSize: '0.85rem',
    transition: 'all 0.15s ease',
  },
  list: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.35rem',
  },
  item: {
    padding: '0.6rem 0.75rem',
    borderRadius: '8px',
    border: '1px solid #0f0f0f',
    background: '#0a0a0a',
    color: '#e5e5e5',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    fontSize: '0.9rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '0.5rem',
  },
  itemActive: {
    borderColor: '#262626',
    background: '#141414',
  },
  deleteButton: {
    background: 'transparent',
    border: 'none',
    color: '#ef4444',
    cursor: 'pointer',
    fontSize: '0.85rem',
    padding: 0,
    opacity: 0,
    transition: 'opacity 0.15s ease',
  },
  userFooter: {
    marginTop: 'auto',
    paddingTop: '0.75rem',
    borderTop: '1px solid #1a1a1a',
    color: '#9ca3af',
    fontSize: '0.85rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
  },
  userBadge: {
    padding: '0.2rem 0.45rem',
    borderRadius: '6px',
    background: '#141414',
    border: '1px solid #1f1f1f',
    color: '#e5e5e5',
    fontSize: '0.8rem',
    fontWeight: 600,
  },
  renameInput: {
    flex: 1,
    background: '#0c0c0c',
    border: '1px solid #1a1a1a',
    borderRadius: '6px',
    color: '#e5e5e5',
    padding: '0.35rem 0.45rem',
    fontSize: '0.9rem',
  },
  empty: { color: '#737373', fontSize: '0.9rem' },
};

const ChatSidebar: React.FC<SidebarProps> = ({
  conversations,
  activeConversationId,
  onSelect,
  onNew,
  onDelete,
  onRename,
  isLoadingConversations,
  userId,
}) => {
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span>Chats</span>
        <button style={styles.newChatButton} onClick={onNew}>
          + New
        </button>
      </div>

      {isLoadingConversations ? (
        <div style={styles.empty}>Loading chats...</div>
      ) : conversations.length === 0 ? (
        <div style={styles.empty}>No chats yet.</div>
      ) : (
        <div style={styles.list}>
          {conversations.map((c) => (
            <div
              key={c}
              className={`convo-item${activeConversationId === c ? ' active' : ''}`}
              style={{
                ...styles.item,
                ...(activeConversationId === c ? styles.itemActive : {}),
              }}
              onMouseEnter={(e) => {
                const btn = (e.currentTarget as HTMLElement).querySelector('.delete-chat-btn') as HTMLElement | null;
                if (btn) btn.style.opacity = '1';
              }}
              onMouseLeave={(e) => {
                const btn = (e.currentTarget as HTMLElement).querySelector('.delete-chat-btn') as HTMLElement | null;
                if (btn) btn.style.opacity = '0';
              }}
              onClick={() => {
                if (activeConversationId !== c) {
                  onSelect(c);
                }
              }}
            >
              {renamingId === c ? (
                <input
                  autoFocus
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onBlur={() => {
                    setRenamingId(null);
                    setRenameValue('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      onRename(c, renameValue.trim());
                      setRenamingId(null);
                      setRenameValue('');
                    } else if (e.key === 'Escape') {
                      setRenamingId(null);
                      setRenameValue('');
                    }
                  }}
                  style={styles.renameInput}
                />
              ) : (
                <span
                  style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    cursor: 'text',
                    flex: 1,
                  }}
                  title={c}
                  onDoubleClick={() => {
                    setRenamingId(c);
                    setRenameValue(c);
                  }}
                >
                  {c}
                </span>
              )}
              <button
                className="delete-chat-btn"
                style={styles.deleteButton}
                onMouseDown={(e) => e.preventDefault()}
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(c);
                }}
                title="Delete chat"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {userId ? (
        <div style={styles.userFooter}>
          <span style={styles.userBadge}>User</span>
          <span title={userId} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {userId}
          </span>
        </div>
      ) : null}
    </div>
  );
};

export default ChatSidebar;

