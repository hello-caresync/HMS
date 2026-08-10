'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { EntityEmptyState } from '@/components/nexora-hospital/ui/EntityEmptyState';
import { Badge, Modal, ui } from '@/components/nexora-hospital/ui/primitives';
import { formatDoctorOptionLabel, useHospitalDoctors } from '@/hooks/useHospitalDoctors';
import { approveAdmission, processDischarge } from '@/lib/nexora-hospital/services/hospital-db';
import { useHospitalStore } from '@/lib/nexora-hospital/store';

export function AdmissionsWorkspace() {
  const admissions = useHospitalStore((s) => s.admissions);
  const patients = useHospitalStore((s) => s.patients);
  const { doctors, loading: doctorsLoading } = useHospitalDoctors();
  const [showApprove, setShowApprove] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    patientId: '',
    doctorId: '',
    wardNumber: 'Ward 2B',
    bedNumber: 'B-08',
    diagnosis: '',
  });

  const inpatients = admissions.filter((a) => a.status === 'Admitted');
  const expectedDischarges = admissions.filter((a) => a.status === 'Discharged');

  const beds = Array.from({ length: 12 }, (_, i) => {
    const bed = `B-${String(i + 1).padStart(2, '0')}`;
    const occupied = inpatients.some((a) => a.bedNumber === bed);
    return { bed, occupied };
  });

  return (
    <div className={ui.pageInner}>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className={ui.pageTitle}>Admissions / IPD</h1>
          <p className={ui.pageSubtitle}>Bed occupancy · inpatient list · discharge workflow</p>
          {doctorsLoading ? (
            <p className="mt-2 flex items-center gap-2 text-base font-medium text-slate-800">
              <Loader2 className="h-4 w-4 animate-spin text-teal-700" />
              Loading attending physicians…
            </p>
          ) : (
            <p className="mt-2 text-sm font-bold uppercase tracking-wider text-teal-800">
              {doctors.length} doctors available from hospital_members
            </p>
          )}
        </div>
        <button type="button" className={ui.btnPrimary} onClick={() => setShowApprove(true)}>Approve Admission</button>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className={ui.card}>
          <p className="text-sm font-bold uppercase text-[#005F6B]">Inpatients</p>
          <p className="text-3xl font-bold text-[#0A2E36]">{inpatients.length}</p>
        </div>
        <div className={ui.card}>
          <p className="text-sm font-bold uppercase text-[#005F6B]">Occupancy</p>
          <p className="text-3xl font-bold text-[#0A2E36]">{Math.round((inpatients.length / 12) * 100)}%</p>
        </div>
        <div className={ui.card}>
          <p className="text-sm font-bold uppercase text-[#005F6B]">Discharges Today</p>
          <p className="text-3xl font-bold text-[#0A2E36]">{expectedDischarges.length}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className={ui.card}>
          <h2 className={ui.sectionTitle}>Bed Matrix</h2>
          <div className="mt-4 grid grid-cols-4 gap-2">
            {beds.map(({ bed, occupied }) => (
              <div
                key={bed}
                className={`rounded-xl border p-3 text-center text-sm font-bold ${occupied ? 'border-blue-300 bg-blue-50 text-blue-900' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}
              >
                {bed}
                <p className="text-xs font-medium">{occupied ? 'Occupied' : 'Available'}</p>
              </div>
            ))}
          </div>
        </section>

        <section className={`${ui.card} overflow-x-auto`}>
          <h2 className={ui.sectionTitle}>Inpatient List</h2>
          <table className={`${ui.table} mt-4`}>
            <thead>
              <tr>
                <th className={ui.th}>Patient</th>
                <th className={ui.th}>Ward / Bed</th>
                <th className={ui.th}>Doctor</th>
                <th className={ui.th}>Status</th>
                <th className={ui.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {admissions.length === 0 ? (
                <tr>
                  <td colSpan={5} className={ui.td}>
                    <EntityEmptyState preset="admissions" onAction={() => setShowApprove(true)} />
                  </td>
                </tr>
              ) : (
              admissions.map((a) => (
                <tr key={a.id}>
                  <td className={ui.td}>{a.patientName}</td>
                  <td className={ui.td}>{a.wardNumber} / {a.bedNumber}</td>
                  <td className={ui.td}>{a.attendingDoctorName}</td>
                  <td className={ui.td}><Badge status={a.status} /></td>
                  <td className={ui.td}>
                    {a.status === 'Admitted' && (
                      <button type="button" className={ui.link} onClick={() => void processDischarge(a.id).then(() => toast.success('Discharge processed'))}>
                        Discharge
                      </button>
                    )}
                  </td>
                </tr>
              ))
              )}
            </tbody>
          </table>
        </section>
      </div>

      <Modal open={showApprove} title="Approve Admission" onClose={() => setShowApprove(false)}>
        <div className="space-y-3">
          <select className={ui.select} value={form.patientId} onChange={(e) => setForm({ ...form, patientId: e.target.value })}>
            <option value="">Select patient</option>
            {patients.map((p) => <option key={p.id} value={p.id}>{p.fullName}</option>)}
          </select>
          <label className="block space-y-1.5">
            <span className="text-base font-medium text-slate-800">Attending Doctor</span>
            <select
              className={ui.select}
              value={form.doctorId}
              onChange={(e) => setForm({ ...form, doctorId: e.target.value })}
            >
              <option value="">Select doctor</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>{formatDoctorOptionLabel(d)}</option>
              ))}
            </select>
          </label>
          <input className={ui.input} placeholder="Ward" value={form.wardNumber} onChange={(e) => setForm({ ...form, wardNumber: e.target.value })} />
          <input className={ui.input} placeholder="Bed" value={form.bedNumber} onChange={(e) => setForm({ ...form, bedNumber: e.target.value })} />
          <input className={ui.input} placeholder="Diagnosis" value={form.diagnosis} onChange={(e) => setForm({ ...form, diagnosis: e.target.value })} />
          <button
            type="button"
            disabled={busy || !form.patientId || !form.doctorId}
            className={ui.btnPrimary}
            onClick={() => {
              const p = patients.find((x) => x.id === form.patientId);
              const d = doctors.find((x) => x.id === form.doctorId);
              if (!p || !d) return;
              void (async () => {
                setBusy(true);
                await approveAdmission({
                  patientId: p.id,
                  patientName: p.fullName,
                  attendingDoctorId: d.id,
                  attendingDoctorName: d.fullName,
                  wardNumber: form.wardNumber,
                  bedNumber: form.bedNumber,
                  diagnosis: form.diagnosis || 'Admission workup',
                  uhid: p.uhid,
                });
                setBusy(false);
                toast.success('Admission approved');
                setShowApprove(false);
              })();
            }}
          >
            {busy ? 'Saving…' : 'Approve'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
