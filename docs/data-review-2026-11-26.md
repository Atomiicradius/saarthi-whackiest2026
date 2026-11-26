# Data review: D1's scheme dataset (`origin/data/real-schemes`)

Date: 2026-11-26. Report only: nothing was merged into `main` and nothing was pushed.

- Branch reviewed: `origin/data/real-schemes`, last commit `5c59542` "data: correct minority scheme wording to last date 30/11/2026" by Samarth S Naik. Two commits: `14b60fe` (adds 10 sourced schemes and a pending-review list) and `5c59542`.
- It adds two files: `data/schemes.json` (10 schemes) and `data/schemes_pending_review.md`. No other file changed, so there were **no merge conflicts**.
- Reviewed on the throwaway branch `data-test` (merge of that branch into `main` at `ba2f508`). Safety tag `pre-data` points at that `main`.
- Note: local `main` is 2 commits ahead of `origin/main` (`d613632` README status, `ba2f508` counter fix). Any push of `main` will publish those too.

## Verdict: MERGE WITH FIXES

1. **The data itself is valid and sourced.** All 10 records pass the engine's loader and every hard rule (https, official domains, real dates, no EXAMPLE names, no duplicate ids). Engine 53/53, API 44/44, vault 13/13, lint and `tsc` pass, and the full demo path ran on a production build with no console errors and 0 overflow.
2. **Real data exposes three viewer-visible bugs that need fixing before the pitch.** The vault checklist shows a raw label `docs.domicile_certificate` (no label exists for domicile or disability certificates in any language), the guide says "I found 1 schemes", and `.env.example` still points the API at the EXAMPLE fixture, so anyone following the README gets sample data, not D1's.
3. **Ravi's story is thin with real data, and several records are lower-confidence.** The plan is one scheme worth ₹20,000, with no Almost eligible and no Closed cards. Seven schemes sit below 0.7 confidence, and several key conditions are not encoded, so "appears eligible" overstates some matches.

Merging does not change the default app: mock mode (the default) does not read `data/schemes.json`. The problems appear only in API mode.

## Checks

### A. Contract (per `context/data-and-contracts.md`)

| Check | Result |
|---|---|
| Engine loader (`load_schemes`, `validate_scheme`) on all 10 records | PASS: loaded 10, 0 skipped, 0 errors |
| Required fields, types, `scheme_type` merit or welfare, `portal`, `level` values | PASS (all 10) |
| Criteria use only supported fields and operators; values pass `check_value` | PASS (all 10) |
| `application_window` has `ay`, `opens`, `closes`, `status` where present; `deadline` equals `closes` | PASS (the 2 records that have one) |
| `amount_inr_per_year` number or null | PASS (4 are null, shown as "Amount not confirmed") |
| `docs_required` present | PASS (4 Karnataka records have it empty, noted as unknown) |
| Extra key outside the contract | NOTE: `exclusivity_group: null` is in all 10 records; D12 removed it from the contract. Harmless, the engine ignores it |

### B. Hard rules, per scheme

