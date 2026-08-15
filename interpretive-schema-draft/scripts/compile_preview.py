#!/usr/bin/env python3
"""Build a deterministic, in-memory preview of the proposed bundle channels.

The preview has no output-file option. It exists to test separation and
determinism before any compiler or migration is authorized.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import sys
from pathlib import Path
from typing import Any, Dict, Iterable, List, Set, Tuple


REPO = Path(__file__).resolve().parents[2]
DRAFT = REPO / "interpretive-schema-draft"

SEMANTIC_KINDS = {
    "semantic_rule",
    "house_axis",
    "point",
    "sign",
    "house",
    "aspect",
    "sign_axis",
    "node_axis",
    "mode_overlay",
}
DELIVERY_KINDS = {"delivery_profile"}
CORPUS_KINDS = {"codex_entry", "myth_shape", "myth_entry"}
CONTRACT_KINDS = {"output_contract"}


class PreviewError(RuntimeError):
    pass


def load_json(path: Path) -> Dict[str, Any]:
    try:
        with path.open("r", encoding="utf-8") as handle:
            value = json.load(handle)
    except (OSError, json.JSONDecodeError) as exc:
        raise PreviewError(f"cannot parse {path.relative_to(REPO)}: {exc}") from exc
    if not isinstance(value, dict):
        raise PreviewError(f"{path.relative_to(REPO)} must contain an object")
    return value


def canonical_bytes(value: Dict[str, Any]) -> bytes:
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode("utf-8")


def sort_by_id(items: Iterable[Dict[str, Any]]) -> List[Dict[str, Any]]:
    return sorted(items, key=lambda item: item["id"])


def source_refs(fixtures: Iterable[Dict[str, Any]]) -> List[Dict[str, Any]]:
    refs: Dict[Tuple[Any, ...], Dict[str, Any]] = {}
    for fixture in fixtures:
        candidates = list(fixture.get("provenance", []))
        if fixture.get("content_ref"):
            candidates.append(fixture["content_ref"])
        for ref in candidates:
            key = (
                ref.get("path"),
                ref.get("section"),
                tuple(ref.get("lines", [])),
                ref.get("sha256"),
            )
            refs[key] = ref
    return [refs[key] for key in sorted(refs, key=lambda item: tuple("" if value is None else str(value) for value in item))]


def referenced_ids(fixture: Dict[str, Any]) -> Set[str]:
    refs: Set[str] = set()
    refs.update(fixture.get("semantic_refs", []))
    refs.update(fixture.get("conflicts_with", []))
    refs.update(fixture.get("ends", []))
    shape_ref = fixture.get("shape_ref")
    if isinstance(shape_ref, str):
        refs.add(shape_ref)
    return refs


def compile_preview() -> Dict[str, Any]:
    manifest = load_json(DRAFT / "bundle.draft.json")
    representative = load_json(DRAFT / manifest["fixtures_file"]).get("fixtures", [])
    coverage = load_json(DRAFT / manifest["coverage_fixtures_file"]).get("fixtures", [])
    contradictions = load_json(DRAFT / manifest["contradictions_file"]).get("items", [])
    fixtures = list(representative) + list(coverage)

    if any(fixture.get("status") == "approved" for fixture in fixtures):
        raise PreviewError("an approved fixture cannot enter a noncanonical preview")
    if any(target.get("write_enabled") is not False for target in manifest["artifact_targets"]):
        raise PreviewError("artifact writes must remain disabled")

    known_ids = {fixture["id"] for fixture in fixtures}
    refs = set().union(*(referenced_ids(fixture) for fixture in fixtures))
    unresolved_refs = sorted(refs - known_ids)

    channels = {
        "semantic": sort_by_id(item for item in fixtures if item.get("kind") in SEMANTIC_KINDS),
        "delivery": sort_by_id(item for item in fixtures if item.get("kind") in DELIVERY_KINDS),
        "corpus": sort_by_id(item for item in fixtures if item.get("kind") in CORPUS_KINDS),
        "contracts": sort_by_id(item for item in fixtures if item.get("kind") in CONTRACT_KINDS),
    }
    assigned = sum(len(items) for items in channels.values())
    if assigned != len(fixtures):
        raise PreviewError(f"{len(fixtures) - assigned} fixtures were not assigned to a compile channel")

    return {
        "metadata": {
            "bundle_id": manifest["metadata"]["id"],
            "schema_version": manifest["metadata"]["schema_version"],
            "content_version": manifest["metadata"]["content_version"],
            "status": "preview_only_noncanonical",
            "observed_commit": manifest["metadata"]["observed_commit"],
        },
        "guardrails": manifest["guardrails"],
        "channels": channels,
        "source_refs": source_refs(fixtures),
        "unresolved_references": unresolved_refs,
        "conflicts": [
            {
                "id": item["id"],
                "classification": item["classification"],
                "phase2_disposition": item["phase2_disposition"],
            }
            for item in sort_by_id(contradictions)
        ],
        "artifact_targets": [
            {
                "id": target["id"],
                "path": target["path"],
                "write_enabled": target["write_enabled"],
            }
            for target in sort_by_id(manifest["artifact_targets"])
        ],
    }


def check_preview(preview: Dict[str, Any]) -> str:
    first = canonical_bytes(preview)
    second = canonical_bytes(compile_preview())
    if first != second:
        raise PreviewError("two in-memory compiles produced different bytes")

    expected_counts = {"semantic": 9, "delivery": 1, "corpus": 3, "contracts": 1}
    counts = {name: len(items) for name, items in preview["channels"].items()}
    if counts != expected_counts:
        raise PreviewError(f"compile-channel coverage drift: expected {expected_counts}, got {counts}")
    if len(preview["conflicts"]) != 14:
        raise PreviewError("compile preview must preserve all 14 contradictions")
    if any(target["write_enabled"] for target in preview["artifact_targets"]):
        raise PreviewError("compile preview enabled an artifact write")
    if preview["metadata"]["content_version"] != "unassigned":
        raise PreviewError("compile preview may not assign a content version")

    return hashlib.sha256(first).hexdigest()


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="verify deterministic channel compilation")
    parser.add_argument("--json", action="store_true", help="print the compiled preview JSON to stdout")
    args = parser.parse_args()

    try:
        preview = compile_preview()
        digest = check_preview(preview)
    except PreviewError as exc:
        print(f"FAIL: {exc}", file=sys.stderr)
        return 1

    if args.json:
        print(json.dumps({"sha256": digest, "preview": preview}, ensure_ascii=False, indent=2, sort_keys=True))
        return 0

    counts = {name: len(items) for name, items in preview["channels"].items()}
    print(f"PASS: deterministic in-memory compile {digest}")
    print(
        "PASS: channel separation "
        f"(semantic={counts['semantic']}, delivery={counts['delivery']}, "
        f"corpus={counts['corpus']}, contracts={counts['contracts']})"
    )
    print(f"PASS: {len(preview['conflicts'])} contradictions preserved; artifact writes disabled")
    if preview["unresolved_references"]:
        print("UNRESOLVED: " + ", ".join(preview["unresolved_references"]))
    print("NOT DEMONSTRATED: production artifact generation, semantic approval, or runtime equivalence")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
