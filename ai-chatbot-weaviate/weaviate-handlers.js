/**
 * Weaviate Integration Handlers (hosted Messages schema)
 * Uses headers (X-API-Key, X-Project-ID) from env/inline
 */

let currentWeaviateHost = '';

/**
 * Get tenant ID (project ID) for multi-tenant operations
 * Returns null for local mode (no multi-tenancy)
 */
function getTenant() {
  const mode = process.env.WEAVIATE_ENV || 'prod';
  if (mode === 'local') return null;
  return process.env.WEAVIATE_DANK_PROJECT_ID || null;
}

function getWeaviateClient() {
  const weaviate = require('weaviate-ts-client');
  const mode = process.env.WEAVIATE_ENV || 'prod'; // 'local' or 'prod'
  const apiKey = process.env.WEAVIATE_DANK_API_KEY;
  const projectId = process.env.WEAVIATE_DANK_PROJECT_ID;
  const prodHostRaw = process.env.WEAVIATE_HOST || 'https://weaviate.ai-dank.xyz'; // Dank cloud weaviate host, can be replaced by independently deployed weaviate host (e.g. droplet deployment)
  const localHostRaw = process.env.WEAVIATE_LOCAL_HOST || 'http://host.docker.internal:8080'; // Run docker-compose up -d to start weaviate locally

  const parseHost = (raw, fallbackScheme) => {
    try {
      const url = new URL(raw.startsWith('http') ? raw : `${fallbackScheme}://${raw}`);
      return { scheme: url.protocol.replace(':', ''), host: url.host };
    } catch {
      return { scheme: fallbackScheme, host: raw };
    }
  };

  const headers = {};
  let { scheme, host } = parseHost(prodHostRaw, 'https');

  if (mode === 'local') {
    ({ scheme, host } = parseHost(localHostRaw, 'http'));
  } else {
    if (apiKey) headers['X-API-Key'] = apiKey;
    if (projectId) headers['X-Project-ID'] = projectId;
  }

  currentWeaviateHost = `${scheme}://${host}`;

  return weaviate.default.client({
    scheme,
    host,
    headers,
  });
}

/**
 * Ensure Messages class exists (hosted schema)
 */
async function ensureSchema(client) {
  const className = 'Messages';
  const schemaExists = await client.schema.exists(className);
  if (schemaExists) return className;

  const classDef = {
    class: className,
    description: 'Chat messages',
    properties: [
      { name: 'role', dataType: ['text'] },
      { name: 'content', dataType: ['text'] },
      { name: 'conversation_id', dataType: ['text'] },
      { name: 'message_id', dataType: ['text'] },
      { name: 'parent_id', dataType: ['text'] },
      { name: 'timestamp', dataType: ['date'] },
      { name: 'user_id', dataType: ['text'] },
      { name: 'metadata', dataType: ['text'] },
    ],
  };

  console.log('[Weaviate] Messages schema does not exist. Creating...');
  await client.schema.classCreator().withClass(classDef).do();
  console.log('[Weaviate] Messages schema created');
  return className;
}

/**
 * Retrieve conversation history via vector search
 * Filters by conversation_id AND user_id
 */
async function getConversationContext(client, className, userId, conversationId, currentPrompt, limit = 10) {
  const convo = conversationId || 'default-conversation';
  const user = userId || 'default-user';
  const tenant = getTenant();

  try {
    let query = client.graphql
      .get()
      .withClassName(className)
      .withFields('role content conversation_id message_id parent_id timestamp user_id metadata _additional { distance }')
      .withNearText({ concepts: [currentPrompt], certainty: 0.5 })
      .withWhere({
        operator: 'And',
        operands: [
          { path: ['conversation_id'], operator: 'Equal', valueString: convo },
          { path: ['user_id'], operator: 'Equal', valueString: user },
        ],
      })
      .withLimit(limit * 2);
    
    if (tenant) {
      query = query.withTenant(tenant);
    }

    const result = await query.do();

    if (result.data?.Get?.[className]?.length) {
      const messages = result.data.Get[className];
      messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      const chronological = messages.slice(-limit);
      let context = 'Previous conversation context:\n\n';
      chronological.forEach((msg, idx) => {
        const sim = msg._additional?.distance !== undefined ? (1 - msg._additional.distance).toFixed(3) : 'N/A';
        const roleLabel = msg.role === 'user' ? 'User' : 'Assistant';
        console.log(`[Weaviate] Message ${idx + 1}: role=${msg.role}, similarity=${sim}, timestamp=${msg.timestamp}`);
        context += `${roleLabel}: ${msg.content}\n\n`;
      });
      return context;
    }
  } catch (error) {
    // If tenant doesn't exist yet, treat as no context (tenant will be created on first write)
    if (error.message && error.message.includes('tenant not found')) {
      console.log('[Weaviate] Tenant does not exist yet, no previous context');
    } else {
      console.error('[Weaviate] Error retrieving conversation context:', error.message);
    }
  }
  console.log('[Weaviate] No relevant messages found via vector search');
  return '';
}

