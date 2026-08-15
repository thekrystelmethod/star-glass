#!/usr/bin/env python3
"""Read-only validator for the noncanonical Phase 2 schema experiment.

This script intentionally has no write path and no third-party dependencies.
It validates the draft's guardrails and representative interfaces, then checks
the existing Codex and myth-bank observations without changing either source.
"""

from __future__ import annotations

import hashlib
import json
import re
import subprocess
import sys
from collections import Counter
from pathlib import Path
from typing import Any, Dict, Iterable, List, Set


REPO = Path(__file__).resolve().parents[2]
DRAFT = REPO / "interpretive-schema-draft"
CODEX_SOURCE = REPO / "starglass-codex-v1" / "codex"
CODEX_DEPLOYED = REPO / "web" / "public" / "codex"


class ValidationError(RuntimeError):
    pass


def require(condition: bool, message: str) -> None:
    if not condition:
        raise ValidationError(message)


def load_json(path: Path) -> Dict[str, Any]:
    try:
        with path.open("r", encoding="utf-8") as handle:
            value = json.load(handle)
    except (OSError, json.JSONDecodeError) as exc:
        raise ValidationError(f"cannot parse {path.relative_to(REPO)}: {exc}") from exc
    require(isinstance(value, dict), f"{path.relative_to(REPO)} must contain a JSON object")
    return value


def unique_ids(items: Iterable[Dict[str, Any]], label: str) -> None:
    ids = [item.get("id") for item in items]
    require(all(isinstance(item_id, str) and item_id for item_id in ids), f"{label} contains a missing id")
    duplicates = sorted(item_id for item_id, count in Counter(ids).items() if count > 1)
    require(not duplicates, f"{label} contains duplicate ids: {duplicates}")


def validate_source_ref(ref: Dict[str, Any], label: str) -> None:
    require(isinstance(ref, dict), f"{label} provenance must be an object")
    path_text = ref.get("path")
    require(isinstance(path_text, str) and path_text, f"{label} provenance requires path")
    path = REPO / path_text
    require(path.exists(), f"{label} provenance path does not exist: {path_text}")

    lines = ref.get("lines")
    if lines is not None:
        require(
            isinstance(lines, list)
            and len(lines) == 2
            and all(isinstance(value, int) and value > 0 for value in lines)
            and lines[0] <= lines[1],
            f"{label} has invalid line range: {lines}",
        )
        if path.is_file():
            line_count = len(path.read_text(encoding="utf-8").splitlines())
            require(lines[1] <= line_count, f"{label} line range exceeds {path_text} ({line_count} lines)")

    expected_hash = ref.get("sha256")
    if expected_hash is not None:
        require(path.is_file(), f"{label} cannot hash non-file path {path_text}")
        actual_hash = hashlib.sha256(path.read_bytes()).hexdigest()
        require(actual_hash == expected_hash, f"{label} content hash drift: expected {expected_hash}, got {actual_hash}")


def validate_manifest() -> Dict[str, Any]:
    schema = load_json(DRAFT / "schema" / "interpretive-bundle.schema.json")
    manifest = load_json(DRAFT / "bundle.draft.json")

    require(schema.get("$schema") == "https://json-schema.org/draft/2020-12/schema", "schema must declare JSON Schema 2020-12")
    definitions = schema.get("$defs", {})
    for required in (
        "semanticRule",
        "houseAxis",
        "legacyCorpusEntry",
        "deliveryProfile",
        "fixture",
        "fixtureDocument",
        "pointEntity",
        "signEntity",
        "houseEntity",
        "aspectEntity",
        "signAxis",
        "nodeAxis",
        "modeOverlay",
        "mythShape",
        "mythEntry",
        "outputContract",
        "coverageFixture",
        "coverageFixtureDocument",
        "contradiction",
        "contradictionDocument",
    ):
        require(required in definitions, f"schema is missing core interface {required}")

    metadata = manifest.get("metadata", {})
    require(metadata.get("status") == "draft_noncanonical", "manifest must remain draft_noncanonical")
    require(metadata.get("content_version") == "unassigned", "draft must not claim a content version")

    guardrails = manifest.get("guardrails", {})
    expected_guardrails = {
        "runtime_cutover": False,
        "canonical_declaration": False,
        "source_deletion": False,
        "migration_started": False,
        "validator_writes_files": False,
    }
    require(guardrails == expected_guardrails, f"guardrails changed: {guardrails}")

    current_commit = subprocess.run(
        ["git", "rev-parse", "HEAD"],
        cwd=str(REPO),
        check=True,
        capture_output=True,
        text=True,
    ).stdout.strip()
    require(
        metadata.get("observed_commit") == current_commit,
        "observed checkout has moved; refresh evidence before treating this draft as current",
    )

    source_groups = manifest.get("source_groups", [])
    ownership_rules = manifest.get("ownership_rules", [])
    artifact_targets = manifest.get("artifact_targets", [])
    require(isinstance(source_groups, list) and source_groups, "manifest requires source_groups")
    require(isinstance(ownership_rules, list) and ownership_rules, "manifest requires ownership_rules")
    require(isinstance(artifact_targets, list) and artifact_targets, "manifest requires artifact_targets")
    unique_ids(source_groups, "source_groups")
    unique_ids(ownership_rules, "ownership_rules")
    unique_ids(artifact_targets, "artifact_targets")
    require(all(item.get("status") == "proposed" for item in ownership_rules), "ownership rules must remain proposed")
    require(all(item.get("write_enabled") is False for item in artifact_targets), "artifact writes must remain disabled")

    for relative in (
        manifest.get("fixtures_file"),
        manifest.get("coverage_fixtures_file"),
        manifest.get("contradictions_file"),
    ):
        require(isinstance(relative, str) and (DRAFT / relative).is_file(), f"missing declared draft file: {relative}")

    return manifest


