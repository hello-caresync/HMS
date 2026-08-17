'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { HospitalOpsShell } from '@/components/hospital-operations/HospitalOpsShell';
import { hospitalOpsClasses } from '@/lib/hospital/design-tokens';
import { postHospitalApi, getOpsSupabase } from '@/lib/hospital/operations/client-api';
import {
  countActiveTriages,
  fetchEmergencyTriages,
  registerEmergencyTriage,
} from '@/lib/hospital/operations/emergency';
import type { EmergencyTriageRow, TriagePriority } from '@/lib/hospital/operations/types';
import { useHospitalOpsRealtime } from '@/lib/hospital/operations/realtime';

export default function EmergencyTriagePage() {
  const [triages, setTriages] = useState<EmergencyTriageRow[]>([]);
  const [form, setForm] = useState({
    patientName: '',
    chiefComplaint: '',
    priority: 'P2' as TriagePriority,
  });

  const load = useCallback(async () => {
    const data = await fetchEmergencyTriages(getOpsSupabase());
    setTriages(data);
  }, []);

  useHospitalOpsRealtime(load);
  useEffect(() => {
    void load();
  }, [load]);

  const counts = countActiveTriages(triages);

  const submitTriage = async () => {
    if (!form.patientName.trim() || !form.chiefComplaint.trim()) {
      toast.error('Patient name and chief complaint are required');
      return;
    }
    try {
      await postHospitalApi(
        '/api/emergency/triage',
        form,
        () => registerEmergencyTriage(getOpsSupabase(), form),
      );
      if (form.priority === 'P1') {
        toast.error('P1 CRITICAL — Doctor bypass alarm broadcast', { duration: 6000 });
      } else {
        toast.success('Triage registered');
      }
      setForm({ patientName: '', chiefComplaint: '', priority: 'P2' });
      void load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Triage failed');
    }
  };

  return (
    <HospitalOpsShell
      title="Emergency Triage & Doctor Bypass"
      subtitle="P1 triggers EMERGENCY_BYPASS_TRIGGERED system event to Doctor App"
      actions={
        <button type="button" className={hospitalOpsClasses.btnCritical} onClick={() => void submitTriage()}>
          Register Triage
        </button>
      }
    >
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'P1 Critical', value: counts.p1, tone: hospitalOpsClasses.badgeCritical },
          { label: 'P2 Urgent', value: counts.p2, tone: hospitalOpsClasses.badgeWarning },
          { label: 'P3 Non-Urgent', value: counts.p3, tone: hospitalOpsClasses.badgeDefault },
        ].map((c) => (
          <div key={c.label} className={`${hospitalOpsClasses.surface} p-4`}>
            <p className="text-[10px] font-black uppercase text-[#52796F]">{c.label}</p>
            <p className="text-2xl font-black">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className={`${hospitalOpsClasses.surface} p-4 space-y-3 lg:col-span-1`}>
          <h2 className="text-sm font-black">New Triage Intake</h2>
          <input
            className={hospitalOpsClasses.input}
            placeholder="Patient name"
            value={form.patientName}
            onChange={(e) => setForm((f) => ({ ...f, patientName: e.target.value }))}
          />
          <textarea
            className={`${hospitalOpsClasses.input} min-h-[80px]`}
            placeholder="Chief complaint"
            value={form.chiefComplaint}
            onChange={(e) => setForm((f) => ({ ...f, chiefComplaint: e.target.value }))}
          />
          <select
            className={hospitalOpsClasses.input}
            value={form.priority}
            onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value as TriagePriority }))}
          >
            <option value="P1">P1 — Critical (Doctor Bypass)</option>
            <option value="P2">P2 — Urgent</option>
            <option value="P3">P3 — Non-Urgent</option>
          </select>
        </div>

        <div className={`${hospitalOpsClasses.surface} p-4 lg:col-span-2`}>
          <h2 className="text-sm font-black mb-3">Active Triage Board</h2>
          <div className="space-y-2 max-h-[420px] overflow-y-auto">
            {triages.length === 0 ? (
              <p className="text-xs text-[#84A98C] font-semibold">No triage records yet</p>
            ) : (
              triages.map((row, index) => (
                <div
                  key={row.id || `triage-${index}`}
                  className={`rounded-lg border p-3 ${
                    row.priority === 'P1'
                      ? 'border-[#C94A29]/50 bg-[#C94A29]/5'
                      : 'border-[#CAD2C5] bg-white'
                  }`}
                >
                  <div className="flex justify-between gap-2">
                    <p className="text-sm font-black">{row.patient_name}</p>
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded ${
                        row.priority === 'P1'
                          ? hospitalOpsClasses.badgeCritical
                          : row.priority === 'P2'
                            ? hospitalOpsClasses.badgeWarning
                            : hospitalOpsClasses.badgeDefault
                      }`}
                    >
                      {row.priority}
                    </span>
                  </div>
                  <p className="text-xs text-[#52796F] mt-1">{row.chief_complaint}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </HospitalOpsShell>
  );
}
