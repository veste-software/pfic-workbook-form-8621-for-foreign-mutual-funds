import { describe, expect, it } from 'vitest';
import { matchFifo } from '../../src/lib/engine/fifo';
import type { Lot } from '../../src/lib/engine/types';

// 24 synthetic monthly SIP lots, 2023-01-05 .. 2024-12-05, 10 units each.
// Lot i (1..24) costs USD 100 + i (basis per lot), so lot 1 = 101, lot 2 = 102.
const lots: Lot[] = Array.from({ length: 24 }, (_, i) => ({
  date: `${2023 + Math.floor(i / 12)}-${String((i % 12) + 1).padStart(2, '0')}-05`,
  type: 'buy' as const,
  units: 10,
  amount: 100 + i + 1,
  fxRate: 1,
}));

describe('fixture 2b: SIP and FIFO', () => {
  it('matches a 25-unit redemption against lots 1, 2 and half of lot 3', () => {
    const { pieces, open } = matchFifo([...lots, { date: '2025-01-10', type: 'redeem', units: 25, amount: 500, fxRate: 1 }]);
    // Lot 1: 10 units, basis 101. Lot 2: 10 units, basis 102. Lot 3: 5 of 10 units, basis 103 / 2 = 51.5.
    expect(pieces.map((p) => p.units)).toEqual([10, 10, 5]);
    expect(pieces.map((p) => p.basisUsd)).toEqual([101, 102, 51.5]);
    // Proceeds 500 for 25 units = 20 per unit: 200, 200, 100.
    expect(pieces.map((p) => p.proceedsUsd)).toEqual([200, 200, 100]);
    expect(pieces[2].acquired).toBe('2023-03-05');
    // Lot 3 keeps 5 units and 51.5 basis; 21 lots remain open in total.
    expect(open).toHaveLength(22);
    expect(open[0]).toEqual({ date: '2023-03-05', units: 5, basisUsd: 51.5 });
    expect(open.reduce((s, l) => s + l.units, 0)).toBe(215);
  });

  it('rejects a redemption of more units than held', () => {
    expect(() => matchFifo([lots[0], { date: '2024-01-01', type: 'redeem', units: 11, amount: 1, fxRate: 1 }])).toThrow(/more units/);
  });
});
