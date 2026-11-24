"""Next-question selection by information gain (section 4 of data-and-contracts.md).

For each unanswered field used by a scheme that is still `unknown`, we try every plausible answer
and count how many of those schemes would then settle to eligible or ineligible. The answers are
weighted equally, so the score is the expected number of schemes resolved by asking the field.
"""

from __future__ import annotations

from typing import Any

from saarthi_engine.fields import FIELDS, Lang
from saarthi_engine.rules import Profile, Scheme, evaluate_all, evaluate_scheme

DONE = {"field": None, "question": "", "choices": None, "resolves_estimate": 0}


def _criterion_values(field: str, schemes: list[Scheme]) -> list[Any]:
    values: list[Any] = []
    for scheme in schemes:
        for criterion in scheme["criteria"]:
            if criterion["field"] != field or criterion["op"] == "exists":
                continue
            value = criterion["value"]
            values.extend(value if isinstance(value, list) else [value])
    return values


def _numeric_samples(thresholds: list[float], bounds: tuple[float, float] | None) -> list[float]:
    """A value below, at, between and above each threshold, so every comparison can go both ways."""
    if not thresholds:
        return []
    points = sorted(set(thresholds))
    samples = [points[0] - max(1.0, abs(points[0]) * 0.5)]
    for low, high in zip(points, points[1:], strict=False):
        samples.extend([low, (low + high) / 2])
    samples.extend([points[-1], points[-1] + max(1.0, abs(points[-1]) * 0.5)])
    if bounds:
        samples = [min(max(sample, bounds[0]), bounds[1]) for sample in samples]
    return sorted(set(samples))


def candidate_values(field: str, schemes: list[Scheme]) -> list[Any]:
    """The answers we imagine when estimating how useful asking `field` is."""
    spec = FIELDS[field]
    seen = _criterion_values(field, schemes)
    if spec.domain is not None:
        extra = [value for value in seen if value not in spec.domain]
        return [*spec.domain, *extra]
    if spec.kind == "number":
        return _numeric_samples([float(value) for value in seen], spec.bounds)
    # Free text: each value a scheme names, plus one that no scheme names.
    return [*dict.fromkeys(seen), "__other__"]


def expected_resolutions(field: str, unknown: list[Scheme], profile: Profile) -> float:
    values = candidate_values(field, unknown)
    if not values:
        return 0.0
    total = 0
    for value in values:
        trial = {**profile, field: value}
        total += sum(evaluate_scheme(scheme, trial)["verdict"] != "unknown" for scheme in unknown)
    return total / len(values)


def _choices(field: str, schemes: list[Scheme]) -> list[str] | None:
    spec = FIELDS[field]
    if spec.choices is not None:
        return list(spec.choices)
    if spec.kind == "text":
        return [*dict.fromkeys(str(value) for value in _criterion_values(field, schemes)), "Other"]
    return None


def next_question(schemes: list[Scheme], profile: Profile, lang: Lang = "en") -> dict[str, Any]:
    by_id = {scheme["id"]: scheme for scheme in schemes}
    unknown_results = [r for r in evaluate_all(schemes, profile) if r["verdict"] == "unknown"]
    if not unknown_results:
        return dict(DONE)

    unknown = [by_id[result["scheme_id"]] for result in unknown_results]
    fields = dict.fromkeys(
        field for result in unknown_results for field in result["missing_fields"]
    )

    scored = [(expected_resolutions(field, unknown, profile), field) for field in fields]
    # Highest gain first; ties go to the cheaper question, then the name, so output is stable.
    scored.sort(key=lambda item: (-item[0], FIELDS[item[1]].cost, item[1]))
    gain, field = scored[0]
    if gain <= 0:
        return dict(DONE)

    spec = FIELDS[field]
    return {
        "field": field,
        "question": spec.question.get(lang, spec.question["en"]),
        "choices": _choices(field, schemes),
        "resolves_estimate": max(1, round(gain)),
    }
