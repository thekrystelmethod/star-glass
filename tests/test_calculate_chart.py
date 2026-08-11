"""Golden-chart fixtures and edge-case tests for the deterministic engine.

Run:  python -m pytest tests/ -q
These are the trust gate: every displayed value the product shows a reader
routes through the code under test here.
"""
import json
import os
import subprocess
import sys

import pytest

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCRIPTS = os.path.join(ROOT, "scripts")
SCRIPT = os.path.join(SCRIPTS, "calculate_chart.py")
sys.path.insert(0, SCRIPTS)

import calculate_chart as cc  # noqa: E402


def run_script(*extra):
    return subprocess.run([sys.executable, SCRIPT, *extra],
                          capture_output=True, text=True, timeout=120)


def chart(*extra):
    result = run_script(*extra)
    assert result.returncode == 0, result.stderr
    return json.loads(result.stdout)


GOLDEN_ARGS = ("--date", "1983-03-31", "--time", "05:50", "--tz", "America/New_York",
               "--lat", "41.4993", "--lon", "-81.6944")


# ── golden chart ─────────────────────────────────────────────────────────

def test_golden_chart_positions():
    data = chart(*GOLDEN_ARGS, "--zodiac", "tropical", "--quincunx")
    block = data["tropical"]
    p = block["placements"]
    assert (p["Sun"]["sign"], p["Sun"]["degree_in_sign"], p["Sun"]["minute"]) == ("Aries", 10, 9)
    assert (p["Moon"]["sign"], p["Moon"]["house"]) == ("Scorpio", 8)
    assert p["Saturn"]["retrograde"] is True
    asc = block["angles"]["Ascendant"]
    assert (asc["sign"], asc["degree_in_sign"]) == ("Pisces", 28)
    assert len(block["house_cusps"]) == 12
    tight = [a for a in block["aspects"]
             if set(a["bodies"]) == {"Moon", "Venus"} and a["aspect"] == "opposition"]
    assert tight and tight[0]["orb"] < 1.0
    assert block["weighting"]["rising_sign"] == "Pisces"
    assert block["weighting"]["chart_ruler"]["planet"] == "Neptune"


# ── display formatting: full minute carry ────────────────────────────────

def test_minute_carry_within_degree():
    pos = cc.fmt_pos(10.9917)          # 10°59.502' → rounds to 11°00'
    assert (pos["degree_in_sign"], pos["minute"]) == (11, 0)


def test_minute_carry_across_sign_boundary():
    pos = cc.fmt_pos(29.9999)          # 29°59.994' Aries → 0°00' Taurus
    assert (pos["sign"], pos["degree_in_sign"], pos["minute"]) == ("Taurus", 0, 0)


def test_minute_carry_across_zodiac_wrap():
    pos = cc.fmt_pos(359.9999)         # 29°59.994' Pisces → 0°00' Aries
    assert (pos["sign"], pos["degree_in_sign"], pos["minute"]) == ("Aries", 0, 0)


def test_no_carry_when_not_needed():
    pos = cc.fmt_pos(13.5)
    assert (pos["degree_in_sign"], pos["minute"]) == (13, 30)


# ── true node motion is measured, not asserted ───────────────────────────

def test_true_node_motion_follows_speed():
    import swisseph as swe
    saw_direct = saw_retro = False
    jd0 = swe.julday(2024, 1, 1, 0.0)
    for day in range(0, 120, 2):
        bodies = cc.compute_bodies(jd0 + day)
        node = bodies["North Node"]
        assert node["retrograde"] == (node["speed"] < 0)
        saw_direct |= not node["retrograde"]
        saw_retro |= node["retrograde"]
    assert saw_retro, "true node never retrograde across 120 days — implausible"
    assert saw_direct, "true node never direct across 120 days — the old hardcoding bug"


# ── applying / separating uses the signed separation ─────────────────────

def synthetic(lon, speed):
    return {"lon": lon, "speed": speed, "retrograde": speed < 0}


def test_applying_square_detected():
    bodies = {"A": synthetic(0.0, 1.0), "B": synthetic(92.0, 0.0)}
    found, _ = cc.find_aspects(bodies, include_quincunx=False)
    square = [a for a in found if a["aspect"] == "square"]
    assert square and square[0]["applying"] is True   # separation 92° shrinking toward 90°


def test_mirrored_square_is_separating():
    bodies = {"A": synthetic(92.0, 1.0), "B": synthetic(0.0, 0.0)}
    found, _ = cc.find_aspects(bodies, include_quincunx=False)
    square = [a for a in found if a["aspect"] == "square"]
    assert square and square[0]["applying"] is False  # separation 92° growing away from 90°


def test_applying_conjunction():
    bodies = {"A": synthetic(3.0, -0.5), "B": synthetic(0.0, 0.0)}
    found, _ = cc.find_aspects(bodies, include_quincunx=False)
    conj = [a for a in found if a["aspect"] == "conjunction"]
    assert conj and conj[0]["applying"] is True       # 3° apart, closing


# ── element balance: ties are reported, not dictionary-ordered ───────────

