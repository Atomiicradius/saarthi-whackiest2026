# Data and contracts

Code must conform to this file. If you change a schema or endpoint, update this file in the same task.

All money is INR per year unless stated. All dates are ISO 8601 (`YYYY-MM-DD`). `null` means unknown or not applicable, as noted.

## 1. Scheme record (`/data/schemes.json`)

```jsonc
{
  "id": "example-scheme-001",            // stable slug
  "name": "EXAMPLE scheme name",
  "provider": "central | karnataka | other",
  "portal": "nsp | other",                // the merit/welfare rule in section 5 applies to nsp only
  "scheme_type": "merit | welfare",       // drives the optimiser rule in section 5
  "level": ["UG"],                        // UG | PG | DIPLOMA
  "amount_inr_per_year": 0,               // number or null if unknown
  "deadline": "2026-12-31",               // or null; if application_window is set, its `closes` is authoritative
  "application_window": {                 // or null if unknown
    "ay": "2026-27",
    "opens": "2026-07-01",                // placeholder, YYYY-MM-DD
    "closes": "2026-10-31",               // placeholder, YYYY-MM-DD
    "status": "open | closed | upcoming"
  },
  "criteria": [                           // ALL must hold for eligibility
    { "field": "annual_family_income_inr", "op": "<=", "value": 250000 },
    { "field": "category", "op": "in", "value": ["SC", "ST"] }
  ],
  "docs_required": ["income_certificate", "caste_certificate", "marksheet"],
  "exclusive_with": [],                       // ONLY where an official source states the pair is exclusive; else empty
  "exclusivity_source": {},                    // optional: other scheme id -> source URL, only for pairs whose exclusivity an official source states; pairs without an entry are described as inferred
  "portal_url": "https://example.invalid",
  "source_url": "https://example.invalid",    // REQUIRED: official notice or guideline
  "confidence": 0.9,                          // 0..1, lower goes to human review
  "last_verified": "2026-11-24",
  "notes": ""
}
```

**The values above are placeholders.** Never invent real scheme criteria, amounts or deadlines. Populate only from official portals and guideline documents. Records without a `source_url` must not be loaded into the engine.

Supported operators: `==`, `!=`, `<`, `<=`, `>`, `>=`, `in`, `not_in`, `exists`.

