'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { HospitalOpsShell } from '@/components/hospital-operations/HospitalOpsShell';
import { hospitalOpsClasses } from '@/lib/hospital/design-tokens';
import { postHospitalApi, getOpsSupabase } from '@/lib/hospital/operations/client-api';
import {
  checkInAppointment,
  fetchOpdAppointments,
  getOpdQueueCounts,
  normalizeStatus,
  transitionAppointmentStatus,
} from '@/lib/hospital/operations/opd';
import type { OpdAppointmentRow } from '@/lib/hospital/operations/types';
import { useHospitalOpsRealtime } from '@/lib/hospital/operations/realtime';

export default function OpdReceptionPage() {
  const [rows, setRows] = useState<OpdAppointmentRow[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchOpdAppointments(getOpsSupabase());
      setRows(data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load OPD queue');
    } finally {
      setLoading(false);
    }
  }, []);

  useHospitalOpsRealtime(load);

  useEffect(() => {
    void load();
  }, [load]);

  const counts = getOpdQueueCounts(rows);

  const filtered = rows.filter((row) => {
    const q = search.toLowerCase();
    return (
      String(row.patient_name ?? '').toLowerCase().includes(q) ||
      String(row.token_number ?? '').toLowerCase().includes(q) ||
      String(row.id ?? '').toLowerCase().includes(q)
    );
  });

  const handleCheckIn = async (appointmentId: string) => {
    try {
      await postHospitalApi(
        '/api/appointments/check-in',
        { appointmentId, status: 'checked_in' },
        () => checkInAppointment(getOpsSupabase(), { appointmentId }),
      );
      toast.success('Patient checked in — doctor queue notified');
      void load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Check-in failed');
    }
  };

  const handleAdvance = async (appointmentId: string, status: 'in_consultation' | 'completed') => {
    try {
      await postHospitalApi(
        '/api/appointments/check-in',
        { appointmentId, status },
        () => transitionAppointmentStatus(getOpsSupabase(), { appointmentId, status }),
      );
      toast.success(`Status updated → ${status.replace('_', ' ')}`);
      void load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Status update failed');
    }
  };

  return (
    <HospitalOpsShell
      title="OPD & Reception Workstation"
      subtitle="Real-time sync with Patient App bookings · booked → checked_in → in_consultation → completed"
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Booked', value: counts.booked },
          { label: 'Checked In', value: counts.checkedIn },
          { label: 'In Consultation', value: counts.inConsult },
          { label: 'Completed', value: counts.completed },
        ].map((card) => (
          <div key={card.label} className={`${hospitalOpsClasses.surface} p-4`}>
            <p className="text-[10px] font-black uppercase text-[#52796F]">{card.label}</p>
            <p className="text-2xl font-black text-[#263238]">{card.value}</p>
          </div>
        ))}
      </div>

      <div className={`${hospitalOpsClasses.surface} p-4 space-y-4`}>
        <input
          className={hospitalOpsClasses.input}
          placeholder="Search patient, token, or appointment ID…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#CAD2C5] text-[10px] font-black uppercase text-[#52796F]">
                <th className="py-2 pr-3">Patient</th>
                <th className="py-2 pr-3">Doctor</th>
                <th className="py-2 pr-3">Token</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-[#84A98C] font-semibold">
                    Loading live OPD queue…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-[#84A98C] font-semibold">
                    No appointments in queue
                  </td>
                </tr>
              ) : (
                filtered.map((row, index) => {
                  const status = normalizeStatus(row.status ?? row.queue_status);
                  const rowKey = row.id || row.token_number || `opd-${index}`;
                  return (
                    <tr key={rowKey} className="border-b border-[#CAD2C5]/60">
                      <td className="py-2.5 pr-3 font-bold">{row.patient_name ?? 'Patient'}</td>
                      <td className="py-2.5 pr-3">{row.doctor_name ?? '—'}</td>
                      <td className="py-2.5 pr-3 font-mono">{row.token_number ?? '—'}</td>
                      <td className="py-2.5 pr-3">
                        <span className={`rounded px-2 py-0.5 text-[10px] font-black ${hospitalOpsClasses.badgeDefault}`}>
                          {status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-2.5 text-right space-x-1">
                        {status === 'booked' ? (
                          <button type="button" className={hospitalOpsClasses.btnPrimary} onClick={() => void handleCheckIn(row.id)}>
                            Check In
                          </button>
                        ) : null}
                        {status === 'checked_in' ? (
                          <button
                            type="button"
                            className={hospitalOpsClasses.btnSecondary}
                            onClick={() => void handleAdvance(row.id, 'in_consultation')}
                          >
                            Start Consult
                          </button>
                        ) : null}
                        {status === 'in_consultation' ? (
                          <button
                            type="button"
                            className={hospitalOpsClasses.btnPrimary}
                            onClick={() => void handleAdvance(row.id, 'completed')}
                          >
                            Complete
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </HospitalOpsShell>
  );
}
