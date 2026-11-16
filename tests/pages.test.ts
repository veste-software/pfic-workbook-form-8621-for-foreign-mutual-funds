import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';

const dir = new URL('../src/pages/', import.meta.url);
const files = readdirSync(dir).filter((f) => f.endsWith('.astro'));
const grab = (src: string, prop: string) => new RegExp(`${prop}="([^"]+)"`).exec(src)?.[1];

describe('page metadata', () => {
  const pages = files.map((f) => {
    const src = readFileSync(new URL(f, dir), 'utf8');
    return { f, title: grab(src, 'title'), description: grab(src, 'description'), src };
  });

  it('gives every page a title and a description', () => {
    for (const p of pages) {
      expect(p.title, `${p.f} title`).toBeTruthy();
      expect(p.description, `${p.f} description`).toBeTruthy();
      expect(p.description!.length, `${p.f} description length`).toBeLessThanOrEqual(200);
    }
  });

  it('keeps titles and descriptions unique', () => {
    const t = pages.map((p) => p.title);
    const d = pages.map((p) => p.description);
    expect(new Set(t).size).toBe(t.length);
    expect(new Set(d).size).toBe(d.length);
  });

  it('never uses banned claims', () => {
    for (const p of pages) expect(p.src, p.f).not.toMatch(/IRS-approved|CPA-reviewed|guaranteed/i);
  });
});
