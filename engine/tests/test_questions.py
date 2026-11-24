from conftest import make_scheme

from saarthi_engine import FIELDS, evaluate_all, next_question


def test_picks_the_field_that_resolves_most():
    # Category settles three schemes; income settles one.
    schemes = [
        make_scheme("a", [{"field": "category", "op": "in", "value": ["SC"]}]),
        make_scheme("b", [{"field": "category", "op": "in", "value": ["ST"]}]),
        make_scheme("c", [{"field": "category", "op": "==", "value": "OBC"}]),
        make_scheme("d", [{"field": "annual_family_income_inr", "op": "<=", "value": 250000}]),
    ]
    question = next_question(schemes, {})
    assert question["field"] == "category"
    assert question["choices"] == ["GEN", "OBC", "SC", "ST", "EWS"]
    assert question["resolves_estimate"] == 3


def test_tie_goes_to_the_cheaper_question():
    schemes = [
        make_scheme("a", [{"field": "last_exam_marks_pct", "op": ">=", "value": 60}]),
        make_scheme("b", [{"field": "state_of_domicile", "op": "==", "value": "Karnataka"}]),
    ]
    assert next_question(schemes, {})["field"] == "state_of_domicile"


def test_done_when_nothing_is_unknown(schemes, profiles):
    assert next_question(schemes, profiles["eligible-several"]) == {
        "field": None,
        "question": "",
        "choices": None,
        "resolves_estimate": 0,
    }


def test_question_text_in_each_language(schemes):
    for lang in ("en", "hi", "kn"):
        question = next_question(schemes, {}, lang)
        assert question["question"] == FIELDS[question["field"]].question[lang]


def test_interview_converges_for_every_profile(schemes, profiles):
    """Answering with each synthetic student's values settles every scheme in few questions."""
    full = profiles["eligible-several"]
    for truth in (full, profiles["near-miss"], profiles["merit-and-welfare"]):
        known: dict = {}
        asked = []
        while (question := next_question(schemes, known))["field"]:
            field = question["field"]
            assert field not in asked, "a field must not be asked twice"
            asked.append(field)
            known[field] = truth.get(field, full[field])
        assert len(asked) <= 8
        assert all(r["verdict"] != "unknown" for r in evaluate_all(schemes, known))


def test_text_field_offers_scheme_values_as_choices():
    schemes = [make_scheme("a", [{"field": "course", "op": "in", "value": ["BE-CSE", "BE-ECE"]}])]
    assert next_question(schemes, {})["choices"] == ["BE-CSE", "BE-ECE", "Other"]
