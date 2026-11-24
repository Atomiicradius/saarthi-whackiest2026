"""Tri-state eligibility rules (sections 1 and 3 of data-and-contracts.md).

A profile here is a plain dict of field name to value. A missing key or None means unknown.
Schemes must already have passed `schemes.validate_scheme`.
"""

from __future__ import annotations

from typing import Any

from saarthi_engine.format import describe_value, money

Profile = dict[str, Any]
Scheme = dict[str, Any]
Result = dict[str, Any]

LABELS = {
    "state_of_domicile": "State",
    "category": "Category",
    "minority_community": "Minority community",
    "gender": "Gender",
    "disability": "Disability certificate",
    "annual_family_income_inr": "Income",
    "course": "Course",
    "course_level": "Level",
    "year_of_study": "Year",
    "institution_type": "College type",
    "last_exam_marks_pct": "Marks",
}

# How far a failed numeric criterion may miss and still count as "almost". Only these fields can
# produce a near miss; a wrong category or state is not "almost".
NEAR_MISS_INCOME_FRACTION = 0.2
NEAR_MISS_MARKS_POINTS = 5.0


def _is_known(profile: Profile, field: str) -> bool:
    return profile.get(field) is not None


def criterion_holds(op: str, actual: Any, expected: Any) -> bool:
    """Applies one operator to a known value."""
    if op == "exists":
        return True
    if op == "==":
        return actual == expected
    if op == "!=":
        return actual != expected
    if op == "<":
        return actual < expected
    if op == "<=":
        return actual <= expected
    if op == ">":
        return actual > expected
    if op == ">=":
        return actual >= expected
    if op == "in":
        return actual in expected
    if op == "not_in":
        return actual not in expected
    raise ValueError(f"Unsupported operator: {op}")


def criterion_status(criterion: dict[str, Any], profile: Profile) -> str:
    field = criterion["field"]
    if not _is_known(profile, field):
        return "unknown"
    holds = criterion_holds(criterion["op"], profile[field], criterion.get("value"))
    return "met" if holds else "failed"


def _detail(criterion: dict[str, Any], status: str, profile: Profile) -> str:
    field, op, expected = criterion["field"], criterion["op"], criterion.get("value")
    label = LABELS.get(field, field)
    if status == "unknown":
        return f"{label} not answered yet"
    actual = describe_value(field, profile[field])
    if op == "exists":
        return f"{label} is provided"
    if op in ("in", "not_in"):
        options = ", ".join(describe_value(field, item) for item in expected)
        if op == "in":
            if status == "met":
                return f"{label} {actual} is accepted ({options})"
            return f"{label} {actual} is not accepted (needs {options})"
        if status == "met":
            return f"{label} {actual} is allowed"
        return f"{label} {actual} is excluded ({options})"
    target = describe_value(field, expected)
    phrases = {
        ("==", "met"): f"{label} {actual} matches",
        ("==", "failed"): f"{label} {actual} does not match the required {target}",
        ("!=", "met"): f"{label} {actual} is allowed",
        ("!=", "failed"): f"{label} {actual} is not allowed",
        ("<=", "met"): f"{label} {actual} is within the {target} limit",
        ("<=", "failed"): f"{label} {actual} is above the {target} limit",
        ("<", "met"): f"{label} {actual} is below {target}",
        ("<", "failed"): f"{label} {actual} is not below {target}",
        (">=", "met"): f"{label} {actual} meets the {target} minimum",
        (">=", "failed"): f"{label} {actual} is below the {target} minimum",
        (">", "met"): f"{label} {actual} is above {target}",
        (">", "failed"): f"{label} {actual} is not above {target}",
    }
    return phrases[(op, status)]


def _near_miss(failed: dict[str, Any], profile: Profile) -> dict[str, Any] | None:
    field, op, limit = failed["field"], failed["op"], failed["value"]
    actual = profile[field]
    if field == "annual_family_income_inr" and op in ("<=", "<"):
        gap = actual - limit
        if gap <= limit * NEAR_MISS_INCOME_FRACTION:
            return {
                "field": field,
                "gap": f"Income is {money(gap)} above the limit",
                "fixable": False,
            }
    if field == "last_exam_marks_pct" and op in (">=", ">"):
        gap = limit - actual
        if gap <= NEAR_MISS_MARKS_POINTS:
            points = f"{gap:g} point" + ("" if gap == 1 else "s")
            return {
                "field": field,
                "gap": f"Marks are {points} below the {limit:g}% needed",
                "fixable": False,
            }
    return None


def evaluate_scheme(scheme: Scheme, profile: Profile) -> Result:
    reasons = []
    missing: list[str] = []
    failed: list[dict[str, Any]] = []
    for criterion in scheme["criteria"]:
        status = criterion_status(criterion, profile)
        reasons.append(
            {
                "field": criterion["field"],
                "status": status,
                "detail": _detail(criterion, status, profile),
            }
        )
        if status == "failed":
            failed.append(criterion)
        elif status == "unknown" and criterion["field"] not in missing:
            missing.append(criterion["field"])

    if failed:
        verdict = "ineligible"
    elif missing:
        verdict = "unknown"
    else:
        verdict = "eligible"

    result: Result = {
        "scheme_id": scheme["id"],
        "verdict": verdict,
        "reasons": reasons,
        "missing_fields": missing,
    }
    if len(failed) == 1:
        near = _near_miss(failed[0], profile)
        if near:
            result["near_miss"] = near
    return result


def evaluate_all(schemes: list[Scheme], profile: Profile) -> list[Result]:
    return [evaluate_scheme(scheme, profile) for scheme in schemes]
