'use client';

import { useState } from 'react';
import { Ambulance, Bed } from 'lucide-react';

import {
  TRAUMA_BEDS,
  TRIAGE_URGENCY_STYLES,
  type AmbulanceTelemetry,
  type EmergencyTriageEntry,
} from '../../../lib/patientcare';

type EmergencyTriageBoardProps = {
  queue: EmergencyTriageEntry[];
  ambulance: AmbulanceTelemetry[];
  onAssignBed: (triageId: string, bed: string) => void;
};

export default function EmergencyTriageBoard({
  queue,
  ambulance,
  onAssignBed,
}: EmergencyTriageBoardProps) {
  const [assigningId, setAssigningId] = useState<string | null>(null);

  const availableBeds = TRAUMA_BEDS.filter(
    (bed) => !queue.some((t) => t.traumaBedAssigned === bed),
  );

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-700 bg-slate-900 p-3">
        <p className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-800">
          <Ambulance className="h-3.5 w-3.5" />
          Ambulance Arrival Telemetry
        </p>
        <div className="grid gap-2 sm:grid-cols-3">
          {ambulance.map((unit) => (
            <div
              key={unit.id}
              className={`rounded-lg border px-3 py-2 ${
                unit.status === 'Arrived'
                  ? 'border-emerald-500 bg-emerald-950/40'
                  : 'border-slate-600 bg-slate-950'
              }`}
            >
              <p className="text-xs font-bold text-white">{unit.unitId}</p>
              <p className="mt-0.5 text-[10px] text-slate-800">
                {unit.status}
                {unit.status === 'En Route' && ` · ETA ${unit.etaMinutes} min`}
              </p>
              <p className="text-[10px] text-slate-800">{unit.patientCount} patient(s)</p>
            </div>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-700 bg-slate-900">
        <div className="border-b border-slate-700 px-4 py-2.5">
          <h2 className="text-sm font-black text-white">Live Triage Board</h2>
        </div>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-700 bg-slate-950">
              <th className="px-3 py-2 text-left text-[10px] font-black uppercase text-slate-950">ID</th>
              <th className="px-3 py-2 text-left text-[10px] font-black uppercase text-slate-950">Patient</th>
              <th className="px-3 py-2 text-left text-[10px] font-black uppercase text-slate-950">Complaint</th>
              <th className="px-3 py-2 text-left text-[10px] font-black uppercase text-slate-950">Urgency</th>
              <th className="px-3 py-2 text-right text-[10px] font-black uppercase text-slate-950">Action</th>
            </tr>
          </thead>
          <tbody>
            {queue.map((entry) => (
              <tr key={entry.triageId} className="border-b border-slate-800">
                <td className="px-3 py-2 font-mono text-xs font-bold text-white">{entry.triageId}</td>
                <td className="px-3 py-2 text-xs text-slate-900">{entry.patientIdentifier}</td>
                <td className="px-3 py-2 text-xs text-slate-950">{entry.chiefComplaint}</td>
                <td className="px-3 py-2">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ring-1 ${TRIAGE_URGENCY_STYLES[entry.urgency]}`}
                  >
                    {entry.urgency}
                  </span>
                </td>
                <td className="px-3 py-2 text-right">
                  {entry.traumaBedAssigned ? (
                    <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold text-emerald-400">
                      <Bed className="h-3 w-3" />
                      {entry.traumaBedAssigned}
                    </span>
                  ) : assigningId === entry.triageId ? (
                    <div className="flex flex-wrap justify-end gap-1">
                      {availableBeds.map((bed) => (
                        <button
                          key={bed}
                          type="button"
                          onClick={() => {
                            onAssignBed(entry.triageId, bed);
                            setAssigningId(null);
                          }}
                          className="rounded border border-emerald-600 bg-emerald-950 px-2 py-0.5 text-[9px] font-bold text-emerald-300 hover:bg-emerald-900"
                        >
                          {bed}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setAssigningId(entry.triageId)}
                      className="rounded border border-rose-500 bg-rose-950 px-2 py-1 text-[10px] font-bold text-rose-300 hover:bg-rose-900"
                    >
                      Assign Trauma Bed
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
