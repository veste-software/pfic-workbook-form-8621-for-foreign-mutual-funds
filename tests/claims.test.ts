import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const read = (p: string) => readFileSync(p, 'utf8');

describe('no claims about unbuilt features', () => {
  it('does not promise a filled PDF', () => {
    for (const f of ['src/pages/index.astro', 'src/pages/pricing.astro', 'src/components/Workbook.tsx']) {
      expect(read(f)).not.toMatch(/filled (into|Form 8621)? ?(the )?(official )?PDF|filled PDF|results and PDF/i);
    }
  });
  it('states the 2017 rate table limit, not 2003', () => {
    const t = read('src/pages/how-it-works.astro');
    expect(t).not.toMatch(/before 2003/);
    expect(t).toMatch(/2017-Q1/);
  });
});
