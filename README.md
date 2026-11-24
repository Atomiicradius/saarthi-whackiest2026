<div align="center">

# 🧭 Saarthi

**A voice-first, privacy-preserving scholarship navigator for Indian students.**

[![Built at wHACKiest](https://img.shields.io/badge/wHACKiest-2026-3b82f6?style=flat-square)](#team)
[![Track 4](https://img.shields.io/badge/Track%204-UnlockED-f59e0b?style=flat-square)]()
[![Status](https://img.shields.io/badge/status-first--round%20prototype-22c55e?style=flat-square)]()

<p>
<img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js">
<img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
<img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python">
<img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI">
<img src="https://img.shields.io/badge/Pydantic-E92063?style=for-the-badge&logo=pydantic&logoColor=white" alt="Pydantic">
<br>
<img src="https://img.shields.io/badge/ElevenLabs-voice%20in%20%26%20out-000000?style=for-the-badge" alt="ElevenLabs">
<img src="https://img.shields.io/badge/WebCrypto-AES--256--GCM-1e3a5f?style=for-the-badge" alt="WebCrypto">
<img src="https://img.shields.io/badge/PWA-mobile%20first-143120?style=for-the-badge" alt="PWA">
</p>

Saarthi tells a student which scholarships they actually qualify for, picks the best combination, keeps their documents in an encrypted vault on their own device, and helps fill the applications, in their own language.

*Eligibility is decided by a deterministic, explainable rules engine. The LLM only helps with conversation.*

</div>

<!-- ![Saarthi Demo](docs/screenshots/demo.gif) -->

---

## The Problem

India has many central and state scholarships, but students from underserved backgrounds miss most of them:

- **They don't know the schemes exist.**
- **Eligibility is scattered** across notices and PDFs: income, category, course, domicile, marks.
- **Applications get rejected** for mismatched names, expired certificates and missing documents.
- **Portals are English-heavy** and hard to use on a phone.
- **Trust is a barrier.** Uploading income, caste and ID documents to yet another service is risky.

## What Saarthi Does

| Step | Description |
|---|---|
| **1. Ask** | A short voice or tap interview. The next question is chosen by information gain, so a student answers a handful of questions, not a long form. Every answer is read back for confirmation. |
| **2. Match** | A deterministic rules engine checks each scheme and returns *eligible*, *ineligible* or *unknown*, with the reason for every verdict. It also shows near-misses ("you miss this by Rs 20,000" or "you'd qualify with a caste certificate"). |
| **3. Optimise** | On the National Scholarship Portal a student can apply for one merit-based scheme plus welfare-based schemes. Saarthi picks the best merit scheme by value and deadline and keeps every eligible welfare scheme. State and private schemes may follow different rules. |
| **4. Protect** | Documents are encrypted in the browser (AES-256-GCM) with a key from the student's passphrase. The server only ever sees ciphertext. Every access is written to a tamper-evident audit log. |
| **5. Apply** | A copilot pre-fills the application form and checks rejection risk. The student does OTP, CAPTCHA and final submit. |

> **Design principle:** the LLM converses and extracts. The rules engine decides. The LLM never reads documents and never determines eligibility.

---

## Previews

| Home | Voice interview |
|:---:|:---:|
| <img src="docs/screenshots/landing.png" width="100%" alt="Landing page with the Guide" /> | <img src="docs/screenshots/interview.png" width="100%" alt="Interview with read-back confirmation" /> |

| Best plan and lanes | Vault: what the server sees |
|:---:|:---:|
| <img src="docs/screenshots/results.png" width="100%" alt="Best plan with eligible, almost eligible and closed lanes" /> | <img src="docs/screenshots/server-view.png" width="100%" alt="Document on device versus ciphertext on server" /> |

<div align="center">
  <b>Tamper-evident audit log</b><br/><br/>
  <img src="docs/screenshots/audit-broken.png" width="100%" alt="Audit chain broken at an edited entry" />
</div>

*Prototype screenshots, shown with labelled sample data.*

## How Saarthi Is Different

Government portals such as myScheme already help students check scheme eligibility. To our knowledge, Saarthi adds a few things on top:

- **Near-miss guidance:** what is missing, and whether the student can fix it.
- **A best-plan picker** that respects the National Scholarship Portal's one-merit-plus-welfare rule.
- **An encrypted on-device vault** so documents never reach our server in readable form.
- **A tamper-evident audit log** of every use of the student's data.
- **Voice, in the student's language** (planned, depends on language testing).

---

## Architecture

```mermaid
flowchart TD
    A(["Student<br/>voice or tap"]) --> B

    subgraph WEB["Browser (web app)"]
        B["Interview UI<br/>read-back confirmation"]
        V["Vault<br/>AES-256-GCM (on-device OCR planned)"]
        L["Audit log<br/>hash-chained"]
    end

    B -- "audio / text" --> C["API (FastAPI)<br/>voice proxy, slot extraction"]
    C -- "ElevenLabs speech-to-text / text-to-speech" --> C

    subgraph DET["Deterministic, no LLM"]
        E["Rules engine<br/>tri-state verdicts + reasons"]
        Q["Question picker<br/>information gain"]
        O["Portfolio optimiser<br/>merit / welfare rule"]
    end

    C --> E
    E --> Q
    E --> O
    D[("Scheme dataset<br/>official sources only")] --> E

    V -- "ciphertext only" --> S[("Encrypted storage")]
    V --> L
    O --> R["Results<br/>eligible / almost / not eligible"]
    R --> P["Copilot<br/>sandbox portal pre-fill"]
    P --> L

    classDef det fill:#143120,stroke:#22c55e,color:#f2f4f8;
    classDef web fill:#1e3a5f,stroke:#3b82f6,color:#f2f4f8;
    classDef store fill:#10151f,stroke:#232a3b,color:#f2f4f8;

    class E,Q,O det;
    class B,V,L web;
    class D,S store;
```

- **Frontend:** Next.js, TypeScript, WebCrypto (PWA planned)
- **Backend:** FastAPI, Pydantic, Python
- **Voice:** ElevenLabs speech-to-text and text-to-speech, called from the backend (keys stay server-side)
- **Data:** a structured scheme dataset built from official portals and guideline documents

Full technical detail in [`context/`](context/).

---

## What's Real vs. Planned

We're upfront about this, since it matters for judging the demo honestly. Update the status column as features land.

| Component | Status |
|---|:---:|
| Scheme dataset (central + Karnataka, undergraduate engineering) | 🟡 **In progress**, being collected from official sources. The demo runs on clearly labelled EXAMPLE schemes until it lands |
| Eligibility engine (tri-state verdicts, explanations, near-miss) | ✅ **Working**, 53 unit tests |
| Adaptive interview (information-gain question picker) | ✅ **Working**, questions in English, Hindi and Kannada |
| Portfolio optimiser (NSP one-merit-plus-welfare rule) | ✅ **Working** |
| API (FastAPI, every endpoint in the contract) | ✅ **Working**, 44 tests |
| Encrypted vault (browser-side AES-256-GCM) and hash-chained audit log | ✅ **Working** in the browser, 13 tests. The server endpoints exist; the app does not upload ciphertext to them yet |
| Voice answers and read-aloud (ElevenLabs) | ✅ **Working** in English, Hindi and Kannada: speak an answer, confirm the read-back |
| App text in English, Hindi and Kannada | ✅ **Working**. Scheme names and verdict reasons stay in English |
| Application copilot | 🟠 **Sandbox demo only**, never real government portals. Not built yet |
| On-device OCR, consent grants, recovery key | ⚪ **Planned** |
| Cross-document consistency checker, helper mode, reminders | ⚪ **Roadmap** |

**Limits to keep in mind**
- Scheme criteria, amounts and deadlines go stale. Every record carries a `source_url` and `last_verified` date.
- Saarthi says a student *appears eligible*. It is not an approval, and the official notice is the final word.
- Speech recognition was tested on clean synthetic speech in all three languages. Real, noisy, regional-accent audio is still to be tested, so every answer is read back for confirmation and tapping always works.
- Voice audio goes to a cloud service. Students are asked to speak profile answers only, never IDs or document contents.
- A lost passphrase means lost vault data. A printed recovery key is planned.
- Saarthi is not legal advice, and we make no claim of compliance with India's Digital Personal Data Protection Act, 2023.

---

## Security Model

Design goals. In the prototype today, documents are encrypted in the browser with AES-256-GCM and the audit log is hash-chained. On-device OCR, per-field consent grants and the copilot are planned.

- **Client-side encryption:** each document gets a fresh AES-256-GCM key, wrapped by a key derived from the student's passphrase. The passphrase and plaintext never leave the browser.
- **On-device OCR (planned):** raw documents are never uploaded for processing.
- **Consent per field and purpose (planned):** grants are explicit and expire.
- **Hash-chained audit log:** each entry includes the hash of the previous one, so edits are detectable. It records field names and purposes, never values.
- **Copilot hardening (planned):** form filling is deterministic field mapping. Page text is never treated as instructions, and only an allowlisted domain is used.
- **Never stored or logged:** government ID numbers, raw voice audio, OTPs, passphrases.

---

## Getting Started

```bash
# 1. Settings: copy both example files. Add an ElevenLabs key to .env for voice (optional).
cp .env.example .env
cp web/.env.example web/.env.local

# 2. Backend (Python 3.11+)
cd api
pip install -r requirements-dev.txt
uvicorn main:app --reload --env-file ../.env

# 3. Frontend (Node 22+), in a second terminal
cd web
npm install
npm run dev

# Tests
cd engine && pytest           # rules engine
cd api && pytest              # API
cd web && npm run test:vault  # vault and audit chain
```

Without an ElevenLabs key everything works except voice; tap to answer instead. On a free ElevenLabs plan, use one of the default voices (the example file sets one). **Never commit real keys, real documents or personal data.** The repo uses synthetic profiles only.

Open **http://localhost:3000**.

---

## Project Structure

```
web/       Next.js + TypeScript app (UI, vault and audit prototype, copilot UI planned)
api/       FastAPI: schemes, eligibility, interview, optimiser, voice proxy
engine/    Pure-Python rules engine, question picker, optimiser
data/      Scheme dataset and synthetic test profiles
sandbox/   Replica portal for the copilot demo
docs/      Architecture, threat model, pitch material
context/   Project context, contracts and standards for team agents
```

See [`AGENTS.md`](AGENTS.md) and [`context/`](context/) for the full technical documentation this project is built against: project context, data contracts, code standards, team plan and decision log.

---

## Team

Built by:

| Name |
|---|
| Ibrahim Kasheef |
| Rishon Thomas Joby |
| Samarth P Rao |
| Samarth Sainath Naik |

Built for **wHACKiest 2026**, organised by CodeRIT at Ramaiah Institute of Technology, Bengaluru. Track 4: UnlockED.

---

## Demo Video

*Link coming soon.*
