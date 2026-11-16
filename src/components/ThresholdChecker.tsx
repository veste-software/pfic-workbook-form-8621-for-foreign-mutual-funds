import { useState } from 'preact/hooks';
import { checkThreshold, type ThresholdFiling } from '../lib/threshold';

export default function ThresholdChecker() {
  const [value, setValue] = useState('');
  const [status, setStatus] = useState<ThresholdFiling>('single');
  const [sale, setSale] = useState(false);
  const [election, setElection] = useState(false);
  const [done, setDone] = useState(false);

  const result = checkThreshold({
    totalValueUsd: value.trim() === '' ? NaN : Number(value.replace(/[, ]/g, '')),
    filingStatus: status,
    hadDistributionOrSale: sale,
    hasElection: election,
  });

  return (
    <form class="pad-sheet" onSubmit={(e) => { e.preventDefault(); setDone(true); }} noValidate>
      <div class="fields">
        <div class="field">
          <label class="label" for="th-value">Total year-end value of your funds, USD</label>
          <input id="th-value" class="input num" inputMode="decimal" autoComplete="off" value={value}
            onInput={(e) => { setValue(e.currentTarget.value); setDone(false); }} aria-invalid={done && result.verdict === 'invalid'} />
        </div>
        <div class="field">
          <label class="label" for="th-status">Filing status</label>
          <select id="th-status" class="input" value={status} onChange={(e) => { setStatus(e.currentTarget.value as ThresholdFiling); setDone(false); }}>
            <option value="single">Single or married filing separately</option>
            <option value="mfj">Married filing jointly</option>
            <option value="other">Head of household or other</option>
          </select>
        </div>
      </div>
      <p><label class="check"><input type="checkbox" checked={sale} onChange={(e) => { setSale(e.currentTarget.checked); setDone(false); }} /> A fund paid a distribution or I sold units this year</label></p>
      <p><label class="check"><input type="checkbox" checked={election} onChange={(e) => { setElection(e.currentTarget.checked); setDone(false); }} /> I have a QEF or mark-to-market election</label></p>
      <p><button class="btn btn-primary" type="submit">Check</button></p>
      <div aria-live="polite">
        {done && result.verdict === 'invalid' && <p class="pencil-note">{result.reasons[0]}</p>}
        {done && result.verdict === 'file' && (
          <div>
            <h2>You most likely file Form 8621.</h2>
            <ul>{result.reasons.map((r) => <li>{r}</li>)}</ul>
          </div>
        )}
        {done && result.verdict === 'maybe-exempt' && (
          <div>
            <h2>The small-holding exception may apply.</h2>
            <p>{result.reasons[0]}</p>
          </div>
        )}
        {!done && <p class="muted">The answer appears here.</p>}
      </div>
    </form>
  );
}
