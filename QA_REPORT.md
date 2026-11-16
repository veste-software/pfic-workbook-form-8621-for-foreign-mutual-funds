# QA report, round 3

Checked on 2026-11-16: `npm test` (21 files, 74 passed, 1 todo), `npm run build:preview` (12 pages), `node scripts/design-check.mjs` (nothing found), `npm audit --omit=dev`, the source diff of commit 7953b50, the built HTML (titles, canonicals, sitemap, links outside `/preview/`), and a grep of source and `dist/` for the claims from round 2. No server was started.

## Verdict: not ready (1 blocker, small text fix)

The filled-PDF blocker from round 2 is fixed in the text: no page, locked panel, JSON-LD description or analytics event name promises a filled PDF any more (`tests/claims.test.ts` guards it). The 2017 rate-table limit is only half fixed.

## Blockers

1. **The 2017 interest limit is not stated where the buyer decides to pay (medium-high).**
   - `src/pages/how-it-works.astro:94` now says line 16f is blocked for holdings that start before 2017. Good.
   - The round 2 report asked for the same sentence on `/pricing` and in the workbook near the paste area. Neither was added: `grep 2017` finds nothing in `pricing.astro` or `Workbook.tsx`. The locked panel (`Workbook.tsx` around line 508) sells "results, statements and the lines to type" for USD 55 without the limit.
   - Engine behaviour is safe: `src/lib/engine/index.ts:82` and `:151` block the fund with "Interest cannot be computed: the underpayment rate is not on file for ..." and never use 0%. The problem is only that a buyer with a 2014–2016 SIP learns this after paying.
   - Fix, text only: add to `/pricing` (under the table) and as a `.pencil-note` near the paste area and in the locked panel: "Interest on line 16f is available for holding periods that start in 2017 or later. Earlier holdings are blocked, not estimated." Add a line to `tests/claims.test.ts` that pricing contains "2017".

## What passed

- Engine fixtures 2a–2e, interest closed form, privacy test (only `/api/license` and `/api/checkout` fetches), year-bound license test and tampered-license test, paywall, export round trip, import line-number errors: all in the 74 passing tests.
- Preview: no `href`, `src` or `content` value in `dist/**/*.html` starts with a root path outside `/preview/`. The sitemap has 10 `/preview/` entries; `robots.txt` points to the preview sitemap. Every page has a unique title and a canonical URL.
- Design: `design-check` clean; square corners, no gradients, no emoji, self-hosted Source Serif and IBM Plex Mono, per `DESIGN.md`.
- No testimonials, ratings, countdowns, "IRS-approved" or "CPA-reviewed" in `src/`. No secrets in `src/` or `functions/`. Stripe is a one-off payment (no subscription, so no cancel path needed); the refund window is stated.
- Impressum and Datenschutz come from `src/content/legal/` through `check:dist`.

## SPEC criteria that still fail because of missing operator input

- Criterion 3: the rate table runs 2017-Q1 to 2026-Q4, not from 2003-Q1. The continuity test covers 2017 onward, and the "first row is 2003-Q1" test is still `it.todo`.
- Criterion 5: no `public/forms/f8621.pdf`, no `fill.ts`, no field map, no PDF test. The site no longer claims it. The owner decides whether to ship without the PDF or wait.

## Warnings

- `npm audit --omit=dev`: 1 critical, 3 high, 1 low, via `astro`, `sharp`, `zod`, `esbuild`. The only fix is a breaking bump to `astro@7.4.12`. The site is static, so the advisories look unreachable at runtime, but the studio should upgrade.
- Stale engine messages say "before 2003" (`src/lib/engine/flags.ts:8`, `index.ts:73`, `:144`). Fine, but the real limit for interest is 2017.
- The home canonical is `.../preview` without a trailing slash; every other page and the sitemap use a trailing slash. Make `Base.astro` produce one form.
- `/do-i-need-to-file-form-8621` still carries the "wording being checked" note. `src/data/top-rates.json` was written from general knowledge. Both need human checks.
- Interest on 16f is computed on the line 16c tax per year (see NOTES.md); the reading of the i8621 instructions needs a preparer's check.
- Small mono labels are 13 px. I did not test in a real browser, so 360 px layout and keyboard use were checked by reading CSS and markup only.

## Human tasks

- Place the official IRS Form 8621 (Rev. December 2025) at `public/forms/f8621.pdf` if the filled PDF should ship.
- Supply the quarterly underpayment rates 2003-Q1 to 2016-Q4 with an irs.gov source URL per quarter.
- Verify `src/data/top-rates.json` against IRC §1 and the exceptions wording on `/do-i-need-to-file-form-8621`.
- Decide on the Astro major upgrade for the audit findings.
- Add the Stripe test keys and the license signing key as environment variables on Cloudflare Pages, and test a checkout in test mode.

## Round 3: blockers

- (medium) The 2017 interest limit is stated only on /how-it-works. Add "Interest on line 16f is available for holding periods that start in 2017 or later. Earlier holdings are blocked, not estimated." to /pricing, to the locked panel and as a pencil note near the paste area. [src/pages/pricing.astro; src/components/Workbook.tsx ~line 508]

## Round 3: blockers

- (medium) The 2017 interest limit is not stated where the buyer decides to pay. Add 'Interest on line 16f is available for holding periods that start in 2017 or later. Earlier holdings are blocked, not estimated.' to /pricing, to the locked panel and as a .pencil-note near the paste area, and add a claims test that pricing contains '2017'. [src/pages/pricing.astro; src/components/Workbook.tsx (locked panel ~line 508, paste area); tests/claims.test.ts]
