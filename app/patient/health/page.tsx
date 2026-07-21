'use client';

import { useCallback, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  BedDouble,
  FileSpreadsheet,
  HeartPulse,
  History,
  ShieldAlert,
  Stethoscope,
  Syringe,
  Users,
} from 'lucide-react';

type HealthTab = 'profile' | 'timeline' | 'vitals';

type ChronicCondition = {
  id: string;
  condition: string;
  since: string;
  status: string;
};

type VaccinationRecord = {
  id: string;
  vaccine: string;
  date: string;
  dose: string;
};

type FamilyHistoryRecord = {
  id: string;
  relation: string;
  condition: string;
};

type AllergyRecord = {
  id: string;
  allergen: string;
  severity: 'Severe/Anaphylaxis' | 'Moderate' | 'Mild';
  reaction: string;
};

type PreviousVisit = {
  id: string;
  date: string;
  doctor: string;
  department: string;
  reason: string;
};

type AdmissionRecord = {
  id: string;
  admitDate: string;
  dischargeDate: string;
  ward: string;
  diagnosis: string;
  recoveryNotes: string;
};

type SurgeryRecord = {
  id: string;
  date: string;
  procedure: string;
  surgeon: string;
  recoveryTimeline: string;
};

type TimelineMilestone = {
  id: string;
  date: string;
  title: string;
  category: 'Visit' | 'Lab' | 'Admission' | 'Surgery';
  detail: string;
};

type VitalMetric = {
  label: string;
  value: string;
  unit: string;
  status: string;
  icon: typeof Activity;
};

type VitalsHistoryPoint = {
  id: string;
  date: string;
  bp: string;
  glucose: string;
  spo2: string;
  bmi: string;
};

const TAB_OPTIONS: { id: HealthTab; label: string; icon: typeof HeartPulse }[] = [
  { id: 'profile', label: 'Health Profile', icon: HeartPulse },
  { id: 'timeline', label: 'Clinical Timeline', icon: History },
  { id: 'vitals', label: 'Vitals Dashboard', icon: Activity },
];

const CURRENT_VITALS: VitalMetric[] = [
  { label: 'Blood Pressure', value: '120/80', unit: 'mmHg', status: 'Normal range', icon: Activity },
  { label: 'Blood Glucose', value: '108', unit: 'mg/dL', status: 'Fasting · monitor', icon: Activity },
  { label: 'SpO2', value: '98', unit: '%', status: 'Optimal', icon: Activity },
  { label: 'BMI', value: '24.2', unit: 'kg/m²', status: 'Healthy weight', icon: Activity },
];

const CHRONIC_CONDITIONS: ChronicCondition[] = [
  { id: 'cc-1', condition: 'Essential Hypertension', since: '2022', status: 'Controlled · Amlodipine 5 mg' },
  { id: 'cc-2', condition: 'Type 2 Diabetes Mellitus', since: '2023', status: 'Managed · HbA1c 6.4%' },
  { id: 'cc-3', condition: 'Mild Iron Deficiency Anemia', since: '2025', status: 'Supplement protocol active' },
];

const VACCINATIONS: VaccinationRecord[] = [
  { id: 'vac-1', vaccine: 'Covid-19 Booster', date: '12 Jan 2026', dose: 'Bivalent · IM deltoid' },
  { id: 'vac-2', vaccine: 'Influenza Vaccine', date: '08 Oct 2025', dose: 'Quadrivalent · annual' },
  { id: 'vac-3', vaccine: 'Tdap Booster', date: '14 Mar 2024', dose: '0.5 mL · IM' },
];

const FAMILY_HISTORY: FamilyHistoryRecord[] = [
  { id: 'fh-1', relation: 'Mother', condition: 'Hypothyroidism · diagnosed age 42' },
  { id: 'fh-2', relation: 'Father', condition: 'Coronary artery disease · CABG 2019' },
  { id: 'fh-3', relation: 'Sibling', condition: 'No chronic conditions reported' },
];

