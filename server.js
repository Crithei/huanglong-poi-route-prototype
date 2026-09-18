const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");

const host = "127.0.0.1";
const requestedPort = Number(process.argv[2] || process.env.PORT || 4173);
const port = Number.isInteger(requestedPort) && requestedPort > 0 && requestedPort < 65536 ? requestedPort : 4173;
const root = __dirname;

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
};

function send(res, status, headers, body) {
  res.writeHead(status, headers);
  res.end(body);
}

function runtimeConfigScript() {
  const config = {
    amapJsapiKey: process.env.AMAP_JSAPI_KEY || "",
    amapSecurityJsCode: process.env.AMAP_JSAPI_SECURITY_CODE || process.env.AMAP_SECURITY_JS_CODE || "",
  };
  return `window.__HUANGLONG_RUNTIME_CONFIG = ${JSON.stringify(config)};`;
}

function resolveStaticFile(pathname) {
  const relativePath = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
  const requested = path.resolve(root, relativePath);
  if (requested !== root && !requested.startsWith(`${root}${path.sep}`)) return null;
  return requested;
}

const server = http.createServer((req, res) => {
  if (!req.url || (req.method !== "GET" && req.method !== "HEAD")) {
    send(res, 405, { "Content-Type": "text/plain; charset=utf-8" }, "Method not allowed");
    return;
  }

  let requestUrl;
  try {
    requestUrl = new URL(req.url, `http://${host}:${port}`);
  } catch {
    send(res, 400, { "Content-Type": "text/plain; charset=utf-8" }, "Bad request");
    return;
  }

  if (requestUrl.pathname === "/runtime-config.js") {
    const body = runtimeConfigScript();
    send(res, 200, {
      "Cache-Control": "no-store",
      "Content-Type": "text/javascript; charset=utf-8",
    }, req.method === "HEAD" ? "" : body);
    return;
  }

  let pathname;
  try {
    pathname = decodeURIComponent(requestUrl.pathname);
  } catch {
    send(res, 400, { "Content-Type": "text/plain; charset=utf-8" }, "Bad request");
    return;
  }

  const filePath = resolveStaticFile(pathname);
  if (!filePath) {
    send(res, 403, { "Content-Type": "text/plain; charset=utf-8" }, "Forbidden");
    return;
  }

  fs.stat(filePath, (statError, stats) => {
    if (statError || !stats.isFile()) {
      send(res, 404, { "Content-Type": "text/plain; charset=utf-8" }, "Not found");
      return;
    }

    const contentType = mimeTypes[path.extname(filePath).toLowerCase()] || "application/octet-stream";
    res.writeHead(200, {
      "Cache-Control": "no-cache",
      "Content-Length": stats.size,
      "Content-Type": contentType,
      "X-Content-Type-Options": "nosniff",
    });
    if (req.method === "HEAD") {
      res.end();
      return;
    }
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(port, host, () => {
  console.log(`Huanglong prototype: http://${host}:${port}`);
});
