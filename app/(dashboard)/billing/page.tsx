'use client';

import BillingInvoiceWorkbench from '../../finance/billing/components/BillingInvoiceWorkbench';
import { HospitalOpsShell } from '@/components/hospital-operations/HospitalOpsShell';

export default function BillingPage() {
  return (
    <HospitalOpsShell
      title="Billing & Cashier Desk"
      subtitle="Consolidated invoicing · GST ledger · patient checkout"
    >
      <BillingInvoiceWorkbench />
    </HospitalOpsShell>
  );
}
