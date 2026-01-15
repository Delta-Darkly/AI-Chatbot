import type { VercelRequest, VercelResponse } from '@vercel/node';

// Single catch-all handler for all API routes
// This handles /api/weaviate/* and /api/agent/* by routing internally
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const pathParts = req.query.path;
  const fullPath = Array.isArray(pathParts) ? pathParts.join('/') : pathParts || '';
  
  // Determine which service to proxy to based on the first path segment
  if (fullPath.startsWith('weaviate/')) {
    // Proxy to Weaviate - remove 'weaviate/' prefix
    const weaviatePath = fullPath.replace(/^weaviate\//, '');
    const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
    const search = url.search;
    const targetBase = process.env.WEAVIATE_HOST || 'https://weaviate.ai-dank.xyz';
    const targetUrl = `${targetBase}/${weaviatePath}${search}`;

    const headers: Record<string, string> = {};
    for (const [key, value] of Object.entries(req.headers)) {
      if (key.toLowerCase() === 'host') continue;
      if (Array.isArray(value)) {
        headers[key] = value.join(',');
      } else if (typeof value === 'string') {
        headers[key] = value;
      }
    }

    if (process.env.WEAVIATE_DANK_API_KEY) {
      headers['X-API-Key'] = process.env.WEAVIATE_DANK_API_KEY;
    }
    if (process.env.WEAVIATE_DANK_PROJECT_ID) {
      headers['X-Project-ID'] = process.env.WEAVIATE_DANK_PROJECT_ID;
    }

    let body: BodyInit | undefined;
    if (!['GET', 'HEAD'].includes(req.method || '')) {
      if (req.body && typeof req.body === 'object') {
        body = JSON.stringify(req.body);
        if (!headers['content-type']) {
          headers['content-type'] = 'application/json';
        }
      } else if (typeof req.body === 'string') {
        body = req.body;
      }
    }

    const upstream = await fetch(targetUrl, {
      method: req.method,
      headers,
      body,
    });

    const respHeaders = new Headers(upstream.headers);
    respHeaders.delete('transfer-encoding');
    respHeaders.delete('content-encoding');

    res.status(upstream.status);
    respHeaders.forEach((v, k) => res.setHeader(k, v));
    const buf = Buffer.from(await upstream.arrayBuffer());
    res.send(buf);
    return;
  }

  if (fullPath.startsWith('agent/')) {
    // Proxy to Agent - remove 'agent/' prefix
    const agentPath = fullPath.replace(/^agent\//, '');
    const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
    const search = url.search;
    const targetBase = process.env.AGENT_HOST || 'https://<your-agent-domain>.ai-dank.xyz';
    const targetUrl = `${targetBase}/${agentPath}${search}`;

    const headers: Record<string, string> = {};
    for (const [key, value] of Object.entries(req.headers)) {
      if (key.toLowerCase() === 'host') continue;
      if (Array.isArray(value)) {
        headers[key] = value.join(',');
      } else if (typeof value === 'string') {
        headers[key] = value;
      }
    }

    if (process.env.AGENT_DANK_API_KEY) {
      headers['X-API-Key'] = process.env.AGENT_DANK_API_KEY;
    }

    let body: BodyInit | undefined;
    if (!['GET', 'HEAD'].includes(req.method || '')) {
      if (req.body && typeof req.body === 'object') {
        body = JSON.stringify(req.body);
        if (!headers['content-type']) {
          headers['content-type'] = 'application/json';
        }
      } else if (typeof req.body === 'string') {
        body = req.body;
      }
    }

    const upstream = await fetch(targetUrl, {
      method: req.method,
      headers,
      body,
    });

    const respHeaders = new Headers(upstream.headers);
    respHeaders.delete('transfer-encoding');
    respHeaders.delete('content-encoding');

    res.status(upstream.status);
    respHeaders.forEach((v, k) => res.setHeader(k, v));
    const buf = Buffer.from(await upstream.arrayBuffer());
    res.send(buf);
    return;
  }

  // Unknown route
  res.status(404).json({ error: 'Not found' });
}
