import { describe, expect, it } from 'vitest';
import { computeFund, computeWorkbook } from '../src/lib/engine';
import { evaluate, blankRow } from '../src/lib/workbook';

describe('engine facade', () => {
  it('computeWorkbook returns one result per fund', () => {
    const f = { name: 'A', currency: 'USD', regime: 'qef' as const, lots: [], yearEnds: [] };
    const rs = computeWorkbook([f, f], { taxYear: 2025, filingStatus: 'single' });
    expect(rs).toHaveLength(2);
    expect(rs[0]).toEqual(computeFund(f, { taxYear: 2025, filingStatus: 'single' }));
  });

  it('the island input carries the election year through to Part II and Part V', () => {
    const rows = [
      { ...blankRow(), date: '2022-03-10', type: 'buy', units: '100', amount: '1000' },
    ];
    const o = evaluate({
      name: 'X', currency: 'USD', regime: 'mtm', rows, mtmElectionYear: 2025,
      yearEnds: { 2025: { nav: '14', fx: '1' } },
      settings: { taxYear: 2025, filingStatus: 'single' },
    });
    expect(o.kind).toBe('done');
    if (o.kind === 'done') {
      expect(o.result.part2Election).toBe(true);
      expect(o.result.part5?.l15f).toBeCloseTo(400, 6);
    }
  });
});
