// Minimal, dependency-free env-echo server for verifying hotbox deployments.
//
// It builds from a Dockerfile (exercises the GitHub build-on-host path) and,
// once running, shows every environment variable the container received
// (exercises project/env/service variable injection).
//
// WARNING: this dumps ALL environment variables, including anything marked
// "secret" in hotbox. It exists purely to verify injection in a test
// environment. Never run it with real secrets or expose it publicly for real.

const http = require('node:http');
const os = require('node:os');

const port = Number(process.env.PORT) || 8080;

function escapeHtml(s) {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function renderHtml() {
  const keys = Object.keys(process.env).sort();
  const rows = keys
    .map(
      (k) =>
        `<tr><td class="k">${escapeHtml(k)}</td><td class="v">${escapeHtml(process.env[k])}</td></tr>`,
    )
    .join('');
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>hotbox env-echo</title>
  <style>
    body { font: 14px/1.5 ui-monospace, SFMono-Regular, Menlo, monospace; margin: 2rem; background:#0f1115; color:#e6e6e6; }
    h1 { font-size: 1.1rem; } .meta { color:#8a8f98; margin-bottom:1rem; }
    table { border-collapse: collapse; width: 100%; }
    td { border-top: 1px solid #2a2e37; padding: 4px 8px; vertical-align: top; }
    .k { color:#7aa2f7; white-space: nowrap; } .v { color:#c0caf5; word-break: break-all; }
  </style>
</head>
<body>
  <h1>hotbox env-echo</h1>
  <div class="meta">
    host: ${escapeHtml(os.hostname())} &middot; ${keys.length} variables &middot;
    <a href="/env" style="color:#7aa2f7">/env (json)</a>
  </div>
  <table><tbody>${rows}</tbody></table>
</body>
</html>`;
}

const server = http.createServer((req, res) => {
  const url = (req.url || '/').split('?')[0];

  if (url === '/healthz') {
    res.writeHead(200, { 'content-type': 'text/plain' });
    res.end('ok');
    return;
  }

  if (url === '/env') {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ hostname: os.hostname(), env: process.env }, null, 2));
    return;
  }

  if (url.startsWith('/env/')) {
    const key = decodeURIComponent(url.slice('/env/'.length));
    if (key in process.env) {
      res.writeHead(200, { 'content-type': 'text/plain' });
      res.end(String(process.env[key]));
    } else {
      res.writeHead(404, { 'content-type': 'text/plain' });
      res.end(`no such variable: ${key}`);
    }
    return;
  }

  res.writeHead(200, { 'content-type': 'text/html' });
  res.end(renderHtml());
});

// Omit the host arg so Node binds the unspecified IPv6 address (::) with a
// dual-stack socket — it accepts both IPv6 (::1) and IPv4 (127.0.0.1), so
// `wget localhost:PORT` works inside `docker exec` regardless of which
// loopback the resolver picks. Traefik (which dials the container by its
// IPv4 network address) is unaffected either way.
server.listen(port, () => {
  console.log(`env-echo listening on :${port} (host ${os.hostname()})`);
});
