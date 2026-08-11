# Swiss Ephemeris licensing — decision record (G11)

**Status:** documented, decision pending with Krystel (owner). Not legal advice;
read the license texts at astro.com/swisseph before acting.

## Current posture (compliant for a free service)

StarGlass uses the Swiss Ephemeris via `pyswisseph` on a public server
(star-glass-engine.onrender.com). Swiss Ephemeris is dual-licensed:

- **AGPL-3.0** — free, network-copyleft: serving users over a network counts
  as distribution, so the service's source must be published. **This is our
  current path**: the repository `thekrystelmethod/star-glass` is public,
  which satisfies the AGPL's source-availability obligation for the deployed
  service as long as the deployed code matches the published code.
- The `.se1` ephemeris data files are **not redistributed** in the repo;
  `setup_ephemeris.py` fetches them from Astrodienst at deploy/setup time.

## The gate before charging

Astrodienst's guidance is that a developer must settle the license route
before activating a public service, and commercial closed-source use — or
simply the freedom to stop publishing source — requires the **professional
license**: a one-time **CHF 700** (unlimited projects, one licensee, 99
years, as listed on the official price page at time of writing).

**Decision rule adopted for this project:** the professional license is
purchased **before the first paid portrait is sold**. Charging while relying
on AGPL is legally defensible only if the whole service stack that links
Swiss Ephemeris remains open source; the professional license removes that
constraint and is cheap relative to the risk. Budget it into the launch cost
of monetization increment M1/M2.

## Checklist when the decision fires

1. Purchase the professional license from Astrodienst (keep the receipt in
   this repo's private records, not committed).
2. Record the license date and licensee name here.
3. At that point the repo MAY go private if desired — until then it must
   remain public.

Sources: astro.com/swisseph/swephinfo_e.htm · astro.com/swisseph/swephprice_e.htm
