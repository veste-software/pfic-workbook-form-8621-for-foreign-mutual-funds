// Shared engine types. No DOM.
export type LotType = 'buy' | 'reinvest' | 'redeem';
export type Regime = '1291' | 'mtm' | 'qef';

export interface Lot {
  date: string; // YYYY-MM-DD
  type: LotType;
  units: number;
  amount: number; // fund currency
  fxRate?: number; // fund currency -> USD on the lot date
  usdAmount?: number; // overrides amount * fxRate
}

export interface YearEnd {
  year: number;
  nav: number; // per unit, fund currency, on Dec 31
  fx: number; // fund currency -> USD, Dec 31
}

export interface Settings {
  taxYear: 2025 | 2026;
  filingStatus: string;
  usPersonDate?: string; // first day the taxpayer was a US person for tax
}

export interface Fund {
  name: string;
  currency: string;
  regime: Regime;
  lots: Lot[];
  yearEnds: YearEnd[];
  /** Line 16d, foreign tax credit on the excess distribution. Default 0. */
  foreignTaxCredit?: number;
}

export interface Flag {
  id: string;
  message: string;
}

export interface MatchedPiece {
  acquired: string;
  disposed: string;
  units: number;
  basisUsd: number;
  proceedsUsd: number;
  gainUsd: number;
}

export interface AllocationRow {
  acquired: string;
  disposed: string;
  units: number;
  gainUsd: number;
  daysTotal: number;
  /** days per calendar year */
  daysByYear: Record<string, number>;
  preDays: number;
  currentYearAmount: number; // 16b share
  priorYears: { year: number; amount: number; rate: number; tax: number; interest: number }[];
}

export interface PartV {
  l15f: number;
  l16a: number;
  l16b: number;
  l16c: number;
  l16d: number;
  l16e: number;
  l16f: number;
  rows: AllocationRow[];
  losses: MatchedPiece[];
}

export interface MtmRow {
  acquired: string;
  units: number;
  value: number;
  basisBefore: number;
  /** gain included (positive) or loss allowed (negative) this year-end */
  included: number;
  basisAfter: number;
  unreversedAfter: number;
}

export interface MtmYear {
  year: number;
  marketValue: number;
  adjustedBasis: number;
  gain: number;
  allowedLoss: number;
  unallowedLoss: number;
  redeemOrdinaryGain: number;
  redeemOrdinaryLoss: number;
  redeemCapitalLoss: number;
  rows: MtmRow[];
}

export interface MtmResult {
  years: MtmYear[];
  taxYear: MtmYear;
}

export interface FundResult {
  blocked?: string;
  flags: Flag[];
  part1?: { units: number; value: number };
  part4?: MtmResult;
  part5?: PartV;
}
