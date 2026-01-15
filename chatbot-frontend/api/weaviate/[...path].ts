import type { VercelRequest, VercelResponse } from '@vercel/node';

// Handle /api/weaviate/* routes
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Extract the path segments from the catch-all parameter
    const pathParts = req.query.path;
    const subPath = Array.isArray(pathParts) ? pathParts.join('/') : (pathParts || '');
    
    // Get query string from req.url safely
    let search = '';
    if (req.url) {
      const queryIndex = req.url.indexOf('?');
      if (queryIndex !== -1) {
        search = req.url.substring(queryIndex);
      }
    }
    
    const targetBase = process.env.WEAVIATE_HOST || 'https://weaviate.ai-dank.xyz';
    const targetUrl = `${targetBase}/${subPath}${search}`;

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
  } catch (error: any) {
    console.error('[Weaviate Proxy] Error:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      message: error.message 
    });
  }
}
