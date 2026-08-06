#!/usr/bin/env python3
"""
calculate_chart.py — deterministic natal chart mathematics via Swiss Ephemeris.

The astronomy is calculated, never estimated. This script outputs a JSON chart
summary that the interpretation layer consumes: positions, houses, aspects with
exact orbs, and the pre-computed weighting data (angularity, element/mode
balance, chart ruler, stelliums) that the synthesis methodology relies on.

Requires: pip install pyswisseph  (the ephe/ directory beside this script
bundles seas_18.se1 / sepl_18.se1 / semo_18.se1 for 1800-2400 CE, which
enables Chiron; outside that range Chiron is omitted gracefully).

Usage:
  python calculate_chart.py --date 1986-03-15 --time 14:30 \
      --tz America/Chicago --lat 44.98 --lon -93.26 \
      [--zodiac tropical|sidereal|dual] [--house-system P] [--quincunx]

Timezone: pass an IANA name (America/Chicago); zoneinfo applies the historical
UTC offset and DST rules in force on the birth date. If only a raw offset is
known, pass --utc-offset -6.0 instead of --tz.

Longitude convention: east positive, west negative (Minneapolis is -93.26).
"""

import argparse
import json
import os
import sys
from datetime import datetime

try:
    import swisseph as swe
except ImportError:
    sys.exit("pyswisseph not installed. Run: pip install pyswisseph --break-system-packages")

EPHE_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "ephe")
if os.path.isdir(EPHE_PATH):
    swe.set_ephe_path(EPHE_PATH)

SIGNS = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
         "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"]

ELEMENTS = {"Aries": "fire", "Leo": "fire", "Sagittarius": "fire",
            "Taurus": "earth", "Virgo": "earth", "Capricorn": "earth",
            "Gemini": "air", "Libra": "air", "Aquarius": "air",
            "Cancer": "water", "Scorpio": "water", "Pisces": "water"}

MODES = {"Aries": "cardinal", "Cancer": "cardinal", "Libra": "cardinal", "Capricorn": "cardinal",
         "Taurus": "fixed", "Leo": "fixed", "Scorpio": "fixed", "Aquarius": "fixed",
         "Gemini": "mutable", "Virgo": "mutable", "Sagittarius": "mutable", "Pisces": "mutable"}

# Modern rulerships (traditional co-rulers noted for the chart-ruler calc)
RULERS = {"Aries": "Mars", "Taurus": "Venus", "Gemini": "Mercury", "Cancer": "Moon",
          "Leo": "Sun", "Virgo": "Mercury", "Libra": "Venus", "Scorpio": "Pluto",
          "Sagittarius": "Jupiter", "Capricorn": "Saturn", "Aquarius": "Uranus",
          "Pisces": "Neptune"}
TRADITIONAL_CORULERS = {"Scorpio": "Mars", "Aquarius": "Saturn", "Pisces": "Jupiter"}

# 27 nakshatras: (name, presiding deity, symbol) — the mythic layer for Vedic mode
NAKSHATRAS = [
    ("Ashwini", "the Ashvins, horse-headed healers of the gods", "a horse's head"),
    ("Bharani", "Yama, lord of the threshold", "the yoni, the bearer"),
    ("Krittika", "Agni, god of fire", "the razor, the flame"),
    ("Rohini", "Prajapati, the creator", "the ox-cart, the red doe"),
    ("Mrigashira", "Soma, the moon-nectar", "the searching deer's head"),
    ("Ardra", "Rudra, the storm god", "the teardrop"),
    ("Punarvasu", "Aditi, the boundless mother", "the quiver of returning arrows"),
    ("Pushya", "Brihaspati, priest of the gods", "the cow's udder, nourishment"),
    ("Ashlesha", "the Nagas, serpents of wisdom", "the coiled serpent"),
    ("Magha", "the Pitris, the ancestors", "the royal throne"),
    ("Purva Phalguni", "Bhaga, god of delight", "the front legs of the marriage bed"),
    ("Uttara Phalguni", "Aryaman, god of contracts and kindness", "the back legs of the bed"),
    ("Hasta", "Savitar, the golden hand of the sun", "the open hand"),
    ("Chitra", "Tvashtar, the celestial architect", "the bright jewel"),
    ("Swati", "Vayu, the wind", "a young shoot swaying in the wind"),
    ("Vishakha", "Indra and Agni together", "the triumphal archway"),
    ("Anuradha", "Mitra, god of friendship", "the lotus rising from mud"),
    ("Jyeshtha", "Indra, the elder king", "the royal earring, emblem of rank"),
    ("Mula", "Nirriti, goddess of dissolution", "the bundle of roots"),
    ("Purva Ashadha", "Apas, the waters", "the winnowing fan"),
    ("Uttara Ashadha", "the Vishvedevas, all-gods", "the elephant's tusk"),
    ("Shravana", "Vishnu the listener", "the ear, the three footprints"),
    ("Dhanishta", "the Vasus, gods of abundance", "the drum"),
    ("Shatabhisha", "Varuna, lord of cosmic waters", "the empty circle, the hundred healers"),
    ("Purva Bhadrapada", "Aja Ekapada, the one-footed fire serpent", "the front of the funeral cot"),
    ("Uttara Bhadrapada", "Ahirbudhnya, serpent of the deep", "the back of the cot, the depths"),
    ("Revati", "Pushan, shepherd of souls", "the fish swimming in the sea"),
]

