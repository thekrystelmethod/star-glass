# SG-000 — Private preview posture and exposure inventory

**Decision date:** 2026-08-11  
**Owners:** Krystel (product/release), Codex (implementation/evidence)  
**State:** implemented in the repository; Netlify variables were set and explicitly production-scoped on 2026-08-11; deployment and production evidence in progress

## Decision

Star Glass is a **private, invitation-only testing preview**, not a public launch. Access is protected by a server-side shared passphrase at Netlify's edge. The passphrase never enters the web bundle. A correct phrase creates a signed, expiring, `HttpOnly`, `Secure`, `SameSite=Strict` cookie.

This is temporary preview containment, not account authentication or authorization. Do not use it for a public launch, paid access, sensitive multi-user data, or differentiated permissions.

Public launch is blocked until the licensing decision in SG-001 and the remaining release gates are complete.

## Controls added

| Control | Safe default | Purpose |
|---|---|---|
| `STARGLASS_PREVIEW_GATE` | Closed unless exactly `off` | Protects every Netlify route, including static assets and `/api/*` |
| `STARGLASS_PREVIEW_PASSPHRASE` | Missing or under 16 characters means `503` | Server-side phrase shared only with invited testers |
| `STARGLASS_PREVIEW_COOKIE_SECRET` | Missing or under 32 characters means `503` | Signs preview sessions so a visitor cannot forge access |
| `STARGLASS_PREVIEW_SESSION_HOURS` | `72`; clamped to 1–168 hours | Limits the lifetime of tester sessions |
| `PUBLIC_GENERATION_ENABLED` | Disabled unless exactly `true` | Stops new paid portrait generation before any LLM request |

The gate also sends `noindex`, `nofollow`, `noarchive`, no-store, frame-denial, and restrictive content-security headers while the preview is private.

## Exposure inventory

| Surface | Repository evidence | Temporary posture | Remote fact still to capture |
|---|---|---|---|
| Netlify web app | Vite site; SPA fallback in `netlify.toml` | Entire site gated after this revision is deployed | Production URL, active branch, last deploy SHA, traffic, current protection settings |
| Netlify interpretation API | `/api/interpret` and `/api/interpret/:jobId` | Covered by the edge gate; new generation also has an independent fail-closed switch | AI Gateway usage/spend, function logs, rate-limit events, active environment values |
| Netlify Blobs | `starglass-readings` stores working/error/ready portrait jobs | Gate limits new access but does not remediate existing retention | Object count, oldest object, status mix, real tester data, storage region |
| Render chart engine | Browser calls `star-glass-engine.onrender.com` directly unless `VITE_ENGINE_URL` overrides it; `api/main.py` currently permits wildcard browser origins | **Still directly reachable; not protected by the Netlify passphrase** | Live URL, active branch/SHA, traffic/logs, deploy state, environment values |
| Browser geocoding | Browser calls Open-Meteo | Only reachable through the gated UI for normal testers | Confirm production endpoint and any provider logging/terms |
| LLM provider / AI Gateway | Called only from the Netlify background function | No call when `PUBLIC_GENERATION_ENABLED` is not `true` | Retention settings, processor terms, request logs, spend alerts |
| GitHub repository | Local remote is `https://github.com/thekrystelmethod/star-glass.git`; working branch is `main`; inspected commit is `31511934637a4a1cf2d3dd4a275304eb4d78eade` | Treat repository visibility as a separate fact from app access | Confirm current visibility, branch protections, deploy integrations, and whether providers serve the inspected commit |

### Known residual exposure

The passphrase protects the Netlify application, not the Render hostname. Anyone who knows or discovers the Render URL can still call the deterministic chart endpoints directly. The engine is stateless in repository code, but it receives birth date, time, and location to calculate a chart. Restricting that service requires a service-to-service architecture or a Render-side control; it is not silently claimed as solved by SG-000. The detailed risk, recommended containment, tests, and acceptance evidence are now scheduled for next sprint under SG-107 in `docs/STARGLASS-ORDERED-BACKLOG-2026-08-11.md`.

