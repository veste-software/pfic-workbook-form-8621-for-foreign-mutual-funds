import type { Lot, LotType } from '../engine/types';
import { parseISO } from '../engine/dates';

export interface ParseError {
  line: number;
  message: string;
}
export interface ParseResult {
  lots: Lot[];
  errors: ParseError[];
}

const COLS = ['date', 'type', 'units', 'amount', 'fx_rate', 'usd_amount'] as const;
const TYPE_WORDS: Record<string, LotType> = {
  buy: 'buy',
  purchase: 'buy',
  sip: 'buy',
  reinvest: 'reinvest',
  reinvestment: 'reinvest',
  redeem: 'redeem',
  redemption: 'redeem',
  sell: 'redeem',
  sale: 'redeem',
};

type Convention = 'dmy' | 'mdy' | null;

function splitLine(line: string): string[] {
  const sep = line.includes('\t') ? '\t' : ',';
  return line.split(sep).map((c) => c.trim());
}

function parseNumber(raw: string, tabbed: boolean): number {
  const s = tabbed ? raw.replace(/,/g, '') : raw;
  if (s === '' || !/^-?\d*\.?\d+(e-?\d+)?$/i.test(s)) return NaN;
  return Number(s);
}

/** Look at every slash/dash date to decide whether the sheet is day-first or month-first. */
function detectConvention(cells: string[]): { conv: Convention; conflict: boolean } {
  let dmy = false;
  let mdy = false;
  for (const c of cells) {
    const m = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/.exec(c);
    if (!m) continue;
    if (+m[1] > 12) dmy = true;
    if (+m[2] > 12) mdy = true;
  }
  return { conv: dmy ? 'dmy' : mdy ? 'mdy' : null, conflict: dmy && mdy };
}

function toIso(raw: string, conv: Convention): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    parseISO(raw);
    return raw;
  }
  const m = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/.exec(raw);
  if (!m) throw new Error(`Date "${raw}" is not YYYY-MM-DD.`);
  const a = +m[1];
  const b = +m[2];
  let day: number;
  let month: number;
  if (a > 12) [day, month] = [a, b];
  else if (b > 12) [day, month] = [b, a];
  else if (a === b || conv === 'dmy') [day, month] = [a, b];
  else if (conv === 'mdy') [month, day] = [a, b];
  else throw new Error(`Date "${raw}" could be day-first or month-first. Write it as YYYY-MM-DD.`);
  const iso = `${m[3]}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  parseISO(iso);
  return iso;
}

/** Parse pasted or uploaded lot rows. Every problem row is reported with its line number; no row is dropped silently. */
export function parseLots(text: string): ParseResult {
  const lots: Lot[] = [];
  const errors: ParseError[] = [];
  const raw = text.replace(/\r\n?/g, '\n').split('\n');
  const rows = raw.map((t, i) => ({ t, line: i + 1 })).filter((r) => r.t.trim() !== '');
  if (rows.length === 0) return { lots, errors: [{ line: 1, message: 'Nothing to read. Paste at least one row.' }] };

  let map: number[] = [0, 1, 2, 3, 4, 5];
  const first = splitLine(rows[0].t).map((c) => c.toLowerCase().replace(/[\s-]+/g, '_'));
  if (first.some((c) => c === 'date') || !/\d/.test(first[0] ?? '')) {
    const m = COLS.map((c) => first.indexOf(c));
    if (m[0] < 0 || m[1] < 0 || m[2] < 0 || m[3] < 0) {
      return { lots, errors: [{ line: rows[0].line, message: 'The header needs at least: date, type, units, amount.' }] };
    }
    map = m;
    rows.shift();
  }

  const allCells = rows.flatMap((r) => splitLine(r.t).map((c, i) => (i === map[0] ? c : '')));
  const { conv, conflict } = detectConvention(allCells);
  if (conflict) {
    errors.push({ line: rows[0]?.line ?? 1, message: 'Dates mix day-first and month-first. Use YYYY-MM-DD throughout.' });
    return { lots, errors };
  }

  for (const { t, line } of rows) {
    const tabbed = t.includes('\t');
    const cells = splitLine(t);
    const get = (k: number) => (map[k] >= 0 ? (cells[map[k]] ?? '') : '');
    try {
      const date = toIso(get(0), conv);
      const type = TYPE_WORDS[get(1).toLowerCase()];
      if (!type) throw new Error(`Type "${get(1)}" must be buy, reinvest or redeem.`);
      const units = parseNumber(get(2), tabbed);
      if (!(units > 0)) throw new Error(`Units "${get(2)}" must be a positive number.`);
      const amount = parseNumber(get(3), tabbed);
      if (!(amount >= 0)) throw new Error(`Amount "${get(3)}" must be a number.`);
      const lot: Lot = { date, type, units, amount };
      if (get(4) !== '') {
        const fx = parseNumber(get(4), tabbed);
        if (!(fx > 0)) throw new Error(`FX rate "${get(4)}" must be a positive number.`);
        lot.fxRate = fx;
      }
      if (get(5) !== '') {
        const usd = parseNumber(get(5), tabbed);
        if (!(usd >= 0)) throw new Error(`USD amount "${get(5)}" must be a number.`);
        lot.usdAmount = usd;
      }
      lots.push(lot);
    } catch (e) {
      errors.push({ line, message: (e as Error).message });
    }
  }
  return { lots, errors };
}
