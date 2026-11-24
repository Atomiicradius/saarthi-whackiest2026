"""Request and response models. They mirror context/data-and-contracts.md sections 2, 6, 7 and 8."""

from __future__ import annotations

from typing import Any, Literal

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    StrictBool,
    StrictFloat,
    StrictInt,
    StrictStr,
    field_validator,
)
from saarthi_engine import check_value

Lang = Literal["en", "hi", "kn"]
FieldValue = StrictBool | StrictInt | StrictFloat | StrictStr | None

BASE64 = r"^[A-Za-z0-9+/]*={0,2}$"
HEX64 = r"^[0-9a-f]{64}$"


class Strict(BaseModel):
    model_config = ConfigDict(extra="forbid")


class ProfileField(Strict):
    value: FieldValue = None
    source: Literal["voice", "tap", "manual"] | None = None
    confirmed: bool | None = None


class Profile(Strict):
    state_of_domicile: ProfileField | None = None
    category: ProfileField | None = None
    minority_community: ProfileField | None = None
    gender: ProfileField | None = None
    disability: ProfileField | None = None
    annual_family_income_inr: ProfileField | None = None
    course: ProfileField | None = None
    course_level: ProfileField | None = None
    year_of_study: ProfileField | None = None
    institution_type: ProfileField | None = None
    last_exam_marks_pct: ProfileField | None = None

    @field_validator("*")
    @classmethod
    def _value_fits_field(cls, entry: ProfileField | None, info: Any) -> ProfileField | None:
        if entry is not None:
            check_value(info.field_name, entry.value)
        return entry

    def engine_values(self) -> dict[str, Any]:
        """Plain values for the engine. An answer the student has not confirmed yet (read-back
        pending, `confirmed: false`) counts as unknown, so it cannot change a verdict."""
        return {
            name: entry.value
            for name, entry in self
            if entry is not None and entry.value is not None and entry.confirmed is not False
        }


class ProfileRequest(Strict):
    profile: Profile


class InterviewRequest(Strict):
    profile: Profile
    lang: Lang = "en"


class SlotsRequest(Strict):
    transcript: str = Field(max_length=2000)
    expecting_field: str | None = None
    lang: str = "en"


class SpeakRequest(Strict):
    text: str = Field(min_length=1, max_length=1000)
    lang: Lang = "en"


class Kdf(Strict):
    alg: Literal["PBKDF2-SHA256"]
    iterations: int = Field(ge=100_000, le=10_000_000)
    salt: str = Field(pattern=BASE64, min_length=1, max_length=128)


class WrappedDek(Strict):
    nonce: str = Field(pattern=BASE64, min_length=16, max_length=16)
    ciphertext: str = Field(pattern=BASE64, min_length=1, max_length=128)


class EncryptedData(Strict):
    alg: Literal["AES-256-GCM"]
    nonce: str = Field(pattern=BASE64, min_length=16, max_length=16)
    # About 15 MB of base64; the vault only stores scans and PDFs.
    ciphertext: str = Field(pattern=BASE64, min_length=1, max_length=20_000_000)


class VaultBlob(Strict):
    v: Literal[1]
    kdf: Kdf
    wrapped_dek: WrappedDek
    data: EncryptedData
    aad: str = Field(min_length=1, max_length=256)


class AuditHead(Strict):
    idx: int = Field(ge=0)
    hash: str = Field(pattern=HEX64)
