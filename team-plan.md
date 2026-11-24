# Team plan

Team name: `<TEAM NAME>` · Project: Saarthi (working name) · Track 4: UnlockED
Repo: `saarthi-unlocked-whackiest-2026` (proposed)

## Roles and ownership

| Member | Owns | Directories |
|---|---|---|
| Member 1: UI/UX, voice flow, pitch | Web app screens, voice interaction, results and privacy views, PPT and pitch script | `/web` (UI), `/docs` (pitch) |
| Member 2: Backend | API, scheme data loading, voice proxy, deployment | `/api`, `/data` |
| Member 3: Security/data A | Eligibility engine, information-gain question picker, optimiser, engine tests | `/engine` |
| Member 4: Security/data B | Vault, audit log, consistency checker, threat model, sandbox portal and copilot | `/web/vault`, `/sandbox`, `/docs/threat-model.md` |

Fill in real names: M1 `<name>`, M2 `<name>`, M3 `<name>`, M4 `<name>`.

Rules:
- Work in your own directories. Ask the owner before changing someone else's code.
- Contract changes (`data-and-contracts.md`) need agreement from the affected owners.
- Everyone updates `decisions-and-progress.md` for their own tasks.

## Hard deadlines
- **Tue 24 Nov 2026, 11:59 PM IST:** submit on Devnovate: PPT (official template, no extra slides, named `TeamName_Track4`, Google Drive link set to "Anyone with the link can view"), 3-5 minute YouTube pitch video (public or unlisted), GitHub repo link, and the track number.
- 26-27 Nov: online pitch round (5 minutes + 3 minutes Q&A). The repo is evaluated then, so it can keep improving.
- 28 Nov: shortlist. 1-2 Dec: offline 24-hour build and demos.

## Tonight's schedule (first-round submission)

Aim to finish **at least 45 minutes before the deadline**.

| Time (IST) | Work |
|---|---|
| 19:15-20:00 | Create the repo and scaffold. Freeze the schemas. M3 writes the engine skeleton and tests. M2 starts the data sprint, or splits it with M3. Test Kannada speech on noisy audio. |
| 20:00-22:00 | Build the thin slice (below). M1: intake and results UI. M2: API plus the scheme loader. M3: engine, near-miss, question picker. M4: vault round-trip and audit log. |
| 22:00-22:45 | Integrate end to end. Fix blocking bugs only. Write the README. |
| 22:45-23:15 | M1 finishes the PPT in the official template. Record the demo video footage. |
| 23:15-23:30 | Upload the video, set the Drive link permissions, push the final repo. |
| 23:30-23:50 | Submit on Devnovate and confirm the submission shows. |

## Thin slice for the first-round repo

Must:
1. About 30 verified schemes loaded from `/data/schemes.json` (fewer is acceptable if sources are solid; quality over count).
2. Eligibility evaluation with explanations and near-miss.
3. Adaptive interview (next-question endpoint plus UI).
4. Results page: eligible, almost eligible, not eligible.
5. Vault: encrypt and decrypt a file in the browser; audit log with verification.

Should:
6. Voice in and out in one language, with read-back confirmation.
7. Optimiser with exclusivity.
8. Sandbox portal pre-fill (or a screen recording).

Cut first if time runs short: 8, then 7, then 6. Do not cut 1-5.

## Hack day plan (1 Dec, if shortlisted)
- Switch voice to the ElevenLabs Agent if Kannada works; expose the engine as tools.
- Add the consistency checker, helper mode, reminders and the sandbox copilot.
- Use AWS for ciphertext storage if it helps the sponsor-prize story.
- Polish the demo script around the two-minute live path.

## Demo script (two-minute live path)
1. Open the app, pick a language, speak or tap through the interview.
2. Show results with near-misses and the best combination.
3. Upload a sample document; show it encrypted and the audit log entry.
4. (If ready) pre-fill the sandbox portal form.

## Pitch outline (5 minutes + 3 minutes Q&A)
- 0:00-0:45 Problem, with a sourced number about missed scholarships (find a real one).
- 0:45-1:30 Solution and how it differs.
- 1:30-3:30 Live demo.
- 3:30-4:30 Architecture and security, threat model.
- 4:30-5:00 Impact, roadmap.
- Likely Q&A: What if scheme data is wrong? What if voice fails? Why trust you with documents? How do you scale to other states?

## Communication
- One group chat for blockers. Post blockers immediately, not at the end.
- Short sync every 60-90 minutes tonight: what is done, what is blocked, what is next.
