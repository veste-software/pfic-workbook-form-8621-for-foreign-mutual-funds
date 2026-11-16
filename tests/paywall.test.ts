import { describe, it, expect } from 'vitest';
import { isFundUnlocked } from '../src/lib/paywall';
import { exportWorkbook, importWorkbook, defaultState } from '../src/lib/storage';

describe('isFundUnlocked', () => {
  it('first fund is always free', () => {
    expect(isFundUnlocked(0, null, 2025)).toBe(true);
  });
  it('second fund needs a license for the same tax year', () => {
    expect(isFundUnlocked(1, null, 2025)).toBe(false);
    expect(isFundUnlocked(1, { taxYear: 2025 }, 2025)).toBe(true);
    expect(isFundUnlocked(1, { taxYear: 2025 }, 2026)).toBe(false);
  });
});

describe('license in the workbook file', () => {
  it('survives export and import', () => {
    const s = { ...defaultState(), license: 'abc.def' };
    expect(importWorkbook(exportWorkbook(s)).license).toBe('abc.def');
  });
});
