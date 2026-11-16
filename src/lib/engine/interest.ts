import { addDays, daysInYear, parseISO, quarterOf, dueDate } from './dates';
import ratesJson from '../../data/irs-underpayment-rates.json';
import topJson from '../../data/top-rates.json';

export interface RateRow {
  quarter: string;
  ratePct: number;
  source: string;
}

export const IRS_RATES: RateRow[] = ratesJson.rates as RateRow[];

/** Highest individual rate for a year (IRC §1), or undefined when the table has no such year. */
export function topRate(year: number): number | undefined {
  return (topJson.rates as Record<string, number>)[String(year)];
}

export interface InterestFactor {
  factor: number;
  missingQuarters: string[];
}

/**
 * Growth factor of the §6621(a)(2) underpayment rate compounded daily (§6622) over (from, to].
 * Each day grows by rate/365, or rate/366 in a leap year. A quarter missing from the table is
 * reported, never treated as 0%.
 */
export function interestFactor(from: string, to: string, rates: RateRow[] = IRS_RATES): InterestFactor {
  const byQ = new Map(rates.map((r) => [r.quarter, r.ratePct]));
  const missing = new Set<string>();
  let factor = 1;
  const end = parseISO(to);
  let day = from;
  while (parseISO(day) < end) {
    day = addDays(day, 1);
    const q = quarterOf(day);
    const pct = byQ.get(q);
    if (pct === undefined) {
      missing.add(q);
      continue;
    }
    factor *= 1 + pct / 100 / daysInYear(+day.slice(0, 4));
  }
  return { factor, missingQuarters: [...missing] };
}

/** Interest on `tax` for prior year `t`, from the due date of year t's return to the due date of year Y's return. */
export function interestOnTax(tax: number, t: number, Y: number, rates: RateRow[] = IRS_RATES) {
  const { factor, missingQuarters } = interestFactor(dueDate(t), dueDate(Y), rates);
  return { interest: tax * (factor - 1), missingQuarters };
}
