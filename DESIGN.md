# DESIGN: PFIC Workbook

The brand kit is finished: `src/styles/brand.css` holds the tokens and base styles, and the art is in `public/`. The Builder uses these files and does not redraw them. Where the old scaffold (`src/styles/global.css`, `Base.astro`) disagrees with this file, this file wins.

## 1. The real-world cousin

PFIC Workbook is the digital cousin of an **accountant's columnar analysis pad**: the gum-bound pad of pale green ruled paper with a cardboard back that a careful preparer fills in pencil. Purchases go into ruled rows and are spread across year columns. Form 8621 line numbers ("15f", "16c") go in the left margin, and every total is closed with the **red double underline** accountants draw under a checked figure. The input is a pile of monthly purchase slips (SIP contract notes, a CAS statement, a broker export). The output is Form 8621, filled. The pad is what turns one into the other, and the page shows exactly that.

What we keep from the Architect's direction: the pad, the margin line numbers, the red-pencil notes, the italic exhibit captions, the square corners, the voice. What we change: the whole page is **no longer ruled**. The page is a plain desk of ledger paper, and the ruling lives on **one raised pad sheet that holds the working tool**. A fully ruled page looked like a notebook template and fought with the text.

## 2. The name and the mark

- **Name:** PFIC Workbook. Set beside the mark in HTML, Source Serif 4 semibold, 1.1875rem, `--ink`. Never put text inside the mark.
- **Mark** (`public/brand/logo.svg`): one pad sheet (graphite outline, sheet colour) lying on a ledger-green block offset down and to the right, the way the pad sits on its cardboard back. On the sheet are three graphite figure bars, right-aligned like figures in a ledger column, closed by a **red double rule**. It means "lot by lot, to a checked total". Square corners only.
- **Favicon** (`public/favicon.svg`): the same mark on a 32 grid with two bars and the red double rule, pixel-aligned for 16 px.
- Clear space around the mark: half its width. Minimum size: 16 px. The mark is never recoloured, rotated or put on a photo.

## 3. Palette (flat colours only, no gradients anywhere, not even in SVG)

