# DESIGN: PFIC Workbook

## The idea

PFIC Workbook is the digital cousin of an **accountant's green-ruled columnar pad**: the 14-column analysis paper a careful preparer fills in pencil, with Form 8621 line numbers ("15f", "16c") jotted in the left margin. Lots sit in ruled rows of typewritten figures, and anything to check is a **red-pencil note in the margin**, never a pop-up.

**Why not the suggested field-guide plate:** SPEC §12 names the ledger pad, and it fits better. The visitor is checking figures against a CAS statement, so the page has to look like working papers, not like a nature book. Two things come over from the field-guide direction: **italic captions** under every table and worked example, and **numbered exhibits** ("Exhibit 3 — one SIP lot, 2021 to 2025") on the guide pages, in the way a preparer labels schedules.

## Typefaces (self-hosted, npm `@fontsource`; never a CDN)

| Role | Face | Package | Weights |
|---|---|---|---|
| Text, headings, captions | **Source Serif 4** | `@fontsource/source-serif-4` | 400, 400 italic, 600 |
| Figures, line numbers, labels, inputs, buttons | **IBM Plex Mono** (typewriter feel, tabular by nature) | `@fontsource/ibm-plex-mono` | 400, 500 |

Every figure (units, NAV, USD, dates, rates) is set in Plex Mono. Prose is set only in Source Serif 4.

**Scale** (rem, 1rem = 16px; body text is 1.0625rem = 17px):

| Token | Size | Use |
|---|---|---|
| `--fs-display` | clamp(2.5rem, 6vw, 4.25rem), weight 600, tracking -0.01em, line-height 1.02 | the one page headline |
| `--fs-h2` | 1.75rem, weight 600 | section heads |
| `--fs-h3` | 1.25rem, weight 600 | sub-heads |
| `--fs-body` | 1.0625rem, line-height 1.6 | prose, max 68ch |
| `--fs-fig` | 0.9375rem mono | table figures, inputs |
| `--fs-label` | 0.75rem mono, uppercase, letter-spacing 0.12em | column heads, margin line numbers, field labels |
| `--fs-caption` | 0.9375rem serif italic | captions under tables and exhibits |

Use proper quotes (“ ” ’), en dashes for ranges (2021–2024), the minus sign (−) for negative figures and `font-variant-numeric: tabular-nums` everywhere figures line up.

## Colours

| Name | Hex | Use |
|---|---|---|
| `--paper` ledger paper | `#EEF2E6` | page surface (pale green-cream, never white) |
| `--ink` graphite | `#2B2F2C` | all text (contrast on paper about 12:1) |
| `--ledger` ledger green | `#2F5D46` | the primary button, column heads, links (6.7:1 on paper) |
| `--rule` ruling green | `#A9C2A4` | ruled lines and column rules only, never text |
| `--pencil` red pencil | `#B3261E` | red-pencil notes, errors, focus of an invalid field (5.8:1 on paper). Used sparingly, never decoration |

Helper tints: `--tint` `#E2EAD9` (the hover tint of a row, the locked panel), `--paper-deep` `#DCE6D2` (input wells). No other colours. No gradients anywhere, not even in SVG.

## Grid and spacing

- Base unit = one ruled row = **2rem (32px)**. Vertical spacing is in whole or half rows (`--row`, `--half`).
- Page: a **margin column of 4.5rem** on the left (line numbers and red-pencil marks live there), then content up to 72rem. From 360px wide the margin shrinks to 2.75rem and stays.
- Tables are ledger tables: full-width ruled rows (1px `--rule`), 1px vertical column rules, right-aligned figures, mono column heads in small caps style (`--fs-label`). No zebra stripes, no boxes around tables.
- Sections are separated by a **double rule** (two 1px lines 3px apart), the way a ledger closes a total. Never with cards.
- Layout is asymmetric: workbook on the left two-thirds, the margin notes and explanation on the right on wide screens; one column on phones.