| Scheme | source_url official https | last_verified | No EXAMPLE | Unique id | Exclusives exist and symmetric | Criteria plausible | Result |
|---|---|---|---|---|---|---|---|
| `csss-pm-usp-ug` | scholarships.gov.in (guideline PDF) | 2026-11-26 | yes | yes | yes | income 4,50,000 rupees, level UG | PASS |
| `pm-yasasvi-obc-post-matric` | www.myscheme.gov.in (portal page, not the ministry notice) | 2026-11-26 | yes | yes | yes | income 2,50,000, OBC | PASS (weaker source) |
| `ka-sc-postmatric-fee-reimbursement` | ssp.karnataka.gov.in/Schemes (list page) | 2026-11-26 | yes | yes | yes | SC, income under 2,50,000 | PASS (low detail) |
| `ka-sc-technical-medical-ayush-fee-reimbursement` | ssp.karnataka.gov.in/Schemes | 2026-11-26 | yes | yes | yes | SC, income above 2,50,000 and under 10,00,000 | PASS (course type not encoded) |
| `ka-sc-professional-tuition-fee-quota` | ssp.karnataka.gov.in/Schemes | 2026-11-26 | yes | yes | yes | SC only | PASS (confidence 0.5) |
| `ka-sc-hostel-maintenance-technical-medical` | ssp.karnataka.gov.in/Schemes | 2026-11-26 | yes | yes | yes | SC only | PASS (confidence 0.5) |
| `aicte-pragati-degree` | scholarships.gov.in (2020 guideline PDF) | 2026-11-26 | yes | yes | yes | F, UG, year 2 or less, income 8,00,000 | PASS (2020 guidelines) |
| `aicte-saksham-degree` | scholarships.gov.in (2020 guideline PDF) | 2026-11-26 | yes | yes | yes | disability yes, UG, year 2 or less, income 8,00,000 | PASS (2020 guidelines) |
| `central-post-matric-sc` | socialjustice.gov.in (ministry **home page**) | 2026-11-26 | yes | yes | yes | SC, income 2,50,000 | PASS with warning: source is not the document |
| `central-post-matric-st` | tribal.nic.in (ministry **home page**) | 2026-11-26 | yes | yes | yes | ST, income 2,50,000 | PASS with warning: source is not the document |

Domains used: scholarships.gov.in, www.myscheme.gov.in, ssp.karnataka.gov.in, socialjustice.gov.in, tribal.nic.in. All are `.gov.in` or `.nic.in`. Income values are in rupees (not lakh); no marks criteria are used; no state-name criteria are used at all.

`exclusive_with` (66 directed links, all symmetric, all ids exist): most links are backed by "may not hold another scholarship" rules that the notes quote from the guidelines. One group is **inferred, not stated**: the central SC and ST post-matric records are marked exclusive with the Karnataka SC fee-reimbursement records because they are "probably the same benefit" (central SC record notes). Nothing official is cited for that pairing.

### C. Counts

| Measure | Count |
|---|---|
| Total schemes | 10 |
| Central / Karnataka | 6 / 4 |
| Merit / welfare | 2 (PM-USP, AICTE Pragati) / 8 |
| On NSP / other portal | 4 / 6 |
| Application window: open / closed / upcoming / none | 2 (both AICTE, closing 30 Nov 2026) / 0 / 0 / 8 |
| Confidence below 0.7 | 7 (Karnataka post-matric fee 0.65, Karnataka technical-medical 0.65, Karnataka professional quota 0.5, Karnataka hostel 0.5, AICTE Pragati 0.6, AICTE Saksham 0.65, central post-matric SC 0.6) |
| Confidence below 0.6 | 2 (the quota and hostel schemes) |
| Amount unknown (null) | 4 (all Karnataka) |

### D. Schemes whose criteria look uncertain or incomplete (for D1 to double-check)

| Scheme | Why |
|---|---|
| `csss-pm-usp-ug` | The merit rule (above the 80th percentile of Class 12 candidates) is not encoded, so any UG student with income up to 4.5 lakh shows as eligible. Window not set. Year 4 of B.E./B.Tech pays 20,000, not 12,000 |
| `pm-yasasvi-obc-post-matric` | Source is a myScheme page, not the ministry notice. EBC and DNT students are not matched (profile has only OBC). Domicile and the two-boys limit are not encoded. Window not confirmed |
| `ka-sc-postmatric-fee-reimbursement` | The page gives one sentence. Amount, documents, domicile and dates unknown. Karnataka domicile is probably required but not encoded |
| `ka-sc-technical-medical-ayush-fee-reimbursement` | Course type (technical, medical, AYUSH) not encoded, so any SC student in that income band matches. Income of exactly 2.5 lakh or exactly 10 lakh matches neither Karnataka scheme |
| `ka-sc-professional-tuition-fee-quota` | Category only; the management or private quota condition cannot be checked, so every SC student matches (confidence 0.5) |
| `ka-sc-hostel-maintenance-technical-medical` | Category only; living in a college-run hostel cannot be checked, so every SC student matches (confidence 0.5) |
| `aicte-pragati-degree` | Built from 2020 guidelines; no 2026-27 guideline seen. `year_of_study <= 2` stands in for "first year or lateral-entry second year". Selection is by merit of Class 12 marks (not checked), so "eligible" means eligible to apply. Closing date moved from 31 Oct to 30 Nov 2026 per a later notice |
| `aicte-saksham-degree` | Also 2020 guidelines. The 40 percent disability threshold is not checked. Exactly 8 lakh income is uncertain ("not more than" versus "less than"). Same year proxy as Pragati |
| `central-post-matric-sc` | Guideline validity ended 2025-26; no 2026-27 renewal seen. Source is the ministry home page. Amount is only the day-scholar academic allowance (7,000) |
| `central-post-matric-st` | Source is the ministry home page. Amount is only the day-scholar stipend (5,500) |
| All 10 | No record has a `state_of_domicile` criterion, so Karnataka schemes will also show for students from other states |

