import { describe, expect, it } from 'vitest';
import { computeFund } from '../../src/lib/engine';
import type { Fund } from '../../src/lib/engine/types';

// 100 units bought 2022-03-10 for USD 1,000; 50 units bought 2025-06-01 for USD 800. USD fund.
// Late election in 2025, NAV 2025 = 14: old lot deemed sold for 1,400 (gain 400, Part V).
// Days 2022-03-11..2025-12-31: 296 + 365 + 366 + 365 = 1,392; 2025 share = 365/1,392 -> 16b.
// Old lot MTM basis after = 1,400 so Part IV gain on it is 0.
// New lot: value 700 vs basis 800, loss 100, but unreversed inclusions 0 -> allowed 0, unallowed 100.
const fund: Fund = {
  name: 'Synthetic late-election fund',
  currency: 'USD',
  regime: 'mtm',
  mtmElectionYear: 2025,
  lots: [
    { date: '2022-03-10', type: 'buy', units: 100, amount: 1000, fxRate: 1 },
    { date: '2025-06-01', type: 'buy', units: 50, amount: 800, fxRate: 1 },
  ],
  yearEnds: [{ year: 2025, nav: 14, fx: 1 }],
};

describe('fixture 2d: late MTM election (§1296(j))', () => {
  const r = computeFund(fund, { taxYear: 2025, filingStatus: 'single' });
  it('runs the pre-election lot through Part V as if sold', () => {
    expect(r.blocked).toBeUndefined();
    expect(r.part2Election).toBe(true);
    expect(r.part5!.l15f).toBeCloseTo(400, 6);
    expect(r.part5!.l16b).toBeCloseTo((400 * 365) / 1392, 6);
    expect(r.part5!.l16c).toBeCloseTo(((400 * (296 + 365 + 366)) / 1392) * 0.37, 6);
    expect(r.part5!.l16f).toBeGreaterThan(0);
  });
  it('marks the old lot from the deemed-sale value and the new lot plainly', () => {
    const old = r.part4!.taxYear.rows.find((x) => x.units === 100)!;
    expect(old.basisAfter).toBeCloseTo(1400, 6);
    expect(old.included).toBeCloseTo(0, 6);
    expect(r.part4!.taxYear.allowedLoss).toBe(0);
    expect(r.part4!.taxYear.unallowedLoss).toBeCloseTo(100, 6);
    expect(r.part1!.value).toBeCloseTo(2100, 6);
  });
  it('shows no Part V and no election box in a later year', () => {
    const later = computeFund(
      { ...fund, yearEnds: [...fund.yearEnds, { year: 2026, nav: 15, fx: 1 }] },
      { taxYear: 2026, filingStatus: 'single' },
    );
    expect(later.part5).toBeUndefined();
    expect(later.part2Election).toBe(false);
    expect(later.part4!.taxYear.gain).toBeCloseTo(100, 6); // old lot 1,500 vs 1,400; new lot loss 50 not allowed
  });
  it('blocks when the election year-end value is missing', () => {
    expect(computeFund({ ...fund, yearEnds: [] }, { taxYear: 2025, filingStatus: 'single' }).blocked).toMatch(/2025/);
  });
});
