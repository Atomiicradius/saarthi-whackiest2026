"""Human-readable values for verdict reasons."""

from __future__ import annotations

from typing import Any

INSTITUTION_LABELS = {"govt": "Government", "aided": "Aided", "private": "Private"}
GENDER_LABELS = {"F": "Female", "M": "Male", "O": "Other"}


def _trim(number: float) -> str:
    return f"{number:.2f}".rstrip("0").rstrip(".")


def money(amount: float) -> str:
    """₹ amounts in the Indian style: ₹20,000, ₹2.4 lakh, ₹1.2 crore."""
    if amount >= 10_000_000:
        return f"₹{_trim(amount / 10_000_000)} crore"
    if amount >= 100_000:
        return f"₹{_trim(amount / 100_000)} lakh"
    return f"₹{amount:,.0f}"


def describe_value(field: str, value: Any) -> str:
    if field == "annual_family_income_inr":
        return money(value)
    if field == "last_exam_marks_pct":
        return f"{value:g}%"
    if field == "institution_type":
        return INSTITUTION_LABELS.get(value, str(value))
    if field == "gender":
        return GENDER_LABELS.get(value, str(value))
    if field == "state_of_domicile" and value == "Other":
        return "another state"
    if isinstance(value, bool):
        return "yes" if value else "no"
    return str(value)
