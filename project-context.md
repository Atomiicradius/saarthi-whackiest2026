# Project context

## One-line pitch
A voice-first, privacy-preserving assistant that tells a student which scholarships they qualify for, picks the best combination, keeps their documents encrypted on their own device, and helps fill the applications, in their own language.

## Event
- **wHACKiest 2026**, organised by CodeRIT (Ramaiah Institute of Technology, Bengaluru).
- **Track 4: UnlockED.** Brief: bridge learning and employment; make education more accessible and opportunities easier to find.
- Timeline: submissions close 24 Nov 2026, 11:59 PM IST; online pitches 26-27 Nov; shortlist 28 Nov; offline 24-hour build 1 Dec; demos 2 Dec.
- First-round judging: mainly understanding of the problem, reasoning behind the solution, and clarity. Approach and communication count for more than how much is built. A basic working demo in the repo is enough.
- Sponsor prizes on hack day for teams using **ElevenLabs** or **AWS** in their architecture.

## The problem
India has many central and state scholarships, but students from underserved backgrounds miss most of them:
1. They do not know the schemes exist.
2. Eligibility criteria (income, category, course, domicile, marks) are scattered across notices and PDFs.
3. Applications are rejected for mismatched names, expired certificates and missing documents.
4. Portals are English-heavy and confusing on a phone.
5. Uploading income, caste and ID documents to another service is a trust problem.

## Target user
A 1st-3rd year engineering student in Karnataka, possibly Kannada-speaking, on a mid-range phone, who has never applied for a scholarship. Also a **helper** (teacher, NGO volunteer, relative) assisting several students.

## What makes it different
| Typical tool | Saarthi |
|---|---|
| Searchable list of scholarships | Adaptive interview that asks only the questions that matter |
| Tells you what you qualify for | Also tells you what you almost qualify for, and what to do |
| Lists every scheme | Optimises the best combination, given mutually exclusive schemes |
| English forms | Voice in Kannada, Hindi or English |
| Upload documents to a server | Client-side encrypted vault, ciphertext only on the server |
| You fill the portal yourself | Copilot pre-fills and checks rejection risk; the user does OTP, CAPTCHA and submit |

## Core design principle
**The LLM converses and extracts. The rules engine decides.** The LLM never reads documents and never determines eligibility.

## Features

### Must have for tonight's first-round repo
1. **Scheme dataset**: about 30 schemes (central + Karnataka) as structured JSON.
2. **Eligibility engine**: tri-state verdicts (eligible / ineligible / unknown), explanations, near-miss detection.
3. **Adaptive interview**: picks the next question by information gain.
4. **Web UI**: a profile intake flow and a results view showing eligible, near-miss and ineligible schemes.
5. **Vault demo**: encrypt and decrypt a file in the browser with a passphrase, plus the hash-chained audit log.

### Should have if time allows
6. **Voice**: speech to text, read-back confirmation and spoken results using ElevenLabs, in one language.
7. **Portfolio optimiser**: best combination under exclusivity rules.
8. **Mock portal** with a pre-fill demo (or a recorded demo).

### Could have / hack day (1 Dec)
- ElevenLabs Agent mode (conversation with the engine exposed as tools), if Kannada works there.
- Cross-document consistency checker (name and date-of-birth mismatches, expired certificates).
- Helper mode, deadline reminders as audio, tracker, scheme-ingestion pipeline (LLM extraction into a review queue).

### Roadmap only (do not build)
- Skills-to-jobs matching, more states, real-portal automation, corporate scholarship tier.

## Example user journey (Ravi, hypothetical)
1. Opens the PWA, no sign-up. Picks a language, taps the mic.
2. Answers about 6-8 adaptive questions by voice. The system reads back each answer for confirmation.
3. Sees results: "You qualify for 6 schemes", the best combination, near-misses ("Scheme Y needs a caste certificate").
4. Photographs documents; they are encrypted on-device; a checker flags name mismatches.
5. Starts an application; the copilot pre-fills the sandbox portal form; the user does OTP, CAPTCHA and submit.
6. Tracks deadlines and sees an audit log of what each portal received.

Failure paths to design for: voice fails (tap-to-answer fallback), no documents yet (show results first), slow network (minimal-data mode).

## Security summary
- Client-side AES-256-GCM, per-file keys wrapped by a key derived from the user's passphrase.
- On-device OCR. Server holds ciphertext, wrapped keys and minimal metadata only.
- Per-field, per-purpose, expiring consent grants; hash-chained audit log.
- Copilot: deterministic field mapping, domain allowlist, no LLM reads documents, human does OTP/CAPTCHA/submit.
- Voice: speak profile answers only, never IDs or document contents.
- Details in `data-and-contracts.md` (formats) and `docs/threat-model.md` (to be written).

## Known limitations (be honest in the pitch)
- Scheme data goes stale; every record carries a source and `last_verified`.
- Eligibility is not approval; wording must say "appears eligible" and point to the official notice.
- Kannada speech recognition may struggle with accents and noise; always read back, keep a tap fallback.
- Voice audio goes to a cloud service, which conflicts with "data stays on device" for audio; mitigate by never speaking IDs or document contents.
- A lost passphrase means lost data; offer a recovery key.
- Real portals have CAPTCHAs and terms of service; demo on a sandbox replica only.
- Not legal advice. Do not claim compliance with India's DPDP Act 2023.

## Unverified items (check before stating as fact)
- Which central schemes are mutually exclusive (for example one central scholarship per session).
- Whether Kannada works in ElevenLabs agent mode.
- ElevenLabs retention and data-residency settings on our plan tier.
- Exact amounts, deadlines and criteria for each scheme (use official sources).
