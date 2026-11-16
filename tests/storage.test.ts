import { describe, expect, it } from 'vitest';
import { computeAll, defaultState, exportWorkbook, importWorkbook, loadState, saveState, type WorkbookState } from '../src/lib/storage';

const state: WorkbookState = {
  version: 1,
  settings: { taxYear: 2025, filingStatus: 'Single', usPersonDate: '2019-06-01' },
  funds: [
    {
      name: 'Synthetic Growth Fund',
      isin: 'XX0000000001',
      currency: 'USD',
      regime: '1291',
      rows: [
        { date: '2021-03-10', type: 'buy', units: '100', amount: '10000', fx: '', usd: '' },
        { date: '2025-08-20', type: 'redeem', units: '100', amount: '20000', fx: '', usd: '' },
      ],
      yearEnds: {},
    },
    {
      name: 'Synthetic Index Fund',
      isin: '',
      currency: 'USD',
      regime: 'mtm',
      rows: [{ date: '2024-02-01', type: 'buy', units: '10', amount: '1000', fx: '', usd: '' }],
      yearEnds: { 2024: { nav: '110', fx: '1' }, 2025: { nav: '120', fx: '1' } },
    },
  ],
};

class MemStore {
  m = new Map<string, string>();
  getItem(k: string) { return this.m.get(k) ?? null; }
  setItem(k: string, v: string) { this.m.set(k, v); }
}

describe('workbook save and load', () => {
  it('export then import gives identical results', () => {
    const back = importWorkbook(exportWorkbook(state));
    expect(back).toEqual(state);
    expect(computeAll(back)).toEqual(computeAll(state));
    expect(computeAll(state)[0].kind).toBe('done');
  });
  it('autosave round trips through a store', () => {
    const store = new MemStore();
    expect(loadState(store)).toBeNull();
    expect(saveState(state, store)).toBe(true);
    expect(loadState(store)).toEqual(state);
  });
  it('rejects files that are not workbooks, with a plain message', () => {
    expect(() => importWorkbook('not json')).toThrow(/not valid JSON/);
    expect(() => importWorkbook('{"a":1}')).toThrow(/no funds/);
    expect(() => importWorkbook('{"version":99,"funds":[]}')).toThrow(/newer version/);
  });
  it('keeps a QEF fund blocked with a note', () => {
    const q = { ...state, funds: [{ ...state.funds[0], regime: 'qef' as const }] };
    const o = computeAll(importWorkbook(exportWorkbook(q)))[0];
    expect(o.kind === 'done' && o.result.blocked).toMatch(/QEF/);
  });
  it('starts with one blank fund', () => {
    expect(defaultState().funds).toHaveLength(1);
  });
});
