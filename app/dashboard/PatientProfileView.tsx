'use client';

import { useMemo, useState } from 'react';
import {
  Activity,
  Calendar,
  Heart,
  MapPin,
  Phone,
  Stethoscope,
  User,
} from 'lucide-react';

import {
  MasterPanel,
  MasterSearchBar,
  MasterViewHeader,
} from './_masterLightUi';

type PatientDossier = {
  uhid: string;
  name: string;
  age: number;
  sex: string;
  phone: string;
  address: string;
  status: 'Active OPD' | 'Admitted' | 'Discharged' | 'Under Review';
  primaryCare: string;
  chronicConditions: string[];
  timeline: { date: string; event: string; dept: string }[];
  visits: { date: string; type: string; provider: string }[];
};

const DOSSIER_INDEX: PatientDossier[] = [
  {
    uhid: 'NX-2026-000412',
    name: 'Rahul Sharma',
    age: 37,
    sex: 'Male',
    phone: '+91 98765 43210',
    address: 'M.G. Road, Bengaluru',
    status: 'Admitted',
    primaryCare: 'Dr. Anita Roy · Cardiology',
    chronicConditions: ['Type-2 Diabetes', 'Hypertension'],
    timeline: [
      { date: '2026-07-14', event: 'IPD Admission — Ward 3A', dept: 'Cardiology' },
      { date: '2026-07-10', event: 'Echo + Stress Test', dept: 'Cardiology' },
      { date: '2026-06-22', event: 'OPD Follow-up', dept: 'General Medicine' },
    ],
    visits: [
      { date: '2026-07-14', type: 'IPD', provider: 'Dr. Anita Roy' },
      { date: '2026-06-22', type: 'OPD', provider: 'Dr. Rajesh Kumar' },
    ],
  },
  {
    uhid: 'NX-2026-000413',
    name: 'Priya Patel',
    age: 31,
    sex: 'Female',
    phone: '+91 87654 32109',
    address: 'Indiranagar, Bengaluru',
    status: 'Active OPD',
    primaryCare: 'Dr. Meera Iyer · Pediatrics',
    chronicConditions: ['Asthma'],
    timeline: [
      { date: '2026-07-15', event: 'Pulmonary function review', dept: 'Pulmonology' },
      { date: '2026-05-08', event: 'Annual wellness OPD', dept: 'General Medicine' },
    ],
    visits: [{ date: '2026-07-15', type: 'OPD', provider: 'Dr. Meera Iyer' }],
  },
  {
    uhid: 'NX-2026-000415',
    name: 'Meera Krishnan',
    age: 47,
    sex: 'Female',
    phone: '+91 91234 56780',
    address: 'Koramangala, Bengaluru',
    status: 'Under Review',
    primaryCare: 'Dr. B. J. Joseph · Orthopedics',
    chronicConditions: ['Osteoarthritis', 'Hypothyroidism'],
    timeline: [
      { date: '2026-07-16', event: 'MRI knee scheduled', dept: 'Radiology' },
      { date: '2026-07-12', event: 'Orthopedic consult', dept: 'Orthopedics' },
    ],
    visits: [{ date: '2026-07-12', type: 'OPD', provider: 'Dr. B. J. Joseph' }],
  },
];

function StatusTag({ status }: { status: PatientDossier['status'] }) {
  const styles = {
    'Active OPD': 'bg-blue-50 text-blue-700 ring-blue-200',
    Admitted: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    Discharged: 'bg-slate-100 text-slate-600 ring-slate-200',
    'Under Review': 'bg-amber-50 text-amber-700 ring-amber-200',
  }[status];
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ring-1 ${styles}`}>
      {status}
    </span>
  );
}

export default function PatientProfileView() {
  const [search, setSearch] = useState('');
  const [selectedUhid, setSelectedUhid] = useState(DOSSIER_INDEX[0].uhid);

  const matches = useMemo(() => {
    const q = search.toLowerCase();
    return DOSSIER_INDEX.filter(
      (p) => p.name.toLowerCase().includes(q) || p.uhid.toLowerCase().includes(q),
    );
  }, [search]);

  const profile = DOSSIER_INDEX.find((p) => p.uhid === selectedUhid) ?? matches[0];

  return (
    <div className="space-y-6">
      <MasterViewHeader
        title="Patient Profile Dossier"
        subtitle="Master index search with historical timelines, chronic indices, and visit logs."
        icon={User}
      />

      <MasterSearchBar
        value={search}
        onChange={setSearch}
        placeholder="Search by patient name or UHID…"
      />

      <div className="flex flex-wrap gap-2">
        {matches.map((p) => (
          <button
            key={p.uhid}
            type="button"
            onClick={() => setSelectedUhid(p.uhid)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
              selectedUhid === p.uhid
                ? 'border-blue-600 bg-blue-600 text-white'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            {p.name}
          </button>
        ))}
      </div>

      {profile && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <MasterPanel title="Profile Card" description="Current demographic status" className="lg:col-span-1">
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-lg font-bold text-slate-800">{profile.name}</h2>
                  <p className="font-mono text-xs text-blue-600">{profile.uhid}</p>
                </div>
                <StatusTag status={profile.status} />
              </div>
              <dl className="space-y-2 text-xs">
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <dt className="text-slate-500">Age / Sex</dt>
                  <dd className="font-semibold text-slate-800">
                    {profile.age} · {profile.sex}
                  </dd>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Phone className="h-3.5 w-3.5 text-blue-600" />
                  {profile.phone}
                </div>
                <div className="flex items-start gap-2 text-slate-600">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-600" />
                  {profile.address}
                </div>
              </dl>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Primary Care Routing
                </p>
                <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                  <Stethoscope className="h-3.5 w-3.5 text-blue-600" />
                  {profile.primaryCare}
                </p>
              </div>
            </div>
          </MasterPanel>

          <div className="space-y-6 lg:col-span-2">
            <MasterPanel title="Chronic Condition Index" description="Longitudinal care flags">
              <ul className="flex flex-wrap gap-2">
                {profile.chronicConditions.map((c) => (
                  <li
                    key={c}
                    className="flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 ring-1 ring-rose-200"
                  >
                    <Heart className="h-3.5 w-3.5" />
                    {c}
                  </li>
                ))}
              </ul>
            </MasterPanel>

            <MasterPanel title="Historical Encounter Timeline" description="Cross-department event stream">
              <ul className="space-y-3">
                {profile.timeline.map((t, i) => (
                  <li key={i} className="flex gap-3 border-l-2 border-blue-200 pl-4">
                    <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                    <div>
                      <p className="text-xs font-semibold text-slate-800">{t.event}</p>
                      <p className="text-[10px] text-slate-500">
                        {t.date} · {t.dept}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </MasterPanel>

            <MasterPanel title="Past Visit Logs" description="Encounter roster">
              <ul className="divide-y divide-slate-100">
                {profile.visits.map((v, i) => (
                  <li key={i} className="flex items-center justify-between py-2.5 text-xs">
                    <span className="font-medium text-slate-800">{v.type} · {v.provider}</span>
                    <span className="flex items-center gap-1 text-slate-500">
                      <Activity className="h-3.5 w-3.5" />
                      {v.date}
                    </span>
                  </li>
                ))}
              </ul>
            </MasterPanel>
          </div>
        </div>
      )}
    </div>
  );
}
