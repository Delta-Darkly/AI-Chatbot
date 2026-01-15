# 🤖 Dank AI Agent with Weaviate Memory

> A production-ready Dank AI agent template demonstrating how to build AI agents with persistent memory using **Weaviate** vector database for RAG (Retrieval Augmented Generation). This agent can be used standalone or as a starting point for your own Dank AI projects.

[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/Docker-Required-blue.svg)](https://www.docker.com/)

---

## 📋 Table of Contents

- [What is This?](#what-is-this)
- [What is Dank AI?](#what-is-dank-ai)
- [How It Works](#how-it-works)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Configuration](#configuration)
- [Weaviate Integration](#weaviate-integration)
- [RAG (Retrieval Augmented Generation)](#rag-retrieval-augmented-generation)
- [Message Schema](#message-schema)
- [Callback Handlers](#callback-handlers)
- [Local vs Production Setup](#local-vs-production-setup)
- [Deployment to Dank Cloud](#deployment-to-dank-cloud)
- [Testing](#testing)
- [Customization](#customization)
- [Troubleshooting](#troubleshooting)
- [API Reference](#api-reference)

---

## What is This?

This is a **Dank AI agent** that demonstrates how to build AI agents with **persistent memory** using Weaviate. The agent:

- ✅ Receives prompts via HTTP (`/prompt` endpoint)
- ✅ Retrieves relevant conversation history from Weaviate (RAG)
- ✅ Enhances prompts with retrieved context
- ✅ Calls LLM (OpenAI/Anthropic/Google AI) with enhanced prompts
- ✅ Stores all messages in Weaviate for future context
- ✅ Links assistant responses to user messages (parent linking)

**Perfect for:**
- Learning how to integrate Weaviate with Dank AI agents
- Using as a template for your own agents with memory
- Understanding RAG implementation patterns
- Seeing how Dank AI callback hooks work

---

## What is Dank AI?

**Dank AI** is a JavaScript-based framework for building and deploying AI agents. Instead of complex Python setups, you can:

- ✅ Write agent logic in JavaScript/TypeScript
- ✅ Configure agents via `dank.config.js` files
- ✅ Use callback hooks for pre/post-processing (e.g., `request_output:start`, `request_output:end`)
- ✅ Deploy to production with one click on **Dank Cloud**

**Key Benefits:**
- **Simple**: No Python or complex ML frameworks needed
- **Fast Deployment**: Push to GitHub → Connect to Dank Cloud → Deploy (one click)
- **Flexible**: Easy to add tools, modify prompts, integrate external services
- **Production-Ready**: Built-in logging, error handling, deployment infrastructure

Think of it as "Vercel for AI agents" - you write JavaScript, push to GitHub, and deploy with a single click.

---

## How It Works

### Architecture Flow

```
User Request
    │
    │ POST /prompt
    │ { prompt, userId, conversationId }
    ▼
┌─────────────────────┐
│  Dank AI Agent      │
│  (dank.config.js)   │
└──────────┬──────────┘
           │
           │ request_output:start
           │ (Callback Hook)
           ▼
┌─────────────────────┐       ┌──────────────┐
│  Weaviate Handlers  │──────>│  Weaviate    │
│  (RAG Retrieval)    │<──────│  (Vector DB) │
└──────────┬──────────┘       └──────────────┘
           │
           │ Enhanced Prompt
           │ (Original + Context)
           ▼
┌─────────────────────┐
│  LLM                │
│  (OpenAI/etc.)      │
└──────────┬──────────┘
           │
           │ Response
           ▼
┌─────────────────────┐
│  request_output:end │
│  (Store Messages)   │
└──────────┬──────────┘
           │
           │ Store in Weaviate
           ▼
┌─────────────────────┐
│  Return Response    │
│  to User            │
└─────────────────────┘
```

### Request Lifecycle

1. **User sends message** → POST to `/prompt` with `{ prompt, userId, conversationId }`
2. **`request_output:start` fires** → Agent retrieves conversation context from Weaviate (RAG)
3. **Prompt enhancement** → Agent combines user message with retrieved context
4. **LLM call** → Enhanced prompt sent to OpenAI/Anthropic/etc.
5. **`request_output:end` fires** → Agent stores both user message and assistant response in Weaviate
6. **Response returned** → User receives assistant's reply

### RAG Flow Example

```
User: "What did we discuss yesterday?"

1. Agent queries Weaviate:
   - Searches for messages from yesterday
   - Uses vector similarity (nearText) to find relevant messages
   - Filters by userId and conversationId

2. Agent retrieves context:
   "Previous conversation context:
    User: We talked about machine learning
    Assistant: Machine learning is a subset of AI..."

3. Agent enhances prompt:
   "Previous conversation context: [retrieved messages]
    User: What did we discuss yesterday?"

4. LLM responds with context-aware answer
```

---

## Prerequisites

Before you begin, ensure you have:

- [ ] **Node.js** 20+ installed ([Download Node.js](https://nodejs.org/))
- [ ] **Docker** installed and running ([Download Docker](https://www.docker.com/products/docker-desktop))
- [ ] **OpenAI API Key** (or Anthropic/Google AI key) - [Get OpenAI key](https://platform.openai.com/api-keys)
- [ ] **Dank AI CLI** (comes with `dank-ai` package, use via `dank` command)

---

## Quick Start

### First-Time Setup

1. **Navigate to agent directory**
   ```bash
   cd ai-chatbot-weaviate
   ```

2. **Set up environment**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your API key:
   ```bash
   OPENAI_API_KEY=sk-your-actual-api-key-here
   ```

3. **Generate unique Agent ID** (required for deployment)
   ```bash
   node -e "console.log(require('uuid').v4())"
   ```
   
   Copy the generated UUID and update `dank.config.js`:
   ```javascript
   const AGENT_IDS = {
     PROMPT_AGENT: 'your-generated-uuid-here'  // Replace with your UUID
   };
   ```

4. **Start Weaviate locally** (optional, for local testing)
   ```bash
   docker compose up -d
   ```

5. **Run the agent**
   ```bash
   dank run
   ```

   The agent will start on `http://localhost:3000`

6. **Test the agent**
   ```bash
   curl -X POST http://localhost:3000/prompt \
     -H "Content-Type: application/json" \
     -d '{
       "prompt": "Hello!",
       "userId": "test-user",
       "conversationId": "test-convo-1"
     }'
   ```

### Running Options

**Agent only:**
```bash
dank run
```

**Weaviate only (local):**
```bash
docker compose up -d   # Start
docker compose down   # Stop
```

**Both (from repo root):**
```bash
npm run chatbot       # Starts Weaviate + Agent + Frontend
npm run chatbot-stop  # Stops everything
```

---

## Project Structure

```
ai-chatbot-weaviate/
├── README.md                 # This file
├── dank.config.js            # Agent configuration & callback hooks
├── weaviate-handlers.js      # Weaviate integration (RAG, storage)
├── docker-compose.yml        # Local Weaviate setup
├── .env                      # Environment variables (create from .env.example)
└── .env.example              # Environment variable template
```

### Key Files

- **`dank.config.js`**: Defines the agent, LLM configuration, and registers callback handlers
- **`weaviate-handlers.js`**: Contains all Weaviate operations (schema creation, message storage, RAG retrieval)
- **`docker-compose.yml`**: Configures local Weaviate instance with vectorizer

---

## Configuration

### Environment Variables

Create a `.env` file from `.env.example`:

```bash
# Required: LLM API Key (choose one)
OPENAI_API_KEY=sk-your-key-here
# ANTHROPIC_API_KEY=your_anthropic_api_key_here
# GOOGLE_AI_API_KEY=your_google_ai_api_key_here

# Weaviate Configuration
WEAVIATE_ENV=local                    # 'local' or 'prod'
WEAVIATE_DANK_API_KEY=your-key       # Only for hosted Weaviate (i.e. prod)
WEAVIATE_DANK_PROJECT_ID=your-id     # Only for hosted Weaviate (i.e. prod)
WEAVIATE_HOST=https://weaviate.ai-dank.xyz  # Hosted Weaviate URL (this doesn't change)
WEAVIATE_LOCAL_HOST=http://host.docker.internal:8080  # Local Weaviate (this doesn't change)
```

### Environment Variable Reference

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `OPENAI_API_KEY` | Yes* | OpenAI API key for LLM | - |
| `ANTHROPIC_API_KEY` | Yes* | Anthropic API key (alternative) | - |
| `GOOGLE_AI_API_KEY` | Yes* | Google AI API key (alternative) | - |
| `WEAVIATE_ENV` | No | `'local'` or `'prod'` | `'prod'` |
| `WEAVIATE_DANK_API_KEY` | For prod | Dank API key for hosted Weaviate | - |
| `WEAVIATE_DANK_PROJECT_ID` | For prod | Project ID for multi-tenancy | - |
| `WEAVIATE_HOST` | For prod | Hosted Weaviate URL | `https://weaviate.ai-dank.xyz` |
| `WEAVIATE_LOCAL_HOST` | For local | Local Weaviate URL | `http://host.docker.internal:8080` |

\* You need at least one LLM API key. Update `dank.config.js` to use the corresponding provider.

### Switching LLM Providers

To switch from OpenAI to Anthropic or Google AI:

1. **Update `.env`** - Use the appropriate API key variable
2. **Update `dank.config.js`** - Change the `.setLLM()` call:

   ```javascript
   // For OpenAI (default)
   .setLLM('openai', {
     apiKey: process.env.OPENAI_API_KEY,
     model: 'gpt-3.5-turbo',
     temperature: 0.7
   })
   
   // For Anthropic
   .setLLM('anthropic', {
     apiKey: process.env.ANTHROPIC_API_KEY,
     model: 'claude-3-sonnet-20240229',
     temperature: 0.7
   })
   
   // For Google AI
   .setLLM('google', {
     apiKey: process.env.GOOGLE_AI_API_KEY,
     model: 'gemini-pro',
     temperature: 0.7
   })
   ```

---

## Weaviate Integration

### What is Weaviate?

**Weaviate** is a vector database that stores data as **vectors** (numerical representations) instead of just text. This enables:

- **Semantic Search**: Find similar messages, not just exact matches
- **RAG**: Retrieve relevant past conversations to provide context
- **Persistent Memory**: Store all conversations for long-term context

### How This Agent Uses Weaviate

The agent uses Weaviate for three main operations:

1. **Schema Management**: Creates the `Messages` class if it doesn't exist
2. **Message Storage**: Saves all user and assistant messages with metadata
3. **Context Retrieval**: Searches for relevant past messages using vector similarity

### Weaviate Client Configuration

The agent automatically configures the Weaviate client based on `WEAVIATE_ENV`:

- **`WEAVIATE_ENV=local`**: Connects to local Docker Weaviate (no auth)
- **`WEAVIATE_ENV=prod`**: Connects to hosted Weaviate (adds `X-API-Key` and `X-Project-ID` headers)

The client is created in `weaviate-handlers.js` via `getWeaviateClient()`.

---

## RAG (Retrieval Augmented Generation)

### What is RAG?

**RAG (Retrieval Augmented Generation)** is a technique where the agent:

1. **Retrieves** relevant information from a knowledge base (Weaviate)
2. **Augments** the user's prompt with this retrieved context
3. **Generates** a response using both the original prompt and the context

This allows the agent to "remember" past conversations and provide context-aware responses.

### How RAG Works in This Agent

**Step 1: User sends message**
```json
{
  "prompt": "What did we talk about yesterday?",
  "userId": "user123",
  "conversationId": "chat-456"
}
```

**Step 2: `request_output:start` callback fires**

The agent calls `getConversationContext()` which:

1. Queries Weaviate using `nearText` (vector similarity search)
2. Filters by `userId` and `conversationId`
3. Sorts results chronologically
4. Returns the most relevant past messages

**Step 3: Prompt Enhancement**

The retrieved context is prepended to the user's message:

```
Previous conversation context:

User: Yesterday we discussed machine learning basics
Assistant: Machine learning is a subset of artificial intelligence...

User: What did we talk about yesterday?
```

**Step 4: LLM receives enhanced prompt**

The LLM now has context about what was discussed, allowing it to give a relevant answer.

**Step 5: Response stored**

After the LLM responds, both the user message and assistant response are stored in Weaviate for future queries.

### RAG Parameters

You can adjust RAG behavior in `weaviate-handlers.js`:

- **`limit`**: Number of messages to retrieve (default: 10)
- **`certainty`**: Minimum similarity threshold (default: 0.5)

```javascript
// In getConversationContext()
.withNearText({ concepts: [currentPrompt], certainty: 0.5 })
.withLimit(limit * 2)  // Retrieves 2x limit, then takes top N chronologically
```

---

## Message Schema

### Dank Cloud Messages Schema

When using hosted Weaviate on Dank Cloud, you **must** use the `Messages` class with this exact schema:

```javascript
{
  class: 'Messages',
  properties: [
    { name: 'role', dataType: ['text'] },           // 'user' or 'assistant'
    { name: 'content', dataType: ['text'] },        // Message content
    { name: 'conversation_id', dataType: ['text'] }, // Groups messages into conversations
    { name: 'message_id', dataType: ['text'] },     // Unique ID for each message
    { name: 'parent_id', dataType: ['text'] },      // Links assistant replies to user messages
    { name: 'timestamp', dataType: ['date'] },       // When message was sent
    { name: 'user_id', dataType: ['text'] },        // Identifies the user
    { name: 'metadata', dataType: ['text'] }         // Optional JSON string for extra data
  ]
}
```

### Example Stored Message

```json
{
  "role": "user",
  "content": "What is machine learning?",
  "conversation_id": "chat-456",
  "message_id": "msg-789",
  "parent_id": null,
  "timestamp": "2026-01-15T10:30:00Z",
  "user_id": "user123",
  "metadata": "{}"
}
```

### Field Descriptions

| Field | Purpose | Example |
|-------|---------|---------|
| `role` | Identifies message sender | `"user"` or `"assistant"` |
| `content` | The actual message text | `"Hello, how are you?"` |
| `conversation_id` | Groups messages into conversations | `"chat-456"` |
| `message_id` | Unique identifier for each message | `"msg-789"` (UUID) |
| `parent_id` | Links assistant replies to user messages | `"msg-789"` (references user message) |
| `timestamp` | When the message was created | ISO 8601 date string |
| `user_id` | Identifies the user | `"user123"` |
| `metadata` | Optional JSON for extra data | `"{\"source\": \"web\"}"` |

### Parent Linking

**Parent linking** connects assistant responses to the user message that triggered them:

- **User message**: `parent_id = null` (no parent)
- **Assistant response**: `parent_id = message_id` of the user message

This creates a conversation tree, allowing you to:
- Track which user message each response answers
- Build conversation threads
- Understand conversation flow

### Multi-Tenancy

Hosted Weaviate on Dank Cloud uses **multi-tenancy**, meaning:
- Each project has its own "tenant" (identified by `WEAVIATE_DANK_PROJECT_ID`)
- You cannot create new classes - only use the `Messages` class
- All operations must include the `tenant` argument
- The agent automatically handles this via `getTenant()` function

If you need custom classes, deploy your own Weaviate instance and set `WEAVIATE_HOST` to your custom URL.

---

## Callback Handlers

Dank AI agents use **callback hooks** to execute code at specific points in the request lifecycle.

### Available Callbacks

This agent uses two main callbacks:

1. **`request_output:start`**: Fires **before** the LLM is called
2. **`request_output:end`**: Fires **after** the LLM responds

### `request_output:start` Handler

**When it fires**: Before the LLM is called

**What it does**:
1. Retrieves conversation context from Weaviate (RAG)
2. Stores the user message in Weaviate
3. Enhances the prompt with retrieved context
4. Returns the enhanced prompt to be sent to the LLM

**Code location**: `weaviate-handlers.js` → `handleRequestOutputStart()`

**Flow**:
```
User message received
    ↓
Query Weaviate for relevant past messages
    ↓
Store user message in Weaviate
    ↓
Combine user message + retrieved context
    ↓
Return enhanced prompt to Dank AI
    ↓
LLM receives enhanced prompt
```

### `request_output:end` Handler

**When it fires**: After the LLM responds

**What it does**:
1. Finds the user message ID (to link the response)
2. Stores the assistant response in Weaviate
3. Links the response to the user message via `parent_id`

**Code location**: `weaviate-handlers.js` → `handleRequestOutputEnd()`

**Flow**:
```
LLM response received
    ↓
Find user message ID in Weaviate
    ↓
Store assistant response
    ↓
Set parent_id = user message ID
    ↓
Response linked to user message
```

### Other Callbacks

The agent also registers these callbacks for logging:

- **`request_output`**: Logs prompt, enhanced prompt, and response (called after llm response, but before request_output:end)
- **`request_output:error`**: Logs errors during processing
- **`output`**: Logs system output
- **`error`**: Logs system errors

### Extending Callbacks

You can add custom logic to any callback:

```javascript
.addHandler('request_output:start', async (data) => {
  // Your custom logic here
  const { handleRequestOutputStart } = require('./weaviate-handlers');
  return await handleRequestOutputStart(data);
})
```

---

## Local vs Production Setup

### Local Development

**Weaviate Setup:**
- Runs via Docker Compose (`docker compose up -d`)
- Uses local `text2vec-transformers` vectorizer (no API key needed)
- Accessible at `http://localhost:8080` (from host) or `http://host.docker.internal:8080` (from Docker)
- No authentication required

**Agent Setup:**
- Set `WEAVIATE_ENV=local` in `.env`
- Agent connects to `WEAVIATE_LOCAL_HOST` (default: `http://host.docker.internal:8080`)
- No auth headers sent

**Vectorizer Options:**

The default `docker-compose.yml` uses `text2vec-transformers` (local, no API key). To switch to `text2vec-openai`:

1. Open `docker-compose.yml`
2. Comment out the `text2vec-transformers` configuration (3 lines)
3. Comment out the `t2v` service
4. Uncomment the `text2vec-openai` configuration (3 lines)
5. Requires `OPENAI_API_KEY` in your environment

### Production (Dank Cloud)

**Weaviate Setup:**
- Hosted on Dank Cloud (one-click deployment)
- Uses Dank Cloud's vectorizer
- Requires authentication (`X-API-Key` and `X-Project-ID` headers)
- Multi-tenant (each project is a separate tenant)

**Agent Setup:**
- Set `WEAVIATE_ENV=prod` in `.env` (or leave unset - defaults to `prod`)
- Set `WEAVIATE_DANK_API_KEY` and `WEAVIATE_DANK_PROJECT_ID`
- Agent connects to `WEAVIATE_HOST` (default: `https://weaviate.ai-dank.xyz`)
- Auth headers automatically added

**Default Behavior:**
- If `WEAVIATE_ENV` is unset, defaults to `'prod'`
- Host defaults to `https://weaviate.ai-dank.xyz` (set in code)
- Only override `WEAVIATE_HOST` if using a custom Weaviate deployment

### Custom Weaviate Deployment

If you deploy your own Weaviate instance:

1. Set `WEAVIATE_HOST` to your Weaviate URL
2. Leave `WEAVIATE_DANK_API_KEY` and `WEAVIATE_DANK_PROJECT_ID` blank if not required
3. Set `WEAVIATE_ENV=prod` (or any value other than `'local'`)

---

## Deployment to Dank Cloud

> **⚠️ Important**: Before deploying, ensure your agent ID in `dank.config.js` is unique. Deployment will fail if you use an existing agent ID. Generate a new UUIDv4 using `node -e "console.log(require('uuid').v4())"` and update `AGENT_IDS.PROMPT_AGENT` in `dank.config.js`.

### Step-by-Step Deployment

1. **Push to GitHub**
   ```bash
   git push origin main
   ```

2. **Create Project on Dank Cloud**
   - Sign in to [Dank Cloud](https://cloud.ai-dank.xyz)
   - Go to the Projects page
   - Connect your GitHub account (or click "Browse Repositories" if already connected)
   - Select your project repository to create a new Dank Cloud project

3. **Configure and Deploy Project**
   - Set **Dank Config Path**: `ai-chatbot-weaviate/dank.config.js` (or just `dank.config.js` if this directory is the root)
   - Add a Secret at the bottom: `OPENAI_API_KEY` = your OpenAI API key
   - Click **Deploy**
   - Wait for deployment to complete

4. **Create API Key for Weaviate**
   - On the project dashboard, click to create a new API key (e.g., name it `weaviate_key`)
   - **Save this key immediately** - it won't be shown to you again

5. **Enable Weaviate Service**
   - Click **Weaviate** under "Hosted Services"
   - Select the API key you just created to activate the Weaviate service for your project

6. **Add Environment Variables**
   - Add `WEAVIATE_DANK_API_KEY`: The API key you created in step 4
   - Add `WEAVIATE_DANK_PROJECT_ID`: Copy the Project ID from the project overview at the top of the dashboard

7. **Rebuild and Deploy**
   - Click the **3 dots** next to the most recent build
   - Click **Rebuild and Deploy**
   - Wait for deployment to complete
   - Your agent should now be running and connected to Weaviate! 🎉

8. **Optional: Secure Agent Endpoint**
   - You can attach an API key to the `/prompt` endpoint to keep it secure
   - Configure this in your project settings if needed

### Testing Your Deployed Agent

1. **Get Agent URL**
   - Copy the agent URL from the "Agents" section (you may need to refresh the page)

2. **Test with curl**

   **Without API key:**
   ```bash
   curl -X POST https://<your-agent-id>.ai-dank.xyz/prompt \
     -H "Content-Type: application/json" \
     -d '{
       "prompt": "Hello!",
       "userId": "test-user",
       "conversationId": "test-convo-1"
     }'
   ```

   **With API key (if configured):**
   ```bash
   curl -X POST https://<your-agent-id>.ai-dank.xyz/prompt \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer <your-agent-api-key>" \
     -d '{
       "prompt": "Hello!",
       "userId": "test-user",
       "conversationId": "test-convo-1"
     }'
   ```

3. **View Logs**
   - Open the agent logs from the project dashboard (bottom of "Agents" section)
   - Enable "Live Stream" at the top to see requests coming in and RAG taking place

4. **View Stored Data**
   - Click "Explore Collections" under the Weaviate Service section
   - Click "Messages" to see everything being stored in your vector database

---

## Testing

### Testing Locally

1. **Start Weaviate**
   ```bash
   docker compose up -d
   ```

2. **Start Agent**
   ```bash
   dank run
   ```

3. **Send Test Request**
   ```bash
   curl -X POST http://localhost:3000/prompt \
     -H "Content-Type: application/json" \
     -d '{
       "prompt": "Hello, my name is Alice",
       "userId": "alice",
       "conversationId": "chat-1"
     }'
   ```

4. **Send Follow-up (tests RAG)**
   ```bash
   curl -X POST http://localhost:3000/prompt \
     -H "Content-Type: application/json" \
     -d '{
       "prompt": "What is my name?",
       "userId": "alice",
       "conversationId": "chat-1"
     }'
   ```

   The agent should remember your name from the previous message!

### Testing Against Production Weaviate

To test your local agent against a production Weaviate instance:

1. **Enable Weaviate in Dank Cloud** (see deployment steps above)
2. **Get your API key and Project ID** from the Dank Cloud dashboard
3. **Update `.env`**:
   ```bash
   WEAVIATE_ENV=prod
   WEAVIATE_DANK_API_KEY=your-key
   WEAVIATE_DANK_PROJECT_ID=your-project-id
   ```
4. **Run agent locally**:
   ```bash
   dank run
   ```

The agent will now connect to your hosted Weaviate instance instead of local Docker.

### Verifying RAG is Working

1. **Send initial message**:
   ```bash
   curl -X POST http://localhost:3000/prompt \
     -H "Content-Type: application/json" \
     -d '{
       "prompt": "I love pizza",
       "userId": "test",
       "conversationId": "test-1"
     }'
   ```

2. **Check logs** - You should see:
   ```
   [Weaviate] No relevant messages found via vector search
   ```

3. **Send follow-up**:
   ```bash
   curl -X POST http://localhost:3000/prompt \
     -H "Content-Type: application/json" \
     -d '{
       "prompt": "What do I love?",
       "userId": "test",
       "conversationId": "test-1"
     }'
   ```

4. **Check logs** - You should now see:
   ```
   [Weaviate] Message 1: role=user, similarity=0.XXX, timestamp=...
   [Weaviate] Retrieved context: Previous conversation context: ...
   ```

5. **Check response** - The agent should reference pizza in its response

---

## Customization

### Changing the System Prompt

Edit `dank.config.js`:

```javascript
.setPrompt(`Your custom system prompt here...`)
```

### Adding Tools

You can add tools that the agent can use:

```javascript
.addTool('search_web', {
  description: 'Search the web for information',
  handler: async (query) => {
    // Your tool implementation
    return searchResults;
  }
})
```

Then invoke tools in callbacks:

```javascript
.addHandler('request_output:end', async (data) => {
  // Existing Weaviate storage
  const { handleRequestOutputEnd } = require('./weaviate-handlers');
  await handleRequestOutputEnd(data);
  
  // Add tool calls if needed
  if (shouldUseTool(data)) {
    const result = await data.agent.tools.search_web(data.prompt);
    // Process result...
  }
})
```

### Adjusting RAG Parameters

In `weaviate-handlers.js`, modify `getConversationContext()`:

```javascript
// Change similarity threshold (0.0 to 1.0, higher = more similar required)
.withNearText({ concepts: [currentPrompt], certainty: 0.7 })  // Was 0.5

// Change number of messages retrieved
.withLimit(20)  // Was limit * 2
```

### Changing LLM Model

In `dank.config.js`:

```javascript
.setLLM('openai', {
  apiKey: process.env.OPENAI_API_KEY,
  model: 'gpt-4',  // Change from 'gpt-3.5-turbo'
  temperature: 0.7
})
```

### Modifying Logging

Add or modify handlers in `dank.config.js`:

```javascript
.addHandler('request_output', (data) => {
  // Custom logging
  console.log('Custom log:', {
    prompt: data.prompt,
    response: data.response,
    timestamp: new Date().toISOString()
  });
})
```

---

## Troubleshooting

### Common Issues

#### "Tenant not found" Error

**Error**: `tenant not found` when querying Weaviate

**Cause**: The tenant (project ID) doesn't exist yet in Weaviate

**Solution**: 
- This is normal on first use - the tenant is created automatically when you write the first message
- The agent handles this gracefully by catching the error and proceeding
- If it persists, verify `WEAVIATE_DANK_PROJECT_ID` is correct

#### "Cannot connect to Weaviate"

**Error**: Connection refused or timeout

**Local:**
- Ensure Docker is running: `docker ps`
- Check Weaviate is up: `docker compose ps`
- Verify `WEAVIATE_ENV=local` and `WEAVIATE_LOCAL_HOST` is correct

**Production:**
- Verify `WEAVIATE_DANK_API_KEY` and `WEAVIATE_DANK_PROJECT_ID` are set correctly
- Check Weaviate service is enabled in Dank Cloud dashboard
- Verify `WEAVIATE_HOST` is correct (default: `https://weaviate.ai-dank.xyz`)

#### "Agent ID already exists"

**Error**: Deployment fails with agent ID conflict

**Solution**:
- Generate a new UUID: `node -e "console.log(require('uuid').v4())"`
- Update `AGENT_IDS.PROMPT_AGENT` in `dank.config.js`
- Push and redeploy

#### "No messages found" (RAG not working)

**Symptoms**: Agent doesn't remember past conversations

**Check**:
1. Verify messages are being stored (check Weaviate directly or logs)
2. Check `userId` and `conversationId` match between requests
3. Verify `certainty` threshold isn't too high (try lowering to 0.3)
4. Check logs for Weaviate query errors

#### "Schema creation failed"

**Error**: Cannot create Messages class

**Local:**
- Check Docker container is running
- Verify Weaviate is accessible at `WEAVIATE_LOCAL_HOST`

**Production:**
- You cannot create schemas on hosted Weaviate - the `Messages` class already exists
- The `ensureSchema()` function will detect this and skip creation
- If you see this error, check your authentication headers

### Debugging Tips

1. **Check Agent Logs**
   - Local: Check console output or `logs/agent.log` (if run from root)
   - Production: View logs in Dank Cloud dashboard

2. **Check Weaviate Directly**
   - Local: Visit `http://localhost:8080/v1/meta` to verify it's running
   - Production: Use "Explore Collections" in Dank Cloud dashboard

3. **Test Weaviate Connection**
   ```bash
   # Local
   curl http://localhost:8080/v1/meta
   
   # Production (requires auth)
   curl https://weaviate.ai-dank.xyz/v1/meta \
     -H "X-API-Key: your-key" \
     -H "X-Project-ID: your-id"
   ```
   
---

## API Reference

### `/prompt` Endpoint

**Method**: `POST`

**URL**: 
- Local: `http://localhost:3000/prompt`
- Production: `https://<your-agent-id>.ai-dank.xyz/prompt`

**Headers**:
```
Content-Type: application/json
Authorization: Bearer <api-key>  # Optional, if agent requires auth
```

**Request Body**:
```json
{
  "prompt": "Your message here",
  "userId": "unique-user-id",
  "conversationId": "unique-conversation-id"
}
```

**Response**:
```json
{
  "response": "Assistant's reply here"
}
```

**Example Request**:
```bash
curl -X POST http://localhost:3000/prompt \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "What is the weather?",
    "userId": "user123",
    "conversationId": "chat-456"
  }'
```

**Example Response**:
```json
{
  "response": "I don't have access to real-time weather data, but I can help you find weather information if you'd like!"
}
```

### Handler Functions

#### `handleRequestOutputStart(data)`

Called before LLM request. Retrieves context and stores user message.

**Parameters**:
- `data.prompt`: User's message
- `data.userId`: User identifier
- `data.conversationId`: Conversation identifier

**Returns**: Enhanced prompt with context

#### `handleRequestOutputEnd(data)`

Called after LLM response. Stores assistant message and links to user message.

**Parameters**:
- `data.prompt`: Original user message
- `data.response`: LLM response
- `data.userId`: User identifier
- `data.conversationId`: Conversation identifier

**Returns**: `void`

---

## Next Steps

1. **Customize the Prompt**: Modify the system prompt in `dank.config.js` for your use case
2. **Add Tools**: Extend the agent with custom tools (web search, database queries, etc.)
3. **Adjust RAG**: Tune similarity thresholds and message limits for your needs
4. **Deploy**: Follow the deployment guide to get your agent live on Dank Cloud
5. **Integrate**: Use the agent in your own applications via the `/prompt` endpoint

---

**Built with ❤️ using [Dank AI](https://ai-dank.xyz) and [Weaviate](https://weaviate.io)**
