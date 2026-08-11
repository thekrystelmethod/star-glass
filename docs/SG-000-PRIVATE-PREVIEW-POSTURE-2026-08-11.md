# SG-000 — Private preview posture and exposure inventory

**Decision date:** 2026-08-11  
**Owners:** Krystel (product/release), Codex (implementation/evidence)  
**State:** private gate published and verified on the primary production deploy on 2026-08-11; 27 pre-gate deploy artifacts, traffic, Blobs inventory, AI usage/spend, and live generation-switch proof remain pending

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
| Netlify web app | Vite site; SPA fallback in `netlify.toml` | Primary production and retained gated rollback deploys are protected; pre-gate artifacts remain below | Traffic and current protection settings |
| Netlify interpretation API | `/api/interpret` and `/api/interpret/:jobId` | Current production routes are covered by the Edge gate; new generation also has an independent fail-closed switch | AI Gateway usage/spend, function logs, rate-limit events, active environment values, and old-deploy function reachability |
| Netlify Blobs | `starglass-readings` stores working/error/ready portrait jobs | Gate limits new access but does not remediate existing retention | Object count, oldest object, status mix, real tester data, storage region |
| Render chart engine | SG-107 moved the browser to same-origin `/api/engine/*`, added a server-only Netlify credential, and requires its verifier before Render reads protected request bodies | `/chart`, `/wheel`, and `/tables` deny direct unauthenticated use; minimal `/health` remains public for provider checks | Traffic/logs, deploy state, and resource graphs before/after SG-107 |
| Historical Netlify deploy URLs | Inventory on 2026-08-11 found 27 ready deploys with no Edge function recorded; representative pre-gate/manual URLs served the app without the primary-domain gate | **Pending owner-approved retirement; Render calculations are independently protected by SG-107** | Confirm deletion or another site-wide control, then prove the immutable URLs no longer serve |
| Browser geocoding | Browser calls Open-Meteo | Only reachable through the gated UI for normal testers | Confirm production endpoint and any provider logging/terms |
| LLM provider / AI Gateway | Called only from the Netlify background function | No call when `PUBLIC_GENERATION_ENABLED` is not `true` | Retention settings, processor terms, request logs, spend alerts |
| GitHub repository | Local remote is `https://github.com/thekrystelmethod/star-glass.git`; working branch is `main`; SG-107 enforcement commit is `5aa26e4fac3f759f97f6a18357c5a24ee16b4a3f` | Treat repository visibility as a separate fact from app access | Confirm current visibility, branch protections, and deploy integrations |

### Known residual exposure

SG-107 resolved the direct Render exposure: protected calculation routes now authenticate Star Glass before body parsing, and the browser bundle contains no Render hostname. See `docs/SG-107-ENGINE-BOUNDARY-2026-08-11.md` for the architecture and production matrix.

The deploy-history audit also exposed a different gap: a Netlify Edge function belongs to a deploy, so older immutable deploy URLs do not inherit the current gate. Four ungated manual artifacts were deleted during SG-107 and now return `404`; 27 older ready artifacts remain pending Krystel's explicit approval to delete. They no longer have working unauthenticated access to Render calculations, but they prevent an unqualified claim that every historical Star Glass URL is private.

The gate and SG-107 are not legal exemptions or licensing determinations. SG-001 still needs to establish when the selected Swiss Ephemeris license is required and what obligations apply during testing.

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

Use a long, non-dictionary phrase—ideally at least five randomly selected words—because the shared access endpoint does not provide individual accounts or per-person lockout. Do not put real values in Git, client-side `VITE_*` variables, screenshots, tester messages sent to broad groups, or this document. Environment changes that affect Edge Functions must be followed by a Git-triggered Netlify build and the live gate matrix; the CLI publisher omitted the Edge attachment during repeated verification and is not an approved release path.

After deployment:

