# Schemes found but NOT loaded into data/schemes.json

These schemes exist on official portals, but the pages read so far give a name and little or no eligibility.
Loading them would make the rules engine show them as "eligible" with missing criteria, which breaks the
rule "do not invent scheme criteria". Each needs its official notice or guideline read before it is added.

Checked on 2026-11-26.

## Karnataka State Scholarship Portal (https://ssp.karnataka.gov.in/Schemes, text in Kannada)

Names translated. Department names come from the portal's own grouping; a few lists could not be attributed
to one department with certainty and are marked.

| Scheme (translated) | Department | What the page states | Missing |
|---|---|---|---|
| Post-matric scholarship for ST students, courses with income above Rs 2.5 lakh and below Rs 10 lakh (medical) | Medical Education | income Rs 2.5-10 lakh, ST, medical courses | amount, docs, window |
| Same for AYUSH courses | AYUSH | income Rs 2.5-10 lakh, ST, AYUSH courses | amount, docs, window |
| Same for MBA/MCA courses | College Education (attribution uncertain) | income Rs 2.5-10 lakh, ST, MBA/MCA | amount, docs, window |
| Stipend for AYUSH final-year degree and all-year PG students in government colleges | AYUSH | name only | everything |
| Post-matric scholarship for SC/ST students (Technical Education) | Technical Education | income Rs 2.5-10 lakh per the Kannada list (second-hand) | engineering scheme text, ST criteria, amount, docs |
| Prathibha Puraskara (free fee) scheme | Technical Education | name only | everything |
| Scholarship for special category students; post-matric for defence students | Technical Education | name only | everything |
| Vidyasiri scheme for Backward Classes students | Backward Classes Welfare | name only | everything |
| Post-matric scholarship for nomadic and semi-nomadic students | Backward Classes Welfare | name only | everything |
| Fee reimbursement for Backward Classes students | Backward Classes Welfare | name only | everything |
| Vidyasiri scheme and fee reimbursement for minorities | Minority Welfare | name only (ended 30/11/2026 per portal) | everything |
| Fee reimbursement for Arya Vysya community students | Arya Vysya Development Corporation | community only | income, amount, docs; last date 30/11/2026 |
| Sandipani scholarship | Brahmin Development Board | name only | everything |
| Sanchi Honnamma scholarship; C V Raman scholarship; Kittur Rani Chennamma award | College Education (attribution uncertain) | name only | everything |
| Fee reimbursement for girl students | College Education (attribution uncertain) | female students | course level, income, amount |
| Fee reimbursement for students affected by HIV/leprosy or their children | College Education (attribution uncertain) | condition only | income, amount |
| Incentive for girl students in government diploma colleges | Medical Education list (attribution uncertain) | female, diploma | amount, income |
| Chief Minister Vidyanidhi scholarships for children of farmers, farm labourers, weavers, transport workers and fishermen | Agriculture; Handloom and Textiles; Transport; Fisheries | occupation of parent | income, amount, docs, level |
| Stipend for SC PhD students in government universities | Social Welfare | PhD only | out of scope (UG engineering) |

Deadlines shown on the SSP home page on 2026-11-24: Technical Education, Minority Welfare and Arya Vysya
scholarships all show a last date of 30/11/2026. Some Technical Education and Disability entries show
30/09/2026 and are closed. These are not attached to any record yet because the matching scheme records
are not loaded.

## Central schemes (National Scholarship Portal)

NSP lists no Karnataka State schemes (its State list has no Karnataka entry), so Karnataka schemes sit on SSP.
Guideline PDFs are on https://scholarships.gov.in/public/schemeGuidelines/ but only download in the browser
and could not be read in this session. Needed next:

- AICTE Pragati (girls, degree): now loaded as `aicte-pragati-degree` from `AICTE_2010_G.pdf` (2020 guidelines).
  The Pragati diploma and Saksham degree guidelines were not in the saved files.
- AICTE Swanath (`AICTE_3038_G.pdf`; `AICTE_3039_G.pdf` is the same text): Rs 50,000 a year for orphans, wards
  of parents who died of Covid-19, wards of martyred armed-forces personnel, or students whose parent has a
  critical illness or severe disability; family income up to Rs 8 lakh; degree or diploma. NOT loaded: the
  qualifying circumstance is not a profile field, so the engine would show it to every student under Rs 8 lakh.
  Needs a new profile field (for example `family_circumstance`) agreed with the engine owner first.
- AICTE Saksham (degree): now loaded as `aicte-saksham-degree` from `AICTE_2012_G.pdf` and the Saksham FAQ.
  `AICTE_2013_G.pdf` is the diploma version and is not used.
- Post-matric scholarship for SC students (central): loaded as `central-post-matric-sc` from guidelines whose
  stated validity is 2020-21 to 2025-26. A 2026-27 renewal still needs to be found.
- Post-matric scholarship for ST students (central): loaded as `central-post-matric-st` from the 2022
  guidelines. The older 2013 file is not used.
- Central minority scholarships (Pre-Matric, Post-Matric, Merit-cum-Means): NOT to be loaded. A Lok Sabha
  answer from the Ministry of Minority Affairs dated 01.04.2026 (`1786345703.pdf`, Unstarred Question 6126)
  says these three schemes "have not been approved for implementation beyond 2021-22". Karnataka's own
  minority schemes on SSP are separate and still listed.
- Top Class education scheme (SC), if the student's institution is notified.

## Not yet checked

- AICTE Pragati, Saksham and Swanath 2026-27: student applications extended to 30.11.2026 (AICTE notification).
  Windows for the other central schemes (PM-USP, PM-YASASVI, SC/ST post-matric) are still not confirmed.
- myScheme's own list of scholarships for Karnataka or for engineering students. The myScheme search page
  ignored its keyword in this session, so scheme slugs were found by web search only.
