# SPEC: PFIC Workbook: Form 8621 for foreign mutual funds, lot by lot

Product id: `pfic-workbook-form-8621-for-foreign-mutual-funds` · platform: web · language: en
Written by the Product lead on 2026-11-16. This is the day's prototype pick: build it narrow, ship it before the 2027 filing season.

**The angle, in one line:** a US filer with monthly SIP purchases into Indian mutual funds (or regular buys of UCITS ETFs) enters or pastes every lot once. The browser works out the per-lot §1291 and mark-to-market figures and fills one official IRS Form 8621 PDF per fund, plus the line 16a statement. It costs **USD 55 per tax year for all funds**. Today the same job costs USD 60 a year plus USD 85 per form at PFIC Pro, or USD 150 to 200 per form at an expat CPA. Nothing leaves the device.

---

## 1. Problem and users

US tax law treats almost every non-US pooled fund as a PFIC: Indian mutual funds, ELSS, Indian ETFs, and UCITS ETFs bought in Europe. A US person who holds one may have to file a separate **Form 8621 for each fund, every year**. The figures are worked out **per share**: "Each purchase (including dividend reinvestments) is treated as its own separate event for purposes of Form 8621. Calculations for this form are on a per share basis." (TurboTax Employee Tax Expert, 2023-12-30). A monthly SIP therefore produces 12 lots per fund per year, and five funds over six years produce hundreds of lots.

**Primary payer:** an H-1B worker, green-card holder or new US citizen who kept Indian mutual-fund SIPs. They hold 2 to 15 funds, do their own return (TurboTax, TaxAct, FreeTaxUSA), and are told by a CPA that Form 8621 costs USD 150 to 2,000 per fund.
**Secondary payer:** a US expat in Europe holding 1 to 5 UCITS ETFs. Mark-to-market clearly applies to their listed ETFs.

The job: for tax year Y, produce for each fund the correct Part I values, the Part IV mark-to-market figures or the Part V §1291 figures (for a redemption), and a filled Form 8621 PDF. The user then attaches the PDF to a paper return, or types the line values into software that has the form but does not compute it (TaxAct has a fillable Form 8621; TurboTax does not include it at all).

## 2. Why now

- **No trigger. This is a standing, seasonal need.** Form 8621 is due with every return. The next deadlines are **2027-04-15** (residents), **2027-06-15** (automatic extension for those abroad) and **2027-10-15** (extended). The current IRS revision is **Form 8621 (Rev. December 2025)** with instructions dated 12/2025 (irs.gov "About Form 8621" page, last reviewed 2026-03-30, "Recent developments: None").
- **What keeps the gap open:** the rules are hard, the payers are spread across many countries, and the paid tool (PFIC Pro) is priced and built for preparers: credits, per-form fees, and a demo that ends after one form. Retail software does not compute the form. Free calculators handle one lot and produce no form.
- **Ship by 2026-12-20** so Google can index the pages before people start on their returns in February 2027. **2027-01-31** is the hard latest date. After that, the main season is missed and the next chance is the June and October extension waves.

## 3. Evidence (checked by me on 2026-11-16)

