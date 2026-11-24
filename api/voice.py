"""ElevenLabs proxy for /voice/transcribe and /voice/speak.

The API key stays here and never reaches the browser. Audio is streamed through in memory and is
never written to disk or logged.
"""

from __future__ import annotations

import os

import httpx

ELEVENLABS = "https://api.elevenlabs.io/v1"
TIMEOUT = httpx.Timeout(30.0)
# ElevenLabs takes ISO 639-3 language codes.
LANGUAGE_CODES = {"en": "eng", "hi": "hin", "kn": "kan"}
MAX_AUDIO_BYTES = 10 * 1024 * 1024


class VoiceUnavailable(Exception):
    """No API key configured, or ElevenLabs refused the call."""


def _key() -> str:
    key = os.environ.get("ELEVENLABS_API_KEY", "")
    if not key or key == "your-key-here":
        raise VoiceUnavailable("Voice is not configured on this server")
    return key


async def transcribe(audio: bytes, filename: str, content_type: str, lang: str) -> str:
    key = _key()
    form = {"model_id": os.environ.get("ELEVENLABS_STT_MODEL", "scribe_v1")}
    if lang in LANGUAGE_CODES:
        form["language_code"] = LANGUAGE_CODES[lang]
    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        response = await client.post(
            f"{ELEVENLABS}/speech-to-text",
            headers={"xi-api-key": key},
            data=form,
            files={"file": (filename, audio, content_type)},
        )
    if response.status_code != 200:
        raise VoiceUnavailable(f"Speech-to-text failed with status {response.status_code}")
    return str(response.json().get("text", ""))


def tts_model(lang: str) -> str:
    # Tested 2026-11-24: flash v2.5 speaks English and Hindi well but turns Kannada into
    # anglicised gibberish, while eleven_v3 speaks Kannada that transcribes back word for word.
    if lang == "kn":
        return os.environ.get("ELEVENLABS_TTS_MODEL_KN", "eleven_v3")
    return os.environ.get("ELEVENLABS_TTS_MODEL", "eleven_flash_v2_5")


async def speak(text: str, lang: str) -> bytes:
    key = _key()
    voice_id = os.environ.get("ELEVENLABS_VOICE_ID", "")
    if not voice_id:
        raise VoiceUnavailable("ELEVENLABS_VOICE_ID is not set")
    # The model picks the language from the text itself, so no language_code is sent: some models
    # reject one.
    body = {"text": text, "model_id": tts_model(lang)}
    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        response = await client.post(
            f"{ELEVENLABS}/text-to-speech/{voice_id}",
            headers={"xi-api-key": key, "accept": "audio/mpeg"},
            json=body,
        )
    if response.status_code != 200:
        raise VoiceUnavailable(f"Text-to-speech failed with status {response.status_code}")
    return response.content
