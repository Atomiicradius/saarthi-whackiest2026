import pytest
from conftest import make_scheme

from saarthi_engine import evaluate_all, evaluate_scheme


@pytest.mark.parametrize(
    ("op", "expected", "actual", "status"),
    [
        ("==", "Karnataka", "Karnataka", "met"),
        ("==", "Karnataka", "Other", "failed"),
        ("!=", "Other", "Karnataka", "met"),
        ("!=", "Karnataka", "Karnataka", "failed"),
        ("in", ["Karnataka"], "Karnataka", "met"),
        ("in", ["Karnataka"], "Other", "failed"),
        ("not_in", ["Other"], "Karnataka", "met"),
        ("not_in", ["Karnataka"], "Karnataka", "failed"),
        ("exists", None, "Karnataka", "met"),
    ],
)
def test_text_operators(op, expected, actual, status):
    scheme = make_scheme("s", [{"field": "state_of_domicile", "op": op, "value": expected}])
    result = evaluate_scheme(scheme, {"state_of_domicile": actual})
    assert result["reasons"][0]["status"] == status


@pytest.mark.parametrize(
    ("op", "limit", "actual", "status"),
    [
        ("<", 100, 99, "met"),
        ("<", 100, 100, "failed"),
        ("<=", 100, 100, "met"),
        ("<=", 100, 101, "failed"),
        (">", 100, 101, "met"),
        (">", 100, 100, "failed"),
        (">=", 100, 100, "met"),
        (">=", 100, 99, "failed"),
    ],
)
def test_numeric_operators(op, limit, actual, status):
    scheme = make_scheme("s", [{"field": "annual_family_income_inr", "op": op, "value": limit}])
    result = evaluate_scheme(scheme, {"annual_family_income_inr": actual})
    assert result["reasons"][0]["status"] == status


def test_missing_field_is_unknown_for_every_operator():
    scheme = make_scheme("s", [{"field": "category", "op": "exists"}])
    result = evaluate_scheme(scheme, {"category": None})
    assert result["verdict"] == "unknown"
    assert result["missing_fields"] == ["category"]


def test_verdict_paths():
    scheme = make_scheme(
        "s",
        [
            {"field": "category", "op": "in", "value": ["SC", "ST"]},
            {"field": "annual_family_income_inr", "op": "<=", "value": 250000},
        ],
    )
    assert (
        evaluate_scheme(scheme, {"category": "SC", "annual_family_income_inr": 1})["verdict"]
        == "eligible"
    )
    assert evaluate_scheme(scheme, {"category": "SC"})["verdict"] == "unknown"
    # One failure makes it ineligible even while another field is unknown.
    assert evaluate_scheme(scheme, {"category": "GEN"})["verdict"] == "ineligible"


def test_reasons_are_readable(schemes, profiles):
    results = {r["scheme_id"]: r for r in evaluate_all(schemes, profiles["eligible-several"])}
    details = [reason["detail"] for reason in results["example-merit-a"]["reasons"]]
    assert details == [
        "Marks 78.5% meets the 75% minimum",
        "Income ₹2.4 lakh is within the ₹8 lakh limit",
    ]


def test_eligible_several(schemes, profiles):
    results = {r["scheme_id"]: r for r in evaluate_all(schemes, profiles["eligible-several"])}
    eligible = {sid for sid, r in results.items() if r["verdict"] == "eligible"}
    assert eligible == {
        "example-merit-a",
        "example-merit-b",
        "example-welfare-c",
        "example-welfare-d",
        "example-welfare-e",
        "example-welfare-g",
    }
    assert results["example-welfare-h"]["verdict"] == "ineligible"
    assert "near_miss" not in results["example-welfare-h"]


