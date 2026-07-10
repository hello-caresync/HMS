'use client';

import { useCallback, useState } from 'react';
import { Activity, AlertOctagon } from 'lucide-react';

import {
  SEED_AMBULANCE_TELEMETRY,
  SEED_CRITICAL_ALERTS,
  SEED_TRIAGE_QUEUE,
  generateTriageId,
  type EmergencyTriageEntry,
  type TriageUrgency,
} from '../../../lib/patientcare';
import EmergencyTriageBoard from './EmergencyTriageBoard';
import TriageRegistrationForm from './TriageRegistrationForm';

export default function EmergencyTraumaPanel() {
  const [queue, setQueue] = useState<EmergencyTriageEntry[]>(SEED_TRIAGE_QUEUE);
  const [alerts] = useState(SEED_CRITICAL_ALERTS);
  const [ambulance] = useState(SEED_AMBULANCE_TELEMETRY);

  const handleRegister = useCallback(
    (draft: { patientIdentifier: string; chiefComplaint: string; urgency: TriageUrgency }) => {
      const entry: EmergencyTriageEntry = {
        triageId: generateTriageId(queue),
        patientIdentifier: draft.patientIdentifier,
        chiefComplaint: draft.chiefComplaint,
        urgency: draft.urgency,
        registeredAt: new Date().toISOString(),
        traumaBedAssigned: null,
      };
      setQueue((prev) => [entry, ...prev]);
    },
    [queue],
  );

  const handleAssignBed = useCallback((triageId: string, bed: string) => {
    setQueue((prev) =>
      prev.map((t) => (t.triageId === triageId ? { ...t, traumaBedAssigned: bed } : t)),
    );
  }, []);

  return (
    <div className="min-h-full space-y-4 bg-slate-950 p-4 sm:p-6">
      <header className="border-b border-slate-700 pb-3">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-rose-500" />
          <div>
            <h1 className="text-lg font-black text-white">Emergency Trauma Triage Monitor</h1>
            <p className="text-xs text-slate-800">
              Phase 4 · Module 12 · Live casualty intake wall
            </p>
          </div>
        </div>
      </header>

      {alerts.map((alert) => (
        <div
          key={alert.id}
          className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 ${
            alert.severity === 'critical'
              ? 'border-rose-500 bg-rose-950/80 text-rose-100'
              : 'border-amber-500 bg-amber-950/60 text-amber-100'
          }`}
        >
          <AlertOctagon className="h-4 w-4 shrink-0 animate-pulse" />
          <p className="text-xs font-bold uppercase tracking-wide">{alert.message}</p>
        </div>
      ))}

      <div className="grid gap-4 xl:grid-cols-[320px_1fr]">
        <TriageRegistrationForm onRegister={handleRegister} />
        <EmergencyTriageBoard
          queue={queue}
          ambulance={ambulance}
          onAssignBed={handleAssignBed}
        />
      </div>
    </div>
  );
}
