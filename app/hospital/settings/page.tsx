import { Suspense } from 'react';

import { SettingsWorkspace } from '@/components/nexora-hospital/workspaces/SettingsWorkspace';

function SettingsLoading() {
  return (
    <div className="p-8 text-center text-sm text-stone-500">Loading settings…</div>
  );
}

export default function HospitalSettingsPage() {
  return (
    <Suspense fallback={<SettingsLoading />}>
      <SettingsWorkspace />
    </Suspense>
  );
}
