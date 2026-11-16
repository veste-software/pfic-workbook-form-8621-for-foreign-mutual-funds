/**
 * Join the configured base path (import.meta.env.BASE_URL, e.g. "/" locally or "/<repo>" on
 * GitHub Pages previews) with an internal path. Every internal link and asset path goes through
 * this helper so the site works under a sub-path.
 */
export function withBase(path: string, base: string = import.meta.env.BASE_URL ?? '/'): string {
  if (/^(?:[a-z]+:)?\/\//i.test(path) || path.startsWith('#') || path.startsWith('mailto:')) return path;
  const b = base.endsWith('/') ? base.slice(0, -1) : base;
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${b}${p}` || '/';
}
