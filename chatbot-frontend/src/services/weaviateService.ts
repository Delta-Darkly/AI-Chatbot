import axios from 'axios';
import config from '../config';

interface WeaviateMessage {
  conversation_id: string;
  user_id: string;
  content: string;
  role: string;
  parent_id: string;
  message_id: string;
  timestamp: string;
  metadata?: string;
}

interface GraphQLResponse {
  data?: {
    Get?: {
      [key: string]: WeaviateMessage[];
    };
  };
}

/**
 * Service for interacting with Weaviate to fetch conversation history
 */
class WeaviateService {
  private baseUrl: string;
  private className: string;

  constructor() {
    this.baseUrl = config.weaviateUrl;
    this.className = config.className;
  }

  /**
   * Fetch conversation history from Weaviate
   * Returns messages sorted by messageIndex (chronological order)
   */
  async getConversationHistory(conversationId: string, userId: string, limit: number = 50): Promise<WeaviateMessage[]> {
    try {
      const query = {
        query: `
          {
            Get {
              ${this.className}(
                where: {
                  operator: And,
                  operands: [
                    { path: ["user_id"], operator: Equal, valueString: "${userId}" },
                    { path: ["conversation_id"], operator: Equal, valueString: "${conversationId}" }
                  ]
                }
                sort: [{ path: ["timestamp"], order: asc }]
                limit: ${limit}
              ) {
                conversation_id
                user_id
                content
                role
                parent_id
                message_id
                timestamp
                metadata
              }
            }
          }
        `
      };

      const response = await axios.post<GraphQLResponse>(
        `${this.baseUrl}/v1/graphql`,
        query,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data?.data?.Get?.[this.className]) {
        return response.data.data.Get[this.className];
      }

      return [];
    } catch (error) {
      console.error('[WeaviateService] Error fetching conversation history:', error);
      throw error;
    }
  }

  /**
   * Get the latest N messages from the conversation
   */
  async getLatestMessages(conversationId: string, userId: string, count: number = 10): Promise<WeaviateMessage[]> {
    return this.getConversationHistory(conversationId, userId, count);
  }

  /**
   * Check if Weaviate is accessible
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.baseUrl}/v1/.well-known/ready`);
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  /**
   * Clear all conversation data for the current conversationId
   * This deletes all messages in the conversation
   */
  async clearConversation(userId: string, conversationId: string): Promise<void> {
    try {
      // If GraphQL mutations are disabled and batch delete endpoint is unavailable (older Weaviate),
      // delete by fetching object IDs and removing them individually.
      const idsQuery = {
        query: `
          {
            Get {
              ${this.className}(
                where: {
                  operator: And,
                  operands: [
                    { path: ["user_id"], operator: Equal, valueString: "${userId}" },
                    { path: ["conversation_id"], operator: Equal, valueString: "${conversationId}" }
                  ]
                }
                limit: 500
              ) {
                _additional { id }
              }
            }
          }
        `
      };

      const idsResp = await axios.post<GraphQLResponse>(`${this.baseUrl}/v1/graphql`, idsQuery, {
        headers: { 'Content-Type': 'application/json' },
      });

      const objs = idsResp.data?.data?.Get?.[this.className] || [];
      const ids = objs.map((o: any) => o?._additional?.id).filter(Boolean);

      if (ids.length === 0) return;

      await Promise.allSettled(
        ids.map((id: string) =>
          axios.delete(`${this.baseUrl}/v1/objects/${id}`, {
            headers: { 'Content-Type': 'application/json' },
          })
        )
      );
    } catch (error) {
      console.error('[WeaviateService] Error clearing conversation:', error);
      throw error;
    }
  }

  /**
   * List unique conversations for a user
   */
  async listConversations(userId: string, limit: number = 100): Promise<string[]> {
    try {
      const query = {
        query: `
          {
            Get {
              ${this.className}(
                where: {
                  path: ["user_id"],
                  operator: Equal,
                  valueString: "${userId}"
                }
                sort: [{ path: ["timestamp"], order: desc }]
                limit: ${limit}
              ) {
                conversation_id
              }
            }
          }
        `
      };

      const response = await axios.post<GraphQLResponse>(
        `${this.baseUrl}/v1/graphql`,
        query,
        { headers: { 'Content-Type': 'application/json' } }
      );

      const convos = response.data?.data?.Get?.[this.className] || [];
      const unique = Array.from(new Set(convos.map((c: any) => c.conversation_id))).filter(Boolean);
      return unique;
    } catch (error) {
      console.error('[WeaviateService] Error listing conversations:', error);
      return [];
    }
  }

  /**
   * Rename a conversation: update conversation_id on all matching objects
   */
  async renameConversation(userId: string, oldConversationId: string, newConversationId: string): Promise<void> {
    if (!oldConversationId || !newConversationId || !userId) return;
    try {
      // Fetch object IDs to update
      const idsQuery = {
        query: `
          {
            Get {
              ${this.className}(
                where: {
                  operator: And,
                  operands: [
                    { path: ["user_id"], operator: Equal, valueString: "${userId}" },
                    { path: ["conversation_id"], operator: Equal, valueString: "${oldConversationId}" }
                  ]
                }
                limit: 500
              ) {
                _additional { id }
              }
            }
          }
        `
      };

      const idsResp = await axios.post<GraphQLResponse>(`${this.baseUrl}/v1/graphql`, idsQuery, {
        headers: { 'Content-Type': 'application/json' },
      });

      const objs = idsResp.data?.data?.Get?.[this.className] || [];
      const ids = objs.map((o: any) => o?._additional?.id).filter(Boolean);
      if (ids.length === 0) return;

      // Patch conversation_id on each object
      await Promise.allSettled(
        ids.map((id: string) =>
          axios.patch(
            `${this.baseUrl}/v1/objects/${this.className}/${id}`,
            { properties: { conversation_id: newConversationId } },
            { headers: { 'Content-Type': 'application/json' } }
          )
        )
      );
    } catch (error) {
      console.error('[WeaviateService] Error renaming conversation:', error);
      throw error;
    }
  }
}

export default new WeaviateService();

