# PFIC Workbook: Form 8621 for foreign mutual funds and ETFs, lot by lot

**Stage:** qa · **Platform:** web · **Score:** 3.3/5 · **Spend:** $13.08

For US taxpayers who hold foreign funds (Indian mutual funds of H-1B and green-card holders, UCITS ETFs of US expats). They enter each purchase lot and the yearly values, and the browser works out the default 1291 or mark-to-market figures per share and fills one IRS Form 8621 PDF per fund. If it takes off, it becomes the yearly filing tool with year-end prices already loaded for every Indian mutual fund (AMFI open data), shared in NRI communities.

**Why now:** standing need (Form 8621 is due with every US return, next deadline 2027-04-15). Window: A standing gap: retail software does not do Form 8621 (Belong, March 2026), and the free calculators handle only one lot and no PDF. It stays open because the rules are hard and the payers are scattered over many countries. Seasonal: it must be live before February 2027 to catch the filing season.

## Needs you

- [ ] [task 1] Create a Stripe account, a USD 55 one-off Price, and set STRIPE_SECRET_KEY and STRIPE_PRICE_ID in Cloudflare Pages (test first, live later)
- [ ] [task 2] Generate an Ed25519 key pair and set the private key as LICENSE_SIGNING_KEY in Cloudflare; commit only the public key
- [ ] [task 3] Register a domain, connect Cloudflare Pages, add Google Search Console and submit the sitemap
- [ ] [task 4] Decide EU VAT handling for EU-resident buyers (Stripe Tax or OSS registration)
- [ ] [task 5] Optional before going live: have a US enrolled agent check the four engine fixtures (about USD 200-400 once)
- [ ] [task 6] Each January: check irs.gov About Form 8621 for a new revision and add the newly announced quarterly interest rate
- [ ] [task 7] Download the official https://www.irs.gov/pub/irs-pdf/f8621.pdf (Rev. December 2025) and place it at public/forms/f8621.pdf
- [ ] [task 8] Copy the exact 'Exceptions' wording from https://www.irs.gov/pub/irs-pdf/i8621.pdf (12/2025) into src/content/i8621-exceptions.md
- [ ] [task 9] Add IRS §6621(a)(2) underpayment rates for 2003-Q1 to 2016-Q4 to src/data/irs-underpayment-rates.json, each with its irs.gov IRB/revenue-ruling URL, and spot-check the 2017-2026 rows
- [ ] [task 10] Verify the highest individual tax rates per year 2003-2026 against IRC §1 (src/data/top-rates.json once the Builder creates it)
- [ ] [task 11] Create a Stripe account in test mode, create a USD 55 one-off Price, and set STRIPE_SECRET_KEY and STRIPE_PRICE_ID in Cloudflare Pages env
- [ ] [task 12] Generate an Ed25519 key pair: set the private key as LICENSE_SIGNING_KEY in Cloudflare env, and the public key as PUBLIC_LICENSE_PUBLIC_KEY
- [ ] [task 13] Register a domain, connect Cloudflare Pages with SITE_URL set to it, and submit the sitemap in Google Search Console
- [ ] [task 14] Decide EU VAT handling for EU buyers (Stripe Tax or OSS registration)
- [ ] [task 15] Optionally set PUBLIC_ANALYTICS_SRC and PUBLIC_ANALYTICS_DOMAIN for a cookie-free Plausible-compatible analytics service
- [ ] [task 16] Blocked: 13. Form PDF filling (and the PDF part of 14) (public/forms/f8621.pdf has not been placed by the operator; the operator must add the official IRS Form 8621 (Rev. December 2025) to public/forms/.)
- [ ] [task 17] Blocked: 13. Form PDF filling (and the PDF part of 14) (public/forms/f8621.pdf (official IRS form, Rev. December 2025) is not present; the operator must place it in public/forms/.)
- [ ] [task 18] Blocked: 13. Form PDF filling (and the PDF part of 14) (public/forms/f8621.pdf is not present; the operator must place the official IRS form (Rev. December 2025).)
- [ ] [task 19] Blocked: 13. Form PDF filling (and the PDF part of 14) (public/forms/f8621.pdf is not present; the operator must place the official IRS form Rev. December 2025.)
- [ ] [task 20] Blocked: 20 (wording only): i8621 12/2025 Exceptions text (The operator must supply the exact Exceptions wording in src/content/i8621-exceptions.md; the page shows a marked placeholder line until then.)
- [ ] [task 21] Blocked: 13. Form PDF filling (public/forms/f8621.pdf is not present; the operator must place the official IRS form (Rev. December 2025).)
- [ ] [task 22] Run npm run build, npm test and npm run design-check once and fix anything the Base.astro changes broke (they were not run in this session)
- [ ] [task 23] Set SITE_URL to the real domain in Cloudflare Pages so canonicals, the sitemap and robots.txt are correct
- [ ] [task 24] Add the site to Google Search Console and Bing Webmaster Tools, submit sitemap-index.xml, and use IndexNow via Bing
- [ ] [task 25] Set PUBLIC_ANALYTICS_SRC and PUBLIC_ANALYTICS_DOMAIN for cookie-free analytics, so the key-step events are recorded
- [ ] [task 26] Make a 1200x630 PNG social preview image in the ledger style and add it as og:image
- [ ] [task 27] Post in the communities and directories listed in growth/PLAN.md (Reddit, Bogleheads, AlternativeTo, Product Hunt) after reading each one's self-promotion rules
- [ ] [task 28] Place the official IRS f8621.pdf (Rev. December 2025) from https://www.irs.gov/pub/irs-pdf/f8621.pdf at public/forms/f8621.pdf so the Builder can map fields and fill it.
- [ ] [task 29] Supply the exact 'Exceptions' wording from the Form 8621 instructions (12/2025) as src/content/i8621-exceptions.md and verify src/data/top-rates.json against IRC §1.
- [ ] [task 30] Create a Stripe account (test mode), a USD 55 one-off Price, and set STRIPE_SECRET_KEY and STRIPE_PRICE_ID in Cloudflare Pages env.
- [ ] [task 31] Generate an Ed25519 key pair; set LICENSE_SIGNING_KEY (private) in Cloudflare env and PUBLIC_LICENSE_PUBLIC_KEY (public) at build time. Without the public key no license can be activated.
- [ ] [task 32] Set SITE_URL to the real domain in Cloudflare Pages, register the domain and submit the sitemap in Search Console.
- [ ] [task 33] Decide EU VAT handling (Stripe Tax or OSS) for EU buyers.
- [ ] [task 34] Blocked: [QA round 1] Implement filled Form 8621 PDF output (public/forms/f8621.pdf is missing and I have no web access. Without it the AcroForm field names are unknown. Operator must place the official IRS Form 8621 PDF (Rev. December 2025) at public/forms/f8621.pdf.)
- [ ] [task 35] Blocked: [QA round 1] Extend irs-underpayment-rates.json back to 2003-Q1 (The 2003-Q1 to 2016-Q4 rates must come from the IRS revenue rulings, each with its irs.gov URL, and I have no web access. The operator must supply the figures and sources.)

