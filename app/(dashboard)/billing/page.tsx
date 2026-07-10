import BillingInvoiceWorkbench from '../../finance/billing/components/BillingInvoiceWorkbench';

export const metadata = {
  title: 'Billing · CuraSync ERP',
  description: 'Unified invoice builder and GST ledger',
};

export default function BillingPage() {
  return <BillingInvoiceWorkbench />;
}
