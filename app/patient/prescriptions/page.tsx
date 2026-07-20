'use client';

import { useCallback, useMemo, useState } from 'react';
import {
  Bell,
  BellOff,
  Clock,
  Download,
  Pill,
  ShieldCheck,
} from 'lucide-react';

type PrescriptionEntry = {
  id: string;
  medication: string;
  dosage: string;
  frequency: string;
  prescriber: string;
  nextDose: string;
  dosesPerDay: number;
  dosesTakenToday: number;
  totalDaysRemaining: number;
};

const CARD_CLASS =
  'rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm';

const ACTIVE_PRESCRIPTIONS: PrescriptionEntry[] = [
  {
    id: 'rx-1',
    medication: 'Metformin 500 mg',
    dosage: '1 tablet',
    frequency: 'Twice daily · with meals',
    prescriber: 'Dr. Meera Nair · General Medicine',
    nextDose: '8:00 PM',
    dosesPerDay: 2,
    dosesTakenToday: 1,
    totalDaysRemaining: 18,
  },
  {
    id: 'rx-2',
    medication: 'Amlodipine 5 mg',
    dosage: '1 tablet',
    frequency: 'Once daily · morning',
    prescriber: 'Dr. Rajesh Kumar · Cardiology',
    nextDose: '7:30 AM',
    dosesPerDay: 1,
    dosesTakenToday: 1,
    totalDaysRemaining: 24,
  },
  {
    id: 'rx-3',
    medication: 'Vitamin D3 60K IU',
    dosage: '1 capsule',
    frequency: 'Once weekly · Sunday',
    prescriber: 'Dr. Meera Nair · General Medicine',
    nextDose: 'Sun 9:00 AM',
    dosesPerDay: 1,
    dosesTakenToday: 0,
    totalDaysRemaining: 42,
  },
  {
    id: 'rx-4',
    medication: 'Atorvastatin 10 mg',
    dosage: '1 tablet',
    frequency: 'Once daily · bedtime',
    prescriber: 'Dr. Rajesh Kumar · Cardiology',
    nextDose: '10:00 PM',
    dosesPerDay: 1,
    dosesTakenToday: 0,
    totalDaysRemaining: 30,
  },
  {
    id: 'rx-5',
    medication: 'Ferrous Ascorbate 100 mg',
    dosage: '1 tablet',
    frequency: 'Once daily · after lunch',
    prescriber: 'Dr. Ananya Pillai · Hematology',
    nextDose: '1:30 PM',
    dosesPerDay: 1,
    dosesTakenToday: 1,
    totalDaysRemaining: 12,
  },
];