def make_weighting_chart(signs_by_planet, asc_sign="Aries", mc_sign="Capricorn"):
    def place(sign):
        return {"sign": sign, "house": 1, "longitude": 0.0, "retrograde": False,
                "degree_in_sign": 0, "minute": 0, "display": f"0°00' {sign}"}
    placements = {name: place(sign) for name, sign in signs_by_planet.items()}
    return {
        "placements": placements,
        "angles": {"Ascendant": place(asc_sign), "Midheaven": place(mc_sign)},
        "asc": 0.0, "mc": 270.0,
    }


def test_element_tie_reported_and_sun_prioritized():
    signs = {"Sun": "Cancer", "Moon": "Scorpio", "Mercury": "Pisces",
             "Venus": "Cancer", "Mars": "Scorpio",
             "Jupiter": "Aries", "Saturn": "Leo", "Uranus": "Sagittarius",
             "Neptune": "Aries", "Pluto": "Leo"}   # 5 water, 5 fire among planets
    chart_data = make_weighting_chart(signs, asc_sign="Gemini", mc_sign="Aquarius")
    weights = cc.weighting(chart_data, aspects=[])
    assert weights["elements"]["water"] == weights["elements"]["fire"] == 5
    assert "dominant_element_tie" in weights
    assert weights["dominant_element"] == "water"   # Sun in Cancer breaks the tie
    assert set(weights["dominant_element_tie"]) == {"water", "fire"}


def test_no_tie_no_tie_field():
    data = chart(*GOLDEN_ARGS, "--zodiac", "tropical")
    weighting = data["tropical"]["weighting"]
    assert "dominant_element_tie" not in weighting
    assert weighting["dominant_element"] == "fire"


# ── vedic mode is a coherent, honest preset ──────────────────────────────

def test_vedic_coerces_and_reports():
    data = chart(*GOLDEN_ARGS, "--zodiac", "tropical", "--house-system", "K", "--vedic")
    inp = data["input"]
    assert inp["zodiac"] == "sidereal"
    assert inp["house_system"] == "W"
    assert inp["vedic"] is True
    coerced = {c["setting"]: c for c in inp["coerced_settings"]}
    assert coerced["zodiac"]["requested"] == "tropical"
    assert coerced["house_system"]["requested"] == "K"
    assert "sidereal_lahiri" in data and "tropical" not in data
    assert "vedic" in data["sidereal_lahiri"]


def test_vedic_clean_request_not_flagged():
    data = chart(*GOLDEN_ARGS, "--zodiac", "sidereal", "--house-system", "W", "--vedic")
    assert "coerced_settings" not in data["input"]


# ── modes and geographies ────────────────────────────────────────────────

def test_dual_mode_produces_both_blocks_and_shifts():
    data = chart(*GOLDEN_ARGS, "--zodiac", "dual")
    assert "tropical" in data and "sidereal_lahiri" in data
    assert isinstance(data["dual_zodiac_sign_shifts"], list)
    for shift in data["dual_zodiac_sign_shifts"]:
        assert {"body", "tropical", "sidereal"} <= set(shift)


def test_southern_hemisphere():
    data = chart("--date", "1990-01-15", "--time", "12:00", "--tz", "Australia/Sydney",
                 "--lat", "-33.87", "--lon", "151.21")
    block = data["tropical"]
    assert len(block["house_cusps"]) == 12
    houses = {p["house"] for p in block["placements"].values()}
    assert houses <= set(range(1, 13))


def test_dst_spring_forward_gap():
    # 02:30 local on 2021-03-14 does not exist in America/New_York; zoneinfo
    # resolves it forward. The chart must still calculate with a sane offset.
    data = chart("--date", "2021-03-14", "--time", "02:30", "--tz", "America/New_York",
                 "--lat", "40.7", "--lon", "-74.0")
    assert data["input"]["utc_offset_applied"] in (-5.0, -4.0)


def test_polar_latitude_behavior_is_explicit():
    # Placidus degenerates inside the polar circles. Whatever the engine does,
    # it must be explicit: either a clean chart or a clean error — never junk.
    result = run_script("--date", "2000-06-21", "--time", "12:00", "--tz", "Europe/Oslo",
                        "--lat", "69.65", "--lon", "18.96")
    if result.returncode == 0:
        data = json.loads(result.stdout)
        assert len(data["tropical"]["house_cusps"]) == 12
    else:
        assert result.stderr.strip(), "failure must say why"


# ── api-level mode rejection (no server needed) ──────────────────────────

def test_api_rejects_incoherent_vedic():
    from fastapi import HTTPException
    api_dir = os.path.join(ROOT)
    sys.path.insert(0, api_dir)
    from api.main import BirthData
    bad = BirthData(date="1983-03-31", time="05:50", tz="America/New_York",
                    lat=41.5, lon=-81.7, zodiac="tropical", vedic=True)
    with pytest.raises(HTTPException):
        bad.validate_mode_coherence()
    also_bad = BirthData(date="1983-03-31", time="05:50", tz="America/New_York",
                         lat=41.5, lon=-81.7, zodiac="sidereal", house_system="P", vedic=True)
    with pytest.raises(HTTPException):
        also_bad.validate_mode_coherence()
    fine = BirthData(date="1983-03-31", time="05:50", tz="America/New_York",
                     lat=41.5, lon=-81.7, zodiac="sidereal", house_system="W", vedic=True)
    fine.validate_mode_coherence()
