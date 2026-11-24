"""Saarthi API (section 6 of context/data-and-contracts.md).

Run from this directory: `uvicorn main:app --reload --env-file ../.env`.
Never log request bodies: only event names and ids.
"""

from __future__ import annotations

import logging
import os
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from datetime import date
from pathlib import Path
from typing import Annotated, Any

from fastapi import FastAPI, File, Form, Request, Response, UploadFile
from fastapi import Path as PathParam
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from saarthi_engine import evaluate_all, load_schemes, next_question, optimize
from starlette.exceptions import HTTPException as StarletteHTTPException

import slots
import voice
from models import (
    AuditHead,
    InterviewRequest,
    ProfileRequest,
    SlotsRequest,
    SpeakRequest,
    VaultBlob,
)

log = logging.getLogger("saarthi.api")
REPO = Path(__file__).resolve().parent.parent
BLOB_ID = r"^[A-Za-z0-9_-]{1,128}$"
MAX_BLOBS = 500


class ApiError(Exception):
    def __init__(self, status: int, code: str, message: str) -> None:
        super().__init__(message)
        self.status, self.code, self.message = status, code, message


def _error(status: int, code: str, message: str) -> JSONResponse:
    return JSONResponse(status_code=status, content={"error": {"code": code, "message": message}})


def _today() -> date | None:
    # SAARTHI_TODAY pins "today" for demos; unset means the real date.
    text = os.environ.get("SAARTHI_TODAY")
    return date.fromisoformat(text) if text else date.today()


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    path = Path(os.environ.get("SAARTHI_SCHEMES_PATH", REPO / "data" / "schemes.json"))
    if not path.is_file():
        raise RuntimeError(
            f"Scheme dataset not found at {path}. Set SAARTHI_SCHEMES_PATH (the example fixture is "
            "engine/tests/fixtures/example_schemes.json)."
        )
    schemes, skipped = load_schemes(path)
    app.state.schemes = schemes
    # In memory only for round 1: ciphertext blobs and the latest audit head.
    app.state.blobs = {}
    app.state.audit_head = None
    log.info("schemes_loaded count=%d skipped_no_source=%d", len(schemes), len(skipped))
    yield


app = FastAPI(title="Saarthi API", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.environ.get("SAARTHI_CORS_ORIGINS", "http://localhost:3000").split(","),
    allow_methods=["GET", "POST", "PUT"],
    allow_headers=["Content-Type"],
)


@app.exception_handler(ApiError)
async def _api_error(_: Request, error: ApiError) -> JSONResponse:
    return _error(error.status, error.code, error.message)


@app.exception_handler(RequestValidationError)
async def _invalid(_: Request, error: RequestValidationError) -> JSONResponse:
    first = error.errors()[0]
    where = ".".join(str(part) for part in first["loc"] if part != "body")
    return _error(422, "invalid_request", f"{where}: {first['msg']}" if where else first["msg"])


@app.exception_handler(StarletteHTTPException)
async def _http(_: Request, error: StarletteHTTPException) -> JSONResponse:
    code = {404: "not_found", 405: "method_not_allowed"}.get(error.status_code, "http_error")
    return _error(error.status_code, code, str(error.detail))


def _schemes(request: Request) -> list[dict[str, Any]]:
    return request.app.state.schemes


@app.get("/api/schemes")
def list_schemes(request: Request) -> list[dict[str, Any]]:
    return [{k: v for k, v in s.items() if k != "notes"} for s in _schemes(request)]


@app.post("/api/eligibility/evaluate")
def evaluate(body: ProfileRequest, request: Request) -> dict[str, Any]:
    return {"results": evaluate_all(_schemes(request), body.profile.engine_values())}


@app.post("/api/interview/next")
def interview_next(body: InterviewRequest, request: Request) -> dict[str, Any]:
    return next_question(_schemes(request), body.profile.engine_values(), body.lang)


@app.post("/api/optimize")
def optimize_plan(body: ProfileRequest, request: Request) -> dict[str, Any]:
    return optimize(_schemes(request), body.profile.engine_values(), today=_today())


@app.post("/api/slots/extract")
def extract_slots(body: SlotsRequest) -> dict[str, Any]:
    return {"fields": slots.extract(body.transcript, body.expecting_field)}


@app.post("/api/voice/transcribe")
async def transcribe(
    audio: Annotated[UploadFile, File()], lang: Annotated[str, Form()] = "en"
) -> dict[str, str]:
    data = await audio.read(voice.MAX_AUDIO_BYTES + 1)
    if len(data) > voice.MAX_AUDIO_BYTES:
        raise ApiError(413, "audio_too_large", "Audio must be under 10 MB")
    try:
        text = await voice.transcribe(
            data, audio.filename or "audio", audio.content_type or "audio/webm", lang
        )
    except voice.VoiceUnavailable as error:
        raise ApiError(503, "voice_unavailable", str(error)) from error
    finally:
        del data
    return {"text": text}


@app.post("/api/voice/speak")
async def speak(body: SpeakRequest) -> Response:
    try:
        audio = await voice.speak(body.text, body.lang)
    except voice.VoiceUnavailable as error:
        raise ApiError(503, "voice_unavailable", str(error)) from error
    return Response(content=audio, media_type="audio/mpeg")


BlobId = Annotated[str, PathParam(pattern=BLOB_ID)]


@app.put("/api/vault/blobs/{blob_id}", status_code=204)
def put_blob(blob_id: BlobId, blob: VaultBlob, request: Request) -> Response:
    blobs: dict[str, dict[str, Any]] = request.app.state.blobs
    if blob_id not in blobs and len(blobs) >= MAX_BLOBS:
        raise ApiError(507, "storage_full", "The demo store is full")
    blobs[blob_id] = blob.model_dump()
    log.info("blob_stored id=%s", blob_id)
    return Response(status_code=204)


@app.get("/api/vault/blobs/{blob_id}")
def get_blob(blob_id: BlobId, request: Request) -> dict[str, Any]:
    blob = request.app.state.blobs.get(blob_id)
    if blob is None:
        raise ApiError(404, "not_found", "No blob with that id")
    return blob


@app.put("/api/audit/head", status_code=204)
def put_audit_head(head: AuditHead, request: Request) -> Response:
    # The head only moves forward. A different hash at an index we already hold means the log was
    # rewritten after it was anchored, which is exactly what this record exists to catch.
    current: AuditHead | None = request.app.state.audit_head
    if current is not None:
        if head.idx < current.idx:
            raise ApiError(409, "head_rewind", "Audit head cannot move backwards")
        if head.idx == current.idx and head.hash != current.hash:
            raise ApiError(
                409, "head_conflict", "A different hash is already anchored at this index"
            )
    request.app.state.audit_head = head
    log.info("audit_head_stored idx=%d", head.idx)
    return Response(status_code=204)
