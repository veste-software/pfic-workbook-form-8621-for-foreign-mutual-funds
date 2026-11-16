import { useState } from 'preact/hooks';
import { withBase } from '../lib/url';
import { openInWorkbook, presetFund } from '../lib/open-workbook';

/** "Start with INR": sets the fund currency in this browser's workbook and opens it. Nothing is sent anywhere. */
export default function OpenButton({ currency, label }: { currency: string; label: string }) {
  const [failed, setFailed] = useState(false);
  function go() {
    let ok = false;
    try {
      ok = openInWorkbook(presetFund(currency), localStorage);
    } catch {
      ok = false;
    }
    if (ok) location.href = withBase('/');
    else setFailed(true);
  }
  return (
    <span>
      <button type="button" class="btn btn-primary" onClick={go}>{label}</button>
      <span aria-live="polite">{failed && <span class="pencil-note"> Your browser blocks local storage, so the workbook cannot be pre-set. Open the workbook and choose {currency} there.</span>}</span>
    </span>
  );
}