**Application window (UI rules):**
- Eligibility is decided by `criteria` only. The window never changes a verdict.
- `status: "closed"` is shown as "Closed, opens around <month>" (month taken from the previous cycle's `opens`). Never show a closed scheme as upcoming.
- `status: "upcoming"` is only for a window whose opening date is officially announced.
- Known fact: NSP student applications for AY 2026-27 closed on 2026-10-31.
- Each window needs a source (the scheme's `source_url`). `status` is a snapshot as of `last_verified`; recompute it from `opens` and `closes` when the date matters.

## 2. Student profile

Every field is optional. `null` means unknown. Each value carries provenance.

```jsonc
{
  "state_of_domicile":        { "value": "Karnataka", "source": "voice|tap|manual", "confirmed": true },
  "category":                 { "value": "GEN|OBC|SC|ST|EWS|null" },
  "minority_community":       { "value": true },
  "gender":                   { "value": "F|M|O|null" },
  "disability":               { "value": false },
  "annual_family_income_inr": { "value": 240000 },
  "course":                   { "value": "BE-CSE" },
  "course_level":             { "value": "UG" },
  "year_of_study":            { "value": 2 },
  "institution_type":         { "value": "govt|aided|private" },
  "last_exam_marks_pct":      { "value": 78.5 }
}
```

Field names are the same strings used by scheme `criteria[].field`. Add a field here before using it in a criterion.

## 3. Eligibility result (per scheme)

```jsonc
{
  "scheme_id": "example-scheme-001",
  "verdict": "eligible | ineligible | unknown",
  "reasons": [
    { "field": "category", "status": "met | failed | unknown", "detail": "Category SC is in [SC, ST]" }
  ],
  "missing_fields": ["annual_family_income_inr"],
  "near_miss": {                          // only when ineligible by a small margin or one fixable item
    "field": "annual_family_income_inr",
    "gap": "Income exceeds the cap by 20000",
    "fixable": false
  }
}
```

**Verdict logic (tri-state):**
- `ineligible` if any criterion is `failed`.
- `unknown` if none failed and at least one is `unknown`.
- `eligible` only if every criterion is `met`.

Wording shown to users: "appears eligible", never "you will receive". Always link `source_url`.

## 4. Question selection (information gain)

For each unknown profile field `f` that appears in the criteria of at least one scheme still `unknown`:
- Estimate how many `unknown` verdicts would resolve (to eligible or ineligible) once `f` is known.
- Pick the field with the highest expected resolutions. Tie-break: fields that are cheaper for the student to answer (for example category before marks).
- Stop when no unknown verdicts remain or no askable field would resolve any.

Output includes the question text in the requested language, optional answer choices, and an estimate of schemes it would resolve.

## 5. Portfolio optimiser

- Input: eligible schemes (and optionally `unknown` ones weighted by a probability, default excluded).
- Constraints:
  - **NSP merit/welfare rule (from AY 2026-27):** among schemes with `portal: "nsp"`, select **at most one** `merit` scheme (the best by `amount_inr_per_year * weight`, ties broken by the earlier `application_window.closes` or `deadline`) and **all** eligible `welfare` schemes. Source: scholarships.gov.in announcements; Cabinet Secretariat memo of 12 Nov 2025.
  - The rule applies to NSP schemes only. State and private schemes may differ, so they are not limited by it.
  - `exclusive_with` pairs: at most one of each pair. Fill this field only where an official source states it.
- Objective: maximise `sum(amount_inr_per_year * weight)` where `weight` reflects deadline urgency and application effort (default 1).
- Scale is small (tens of schemes); a brute force or simple ILP is fine.
- Output: the selected set, its total value, and the alternatives dropped (other merit schemes, exclusive pairs) with reasons.
- Closed windows: how the optimiser treats schemes whose window is closed is an open decision (see `decisions-and-progress.md`).

## 6. API (FastAPI, JSON)

Base path `/api`. All responses are JSON unless noted. Errors: `{ "error": { "code": "string", "message": "string" } }` with a proper HTTP status.

| Method and path | Request | Response |
|---|---|---|
| `GET /schemes` | none | list of scheme records (without internal notes) |
| `POST /eligibility/evaluate` | `{ "profile": Profile }` | `{ "results": [EligibilityResult] }` |
| `POST /interview/next` | `{ "profile": Profile, "lang": "en|hi|kn" }` | `{ "field": "string|null", "question": "string", "choices": ["..."]|null, "resolves_estimate": 3 }` (`field` is null when done) |
| `POST /optimize` | `{ "profile": Profile }` | `{ "selected": [scheme_id], "total_inr_per_year": 0, "dropped": [{ "scheme_id": "...", "reason": "..." }] }` |
| `POST /slots/extract` | `{ "transcript": "string", "expecting_field": "string|null", "lang": "string" }` | `{ "fields": [{ "field": "...", "value": "...", "confidence": 0.0 }] }` |
| `POST /voice/transcribe` | multipart audio, `lang` | `{ "text": "string" }` |
| `POST /voice/speak` | `{ "text": "string", "lang": "string" }` | audio bytes |
| `PUT /vault/blobs/{id}` | encrypted blob (section 7) | `204` |
| `GET /vault/blobs/{id}` | none | encrypted blob |
| `PUT /audit/head` | `{ "idx": 0, "hash": "hex" }` | `204` |

Rules:
- Voice endpoints proxy ElevenLabs. **The API key stays server-side** and must never reach the browser.
- `/slots/extract` may use an LLM, but its output is only candidate field values. The UI must show a read-back confirmation before a value becomes `confirmed: true`.
- No endpoint accepts or returns plaintext documents.
- Profiles are processed in memory; do not persist them server-side unless the user opted into encrypted sync.

## 7. Vault blob format (client-side encryption)

```jsonc
{
  "v": 1,
  "kdf": { "alg": "PBKDF2-SHA256", "iterations": 600000, "salt": "base64" },  // may move to Argon2id later
  "wrapped_dek": { "nonce": "base64", "ciphertext": "base64" },               // DEK wrapped by key derived from passphrase
  "data": { "alg": "AES-256-GCM", "nonce": "base64", "ciphertext": "base64" },
  "aad": "doc-id|user-id"                                                      // bound as authenticated data
}
```

- Each file gets a fresh random 256-bit DEK and a fresh 96-bit nonce. Never reuse a nonce with the same key.
- The passphrase and plaintext never leave the browser.
- Changing this format is a **risky change**: commit it separately and bump `v`.
- Delete = remove the wrapped DEK (crypto-shredding) and the blob.
- Do not store government ID numbers. Mask them before any field extraction is saved.

## 8. Audit log entry (hash-chained, client-side)

```jsonc
{
  "idx": 12,
  "ts": "2026-11-24T14:02:11+05:30",
  "actor": "user | helper:<id> | copilot",
  "action": "grant | read | prefill | revoke | delete",
  "fields": ["name", "annual_family_income_inr"],   // field names only, never values
  "purpose": "sandbox-portal:example-scheme-001",
  "prev_hash": "hex",
  "hash": "hex"       // SHA-256 over canonical JSON of the entry without `hash`
}
```

- Canonical JSON: keys sorted, no whitespace.
- The genesis entry has `prev_hash = "0"*64`.
- The head hash is exportable and can be sent to `PUT /audit/head` so tampering is detectable.
- The log stores field names and purposes, never values.

## 9. Consent grant

```jsonc
{ "grant_id": "uuid", "fields": ["name", "annual_family_income_inr"], "purpose": "sandbox-portal:...", "expires_at": "2026-11-24T16:00:00+05:30", "revoked": false }
```

The copilot may use a field only if an unexpired, unrevoked grant covers it, and every use writes an audit entry.

## 10. Sandbox portal contract

- A replica form served from `/sandbox` with deterministic field names (for example `applicant_name`, `family_income`, `category`).
- A field-mapping table (`vault field -> sandbox field`) lives in `/sandbox/mapping.json`. Filling is purely mapping-based. No LLM chooses what goes into a field.
- Allowed domains for the copilot: the sandbox host only (a production allowlist of official government domains is roadmap).
- The user performs OTP, CAPTCHA and final submit manually.

## 11. Synthetic test profiles (`/data/test_profiles.json`)

Keep at least these:
1. A profile that is clearly eligible for several schemes.
2. A profile that is ineligible by a small margin (near-miss).
3. A profile with many unknown fields (drives the interview).
4. A profile eligible for two or more NSP merit schemes plus welfare schemes (tests the merit/welfare rule).
Never use real people's data.
