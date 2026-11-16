import { evaluate, blankFund, type FundInput, type Outcome } from './workbook';
import type { Regime, Settings } from './engine/types';

export const SCHEMA_VERSION = 1;
export const STORAGE_KEY = 'pfic-workbook:v1';

export interface WorkbookState {
  version: number;
  settings: Settings;
  funds: FundInput[];
  /** Purchased license code (see license.ts). Verified in the browser before it unlocks anything. */
  license?: string;
}

export const defaultState = (): WorkbookState => ({
  version: SCHEMA_VERSION,
  settings: { taxYear: 2025, filingStatus: 'Single' },
  funds: [blankFund()],
});

/** Results for every fund, in order. Pure. */
export function computeAll(state: WorkbookState): Outcome[] {
  return state.funds.map((f) => evaluate({ ...f, settings: state.settings }));
}

export const exportWorkbook = (state: WorkbookState): string => JSON.stringify(state, null, 2);

const REGIMES: Regime[] = ['1291', 'mtm', 'qef'];
const str = (v: unknown, d = ''): string => (typeof v === 'string' ? v : d);

function cleanFund(raw: unknown): FundInput {
  const f = (raw ?? {}) as Record<string, unknown>;
  const rows = Array.isArray(f.rows) ? f.rows : [];
  const ye = (f.yearEnds && typeof f.yearEnds === 'object' ? f.yearEnds : {}) as Record<string, Record<string, unknown>>;
  const yearEnds: FundInput['yearEnds'] = {};
  for (const [y, v] of Object.entries(ye)) if (/^\d{4}$/.test(y)) yearEnds[+y] = { nav: str(v?.nav), fx: str(v?.fx) };
  const regime = REGIMES.includes(f.regime as Regime) ? (f.regime as Regime) : '1291';
  const elect = typeof f.mtmElectionYear === 'number' && Number.isFinite(f.mtmElectionYear) ? f.mtmElectionYear : undefined;
  return {
    name: str(f.name),
    isin: str(f.isin),
    currency: str(f.currency, 'USD') || 'USD',
    regime,
    rows: rows.map((r: Record<string, unknown>) => ({
      date: str(r?.date),
      type: str(r?.type, 'buy'),
      units: str(r?.units),
      amount: str(r?.amount),
      fx: str(r?.fx),
      usd: str(r?.usd),
    })),
    yearEnds,
    mtmElectionYear: elect,
  };
}

/** Parse an exported workbook. Throws an Error with a plain message when the file is not one of ours. */
export function importWorkbook(text: string): WorkbookState {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error('This file is not valid JSON, so it is not a PFIC Workbook file.');
  }
  const o = raw as Record<string, unknown>;
  if (!o || typeof o !== 'object' || !Array.isArray(o.funds)) {
    throw new Error('This file has no funds in it. Export a workbook from PFIC Workbook and open that file.');
  }
  if (typeof o.version !== 'number' || o.version > SCHEMA_VERSION) {
    throw new Error('This workbook file was saved by a newer version. Update the page and try again.');
  }
  const s = (o.settings ?? {}) as Record<string, unknown>;
  const taxYear = s.taxYear === 2026 ? 2026 : 2025;
  const funds = o.funds.map(cleanFund);
  return {
    version: SCHEMA_VERSION,
    settings: { taxYear, filingStatus: str(s.filingStatus, 'Single'), usPersonDate: str(s.usPersonDate) || undefined },
    funds: funds.length > 0 ? funds : [blankFund()],
    ...(str(o.license) ? { license: str(o.license) } : {}),
  };
}

type Store = Pick<Storage, 'getItem' | 'setItem'>;

export function saveState(state: WorkbookState, store: Store): boolean {
  try {
    store.setItem(STORAGE_KEY, exportWorkbook(state));
    return true;
  } catch {
    return false;
  }
}

export function loadState(store: Store): WorkbookState | null {
  try {
    const t = store.getItem(STORAGE_KEY);
    return t ? importWorkbook(t) : null;
  } catch {
    return null;
  }
}
