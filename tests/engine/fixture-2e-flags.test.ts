import { describe, expect, it } from 'vitest';
import { computeFund } from '../../src/lib/engine';
import { excessDistribution } from '../../src/lib/engine/excess';
import type { Fund, Lot } from '../../src/lib/engine/types';

const S = { taxYear: 2025 as const, filingStatus: 'single' };
const buy = (date: string, units: number, amount: number): Lot => ({ date, type: 'buy', units, amount, fxRate: 1 });
const sell = (date: string, units: number, amount: number): Lot => ({ date, type: 'redeem', units, amount, fxRate: 1 });
const reinvest = (date: string, amount: number): Lot => ({ date, type: 'reinvest', units: 1, amount, fxRate: 1 });
const ye = [{ year: 2025, nav: 10, fx: 1 }];

describe('fixture 2e: flags, blocking, excess distributions', () => {
  it('flags mixed gain and loss in one year', () => {
    // FIFO: lot 1 sells for 200 (gain 100), lot 2 for 200 (loss 100).
    const f: Fund = {
      name: 'Mixed', currency: 'USD', regime: '1291', yearEnds: ye,
      lots: [buy('2021-01-04', 10, 100), buy('2022-01-04', 10, 300), sell('2025-05-05', 20, 400)],
    };
    expect(computeFund(f, S).flags.map((x) => x.id)).toContain('mixed');
  });

  it('blocks and names the year when the year-end NAV is missing', () => {
    const f: Fund = { name: 'NoNav', currency: 'USD', regime: '1291', yearEnds: [], lots: [buy('2021-01-04', 10, 100)] };
    const r = computeFund(f, S);
    expect(r.blocked).toMatch(/2025/);
    expect(r.part5).toBeUndefined();
  });

  it('computes lines 15a-15e by hand (125% of the 3-year average)', () => {
    // Distributions: 2022: 30, 2023: 60, 2024: 90, 2025: 200. Prior 3 years total 180, average 60, 125% = 75, excess 125.
    const lots: Lot[] = [buy('2021-01-04', 100, 1000), reinvest('2022-12-15', 30), reinvest('2023-12-15', 60), reinvest('2024-12-15', 90), reinvest('2025-12-15', 200)];
    const x = excessDistribution(lots, 2025);
    expect([x.l15a, x.l15b, x.l15c, x.l15d, x.l15e]).toEqual([200, 180, 60, 75, 125]);
  });

  it('raises the excess-allocation flag when 15e is positive', () => {
    const lots: Lot[] = [buy('2021-01-04', 100, 1000), reinvest('2024-12-15', 10), reinvest('2025-12-15', 50)];
    const r = computeFund({ name: 'Ex', currency: 'USD', regime: '1291', yearEnds: ye, lots }, S);
    expect(r.flags.map((x) => x.id)).toContain('excess-allocation');
  });

  it('gives no excess in the first holding year and flags QEF', () => {
    expect(excessDistribution([buy('2025-01-04', 1, 10), reinvest('2025-06-01', 5)], 2025).l15e).toBe(0);
    const q = computeFund({ name: 'Q', currency: 'USD', regime: 'qef', yearEnds: [], lots: [] }, S);
    expect(q.flags.map((x) => x.id)).toContain('qef');
  });
});
