// Pure text exports: typing-summary lines and the per-lot CSV. No DOM, no pdf-lib.
import type { FundResult } from './engine/types';

export interface FundLine {
  ln: string;
  label: string;
  value: string;
}

export const DISCLAIMER = 'Prepared with PFIC Workbook from figures you entered. This is not tax advice. Check it or have a preparer check it.';

const whole = (n: number) => String(Math.round(n));
const cents = (n: number) => n.toFixed(2);

/** Every form line id with its value, in whole dollars, as the user types it into tax software. */
export function typingLines(r: FundResult): FundLine[] {
  const out: FundLine[] = [];
  if (r.part1) {
    out.push({ ln: 'Pt I', label: 'Units held on 31 December', value: String(Math.round(r.part1.units * 10000) / 10000) });
    out.push({ ln: 'Pt I', label: 'Value in USD', value: whole(r.part1.value) });
  }
  if (r.part2Election) out.push({ ln: 'Pt II', label: 'Mark-to-market election box', value: 'tick' });
  const p5 = r.part5;
  if (p5) {
    if (p5.excess) {
      out.push({ ln: '15a', label: 'Distributions this year', value: whole(p5.excess.l15a) });
      out.push({ ln: '15b', label: 'Distributions, earlier years', value: whole(p5.excess.l15b) });
      out.push({ ln: '15c', label: 'Average of earlier years', value: whole(p5.excess.l15c) });
      out.push({ ln: '15d', label: '125% of the average', value: whole(p5.excess.l15d) });
      out.push({ ln: '15e', label: 'Excess distribution', value: whole(p5.excess.l15e) });
    }
    out.push({ ln: '15f', label: 'Total gain on disposition', value: whole(p5.l15f) });
    out.push({ ln: '16a', label: 'Gain allocated', value: whole(p5.l16a) });
    out.push({ ln: '16b', label: 'Amount for the current and pre-PFIC years', value: whole(p5.l16b) });
    out.push({ ln: '16c', label: 'Tax on earlier years', value: whole(p5.l16c) });
    out.push({ ln: '16d', label: 'Foreign tax credit', value: whole(p5.l16d) });
    out.push({ ln: '16e', label: 'Total tax', value: whole(p5.l16e) });
    out.push({ ln: '16f', label: 'Interest', value: whole(p5.l16f) });
  }
  const m = r.part4?.taxYear;
  if (m) {
    out.push({ ln: '10a', label: 'Value at year-end', value: whole(m.marketValue) });
    out.push({ ln: '10b', label: 'Adjusted basis before marking', value: whole(m.adjustedBasis) });
    out.push({ ln: 'Gain', label: 'Gain included in income', value: whole(m.gain) });
    out.push({ ln: 'Loss', label: 'Loss allowed', value: whole(m.allowedLoss) });
  }
  return out;
}

const q = (s: string) => (/[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);

/** Per-lot results of one fund as CSV, amounts with cents. */
export function resultsCsv(fundName: string, r: FundResult): string {
  const rows: string[][] = [];
  if (r.part5) {
    rows.push(['fund', 'method', 'bought', 'sold', 'units', 'gain_usd', 'days', 'current_year_share', 'tax_earlier_years', 'interest']);
    for (const x of r.part5.rows) {
      rows.push([fundName, '1291', x.acquired, x.disposed, String(x.units), cents(x.gainUsd), String(x.daysTotal), cents(x.currentYearAmount),
        cents(x.priorYears.reduce((s, y) => s + y.tax, 0)), cents(x.priorYears.reduce((s, y) => s + y.interest, 0))]);
    }
  }
  if (r.part4) {
    if (rows.length) rows.push([]);
    rows.push(['fund', 'method', 'bought', 'units', 'value_usd', 'basis_before', 'included', 'basis_after']);
    for (const x of r.part4.taxYear.rows) {
      rows.push([fundName, 'mtm', x.acquired, String(x.units), cents(x.value), cents(x.basisBefore), cents(x.included), cents(x.basisAfter)]);
    }
  }
  return rows.map((r2) => r2.map(q).join(',')).join('\r\n') + '\r\n';
}
