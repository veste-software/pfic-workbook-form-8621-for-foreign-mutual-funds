import { lotUsd } from './fifo';
import { yearOf } from './dates';
import type { Lot, MtmResult, MtmYear, YearEnd } from './types';

interface State {
  acquired: string;
  units: number;
  basis: number;
  /** Inclusions not yet reversed by allowed losses (§1296(c)(2)). */
  unreversed: number;
}

const order: Record<string, number> = { buy: 0, reinvest: 0, redeem: 1 };

/**
 * §1296 mark-to-market, lot by lot, assuming the election applies from the year of the first lot.
 * Each year-end: gain = value - adjusted basis, ordinary income (§1296(a)(1)), basis rises by it;
 * a loss is allowed only up to unreversed inclusions (§1296(c)(2)) and lowers basis (§1296(b)).
 * A redemption gives ordinary gain, or an ordinary loss up to unreversed inclusions with the rest
 * a capital loss (§1296(d)). Throws if a year-end NAV or FX needed for a year is missing.
 */
export function computeMtm(lots: Lot[], yearEnds: YearEnd[], taxYear: number): MtmResult {
  const sorted = lots
    .map((l, i) => ({ l, i }))
    .sort((a, b) => a.l.date.localeCompare(b.l.date) || order[a.l.type] - order[b.l.type] || a.i - b.i)
    .map((x) => x.l);
  const first = yearOf(sorted[0].date);
  const states: State[] = [];
  const years: MtmYear[] = [];
  for (let y = first; y <= taxYear; y++) {
    const yr: MtmYear = {
      year: y, marketValue: 0, adjustedBasis: 0, gain: 0, allowedLoss: 0, unallowedLoss: 0,
      redeemOrdinaryGain: 0, redeemOrdinaryLoss: 0, redeemCapitalLoss: 0, rows: [],
    };
    for (const lot of sorted.filter((l) => yearOf(l.date) === y)) {
      if (lot.type !== 'redeem') {
        states.push({ acquired: lot.date, units: lot.units, basis: lotUsd(lot), unreversed: 0 });
        continue;
      }
      const proceeds = lotUsd(lot);
      let need = lot.units;
      while (need > 1e-9) {
        const s = states[0];
        if (!s) throw new Error(`Redemption on ${lot.date} is for more units than were held.`);
        const take = Math.min(need, s.units);
        const f = take / s.units;
        const basis = s.basis * f;
        const unrev = s.unreversed * f;
        const diff = proceeds * (take / lot.units) - basis;
        if (diff >= 0) yr.redeemOrdinaryGain += diff;
        else {
          const ord = Math.min(-diff, unrev);
          yr.redeemOrdinaryLoss += ord;
          yr.redeemCapitalLoss += -diff - ord;
        }
        s.units -= take;
        s.basis -= basis;
        s.unreversed -= unrev;
        need -= take;
        if (s.units <= 1e-9) states.shift();
      }
    }
    const held = states.reduce((n, s) => n + s.units, 0);
    if (held > 1e-9) {
      const ye = yearEnds.find((e) => e.year === y);
      if (!ye || !(ye.nav > 0) || !(ye.fx > 0)) throw new Error(`Year-end NAV and FX rate for ${y} are missing. Mark-to-market needs every year from the first purchase.`);
      for (const s of states) {
        const value = s.units * ye.nav * ye.fx;
        const basisBefore = s.basis;
        const diff = value - s.basis;
        let included = 0;
        if (diff >= 0) {
          yr.gain += diff;
          s.basis += diff;
          s.unreversed += diff;
          included = diff;
        } else {
          const allowed = Math.min(-diff, s.unreversed);
          yr.allowedLoss += allowed;
          yr.unallowedLoss += -diff - allowed;
          s.basis -= allowed;
          s.unreversed -= allowed;
          included = -allowed;
        }
        yr.marketValue += value;
        yr.adjustedBasis += basisBefore;
        yr.rows.push({ acquired: s.acquired, units: s.units, value, basisBefore, included, basisAfter: s.basis, unreversedAfter: s.unreversed });
      }
    }
    years.push(yr);
  }
  return { years, taxYear: years[years.length - 1] };
}