def test_near_miss_income_and_marks(schemes, profiles):
    results = {r["scheme_id"]: r for r in evaluate_all(schemes, profiles["near-miss"])}
    assert results["example-welfare-c"]["near_miss"] == {
        "field": "annual_family_income_inr",
        "gap": "Income is ₹15,000 above the limit",
        "fixable": False,
    }
    assert (
        results["example-merit-a"]["near_miss"]["gap"] == "Marks are 3 points below the 75% needed"
    )
    # 45,000 over a 2.2 lakh cap is more than 20% of the cap, so it is not "almost".
    assert results["example-welfare-f"]["verdict"] == "ineligible"
    assert "near_miss" not in results["example-welfare-f"]


def test_two_failures_are_not_a_near_miss():
    scheme = make_scheme(
        "s",
        [
            {"field": "annual_family_income_inr", "op": "<=", "value": 100000},
            {"field": "last_exam_marks_pct", "op": ">=", "value": 60},
        ],
    )
    result = evaluate_scheme(
        scheme, {"annual_family_income_inr": 101000, "last_exam_marks_pct": 59}
    )
    assert result["verdict"] == "ineligible"
    assert "near_miss" not in result


def test_evaluation_is_deterministic(schemes, profiles):
    profile = profiles["near-miss"]
    assert evaluate_all(schemes, profile) == evaluate_all(schemes, profile)


# A scheme blocked only by questions nobody has answered is "almost" and fixable: answering them
# can settle it. A failed criterion is never fixable, even when unanswered questions remain too.
INCOME_CAP = {"field": "annual_family_income_inr", "op": "<=", "value": 250000}
FEMALE_ONLY = {"field": "gender", "op": "==", "value": "F"}
SC_ONLY = {"field": "category", "op": "==", "value": "SC"}


def test_one_unknown_field_only_is_fixable():
    scheme = make_scheme("s", [INCOME_CAP, FEMALE_ONLY])
    result = evaluate_scheme(scheme, {"annual_family_income_inr": 100000})
    assert result["verdict"] == "unknown"
    assert result["near_miss"] == {
        "field": "gender",
        "gap": "Answer this question to find out: What is your gender?",
        "fixable": True,
    }


def test_several_unknown_fields_are_listed_and_fixable():
    scheme = make_scheme("s", [FEMALE_ONLY, SC_ONLY])
    near = evaluate_scheme(scheme, {})["near_miss"]
    assert near["fixable"] is True
    assert near["field"] == "gender"
    assert near["gap"].startswith("Answer these questions to find out: ")
    assert near["gap"].count(";") == 1


def test_a_failed_criterion_is_never_fixable():
    scheme = make_scheme("s", [INCOME_CAP])
    near_miss_income = evaluate_scheme(scheme, {"annual_family_income_inr": 270000})
    assert near_miss_income["verdict"] == "ineligible"
    assert near_miss_income["near_miss"]["fixable"] is False
    wrong_category = evaluate_scheme(make_scheme("t", [SC_ONLY]), {"category": "GEN"})
    assert "near_miss" not in wrong_category


def test_a_failed_criterion_plus_an_unknown_field_is_not_fixable():
    income_and_gender = make_scheme("s", [INCOME_CAP, FEMALE_ONLY])
    over = evaluate_scheme(income_and_gender, {"annual_family_income_inr": 270000})
    assert over["verdict"] == "ineligible"
    assert over["near_miss"]["fixable"] is False
    assert over["near_miss"]["field"] == "annual_family_income_inr"
    category_and_gender = make_scheme("t", [SC_ONLY, FEMALE_ONLY])
    wrong = evaluate_scheme(category_and_gender, {"category": "GEN"})
    assert wrong["verdict"] == "ineligible"
    assert "near_miss" not in wrong


def test_a_fully_answered_profile_is_unchanged():
    scheme = make_scheme("s", [INCOME_CAP, FEMALE_ONLY])
    eligible = evaluate_scheme(scheme, {"annual_family_income_inr": 100000, "gender": "F"})
    assert eligible["verdict"] == "eligible"
    assert "near_miss" not in eligible
    ineligible = evaluate_scheme(scheme, {"annual_family_income_inr": 100000, "gender": "M"})
    assert ineligible["verdict"] == "ineligible"
    assert "near_miss" not in ineligible
