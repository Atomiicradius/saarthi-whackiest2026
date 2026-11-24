import base64
import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

REPO = Path(__file__).resolve().parents[2]
FIXTURE = REPO / "engine" / "tests" / "fixtures" / "example_schemes.json"
RAVI = json.loads((REPO / "web" / "mocks" / "ravi.profile.json").read_text(encoding="utf-8"))


@pytest.fixture
def client(monkeypatch):
    monkeypatch.setenv("SAARTHI_SCHEMES_PATH", str(FIXTURE))
    monkeypatch.setenv("SAARTHI_TODAY", "2026-11-24")
    monkeypatch.delenv("ELEVENLABS_API_KEY", raising=False)
    from main import app

    with TestClient(app) as test_client:
        yield test_client


def b64(size: int) -> str:
    return base64.b64encode(bytes(size)).decode()


def blob() -> dict:
    return {
        "v": 1,
        "kdf": {"alg": "PBKDF2-SHA256", "iterations": 600000, "salt": b64(16)},
        "wrapped_dek": {"nonce": b64(12), "ciphertext": b64(48)},
        "data": {"alg": "AES-256-GCM", "nonce": b64(12), "ciphertext": b64(100)},
        "aad": "doc-1|demo-user",
    }


def assert_error(response, status, code):
    assert response.status_code == status
    assert response.json()["error"]["code"] == code


def test_schemes_hide_notes(client):
    schemes = client.get("/api/schemes").json()
    assert len(schemes) == 8
    assert all("notes" not in scheme for scheme in schemes)


def test_unknown_route_uses_error_shape(client):
    assert_error(client.get("/api/nope"), 404, "not_found")


def test_evaluate_ravi(client):
    results = client.post("/api/eligibility/evaluate", json={"profile": RAVI}).json()["results"]
    verdicts = {r["scheme_id"]: r["verdict"] for r in results}
    assert verdicts["example-merit-a"] == "eligible"
    assert verdicts["example-welfare-h"] == "ineligible"


def test_unconfirmed_answer_does_not_count(client):
    profile = {"category": {"value": "SC", "source": "voice", "confirmed": False}}
    results = client.post("/api/eligibility/evaluate", json={"profile": profile}).json()["results"]
    welfare_h = next(r for r in results if r["scheme_id"] == "example-welfare-h")
    assert welfare_h["verdict"] == "unknown"


@pytest.mark.parametrize(
    "profile",
    [
        {"disability": {"value": "Yes"}},
        {"category": {"value": "sc"}},
        {"annual_family_income_inr": {"value": "240000"}},
        {"caste": {"value": "SC"}},
    ],
)
def test_evaluate_rejects_bad_profiles(client, profile):
    response = client.post("/api/eligibility/evaluate", json={"profile": profile})
    assert_error(response, 422, "invalid_request")


def test_interview_next_and_done(client):
    first = client.post("/api/interview/next", json={"profile": {}, "lang": "kn"}).json()
    assert first["field"] is not None and first["resolves_estimate"] >= 1
    done = client.post("/api/interview/next", json={"profile": RAVI, "lang": "en"}).json()
    assert done["field"] is None


def test_interview_rejects_unknown_language(client):
    response = client.post("/api/interview/next", json={"profile": {}, "lang": "fr"})
    assert_error(response, 422, "invalid_request")


def test_optimize_ravi(client):
    plan = client.post("/api/optimize", json={"profile": RAVI}).json()
    assert plan["selected"][0] == "example-merit-a"
    assert plan["total_inr_per_year"] == 125000


def test_optimize_requires_profile(client):
    assert_error(client.post("/api/optimize", json={}), 422, "invalid_request")


def test_slots_extract_ravi_sentence(client):
    transcript = "I'm in second year engineering, we earn around two and a half lakh, OBC"
    fields = client.post(
        "/api/slots/extract",
        json={"transcript": transcript, "expecting_field": None, "lang": "en"},
    ).json()["fields"]
    values = {item["field"]: item["value"] for item in fields}
    assert values == {
        "annual_family_income_inr": 250000,
        "year_of_study": 2,
        "category": "OBC",
        "course_level": "UG",
    }


def test_slots_extract_rejects_huge_transcript(client):
    response = client.post("/api/slots/extract", json={"transcript": "a" * 3000})
    assert_error(response, 422, "invalid_request")


def test_voice_without_key_is_unavailable(client):
    response = client.post("/api/voice/speak", json={"text": "Hello", "lang": "en"})
    assert_error(response, 503, "voice_unavailable")
    response = client.post(
        "/api/voice/transcribe",
        files={"audio": ("a.webm", b"x", "audio/webm")},
        data={"lang": "kn"},
    )
    assert_error(response, 503, "voice_unavailable")


def test_voice_speak_proxies_audio(client, monkeypatch):
    import voice

    async def fake_speak(text):
        return b"ID3-fake-mp3"

    monkeypatch.setattr(voice, "speak", fake_speak)
    response = client.post("/api/voice/speak", json={"text": "Hello", "lang": "en"})
    assert response.status_code == 200
    assert response.headers["content-type"] == "audio/mpeg"


def test_voice_transcribe_needs_audio(client):
    assert_error(client.post("/api/voice/transcribe", data={"lang": "en"}), 422, "invalid_request")


def test_vault_blob_round_trip(client):
    assert client.put("/api/vault/blobs/doc-1", json=blob()).status_code == 204
    assert client.get("/api/vault/blobs/doc-1").json() == blob()


@pytest.mark.parametrize(
    "change",
    [
        {"plaintext": "hello"},
        {"v": 2},
        {"kdf": {"alg": "MD5", "iterations": 1, "salt": "x"}},
    ],
)
def test_vault_rejects_non_ciphertext(client, change):
    response = client.put("/api/vault/blobs/doc-1", json={**blob(), **change})
    assert_error(response, 422, "invalid_request")


def test_vault_missing_blob_and_bad_id(client):
    assert_error(client.get("/api/vault/blobs/missing"), 404, "not_found")
    assert_error(client.put("/api/vault/blobs/bad.id", json=blob()), 422, "invalid_request")


def test_audit_head_only_moves_forward(client):
    head = {"idx": 3, "hash": "a" * 64}
    assert client.put("/api/audit/head", json=head).status_code == 204
    assert client.put("/api/audit/head", json=head).status_code == 204
    assert_error(
        client.put("/api/audit/head", json={"idx": 3, "hash": "b" * 64}), 409, "head_conflict"
    )
    assert_error(
        client.put("/api/audit/head", json={"idx": 2, "hash": "c" * 64}), 409, "head_rewind"
    )
    assert client.put("/api/audit/head", json={"idx": 4, "hash": "d" * 64}).status_code == 204


def test_audit_head_rejects_bad_hash(client):
    response = client.put("/api/audit/head", json={"idx": 0, "hash": "not-hex"})
    assert_error(response, 422, "invalid_request")
