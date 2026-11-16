import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walk(p) : /\.(ts|tsx|astro|js|mjs)$/.test(p) ? [p] : [];
  });
}

const files = [...walk('src'), ...walk('functions')];
const ALLOWED_BROWSER = ['/api/checkout', '/api/license'];
const ALLOWED_SERVER = ['https://api.stripe.com/'];

describe('privacy: network calls', () => {
  it('has no XMLHttpRequest or sendBeacon anywhere', () => {
    for (const f of files) {
      const t = readFileSync(f, 'utf8');
      expect(t, f).not.toMatch(/XMLHttpRequest|sendBeacon|WebSocket|EventSource/);
    }
  });

  it('every fetch( goes to a same-origin api path or, in functions/, to Stripe', () => {
    for (const f of files) {
      const t = readFileSync(f, 'utf8');
      for (const m of t.matchAll(/fetch\(\s*([^,)]*)/g)) {
        const arg = m[1];
        const server = f.startsWith('functions');
        const allowed = server ? ALLOWED_SERVER : ALLOWED_BROWSER;
        expect(allowed.some((a) => arg.includes(a)), `${f}: fetch(${arg}`).toBe(true);
      }
    }
  });

  it('the checkout request body holds only taxYear', () => {
    const t = readFileSync('src/components/Workbook.tsx', 'utf8');
    const m = t.match(/\/api\/checkout'\)[^]*?body: JSON\.stringify\(([^)]*)\)/);
    expect(m?.[1].replace(/\s/g, '')).toBe('{taxYear}');
  });
});
