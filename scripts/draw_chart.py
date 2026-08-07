#!/usr/bin/env python3
"""
draw_chart.py — render a natal chart wheel as SVG from calculate_chart.py output.

Reads the JSON the calculator produces and draws a publication-quality wheel:
zodiac ring with element tinting, house cusps and numbers, planets placed at
their true longitudes with collision spreading, and the aspect web in the
centre coloured by aspect family.

Design intent: an engraved, editorial look on warm paper rather than a neon
app screen — these reports are meant to be read and printed, and the wheel
should sit beside serious prose without shouting at it.

Usage:
  python calculate_chart.py ... > chart.json
  python draw_chart.py chart.json --out wheel.svg [--zodiac tropical|sidereal]
  python draw_chart.py chart.json --out wheel.svg --png wheel.png   # needs chromium

The chart wheel is drawn Ascendant-left (standard Western convention), with
longitude increasing counter-clockwise.
"""

import argparse
import json
import math
import os
import subprocess
import sys
import tempfile

# ---------------------------------------------------------------- palette
# Every colour and font in the wheel routes through these tokens, and
# apply_palette() overrides them from a JSON dict. This is the white-label
# seam: a partner brand is a palette file, not a fork of the renderer.
DEFAULT_PALETTE = {
    "ink": "#2A2620",        # primary linework and glyphs
    "paper": "#FBF7EE",      # background
    "faint": "#D9D0BE",      # hairlines, ticks, plate borders
    "mid": "#8A8070",        # secondary text, leaders, minor cusps
    "element": {"fire": "#B4523A", "earth": "#6B7A4B",
                "air": "#3F7186", "water": "#4A5C8C"},
    "aspect": {"conjunction": "#8A7A5C", "opposition": "#B4523A",
               "square": "#B4523A", "trine": "#3F7186", "sextile": "#3F7186",
               "quincunx": "#8A8070", "semisextile": "#A99C86",
               "semisquare": "#A99C86", "sesquiquadrate": "#A99C86"},
    "glyph_font": ("'DejaVu Sans Mono','Noto Sans Symbols2','Noto Sans CJK TC',"
                   "'DejaVu Sans','FreeSerif',sans-serif"),
    "text_font": "'Georgia','Noto Serif','DejaVu Serif',serif",
    "theme_palette": ["#4A5C8C", "#B4523A", "#6B7A4B", "#7A5C86",
                      "#3F7186", "#9A6B33"],
}

INK = DEFAULT_PALETTE["ink"]
PAPER = DEFAULT_PALETTE["paper"]
FAINT = DEFAULT_PALETTE["faint"]
MID = DEFAULT_PALETTE["mid"]
ELEMENT = dict(DEFAULT_PALETTE["element"])
ASPECT_COLOR = dict(DEFAULT_PALETTE["aspect"])


def apply_palette(overrides):
    """Merge a partial palette dict over the defaults (module-level, so call
    before build). Unknown keys are ignored; nested dicts merge shallowly."""
    global INK, PAPER, FAINT, MID, ELEMENT, ASPECT_COLOR
    global GLYPH_FONT, TEXT_FONT, THEME_PALETTE
    p = {**DEFAULT_PALETTE, **(overrides or {})}
    if overrides:
        for k in ("element", "aspect"):
            if k in overrides:
                p[k] = {**DEFAULT_PALETTE[k], **overrides[k]}
    INK, PAPER, FAINT, MID = p["ink"], p["paper"], p["faint"], p["mid"]
    ELEMENT, ASPECT_COLOR = dict(p["element"]), dict(p["aspect"])
    GLYPH_FONT, TEXT_FONT = p["glyph_font"], p["text_font"]
    THEME_PALETTE = list(p["theme_palette"])
HARD = {"opposition", "square"}
MINOR = {"semisextile", "semisquare", "sesquiquadrate", "quincunx"}

SIGNS = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
         "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"]
SIGN_GLYPH = "♈♉♊♋♌♍♎♏♐♑♒♓"
ELEMENTS = {"Aries": "fire", "Leo": "fire", "Sagittarius": "fire",
            "Taurus": "earth", "Virgo": "earth", "Capricorn": "earth",
            "Gemini": "air", "Libra": "air", "Aquarius": "air",
            "Cancer": "water", "Scorpio": "water", "Pisces": "water"}

