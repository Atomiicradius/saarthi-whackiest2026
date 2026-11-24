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


async def speak(text: str) -> bytes:
    key = _key()
    voice_id = os.environ.get("ELEVENLABS_VOICE_ID", "")
    if not voice_id:
        raise VoiceUnavailable("ELEVENLABS_VOICE_ID is not set")
    # Multilingual models pick the language from the text itself, so `lang` is not sent: some
    # models reject an explicit language_code. Set ELEVENLABS_TTS_MODEL to one that speaks Kannada.
    body = {"text": text, "model_id": os.environ.get("ELEVENLABS_TTS_MODEL", "eleven_flash_v2_5")}
    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        response = await client.post(
            f"{ELEVENLABS}/text-to-speech/{voice_id}",
            headers={"xi-api-key": key, "accept": "audio/mpeg"},
            json=body,
        )
    if response.status_code != 200:
        raise VoiceUnavailable(f"Text-to-speech failed with status {response.status_code}")
    return response.content
