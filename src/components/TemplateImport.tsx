import { useState } from 'preact/hooks';
import { parseLots, type ParseResult } from '../lib/import/parse-lots';

/** Check a pasted or chosen file against the template format. Nothing leaves the browser. */
export default function TemplateImport() {
  const [text, setText] = useState('');
  const [res, setRes] = useState<ParseResult | null>(null);

  function check(t: string) {
    setText(t);
    setRes(t.trim() === '' ? null : parseLots(t));
  }
  async function onFile(e: Event) {
    const f = (e.currentTarget as HTMLInputElement).files?.[0];
    if (f) check(await f.text());
  }

  return (
    <div class="pad-sheet">
      <div class="field">
        <label class="label" for="tpl-text">Paste rows from your spreadsheet, with or without the header</label>
        <textarea id="tpl-text" class="input num" rows={6} value={text} spellcheck={false}
          onInput={(e) => check(e.currentTarget.value)} />
      </div>
      <p>
        <label class="btn-secondary" for="tpl-file">Choose CSV file</label>
        <input id="tpl-file" type="file" accept=".csv,.tsv,.txt,text/csv" onChange={onFile} style="position:absolute;left:-9999px;" />
      </p>
      <div aria-live="polite">
        {res === null && <p class="caption">Nothing checked yet. Paste rows or choose a file.</p>}
        {res && res.errors.length === 0 && <p>{res.lots.length} {res.lots.length === 1 ? 'lot' : 'lots'} read with no errors.</p>}
        {res && res.errors.length > 0 && (
          <div>
            <p class="pencil-note">{res.errors.length} {res.errors.length === 1 ? 'row needs' : 'rows need'} a fix. {res.lots.length} read correctly.</p>
            <ul>{res.errors.map((er) => <li key={er.line}>Line {er.line}: {er.message}</li>)}</ul>
          </div>
        )}
      </div>
    </div>
  );
}
