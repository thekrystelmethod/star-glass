#!/usr/bin/env python3
"""
setup_ephemeris.py — fetch the Swiss Ephemeris data files this skill uses.

These files are published by Astrodienst (github.com/aloistr/swisseph) and are
NOT redistributed in this repository; this script downloads them into
scripts/ephe/ on first setup. Three files cover 1800-2400 CE, which is what
enables Chiron and improves precision:

    sepl_18.se1   planets
    semo_18.se1   moon
    seas_18.se1   main asteroids (Chiron lives here)

The chart calculator runs without them — Sun through Pluto and the nodes use
pyswisseph's built-in Moshier fallback — but Chiron is unavailable and
precision is slightly lower. Run this once:

    python scripts/setup_ephemeris.py

Licensing note: Swiss Ephemeris is dual-licensed (AGPL-3.0, or Astrodienst's
one-time professional license for closed-source/commercial use). Downloading
for your own use is free under either. See README.md.
"""

import os
import sys
import urllib.request

BASE = "https://raw.githubusercontent.com/aloistr/swisseph/master/ephe/"
FILES = ["sepl_18.se1", "semo_18.se1", "seas_18.se1"]
DEST = os.path.join(os.path.dirname(os.path.abspath(__file__)), "ephe")


def main():
    os.makedirs(DEST, exist_ok=True)
    for name in FILES:
        target = os.path.join(DEST, name)
        if os.path.exists(target) and os.path.getsize(target) > 0:
            print(f"  ✓ {name} already present")
            continue
        print(f"  … downloading {name}")
        try:
            urllib.request.urlretrieve(BASE + name, target)
            print(f"  ✓ {name} ({os.path.getsize(target) // 1024} KB)")
        except Exception as e:
            if os.path.exists(target):
                os.remove(target)
            sys.exit(f"  ✗ failed to fetch {name}: {e}\n"
                     f"    Download manually from {BASE + name} into {DEST}/")
    print(f"\nEphemeris ready in {DEST}")


if __name__ == "__main__":
    main()
