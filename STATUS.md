# PFIC Workbook: Form 8621 for foreign mutual funds and ETFs, lot by lot

**Stage:** specced · **Platform:** web · **Score:** 3.3/5 · **Spend:** $1.55

For US taxpayers who hold foreign funds (Indian mutual funds of H-1B and green-card holders, UCITS ETFs of US expats). They enter each purchase lot and the yearly values, and the browser works out the default 1291 or mark-to-market figures per share and fills one IRS Form 8621 PDF per fund. If it takes off, it becomes the yearly filing tool with year-end prices already loaded for every Indian mutual fund (AMFI open data), shared in NRI communities.

**Why now:** standing need (Form 8621 is due with every US return, next deadline 2027-04-15). Window: A standing gap: retail software does not do Form 8621 (Belong, March 2026), and the free calculators handle only one lot and no PDF. It stays open because the rules are hard and the payers are scattered over many countries. Seasonal: it must be live before February 2027 to catch the filing season.

## Needs you

- [ ] [task 1] Create a Stripe account, a USD 55 one-off Price, and set STRIPE_SECRET_KEY and STRIPE_PRICE_ID in Cloudflare Pages (test first, live later)
- [ ] [task 2] Generate an Ed25519 key pair and set the private key as LICENSE_SIGNING_KEY in Cloudflare; commit only the public key
- [ ] [task 3] Register a domain, connect Cloudflare Pages, add Google Search Console and submit the sitemap
- [ ] [task 4] Decide EU VAT handling for EU-resident buyers (Stripe Tax or OSS registration)
- [ ] [task 5] Optional before going live: have a US enrolled agent check the four engine fixtures (about USD 200-400 once)
- [ ] [task 6] Each January: check irs.gov About Form 8621 for a new revision and add the newly announced quarterly interest rate

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
