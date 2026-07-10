import ProcurementPipelineWorkbench from '../../supplychain/procurement/components/ProcurementPipelineWorkbench';

export const metadata = {
  title: 'Procurement · CuraSync ERP',
  description: 'Purchase order pipeline and goods receipt validation',
};

export default function ProcurementPage() {
  return <ProcurementPipelineWorkbench />;
}
