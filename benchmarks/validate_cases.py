"""Check benchmark data/oracles offline. Does not call a model or score a UI."""

import hashlib
import json
from pathlib import Path
import sys


def select(records, query):
    supported = {"bedrooms_eq", "neighborhood_eq", "rent_lt", "sort", "offset", "limit"}
    if set(query) - supported or query.get("sort") != "rent_asc":
        raise ValueError(f"Unsupported selection: {query}")
    matches = [
        row for row in records
        if ("bedrooms_eq" not in query or row["bedrooms"] == query["bedrooms_eq"])
        and ("neighborhood_eq" not in query or row["neighborhood"] == query["neighborhood_eq"])
        and ("rent_lt" not in query or row["rent"] < query["rent_lt"])
    ]
    ordered = [row["id"] for row in sorted(matches, key=lambda row: (row["rent"], row["id"]))]
    offset = query.get("offset", 0)
    limit = query.get("limit", len(ordered))
    if type(offset) is not int or type(limit) is not int or min(offset, limit) < 0:
        raise ValueError("Selection offset/limit must be nonnegative integers")
    return ordered[offset:offset + limit]


def validate(folder, manifest="cases.json"):
    cases = json.loads((folder / manifest).read_text())
    dataset_path = folder / cases["dataset"]
    actual_hash = hashlib.sha256(dataset_path.read_bytes()).hexdigest()
    if actual_hash != cases["dataset_sha256"]:
        raise ValueError("Dataset changed without updating the case manifest hash")
    records = json.loads(dataset_path.read_text())["records"]
    by_id = {row["id"]: row for row in records}
    if len(by_id) != len(records):
        raise ValueError("Dataset has duplicate apartment IDs")
    all_cases = cases["generation"] + cases["journeys"]
    if len({case["id"] for case in all_cases}) != len(all_cases):
        raise ValueError("Duplicate case IDs")
    for case in cases["generation"]:
        ids = case["input_ids"]
        if len(ids) != len(set(ids)) or set(ids) - by_id.keys():
            raise ValueError(f"{case['id']}: duplicate or unknown input IDs")
        if case["expected"]["listing_ids"] != ids:
            raise ValueError(f"{case['id']}: expected records differ from controlled input")
        if len(ids) > cases.get("max_rendered_records", 6):
            raise ValueError(f"{case['id']}: exceeds this manifest's result cap")
        if "selection" in case and select(records, case["selection"]) != ids:
            raise ValueError(f"{case['id']}: selection oracle does not match input IDs")
        for apartment_id in ids:
            missing = set(case["expected"]["fields"]) - by_id[apartment_id].keys()
            if missing:
                raise ValueError(f"{case['id']}: unknown expected fields {missing}")
        if case["expected"]["view"] == "empty" and ids:
            raise ValueError(f"{case['id']}: empty view has listings")
    for case in cases["journeys"]:
        for step in case["steps"]:
            if "selection" in step and select(records, step["selection"]) != step["expected_ids"]:
                raise ValueError(f"{case['id']}: journey selection oracle is incorrect")
            for apartment_id in step.get("expected_ids", []):
                if apartment_id not in by_id:
                    raise ValueError(f"{case['id']}: unknown apartment {apartment_id}")
            if "apartment_id" in step and step["apartment_id"] not in by_id:
                raise ValueError(f"{case['id']}: action targets an unknown apartment")
            if step["kind"] == "submit_invalid" and step["expected_new_model_calls"] != 0:
                raise ValueError(f"{case['id']}: invalid forms must not call a model")
    print(f"Checked {len(records)} records, {len(cases['generation'])} generation cases "
          f"and {len(cases['journeys'])} journeys. No model or UI evaluations were run.")


if __name__ == "__main__":
    validate(
        Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).parent,
        sys.argv[2] if len(sys.argv) > 2 else "cases.json",
    )
