'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { EntityEmptyState } from '@/components/nexora-hospital/ui/EntityEmptyState';
import { Badge, Modal, ui } from '@/components/nexora-hospital/ui/primitives';
import { isValidIndianMobile, parsePatientAge } from '@/lib/hospital/indian-patient';
import { registerPatient } from '@/lib/nexora-hospital/services/hospital-db';
import { useHospitalStore } from '@/lib/nexora-hospital/store';
import type { HospitalPatient } from '@/lib/nexora-hospital/types';

export function PatientsWorkspace() {
  const patients = useHospitalStore((s) => s.patients);
  const [search, setSearch] = useState('');
  const [dept, setDept] = useState('all');
  const [selected, setSelected] = useState<HospitalPatient | null>(null);
  const [showRegister, setShowRegister] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    uhid: '',
    phone: '',
    age: '',
    gender: 'Male',
    bloodGroup: 'O+',
    department: 'General Medicine',
    medicalHistory: '',
    emergencyContact: '',
    insuranceProvider: '',
  });

  const departments = useMemo(
    () => ['all', ...new Set(patients.map((p) => p.department))],
    [patients],
  );

  const filtered = patients.filter((p) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q || p.fullName.toLowerCase().includes(q) || p.uhid.toLowerCase().includes(q);
    const matchDept = dept === 'all' || p.department === dept;
    return matchSearch && matchDept;
  });

  return (
    <div className={ui.pageInner}>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className={ui.pageTitle}>Patients</h1>
          <p className={ui.pageSubtitle}>Registry · profiles · visit history</p>
        </div>
        <button type="button" className={ui.btnPrimary} onClick={() => setShowRegister(true)}>
          Register New Patient
        </button>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <input
          className={`${ui.input} max-w-md`}
          placeholder="Search UHID or name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className={`${ui.select} max-w-xs`} value={dept} onChange={(e) => setDept(e.target.value)}>
          {departments.map((d) => (
            <option key={d} value={d}>{d === 'all' ? 'All departments' : d}</option>
          ))}
        </select>
      </div>

      <div className={`${ui.card} overflow-x-auto`}>
        {filtered.length === 0 ? (
          <EntityEmptyState preset="patients" onAction={() => setShowRegister(true)} />
        ) : (
          <table className={ui.table}>
            <thead>
              <tr>
                <th className={ui.th}>UHID</th>
                <th className={ui.th}>Name</th>
                <th className={ui.th}>Age</th>
                <th className={ui.th}>Department</th>
                <th className={ui.th}>Phone</th>
                <th className={ui.th}>Status</th>
                <th className={ui.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id}>
                  <td className={ui.td}>{p.uhid}</td>
                  <td className={ui.td}>{p.fullName}</td>
                  <td className={ui.td}>
                    {p.patient_age ?? p.age ? `${p.patient_age ?? p.age}y` : 'Age N/A'}
                  </td>
                  <td className={ui.td}>{p.department}</td>
                  <td className={ui.td}>{p.phone}</td>
                  <td className={ui.td}><Badge status={p.status} /></td>
                  <td className={ui.td}>
                    <button type="button" className={ui.link} onClick={() => setSelected(p)}>View Profile</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <button type="button" className={ui.overlay} onClick={() => setSelected(null)} aria-label="Close" />
          <aside className={ui.drawer}>
            <div className="p-6">
              <h2 className={ui.sectionTitle}>{selected.fullName}</h2>
              <p className="text-sm text-slate-600">
                {selected.uhid} · {selected.patient_age ?? selected.age ? `${selected.patient_age ?? selected.age}y` : 'Age N/A'} · {selected.gender}
              </p>
              <dl className="mt-6 space-y-3 text-base">
                <div><dt className="text-sm font-bold text-slate-500">Phone</dt><dd>{selected.phone}</dd></div>
                <div><dt className="text-sm font-bold text-slate-500">Blood Group</dt><dd>{selected.bloodGroup}</dd></div>
                <div><dt className="text-sm font-bold text-slate-500">Emergency Contact</dt><dd>{selected.emergencyContact ?? '—'}</dd></div>
                <div><dt className="text-sm font-bold text-slate-500">Insurance</dt><dd>{selected.insuranceProvider ?? '—'}</dd></div>
                <div><dt className="text-sm font-bold text-slate-500">Medical History</dt><dd>{selected.medicalHistory || 'None recorded'}</dd></div>
              </dl>
              <div className="mt-6 flex gap-2">
                <button type="button" className={ui.btnSecondary} onClick={() => toast.info('EMR opened')}>Open EMR</button>
                <button type="button" className={ui.btnPrimary} onClick={() => toast.info('Appointments view')}>View Appointments</button>
              </div>
            </div>
          </aside>
        </div>
      )}

      <Modal open={showRegister} title="Register New Patient" onClose={() => setShowRegister(false)}>
        <div className="grid gap-3 sm:grid-cols-2">
          {(['firstName', 'lastName', 'uhid', 'phone', 'medicalHistory', 'emergencyContact', 'insuranceProvider'] as const).map((field) => (
            <input
              key={field}
              className={ui.input}
              placeholder={field.replace(/([A-Z])/g, ' $1')}
              value={String(form[field] ?? '')}
              maxLength={field === 'phone' ? 10 : undefined}
              onChange={(e) =>
                setForm({
                  ...form,
                  [field]: field === 'phone' ? e.target.value.replace(/\D/g, '').slice(0, 10) : e.target.value,
                })
              }
            />
          ))}
          <input
            className={ui.input}
            type="number"
            min={1}
            max={120}
            placeholder="Age (1-120)"
            value={form.age}
            onChange={(e) => setForm({ ...form, age: e.target.value })}
          />
          <button
            type="button"
            disabled={busy || !form.firstName || !form.uhid}
            className={`${ui.btnPrimary} sm:col-span-2`}
            onClick={() => {
              void (async () => {
                const parsedAge = parsePatientAge(form.age);
                if (parsedAge == null) {
                  toast.error('Enter a valid age between 1 and 120');
                  return;
                }
                if (!isValidIndianMobile(form.phone)) {
                  toast.error('Enter a valid 10-digit Indian mobile number starting with 6-9');
                  return;
                }
                setBusy(true);
                await registerPatient({
                  ...form,
                  age: parsedAge,
                  patient_age: parsedAge,
                  status: 'Active',
                });
                setBusy(false);
                toast.success('Patient registered');
                setShowRegister(false);
              })();
            }}
          >
            {busy ? 'Saving…' : 'Save Patient'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