async function findUserMessageId(client, className, { userId, conversationId, content }) {
  const convo = conversationId || 'default-conversation';
  const user = userId || 'default-user';
  const tenant = getTenant();

  let query = client.graphql
    .get()
    .withClassName(className)
    .withFields('message_id content timestamp role conversation_id user_id')
    .withWhere({
      operator: 'And',
      operands: [
        { path: ['conversation_id'], operator: 'Equal', valueString: convo },
        { path: ['user_id'], operator: 'Equal', valueString: user },
        { path: ['role'], operator: 'Equal', valueString: 'user' },
        { path: ['content'], operator: 'Equal', valueString: content || '' },
      ],
    })
    .withLimit(5);
  
  if (tenant) {
    query = query.withTenant(tenant);
  }

  const result = await query.do();

  const messages = result.data?.Get?.[className] || [];
  if (!messages.length) return '';

  messages.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  return messages[0].message_id || '';
}

async function storeMessage(client, className, { role, content, conversationId, userId = 'default-user', parentId = '' }) {
  const convo = conversationId || 'default-conversation';
  const timestamp = new Date().toISOString();
  const messageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${role || 'message'}`;
  const tenant = getTenant();

  let creator = client.data.creator()
    .withClassName(className)
    .withProperties({
      role,
      content: content || '',
      conversation_id: convo,
      message_id: messageId,
      parent_id: parentId || '',
      timestamp,
      user_id: userId || 'default-user',
      metadata: JSON.stringify({ source: 'dank-agent' }),
    });
  
  if (tenant) {
    creator = creator.withTenant(tenant);
  }

  await creator.do();

  const parentInfo = role === 'assistant' && parentId ? ` parent=${parentId}` : '';
  console.log(`[Weaviate] Stored ${role} message: ${messageId} host=${currentWeaviateHost} user=${userId} convo=${convo}${parentInfo}`);
}

async function handleRequestOutputStart(data) {
  const userId = data.params?.userId;
  const conversationId = data.params?.conversationId;

  if (!userId || !conversationId) {
    console.warn('[Weaviate] Missing userId or conversationId - skipping memory.');
    return { prompt: data.prompt, warning: 'Agent memory disabled: userId and conversationId are required.' };
  }

  try {
    const client = getWeaviateClient();
    const className = await ensureSchema(client);
    
    // Query for context first (before writing current message, so it's not included in context)
    const conversationContext = await getConversationContext(client, className, userId, conversationId, data.prompt);

    // Write user message (creates tenant if it doesn't exist)
    await storeMessage(client, className, {
      role: 'user',
      content: data.prompt,
      conversationId,
      userId
    });

    let enhancedPrompt;
    if (conversationContext) {
      enhancedPrompt = `${conversationContext}\n\nCurrent User Question: ${data.prompt}\n\nPlease provide a comprehensive response that builds upon the conversation history above. If the user is asking for more detail or clarification, expand on previous points rather than repeating them.`;
    } else {
      enhancedPrompt = data.prompt;
    }

    return { prompt: enhancedPrompt };
  } catch (error) {
    console.error('[Weaviate] Error in request_output:start:', error.message);
    return { prompt: data.prompt };
  }
}

async function handleRequestOutputEnd(data) {
  const userId = data.params?.userId;
  const conversationId = data.params?.conversationId;

  if (!userId || !conversationId) {
    console.warn('[Weaviate] Missing userId or conversationId - skipping memory store.');
    return { response: `${data.response}\n\nWarning: agent memory disabled because userId and conversationId were not provided.` };
  }

  try {
    const client = getWeaviateClient();
    const className = await ensureSchema(client);
    
    // Try to find parent message ID (tenant should exist from handleRequestOutputStart, but handle gracefully)
    let parentUserMessageId = '';
    try {
      parentUserMessageId = await findUserMessageId(client, className, {
        userId,
        conversationId,
        content: data.prompt
      });
    } catch (error) {
      // If query fails (e.g., tenant doesn't exist), continue without parent ID
      console.log('[Weaviate] Could not find parent message ID, storing without parent reference');
    }

    // Always write assistant message (creates tenant if needed)
    if (data.response) {
      await storeMessage(client, className, {
        role: 'assistant',
        content: data.response,
        conversationId,
        userId,
        parentId: parentUserMessageId
      });
    }
  } catch (error) {
    console.error('[Weaviate] Error storing interaction:', error.message);
  }

  return { response: data.response };
}

module.exports = {
  handleRequestOutputStart,
  handleRequestOutputEnd,
  getWeaviateClient,
  ensureSchema,
  getConversationContext,
  storeMessage
};

