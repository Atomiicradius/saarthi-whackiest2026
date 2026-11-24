import json

import pytest
from conftest import make_scheme

from saarthi_engine import SchemeError, check_value, load_schemes, validate_scheme


def test_example_fixture_loads(schemes):
    assert len(schemes) == 8


def test_record_without_source_is_skipped(tmp_path):
    path = tmp_path / "schemes.json"
    path.write_text(json.dumps([make_scheme("ok", []), make_scheme("nosource", [], source_url="")]))
    loaded, skipped = load_schemes(path)
    assert [s["id"] for s in loaded] == ["ok"]
    assert skipped == ["nosource"]


@pytest.mark.parametrize(
    "criterion",
    [
        {"field": "caste", "op": "==", "value": "SC"},
        {"field": "category", "op": "~=", "value": "SC"},
        {"field": "category", "op": "<=", "value": 3},
        {"field": "category", "op": "in", "value": "SC"},
        {"field": "category", "op": "in", "value": ["sc"]},
        {"field": "disability", "op": "==", "value": "yes"},
        {"field": "annual_family_income_inr", "op": "<="},
    ],
)
def test_bad_criteria_fail_loudly(criterion):
    with pytest.raises(SchemeError):
        validate_scheme(make_scheme("bad", [criterion]))


def test_duplicate_ids_fail(tmp_path):
    path = tmp_path / "schemes.json"
    path.write_text(json.dumps([make_scheme("x", []), make_scheme("x", [])]))
    with pytest.raises(SchemeError):
        load_schemes(path)


@pytest.mark.parametrize(
    ("field", "value"),
    [
        ("disability", "Yes"),
        ("year_of_study", True),
        ("annual_family_income_inr", -1),
        ("last_exam_marks_pct", 101),
        ("gender", "Female"),
        ("not_a_field", 1),
    ],
)
def test_invalid_profile_values(field, value):
    with pytest.raises(ValueError):
        check_value(field, value)
