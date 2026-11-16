import { describe, expect, it } from 'vitest';
import { openInWorkbook, presetFund, withFund } from '../src/lib/open-workbook';
import { defaultState, loadState } from '../src/lib/storage';

const mem = () => {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) };
};

describe('open in workbook', () => {
  it('replaces a blank fund with the preset currency', () => {
    const s = withFund(defaultState(), presetFund('INR'));
    expect(s.funds).toHaveLength(1);
    expect(s.funds[0].currency).toBe('INR');
  });
  it('keeps funds that already hold data', () => {
    const base = defaultState();
    base.funds = [{ ...presetFund('USD'), name: 'Mine' }];
    expect(withFund(base, presetFund('EUR')).funds.map((f) => f.currency)).toEqual(['USD', 'EUR']);
  });
  it('writes to the key the workbook loads', () => {
    const store = mem();
    expect(openInWorkbook(presetFund('GBP'), store)).toBe(true);
    expect(loadState(store)?.funds[0].currency).toBe('GBP');
  });
});
