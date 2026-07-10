import RadiologySessionWorkbench from '../../clinical/radiology/components/RadiologySessionWorkbench';

export const metadata = {
  title: 'Radiology · CuraSync ERP',
  description: 'Imaging session routing and technician notes',
};

export default function RadiologyPage() {
  return <RadiologySessionWorkbench />;
}
