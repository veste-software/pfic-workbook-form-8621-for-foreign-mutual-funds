import { describe, expect, it } from 'vitest';
import { computeFund } from '../../src/lib/engine';
import { interestFactor } from '../../src/lib/engine/interest';
import { dueDate } from '../../src/lib/engine/dates';
import type { Fund } from '../../src/lib/engine/types';

// One lot bought 2021-03-10 for USD 10,000, redeemed 2025-08-20 for USD 20,000: gain 10,000.
// Holding period: Mar 11 2021 .. Aug 20 2025 = 1624 days.
//   2021: 296   2022: 365   2023: 365   2024: 366   2025: 232   (sum 1624)
// Gain per day = 10000 / 1624.
//   16b (2025 days):   10000 * 232 / 1624 = 1428.5714...
//   prior years' amounts: 2021 1822.7...; 2022 2247.5...; 2023 2247.5...; 2024 2253.7...
//   16c at 37% each year: 0.37 * 10000 * 1392 / 1624 = 3171.43 (rounded)
const fund: Fund = {
  name: 'Synthetic Fund',
  currency: 'USD',
  regime: '1291',
  lots: [
    { date: '2021-03-10', type: 'buy', units: 100, amount: 10000, fxRate: 1 },
    { date: '2025-08-20', type: 'redeem', units: 100, amount: 20000, fxRate: 1 },
  ],
  yearEnds: [],
};

describe('fixture 2a: one lot, §1291 disposition', () => {
  const res = computeFund(fund, { taxYear: 2025, filingStatus: 'single' });
  const p = res.part5!;

  it('computes the day split and lines', () => {
    expect(res.blocked).toBeUndefined();
    expect(p.l15f).toBe(10000);
    expect(p.rows[0].daysTotal).toBe(1624);
    expect(p.rows[0].daysByYear).toEqual({ 2021: 296, 2022: 365, 2023: 365, 2024: 366, 2025: 232 });
    expect(p.l16b).toBeCloseTo((10000 * 232) / 1624, 9);
    expect(p.l16c).toBeCloseTo(0.37 * 10000 * (1392 / 1624), 9);
    expect(p.l16e).toBeCloseTo(p.l16c, 9);
    expect(p.l16b + p.rows[0].priorYears.reduce((s, y) => s + y.amount, 0)).toBeCloseTo(10000, 9);
  });

  it('adds interest from each year due date to the 2025 due date', () => {
    expect(p.l16f).toBeGreaterThan(0);
    const y2021 = p.rows[0].priorYears.find((y) => y.year === 2021)!;
    const f = interestFactor(dueDate(2021), dueDate(2025)).factor;
    expect(y2021.interest).toBeCloseTo(y2021.tax * (f - 1), 9);
  });

  it('treats pre-US-person days as current year (16b)', () => {
    const r = computeFund(fund, { taxYear: 2025, filingStatus: 'single', usPersonDate: '2023-01-01' }).part5!;
    // Days up to Dec 31 2022 (296 + 365 = 661) join the 232 current days.
    expect(r.rows[0].preDays).toBe(661);
    expect(r.l16b).toBeCloseTo((10000 * (661 + 232)) / 1624, 9);
  });

  it('flags mixed gain and loss', () => {
    const mixed: Fund = {
      ...fund,
      lots: [
        { date: '2022-01-10', type: 'buy', units: 10, amount: 1000, fxRate: 1 },
        { date: '2022-02-10', type: 'buy', units: 10, amount: 2000, fxRate: 1 },
        // 20 units for 3000 = 150 a unit: lot 1 gains 500, lot 2 loses 500.
        { date: '2025-05-10', type: 'redeem', units: 20, amount: 3000, fxRate: 1 },
      ],
    };
    const r = computeFund(mixed, { taxYear: 2025, filingStatus: 'single' });
    expect(r.part5!.losses).toHaveLength(1);
    expect(r.part5!.l15f).toBe(500);
    expect(r.flags.some((f) => f.id === 'mixed')).toBe(true);
  });

  it('blocks when the year-end NAV is missing for units still held', () => {
    const open: Fund = { ...fund, lots: [fund.lots[0]] };
    const r = computeFund(open, { taxYear: 2025, filingStatus: 'single' });
    expect(r.blocked).toMatch(/2025/);
  });
});