PLANET_GLYPH = {
    "Sun": "☉", "Moon": "☽", "Mercury": "☿", "Venus": "♀", "Mars": "♂",
    "Jupiter": "♃", "Saturn": "♄", "Uranus": "♅", "Neptune": "♆", "Pluto": "♇",
    "North Node": "☊", "South Node": "☋",
}
# Chiron (U+26B7) has almost no font coverage, so it is drawn as a path.
GLYPH_FONT = DEFAULT_PALETTE["glyph_font"]
TEXT_FONT = DEFAULT_PALETTE["text_font"]

DRAW_ORDER = ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn",
              "Uranus", "Neptune", "Pluto", "Chiron", "North Node", "South Node"]

# Default colours for theme mode, in assignment order. Chosen to stay legible
# against warm paper and to remain distinguishable in greyscale print.
THEME_PALETTE = list(DEFAULT_PALETTE["theme_palette"])
DIM = 0.13          # opacity for everything outside the highlighted set
DIM_ASPECT = 0.07


def chiron_path(cx, cy, s, color=INK):
    """Chiron: a key — small circle with a K-stem rising from it."""
    r = s * 0.26
    top = cy - s * 0.62
    return (f'<g stroke="{color}" stroke-width="{s*0.11:.2f}" fill="none" '
            f'stroke-linecap="round">'
            f'<circle cx="{cx:.2f}" cy="{cy + s*0.34:.2f}" r="{r:.2f}"/>'
            f'<path d="M {cx:.2f} {cy + s*0.34 - r:.2f} L {cx:.2f} {top:.2f}"/>'
            f'<path d="M {cx - s*0.30:.2f} {top:.2f} L {cx:.2f} {top + s*0.30:.2f} '
            f'L {cx + s*0.30:.2f} {top - s*0.02:.2f}"/></g>')


def pol(cx, cy, r, theta_deg):
    t = math.radians(theta_deg)
    return cx + r * math.cos(t), cy - r * math.sin(t)


def arc_path(cx, cy, r, a0, a1):
    x0, y0 = pol(cx, cy, r, a0)
    x1, y1 = pol(cx, cy, r, a1)
    large = 1 if (a1 - a0) % 360 > 180 else 0
    return f"M {x0:.2f} {y0:.2f} A {r:.2f} {r:.2f} 0 {large} 0 {x1:.2f} {y1:.2f}"


