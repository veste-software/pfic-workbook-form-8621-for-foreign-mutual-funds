import { describe, expect, it } from 'vitest';
import { computeFund } from '../../src/lib/engine';
import type { Fund } from '../../src/lib/engine/types';

// One lot, 100 units bought 2023-03-01 for USD 1,000 (USD fund, rate 1).
//  2023 NAV 12: value 1200, gain 200 included, basis 1200, unreversed 200.
//  2024 NAV  9: value  900, loss 300; allowed = min(300, 200) = 200, 100 not allowed.
//               basis 1000, unreversed 0.
//  2025 NAV 11: value 1100, gain 100 included, basis 1100, unreversed 100.
const fund: Fund = {
  name: 'Synthetic MTM Fund',
  currency: 'USD',
  regime: 'mtm',
  lots: [{ date: '2023-03-01', type: 'buy', units: 100, amount: 1000, fxRate: 1 }],
  yearEnds: [
    { year: 2023, nav: 12, fx: 1 },
    { year: 2024, nav: 9, fx: 1 },
    { year: 2025, nav: 11, fx: 1 },
  ],
};

describe('fixture 2c: mark-to-market', () => {
  it('limits the loss year to unreversed inclusions and carries basis', () => {
    const r = computeFund(fund, { taxYear: 2025, filingStatus: 'single' });
    expect(r.blocked).toBeUndefined();
    const [y23, y24, y25] = r.part4!.years;
    expect([y23.gain, y23.rows[0].basisAfter]).toEqual([200, 1200]);
    expect([y24.allowedLoss, y24.unallowedLoss, y24.rows[0].basisAfter, y24.rows[0].unreversedAfter]).toEqual([200, 100, 1000, 0]);
    expect([y25.gain, y25.marketValue, y25.adjustedBasis, y25.rows[0].basisAfter]).toEqual([100, 1100, 1000, 1100]);
    expect(r.part1).toEqual({ units: 100, value: 1100 });
  });

  it('gives ordinary and capital loss on a redemption', () => {
    // Sold in 2024 for 700: basis 1200 after 2023, loss 500, ordinary up to 200, capital 300.
    const sold: Fund = { ...fund, lots: [...fund.lots, { date: '2024-06-01', type: 'redeem', units: 100, amount: 700, fxRate: 1 }] };
    const y24 = computeFund(sold, { taxYear: 2024 as unknown as 2025, filingStatus: 'single' }).part4!.taxYear;
    expect([y24.redeemOrdinaryLoss, y24.redeemCapitalLoss, y24.redeemOrdinaryGain]).toEqual([200, 300, 0]);
  });

  it('blocks and names the missing year', () => {
    const r = computeFund({ ...fund, yearEnds: fund.yearEnds.filter((y) => y.year !== 2024) }, { taxYear: 2025, filingStatus: 'single' });
    expect(r.blocked).toMatch(/2024/);
  });
});
