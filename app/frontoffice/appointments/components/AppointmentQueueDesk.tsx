'use client';

import { useCallback, useState } from 'react';

import { SEED_QUEUE_TOKENS, type QueueTokenEntry } from '../../../lib/frontoffice';
import ActiveQueueMonitor from './ActiveQueueMonitor';
import TokenBookingForm from './TokenBookingForm';

export default function AppointmentQueueDesk() {
  const [queue, setQueue] = useState<QueueTokenEntry[]>(SEED_QUEUE_TOKENS);

  const handleIssueToken = useCallback((entry: QueueTokenEntry) => {
    setQueue((prev) => [entry, ...prev]);
  }, []);

  const handleReschedule = useCallback((id: string) => {
    setQueue((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: 'Rescheduled' as const } : t)),
    );
  }, []);

  const handleCancel = useCallback((id: string) => {
    setQueue((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: 'Cancelled' as const } : t)),
    );
  }, []);

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <header className="border-b-2 border-slate-200 pb-3">
        <h1 className="text-lg font-black text-slate-900">Live Appointment Queue Tracker</h1>
        <p className="text-xs text-slate-800">
          Phase 2 · Module 6 · Front Office traffic control desk
        </p>
      </header>

      <div className="grid gap-4 xl:grid-cols-[360px_1fr]">
        <TokenBookingForm queue={queue} onIssueToken={handleIssueToken} />
        <ActiveQueueMonitor
          queue={queue}
          onReschedule={handleReschedule}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}
