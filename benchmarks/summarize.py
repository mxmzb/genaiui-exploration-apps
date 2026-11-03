"""Produce a reviewable report from immutable trial exports; no API calls."""
import hashlib
import json
import statistics
import sys
from pathlib import Path

root = Path(sys.argv[1]).resolve()
raw = (root / "trials.json").read_bytes()
trials = json.loads(raw)
manifest = json.loads((root / "manifest.json").read_text())
review = json.loads((root / "manual-review.json").read_text()) if (root / "manual-review.json").exists() else None
reviewed = {row["id"]: row["reviewedPass"] for row in review["rows"]} if review else {}

def money(value):
    return "unknown" if value is None else f"${value:.5f}"

def median_time(rows, field):
    values = [t["browser"][field] / 1000 for t in rows if t.get("browser", {}).get(field) is not None]
    return f"{statistics.median(values):.2f}s (n={len(values)})" if values else "—"

def wilson(k, n):
    if not n:
        return "—"
    z = 1.96
    center = (k / n + z*z / (2*n)) / (1 + z*z/n)
    half = z * ((k/n*(1-k/n)/n + z*z/(4*n*n)) ** 0.5) / (1 + z*z/n)
    return f"{100*(center-half):.0f}–{100*(center+half):.0f}%"

lines = ["# json-render instrumentation pilot", "", f"Run: `{manifest['runId']}`.", "",
         "This is an instrumentation pilot, not a model ranking. Success counts use the saved-output review when available; the original automatic verdicts remain below.", "",
         "| Model / pinned route | Reviewed success (Wilson 95%) | Recorded charge | Mean per attempt | Cost per reviewed success | Median browser stream completion, all attempts |",
         "|---|---:|---:|---:|---:|---|"]
for model in manifest["models"]:
    rows = [t for t in trials if t["model"]["id"] == model["id"]]
    passes = [t for t in rows if reviewed.get(t["id"], t["automaticPass"])]
    known = [t["costUsd"] for t in rows if t["costUsd"] is not None]
    total = sum(known) if len(known) == len(rows) else None
    mean = total / len(rows) if total is not None and rows else None
    effective = total / len(passes) if total is not None and passes else None
    lines.append(f"| {model['id']} / {model['providerTag']} | {len(passes)}/{len(rows)} ({wilson(len(passes), len(rows))}) | {money(total)} | {money(mean)} | {money(effective)} | {median_time(rows, 'streamEnd')} |")
lines += ["", "All failed generation attempts are included in costs. Missing charges remain unknown; no-success cost is undefined. Stream completion is diagnostic transport timing, not time to a correct, usable interface. Provider routing and configuration differ; do not infer model superiority from nine attempts.", ""]
if review:
    lines += ["## Review and instrumentation corrections", "",
              f"Original automatic passes: {review['originalAutomaticPasses']}/18. Reviewed passes: {review['reviewedPasses']}/18. Six content-check false negatives were corrected by replaying saved DOM, with no model calls or output repair.", "",
              review["reviewer"], "", review["method"], "", review["timingCaveat"], "",
              "[Per-trial review](manual-review.json) · [Offline checker results](regrade.json). Original trial/export hashes are retained.", "",
              review["priorRoutingAttempt"], ""]
lines += ["## Original automatic verdicts", "",
          "| Trial | Format | Catalog | Content | Actions | Route | Runtime | Charge | Screenshot / trace |",
          "|---|---|---|---|---|---|---|---:|---|"]
for t in trials:
    verdicts = ["pass" if t["verdicts"][key]["pass"] else "fail" for key in ["rawFormat", "contract", "content", "actions", "route", "runtime"]]
    lines.append(f"| [{t['id']}]({t['id']}/trial.json) | " + " | ".join(verdicts) + f" | {money(t['costUsd'])} | [image]({t['id']}/final.png) · [trace]({t['id']}/trace.zip) |")
lines += ["", "## Reproduce this report", "", f"`python3 summarize.py results/{manifest['runId']}`", "",
          f"Trial-export SHA-256: `{hashlib.sha256(raw).hexdigest()}`.", "",
          "The manifest records implementation/patch hashes, environment, prices and settings. Screenshots use local synthetic image fixtures. See RUNNING.md for measurement definitions and limitations.", ""]
(root / "report.md").write_text("\n".join(lines))
print(root / "report.md")
