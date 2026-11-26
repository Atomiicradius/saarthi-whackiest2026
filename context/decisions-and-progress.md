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
| D12 | 2026-11-24 | Replace exclusivity logic with the NSP rule: at most one `merit` scheme plus any number of `welfare` schemes (AY 2026-27 onward). Add `scheme_type` to the scheme record; keep `exclusive_with` only where an official source states it; `exclusivity_group` removed. The rule covers NSP schemes only, so `portal: "nsp" | "other"` marks them (confirmed by the team). | Source cited by the team: scholarships.gov.in announcements; Cabinet Secretariat memo of 12 Nov 2025. Contract change: `data-and-contracts.md` sections 1, 5, 11. |
| D13 | 2026-11-24 | Add `application_window` (`ay`, `opens`, `closes`, `status`) to the scheme record. NSP applications for AY 2026-27 closed 2026-10-31. UI shows closed schemes as "Closed, opens around <month>", never as upcoming. | Students must not be sent to a closed window. Contract change: `data-and-contracts.md` section 1. |
| D14 | 2026-11-24 | Name myScheme (the government portal) as the main competitor. Lead with near-miss guidance, portfolio planning, cross-document consistency check, voice and the client-side encrypted vault. | Judges will compare us to it; see `project-context.md`. |
| D15 | 2026-11-24 | The web app reaches the vault only through `web/lib/vault-adapter.ts`. The real module is picked up automatically when `web/vault/index.ts` (or `.tsx`) exists and exports `encryptFile(file, passphrase)`, `decryptBlob(blob, passphrase)`, `appendAudit(entry)` and `verifyChain(entries)` (each may be sync or async). Until then an in-file STUB (WebCrypto AES-256-GCM and SHA-256) runs and the vault screen says so. `next.config.ts` makes the choice at startup, so restart `npm run dev` after the vault lands. | Lets the UI ship while the vault owner works in `web/vault`. Contract notes: blob format is section 7, audit entry is section 8. |
| D16 | 2026-11-24 | UI shell for laptops: content column up to 1280px, a sticky guide panel on the left and the page on the right from 1024px, a top pill nav on desktop and the bottom bar on phones. The guide is an original lantern-spirit mascot (inline SVG, GSAP) with six states; messages are typed into a speech bubble. It replaces the orb. No audio is played and the mic button is a labelled placeholder, so nothing implies voice works. A fixed ambient background (drifting blobs and grain) sits behind the content. No new dependencies. | Makes the demo feel alive and fit a 1366x768 screen. Page-level secondary text uses `text-soft` (built from the ink token) so contrast stays AA over the blobs. Guide `speaking` state and `mouthLevel` exist for later but are not used by any screen yet. |
| D17 | 2026-11-24 | Replace the blob background with `components/AmbientBackground.tsx`: one fixed full-viewport canvas (aria-hidden, pointer-events none, below content). A dot grid (28px, 36px on narrow or touch screens) is lit amber, grown and pushed away near the cursor, which is smoothed with `gsap.quickTo` (about 0.25s). 25 fireflies (10 on narrow or touch) drift and are drawn to the cursor when within 160px. A soft amber glow follows the cursor. After 3s without mouse movement, and always on touch or narrow screens, the light follows a slow Lissajous path. The loop runs on GSAP's ticker (one requestAnimationFrame shared with quickTo), pauses when the tab is hidden, caps devicePixelRatio at 2 and debounces resize. With reduced motion it draws the static grid once. The Guide's flame glow also tilts up to 5 degrees toward the cursor. Related polish: the vault shows one slim "Prototype vault: AES-256-GCM in your browser" line and no sample-data banner (that banner stays on Schemes); the audit page lists every entry's result in a compact row, and entries after a changed one read "Cannot be verified". | The blobs were barely visible. Cards stay opaque white, so text contrast is unchanged. Measured at 1366x768: 0 horizontal overflow, 144 fps in headless Chrome, no console errors, static render under reduced motion. No new dependencies. |
| D18 | 2026-11-24 | Smooth scrolling, scroll reveals, a landing "How it works" section. `lenis` (approved, pinned 1.3.28) runs from `gsap.ticker` (lerp 0.1, lagSmoothing off, `ScrollTrigger.update` on scroll); it is off with reduced motion and below 768px, resets to the top on route change and is destroyed on unmount. Inner scroll areas (ciphertext box, document preview) carry `data-lenis-prevent`. `useReveal` fades `[data-reveal]` items up 24px once, in staggered batches, with the hidden start state set by GSAP (never CSS) and a catch-all at the page bottom; nothing is touched under reduced motion. Hero amounts count up the first time they scroll into view. The landing page gets three steps (Answer by voice or tap, See your best plan, Keep your documents private), four short chips and a repeat of Start as Ravi, with no statistics (any stat must come from D1 with a source). A flame cursor (original flame on a candle stub that replaced the pointer on desktop) was built in this task and then removed by team decision, so the normal system cursor shows everywhere; the cursor-lit dot grid from D17 is unchanged. Controls now show a pointer cursor and a hover and press response. The header is sticky. | Makes the demo feel polished without new layout or copy changes outside the landing page. Measured at 1366x768 and 390x844: 0 horizontal overflow, 126-144 fps while scrolling in headless Chrome, no console errors, the ciphertext box scrolls on its own, reduced motion renders everything visible with the native cursor. |
| D19 | 2026-11-24 | Engine, API and vault conventions (branch `rishon/engine-api-vault`). (a) An answer with `confirmed: false` counts as unknown in every endpoint, so an unconfirmed read-back can never change a verdict. (b) Near miss = ineligible on exactly one criterion, which is income over its cap by at most 20% of the cap, or marks under the minimum by at most 5 points; `fixable` is false for both (no fixable case is modelled yet). (c) Question choice: expected number of `unknown` schemes settled, with every plausible answer weighted equally (numbers are tried below, at, between and above each threshold); ties go to the cheaper question. Question text comes in en, hi and kn; choice labels stay English because `web/lib/answer-config.ts` maps labels to values. (d) `/slots/extract` is keyword and number rules only, no LLM. (e) Vault `appendAudit(entry, chain?)` continues the chain it is given (the adapter now passes it), because the UI seeds its log from `mocks/audit.json`; the D15 adapter called it without the chain, which would have restarted `idx` at 0. (f) `PUT /audit/head` only moves forward: a lower `idx` or a different hash at the same `idx` returns 409. Vault blobs and the head are kept in memory for round 1. (g) Answer to open decision 7, confirmed 2026-11-24: the optimiser never selects a closed scheme and lists it in `dropped` as "Application window is closed" (what the results screen mock already expects). A window is closed if its `status` is closed or its `closes` date is before `SAARTHI_TODAY` (or today). | Keeps the contracts unchanged while fixing two integration gaps found by running the UI against the real API and vault. No new web dependencies: vault tests use Node's built-in runner. API dependencies: fastapi, uvicorn, pydantic, httpx, python-multipart (pinned in `api/requirements.txt`). |
| D20 | 2026-11-24 | Voice tested live with ElevenLabs (free plan). Speech-to-text (`scribe_v1`) transcribed English, Hindi and Kannada test speech word for word. Text-to-speech: `eleven_flash_v2_5` is good for English and Hindi but turns Kannada into anglicised gibberish, so Kannada now uses `eleven_v3` (`ELEVENLABS_TTS_MODEL_KN`). Free plans cannot use library voices through the API (HTTP 402 `paid_plan_required`); use a default voice such as Sarah (`EXAVITQu4vr4xnSDxMaL`). `/slots/extract` now reads Hindi and Kannada (number words such as ढाई and ಎರಡೂವರೆ, units, year ordinals, category, state, college type, gender, Indic digits): the same spoken answer gives the same profile in all three languages. | Found by a live round trip (speak, transcribe, extract). Kannada in the standalone speech models is confirmed; Kannada in agent mode is still unverified. |
| D21 | 2026-11-24 | Voice and languages in the app. The mic records in the browser (MediaRecorder, max 10 s, audio kept in memory only), sends it to `/voice/transcribe`, then `/slots/extract` for the field being asked; a value found is proposed with `source: "voice"`, so the read-back still asks the student to confirm. The speaker icon plays the message through `/voice/speak`. With mocks on, voice is off and tapping works as before. UI text now in Hindi and Kannada (`i18n/hi.json`, `i18n/kn.json`, nav labels included); choice chips show translated labels but keep English labels as keys for `answer-config.ts`. Scheme names and engine reasons stay English, and the language note says so. `web/.env.example` now points at the real API. Fixed: the speech bubble's typing overlay covered the speaker button and swallowed clicks (`pointer-events-none`). | Tested in headless Chrome with spoken Kannada and Hindi answers fed through a fake microphone: transcript, read-back, confirm, results and read-aloud all worked with no console errors. Touches column-1 files (interview page, guide panel, mic button, speech bubble, navs, session, i18n); review before merging. |
| D22 | 2026-11-26 | Scheme dataset integrated. `data/schemes.json` holds 10 sourced schemes from D1 (6 central, 4 Karnataka; 7 below 0.7 confidence). The API reads it by default (the EXAMPLE fixture path is gone from `.env.example`). New optional field `exclusivity_source` (other scheme id to source URL) marks the exclusive pairs an official source states; the optimiser says "official rule" only for those and "inferred from the scheme guidelines, check the notice" otherwise (4 central SC and Karnataka pairs are inferred). `exclusivity_group` removed (nothing read it). Missing labels fall back to English, then to a readable word, never a raw key; the guide has singular and unconfirmed-amount wording; the vault checklist falls back to schemes the student may still qualify for. In API mode "Start as Ravi" is an SC student with a 5 lakh income, found by searching 11,520 profiles with the engine (best possible 4 of 6 requirements: no near-miss is ever fixable and no window is closed in the data); mock mode keeps its OBC Ravi. | Reviewed in `docs/data-review-2026-11-26.md`. The Ravi plan has three Karnataka schemes whose amounts are unknown, so its total reads "Amounts not confirmed yet". |

