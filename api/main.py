#!/usr/bin/env python3
"""
Ephemeris service — Phase 1 of the interpretation engine as a web application.

The deterministic core of the astro-interpretation skill, exposed over HTTP.
No LLM anywhere in this service: everything here is a pure function of birth
data, which makes every endpoint fast, cacheable, and free to serve. The
Star Glass server is the authenticated client of this API; browsers use its
same-origin proxy and never receive this service's credential.

Endpoints:
  GET  /health           minimal public liveness signal
  POST /chart            birth data → full chart JSON (the API contract)
  POST /wheel            birth data or chart → SVG wheel; themeable, brandable
  POST /tables           birth data or chart → markdown apparatus blocks

White-labeling is first-class: /wheel accepts a `palette` object of design
tokens (ink, paper, element colours, fonts…), so a partner brand is a JSON
payload, not a fork. Headless by design — this service returns data and
vector graphics; it renders no pages.

Run:  uvicorn api.main:app --host 0.0.0.0 --port 8000
"""

import asyncio
import hashlib
import hmac
import json
import os
import subprocess
import sys
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse, PlainTextResponse, Response
from pydantic import BaseModel, ConfigDict, Field

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCRIPTS = os.path.join(ROOT, "scripts")
sys.path.insert(0, SCRIPTS)

app = FastAPI(
    title="Interpretation Engine — Ephemeris Service",
    version="0.1.0",
    description="Deterministic chart mathematics, wheels, and tables. "
                "Swiss Ephemeris under the hood; no interpretation here.",
    docs_url=None,
    redoc_url=None,
    openapi_url=None,
)

# The browser never calls this service directly. Star Glass's same-origin
# Netlify proxy owns the only bearer credential; Render stores only its
# SHA-256 verifier. Publishing the verifier is safe because the bearer token
# has 256 bits of entropy and cannot feasibly be recovered from the digest.
DEFAULT_ENGINE_TOKEN_SHA256 = "f04e05466c3e32a547915a2c5a90f22efc742d4f4513369e9dcd5cdde2b5f615"
PROTECTED_PATHS = frozenset({"/chart", "/wheel", "/tables"})
MAX_REQUEST_BYTES = 512 * 1024


class RequestTooLarge(Exception):
    pass


def _bounded_concurrency() -> int:
    try:
        requested = int(os.environ.get("STARGLASS_ENGINE_MAX_CONCURRENCY", "4"))
    except ValueError:
        requested = 4
    return min(16, max(1, requested))


def _engine_token_digests() -> tuple[str, ...]:
    """Return one or more verifiers so credentials can rotate without downtime."""
    configured = os.environ.get("STARGLASS_ENGINE_TOKEN_SHA256", DEFAULT_ENGINE_TOKEN_SHA256)
    return tuple(part.strip().lower() for part in configured.split(",") if part.strip())


def _json_error(status: int, detail: str, extra_headers=None) -> JSONResponse:
    headers = {"cache-control": "no-store", "x-content-type-options": "nosniff"}
    if extra_headers:
        headers.update(extra_headers)
    return JSONResponse({"detail": detail}, status_code=status, headers=headers)