| What | Source | Date shown |
|---|---|---|
| PFIC Pro (Expat Tax Tools) sells self-serve Form 8621 generation to individuals and professionals: annual fee 60 credits (USD 60), **pay-as-you-go 85 credits (USD 85) per form**, bundles down to USD 12 per form at 500 forms. The demo ends after one form or two weeks. Supports 1291/QEF/MTM, Excel import, IRS-formatted PDF | https://expattaxtools.com/pfic-pro-calculator/ (redirect from form8621.com) | "Effective: November 2026" |
| Taxes for Expats: Form 8621 **USD 200 first, USD 150 each additional**, as an add-on to a USD 450 federal return. §1291 cases are billed hourly | https://www.taxesforexpats.com/services/pfic-filing.html | footer © 2026, neighbouring articles Nov 2026 |
| Expat Tax Tools preparation service: USD 165 per form base (from Excel) | https://stocks.observer-reporter.com/observerreporter/news/read/43931059/expat_tax_tools_introduces_hassle | 2024-02-23 (older; the current page says USD 180) |
| Belong NRI guide: cross-border CPAs charge "USD 500-2,000 per fund per year". "Most retail tax software does not support Form 8621 calculations". "Each monthly purchase creates a separate lot". "Most cross-border CPAs recommend MTM for Indian mutual fund holdings, despite the technical exchange qualification issue" | https://getbelong.com/blog/mutual-funds/report-indian-mutual-funds-on-us-tax-return/ | updated 2026-03-09 |
| TrustNRI sells a CA-prepared "PFIC data pack" for Indian funds (lots since inception, Dec 31 NAVs, USD figures). Price on quote. It does **not** prepare Form 8621 | https://www.trustnri.in/situations/indian-mutual-fund-pfic-data-pack-us | reviewed 2026-10-18 |
| Richify free calculator: one buy date, one sale, §1291 only, no MTM, no QEF, no PDF | https://www.richify.ai/us/tools/form-8621-calculator | reviewed 2026-11-10 |
| TurboTax community: SIP buyer asks how to report multiple purchase dates for MTM; answer: per-share, "Form 8621 isn't included in any TurboTax version" | https://ttlc.intuit.com/community/taxes/discussion/reporting-multiple-purchases-dates-on-form-8621/00/3120962 | 2023-12-30 (old; shows the job, not recency) |
| Google autocomplete "pfic calculator": 10 variants incl. "free pfic calculator", "pfic tax calculator excel", "8621 pfic calculator", "pfic interest calculator", "pfic excess distribution calculator" | suggestqueries.google.com, q=pfic calculator | fetched 2026-11-16 |
| Autocomplete "form 8621 indian": "form 8621 india reddit", "form 8621 example", "do i need to file form 8621" | suggestqueries.google.com | fetched 2026-11-16 |
| IRS: Form 8621 Rev. December 2025, instructions 12/2025, PDF at irs.gov/pub/irs-pdf/f8621.pdf | https://www.irs.gov/forms-pubs/about-form-8621 | reviewed 2026-03-30 |

What I could **not** verify: search volumes, PFIC Pro's customer count, and a forum request from the last 90 days. Reddit could not be reached. The TurboTax thread is from 2023. AMFI's NAV site refused connections from here, so the NAV preload is **not** in the MVP (see §5).

## 4. Positioning

**The gap:** nobody sells a self-serve, per-lot Form 8621 workbook that a household with many SIP lots across many funds can finish in one evening for one flat price. The paid tool charges per form, and the free tools stop at one lot with no form.

| Alternative | URL | What it lacks for this payer |
|---|---|---|
| PFIC Pro / Form 8621 Calculator (Expat Tax Tools) | expattaxtools.com/pfic-pro-calculator/ | Priced for preparers: USD 60 a year + USD 85 per form, so **5 funds = USD 485**. Credit system, monthly fee on inactive accounts, demo ends after 1 form |
| Taxes for Expats (CPA service) | taxesforexpats.com/services/pfic-filing.html | USD 200 + 150 per form on top of a USD 450 return. Not self-serve, takes days |
| Richify Form 8621 calculator | richify.ai/us/tools/form-8621-calculator | One lot only, §1291 only, no MTM, no form |
| taxbracketcalc PFIC calculator | taxbracketcalc.pages.dev/capital-gains/pfic-tax-calculator/ | Regime comparison estimate, no lots, no form (seen in search only) |
| Investmates PFIC exposure checker, NSKT calculator, Arthgyaan simulator | investmates.io, nsktglobal.com, arthgyaan.com | Exposure estimates and lead-gen for services. No per-lot figures, no filled form (pages returned 502/403 to me; seen in search results) |
| TrustNRI PFIC data pack | trustnri.in | A CA rebuilds the lots for a quote. Explicitly does not produce Form 8621 |
| TaxAct fillable Form 8621 | support.taxact.com | Lets you type the lines and e-file, but does not compute per-lot figures. **We are its upstream:** the line values are what you type in |
| An AI chat assistant | n/a | Cannot be trusted with day-count allocation across years, IRS quarterly interest compounded daily, per-lot unreversed inclusions, or filling the AcroForm fields exactly. One wrong digit is a wrong federal filing |

**What only this product does:** per-lot MTM and §1291 figures with a carried-forward basis history across years. One flat price per tax year covers all funds. Official IRS PDFs come filled, plus a line 16a statement. It runs fully in the browser with no upload. The free first fund lets the user check the figures against their own spreadsheet or CPA before paying.

Copy rules for Growth: never claim "IRS-approved", "CPA-reviewed" or "guaranteed". Say "fills the official IRS Form 8621 (Rev. December 2025)" and "shows every figure and its rule so you or your preparer can check it".

## 5. MVP scope

### In (MVP, the one-day prototype; everything below is required)