| Token | Name | Hex | Use |
|---|---|---|---|
| `--paper` | Ledger paper | `#EEF2E6` | **the dominant surface**: the page, the desk the pad lies on |
| `--sheet` | Pad sheet | `#F7F8F0` | the raised workbook sheet, the paper of forms in the art. Never the page background |
| `--ink` | Graphite | `#2B2F2C` | all text and outlines (about 12:1 on paper) |
| `--ledger` | Ledger green | `#2F5D46` | **the accent**: the primary button, the pad's binding band, the offset block, links (6.7:1 on paper) |
| `--pencil` | Red pencil | `#B3261E` | **the signal**: red-pencil notes, errors, the double rule under a checked total (5.8:1 on paper). Never decoration on its own |
| `--rule` | Ruling green | `#A9C2A4` | ruled lines and column rules only, never text |
| `--manila` | Manila | `#D8C38D` | illustrations only (the pad's cardboard back, folders, the pencil), and the band that marks the selected tax-year column. Never text |

Helpers: `--ink-soft` `#4A524C` (secondary text, 7:1), `--ledger-dark` `#1F3F30` (button hover and press), `--well` `#DCE6D2` (input wells), `--tint` `#E2EAD9` (row hover, the locked panel), `--shade` `#C9D6BE` (flat shadows in the art). No other colours.

Depth is drawn with **flat offset blocks**: an object casts a hard block of `--ledger` (on the UI) or `--shade` (in the art), 6 to 14 units down and right. No blur, no glow, no opacity tricks.

## 4. Typefaces (self-hosted through npm, never a CDN)

| Role | Face | Package | Weights |
|---|---|---|---|
| Display and text: headlines, prose, captions, the name | **Source Serif 4** | `@fontsource/source-serif-4` | 400, 400 italic, 600 |
| Figures, line numbers, labels, inputs, buttons | **IBM Plex Mono** | `@fontsource/ibm-plex-mono` | 400, 500 |

`brand.css` imports both. Every figure (units, NAV, USD, dates, rates, line numbers) is set in Plex Mono with tabular numerals. Prose is set only in Source Serif 4. Use proper quotes (“ ” ’), en dashes for ranges (2021–2024) and the minus sign (−) for negatives.

**Scale** (1rem = 16 px):

| Token | Size | Use |
|---|---|---|
| `--fs-display` | clamp(2.25rem, 3.4vw + 1rem, 3.5rem), 600, line-height 1.06, tracking −0.015em | the one h1 per page |
| `--fs-h2` | clamp(1.5rem, 1.2vw + 1.1rem, 2rem), 600 | section heads |
| `--fs-h3` | 1.25rem, 600 | sub-heads, step titles |
| `--fs-lede` | 1.25rem, line-height 1.5 | the one sentence under the h1 |
| `--fs-body` | 1.0625rem (17 px), line-height 1.6 | prose, max 66ch |
| `--fs-fig` | 1rem mono | table figures, inputs (16 px stops iOS zoom) |
| `--fs-label` | 0.8125rem mono, 500, uppercase, tracking 0.1em | field labels, column heads, margin line numbers |
| `--fs-caption` | 0.9375rem serif italic | exhibit captions under tables and art |

## 5. Grid and spacing

- Base unit: one ruled row, `--row` = 2rem (32 px). Spacing is in whole or half rows (`--half` 1rem, `--quarter` 0.5rem).
- Page container `.sheet` (keeps the scaffold's name): left padding = the margin column `--margin` (4.5rem desktop, 2.5rem under 40rem), right padding clamp(1rem, 4vw, 3rem), content max 72rem.
- Desktop grid: 12 columns, 2rem gutter. Phones: one column.
- Sections are closed by the **double rule** (`hr.double-rule`). No cards, except the one pad sheet.
- Corners are square everywhere (`--radius: 0`).

## 6. The signature element: the pad sheet

`.pad-sheet` is the one raised object on every page that has a tool. It is a `--sheet` coloured block with:

1. a **binding band** across the top: `--ledger`, 2.5rem high, holding paper-coloured mono labels and the tax-year select (`.pad-band`);
2. horizontal **ruling** every 32 px in `--rule` and a **double margin rule** at the left, drawn as inline SVG data URIs (no CSS gradients);
3. a **hard offset block** in `--ledger`, 8 px down and right (`box-shadow: 8px 8px 0 var(--ledger)`; 5 px on phones);
4. **margin line numbers** (`.ln`) beside the figure they belong to.

Red-pencil notes (`.pencil-note`) are italic red text with a wavy pencil underline and a drawn tick (`.pencil-tick`) in the margin. Totals carry `.total` (graphite double rule above, red double rule below when checked). The same sheet-on-a-green-block appears in the logo, the hero and every spot illustration, so the brand is recognisable without its name.

## 7. Components (all styled in `brand.css`)

- **Primary button** `.btn.btn-primary`: ledger fill, paper mono label, uppercase, 0.08em tracking, min 48 px, square. Press: inset paper rule. One primary per screen. Labels say what happens: “Paste rows from your spreadsheet”, “Fill Form 8621 PDF”, “Download all forms (ZIP)”, “Pay USD 55 and unlock 2025”.
- **Secondary** `.btn.btn-secondary`: 1px ledger outline, ledger label. **Quiet** `.btn-quiet`: underlined mono link for “Add a lot by hand”.
- **Inputs** `.input`, `select.input`, `textarea.input`: a sunken `--well` with a 1px graphite bottom rule, mono, min 48 px; numbers right-aligned (`.input.num`). The select has a drawn ledger chevron. Label above in `--fs-label` (`.label`). Invalid: bottom rule red and a `.pencil-note` under it.
- **File input**: never the browser button. Hide it with `.visually-hidden` and use `<label class="btn btn-secondary" for=…>Choose CSV file</label>`.
- **Choice** `.choice`: two or three square options side by side (for “§1291, no election” / “Mark-to-market”), built from radio inputs. Selected: ledger fill, paper text.
- **Checkbox / radio**: square, drawn in brand colours (`.check`).
- **Drop area** `.drop`: inside the pad sheet, a 1px dashed ledger outline on `--sheet`, min 12rem high. States are classes on it: `.is-over` (ledger outline solid 2px and `--tint` fill, text “Drop to read the rows”), `.is-working` (“Reading 24 rows…”), `.is-done` (“24 lots read. 0 problems.” in graphite with a drawn tick), `.is-error` (red outline, red-pencil note naming the line: “Line 7: the date 31/02/2023 does not exist.”).
- **Ledger tables** `table.ledger`: full-width 1px ruled rows, 1px column rules, mono right-aligned figures in `td.num`, label-style heads. The selected tax-year column gets `.col-year` (a manila band behind the head cell). No zebra stripes, no boxes.
- **Locked panel** `.locked`: `--tint` block with a 1px rule outline, `spot-bundle.svg` at the left, the price in large mono “USD 55 / tax year 2025”, what unlocks, the PFIC Pro comparison with its link, one primary button, the 14-day refund line.
- **Steps** `.steps`: three columns on desktop, one on phones; each step is a spot illustration, a mono step number in the margin style, an h3 and at most two sentences.
- **States** for the workbook: empty (`spot-empty.svg` small, then “No lots yet. Paste them from your spreadsheet or add the first one.”), working (“Allocating 24 lots across 5 years…”), done (results ledger and download), error (a red-pencil note with the line to fix).
- **Focus**: 3px solid ledger outline, 3px offset, everywhere. Selection: `--rule` background.
- **Motion**: only a 150 ms colour transition on buttons and the drop area, off under `prefers-reduced-motion`.

## 8. The first screen of `/`

The goal must be clear in five seconds and the tool must be fully visible without scrolling at 1280×800 and 390×844.

**Header** (`.masthead`, 4rem high): mark (28 px) + “PFIC Workbook” on the left; on the right two mono labels, “Method” (/how-it-works) and “Pricing”. No other nav.

**At 1280×800**

```
| margin |  row 1, col 1–7                           |  col 8–12                      |
|  4.5rem|  label: FORM 8621 · FOREIGN FUNDS & ETFS  |  hero.svg (about 430×258)      |
|        |  h1: Fill Form 8621 for every fund,       |  caption: Exhibit A — monthly  |
|        |      lot by lot.            (2 lines)     |  slips, one pad, one form.     |
|        |  lede (2 lines)                           |                                |
|        |  row 2, col 1–12: the PAD SHEET (the tool, full width)                     |
|        |  band: WORKBOOK · TAX YEAR [2025▾] · FILING STATUS [Single▾] · 1st fund free|
|   1    |  Fund name [________]  Currency [INR▾]  Method [§1291 | Mark-to-market]    |
|   2    |  ┌ drop area ─────────────────────────────────────────────────────────────┐ |
|        |  │ [PASTE ROWS FROM YOUR SPREADSHEET] [CHOOSE CSV FILE]  Add a lot by hand │ |
|        |  │ date,type,units,amount,fx_rate,usd_amount                                │ |
|        |  │ 2021-03-10,buy,152.334,10000,0.01375,                                    │ |
|        |  └──────────────────────────────────────────────────────────────────────────┘ |
|        |  Your lots stay in this browser. Nothing is uploaded.                         |
```

Height budget: header 64 + 32 + row 1 about 260 + 32 + sheet (band 40 + fields 88 + drop 192 + note 40) ≈ 750 px. Fits 800.

**At 390×844** (one column, margin 2.5rem): header 56 → label → h1 at 2.25rem (3 lines) → lede (4 lines) → pad sheet: band (tax year only; filing status moves into the sheet below the drop area), fund name, then currency and method side by side, then the drop area with the primary button full width and “Choose CSV file” + “Add a lot by hand” on one line. The hero moves **below** the pad sheet. Budget ≈ 780 px.

**Below the fold, in this order:** the results area (empty state until lots exist), the three steps with `spot-1/2/3.svg`, the price line said once (“Your first fund is free, filled PDF included. All funds for tax year 2025: USD 55, once.” and a link to /pricing), the method teaser with links to the guides, the footer with the not-tax-advice line, Impressum and Datenschutz.

**Headline and lede (exact):**
- h1: “Fill Form 8621 for every fund, lot by lot.”
- lede: “Paste your SIP or ETF purchases once. You get the per-lot §1291 or mark-to-market figures and the official IRS form, filled in your browser.”

## 9. Illustration style

- Hand-written SVG, flat fills from the palette, **one outline weight**: 3 units in the 1200-wide hero, 2.5 units in the 480-wide spots (both render at about 1.3 px at their usual display size), in graphite, `stroke-linejoin="miter"`, square ends, **square corners** on every sheet and box. Ruled lines are 2 units in `--rule`.
- Text is never set in the art. Writing is drawn as short bars: graphite for figures, ledger for labels, rule green for faint print. The only drawn characters are the digits “8621” on the form, built from strokes.
- Every object casts a flat `--shade` block offset down and right. Objects overlap; each scene has one focal object and plenty of empty space.
- Red appears in each scene once or twice only: the double rule under a total, a tick, a circled figure, the pencil's eraser.
- Recurring cast: the **pad sheet** with its green binding band and manila back, **purchase slips** with a manila stub and a perforation, **Form 8621** with its heavy header rule and graphite Part bar, the **manila folder**, the **pencil** (manila body, ledger stripe, red eraser).

## 10. Voice

A careful preparer explaining their working papers to a worried client: calm, exact, second person, US English, short sentences. Name the line and the rule. No exclamation marks, no “easy”, no “unlock your…”, no reassurance we cannot back, never “IRS-approved”, “CPA-reviewed” or “guaranteed”. Always: “This is not tax advice.”

1. “Paste every purchase once. Each SIP instalment is its own lot.”
2. “Line 16c: the deferred tax on the 2021–2024 portions, at 37% for each year.”
3. “The 2023 NAV for this fund is missing. Add it and the figures will appear.”
4. “Your first fund is free, filled PDF included. All funds for tax year 2025: USD 55, once.”
5. “Your lots stay in this browser. Nothing is uploaded.”

## 11. Files in the brand kit

| File | What it shows | Where it goes |
|---|---|---|
| `src/styles/brand.css` | tokens, fonts, base styles and every component above | imported once in `Base.astro` (after `global.css`, or replace global.css's tokens with `@import "./brand.css"`) |
| `public/brand/logo.svg` | the mark: pad sheet on the green block, three right-aligned figures, red double rule | header (inline or `<img>`, 28 px), footer, OG image |
| `public/favicon.svg` | the mark simplified on a 32 grid | `<link rel="icon">` |
| `public/art/hero.svg` (1200×720) | **Exhibit A**: a fanned stack of monthly purchase slips on the left, the open analysis pad in the middle with lots spread across five year columns as a staircase and a red double rule under the totals, a pencil across it, and Form 8621 on the right with its boxes filled, linked to the pad total by a red-pencil arrow | first screen, right column (desktop), below the pad sheet (phones) |
| `public/art/spot-1.svg` (480×360) | step 1, “Paste every purchase once”: a statement with four highlighted rows; the rows travel as slips onto a pad sheet | steps, `/pfic-calculator-excel-template` |
| `public/art/spot-2.svg` | step 2, “Each gain is spread by day”: a manila ruler measuring one lot's holding period, cut into year segments, over a ledger row of year blocks; the current year in manila, prior years in ledger green | steps, `/how-it-works`, `/pfic-excess-distribution-calculator` |
| `public/art/spot-3.svg` | step 3, “Download the filled form”: Form 8621 with filled boxes and a red tick, sliding into a manila folder | steps, the done state, `/pricing` |
| `public/art/spot-empty.svg` | empty workbook: an empty pad sheet with one ruled line, a pencil waiting on it | the empty state of the lots ledger |
| `public/art/spot-bundle.svg` | one price for all funds: four Form 8621 sheets fanned and held by a ledger-green band | the locked panel, `/pricing` |
| `public/art/pattern.svg` | 96×32 tile of columnar analysis-paper ruling | optional: 404 page, guide exhibits, print header |

Use the art as `<img src={withBase('/art/hero.svg')} alt="…" width height>` with meaningful alt text on the hero (“A stack of purchase slips, a ruled analysis pad and a filled Form 8621”) and `alt=""` on decorative spots next to a heading.

## 12. What we will not do

No gradients, glows, blur shadows, frosted glass, pill buttons or rounded cards. No side-stripe callouts (no border thicker than 1px on one side). No centred hero with two buttons and three icon cards. No emoji, no icon packs, no stock art, no laptop or chart illustrations. No Inter or Roboto, no font CDN. No countdowns, fake counters, testimonials or “IRS-approved” language. No default browser file button, select arrow or checkbox.
