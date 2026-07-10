'use client';

import FinancialAnalytics from './FinancialAnalytics';
import InvoiceCanvas from './InvoiceCanvas';
import PaymentTerminal from './PaymentTerminal';

type BillingWorkspaceProps = {
  view: 'terminal' | 'reports';
};

export default function BillingWorkspace({ view }: BillingWorkspaceProps) {
  if (view === 'reports') {
    return <FinancialAnalytics />;
  }

  return (
    <div className="grid gap-3 lg:grid-cols-[1fr_300px] xl:grid-cols-[1fr_320px]">
      <InvoiceCanvas />
      <PaymentTerminal />
    </div>
  );
}
