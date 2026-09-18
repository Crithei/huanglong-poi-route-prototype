const PROXY_PREFIX = '/_AMapService';

function errorResponse(message, status) {
  return Response.json({ error: message }, { status, headers: { 'Cache-Control': 'no-store' } });
}

export async function handleRequest(request, env, upstreamFetch = fetch) {
  const url = new URL(request.url);
  if (!['GET', 'HEAD'].includes(request.method)) {
    return errorResponse('Method not allowed', 405);
  }

  if (url.pathname === '/runtime-config.js') {
    if (!env.AMAP_JSAPI_KEY || !env.AMAP_JSAPI_SECURITY_CODE) {
      return errorResponse('Map service is not configured', 503);
    }
    const config = {
      amapJsapiKey: env.AMAP_JSAPI_KEY,
      amapServiceHost: new URL(PROXY_PREFIX, url.origin).href,
    };
    const source = `window.__HUANGLONG_RUNTIME_CONFIG = ${JSON.stringify(config).replace(/</g, '\\u003c')};`;
    return new Response(request.method === 'HEAD' ? null : source, {
      headers: { 'Content-Type': 'text/javascript; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' },
    });
  }

  if (url.pathname.startsWith(PROXY_PREFIX + '/')) {
    const apiPath = url.pathname.slice(PROXY_PREFIX.length);
    if (!/^\/v[345]\/[a-zA-Z0-9/_-]+$/.test(apiPath)) {
      return errorResponse('Unknown map service', 404);
    }
    const callback = url.searchParams.get('callback');
    if (callback !== null && !/^[$A-Z_a-z][$\w]*(?:\.[$A-Z_a-z][$\w]*)*$/.test(callback)) {
      return errorResponse('Invalid map callback', 400);
    }
    if (!env.AMAP_JSAPI_KEY || !env.AMAP_JSAPI_SECURITY_CODE) {
      return errorResponse('Map service is not configured', 503);
    }
    // These hosts follow AMap's documented serviceHost proxy configuration.
    const host = apiPath === '/v4/map/styles' ? 'https://webapi.amap.com' : 'https://restapi.amap.com';
    const upstream = new URL(apiPath, host);
    upstream.search = url.search;
    upstream.searchParams.set('key', env.AMAP_JSAPI_KEY);
    upstream.searchParams.set('jscode', env.AMAP_JSAPI_SECURITY_CODE);
    try {
      const result = await upstreamFetch(upstream.href, {
        method: request.method,
        headers: { Accept: request.headers.get('Accept') || '*/*' },
        redirect: 'manual',
        signal: AbortSignal.timeout(15000),
      });
      if (result.status >= 300 && result.status < 400) {
        return errorResponse('Unexpected map service redirect', 502);
      }
      const headers = new Headers();
      for (const name of ['Content-Type', 'Content-Encoding']) {
        if (result.headers.has(name)) headers.set(name, result.headers.get(name));
      }
      // AMap returns JSONP as application/json; nosniff requires the real script MIME type.
      if (callback) headers.set('Content-Type', 'application/javascript; charset=utf-8');
      headers.set('Cache-Control', 'no-store');
      headers.set('X-Content-Type-Options', 'nosniff');
      return new Response(request.method === 'HEAD' ? null : result.body, { status: result.status, headers });
    } catch (error) {
      // Never include upstream URLs or exceptions: the URL contains the secret.
      const response = errorResponse('Map service temporarily unavailable', 502);
      response.headers.set('X-Map-Failure', error?.name === 'TimeoutError' ? 'timeout' : 'network');
      return response;
    }
  }

  return env.ASSETS.fetch(request);
}

export default { fetch: (request, env) => handleRequest(request, env) };