class EngineBoundaryMiddleware:
    """Authenticate and bound expensive requests before FastAPI parses them."""

    def __init__(self, inner_app):
        self.app = inner_app
        self.slots = asyncio.Semaphore(_bounded_concurrency())

    async def __call__(self, scope, receive, send):
        if scope.get("type") != "http" or scope.get("path") not in PROTECTED_PATHS:
            await self.app(scope, receive, send)
            return

        if scope.get("method") != "POST":
            await _json_error(405, "Method not allowed.", {"allow": "POST"})(scope, receive, send)
            return

        headers = {name.lower(): value for name, value in scope.get("headers", [])}
        expected_digests = _engine_token_digests()
        authorization = headers.get(b"authorization", b"").decode("utf-8", "ignore")
        scheme, separator, credential = authorization.partition(" ")
        provided = credential if separator and scheme.lower() == "bearer" else ""
        provided_digest = hashlib.sha256(provided.encode("utf-8")).hexdigest()
        valid_configuration = bool(expected_digests) and all(
            len(expected_digest) == 64
            and all(character in "0123456789abcdef" for character in expected_digest)
            for expected_digest in expected_digests
        )
        if not valid_configuration:
            await _json_error(503, "Engine access is not configured.")(scope, receive, send)
            return
        authorized = False
        for expected_digest in expected_digests:
            authorized |= hmac.compare_digest(provided_digest, expected_digest)
        if not provided or not authorized:
            await _json_error(401, "Unauthorized.")(scope, receive, send)
            return

        content_type = headers.get(b"content-type", b"").decode("ascii", "ignore").split(";", 1)[0].strip().lower()
        if content_type != "application/json":
            await _json_error(415, "Content-Type must be application/json.")(scope, receive, send)
            return

        raw_length = headers.get(b"content-length", b"").decode("ascii", "ignore")
        if raw_length:
            try:
                content_length = int(raw_length)
            except ValueError:
                await _json_error(400, "Invalid Content-Length.")(scope, receive, send)
                return
            if content_length < 0:
                await _json_error(400, "Invalid Content-Length.")(scope, receive, send)
                return
            if content_length > MAX_REQUEST_BYTES:
                await _json_error(413, "Request body is too large.")(scope, receive, send)
                return

        try:
            await asyncio.wait_for(self.slots.acquire(), timeout=0.05)
        except asyncio.TimeoutError:
            await _json_error(503, "The calculation engine is busy.", {"retry-after": "2"})(scope, receive, send)
            return

        received = 0
        response_started = False

        async def limited_receive():
            nonlocal received
            message = await receive()
            if message.get("type") == "http.request":
                received += len(message.get("body", b""))
                if received > MAX_REQUEST_BYTES:
                    raise RequestTooLarge()
            return message

        async def tracked_send(message):
            nonlocal response_started
            if message.get("type") == "http.response.start":
                response_started = True
                response_headers = list(message.get("headers", []))
                response_headers.extend([
                    (b"cache-control", b"no-store"),
                    (b"x-content-type-options", b"nosniff"),
                ])
                message = {**message, "headers": response_headers}
            await send(message)

        try:
            await self.app(scope, limited_receive, tracked_send)
        except RequestTooLarge:
            if response_started:
                raise
            await _json_error(413, "Request body is too large.")(scope, receive, send)
        finally:
            self.slots.release()


app.add_middleware(EngineBoundaryMiddleware)

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

    def validate_mode_coherence(self):
        """Jyotish mode is a coherent preset (sidereal + whole-sign). The API
        rejects contradictory combinations outright rather than silently
        recalculating under different settings than the caller asked for."""
        if self.vedic and self.zodiac != "sidereal":
            raise HTTPException(422, detail="vedic mode requires zodiac='sidereal' "
                                "(Jyotish is a sidereal method; send zodiac='sidereal' or disable vedic)")
        if self.vedic and self.house_system != "W":
            raise HTTPException(422, detail="vedic mode requires house_system='W' "
                                "(Jyotish uses whole-sign houses; send house_system='W' or disable vedic)")


class ThemeSpec(BaseModel):
    model_config = ConfigDict(extra="forbid")
    name: str = Field(..., min_length=1, max_length=80)
    bodies: list[str] = Field(..., min_length=1, max_length=20)
    color: Optional[str] = Field(None, pattern="^#[0-9a-fA-F]{6}$")


class ElementPalette(BaseModel):
    model_config = ConfigDict(extra="forbid")
    fire: Optional[str] = Field(None, pattern="^#[0-9a-fA-F]{6}$")
    earth: Optional[str] = Field(None, pattern="^#[0-9a-fA-F]{6}$")
    air: Optional[str] = Field(None, pattern="^#[0-9a-fA-F]{6}$")
    water: Optional[str] = Field(None, pattern="^#[0-9a-fA-F]{6}$")