1. Open the production URL in a private browser window. Confirm that the private-preview page appears before any app asset or API response is available.
2. Submit a wrong phrase. Confirm a generic rejection and no application access.
3. Submit the correct phrase. Confirm entry to the app, reload success, and `/__preview-logout` clearing access.
4. Cast one synthetic chart and, only if desired, one synthetic portrait. Record timestamps so the matching provider logs and one Blob object can be identified.
5. Set `PUBLIC_GENERATION_ENABLED=false`, apply the configuration, and confirm a new portrait stops with “Portrait generation is paused for this preview” and creates no LLM request.
6. Restore `PUBLIC_GENERATION_ENABLED=true` only while invited portrait testing is intended.
7. Export or capture the dashboard facts listed in the inventory table and store them with the SG-000 evidence.

## Production gate evidence — 2026-08-11

- **Production URL:** `https://star-glass.netlify.app`
- **Verified deployment:** current content-bearing Git-triggered Netlify deploy `6a7b990b7226880008bfb7a4`, serving commit `83911fb` from `main` on the linked `star-glass` project. Netlify reports the deploy ready with one Edge Function and four serverless functions. The follow-up main commit `5aa26e4` changed only Render/test files, so Netlify canceled it as “no content change.”
- **Attachment marker:** every gated response carries a versioned `X-StarGlass-Preview` marker (`private-gate-v2` after SG-107); this distinguishes the active Edge control from an unprotected static response.
- **Anonymous page request:** `401`, private-preview form rendered, `noindex` present.
- **Incorrect phrase:** `401` with a generic rejection.
- **Anonymous `/api/interpret`:** `401` at the Edge boundary.
- **Approved phrase:** `303` same-origin redirect plus a signed cookie with `HttpOnly`, `Secure`, and `SameSite=Strict`.
- **Authorized page request:** `200` and the Star Glass application shell.
- **Logout:** `303`, cookie `Max-Age=0`, followed by `401` on the next request.
- **Secret handling:** the phrase and signing secret are Netlify environment secrets and do not appear in the repository or production browser bundle.

During deployment verification, Netlify's manual publisher repeatedly omitted the Edge attachment even though the function bundled successfully and the route is explicit in `netlify.toml`. Each candidate was rejected by an anonymous HTTP check; the one production attempt was immediately rolled back. Use only Git-triggered production builds, require deploy metadata to report an Edge function, and run the live marker/behavior matrix before acceptance. The four known ungated manual artifacts were deleted and now return `404`.

## Emergency controls

- **Stop paid generation:** set `PUBLIC_GENERATION_ENABLED=false` and apply the Netlify configuration. Existing chart calculation and already-authorized portrait recovery remain available.
- **Revoke all tester sessions:** replace both `STARGLASS_PREVIEW_PASSPHRASE` and `STARGLASS_PREVIEW_COOKIE_SECRET`, then deploy the configuration.
- **Close the site during an incident:** keep `STARGLASS_PREVIEW_GATE=on` and temporarily remove the passphrase or cookie secret. The gate fails closed with `503`.
- **End the private preview:** do not set the gate to `off` until SG-001 and all applicable launch gates are signed off. When approved, set `STARGLASS_PREVIEW_GATE=off` and deploy.

## Evidence and completion ledger

| SG-000 acceptance evidence | State |
|---|---|
| Dated exposure inventory | Complete in this document |
| No secret embedded client-side | Complete; repository/bundle inspection and write-only Netlify secret configuration verified |
| Private access covers current Netlify app and API | Complete for the primary and retained gated deploys; historical artifacts remain pending below |
| New generation can be disabled independently | Implemented and configured; live disabled-state proof pending |
| Render residual exposure explicitly recorded | Complete |
| Pre-gate immutable Netlify deploys retired or independently protected | Pending owner approval; 27 ready artifacts identified |
| Provider settings, traffic, storage, and spend captured | Pending account-owner dashboard review |
| Gate enabled/denied production requests recorded | Complete in this document |
| Generation enabled/disabled synthetic production requests recorded | Pending controlled toggle test |

SG-000 may be marked complete only after the 27 pre-gate deploy artifacts are retired or independently protected, and the remaining provider inventory and controlled generation-toggle evidence are attached. The gate on the current primary deploy is complete and live.
