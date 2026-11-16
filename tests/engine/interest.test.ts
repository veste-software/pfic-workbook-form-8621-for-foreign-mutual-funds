import { describe, expect, it } from 'vitest';
import { interestFactor, interestOnTax, type RateRow } from '../../src/lib/engine/interest';
import { daysBetween } from '../../src/lib/engine/dates';

const flat = (pct: number, years: number[]): RateRow[] =>
  years.flatMap((y) => [1, 2, 3, 4].map((q) => ({ quarter: `${y}-Q${q}`, ratePct: pct, source: 'https://www.irs.gov/test' })));

describe('interest', () => {
  it('compounds daily at one rate over a 365-day span', () => {
    const d = daysBetween('2022-04-18', '2023-04-18');
    expect(d).toBe(365);
    const { factor, missingQuarters } = interestFactor('2022-04-18', '2023-04-18', flat(5, [2022, 2023]));
    expect(missingQuarters).toEqual([]);
    expect(factor).toBeCloseTo((1 + 0.05 / 365) ** 365, 12);
  });

  it('uses 366 in a leap year', () => {
    const d = daysBetween('2024-01-01', '2024-12-31');
    const { factor } = interestFactor('2024-01-01', '2024-12-31', flat(4, [2024]));
    expect(factor).toBeCloseTo((1 + 0.04 / 366) ** d, 12);
  });

  it('flags a missing quarter and never uses 0%', () => {
    const rates = flat(5, [2022]);
    const r = interestFactor('2022-12-01', '2023-02-01', rates);
    expect(r.missingQuarters).toEqual(['2023-Q1']);
    const i = interestOnTax(100, 2021, 2022, rates);
    expect(i.missingQuarters.length).toBeGreaterThan(0);
  });
});
