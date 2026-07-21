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

import { PatientHeaderBadge, PatientStatusBanner } from '@/components/patient/PatientStatusBanner';
import { formatHeaderBadge, patientToastCopy } from '@/lib/patient/status-copy';

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
  'rounded-2xl border border-[#f0d8dc] bg-white p-6 shadow-sm';

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
          ? patientToastCopy.reminderEnabled(medication)
          : patientToastCopy.reminderPaused(medication),
      );
      window.setTimeout(() => setToggleAlert(null), 3500);
      return { ...prev, [id]: next };
    });
  }, []);

  const handleDownloadPdf = useCallback((medication: string) => {
    setDownloadNotice(patientToastCopy.prescriptionPdfReady);
    window.setTimeout(() => setDownloadNotice(null), 4000);
  }, []);

  return (
    <div className="min-h-full w-full space-y-6 font-sans text-slate-950">
      {/* Page header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#8c2b39]">Active Prescriptions</h1>
          <p className="mt-1 text-sm font-medium text-slate-600">
            Daily medicine ledger · dosage tracking · reminder controls · 14 Jul 2026
          </p>
        </div>
        <PatientHeaderBadge label={formatHeaderBadge('RX_VAULT_SYNC_OK')} tone="verified" icon={ShieldCheck} />
      </header>

      {downloadNotice ? <PatientStatusBanner message={downloadNotice} variant="success" /> : null}

      {toggleAlert ? (
        <PatientStatusBanner
          message={toggleAlert}
          variant={toggleAlert.includes('turned on') ? 'success' : 'warning'}
        />
      ) : null}

      {/* Tracking counters */}
      <section
        aria-label="Prescription tracking summary"
        className="grid grid-cols-2 gap-3 lg:grid-cols-4"
      >
        <div className="rounded-xl border border-[#f0d8dc] bg-white p-4 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Active Medicines
          </p>
          <p className="mt-2 text-3xl font-black tabular-nums text-[#8c2b39]">
            {ACTIVE_PRESCRIPTIONS.length}
          </p>
        </div>
        <div className="rounded-xl border border-[#f0d8dc] bg-white p-4 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Reminders Active
          </p>
          <p className="mt-2 text-3xl font-black tabular-nums text-[#f47c8c]">
            {activeReminderCount}
          </p>
        </div>
        <div className="rounded-xl border border-[#f0d8dc] bg-white p-4 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Doses Today
          </p>
          <p className="mt-2 text-3xl font-black tabular-nums text-[#f47c8c]">
            {dosesTakenToday}
            <span className="text-lg font-medium text-slate-400"> / {totalDosesToday}</span>
          </p>
        </div>
        <div className="rounded-xl border border-[#f0d8dc] bg-white p-4 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Adherence Rate
          </p>
          <p className="mt-2 text-3xl font-black tabular-nums text-[#8c2b39]">
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
          <Pill className="h-5 w-5 text-[#f47c8c]" aria-hidden />
          <h2 className="text-lg font-black text-[#8c2b39]">Current Daily Medicines</h2>
        </div>

        <ul className="space-y-4">
          {ACTIVE_PRESCRIPTIONS.map((rx) => {
            const reminderOn = reminderEnabled[rx.id] ?? true;
            const doseProgress = Math.round((rx.dosesTakenToday / rx.dosesPerDay) * 100);

            return (
              <li
                key={rx.id}
                className="rounded-xl border border-[#f0d8dc] bg-white p-5 shadow-[0_4px_16px_-4px_rgba(0,117,140,0.03)]"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start gap-2">
                      <h3 className="text-base font-black text-slate-900">{rx.medication}</h3>
                      <span className="inline-flex rounded-full border border-[#f0d8dc] bg-[#fde8eb] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#f47c8c]">
                        Active
                      </span>
                    </div>

                    <p className="mt-2 text-sm font-bold text-[#f47c8c]">
                      {rx.dosage} · {rx.frequency}
                    </p>
                    <p className="mt-1 text-xs font-medium text-slate-600">{rx.prescriber}</p>

                    {/* Dose tracking counter */}
                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <div className="rounded-lg border border-[#f0d8dc] bg-slate-50/80 px-3 py-2">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          Doses Today
                        </p>
                        <p className="mt-1 text-lg font-black tabular-nums text-[#8c2b39]">
                          {rx.dosesTakenToday}
                          <span className="text-sm font-medium text-slate-400">
                            {' '}
                            / {rx.dosesPerDay}
                          </span>
                        </p>
                      </div>
                      <div className="rounded-lg border border-[#f0d8dc] bg-slate-50/80 px-3 py-2">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          Days Remaining
                        </p>
                        <p className="mt-1 text-lg font-black tabular-nums text-[#f47c8c]">
                          {rx.totalDaysRemaining}
                        </p>
                      </div>
                      <div className="rounded-lg border border-[#f0d8dc] bg-slate-50/80 px-3 py-2">
                        <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          <Clock className="h-3 w-3" aria-hidden />
                          Next Dose
                        </p>
                        <p className="mt-1 text-sm font-black text-[#f47c8c]">{rx.nextDose}</p>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="mt-3">
                      <div className="mb-1 flex justify-between text-[10px] font-bold text-slate-500">
                        <span>Today&apos;s dose progress</span>
                        <span className="text-[#8c2b39]">{doseProgress}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-[#f47c8c] transition-all duration-500"
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
                          ? 'border-[#f0d8dc] bg-[#fde8eb] text-[#8c2b39] hover:bg-[#f47c8c]/20'
                          : 'border-[#f0d8dc] bg-slate-50 text-slate-600 hover:bg-slate-100'
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
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#f0d8dc] bg-[#fde8eb] px-4 py-2.5 text-xs font-bold text-[#f47c8c] transition-all hover:bg-[#e06373]/10"
                    >
                      <Download className="h-4 w-4" aria-hidden />
                      Download Prescription PDF
                    </button>
                  </div>
                </div>

                {reminderOn ? (
                  <p className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-[#f0d8dc] bg-[#fde8eb] px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-[#8c2b39]">
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
