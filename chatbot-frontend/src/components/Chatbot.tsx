import React, { useState, useEffect, useRef, type CSSProperties } from 'react';
import agentService from '../services/agentService';
import weaviateService from '../services/weaviateService';
import ChatSidebar from './ChatSidebar';
import ChatMessages from './ChatMessages';
import ChatHeader from './ChatHeader';
import UserModal from './UserModal';
import MessageInput from './MessageInput';
import ConfirmModal from './ConfirmModal';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  text: string;
  timestamp?: string;
}

interface ConversationMessage {
  conversation_id: string;
  user_id: string;
  content: string;
  role: string;
  parent_id: string;
  message_id: string;
  timestamp: string;
  metadata?: string;
}

type ConversationId = string;

const Chatbot: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [userId, setUserId] = useState<string>('');
  const [conversationId, setConversationId] = useState<ConversationId>('');
  const [conversations, setConversations] = useState<ConversationId[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [pendingDeleteConvo, setPendingDeleteConvo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showUserModal, setShowUserModal] = useState(true);
  const [pendingUserId, setPendingUserId] = useState('');
  const [justCreatedConvo, setJustCreatedConvo] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const styles: { [key: string]: CSSProperties } = {
    container: {
      display: 'flex',
      flexDirection: 'row',
      height: '100vh',
      width: '100%',
      background: '#0a0a0a',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Inter', 'Helvetica Neue', sans-serif",
      WebkitFontSmoothing: 'antialiased',
      MozOsxFontSmoothing: 'grayscale',
      color: '#e5e5e5',
    },
    main: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      maxWidth: '1100px',
      margin: '0 auto',
      background: '#0a0a0a',
    },
  };

  useEffect(() => {
    if (userId) {
      setShowUserModal(false);
    }
  }, [userId]);

  // Load conversations when userId is set
  useEffect(() => {
    if (userId) {
      refreshConversations();
    }
  }, [userId]);

  // Load conversation history when convo changes
  useEffect(() => {
    if (userId && conversationId) {
      setIsLoadingHistory(true);
      loadConversationHistory(conversationId);
    } else {
      setMessages([]);
      setIsLoadingHistory(false);
    }
  }, [userId, conversationId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSetUserId = () => {
    const id = (pendingUserId || '').trim() || 'guest';
    setUserId(id);
    setShowUserModal(false);
  };

  const handleUserIdKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSetUserId();
    }
  };

  const refreshConversations = async () => {
    try {
      setIsLoadingConversations(true);
      const convos = await weaviateService.listConversations(userId);
      setConversations(convos);
      // If no conversation selected, pick the first or create new
      if (!conversationId) {
        if (convos.length > 0) {
          setConversationId(convos[0]);
        }
      }
    } catch (err) {
      console.error('Error loading conversation list:', err);
    } finally {
      setIsLoadingConversations(false);
    }
  };

  const loadConversationHistory = async (convoId: string) => {
    try {
      setIsLoadingHistory(true);
      const history = await weaviateService.getConversationHistory(convoId, userId);

      // Convert Weaviate messages (role/content) to chat format, already sorted asc by timestamp
      const chatMessages: Message[] = history.map((msg: ConversationMessage) => ({
        id: `${msg.role}-${msg.message_id || msg.timestamp}`,
        type: msg.role === 'assistant' ? 'assistant' : 'user',
        text: msg.content,
        timestamp: msg.timestamp
      }));

      setMessages(chatMessages);
      setError(null);
      if (justCreatedConvo === convoId) {
        setJustCreatedConvo(null);
      }
    } catch (err) {
      console.error('Error loading conversation history:', err);
      if (justCreatedConvo === convoId) {
        // For brand-new conversations, suppress the initial error while messages are being created.
        setError(null);
      } else {
        setError('Failed to load conversation history. Starting fresh.');
        setMessages([]);
      }
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) {
      return;
    }

    // Ensure conversationId exists; create if not
    let convoId = conversationId;
    if (!convoId) {
      convoId = `chat-${Math.random().toString(36).slice(2, 6)}`;
      setConversationId(convoId);
      setConversations(prev => [convoId, ...prev]);
      setJustCreatedConvo(convoId);
    }

    // Set metadata for agent calls
    agentService.setContext({ userId, conversationId: convoId });

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      type: 'user',
      text: input.trim(),
      timestamp: new Date().toISOString()
    };

    // Add user message immediately
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      // Send to agent
      const response = await agentService.sendPrompt(userMessage.text);
      
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        type: 'assistant',
        text: response,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      // Reload history to get the latest from Weaviate (in case it was stored)
      setTimeout(() => {
        loadConversationHistory(convoId);
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Failed to get response from agent');
      console.error('Error sending message:', err);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleClearChat = async (targetConvoId?: string) => {
    const target = targetConvoId || conversationId;
    if (isClearing || isLoading || isLoadingHistory || !target) {
      return;
    }

    try {
      setIsClearing(true);
      setError(null);
      
      // Clear selected conversation from Weaviate
      await weaviateService.clearConversation(userId, target);

      // Remove from list and reset state
      setConversations(prev => prev.filter(c => c !== target));
      if (conversationId === target) {
        setConversationId('');
        setMessages([]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to clear conversation history');
      console.error('Error clearing chat:', err);
    } finally {
      setIsClearing(false);
    }
  };

  const handleDeleteConversation = async (targetConvoId: string) => {
    await handleClearChat(targetConvoId);
  };

  const handleRenameConversation = async (oldId: string, newId: string) => {
    const trimmed = newId.trim();
    if (!trimmed || trimmed === oldId || !userId) return;
    try {
      setIsLoadingConversations(true);
      await weaviateService.renameConversation(userId, oldId, trimmed);
      setConversations((prev) => {
        const withoutOld = prev.filter((c) => c !== oldId);
        return [trimmed, ...withoutOld];
      });
      if (conversationId === oldId) {
        setConversationId(trimmed);
        loadConversationHistory(trimmed);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to rename conversation');
      console.error('Error renaming conversation:', err);
    } finally {
      setIsLoadingConversations(false);
    }
  };

  return (
    <>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes typing {
          0%, 60%, 100% {
            transform: translateY(0);
            opacity: 0.5;
          }
          30% {
            transform: translateY(-4px);
            opacity: 1;
          }
        }
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        body {
          margin: 0;
          padding: 0;
          overflow: hidden;
          background: #0a0a0a;
        }
        #root {
          width: 100%;
          height: 100vh;
          background: #0a0a0a;
        }
        .chatbot-messages::-webkit-scrollbar {
          width: 6px;
        }
        .chatbot-messages::-webkit-scrollbar-track {
          background: transparent;
        }
        .chatbot-messages::-webkit-scrollbar-thumb {
          background: #1a1a1a;
          border-radius: 3px;
        }
        .chatbot-messages::-webkit-scrollbar-thumb:hover {
          background: #262626;
        }
        input::placeholder {
          color: #525252;
        }
        .convo-item,
        .convo-item:focus,
        .convo-item:focus-visible,
        .convo-item:focus-within {
          outline: none !important;
          box-shadow: none !important;
          border-color: #0f0f0f !important;
        }
        .convo-item.active {
          border-color: #262626 !important;
          background: #141414 !important;
        }
        .convo-item .delete-chat-btn {
          opacity: 0;
        }
        .convo-item:hover .delete-chat-btn,
        .convo-item.active .delete-chat-btn {
          opacity: 1;
        }
      `}</style>
      <UserModal
        show={showUserModal}
        value={pendingUserId}
        onChange={setPendingUserId}
        onSubmit={handleSetUserId}
        onKeyDown={handleUserIdKeyDown}
      />
      <ConfirmModal
        show={showConfirmClear}
        title="Clear this conversation?"
        subtitle="This action cannot be undone."
        onCancel={() => {
          setShowConfirmClear(false);
          setPendingDeleteConvo(null);
        }}
        onConfirm={() => {
          const target = pendingDeleteConvo || conversationId;
          setShowConfirmClear(false);
          if (target) handleDeleteConversation(target);
          setPendingDeleteConvo(null);
        }}
      />
      <div style={styles.container}>
        <ChatSidebar
          conversations={conversations}
          activeConversationId={conversationId}
          onSelect={(id) => setConversationId(id)}
          onNew={() => {
            const newId = `chat-${Math.random().toString(36).slice(2, 6)}`;
            setConversationId(newId);
            setConversations((prev) => [newId, ...prev]);
            setMessages([]);
            setJustCreatedConvo(newId);
          }}
          onDelete={(id) => {
            setPendingDeleteConvo(id);
            setShowConfirmClear(true);
          }}
          onRename={(oldId, newId) => handleRenameConversation(oldId, newId)}
          isLoadingConversations={isLoadingConversations}
          userId={userId}
        />

        <div style={styles.main}>
          <ChatHeader
            isClearing={isClearing}
            isLoading={isLoading}
            isLoadingHistory={isLoadingHistory}
            hasConversations={conversations.length > 0}
            onClear={() => {
              setPendingDeleteConvo(conversationId || null);
              setShowConfirmClear(true);
            }}
            onRefresh={() => {
              if (conversationId) loadConversationHistory(conversationId);
            }}
          />

        <ChatMessages
          messages={messages}
          isLoadingHistory={isLoadingHistory}
          isLoading={isLoading}
          error={error}
        />
        <div ref={messagesEndRef} />

        <MessageInput
          value={input}
          onChange={setInput}
          onSubmit={handleSend}
          disabled={isLoading}
        />
        </div>
      </div>
    </>
  );
};

export default Chatbot;