def build(chart, size=1100, title=None, subtitle=None,
          highlight=None, themes=None):
    """Draw the wheel.

    highlight: a set of body/angle names to keep at full ink while everything
        else drops back — this is what makes a *thematic* wheel, one per
        movement of a report, so the reader sees only the placements that
        movement is actually about.
    themes: a list of {name, bodies, color} dicts. Aspect lines whose two
        endpoints share a theme are drawn in that theme's colour, and every
        other contact recedes. This renders the synthesis itself rather than
        the raw geometry: the reader can see why the reading says what it says.
    """
    hl = set(highlight) if highlight else None
    theme_of = {}
    if themes:
        for i, t in enumerate(themes):
            col = t.get("color") or THEME_PALETTE[i % len(THEME_PALETTE)]
            for b in t["bodies"]:
                theme_of.setdefault(b, []).append((t["name"], col))

    def emph(name):
        return 1.0 if (hl is None or name in hl) else DIM

    cx = cy = size / 2
    R = size * 0.435                    # outer edge of zodiac ring
    r_sign_in = R * 0.875               # inner edge of zodiac ring
    r_house = r_sign_in * 0.985         # house ring outer
    r_planet = r_sign_in * 0.795        # planet glyph radius
    r_deg = r_sign_in * 0.905           # degree tick / label radius
    r_hnum = r_sign_in * 0.545          # house numbers, inside the aspect circle
    r_aspect = r_sign_in * 0.60         # aspect web radius

    asc = chart["angles"]["Ascendant"]["longitude"]
    mc = chart["angles"]["Midheaven"]["longitude"]
    cusps = [c["longitude"] for c in chart["house_cusps"]]

    def theta(lon):
        """Longitude -> screen angle, Ascendant at left, counter-clockwise."""
        return (180 + (lon - asc)) % 360

    o = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{size}" height="{size}" '
         f'viewBox="0 0 {size} {size}">',
         f'<rect width="{size}" height="{size}" fill="{PAPER}"/>']

    # --- zodiac ring: element-tinted sectors ------------------------------
    for i, sign in enumerate(SIGNS):
        a0, a1 = theta(i * 30), theta(i * 30 + 30)
        x0, y0 = pol(cx, cy, R, a0)
        x1, y1 = pol(cx, cy, R, a1)
        xi1, yi1 = pol(cx, cy, r_sign_in, a1)
        xi0, yi0 = pol(cx, cy, r_sign_in, a0)
        large = 1 if (a1 - a0) % 360 > 180 else 0
        o.append(
            f'<path d="M {x0:.2f} {y0:.2f} A {R:.2f} {R:.2f} 0 {large} 0 {x1:.2f} {y1:.2f} '
            f'L {xi1:.2f} {yi1:.2f} A {r_sign_in:.2f} {r_sign_in:.2f} 0 {large} 1 '
            f'{xi0:.2f} {yi0:.2f} Z" fill="{ELEMENT[ELEMENTS[sign]]}" fill-opacity="0.13" '
            f'stroke="{FAINT}" stroke-width="1"/>')
        gx, gy = pol(cx, cy, (R + r_sign_in) / 2, theta(i * 30 + 15))
        o.append(f'<text x="{gx:.2f}" y="{gy + size*0.016:.2f}" font-family={GLYPH_FONT!r} '
                 f'font-size="{size*0.042:.1f}" fill="{ELEMENT[ELEMENTS[sign]]}" '
                 f'text-anchor="middle">{SIGN_GLYPH[i]}&#xFE0E;</text>')

    o.append(f'<circle cx="{cx}" cy="{cy}" r="{R:.2f}" fill="none" stroke="{INK}" stroke-width="2"/>')
    o.append(f'<circle cx="{cx}" cy="{cy}" r="{r_sign_in:.2f}" fill="none" stroke="{INK}" stroke-width="1.5"/>')

    # --- degree ticks: 1 deg fine, 5 deg medium, 10 deg long --------------
    for d in range(360):
        t = theta(d)
        ln = 0.010 if d % 10 else 0.020
        if d % 5 and d % 10:
            ln = 0.005
        x0, y0 = pol(cx, cy, r_sign_in, t)
        x1, y1 = pol(cx, cy, r_sign_in - size * ln, t)
        o.append(f'<line x1="{x0:.2f}" y1="{y0:.2f}" x2="{x1:.2f}" y2="{y1:.2f}" '
                 f'stroke="{FAINT}" stroke-width="{1.4 if not d % 10 else 0.8}"/>')

    # --- house cusps ------------------------------------------------------
    o.append(f'<circle cx="{cx}" cy="{cy}" r="{r_aspect:.2f}" fill="none" '
             f'stroke="{FAINT}" stroke-width="1"/>')
    for i, c in enumerate(cusps):
        t = theta(c)
        angular = i in (0, 3, 6, 9)
        x0, y0 = pol(cx, cy, r_aspect, t)
        x1, y1 = pol(cx, cy, r_house, t)
        dash = "" if angular else ' stroke-dasharray="4 4"'
        o.append(f'<line x1="{x0:.2f}" y1="{y0:.2f}" x2="{x1:.2f}" y2="{y1:.2f}" '
                 f'stroke="{INK if angular else MID}" '
                 f'stroke-width="{2.2 if angular else 0.9}"{dash}/>')
    # (house numbers are drawn after the aspect web, below)

    # --- angle labels ASC / MC / DSC / IC ---------------------------------
    for label, lon in (("ASC", asc), ("MC", mc), ("DSC", (asc + 180) % 360),
                       ("IC", (mc + 180) % 360)):
        t = theta(lon)
        lx, ly = pol(cx, cy, R * 1.045, t)
        o.append(f'<text x="{lx:.2f}" y="{ly + size*0.008:.2f}" font-family={TEXT_FONT!r} '
                 f'font-size="{size*0.020:.1f}" fill="{INK}" text-anchor="middle" '
                 f'letter-spacing="1">{label}</text>')

    # --- planets: collision spreading in screen-angle space ---------------
    pl = chart["placements"]
    items = [(n, pl[n]["longitude"], pl[n]) for n in DRAW_ORDER if n in pl]
    items.sort(key=lambda it: theta(it[1]))
    slots = [theta(it[1]) for it in items]
    MINSEP = 8.4
    for _ in range(220):                       # relaxation pass
        moved = False
        for i in range(len(slots)):
            j = (i + 1) % len(slots)
            gap = (slots[j] - slots[i]) % 360
            if gap < MINSEP:
                push = (MINSEP - gap) / 2
                slots[i] = (slots[i] - push) % 360
                slots[j] = (slots[j] + push) % 360
                moved = True
        if not moved:
            break

    glyph_pts = {}
    for idx, ((name, lon, p), th) in enumerate(zip(items, slots)):
        e = emph(name)
        tcol = theme_of.get(name, [(None, INK)])[0][1] if theme_of else INK
        # leader line from true degree to the (possibly nudged) glyph
        tx0, ty0 = pol(cx, cy, r_deg, theta(lon))
        tx1, ty1 = pol(cx, cy, r_planet + size * 0.030, th)
        o.append(f'<line x1="{tx0:.2f}" y1="{ty0:.2f}" x2="{tx1:.2f}" y2="{ty1:.2f}" '
                 f'stroke="{MID}" stroke-width="0.8" stroke-opacity="{e:.2f}"/>')
        gx, gy = pol(cx, cy, r_planet, th)
        glyph_pts[name] = pol(cx, cy, r_aspect, theta(lon))
        if hl and name in hl:      # halo behind an emphasised glyph
            o.append(f'<circle cx="{gx:.2f}" cy="{gy:.2f}" r="{size*0.030:.2f}" '
                     f'fill="{tcol}" fill-opacity="0.10"/>')
        if name == "Chiron":
            o.append(f'<g opacity="{e:.2f}">'
                     f'{chiron_path(gx, gy, size * 0.030, tcol)}</g>')
        else:
            o.append(f'<text x="{gx:.2f}" y="{gy + size*0.014:.2f}" '
                     f'font-family={GLYPH_FONT!r} font-size="{size*0.040:.1f}" '
                     f'fill="{tcol}" fill-opacity="{e:.2f}" text-anchor="middle">'
                     f'{PLANET_GLYPH[name]}&#xFE0E;</text>')
        # Degree labels alternate between two radii so neighbours in a tight
        # cluster (a stellium, or a planet sitting on an angle) never collide.
        deg = int(lon % 30)
        mins = int(round((lon % 1) * 60)) % 60
        stagger = size * (0.036 if idx % 2 == 0 else 0.062)
        lx, ly = pol(cx, cy, r_planet - stagger, th)
        rx = "℞" if p.get("retrograde") and name not in ("North Node", "South Node") else ""
        o.append(f'<text x="{lx:.2f}" y="{ly:.2f}" font-family={TEXT_FONT!r} '
                 f'font-size="{size*0.0155:.1f}" fill="{MID}" fill-opacity="{e:.2f}" '
                 f'text-anchor="middle">{deg}°{mins:02d}′{rx}</text>')

    # --- aspect web -------------------------------------------------------
    # In theme mode the web is coloured by which theme a contact belongs to
    # rather than by aspect family, so the picture shows the synthesis.
    for a in chart.get("aspects", []):
        n1, n2 = a["bodies"]
        if n1 not in glyph_pts or n2 not in glyph_pts:
            continue
        minor = a["aspect"] in MINOR
        col = ASPECT_COLOR.get(a["aspect"], MID)
        w = 0.7 if minor else (2.0 if a.get("tight") else 1.2)
        dash = ' stroke-dasharray="5 5"' if minor else ""
        op = 0.45 if minor else (0.85 if a.get("tight") else 0.6)

        if theme_of:
            shared = ({t for t, _ in theme_of.get(n1, [])}
                      & {t for t, _ in theme_of.get(n2, [])})
            if shared:
                col = dict((t, c) for t, c in theme_of[n1])[sorted(shared)[0]]
                w = max(w, 2.2)
                op = 0.9
            else:
                col, op, w = MID, 0.10, 0.7
        if hl is not None:
            inside = n1 in hl and n2 in hl
            op = op if inside else DIM_ASPECT
            if inside:
                w = max(w, 2.0)
        x1, y1 = glyph_pts[n1]
        x2, y2 = glyph_pts[n2]
        o.append(f'<line x1="{x1:.2f}" y1="{y1:.2f}" x2="{x2:.2f}" y2="{y2:.2f}" '
                 f'stroke="{col}" stroke-width="{w}" stroke-opacity="{op:.2f}"{dash}/>')

    # --- house numbers, drawn last so their halos clear the aspect web ---
    for i, c in enumerate(cusps):
        nxt = cusps[(i + 1) % 12]
        mid = c + ((nxt - c) % 360) / 2
        hx, hy = pol(cx, cy, r_hnum, theta(mid))
        o.append(f'<circle cx="{hx:.2f}" cy="{hy:.2f}" r="{size*0.017:.2f}" '
                 f'fill="{PAPER}" fill-opacity="0.85"/>')
        o.append(f'<text x="{hx:.2f}" y="{hy + size*0.008:.2f}" font-family={TEXT_FONT!r} '
                 f'font-size="{size*0.021:.1f}" fill="{MID}" text-anchor="middle">{i+1}</text>')

    # --- centre caption, on a paper plate so aspect lines don't run through it
    if title or subtitle:
        # size the plate to the longest line rather than to a fixed fraction,
        # so movement captions of any length stay inside it
        wt = len(title or "") * size * 0.0139
        ws = len(subtitle or "") * size * 0.0083
        w = max(wt, ws) + size * 0.05
        h = size * (0.085 if subtitle else 0.055)
        o.append(f'<rect x="{cx - w/2:.2f}" y="{cy - h/2:.2f}" width="{w:.2f}" '
                 f'height="{h:.2f}" rx="{h/2:.2f}" fill="{PAPER}" fill-opacity="0.92" '
                 f'stroke="{FAINT}" stroke-width="1"/>')
    if title:
        dy = -size * 0.004 if subtitle else size * 0.010
        o.append(f'<text x="{cx}" y="{cy + dy:.2f}" font-family={TEXT_FONT!r} '
                 f'font-size="{size*0.026:.1f}" fill="{INK}" text-anchor="middle" '
                 f'font-style="italic">{title}</text>')
    if subtitle:
        o.append(f'<text x="{cx}" y="{cy + size*0.026:.2f}" font-family={TEXT_FONT!r} '
                 f'font-size="{size*0.0155:.1f}" fill="{MID}" text-anchor="middle">'
                 f'{subtitle}</text>')

    o.append("</svg>")
    return "\n".join(o)


