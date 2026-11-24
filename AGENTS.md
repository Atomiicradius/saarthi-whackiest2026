# AGENTS.md

Start here. This file tells you what this repo is, what to read, and the rules you must not break.

## What this project is
**Saarthi** (working name) is a voice-first, privacy-preserving scholarship navigator for Indian students, built for **wHACKiest 2026** (CodeRIT, RIT Bengaluru), **Track 4: UnlockED**.
It tells a student which scholarships they qualify for, picks the best combination, keeps their documents in an encrypted on-device vault, and helps fill applications.

## Read these first, in order
1. `context/project-context.md`: the problem, the users, the features, the scope.
2. `context/data-and-contracts.md`: schemas and API contracts. **Code must match these.**
3. `context/code-standards.md`: stack, conventions, testing, commit rules.
4. `context/team-plan.md`: who owns which directory, and the schedule.
5. `context/decisions-and-progress.md`: decisions already made, open questions, what is done.

## Non-negotiable rules
1. **The LLM never decides eligibility.** Eligibility comes only from the deterministic rules engine. An LLM may extract text into slots or parse notices into a review queue, nothing more.
2. **Documents never reach the server in plaintext.** Encryption and OCR happen in the browser. The server stores ciphertext only.
3. **Never store or log** government ID numbers, raw voice audio, OTPs or passphrases. No personal data in logs.
4. **Use synthetic data only.** Never commit real documents, real personal data or real credentials.
5. **No secrets in the repo.** API keys live in environment variables. Provide `.env.example` with placeholders.
6. **Scheme data needs a source.** Every scheme record has `source_url`, `confidence` and `last_verified`. Do not invent scheme criteria, amounts or deadlines. If you do not know, mark it `unknown` or leave it for human review.
7. **Portal automation runs only against our sandbox replica**, never real government portals. The user performs OTP, CAPTCHA and final submit.
8. **Do not weaken the contracts silently.** If a schema or endpoint must change, update `context/data-and-contracts.md` in the same task and note it in `context/decisions-and-progress.md`.

## Working agreement
- **One commit per task**, not one per part. Make a separate commit only for a risky change that must be revertable on its own (for example a crypto format change or a schema change). See `context/code-standards.md`.
- Keep changes inside your task's scope. Do not refactor unrelated code.
- If something in these files conflicts with the request, stop and flag it instead of guessing.
- When you finish a task, update the checklist in `context/decisions-and-progress.md`.

## Where things live (proposed layout)
```
/web      Next.js + TypeScript PWA (UI, voice, vault, copilot UI)
/api      FastAPI (Python): schemes, eligibility, interview, optimiser, voice proxy
/engine   Pure-Python rules engine, question picker, optimiser (no web code)
/data     Scheme dataset (JSON) and synthetic test profiles
/sandbox  Replica portal for the copilot demo
/docs     Architecture, threat model, pitch material
```

## Commands (fill in as they are created)
- Web: `cd web && npm install && npm run dev`
- API: `cd api && pip install -r requirements-dev.txt && uvicorn main:app --reload --env-file ../.env` (copy `.env.example` to `.env`; it points `SAARTHI_SCHEMES_PATH` at the EXAMPLE fixture until `data/schemes.json` exists)
- API tests: `cd api && pytest`
- Engine tests: `cd engine && pytest`
- Vault tests: `cd web && npm run test:vault`
- Web against the real API: in `web/.env.local` set `NEXT_PUBLIC_USE_MOCKS=false` and `NEXT_PUBLIC_API_BASE_URL=http://localhost:8000`

## Deadline context
First-round submission closes **24 Nov 2026, 11:59 PM IST**. The first-round repo needs a basic working demo. Prefer a thin, working vertical slice over broad, half-finished features.
