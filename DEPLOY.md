# Putting the engine in the cloud — the one-click version

> **Private-preview policy (2026-08-11):** deploying the Render engine does not
> make Star Glass ready for public launch. The Netlify app must remain behind
> the preview gate, and public release remains blocked on the Swiss Ephemeris
> license decision and the other release gates. See
> `docs/SG-000-PRIVATE-PREVIEW-POSTURE-2026-08-11.md`.

**The idea in one sentence:** right now the math engine lives on your laptop
and has to be started by hand; after this, it lives at a web address that is
always on, and the page finds it by itself — nobody ever opens a terminal
again.

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
the end — a little line starting with `{"ok":true` means the engine is
breathing.

## Step 4 — Tell the page

Open `web/index.html` and near the top of the `<script>` section find the
block labeled **WHERE THE ENGINE LIVES**. Paste your address between the
quotes:

```
const DEFAULT_ENGINE = "https://star-glass-engine.onrender.com";
```

(Or just tell Claude the address and it'll do this for you.) Commit and push
that change too. Done — anyone who opens the page now connects automatically,
and the "how to connect" card quietly becomes a green dot nobody needs to
click.

---

## What to expect afterward

**The engine naps.** On the free plan, Render puts the engine to sleep after
about 15 minutes of quiet. The first visitor of the day wakes it, which takes
up to a minute — the page's status dot handles this by itself: it retries
every few seconds and turns green the moment the engine stirs. If a first
"Cast the chart" fails, waiting for the green dot and clicking again is all
it takes. (Paid plans, a few dollars a month, stay awake around the clock.)

**Updates are automatic.** Whenever you push changes to GitHub, Render
notices and rebuilds the engine on its own. Pushing *is* deploying — that's
the `autoDeployTrigger: commit` line in `render.yaml`.

**Licensing is a release gate, not an assumption.** Keep this deployment in
the private testing posture until SG-001 records the chosen Swiss Ephemeris
license path and its obligations have been reviewed and implemented. A public
repository by itself is not the project's legal sign-off.

**Nothing is stored.** The engine keeps no accounts and no data — it's pure
math in, chart out. The day you want "save my chart" or user logins, that's
when a database (e.g. Supabase) enters the story — not before.
