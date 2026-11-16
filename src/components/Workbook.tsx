import { useMemo, useRef, useState } from 'preact/hooks';
import { withBase } from '../lib/url';
import { parseLots, type ParseError } from '../lib/import/parse-lots';
import { blankRow, evaluate, lotToRow, yearsNeeded, rowsToLots, type LotRow } from '../lib/workbook';
import type { Regime } from '../lib/engine/types';

const DISCLAIMER = 'Prepared with PFIC Workbook from figures you entered. This is not tax advice. Check it or have a preparer check it.';
const CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'CHF', 'CAD', 'AUD', 'JPY', 'SGD'];
const STATUSES = ['Single', 'Married filing jointly', 'Married filing separately', 'Head of household', 'Qualifying surviving spouse'];
const EXAMPLE = `2023-01-05\tbuy\t10.000\t1000.00\t0.0120
2023-02-05\tbuy\t10.000\t1020.00\t0.0121
2025-08-20\tredeem\t20.000\t2300.00\t0.0118`;

const whole = (n: number) => Math.round(n).toLocaleString('en-US');
const cents = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function Line({ ln, label, value, note }: { ln: string; label: string; value: string; note?: string }) {
  return (
    <div class="results-line has-ln">
      <span class="ln" aria-hidden="true">{ln}</span>
      <span>
        {label}
        {note && <span class="caption"> {note}</span>}
      </span>
      <span class="figure">{value}</span>
    </div>
  );
}

