import { useMemo, useState } from 'preact/hooks';
import { withBase } from '../lib/url';
import { evaluate, lotToRow, rowsToLots, type FundInput, type LotRow } from '../lib/workbook';
import { parseLots } from '../lib/import/parse-lots';
import { openInWorkbook } from '../lib/open-workbook';

const EXAMPLE = `2023-01-05\tbuy\t10.000\t1000.00
2023-02-05\tbuy\t10.000\t1020.00
2025-08-20\tredeem\t20.000\t2300.00`;
const cents = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const DISCLAIMER = 'Prepared with PFIC Workbook from figures you entered. This is not tax advice. Check it or have a preparer check it.';

/** Multi-lot section 1291 disposition calculator. USD lots only; other currencies go through the workbook. */
export default function ExcessCalculator() {
  const [text, setText] = useState(EXAMPLE);
  const [year, setYear] = useState<2025 | 2026>(2025);
  const [note, setNote] = useState('');
  const parsed = useMemo(() => parseLots(text), [text]);
  const rows: LotRow[] = useMemo(() => parsed.lots.map(lotToRow), [parsed]);
  const outcome = useMemo(() => {
    if (parsed.errors.length > 0 || rows.length === 0) return null;
    const fund: FundInput = { name: '', isin: '', currency: 'USD', regime: '1291', rows, yearEnds: {} };
    return evaluate({ ...fund, settings: { taxYear: year, filingStatus: 'Single' } });
  }, [parsed, rows, year]);
  const p5 = outcome?.kind === 'done' ? outcome.result.part5 : undefined;

  function open() {
    const fund: FundInput = { name: '', isin: '', currency: 'USD', regime: '1291', rows, yearEnds: {} };
    let ok = false;
    try {
      ok = openInWorkbook(fund, localStorage);
    } catch {
      ok = false;
    }
    if (ok) location.href = withBase('/');
    else setNote('Your browser blocks local storage. Copy the rows into the workbook by hand.');
  }

  return (
    <div class="pad-sheet">
      <div class="field">
        <label class="label" for="ex-lots">Lots in US dollars: date, type (buy, reinvest, redeem), units, amount</label>
        <textarea id="ex-lots" class="input num" rows={7} value={text} spellcheck={false} onInput={(e) => setText(e.currentTarget.value)} />
      </div>
      <div class="field">
        <label class="label" for="ex-year">Tax year</label>
        <select id="ex-year" class="input" value={year} onChange={(e) => setYear(+e.currentTarget.value === 2026 ? 2026 : 2025)}>
          <option value="2025">2025</option>
          <option value="2026">2026</option>
        </select>
      </div>
      <div aria-live="polite">
        {parsed.errors.length > 0 && (
          <div>
            <p class="pencil-note">Fix {parsed.errors.length === 1 ? 'this line' : 'these lines'} first.</p>
            <ul>{parsed.errors.map((e) => <li key={e.line}>Line {e.line}: {e.message}</li>)}</ul>
          </div>
        )}
        {parsed.lots.length === 0 && parsed.errors.length === 0 && <p class="muted">Paste your lots and the allocation appears here.</p>}
        {outcome?.kind === 'error' && <p class="pencil-note">{outcome.errors[0]?.message}</p>}
        {outcome?.kind === 'done' && outcome.result.blocked && <p class="pencil-note">{outcome.result.blocked}</p>}
        {p5 && (
          <div>
            <h3>Result for {year}</h3>
            <p>Total gain <span class="num">{cents(p5.l15f)}</span>. Share for {year} <span class="num">{cents(p5.l16b)}</span>. Tax on earlier years <span class="num">{cents(p5.l16c)}</span>. Interest <span class="num">{cents(p5.l16f)}</span>.</p>
            <div class="table-wrap">
              <table class="ledger">
                <caption>Each gain is spread over the days held, from the day after purchase to the day of sale.</caption>
                <thead><tr><th scope="col">Bought</th><th scope="col">Sold</th><th scope="col" class="num">Gain USD</th><th scope="col" class="num">Days</th><th scope="col" class="num">{year} share</th><th scope="col" class="num">Tax, earlier years</th><th scope="col" class="num">Interest</th></tr></thead>
                <tbody>
                  {p5.rows.map((r, i) => (
                    <tr key={i}>
                      <td>{r.acquired}</td><td>{r.disposed}</td><td class="num">{cents(r.gainUsd)}</td><td class="num">{r.daysTotal}</td>
                      <td class="num">{cents(r.currentYearAmount)}</td>
                      <td class="num">{cents(r.priorYears.reduce((s, y) => s + y.tax, 0))}</td>
                      <td class="num">{cents(r.priorYears.reduce((s, y) => s + y.interest, 0))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p class="caption">{DISCLAIMER}</p>
          </div>
        )}
        {!p5 && outcome?.kind === 'done' && !outcome.result.blocked && <p class="muted">No sale in {year}, so there is nothing to allocate.</p>}
      </div>
      <p>
        <button type="button" class="btn btn-primary" disabled={rows.length === 0 || parsed.errors.length > 0} onClick={open}>Open in the workbook</button>
        <span aria-live="polite"> {note && <span class="pencil-note">{note}</span>}</span>
      </p>
    </div>
  );
}
