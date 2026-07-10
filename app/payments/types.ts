/** Cashier counter shift lifecycle */
export type ShiftStatus = 'Active' | 'Closed';

/** Payment rails tracked in the daily collection ledger */
export type LedgerPaymentMode = 'Cash' | 'UPI' | 'Card';

/** Settlement state for ledger feed rows */
export type LedgerTransactionStatus = 'Settled' | 'Refunded';

export interface CashierShift {
  id: string;
  cashierName: string;
  status: ShiftStatus;
  loginTimestamp?: string;
  openingFloat?: number;
  closingExpectedCash?: number;
  closingActualCash?: number;
  closingDiscrepancy?: number;
  closedAt?: string;
}

export interface LedgerTransaction {
  id: string;
  uhid: string;
  patientName: string;
  mode: LedgerPaymentMode;
  amount: number;
  status: LedgerTransactionStatus;
  invoiceNumber: string;
  itemsSummary: string;
  timestamp: string;
  refundReason?: string;
  refundedAt?: string;
}

export interface CollectionCounters {
  cashCollected: number;
  upiSuccesses: number;
  cardPayments: number;
  totalRefunds: number;
}

export const STATUS_BADGE_STYLES: Record<LedgerTransactionStatus, string> = {
  Settled: 'bg-emerald-100 text-emerald-900 ring-emerald-200',
  Refunded: 'bg-rose-100 text-rose-900 ring-rose-200',
};

export const MODE_BADGE_STYLES: Record<LedgerPaymentMode, string> = {
  Cash: 'bg-amber-100 text-amber-900 ring-amber-200',
  UPI: 'bg-sky-100 text-sky-900 ring-sky-200',
  Card: 'bg-violet-100 text-violet-900 ring-violet-200',
};

export function generateTransactionId(): string {
  const seq = Math.floor(100000 + Math.random() * 900000);
  return `TXN-NEX-${seq}`;
}

export function generateShiftId(): string {
  return `shift-${Date.now().toString(36)}`;
}

export function computeExpectedCash(
  openingFloat: number,
  transactions: LedgerTransaction[],
): number {
  const cashNet = transactions.reduce((sum, tx) => {
    if (tx.mode !== 'Cash') return sum;
    return tx.status === 'Settled' ? sum + tx.amount : sum - tx.amount;
  }, 0);
  return Math.round((openingFloat + cashNet) * 100) / 100;
}

export function computeCounters(transactions: LedgerTransaction[]): CollectionCounters {
  return transactions.reduce(
    (acc, tx) => {
      if (tx.status === 'Refunded') {
        acc.totalRefunds += tx.amount;
        return acc;
      }
      if (tx.mode === 'Cash') acc.cashCollected += tx.amount;
      else if (tx.mode === 'UPI') acc.upiSuccesses += tx.amount;
      else if (tx.mode === 'Card') acc.cardPayments += tx.amount;
      return acc;
    },
    { cashCollected: 0, upiSuccesses: 0, cardPayments: 0, totalRefunds: 0 },
  );
}