def validate_fixtures() -> None:
    manifest = load_json(DRAFT / "bundle.draft.json")
    document = load_json(DRAFT / "fixtures" / "representative-fixtures.json")
    require(document.get("status") == "draft_noncanonical", "fixture document must remain draft_noncanonical")
    fixtures = document.get("fixtures")
    expected = manifest["validation"]["expected_representative_fixtures"]
    require(isinstance(fixtures, list) and len(fixtures) == expected, f"expected exactly {expected} representative fixtures")
    unique_ids(fixtures, "fixtures")

    expected_kinds = {"semantic_rule", "house_axis", "codex_entry", "delivery_profile"}
    require({fixture.get("kind") for fixture in fixtures} == expected_kinds, "fixture kinds do not match the approved experiment")

    for fixture in fixtures:
        fixture_id = fixture["id"]
        require(fixture.get("status") != "approved", f"{fixture_id} may not be approved in this experiment")
        provenance = fixture.get("provenance", [])
        if fixture.get("kind") == "codex_entry":
            provenance = [fixture.get("content_ref")]
            require(fixture.get("review", {}).get("preserve_text") is True, f"{fixture_id} must preserve legacy text")
            require(fixture.get("deployment", {}).get("generated") is False, f"{fixture_id} must not claim generated status")
        require(isinstance(provenance, list) and provenance, f"{fixture_id} requires provenance")
        for index, ref in enumerate(provenance):
            validate_source_ref(ref, f"{fixture_id}.provenance[{index}]")

    shadow = next(item for item in fixtures if item["id"] == "rule.shadow.derive_from_blocked_light")
    require("stock_shadow_from_sign_alone" in shadow.get("forbids", []), "shadow fixture must preserve the stock-shadow prohibition")

    axis = next(item for item in fixtures if item["id"] == "house_axis.1_7")
    require(axis.get("lower", {}).get("house") == 1 and axis.get("upper", {}).get("house") == 7, "house-axis fixture coordinates drifted")
    require(axis.get("relationship", {}).get("gating_model") == "impedance_not_gate", "house-axis fixture must not become a gate")


def validate_coverage_fixtures() -> None:
    manifest = load_json(DRAFT / "bundle.draft.json")
    contradictions = load_json(DRAFT / "contradictions.draft.json")
    contradiction_ids = {item["id"] for item in contradictions.get("items", [])}
    document = load_json(DRAFT / "fixtures" / "coverage-fixtures.json")
    require(document.get("status") == "draft_noncanonical", "coverage fixture document must remain draft_noncanonical")
    fixtures = document.get("fixtures")
    expected = manifest["validation"]["expected_coverage_fixtures"]
    require(isinstance(fixtures, list) and len(fixtures) == expected, f"expected exactly {expected} coverage fixtures")
    unique_ids(fixtures, "coverage fixtures")

    expected_kinds = {
        "point",
        "sign",
        "house",
        "aspect",
        "sign_axis",
        "node_axis",
        "mode_overlay",
        "myth_shape",
        "myth_entry",
        "output_contract",
    }
    require({fixture.get("kind") for fixture in fixtures} == expected_kinds, "coverage fixtures do not span every required interface")
    require(not any(fixture.get("status") == "approved" for fixture in fixtures), "coverage fixtures may not be approved")

    for fixture in fixtures:
        provenance = fixture.get("provenance")
        require(isinstance(provenance, list) and provenance, f"{fixture['id']} requires provenance")
        for index, ref in enumerate(provenance):
            validate_source_ref(ref, f"{fixture['id']}.provenance[{index}]")

    point = next(item for item in fixtures if item["kind"] == "point")
    for assertion in point.get("legacy_assertions", []):
        require(assertion.get("conflict") in contradiction_ids, f"{point['id']} references unknown conflict")

    sign_axis = next(item for item in fixtures if item["kind"] == "sign_axis")
    require(len(sign_axis.get("ends", [])) == 2, "sign axis requires two ends")
    require(sign_axis.get("shared_core", {}).get("delivery_visibility") == "backstage_only", "axis core must remain backstage")

    node_axis = next(item for item in fixtures if item["kind"] == "node_axis")
    require(node_axis.get("south", {}).get("id") == "south_node", "node axis must expose South Node")
    require(node_axis.get("north", {}).get("id") == "north_node", "node axis must expose North Node")
    require(node_axis.get("shadow_location") == "refusal_to_cross", "node-axis shadow location drifted")

    mode = next(item for item in fixtures if item["kind"] == "mode_overlay")
    require(mode.get("ruler_overrides") == {"scorpio": "mars", "aquarius": "saturn", "pisces": "jupiter"}, "Vedic ruler override fixture drifted")

    fixture_ids = {item["id"] for item in fixtures}
    myth = next(item for item in fixtures if item["kind"] == "myth_entry")
    require(myth.get("shape_ref") in fixture_ids, "myth fixture references an absent shape")

    contract = next(item for item in fixtures if item["kind"] == "output_contract")
    require(len(contract.get("movement_order", [])) == 6, "web portrait contract requires six movements")
    require(contract.get("cardinality", {}).get("movements") == 6, "web portrait movement cardinality drifted")


