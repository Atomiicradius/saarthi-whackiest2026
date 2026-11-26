"""ElevenLabs proxy for /voice/transcribe and /voice/speak.

The API key stays here and never reaches the browser. Recorded answers (transcribe) stay in memory
and are never written to disk or logged. Generated speech is cached on disk, keyed by a hash of the
guide text, voice and language, so a repeated line is served without calling ElevenLabs. Only the
bubble text is ever sent for speech, never profile values.
"""

from __future__ import annotations

import hashlib
import os
from pathlib import Path

import httpx

ELEVENLABS = os.environ.get("ELEVENLABS_BASE_URL", "https://api.elevenlabs.io/v1")
TIMEOUT = httpx.Timeout(30.0)
# ElevenLabs takes ISO 639-3 language codes.
LANGUAGE_CODES = {"en": "eng", "hi": "hin", "kn": "kan"}
MAX_AUDIO_BYTES = 10 * 1024 * 1024
# On-disk speech cache (git-ignored folder). The oldest files go first when it is over the cap.
DEFAULT_CACHE_DIR = Path(__file__).resolve().parent / ".speech-cache"
CACHE_MAX_BYTES = 50 * 1024 * 1024


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


def cache_dir() -> Path:
    return Path(os.environ.get("SAARTHI_SPEECH_CACHE") or DEFAULT_CACHE_DIR)


def cache_path(text: str, voice_id: str, lang: str) -> Path:
    digest = hashlib.sha256(f"{voice_id}|{lang}|{text}".encode()).hexdigest()
    return cache_dir() / f"{digest}.mp3"


def _store(path: Path, audio: bytes) -> None:
    """Best effort: a cache failure must never fail the request."""
    try:
        path.parent.mkdir(parents=True, exist_ok=True)
        temp = path.with_suffix(".tmp")
        temp.write_bytes(audio)
        temp.replace(path)
        files = sorted(path.parent.glob("*.mp3"), key=lambda f: f.stat().st_mtime)
        total = sum(f.stat().st_size for f in files)
        while files and total > CACHE_MAX_BYTES:
            oldest = files.pop(0)
            total -= oldest.stat().st_size
            oldest.unlink(missing_ok=True)
    except OSError:
        pass


async def speak(text: str, lang: str) -> tuple[bytes, bool]:
    """Returns (audio, from_cache)."""
    voice_id = os.environ.get("ELEVENLABS_VOICE_ID", "")
    path = cache_path(text, voice_id, lang)
    try:
        if path.is_file():
            path.touch()  # most recently used stays longest
            return path.read_bytes(), True
    except OSError:
        pass
    key = _key()
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
    _store(path, response.content)
    return response.content, False
