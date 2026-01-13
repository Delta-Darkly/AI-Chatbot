import axios from 'axios';
import config from '../config';

interface AgentResponse {
  response?: string;
  message?: string;
}

/**
 * Service for interacting with the Dank AI agent
 */
class AgentService {
  private baseUrl: string;
  private metadata: Record<string, any>;

  constructor() {
    this.baseUrl = config.agentUrl;
    this.metadata = {};
  }

  /**
   * Set contextual metadata (e.g., userId, conversationId) to send with prompts
   */
  setContext(metadata: Record<string, any>) {
    this.metadata = metadata || {};
  }

  /**
   * Send a prompt to the agent and get a response
   */
  async sendPrompt(prompt: string): Promise<string> {
    try {
      const response = await axios.post<AgentResponse | string>(
        `${this.baseUrl}/prompt`,
        { prompt, ...this.metadata },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 60000 // 60 second timeout for LLM responses
        }
      );

      // Extract the response text (remove metadata if present)
      let responseText: string;
      if (typeof response.data === 'string') {
        responseText = response.data;
      } else {
        responseText = (response.data as AgentResponse)?.response || 
                      (response.data as AgentResponse)?.message || 
                      String(response.data);
      }
      
      // Clean up metadata footer if present
      responseText = responseText.split('\n\n---\n')[0].trim();

      return responseText;
    } catch (error: any) {
      console.error('[AgentService] Error sending prompt:', error);
      console.error('[AgentService] Error details:', {
        message: error.message,
        code: error.code,
        request: error.request ? 'Request made but no response' : 'No request made',
        response: error.response ? `Status: ${error.response.status}` : 'No response',
        config: {
          url: error.config?.url,
          method: error.config?.method,
        }
      });
      
      if (error.response) {
        throw new Error(
          `Agent error: ${error.response.status} - ${error.response.data?.message || error.response.statusText}`
        );
      } else if (error.request) {
        // Check for CORS or network issues
        const errorMsg = error.code === 'ERR_NETWORK' 
          ? `Network error: Cannot connect to ${this.baseUrl}. Check if the agent is running and CORS is enabled.`
          : error.code === 'ECONNREFUSED'
          ? `Connection refused: ${this.baseUrl}. Is the agent running?`
          : `Unable to connect to agent at ${this.baseUrl}. Check if it's running and CORS is enabled.`;
        throw new Error(errorMsg);
      } else {
        throw new Error(`Request error: ${error.message}`);
      }
    }
  }

  /**
   * Check if the agent is accessible
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Try to ping the agent endpoint
      const response = await axios.get(`${this.baseUrl}/health`, { timeout: 5000 });
      return response.status === 200;
    } catch (error) {
      // If /health doesn't exist, try the prompt endpoint with a minimal request
      try {
        await axios.post(`${this.baseUrl}/prompt`, { prompt: 'ping' }, { timeout: 5000 });
        return true;
      } catch {
        return false;
      }
    }
  }
}

export default new AgentService();

