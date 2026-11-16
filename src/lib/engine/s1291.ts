import { addDays, daysBetween, daysByYear, parseISO, yearOf } from './dates';
import { interestOnTax, topRate, type RateRow, IRS_RATES } from './interest';
import type { AllocationRow, MatchedPiece, PartV } from './types';

export interface AllocateOptions {
  taxYear: number;
  usPersonDate?: string;
  rates?: RateRow[];
}

/**
 * §1291(a)(1): a gain on disposition is allocated ratably by day over the holding period
 * (the day after acquisition through disposition; i8621 Part V).
 * - days in the disposition year (the current year) go to line 16b, as do pre-PFIC days
 *   (days before the taxpayer became a US person) when `usPersonDate` is given (§1291(a)(1)(B));
 * - each earlier year's share is taxed at that year's highest rate (§1291(a)(1)(C), line 16c)
 *   and carries §6621/§6622 interest from that year's due date (§1291(c), line 16f).
 */
export function allocatePiece(piece: MatchedPiece, opt: AllocateOptions): { row: AllocationRow; missingQuarters: string[] } {
  const rates = opt.rates ?? IRS_RATES;
  const total = daysBetween(piece.acquired, piece.disposed);
  let preDays = 0;
  let postStart = piece.acquired;
  if (opt.usPersonDate) {
    const lastPre = addDays(opt.usPersonDate, -1);
    const preEnd = parseISO(lastPre) < parseISO(piece.disposed) ? lastPre : piece.disposed;
    if (parseISO(preEnd) > parseISO(piece.acquired)) {
      preDays = Object.values(daysByYear(piece.acquired, preEnd)).reduce((a, b) => a + b, 0);
      postStart = preEnd;
    }
  }
  const byYear = daysByYear(postStart, piece.disposed);
  const Y = yearOf(piece.disposed);
  const missing = new Set<string>();
  const priorYears: AllocationRow['priorYears'] = [];
  let currentDays = preDays;
  for (const [ys, d] of Object.entries(byYear)) {
    const y = +ys;
    if (y >= Y) {
      currentDays += d;
      continue;
    }
    const rate = topRate(y);
    if (rate === undefined) throw new Error(`No highest tax rate on file for ${y}.`);
    const amount = (piece.gainUsd * d) / total;
    const tax = amount * rate;
    const { interest, missingQuarters } = interestOnTax(tax, y, opt.taxYear, rates);
    missingQuarters.forEach((q) => missing.add(q));
    priorYears.push({ year: y, amount, rate, tax, interest });
  }
  priorYears.sort((a, b) => a.year - b.year);
  return {
    row: {
      acquired: piece.acquired,
      disposed: piece.disposed,
      units: piece.units,
      gainUsd: piece.gainUsd,
      daysTotal: total,
      daysByYear: Object.fromEntries(Object.entries(byYear).map(([k, v]) => [k, v])),
      preDays,
      currentYearAmount: (piece.gainUsd * currentDays) / total,
      priorYears,
    },
    missingQuarters: [...missing],
  };
}

/** Part V lines 15f and 16a-16f for the matched pieces disposed of in the tax year. Losses are listed, not allocated. */
export function partV(pieces: MatchedPiece[], opt: AllocateOptions, foreignTaxCredit = 0): { part: PartV; missingQuarters: string[] } {
  const gains = pieces.filter((p) => p.gainUsd > 0);
  const losses = pieces.filter((p) => p.gainUsd <= 0);
  const rows: AllocationRow[] = [];
  const missing = new Set<string>();
  for (const g of gains) {
    const { row, missingQuarters } = allocatePiece(g, opt);
    rows.push(row);
    missingQuarters.forEach((q) => missing.add(q));
  }
  const l15f = gains.reduce((s, p) => s + p.gainUsd, 0);
  const l16b = rows.reduce((s, r) => s + r.currentYearAmount, 0);
  const l16c = rows.reduce((s, r) => s + r.priorYears.reduce((a, y) => a + y.tax, 0), 0);
  const l16f = rows.reduce((s, r) => s + r.priorYears.reduce((a, y) => a + y.interest, 0), 0);
  return {
    part: { l15f, l16a: l15f, l16b, l16c, l16d: foreignTaxCredit, l16e: l16c - foreignTaxCredit, l16f, rows, losses },
    missingQuarters: [...missing],
  };
}
