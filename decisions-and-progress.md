# Decisions and progress

Update this file when a task finishes or a decision is made. Newest entries at the top of each section.

## Decisions made

| # | Date | Decision | Why |
|---|---|---|---|
| D1 | 2026-11-23 | Build a scholarship and welfare navigator (working name Saarthi) | Real, widespread problem; fits our team's UI, backend, security and data skills |
| D2 | 2026-11-23 | Submit under Track 4: UnlockED | The brief is about access to education and opportunities |
| D3 | 2026-11-23 | Rules engine decides eligibility; LLM only converses and extracts | Explainable and safe; wrong eligibility is worse than none |
| D4 | 2026-11-23 | Client-side encrypted vault; server stores ciphertext only | Privacy is a core part of the pitch |
| D5 | 2026-11-23 | Scheme scope: central schemes plus Karnataka, for undergraduate engineering students | Matches the audience in the room; keeps data work finite |
| D6 | 2026-11-23 | Voice: build speech-to-text and text-to-speech first (Option B); upgrade to ElevenLabs Agent on hack day if Kannada works | Deterministic and easier to debug for round 1 |
| D7 | 2026-11-23 | Copilot demo on a sandbox replica portal, not real portals | Reliability, terms of service, CAPTCHAs |
| D8 | 2026-11-24 | Stayed with this idea after considering an alternative (digital-evidence tool) | Alternative did not fit any track, had unverified legal examples, and would have restarted work with hours left |
| D9 | 2026-11-24 | Repo name `saarthi-unlocked-whackiest-2026` | No naming rule exists on the site or in the PDF; includes project, track and hackathon |
| D10 | 2026-11-24 | PPT file name format `TeamName_Track4` | Required by the guidelines (`TeamName_TrackNumber`) |
| D11 | 2026-11-24 | Proposed stack: Next.js + TypeScript, FastAPI, pure-Python engine, JSON data | Fast to build; see `code-standards.md`. **Confirmed 2026-11-24.** Dependencies beyond those named in `code-standards.md` need approval first. |

## Open decisions
1. Final project name (Saarthi is a placeholder; check for existing products with that name).
2. Team name for the PPT file name and README.
3. Demo languages: Kannada and Hindi, or Hindi and English first (depends on the speech test).
4. KDF: PBKDF2 (WebCrypto only) for round 1 versus Argon2id via WASM later.
5. Whether to use a database or JSON only for round 1.
6. Hosting for the demo (local only, Vercel, or AWS).

## Unverified items (do not state as fact until checked)
- [ ] Which central schemes are mutually exclusive (for example "one central scholarship per session"); check official guidelines.
- [ ] Kannada support in ElevenLabs agent mode (standalone speech models list Kannada; agents list fewer languages).
- [ ] Speech accuracy on real, noisy, regional-accent audio.
- [ ] ElevenLabs retention and data-residency controls on our plan tier.
- [ ] A sourced statistic for "scholarships missed or unclaimed" for the pitch deck.
- [ ] Exact criteria, amounts and deadlines for every scheme in the dataset (official sources only).

## Progress checklist

### Setup
- [x] Repo created and context files committed
- [x] Project scaffold (`/web`, `/api`, `/engine`, `/data`, `/sandbox`, `/docs`)
- [x] `.env.example` and `.gitignore` in place (no secrets committed)

### Data
- [ ] Scheme schema frozen (see `data-and-contracts.md`)
- [ ] Schemes collected from official sources (target about 30): `0 / 30`
- [ ] Exclusivity rules verified
- [ ] Synthetic test profiles created

### Engine (`/engine`)
- [ ] Criteria evaluation with tri-state verdicts
- [ ] Reasons and missing-field output
- [ ] Near-miss detection
- [ ] Information-gain question picker
- [ ] Portfolio optimiser with exclusivity
- [ ] Unit tests passing

### API (`/api`)
- [ ] `GET /schemes`
- [ ] `POST /eligibility/evaluate`
- [ ] `POST /interview/next`
- [ ] `POST /optimize`
- [ ] Voice endpoints (`/voice/transcribe`, `/voice/speak`, `/slots/extract`)
- [ ] Vault blob endpoints and audit head endpoint

### Web (`/web`)
- [ ] Language picker and intake flow (tap-to-answer)
- [ ] Voice interview with read-back confirmation
- [ ] Results page: eligible, almost eligible, not eligible
- [ ] Vault: passphrase, encrypt, decrypt
- [ ] Audit log view with verification
- [ ] Mobile viewport checked

### Sandbox and copilot
- [ ] Sandbox portal form
- [ ] Field mapping and pre-fill
- [ ] Rejection-risk check (stretch)

### Submission (deadline Tue 24 Nov, 11:59 PM IST)
- [ ] PPT in the official template, no extra slides, named `TeamName_Track4`
- [ ] PPT uploaded to Google Drive, set to "Anyone with the link can view"
- [ ] 3-5 minute video recorded, uploaded to YouTube (public or unlisted)
- [ ] README complete, repo pushed
- [ ] All links and track number submitted on Devnovate
- [ ] Submission confirmed on the platform

## Progress log
Add one line per finished task: `YYYY-MM-DD HH:MM · owner · what changed · commit hash`.

- 2026-11-24 · planning · context files written
- 2026-11-24 · setup · repo scaffold, .gitignore, .env.example, context files added · see git log
