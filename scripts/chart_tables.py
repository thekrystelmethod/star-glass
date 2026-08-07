#!/usr/bin/env python3
"""
chart_tables.py — emit the report apparatus as markdown from calculate_chart.py.

The tables in a full report must never be hand-typed: transcription is exactly
where degree errors enter a document, and a single wrong minute discredits
everything around it. This script renders the birth-data block, the positions
table, the angles, the aspect list, the element/mode distribution, and a
chart-signature summary straight from the calculated JSON.

Usage:
  python chart_tables.py chart.json [--zodiac tropical|sidereal] [--vedic]
  python chart_tables.py chart.json --section positions   # one block only
"""

import argparse
import json
import sys

SIGN_GLYPH = {"Aries": "♈", "Taurus": "♉", "Gemini": "♊", "Cancer": "♋",
              "Leo": "♌", "Virgo": "♍", "Libra": "♎", "Scorpio": "♏",
              "Sagittarius": "♐", "Capricorn": "♑", "Aquarius": "♒", "Pisces": "♓"}
BODY_GLYPH = {"Sun": "☉", "Moon": "☽", "Mercury": "☿", "Venus": "♀", "Mars": "♂",
              "Jupiter": "♃", "Saturn": "♄", "Uranus": "♅", "Neptune": "♆",
              "Pluto": "♇", "Chiron": "⚷", "North Node": "☊", "South Node": "☋"}
ASPECT_GLYPH = {"conjunction": "☌", "opposition": "☍", "trine": "△", "square": "□",
                "sextile": "✶", "quincunx": "⚻", "semisextile": "⚺",
                "semisquare": "∠", "sesquiquadrate": "⚼"}
ORDER = ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn",
         "Uranus", "Neptune", "Pluto", "Chiron", "North Node", "South Node"]


def bar(n, total, width=12):
    filled = 0 if not total else int(round(n / total * width))
    return "█" * filled + "·" * (width - filled)


HOUSE_SYSTEMS = {"P": "Placidus", "W": "Whole sign", "K": "Koch", "E": "Equal",
                 "C": "Campanus", "R": "Regiomontanus", "O": "Porphyry"}


def birth_block(meta):
    tz = meta.get("utc_offset_applied", 0)
    sign = "+" if tz >= 0 else "−"
    lat, lon = meta["lat"], meta["lon"]
    lat_s = f"{abs(lat):.4f}° {'N' if lat >= 0 else 'S'}"
    lon_s = f"{abs(lon):.4f}° {'E' if lon >= 0 else 'W'}"
    hs = HOUSE_SYSTEMS.get(meta.get("house_system", "P"), meta.get("house_system"))
    return (f"| | |\n|---|---|\n"
            f"| **Date** | {meta['date']} |\n"
            f"| **Time** | {meta['time']} local (UTC{sign}{abs(tz):g}) |\n"
            f"| **Place** | {lat_s}, {lon_s} |\n"
            f"| **Zodiac** | {meta['zodiac'].replace('_', ' ').title()} |\n"
            f"| **Houses** | {hs} |\n"
            f"| **Ephemeris** | Swiss Ephemeris |\n")


def positions(chart, vedic=False):
    rows = ["| | Body | Position | House | |",
            "|---|---|---|---|---|"]
    for n in ORDER:
        p = chart["placements"].get(n)
        if not p:
            continue
        motion = "℞" if p.get("retrograde") and n not in ("North Node", "South Node") else ""
        pos = f"{p['degree_in_sign']}° {SIGN_GLYPH[p['sign']]} {p['minute']:02d}′"
        extra = f" · {p['nakshatra']} {p['pada']}" if vedic and "nakshatra" in p else ""
        rows.append(f"| {BODY_GLYPH.get(n, '')} | {n} | {pos}{extra} | {p['house']} | {motion} |")
    return "\n".join(rows)


def angles(chart, vedic=False):
    rows = ["| Angle | Position |", "|---|---|"]
    for a in ("Ascendant", "Midheaven", "Descendant", "IC"):
        v = chart["angles"][a]
        pos = f"{v['degree_in_sign']}° {SIGN_GLYPH[v['sign']]} {v['minute']:02d}′"
        if vedic and "nakshatra" in v:
            pos += f" · {v['nakshatra']}"
        rows.append(f"| {a} | {pos} |")
    return "\n".join(rows)


def aspects(chart, limit=None):
    rows = ["| | Aspect | | Orb | |", "|---|---|---|---|---|"]
    for a in chart.get("aspects", [])[:limit]:
        b1, b2 = a["bodies"]
        g1, g2 = BODY_GLYPH.get(b1, b1), BODY_GLYPH.get(b2, b2)
        mark = "**exact**" if a["orb"] <= 1 else ("tight" if a.get("tight") else "")
        app = "applying" if a.get("applying") else ""
        note = " · ".join(x for x in (mark, app) if x)
        rows.append(f"| {g1} {b1} | {ASPECT_GLYPH.get(a['aspect'], '')} {a['aspect']} "
                    f"| {g2} {b2} | {a['orb']:.2f}° | {note} |")
    return "\n".join(rows)


