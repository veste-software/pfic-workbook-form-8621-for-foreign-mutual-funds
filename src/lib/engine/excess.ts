import { lotUsd } from './fifo';
import { yearOf } from './dates';
import type { ExcessResult, Lot } from './types';

/**
 * §1291(b) excess distributions, i8621 Part V lines 15a-15e. Reinvested distributions (type "reinvest")
 * stand in for distributions received. 15a = this year's; 15b = prior years' total (at most the 3 years
 * before, and only years the shares were held); 15c = their average; 15d = 125% of 15c; 15e = 15a - 15d if positive.
 * In the first year of holding there is no excess distribution (§1291(b)(2)(B)).
 */
export function excessDistribution(lots: Lot[], taxYear: number): ExcessResult {
  const firstYear = Math.min(...lots.map((l) => yearOf(l.date)));
  const dist = (y: number) => lots.filter((l) => l.type === 'reinvest' && yearOf(l.date) === y).reduce((s, l) => s + lotUsd(l), 0);
  const l15a = dist(taxYear);
  const priorYears: number[] = [];
  for (let y = taxYear - 3; y < taxYear; y++) if (y >= firstYear) priorYears.push(y);
  const l15b = priorYears.reduce((s, y) => s + dist(y), 0);
  const l15c = priorYears.length > 0 ? l15b / priorYears.length : 0;
  const l15d = l15c * 1.25;
  const l15e = priorYears.length > 0 ? Math.max(0, l15a - l15d) : 0;
  return { l15a, l15b, l15c, l15d, l15e, priorYears: priorYears.length };
}
