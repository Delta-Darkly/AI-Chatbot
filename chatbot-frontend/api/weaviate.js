// Handle /api/weaviate and all sub-paths via rewrite
// Using CommonJS for Vercel Node.js runtime compatibility
module.exports = async function handler(req, res) {
  try {
    // Debug: log what we're receiving
    console.log('[Weaviate Proxy] req.url:', req.url);
    console.log('[Weaviate Proxy] req.query:', req.query);
    console.log('[Weaviate Proxy] headers:', Object.keys(req.headers));
    
    // Try multiple methods to get the path
    let weaviatePath = '';
    
    // Method 1: From query parameter (if rewrite passed it)
    const pathParam = req.query.path;
    if (pathParam) {
      weaviatePath = Array.isArray(pathParam) ? pathParam.join('/') : String(pathParam);
    } else {
      // Method 2: Extract from req.url if it contains the full path
      const urlStr = req.url || '';
      if (urlStr.includes('/api/weaviate/')) {
        const match = urlStr.match(/\/api\/weaviate\/(.+?)(?:\?|$)/);
        if (match) {
          weaviatePath = match[1];
        }
      }
    }
    
    // Get original query string (excluding our path param if it exists)
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    const searchParams = new URLSearchParams(url.searchParams);
    searchParams.delete('path'); // Remove our internal path param if present
    const search = searchParams.toString() ? `?${searchParams.toString()}` : '';
    
    const targetBase = process.env.WEAVIATE_HOST || 'https://weaviate.ai-dank.xyz';
    const targetUrl = `${targetBase}/${weaviatePath}${search}`;
    
    console.log('[Weaviate Proxy] Extracted path:', weaviatePath);
    console.log('[Weaviate Proxy] Target URL:', targetUrl);

    const headers = {};
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

    let body;
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
  } catch (error) {
    console.error('[Weaviate Proxy] Error:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
