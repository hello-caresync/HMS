import CashierTerminalWorkbench from '../../finance/payments/components/CashierTerminalWorkbench';

export const metadata = {
  title: 'Payments · CuraSync ERP',
  description: 'Cashier terminal and split-payment collection',
};

export default function PaymentsPage() {
  return <CashierTerminalWorkbench />;
}
