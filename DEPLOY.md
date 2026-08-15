# Putting the engine in the cloud — the one-click version

> **Private-preview policy (2026-08-11):** deploying the Render engine does not
> make Star Glass ready for public launch. The Netlify app must remain behind
> the preview gate, and public release remains blocked on the Swiss Ephemeris
> license decision and the other release gates. See
> `docs/SG-000-PRIVATE-PREVIEW-POSTURE-2026-08-11.md`.

**The idea in one sentence:** Render runs the math, but only the Star Glass
server is allowed to ask it for a calculation; browsers never receive the
Render credential or call its calculation routes directly.

The repo carries its own deployment spec (`render.yaml`), so a hosting site
called **Render** can do the whole assembly from one button. Total time:
about 15 minutes, most of it waiting for a progress bar.

---

## Before you start

The project's latest changes need to be on GitHub, because Render reads from
GitHub (not from your laptop). Commit and push the way you normally do — in
GitHub Desktop that's *Commit to main*, then *Push origin*.

## Step 1 — Click the button

Open the repo's page on GitHub and click the **Deploy to Render** button in
the README (under "The ephemeris API"). If Render asks you to sign in, choose
**Sign in with GitHub**.

## Step 2 — Click Apply

Render shows what it's about to build — one web service, `star-glass-engine`,
on the Free plan, exactly as `render.yaml` specifies. Click **Apply** (or
**Deploy**). That's the last decision you make.

## Step 3 — Wait for the build

A log scrolls by for a few minutes — Render is installing the Python pieces
and downloading the Swiss Ephemeris planetary data. When the status says
**Live**, look near the top of the page for the engine's new address —
something like:

```
https://star-glass-engine.onrender.com
```

Copy it. To check it's alive, paste it into your browser with `/health` on
the end. The complete public response is `{"ok":true}`; operational details
stay private.

## Step 4 — Join Render to Star Glass

Generate one random service token with at least 32 bytes of entropy. Store the
token itself only in Netlify as the secret `STARGLASS_ENGINE_TOKEN`, and set
`STARGLASS_ENGINE_ORIGIN` to the Render origin from Step 3. Store only the
token's lowercase SHA-256 digest on Render as
`STARGLASS_ENGINE_TOKEN_SHA256`.

Deploy Netlify first, then Render. Once both are live:

1. `/api/engine/health` on the gated Star Glass origin returns `{"ok":true}`.
2. A synthetic chart succeeds through `/api/engine/chart` on Star Glass.
3. The same request sent directly to Render without the bearer token returns
   `401` before the body is parsed.
4. The production browser bundle contains neither the Render hostname nor the
   token.

Never paste the token into source, `VITE_*`, a browser console, a support
message, or a client request. The full operating and rotation procedure is in
`docs/SG-107-ENGINE-BOUNDARY-2026-08-11.md`.

## Step 5 — Connect private portrait storage

StarGlass portrait jobs use the dedicated Supabase project `StarGlass`
(`ozfkwvlwgmvfayoaklla`) in `us-west-1`. Apply the checked-in migration at
`supabase/migrations/20260814233420_secure_portrait_jobs.sql` before enabling
generation in a new environment.

Set these values for Netlify Functions only:

```text
SUPABASE_URL=https://ozfkwvlwgmvfayoaklla.supabase.co
SUPABASE_SECRET_KEY=<a dedicated sb_secret_ key created for the Netlify backend>
```

The secret key is server-only. Never put it in a `VITE_*` variable, browser
code, URL, log, or repository file. The browser receives a distinct random
capability for each portrait job; Supabase stores only its SHA-256 hash.
Terminal records are hard-deleted after delivery, abandoned records expire in
24 hours, and an hourly scheduled function removes expired rows.

Keep `STARGLASS_PREVIEW_GATE=on`. The Supabase connection replaces portrait
job storage; it does not replace or weaken the private-preview access gate.

---

## What to expect afterward

**The engine naps.** On the free plan, Render puts the engine to sleep after
about 15 minutes of quiet. The first gated visitor of the day wakes it through
the Star Glass proxy, which can take up to a minute. The page retries its
same-origin health route and turns green when Render answers.

**Updates are automatic.** Whenever you push changes to GitHub, Render
notices and rebuilds the engine on its own. Pushing *is* deploying — that's
the `autoDeployTrigger: commit` line in `render.yaml`.

**Licensing is a release gate, not an assumption.** Keep this deployment in
the private testing posture until SG-001 records the chosen Swiss Ephemeris
license path and its obligations have been reviewed and implemented. A public
repository by itself is not the project's legal sign-off.

**The chart engine is stateless in application code.** It keeps no accounts
and writes no birth records, but requests still cross Netlify and Render and
may be represented in provider infrastructure logs. The portrait pipeline
separately uses Netlify Blobs; see the data-flow and retention backlog before
making broader storage claims.
