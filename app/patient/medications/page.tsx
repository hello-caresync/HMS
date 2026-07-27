'use client';

import { useCallback, useMemo, useState } from 'react';
import {
  Bell,
  BellOff,
  ChevronDown,
  ChevronUp,
  Download,
  History,
  Pill,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';

import { PatientHeaderBadge, PatientStatusBanner } from '@/components/patient/PatientStatusBanner';
import { formatHeaderBadge, patientToastCopy } from '@/lib/patient/status-copy';

type RefillStatus = 'Refill Eligible' | 'Request Sent' | 'Processing';

type DosePeriod = 'morning' | 'afternoon' | 'night';

type ReminderSchedule = Record<DosePeriod, boolean>;

type ActivePrescription = {
  id: string;
  medication: string;
  dosage: string;
  frequency: string;
  prescriber: string;
  pillsRemaining: number;
  totalSupply: number;
  sideEffects: string;
  contraindications: string;
  schedule: DosePeriod[];
};

type PreviousPrescription = {
  id: string;
  medication: string;
  dosage: string;
  duration: string;
  endDate: string;
  prescriber: string;
};

const PANEL_CLASS = 'rounded-2xl border border-patient-lavender/30 bg-white p-6 shadow-sm';

const DRUG_CARD_CLASS =
  'mb-4 rounded-xl border border-patient-lavender/30 bg-white p-5 shadow-sm transition-all hover:border-patient-lavender/30';

const COMPLETED_TAG =
  'bg-patient-card text-patient-primary border border-patient-lavender/30 font-bold px-2 py-0.5 rounded text-[10px] tracking-wide';

const ACTIVE_PRESCRIPTIONS: ActivePrescription[] = [
  {
    id: 'rx-1',
    medication: 'Metformin',
    dosage: '500 mg',
    frequency: 'Twice daily after food',
    prescriber: 'Dr. Meera Nair · General Medicine',
    pillsRemaining: 36,
    totalSupply: 60,
    sideEffects: 'GI upset · nausea · rare lactic acidosis',
    contraindications: 'Severe renal impairment · metabolic acidosis',
    schedule: ['morning', 'night'],
  },
  {
    id: 'rx-2',
    medication: 'Amlodipine',
    dosage: '5 mg',
    frequency: 'Once daily after food',
    prescriber: 'Dr. Rajesh Kumar · Cardiology',
    pillsRemaining: 24,
    totalSupply: 30,
    sideEffects: 'Peripheral edema · flushing · dizziness',
    contraindications: 'Cardiogenic shock · severe aortic stenosis',
    schedule: ['morning'],
  },
  {
    id: 'rx-3',
    medication: 'Atorvastatin',
    dosage: '10 mg',
    frequency: 'Once daily at bedtime',
    prescriber: 'Dr. Rajesh Kumar · Cardiology',
    pillsRemaining: 18,
    totalSupply: 30,
    sideEffects: 'Myalgia · elevated liver enzymes',
    contraindications: 'Active liver disease · pregnancy',
    schedule: ['night'],
  },
  {
    id: 'rx-4',
    medication: 'Ferrous Ascorbate',
    dosage: '100 mg',
    frequency: 'Once daily after lunch',
    prescriber: 'Dr. Ananya Pillai · Hematology',
    pillsRemaining: 12,
    totalSupply: 30,
    sideEffects: 'Constipation · dark stools · GI discomfort',
    contraindications: 'Hemochromatosis · iron overload states',
    schedule: ['afternoon'],
  },
];

const PREVIOUS_PRESCRIPTIONS: PreviousPrescription[] = [
  {
    id: 'prev-1',
    medication: 'Amoxicillin',
    dosage: '500 mg',
    duration: '7 days · TID',
    endDate: '28 Jun 2026',
    prescriber: 'Dr. Meera Nair',
  },
  {
    id: 'prev-2',
    medication: 'Pantoprazole',
    dosage: '40 mg',
    duration: '14 days · OD',
    endDate: '15 May 2026',
    prescriber: 'Dr. Meera Nair',
  },
  {
    id: 'prev-3',
    medication: 'Cetirizine',
    dosage: '10 mg',
    duration: '5 days · OD',
    endDate: '02 Apr 2026',
    prescriber: 'Dr. Ananya Pillai',
  },
  {
    id: 'prev-4',
    medication: 'Ibuprofen',
    dosage: '400 mg',
    duration: '3 days · SOS',
    endDate: '18 Mar 2026',
    prescriber: 'Dr. Vikram S.',
  },
];

function buildInitialReminders(): Record<string, ReminderSchedule> {
  return Object.fromEntries(
    ACTIVE_PRESCRIPTIONS.map((rx) => [
      rx.id,
      {
        morning: rx.schedule.includes('morning'),
        afternoon: rx.schedule.includes('afternoon'),
        night: rx.schedule.includes('night'),
      },
    ]),
  );
}

function buildInitialRefillStates(): Record<string, RefillStatus> {
  return Object.fromEntries(
    ACTIVE_PRESCRIPTIONS.map((rx) => [
      rx.id,
      rx.pillsRemaining <= 15 ? 'Refill Eligible' : ('Refill Eligible' as RefillStatus),
    ]),
  );
}

export default function PatientMedicationsPage() {
  const [reminders, setReminders] = useState<Record<string, ReminderSchedule>>(buildInitialReminders);
  const [refillStates, setRefillStates] = useState<Record<string, RefillStatus>>(buildInitialRefillStates);
  const [expandedInfo, setExpandedInfo] = useState<Record<string, boolean>>({});
  const [selectedRefillId, setSelectedRefillId] = useState<string>(ACTIVE_PRESCRIPTIONS[0]?.id ?? '');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const activeReminderCount = useMemo(() => {
    return Object.values(reminders).reduce((count, schedule) => {
      return count + (schedule.morning ? 1 : 0) + (schedule.afternoon ? 1 : 0) + (schedule.night ? 1 : 0);
    }, 0);
  }, [reminders]);

  const selectedRefillRx = useMemo(
    () => ACTIVE_PRESCRIPTIONS.find((rx) => rx.id === selectedRefillId) ?? ACTIVE_PRESCRIPTIONS[0],
    [selectedRefillId],
  );

  const showNotice = useCallback((message: string) => {
    setActionNotice(message);
    window.setTimeout(() => setActionNotice(null), 4000);
  }, []);

  const toggleReminder = useCallback(
    (rxId: string, period: DosePeriod) => {
      setReminders((prev) => ({
        ...prev,
        [rxId]: { ...prev[rxId], [period]: !prev[rxId]?.[period] },
      }));
    },
    [],
  );

  const toggleDrugInfo = useCallback((rxId: string) => {
    setExpandedInfo((prev) => ({ ...prev, [rxId]: !prev[rxId] }));
  }, []);

  const handleDownloadPdf = useCallback(
    (medication: string) => {
      showNotice(patientToastCopy.prescriptionPdfReady);
    },
    [showNotice],
  );

  const handleRequestRefill = useCallback(() => {
    if (!selectedRefillRx) return;
    setRefillStates((prev) => ({
      ...prev,
      [selectedRefillRx.id]: 'Processing',
    }));
    showNotice(patientToastCopy.refillProcessing(selectedRefillRx.medication));
    window.setTimeout(() => {
      setRefillStates((prev) => ({
        ...prev,
        [selectedRefillRx.id]: 'Request Sent',
      }));
    }, 2500);
  }, [selectedRefillRx, showNotice]);

  const periodLabel: Record<DosePeriod, string> = {
    morning: 'Morning',
    afternoon: 'Afternoon',
    night: 'Night',
  };

  return (
    <div className="min-h-screen w-full space-y-6 bg-patient-canvas p-6 font-sans text-patient-charcoal">
      {/* Central HUD header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-patient-plum">
            Digital Pharmacy &amp; Prescription Management
          </h1>
          <p className="mt-1 text-sm font-medium text-patient-lavender">
            Active medical fulfillment · {activeReminderCount} reminder alarms scheduled · 14 Jul 2026
          </p>
        </div>
        <PatientHeaderBadge
          label={formatHeaderBadge('PHARMACY_VAULT_SYNC_OK')}
          tone="verified"
          icon={ShieldCheck}
        />
      </header>

      {actionNotice ? <PatientStatusBanner message={actionNotice} variant="success" /> : null}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,65fr)_minmax(0,35fr)]">
        {/* Left column — active therapy (65%) */}
        <section aria-label="Active prescriptions">
          <div className="mb-4 flex items-center gap-2">
            <Pill className="h-5 w-5 text-patient-primary" aria-hidden />
            <h2 className="text-lg font-black text-patient-plum">Active Prescriptions Deck</h2>
          </div>

          {ACTIVE_PRESCRIPTIONS.map((rx) => {
            const supplyPct = Math.round((rx.pillsRemaining / rx.totalSupply) * 100);
            const schedule = reminders[rx.id];
            const isExpanded = expandedInfo[rx.id];

            return (
              <article key={rx.id} className={DRUG_CARD_CLASS}>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-black text-patient-charcoal">
                        {rx.medication}{' '}
                        <span className="text-patient-primary">{rx.dosage}</span>
                      </h3>
                      <span className="inline-flex rounded-full border border-patient-lavender/30 bg-patient-card px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-patient-primary">
                        Active
                      </span>
                    </div>
                    <p className="mt-1 text-sm font-bold text-patient-primary">{rx.frequency}</p>
                    <p className="mt-0.5 text-xs font-medium text-patient-lavender">{rx.prescriber}</p>
                    <p className="mt-2 text-xs font-bold text-patient-lavender">
                      {rx.pillsRemaining} pills remaining · {supplyPct}% of supply left
                    </p>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-patient-primary transition-all"
                        style={{ width: `${supplyPct}%` }}
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDownloadPdf(rx.medication)}
                    className="inline-flex shrink-0 items-center gap-1.5 text-xs font-bold text-patient-primary hover:underline"
                  >
                    <Download className="h-3.5 w-3.5" aria-hidden />
                    Download PDF
                  </button>
                </div>

                {/* Medicine reminder module */}
                <div className="mt-4 border-t border-patient-lavender/30 pt-4">
                  <p className="mb-2 flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-patient-plum">
                    <Bell className="h-3.5 w-3.5" aria-hidden />
                    Medicine Reminders
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(['morning', 'afternoon', 'night'] as DosePeriod[]).map((period) => {
                      const applicable = rx.schedule.includes(period);
                      const active = schedule?.[period] ?? false;
                      if (!applicable) return null;
                      return (
                        <button
                          key={period}
                          type="button"
                          onClick={() => toggleReminder(rx.id, period)}
                          aria-pressed={active}
                          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                            active
                              ? 'border border-patient-primary/30 bg-patient-card text-patient-plum'
                              : 'border border-patient-lavender/30 bg-patient-lavender/10 text-patient-lavender hover:bg-slate-100'
                          }`}
                        >
                          {active ? (
                            <Bell className="h-3 w-3" aria-hidden />
                          ) : (
                            <BellOff className="h-3 w-3" aria-hidden />
                          )}
                          {periodLabel[period]}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Expandable drug information */}
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => toggleDrugInfo(rx.id)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-patient-primary hover:underline"
                  >
                    {isExpanded ? (
                      <ChevronUp className="h-3.5 w-3.5" aria-hidden />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5" aria-hidden />
                    )}
                    Drug Information
                  </button>
                  {isExpanded ? (
                    <div className="mt-3 rounded-lg border border-patient-lavender/30 bg-patient-lavender/10/80 p-3 text-xs">
                      <p className="font-bold text-patient-text">
                        <span className="text-patient-plum">Side effects:</span> {rx.sideEffects}
                      </p>
                      <p className="mt-2 font-bold text-patient-text">
                        <span className="text-patient-plum">Contraindications:</span>{' '}
                        {rx.contraindications}
                      </p>
                    </div>
                  ) : null}
                </div>
              </article>
            );
          })}
        </section>

        {/* Right column — renewals & history (35%) */}
        <aside className="space-y-6">
          {/* Refill request console */}
          <section aria-label="Refill request console" className={PANEL_CLASS}>
            <div className="mb-4 flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-patient-primary" aria-hidden />
              <h2 className="text-base font-black text-patient-plum">Refill Request Console</h2>
            </div>

            <label htmlFor="refill-select" className="text-xs font-bold uppercase tracking-wider text-patient-lavender">
              Select prescription
            </label>
            <select
              id="refill-select"
              value={selectedRefillId}
              onChange={(event) => setSelectedRefillId(event.target.value)}
              className="mt-1.5 w-full rounded-xl border border-patient-lavender/30 bg-white px-3 py-2.5 text-sm font-medium focus:border-patient-lavender/30 focus:outline-none focus:ring-2 focus:ring-[#572E54]/20"
            >
              {ACTIVE_PRESCRIPTIONS.map((rx) => (
                <option key={rx.id} value={rx.id}>
                  {rx.medication} {rx.dosage} · {rx.pillsRemaining} left
                </option>
              ))}
            </select>

            {selectedRefillRx ? (
              <div className="mt-4 rounded-xl border border-patient-lavender/30 bg-patient-lavender/10/80 p-4">
                <p className="text-sm font-black text-patient-charcoal">
                  {selectedRefillRx.medication} {selectedRefillRx.dosage}
                </p>
                <p className="mt-1 text-2xl font-black tabular-nums text-patient-plum">
                  {selectedRefillRx.pillsRemaining}
                  <span className="text-sm font-medium text-patient-lavender">
                    {' '}
                    / {selectedRefillRx.totalSupply} pills
                  </span>
                </p>
                <span
                  className={`mt-2 inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                    refillStates[selectedRefillRx.id] === 'Processing'
                      ? 'border border-patient-lavender/30 bg-patient-card text-patient-primary'
                      : refillStates[selectedRefillRx.id] === 'Request Sent'
                        ? 'border border-patient-lavender/30 bg-patient-card text-patient-primary'
                        : 'border border-amber-500/20 bg-amber-500/10 text-amber-800'
                  }`}
                >
                  {refillStates[selectedRefillRx.id]}
                </span>
              </div>
            ) : null}

            <button
              type="button"
              onClick={handleRequestRefill}
              disabled={refillStates[selectedRefillId] === 'Processing'}
              className="mt-4 block w-full cursor-pointer rounded-xl bg-patient-primary py-3 text-center text-sm font-bold text-white shadow-sm transition-all hover:bg-patient-plum disabled:cursor-not-allowed disabled:opacity-70"
            >
              {refillStates[selectedRefillId] === 'Processing'
                ? 'Processing…'
                : 'Request Pharmacy Refill'}
            </button>
          </section>

          {/* Previous prescriptions ledger */}
          <section aria-label="Previous prescriptions" className={PANEL_CLASS}>
            <div className="mb-4 flex items-center gap-2">
              <History className="h-5 w-5 text-patient-primary" aria-hidden />
              <h2 className="text-base font-black text-patient-plum">Previous Prescriptions Ledger</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[280px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-patient-lavender/30 bg-patient-lavender/10/80">
                    <th className="px-2 py-2 text-left text-[10px] font-black uppercase text-patient-plum">
                      Medicine
                    </th>
                    <th className="px-2 py-2 text-left text-[10px] font-black uppercase text-patient-plum">
                      End
                    </th>
                    <th className="px-2 py-2 text-right text-[10px] font-black uppercase text-patient-plum">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {PREVIOUS_PRESCRIPTIONS.map((rx) => (
                    <tr key={rx.id} className="border-b border-patient-lavender/30">
                      <td className="px-2 py-2.5">
                        <p className="text-xs font-bold text-patient-charcoal">
                          {rx.medication} {rx.dosage}
                        </p>
                        <p className="text-[10px] font-medium text-patient-lavender">{rx.duration}</p>
                      </td>
                      <td className="px-2 py-2.5 text-xs font-bold text-patient-primary">{rx.endDate}</td>
                      <td className="px-2 py-2.5 text-right">
                        <span className={`inline-flex uppercase ${COMPLETED_TAG}`}>
                          COURSE_COMPLETED
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
