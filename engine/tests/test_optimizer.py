from datetime import date

from conftest import make_scheme

from saarthi_engine import optimize


def test_ravi_plan(schemes, profiles):
    plan = optimize(schemes, profiles["eligible-several"])
    assert plan["selected"] == [
        "example-merit-a",
        "example-welfare-c",
        "example-welfare-d",
        "example-welfare-g",
    ]
    assert plan["total_inr_per_year"] == 125000
    dropped = {item["scheme_id"]: item["reason"] for item in plan["dropped"]}
    assert dropped == {
        "example-welfare-e": "Application window is closed",
        "example-merit-b": "Only one merit scheme is allowed on NSP, and "
        "EXAMPLE Merit Scholarship A is worth more",
    }


def test_one_nsp_merit_plus_all_nsp_welfare(schemes, profiles):
    plan = optimize(schemes, profiles["merit-and-welfare"])
    chosen = {s["id"]: s for s in schemes if s["id"] in plan["selected"]}
    nsp_merits = [
        s for s in chosen.values() if s["portal"] == "nsp" and s["scheme_type"] == "merit"
    ]
    assert len(nsp_merits) == 1
    assert {"example-welfare-c", "example-welfare-f", "example-welfare-h"} <= set(chosen)


def test_merit_rule_does_not_limit_other_portals():
    state_merits = [
        make_scheme(f"m{i}", [], portal="other", scheme_type="merit", amount_inr_per_year=1000 * i)
        for i in (1, 2)
    ]
    assert optimize(state_merits, {})["selected"] == ["m2", "m1"]


def test_merit_tie_goes_to_earlier_deadline():
    late = make_scheme("late", [], portal="nsp", scheme_type="merit", deadline="2027-03-01")
    early = make_scheme("early", [], portal="nsp", scheme_type="merit", deadline="2027-01-01")
    plan = optimize([late, early], {})
    assert plan["selected"] == ["early"]
    assert plan["dropped"][0]["reason"].endswith("EARLY closes sooner")


INFERRED = "inferred from the scheme guidelines, check the notice"


def test_exclusive_pair_keeps_the_better_combination():
    a = make_scheme("a", [], amount_inr_per_year=30000, exclusive_with=["b"])
    b = make_scheme("b", [], amount_inr_per_year=20000)
    c = make_scheme("c", [], amount_inr_per_year=15000, exclusive_with=["a"])
    plan = optimize([a, b, c], {})
    # b + c (35,000) beats a alone (30,000).
    assert sorted(plan["selected"]) == ["b", "c"]
    assert plan["total_inr_per_year"] == 35000
    # No `exclusivity_source` in the data, so the pair is described as inferred.
    assert plan["dropped"] == [
        {
            "scheme_id": "a",
            "reason": f"Cannot be combined with B ({INFERRED})",
        }
    ]


def test_exclusive_pair_with_a_cited_source_is_an_official_rule():
    a = make_scheme(
        "a",
        [],
        amount_inr_per_year=30000,
        exclusive_with=["b"],
        exclusivity_source={"b": "https://x"},
    )
    b = make_scheme("b", [], amount_inr_per_year=40000, exclusive_with=["a"])
    plan = optimize([a, b], {})
    assert plan["selected"] == ["b"]
    assert plan["dropped"] == [
        {"scheme_id": "a", "reason": "Cannot be combined with B (official rule)"}
    ]


def test_window_past_today_counts_as_closed():
    scheme = make_scheme(
        "s",
        [],
        application_window={
            "ay": "2026-27",
            "opens": "2026-07-01",
            "closes": "2026-10-31",
            "status": "open",
        },
    )
    assert optimize([scheme], {}, today=date(2026, 11, 24))["selected"] == []
    assert optimize([scheme], {}, today=date(2026, 10, 1))["selected"] == ["s"]


def test_only_eligible_schemes_are_planned(schemes):
    assert optimize(schemes, {}) == {"selected": [], "total_inr_per_year": 0, "dropped": []}