## Recommendation

None yet. The Growth role gives one after launch.

## Metrics

No real numbers yet. Fill in `metrics.json` (Search Console, analytics, Stripe); agents never invent them.

## Monetisation

one-off (USD 55 (about 49 EUR) per tax year, all funds on one return; first fund free incl. filled PDF)

## Target queries

- pfic calculator
- form 8621 calculator
- 8621 pfic calculator
- free pfic calculator
- pfic excess distribution calculator
- pfic interest calculator
- pfic tax calculator excel
- form 8621 mark to market
- form 8621 indian mutual funds
- do i need to file form 8621
- form 8621 ucits etf

## Alternatives found

- Richify Form 8621 calculator (partial): one lot, 1291 only, no mark-to-market, no form output
- taxbracketcalc PFIC tax calculator (partial): estimate comparing regimes; seen in search only, no form output stated
- Form 8621 Calculator (G2 listing) (solid): price on request, aimed at preparers; not opened, features not verified
- TaxesForExpats PFIC filing (partial): a CPA service at USD 200 for the first form and 150 for each extra, not self-serve

## Kill criteria

- Fewer than 1,500 Search Console impressions on the query set by 2027-03-15 (fix titles once)
- Fewer than 300 organic clicks or fewer than 10 paid unlocks by 2027-04-30: park
- Fewer than 30 paid unlocks in total by 2027-10-31: kill
- Two confirmed calculation errors in one season: take paid unlock offline until reviewed

## Links

- Repo: https://github.com/veste-software/pfic-workbook-form-8621-for-foreign-mutual-funds
- Preview (GitHub Pages, builds from main): https://veste-software.github.io/pfic-workbook-form-8621-for-foreign-mutual-funds/

## History

- 2026-11-16 01:56 · scouted · ranked first in the daily pool (aggregate 3.65 of 5 by 3 independent rankers); the studio builds the day's best candidate whatever its score, and the prototype is how it is judged
- 2026-11-16 02:09 · specced · spec written
- 2026-11-16 02:21 · planned · scaffold and plan written
- 2026-11-16 02:48 · building · build started
- 2026-11-16 04:07 · seo · all planned tasks done
- 2026-11-16 04:14 · qa · seo and conversion foundations written
- 2026-11-16 04:20 · building · visual review round 1: clarity 3, ease 2, average 2.8
- 2026-11-16 04:27 · qa · all planned tasks done
- 2026-11-16 04:34 · building · visual review round 2: clarity 3, ease 3, average 3
- 2026-11-16 04:41 · qa · all planned tasks done
- 2026-11-16 04:48 · building · QA round 1 found 2 blocker(s)
- 2026-11-16 04:53 · qa · all planned tasks done
