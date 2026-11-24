# Merge review: `origin/engine-api-vault` into `main`

Date: 2026-11-24. Reviewer: Claude (report only). Nothing was pushed and `main` was not modified.

- Branch reviewed: `origin/engine-api-vault`, last commit `5d13e71` "feat(web): voice answers, read-aloud, and Hindi and Kannada UI" (Rishon Thomas Joby, 21:51 IST).
- Reviewed on: throwaway branch `integrate-test` (merge of that branch into `main` at `b11343d`). Safety tag `demo-safe` points at `b11343d`.
- Size: 5 partner commits, 55 files, +3,747 / -85 lines.

## Verdict: MERGE WITH FIXES

1. **Everything that can be machine-checked passes:** engine 53/53, API 44/44, vault 13/13, lint, `tsc`, production build, and the full demo path in one browser session (12/12 steps, 0 overflow, 0 console errors).
2. **No contract or rule breaks found.** `context/data-and-contracts.md` is unchanged, the vault exports match D15 (the adapter now passes `chain` to `appendAudit`, as required), and none of the six AGENTS.md rules fails.
3. **Two things will bite the recording if left alone** (neither is a code bug): `web/.env.example` now turns mocks **off** by default, and the real engine gives different results for Ravi than the mocks the screenshots and script were made from. Decision 7 (closed windows) was also answered in a proposal that needs team confirmation.

## Checks

