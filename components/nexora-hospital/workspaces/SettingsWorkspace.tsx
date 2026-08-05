'use client';

import { useState } from 'react';
import { toast } from 'sonner';

import { ui } from '@/components/nexora-hospital/ui/primitives';
import { useHospitalStore } from '@/lib/nexora-hospital/store';

export function SettingsWorkspace() {
  const settings = useHospitalStore((s) => s.settings);
  const staff = useHospitalStore((s) => s.staff);
  const updateSettings = useHospitalStore((s) => s.updateSettings);
  const [draft, setDraft] = useState(settings);
  const [tab, setTab] = useState<'profile' | 'departments' | 'doctors' | 'hours' | 'rbac'>('profile');
  const [busy, setBusy] = useState(false);

  const tabs = [
    { id: 'profile' as const, label: 'Hospital Profile' },
    { id: 'departments' as const, label: 'Departments' },
    { id: 'doctors' as const, label: 'Doctor Roster' },
    { id: 'hours' as const, label: 'Working Hours' },
    { id: 'rbac' as const, label: 'RBAC' },
  ];

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    updateSettings(draft);
    setBusy(false);
    toast.success('Hospital Settings Saved Successfully!');
  };

  return (
    <div className={ui.pageInner}>
      <div className="mb-6">
        <h1 className={ui.pageTitle}>Settings</h1>
        <p className={ui.pageSubtitle}>Hospital profile · departments · doctor fees · RBAC</p>
      </div>

      <nav className="mb-6 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            className={tab === t.id ? ui.tabActive : ui.tabInactive}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <form onSubmit={handleSave}>
        {tab === 'profile' && (
          <section className={`${ui.card} max-w-2xl space-y-4`}>
            {(['hospitalName', 'address', 'phone', 'email'] as const).map((field) => (
              <label key={field} className="block">
                <span className={ui.label}>
                  {field === 'hospitalName'
                    ? 'Hospital Name'
                    : field.charAt(0).toUpperCase() + field.slice(1)}
                </span>
                <input
                  className={`${ui.input} mt-1`}
                  value={draft[field]}
                  onChange={(e) => setDraft({ ...draft, [field]: e.target.value })}
                />
              </label>
            ))}
          </section>
        )}

        {tab === 'departments' && (
          <section className={ui.card}>
            <ul className="space-y-2">
              {draft.departments.map((d, i) => (
                <li key={`${d}-${i}`} className="flex items-center gap-2">
                  <input
                    className={ui.input}
                    value={d}
                    onChange={(e) => {
                      const deps = [...draft.departments];
                      deps[i] = e.target.value;
                      setDraft({ ...draft, departments: deps });
                    }}
                  />
                </li>
              ))}
            </ul>
            <button
              type="button"
              className={`${ui.btnSecondary} mt-3`}
              onClick={() => setDraft({ ...draft, departments: [...draft.departments, 'New Department'] })}
            >
              Add Department
            </button>
          </section>
        )}

        {tab === 'doctors' && (
          <section className={`${ui.card} overflow-x-auto`}>
            <table className={ui.table}>
              <thead>
                <tr>
                  <th className={ui.th}>Doctor</th>
                  <th className={ui.th}>Department</th>
                  <th className={ui.th}>Consultation Fee</th>
                  <th className={ui.th}>Email</th>
                </tr>
              </thead>
              <tbody>
                {staff.map((d) => (
                  <tr key={d.id}>
                    <td className={ui.td}>{d.fullName}</td>
                    <td className={ui.td}>{d.department}</td>
                    <td className={ui.td}>₹{d.consultationFee ?? 0}</td>
                    <td className={ui.td}>{d.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {tab === 'hours' && (
          <section className={`${ui.card} max-w-md space-y-4`}>
            <label className="block">
              <span className={ui.label}>Start Time</span>
              <input
                type="time"
                className={`${ui.input} mt-1`}
                value={draft.workingHoursStart}
                onChange={(e) => setDraft({ ...draft, workingHoursStart: e.target.value })}
              />
            </label>
            <label className="block">
              <span className={ui.label}>End Time</span>
              <input
                type="time"
                className={`${ui.input} mt-1`}
                value={draft.workingHoursEnd}
                onChange={(e) => setDraft({ ...draft, workingHoursEnd: e.target.value })}
              />
            </label>
          </section>
        )}

        {tab === 'rbac' && (
          <section className={ui.card}>
            <label className="flex items-center gap-3 text-base font-medium text-[#0A2E36]">
              <input
                type="checkbox"
                checked={draft.rbacEnabled}
                onChange={(e) => setDraft({ ...draft, rbacEnabled: e.target.checked })}
                className="h-5 w-5 accent-[#007B8A]"
              />
              Enable role-based access control (Admin · Reception · Billing · Clinical)
            </label>
            <p className="mt-3 text-sm text-[#005F6B]">RBAC policies sync to Supabase staff roles on save.</p>
          </section>
        )}

        <button
          type="submit"
          disabled={busy}
          className="mt-6 rounded-xl bg-[#007B8A] px-6 py-2.5 font-bold text-white shadow-md transition hover:bg-[#004D56] disabled:opacity-50"
        >
          {busy ? 'Saving…' : 'Save Settings'}
        </button>
      </form>
    </div>
  );
}
