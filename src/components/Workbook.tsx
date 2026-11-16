import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { withBase } from '../lib/url';
import { parseLots, type ParseError } from '../lib/import/parse-lots';
import { blankFund, blankRow, evaluate, lotToRow, yearsNeeded, rowsToLots, type FundInput, type LotRow } from '../lib/workbook';
import { defaultState, exportWorkbook, importWorkbook, loadState, saveState, type WorkbookState } from '../lib/storage';
import type { Regime } from '../lib/engine/types';
import { verifyLicense, LICENSE_KEY, type LicensePayload } from '../lib/license';
import { isFundUnlocked } from '../lib/paywall';
import { track } from '../lib/analytics';
import { typingLines, resultsCsv } from '../lib/export';
import type { FundResult } from '../lib/engine/types';

const PUBLIC_KEY = (import.meta.env.PUBLIC_LICENSE_PUBLIC_KEY as string | undefined) ?? '';

const DISCLAIMER = 'Prepared with PFIC Workbook from figures you entered. This is not tax advice. Check it or have a preparer check it.';
const CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'CHF', 'CAD', 'AUD', 'JPY', 'SGD'];
const STATUSES = ['Single', 'Married filing jointly', 'Married filing separately', 'Head of household', 'Qualifying surviving spouse'];
const EXAMPLE: string[][] = [
  ['2023-01-05', 'buy   ', ' 10.000', ' 1000.00', '0.0120'],
  ['2023-02-05', 'buy   ', ' 10.000', ' 1020.00', '0.0121'],
  ['2025-08-20', 'redeem', ' 20.000', ' 2300.00', '0.0118'],
];

function isRealDate(s: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return false;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return d.getUTCFullYear() === +m[1] && d.getUTCMonth() === +m[2] - 1 && d.getUTCDate() === +m[3];
}