| # | Check | Result | Evidence |
|---|---|---|---|
| A | Contracts: `data-and-contracts.md` unchanged | PASS | `git diff --stat` empty for that file |
| A | Scheme record, profile fields, `EligibilityResult`, endpoints unchanged | PASS | API models strict (`extra="forbid"`, `api/models.py:27`); only addition is web type `SlotCandidate` (`web/lib/types.ts:101`) for `/slots/extract`, which is in the contract |
| A | Vault exports match D15 (`encryptFile`, `decryptBlob`, `appendAudit`, `verifyChain`, async, `appendAudit` takes chain) | PASS | `web/vault/index.ts:85,144,237,256`; adapter passes `chain` (`web/lib/vault-adapter.ts:180`) |
| B | LLM never decides eligibility | PASS | `api/slots.py:3` "Deterministic keyword and number rules, no LLM"; no model or LLM imports anywhere in `api/` or `engine/` |
| B | No plaintext documents on the server | PASS | Only `VaultBlob` ciphertext accepted (`api/main.py:161-168`, strict model); the web app does not upload blobs at all yet |
| B | No ID numbers, raw audio, OTPs or passphrases stored or logged | PASS | Audio read into memory, forwarded, then `del data` (`api/main.py:145`); only 3 log lines, ids and counts (`api/main.py:71,167,192`); no `localStorage`/`sessionStorage`/`indexedDB` in web (`web/lib/session.tsx:63` comment only) |
| B | No secrets or keys committed | PASS | ElevenLabs key read from env only (`api/voice.py:24`); only `.env.example` and `web/.env.example` tracked, placeholders only; grep of the diff found no real keys |
| B | Scheme entries have `source_url` | PASS | Loader skips records without one (`engine/saarthi_engine/schemes.py:120`); all 8 fixture schemes have it (`example.invalid`) |
| B | Synthetic data only | PASS | All scheme names start with EXAMPLE; `data/test_profiles.json` has 4 synthetic profiles |
| C | AES-256-GCM, fresh random 12-byte nonce per encryption | PASS | `web/vault/index.ts:97-114` (32-byte DEK, `NONCE_BYTES = 12`, new nonce for the data and for the key wrap) |
| C | Per-file key wrapped by passphrase-derived key; KDF parameters | PASS | PBKDF2-SHA256, 600,000 iterations, 16-byte random salt (`index.ts:13-17`); blobs asking for under 100,000 iterations are rejected (`index.ts:139`); `docId\|userId` bound as authenticated data |
| C | No key, passphrase or plaintext sent or stored | PASS | Module has no network or storage code; raw DEK zeroed after use (`index.ts:129,169`); no storage APIs in web |
| C | Audit hash: SHA-256, canonical JSON, genesis 64 zeros, field names only | PASS | `index.ts:20,186-205`; entries limited to exactly 5 keys and `fields` must be strings (`index.ts:215-229`) |
| C | Tampering a middle entry fails it and everything after | PASS | `verifyChain` reports first break (`index.ts:256-268`); vault tests include a forged-hash case; UI run: entry #1 tampered, #2 and #3 show "Cannot be verified" |
| D | Dead code / TODOs / sensitive `console.log` | PASS | No `TODO`, `FIXME`, `console.*` or `print(` in added lines. Minor: `shredBlob`, `auditHead`, `resetAudit` are exported but unused by the UI |
| D | Anything that breaks a production build | PASS | `npm run build` succeeds, 9 static pages |
| T1 | `cd engine && pytest` | PASS | 53 passed |
| T1 | `cd api && pytest` (own virtualenv, project requirements) | PASS | 44 passed. Fails with "No module named saarthi_engine" unless the engine is installed first (`pip install -r requirements-dev.txt`) |
| T1 | `npm run test:vault` | PASS | 13 passed |
| T2 | `npm run lint` / `npx tsc --noEmit` / `npm run build` | PASS | all clean |
| T3 | Full demo path, production build, one session, 1366x768 | PASS | 12/12 steps; screenshots in `D:\Downloads\hackathon context files\task3-screenshots\task7-merge-review\` |
| T3 | Console errors / horizontal overflow | PASS | 0 errors; 0 px overflow at every step |
| T3 | Tamper then verify: downstream "cannot be verified"; Restore; Verify passes | PASS | strip read "#0 Verified, #1 Changed, #2 Cannot be verified, #3 Cannot be verified"; after Restore, "Chain verified, all 4 entries" |
| T4 | "Prototype vault" note | PASS (no longer shows, correctly) | It is hidden when the real vault module is loaded (`vaultMode === "real"`); the vault run showed no note, so the module is being used. Accurate: the vault is no longer a stub |
| T4 | "Sample data" banner | PASS (still shows, correctly) | Shows on Schemes; the data is still the EXAMPLE fixture. Not shown on Vault. Must stay until the real dataset lands |
| - | Web UI driven against the real API (`NEXT_PUBLIC_USE_MOCKS=false`) | NOT TESTED | Only the API itself was smoke-tested with curl (below). The partner reports testing this in D21 |
| - | Voice (microphone, transcribe, read-aloud) | NOT TESTED | No ElevenLabs key here. `/voice/speak` without a key correctly returns 503 `voice_unavailable` |
| - | Quality of the Hindi and Kannada text | NOT TESTED | Key parity with English is complete (no missing keys); wording not reviewed |
| - | API started with no `.env` (missing `data/schemes.json`) | NOT TESTED | |

API smoke test (real engine, EXAMPLE fixture, Ravi's profile): `GET /schemes` returned 8 schemes, all with `source_url`; `/eligibility/evaluate` returned eligible for merit A and B, welfare C, D, E, G and ineligible for F and H; `/optimize` selected merit A + welfare C, D, G for ₹1,25,000 and dropped merit B (one-merit rule) and welfare E (window closed); `/interview/next` with an empty profile asked family income first.

## Conflicts

| File | Conflict | Resolution |
|---|---|---|
| `README.md` (4 hunks: status table, recovery-key line, two Getting Started blocks) | Both sides rewrote them | Took the partner's side in all four hunks, because their text describes their branch. The rest of my README edits merged cleanly. See "README rows" below for the rows that need adjusting. |

No conflicts in shared types, data contracts or the vault adapter. The partner did change `web/lib/types.ts` (+6 lines), `web/lib/vault-adapter.ts` (2 lines) and `web/lib/answer-config.ts` (+3 lines) without conflicting; all three were read and are fine.

## Issues

### Must fix before recording

1. **`web/.env.example:3` sets `NEXT_PUBLIC_USE_MOCKS=false`.** Anyone who copies it to `web/.env.local` gets API mode, and without the API running the interview and results show errors. Unset still means mocks on, so the current recording setup is safe only if nobody copies that file. Fix: for the recording, either leave `.env.local` absent, or set it to `true` explicitly; consider flipping the example back to `true` and documenting `false` in the README.
2. **Mock results and real-engine results differ, so the script and screenshots will not match API mode.** For Ravi the mocks show 3 schemes in the plan worth ₹1,10,000 and a "You can fix this" card for Category Grant G; the real engine selects 4 schemes worth ₹1,25,000 and marks G eligible, and it never produces a fixable near-miss (D19b). The interview order also differs (real API asks income first). Fix: pick one mode for the recording, and re-take the README screenshots in that mode.
3. **Open decision 7 was answered in a proposal (D19g, `context/decisions-and-progress.md`):** closed schemes are never selected and are listed in `dropped`. It matches what the results screen already shows, but the team should confirm it before it goes in the pitch.

### Fix before the 26-27 Nov repo review

4. **The UI never uses the server vault or audit-head endpoints** (`PUT /vault/blobs`, `PUT /audit/head`; no calls in `web/`). The README says so honestly. Fix: either wire them or keep the wording.
5. **`api/main.py:161-168`: vault blob store is unbounded per request** (up to 20 MB of ciphertext per blob, capped by blob count only). Fine for a demo; add a total size cap before any public deployment.
6. **Real dataset missing.** `SAARTHI_SCHEMES_PATH` in `.env.example` points at the EXAMPLE fixture; `data/schemes.json` does not exist, so the API started without that setting will have no schemes (not tested).
7. **Fixable near-miss is never produced by the engine** (D19b says no fixable case is modelled). The UI's "You can fix this" path and the README's "you'd qualify with a caste certificate" example are therefore not reachable in API mode.
8. **Unused exports** `shredBlob`, `auditHead`, `resetAudit` in `web/vault/index.ts:177,271,277`. Harmless; remove or wire (crypto-shredding is a claim in the context files).
9. **Hindi and Kannada wording is unreviewed.** Have a native speaker check before judges see it. Scheme names and verdict reasons stay in English (the language note says so).
10. **API tests need the engine installed first.** The README tells people to run `pytest` in `api/` but the order matters (`pip install -r requirements-dev.txt` installs the engine in editable mode). Worth one line.

## What the UI uses from the partner's work

| Part | In mock mode (default) | In API mode (`NEXT_PUBLIC_USE_MOCKS=false`) |
|---|---|---|
| Vault and audit (`web/vault`) | **Real module, always** (the stub is no longer used) | same |
| Hindi and Kannada UI text | **Used** | same |
| Engine, optimiser, question picker | Not used (mocks) | Used through the API |
| API (`/api/*`) | Not used | Used |
| Voice (mic, read-aloud, slot extraction) | Off (icon disabled, mic hidden or inactive) | Used, needs `ELEVENLABS_API_KEY` |
| Server vault blobs and audit head | Not used | Not used (endpoints exist) |

## README rows

The merged README uses the partner's status table. Suggested changes:

**Change to green (use 🟢 so the table is consistent; the partner used ✅):**
- Eligibility engine (53 tests) and Portfolio optimiser: built and tested. Keep the note that results use the EXAMPLE dataset.
- Adaptive interview (information-gain picker): built and tested.
- API (every endpoint in the contract, 44 tests): built and tested.
- Encrypted vault and hash-chained audit log (13 tests): built and verified in the browser. Keep "the app does not upload ciphertext to the server yet".
- App text in English, Hindi and Kannada: working for UI text. Keep "scheme names and verdict reasons stay in English".

**Must stay yellow, orange or grey:**
- 🟡 **Scheme dataset** (still the EXAMPLE fixture).
- 🟡 **Voice answers and read-aloud**: only tested by the partner on synthetic speech, off in mock mode, not tested here. Say "works with an ElevenLabs key in API mode; real, noisy audio still to be tested".
- 🟠 **Application copilot**: sandbox only, not built.
- ⚪ **On-device OCR, consent grants, recovery key**: planned.
- ⚪ **Cross-document checker, helper mode, reminders**: roadmap.

## How to merge or abandon

Merge `integrate-test` (keeps the resolved README and this report), then push when you are ready:

```
git checkout main
git merge --ff-only integrate-test
git push
```

Or merge the partner's branch directly (the README conflict will come back; take their side per hunk as above):

```
git checkout main
git merge --no-ff origin/engine-api-vault
```

Abandon the test branch (leaves `main` and the `demo-safe` tag untouched):

```
git checkout main
git branch -D integrate-test
git tag -d demo-safe
```

To go back to the exact pre-merge state at any time: `git checkout demo-safe`.
