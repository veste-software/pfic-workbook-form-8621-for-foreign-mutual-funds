# QA report, round 1

Checked on 2026-11-16 by running: `npm test` (20 files, 72 passed, 1 todo), `npm run build`, `npm run check:dist` (11 pages ok), `npm run design-check` (nothing found), `npm run build:preview`, `npm run size`, `npm audit --omit=dev`. Also read the built HTML, the Pages Functions and the key source files. No server was started and no live account was used.

## Verdict: not ready (2 blockers)

## Blockers

1. **The site sells a filled Form 8621 PDF that the product does not produce (high).**
   - `public/forms/f8621.pdf`, `src/lib/pdf/fill.ts`, `src/lib/f8621-fields.json`, `src/lib/form-revision.json` and `tests/pdf.test.ts` do not exist (PLAN task 13 is `[~]`, blocked). SPEC criterion 5 fails. `src/lib/pdf/statements.ts` only builds the line 16a/MTM statements, the CSV and a "lines to type" file.
   - Yet these places promise the PDF: `src/pages/index.astro:59` ("Your first fund is free, filled PDF included"), `src/pages/index.astro:9` (meta description source: "filled into the official PDF"), `src/pages/pricing.astro:29` (row "Filled Form 8621 PDF and line 16a statement"), the locked panel in `src/components/Workbook.tsx:511` ("unlocks results and PDF"), and the "PDF downloaded" analytics event name. A buyer would pay USD 55 for something that is not in the ZIP.
   - Fix: either (a) get the official f8621.pdf into `public/forms/`, run `npm run pdf:fields`, write the field map and `fill.ts`, add the PDF test for fixtures 2a and 2c, and put the filled forms into the ZIP; or (b) if the PDF cannot be placed this round, remove every "filled PDF / filled into the official PDF" claim from the pages above and state plainly that the filled form is not available yet and that the user types the "lines to type" values into their software. Do not sell it before (a) is done. (The operator must supply the PDF; see humanTasks.)

2. **The IRS rate table starts at 2017 Q1, so any §1291 gain whose holding started before 2017 is blocked (medium-high).**
   - `src/data/irs-underpayment-rates.json` status says 2003 Q1 to 2016 Q4 are missing; SPEC criterion 3 requires every quarter from 2003 Q1, and the "first row is 2003-Q1" test is an `it.todo` (`tests/data/rates.test.ts`). The engine blocks line 16f instead of guessing (good), but a SIP holder from 2014 to 2016, the main buyer, gets no result for a redemption.
   - Fix: add the 2003–2016 quarterly rows from the Internal Revenue Bulletin revenue rulings, each with its real irs.gov URL read from the page. Never fill a rate from memory. Turn the todo into a real test. If the Builder cannot fetch them, say so in NOTES.md and put it under humanTasks; then the site copy must state "interest is available for holding periods from 2017 only" on `/how-it-works`, `/pricing` and the workbook, not only in the blocked message.

## What passed

- Engine fixtures 2a–2e exist with hand-worked comments and pass. Interest is daily-compounded (§6622) from due date of year t to due date of year Y; a missing quarter is reported, never 0%.
- Paywall: `isFundUnlocked`, Ed25519 license verified in the browser, tampered license rejected, year-bound (tests pass). Checkout body is `{ taxYear }` only. Stripe is called through REST with env secrets, no keys in the repo or in `dist/`. One-off payment, no subscription, so no cancel path is needed; the 14-day refund is stated on `/pricing`.
- Privacy test passes; the only fetches are `/api/checkout` and `/api/license`. No analytics script in `dist/` while the env vars are unset, no cookies set.
- Preview: `npm run build:preview` output has no internal href/src/content that does not start with `/preview/`. Sitemap entries and robots sitemap line use `/preview/`. 11 pages in the sitemap (404 correctly excluded).
- Titles, descriptions and h1 are unique on the pages I read; legal pages are checked byte for byte by `check:dist`. The Impressum has a contact address for refund requests.
- Design: `design-check` clean. `brand.css` uses square-ish `--radius`, no gradients, no blur, no side-stripe callouts, Source Serif 4 + IBM Plex Mono self-hosted via fontsource, no emoji. The home page puts the tool above the explanation.
- Bundle: workbook island ~12 kB gz; pdf-lib/fflate are lazy.

## Warnings

- `npm audit --omit=dev`: 1 critical and 3 high, all reported through `astro` <=7.4.6 (its XSS/SSRF/image-endpoint advisories), `sharp` and `zod`. A fix exists only as `astro@7.4.12` (major bump). This site is `output: 'static'` with no server island, no image optimisation and no user input in `define:vars`, so the advisories look unreachable in production, but the owner should know. Try the Astro upgrade after the blockers, and re-run build, tests and design-check.
- Home page canonical in the preview build is `https://example.github.io/preview` (no trailing slash) while the sitemap says `/preview/`. Make `Base.astro` produce one form for the home page.
- `/do-i-need-to-file-form-8621` still carries the "wording being checked" note, because `src/content/i8621-exceptions.md` is not supplied. The rule used is Treas. Reg. 1.1298-1(c) (USD 25,000 / 50,000). The page is honest about it, but it must be checked before launch.
- `src/data/top-rates.json` needs human verification against IRC §1 (see NOTES.md).
- Small mono labels are 13 px, below the 17 px text goal in PLAN task 27. A chosen exception; keep them to labels only.
- I did not test in a real browser (no server allowed), so layout at 360 px and keyboard use were checked by reading CSS and markup only.

## Round 1: blockers

- (high) Home page, pricing table and locked-fund panel promise a 'filled Form 8621 PDF', but PDF filling is not implemented: public/forms/f8621.pdf, src/lib/pdf/fill.ts, src/lib/f8621-fields.json, src/lib/form-revision.json and tests/pdf.test.ts are missing (SPEC criterion 5 fails). The ZIP holds only statements, CSV and lines-to-type. Either implement it once the PDF is placed, or remove every 'filled PDF' claim and state it is not yet available. [src/pages/index.astro:9 and :59; src/pages/pricing.astro:29; src/components/Workbook.tsx:511; src/lib/pdf/]
- (medium) src/data/irs-underpayment-rates.json starts at 2017-Q1 (SPEC criterion 3 requires 2003-Q1); the 'first row is 2003-Q1' test is still it.todo. Any §1291 holding that started before 2017 is blocked at line 16f. Add 2003-2016 rows from IRB revenue rulings with real irs.gov URLs (never from memory) and turn the todo into a test; if impossible, state the 2017-onward limit plainly on /how-it-works, /pricing and in the workbook. [src/data/irs-underpayment-rates.json; tests/data/rates.test.ts]
