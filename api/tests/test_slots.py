import pytest

from slots import extract
from voice import tts_model


def values(transcript, expecting=None):
    return {item["field"]: item["value"] for item in extract(transcript, expecting)}


# The Hindi and Kannada lines are what ElevenLabs Scribe returned for our test audio on 2026-11-24.
@pytest.mark.parametrize(
    "transcript",
    [
        "I am in second year engineering. Our family income is two and a half lakh. I am OBC",
        "मैं engineering के दूसरे साल में हूं। हमारी पारिवारिक आय ढाई लाख है। मैं ओबीसी हूं",
        "ನಾನು ಇಂಜಿನಿಯರಿಂಗ್ ಎರಡನೇ ವರ್ಷದಲ್ಲಿದ್ದೇನೆ. ನಮ್ಮ ಕುಟುಂಬದ ಆದಾಯ ಎರಡೂವರೆ ಲಕ್ಷ. ನಾನು ಒಬಿಸಿ",
    ],
)
def test_same_answer_in_three_languages(transcript):
    assert values(transcript) == {
        "annual_family_income_inr": 250000,
        "year_of_study": 2,
        "category": "OBC",
        "course_level": "UG",
    }


@pytest.mark.parametrize(
    ("transcript", "expected"),
    [
        ("साढ़े तीन लाख", {"annual_family_income_inr": 350000}),
        ("डेढ़ लाख रुपये", {"annual_family_income_inr": 150000}),
        ("ಮೂರು ಲಕ್ಷ", {"annual_family_income_inr": 300000}),
        ("२,४०,००० रुपये", {"annual_family_income_inr": 240000}),
        ("ಶೇಕಡಾ 78 ಅಂಕಗಳು", {"last_exam_marks_pct": 78}),
        ("78 प्रतिशत", {"last_exam_marks_pct": 78}),
        ("मैं कर्नाटक से हूं", {"state_of_domicile": "Karnataka"}),
        ("ನಾನು ಕರ್ನಾಟಕದವನು", {"state_of_domicile": "Karnataka"}),
        ("अनुसूचित जनजाति", {"category": "ST"}),
        ("अनुसूचित जाति", {"category": "SC"}),
        ("ಪರಿಶಿಷ್ಟ ಜಾತಿ", {"category": "SC"}),
        ("ಸರ್ಕಾರಿ ಕಾಲೇಜು", {"institution_type": "govt"}),
        ("ನಾನು ಹುಡುಗಿ", {"gender": "F"}),
        ("मैं लड़का हूं", {"gender": "M"}),
    ],
)
def test_hindi_and_kannada_phrases(transcript, expected):
    assert values(transcript) == expected


def test_number_words_inside_other_words_are_ignored():
    # दो (two) is inside दोस्त (friend); it must not become a number.
    assert values("मेरा दोस्त", "annual_family_income_inr") == {}


def test_yes_no_in_hindi_and_kannada():
    assert values("ಹೌದು", "disability") == {"disability": True}
    assert values("नहीं", "minority_community") == {"minority_community": False}


def test_kannada_speech_uses_a_model_that_speaks_kannada(monkeypatch):
    monkeypatch.delenv("ELEVENLABS_TTS_MODEL", raising=False)
    monkeypatch.delenv("ELEVENLABS_TTS_MODEL_KN", raising=False)
    assert tts_model("kn") == "eleven_v3"
    assert tts_model("hi") == "eleven_flash_v2_5"
