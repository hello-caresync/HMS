'use client';

import { useMemo, useState } from 'react';
import { BedDouble, CheckCircle2, ClipboardList } from 'lucide-react';

import {
  MasterDataTable,
  MasterPanel,
  MasterSearchBar,
  MasterTabBar,
  MasterViewHeader,
  masterBtnPrimary,
} from './_masterLightUi';

type RequestFilter = 'doctor' | 'emergency' | 'scheduled' | 'pending' | 'history';

type AdmissionRequest = {
  id: string;
  patient: string;
  source: 'Doctor' | 'Emergency';
  department: string;
  status: 'Pending Approval' | 'Scheduled' | 'Approved' | 'Historical';
  requestedAt: string;
};

const SEED_REQUESTS: AdmissionRequest[] = [
  {
    id: 'AR-881',
    patient: 'Rahul Sharma',
    source: 'Doctor',
    department: 'Cardiology',
    status: 'Pending Approval',
    requestedAt: '2026-07-16 09:12',
  },
  {
    id: 'AR-882',
    patient: 'Unknown — Trauma',
    source: 'Emergency',
    department: 'Emergency',
    status: 'Pending Approval',
    requestedAt: '2026-07-16 10:05',
  },
  {
    id: 'AR-880',
    patient: 'Priya Patel',
    source: 'Doctor',
    department: 'Orthopedics',
    status: 'Scheduled',
    requestedAt: '2026-07-17 08:00',
  },
  {
    id: 'AR-875',
    patient: 'Meera Krishnan',
    source: 'Doctor',
    department: 'General Medicine',
    status: 'Historical',
    requestedAt: '2026-07-14 14:30',
  },
];

export default function AdmissionRequests() {
  const [requests, setRequests] = useState(SEED_REQUESTS);
  const [filter, setFilter] = useState<RequestFilter>('doctor');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    return requests.filter((r) => {
      const q = search.toLowerCase();
      const matchSearch =
        r.patient.toLowerCase().includes(q) || r.id.toLowerCase().includes(q);
      if (!matchSearch) return false;
      switch (filter) {
        case 'doctor':
          return r.source === 'Doctor';
        case 'emergency':
          return r.source === 'Emergency';
        case 'scheduled':
          return r.status === 'Scheduled';
        case 'pending':
          return r.status === 'Pending Approval';
        case 'history':
          return r.status === 'Historical' || r.status === 'Approved';
        default:
          return true;
      }
    });
  }, [requests, filter, search]);

  const approveAndMatch = (id: string) => {
    setRequests((rows) =>
      rows.map((r) => (r.id === id ? { ...r, status: 'Approved' as const } : r)),
    );
  };

  return (
    <div className="space-y-6">
      <MasterViewHeader
        title="Admission Requests Ledger"
        subtitle="Doctor and emergency triage queue with bed matching workflow."
        icon={ClipboardList}
      />

      <MasterSearchBar value={search} onChange={setSearch} placeholder="Search requests…" />

      <MasterTabBar
        tabs={[
          { id: 'doctor', label: 'Doctor Requests' },
          { id: 'emergency', label: 'Emergency' },
          { id: 'scheduled', label: 'Scheduled' },
          { id: 'pending', label: 'Pending Approval' },
          { id: 'history', label: 'History' },
        ]}
        active={filter}
        onChange={setFilter}
      />

      <MasterPanel title="Operational Triage Ledger" description={`${filtered.length} records`}>
        <MasterDataTable
          columns={['Request', 'Patient', 'Source', 'Department', 'Status', 'Requested', 'Action']}
          rows={filtered.map((r) => [
            <span key="id" className="font-mono text-blue-600">
              {r.id}
            </span>,
            r.patient,
            r.source,
            r.department,
            <span
              key="st"
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ring-1 ${
                r.status === 'Pending Approval'
                  ? 'bg-amber-50 text-amber-700 ring-amber-200'
                  : r.status === 'Approved'
                    ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                    : 'bg-slate-100 text-slate-600 ring-slate-200'
              }`}
            >
              {r.status}
            </span>,
            r.requestedAt,
            r.status === 'Pending Approval' ? (
              <button
                key="act"
                type="button"
                onClick={() => approveAndMatch(r.id)}
                className={`${masterBtnPrimary} !px-2 !py-1`}
              >
                <BedDouble className="h-3 w-3" />
                Approve &amp; Match Bed
              </button>
            ) : r.status === 'Approved' ? (
              <CheckCircle2 key="ok" className="h-4 w-4 text-emerald-500" />
            ) : (
              '—'
            ),
          ])}
        />
      </MasterPanel>
    </div>
  );
}
