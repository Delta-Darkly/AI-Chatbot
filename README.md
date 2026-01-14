# Agent (Dank AI) + Weaviate Memory

This directory contains the Dank AI agent that uses Weaviate as vector memory for RAG, logging, and conversation storage. Handlers live in `weaviate-handlers.js`; agent config/handlers in `dank.config.js`.

## What this agent showcases
- Simple agent setup via `dank.config.js` with pre/post callbacks (`request_output:start`/`end`) and Weaviate RAG.
- Weaviate memory in `weaviate-handlers.js` (schema ensure, store/retrieve, parent linking, RAG context).
- Switchable local/prod Weaviate (`WEAVIATE_ENV`) and headers for hosted Weaviate (X-API-Key / X-Project-ID).
- Verbose logging: incoming prompt, RAG-enhanced prompt, model response, objects found/saved in Weaviate (see `logs/agent.log` when run from root).

## Running
### Easiest (from repo root)
Uses the root runner to start Weaviate + agent + frontend together:
```bash
npm run chatbot
# stop:
npm run chatbot-stop
```
Logs go to `logs/agent.log` and PIDs to `logs/pids/agent.pid`.

### Agent only
```bash
cd ai-chatbot-weaviate
npx dank run
```

### Weaviate only (local)
```bash
cd ai-chatbot-weaviate
docker compose up -d   # or docker-compose up -d
# down:
docker compose down
```

## Environment (.env.example)
```
# API key for your LLM of choice
OPENAI_API_KEY=your-openai-key
# ANTHROPIC_API_KEY=your_anthropic_api_key_here
# GOOGLE_AI_API_KEY=your_google_ai_api_key_here

# Toggle: 'local' to hit docker weaviate, 'prod' to use dank or custom deployed weaviate
WEAVIATE_ENV=local

# Production / hosted (Dank Cloud) defaults (host can include scheme)
WEAVIATE_DANK_API_KEY=you-dank-api-key
WEAVIATE_DANK_PROJECT_ID=your-project-id
WEAVIATE_HOST=https://weaviate.ai-dank.xyz

# Local docker Weaviate (reachable from inside agent container; include scheme)
WEAVIATE_LOCAL_HOST=http://host.docker.internal:8080

# Custom/self-hosted Weaviate (set host; leave API/Project blank if not needed)
# WEAVIATE_HOST=your-self-hosted-weaviate:8080
# WEAVIATE_API_KEY=
# WEAVIATE_PROJECT_ID=
```

Key toggles:
- `WEAVIATE_ENV=local`: use local Docker Weaviate, no auth headers. Default local host for the agent is `http://host.docker.internal:8080` (inside Docker). From your host machine, the mapped port is `http://localhost:8080` if you want to query it directly.
- `WEAVIATE_ENV=prod`: use hosted Weaviate, sends `X-API-Key` + `X-Project-ID`. Default prod host is `https://weaviate.ai-dank.xyz` (set in code). Override in `.env` only if you use a custom deployment.
- Set `WEAVIATE_HOST`/`WEAVIATE_LOCAL_HOST` with scheme; prod vs local chosen by `WEAVIATE_ENV`. Defaults already match the provided compose/cloud setup.

## Weaviate integration (handlers)
- `ensureSchema`: creates `Messages` class if missing.
- `storeMessage`: writes user/assistant messages with `conversation_id`, `user_id`, `parent_id`.
- `getConversationContext`: RAG via `nearText` + `where` filters; sorts chronologically; returns context for prompt enhancement.
- `findUserMessageId`: links assistant replies to the originating user message (`parent_id`).
- Logging: every store and retrieval logs host, user, convo, parent links; plus prompt/response and RAG context in `agent.log`.

## Local vs prod Weaviate
- Local: `docker compose up -d` starts Weaviate with a local text2vec transformer by default (see `docker-compose.yml`). To switch to `text2vec-openai`: comment out the three `text2vec-transformers` lines and the `t2v` service, then uncomment the three `text2vec-openai` lines (requires `OPENAI_API_KEY`). `WEAVIATE_ENV=local` (default in `.env.example`) makes the agent hit `WEAVIATE_LOCAL_HOST` (`http://host.docker.internal:8080` inside Docker; `http://localhost:8080` from your host).
- Prod (Dank Cloud): code defaults to `prod` when `WEAVIATE_ENV` is unset; in cloud you only need to set `OPENAI_API_KEY`, `WEAVIATE_DANK_API_KEY`, `WEAVIATE_DANK_PROJECT_ID` (host defaults to `https://weaviate.ai-dank.xyz`). Headers are attached automatically. Override `WEAVIATE_HOST` only for a custom Weaviate deployment.
- Custom host: set `WEAVIATE_HOST` to your host and leave API/project blank if your host does not require them.

## Deploying the agent (Dank Cloud)
1) Push to GitHub.  
2) Connect repo in Dank Cloud, create a project from this repo, and set the Dank Config Path to `ai-chatbot-weaviate/dank.config.js`.  
3) Before deploying, set project Secret(s): at minimum `OPENAI_API_KEY` (and any other LLM keys you need) so the agent boots cleanly.  
4) Enable Weaviate for the project in Dank Cloud: create an API key, enable the Weaviate service with that key.  
5) Set envs in the project dashboard: `WEAVIATE_DANK_API_KEY`, `WEAVIATE_DANK_PROJECT_ID`. (`WEAVIATE_ENV` defaults to `prod` when unset in cloud; host defaults to `https://weaviate.ai-dank.xyz`.)  
6) (Optional) Point to a custom Weaviate by setting `WEAVIATE_HOST` and leaving project/key blank if not required.

## Testing against prod Weaviate locally
Set `WEAVIATE_ENV=prod` and the prod keys in `.env`, then run `npx dank run` (or `npm run chatbot` from root). Enable the Weaviate service in Dank Cloud first and use its `WEAVIATE_DANK_API_KEY` and `WEAVIATE_DANK_PROJECT_ID`.

## Message schema (required for hosted Weaviate)
- Class: `Messages`
- Fields: `role`, `content`, `conversation_id`, `message_id`, `parent_id`, `timestamp`, `user_id`, `metadata`
- Hosted multi-tenant Weaviate on Dank Cloud requires this class; you cannot create new classes. If you require custom classes, you can do a custom Weaviate deployment and set the `WEAVIATE_HOST` to your custom URL.

## Files to know
- `dank.config.js`: agent definition, handlers registration.
- `weaviate-handlers.js`: memory/RAG (schema, store/retrieve, parent linking).
- `docker-compose.yml`: local Weaviate (vectorizer config, ports).

## Logs
- From root runner: `logs/agent.log` (prompt, RAG’d prompt, response, stored/found vectors).
- Standalone: stdout/stderr when running `npx dank run`.

## Notes
- Agent callbacks used: `request_output:start` (RAG + user store), `request_output:end` (assistant store with parent link). You can extend by adding tools and invoking them in `request_output:end` or other hooks.
- Local Docker Weaviate uses the host toggle; prod uses headers for multi-tenancy. If you use a custom host without keys, leave API/Project blank. 
