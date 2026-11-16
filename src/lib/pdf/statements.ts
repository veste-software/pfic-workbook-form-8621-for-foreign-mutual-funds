// Statement PDFs and the ZIP. Loaded with dynamic import() only when the user downloads.
import { PDFDocument, StandardFonts, type PDFFont, type PDFPage } from 'pdf-lib';
import { zipSync, strToU8 } from 'fflate';
import type { FundResult } from '../engine/types';
import { DISCLAIMER, resultsCsv, typingLines } from '../export';

const cents = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const W = 612;
const H = 792;
const M = 54;

type Table = { head: string[]; rows: string[][] };

async function build(title: string, sub: string, intro: string[], table: Table): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const mono = await doc.embedFont(StandardFonts.Courier);
  const bold = await doc.embedFont(StandardFonts.TimesRomanBold);
  const serif = await doc.embedFont(StandardFonts.TimesRoman);
  const colW = (W - 2 * M) / table.head.length;
  let page: PDFPage = doc.addPage([W, H]);
  let y = H - M;
  const foot = (p: PDFPage, f: PDFFont) => p.drawText(DISCLAIMER, { x: M, y: 30, size: 8, font: f });
  const text = (s: string, f: PDFFont, size: number) => {
    page.drawText(s, { x: M, y, size, font: f });
    y -= size + 6;
  };
  text(title, bold, 16);
  text(sub, serif, 10);
  y -= 6;
  for (const l of intro) text(l, serif, 10);
  y -= 8;
  const row = (cells: string[], f: PDFFont) => {
    if (y < 60) {
      foot(page, serif);
      page = doc.addPage([W, H]);
      y = H - M;
    }
    cells.forEach((c, i) => page.drawText(c, { x: M + i * colW, y, size: 8, font: f }));
    y -= 13;
  };
  row(table.head, bold);
  for (const r of table.rows) row(r, mono);
  foot(page, serif);
  // Uncompressed object streams keep the page text readable by plain tools.
  return doc.save({ useObjectStreams: false });
}

// pdf-lib's standard fonts only encode WinAnsi; fund names may hold other characters.
const safe = (s: string) => s.replace(/[^\x20-\x7E -ÿ]/g, '?');

export function statement1291(fund: string, taxYear: number, r: FundResult): Promise<Uint8Array> | null {
  const p = r.part5;
  if (!p) return null;
  return build(
    safe(`Statement for Form 8621, line 16a: ${fund || 'fund'}`),
    `Tax year ${taxYear}. Each gain is spread over the days held; amounts in USD with cents.`,
    [`Line 15f ${cents(p.l15f)}   16a ${cents(p.l16a)}   16b ${cents(p.l16b)}   16c ${cents(p.l16c)}   16e ${cents(p.l16e)}   16f ${cents(p.l16f)}`],
    {
      head: ['Bought', 'Sold', 'Units', 'Gain', 'Days', 'Year share', 'Tax earlier', 'Interest'],
      rows: p.rows.map((x) => [x.acquired, x.disposed, String(x.units), cents(x.gainUsd), String(x.daysTotal), cents(x.currentYearAmount),
        cents(x.priorYears.reduce((s, y) => s + y.tax, 0)), cents(x.priorYears.reduce((s, y) => s + y.interest, 0))]),
    },
  );
}

export function statementMtm(fund: string, taxYear: number, r: FundResult): Promise<Uint8Array> | null {
  const m = r.part4?.taxYear;
  if (!m) return null;
  return build(
    safe(`Mark-to-market statement: ${fund || 'fund'}`),
    `Tax year ${taxYear}. Included is the gain added to income, or the loss allowed (negative).`,
    [`Value ${cents(m.marketValue)}   Basis before ${cents(m.adjustedBasis)}   Gain ${cents(m.gain)}   Loss allowed ${cents(m.allowedLoss)}`],
    {
      head: ['Bought', 'Units', 'Value', 'Basis before', 'Included', 'Basis after'],
      rows: m.rows.map((x) => [x.acquired, String(x.units), cents(x.value), cents(x.basisBefore), cents(x.included), cents(x.basisAfter)]),
    },
  );
}

const slug = (s: string, i: number) => `fund-${i + 1}-${s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'unnamed'}`;

/** One ZIP with, for every fund: statements, per-lot CSV and the typing summary. A filled IRS form is added from `forms` (keyed by the fund file base) when present. */
export async function buildZip(
  funds: { name: string; result: FundResult }[],
  taxYear: number,
  forms: Record<string, Uint8Array> = {},
): Promise<Uint8Array> {
  const files: Record<string, Uint8Array> = {};
  for (const [i, f] of funds.entries()) {
    const base = slug(f.name, i);
    const s1 = await statement1291(f.name, taxYear, f.result);
    if (s1) files[`${base}-statement-16a.pdf`] = s1;
    const s2 = await statementMtm(f.name, taxYear, f.result);
    if (s2) files[`${base}-statement-mtm.pdf`] = s2;
    files[`${base}-lots.csv`] = strToU8(resultsCsv(f.name, f.result));
    const lines = typingLines(f.result).map((l) => `${l.ln}\t${l.label}\t${l.value}`).join('\n');
    files[`${base}-lines-to-type.txt`] = strToU8(`${f.name || 'Fund'}, tax year ${taxYear}\n\n${lines}\n\n${DISCLAIMER}\n`);
    if (forms[base]) files[`${base}-form-8621.pdf`] = forms[base];
  }
  return zipSync(files);
}
