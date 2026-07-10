'use client';

import MasterDataModuleNav from '../../master-data/components/MasterDataModuleNav';
import { PharmacyCatalogProvider } from '../../master-data/pharmacy/context/PharmacyCatalogProvider';

export default function MasterDataLayout({ children }: { children: React.ReactNode }) {
  return (
    <PharmacyCatalogProvider>
      <MasterDataModuleNav />
      {children}
    </PharmacyCatalogProvider>
  );
}
