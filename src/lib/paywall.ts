import type { LicensePayload } from './license';

/** The first fund is free; every later fund needs a license for the tax year. Pure. */
export function isFundUnlocked(index: number, license: Pick<LicensePayload, 'taxYear'> | null | undefined, taxYear: number): boolean {
  if (index <= 0) return true;
  return !!license && license.taxYear === taxYear;
}
