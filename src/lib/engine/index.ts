import { matchFifo } from './fifo';
import { partV } from './s1291';
import { computeMtm } from './mtm';
import { yearOf } from './dates';
import { excessDistribution } from './excess';
import { flag } from './flags';
import type { Flag, Fund, FundResult, Lot, MatchedPiece, Settings } from './types';

/** Compute every fund of a workbook under the same settings. */
export function computeWorkbook(funds: Fund[], settings: Settings): FundResult[] {
  return funds.map((f) => computeFund(f, settings));
}

/** Compute Part I and Part V (§1291) for one fund. Never guesses a missing value: it blocks with a message. */
export function computeFund(fund: Fund, settings: Settings): FundResult {
  const flags: Flag[] = [];
  if (fund.regime === 'qef') {
    return { flags: [flag('qef')], blocked: 'QEF is not supported in this version. See a preparer for Part III.' };
  }
  const Y = settings.taxYear;
  const lots = fund.lots.filter((l) => yearOf(l.date) <= Y);
  if (lots.length === 0) return { flags, blocked: 'Add at least one lot dated on or before the tax year.' };
  if (fund.regime === 'mtm') {
    const firstYear = yearOf(lots.map((l) => l.date).sort()[0]);
    if (fund.mtmElectionYear === undefined || fund.mtmElectionYear <= firstYear) {
      flags.push({
        id: 'mtm-from-first-year',
        message: `Assumes the mark-to-market election applied from the year of your first lot (${firstYear}). If you elected later, set the election year (§1296(j)).`,
      });
    }
    if (settings.usPersonDate && lots.some((l) => l.date < settings.usPersonDate!)) {
      flags.push({ id: 'mtm-us-person', message: 'Some lots were bought before you became a US taxpayer. Their basis for mark-to-market may need adjusting. Check with a preparer.' });
    }
    const E = fund.mtmElectionYear;
    if (E !== undefined && E > yearOf(lots.slice().sort((a, b) => a.date.localeCompare(b.date))[0].date)) {
      return lateElection(fund, lots, E, settings, flags);
    }
    try {
      const part4 = computeMtm(lots, fund.yearEnds, Y);
      const units = part4.taxYear.rows.reduce((s, r) => s + r.units, 0);
      return { flags, part4, part1: { units, value: part4.taxYear.marketValue } };
    } catch (e) {
      return { flags, blocked: (e as Error).message };
    }
  }

  let fifo;
  try {
    fifo = matchFifo(lots);
  } catch (e) {
    return { flags, blocked: (e as Error).message };
  }

  const units = fifo.open.reduce((s, l) => s + l.units, 0);
  let part1: FundResult['part1'];
  if (units > 1e-9) {
    const ye = fund.yearEnds.find((y) => y.year === Y);
    if (!ye || !(ye.nav > 0) || !(ye.fx > 0)) {
      return { flags, blocked: `Year-end NAV and FX rate for ${Y} are missing. Enter them in the year-end values table.` };
    }
    part1 = { units, value: units * ye.nav * ye.fx };
  } else {
    part1 = { units: 0, value: 0 };
  }

  const inYear = fifo.pieces.filter((p) => yearOf(p.disposed) === Y);
  const excess = excessDistribution(lots, Y);
  if (excess.l15e > 0) flags.push(flag('excess-allocation'));
  if (inYear.length === 0) return { flags, part1 };

  if (inYear.some((p) => yearOf(p.acquired) < 2003)) {
    flags.push(flag('pre-2003'));
    return { flags, part1, blocked: 'A holding period starts before 2003, which this version does not cover.' };
  }
  const hasGain = inYear.some((p) => p.gainUsd > 0);
  const hasLoss = inYear.some((p) => p.gainUsd < 0);
  if (hasGain && hasLoss) {
    flags.push(flag('mixed'));
  }
  try {
    const { part, missingQuarters } = partV(inYear, { taxYear: Y, usPersonDate: settings.usPersonDate }, fund.foreignTaxCredit ?? 0);
    if (missingQuarters.length > 0) {
      return {
        flags,
        part1,
        blocked: `Interest cannot be computed: the underpayment rate is not on file for ${missingQuarters.slice(0, 4).join(', ')}${missingQuarters.length > 4 ? ' and more' : ''}. Line 16f is blocked rather than guessed.`,
      };
    }
    part.excess = excess;
    return { flags, part1, part5: part };
  } catch (e) {
    return { flags, part1, blocked: (e as Error).message };
  }
}

