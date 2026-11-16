import type { Flag } from './types';

/** Every flag the engine raises has an id here, so the page and the tests share one list (SPEC §5a). */
export const FLAG_TEXT = {
  qef: 'The QEF election is not supported in this version. See a preparer for Part III.',
  'excess-allocation': 'This fund has an excess distribution (line 15e above zero). Allocating it to prior years is not supported in this version. See a preparer.',
  mixed: 'Some lots show a gain and some a loss. Gains are allocated; losses are listed and not netted. Check how your software or preparer treats them.',
  'pre-2003': 'A holding period starts before 2003. Interest rates and top rates before 2003 are not in this version.',
} as const;

export function flag(id: keyof typeof FLAG_TEXT): Flag {
  return { id, message: FLAG_TEXT[id] };
}
