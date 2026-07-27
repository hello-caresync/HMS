'use client';

import { useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  AlertTriangle,
  CalendarClock,
  CreditCard,
  FileText,
  Footprints,
  MessageSquare,
  Moon,
  Pill,
  RefreshCw,
  ShieldAlert,
  Upload,
  Zap,
} from 'lucide-react';

import { PatientStatusBanner } from '@/components/patient/PatientStatusBanner';
import { patientToastCopy } from '@/lib/patient/status-copy';

type HealthSummary = {
  steps: number;
  stepsGoal: number;
  heartRateBpm: number;
  sleepHours: number;
  sleepQuality: string;
};

type UpcomingAppointment = {
  doctorName: string;
  specialization: string;
  date: string;
  slotTime: string;
  department: string;
  status: string;
};

type MedicineIntake = {
  id: string;
  name: string;
  dosage: string;
  schedule: 'both' | 'morning' | 'evening' | 'weekly';
  morning: boolean;
  evening: boolean;
};

type PendingBill = {
  id: string;
  transactionCode: string;
  description: string;
  amount: string;
  dueDate: string;
};

type LatestReport = {
  id: string;
  title: string;
  type: 'Laboratory' | 'Imaging';
  date: string;
  verified: boolean;
  verificationKey: string;
};

type HealthAlert = {
  id: string;
  message: string;
};

const TODAY_LABEL = 'Tuesday, 14 Jul 2026 · Nexora Patient Dashboard';

const HEALTH_SUMMARY: HealthSummary = {
  steps: 6842,
  stepsGoal: 10000,
  heartRateBpm: 72,
  sleepHours: 7.2,
  sleepQuality: 'Good recovery',
};

const UPCOMING_APPOINTMENT: UpcomingAppointment = {
  doctorName: 'Dr. Meera Nair',
  specialization: 'General Medicine',
  date: '15 Jul 2026',
  slotTime: '10:30 AM',
  department: 'OPD Block A · Cabin C-12',
  status: 'Confirmed',
};

const INITIAL_MEDICINES: MedicineIntake[] = [
  { id: 'med-1', name: 'Metformin 500 mg', dosage: '1 tablet · with breakfast', schedule: 'both', morning: true, evening: false },
  { id: 'med-2', name: 'Amlodipine 5 mg', dosage: '1 tablet · morning dose', schedule: 'morning', morning: false, evening: false },
  { id: 'med-3', name: 'Atorvastatin 10 mg', dosage: '1 tablet · bedtime', schedule: 'evening', morning: false, evening: false },
  { id: 'med-4', name: 'Vitamin D3 60K IU', dosage: '1 capsule · weekly Sunday', schedule: 'weekly', morning: false, evening: false },
];

const PENDING_BILLS: PendingBill[] = [
  {
    id: 'bill-1',
    transactionCode: 'NX-INV-2026-9012',
    description: 'Laboratory Panel · Lipid Profile',
    amount: '₹1,240',
    dueDate: '15 Jul 2026',
  },
  {
    id: 'bill-2',
    transactionCode: 'NX-INV-2026-9155',
    description: 'Teleconsult · Cardiology Follow-up',
    amount: '₹600',
    dueDate: '20 Jul 2026',
  },
];

const LATEST_REPORTS: LatestReport[] = [
  {
    id: 'rep-1',
    title: 'Complete Blood Count (CBC)',
    type: 'Laboratory',
    date: '08 Jul 2026',
    verified: true,
    verificationKey: 'NX-LAB-2026-44102',
  },
  {
    id: 'rep-2',
    title: 'Lipid Profile Panel',
    type: 'Laboratory',
    date: '08 Jul 2026',
    verified: true,
    verificationKey: 'NX-LAB-2026-44103',
  },
  {
    id: 'rep-3',
    title: 'Chest X-Ray · PA View',
    type: 'Imaging',
    date: '02 Jun 2026',
    verified: true,
    verificationKey: 'NX-RAD-2026-22801',
  },
];

const HEALTH_ALERTS: HealthAlert[] = [
  { id: 'alert-1', message: 'Flu shot due next week · schedule at OPD Block A' },
  { id: 'alert-2', message: 'Fast 12 hours before tomorrow\'s blood draw · water only after 8:00 PM' },
];

