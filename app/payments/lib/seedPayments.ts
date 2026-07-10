import type { CashierShift, LedgerTransaction } from '../types';
import { generateShiftId, generateTransactionId } from '../types';

export const DEFAULT_CASHIER_NAME = 'Priya Venkatesh';

export const INITIAL_CLOSED_SHIFT: CashierShift = {
  id: generateShiftId(),
  cashierName: DEFAULT_CASHIER_NAME,
  status: 'Closed',
};

export const SEED_TRANSACTIONS: LedgerTransaction[] = [
  {
    id: generateTransactionId(),
    uhid: 'NEX-2026-1001',
    patientName: 'A.S.',
    mode: 'UPI',
    amount: 1622,
    status: 'Settled',
    invoiceNumber: 'NEX-INV-2026-4421',
    itemsSummary: 'Consultation · CBC · Pharmacy consumables',
    timestamp: '2026-07-09T09:12:00Z',
  },
  {
    id: generateTransactionId(),
    uhid: 'NEX-2026-1002',
    patientName: 'R.K.',
    mode: 'Cash',
    amount: 2450,
    status: 'Settled',
    invoiceNumber: 'NEX-INV-2026-4398',
    itemsSummary: 'Consultation · X-Ray · Medicines',
    timestamp: '2026-07-09T09:28:00Z',
  },
  {
    id: generateTransactionId(),
    uhid: 'NEX-2026-1003',
    patientName: 'V.P.',
    mode: 'Card',
    amount: 8900,
    status: 'Settled',
    invoiceNumber: 'NEX-INV-2026-4387',
    itemsSummary: 'MRI · Lab panel · IPD deposit',
    timestamp: '2026-07-09T10:05:00Z',
  },
  {
    id: generateTransactionId(),
    uhid: 'NEX-2026-1004',
    patientName: 'M.I.',
    mode: 'Cash',
    amount: 800,
    status: 'Settled',
    invoiceNumber: 'NEX-INV-2026-4375',
    itemsSummary: 'Consultation fee',
    timestamp: '2026-07-09T10:22:00Z',
  },
  {
    id: generateTransactionId(),
    uhid: 'NEX-2026-1002',
    patientName: 'R.K.',
    mode: 'UPI',
    amount: 450,
    status: 'Refunded',
    invoiceNumber: 'NEX-INV-2026-4362',
    itemsSummary: 'CBC — duplicate charge reversal',
    timestamp: '2026-07-09T08:45:00Z',
    refundReason: 'Duplicate lab charge — doctor cancelled order',
    refundedAt: '2026-07-09T09:00:00Z',
  },
  {
    id: generateTransactionId(),
    uhid: 'NEX-2026-1001',
    patientName: 'A.S.',
    mode: 'UPI',
    amount: 3200,
    status: 'Settled',
    invoiceNumber: 'NEX-INV-2026-4355',
    itemsSummary: 'Cardiology consult · ECG · Pharmacy',
    timestamp: '2026-07-09T11:10:00Z',
  },
];

/** Active shift preset for demo — user can close and reopen via wizard */
export function createActiveShift(openingFloat: number): CashierShift {
  return {
    id: generateShiftId(),
    cashierName: DEFAULT_CASHIER_NAME,
    status: 'Active',
    loginTimestamp: new Date().toISOString(),
    openingFloat,
  };
}

export const SEED_ACTIVE_SHIFT: CashierShift = {
  ...createActiveShift(5000),
  loginTimestamp: '2026-07-09T08:00:00Z',
};
