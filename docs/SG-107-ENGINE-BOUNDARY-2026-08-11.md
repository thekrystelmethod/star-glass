# SG-107 — Star Glass engine boundary

**Decision date:** 2026-08-11

**Owner:** Krystel (policy/release), Codex (implementation/evidence)

**Policy:** Render calculation endpoints are consumable only through Star Glass.

**State:** complete and production-verified on 2026-08-11. A separate inventory of pre-gate Netlify deploy URLs remains under SG-000 because it affects the broader preview perimeter, not Render's now-enforced calculation boundary.

## Why this boundary exists

Birth date, local time, time zone, and location are sent to the deterministic chart engine. Before SG-107, browser code contained Render's public hostname, Render accepted unauthenticated calculations, and wildcard CORS allowed any website to call it from a visitor's browser. That allowed the private-preview UI and its notices to be bypassed, exposed free-tier compute to unbounded third-party use, increased the chance of sensitive request data entering avoidable diagnostics, and made the Swiss Ephemeris licensing question relevant to the public API itself.

CORS alone cannot provide this protection. It is a browser rule, not caller authentication; command-line clients and other servers ignore it. The calculation routes therefore authenticate the calling service before parsing a request body or launching a subprocess.

## Implemented request path

```text
gated browser
  → https://star-glass.netlify.app/api/engine/{chart|wheel|tables}
  → Netlify function adds a server-only bearer token
  → https://star-glass-engine.onrender.com/{chart|wheel|tables}
  → Render verifies the token digest before reading the body
```

The production browser bundle contains only the same-origin `/api/engine` path. The token is a write-only Netlify secret and is never placed in source, a `VITE_*` variable, a client response, or application logs. Render needs only a SHA-256 verifier. Committing that verifier does not disclose a randomly generated 256-bit token.

`GET /health` remains publicly reachable on Render because the hosting provider uses it for health checks. It returns only `{"ok":true}`. The browser reaches health through the authenticated Netlify proxy, which also returns only that minimal shape.

## Controls

| Boundary | Control |
|---|---|
| Netlify preview | The existing Edge gate covers all static and `/api/*` routes; anonymous callers stop before the proxy. |
| Browser → Netlify | Same-origin routes only; POST-only calculations; exact operation allowlist; JSON content type; 512 KiB request maximum. |
| Netlify capacity | Platform rate limit of 30 calculation requests per 180 seconds per IP and domain; health has a separate 120-per-180-second limit. |
| Netlify → Render | HTTPS origin is an operator-only environment value; redirects are rejected; a 55-second upstream timeout applies. |
| Render authentication | `/chart`, `/wheel`, and `/tables` require a bearer token whose digest matches an approved SHA-256 verifier. Invalid verifier configuration fails closed with `503`. |
| Render request bounds | POST and JSON only; 512 KiB request maximum; at most 4 admitted calculations by default, clamped to 1–16; excess work fails quickly. |
| Calculation process | Subprocess execution stops after 45 seconds; stderr, commands, paths, and parser failures are replaced with stable public errors. |
| Browser responses | `no-store`, `nosniff`, sanitized errors, expected content-type verification, and a correlation ID that contains no payload data. |
| Cross-origin access | Wildcard CORS middleware is removed. No browser origin receives an `Access-Control-Allow-Origin` grant from Render. |
| Discovery | FastAPI's public OpenAPI, Swagger, and ReDoc routes are disabled. |

These controls reduce exposure; they do not make Netlify or Render private infrastructure. Provider access logs and platform telemetry remain in the data-flow review. Application code logs correlation IDs, operation names, error classes, and unexpected response types—not raw birth payloads, credentials, or upstream error bodies.

## Configuration

Netlify production environment:

```text
STARGLASS_ENGINE_ORIGIN=https://star-glass-engine.onrender.com
STARGLASS_ENGINE_TOKEN=<random secret of at least 32 bytes>
```

Render environment, or the reviewed deployment verifier:

```text
STARGLASS_ENGINE_TOKEN_SHA256=<lowercase SHA-256 of the Netlify token>
STARGLASS_ENGINE_MAX_CONCURRENCY=4
```

`STARGLASS_ENGINE_TOKEN_SHA256` may contain comma-separated digests during a credential rotation. It contains verifiers, not bearer tokens.

## Safe rollout and credential rotation

