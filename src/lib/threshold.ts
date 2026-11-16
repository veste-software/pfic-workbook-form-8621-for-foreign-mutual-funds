/**
 * Filing-threshold check for Form 8621.
 *
 * Source: Treas. Reg. §1.1298-1(c) (de minimis rule), as summarised from the Form 8621
 * instructions. The exact "Exceptions" wording of the 12/2025 instructions is still to be
 * checked by the operator (see PLAN task 20); this function never quotes it.
 */

export type ThresholdFiling = 'single' | 'mfj' | 'other';

export interface ThresholdInput {
  /** Aggregate year-end value in USD of all PFIC stock you own directly. */
  totalValueUsd: number;
  filingStatus: ThresholdFiling;
  /** Any distribution from, or sale of, a PFIC during the year. */
  hadDistributionOrSale: boolean;
  /** A QEF or mark-to-market election is in force for any of the funds. */
  hasElection: boolean;
}

export type ThresholdVerdict = 'file' | 'maybe-exempt' | 'invalid';

export interface ThresholdResult {
  verdict: ThresholdVerdict;
  limitUsd: number;
  reasons: string[];
}

export function thresholdLimit(status: ThresholdFiling): number {
  return status === 'mfj' ? 50000 : 25000;
}

export function checkThreshold(input: ThresholdInput): ThresholdResult {
  const limitUsd = thresholdLimit(input.filingStatus);
  if (!Number.isFinite(input.totalValueUsd) || input.totalValueUsd < 0) {
    return { verdict: 'invalid', limitUsd, reasons: ['Enter the total year-end value as a number of zero or more.'] };
  }
  const reasons: string[] = [];
  if (input.hadDistributionOrSale) reasons.push('A distribution from, or a sale of, a PFIC during the year calls for a form.');
  if (input.hasElection) reasons.push('A QEF or mark-to-market election calls for a form.');
  if (input.totalValueUsd > limitUsd) {
    reasons.push(`The year-end value is above USD ${limitUsd.toLocaleString('en-US')}.`);
  }
  if (reasons.length > 0) return { verdict: 'file', limitUsd, reasons };
  return {
    verdict: 'maybe-exempt',
    limitUsd,
    reasons: [`The value is at or under USD ${limitUsd.toLocaleString('en-US')} with no distribution, sale or election, so the de minimis exception may apply. Check it against the instructions.`],
  };
}
