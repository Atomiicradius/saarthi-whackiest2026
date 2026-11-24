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

## Open decisions
1. Final project name (Saarthi is a placeholder; check for existing products with that name).
2. Team name for the PPT file name and README.
3. Demo languages: Kannada and Hindi, or Hindi and English first (depends on the speech test).
4. KDF: PBKDF2 (WebCrypto only) for round 1 versus Argon2id via WASM later.
5. Whether to use a database or JSON only for round 1.
6. Hosting for the demo (local only, Vercel, or AWS).
7. Whether the optimiser may select schemes whose application window is closed, or lists them separately as "closed".

## Unverified items (do not state as fact until checked)
- [x] Which central schemes are mutually exclusive: resolved for NSP by D12 (one merit plus any welfare). State and private schemes still need their own check.
- [ ] What myScheme does and does not offer (D14); verify before claiming a gap in the pitch.
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
- [x] Language picker and intake flow (tap-to-answer)
- [ ] Voice interview with read-back confirmation
- [x] Results page: eligible, almost eligible, not eligible (mock data)
- [x] Vault: passphrase, encrypt, decrypt (UI on the adapter stub; real vault module not connected)
- [x] Audit log view with verification (verify and demo tamper; on the adapter stub)
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