def validate_contradictions() -> None:
    document = load_json(DRAFT / "contradictions.draft.json")
    require(document.get("status") == "draft_noncanonical", "contradiction ledger must remain draft_noncanonical")
    items = document.get("items")
    require(isinstance(items, list) and len(items) == 14, "contradiction ledger must contain C1-C14")
    unique_ids(items, "contradictions")
    require({item["id"] for item in items} == {f"C{number}" for number in range(1, 15)}, "contradiction ids must be exactly C1-C14")
    allowed = {"CONFIRMED", "INFERRED", "PROPOSED", "NOT_DEMONSTRATED", "UNRESOLVED"}
    require(all(item.get("classification") in allowed for item in items), "contradiction ledger contains an invalid classification")
    require(all(item.get("phase2_disposition") for item in items), "every contradiction requires a visible disposition")
    require(not any(item.get("phase2_disposition") == "resolved" for item in items), "Phase 2 may not silently resolve contradictions")


def codex_entries() -> List[Dict[str, Any]]:
    entries: List[Dict[str, Any]] = []
    excluded = {"index.json", "canon.json", "houses.json", "risings.json"}
    for path in sorted(CODEX_SOURCE.glob("*.json")):
        if path.name in excluded:
            continue
        point_file = load_json(path)
        point = point_file.get("point")
        for key, entry in point_file.get("in_sign", {}).items():
            entries.append(dict(entry, _kind="point_sign", _point=point, _key=key))
        for key, entry in point_file.get("in_house", {}).items():
            entries.append(dict(entry, _kind="point_house", _point=point, _key=key))

    for key, entry in load_json(CODEX_SOURCE / "risings.json").get("risings", {}).items():
        entries.append(dict(entry, _kind="rising", _key=key))
    for key, entry in load_json(CODEX_SOURCE / "houses.json").get("houses", {}).items():
        entries.append(dict(entry, _kind="house", _key=key))
    return entries


