#!/usr/bin/env bash
set -euo pipefail

# Simple one-shot starter for local dev:
# 1) Ensures deps are installed.
# 2) Starts Weaviate via docker compose.
# 3) Starts the agent (dank run).
# 4) Starts the frontend (npm run dev --host).
#
# Prereqs: Docker installed/running. Populate ai-chatbot-weaviate/.env with OPENAI_API_KEY (and other keys).

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="${ROOT_DIR}/logs"
PID_DIR="${LOG_DIR}/pids"
mkdir -p "$LOG_DIR"
mkdir -p "$PID_DIR"

# Choose docker compose command
if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
  COMPOSE_CMD="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE_CMD="docker-compose"
else
  echo "Docker Compose not found. Install Docker/Compose before running." >&2
  exit 1
fi

# Quick env sanity
if [[ ! -f "${ROOT_DIR}/ai-chatbot-weaviate/.env" ]]; then
  echo "Warning: ai-chatbot-weaviate/.env missing. Create it and set OPENAI_API_KEY, etc."
fi

if [[ -f "${ROOT_DIR}/ai-chatbot-weaviate/.env" ]] && ! grep -q "OPENAI_API_KEY" "${ROOT_DIR}/ai-chatbot-weaviate/.env"; then
  echo "Warning: OPENAI_API_KEY not found in ai-chatbot-weaviate/.env"
fi

echo "==> Installing root deps (dank-ai) if needed..."
if [[ ! -d "${ROOT_DIR}/node_modules/dank-ai" ]]; then
  (cd "${ROOT_DIR}" && npm install)
fi

echo "==> Installing frontend deps if needed..."
if [[ ! -d "${ROOT_DIR}/chatbot-frontend/node_modules" ]]; then
  (cd "${ROOT_DIR}/chatbot-frontend" && npm install)
fi

echo "==> Starting Weaviate via docker compose..."
(cd "${ROOT_DIR}/ai-chatbot-weaviate" && ${COMPOSE_CMD} up -d)

echo "==> Starting agent (dank run)..."
(cd "${ROOT_DIR}/ai-chatbot-weaviate" && nohup npx dank run > "${LOG_DIR}/agent.log" 2>&1 & echo $! > "${PID_DIR}/agent.pid")
AGENT_PID=$(cat "${PID_DIR}/agent.pid" 2>/dev/null || true)
echo "Agent PID: ${AGENT_PID:-unknown} (logs: ${LOG_DIR}/agent.log)"

echo "==> Starting frontend (npm run dev --host)..."
(cd "${ROOT_DIR}/chatbot-frontend" && nohup npm run dev -- --host > "${LOG_DIR}/frontend.log" 2>&1 & echo $! > "${PID_DIR}/frontend.pid")
FRONT_PID=$(cat "${PID_DIR}/frontend.pid" 2>/dev/null || true)
echo "Frontend PID: ${FRONT_PID:-unknown} (logs: ${LOG_DIR}/frontend.log)"

echo ""
echo "All services started:"
echo "  Weaviate: docker compose (ai-chatbot-weaviate/docker-compose.yml)"
echo "  Agent   : PID ${AGENT_PID} (dank run)  | logs -> ${LOG_DIR}/agent.log"
echo "  Frontend: PID ${FRONT_PID} (npm run dev --host) | logs -> ${LOG_DIR}/frontend.log"
echo ""
echo "To stop: npm run chatbot-stop"

