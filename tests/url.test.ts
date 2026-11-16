import { describe, expect, it } from 'vitest';
import { withBase } from '../src/lib/url';

describe('withBase', () => {
  it('leaves paths alone at the root base', () => {
    expect(withBase('/pricing', '/')).toBe('/pricing');
    expect(withBase('/', '/')).toBe('/');
  });

  it('prefixes the GitHub Pages sub-path', () => {
    expect(withBase('/pricing', '/preview')).toBe('/preview/pricing');
    expect(withBase('pricing', '/preview/')).toBe('/preview/pricing');
    expect(withBase('/', '/preview')).toBe('/preview/');
  });

  it('does not touch external links and anchors', () => {
    expect(withBase('https://www.irs.gov/pub/irs-pdf/i8621.pdf', '/preview')).toBe('https://www.irs.gov/pub/irs-pdf/i8621.pdf');
    expect(withBase('#results', '/preview')).toBe('#results');
  });
});
