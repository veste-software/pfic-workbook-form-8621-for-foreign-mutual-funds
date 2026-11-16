import { matchFifo } from './fifo';
import { partV } from './s1291';
import { computeMtm } from './mtm';
import { yearOf } from './dates';
import type { Flag, Fund, FundResult, Settings } from './types';

/** Compute Part I and Part V (§1291) for one fund. Never guesses a missing value: it blocks with a message. */
export function computeFund(fund: Fund, settings: Settings): FundResult {
  const flags: Flag[] = [];
  if (fund.regime === 'qef') {
    return { flags, blocked: 'QEF is not supported in this version. See a preparer for Part III.' };
  }
  const Y = settings.taxYear;
  const lots = fund.lots.filter((l) => yearOf(l.date) <= Y);
  if (lots.length === 0) return { flags, blocked: 'Add at least one lot dated on or before the tax year.' };
  if (fund.regime === 'mtm') {
    flags.push({
      id: 'mtm-from-first-year',
      message: 'Assumes the mark-to-market election applied from the year of your first lot. A later election (§1296(j)) is not calculated in this version.',
    });
    if (settings.usPersonDate && lots.some((l) => l.date < settings.usPersonDate!)) {
      flags.push({ id: 'mtm-us-person', message: 'Some lots were bought before you became a US taxpayer. Their basis for mark-to-market may need adjusting. Check with a preparer.' });
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
  if (fund.lots.some((l) => l.type === 'reinvest' && yearOf(l.date) >= Y - 3)) {
    flags.push({
      id: 'excess-unchecked',
      message: 'This fund has reinvested distributions. Lines 15a to 15e (excess distributions) are not calculated in this version. Check them yourself.',
    });
  }
  if (inYear.length === 0) return { flags, part1 };

  if (inYear.some((p) => yearOf(p.acquired) < 2003)) {
    flags.push({ id: 'pre-2003', message: 'A holding period starts before 2003. Interest rates and top rates before 2003 are not in this version.' });
    return { flags, part1, blocked: 'A holding period starts before 2003, which this version does not cover.' };
  }
  const hasGain = inYear.some((p) => p.gainUsd > 0);
  const hasLoss = inYear.some((p) => p.gainUsd < 0);
  if (hasGain && hasLoss) {
    flags.push({ id: 'mixed', message: 'Some lots show a gain and some a loss. Gains are allocated; losses are listed and not netted. Check how your software or preparer treats them.' });
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
    return { flags, part1, part5: part };
  } catch (e) {
    return { flags, part1, blocked: (e as Error).message };
  }
}
