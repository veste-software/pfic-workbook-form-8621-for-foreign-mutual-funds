import { blankFund, type FundInput } from './workbook';
import { defaultState, loadState, saveState, type WorkbookState } from './storage';

const isBlank = (f: FundInput) => f.rows.length === 0 && !f.name && !f.isin;

/** Put a fund into the workbook state. A fund that is still empty is replaced, otherwise the new one is added. Pure. */
export function withFund(state: WorkbookState | null, fund: FundInput): WorkbookState {
  const s = state ?? defaultState();
  const keep = s.funds.filter((f) => !isBlank(f));
  return { ...s, funds: [...keep, fund] };
}

/** A fund with only a currency set, for the "Start with INR" buttons. */
export const presetFund = (currency: string): FundInput => ({ ...blankFund(), currency });

type Store = Pick<Storage, 'getItem' | 'setItem'>;

/** Write the fund into the same localStorage key the workbook reads. Returns false when storage is blocked. */
export function openInWorkbook(fund: FundInput, store: Store): boolean {
  return saveState(withFund(loadState(store), fund), store);
}