class AspectPalette(BaseModel):
    model_config = ConfigDict(extra="forbid")
    conjunction: Optional[str] = Field(None, pattern="^#[0-9a-fA-F]{6}$")
    opposition: Optional[str] = Field(None, pattern="^#[0-9a-fA-F]{6}$")
    square: Optional[str] = Field(None, pattern="^#[0-9a-fA-F]{6}$")
    trine: Optional[str] = Field(None, pattern="^#[0-9a-fA-F]{6}$")
    sextile: Optional[str] = Field(None, pattern="^#[0-9a-fA-F]{6}$")
    quincunx: Optional[str] = Field(None, pattern="^#[0-9a-fA-F]{6}$")
    semisextile: Optional[str] = Field(None, pattern="^#[0-9a-fA-F]{6}$")
    semisquare: Optional[str] = Field(None, pattern="^#[0-9a-fA-F]{6}$")
    sesquiquadrate: Optional[str] = Field(None, pattern="^#[0-9a-fA-F]{6}$")


class WheelPalette(BaseModel):
    model_config = ConfigDict(extra="forbid")
    ink: Optional[str] = Field(None, pattern="^#[0-9a-fA-F]{6}$")
    paper: Optional[str] = Field(None, pattern="^#[0-9a-fA-F]{6}$")
    faint: Optional[str] = Field(None, pattern="^#[0-9a-fA-F]{6}$")
    mid: Optional[str] = Field(None, pattern="^#[0-9a-fA-F]{6}$")
    element: Optional[ElementPalette] = None
    aspect: Optional[AspectPalette] = None
    theme_palette: Optional[list[str]] = Field(None, min_length=1, max_length=12)


class WheelRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    birth: Optional[BirthData] = None
    chart: Optional[dict] = Field(None, description="a prior /chart response, "
                                  "to skip recomputation")
    zodiac_block: Optional[str] = Field(None, pattern="^(tropical|sidereal)$")
    size: int = Field(1100, ge=300, le=4000)
    title: Optional[str] = Field(None, max_length=120)
    subtitle: Optional[str] = Field(None, max_length=240)
    highlight: Optional[list[str]] = Field(None, max_length=20)
    themes: Optional[list[ThemeSpec]] = Field(None, max_length=12)
    palette: Optional[WheelPalette] = Field(None, description="white-label color tokens")
    transparent: bool = Field(False, description="omit the full-bleed paper "
                              "background so the wheel floats over an app "
                              "background; glyph halos and the caption plate "
                              "keep their paper fill for legibility")


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
    b.validate_mode_coherence()
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
    try:
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=45)
    except subprocess.TimeoutExpired as reason:
        raise HTTPException(504, detail="calculation timed out") from reason
    if r.returncode != 0:
        raise HTTPException(422, detail="calculation could not be completed")
    try:
        chart = json.loads(r.stdout)
    except json.JSONDecodeError as reason:
        raise HTTPException(502, detail="calculation returned an invalid result") from reason
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
    return {"ok": True}


@app.post("/chart")
def chart(b: BirthData):
    return JSONResponse(calculate(b))


@app.post("/wheel", responses={200: {"content": {"image/svg+xml": {}}}})
def wheel(req: WheelRequest):
    import draw_chart as dc
    data = resolve_chart(req.birth, req.chart)
    block = pick_block(data, req.zodiac_block)
    try:
        svg = dc.build(block, size=req.size, title=req.title,
                       subtitle=req.subtitle, highlight=req.highlight,
                       themes=[t.model_dump() for t in req.themes] if req.themes else None,
                       background=not req.transparent,
                       palette=req.palette.model_dump(exclude_none=True) if req.palette else None)
    except ValueError as reason:
        raise HTTPException(422, detail=str(reason)) from reason
    return Response(
        content=svg,
        media_type="image/svg+xml",
        headers={
            "content-security-policy": "default-src 'none'",
            "x-content-type-options": "nosniff",
            "cache-control": "no-store",
        },
    )


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
