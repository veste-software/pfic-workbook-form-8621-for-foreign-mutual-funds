# Growth plan: PFIC Workbook

Written 2026-11-16, prep mode. No traffic data exists yet; nothing here claims any.

## Positioning used in copy
Per-lot Form 8621 workbook for people with many SIP/ETF lots. One flat price per tax year for all funds, first fund free in full, official IRS PDF filled in the browser, nothing uploaded. Copy never says "IRS-approved", "CPA-reviewed" or "guaranteed".

## What is on the site (done in this pass)
| Query | Page | Title |
|---|---|---|
| pfic calculator, form 8621 calculator | `/` | Form 8621 PFIC calculator, lot by lot |
| pfic excess distribution / interest calculator | `/pfic-excess-distribution-calculator` | PFIC excess distribution calculator, many lots |
| form 8621 mark to market | `/form-8621-mark-to-market` | Form 8621 mark-to-market, lot by lot |
| form 8621 indian mutual funds, sip | `/form-8621-indian-mutual-funds-sip` | Form 8621 for Indian mutual funds and SIPs |
| pfic tax calculator excel | `/pfic-calculator-excel-template` | PFIC calculator Excel template (CSV), Form 8621 |
| do i need to file form 8621 | `/do-i-need-to-file-form-8621` | Do I need to file Form 8621? Threshold check |
| form 8621 ucits etf | `/form-8621-ucits-etf` | Form 8621 for UCITS ETFs, for US expats |

Changes: titles shortened to about 50-60 characters with the query first. Open Graph and Twitter tags on every page. `BreadcrumbList` JSON-LD on every non-home page. `WebApplication` JSON-LD with the real USD 55 offer on `/`. No ratings or reviews are marked up. `robots.txt` is generated from `SITE_URL` (`src/pages/robots.txt.ts`). The sitemap comes from `@astrojs/sitemap`. The footer now links to all guide and tool pages (internal links on every page). Analytics events already exist (Fund added, Lots pasted, Results computed, Checkout started, License activated, PDF downloaded) and load only when the `PUBLIC_ANALYTICS_*` variables are set.

Known gaps: no `og:image` yet (needs a PNG, 1200x630, drawn in the ledger style; the SVG art is not accepted by most social previews). No FAQPage markup, because the pages do not carry a visible FAQ block. Do not add one only for the markup.

## 30-day plan (start about 2027-01-15, two weeks before the Feb filing season)
Week 1
- Human: verify the domain in Search Console and Bing Webmaster Tools, submit `sitemap-index.xml`, use IndexNow from Bing. Request indexing for `/`, the Indian funds guide and the threshold page.
- Check that `SITE_URL` is the real domain in Cloudflare so canonicals and the sitemap are right.

Week 2
- Next page, only if it has a real answer: "Form 8621 for ELSS / tax-saver funds" (lock-in, SIP lots from CAS, same engine). Add it only with a worked example from the engine.
- Second candidate: "Form 8621 and the Part I / Part V line map", a line-by-line reference that links each line to the tool.

Week 3
- Legitimate communities, where answers come first and the link is secondary: r/IndiaTax, r/tax, r/USExpatTaxes, r/ABCDDesis, Bogleheads expat forum. Answer questions with the actual figures and rule, mention the tool once when it fits, and say you built it. Read each community's self-promotion rules first. No account farms.
- NRI forums and WhatsApp/Telegram groups: share the free threshold page, not the paywalled product.

Week 4
- Directories where a listing is normal: Product Hunt (one launch, honest description), AlternativeTo (as an alternative to PFIC Pro), Indie Hackers post about building a lots-based tax engine. Each is a human task.
- Outreach: email 5-10 enrolled agents or expat-tax bloggers who publish PFIC guides, offering the free first-fund result so they can check our figures against theirs. Ask for corrections, not links.

## Conversion notes
- Free first fund is the main hook. The paywall panel states the price and the PFIC Pro comparison with its source. Refund on request within 14 days.
- Keep the price at USD 55 until there are real payers. Test one change at a time, and log it in `growth/LOG.md` with date and hypothesis.

## Targets from SPEC
By 2027-03-15, 1,500 Search Console impressions on the query set; otherwise rewrite the titles and the guides once.

## Queries not served
None dropped. "Free pfic calculator" is served by the home page because the first fund is free in full.