def rasterize(svg_path, png_path, size):
    """Rasterize via headless Chromium so glyph rendering is deterministic."""
    for exe in ("/opt/pw-browsers/chromium/chrome-linux/chrome",
                "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
                "chromium", "chromium-browser", "google-chrome"):
        path = exe if os.path.exists(exe) else None
        if path is None:
            from shutil import which
            path = which(exe)
        if not path:
            continue
        with tempfile.TemporaryDirectory() as td:
            r = subprocess.run(
                [path, "--headless", "--disable-gpu", "--no-sandbox",
                 f"--user-data-dir={td}", "--hide-scrollbars",
                 "--default-background-color=00000000",
                 f"--screenshot={png_path}", f"--window-size={size},{size}",
                 f"file://{os.path.abspath(svg_path)}"],
                capture_output=True, text=True, timeout=120)
        if os.path.exists(png_path) and os.path.getsize(png_path) > 0:
            return True
        print(r.stderr[-400:], file=sys.stderr)
    return False


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("chart_json", help="output of calculate_chart.py (or - for stdin)")
    ap.add_argument("--out", required=True, help="SVG path to write")
    ap.add_argument("--png", help="also rasterize to this PNG (needs chromium)")
    ap.add_argument("--zodiac", choices=["tropical", "sidereal"], default=None,
                    help="which block to draw when the JSON holds both")
    ap.add_argument("--size", type=int, default=1100)
    ap.add_argument("--title", default=None)
    ap.add_argument("--subtitle", default=None)
    ap.add_argument("--highlight", default=None,
                    help="comma-separated bodies to keep at full ink (thematic wheel); "
                         "everything else recedes. e.g. 'Moon,Venus,Chiron'")
    ap.add_argument("--themes", default=None,
                    help="JSON file: {\"themes\":[{\"name\":..,\"bodies\":[..],"
                         "\"color\":\"#rrggbb\"}]} — colours the aspect web by "
                         "detected theme instead of by aspect family")
    ap.add_argument("--palette", default=None,
                    help="JSON file of palette token overrides (ink, paper, faint, "
                         "mid, element{}, aspect{}, fonts, theme_palette[]) — the "
                         "white-label seam")
    args = ap.parse_args()

    if args.palette:
        with open(args.palette) as f:
            apply_palette(json.load(f))

    raw = sys.stdin.read() if args.chart_json == "-" else open(args.chart_json).read()
    data = json.loads(raw)
    key = ("tropical" if args.zodiac == "tropical" else
           "sidereal_lahiri" if args.zodiac == "sidereal" else
           ("tropical" if "tropical" in data else "sidereal_lahiri"))
    if key not in data:
        sys.exit(f"No '{key}' block in this chart JSON. Present: {list(data)}")

    highlight = [s.strip() for s in args.highlight.split(",")] if args.highlight else None
    themes = None
    if args.themes:
        with open(args.themes) as f:
            themes = json.load(f)["themes"]

    svg = build(data[key], size=args.size, title=args.title, subtitle=args.subtitle,
                highlight=highlight, themes=themes)
    with open(args.out, "w") as f:
        f.write(svg)
    print(f"wrote {args.out}")
    if args.png:
        if rasterize(args.out, args.png, args.size):
            print(f"wrote {args.png}")
        else:
            sys.exit("rasterization failed — SVG is still usable")


if __name__ == "__main__":
    main()
