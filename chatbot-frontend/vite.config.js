import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  const agentEnv = (env.AGENT_ENV || 'prod').toLowerCase()
  const weaviateEnv = (env.WEAVIATE_ENV || 'prod').toLowerCase()

  const agentTarget =
    agentEnv === 'local'
      ? env.AGENT_LOCAL_HOST || 'http://localhost:3000'
      : env.AGENT_HOST // || 'https://<your-agent-domain>.ai-dank.xyz'

  const weaviateTarget =
    weaviateEnv === 'local'
      ? env.WEAVIATE_LOCAL_HOST || 'http://localhost:8080'
      : env.WEAVIATE_HOST || 'https://weaviate.ai-dank.xyz'

  const weaviateHeaders = {}
  if (weaviateEnv !== 'local') {
    if (env.WEAVIATE_DANK_API_KEY) weaviateHeaders['X-API-Key'] = env.WEAVIATE_DANK_API_KEY
    if (env.WEAVIATE_DANK_PROJECT_ID) weaviateHeaders['X-Project-ID'] = env.WEAVIATE_DANK_PROJECT_ID
  }

  const agentHeaders = {}
  if (agentEnv !== 'local' && env.AGENT_DANK_API_KEY) {
    agentHeaders['X-API-Key'] = env.AGENT_DANK_API_KEY
  }

  return {
    plugins: [react()],
    server: {
      port: 5173,
      open: true,
      proxy: {
        '/api/agent': {
          target: agentTarget,
          changeOrigin: true,
          secure: agentTarget.startsWith('https'),
          rewrite: (path) => path.replace(/^\/api\/agent/, ''),
          headers: agentHeaders
        },
        '/api/weaviate': {
          target: weaviateTarget,
          changeOrigin: true,
          secure: weaviateTarget.startsWith('https'),
          rewrite: (path) => path.replace(/^\/api\/weaviate/, ''),
          headers: weaviateHeaders
        }
      }
    }
  }
})

