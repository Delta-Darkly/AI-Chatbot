### AI Chatbot with Dank AI Agent + Weaviate Memory

A full-stack demo/template showing how to build a Dank AI agent with Weaviate vector memory and a React chatbot frontend. It’s optimized for quick local testing (one command) and easy deployment (Dank Cloud for agent/Weaviate, Vercel for frontend).

#### How it works (flow)
- Browser calls `/api/agent/prompt` with `prompt`, `userId`, `conversationId`.
- Agent pulls context from Weaviate, enhances the prompt, replies, and stores both user/assistant messages in `Messages`.
- Browser calls `/api/weaviate` to list/load/rename/delete conversations; proxy injects auth headers when targeting hosted Weaviate.
- Env toggles switch everything between local Docker and hosted Dank Cloud.

#### What’s inside
- **Agent** (`ai-chatbot-weaviate/`): `dank.config.js` configures the agent and callback hooks; `weaviate-handlers.js` handles memory (schema, store/retrieve, RAG in `request_output:start`).
- **Weaviate**: Vector DB for memory/RAG; runs locally via Docker, or via Dank Cloud / custom host.
- **Frontend** (`chatbot-frontend/`): React UI; `agentService.ts` and `weaviateService.ts` show how to call the agent and Weaviate; Vite proxy + Vercel middleware avoid CORS and inject auth headers.

#### Use this as your template
- **Agent you can fork**: `ai-chatbot-weaviate/` is production-ready for Dank Cloud and meant to be copied. It already wires LLM callbacks plus Weaviate memory (schema/create, store/retrieve, RAG). Swap in your prompts/tools and keep the memory backbone.
- **Frontend building blocks**: `agentService.ts` (prompt with `userId`/`conversationId`) and `weaviateService.ts` (history, rename, delete) align to the Dank Cloud `Messages` schema; you can drop them into your app to talk to this agent/Weaviate directly.
- **Proxy patterns to reuse**: Follow (or copy) the local Vite proxy (`vite.config.js`) and the Vercel middleware (`chatbot-frontend/api/agent/[...path].ts`, `chatbot-frontend/api/weaviate/[...path].ts`) to avoid CORS and inject auth headers (`X-API-Key`, `X-Project-ID`, optional agent key) when hitting hosted services.

#### One-command local run
Prereqs:
- [ ] Docker running
- [ ] Node installed
- [ ] `ai-chatbot-weaviate/.env` with `OPENAI_API_KEY` (and other keys as needed)

```bash
npm run chatbot
```
This will:
- Install deps if missing.
- `docker compose up` Weaviate locally.
- Run the agent (`dank run`).
- Run the frontend (`npm run dev -- --host`).

Stop everything:
```bash
npm run chatbot-stop
```

#### Logs
- Written to `./logs/agent.log` and `./logs/frontend.log` (PIDs in `./logs/pids/`).
- Agent logging includes: incoming prompt, RAG-enhanced prompt, model response, and what was found/stored in Weaviate.

#### Env toggles (local vs prod)
- **Agent:** `WEAVIATE_ENV=local|prod` switches local Docker vs hosted. For hosted, set `WEAVIATE_DANK_API_KEY` + `WEAVIATE_DANK_PROJECT_ID`. Override `WEAVIATE_HOST` only for a custom host. See `ai-chatbot-weaviate/README.md` for details.
- **Frontend:** `WEAVIATE_ENV` and `AGENT_ENV` decide where `/api/weaviate` and `/api/agent` are forwarded: local services when set to `local`, or hosted endpoints when set to `prod`. When hitting hosted Weaviate, the proxy/middleware adds `X-API-Key` and `X-Project-ID`; when hitting a hosted agent, it adds the agent key if configured. No auth headers are added for local targets. See `chatbot-frontend/README.md` for proxy specifics.

#### Deployment (high level)
- **Agent + Weaviate on Dank Cloud**: Push to GitHub, connect on Dank Cloud, one-click deploy; set envs (`OPENAI_API_KEY`, `WEAVIATE_*`). Dank Cloud also offers one-click Weaviate.
- **Frontend on Vercel**: Build is static; Vercel middleware (`api/agent/[...path].ts`, `api/weaviate/[...path].ts`) injects auth server-side to avoid CORS and keep keys hidden. Set `WEAVIATE_DANK_API_KEY`, `WEAVIATE_DANK_PROJECT_ID`, `AGENT_DANK_API_KEY` (if needed), and hosts.

#### Learn more (deep dives)
- Agent + Weaviate config, envs, and deployment: `ai-chatbot-weaviate/README.md`
- Frontend services, proxies, envs, and deployment: `chatbot-frontend/README.md`