## Signature element: the ruled pad with margin line numbers

- The page background is the pad itself: horizontal 1px `--rule` lines every 32px plus a vertical margin rule pair at the margin column. Built as an **inline SVG data URI** in `src/styles/global.css` (`.pad`), not a CSS gradient.
- Form 8621 line numbers sit in the margin next to the figure they belong to (`<span class="ln">16c</span>`), set in `--fs-label`, `--ledger`.
- **Red-pencil note** (`.pencil-note`): text in serif italic, colour `--pencil`, with a hand-drawn, slightly wavy underline (an inline SVG path, 1.5px stroke) and a small red check mark (✓ drawn in SVG, not a glyph) in the margin. No box, no side border, no background.
- Totals are closed with the ledger double rule above the figure.

## Components

- **Primary button**: ledger green fill, paper-coloured mono label in uppercase with 0.08em tracking, **square corners**, 48px high min, 1px darker inner rule on press (`box-shadow: inset 0 0 0 1px #1F3F30`). Labels say what happens: “Fill Form 8621 PDF”, “Add lot”, “Download all forms (ZIP)”.
- **Secondary button**: transparent, 1px `--ledger` outline, ledger text. Text links are underlined with 1px offset 3px.
- **Inputs**: a sunken well (`--paper-deep`), no border except a 1px `--ink` bottom rule, mono figures, right-aligned for numbers. Label above in `--fs-label`. Invalid: bottom rule turns `--pencil` and a red-pencil note appears under it with the reason.
- **Drop/paste area** for lots: a ruled block with a 1px dashed `--ledger` outline, a large button “Paste rows from your spreadsheet”, a second “Choose CSV file” button, and an example line in mono: `2021-03-10,buy,152.334,10000,0.01375,`.
- **Results**: a ledger table with line numbers in the margin, the figure right-aligned, the rule that produced it in an italic caption beneath. Line 16f carries an expandable “show the quarters” sub-ledger.
- **Notices**: red-pencil notes for anything to check; a plain graphite sentence for neutral information. Never a toast, never a coloured box with a side stripe.
- **Locked panel** (paywall): a `--tint` block with a 1px `--rule` outline, the price in large mono figures “USD 55 / tax year 2025”, what unlocks, the PFIC Pro comparison with its source link, one primary button “Pay USD 55 and unlock 2025”, and the 14-day refund line.
- **Focus**: 3px solid `--ledger` outline, 3px offset, on everything focusable. Selection: `--rule` background, `--ink` text.
- **States**: empty (one ruled line: “No lots yet. Paste them from your spreadsheet or add the first one.”), working (“Allocating 24 lots across 5 years…”), done (results and the download), error (a red-pencil note saying what is wrong and the line number to fix).

## Logo and illustrations

- Logo: a small square of three horizontal green rules with one red tick crossing the last one (`public/favicon.svg`, reused inline in the header), next to the word mark “PFIC Workbook” in Source Serif 4 semibold.
- Illustrations: thin-line (1.5px graphite stroke, flat fills from the palette only) drawings of real objects: a ledger page with a pencil, a fund statement with a ruled column, Form 8621's top corner. Inline SVG, hand-written. No stock art, no icon packs, no emoji.

## Voice

A careful preparer explaining their working papers to a worried client: calm, exact, second person, US English. Short sentences. Name the line and the rule (“Line 16c: the deferred tax on the 2021–2024 portions, at 37% each year”). No exclamation marks, no “easy”, no reassurance we cannot back. Always: “This is not tax advice.”

## What we will not do

No gradients, glows, frosted glass, pill buttons or rounded cards. No side-stripe callouts. No centred hero with two buttons and three icon cards. No emoji or icon packs. No Inter or Roboto, no font CDN. No countdowns, fake counters, testimonials or “IRS-approved” language. No motion beyond one 150ms colour transition on buttons, and none with `prefers-reduced-motion`.