# Vimshottari mahadasha lords and period lengths (years), in nakshatra order
VIMSHOTTARI = [("Ketu", 7), ("Venus", 20), ("Sun", 6), ("Moon", 10), ("Mars", 7),
               ("Rahu", 18), ("Jupiter", 16), ("Saturn", 19), ("Mercury", 17)]

# Traditional (Vedic) sign lords, used for the lagna lord in Vedic mode
VEDIC_RULERS = {"Aries": "Mars", "Taurus": "Venus", "Gemini": "Mercury", "Cancer": "Moon",
                "Leo": "Sun", "Virgo": "Mercury", "Libra": "Venus", "Scorpio": "Mars",
                "Sagittarius": "Jupiter", "Capricorn": "Saturn", "Aquarius": "Saturn",
                "Pisces": "Jupiter"}


def nakshatra_of(lon):
    span = 360.0 / 27
    idx = int(lon // span) % 27
    pada = int((lon % span) // (span / 4)) + 1
    name, deity, symbol = NAKSHATRAS[idx]
    return {"nakshatra": name, "pada": pada, "deity": deity, "symbol": symbol}


def vimshottari(moon_lon, birth_year, birth_month, birth_day):
    """Mahadasha timeline from the sidereal Moon. Returns periods covering
    birth through ~90 years. Seasons of emphasis, not predictions."""
    from datetime import datetime, timedelta
    span = 360.0 / 27
    idx = int(moon_lon // span) % 27
    frac_elapsed = (moon_lon % span) / span
    order = VIMSHOTTARI[idx % 9:] + VIMSHOTTARI[:idx % 9]
    birth = datetime(birth_year, birth_month, birth_day)
    cur = birth - timedelta(days=frac_elapsed * order[0][1] * 365.25)
    out = []
    for lord, yrs in (order * 2)[:12]:
        end = cur + timedelta(days=yrs * 365.25)
        if end > birth and (cur - birth).days < 90 * 365.25:
            out.append({"lord": lord, "from": max(cur, birth).strftime("%Y-%m"),
                        "to": end.strftime("%Y-%m")})
        cur = end
    return out


PLANETS = [("Sun", swe.SUN), ("Moon", swe.MOON), ("Mercury", swe.MERCURY),
           ("Venus", swe.VENUS), ("Mars", swe.MARS), ("Jupiter", swe.JUPITER),
           ("Saturn", swe.SATURN), ("Uranus", swe.URANUS), ("Neptune", swe.NEPTUNE),
           ("Pluto", swe.PLUTO)]

# Major (Ptolemaic) aspects, the optional quincunx, and the optional minors.
ASPECTS = [("conjunction", 0), ("opposition", 180), ("trine", 120),
           ("square", 90), ("sextile", 60)]
QUINCUNX = ("quincunx", 150)
MINOR_ASPECTS = [("semisextile", 30), ("semisquare", 45), ("sesquiquadrate", 135)]

# Base orbs in degrees, before the profile multiplier and the luminary bonus.
# Orb choice is a real interpretive decision, not a constant of nature — two
# astrologers with different tables will legitimately disagree about whether a
# given contact exists. The profile makes that choice explicit and visible in
# the output rather than burying it in code.
BASE_ORBS = {"conjunction": 7.0, "opposition": 7.0, "trine": 6.0, "square": 6.0,
             "sextile": 4.0, "quincunx": 4.0,
             "semisextile": 2.0, "semisquare": 2.0, "sesquiquadrate": 2.0}
ORB_PROFILES = {"tight": 0.75, "standard": 1.0, "wide": 1.4}
LUMINARY_BONUS = 2.0   # added when the Sun or Moon is involved
ANGLE_BONUS = 1.0      # added for contacts to the Ascendant or Midheaven

LUMINARIES = {"Sun", "Moon"}
ANGLES = {"Ascendant", "Midheaven"}


def orb_limit(a, b, aspect_name, profile="standard"):
    """Orb allowed for this pair and aspect, under the chosen profile."""
    base = BASE_ORBS[aspect_name]
    if a in LUMINARIES or b in LUMINARIES:
        base += LUMINARY_BONUS
    if a in ANGLES or b in ANGLES:
        base += ANGLE_BONUS
    return round(base * ORB_PROFILES[profile], 2)


def norm(deg):
    return deg % 360.0


def sign_of(lon):
    return SIGNS[int(lon // 30) % 12]


def fmt_pos(lon):
    d = lon % 30
    return {"longitude": round(lon, 4), "sign": sign_of(lon),
            "degree_in_sign": int(d), "minute": int(round((d % 1) * 60)) % 60,
            "display": f"{int(d)}°{int(round((d % 1) * 60)) % 60:02d}' {sign_of(lon)}"}


def angular_sep(a, b):
    d = abs(norm(a) - norm(b))
    return min(d, 360 - d)


def house_of(lon, cusps):
    """Which house a longitude falls in, given 12 cusp longitudes."""
    for i in range(12):
        start, end = cusps[i], cusps[(i + 1) % 12]
        span = norm(end - start)
        if norm(lon - start) < span:
            return i + 1
    return 12


def compute_bodies(jd, sidereal=False):
    flags = swe.FLG_SPEED | (swe.FLG_SIDEREAL if sidereal else 0)
    bodies = {}
    for name, code in PLANETS:
        pos, _ = swe.calc_ut(jd, code, flags)
        bodies[name] = {"lon": pos[0], "speed": pos[3], "retrograde": pos[3] < 0}
    # Chiron requires the bundled asteroid ephemeris; omit gracefully if absent
    try:
        pos, _ = swe.calc_ut(jd, swe.CHIRON, flags)
        bodies["Chiron"] = {"lon": pos[0], "speed": pos[3], "retrograde": pos[3] < 0}
    except swe.Error:
        bodies["_chiron_note"] = ("Chiron unavailable — asteroid ephemeris file not found "
                                  "for this date range. Run: python scripts/setup_ephemeris.py")
    pos, _ = swe.calc_ut(jd, swe.TRUE_NODE, flags)
    bodies["North Node"] = {"lon": pos[0], "speed": pos[3], "retrograde": True}
    bodies["South Node"] = {"lon": norm(pos[0] + 180), "speed": pos[3], "retrograde": True}
    return bodies


def build_chart(jd, lat, lon_geo, hsys, sidereal):
    if sidereal:
        swe.set_sid_mode(swe.SIDM_LAHIRI)
        cusps, ascmc = swe.houses_ex(jd, lat, lon_geo, hsys.encode(), swe.FLG_SIDEREAL)
    else:
        cusps, ascmc = swe.houses(jd, lat, lon_geo, hsys.encode())
    cusps = list(cusps[:12])
    asc, mc = ascmc[0], ascmc[1]
    bodies = compute_bodies(jd, sidereal)

    placements = {}
    note = bodies.pop("_chiron_note", None)
    for name, b in bodies.items():
        placements[name] = {
            **fmt_pos(b["lon"]),
            "house": house_of(b["lon"], cusps),
            "retrograde": b["retrograde"],
        }

    angles = {"Ascendant": fmt_pos(asc), "Midheaven": fmt_pos(mc),
              "Descendant": fmt_pos(norm(asc + 180)), "IC": fmt_pos(norm(mc + 180))}

    return {"placements": placements, "angles": angles,
            "house_cusps": [fmt_pos(c) for c in cusps],
            "bodies_raw": bodies, "asc": asc, "mc": mc,
            **({"note": note} if note else {})}


def find_aspects(bodies, include_quincunx, asc=None, mc=None,
                 profile="standard", include_minors=False):
    """Aspects among planets + Chiron + the North Node, and to the Ascendant and
    Midheaven, with exact orbs and applying/separating where speeds allow.

    Contacts that fall just outside the profile's orb are returned separately as
    `near_misses`, because "X is unaspected" is a claim about the orb table, not
    about the sky — see the guard in references/synthesis.md."""
    bodies = dict(bodies)
    if asc is not None:
        bodies["Ascendant"] = {"lon": asc, "speed": 0.0, "retrograde": False}
    if mc is not None:
        bodies["Midheaven"] = {"lon": mc, "speed": 0.0, "retrograde": False}
    names = [n for n in bodies if n != "South Node"]
    aspect_defs = ASPECTS + ([QUINCUNX] if include_quincunx else []) \
        + (MINOR_ASPECTS if include_minors else [])
    found, near = [], []
    for i, a in enumerate(names):
        for b in names[i + 1:]:
            if a in ANGLES and b in ANGLES:
                continue  # ASC/MC angle to each other is a house-system artifact
            sep = angular_sep(bodies[a]["lon"], bodies[b]["lon"])
            for asp_name, angle in aspect_defs:
                orb = abs(sep - angle)
                limit = orb_limit(a, b, asp_name, profile)
                if limit < orb <= limit + 4.0:
                    near.append({"bodies": [a, b], "aspect": asp_name,
                                 "orb": round(orb, 2), "orb_limit": limit})
                if orb <= limit:
                    # applying if the faster body is moving toward exactitude
                    rel_speed = bodies[a]["speed"] - bodies[b]["speed"]
                    diff = norm(bodies[a]["lon"] - bodies[b]["lon"])
                    if diff > 180:
                        diff -= 360
                    closing = (abs(diff) < angle and rel_speed < 0) or \
                              (abs(diff) > angle and rel_speed > 0) if angle else \
                              (diff * rel_speed < 0)
                    found.append({
                        "bodies": [a, b], "aspect": asp_name,
                        "orb": round(orb, 2), "orb_limit": limit,
                        "tight": orb <= 2.0,
                        "applying": bool(closing),
                    })
                    break
    return (sorted(found, key=lambda x: x["orb"]),
            sorted(near, key=lambda x: x["orb"]))


def weighting(chart, aspects):
    """Pre-compute everything synthesis.md needs to weight the chart."""
    placements, asc, mc = chart["placements"], chart["asc"], chart["mc"]
    weights = {}

    # Angularity: within 8 deg of an angle, in zodiacal terms
    angular = {}
    for name, p in placements.items():
        for angle_name, angle_lon in [("Ascendant", asc), ("Midheaven", mc),
                                      ("Descendant", norm(asc + 180)), ("IC", norm(mc + 180))]:
            sep = angular_sep(p["longitude"], angle_lon)
            if sep <= 8.0:
                angular.setdefault(name, []).append({"angle": angle_name, "orb": round(sep, 2)})
    weights["angular_planets"] = angular

    # Element / mode balance over Sun..Pluto + ASC and MC signs (classic tally)
    tally_bodies = [n for n, _ in PLANETS]
    elems = {"fire": 0, "earth": 0, "air": 0, "water": 0}
    modes = {"cardinal": 0, "fixed": 0, "mutable": 0}
    for n in tally_bodies:
        s = placements[n]["sign"]
        elems[ELEMENTS[s]] += 1
        modes[MODES[s]] += 1
    for a in ("Ascendant", "Midheaven"):
        s = chart["angles"][a]["sign"]
        elems[ELEMENTS[s]] += 1
        modes[MODES[s]] += 1
    weights["elements"] = elems
    weights["modes"] = modes
    weights["missing_elements"] = [e for e, c in elems.items() if c == 0]
    weights["dominant_element"] = max(elems, key=elems.get)

    # Chart ruler
    rising = chart["angles"]["Ascendant"]["sign"]
    ruler = RULERS[rising]
    weights["rising_sign"] = rising
    weights["chart_ruler"] = {"planet": ruler, "placement": placements[ruler]["display"],
                              "house": placements[ruler]["house"]}
    if rising in TRADITIONAL_CORULERS:
        co = TRADITIONAL_CORULERS[rising]
        weights["traditional_co_ruler"] = {"planet": co, "placement": placements[co]["display"],
                                           "house": placements[co]["house"]}

    # Stelliums: 3+ of Sun..Pluto in one sign or one house
    by_sign, by_house = {}, {}
    for n in tally_bodies:
        by_sign.setdefault(placements[n]["sign"], []).append(n)
        by_house.setdefault(placements[n]["house"], []).append(n)
    weights["stelliums"] = {
        "by_sign": {s: ns for s, ns in by_sign.items() if len(ns) >= 3},
        "by_house": {str(h): ns for h, ns in by_house.items() if len(ns) >= 3},
    }

    weights["tightest_aspects"] = [a for a in aspects if a["tight"]][:8]
    weights["retrograde_planets"] = [n for n, p in placements.items()
                                     if p["retrograde"] and n not in ("North Node", "South Node")]
    return weights


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--date", required=True, help="YYYY-MM-DD (birth date, local)")
    ap.add_argument("--time", required=True, help="HH:MM (birth time, local, 24h)")
    ap.add_argument("--tz", help="IANA timezone, e.g. America/Chicago (preferred)")
    ap.add_argument("--utc-offset", type=float, help="Raw UTC offset in hours if no IANA tz")
    ap.add_argument("--lat", type=float, required=True)
    ap.add_argument("--lon", type=float, required=True, help="east positive, west negative")
    ap.add_argument("--zodiac", choices=["tropical", "sidereal", "dual"], default="tropical")
    ap.add_argument("--house-system", default="P", help="P=Placidus, W=whole sign, K=Koch, E=equal")
    ap.add_argument("--quincunx", action="store_true", help="include quincunx aspects")
    ap.add_argument("--orbs", choices=["tight", "standard", "wide"], default="standard",
                    help="orb profile; 'wide' approximates Astro.com-style generous orbs")
    ap.add_argument("--minor-aspects", action="store_true",
                    help="include semisextile, semisquare, sesquiquadrate")
    ap.add_argument("--vedic", action="store_true",
                    help="Jyotish mode: sidereal + whole-sign houses, nakshatras for every "
                         "placement, lagna lord by traditional rulership, Vimshottari mahadashas")
    args = ap.parse_args()
    if args.vedic:
        args.zodiac = "sidereal"
        if args.house_system == "P":
            args.house_system = "W"

    y, m, d = map(int, args.date.split("-"))
    hh, mm = map(int, args.time.split(":"))

    if args.tz:
        from zoneinfo import ZoneInfo
        local = datetime(y, m, d, hh, mm, tzinfo=ZoneInfo(args.tz))
        offset = local.utcoffset().total_seconds() / 3600.0
    elif args.utc_offset is not None:
        offset = args.utc_offset
    else:
        sys.exit("Provide --tz (preferred) or --utc-offset.")

    ut_hour = hh + mm / 60.0 - offset
    jd = swe.julday(y, m, d, ut_hour)

    def one(sidereal):
        chart = build_chart(jd, args.lat, args.lon, args.house_system, sidereal)
        aspects, near = find_aspects(chart.pop("bodies_raw"), args.quincunx,
                                     asc=chart["asc"], mc=chart["mc"],
                                     profile=args.orbs,
                                     include_minors=args.minor_aspects)
        w = weighting(chart, aspects)
        chart.pop("asc"), chart.pop("mc")
        # Contact census: how many aspects each body actually makes. Guards
        # against calling a body "unaspected" when it is merely under-orbed.
        census = {}
        for a in aspects:
            for nm in a["bodies"]:
                census[nm] = census.get(nm, 0) + 1
        for nm in list(chart["placements"]) + ["Ascendant", "Midheaven"]:
            census.setdefault(nm, 0)
        return {**chart, "aspects": aspects, "near_miss_aspects": near,
                "contact_census": census, "orb_profile": args.orbs,
                "weighting": w}

    result = {
        "input": {"date": args.date, "time": args.time,
                  "utc_offset_applied": offset, "lat": args.lat, "lon": args.lon,
                  "house_system": args.house_system, "zodiac": args.zodiac},
    }
    if args.zodiac == "tropical":
        result["tropical"] = one(sidereal=False)
    elif args.zodiac == "sidereal":
        chart = one(sidereal=True)
        if args.vedic:
            for name, p in chart["placements"].items():
                p.update(nakshatra_of(p["longitude"]))
            for name, a in chart["angles"].items():
                a.update(nakshatra_of(a["longitude"]))
            rising = chart["angles"]["Ascendant"]["sign"]
            lagna_lord = VEDIC_RULERS[rising]
            chart["vedic"] = {
                "lagna": rising,
                "lagna_lord": {"planet": lagna_lord,
                               "placement": chart["placements"][lagna_lord]["display"],
                               "house": chart["placements"][lagna_lord]["house"]},
                "vimshottari_mahadashas": vimshottari(
                    chart["placements"]["Moon"]["longitude"], y, m, d),
                "note": "Dashas are seasons of emphasis, never event predictions.",
            }
        result["sidereal_lahiri"] = chart
    else:  # dual — the Holistic method: both zodiacs, equal weight
        result["tropical"] = one(sidereal=False)
        result["sidereal_lahiri"] = one(sidereal=True)
        # Flag placements that change sign between zodiacs — the interesting cases
        shifts = []
        for name in result["tropical"]["placements"]:
            t = result["tropical"]["placements"][name]["sign"]
            s = result["sidereal_lahiri"]["placements"][name]["sign"]
            if t != s:
                shifts.append({"body": name, "tropical": t, "sidereal": s})
        result["dual_zodiac_sign_shifts"] = shifts

    print(json.dumps(result, indent=1))


if __name__ == "__main__":
    main()