const ALLERGIES: AllergyRecord[] = [
  {
    id: 'al-1',
    allergen: 'Penicillin',
    severity: 'Severe/Anaphylaxis',
    reaction: 'Urticaria · bronchospasm · anaphylaxis risk',
  },
  {
    id: 'al-2',
    allergen: 'Shellfish',
    severity: 'Severe/Anaphylaxis',
    reaction: 'Angioedema · requires EpiPen protocol',
  },
  { id: 'al-3', allergen: 'Latex', severity: 'Moderate', reaction: 'Contact dermatitis · glove avoidance' },
];

const PREVIOUS_VISITS: PreviousVisit[] = [
  {
    id: 'pv-1',
    date: '08 Jul 2026',
    doctor: 'Dr. Meera Nair',
    department: 'General Medicine',
    reason: 'Hypertension follow-up · medication review',
  },
  {
    id: 'pv-2',
    date: '22 Jun 2026',
    doctor: 'Dr. Rajesh Kumar',
    department: 'Cardiology',
    reason: 'Echo review · lipid panel ordered',
  },
  {
    id: 'pv-3',
    date: '04 Jun 2026',
    doctor: 'Dr. Ananya Pillai',
    department: 'Dermatology',
    reason: 'Contact dermatitis · resolved',
  },
];

const ADMISSIONS: AdmissionRecord[] = [
  {
    id: 'adm-1',
    admitDate: '18 Feb 2025',
    dischargeDate: '21 Feb 2025',
    ward: 'Medical Ward B · Bed 14',
    diagnosis: 'Acute gastroenteritis · dehydration',
    recoveryNotes: 'IV fluids · discharged stable · full recovery 5 days',
  },
  {
    id: 'adm-2',
    admitDate: '03 Nov 2023',
    dischargeDate: '06 Nov 2023',
    ward: 'Day Care · Observation',
    diagnosis: 'Diagnostic colonoscopy · polypectomy',
    recoveryNotes: 'Same-day discharge · histopathology benign',
  },
];

const SURGERIES: SurgeryRecord[] = [
  {
    id: 'sur-1',
    date: '15 Aug 2024',
    procedure: 'Laparoscopic appendectomy',
    surgeon: 'Dr. Vikram S. · General Surgery',
    recoveryTimeline: 'Discharged D+2 · full activity D+14',
  },
];

const TIMELINE_MILESTONES: TimelineMilestone[] = [
  {
    id: 'tl-1',
    date: '08 Jul 2026',
    title: 'OPD Follow-up · General Medicine',
    category: 'Visit',
    detail: 'BP 120/80 · continue Amlodipine · next review 3 months',
  },
  {
    id: 'tl-2',
    date: '08 Jul 2026',
    title: 'Laboratory · Lipid Panel',
    category: 'Lab',
    detail: 'LDL 104 mg/dL · verified NX-LAB-2026-44103',
  },
  {
    id: 'tl-3',
    date: '22 Jun 2026',
    title: 'Cardiology Consultation',
    category: 'Visit',
    detail: 'Mild LVH · lifestyle counselling · echo scheduled',
  },
  {
    id: 'tl-4',
    date: '15 Aug 2024',
    title: 'Surgical · Appendectomy',
    category: 'Surgery',
    detail: 'Laparoscopic · uncomplicated · Dr. Vikram S.',
  },
  {
    id: 'tl-5',
    date: '18 Feb 2025',
    title: 'Admission · Medical Ward B',
    category: 'Admission',
    detail: 'Acute gastroenteritis · 3-day stay · full recovery',
  },
];

const VITALS_HISTORY: VitalsHistoryPoint[] = [
  { id: 'vh-1', date: '08 Jul 2026', bp: '120/80', glucose: '108', spo2: '98', bmi: '24.2' },
  { id: 'vh-2', date: '22 Jun 2026', bp: '124/82', glucose: '112', spo2: '97', bmi: '24.3' },
  { id: 'vh-3', date: '04 Jun 2026', bp: '118/78', glucose: '105', spo2: '99', bmi: '24.1' },
  { id: 'vh-4', date: '15 May 2026', bp: '122/80', glucose: '110', spo2: '98', bmi: '24.4' },
];

const PANEL_CLASS = 'rounded-2xl border border-[#f0d8dc] bg-white p-6 shadow-sm';

const CARD_CLASS = 'rounded-xl border border-[#f0d8dc] bg-white p-5 shadow-sm';

