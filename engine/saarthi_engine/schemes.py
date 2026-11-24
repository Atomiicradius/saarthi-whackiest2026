"""Loading and validating scheme records (section 1 of data-and-contracts.md).

Malformed records raise SchemeError. A record without a `source_url` is skipped, not loaded,
because the contract forbids evaluating schemes that have no official source.
"""

from __future__ import annotations

import json
from datetime import date
from pathlib import Path
from typing import Any

from saarthi_engine.fields import FIELDS, check_value

OPERATORS = {"==", "!=", "<", "<=", ">", ">=", "in", "not_in", "exists"}
COMPARISONS = {"<", "<=", ">", ">="}
PROVIDERS = {"central", "karnataka", "other"}
PORTALS = {"nsp", "other"}
SCHEME_TYPES = {"merit", "welfare"}
LEVELS = {"UG", "PG", "DIPLOMA"}
WINDOW_STATUSES = {"open", "closed", "upcoming"}
REQUIRED = (
    "id",
    "name",
    "provider",
    "portal",
    "scheme_type",
    "level",
    "amount_inr_per_year",
    "criteria",
    "docs_required",
    "confidence",
    "last_verified",
)


class SchemeError(ValueError):
    pass


def _iso_date(text: Any, where: str) -> None:
    try:
        date.fromisoformat(text)
    except (TypeError, ValueError) as error:
        raise SchemeError(f"{where} must be a YYYY-MM-DD date") from error


def _check_criterion(criterion: dict[str, Any], where: str) -> None:
    field, op = criterion.get("field"), criterion.get("op")
    if field not in FIELDS:
        raise SchemeError(f"{where}: unknown field {field!r}")
    if op not in OPERATORS:
        raise SchemeError(f"{where}: unsupported operator {op!r}")
    if op == "exists":
        return
    if "value" not in criterion:
        raise SchemeError(f"{where}: missing value")
    value = criterion["value"]
    if op in COMPARISONS and FIELDS[field].kind != "number":
        raise SchemeError(f"{where}: {op} needs a numeric field, {field} is not")
    values = value if op in ("in", "not_in") else [value]
    if op in ("in", "not_in") and not isinstance(value, list):
        raise SchemeError(f"{where}: {op} needs a list")
    for item in values:
        try:
            check_value(field, item)
        except ValueError as error:
            raise SchemeError(f"{where}: {error}") from error


def validate_scheme(scheme: dict[str, Any]) -> None:
    sid = scheme.get("id", "<no id>")
    for key in REQUIRED:
        if key not in scheme:
            raise SchemeError(f"{sid}: missing {key}")
    if scheme["provider"] not in PROVIDERS:
        raise SchemeError(f"{sid}: provider must be one of {sorted(PROVIDERS)}")
    if scheme["portal"] not in PORTALS:
        raise SchemeError(f"{sid}: portal must be one of {sorted(PORTALS)}")
    if scheme["scheme_type"] not in SCHEME_TYPES:
        raise SchemeError(f"{sid}: scheme_type must be one of {sorted(SCHEME_TYPES)}")
    if not set(scheme["level"]) <= LEVELS:
        raise SchemeError(f"{sid}: level must use {sorted(LEVELS)}")
    amount = scheme["amount_inr_per_year"]
    if amount is not None and (isinstance(amount, bool) or not isinstance(amount, (int, float))):
        raise SchemeError(f"{sid}: amount_inr_per_year must be a number or null")
    if not 0 <= scheme["confidence"] <= 1:
        raise SchemeError(f"{sid}: confidence must be between 0 and 1")
    _iso_date(scheme["last_verified"], f"{sid}: last_verified")
    if scheme.get("deadline") is not None:
        _iso_date(scheme["deadline"], f"{sid}: deadline")
    window = scheme.get("application_window")
    if window is not None:
        _iso_date(window.get("opens"), f"{sid}: application_window.opens")
        _iso_date(window.get("closes"), f"{sid}: application_window.closes")
        if window.get("status") not in WINDOW_STATUSES:
            raise SchemeError(
                f"{sid}: application_window.status must be one of {sorted(WINDOW_STATUSES)}"
            )
    if not isinstance(scheme["criteria"], list):
        raise SchemeError(f"{sid}: criteria must be a list")
    for index, criterion in enumerate(scheme["criteria"]):
        _check_criterion(criterion, f"{sid}: criteria[{index}]")


def load_schemes(path: Path) -> tuple[list[dict[str, Any]], list[str]]:
    """Returns (loaded schemes, ids skipped for having no source_url)."""
    records = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(records, list):
        raise SchemeError(f"{path} must hold a JSON list of scheme records")
    loaded: list[dict[str, Any]] = []
    skipped: list[str] = []
    seen: set[str] = set()
    for record in records:
        validate_scheme(record)
        if record["id"] in seen:
            raise SchemeError(f"Duplicate scheme id {record['id']}")
        seen.add(record["id"])
        if not record.get("source_url"):
            skipped.append(record["id"])
            continue
        record.setdefault("exclusive_with", [])
        record.setdefault("application_window", None)
        record.setdefault("deadline", None)
        loaded.append(record)
    return loaded, skipped