## Open decisions
1. Final project name (Saarthi is a placeholder; check for existing products with that name).
2. Team name for the PPT file name and README.
3. Demo languages: Kannada and Hindi, or Hindi and English first (depends on the speech test).
4. KDF: PBKDF2 (WebCrypto only) for round 1 versus Argon2id via WASM later.
5. Whether to use a database or JSON only for round 1.
6. Hosting for the demo (local only, Vercel, or AWS).
7. ~~Whether the optimiser may select schemes whose application window is closed.~~ **Confirmed 2026-11-24 (D19g):** closed schemes are never selected and are listed in `dropped` as "Application window is closed".

## Unverified items (do not state as fact until checked)
- [x] Which central schemes are mutually exclusive: resolved for NSP by D12 (one merit plus any welfare). State and private schemes still need their own check.
- [ ] What myScheme does and does not offer (D14); verify before claiming a gap in the pitch.
- [ ] Kannada support in ElevenLabs agent mode (standalone speech models list Kannada; agents list fewer languages). Standalone speech-to-text and `eleven_v3` speech confirmed for Kannada on 2026-11-24 (D20).
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
- [ ] Schemes collected from official sources (target about 30): `10 / 30`
- [ ] Exclusivity rules verified
- [x] Synthetic test profiles created (`data/test_profiles.json`)

