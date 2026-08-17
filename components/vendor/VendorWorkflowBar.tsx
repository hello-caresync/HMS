'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import { LifecycleStepper } from '@/components/vendor/shell/LifecycleStepper';
import { lifecycleRouteForStage, type LifecycleCounts, type LifecycleStage } from '@/lib/vendor/lifecycle';
import { useActiveHospitalCode, useVendorAppStore } from '@/lib/vendor/store/vendor-app-store';
import { loadLifecycleCounts, subscribeVendorPortal } from '@/lib/vendor/v0/portal-service';

/** Global procurement lifecycle bar — click a stage to filter all V0 workspaces. */
export function VendorWorkflowBar() {
  const router = useRouter();
  const pathname = usePathname();
  const hospitalCode = useActiveHospitalCode();
  const currentStage = useVendorAppStore((s) => s.workflowStage);
  const setWorkflowStage = useVendorAppStore((s) => s.setWorkflowStage);
  const [counts, setCounts] = useState<LifecycleCounts>({});

  const reloadCounts = useCallback(async () => {
    const result = await loadLifecycleCounts(hospitalCode);
    setCounts(result.counts);
  }, [hospitalCode]);

  useEffect(() => {
    void reloadCounts();
  }, [reloadCounts]);

  useEffect(
    () =>
      subscribeVendorPortal(
        () => void reloadCounts(),
        undefined,
        { hospitalCode },
      ),
    [hospitalCode, reloadCounts],
  );

  const handleSelectStage = (stage: LifecycleStage) => {
    setWorkflowStage(stage);

    const targetRoute = lifecycleRouteForStage(stage);
    if (targetRoute && pathname !== targetRoute && !pathname.startsWith(`${targetRoute}/`)) {
      router.push(targetRoute);
    }
  };

  return (
    <LifecycleStepper currentStage={currentStage} onSelectStage={handleSelectStage} counts={counts} />
  );
}

export default VendorWorkflowBar;
