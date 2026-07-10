'use client';

import { useSettings } from '../context/SettingsProvider';

export default function HospitalProfilePanel() {
  const { hospitalProfile, updateHospitalProfile } = useSettings();

  const fields: { key: keyof typeof hospitalProfile; label: string }[] = [
    { key: 'name', label: 'Display Name' },
    { key: 'legalName', label: 'Legal Entity Name' },
    { key: 'registrationNo', label: 'Registration No.' },
    { key: 'address', label: 'Registered Address' },
    { key: 'phone', label: 'Primary Phone' },
    { key: 'email', label: 'Admin Email' },
    { key: 'timezone', label: 'Timezone' },
  ];

  return (
    <div className="rounded border border-slate-200 bg-white shadow-sm">
      <div className="border-b-2 border-slate-200 px-3 py-2">
        <p className="text-[9px] font-bold uppercase tracking-wider text-slate-800">
          Organization
        </p>
        <p className="text-[11px] font-bold text-slate-900">Hospital Profile</p>
      </div>
      <div className="grid gap-3 p-3 sm:grid-cols-2">
        {fields.map(({ key, label }) => (
          <div key={key} className={key === 'address' ? 'sm:col-span-2' : ''}>
            <label className="text-[9px] font-bold uppercase text-slate-800">{label}</label>
            <input
              value={hospitalProfile[key]}
              onChange={(e) => updateHospitalProfile({ [key]: e.target.value })}
              className="mt-0.5 w-full rounded border border-slate-300 px-2.5 py-1.5 text-[11px] text-slate-800 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-300"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
