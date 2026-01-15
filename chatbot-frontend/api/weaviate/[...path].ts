import type { VercelRequest, VercelResponse } from '@vercel/node';

// Proxy Weaviate requests, injecting auth headers from env (kept server-side)
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const pathParts = req.query.path;
  const suffix = Array.isArray(pathParts) ? pathParts.join('/') : pathParts || '';
  const search = req.url && req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '';
  const targetBase = process.env.WEAVIATE_HOST || 'https://weaviate.ai-dank.xyz';
  const targetUrl = `${targetBase}/${suffix}${search}`;

  const headers: Record<string, string> = {};
  // Forward incoming headers except host
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
}
