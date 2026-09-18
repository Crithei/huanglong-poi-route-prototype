const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const workerFile = path.join(__dirname, '../cloudflare/worker.mjs');
const loadWorker = async () => {
  assert.ok(fs.existsSync(workerFile), 'Cloudflare request handler must exist');
  return (await import(pathToFileURL(workerFile).href)).handleRequest;
};
const env = {
  AMAP_JSAPI_KEY: 'browser-key-for-test',
  AMAP_JSAPI_SECURITY_CODE: 'private-security-code-for-test',
  ASSETS: { fetch: async () => new Response('asset content') },
};

test('public runtime config uses the same-origin proxy without exposing its secret', async () => {
  const handle = await loadWorker();
  const response = await handle(new Request('https://tour.example/runtime-config.js'), env);
  const body = await response.text();
  assert.equal(response.status, 200);
  assert.match(body, /https:\/\/tour\.example\/_AMapService/);
  assert.ok(body.includes(env.AMAP_JSAPI_KEY));
  assert.ok(!body.includes(env.AMAP_JSAPI_SECURITY_CODE));
  assert.equal(response.headers.get('cache-control'), 'no-store');
});

test('walking proxy fixes the upstream host and replaces caller credentials', async () => {
  const handle = await loadWorker();
  let upstream;
  const response = await handle(new Request('https://tour.example/_AMapService/v3/direction/walking?origin=103.82,32.74&key=other&jscode=other', { headers: { cookie: 'private-session', authorization: 'private-auth' } }), env, async (url, options) => {
    upstream = new URL(url);
    assert.equal(options.redirect, 'manual', 'Cloudflare Workers only supports manual or follow redirects');
    assert.equal(new Headers(options.headers).has('cookie'), false);
    assert.equal(new Headers(options.headers).has('authorization'), false);
    return Response.json({ status: '1', route: { paths: [] } });
  });
  assert.equal(upstream.origin, 'https://restapi.amap.com');
  assert.equal(upstream.pathname, '/v3/direction/walking');
  assert.equal(upstream.searchParams.get('key'), env.AMAP_JSAPI_KEY);
  assert.equal(upstream.searchParams.get('jscode'), env.AMAP_JSAPI_SECURITY_CODE);
  assert.equal(upstream.searchParams.getAll('jscode').length, 1);
  assert.equal(upstream.searchParams.get('origin'), '103.82,32.74');
  assert.equal((await response.json()).status, '1');
});

test('custom map styles use the AMap web API host', async () => {
  const handle = await loadWorker();
  await handle(new Request('https://tour.example/_AMapService/v4/map/styles?styleid=fresh'), env, async url => {
    assert.equal(new URL(url).origin, 'https://webapi.amap.com');
    return new Response('{}');
  });
});

test('proxy refuses unsupported paths and returns safe errors', async () => {
  const handle = await loadWorker();
  let calls = 0;
  const fetcher = async () => { calls++; throw new Error(env.AMAP_JSAPI_SECURITY_CODE); };
  assert.equal((await handle(new Request('https://tour.example/_AMapService/https://evil.example'), env, fetcher)).status, 404);
  assert.equal((await handle(new Request('https://tour.example/_AMapService/v3/direction/walking', { method: 'POST' }), env, fetcher)).status, 405);
  assert.equal(calls, 0);
  const failed = await handle(new Request('https://tour.example/_AMapService/v3/direction/walking'), env, fetcher);
  assert.equal(failed.status, 502);
  assert.ok(!(await failed.text()).includes(env.AMAP_JSAPI_SECURITY_CODE));
});

test('missing credentials fail clearly and ordinary assets remain available', async () => {
  const handle = await loadWorker();
  assert.equal((await handle(new Request('https://tour.example/runtime-config.js'), {})).status, 503);
  const asset = await handle(new Request('https://tour.example/map.js'), env);
  assert.equal(await asset.text(), 'asset content');
  assert.equal(asset.headers.has('x-frame-options'), false);
});

test('proxy rejects redirects without sending credentials to another host', async () => {
  const handle = await loadWorker();
  let requests = 0;
  const response = await handle(new Request('https://tour.example/_AMapService/v3/direction/walking'), env, async () => {
    requests++;
    return new Response(null, { status: 302, headers: { Location: 'https://unexpected.example/' } });
  });
  assert.equal(requests, 1);
  assert.equal(response.status, 502);
  assert.equal(response.headers.has('location'), false);
});

test('AMap JSONP is executable JavaScript even when upstream labels it JSON', async () => {
  const handle = await loadWorker();
  const response = await handle(new Request('https://tour.example/_AMapService/v3/direction/walking?callback=jsonp_123_456_&s=rsv3'), env, async () => new Response('jsonp_123_456_({"status":"1"})', { headers: { 'Content-Type': 'application/json;charset=UTF-8' } }));
  assert.match(response.headers.get('content-type'), /^application\/javascript/);
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  assert.match(await response.text(), /^jsonp_123_456_\(/);
});

test('proxy rejects a callback that is not a JavaScript identifier', async () => {
  const handle = await loadWorker();
  let called = false;
  const response = await handle(new Request('https://tour.example/_AMapService/v3/direction/walking?callback=alert(1)'), env, async () => { called = true; return new Response(''); });
  assert.equal(response.status, 400);
  assert.equal(called, false);
});