1. **Workbook (home page `/`)**: tax year selector (2025 and 2026). Filing status (single / MFJ, used only by the threshold check). Optional "date you became a US person".
2. **Funds**: add/rename/delete funds. Each fund has a name, an optional ISIN or scheme code, a currency code (INR, EUR, GBP, CHF, CAD, AUD, SGD, HKD, JPY, or other free text), and a regime: **§1291 (no election)** or **§1296 mark-to-market with first election year E**. QEF is shown as "not supported, see a preparer". Indian funds do not issue the annual information statement QEF needs.
3. **Lots table per fund**: one row per acquisition (date, units, cost in fund currency, FX rate to USD **or** a USD cost entered directly), including dividend reinvestments. **Paste from spreadsheet** (tab or comma separated) and **CSV import** with a downloadable template (`date,type,units,amount,fx_rate,usd_amount`, type ∈ buy|reinvest|redeem). Redemptions are rows of type `redeem`.
4. **Year-end values per fund**: for every tax year from the first lot's year to Y, the NAV/price per unit on the last valuation day of the year and the Dec 31 FX rate (user-entered). A helper text tells the user where to find them (fund house NAV history, US Treasury year-end rates). The tool never guesses a value.
5. **Engine** (pure TypeScript module, no DOM, fully unit-tested; rules below in §5a).
6. **Results per fund**: Part I values, Part IV or Part V lines, a per-lot table, and a red-pencil "check this" note for every case listed in §5a "Flags".
7. **Filing threshold check** (also a stand-alone page): applies the exception in the Form 8621 instructions (12/2025) section "Who must file" / exceptions. The Builder quotes the exact wording on the page and links it.
8. **Output**: for each fund, the **official f8621.pdf (Rev. December 2025) filled** with pdf-lib, plus a generated **Statement for line 16a** (per-lot allocation table) and, for MTM, a per-lot MTM statement. ZIP download of all funds, CSV export of the per-lot results, and a "lines to type into your tax software" summary.
9. **Save/load**: autosave to localStorage, plus export/import of a workbook `.json` file. Next year the user loads last year's file and the basis history carries over.
10. **Paywall**: free = everything for **one fund** (results, filled PDF, statement). Paid = all funds for the selected tax year. Unlock is a Stripe Checkout one-off (test mode) handled by a single Cloudflare Pages Function. It returns a **license code signed with Ed25519** (payload: tax year, random id, issue date). The browser verifies it with the embedded public key and stores it in localStorage and in the workbook file. No accounts.
11. **Pages**: see §8, plus `/pricing`, `/impressum`, `/datenschutz` (legal texts from `src/content/legal/`, shown unchanged), and `/how-it-works` (method and sources).

### 5a. Calculation rules the engine must implement (cite sources in code comments and on /how-it-works)

The Builder downloads `https://www.irs.gov/pub/irs-pdf/f8621.pdf` and `i8621.pdf` (Rev. 12/2025), stores the form PDF in the repo, and records the revision in `src/lib/form-revision.json`. Where a rule below conflicts with the 12/2025 instructions, the instructions win. Note the conflict in `NOTES.md`.