### Engine (`/engine`)
- [x] Criteria evaluation with tri-state verdicts
- [x] Reasons and missing-field output
- [x] Near-miss detection
- [x] Information-gain question picker
- [x] Portfolio optimiser with exclusivity
- [x] Unit tests passing (53, on the EXAMPLE fixture until D1's dataset lands)

### API (`/api`)
- [x] `GET /schemes`
- [x] `POST /eligibility/evaluate`
- [x] `POST /interview/next`
- [x] `POST /optimize`
- [x] Voice endpoints (`/voice/transcribe`, `/voice/speak`, `/slots/extract`); tested live in English, Hindi and Kannada (D20)
- [x] Vault blob endpoints and audit head endpoint (in memory)

### Web (`/web`)
- [x] Language picker and intake flow (tap-to-answer)
- [x] Voice interview with read-back confirmation (English, Hindi, Kannada; D21)
- [x] Results page: eligible, almost eligible, not eligible (mock data)
- [x] Vault: passphrase, encrypt, decrypt (real module in `web/vault`, 13 tests)
- [x] Audit log view with verification (verify and demo tamper; real module)
- [x] Mobile viewport checked (390x844, interview and results)

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
- 2026-11-24 · context · D12-D14: NSP merit/welfare rule, application_window, myScheme competitor · see git log
- 2026-11-24 · web · design system, interview and results screens on mock data · see git log
- 2026-11-24 · web · landing, vault, server view and audit log screens; vault adapter with stub (D15) · see git log
- 2026-11-24 · web · desktop layout, guide mascot and ambient background (D16) · see git log
- 2026-11-24 · web · cursor-lit dot grid background, vault note, audit downstream labels (D17) · see git log
- 2026-11-24 · web · lenis smooth scroll, scroll reveals, landing how-it-works (D18; flame cursor built then removed) · see git log
- 2026-11-24 · engine/api/vault · rules engine, question picker, optimiser, FastAPI endpoints, browser vault and audit chain; UI tested end to end against them (D19) · see git log
- 2026-11-24 · api · voice tested live; Kannada speech model, Hindi and Kannada slot extraction (D20) · see git log
- 2026-11-24 · web · mic and read-aloud on the voice API, Hindi and Kannada UI, README status (D21) · see git log
- 2026-11-26 · data · D1's 10 sourced schemes integrated, dropped-reason wording, labels and persona fixes (D22) · see git log
