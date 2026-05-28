# test-container — hotbox env-echo

A tiny, dependency-free service for verifying hotbox deployments end-to-end:

- **GitHub build-on-host** — it builds from a `Dockerfile`, so deploying it as a
  GitHub-source service exercises hotbox's clone + build path.
- **Variable injection** — once running, it shows every environment variable the
  container received, so you can confirm project / environment / service
  variables (and their override precedence) actually reach the container.

> ⚠️ This dumps **all** environment variables, including anything marked
> "secret" in hotbox. It exists only to verify injection in a test setup.
> Never run it with real secrets or leave it exposed.

## Endpoints

| Path | Returns |
|------|---------|
| `/` | HTML table of all env vars (sorted) + the container hostname |
| `/env` | JSON: `{ hostname, env }` |
| `/env/<KEY>` | plain-text value of a single variable (404 if unset) |
| `/healthz` | `ok` |

Listens on `PORT` (default `8080`).

## Deploy it in hotbox (GitHub source)

1. Make sure this repo is **public** on GitHub (Phase 4a clones over public
   HTTPS — no auth).
2. In hotbox: **+ New service** → Source: **GitHub repo**.
   - Repository: `0xthrpw/test-container`
   - Branch: `master` *(this repo's default — the form pre-fills `main`, change it)*
   - Dockerfile path: `Dockerfile`, Build context: `.`
   - Public port: `8080`
   - Optionally set a custom hostname and/or tick auto subdomain.
3. Create. Watch the **Builds** panel: clone → build → deploy → healthy.
4. Open the service URL (or `curl` it). You should see the env table.

## Verify variable precedence

With the service deployed, set the same key at different scopes and redeploy
(the Variables panels show a "Redeploy N to apply" button):

1. Project variable `GREETING=from-project` → redeploy → `/env/GREETING` shows `from-project`.
2. Add environment variable `GREETING=from-env` → redeploy → now `from-env`.
3. Add service variable `GREETING=from-service` → redeploy → now `from-service`.
4. Delete the service one → falls back to `from-env`; delete that → `from-project`.

Mark one as **secret** and confirm: it's masked in the hotbox UI, but the
container still receives the real value (visible here at `/env/GREETING` —
which is exactly why this tool must never hold real secrets).

## Run locally

```bash
docker build -t env-echo .
docker run --rm -p 8080:8080 -e GREETING=hello env-echo
# then: curl localhost:8080/env
```