## Run results

| Run | Result |
|---|---|
| `cd engine && pytest` | PASS, 53 passed |
| `cd api && pytest` | PASS, 44 passed |
| `cd web && npm run test:vault` | PASS, 13 passed |
| `npm run lint` and `npx tsc --noEmit` | PASS |
| API started with no `SAARTHI_SCHEMES_PATH` | PASS: serves 10 schemes from `data/schemes.json`, none named EXAMPLE |
| Production web build in API mode | PASS |
| Failures traced to a specific scheme | None |

### Demo path as Ravi (API mode, production build, one session, 1366x768)

- **Start as Ravi** walked from an empty profile in all three scenarios (fresh, after finishing once, after Reset to Ravi). The first question was "Which category are you in?" with a read-back on every answer, and it never jumped to "That is all we need". 6 questions were asked.
- **Counter:** starts at 10 of 10, then 4, 4, 4, 4, 3, 2. It never shows 0 while a scheme is eligible or unknown; it ends at 2 and results show 2 eligible.
- **Plan:** 1 scheme worth ₹20,000 (PM-YASASVI). The guide says "I found 1 schemes for your plan".
- **Appears eligible (2):** PM-YASASVI Post-Matric Scholarship for OBC, EBC and DNT Students (in plan); PM-USP Central Sector Scheme of Scholarship for College and University Students (UG) (eligible, not in plan, because it cannot be combined with PM-YASASVI).
- **Almost eligible:** 0 cards. **Closed for now:** 0 cards.
- **Not eligible (8):** Karnataka SC fee reimbursement (post-matric); Karnataka SC fee reimbursement (technical, medical, AYUSH); Karnataka SC tuition fee quota; Karnataka SC hostel maintenance; AICTE Pragati; AICTE Saksham; central Post Matric SC; central Post Matric ST.
- **Reset to Ravi** (full profile) gives the same two eligible schemes, the same plan and the same dropped reason ("Cannot be combined with PM-YASASVI ... (official rule)").
- **Console errors:** none. **Horizontal overflow:** 0.
- **Vault checklist:** shows income certificate, caste certificate, marksheet and the raw text `docs.domicile_certificate`.

### "Sample data" banner and EXAMPLE text

| Item | Behaviour | Verdict |
|---|---|---|
| "Sample data" banner on results | Hidden with the real data (no EXAMPLE names). It is shown only when some scheme name starts with EXAMPLE (`web/components/sample-data-banner.tsx`); the earlier mock and fixture runs showed it | Correct, no fix needed |
| EXAMPLE text on results, vault and guide bubbles | None on screen in API mode with the real data | Correct |
| README screenshots in `docs/screenshots/` | Still show EXAMPLE scheme names | Stale; retake (not done here) |
| `.env.example` `SAARTHI_SCHEMES_PATH` | Still points at the EXAMPLE fixture, so `cp .env.example .env` loads sample data | Must fix |

