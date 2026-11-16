import { describe, expect, it } from 'vitest';
import { IRS_RATES } from '../../src/lib/engine/interest';

function next(q: string): string {
  const [y, n] = q.split('-Q').map(Number);
  return n === 4 ? `${y + 1}-Q1` : `${y}-Q${n + 1}`;
}

describe('IRS underpayment rate table', () => {
  it('has no gap between its first and last quarter', () => {
    for (let i = 1; i < IRS_RATES.length; i++) {
      expect(IRS_RATES[i].quarter).toBe(next(IRS_RATES[i - 1].quarter));
    }
  });
  it('reaches at least 2026-Q4', () => {
    expect(IRS_RATES.at(-1)!.quarter >= '2026-Q4').toBe(true);
  });
  it('cites an irs.gov source on every row', () => {
    for (const r of IRS_RATES) expect(r.source.startsWith('https://www.irs.gov/')).toBe(true);
  });
  // Human task: add 2003-Q1 to 2016-Q4 from the Internal Revenue Bulletin, then enable this.
  it.todo('starts at 2003-Q1');
});
