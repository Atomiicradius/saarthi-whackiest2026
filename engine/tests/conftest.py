import json
from pathlib import Path

import pytest

HERE = Path(__file__).parent
REPO = HERE.parent.parent


@pytest.fixture
def schemes():
    from saarthi_engine import load_schemes

    loaded, _ = load_schemes(HERE / "fixtures" / "example_schemes.json")
    return loaded


@pytest.fixture
def profiles():
    data = json.loads((REPO / "data" / "test_profiles.json").read_text(encoding="utf-8"))
    return {item["id"]: item["profile"] for item in data["profiles"]}


def make_scheme(scheme_id, criteria, **overrides):
    """A minimal valid scheme record for tests that need their own data."""
    scheme = {
        "id": scheme_id,
        "name": scheme_id.upper(),
        "provider": "central",
        "portal": "other",
        "scheme_type": "welfare",
        "level": ["UG"],
        "amount_inr_per_year": 10000,
        "deadline": None,
        "application_window": None,
        "criteria": criteria,
        "docs_required": [],
        "exclusive_with": [],
        "portal_url": "https://example.invalid",
        "source_url": "https://example.invalid/source",
        "confidence": 0.9,
        "last_verified": "2026-11-24",
        "notes": "",
    }
    scheme.update(overrides)
    return scheme
