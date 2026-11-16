import { describe, expect, it } from 'vitest';
import { blankRow, evaluate, rowsToLots, yearsNeeded, type WorkbookInput } from '../src/lib/workbook';

const base: WorkbookInput = {
  name: 'Synthetic Fund',
  currency: 'USD',
  regime: '1291',
  rows: [
    { date: '2021-03-10', type: 'buy', units: '100', amount: '10000', fx: '', usd: '' },
    { date: '2025-08-20', type: 'redeem', units: '100', amount: '20000', fx: '', usd: '' },
  ],
  yearEnds: {},
  settings: { taxYear: 2025, filingStatus: 'single' },
};

describe('workbook state', () => {
  it('is empty with no filled rows', () => {
    expect(evaluate({ ...base, rows: [blankRow()] }).kind).toBe('empty');
  });
  it('defaults the USD rate to 1 for a USD fund and computes Part V', () => {
    const o = evaluate(base);
    expect(o.kind).toBe('done');
    if (o.kind === 'done') expect(o.result.part5?.l15f).toBe(10000);
  });
  it('reports a bad row by row number', () => {
    const o = evaluate({ ...base, rows: [base.rows[0], { ...base.rows[1], date: 'soon' }] });
    expect(o.kind).toBe('error');
    if (o.kind === 'error') expect(o.errors[0].line).toBe(2);
  });
  it('blocks a non-USD lot with no rate', () => {
    const o = evaluate({ ...base, currency: 'EUR' });
    expect(o.kind === 'done' && o.result.blocked).toMatch(/no USD amount or FX/);
  });
  it('lists the years from the first lot to the tax year', () => {
    const { lots } = rowsToLots(base.rows, 'USD');
    expect(yearsNeeded(lots, 2025)).toEqual([2021, 2022, 2023, 2024, 2025]);
  });
});