const QUICK_ACTIONS = [
  { label: 'Book Appointment', href: '/patient/appointments', icon: CalendarClock },
  { label: 'Message Doctor', href: '/patient/communication', icon: MessageSquare },
  { label: 'Refill Rx', href: '/patient/medications', icon: RefreshCw },
  { label: 'Upload Vitals', href: '/patient/health', icon: Upload },
] as const;

const CARD_CLASS = 'rounded-2xl border border-patient-lavender/30 bg-white p-6 shadow-sm';

const VITAL_CARD_CLASS =
  'flex items-center justify-between rounded-xl border border-patient-lavender/30 bg-white p-4 shadow-sm';

export default function PatientDashboardPage() {
  const [medicines, setMedicines] = useState<MedicineIntake[]>(INITIAL_MEDICINES);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const stepsProgress = useMemo(
    () => Math.round((HEALTH_SUMMARY.steps / HEALTH_SUMMARY.stepsGoal) * 100),
    [],
  );

  const showNotice = useCallback((message: string) => {
    setActionNotice(message);
    window.setTimeout(() => setActionNotice(null), 4000);
  }, []);

  const toggleIntake = useCallback(
    (medicineId: string, period: 'morning' | 'evening') => {
      setMedicines((prev) =>
        prev.map((med) =>
          med.id === medicineId ? { ...med, [period]: !med[period] } : med,
        ),
      );
    },
    [],
  );

  const isMedicineComplete = useCallback((med: MedicineIntake) => {
    if (med.schedule === 'both') return med.morning && med.evening;
    if (med.schedule === 'morning' || med.schedule === 'weekly') return med.morning;
    return med.evening;
  }, []);

  const handleEmergency = useCallback(() => {
    showNotice(patientToastCopy.emergencyDispatchNotified);
  }, [showNotice]);

  const handlePaySecurely = useCallback(() => {
    showNotice(patientToastCopy.paymentSessionActive);
  }, [showNotice]);

  const handleViewPdf = useCallback(
    (title: string) => {
      showNotice(patientToastCopy.labReportExport(title));
    },
    [showNotice],
  );

  return (
    <div className="w-full max-w-full space-y-6 font-sans text-patient-charcoal">
      {/* Interactive header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-patient-plum">Aishwarya D S</h1>
          <p className="mt-1 text-sm font-medium text-patient-lavender">{TODAY_LABEL}</p>
        </div>
        <button
          type="button"
          onClick={handleEmergency}
          className="flex cursor-pointer items-center gap-2 rounded-xl bg-[#e63946] px-5 py-2.5 font-extrabold text-white shadow-md transition-all animate-pulse hover:bg-[#d62839]"
        >
          <ShieldAlert className="h-5 w-5" aria-hidden />
          Emergency
        </button>
      </header>

      {/* Health alerts ribbon */}
      <div
        className="flex flex-col gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm font-medium text-amber-800 sm:flex-row sm:items-center"
        role="alert"
      >
        <AlertTriangle className="h-5 w-5 shrink-0" aria-hidden />
        <ul className="space-y-1">
          {HEALTH_ALERTS.map((alert) => (
            <li key={alert.id}>{alert.message}</li>
          ))}
        </ul>
      </div>

      {actionNotice ? <PatientStatusBanner message={actionNotice} variant="success" /> : null}

      {/* Top metric bar — health summary */}
      <section aria-label="Health summary" className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className={VITAL_CARD_CLASS}>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-patient-lavender">
              Daily Steps
            </p>
            <p className="mt-2 text-2xl font-black tabular-nums text-patient-plum">
              {HEALTH_SUMMARY.steps.toLocaleString('en-IN')}
            </p>
            <p className="mt-0.5 text-xs font-bold text-patient-plum">{stepsProgress}% of goal</p>
          </div>
          <div className="rounded-lg border border-patient-lavender/30 bg-patient-card p-2.5 text-patient-primary">
            <Footprints className="h-5 w-5" aria-hidden />
          </div>
        </div>

        <div className={VITAL_CARD_CLASS}>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-patient-lavender">
              Heart Rate
            </p>
            <p className="mt-2 text-2xl font-black tabular-nums text-patient-primary">
              {HEALTH_SUMMARY.heartRateBpm}
              <span className="text-sm font-medium text-patient-lavender"> BPM</span>
            </p>
            <p className="mt-0.5 text-xs font-bold text-patient-primary">Resting · normal range</p>
          </div>
          <div className="rounded-lg border border-patient-lavender/30 bg-patient-card p-2.5 text-patient-primary">
            <Activity className="h-5 w-5" aria-hidden />
          </div>
        </div>

        <div className={VITAL_CARD_CLASS}>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-patient-lavender">
              Sleep Index
            </p>
            <p className="mt-2 text-2xl font-black tabular-nums text-patient-plum">
              {HEALTH_SUMMARY.sleepHours}
              <span className="text-sm font-medium text-patient-lavender"> hrs</span>
            </p>
            <p className="mt-0.5 text-xs font-bold text-patient-lavender">{HEALTH_SUMMARY.sleepQuality}</p>
          </div>
          <div className="rounded-lg border border-patient-lavender/30 bg-patient-card p-2.5 text-patient-primary">
            <Moon className="h-5 w-5" aria-hidden />
          </div>
        </div>
      </section>

      {/* Main workspace grid */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,65fr)_minmax(0,35fr)]">
        {/* Left column — main operations (65%) */}
        <div className="space-y-6">
          {/* Upcoming appointment widget */}
          <section aria-label="Upcoming appointment" className={CARD_CLASS}>
            <div className="mb-4 flex items-center gap-2">
              <CalendarClock className="h-5 w-5 text-patient-primary" aria-hidden />
              <h2 className="text-lg font-black text-patient-plum">Upcoming Appointment</h2>
            </div>
            <div className="rounded-xl border border-patient-lavender/30 bg-gradient-to-r from-patient-card/60 to-transparent p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-lg font-black text-patient-charcoal">
                    {UPCOMING_APPOINTMENT.doctorName}
                  </p>
                  <p className="mt-1 text-sm font-bold text-patient-primary">
                    {UPCOMING_APPOINTMENT.specialization}
                  </p>
                  <p className="mt-2 text-xs font-medium text-patient-lavender">
                    {UPCOMING_APPOINTMENT.department}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-3 text-sm">
                    <span className="font-black text-patient-plum">{UPCOMING_APPOINTMENT.date}</span>
                    <span className="font-black text-patient-primary">{UPCOMING_APPOINTMENT.slotTime}</span>
                    <span className="inline-flex rounded-full border border-patient-lavender/30 bg-patient-card px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-patient-primary">
                      {UPCOMING_APPOINTMENT.status}
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col gap-2">
                  <Link
                    href="/patient/appointments"
                    className="rounded-lg border border-patient-lavender/30 bg-white px-4 py-2 text-center text-xs font-bold text-patient-primary transition-all hover:bg-patient-card"
                  >
                    View All Bookings
                  </Link>
                  <Link
                    href="/patient/communication"
                    className="rounded-lg bg-patient-primary px-4 py-2 text-center text-xs font-bold text-white transition-all hover:bg-patient-plum"
                  >
                    Message Doctor
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* Today's medicines tracker */}
          <section aria-label="Today's medicines" className={CARD_CLASS}>
            <div className="mb-4 flex items-center gap-2">
              <Pill className="h-5 w-5 text-patient-primary" aria-hidden />
              <h2 className="text-lg font-black text-patient-plum">Today&apos;s Medicines</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-patient-lavender/30 bg-patient-lavender/10/80">
                    <th className="px-3 py-2 text-left text-[10px] font-black uppercase tracking-wider text-patient-plum">
                      Medicine
                    </th>
                    <th className="px-3 py-2 text-center text-[10px] font-black uppercase tracking-wider text-patient-plum">
                      Morning
                    </th>
                    <th className="px-3 py-2 text-center text-[10px] font-black uppercase tracking-wider text-patient-plum">
                      Evening
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {medicines.map((med) => {
                    const complete = isMedicineComplete(med);
                    return (
                      <tr key={med.id} className="border-b border-patient-lavender/30">
                        <td className="px-3 py-3">
                          <p
                            className={`font-bold text-patient-charcoal ${complete ? 'line-through opacity-60' : ''}`}
                          >
                            {med.name}
                          </p>
                          <p
                            className={`mt-0.5 text-xs font-medium text-patient-lavender ${complete ? 'line-through opacity-60' : ''}`}
                          >
                            {med.dosage}
                          </p>
                        </td>
                        <td className="px-3 py-3 text-center">
                          {med.schedule === 'evening' ? (
                            <span className="text-xs text-slate-300">—</span>
                          ) : (
                            <input
                              type="checkbox"
                              checked={med.morning}
                              onChange={() => toggleIntake(med.id, 'morning')}
                              aria-label={`Mark ${med.name} morning dose taken`}
                              className="h-4 w-4 cursor-pointer rounded border-patient-lavender/30 accent-[#572E54] text-patient-primary focus:ring-2 focus:ring-[#572E54]/30 focus:ring-offset-0"
                            />
                          )}
                        </td>
                        <td className="px-3 py-3 text-center">
                          {med.schedule === 'morning' || med.schedule === 'weekly' ? (
                            <span className="text-xs text-slate-300">—</span>
                          ) : (
                            <input
                              type="checkbox"
                              checked={med.evening}
                              onChange={() => toggleIntake(med.id, 'evening')}
                              aria-label={`Mark ${med.name} evening dose taken`}
                              className="h-4 w-4 cursor-pointer rounded border-patient-lavender/30 accent-[#572E54] text-patient-primary focus:ring-2 focus:ring-[#572E54]/30 focus:ring-offset-0"
                            />
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* Latest reports module */}
          <section aria-label="Latest reports" className={CARD_CLASS}>
            <div className="mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-patient-primary" aria-hidden />
              <h2 className="text-lg font-black text-patient-plum">Latest Reports</h2>
            </div>
            <ul className="space-y-3">
              {LATEST_REPORTS.map((report) => (
                <li
                  key={report.id}
                  className="flex flex-col gap-3 rounded-xl border border-patient-lavender/30 bg-patient-lavender/10/50 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-black text-patient-charcoal">{report.title}</p>
                      {report.verified ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-patient-lavender/30 bg-patient-card px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-patient-primary">
                          <Zap className="h-3 w-3" aria-hidden />
                          Verified
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-xs font-bold text-patient-lavender">
                      {report.type} · {report.date}
                    </p>
                    <p className="mt-0.5 font-mono text-[10px] font-bold text-patient-primary">
                      {report.verificationKey}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleViewPdf(report.title)}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-patient-lavender/30 bg-white px-3 py-2 text-xs font-bold text-patient-primary transition-all hover:bg-patient-card"
                  >
                    <FileText className="h-3.5 w-3.5" aria-hidden />
                    View PDF
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Right column — quick utilities (35%) */}
        <aside className="space-y-6">
          {/* Quick actions hub */}
          <section aria-label="Quick actions" className={CARD_CLASS}>
            <div className="mb-4 flex items-center gap-2">
              <Zap className="h-5 w-5 text-patient-primary" aria-hidden />
              <h2 className="text-base font-black text-patient-plum">Quick Actions</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {QUICK_ACTIONS.map(({ label, href, icon: Icon }) => (
                <Link
                  key={label}
                  href={href}
                  className="flex flex-col items-start gap-2 rounded-xl border border-patient-lavender/30 bg-gradient-to-br from-white to-patient-lavender/10 p-4 transition-all hover:-translate-y-0.5 hover:border-patient-lavender/30"
                >
                  <div className="rounded-lg border border-patient-lavender/30 bg-patient-card p-2 text-patient-primary">
                    <Icon className="h-4 w-4" aria-hidden />
                  </div>
                  <span className="text-xs font-bold leading-snug text-patient-text">{label}</span>
                </Link>
              ))}
            </div>
          </section>

          {/* Pending bills ledger */}
          <section aria-label="Pending bills" className={CARD_CLASS}>
            <div className="mb-4 flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-patient-primary" aria-hidden />
              <h2 className="text-base font-black text-patient-plum">Pending Bills</h2>
            </div>
            <ul className="space-y-3">
              {PENDING_BILLS.map((bill) => (
                <li
                  key={bill.id}
                  className="rounded-xl border border-patient-lavender/30 bg-patient-card/50 p-3"
                >
                  <p className="font-mono text-[10px] font-black text-patient-primary">
                    {bill.transactionCode}
                  </p>
                  <p className="mt-1 text-sm font-bold text-patient-charcoal">{bill.description}</p>
                  <div className="mt-2 flex items-baseline justify-between">
                    <p className="text-lg font-black text-patient-plum">{bill.amount}</p>
                    <p className="text-[10px] font-bold text-patient-lavender">Due {bill.dueDate}</p>
                  </div>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={handlePaySecurely}
              className="mt-4 block w-full rounded-lg bg-patient-primary py-2 text-center text-sm font-bold text-white shadow-sm transition-colors hover:bg-patient-plum"
            >
              Pay Statement Securely
            </button>
          </section>
        </aside>
      </div>
    </div>
  );
}