- **USD conversion**: lot basis USD = cost × FX rate at the purchase date (or the USD entered). Year-end value USD = units × NAV × Dec 31 rate. Proceeds USD = amount × rate on the redemption date.
- **Lot matching for redemptions**: FIFO (the default the Indian fund houses use). Partial lots are split pro-rata by units.
- **§1291 disposition (Part V, line 15f/16)**: per matched lot, gain = proceeds USD − basis USD. Each gain lot is allocated ratably by day over its holding period (the day after acquisition through the disposition date). The days in the current tax year and the days before the first PFIC year of the holding (for a user who opts in: days before the US-person date, shown as a labelled user choice with its source) give **ordinary income (16b)**. Each prior year t is taxed at the **highest individual rate for year t** (table 2003–2012 35%, 2013–2017 39.6%, 2018 onward 37%; the Builder verifies each against IRC §1 and cites it). These deferred taxes sum to **16c**. 16d (foreign tax credit) is a user field, default 0. 16e = 16c − 16d. **16f interest** on each year's deferred tax runs from the unextended due date of the year-t return to the unextended due date of the year-Y return. It uses the IRC §6621(a)(2) underpayment rate for each quarter, **compounded daily (§6622)**. The quarterly rate table goes in `src/data/irs-underpayment-rates.json` with one row per quarter from 2003 Q1 to the latest announced quarter, **each row with the IRS news-release URL it came from**.
- **Loss lots under §1291**: not allocated. They are listed in the statement. If a disposition has both gain and loss lots, line 15f shows the sum of gain lots and a red-pencil flag asks the user to check the line 15f instructions. Never net silently.
- **Excess distributions (IDCW/dividend payouts, lines 15a–15e)**: MVP computes lines 15a–15e (the 125% test against the prior 3 years' distributions) and **flags** any positive excess distribution as "allocation not supported in this version". It does not compute 16b–16f for it.
- **MTM (Part IV)**: per lot, each year from E onward: gain = year-end value − adjusted basis gives ordinary income. A loss is allowed only up to that lot's unreversed inclusions (ordinary loss). The basis rises by included gains and falls by allowed losses (§1296(a), (b), (d)). Lots bought during a year are marked at that year-end. On redemption of an MTM lot: gain is ordinary income. A loss is ordinary up to unreversed inclusions, and the rest is a capital loss shown separately. Form lines are the sums over lots.
- **First MTM year coordination (§1296(j))**: lots held before Jan 1 of year E (when the fund was a PFIC with no election) are treated in year E as disposed at the year-end value under the §1291 rules above, reported in Part V. Their MTM basis afterwards is that year-end value. Lots bought in year E are plain MTM.
- **Part I**: units held at year end, year-end value (or value range box as on the 12/2025 form), and the fund type checkbox. **Part II**: election box for MTM in year E only.
- **Rounding**: compute in full precision. Round to whole dollars only when writing form fields. Statements show cents.
- **Flags** (red-pencil notes, never silent): the US-person date falls inside a lot's holding period under MTM (the special basis rule for new US persons is **not** applied in this version), mixed gain/loss lots under §1291, a positive excess distribution, missing year-end NAV or FX for any year needed, holding period before 2003, QEF selected.

### Out of scope (explicitly)

- QEF, deemed-sale/purging elections, §1291 allocation of excess distributions, the new-US-person MTM basis rule, partnerships/trusts/indirect holdings, fiscal-year filers, corporations.
- **Preloaded AMFI year-end NAVs and FX tables.** The AMFI site was unreachable during research, and the studio's rule is that data is fetched and checked before a build depends on it. First addition after launch (target 2027-01-15), only once a fetched file has been checked.
- Parsing CAMS/KFintech CAS PDFs (later, if paid users ask).
- E-filing, accounts, email, multi-user, preparer bundles.

## 6. Acceptance criteria (QA checks each without a live account or paid key)

1. `npm test` and `npm run build` pass. The build output is static, plus one Pages Function in `functions/`.
2. **Engine tests** in `tests/engine/` with at least these fixtures, each with expected values worked out independently and the working written in the test file as comments:
   a. §1291: one lot bought 2021-03-10, fully redeemed 2025-08-20, gain USD 10,000: the day allocation by year, 16b, 16c (37% / 37% / 37% / 37% for 2021–2024 portions), and 16f > 0 using the rate table.
   b. §1291 with 24 monthly SIP lots and a partial FIFO redemption: the matched units and basis are correct.
   c. MTM from first year (E = first holding year): 3 years, one loss year, with unreversed inclusions limiting the loss and basis carried correctly.
   d. MTM late election (E later than the first holding year): pre-E lots go through §1291 in year E (Part V filled), and post-E lots are MTM.
   e. Mixed gain/loss lots raise the flag. A missing year-end NAV blocks results for that fund with a clear message.
3. `src/data/irs-underpayment-rates.json` has a row for every quarter from 2003 Q1 to at least 2026 Q4, and every row has an `https://www.irs.gov/...` source URL. A test checks continuity (no missing quarter).
4. Interest is compounded daily. A unit test checks a single-rate case against the closed form `P × ((1 + r/365)^d − 1)` (use 366 in leap years).
5. **PDF**: a test fills the bundled f8621.pdf for fixtures 2a and 2c, reloads it with pdf-lib, and reads back the expected values in the mapped fields (`src/lib/f8621-fields.json` maps logical line ids like `p5_16b` to AcroForm names). The filled form keeps the IRS layout. No field is flattened away.
6. Paste of 24 tab-separated rows and CSV import of the template both create 24 lots. Malformed rows are reported by line number, not dropped silently.
7. **Paywall**: with no license, a second fund's results and PDF show an honest locked message with the price and a buy button. A test generates a test Ed25519 key pair, signs a license for year 2025, and confirms that it unlocks 2025 only, while a tampered license is rejected.
8. **Privacy**: lot data never leaves the browser. A test or grep confirms the only `fetch` calls go to same-origin static assets and `/api/checkout` / `/api/license`, and neither request body contains lot or fund data.
9. Workbook export, then import, round-trips to identical engine results.
10. Every page in §8 exists, has a unique title and meta description, and is listed in `sitemap.xml`. `/impressum` and `/datenschutz` render the files in `src/content/legal/` unchanged. Analytics, if any, sets no cookies.
11. Every results view and every PDF statement page carries the line "Prepared with PFIC Workbook from figures you entered. This is not tax advice. Check it or have a preparer check it." It never says "IRS-approved".
12. No countdowns, fake counters, reviews or testimonials anywhere.

## 7. Monetisation

- **Model:** one-off payment per tax year (a "season pass"). **Price: USD 55 per tax year (≈ 49 EUR), all funds on one return (one household, MFJ included).** Charged in USD via Stripe Checkout (test mode during the build). It is not a subscription. Next year is a new, optional purchase.
- **Free:** the full workbook, the threshold check, and complete results plus the filled PDF for one fund. The free fund is how a cautious filer checks us against their own spreadsheet.
- **Paywall position:** when the user adds results or PDFs for a second fund. The locked panel shows the price, what unlocks, and the PFIC Pro comparison ("5 funds there: USD 485") with its source link. No dark patterns. A refund on request within 14 days is stated plainly (the owner can change this on the pricing page text, but it must be honest).
- **Why this payer pays:** the alternative for 5 funds is USD 485 (PFIC Pro) or USD 950+ (TFX CPA). Doing it by hand means hundreds of lots, day-count allocation and quarterly interest compounding, and a mistake leaves the return open (the statute of limitations stays open without a correct 8621).

**Marketing claim (channel: search).**
- *Where:* Google queries "pfic calculator", "form 8621 calculator", "8621 pfic calculator", "pfic excess distribution calculator", "pfic interest calculator", "pfic tax calculator excel", "form 8621 mark to market", "form 8621 indian mutual funds", "do i need to file form 8621".
- *Proof:* the autocomplete lists in §3 (10 variants for "pfic calculator", 2026-11-16). Ranking pages today are calculators (Richify, taxbracketcalc) and service firms (TFX, NSKT, Investmates). No ranking page is a per-lot form filler.
- *Volume:* not measurable here. 10 autocomplete variants for the head term. At least 8 publishers wrote 2026 guides on Indian MFs and PFIC (Belong, TFX, Dinesh Aarjav, InvestingPro, TrustNRI, Investmates, VisaVerge, thenriguide).
- *Reach:* **visitsPerYear 3,000 (assumed)**, from a new domain over two seasons (Feb–Apr and Sep–Oct 2027). **conversionPct 1.5% (assumed;** a freemium tool with one free fund; no comparable rate found).
- *First 100 payers:* filers who search "pfic calculator" or "form 8621 indian mutual funds" in Feb–Apr 2027, finish one fund free, and pay to unlock their other funds. Later, people who link it in NRI forum threads.
- *costPerCustomerEur:* 0 (organic).
- *whyNotFoundToday:* the results for these queries are one-lot calculators and CPA lead pages. The one self-serve tool is priced per form for preparers and does not rank as a consumer tool.

**Profit (first 12 months after launch, base case):**
- Bottom-up: 3,000 visits × 1.5% = **45 payers** × 49 EUR = 2,205 EUR. Stripe fees on international cards ≈ 3.25% + 0.25 EUR each ≈ 85 EUR. Domain ≈ 12 EUR. Hosting on Cloudflare Pages + Functions free tier = 0. **≈ 2,100 EUR, rounded down to 2,000** for VAT on any EU-resident buyers.
- Cross-check: I found no customer count or revenue for a comparable (PFIC Pro publishes prices but not volume), so there is no second volume estimate. The price check holds: buyers pay USD 85–200 per form today, so USD 55 for all funds is well inside what this payer already spends. I use the bottom-up figure.
- **Payers needed for 5,000 EUR a year:** ≈ 107 (at ≈ 47 EUR net each), which needs ≈ 7,100 visits at 1.5%. **The channel probably cannot reach that in year one** from a new domain. It plausibly can in season two, when the pages have aged.
- Upside (1 in 10): 15,000 visits × 2.5% = 375 payers ≈ 17,000 EUR net.

## 8. Target queries and page plan (every page is a working tool or a substantive answer; no generated page farms)

| Query | Page | What the page does |
|---|---|---|
| pfic calculator, form 8621 calculator, 8621 pfic calculator, free pfic calculator | `/` | The workbook itself, with one fund free |
| pfic excess distribution calculator, pfic interest calculator | `/pfic-excess-distribution-calculator` | The §1291 disposition calculator (multi-lot), showing the day allocation, deferred tax per year and daily-compounded interest per quarter. It uses the same engine and opens in the workbook |
| form 8621 mark to market | `/form-8621-mark-to-market` | MTM explained, with a live 3-year per-lot example from the engine, and the late-election (§1296(j)) case |
| form 8621 indian mutual funds, form 8621 sip, pfic indian mutual funds | `/form-8621-indian-mutual-funds-sip` | Guide for SIP holders: where to get lots (CAS from CAMS/KFintech/MFCentral), calendar-year vs Indian FY, the MTM debate stated honestly with sources, and a "start with INR" preset |
| pfic tax calculator excel | `/pfic-calculator-excel-template` | Downloadable CSV template plus import. Explains the columns. Export of results to CSV |
| do i need to file form 8621, form 8621 filing threshold | `/do-i-need-to-file-form-8621` | Threshold checker quoting the 12/2025 instructions |
| form 8621 ucits etf | `/form-8621-ucits-etf` | Guide and "start with EUR/GBP" preset for expats with listed ETFs |
| – | `/how-it-works`, `/pricing`, `/impressum`, `/datenschutz` | Method, rule sources, price, legal |

## 9. Success metrics and kill criteria

- **By 2027-03-15:** at least 1,500 Search Console impressions on the query set. Otherwise fix the titles and the guide pages once.
- **By 2027-04-30 (end of main season):** fewer than 300 organic clicks **or** fewer than 10 paid unlocks → park.
- **By 2027-10-31 (after the extension season):** fewer than 30 paid unlocks in total → kill.
- If a user reports a wrong figure that a test confirms, fix it within the season. Two confirmed calculation errors in one season → take the paid unlock offline until reviewed.

## 10. Legal and platform notes

- Self-prepared software: no PTIN is needed, because the user prepares and signs their own return. Do not offer advice, review or "preparer" services. Show the not-tax-advice line (criterion 11). Never use "IRS approved".
- IRS forms are US government works. Filling the official fillable PDF is not a substitute form. Do not alter the layout.
- Privacy: no financial data is transmitted or stored server-side. Stripe receives only the purchase. The Datenschutz text is the owner's, unchanged.
- Sales tax/VAT: buyers are mostly US consumers (no German VAT on B2C e-services outside the EU). EU-resident buyers (the UCITS segment) trigger EU VAT via OSS. The owner decides: enable Stripe Tax or register for OSS.
- Each year a person checks once whether the IRS revised Form 8621 and the field map, and adds the new quarterly interest rates. This is about one hour a year; it is listed under human tasks.

## 11. Human tasks

- Create or choose a Stripe account, create a USD 55 one-off Price, set `STRIPE_SECRET_KEY` and `STRIPE_PRICE_ID` in Cloudflare Pages env (test first, live later).
- Generate an Ed25519 key pair. Set the private key as `LICENSE_SIGNING_KEY` in Cloudflare env. Commit only the public key.
- Register a domain (≈ 12 EUR/yr), connect Cloudflare Pages, add the site to Google Search Console and submit the sitemap.
- Decide EU VAT handling for EU buyers (Stripe Tax or OSS registration).
- Recommended before going live: have a US enrolled agent check fixtures 2a–2d (one-off, roughly USD 200–400, optional).
- Each January: check irs.gov "About Form 8621" for a new revision and add the newly announced quarterly interest rate.

## 12. Look and feel

The visitor is a software engineer on an H-1B in Seattle or an expat in Berlin, on a weekday evening in March. They are worried and a little ashamed of not having filed this before, with a CAS statement or broker export open in another tab. This product is the digital cousin of an **accountant's green-ruled columnar ledger pad** (the 14-column analysis paper with a pencil margin). Lots sit in ruled rows with tabular figures. Form 8621 line numbers ("15f", "16c") sit in the left margin the way a preparer pencils them, and anything to check is a **red-pencil note** in the margin, not a toast. The mood is calm, exact and unhurried, like a careful preparer's working papers: pale green ruling, graphite text, one red pencil colour, a typewriter-like figure font. No gradients, no stock photos, no rocket or shield icons.
