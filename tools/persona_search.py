"""Search synthetic Karnataka UG profiles over data/schemes.json for the sample student.

Run: python tools/persona_search.py  (needs the engine installed: pip install -e engine; optional arg: repo root)
Requirements, in priority order: (a) every plan scheme has a known amount, (b) plan >= 2 schemes,
(c) >= 2 eligible, (d) >= 1 Almost eligible, (e) >= 1 Not eligible, (f) >= 1 Closed if any window
is closed on the demo date, (g) a plausible, ordinary student.
"""

import itertools
import sys
from datetime import date
from pathlib import Path

from saarthi_engine import evaluate_all, load_schemes, optimize

repo = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).resolve().parent.parent
schemes, _ = load_schemes(repo / "data" / "schemes.json")
by_id = {s["id"]: s for s in schemes}
name = {s["id"]: s["name"].split(":")[0][:56] for s in schemes}
TODAY = date(2026, 11, 24)  # the pinned demo date


def is_closed(s, today):
    w = s.get("application_window") or {}
    return w.get("status") == "closed" or bool(w.get("closes") and date.fromisoformat(w["closes"]) < today)


def make(gender, category, income, marks, year, institution, minority, disability):
    return {
        "state_of_domicile": "Karnataka", "category": category, "minority_community": minority,
        "gender": gender, "disability": disability, "annual_family_income_inr": income,
        "course": "BE-CSE", "course_level": "UG", "year_of_study": year,
        "institution_type": institution, "last_exam_marks_pct": marks,
    }


def lanes(p):
    eligible, almost, shut, notel = [], [], [], []
    fixable = 0
    for r in evaluate_all(schemes, p):
        s = by_id[r["scheme_id"]]
        if r["verdict"] == "eligible":
            (shut if is_closed(s, TODAY) else eligible).append(r["scheme_id"])
        elif r.get("near_miss") or r["verdict"] == "unknown":
            almost.append(r["scheme_id"])
            fixable += bool((r.get("near_miss") or {}).get("fixable"))
        else:
            notel.append(r["scheme_id"])
    plan = optimize(schemes, p, today=TODAY)
    return {"eligible": eligible, "almost": almost, "closed": shut, "not": notel, "fixable": fixable,
            "plan": plan["selected"], "total": plan["total_inr_per_year"]}


def checks(l):
    any_closed = any(is_closed(s, TODAY) for s in schemes)
    return [
        ("a: plan amounts all known", bool(l["plan"]) and all(by_id[i]["amount_inr_per_year"] is not None for i in l["plan"])),
        ("b: plan >= 2", len(l["plan"]) >= 2),
        ("c: eligible >= 2", len(l["eligible"]) + len(l["closed"]) >= 2),
        ("d: almost >= 1", len(l["almost"]) >= 1),
        ("e: not eligible >= 1", len(l["not"]) >= 1),
        ("f: closed >= 1 (if a window is closed)", (not any_closed) or len(l["closed"]) >= 1),
    ]


def oddness(combo):
    """Lower is more ordinary: mid income, mid marks, no stacked special statuses."""
    gender, category, income, marks, year, inst, minority, disability = combo
    return (minority + disability) * 2 + (marks < 60 or marks > 90) + (year in (1, 4)) + (income < 100000)


grid = itertools.product(
    ["F", "M"], ["GEN", "OBC", "SC", "ST", "EWS"],
    [120000, 180000, 240000, 300000, 350000, 450000, 500000, 600000, 800000],
    [58.0, 65.0, 72.0, 78.5, 85.0], [1, 2, 3, 4], ["govt", "aided", "private"], [False, True], [False, True],
)
cands = []
for combo in grid:
    l = lanes(make(*combo))
    ch = checks(l)
    cands.append((tuple(ok for _, ok in ch), -oddness(combo), len(l["plan"]), l["total"], combo, l, ch))

cands.sort(key=lambda c: c[:4], reverse=True)
seen, top = set(), []
for c in cands:
    sig = (c[4][0], c[4][1], tuple(c[5]["eligible"]), tuple(c[5]["almost"]), tuple(c[5]["plan"]))
    if sig not in seen:
        seen.add(sig)
        top.append(c)
    if len(top) == 3:
        break

print(f"profiles searched: {len(cands)}")
for rank, (_, _, _, _, combo, l, ch) in enumerate(top, 1):
    g, cat, inc, marks, yr, inst, mino, dis = combo
    print(f"\n#{rank}: gender={g} category={cat} income={inc} marks={marks} year={yr} institution={inst} minority={mino} disability={dis}")
    print("   met:", [k for k, ok in ch if ok], "| not met:", [k for k, ok in ch if not ok])
    print("   plan:", [name[i] for i in l["plan"]], "total", l["total"])
    for lane in ("eligible", "almost", "closed", "not"):
        print(f"   {lane} ({len(l[lane])}):", [name[i] for i in l[lane]])
