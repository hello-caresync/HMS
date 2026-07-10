'use client';

import ActiveQueueTable from './ActiveQueueTable';
import TokenGenerationForm from './TokenGenerationForm';

export default function QueueControlCenter() {
  return (
    <div className="grid min-h-[520px] grid-cols-1 gap-4 lg:grid-cols-2">
      <TokenGenerationForm />
      <ActiveQueueTable />
    </div>
  );
}
