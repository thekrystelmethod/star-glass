#!/usr/bin/env python3
"""
Ephemeris service — Phase 1 of the interpretation engine as a web application.

The deterministic core of the astro-interpretation skill, exposed over HTTP.
No LLM anywhere in this service: everything here is a pure function of birth
data, which makes every endpoint fast, cacheable, and free to serve. The
interpretation pipeline (Phase 2) is a *client* of this API, exactly as a web
frontend will be.

Endpoints:
  GET  /health           liveness + ephemeris data check
  POST /chart            birth data → full chart JSON (the API contract)
  POST /wheel            birth data or chart → SVG wheel; themeable, brandable
  POST /tables           birth data or chart → markdown apparatus blocks

White-labeling is first-class: /wheel accepts a `palette` object of design
tokens (ink, paper, element colours, fonts…), so a partner brand is a JSON
payload, not a fork. Headless by design — this service returns data and
vector graphics; it renders no pages.

Run:  uvicorn api.main:app --host 0.0.0.0 --port 8000
"""

import hashlib
import json
import os
import subprocess
import sys
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse, PlainTextResponse, Response
from pydantic import BaseModel, Field

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCRIPTS = os.path.join(ROOT, "scripts")
sys.path.insert(0, SCRIPTS)

app = FastAPI(
    title="Interpretation Engine — Ephemeris Service",
    version="0.1.0",
    description="Deterministic chart mathematics, wheels, and tables. "
                "Swiss Ephemeris under the hood; no interpretation here.",
)

# ---------------------------------------------------------------- models

class BirthData(BaseModel):
    date: str = Field(..., description="YYYY-MM-DD", examples=["1983-03-31"])
    time: str = Field(..., description="HH:MM local, 24h", examples=["05:50"])
    tz: str = Field(..., description="IANA timezone", examples=["America/New_York"])
    lat: float = Field(..., ge=-90, le=90)
    lon: float = Field(..., ge=-180, le=180, description="east +, west −")
    zodiac: str = Field("tropical", pattern="^(tropical|sidereal|dual)$")
    house_system: str = Field("P", pattern="^[PWKECRO]$")
    orbs: str = Field("standard", pattern="^(tight|standard|wide)$")
    quincunx: bool = False
    minor_aspects: bool = False
    vedic: bool = False


class ThemeSpec(BaseModel):
    name: str
    bodies: list[str]
    color: Optional[str] = None


class WheelRequest(BaseModel):
    birth: Optional[BirthData] = None
    chart: Optional[dict] = Field(None, description="a prior /chart response, "
                                  "to skip recomputation")
    zodiac_block: Optional[str] = Field(None, pattern="^(tropical|sidereal)$")
    size: int = Field(1100, ge=300, le=4000)
    title: Optional[str] = None
    subtitle: Optional[str] = None
    highlight: Optional[list[str]] = None
    themes: Optional[list[ThemeSpec]] = None
    palette: Optional[dict] = Field(None, description="white-label design tokens")


class TablesRequest(BaseModel):
    birth: Optional[BirthData] = None
    chart: Optional[dict] = None
    zodiac_block: Optional[str] = Field(None, pattern="^(tropical|sidereal)$")
    sections: list[str] = Field(
        default=["birth", "positions", "angles", "aspects", "distribution",
                 "signature"],
        description="any of: birth, positions, angles, aspects, distribution, "
                    "signature, vedic")


# ---------------------------------------------------------------- helpers

_CACHE: dict[str, dict] = {}          # chart JSON is a pure function of inputs
_CACHE_MAX = 512


def calculate(b: BirthData) -> dict:
    key = hashlib.sha256(b.model_dump_json().encode()).hexdigest()
    if key in _CACHE:
        return _CACHE[key]
    cmd = [sys.executable, os.path.join(SCRIPTS, "calculate_chart.py"),
           "--date", b.date, "--time", b.time, "--tz", b.tz,
           "--lat", str(b.lat), "--lon", str(b.lon),
           "--zodiac", b.zodiac, "--house-system", b.house_system,
           "--orbs", b.orbs]
    if b.quincunx:
        cmd.append("--quincunx")
    if b.minor_aspects:
        cmd.append("--minor-aspects")
    if b.vedic:
        cmd.append("--vedic")
    r = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
    if r.returncode != 0:
        raise HTTPException(422, detail=f"calculation failed: {r.stderr[-500:]}")
    chart = json.loads(r.stdout)
    if len(_CACHE) >= _CACHE_MAX:
        _CACHE.pop(next(iter(_CACHE)))
    _CACHE[key] = chart
    return chart


def resolve_chart(birth, chart) -> dict:
    if chart is not None:
        return chart
    if birth is not None:
        return calculate(birth)
    raise HTTPException(422, detail="provide either `birth` or `chart`")


def pick_block(data: dict, requested: Optional[str]) -> dict:
    key = {"tropical": "tropical", "sidereal": "sidereal_lahiri"}.get(
        requested or ("tropical" if "tropical" in data else "sidereal"))
    if key not in data:
        raise HTTPException(422, detail=f"chart has no '{key}' block; "
                            f"present: {[k for k in data if k != 'input']}")
    return data[key]


# ---------------------------------------------------------------- endpoints

@app.get("/health")
def health():
    ephe = os.path.join(SCRIPTS, "ephe", "seas_18.se1")
    return {"ok": True, "chiron_ephemeris": os.path.exists(ephe),
            "cache_entries": len(_CACHE)}


@app.post("/chart")
def chart(b: BirthData):
    return JSONResponse(calculate(b))


@app.post("/wheel", responses={200: {"content": {"image/svg+xml": {}}}})
def wheel(req: WheelRequest):
    import draw_chart as dc
    data = resolve_chart(req.birth, req.chart)
    block = pick_block(data, req.zodiac_block)
    dc.apply_palette(req.palette)          # None → defaults; dict → brand tokens
    try:
        svg = dc.build(block, size=req.size, title=req.title,
                       subtitle=req.subtitle, highlight=req.highlight,
                       themes=[t.model_dump() for t in req.themes] if req.themes else None)
    finally:
        dc.apply_palette(None)             # never leak a brand into the next call
    return Response(content=svg, media_type="image/svg+xml")


@app.post("/tables", response_class=PlainTextResponse)
def tables(req: TablesRequest):
    import chart_tables as ct
    data = resolve_chart(req.birth, req.chart)
    block = pick_block(data, req.zodiac_block)
    vedic = "vedic" in block
    fns = {
        "birth": lambda: ct.birth_block(data["input"]),
        "positions": lambda: ct.positions(block, vedic),
        "angles": lambda: ct.angles(block, vedic),
        "aspects": lambda: ct.aspects(block),
        "distribution": lambda: ct.distribution(block),
        "signature": lambda: ct.signature(block),
        "vedic": lambda: ct.vedic_block(block),
    }
    out = []
    for s in req.sections:
        if s not in fns:
            raise HTTPException(422, detail=f"unknown section '{s}'")
        body = fns[s]()
        if body.strip():
            out.append(body)
    return "\n\n".join(out)
