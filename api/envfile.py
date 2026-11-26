"""Loads api/.env (and ../.env) into the environment, without any extra dependency.

Paths are relative to this file, not to the folder uvicorn starts in. Variables that are already
set in the real environment win, so `--env-file` and shell exports still work. Values are never
logged.
"""

from __future__ import annotations

import os
from pathlib import Path

HERE = Path(__file__).resolve().parent
ENV_FILES = (HERE / ".env", HERE.parent / ".env")


def parse(text: str) -> dict[str, str]:
    values: dict[str, str] = {}
    for raw in text.splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        name, _, value = line.partition("=")
        name = name.removeprefix("export ").strip()
        value = value.strip()
        if len(value) >= 2 and value[0] == value[-1] and value[0] in "\"'":
            value = value[1:-1]
        elif " #" in value:
            value = value.split(" #", 1)[0].rstrip()
        if name:
            values[name] = value
    return values


def load(files: tuple[Path, ...] = ENV_FILES) -> list[Path]:
    """Returns the files that were read."""
    read: list[Path] = []
    for path in files:
        try:
            values = parse(path.read_text(encoding="utf-8-sig"))
        except OSError:
            continue
        read.append(path)
        for name, value in values.items():
            os.environ.setdefault(name, value)
    return read