def distribution(chart):
    w = chart["weighting"]
    e, m = w["elements"], w["modes"]
    te, tm = sum(e.values()), sum(m.values())
    rows = ["| Element | | | Mode | | |", "|---|---|---|---|---|---|"]
    el = list(e.items())
    mo = list(m.items()) + [("", 0)]
    for i in range(4):
        en, ev = el[i]
        mn, mv = mo[i] if i < len(mo) else ("", 0)
        mcell = f"| {mn.title()} | `{bar(mv, tm)}` | {mv} " if mn else "| | | "
        rows.append(f"| {en.title()} | `{bar(ev, te)}` | {ev} {mcell}|")
    return "\n".join(rows)


def signature(chart):
    w = chart["weighting"]
    out = []
    cr = w["chart_ruler"]
    out.append(f"- **Rising sign** — {w['rising_sign']}, ruled by **{cr['planet']}** "
               f"in {cr['placement']}, house {cr['house']}")
    if w.get("traditional_co_ruler"):
        co = w["traditional_co_ruler"]
        out.append(f"- **Traditional co-ruler** — {co['planet']} in {co['placement']}, "
                   f"house {co['house']}")
    if w["angular_planets"]:
        bits = []
        for n, cs in w["angular_planets"].items():
            detail = ", ".join("{} {}°".format(c["angle"], c["orb"]) for c in cs)
            bits.append("{} ({})".format(n, detail))
        out.append("- **Angular** — " + "; ".join(bits))
    st = w["stelliums"]
    if st["by_sign"]:
        out.append("- **Stelliums by sign** — " + "; ".join(
            f"{s}: {', '.join(ns)}" for s, ns in st["by_sign"].items()))
    if st["by_house"]:
        out.append("- **Stelliums by house** — " + "; ".join(
            f"house {h}: {', '.join(ns)}" for h, ns in st["by_house"].items()))
    if w["missing_elements"]:
        out.append(f"- **Absent element** — {', '.join(w['missing_elements'])}")
    else:
        least = min(w["elements"], key=w["elements"].get)
        out.append(f"- **Scarcest element** — {least} ({w['elements'][least]})")
    tight = [a for a in chart.get("aspects", []) if a.get("tight")][:5]
    if tight:
        out.append("- **Tightest contacts** — " + "; ".join(
            f"{a['bodies'][0]} {a['aspect']} {a['bodies'][1]} ({a['orb']:.2f}°)"
            for a in tight))
    if chart.get("orb_profile"):
        out.append(f"- **Orb profile** — {chart['orb_profile']}")
    return "\n".join(out)


def vedic_block(chart):
    v = chart.get("vedic")
    if not v:
        return ""
    ll = v["lagna_lord"]
    out = [f"**Lagna** — {v['lagna']}  ",
           f"**Lagna lord** — {ll['planet']} in {ll['placement']}, house {ll['house']}",
           "", "| Mahadasha | From | To |", "|---|---|---|"]
    for d in v["vimshottari_mahadashas"]:
        out.append(f"| {d['lord']} | {d['from']} | {d['to']} |")
    out.append("")
    out.append("*Dashas name seasons of emphasis, never events.*")
    return "\n".join(out)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("chart_json")
    ap.add_argument("--zodiac", choices=["tropical", "sidereal"], default=None)
    ap.add_argument("--vedic", action="store_true", help="include nakshatras and dashas")
    ap.add_argument("--section", default="all",
                    choices=["all", "birth", "positions", "angles", "aspects",
                             "distribution", "signature", "vedic"])
    args = ap.parse_args()

    raw = sys.stdin.read() if args.chart_json == "-" else open(args.chart_json).read()
    data = json.loads(raw)
    key = ("tropical" if args.zodiac == "tropical" else
           "sidereal_lahiri" if args.zodiac == "sidereal" else
           ("tropical" if "tropical" in data else "sidereal_lahiri"))
    chart = data[key]

    blocks = {
        "birth": lambda: birth_block(data["input"]),
        "positions": lambda: positions(chart, args.vedic),
        "angles": lambda: angles(chart, args.vedic),
        "aspects": lambda: aspects(chart),
        "distribution": lambda: distribution(chart),
        "signature": lambda: signature(chart),
        "vedic": lambda: vedic_block(chart),
    }
    if args.section != "all":
        print(blocks[args.section]())
        return
    titles = {"birth": "Birth data", "positions": "Positions", "angles": "Angles",
              "aspects": "Aspects", "distribution": "Element and mode distribution",
              "signature": "Chart signature", "vedic": "Vedic apparatus"}
    for k, fn in blocks.items():
        body = fn()
        if body.strip():
            print(f"### {titles[k]}\n\n{body}\n")


if __name__ == "__main__":
    main()
