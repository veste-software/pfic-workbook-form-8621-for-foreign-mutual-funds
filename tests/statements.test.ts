import { describe, expect, it } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import { unzipSync, unzlibSync } from 'fflate';
import { computeFund } from '../src/lib/engine';
import { buildZip, statement1291 } from '../src/lib/pdf/statements';
import { resultsCsv, typingLines, DISCLAIMER } from '../src/lib/export';
import type { Fund } from '../src/lib/engine/types';

const fund: Fund = {
  name: 'Test Fund, A',
  currency: 'USD',
  regime: '1291',
  lots: [
    { date: '2020-01-05', type: 'buy', units: 10, amount: 1000, fxRate: 1 },
    { date: '2025-08-20', type: 'redeem', units: 10, amount: 2300, fxRate: 1 },
  ],
  yearEnds: [],
};
const result = computeFund(fund, { taxYear: 2025, filingStatus: 'Single' });

describe('statements and exports', () => {
  it('builds a 16a statement with the disclaimer on every page', async () => {
    const bytes = await statement1291(fund.name, 2025, result);
    expect(bytes).not.toBeNull();
    const doc = await PDFDocument.load(bytes!);
    expect(doc.getPageCount()).toBeGreaterThan(0);
    // Inflate every content stream and count the ones that carry the disclaimer.
    const raw = Buffer.from(bytes!).toString('latin1');
    let hits = 0;
    for (const m of raw.matchAll(/stream\r?\n([\s\S]*?)\r?\nendstream/g)) {
      try {
        const text = Buffer.from(unzlibSync(Uint8Array.from(Buffer.from(m[1], 'latin1')))).toString('latin1');
        // pdf-lib writes standard-font text as a hex string.
        const hex = Buffer.from('Prepared with PFIC Workbook', 'latin1').toString('hex').toUpperCase();
        if (text.includes('Prepared with PFIC Workbook') || text.toUpperCase().includes(hex)) hits++;
      } catch {
        /* not a flate stream */
      }
    }
    expect(hits).toBe(doc.getPageCount());
  });
  it('zips the expected file names', async () => {
    const zip = await buildZip([{ name: fund.name, result }], 2025);
    const names = Object.keys(unzipSync(zip)).sort();
    expect(names).toEqual(['fund-1-test-fund-a-lines-to-type.txt', 'fund-1-test-fund-a-lots.csv', 'fund-1-test-fund-a-statement-16a.pdf']);
  });
  it('lists line ids and quotes csv fields', () => {
    expect(typingLines(result).map((l) => l.ln)).toContain('16a');
    const csv = resultsCsv('A, B', result);
    expect(csv.split('\r\n')[1].startsWith('"A, B",1291,2020-01-05')).toBe(true);
    expect(DISCLAIMER).toMatch(/not tax advice/);
  });
});
