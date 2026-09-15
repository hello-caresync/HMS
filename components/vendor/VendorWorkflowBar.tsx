'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import { LifecycleStepper } from '@/components/vendor/shell/LifecycleStepper';
import { getVendorSession } from '@/lib/auth/ecosystem-sessions';
import { fetchVendorPortalLifecycleCounts } from '@/lib/vendor/billing';
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
    const session = getVendorSession();
    if (session?.id || session?.email || session?.company_name) {
      const result = await fetchVendorPortalLifecycleCounts({
        id: session.id,
        email: session.email ?? session.rep_email,
        company_name: session.company_name ?? session.vendor_name,
      });
      setCounts(result.counts);
      return;
    }

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
