// ISO date helpers. All arithmetic is on UTC midnights so DST never shifts a day.
const MS_DAY = 86_400_000;

export function parseISO(iso: string): number {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) throw new Error(`Not an ISO date: ${iso}`);
  const t = Date.UTC(+m[1], +m[2] - 1, +m[3]);
  const d = new Date(t);
  if (d.getUTCFullYear() !== +m[1] || d.getUTCMonth() !== +m[2] - 1 || d.getUTCDate() !== +m[3]) {
    throw new Error(`Not a real date: ${iso}`);
  }
  return t;
}

export function toISO(t: number): string {
  return new Date(t).toISOString().slice(0, 10);
}

export function addDays(iso: string, n: number): string {
  return toISO(parseISO(iso) + n * MS_DAY);
}

export function daysBetween(a: string, b: string): number {
  return Math.round((parseISO(b) - parseISO(a)) / MS_DAY);
}

export function isLeapYear(y: number): boolean {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}

export function daysInYear(y: number): number {
  return isLeapYear(y) ? 366 : 365;
}

export function yearOf(iso: string): number {
  return +iso.slice(0, 4);
}

/** Quarter label such as "2025-Q3" for a date. */
export function quarterOf(iso: string): string {
  return `${iso.slice(0, 4)}-Q${Math.floor((+iso.slice(5, 7) - 1) / 3) + 1}`;
}

/**
 * Days of the holding period per calendar year. The period runs from the day after
 * `startExclusive` through `endInclusive` (i8621: day after acquisition through disposition).
 */
export function daysByYear(startExclusive: string, endInclusive: string): Record<number, number> {
  const out: Record<number, number> = {};
  const first = parseISO(startExclusive) + MS_DAY;
  const last = parseISO(endInclusive);
  if (last < first) return out;
  for (let y = new Date(first).getUTCFullYear(); y <= new Date(last).getUTCFullYear(); y++) {
    const from = Math.max(first, Date.UTC(y, 0, 1));
    const to = Math.min(last, Date.UTC(y, 11, 31));
    if (to >= from) out[y] = Math.round((to - from) / MS_DAY) + 1;
  }
  return out;
}

/** Unextended due date of the return for tax year `year`: April 15 of the next year, next Monday if a weekend. */
export function dueDate(year: number): string {
  let t = Date.UTC(year + 1, 3, 15);
  const wd = new Date(t).getUTCDay();
  if (wd === 6) t += 2 * MS_DAY;
  if (wd === 0) t += MS_DAY;
  return toISO(t);
}
