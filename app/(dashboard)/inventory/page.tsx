import InventoryMatrixWorkbench from '../../supplychain/inventory/components/InventoryMatrixWorkbench';

export const metadata = {
  title: 'Inventory · CuraSync ERP',
  description: 'Asset inventory matrix and expiry watch',
};

export default function InventoryPage() {
  return <InventoryMatrixWorkbench />;
}
