### Chatbot Frontend (React + Vite)

Minimal chat UI wired to a **Dank AI agent** (with Weaviate memory). This frontend exists to:

- Show how to call the agent’s `/prompt` endpoint correctly (`prompt`, `userId`, `conversationId`)
- Show how to query the Weaviate `Messages` schema for conversation history
- Demonstrate local and production **proxy patterns** to avoid CORS and keep keys server-side

It assumes you are using the agent from `ai-chatbot-weaviate` (or a compatible Dank agent) and a Weaviate instance following the Dank Cloud `Messages` schema.

---

## Overview

#### What it does

- Renders a chat UI and manages conversation state in the browser.
- Calls the agent via `/api/agent/prompt`:
  - Sends `prompt`, `userId`, `conversationId` so the agent can use/store memory in Weaviate.
- Calls Weaviate via `/api/weaviate/...`:
  - Lists conversations (`Messages` class, grouped by `conversation_id`)
  - Loads conversation history (sorted by `timestamp`)
  - Deletes conversations (deletes all matching `Messages` objects)
  - Renames conversations (patches `conversation_id` on all matching objects)
- Uses **proxies** (Vite locally, Vercel in production) so the browser never talks directly to Dank Cloud or Weaviate:
  - Avoids CORS issues
  - Keeps API keys and project IDs on the server side

#### How it fits with the agent & Weaviate

1. Browser → `/api/agent/prompt` → **Frontend proxy** → Agent `/prompt`
2. Browser → `/api/weaviate/...` → **Frontend proxy** → Weaviate REST/GraphQL endpoints
3. Agent uses Weaviate as memory (see agent README for details); frontend visualizes and manages conversations around that memory.

---

## Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Environment & Modes](#environment--modes)
- [Service Files](#service-files)
- [Proxies & CORS](#proxies--cors)
- [Deployment (Vercel)](#deployment-vercel)
- [What to Reuse](#what-to-reuse)
- [Troubleshooting](#troubleshooting)

---

## Quick Start

### Whole Stack (from repo root)

If you’re using this as part of the full project:

```bash
npm run chatbot
```

This will:
- Start Weaviate via Docker Compose
- Start the Dank AI agent (`dank run`)
- Start the frontend (Vite dev server on port 5173)

Logs:
- Frontend logs: `logs/frontend.log`
- Agent logs: `logs/agent.log`

Stop everything:

```bash
npm run chatbot-stop
```

### Frontend Only

Requires **agent + Weaviate already running** (locally or in the cloud).

```bash
cd chatbot-frontend
npm install
npm run dev -- --host   # opens on http://localhost:5173
```

You must configure `.env` so the frontend knows whether to talk to:
- Local agent / local Weaviate, or
- Hosted agent / hosted Weaviate (Dank Cloud)

---

## Environment & Modes

### Env config (`.env.example`)

```bash
# Weaviate (memory DB)
WEAVIATE_ENV=local                             # 'local' → proxy to local Weaviate; 'prod' → hosted
WEAVIATE_DANK_API_KEY=your-dank-api-key        # only for hosted Weaviate (prod)
WEAVIATE_DANK_PROJECT_ID=your-dank-project-id  # only for hosted Weaviate (prod)
WEAVIATE_HOST=https://weaviate.ai-dank.xyz     # hosted Weaviate base URL (Dank Cloud default)
WEAVIATE_LOCAL_HOST=http://localhost:8080      # local Weaviate URL

# Agent (LLM backend)
AGENT_ENV=local                              # 'local' → http://localhost:3000; 'prod' → hosted agent
AGENT_HOST=https://<your-agent>.ai-dank.xyz  # Dank Cloud agent URL (from Dank Cloud project dashboard)
AGENT_DANK_API_KEY=your-dank-api-key         # if your hosted agent is configured to require an API key
AGENT_LOCAL_HOST=http://localhost:3000       # local agent base URL
```

### How the modes work

Locally (Vite dev server), **`vite.config.js`** reads `WEAVIATE_ENV` and `AGENT_ENV` and decides where to send `/api/agent` and `/api/weaviate`:

- `AGENT_ENV=local` → proxy `/api/agent` → `AGENT_LOCAL_HOST` (default `http://localhost:3000`)
- `AGENT_ENV=prod` → proxy `/api/agent` → `AGENT_HOST` (your Dank Cloud agent)
- `WEAVIATE_ENV=local` → proxy `/api/weaviate` → `WEAVIATE_LOCAL_HOST` (default `http://localhost:8080`)
- `WEAVIATE_ENV=prod` → proxy `/api/weaviate` → `WEAVIATE_HOST` (Dank Cloud Weaviate), with `X-API-Key` + `X-Project-ID` headers

### Mode Matrix (local dev)

| AGENT_ENV | WEAVIATE_ENV | Agent target               | Weaviate target              | Typical use case                                      |
|-----------|--------------|----------------------------|------------------------------|------------------------------------------------------|
| `local`   | `local`      | `AGENT_LOCAL_HOST`         | `WEAVIATE_LOCAL_HOST`        | Fully local dev (agent + Weaviate on your machine)   |
| `prod`    | `local`      | `AGENT_HOST`               | `WEAVIATE_LOCAL_HOST`        | Test cloud agent with local Weaviate                 |
| `local`   | `prod`       | `AGENT_LOCAL_HOST`         | `WEAVIATE_HOST`              | Test local agent with cloud Weaviate                 |
| `prod`    | `prod`       | `AGENT_HOST`               | `WEAVIATE_HOST`              | Test cloud agent + cloud Weaviate from local UI      |

**💡 Tip**: This frontend is a great way to exercise your Dank Cloud deployment locally by setting `AGENT_ENV=prod` and/or `WEAVIATE_ENV=prod` while still running Vite on your machine.

---

## Service Files

The main purpose of this frontend is to provide **reusable service files** you can copy into your own app.

### `src/services/agentService.ts`

- Uses `config.agentUrl` (`/api/agent`) so all calls go through the proxy.
- Exposes:

```ts
// Set context once per conversation (userId + conversationId)
agentService.setContext({ userId: 'u1', conversationId: 'chat-1' });

// Send a prompt
const reply = await agentService.sendPrompt('Hello');
```

- Sends requests to `/api/agent/prompt` with body:

```json
{
  "prompt": "Hello",
  "userId": "u1",
  "conversationId": "chat-1"
}
```

- Handles:
  - Timeouts
  - Network errors
  - Basic response normalization (`response` vs `message` field)

### `src/services/weaviateService.ts`

- Handles all Weaviate operations via `config.weaviateUrl` (`/api/weaviate`).
- Exposes methods tailored to the Dank Cloud `Messages` schema:

```ts
// List conversation IDs for a user
await weaviateService.listConversations('user-123');

// Get full history for a conversation
await weaviateService.getConversationHistory('chat-1', 'user-123', 200);

// Delete a conversation
await weaviateService.clearConversation('user-123', 'chat-1');

// Rename a conversation
await weaviateService.renameConversation('user-123', 'chat-1', 'chat-renamed');
```

- Under the hood, it:
  - Uses GraphQL `Get` on `Messages` with filters on `user_id` and `conversation_id`
  - Sorts by `timestamp`
  - Uses REST DELETE/PATCH for object deletion and renaming when GraphQL mutations/batch endpoints aren’t available

**When to copy these:**  
If you already have your own UI (React, Next, etc.), you can copy these two files plus the `config.ts` `/api/...` setup and plug them into your app to talk to your Dank agent + Weaviate.

---

## Proxies & CORS

### Why proxies?

- Your frontend (e.g. `https://your-frontend.vercel.app`) is on a different domain than:
  - Your Dank Cloud agent (e.g. `https://<agent-id>.ai-dank.xyz`)
  - Dank Cloud Weaviate (`https://weaviate.ai-dank.xyz`)
- Browsers enforce CORS; direct calls from the browser to these domains often need CORS configuration.
- You also **must not** expose secrets like:
  - `WEAVIATE_DANK_API_KEY`
  - `WEAVIATE_DANK_PROJECT_ID`
  - `AGENT_DANK_API_KEY` (if used)

The solution is to always call **relative** URLs (`/api/agent`, `/api/weaviate`) from the browser and let **server-side proxies** handle:
- Target selection (local vs hosted)
- Header injection (auth, project ID)

### Local (Vite dev server)

`vite.config.js` defines proxies for dev:

```js
server: {
  proxy: {
    '/api/agent': {
      target: agentTarget,          // based on AGENT_ENV + env vars
      rewrite: (path) => path.replace(/^\/api\/agent/, ''),
      headers: agentHeaders         // X-API-Key if AGENT_ENV !== 'local'
    },
    '/api/weaviate': {
      target: weaviateTarget,       // based on WEAVIATE_ENV + env vars
      rewrite: (path) => path.replace(/^\/api\/weaviate/, ''),
      headers: weaviateHeaders      // X-API-Key + X-Project-ID if WEAVIATE_ENV !== 'local'
    }
  }
}
```

So from the browser you always call:
- `/api/agent/prompt`
- `/api/weaviate/v1/graphql`

### Production (Vercel)

In production, the same relative `/api/...` paths are handled by **Vercel serverless functions**:

- `api/agent.js`
- `api/weaviate.js`

These functions:
- Extract the sub-path (e.g. `/prompt`, `/v1/graphql`, `/v1/objects/...`)
- Build the target URL using:
  - `AGENT_HOST` for agent
  - `WEAVIATE_HOST` for Weaviate
- Forward the request, merging headers and body
- Add auth headers for Weaviate:
  - `X-API-Key: WEAVIATE_DANK_API_KEY`
  - `X-Project-ID: WEAVIATE_DANK_PROJECT_ID`
- Optionally add agent auth header:
  - `X-API-Key: AGENT_DANK_API_KEY` (if configured)

From the browser’s point of view, it **always** talks to your frontend at `/api/...`; the rest happens server-side.

---

## Deployment (Vercel)

### 1. Prepare the agent + Weaviate

- Deploy your agent + Weaviate on Dank Cloud (see agent/root READMEs)
- Ensure you have:
  - Dank Cloud agent URL (`AGENT_HOST`, e.g. `https://<agent-id>.ai-dank.xyz`)
  - Dank Cloud Weaviate API key (`WEAVIATE_DANK_API_KEY`)
  - Dank Cloud Weaviate project ID (`WEAVIATE_DANK_PROJECT_ID`)

### 2. Deploy the frontend

1. Push your repo to GitHub (including `chatbot-frontend/`)
2. On [Vercel](https://vercel.com):
   - Import your GitHub repo
   - Set the project root to `chatbot-frontend`
   - Set **Framework Preset** to `Vite`
   - Build command: `npm run build` (default)
   - Output directory: `dist` (default)

3. Set environment variables in Vercel:

```bash
WEAVIATE_DANK_API_KEY=your-dank-api-key
WEAVIATE_DANK_PROJECT_ID=your-dank-project-id
AGENT_HOST=https://<your-agent>.ai-dank.xyz
AGENT_DANK_API_KEY=your-agent-api-key       # Only if your agent requires auth
```

4. Deploy
   - Vercel will build and deploy automatically
   - Your frontend will be live at `https://your-frontend.vercel.app`

### 3. Smoke test

1. Open your Vercel URL in the browser
2. Confirm:
   - Conversation list loads (if existing data)
   - You can start a new chat and get responses
3. If there are issues, open the browser devtools console and check:
   - Network tab for `/api/agent/...` and `/api/weaviate/...` responses

---

## What to Reuse

- **`src/services/agentService.ts`**:
  - Handles calling the agent’s `/prompt` endpoint
  - Already wired with `prompt`, `userId`, `conversationId`
  - Normalizes responses and errors
- **`src/services/weaviateService.ts`**:
  - Provides a high-level API around the Dank Cloud `Messages` schema:
    - List conversations
    - Load history
    - Delete / rename conversations
- **Proxy pattern** (`vite.config.js` + `api/agent.js` + `api/weaviate.js`):
  - Shows how to:
    - Call into Dank Cloud services without fighting CORS
    - Inject auth headers and project IDs server-side
    - Keep secrets out of the browser

You can copy these pieces into your own app and adapt as needed.

---

## Troubleshooting

### 405 / 404 / 500 on `/api/agent` or `/api/weaviate`

- Check that:
  - In **local dev**, Vite is running (`npm run dev`) and your agent/Weaviate targets are correct (`AGENT_ENV`, `WEAVIATE_ENV`, etc.)
  - In **production**, Vercel functions exist:
    - `api/agent.js`
    - `api/weaviate.js`
  - Env vars on Vercel are set correctly (`WEAVIATE_*`, `AGENT_*`)

### CORS errors in the browser

- You’re likely calling Dank Cloud / Weaviate **directly** from the browser.
- Always call:
  - `/api/agent/...` instead of `https://<agent>.ai-dank.xyz/...`
  - `/api/weaviate/...` instead of `https://weaviate.ai-dank.xyz/...`

### "Tenant not found" errors

- This comes from Weaviate when the tenant (project ID) doesn’t exist yet or auth is misconfigured.
- Check:
  - `WEAVIATE_DANK_API_KEY` and `WEAVIATE_DANK_PROJECT_ID` in Vercel match your Dank Cloud project
  - Weaviate service is enabled for your Dank Cloud project
  - The agent README/root README for more details on multi-tenancy

### Frontend loads but nothing works

- Check the browser console:
  - Look for Axios error logs from `[AgentService]` or `[WeaviateService]`
  - Confirm `/api/...` requests aren’t failing with 500 or network errors
- Ensure:
  - Agent is reachable (Dank Cloud agent URL works; you can curl it)
  - Weaviate is reachable (Dank Cloud Weaviate is enabled)

---

### Notes

- Default dev port: `5173` (root runner may use `5173–5175` if busy).
- Local Weaviate (when running via Docker):
  - From host: `http://localhost:8080`
  - From Docker containers: `http://host.docker.internal:8080`
- Logs (when using root runner): `logs/frontend.log`.

