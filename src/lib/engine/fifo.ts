import type { Lot, MatchedPiece } from './types';

export interface OpenLot {
  date: string;
  units: number;
  basisUsd: number;
}

/** USD value of a lot: explicit usdAmount, else amount x fxRate. Throws if neither is known. */
export function lotUsd(lot: Lot): number {
  if (lot.usdAmount !== undefined && Number.isFinite(lot.usdAmount)) return lot.usdAmount;
  if (lot.fxRate !== undefined && Number.isFinite(lot.fxRate)) return lot.amount * lot.fxRate;
  throw new Error(`Lot on ${lot.date} has no USD amount or FX rate.`);
}

export interface FifoResult {
  pieces: MatchedPiece[];
  open: OpenLot[];
}

const order: Record<string, number> = { buy: 0, reinvest: 0, redeem: 1 };

/** Match redemptions against acquisitions first in, first out. Partial lots split pro rata by units. */
export function matchFifo(lots: Lot[]): FifoResult {
  const sorted = lots
    .map((l, i) => ({ l, i }))
    .sort((a, b) => a.l.date.localeCompare(b.l.date) || order[a.l.type] - order[b.l.type] || a.i - b.i)
    .map((x) => x.l);
  const open: OpenLot[] = [];
  const pieces: MatchedPiece[] = [];
  for (const lot of sorted) {
    if (lot.type !== 'redeem') {
      open.push({ date: lot.date, units: lot.units, basisUsd: lotUsd(lot) });
      continue;
    }
    const proceeds = lotUsd(lot);
    let need = lot.units;
    while (need > 1e-9) {
      const head = open[0];
      if (!head) throw new Error(`Redemption on ${lot.date} is for more units than were held.`);
      const take = Math.min(need, head.units);
      const frac = take / head.units;
      const basis = head.basisUsd * frac;
      const proc = proceeds * (take / lot.units);
      pieces.push({ acquired: head.date, disposed: lot.date, units: take, basisUsd: basis, proceedsUsd: proc, gainUsd: proc - basis });
      head.units -= take;
      head.basisUsd -= basis;
      need -= take;
      if (head.units <= 1e-9) open.shift();
    }
  }
  return { pieces, open };
}