/**
 * §1296(j) late election in year E. Lots held before Jan 1 of E are treated as sold at the year-E
 * year-end value and go through Part V (§1291) in year E; their MTM basis afterwards is that value.
 * Lots bought in E are plain MTM. Part V shows only on the year-E return; Part II box only in E.
 */
function lateElection(fund: Fund, lots: Lot[], E: number, settings: Settings, flags: Flag[]): FundResult {
  const Y = settings.taxYear;
  if (E > Y) return { flags, blocked: `The mark-to-market election year ${E} is after the tax year ${Y}. Use the default method for ${Y}.` };
  flags.push({
    id: 'late-election',
    message: `Late mark-to-market election from ${E} (§1296(j)): lots held before January 1, ${E} are treated as sold at the ${E} year-end value and taxed under the default method. Confirm the election statement with a preparer.`,
  });
  const ye = fund.yearEnds.find((y) => y.year === E);
  if (!ye || !(ye.nav > 0) || !(ye.fx > 0)) {
    return { flags, blocked: `Year-end NAV and FX rate for ${E} are missing. The late election needs them to value the deemed sale.` };
  }
  const cutoff = `${E}-12-31`;
  let fifo;
  try {
    fifo = matchFifo(lots.filter((l) => l.date <= cutoff));
  } catch (e) {
    return { flags, blocked: (e as Error).message };
  }
  const price = ye.nav * ye.fx;
  const deemed: MatchedPiece[] = [];
  const fresh: Lot[] = [];
  for (const o of fifo.open) {
    if (o.date < `${E}-01-01`) {
      const proceeds = o.units * price;
      deemed.push({ acquired: o.date, disposed: cutoff, units: o.units, basisUsd: o.basisUsd, proceedsUsd: proceeds, gainUsd: proceeds - o.basisUsd });
      fresh.push({ date: cutoff, type: 'buy', units: o.units, amount: proceeds, usdAmount: proceeds });
    } else {
      fresh.push({ date: o.date, type: 'buy', units: o.units, amount: o.basisUsd, usdAmount: o.basisUsd });
    }
  }
  const later = lots.filter((l) => l.date > cutoff);
  const mtmLots = [...fresh, ...later];
  let part4;
  try {
    part4 = mtmLots.length > 0 ? computeMtm(mtmLots, fund.yearEnds, Y) : undefined;
  } catch (e) {
    return { flags, blocked: (e as Error).message };
  }
  const units = part4 ? part4.taxYear.rows.reduce((s, r) => s + r.units, 0) : 0;
  const result: FundResult = { flags, part4, part1: { units, value: part4?.taxYear.marketValue ?? 0 }, part2Election: Y === E };
  if (Y !== E) return result;
  const pieces = [...fifo.pieces.filter((p) => yearOf(p.disposed) === E && p.acquired < `${E}-01-01`), ...deemed];
  if (pieces.some((p) => yearOf(p.acquired) < 2003)) {
    return { ...result, blocked: 'A holding period starts before 2003, which this version does not cover.' };
  }
  if (pieces.some((p) => p.gainUsd > 0) && pieces.some((p) => p.gainUsd < 0)) {
    flags.push({ id: 'mixed', message: 'Some lots show a gain and some a loss. Gains are allocated; losses are listed and not netted.' });
  }
  try {
    const { part, missingQuarters } = partV(pieces, { taxYear: Y, usPersonDate: settings.usPersonDate }, fund.foreignTaxCredit ?? 0);
    if (missingQuarters.length > 0) return { ...result, blocked: `Interest cannot be computed: the underpayment rate is not on file for ${missingQuarters.slice(0, 4).join(', ')}.` };
    result.part5 = part;
  } catch (e) {
    return { ...result, blocked: (e as Error).message };
  }
  return result;
}