export default function Workbook() {
  const [taxYear, setTaxYear] = useState<2025 | 2026>(2025);
  const [status, setStatus] = useState(STATUSES[0]);
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [regime, setRegime] = useState<Regime>('1291');
  const [usDate, setUsDate] = useState('');
  const [rows, setRows] = useState<LotRow[]>([]);
  const [yearEnds, setYearEnds] = useState<Record<number, { nav: string; fx: string }>>({});
  const [paste, setPaste] = useState('');
  const [pasteOpen, setPasteOpen] = useState(false);
  const [drop, setDrop] = useState<'idle' | 'over' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const pasteRef = useRef<HTMLTextAreaElement>(null);

  const input = { name, currency, regime, rows, yearEnds, settings: { taxYear, filingStatus: status, usPersonDate: usDate || undefined } };
  const outcome = useMemo(() => evaluate(input), [name, currency, regime, rows, yearEnds, taxYear, status, usDate]);
  const years = useMemo(() => yearsNeeded(rowsToLots(rows, currency).lots, taxYear), [rows, currency, taxYear]);

  function importText(text: string) {
    const res = parseLots(text);
    if (res.lots.length > 0) {
      setRows((r) => [...r.filter((x) => x.date || x.units || x.amount), ...res.lots.map(lotToRow)]);
    }
    if (res.errors.length > 0) {
      setDrop('error');
      setMessage(
        `${res.lots.length} rows read, ${res.errors.length} not read. ` + res.errors.slice(0, 3).map((e: ParseError) => `Line ${e.line}: ${e.message}`).join(' '),
      );
    } else {
      setDrop('done');
      setMessage(`${res.lots.length} lots added.`);
    }
    setPaste('');
    setPasteOpen(false);
  }

  async function pasteFromClipboard() {
    try {
      const text = await navigator.clipboard.readText();
      if (text.trim()) return importText(text);
    } catch {
      /* clipboard blocked: fall through to the paste box */
    }
    setPasteOpen(true);
    setTimeout(() => pasteRef.current?.focus(), 0);
  }

  async function readFile(file: File | undefined) {
    if (!file) return;
    importText(await file.text());
  }

  const setRow = (i: number, k: keyof LotRow, v: string) => setRows((r) => r.map((x, j) => (j === i ? { ...x, [k]: v } : x)));
  const setYE = (y: number, k: 'nav' | 'fx', v: string) =>
    setYearEnds((m) => ({ ...m, [y]: { nav: m[y]?.nav ?? '', fx: m[y]?.fx ?? '', [k]: v } }));

  const hasRows = rows.length > 0;
  const dropClass = `drop${drop === 'over' ? ' is-over' : drop === 'done' ? ' is-done' : drop === 'error' ? ' is-error' : ''}`;

  return (
    <div class="pad-sheet" id="workbook">
      <div class="pad-band">
        <label>
          Tax year{' '}
          <select value={taxYear} onChange={(e) => setTaxYear(+(e.currentTarget.value) as 2025 | 2026)}>
            <option value="2025">2025</option>
            <option value="2026">2026</option>
          </select>
        </label>
        <label>
          Filing status{' '}
          <select value={status} onChange={(e) => setStatus(e.currentTarget.value)}>
            {STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </label>
        <span class="push">Form 8621, one per fund</span>
      </div>

      <div class="fields">
        <div class="field">
          <label class="label" for="fund-name">Fund name</label>
          <input id="fund-name" class="input" value={name} placeholder="Name as on your statement" onInput={(e) => setName(e.currentTarget.value)} />
        </div>
        <div class="field">
          <label class="label" for="fund-ccy">Currency</label>
          <select id="fund-ccy" class="input" value={currency} onChange={(e) => setCurrency(e.currentTarget.value)}>
            {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div class="field">
          <span class="label" id="regime-label">Tax treatment</span>
          <div class="choice" role="radiogroup" aria-labelledby="regime-label">
            <label>
              <input type="radio" name="regime" checked={regime === '1291'} onChange={() => setRegime('1291')} />
              <span>§1291 default</span>
            </label>
            <label>
              <input type="radio" name="regime" checked={regime === 'mtm'} onChange={() => setRegime('mtm')} />
              <span>Mark-to-market</span>
            </label>
          </div>
        </div>
        <div class="field">
          <label class="label" for="us-date">US taxpayer since (optional)</label>
          <input id="us-date" class="input" type="date" value={usDate} onInput={(e) => setUsDate(e.currentTarget.value)} />
        </div>
      </div>

      <div
        class={dropClass}
        style="margin-top: var(--row);"
        onDragOver={(e) => { e.preventDefault(); setDrop('over'); }}
        onDragLeave={() => setDrop('idle')}
        onDrop={(e) => { e.preventDefault(); setDrop('idle'); void readFile(e.dataTransfer?.files?.[0]); }}
      >
        <div class="drop-actions">
          <button type="button" class="btn btn-primary" onClick={pasteFromClipboard}>Paste rows from your spreadsheet</button>
          <label class="btn btn-secondary">
            Choose CSV file
            <input class="visually-hidden" type="file" accept=".csv,.tsv,.txt,text/csv,text/plain" onChange={(e) => void readFile(e.currentTarget.files?.[0])} />
          </label>
          <button type="button" class="btn-quiet" onClick={() => setRows((r) => [...r, blankRow()])}>Add a lot by hand</button>
        </div>
        {pasteOpen && (
          <div class="field">
            <label class="label" for="paste-box">Paste the rows here</label>
            <textarea ref={pasteRef} id="paste-box" class="input textarea-paste" value={paste} onInput={(e) => setPaste(e.currentTarget.value)} onPaste={(e) => {
              const t = e.clipboardData?.getData('text');
              if (t) { e.preventDefault(); importText(t); }
            }} />
            <div class="tool-actions">
              <button type="button" class="btn btn-primary" onClick={() => importText(paste)}>Add these rows</button>
              <button type="button" class="btn-quiet" onClick={() => setPasteOpen(false)}>Cancel</button>
            </div>
          </div>
        )}
        <p class="drop-status" role="status" aria-live="polite">{message}</p>
        <pre class="drop-example" aria-label="Example rows"><b>date  type  units  amount  fx_rate</b>{'\n'}{EXAMPLE}</pre>
        <p class="drop-note">
          Columns: date, type (buy, reinvest, redeem), units, amount in the fund's currency, then the rate to USD on that day.
          {' '}<a href={withBase('/templates/pfic-lots-template.csv')} download>Download the CSV template</a>. Rows stay in this browser.
        </p>
      </div>

      <h2 style="margin-top: calc(var(--row) * 1.5);">Lots</h2>
      {!hasRows ? (
        <div class="empty-state" style="margin-top: var(--half);">
          <img src={withBase('/art/spot-empty.svg')} alt="" width="128" height="128" />
          <p class="muted">No lots yet. One row for every purchase, reinvested dividend and redemption of this fund.</p>
        </div>
      ) : (
        <div class="table-wrap" style="margin-top: var(--half);">
          <table class="ledger lot-table">
            <caption>Fund currency amounts. The USD column is amount times rate, or the USD amount if you give one.</caption>
            <thead>
              <tr>
                <th scope="col">Date</th><th scope="col">Type</th><th scope="col" class="num">Units</th>
                <th scope="col" class="num">Amount</th><th scope="col" class="num">Rate to USD</th><th scope="col" class="num">USD</th>
                <th scope="col"><span class="visually-hidden">Remove</span></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const usd = r.usd !== '' ? Number(r.usd) : currency === 'USD' && r.fx === '' ? Number(r.amount) : Number(r.amount) * Number(r.fx);
                return (
                  <tr key={i}>
                    <td><input class="input" aria-label={`Row ${i + 1} date`} placeholder="YYYY-MM-DD" value={r.date} onInput={(e) => setRow(i, 'date', e.currentTarget.value)} /></td>
                    <td>
                      <select class="input" aria-label={`Row ${i + 1} type`} value={r.type} onChange={(e) => setRow(i, 'type', e.currentTarget.value)}>
                        <option value="buy">buy</option><option value="reinvest">reinvest</option><option value="redeem">redeem</option>
                      </select>
                    </td>
                    <td><input class="input num" inputMode="decimal" aria-label={`Row ${i + 1} units`} value={r.units} onInput={(e) => setRow(i, 'units', e.currentTarget.value)} /></td>
                    <td><input class="input num" inputMode="decimal" aria-label={`Row ${i + 1} amount`} value={r.amount} onInput={(e) => setRow(i, 'amount', e.currentTarget.value)} /></td>
                    <td><input class="input num" inputMode="decimal" aria-label={`Row ${i + 1} rate to USD`} value={r.fx} placeholder={currency === 'USD' ? '1' : ''} onInput={(e) => setRow(i, 'fx', e.currentTarget.value)} /></td>
                    <td class="num">{Number.isFinite(usd) ? cents(usd) : ''}</td>
                    <td><button type="button" class="btn-quiet" aria-label={`Remove row ${i + 1}`} onClick={() => setRows((x) => x.filter((_, j) => j !== i))}>Remove</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <h2 style="margin-top: calc(var(--row) * 1.5);">Year-end values</h2>
      <p class="muted" style="margin-top: var(--quarter);">
        The fund's price per unit (NAV) on 31 December, in its own currency, and that day's rate to USD. Needed only if you still hold units at the end of {taxYear}.
      </p>
      <div class="table-wrap">
        <table class="ledger">
          <caption>{regime === '1291' ? `Only the ${taxYear} row is used for the default method (Part I).` : 'Mark-to-market needs a row for every year.'}</caption>
          <thead><tr><th scope="col" class="col-year">Year</th><th scope="col" class="num">NAV per unit</th><th scope="col" class="num">Rate to USD</th></tr></thead>
          <tbody>
            {years.filter((y) => regime === 'mtm' || y === taxYear).map((y) => (
              <tr key={y}>
                <td class="col-year">{y}</td>
                <td><input class="input num" inputMode="decimal" aria-label={`${y} NAV per unit`} value={yearEnds[y]?.nav ?? ''} onInput={(e) => setYE(y, 'nav', e.currentTarget.value)} /></td>
                <td><input class="input num" inputMode="decimal" aria-label={`${y} rate to USD`} placeholder={currency === 'USD' ? '1' : ''} value={yearEnds[y]?.fx ?? ''} onInput={(e) => setYE(y, 'fx', e.currentTarget.value)} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 style="margin-top: calc(var(--row) * 1.5);">Results{name ? `: ${name}` : ''}</h2>
      <div aria-live="polite">
        {outcome.kind === 'empty' && <p class="muted">Add lots above and the Form 8621 lines appear here.</p>}
        {outcome.kind === 'error' && (
          <div>
            <p class="pencil-note">Fix {outcome.errors.length === 1 ? 'this row' : 'these rows'} first. Nothing is calculated until every row reads cleanly.</p>
            <ul class="flag-list">
              {outcome.errors.slice(0, 6).map((e) => <li key={e.line} class="pencil-note">Row {e.line}: {e.message}</li>)}
            </ul>
          </div>
        )}
        {outcome.kind === 'done' && (
          <div>
            {outcome.result.blocked && <p class="pencil-note">{outcome.result.blocked}</p>}
            {outcome.result.part1 && (
              <section style="margin-top: var(--half);">
                <h3>Part I: units held on 31 December {taxYear}</h3>
                <Line ln="Pt I" label="Units held" value={outcome.result.part1.units.toLocaleString('en-US', { maximumFractionDigits: 4 })} />
                <Line ln="Pt I" label="Value in USD" value={whole(outcome.result.part1.value)} note="year-end NAV times units times rate" />
              </section>
            )}
            {outcome.result.part5 && (
              <section style="margin-top: var(--row);">
                <h3>Part V: gain on disposition in {taxYear}, default method</h3>
                <p class="caption">Form lines in whole dollars. The table below keeps the cents.</p>
                <Line ln="15f" label="Total gain on disposition" value={whole(outcome.result.part5.l15f)} />
                <Line ln="16a" label="Gain allocated" value={whole(outcome.result.part5.l16a)} />
                <Line ln="16b" label={`Amount for ${taxYear} (and pre-PFIC years)`} value={whole(outcome.result.part5.l16b)} />
                <Line ln="16c" label="Tax on earlier years' share" value={whole(outcome.result.part5.l16c)} note="at the highest rate of each year" />
                <Line ln="16d" label="Foreign tax credit" value={whole(outcome.result.part5.l16d)} />
                <Line ln="16e" label="Total tax (16c minus 16d)" value={whole(outcome.result.part5.l16e)} />
                <Line ln="16f" label="Interest" value={whole(outcome.result.part5.l16f)} note="underpayment rate, compounded daily" />
                <h3 style="margin-top: var(--row);">Per-lot allocation</h3>
                <div class="table-wrap">
                  <table class="ledger">
                    <caption>Each gain is spread over the days held, from the day after purchase to the day of sale.</caption>
                    <thead><tr><th scope="col">Bought</th><th scope="col">Sold</th><th scope="col" class="num">Units</th><th scope="col" class="num">Gain USD</th><th scope="col" class="num">Days</th><th scope="col" class="num">{taxYear} share</th><th scope="col" class="num">Tax, earlier years</th><th scope="col" class="num">Interest</th></tr></thead>
                    <tbody>
                      {outcome.result.part5.rows.map((r, i) => (
                        <tr key={i}>
                          <td>{r.acquired}</td><td>{r.disposed}</td>
                          <td class="num">{r.units.toLocaleString('en-US', { maximumFractionDigits: 4 })}</td>
                          <td class="num">{cents(r.gainUsd)}</td><td class="num">{r.daysTotal}</td>
                          <td class="num">{cents(r.currentYearAmount)}</td>
                          <td class="num">{cents(r.priorYears.reduce((s, y) => s + y.tax, 0))}</td>
                          <td class="num">{cents(r.priorYears.reduce((s, y) => s + y.interest, 0))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {outcome.result.part5.losses.length > 0 && (
                  <p class="pencil-note" style="margin-top: var(--half);">
                    {outcome.result.part5.losses.length} lot{outcome.result.part5.losses.length > 1 ? 's' : ''} sold at a loss, not allocated: {outcome.result.part5.losses.map((l) => `${l.acquired} (${cents(l.gainUsd)})`).join(', ')}.
                  </p>
                )}
              </section>
            )}
            {outcome.result.part4 && (
              <section style="margin-top: var(--row);">
                <h3>Part IV: mark-to-market for {taxYear}</h3>
                <p class="caption">Form lines in whole dollars. Gains are ordinary income.</p>
                <Line ln="10a" label="Value at year-end" value={whole(outcome.result.part4.taxYear.marketValue)} />
                <Line ln="10b" label="Adjusted basis before marking" value={whole(outcome.result.part4.taxYear.adjustedBasis)} />
                <Line ln="Gain" label="Gain included in income" value={whole(outcome.result.part4.taxYear.gain)} />
                <Line ln="Loss" label="Loss allowed" value={whole(outcome.result.part4.taxYear.allowedLoss)} note="only up to gains included before" />
                {outcome.result.part4.taxYear.unallowedLoss > 0 && (
                  <Line ln="Loss" label="Loss not allowed" value={whole(outcome.result.part4.taxYear.unallowedLoss)} note="carried in basis, not deductible" />
                )}
                {(outcome.result.part4.taxYear.redeemOrdinaryGain + outcome.result.part4.taxYear.redeemOrdinaryLoss + outcome.result.part4.taxYear.redeemCapitalLoss) > 0 && (
                  <div>
                    <Line ln="Sold" label="Ordinary gain on sales" value={whole(outcome.result.part4.taxYear.redeemOrdinaryGain)} />
                    <Line ln="Sold" label="Ordinary loss on sales" value={whole(outcome.result.part4.taxYear.redeemOrdinaryLoss)} />
                    <Line ln="Sold" label="Capital loss on sales" value={whole(outcome.result.part4.taxYear.redeemCapitalLoss)} />
                  </div>
                )}
                <h3 style="margin-top: var(--row);">Per-lot marking, {taxYear}</h3>
                <div class="table-wrap">
                  <table class="ledger">
                    <caption>Included is the gain added to income, or the loss allowed (negative). Basis carries to the next year.</caption>
                    <thead><tr><th scope="col">Bought</th><th scope="col" class="num">Units</th><th scope="col" class="num">Value USD</th><th scope="col" class="num">Basis before</th><th scope="col" class="num">Included</th><th scope="col" class="num">Basis after</th></tr></thead>
                    <tbody>
                      {outcome.result.part4.taxYear.rows.map((r, i) => (
                        <tr key={i}>
                          <td>{r.acquired}</td>
                          <td class="num">{r.units.toLocaleString('en-US', { maximumFractionDigits: 4 })}</td>
                          <td class="num">{cents(r.value)}</td><td class="num">{cents(r.basisBefore)}</td>
                          <td class="num">{cents(r.included)}</td><td class="num">{cents(r.basisAfter)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
            <ul class="flag-list">
              {outcome.result.flags.map((f) => <li key={f.id} class="pencil-note">{f.message}</li>)}
            </ul>
            <p class="disclaimer">{DISCLAIMER}</p>
          </div>
        )}
      </div>
    </div>
  );
}
