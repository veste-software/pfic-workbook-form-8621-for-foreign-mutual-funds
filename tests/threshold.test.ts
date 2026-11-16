import { describe, it, expect } from 'vitest';
import { checkThreshold, thresholdLimit } from '../src/lib/threshold';

const base = { totalValueUsd: 10000, filingStatus: 'single' as const, hadDistributionOrSale: false, hasElection: false };

describe('threshold', () => {
  it('limits', () => {
    expect(thresholdLimit('single')).toBe(25000);
    expect(thresholdLimit('mfj')).toBe(50000);
  });
  it('small holding with nothing else may be exempt', () => {
    expect(checkThreshold(base).verdict).toBe('maybe-exempt');
  });
  it('exactly at the limit may be exempt, above must file', () => {
    expect(checkThreshold({ ...base, totalValueUsd: 25000 }).verdict).toBe('maybe-exempt');
    expect(checkThreshold({ ...base, totalValueUsd: 25000.01 }).verdict).toBe('file');
    expect(checkThreshold({ ...base, filingStatus: 'mfj', totalValueUsd: 40000 }).verdict).toBe('maybe-exempt');
  });
  it('a sale or an election means file', () => {
    expect(checkThreshold({ ...base, hadDistributionOrSale: true }).verdict).toBe('file');
    expect(checkThreshold({ ...base, hasElection: true }).verdict).toBe('file');
  });
  it('rejects bad numbers', () => {
    expect(checkThreshold({ ...base, totalValueUsd: NaN }).verdict).toBe('invalid');
    expect(checkThreshold({ ...base, totalValueUsd: -1 }).verdict).toBe('invalid');
  });
});