def validate_codex(manifest: Dict[str, Any]) -> Dict[str, int]:
    expected = manifest["validation"]
    source_files = sorted(path.name for path in CODEX_SOURCE.glob("*.json"))
    deployed_files = sorted(path.name for path in CODEX_DEPLOYED.glob("*.json"))
    require(source_files == deployed_files, "Codex trees contain different file sets")
    for name in source_files:
        require(
            (CODEX_SOURCE / name).read_bytes() == (CODEX_DEPLOYED / name).read_bytes(),
            f"Codex copy drift: {name}",
        )

    entries = codex_entries()
    require(len(entries) == expected["expected_codex_entries"], f"expected 312 Codex entries, got {len(entries)}")
    unique_ids(entries, "Codex entries")

    titles = [entry.get("title") for entry in entries]
    require(all(isinstance(title, str) and title for title in titles), "Codex entry missing title")
    require(len(set(titles)) == len(titles), "Codex titles are not unique")

    required_entry_keys = {"id", "title", "body", "invitation", "edges"}
    for entry in entries:
        missing = required_entry_keys - set(entry)
        require(not missing, f"{entry.get('id')} missing keys {sorted(missing)}")
        require(isinstance(entry["body"], list) and len(entry["body"]) in (2, 3), f"{entry['id']} has invalid paragraph count")

    canon = load_json(CODEX_SOURCE / "canon.json")
    targets: Set[str] = {entry["id"] for entry in entries}
    for group in ("points", "signs", "aspects"):
        targets.update(f"canon:{key}" for key in canon.get(group, {}))

    see_also_edges = 0
    coordinate_edges = 0
    for entry in entries:
        edges = entry["edges"]
        see_also = edges.get("see_also", [])
        see_also_edges += len(see_also)
        broken = [target for target in see_also if target not in targets]
        require(not broken, f"{entry['id']} has broken see_also targets {broken}")
        coordinate_edges += sum(key in edges for key in ("point", "sign", "house"))

        kind = entry["_kind"]
        if kind == "point_sign":
            require(entry["id"] == f"{entry['_point']}_in_{entry['_key']}", f"coordinate mismatch for {entry['id']}")
            require(edges.get("point") == entry["_point"] and edges.get("sign") == entry["_key"], f"edge mismatch for {entry['id']}")
        elif kind == "point_house":
            require(entry["id"] == f"{entry['_point']}_in_house_{entry['_key']}", f"coordinate mismatch for {entry['id']}")
            require(edges.get("point") == entry["_point"] and int(edges.get("house", -1)) == int(entry["_key"]), f"edge mismatch for {entry['id']}")
        elif kind == "rising":
            require(entry["id"] == f"{entry['_key']}_rising" and edges.get("sign") == entry["_key"], f"coordinate mismatch for {entry['id']}")
        elif kind == "house":
            require(entry["id"] == f"house_{entry['_key']}" and int(edges.get("house", -1)) == int(entry["_key"]), f"coordinate mismatch for {entry['id']}")

    require(see_also_edges == expected["expected_see_also_edges"], f"expected 612 see_also edges, got {see_also_edges}")
    require(coordinate_edges == expected["expected_coordinate_edges"], f"expected 600 coordinate edges, got {coordinate_edges}")
    return {"entries": len(entries), "see_also_edges": see_also_edges, "coordinate_edges": coordinate_edges}


def validate_myth_bank(manifest: Dict[str, Any]) -> Dict[str, int]:
    source = (REPO / "web" / "netlify" / "functions" / "myth-bank.ts").read_text(encoding="utf-8")
    require("export const MYTH_SHAPES" in source and "export const MYTHS" in source, "myth-bank exports are missing")
    shapes_block = source.split("export const MYTH_SHAPES", 1)[1].split("export const MYTHS", 1)[0]
    myths_block = source.split("export const MYTHS", 1)[1].split("const BY_ID", 1)[0]
    shape_count = len(re.findall(r"\{ id:", shapes_block))
    myth_count = len(re.findall(r"\{ id:", myths_block))
    expected = manifest["validation"]
    require(shape_count == expected["expected_myth_shapes"], f"expected 42 myth shapes, got {shape_count}")
    require(myth_count == expected["expected_myths"], f"expected 184 myths, got {myth_count}")
    require(not (REPO / "spec" / "myth-index.json").exists(), "missing-source contradiction C12 changed; refresh the ledger")
    return {"myth_shapes": shape_count, "myths": myth_count}


def validate_runtime_isolation() -> None:
    needle = "interpretive-schema-draft"
    roots = [REPO / "web", REPO / "api", REPO / "scripts"]
    files = [REPO / "SKILL.md"]
    for root in roots:
        files.extend(path for path in root.rglob("*") if path.is_file() and "node_modules" not in path.parts)
    linked = []
    for path in files:
        try:
            if needle in path.read_text(encoding="utf-8"):
                linked.append(str(path.relative_to(REPO)))
        except UnicodeDecodeError:
            continue
    require(not linked, f"draft is referenced by runtime or skill files: {linked}")


def main() -> int:
    try:
        manifest = validate_manifest()
        validate_fixtures()
        validate_coverage_fixtures()
        validate_contradictions()
        codex = validate_codex(manifest)
        myths = validate_myth_bank(manifest)
        validate_runtime_isolation()
    except (ValidationError, subprocess.CalledProcessError) as exc:
        print(f"FAIL: {exc}", file=sys.stderr)
        return 1

    print("PASS: noncanonical guardrails preserved")
    print("PASS: 4 representative fixtures, 10 coverage fixtures, and 14 contradictions validated")
    print(
        "PASS: Codex baseline "
        f"({codex['entries']} entries, {codex['see_also_edges']} see_also edges, "
        f"{codex['coordinate_edges']} coordinate edges, byte-identical trees)"
    )
    print(f"PASS: myth-bank observation ({myths['myth_shapes']} shapes, {myths['myths']} myths)")
    print("PASS: no runtime or skill references to the draft")
    print("NOT DEMONSTRATED: semantic approval, runtime readiness, production-compiler reproducibility, or migration safety")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
