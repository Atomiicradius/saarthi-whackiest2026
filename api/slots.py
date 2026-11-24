"""Turns a transcript into candidate profile values (POST /slots/extract).

Deterministic keyword and number rules, no LLM. Output is only a candidate: the UI reads each
value back and the student confirms it before it is used (section 6 of data-and-contracts.md).
"""

from __future__ import annotations

import re
from typing import Any

from saarthi_engine import check_value

EXPLICIT = 0.9
# A bare number is trusted less: it is only taken because of the question that was asked.
INFERRED = 0.7

WORD_NUMBERS = {
    "one": 1,
    "two": 2,
    "three": 3,
    "four": 4,
    "five": 5,
    "six": 6,
    "seven": 7,
    "eight": 8,
    "nine": 9,
    "ten": 10,
}
YEARS = {"first": 1, "1st": 1, "second": 2, "2nd": 2, "third": 3, "3rd": 3, "fourth": 4, "4th": 4}
OTHER_STATES = (
    "kerala|tamil nadu|andhra|telangana|maharashtra|goa|gujarat|rajasthan|punjab|haryana|delhi|"
    "bihar|odisha|west bengal|uttar pradesh|madhya pradesh|assam|jharkhand|chhattisgarh"
)
KEYWORDS: list[tuple[str, str, Any]] = [
    ("state_of_domicile", r"\bkarnataka\b", "Karnataka"),
    ("state_of_domicile", rf"\b(?:{OTHER_STATES})\b", "Other"),
    ("category", r"\bscheduled caste\b|\bsc\b", "SC"),
    ("category", r"\bscheduled tribe\b|\bst\b", "ST"),
    ("category", r"\bother backward\b|\bobc\b", "OBC"),
    ("category", r"\bews\b|economically weaker", "EWS"),
    ("category", r"\bgeneral\b|\bgen\b", "GEN"),
    ("gender", r"\b(?:girl|female|woman)\b", "F"),
    ("gender", r"\b(?:boy|male|man)\b", "M"),
    ("course_level", r"\bdiploma\b|\bpolytechnic\b", "DIPLOMA"),
    ("course_level", r"\bm\.?\s?tech\b|\bmasters?\b|\bpost ?grad", "PG"),
    ("course_level", r"\bengineering\b|\bb\.?\s?tech\b|\bb\.?e\b|\bdegree\b|\bundergrad", "UG"),
    ("institution_type", r"\bgovernment\b|\bgovt\b", "govt"),
    ("institution_type", r"\baided\b", "aided"),
    ("institution_type", r"\bprivate\b", "private"),
]
YES = r"\b(?:yes|yeah|haan|han|ha)\b|ಹೌದು|हाँ|हां"
NO = r"\b(?:no|nope|nahi|nahin|illa)\b|ಇಲ್ಲ|नहीं"
BOOLEAN_FIELDS = ("disability", "minority_community")


def _normalise(text: str) -> str:
    text = text.lower().replace(",", "")
    words = "|".join(WORD_NUMBERS)
    text = re.sub(
        rf"\b({words})( and a half)?\b",
        lambda m: str(WORD_NUMBERS[m.group(1)] + (0.5 if m.group(2) else 0)),
        text,
    )
    return re.sub(r"\s+", " ", text).strip()


def _income(text: str) -> float | None:
    match = re.search(r"(\d+(?:\.\d+)?)\s*(crore|lakhs?|lacs?|thousand|k)\b", text)
    if match:
        scale = {"crore": 1e7, "thousand": 1e3, "k": 1e3}.get(match.group(2), 1e5)
        return float(match.group(1)) * scale
    match = re.search(r"(?:rs\.?|₹|rupees)\s*(\d{4,})|(\d{5,})\s*(?:rs|rupees)?", text)
    return float(match.group(1) or match.group(2)) if match else None


def _bare_number(text: str) -> float | None:
    match = re.search(r"\d+(?:\.\d+)?", text)
    return float(match.group()) if match else None


def _as_number(value: float) -> int | float:
    return int(value) if value.is_integer() else value


def extract(transcript: str, expecting_field: str | None) -> list[dict[str, Any]]:
    text = _normalise(transcript)
    found: dict[str, tuple[Any, float]] = {}

    def offer(field: str, value: Any, confidence: float) -> None:
        if field in found:
            return
        try:
            check_value(field, value)
        except ValueError:
            return
        found[field] = (value, confidence)

    if expecting_field in BOOLEAN_FIELDS:
        if re.search(NO, text):
            offer(expecting_field, False, EXPLICIT)
        elif re.search(YES, text):
            offer(expecting_field, True, EXPLICIT)

    income = _income(text)
    if income is not None:
        offer("annual_family_income_inr", _as_number(income), EXPLICIT)
    marks = re.search(r"(\d+(?:\.\d+)?)\s*(?:%|percent|per cent)", text)
    if marks:
        offer("last_exam_marks_pct", _as_number(float(marks.group(1))), EXPLICIT)
    year = re.search(rf"\b({'|'.join(YEARS)})\s*year\b", text)
    if year:
        offer("year_of_study", YEARS[year.group(1)], EXPLICIT)
    for field, pattern, value in KEYWORDS:
        if re.search(pattern, text):
            offer(field, value, EXPLICIT)

    bare = _bare_number(text)
    if bare is not None and expecting_field in (
        "annual_family_income_inr",
        "last_exam_marks_pct",
        "year_of_study",
    ):
        offer(expecting_field, _as_number(bare), INFERRED)

    ordered = sorted(found.items(), key=lambda item: item[0] != expecting_field)
    return [{"field": f, "value": v, "confidence": c} for f, (v, c) in ordered]