For the first rollout, deploy the Netlify proxy and same-origin browser build before enabling Render enforcement. The previous Render service ignores the additional authorization header, so this direction is backward compatible. Then deploy Render and prove that direct requests fail while proxied requests succeed. Never restore a client-side Render fallback as rollback; pause chart creation with a clear maintenance state instead.

For a future zero-downtime rotation:

1. Generate a new random token and its lowercase SHA-256 digest without printing either into shared logs.
2. Deploy Render with both old and new digests in `STARGLASS_ENGINE_TOKEN_SHA256`.
3. Replace Netlify's write-only `STARGLASS_ENGINE_TOKEN` with the new token and deploy Netlify.
4. Verify a synthetic proxied chart and direct unauthenticated denial.
5. Remove the old digest from Render and deploy again.
6. Revoke or securely delete the old token wherever it was held.

If the credential may have leaked, skip overlap: close or pause the proxy, replace the credential on both sides, verify, and reopen. Never transmit the token through the browser to diagnose a failure.

## Verification matrix

Automated evidence:

- `web/test-engine-proxy.mjs` proves fail-closed configuration, operation and method allowlists, content type and body limits, server-only authentication, sanitized failures, and minimal authenticated health.
- `tests/test_api_boundary.py` proves public minimal health, disabled documentation routes, denial before body parsing, no wildcard CORS, invalid-verifier fail-closed behavior, overlapping verifier rotation, request bounds, authenticated routing, and sanitized subprocess timeout handling.
- `pnpm run build` plus a bundle search proves that the browser artifact contains no Render hostname.

Production acceptance evidence to record:

| Check | Expected | Evidence |
|---|---|---|
| Anonymous Star Glass page and `/api/engine/*` | Preview gate denial | `401`; `X-StarGlass-Preview: private-gate-v2` |
| Authorized `/api/engine/health` | `200 {"ok":true}` | Passed; response was exactly 11 bytes |
| Authorized synthetic `/api/engine/chart` | `200` chart JSON | Passed; fictional 2000-01-01 UTC fixture, 9,096-byte response |
| Authorized synthetic `/api/engine/wheel` | `200` SVG | Passed through the proxy; 51,102-byte SVG |
| Direct Render protected route with no or wrong token | `401` before validation/calculation | Passed for `/chart` and `/wheel`, including malformed unauthenticated input |
| Direct Render protected route with wrong method | `405` | Passed; `Allow: POST` |
| Direct Render CORS preflight | No wildcard origin grant | Passed; no `Access-Control-*` response header |
| Render `/health` | `200 {"ok":true}` only | Passed; response was exactly 11 bytes |
| Render `/docs` | Not publicly discoverable | `404` |
| Production browser bundle | No Render origin or credential verifier | Passed against the 319,042-byte deployed JavaScript artifact |

## Production rollout evidence

- The content-bearing Netlify production deploy is `6a7b990b7226880008bfb7a4`, built from commit `83911fbe28f1fc2507011bc7adfab3e7d347b4fd`. Netlify records four serverless functions and one Edge function; the live v2 gate and both engine proxy operations were verified against it.
- Main then advanced to enforcement commit `5aa26e4fac3f759f97f6a18357c5a24ee16b4a3f`. Netlify canceled that redundant build with “no content change” because the revision changed only the Render API and its tests. Render subsequently changed direct protected requests from `422` validation responses to `401` authentication denials while the same-origin synthetic chart continued to return `200`.
- The first manual production attempt omitted the Edge attachment and briefly served the primary origin without the gate. It was detected by the immediate anonymous HTTP check and rolled back to the last verified gated deploy. No Render enforcement was enabled during that interval.
- Three manual SG-107 candidate deploys and one earlier manual deploy were confirmed ungated, deleted, and verified `404`. Manual Netlify publishing is not an approved release path for this repository; use a Git-triggered build and require `edge_functions_present=true` plus the live gate marker before acceptance.
- A full follow-up inventory found 27 older ready Netlify deploy artifacts whose metadata does not show an Edge function. The SG-107 Render credential prevents their browser builds from using protected calculation routes, but the artifacts may still expose older static or function surfaces. Deletion requires Krystel's explicit approval and is tracked as remaining SG-000 perimeter work; four gated deploys are available as rollback points.

Provider dashboard graphs and logs should also be reviewed for request rate, latency, restarts, rate-limit events, and unexpected clients. Those operational facts cannot be inferred from repository code and remain evidence work even after HTTP acceptance passes.