export default function PatientHealthPage() {
  const [activeTab, setActiveTab] = useState<HealthTab>('profile');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const showNotice = useCallback((message: string) => {
    setActionNotice(message);
    window.setTimeout(() => setActionNotice(null), 4000);
  }, []);

  const handleRequestSummary = useCallback(
    (milestone: TimelineMilestone) => {
      showNotice(`Summary copy requested · ${milestone.title} · ${milestone.date} · sandbox export`);
    },
    [showNotice],
  );

  const severeAllergies = ALLERGIES.filter((a) => a.severity === 'Severe/Anaphylaxis');

  return (
    <div className="min-h-screen w-full space-y-6 bg-[#faf6f7] p-6 font-sans text-slate-950">
      {/* Logistical hub header */}
      <header>
        <h1 className="text-2xl font-black text-[#8c2b39]">
          Personal Electronic Health Record &amp; Vitals Console
        </h1>
        <p className="mt-1 text-sm font-medium text-slate-600">
          Automated verification sync · ID_NEX_9021 · EMR vault linked · last integrity check 14 Jul
          2026 · 12:22 IST
        </p>
      </header>

      {/* Tab navigation */}
      <nav aria-label="Health record sections" className="flex flex-wrap gap-2">
        {TAB_OPTIONS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all ${
              activeTab === id
                ? 'bg-[#f47c8c] text-white shadow-sm'
                : 'border border-[#f0d8dc] bg-white text-slate-600 hover:bg-slate-50/80 hover:text-[#8c2b39]'
            }`}
          >
            <Icon className="h-4 w-4" aria-hidden />
            {label}
          </button>
        ))}
      </nav>

      {actionNotice ? (
        <p className="rounded-xl border border-[#f0d8dc] bg-[#fde8eb] px-4 py-2 text-sm font-bold text-[#f47c8c]">
          {actionNotice}
        </p>
      ) : null}

      {/* Top highlight bar — vitals + allergies */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,70fr)_minmax(0,30fr)]">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {CURRENT_VITALS.map(({ label, value, unit, status, icon: Icon }) => (
            <div
              key={label}
              className="flex flex-col rounded-xl border border-[#f0d8dc] border-t-4 border-t-[#f47c8c] bg-white p-4 shadow-sm"
            >
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  {label}
                </p>
                <Icon className="h-4 w-4 text-[#f47c8c]" aria-hidden />
              </div>
              <p className="text-xl font-black tabular-nums text-[#8c2b39]">
                {value}
                <span className="text-xs font-medium text-slate-500"> {unit}</span>
              </p>
              <p className="mt-1 text-[10px] font-bold text-[#8c2b39]">{status}</p>
            </div>
          ))}
        </div>

        <div
          className="flex animate-pulse items-start gap-3 rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-xs font-bold text-rose-700"
          role="alert"
        >
          <ShieldAlert className="h-5 w-5 shrink-0" aria-hidden />
          <div>
            <p className="text-sm font-extrabold uppercase tracking-wide">High-Alert Allergy Register</p>
            <ul className="mt-2 space-y-1.5 font-bold">
              {severeAllergies.map((allergy) => (
                <li key={allergy.id}>
                  {allergy.allergen} — {allergy.severity}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Main grid */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,60fr)_minmax(0,40fr)]">
        {/* Left column — structural clinical dossier (60%) */}
        <div className="space-y-6">
          {activeTab === 'profile' || activeTab === 'timeline' ? (
            <section aria-label="Medical and history registry" className={PANEL_CLASS}>
              <div className="mb-4 flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-[#f47c8c]" aria-hidden />
                <h2 className="text-lg font-black text-[#8c2b39]">Medical &amp; History Registry</h2>
              </div>

              <div className="space-y-4">
                <div className={CARD_CLASS}>
                  <h3 className="text-sm font-bold text-[#f47c8c]">Chronic Diseases</h3>
                  <ul className="mt-3 space-y-2">
                    {CHRONIC_CONDITIONS.map((item) => (
                      <li
                        key={item.id}
                        className="rounded-lg border border-[#f0d8dc] bg-slate-50/50 px-3 py-2"
                      >
                        <p className="text-sm font-black text-slate-900">{item.condition}</p>
                        <p className="text-xs font-medium text-slate-600">
                          Since {item.since} · {item.status}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className={CARD_CLASS}>
                  <h3 className="flex items-center gap-1.5 text-sm font-bold text-[#f47c8c]">
                    <Syringe className="h-4 w-4" aria-hidden />
                    Vaccinations
                  </h3>
                  <ul className="mt-3 space-y-2">
                    {VACCINATIONS.map((vac) => (
                      <li
                        key={vac.id}
                        className="flex items-center justify-between gap-2 rounded-lg border border-[#f0d8dc] bg-[#fde8eb] px-3 py-2"
                      >
                        <div>
                          <p className="text-sm font-bold text-slate-900">{vac.vaccine}</p>
                          <p className="text-xs font-medium text-slate-600">{vac.dose}</p>
                        </div>
                        <span className="text-xs font-black text-[#f47c8c]">{vac.date}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className={CARD_CLASS}>
                  <h3 className="flex items-center gap-1.5 text-sm font-bold text-[#f47c8c]">
                    <Users className="h-4 w-4" aria-hidden />
                    Family History
                  </h3>
                  <ul className="mt-3 space-y-2">
                    {FAMILY_HISTORY.map((fh) => (
                      <li key={fh.id} className="text-sm">
                        <span className="font-black text-[#8c2b39]">{fh.relation}</span>
                        <span className="font-medium text-slate-700"> · {fh.condition}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>
          ) : null}

          {activeTab === 'vitals' ? (
            <section aria-label="Vitals dashboard" className={PANEL_CLASS}>
              <div className="mb-4 flex items-center gap-2">
                <Activity className="h-5 w-5 text-[#f47c8c]" aria-hidden />
                <h2 className="text-lg font-black text-[#8c2b39]">Vitals Ledger · Longitudinal</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-[#f0d8dc] bg-slate-50/80">
                      <th className="px-3 py-2 text-left text-[10px] font-black uppercase text-[#8c2b39]">
                        Date
                      </th>
                      <th className="px-3 py-2 text-left text-[10px] font-black uppercase text-[#8c2b39]">
                        BP
                      </th>
                      <th className="px-3 py-2 text-left text-[10px] font-black uppercase text-[#8c2b39]">
                        Glucose
                      </th>
                      <th className="px-3 py-2 text-left text-[10px] font-black uppercase text-[#8c2b39]">
                        SpO2
                      </th>
                      <th className="px-3 py-2 text-left text-[10px] font-black uppercase text-[#8c2b39]">
                        BMI
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {VITALS_HISTORY.map((row) => (
                      <tr key={row.id} className="border-b border-[#f0d8dc]">
                        <td className="px-3 py-2.5 font-bold text-slate-800">{row.date}</td>
                        <td className="px-3 py-2.5 font-black text-[#f47c8c]">{row.bp}</td>
                        <td className="px-3 py-2.5 font-black text-[#f47c8c]">
                          {row.glucose} mg/dL
                        </td>
                        <td className="px-3 py-2.5 font-black text-[#f47c8c]">{row.spo2}%</td>
                        <td className="px-3 py-2.5 font-black text-[#8c2b39]">{row.bmi}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}

          {(activeTab === 'timeline' || activeTab === 'profile') && (
            <section aria-label="Admission and surgery logs" className={PANEL_CLASS}>
              <div className="mb-4 flex items-center gap-2">
                <BedDouble className="h-5 w-5 text-[#f47c8c]" aria-hidden />
                <h2 className="text-lg font-black text-[#8c2b39]">Admission &amp; Surgery Logs</h2>
              </div>

              <h3 className="mb-2 text-sm font-bold text-[#f47c8c]">Previous Visits</h3>
              <div className="mb-5 overflow-x-auto">
                <table className="w-full min-w-[480px] border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-[#f0d8dc] bg-slate-50/80">
                      <th className="px-3 py-2 text-left text-[10px] font-black uppercase text-[#8c2b39]">
                        Date
                      </th>
                      <th className="px-3 py-2 text-left text-[10px] font-black uppercase text-[#8c2b39]">
                        Doctor
                      </th>
                      <th className="px-3 py-2 text-left text-[10px] font-black uppercase text-[#8c2b39]">
                        Department
                      </th>
                      <th className="px-3 py-2 text-left text-[10px] font-black uppercase text-[#8c2b39]">
                        Reason
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {PREVIOUS_VISITS.map((visit) => (
                      <tr key={visit.id} className="border-b border-[#f0d8dc]">
                        <td className="px-3 py-2.5 font-bold text-[#f47c8c]">{visit.date}</td>
                        <td className="px-3 py-2.5 font-bold text-slate-900">{visit.doctor}</td>
                        <td className="px-3 py-2.5 text-slate-700">{visit.department}</td>
                        <td className="px-3 py-2.5 text-xs font-medium text-slate-600">
                          {visit.reason}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <h3 className="mb-2 text-sm font-bold text-[#f47c8c]">Admission History</h3>
              <ul className="mb-5 space-y-2">
                {ADMISSIONS.map((adm) => (
                  <li key={adm.id} className={CARD_CLASS}>
                    <p className="text-sm font-black text-slate-900">{adm.diagnosis}</p>
                    <p className="mt-1 text-xs font-bold text-[#f47c8c]">
                      {adm.admitDate} → {adm.dischargeDate} · {adm.ward}
                    </p>
                    <p className="mt-1 text-xs font-medium text-slate-600">{adm.recoveryNotes}</p>
                  </li>
                ))}
              </ul>

              <h3 className="mb-2 text-sm font-bold text-[#f47c8c]">Surgery History</h3>
              <ul className="space-y-2">
                {SURGERIES.map((surgery) => (
                  <li key={surgery.id} className={CARD_CLASS}>
                    <p className="text-sm font-black text-slate-900">{surgery.procedure}</p>
                    <p className="mt-1 text-xs font-bold text-[#f47c8c]">
                      {surgery.date} · {surgery.surgeon}
                    </p>
                    <p className="mt-1 text-xs font-medium text-slate-600">
                      {surgery.recoveryTimeline}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {/* Right column — health timeline spine (40%) */}
        <aside aria-label="Health timeline" className={PANEL_CLASS}>
          <div className="mb-5 flex items-center gap-2">
            <History className="h-5 w-5 text-[#f47c8c]" aria-hidden />
            <h2 className="text-lg font-black text-[#8c2b39]">Interactive Health Timeline</h2>
          </div>

          <div className="relative pl-6">
            <div
              className="absolute left-3 top-2 h-[calc(100%-0.5rem)] border-l-2 border-[#f0d8dc]"
              aria-hidden
            />
            <ol className="space-y-5">
              {TIMELINE_MILESTONES.map((milestone) => (
                <li key={milestone.id} className="relative">
                  <span
                    className="absolute -left-[1.15rem] top-2 h-3 w-3 rounded-full border-2 border-white bg-[#f47c8c] shadow-sm"
                    aria-hidden
                  />
                  <div className="rounded-xl border border-[#f0d8dc] bg-white p-4 shadow-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-xs font-black text-[#8c2b39]">{milestone.date}</p>
                      <span className="inline-flex rounded-md border border-[#f0d8dc] bg-[#fde8eb] px-2 py-0.5 text-[10px] font-bold uppercase text-[#f47c8c]">
                        {milestone.category}
                      </span>
                    </div>
                    <p className="mt-2 text-sm font-black text-slate-900">{milestone.title}</p>
                    <p className="mt-1 text-xs font-medium leading-relaxed text-slate-600">
                      {milestone.detail}
                    </p>
                    <button
                      type="button"
                      onClick={() => handleRequestSummary(milestone)}
                      className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-[#f47c8c] hover:underline"
                    >
                      <FileSpreadsheet className="h-3.5 w-3.5" aria-hidden />
                      Request Summary Copy
                    </button>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* Moderate allergies secondary list */}
          <div className="mt-6 rounded-xl border border-[#f0d8dc] bg-slate-50/80 p-4">
            <p className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-[#8c2b39]">
              <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
              Full Allergy Register
            </p>
            <ul className="mt-2 space-y-1.5 text-xs font-bold">
              {ALLERGIES.map((allergy) => (
                <li
                  key={allergy.id}
                  className={
                    allergy.severity === 'Severe/Anaphylaxis'
                      ? 'text-rose-700'
                      : 'text-slate-700'
                  }
                >
                  {allergy.allergen} · {allergy.severity} · {allergy.reaction}
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
