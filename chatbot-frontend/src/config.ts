/**
 * Configuration for agent and Weaviate endpoints
 * These can be overridden via environment variables for deployment
 */

interface Config {
  agentUrl: string;
  weaviateUrl: string;
  conversationId: string;
  className: string;
}

const config: Config = {
  // Always go through the app proxy; targets are selected in vite.config.js
  agentUrl: '/api/agent',
  weaviateUrl: '/api/weaviate',

  // Defaults for conversation/class can be overridden by UI state as needed
  conversationId: '',
  className: 'Messages'
};

export default config;

