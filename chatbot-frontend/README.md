### Chatbot Frontend (React + Vite)

Minimal chat UI wired to a Dank agent and Weaviate memory. Services call the agent/Weaviate through proxied `/api` routes; proxies handle auth headers and CORS.

#### What it does (and how)
- Renders chat UI and keeps conversation state in the browser.
- `agentService.ts` sends prompts to `/api/agent/prompt` and returns the assistant reply; it also forwards `userId` and `conversationId` so the agent can use/store memory.
- `weaviateService.ts` hits `/api/weaviate` to:
  - list conversations (by querying the `Messages` class),
  - load conversation history (sorted by timestamp),
  - delete a conversation (fetch IDs then delete each object),
  - rename a conversation (patch each object’s `conversation_id`).
- All calls go to `/api/...`; the proxy layer adds auth headers and targets local or hosted services based on env flags.
- Data flow at a glance:
  1) Browser calls `/api/agent/prompt` with `prompt`, `userId`, `conversationId`.
  2) Agent retrieves context from Weaviate, responds, and stores user/assistant messages.
  3) Browser calls `/api/weaviate` to list/load/delete/rename; proxy injects Weaviate auth when needed.

#### Quick start (whole stack, from repo root)
```bash
npm run chatbot
```
Starts Weaviate (docker compose), agent (dank run), frontend (Vite dev). Logs: `logs/frontend.log`. Stop with `npm run chatbot-stop`.

#### Quick start (frontend only)
Requires agent + Weaviate already running:
```bash
cd chatbot-frontend
npm install
npm run dev -- --host   # opens on 5173
```

#### Env config (`.env.example`)
```
# Weaviate (memory DB)
WEAVIATE_ENV=local                 # local → proxy to local Weaviate; prod → hosted
WEAVIATE_DANK_API_KEY=your-dank-api-key   # only for hosted Weaviate 
WEAVIATE_DANK_PROJECT_ID=your-dank-project-id
WEAVIATE_HOST=https://weaviate.ai-dank.xyz # hosted Weaviate base URL
WEAVIATE_LOCAL_HOST=http://localhost:8080

# Agent (LLM backend)
AGENT_ENV=local                             # local → proxy to http://localhost:3000; prod → hosted agent
AGENT_HOST=your-deployed-dank-domain        # e.g. https://<your-agent>.ai-dank.xyz
AGENT_DANK_API_KEY=your-dank-api-key        # if your hosted agent is configured to require an API key
AGENT_LOCAL_HOST=http://localhost:3000      # local agent base URL
```

#### Local vs prod toggles
- `WEAVIATE_ENV`, `AGENT_ENV` select local vs hosted targets for the proxies.
- Local defaults → Vite proxy to local agent/Weaviate.
- Prod toggles → hosted agent/Weaviate; headers added server-side.

#### Proxies & CORS
- **Local (Vite):** `vite.config.js` proxies `/api/agent` and `/api/weaviate` to your local targets. If you set `WEAVIATE_ENV=prod` while running locally, the proxy adds `X-API-Key` and `X-Project-ID` headers (from your `.env`) before forwarding to the hosted Weaviate. No auth headers are added when `WEAVIATE_ENV=local`.
- **Prod (Vercel):** `api/agent/[...path].ts` and `api/weaviate/[...path].ts` run on the server (Vercel), not in the browser. They forward requests to your hosted agent/Weaviate and inject the same headers (`X-API-Key`, `X-Project-ID`, and optionally `X-API-Key` for the agent) using the env vars you set in Vercel. “Server-side” here means these headers are added in the Vercel function, so the browser never sees your secrets. The browser always calls `/api/agent` and `/api/weaviate`.

#### How the service files work (quick reference)
- `src/services/agentService.ts`
  - `sendPrompt(prompt, metadata)`: POST to `/api/agent/prompt` with `{ prompt, ...metadata }`. `metadata` should include `userId` and `conversationId` so the agent can fetch/store memory.
  - Expects JSON response `{ response: string }`.
- `src/services/weaviateService.ts`
  - `listConversations(userId)`: GraphQL Get on `Messages` to return distinct `conversation_id` for the user.
  - `getConversationHistory(userId, conversationId, limit)`: GraphQL Get sorted by `timestamp`.
  - `clearConversation(userId, conversationId)`: GraphQL Get to find object IDs, then DELETE each `/v1/objects/Messages/{id}`.
  - `renameConversation(userId, oldId, newId)`: GraphQL Get to find IDs, then PATCH each `/v1/objects/Messages/{id}` with `conversation_id=newId`.
  - All go through `/api/weaviate`, so auth/CORS are handled by the proxy layer.

#### Minimal API examples (via proxy)
- Send a prompt (from browser code):
  ```ts
  agentService.sendPrompt("Hello", { userId: "u1", conversationId: "chat-1" });
  ```
- Load history:
  ```ts
  weaviateService.getConversationHistory("u1", "chat-1", 200);
  ```
- Delete a chat:
  ```ts
  weaviateService.clearConversation("u1", "chat-1");
  ```

#### Deployment (Vercel)
1) Set envs: `WEAVIATE_DANK_API_KEY`, `WEAVIATE_DANK_PROJECT_ID`, `AGENT_HOST`, optional `AGENT_DANK_API_KEY` (Weaviate host defaults to Dank Cloud: `https://weaviate.ai-dank.xyz`; override only for a custom host).
2) Deploy (static build); middleware proxies `/api/*` with injected headers.

#### What to reuse
- `agentService.ts` / `weaviateService.ts` patterns.
- Proxy pattern (Vite locally, Vercel middleware in prod) to hide keys and avoid CORS.

#### Notes
- Default dev port: 5173 (root runner may use 5173–5175 if busy).
- From inside Docker use `http://host.docker.internal:8080` for local Weaviate; from host use `http://localhost:8080`.
- Logs (root runner): `logs/frontend.log`.