export default function PatientPrescriptionsPage() {
  const [reminderEnabled, setReminderEnabled] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(ACTIVE_PRESCRIPTIONS.map((rx) => [rx.id, true])),
  );
  const [downloadNotice, setDownloadNotice] = useState<string | null>(null);
  const [toggleAlert, setToggleAlert] = useState<string | null>(null);

  const activeReminderCount = useMemo(
    () => Object.values(reminderEnabled).filter(Boolean).length,
    [reminderEnabled],
  );

  const totalDosesToday = useMemo(
    () => ACTIVE_PRESCRIPTIONS.reduce((sum, rx) => sum + rx.dosesPerDay, 0),
    [],
  );

  const dosesTakenToday = useMemo(
    () => ACTIVE_PRESCRIPTIONS.reduce((sum, rx) => sum + rx.dosesTakenToday, 0),
    [],
  );

  const handleToggleReminder = useCallback((id: string, medication: string) => {
    setReminderEnabled((prev) => {
      const next = !prev[id];
      setToggleAlert(
        next
          ? `Reminder enabled for ${medication} · push alerts active`
          : `Reminder paused for ${medication} · no alerts until re-enabled`,
      );
      window.setTimeout(() => setToggleAlert(null), 3500);
      return { ...prev, [id]: next };
    });
  }, []);

  const handleDownloadPdf = useCallback((medication: string) => {
    setDownloadNotice(`${medication} · prescription PDF queued · sandbox export`);
    window.setTimeout(() => setDownloadNotice(null), 4000);
  }, []);

  return (
    <div className="min-h-full w-full space-y-6 font-sans text-slate-950">
      {/* Page header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#00758C]">Active Prescriptions</h1>
          <p className="mt-1 text-sm font-medium text-slate-600">
            Daily medicine ledger · dosage tracking · reminder controls · 14 Jul 2026
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-[#00A481]/20 bg-[#00A481]/10 px-4 py-2 text-xs font-bold uppercase tracking-wide text-[#00A481]">
          <ShieldCheck className="h-4 w-4" aria-hidden />
          RX_VAULT_SYNC_OK
        </div>
      </header>

      {downloadNotice ? (
        <p className="rounded-xl border border-[#008588]/20 bg-[#008588]/5 px-4 py-2 text-sm font-bold text-[#008588]">
          {downloadNotice}
        </p>
      ) : null}

      {toggleAlert ? (
        <p
          className={`rounded-xl border px-4 py-2 text-sm font-bold ${
            toggleAlert.includes('enabled')
              ? 'border-[#5EC283]/20 bg-[#5EC283]/10 text-[#5EC283]'
              : 'border-amber-500/20 bg-amber-500/10 text-amber-800'
          }`}
        >
          {toggleAlert}
        </p>
      ) : null}

      {/* Tracking counters */}
      <section
        aria-label="Prescription tracking summary"
        className="grid grid-cols-2 gap-3 lg:grid-cols-4"
      >
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Active Medicines
          </p>
          <p className="mt-2 text-3xl font-black tabular-nums text-[#00758C]">
            {ACTIVE_PRESCRIPTIONS.length}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Reminders Active
          </p>
          <p className="mt-2 text-3xl font-black tabular-nums text-[#008588]">
            {activeReminderCount}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Doses Today
          </p>
          <p className="mt-2 text-3xl font-black tabular-nums text-[#00A481]">
            {dosesTakenToday}
            <span className="text-lg font-medium text-slate-400"> / {totalDosesToday}</span>
          </p>
        </div>
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Adherence Rate
          </p>
          <p className="mt-2 text-3xl font-black tabular-nums text-[#5EC283]">
            {totalDosesToday > 0
              ? Math.round((dosesTakenToday / totalDosesToday) * 100)
              : 0}
            <span className="text-lg font-medium text-slate-400">%</span>
          </p>
        </div>
      </section>

      {/* Vertical medicine list */}
      <section aria-label="Current daily medicines" className={CARD_CLASS}>
        <div className="mb-5 flex items-center gap-2">
          <Pill className="h-5 w-5 text-[#008588]" aria-hidden />
          <h2 className="text-lg font-black text-[#00758C]">Current Daily Medicines</h2>
        </div>

        <ul className="space-y-4">
          {ACTIVE_PRESCRIPTIONS.map((rx) => {
            const reminderOn = reminderEnabled[rx.id] ?? true;
            const doseProgress = Math.round((rx.dosesTakenToday / rx.dosesPerDay) * 100);

            return (
              <li
                key={rx.id}
                className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-[0_4px_16px_-4px_rgba(0,117,140,0.03)]"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start gap-2">
                      <h3 className="text-base font-black text-slate-900">{rx.medication}</h3>
                      <span className="inline-flex rounded-full border border-[#00A481]/20 bg-[#00A481]/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#00A481]">
                        Active
                      </span>
                    </div>

                    <p className="mt-2 text-sm font-bold text-[#008588]">
                      {rx.dosage} · {rx.frequency}
                    </p>
                    <p className="mt-1 text-xs font-medium text-slate-600">{rx.prescriber}</p>

                    {/* Dose tracking counter */}
                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <div className="rounded-lg border border-slate-200/80 bg-slate-50/80 px-3 py-2">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          Doses Today
                        </p>
                        <p className="mt-1 text-lg font-black tabular-nums text-[#00758C]">
                          {rx.dosesTakenToday}
                          <span className="text-sm font-medium text-slate-400">
                            {' '}
                            / {rx.dosesPerDay}
                          </span>
                        </p>
                      </div>
                      <div className="rounded-lg border border-slate-200/80 bg-slate-50/80 px-3 py-2">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          Days Remaining
                        </p>
                        <p className="mt-1 text-lg font-black tabular-nums text-[#008588]">
                          {rx.totalDaysRemaining}
                        </p>
                      </div>
                      <div className="rounded-lg border border-slate-200/80 bg-slate-50/80 px-3 py-2">
                        <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          <Clock className="h-3 w-3" aria-hidden />
                          Next Dose
                        </p>
                        <p className="mt-1 text-sm font-black text-[#00A481]">{rx.nextDose}</p>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="mt-3">
                      <div className="mb-1 flex justify-between text-[10px] font-bold text-slate-500">
                        <span>Today&apos;s dose progress</span>
                        <span className="text-[#5EC283]">{doseProgress}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-[#5EC283] transition-all duration-500"
                          style={{ width: `${doseProgress}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Actions column */}
                  <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:flex-col lg:items-stretch">
                    <button
                      type="button"
                      onClick={() => handleToggleReminder(rx.id, rx.medication)}
                      aria-pressed={reminderOn}
                      className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-bold transition-all ${
                        reminderOn
                          ? 'border-[#5EC283]/20 bg-[#5EC283]/10 text-[#5EC283] hover:bg-[#5EC283]/20'
                          : 'border-slate-200/80 bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {reminderOn ? (
                        <Bell className="h-4 w-4" aria-hidden />
                      ) : (
                        <BellOff className="h-4 w-4" aria-hidden />
                      )}
                      {reminderOn ? 'Reminder Active' : 'Reminder Paused'}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDownloadPdf(rx.medication)}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#008588]/20 bg-[#008588]/5 px-4 py-2.5 text-xs font-bold text-[#008588] transition-all hover:bg-[#008588]/10"
                    >
                      <Download className="h-4 w-4" aria-hidden />
                      Download Prescription PDF
                    </button>
                  </div>
                </div>

                {reminderOn ? (
                  <p className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-[#5EC283]/20 bg-[#5EC283]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-[#5EC283]">
                    <Bell className="h-3 w-3" aria-hidden />
                    Medicine Reminder Active · alert at {rx.nextDose}
                  </p>
                ) : (
                  <p className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-800">
                    <BellOff className="h-3 w-3" aria-hidden />
                    Reminder paused · no alerts scheduled
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