### Interview counter and Start as Ravi

Both are correct with the new data (see above). Nothing was changed.

## Issues, ranked

### Fix before the pitch

1. **Raw label `docs.domicile_certificate` in the vault checklist** (also `disability_certificate` for any plan that needs it, and the "Keep ready" lines). `web/i18n/en.json`, `hi.json` and `kn.json` have only four document labels: bonafide, caste, income, marksheet. Fix: add labels for `domicile_certificate` and `disability_certificate` in all three files (Hindi and Kannada wording needs a native check).
2. **"I found 1 schemes for your plan"**: `web/i18n/en.json` line 100 always says "schemes". Fix: add a singular form in all three languages.
3. **`.env.example` loads the EXAMPLE fixture.** `SAARTHI_SCHEMES_PATH=../engine/tests/fixtures/example_schemes.json` makes the README's Getting Started steps run on sample data. Fix: comment the line out (the API defaults to `data/schemes.json`, which I confirmed works).
4. **Ravi's story is thin with real data.** One plan scheme worth ₹20,000, no Almost eligible, no Closed. Decide which mode and persona to record: mock mode keeps the richer story; with real data a persona slightly over the PM-YASASVI income cap (2.5 lakh) would show an Almost eligible card.
5. **README and screenshots are stale.** The dataset row and preview caption still say EXAMPLE, and the five screenshots show EXAMPLE names.
6. **Two source URLs are ministry home pages** (`central-post-matric-sc` and `central-post-matric-st`). Replace with the exact guideline links before calling these records verified. The SC guideline validity also ended 2025-26.
7. **Do not describe all 10 as "verified".** Seven are below 0.7 confidence, and the quota, hostel, merit-percentile and domicile conditions are not checked, so "appears eligible" can overstate a match.
8. **The dropped reason says "(official rule)" for every exclusive pair**, including the inferred central SC and ST versus Karnataka pairs. Either cite only official pairs in the data or change the wording (engine text, not touched here).

### Fix later

- Remove the stray `exclusivity_group` key from the records.
- The engine does not enforce a scheme's `level` list; schemes without a `course_level` criterion match any level (for example the Karnataka professional and hostel schemes, listed UG and PG, match a diploma student).
- Four Karnataka schemes have unknown amounts; the optimiser counts them as 0 and the UI says "Amount not confirmed".
- Add `state_of_domicile` criteria where an official source confirms them.
- Work through `data/schemes_pending_review.md` (many Karnataka schemes, AICTE Swanath needs a new profile field, confirm 2026-27 windows for PM-USP, PM-YASASVI and SC/ST post-matric).
- Income of exactly 2.5 lakh or 10 lakh matches neither Karnataka SC fee scheme; confirm the boundary wording.

## README rows to change

- **Scheme dataset row** (currently yellow, "being collected from official sources. The demo runs on clearly labelled EXAMPLE schemes until it lands"): **keep yellow** and reword to say 10 sourced central and Karnataka schemes are loaded (7 at confidence below 0.7), more are listed for review, and mock mode still uses labelled EXAMPLE schemes.
- **Preview caption** ("Prototype screenshots, shown with labelled sample data"): keep until the screenshots are retaken with real data, then update.
- **Getting Started**: after fixing `.env.example`, add that API mode now uses the real dataset.
- All other rows (engine, interview, optimiser, API, vault, audit log, hi/kn text) can stay as they are. Voice stays yellow. Copilot stays orange.

## Commands

Merge now (safe for the default mock mode; real-data bugs stay until fixed). This also pushes the 2 earlier local commits on `main`:

```
git checkout main
git merge --no-ff data-test
git tag data-final
git push origin main --tags
```

Fix first (recommended): make the fixes on `data-test`, commit them, then run the four commands above.

Abandon (leaves `main` and the `pre-data` tag untouched):

```
git checkout main
git branch -D data-test
git tag -d pre-data
```

To return to the exact pre-data state at any time: `git checkout pre-data`.
