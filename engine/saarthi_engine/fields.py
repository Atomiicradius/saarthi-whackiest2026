"""Profile fields the engine knows about (section 2 of data-and-contracts.md).

Each field has a kind, the values it can take (used to estimate information gain), an ask cost
(cheaper fields win ties) and the question shown to the student. Choice labels stay in English
because the web app maps each label to a stored value (web/lib/answer-config.ts).
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

Kind = Literal["categorical", "boolean", "number", "text"]
Lang = Literal["en", "hi", "kn"]


@dataclass(frozen=True)
class FieldSpec:
    name: str
    kind: Kind
    # Allowed values for categorical and boolean fields. None means any value of the kind.
    domain: tuple[object, ...] | None
    # Lower is cheaper to answer. Used as the tie-break in question selection.
    cost: int
    question: dict[Lang, str]
    choices: tuple[str, ...] | None
    # Numbers only: inclusive bounds a valid answer must fall within.
    bounds: tuple[float, float] | None = None


FIELDS: dict[str, FieldSpec] = {
    spec.name: spec
    for spec in (
        FieldSpec(
            name="state_of_domicile",
            kind="categorical",
            domain=("Karnataka", "Other"),
            cost=1,
            question={
                "en": "Which state do you live in?",
                "hi": "आप किस राज्य में रहते हैं?",
                "kn": "ನೀವು ಯಾವ ರಾಜ್ಯದಲ್ಲಿ ವಾಸಿಸುತ್ತೀರಿ?",
            },
            choices=("Karnataka", "Another state"),
        ),
        FieldSpec(
            name="category",
            kind="categorical",
            domain=("GEN", "OBC", "SC", "ST", "EWS"),
            cost=2,
            question={
                "en": "Which category are you in?",
                "hi": "आप किस वर्ग से हैं?",
                "kn": "ನೀವು ಯಾವ ವರ್ಗಕ್ಕೆ ಸೇರಿದ್ದೀರಿ?",
            },
            choices=("GEN", "OBC", "SC", "ST", "EWS"),
        ),
        FieldSpec(
            name="gender",
            kind="categorical",
            domain=("F", "M", "O"),
            cost=1,
            question={
                "en": "What is your gender?",
                "hi": "आपका लिंग क्या है?",
                "kn": "ನಿಮ್ಮ ಲಿಂಗ ಯಾವುದು?",
            },
            choices=("Female", "Male", "Other"),
        ),
        FieldSpec(
            name="course_level",
            kind="categorical",
            domain=("UG", "PG", "DIPLOMA"),
            cost=1,
            question={
                "en": "Which level are you studying?",
                "hi": "आप किस स्तर पर पढ़ रहे हैं?",
                "kn": "ನೀವು ಯಾವ ಹಂತದಲ್ಲಿ ಓದುತ್ತಿದ್ದೀರಿ?",
            },
            choices=("UG", "PG", "DIPLOMA"),
        ),
        FieldSpec(
            name="year_of_study",
            kind="number",
            domain=(1, 2, 3, 4),
            cost=1,
            question={
                "en": "Which year are you in?",
                "hi": "आप किस वर्ष में हैं?",
                "kn": "ನೀವು ಯಾವ ವರ್ಷದಲ್ಲಿದ್ದೀರಿ?",
            },
            choices=("1", "2", "3", "4"),
            bounds=(1, 6),
        ),
        FieldSpec(
            name="institution_type",
            kind="categorical",
            domain=("govt", "aided", "private"),
            cost=2,
            question={
                "en": "What type of college do you study in?",
                "hi": "आप किस प्रकार के कॉलेज में पढ़ते हैं?",
                "kn": "ನೀವು ಯಾವ ರೀತಿಯ ಕಾಲೇಜಿನಲ್ಲಿ ಓದುತ್ತಿದ್ದೀರಿ?",
            },
            choices=("Government", "Aided", "Private"),
        ),
        FieldSpec(
            name="disability",
            kind="boolean",
            domain=(True, False),
            cost=3,
            question={
                "en": "Do you have a disability certificate?",
                "hi": "क्या आपके पास विकलांगता प्रमाणपत्र है?",
                "kn": "ನಿಮ್ಮ ಬಳಿ ಅಂಗವಿಕಲತೆ ಪ್ರಮಾಣಪತ್ರ ಇದೆಯೇ?",
            },
            choices=("Yes", "No"),
        ),
        FieldSpec(
            name="minority_community",
            kind="boolean",
            domain=(True, False),
            cost=3,
            question={
                "en": "Do you belong to a notified minority community?",
                "hi": "क्या आप किसी अधिसूचित अल्पसंख्यक समुदाय से हैं?",
                "kn": "ನೀವು ಅಧಿಸೂಚಿತ ಅಲ್ಪಸಂಖ್ಯಾತ ಸಮುದಾಯಕ್ಕೆ ಸೇರಿದ್ದೀರಾ?",
            },
            choices=("Yes", "No"),
        ),
        FieldSpec(
            name="annual_family_income_inr",
            kind="number",
            domain=None,
            cost=4,
            question={
                "en": "What is your family's yearly income?",
                "hi": "आपके परिवार की सालाना आय कितनी है?",
                "kn": "ನಿಮ್ಮ ಕುಟುಂಬದ ವಾರ್ಷಿಕ ಆದಾಯ ಎಷ್ಟು?",
            },
            choices=None,
            bounds=(0, 100_000_000),
        ),
        FieldSpec(
            name="last_exam_marks_pct",
            kind="number",
            domain=None,
            cost=5,
            question={
                "en": "What were your marks in the last exam?",
                "hi": "पिछली परीक्षा में आपके कितने प्रतिशत अंक थे?",
                "kn": "ಕಳೆದ ಪರೀಕ್ಷೆಯಲ್ಲಿ ನಿಮಗೆ ಎಷ್ಟು ಶೇಕಡಾ ಅಂಕಗಳು ಬಂದವು?",
            },
            choices=None,
            bounds=(0, 100),
        ),
        FieldSpec(
            name="course",
            kind="text",
            domain=None,
            cost=6,
            question={
                "en": "Which course are you studying?",
                "hi": "आप कौन सा कोर्स पढ़ रहे हैं?",
                "kn": "ನೀವು ಯಾವ ಕೋರ್ಸ್ ಓದುತ್ತಿದ್ದೀರಿ?",
            },
            choices=None,
        ),
    )
}


def check_value(field: str, value: object) -> None:
    """Raises ValueError if `value` is not valid for `field`. None (unknown) is always valid."""
    spec = FIELDS.get(field)
    if spec is None:
        raise ValueError(f"Unknown profile field: {field}")
    if value is None:
        return
    if spec.kind == "boolean":
        if not isinstance(value, bool):
            raise ValueError(f"{field} must be true or false")
    elif spec.kind == "number":
        if isinstance(value, bool) or not isinstance(value, (int, float)):
            raise ValueError(f"{field} must be a number")
        if spec.bounds and not spec.bounds[0] <= value <= spec.bounds[1]:
            raise ValueError(f"{field} must be between {spec.bounds[0]} and {spec.bounds[1]}")
    elif not isinstance(value, str):
        raise ValueError(f"{field} must be text")
    if spec.kind in ("categorical", "boolean") and spec.domain and value not in spec.domain:
        allowed = ", ".join(str(item) for item in spec.domain)
        raise ValueError(f"{field} must be one of: {allowed}")