const whole =(n: number) => Math.round(n).toLocaleString('en-US');
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
  const [state, setState] = useState<WorkbookState>(defaultState);
  const [active, setActive] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [fileMsg, setFileMsg] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const openRef = useRef<HTMLInputElement>(null);
  const [licensePayload, setLicensePayload] = useState<LicensePayload | null>(null);
  const [licenseInput, setLicenseInput] = useState('');
  const [payMsg, setPayMsg] = useState('');
  const [paying, setPaying] = useState(false);
  const [dlMsg, setDlMsg] = useState('');
  const [showLines, setShowLines] = useState(false);

  useEffect(() => {
    try {
      const s = loadState(localStorage);
      const stored = localStorage.getItem(LICENSE_KEY) ?? undefined;
      if (s) setState(stored && !s.license ? { ...s, license: stored } : s);
      else if (stored) setState((x) => ({ ...x, license: stored }));
    } catch {
      /* storage blocked: work without autosave */
    }
    setLoaded(true);
  }, []);
  useEffect(() => {
    let live = true;
    if (!state.license || !PUBLIC_KEY) setLicensePayload(null);
    else verifyLicense(state.license, PUBLIC_KEY).then((p) => live && setLicensePayload(p));
    return () => {
      live = false;
    };
  }, [state.license]);
  useEffect(() => {
    // Returning from Stripe Checkout: swap the session id for a signed license code.
    const sid = new URLSearchParams(location.search).get('session_id');
    if (!sid) return;
    fetch(withBase(`/api/license?session_id=${encodeURIComponent(sid)}`))
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('not ok'))))
      .then(async (d: { license?: string }) => {
        if (d.license && (await verifyLicense(d.license, PUBLIC_KEY))) {
          setState((s) => ({ ...s, license: d.license }));
          setPayMsg('Payment received. Your license is active in this browser.');
          history.replaceState(null, '', location.pathname);
        } else setPayMsg('We could not read the license from your payment. Write to us with your receipt and we will send the code.');
      })
      .catch(() => setPayMsg('We could not confirm your payment yet. Reload this page in a minute.'));
  }, []);
  useEffect(() => {
    if (!loaded) return;
    try {
      if (state.license) localStorage.setItem(LICENSE_KEY, state.license);
    } catch {
      /* ignore */
    }
    try {
      saveState(state, localStorage);
    } catch {
      /* ignore */
    }
  }, [state, loaded]);

  const idx = Math.min(active, state.funds.length - 1);
  const fund = state.funds[idx];
  const taxYear = state.settings.taxYear;
  const status = state.settings.filingStatus;
  const usDate = state.settings.usPersonDate ?? '';
  const { name, isin, currency, regime, rows, yearEnds } = fund;
  const unlocked = isFundUnlocked(idx, licensePayload, taxYear);
  const patch = (p: Partial<FundInput>) => setState((s) => ({ ...s, funds: s.funds.map((f, i) => (i === idx ? { ...f, ...p } : f)) }));
  const setSettings = (p: Partial<WorkbookState['settings']>) => setState((s) => ({ ...s, settings: { ...s.settings, ...p } }));
  const setTaxYear = (y: 2025 | 2026) => setSettings({ taxYear: y });
  const setStatus = (v: string) => setSettings({ filingStatus: v });
  const [usText, setUsText] = useState('');
  const [usTouched, setUsTouched] = useState(false);
  useEffect(() => {
    if (!usTouched) setUsText(usDate);
  }, [usDate, usTouched, loaded]);
  const usDateBad = usText !== '' && !isRealDate(usText);
  function onUsDate(v: string) {
    setUsTouched(true);
    setUsText(v);
    if (v.trim() === '') setSettings({ usPersonDate: undefined });
    else if (isRealDate(v.trim())) setSettings({ usPersonDate: v.trim() });
  }
  const setName = (v: string) => patch({ name: v });
  const setCurrency = (v: string) => patch({ currency: v });
  const setRegime = (v: Regime) => patch({ regime: v });
  const setRows = (fn: (r: LotRow[]) => LotRow[]) => setState((s) => ({ ...s, funds: s.funds.map((f, i) => (i === idx ? { ...f, rows: fn(f.rows) } : f)) }));
  const setYearEnds = (fn: (m: FundInput['yearEnds']) => FundInput['yearEnds']) =>
    setState((s) => ({ ...s, funds: s.funds.map((f, i) => (i === idx ? { ...f, yearEnds: fn(f.yearEnds) } : f)) }));
  const electYear = fund.mtmElectionYear ? String(fund.mtmElectionYear) : '';
  const setElectYear = (v: string) => patch({ mtmElectionYear: v ? Number(v) : undefined });

  function save(data: BlobPart, type: string, filename: string) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([data], { type }));
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  }
  async function downloadZip() {
    setDlMsg('Building your files…');
    try {
      // pdf-lib and fflate load only now.
      const { buildZip } = await import('../lib/pdf/statements');
      const items = state.funds
        .map((f, i) => ({ f, i, o: evaluate({ ...f, settings: state.settings }) }))
        .filter((x) => x.o.kind === 'done' && isFundUnlocked(x.i, licensePayload, taxYear))
        .map((x) => ({ name: x.f.name, result: (x.o as { result: FundResult }).result }));
      const zip = await buildZip(items, taxYear);
      save(zip, 'application/zip', `pfic-workbook-${taxYear}.zip`);
      track('ZIP downloaded', { funds: items.length });
      setDlMsg('ZIP saved to your downloads. It holds statements, a CSV and the lines to type, for every fund you have unlocked.');
    } catch {
      setDlMsg('The files could not be built in this browser. Try the CSV instead.');
    }
  }
  function downloadCsv(r: FundResult) {
    save(resultsCsv(name, r), 'text/csv', `pfic-lots-${taxYear}.csv`);
    setDlMsg('CSV saved to your downloads.');
  }
  function onRowKey(e: KeyboardEvent, i: number) {
    const t = e.target as HTMLElement;
    if (e.key === 'Enter' && t.tagName === 'INPUT') {
      e.preventDefault();
      setRows((r) => [...r.slice(0, i + 1), blankRow(), ...r.slice(i + 1)]);
    } else if (e.key === 'Delete' && t.tagName === 'BUTTON') {
      e.preventDefault();
      removeRow(i);
    }
  }
  function removeRow(i: number) {
    if (confirm(`Remove row ${i + 1}?`)) setRows((x) => x.filter((_, j) => j !== i));
  }
  async function buy() {
    track('Checkout started');
    setPaying(true);
    setPayMsg('');
    try {
      const r = await fetch(withBase('/api/checkout'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ taxYear }) });
      const d = (await r.json()) as { url?: string };
      if (r.ok && d.url) {
        location.href = d.url;
        return;
      }
      setPayMsg('Payments are not available on this preview.');
    } catch {
      setPayMsg('Payments are not available on this preview.');
    }
    setPaying(false);
  }
  async function activate() {
    const p = PUBLIC_KEY ? await verifyLicense(licenseInput, PUBLIC_KEY) : null;
    if (p && p.taxYear === taxYear) {
      setState((s) => ({ ...s, license: licenseInput.trim() }));
      setLicenseInput('');
      setPayMsg(`License accepted for tax year ${p.taxYear}.`);
      track('License activated');
    } else if (p) setPayMsg(`This license is for tax year ${p.taxYear}, not ${taxYear}. Change the tax year above or buy ${taxYear}.`);
    else setPayMsg('This code is not a valid license. Paste it exactly as it was sent, with the dot in the middle.');
  }
  function addFund() {
    setState((s) => ({ ...s, funds: [...s.funds, blankFund()] }));
    track('Fund added', { funds: state.funds.length + 1 });
    setActive(state.funds.length);
    setConfirmDelete(false);
  }
  function deleteFund() {
    setState((s) => ({ ...s, funds: s.funds.length > 1 ? s.funds.filter((_, i) => i !== idx) : [blankFund()] }));
    setActive(0);
    setConfirmDelete(false);
  }
  function exportFile() {
    const blob = new Blob([exportWorkbook(state)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `pfic-workbook-${taxYear}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    setFileMsg('Workbook file saved to your downloads.');
  }
  async function openFile(file: File | undefined) {
    if (!file) return;
    try {
      setState(importWorkbook(await file.text()));
      setActive(0);
      setFileMsg(`Opened ${file.name}.`);
    } catch (e) {
      setFileMsg((e as Error).message);
    }
  }
  const [paste, setPaste] = useState('');
  const [pasteOpen, setPasteOpen] = useState(false);
  const [drop, setDrop] = useState<'idle' | 'over' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const pasteRef = useRef<HTMLTextAreaElement>(null);

  const outcome = useMemo(() => evaluate({ ...fund, settings: state.settings }), [fund, state.settings]);
  const resultKey = outcome.kind === 'done' && !outcome.result.blocked ? `${idx}:${taxYear}:${outcome.result.part5?.l16e ?? outcome.result.part4?.taxYear.gain ?? 0}` : '';
  useEffect(() => {
    if (resultKey && unlocked) track('Results computed', { funds: state.funds.length });
  }, [resultKey, unlocked]);
  const years = useMemo(() => yearsNeeded(rowsToLots(rows, currency).lots, taxYear), [rows, currency, taxYear]);

  function importText(text: string) {
    const res = parseLots(text);
    if (res.lots.length > 0) {
      track('Lots pasted', { lots: res.lots.length });
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

  const fileActions = (
    <>
      <button type="button" class="btn-quiet" onClick={exportFile}>Save workbook file</button>
      <label class="btn-quiet" style="cursor:pointer;">
        Open workbook file
        <input ref={openRef} class="visually-hidden" type="file" accept=".json,application/json" onChange={(e) => { void openFile(e.currentTarget.files?.[0]); e.currentTarget.value = ''; }} />
      </label>
    </>
  );

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
        <label class="wide-only">
          Filing status{' '}
          <select value={status} onChange={(e) => setStatus(e.currentTarget.value)}>
            {STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </label>
        <span class="push wide-only" role="status" aria-live="polite">{fileMsg || 'Saved automatically in this browser'}</span>
      </div>

      <div class="fund-tabs" role="group" aria-label="Funds">
        <div class="fund-tabs-row">
          {state.funds.map((f, i) => (
            <button key={i} type="button" class={i === idx ? 'btn btn-primary' : 'btn btn-secondary'} aria-pressed={i === idx} onClick={() => { setActive(i); setConfirmDelete(false); }}>
              {f.name || `Fund ${i + 1}`}
            </button>
          ))}
          <button type="button" class="btn-quiet" onClick={addFund}>Add a fund</button>
          {state.funds.length > 1 && !confirmDelete && (
            <button type="button" class="btn-quiet" onClick={() => setConfirmDelete(true)}>Delete this fund</button>
          )}
          <span class="file-actions wide-only">{fileActions}</span>
        </div>
        {confirmDelete && (
          <span role="alertdialog" aria-label="Confirm delete">
            Delete {name || `Fund ${idx + 1}`} and its lots?{' '}
            <button type="button" class="btn-quiet" onClick={deleteFund}>Yes, delete</button>{' '}
            <button type="button" class="btn-quiet" onClick={() => setConfirmDelete(false)}>Keep it</button>
          </span>
        )}
      </div>

      <div class="fields has-ln">
        <span class="ln" aria-hidden="true">1</span>
        <div class="field">
          <label class="label" for="fund-name">Fund name</label>
          <input id="fund-name" class="input" value={name} placeholder="Name as on your statement" onInput={(e) => setName(e.currentTarget.value)} />
        </div>
        <div class="field">
          <label class="label" for="fund-ccy">Currency</label>
          <select id="fund-ccy" class="input" value={CURRENCIES.includes(currency) ? currency : 'other'} onChange={(e) => setCurrency(e.currentTarget.value === 'other' ? '' : e.currentTarget.value)}>
            {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
            <option value="other">Other…</option>
          </select>
          {!CURRENCIES.includes(currency) && (
            <input class="input" aria-label="Currency code" placeholder="3-letter code, e.g. SEK" maxLength={3} value={currency} onInput={(e) => setCurrency(e.currentTarget.value.toUpperCase())} />
          )}
        </div>
        <div class="field">
          <span class="label" id="regime-label">Tax treatment</span>
          <div class="choice" role="radiogroup" aria-labelledby="regime-label">
            <label>
              <input type="radio" name="regime" checked={regime === '1291'} onChange={() => setRegime('1291')} />
              <span>§1291</span>
            </label>
            <label>
              <input type="radio" name="regime" checked={regime === 'mtm'} onChange={() => setRegime('mtm')} />
              <span>Mark-to-market</span>
            </label>
          </div>
        </div>
      </div>
      <p class="caption qef-note"><span class="wide-only">QEF is not supported in this version. See a preparer.</span><span class="narrow-inline">QEF: not supported, see a preparer.</span></p>

      <div
        class={`${dropClass} has-ln`}
        style="margin-top: var(--row);"
        onDragOver={(e) => { e.preventDefault(); setDrop('over'); }}
        onDragLeave={() => setDrop('idle')}
        onDrop={(e) => { e.preventDefault(); setDrop('idle'); void readFile(e.dataTransfer?.files?.[0]); }}
      >
        <span class="ln" aria-hidden="true">2</span>
        <div class="drop-actions">
          <button type="button" class="btn btn-primary" onClick={pasteFromClipboard}><span class="wide-only">Paste rows from your spreadsheet</span><span class="narrow-inline">Paste rows</span></button>
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
        <pre class="drop-example" aria-label="Example rows"><b class="ex-row">date{'       '}type{'      '}units{'   '}amount<span class="ex-fx">{'   '}fx_rate</span></b>{EXAMPLE.map((r, i) => <span key={i} class="ex-row">{r.slice(0, 4).join(' ')}<span class="ex-fx">{'  ' + r[4]}</span></span>)}</pre>
        <p class="drop-note">
          Columns: date, type (buy, reinvest, redeem), units, amount in the fund's currency, then the rate to USD on that day.
          {' '}<a href={withBase('/templates/pfic-lots-template.csv')} download>Download the CSV template</a>. Rows stay in this browser.
        </p>
      </div>

      <div class="fields fields-more has-ln">
        <span class="ln" aria-hidden="true">3</span>
        <span class="label details-label">Fund details</span>
        <div class="field">
          <label class="label" for="fund-isin">ISIN (optional)</label>
          <input id="fund-isin" class="input" value={isin} onInput={(e) => patch({ isin: e.currentTarget.value })} />
        </div>
        <div class="field">
          <label class="label" for="us-date">In the US since</label>
          <input id="us-date" class="input num left" inputMode="numeric" placeholder="YYYY-MM-DD" maxLength={10} autocomplete="off" aria-invalid={usDateBad} value={usText} onInput={(e) => onUsDate(e.currentTarget.value)} />
        </div>
        {regime === 'mtm' && (
          <div class="field">
            <label class="label" for="elect-year">First election year</label>
            <select id="elect-year" class="input" value={electYear} onChange={(e) => setElectYear(e.currentTarget.value)}>
              <option value="">From my first lot</option>
              {[2022, 2023, 2024, 2025, 2026].filter((y) => y <= taxYear).map((y) => <option key={y} value={String(y)}>{y} (late election, §1296(j))</option>)}
            </select>
          </div>
        )}
        <div class="field narrow-only">
          <label class="label" for="filing-status">Filing status</label>
          <select id="filing-status" class="input" value={status} onChange={(e) => setStatus(e.currentTarget.value)}>
            {STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>
      {usDateBad && <p class="pencil-note">Write the date as YYYY-MM-DD, for example 2019-08-15. It is ignored until it reads correctly.</p>}

      <h2 class="sheet-h">Lots</h2>
      {!hasRows ? (
        <div class="empty-state">
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
                  <tr key={i} onKeyDown={(e) => onRowKey(e, i)}>
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
                    <td><button type="button" class="btn-quiet" aria-label={`Remove row ${i + 1}`} onClick={() => removeRow(i)}>Remove</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <h2 class="sheet-h">Year-end values</h2>
      <p class="muted">
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

      <h2 class="sheet-h">Results{name ? `: ${name}` : ''}</h2>
      {!unlocked && (
        <div class="locked">
          <img src={withBase('/art/spot-bundle.svg')} alt="" width="144" height="144" />
          <div>
            <h3 style="margin-top: 0;">Fund {idx + 1} needs the {taxYear} license</h3>
            <p class="price">USD 55 <small>for tax year {taxYear}, all funds on one return</small></p>
            <p>Your first fund is free in full. The license unlocks results, statements and the lines to type into Form 8621 for every further fund of tax year {taxYear}.</p>
            <p class="caption">
              PFIC Pro's calculator covers 5 funds for USD 485 (<a href="https://expattaxtools.com/pfic-pro-calculator/" rel="noopener">expattaxtools.com</a>). Refund on request within 14 days.
            </p>
            <button type="button" class="btn-primary" onClick={buy} disabled={paying}>Pay USD 55 and unlock {taxYear}</button>
            <div style="margin-top: var(--half);">
              <label class="label" for="license-code">Already bought? Paste your license code</label>
              <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                <input id="license-code" class="input" style="flex: 1 1 14rem;" value={licenseInput} onInput={(e) => setLicenseInput(e.currentTarget.value)} autocomplete="off" spellcheck={false} />
                <button type="button" class="btn-secondary" onClick={activate} disabled={!licenseInput.trim()}>Use code</button>
              </div>
            </div>
          </div>
        </div>
      )}
      <p class="drop-status" role="status" aria-live="polite">{payMsg}</p>
      <div aria-live="polite">
        {unlocked && outcome.kind === 'empty' && (
          <div class="results-empty">
            <div class="results-lead">
              <img src={withBase('/art/spot-3.svg')} alt="" width="96" height="72" loading="lazy" />
              <p class="muted">Add lots above and these lines fill in.</p>
            </div>
            <div class="results-preview" aria-label="Preview of the Part V lines, filled in once you add lots">
              {['15a', '15b', '15c', '15d', '15e', '15f', '16a', '16b', '16c', '16d', '16e', '16f'].map((ln) => (
                <div key={ln} class="results-line has-ln ghost"><span class="ln" aria-hidden="true">{ln}</span><span class="figure">—</span></div>
              ))}
            </div>
          </div>
        )}
        {unlocked && outcome.kind === 'error' && (
          <div>
            <p class="pencil-note">Fix {outcome.errors.length === 1 ? 'this row' : 'these rows'} first. Nothing is calculated until every row reads cleanly.</p>
            <ul class="flag-list">
              {outcome.errors.slice(0, 6).map((e) => <li key={e.line} class="pencil-note">Row {e.line}: {e.message}</li>)}
            </ul>
          </div>
        )}
        {unlocked && outcome.kind === 'done' && (
          <div>
            {outcome.result.blocked && <p class="pencil-note">{outcome.result.blocked}</p>}
            {outcome.result.part1 && (
              <section style="margin-top: var(--half);">
                <h3>Part I: units held on 31 December {taxYear}</h3>
                <Line ln="Pt I" label="Units held" value={outcome.result.part1.units.toLocaleString('en-US', { maximumFractionDigits: 4 })} />
                <Line ln="Pt I" label="Value in USD" value={whole(outcome.result.part1.value)} note="year-end NAV times units times rate" />
              </section>
            )}
            {outcome.result.part2Election && (
              <section style="margin-top: var(--row);">
                <h3>Part II: election</h3>
                <p class="caption">Tick the mark-to-market election box on this form: {taxYear} is the election year.</p>
              </section>
            )}
            {outcome.result.part5 && (
              <section style="margin-top: var(--row);">
                <h3>Part V: gain on disposition in {taxYear}, default method</h3>
                <p class="caption">Form lines in whole dollars. The table below keeps the cents.</p>
                {outcome.result.part5.excess && (
                  <>
                    <Line ln="15a" label="Distributions this year" value={whole(outcome.result.part5.excess.l15a)} />
                    <Line ln="15b" label="Distributions, earlier years (up to 3)" value={whole(outcome.result.part5.excess.l15b)} />
                    <Line ln="15c" label="Average of earlier years" value={whole(outcome.result.part5.excess.l15c)} />
                    <Line ln="15d" label="125% of the average" value={whole(outcome.result.part5.excess.l15d)} />
                    <Line ln="15e" label="Excess distribution" value={whole(outcome.result.part5.excess.l15e)} note="reinvested distributions count as distributions" />
                  </>
                )}
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
            {!outcome.result.blocked && (
              <section style="margin-top: var(--row);">
                <h3>Take it with you</h3>
                <div class="tool-actions">
                  <button type="button" class="btn btn-primary" onClick={downloadZip}>Download ZIP: statements, CSV, lines</button>
                  <button type="button" class="btn btn-secondary" onClick={() => downloadCsv(outcome.result)}>Results CSV</button>
                  <button type="button" class="btn-quiet" aria-expanded={showLines} onClick={() => setShowLines((v) => !v)}>
                    {showLines ? 'Hide' : 'Show'} lines to type into your tax software
                  </button>
                </div>
                <p class="drop-status" role="status" aria-live="polite">{dlMsg}</p>
                {showLines && (
                  <div>
                    <p class="caption">Whole dollars, as the form wants them. Each line id is the one printed on Form 8621.</p>
                    {typingLines(outcome.result).map((l, i) => <Line key={i} ln={l.ln} label={l.label} value={l.value} />)}
                  </div>
                )}
              </section>
            )}
            <p class="disclaimer">{DISCLAIMER}</p>
          </div>
        )}
      </div>
      <div class="file-end narrow-only">
        <div class="file-end-row">{fileActions}</div>
        <p class="caption" role="status" aria-live="polite">{fileMsg || 'Saved automatically in this browser. First fund free.'}</p>
      </div>
    </div>
  );
}
