# 🤖 AI Chatbot with Dank AI Agent + Weaviate Memory

> A production-ready, full-stack template demonstrating how to build an AI chatbot with persistent memory using **Dank AI** agents and **Weaviate** vector database. Optimized for quick local development (one command) and seamless deployment to production.

[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/Docker-Required-blue.svg)](https://www.docker.com/)

---

## 📋 Table of Contents

- [What is This?](#what-is-this)
- [What is Dank AI?](#what-is-dank-ai)
- [Architecture Overview](#architecture-overview)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [How It Works](#how-it-works)
- [Using as a Template](#using-as-a-template)
- [Environment Configuration](#environment-configuration)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Learn More](#learn-more)

---

## What is This?

This repository is a **complete, production-ready template** for building AI chatbots with:

- **🤖 Dank AI Agent**: JavaScript-based AI agent framework that makes it easy to build, configure, and deploy AI agents
- **🧠 Weaviate Memory**: Vector database for persistent conversation memory and RAG (Retrieval Augmented Generation)
- **💬 React Frontend**: Modern chat UI that demonstrates how to integrate with the agent and manage conversations

**Perfect for:**
- Learning how to integrate memory into Dank AI agents using Weaviate
- Using as a starting point for your own Dank AI agent projects
- Understanding Dank AI framework patterns (callbacks, configuration, deployment)
- Seeing how to add RAG and persistent memory to Dank agents

---

## What is Dank AI?

**Dank AI** is a framework that lets you build AI agents using JavaScript. Instead of complex Python setups or extensive infrastructure, you can:

- ✅ Write agent logic in JavaScript/TypeScript
- ✅ Configure agents via simple config files (`dank.config.js`)
- ✅ Use callback hooks for pre/post-processing (e.g., `request_output:start`, `request_output:end`)
- ✅ Deploy to production with one click on **Dank Cloud** (similar to Vercel for frontends)

**Key Benefits:**
- **Simple**: No need to learn Python or complex ML frameworks
- **Fast Deployment**: Push to GitHub → Connect to Dank Cloud → Deploy (one click)
- **Flexible**: Easy to add tools, modify prompts, and integrate with external services
- **Production-Ready**: Built-in logging, error handling, and deployment infrastructure

Think of it as "Vercel for AI agents" - you write JavaScript, push to GitHub, and deploy with a single click.

---

## Architecture Overview

```
┌─────────────────┐
│   Browser       │
│  (React UI)     │
└────────┬────────┘
         │
         │ HTTP Requests
         │ /api/agent/prompt
         │ /api/weaviate/*
         ▼
┌─────────────────────────────────────┐
│   Frontend Proxy Layer              │
│   (Vite locally / Vercel in prod)   │
│   - Handles CORS                    │
│   - Injects auth headers            │
└────────┬────────────────────────────┘
         │
         ├───────────────────┐
         │                   │              
         ▼                   ▼              
┌──────────────┐     ┌──────────────┐        
│   Agent      │     │  Weaviate    │
│  (Dank AI)   │     │  (Vector DB) │
│              │     │              │
│ - Processes  │────>│ - Stores     │
│   prompts    │     │   messages   │
│ - RAG        │     │ - Retrieves  │
│ - Logging    │     │   context    │
└──────┬───────┘     └──────────────┘
       │
       │ 
       ▼
┌──────────────┐
│   LLM        │
│  (OpenAI)    │
│              │
│ - Generates  │
│   responses  │
└──────────────┘
```

### Request Flow

1. **User sends message** → Frontend calls `/api/agent/prompt`
2. **Agent receives request** → Retrieves conversation context from Weaviate (RAG)
3. **Agent enhances prompt** → Adds retrieved context to user's message
4. **Agent calls LLM** → Sends enhanced prompt to OpenAI/Anthropic/etc.
5. **Agent stores messages** → Saves both user message and assistant response to Weaviate
6. **Frontend displays response** → Updates UI with assistant's reply

---

## Quick Start

### Prerequisites

Before you begin, ensure you have:

- [ ] **Docker** installed and running ([Download Docker](https://www.docker.com/products/docker-desktop))
- [ ] **Node.js** 20+ installed ([Download Node.js](https://nodejs.org/))
- [ ] **OpenAI API Key** (or Anthropic/Google AI key) - [Get one here](https://platform.openai.com/api-keys)

### First-Time Setup

1. **Fork the repository**
   
   **Option A: Fork from Dank Cloud (Recommended)**
   - Sign in to [Dank Cloud](https://cloud.ai-dank.xyz)
   - Go to Projects → New Project
   - Click "Browse Templates" or "Use Template"
   - Select this chatbot template
   - This will take you to GitHub to fork the repository
   
   **Option B: Fork directly from GitHub**
   - Go to this repository on GitHub
   - Click the "Fork" button in the top right
   
2. **Clone your forked repository**
   ```bash
   git clone https://github.com/YOUR-USERNAME/ai-chatbot-weaviate.git
   cd ai-chatbot-weaviate
   ```
   
   > **Why fork?** Forking creates your own copy that you can modify and deploy to your own Dank Cloud project. If you clone the original repo directly, you won't be able to push changes or deploy to your own project.

2. **Set up the agent environment**
   ```bash
   cd ai-chatbot-weaviate
   cp .env.example .env
   ```
   
   Edit `.env` and add your API key:
   ```bash
   OPENAI_API_KEY=sk-your-actual-api-key-here
   ```
   
   > **Note for deployment**: If you plan to deploy to Dank Cloud, ensure the agent ID in `dank.config.js` is unique. Generate a new UUIDv4 if needed (see [Deployment](#deployment) section for details).

3. **Run everything with one command**
   ```bash
   # From the root directory
   npm run chatbot
   ```

   This will:
   - ✅ Install dependencies (if needed)
   - ✅ Start Weaviate in Docker
   - ✅ Start the Dank AI agent
   - ✅ Start the React frontend

4. **Open your browser**
   - **Frontend**: http://localhost:5173 (this is what you need to test the chatbot)
   - Agent: http://localhost:3000 (runs automatically, no need to open)
   - Weaviate: http://localhost:8080 (optional - only if you want to inspect the database)

5. **Stop everything**
   ```bash
   npm run chatbot-stop
   ```

### What You Should See

- **Frontend**: Chat interface at `http://localhost:5173`
- **Agent logs**: 
  - Check `./logs/agent.log` for detailed request/response logs
  - Or view live logs in Docker Desktop: open Docker → click on the agent container → view logs
- **Frontend logs**: Check `./logs/frontend.log` for frontend activity

---

## Project Structure

```
ai-chatbot-weaviate/
├── README.md                    # This file
├── package.json                 # Root scripts (chatbot, chatbot-stop)
├── run-local.sh                 # One-command startup script
│
├── ai-chatbot-weaviate/         # Agent directory
│   ├── README.md                # Agent-specific documentation
│   ├── dank.config.js           # Agent configuration & callbacks
│   ├── weaviate-handlers.js     # Weaviate integration (RAG, storage)
│   ├── docker-compose.yml       # Local Weaviate setup
│   └── .env                     # Agent environment variables
│
├── chatbot-frontend/            # React frontend
│   ├── README.md                # Frontend-specific documentation
│   ├── src/
│   │   ├── services/
│   │   │   ├── agentService.ts  # Agent API client
│   │   │   └── weaviateService.ts # Weaviate API client
│   │   └── components/
│   │       └── Chatbot.tsx      # Main chat UI
│   ├── api/
│   │   ├── agent.js             # Vercel proxy for agent
│   │   └── weaviate.js          # Vercel proxy for Weaviate
│   ├── vite.config.js           # Vite dev server proxy config
│   └── .env                     # Frontend environment variables
│
└── logs/                        # Runtime logs
    ├── agent.log                # Agent request/response logs
    ├── frontend.log             # Frontend dev server logs
    └── pids/                    # Process IDs for cleanup
```

---

## How It Works

### Component Breakdown

#### 1. **Agent** (`ai-chatbot-weaviate/`)

The Dank AI agent handles:
- **Prompt Processing**: Receives user messages via HTTP POST to the `/prompt` endpoint (e.g., `https://<your-agent>.ai-dank.xyz/prompt` or `localhost:3000/prompt`). The request body should include `prompt` (the user's message), `userId` (to identify the user), and `conversationId` (to group messages into conversations) so the agent can save unique conversations for unique users in the vector database.
- **RAG (Retrieval Augmented Generation)**: Retrieves relevant conversation history from Weaviate before responding
- **LLM Integration**: Calls OpenAI/Anthropic/etc. with enhanced prompts
- **Memory Storage**: Saves all messages to Weaviate for future context

**Key Files:**
- `dank.config.js`: Defines the agent and registers callback hooks
- `weaviate-handlers.js`: Handles all Weaviate operations (schema, storage, retrieval)

#### 2. **Weaviate** (Vector Database)

Weaviate provides:
- **Persistent Memory**: Stores all conversation messages
- **Semantic Search**: Finds relevant past messages using vector similarity
- **Multi-tenancy**: Supports multiple users/conversations

**Runs:**
- **Locally**: Via Docker Compose (default)
- **Production**: Via Dank Cloud (one-click deployment). Requires authentication headers (`X-API-Key` and `X-Project-ID`) - see [Deployment](#deployment) section for details on obtaining your Dank API key and project ID from the dashboard.

#### 3. **Frontend** (`chatbot-frontend/`)

The React frontend provides:
- **Chat UI**: User interface for conversations
- **Service Layer**: `agentService.ts` and `weaviateService.ts` handle API calls
- **Proxy Layer**: Handles CORS and injects authentication headers

**Proxies:**
- **Local**: Vite dev server proxies to local services
- **Production**: Vercel serverless functions proxy to hosted services

### Data Flow Example

```
User: "What did we talk about yesterday?"

1. Frontend → POST /api/agent/prompt
   {
     "prompt": "What did we talk about yesterday?",
     "userId": "user123",
     "conversationId": "chat-456"
   }

2. Agent → Query Weaviate
   - Searches for messages from yesterday
   - Retrieves relevant conversation history
   - Saves user message

3. Agent → Enhance Prompt
   "Context from yesterday: [retrieved messages]
    User: What did we talk about yesterday?"

4. Agent → Call LLM (OpenAI)
   - Sends enhanced prompt
   - Receives response

5. Agent → Store in Weaviate
   - Saves assistant response
   - Links response to user message in database

6. Agent → Return Response
   {
     "response": "Yesterday we discussed..."
   }

7. Frontend → Display Response
   - Updates chat UI
```

---

## Using as a Template

This project is designed to be **forked and customized** for your own use cases.

### For Agent Development

**Copy the agent directory** (`ai-chatbot-weaviate/`) to start your own agent:

1. **Keep the memory backbone**: The Weaviate integration (`weaviate-handlers.js`) is production-ready and follows the Dank Cloud `Messages` schema (required for hosted Weaviate multi-tenancy)
2. **Customize the agent**: Modify `dank.config.js` to:
   - Change system prompts
   - Add custom tools
   - Modify callback behavior
3. **Deploy easily**: Already configured for Dank Cloud deployment

**What to reuse:**
- ✅ `weaviate-handlers.js` - Complete Weaviate integration
- ✅ `dank.config.js` structure - Callback pattern
- ✅ Environment variable setup
- ✅ Docker Compose for local Weaviate

### For Frontend Integration

**Copy the service files** to integrate with your own frontend:

1. **`agentService.ts`**: Drop into your project to call the agent
   - Handles prompt sending
   - Includes `userId` and `conversationId` for memory
   
2. **`weaviateService.ts`**: Drop into your project to manage conversations
   - List conversations
   - Load history
   - Delete/rename conversations
   - Compatible with Dank Cloud `Messages` schema

3. **Proxy patterns**: Copy the proxy setup to avoid CORS issues
   - **Local**: `vite.config.js` proxy configuration
   - **Production**: `api/agent.js` and `api/weaviate.js` (Vercel serverless functions)

**What to reuse:**
- ✅ Service files (`agentService.ts`, `weaviateService.ts`)
- ✅ Proxy configuration (Vite + Vercel)
- ✅ Environment variable patterns

---

## Environment Configuration

### Agent Environment (`ai-chatbot-weaviate/.env`)

```bash
# Required: LLM API Key
OPENAI_API_KEY=sk-your-key-here
# Or use: ANTHROPIC_API_KEY, GOOGLE_AI_API_KEY, swap env variable used in dank.config as well

# Weaviate Configuration
WEAVIATE_ENV=local                   # 'local' or 'prod'
WEAVIATE_DANK_API_KEY=your-key       # Only for hosted Weaviate (i.e. prod)
WEAVIATE_DANK_PROJECT_ID=your-id     # Only for hosted Weaviate (i.e. prod)
WEAVIATE_HOST=https://weaviate.ai-dank.xyz  # Hosted Weaviate URL (this doesn't change)
WEAVIATE_LOCAL_HOST=http://host.docker.internal:8080  # Local Weaviate (this doesn't change)
```

### Frontend Environment (`chatbot-frontend/.env`)

```bash
# Weaviate Configuration
WEAVIATE_ENV=local                   # 'local' or 'prod'
WEAVIATE_DANK_API_KEY=your-key       # Only for hosted Weaviate (i.e. prod)
WEAVIATE_DANK_PROJECT_ID=your-id     # Only for hosted Weaviate (i.e. prod)
WEAVIATE_HOST=https://weaviate.ai-dank.xyz # Hosted Weaviate URL (this doesn't change)
WEAVIATE_LOCAL_HOST=http://localhost:8080  # Local Weaviate (this doesn't change)

# Agent Configuration
AGENT_ENV=local                      # 'local' or 'prod'
AGENT_HOST=https://your-agent.ai-dank.xyz  # Hosted agent URL (get this from your dank cloud project dashboard)
AGENT_DANK_API_KEY=your-key          # If agent requires auth (configurable on dank cloud project dashboard)
AGENT_LOCAL_HOST=http://localhost:3000 # Local agent (this doesn't change)
```

### Environment Toggle Behavior

| Setting | Agent Behavior | Frontend Behavior |
|---------|----------------|-------------------|
| `WEAVIATE_ENV=local` | Connects to local Docker Weaviate | Proxies to `localhost:8080` |
| `WEAVIATE_ENV=prod` | Connects to hosted Weaviate (adds auth headers) | Proxies to hosted Weaviate (adds auth headers) |
| `AGENT_ENV=local` | N/A | Proxies to `localhost:3000` |
| `AGENT_ENV=prod` | N/A | Proxies to hosted agent (adds auth if configured) |

**💡 Tip**: You can mix and match! Test frontend against production agent/Weaviate by setting `AGENT_ENV=prod` or `WEAVIATE_ENV=prod` in the frontend `.env` while keeping the other local.

---

## Deployment

> **⚠️ Important**: Before deploying, ensure your agent ID in `ai-chatbot-weaviate/dank.config.js` is unique. Deployment will fail if you use an existing agent ID. Generate a new UUIDv4 using `uuid.v4()` (you can run `node -e "console.log(require('uuid').v4())"` in the `ai-chatbot-weaviate` directory).

### Agent + Weaviate (Dank Cloud)

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
   - Set **Dank Config Path**: `ai-chatbot-weaviate/dank.config.js`
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
   - Click **Rebuild and Deploy** at the bottom of the project page (click 3 dots next to the most recent build)
   - Wait for deployment to complete
   - Your agent should now be running and connected to Weaviate! 🎉

8. **Optional: Secure Agent Endpoint**
   - You can attach an API key to the `/prompt` endpoint to keep it secure
   - Configure this in your project settings if needed

9. **Test Your Agent** (Bonus)
   - Copy the agent URL from the "Agents" section (you may need to refresh the page)
   - Test with a curl request:
   
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
   
   - View logs: Open the agent logs from the project dashboard (bottom of "Agents" section) and enable "Live Stream" at the top to see requests coming in and RAG taking place
   - View stored data: Click "Explore Collections" under the Weaviate Service section, then click "Messages" to see everything being stored in your vector database

### Frontend (Vercel)

1. **Push to GitHub** (if not already done)

2. **Connect to Vercel**
   - Go to [Vercel](https://vercel.com)
   - Import your GitHub repository
   - Select the `chatbot-frontend` directory as the root
   - Set framework preset to "Vite"

3. **Set Environment Variables**
   ```
   WEAVIATE_DANK_API_KEY=your-key
   WEAVIATE_DANK_PROJECT_ID=your-id
   AGENT_HOST=https://your-agent.ai-dank.xyz
   AGENT_DANK_API_KEY=your-key  # If agent is configured to require auth
   ```

4. **Deploy**
   - Click "Deploy"
   - Vercel will build and deploy automatically
   - Your frontend will be live at `https://your-project.vercel.app`

**🎉 Done!** Your chatbot is now live in production.

---

## Troubleshooting

### Common Issues

#### "Docker not running"
**Error**: `Cannot connect to Docker daemon`

**Solution**: 
- Start Docker Desktop
- Verify with: `docker ps`

#### "Port already in use"
**Error**: `Port 5173 (or 3000, 8080) is already in use`

**Solution**:
```bash
# Find and kill the process
lsof -ti:5173 | xargs kill
# Or use a different port
```

#### "Agent not responding"
**Error**: Agent returns 500 or timeout

**Check**:
1. Agent logs: `./logs/agent.log`
2. Verify `OPENAI_API_KEY` is set correctly
3. Check if Weaviate is running: `docker ps`
4. Verify agent is running: Check `./logs/pids/agent.pid`

#### "Weaviate connection failed"
**Error**: `Cannot connect to Weaviate`

**Solution**:
- Local: Ensure Docker is running and Weaviate container is up (`docker ps`)
- Production: Verify `WEAVIATE_DANK_API_KEY` and `WEAVIATE_DANK_PROJECT_ID` are correct
- Check Weaviate is enabled in Dank Cloud project settings

#### "CORS errors in browser"
**Error**: `CORS policy: No 'Access-Control-Allow-Origin' header`

**Solution**:
- Ensure you're using the proxy (`/api/agent`, `/api/weaviate`)
- Don't call agent/Weaviate directly from browser
- Check `vite.config.js` proxy is configured correctly

#### "Frontend can't find agent"
**Error**: `404 Not Found` when calling `/api/agent/prompt`

**Solution**:
- Verify agent is running: `curl http://localhost:3000/health` (if health endpoint exists)
- Check `AGENT_ENV` and `AGENT_LOCAL_HOST` in frontend `.env`
- For production: Verify `AGENT_HOST` is correct

### Getting Help

- **Agent Issues**: Check `ai-chatbot-weaviate/README.md` for detailed agent documentation
- **Frontend Issues**: Check `chatbot-frontend/README.md` for frontend-specific help
- **Logs**: Always check `./logs/agent.log` and `./logs/frontend.log` for detailed error messages

---

## Learn More

### Detailed Documentation

- **[Agent README](./ai-chatbot-weaviate/README.md)**: Deep dive into agent configuration, Weaviate integration, and Dank Cloud deployment
- **[Frontend README](./chatbot-frontend/README.md)**: Frontend architecture, service files, proxy setup, and Vercel deployment

### Key Concepts

- **RAG (Retrieval Augmented Generation)**: The agent retrieves relevant past messages from Weaviate and includes them in the prompt to provide context
- **Vector Database**: Weaviate stores messages as vectors, allowing semantic search (finding similar messages, not just exact matches)
- **Multi-tenancy**: Weaviate supports multiple users/projects by using `tenant` (project ID) and `X-Project-ID` headers
- **Proxy Pattern**: Frontend proxies requests to avoid CORS and keep API keys secure (never exposed to browser)

### Next Steps

1. **Customize the Agent**: Modify `dank.config.js` to change prompts or add tools
2. **Extend the Frontend**: Add features like user authentication, file uploads, etc.
3. **Deploy Your Own**: Fork this repo and deploy your customized version

---

**Built with ❤️ using [Dank AI](https://ai-dank.xyz) and [Weaviate](https://weaviate.io)**
