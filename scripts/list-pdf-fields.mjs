// Lists every AcroForm field in the bundled IRS Form 8621 so the Builder can write
// src/lib/f8621-fields.json. Usage: npm run pdf:fields [path/to/f8621.pdf]
import fs from 'node:fs';
import { PDFDocument } from 'pdf-lib';

const file = process.argv[2] || 'public/forms/f8621.pdf';
if (!fs.existsSync(file)) {
  console.error(`No PDF at ${file}. The operator places the official f8621.pdf (Rev. December 2025) there (see PLAN.md).`);
  process.exit(1);
}
const doc = await PDFDocument.load(fs.readFileSync(file));
const form = doc.getForm();
for (const field of form.getFields()) {
  const widgets = field.acroField.getWidgets();
  const pages = widgets.map((w) => {
    const ref = w.P();
    const idx = doc.getPages().findIndex((p) => ref && p.ref === ref);
    const r = w.getRectangle();
    return `p${idx + 1}@${Math.round(r.x)},${Math.round(r.y)}`;
  });
  console.log(`${field.constructor.name}\t${field.getName()}\t${pages.join(' ')}`);
}
console.log(`${form.getFields().length} fields`);
