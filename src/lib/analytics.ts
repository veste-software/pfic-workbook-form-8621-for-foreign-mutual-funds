// Cookie-free custom events. Does nothing unless the analytics script is on the page.
// Props hold counts only, never lot or fund data.
export type EventName = 'Fund added' | 'Lots pasted' | 'Results computed' | 'PDF downloaded' | 'Checkout started' | 'License activated';

export function track(name: EventName, props?: Record<string, number>): void {
  try {
    (globalThis as { plausible?: (n: string, o?: { props: Record<string, number> }) => void }).plausible?.(name, props ? { props } : undefined);
  } catch {
    /* analytics must never break the tool */
  }
}
