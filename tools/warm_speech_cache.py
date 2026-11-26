"""Pre-generate guide speech for the demo path, so the pitch plays from the API's disk cache.

Run once before the pitch, with the API running and a key in .env:
    python tools/warm_speech_cache.py [--api http://localhost:8000] [--langs en,hi,kn]
It asks POST /api/voice/speak for each guide bubble on the demo path: the landing greeting, the
state question, every interview question, "That is all we need", the results summary for the sample
student (Priya), the vault and server-view bubbles, and the audit bubbles. Only bubble text is sent.
Needs the engine installed (pip install -e engine) for the interview question text.
"""

import argparse
import json
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

from saarthi_engine.fields import FIELDS

ROOT = Path(__file__).resolve().parent.parent
I18N = ROOT / "web" / "i18n"
# What the results bubble says for the sample student: one scheme in the plan worth this much.
PLAN_COUNT = 1
PLAN_TOTAL = "₹50,000"


def fill(text: str, **values: object) -> str:
    for key, value in values.items():
        text = text.replace("{" + key + "}", str(value))
    return text


def lookup(strings: dict, path: str) -> str:
    node = strings
    for part in path.split("."):
        node = node[part]
    return node


def bubbles(lang: str) -> list[str]:
    strings = json.loads((I18N / f"{lang}.json").read_text(encoding="utf-8"))
    en = json.loads((I18N / "en.json").read_text(encoding="utf-8"))

    def get(path: str, **values: object) -> str:
        try:
            return fill(lookup(strings, path), **values)
        except KeyError:  # English fallback, as the app does
            return fill(lookup(en, path), **values)

    lines = [
        get("landing.guideHello"),
        get("interview.stateQuestion"),
        *[field.question.get(lang) or field.question["en"] for field in FIELDS.values()],
        f"{get('interview.done')}. {get('interview.doneBody')}",
        get("results.guideOne", count=PLAN_COUNT, total=PLAN_TOTAL),
        get("results.guide", count=2, total=PLAN_TOTAL),
        get("vault.guide"),
        get("serverView.guide"),
        get("audit.guide"),
        get("audit.guideOk"),
        get("audit.guideBroken", idx=1),
    ]
    return list(dict.fromkeys(lines))  # no repeats


def speak(api: str, text: str, lang: str) -> tuple[bool, float, str]:
    request = urllib.request.Request(
        f"{api}/api/voice/speak",
        data=json.dumps({"text": text, "lang": lang}).encode(),
        headers={"Content-Type": "application/json"},
    )
    started = time.perf_counter()
    try:
        with urllib.request.urlopen(request, timeout=60) as reply:
            reply.read()
            return True, time.perf_counter() - started, reply.headers.get("X-Speech-Cache", "")
    except urllib.error.HTTPError as error:
        return False, time.perf_counter() - started, f"HTTP {error.code}"
    except OSError as error:
        return False, time.perf_counter() - started, str(error)


def main() -> int:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")  # Windows consoles
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--api", default="http://localhost:8000")
    parser.add_argument("--langs", default="en")
    args = parser.parse_args()
    failed = 0
    for lang in args.langs.split(","):
        for text in bubbles(lang):
            ok, seconds, note = speak(args.api.rstrip("/"), text, lang)
            failed += not ok
            print(f"[{lang}] {'ok  ' if ok else 'FAIL'} {seconds:5.2f}s {note:5} {text[:60]}")
    print("done" if not failed else f"{failed} lines failed (is the key set?)")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
