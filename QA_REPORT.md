# QA report, round 2

Checked on 2026-11-16: `npm test` (20 files, 72 passed, 1 todo), `npm run build:preview` (12 pages), `node scripts/design-check.mjs` (nothing found), a grep of the built HTML for internal links outside `/preview/` (none), and a grep of the source for the claims from round 1. No server was started. I did not re-run `npm audit` this round (the shell refused a combined command); the round 1 finding stands.

## Verdict: not ready (2 blockers, both carried over from round 1)

The Builder marked both round 1 tasks as blocked and changed no code. The operator inputs they need (the official PDF and the 2003–2016 rate rows) are still missing. The pages still make claims the product cannot meet, so the studio cannot ship this version.

## Blockers

1. **The site sells a filled Form 8621 PDF that the product does not produce (high).**
   - `public/forms/` does not exist, and neither do `src/lib/pdf/fill.ts`, `src/lib/f8621-fields.json`, `src/lib/form-revision.json` or `tests/pdf.test.ts`. SPEC criterion 5 fails.
   - These places still promise the PDF:
     - `src/pages/index.astro:9` (meta description "filled into the official PDF")
     - `src/pages/index.astro:59` ("Your first fund is free, filled PDF included")
     - `src/pages/pricing.astro:29` (row "Filled Form 8621 PDF and line 16a statement")
     - `src/components/Workbook.tsx:511` ("unlocks results and PDF")
     - the analytics event name "PDF downloaded" at `Workbook.tsx:159` (internal only, but rename it to "Statements downloaded")
   - The ZIP holds only the statements, a CSV and a "lines to type" file.
   - Fix, which needs no operator input: remove every "filled PDF" claim and say plainly that the filled IRS form is not available yet and that the user types the "lines to type" values into their tax software. Suggested wording for index.astro:59: "Your first fund is free: results, line 16a statement and a list of the lines to type into your software." Pricing row: "Line 16a statement and lines to type into your software". Keep the PDF task open for when the operator supplies `f8621.pdf`.

2. **Interest is available only from 2017, and the site does not say so (medium-high).**
   - `src/data/irs-underpayment-rates.json` starts at 2017-Q1, and SPEC criterion 3 requires 2003-Q1. The "first row is 2003-Q1" test is still `it.todo`.
   - A §1291 gain with a holding period that starts before 2017 is blocked at line 16f. That is the right behaviour, but no page warns about it up front. `/how-it-works` only lists "before 2003" as a limit (`src/pages/how-it-works.astro:94`), which is wrong while the table starts in 2017. A buyer with a 2014–2016 SIP would find out only after pasting their lots.
   - Fix, which needs no operator input: state "Interest on line 16f is available for holding periods that start in 2017 or later. Earlier holdings are blocked, not estimated" on `/how-it-works` (correct line 94), on `/pricing`, and as a short pencil note in the workbook near the paste area. Keep the todo test until the rows arrive.

## What passed (unchanged from round 1)

- Engine fixtures 2a–2e pass; the privacy test passes (only `/api/checkout` and `/api/license`); the license is verified in the browser and year-bound; Stripe is one-off, test mode and uses env vars. No subscription, so no cancel path is needed.
- Preview: `npm run build:preview` builds 12 pages, and no internal href, src or content value in `dist/*.html` lacks `/preview/`.
- `design-check` is clean. The design follows `DESIGN.md`: square corners, no gradients, no emoji, Source Serif and IBM Plex Mono self-hosted.
- Impressum and Datenschutz are checked byte for byte by `check:dist`.

## Warnings

- `npm audit --omit=dev` (round 1): 1 critical and 3 high via `astro` <=7.4.6, `sharp` and `zod`. A fix exists only as a major bump (`astro@7.4.12`). The site is static with no server islands or image endpoint, so the advisories look unreachable. Try the upgrade once the blockers are fixed.
- The home page canonical under preview is `.../preview` without a trailing slash, while the sitemap uses `/preview/`. Make `Base.astro` produce one form.
- `/do-i-need-to-file-form-8621` still carries the "wording being checked" note. It must be checked before launch.
- `src/data/top-rates.json` was written from general knowledge and needs human verification (see NOTES.md).
- Small mono labels are 13 px, below the 17 px goal. Keep this to labels only.
- I did not test in a real browser, so the 360 px layout and keyboard use were checked by reading CSS and markup only.

## Human tasks

- Place the official IRS Form 8621 (Rev. December 2025) at `public/forms/f8621.pdf`, so the Builder can run `npm run pdf:fields` and build the filler.
- Supply the quarterly IRS underpayment rates for 2003-Q1 to 2016-Q4 with the irs.gov revenue ruling URL for each quarter (or let a Builder with web access read them from irs.gov).
- Supply the i8621 (12/2025) "Exceptions" wording for `src/content/i8621-exceptions.md`.
- Verify `src/data/top-rates.json` against IRC §1.
- Decide on the Astro major upgrade for the audit findings.

## Round 2: blockers

- (high) Pages and the locked panel promise a filled Form 8621 PDF, but PDF filling is not implemented (public/forms/f8621.pdf, fill.ts, field map and pdf test are missing). Remove every 'filled PDF' claim and say the user types the 'lines to type' values into their software; rename the 'PDF downloaded' event. [src/pages/index.astro:9 and :59; src/pages/pricing.astro:29; src/components/Workbook.tsx:511 and :159]
- (medium) The IRS rate table starts at 2017-Q1, so any §1291 holding that began before 2017 is blocked at line 16f, and no page says so (how-it-works wrongly names 2003 as the limit). State 'interest available for holding periods starting 2017 or later' on /how-it-works (fix line 94), /pricing and in the workbook near the paste area. [src/pages/how-it-works.astro:94; src/pages/pricing.astro; src/components/Workbook.tsx; src/data/irs-underpayment-rates.json]
