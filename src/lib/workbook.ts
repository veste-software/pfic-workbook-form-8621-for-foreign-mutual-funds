import { parseLots, type ParseError } from './import/parse-lots';
import { computeFund } from './engine';
import type { Fund, FundResult, Lot, Regime, Settings } from './engine/types';

/** One editable row of the lots ledger: raw strings as typed. */
export interface LotRow {
  date: string;
  type: string;
  units: string;
  amount: string;
  fx: string;
  usd: string;
}

export const blankRow = (): LotRow => ({ date: '', type: 'buy', units: '', amount: '', fx: '', usd: '' });

export function lotToRow(l: Lot): LotRow {
  return {
    date: l.date,
    type: l.type,
    units: String(l.units),
    amount: String(l.amount),
    fx: l.fxRate === undefined ? '' : String(l.fxRate),
    usd: l.usdAmount === undefined ? '' : String(l.usdAmount),
  };
}

/** Rows go through the same parser as pasted text, so error line numbers are row numbers. */
export function rowsToLots(rows: LotRow[], currency: string): { lots: Lot[]; errors: ParseError[] } {
  // A row with nothing typed yet becomes a blank line, which the parser skips but still counts.
  const text = rows
    .map((r) => (!r.date && !r.units && !r.amount && !r.fx && !r.usd ? '' : [r.date, r.type, r.units, r.amount, r.fx, r.usd].join('\t')))
    .join('\n');
  if (text.trim() === '') return { lots: [], errors: [] };
  const res = parseLots(text);
  const lots = res.lots.map((l) =>
    currency === 'USD' && l.fxRate === undefined && l.usdAmount === undefined ? { ...l, fxRate: 1 } : l,
  );
  return { lots, errors: res.errors };
}

/** Calendar years from the first lot to the tax year, for the year-end values table. */
export function yearsNeeded(lots: Lot[], taxYear: number): number[] {
  if (lots.length === 0) return [taxYear];
  const first = Math.min(...lots.map((l) => +l.date.slice(0, 4)));
  const out: number[] = [];
  for (let y = Math.min(first, taxYear); y <= taxYear; y++) out.push(y);
  return out;
}

export interface WorkbookInput {
  name: string;
  currency: string;
  regime: Regime;
  rows: LotRow[];
  yearEnds: Record<number, { nav: string; fx: string }>;
  mtmElectionYear?: number;
  settings: Settings;
}

export type Outcome =
  | { kind: 'empty' }
  | { kind: 'error'; errors: ParseError[] }
  | { kind: 'done'; result: FundResult };

/** Everything the island shows, computed from its input. Pure, so it can be tested without a DOM. */
export function evaluate(input: WorkbookInput): Outcome {
  const { lots, errors } = rowsToLots(input.rows, input.currency);
  if (errors.length > 0) return { kind: 'error', errors };
  if (lots.length === 0) return { kind: 'empty' };
  const yearEnds = Object.entries(input.yearEnds)
    .map(([y, v]) => ({ year: +y, nav: Number(v.nav), fx: input.currency === 'USD' && v.fx === '' ? 1 : Number(v.fx) }))
    .filter((y) => Number.isFinite(y.nav) && Number.isFinite(y.fx));
  const fund: Fund = { name: input.name, currency: input.currency, regime: input.regime, lots, yearEnds, mtmElectionYear: input.mtmElectionYear };
  return { kind: 'done', result: computeFund(fund, input.settings) };
}
