"""Portfolio optimiser (section 5 of data-and-contracts.md).

Picks the most valuable set of eligible schemes under two rules:
- among NSP schemes, at most one `merit` scheme (welfare schemes are not limited);
- for each `exclusive_with` pair, at most one of the two.

Schemes outside every conflict are always taken. Only the conflicting ones are searched, and that
set is tiny in practice, so brute force is exact and fast.

Closed windows (open decision 7): a scheme whose window is closed is not selected; it is listed in
`dropped` with the reason, which is what the results screen shows.
"""

from __future__ import annotations

from datetime import date
from itertools import combinations
from typing import Any

from saarthi_engine.rules import Profile, Scheme, evaluate_all

# Above this many conflicting schemes we fall back to a greedy pick instead of trying every subset.
MAX_EXACT = 20


def closing_date(scheme: Scheme) -> date | None:
    window = scheme.get("application_window")
    text = window["closes"] if window else scheme.get("deadline")
    return date.fromisoformat(text) if text else None


def is_closed(scheme: Scheme, today: date | None) -> bool:
    window = scheme.get("application_window")
    if window and window["status"] == "closed":
        return True
    closes = closing_date(scheme)
    return today is not None and closes is not None and closes < today


def _is_nsp_merit(scheme: Scheme) -> bool:
    return scheme["portal"] == "nsp" and scheme["scheme_type"] == "merit"


def _value(scheme: Scheme, weights: dict[str, float]) -> float:
    return (scheme["amount_inr_per_year"] or 0) * weights.get(scheme["id"], 1.0)


def _exclusive_pairs(schemes: list[Scheme]) -> set[frozenset[str]]:
    ids = {scheme["id"] for scheme in schemes}
    return {
        frozenset((scheme["id"], other))
        for scheme in schemes
        for other in scheme.get("exclusive_with", [])
        if other in ids and other != scheme["id"]
    }


def _feasible(chosen: tuple[Scheme, ...], pairs: set[frozenset[str]]) -> bool:
    if sum(_is_nsp_merit(scheme) for scheme in chosen) > 1:
        return False
    ids = {scheme["id"] for scheme in chosen}
    return not any(pair <= ids for pair in pairs)


def _rank(chosen: tuple[Scheme, ...], weights: dict[str, float]) -> tuple[Any, ...]:
    # Most value first, then more schemes, then the earliest closing dates (apply sooner).
    far = date.max.toordinal()
    closes = sorted((closing_date(s) or date.max).toordinal() for s in chosen)
    return (sum(_value(s, weights) for s in chosen), len(chosen), tuple(far - d for d in closes))


def _best_subset(
    conflicted: list[Scheme], pairs: set[frozenset[str]], weights: dict[str, float]
) -> list[Scheme]:
    if len(conflicted) > MAX_EXACT:
        chosen: list[Scheme] = []
        for scheme in sorted(conflicted, key=lambda s: -_value(s, weights)):
            if _feasible((*chosen, scheme), pairs):
                chosen.append(scheme)
        return chosen
    best: tuple[Scheme, ...] = ()
    for size in range(1, len(conflicted) + 1):
        for subset in combinations(conflicted, size):
            if _feasible(subset, pairs) and _rank(subset, weights) > _rank(best, weights):
                best = subset
    return list(best)


def _drop_reason(
    scheme: Scheme, selected: list[Scheme], pairs: set[frozenset[str]], weights: dict[str, float]
) -> str:
    for other in selected:
        if frozenset((scheme["id"], other["id"])) in pairs:
            return f"Cannot be combined with {other['name']} (official rule)"
    if _is_nsp_merit(scheme):
        winner = next((s for s in selected if _is_nsp_merit(s)), None)
        if winner:
            why = (
                "is worth more"
                if _value(winner, weights) > _value(scheme, weights)
                else "closes sooner"
            )
            return f"Only one merit scheme is allowed on NSP, and {winner['name']} {why}"
    return "Not part of the best combination"


def optimize(
    schemes: list[Scheme],
    profile: Profile,
    weights: dict[str, float] | None = None,
    today: date | None = None,
) -> dict[str, Any]:
    weights = weights or {}
    by_id = {scheme["id"]: scheme for scheme in schemes}
    eligible = [
        by_id[result["scheme_id"]]
        for result in evaluate_all(schemes, profile)
        if result["verdict"] == "eligible"
    ]

    dropped = [
        {"scheme_id": s["id"], "reason": "Application window is closed"}
        for s in eligible
        if is_closed(s, today)
    ]
    open_schemes = [s for s in eligible if not is_closed(s, today)]

    pairs = _exclusive_pairs(open_schemes)
    in_pairs = {scheme_id for pair in pairs for scheme_id in pair}
    nsp_merits = [s for s in open_schemes if _is_nsp_merit(s)]
    conflicted = [
        s for s in open_schemes if s["id"] in in_pairs or (_is_nsp_merit(s) and len(nsp_merits) > 1)
    ]
    free = [s for s in open_schemes if s not in conflicted]

    selected = free + _best_subset(conflicted, pairs, weights)
    selected.sort(key=lambda s: (-_value(s, weights), s["id"]))
    for scheme in conflicted:
        if scheme not in selected:
            dropped.append(
                {
                    "scheme_id": scheme["id"],
                    "reason": _drop_reason(scheme, selected, pairs, weights),
                }
            )

    return {
        "selected": [s["id"] for s in selected],
        "total_inr_per_year": sum(s["amount_inr_per_year"] or 0 for s in selected),
        "dropped": dropped,
    }
