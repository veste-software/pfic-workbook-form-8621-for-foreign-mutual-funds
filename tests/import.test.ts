import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { parseLots } from '../src/lib/import/parse-lots';

function rows(n: number): string[] {
  return Array.from({ length: n }, (_, i) => {
    const m = String((i % 12) + 1).padStart(2, '0');
    return `${2022 + Math.floor(i / 12)}-${m}-05\tbuy\t10.5\t1,050.00\t0.012\t`;
  });
}

describe('parseLots', () => {
  it('turns 24 tab-separated rows into 24 lots', () => {
    const r = parseLots(rows(24).join('\n'));
    expect(r.errors).toEqual([]);
    expect(r.lots).toHaveLength(24);
    expect(r.lots[0].amount).toBe(1050);
    expect(r.lots[0].fxRate).toBe(0.012);
  });

  it('reads the template plus 21 rows as 24 lots', () => {
    const tpl = readFileSync('public/templates/pfic-lots-template.csv', 'utf8').trimEnd();
    const extra = Array.from({ length: 21 }, (_, i) => `2024-${String((i % 12) + 1).padStart(2, '0')}-10,buy,5,500,0.012,`);
    const r = parseLots([tpl, ...extra].join('\n'));
    expect(r.errors).toEqual([]);
    expect(r.lots).toHaveLength(24);
  });

  it('reports a malformed row with its line number', () => {
    const text = ['date,type,units,amount', '2024-01-05,buy,10,100', '2024-02-05,bye,10,100', '2024-13-40,buy,1,1'].join('\n');
    const r = parseLots(text);
    expect(r.lots).toHaveLength(1);
    expect(r.errors.map((e) => e.line)).toEqual([3, 4]);
  });

  it('accepts day-first dates when another row proves the order, rejects ambiguous ones', () => {
    const ok = parseLots('25/03/2024,buy,1,10\n05/04/2024,buy,1,10');
    expect(ok.errors).toEqual([]);
    expect(ok.lots.map((l) => l.date)).toEqual(['2024-03-25', '2024-04-05']);
    const amb = parseLots('05/04/2024,buy,1,10');
    expect(amb.errors).toHaveLength(1);
  });
});