The gate is also not a legal exemption or a licensing determination. In particular, the presently direct Render surface means the system cannot be described as wholly private merely because the Netlify UI is gated. SG-001 still needs to establish when the selected license is required and what obligations apply during testing.

Shared phrases can also be forwarded. For this small ad hoc tester group, rotate the phrase and cookie secret whenever access should be revoked. Rotating only the phrase does not invalidate cookies already issued.

Krystel selected the tester phrase on 2026-08-11. Its value is stored as a secret Netlify environment variable and is intentionally not duplicated in repository documentation. Krystel also owns confirmation of the Swiss Ephemeris licensing requirement and timing.

## Configure the private preview

Set these values in the Netlify production environment before deploying this revision:

```text
STARGLASS_PREVIEW_GATE=on
STARGLASS_PREVIEW_PASSPHRASE=<a unique phrase of at least 16 characters>
STARGLASS_PREVIEW_COOKIE_SECRET=<at least 32 random characters>
STARGLASS_PREVIEW_SESSION_HOURS=72
PUBLIC_GENERATION_ENABLED=true
```

Generate a suitable cookie secret locally with:

```bash
openssl rand -hex 32
```

Use a long, non-dictionary phrase—ideally at least five randomly selected words—because the shared access endpoint does not provide individual accounts or per-person lockout. Do not put real values in Git, client-side `VITE_*` variables, screenshots, tester messages sent to broad groups, or this document. Environment changes that affect Edge Functions must be followed by a Netlify deploy; this is a configuration-only deploy, not a code change.

After deployment:

1. Open the production URL in a private browser window. Confirm that the private-preview page appears before any app asset or API response is available.
2. Submit a wrong phrase. Confirm a generic rejection and no application access.
3. Submit the correct phrase. Confirm entry to the app, reload success, and `/__preview-logout` clearing access.
4. Cast one synthetic chart and, only if desired, one synthetic portrait. Record timestamps so the matching provider logs and one Blob object can be identified.
5. Set `PUBLIC_GENERATION_ENABLED=false`, apply the configuration, and confirm a new portrait stops with “Portrait generation is paused for this preview” and creates no LLM request.
6. Restore `PUBLIC_GENERATION_ENABLED=true` only while invited portrait testing is intended.
7. Export or capture the dashboard facts listed in the inventory table and store them with the SG-000 evidence.

## Emergency controls

- **Stop paid generation:** set `PUBLIC_GENERATION_ENABLED=false` and apply the Netlify configuration. Existing chart calculation and already-authorized portrait recovery remain available.
- **Revoke all tester sessions:** replace both `STARGLASS_PREVIEW_PASSPHRASE` and `STARGLASS_PREVIEW_COOKIE_SECRET`, then deploy the configuration.
- **Close the site during an incident:** keep `STARGLASS_PREVIEW_GATE=on` and temporarily remove the passphrase or cookie secret. The gate fails closed with `503`.
- **End the private preview:** do not set the gate to `off` until SG-001 and all applicable launch gates are signed off. When approved, set `STARGLASS_PREVIEW_GATE=off` and deploy.

## Evidence and completion ledger

| SG-000 acceptance evidence | State |
|---|---|
| Dated exposure inventory | Complete in this document |
| No secret embedded client-side | Complete by architecture; verify deployed bundle after release |
| Private access covers Netlify app and API | Implemented; automated smoke coverage complete; production proof pending |
| New generation can be disabled independently | Implemented; automated smoke coverage complete; production proof pending |
| Render residual exposure explicitly recorded | Complete |
| Provider settings, traffic, storage, and spend captured | Pending account-owner dashboard review |
| Enabled/disabled synthetic production requests recorded | Pending deployment |

SG-000 may be marked complete only after the two pending production-evidence rows are attached. Implementation alone does not prove the remote system's state.
