'use client';

import { useState } from 'react';
import {
  AlertTriangle,
  Check,
  Edit3,
  FileText,
  Heart,
  Layers,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  UserMinus,
  UserPlus,
  Users,
} from 'lucide-react';

type PatientStatus = 'Outpatient' | 'Inpatient' | 'Emergency' | 'Discharged' | 'Deceased';

interface PatientRecord {
  uhid: string;
  firstName: string;
  lastName: string;
  dob: string;
  gender: string;
  phone: string;
  status: PatientStatus;
  medicalAlerts: string[];
  familyMembers: string[];
  bloodGroup: string;
  address: string;
}

const INITIAL_PATIENTS: PatientRecord[] = [
  {
    uhid: 'NX-2026-000412',
    firstName: 'Rahul',
    lastName: 'Sharma',
    dob: '1988-08-14',
    gender: 'Male',
    phone: '+91 98765 43210',
    status: 'Inpatient',
    medicalAlerts: ['Penicillin Allergy', 'Diabetic Type-2'],
    familyMembers: ['Sunita Sharma (Spouse)', 'Amit Sharma (Son)'],
    bloodGroup: 'O+',
    address: 'M.G. Road, Bengaluru',
  },
  {
    uhid: 'NX-2026-000413',
    firstName: 'Priya',
    lastName: 'Patel',
    dob: '1995-04-23',
    gender: 'Female',
    phone: '+91 87654 32109',
    status: 'Outpatient',
    medicalAlerts: ['Asthmatic'],
    familyMembers: ['Rajesh Patel (Father)'],
    bloodGroup: 'A-',
    address: 'Indiranagar, Bengaluru',
  },
  {
    uhid: 'NX-2026-000415',
    firstName: 'Meera',
    lastName: 'Krishnan',
    dob: '1979-01-17',
    gender: 'Female',
    phone: '+91 91234 56780',
    status: 'Emergency',
    medicalAlerts: ['Hypertensive Crisis', 'Latex Allergy'],
    familyMembers: ['Vikram Krishnan (Spouse)'],
    bloodGroup: 'AB+',
    address: 'Koramangala, Bengaluru',
  },
  {
    uhid: 'NX-2026-000419',
    firstName: 'Somnath',
    lastName: 'Dutta',
    dob: '1942-11-02',
    gender: 'Male',
    phone: '+91 99123 45678',
    status: 'Deceased',
    medicalAlerts: ['Cardiac Rhythms Issues'],
    familyMembers: ['Kiran Dutta (Son)'],
    bloodGroup: 'B+',
    address: 'Jayanagar, Bengaluru',
  },
];

const BLOOD_GROUPS = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'] as const;

const PATIENT_STATUSES: PatientStatus[] = [
  'Outpatient',
  'Inpatient',
  'Emergency',
  'Discharged',
  'Deceased',
];

const EMPTY_FORM = {
  firstName: '',
  lastName: '',
  dob: '',
  gender: 'Male',
  phone: '',
  familyMember: '',
  medicalAlert: '',
  status: 'Outpatient' as PatientStatus,
  bloodGroup: 'O+',
  address: '',
};

function generateUhid(): string {
  return `NX-2026-${Math.floor(100000 + Math.random() * 900000)}`;
}

function statusBadgeClass(status: PatientStatus): string {
  switch (status) {
    case 'Inpatient':
      return 'bg-indigo-500/10 text-indigo-400 border border-indigo-900/30';
    case 'Outpatient':
      return 'bg-cyan-500/10 text-cyan-400 border border-cyan-900/30';
    case 'Emergency':
      return 'bg-rose-600/20 text-rose-400 border border-rose-900/40 animate-pulse';
    case 'Deceased':
      return 'bg-slate-950 text-slate-400 border border-slate-800';
    default:
      return 'bg-slate-800 text-slate-400';
  }
}

export default function PatientView() {
  const [activeTab, setActiveTab] = useState<'registry' | 'register'>('registry');
  const [searchQuery, setSearchQuery] = useState('');
  const [patients, setPatients] = useState<PatientRecord[]>(INITIAL_PATIENTS);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [isGeneratingUhid, setIsGeneratingUhid] = useState(false);
  const [generatedUhid, setGeneratedUhid] = useState<string | null>(null);

  const filteredPatientList = patients.filter(
    (patient) =>
      `${patient.firstName} ${patient.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.uhid.includes(searchQuery) ||
      patient.phone.includes(searchQuery),
  );

  const handleRegisterPatient = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsGeneratingUhid(true);
    setGeneratedUhid(null);

    window.setTimeout(() => {
      const uniqueUhid = generateUhid();
      setGeneratedUhid(uniqueUhid);

      window.setTimeout(() => {
        const newRecord: PatientRecord = {
          uhid: uniqueUhid,
          firstName: formData.firstName,
          lastName: formData.lastName,
          dob: formData.dob,
          gender: formData.gender,
          phone: formData.phone,
          status: formData.status,
          medicalAlerts: formData.medicalAlert ? [formData.medicalAlert] : [],
          familyMembers: formData.familyMember ? [formData.familyMember] : ['Self'],
          bloodGroup: formData.bloodGroup,
          address: formData.address || 'Not Declared',
        };

        setPatients((current) => [newRecord, ...current]);
        setFormData(EMPTY_FORM);
        setIsGeneratingUhid(false);
        setGeneratedUhid(null);
        setActiveTab('registry');
      }, 1400);
    }, 900);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 border-b border-slate-800 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-white">
            <Users className="h-6 w-6 text-blue-400" />
            Patient Management Engine
          </h1>
          <p className="mt-0.5 text-xs text-slate-400">
            Demographics core intake repository, automated health records auditing, and clinical
            indices verification.
          </p>
        </div>

        <div className="flex self-start rounded-lg border border-slate-800 bg-slate-900/60 p-1">
          <button
            type="button"
            onClick={() => setActiveTab('registry')}
            className={`flex items-center gap-2 rounded-md px-3.5 py-1.5 text-xs font-semibold transition-all ${
              activeTab === 'registry'
                ? 'bg-[#1e3a8a] text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            Core Registry View
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('register')}
            className={`flex items-center gap-2 rounded-md px-3.5 py-1.5 text-xs font-semibold transition-all ${
              activeTab === 'register'
                ? 'bg-[#1e3a8a] text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserPlus className="h-3.5 w-3.5" />
            Patient Demographic Intake Portal
          </button>
        </div>
      </div>

      {activeTab === 'registry' ? (
        <>
          <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-[#1e293b] p-4 shadow-sm">
            <div className="relative max-w-md flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search index via generated UHID code, name string, or contact matrix..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-900/50 py-2 pl-9 pr-4 text-xs text-slate-200 placeholder-slate-500 transition-colors focus:border-blue-500 focus:outline-none"
              />
            </div>
            <button
              type="button"
              className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-medium text-slate-200 transition-colors hover:bg-slate-700"
            >
              <RefreshCw className="h-3.5 w-3.5 text-slate-400" />
              Sync Registry
            </button>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-800 bg-[#1e293b] shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/40 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    <th className="px-6 py-4">UHID System ID</th>
                    <th className="px-6 py-4">Core Demographics</th>
                    <th className="px-6 py-4">Contact Matrix</th>
                    <th className="px-6 py-4">Next of Kin / Family Link</th>
                    <th className="px-6 py-4">Critical Medical Alerts</th>
                    <th className="px-6 py-4">Clinical Index</th>
                    <th className="px-6 py-4 text-right">Records Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-xs text-slate-300">
                  {filteredPatientList.map((patient) => (
                    <tr
                      key={patient.uhid}
                      className={`transition-colors hover:bg-slate-900/20 ${
                        patient.status === 'Deceased' ? 'bg-slate-950/20 opacity-60' : ''
                      }`}
                    >
                      <td className="px-6 py-4 font-mono font-bold tracking-wide text-blue-400">
                        {patient.uhid}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-white">
                          {patient.firstName} {patient.lastName}
                        </div>
                        <div className="mt-0.5 text-[10px] text-slate-400">
                          DOB: {patient.dob} ({patient.gender}) | Blood:{' '}
                          <span className="font-bold text-rose-400">{patient.bloodGroup}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>{patient.phone}</div>
                        <div className="max-w-xs truncate text-[10px] text-slate-500">
                          {patient.address}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-0.5">
                          {patient.familyMembers.map((member) => (
                            <span key={member} className="text-[11px] font-medium text-slate-400">
                              • {member}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {patient.medicalAlerts.map((alert) => (
                            <span
                              key={alert}
                              className="inline-flex items-center gap-1 rounded border border-rose-900/30 bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold text-rose-400"
                            >
                              <ShieldAlert className="h-2.5 w-2.5" />
                              {alert}
                            </span>
                          ))}
                          {patient.medicalAlerts.length === 0 && (
                            <span className="italic text-slate-600">No Alerts Logged</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`rounded px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${statusBadgeClass(patient.status)}`}
                        >
                          {patient.status}
                        </span>
                      </td>
                      <td className="space-x-1.5 whitespace-nowrap px-6 py-4 text-right">
                        <button
                          type="button"
                          className="rounded-md border border-slate-800 p-1.5 text-slate-400 transition-all hover:bg-slate-800 hover:text-white"
                          title="Modify Record File"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          className="rounded-md border border-slate-800 p-1.5 text-slate-400 transition-all hover:bg-slate-800 hover:text-white"
                          title="View Historical Clinical EMR"
                        >
                          <FileText className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          className="rounded-md border border-slate-800 p-1.5 text-slate-400 transition-all hover:bg-rose-950 hover:text-rose-400"
                          title="Archive Record"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredPatientList.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center italic text-slate-500">
                        No historical demographic indices matched the operational query keys.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <form
          onSubmit={handleRegisterPatient}
          className="mx-auto max-w-3xl space-y-6 rounded-xl border border-slate-800 bg-[#1e293b] p-6 shadow-sm"
        >
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white">Patient Demographic Intake Portal</h3>
            <p className="text-xs text-slate-400">
              Submitting this form initiates real-time hardware indexing and generates a secure UHID
              token.
            </p>
          </div>

          {(isGeneratingUhid || generatedUhid) && (
            <div className="rounded-xl border border-blue-900/40 bg-blue-500/10 p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-bold text-blue-300">
                {generatedUhid ? (
                  <Check className="h-4 w-4 text-emerald-400" />
                ) : (
                  <RefreshCw className="h-4 w-4 animate-spin text-blue-400" />
                )}
                Automated UHID Generation Simulator
              </div>
              <div className="space-y-2 font-mono text-[11px] text-slate-300">
                <p className={isGeneratingUhid && !generatedUhid ? 'text-cyan-400' : 'text-slate-500'}>
                  [1/3] Validating demographic payload checksum...
                </p>
                <p className={generatedUhid ? 'text-cyan-400' : 'text-slate-500'}>
                  [2/3] Allocating secure Nexora identity shard...
                </p>
                <p className={generatedUhid ? 'text-emerald-400' : 'text-slate-500'}>
                  [3/3] Issuing universal health identifier token
                  {generatedUhid ? `: ${generatedUhid}` : '...'}
                </p>
              </div>
              {generatedUhid && (
                <div className="mt-3 flex items-center gap-2 rounded-lg border border-emerald-900/30 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-300">
                  <ShieldCheck className="h-4 w-4" />
                  UHID committed to Core Registry — redirecting to master index...
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                First Name *
              </label>
              <input
                required
                type="text"
                value={formData.firstName}
                onChange={(event) => setFormData({ ...formData, firstName: event.target.value })}
                className="w-full rounded-lg border border-slate-800 bg-slate-900/60 p-2 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
                placeholder="e.g. Rahul"
                disabled={isGeneratingUhid}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                Last Name *
              </label>
              <input
                required
                type="text"
                value={formData.lastName}
                onChange={(event) => setFormData({ ...formData, lastName: event.target.value })}
                className="w-full rounded-lg border border-slate-800 bg-slate-900/60 p-2 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
                placeholder="e.g. Sharma"
                disabled={isGeneratingUhid}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                Date of Birth *
              </label>
              <input
                required
                type="date"
                value={formData.dob}
                onChange={(event) => setFormData({ ...formData, dob: event.target.value })}
                className="w-full rounded-lg border border-slate-800 bg-slate-900/60 p-2 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
                disabled={isGeneratingUhid}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                Gender Configuration *
              </label>
              <select
                value={formData.gender}
                onChange={(event) => setFormData({ ...formData, gender: event.target.value })}
                className="w-full rounded-lg border border-slate-800 bg-slate-900/60 p-2 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
                disabled={isGeneratingUhid}
              >
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                Contact Matrix Phone *
              </label>
              <input
                required
                type="tel"
                value={formData.phone}
                onChange={(event) => setFormData({ ...formData, phone: event.target.value })}
                placeholder="+91 XXXXX XXXXX"
                className="w-full rounded-lg border border-slate-800 bg-slate-900/60 p-2 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
                disabled={isGeneratingUhid}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                Blood Group Matrix
              </label>
              <select
                value={formData.bloodGroup}
                onChange={(event) => setFormData({ ...formData, bloodGroup: event.target.value })}
                className="w-full rounded-lg border border-slate-800 bg-slate-900/60 p-2 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
                disabled={isGeneratingUhid}
              >
                {BLOOD_GROUPS.map((group) => (
                  <option key={group} value={group}>
                    {group}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                Family Links / Next of Kin
              </label>
              <div className="relative">
                <UserMinus className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
                <input
                  type="text"
                  value={formData.familyMember}
                  onChange={(event) =>
                    setFormData({ ...formData, familyMember: event.target.value })
                  }
                  placeholder="e.g. Sunita Sharma (Spouse)"
                  className="w-full rounded-lg border border-slate-800 bg-slate-900/60 py-2 pl-9 pr-2 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
                  disabled={isGeneratingUhid}
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                Admission / Clinical Status State *
              </label>
              <select
                value={formData.status}
                onChange={(event) =>
                  setFormData({ ...formData, status: event.target.value as PatientStatus })
                }
                className="w-full rounded-lg border border-slate-800 bg-slate-900/60 p-2 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
                disabled={isGeneratingUhid}
              >
                {PATIENT_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1 sm:col-span-2">
              <label className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                Critical Medical Alerts / Allergies
              </label>
              <div className="relative">
                <AlertTriangle className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-rose-400" />
                <input
                  type="text"
                  value={formData.medicalAlert}
                  onChange={(event) =>
                    setFormData({ ...formData, medicalAlert: event.target.value })
                  }
                  placeholder="e.g. Penicillin Hypersensitivity, Acute Asthma"
                  className="w-full rounded-lg border border-slate-800 bg-slate-900/60 py-2 pl-9 pr-2 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
                  disabled={isGeneratingUhid}
                />
              </div>
            </div>
            <div className="space-y-1 sm:col-span-2">
              <label className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                Residential Address Statement
              </label>
              <textarea
                rows={2}
                value={formData.address}
                onChange={(event) => setFormData({ ...formData, address: event.target.value })}
                placeholder="Complete current verification address profile..."
                className="w-full resize-none rounded-lg border border-slate-800 bg-slate-900/60 p-2 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
                disabled={isGeneratingUhid}
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-slate-800 pt-4">
            <div className="flex items-center gap-2 text-[10px] text-slate-500">
              <Heart className="h-3.5 w-3.5 text-rose-400" />
              <span>Next of kin and alert fields propagate to EMR vault on commit.</span>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setActiveTab('registry')}
                className="px-4 py-2 text-xs font-semibold text-slate-400 transition-colors hover:text-slate-200"
                disabled={isGeneratingUhid}
              >
                Abort Action
              </button>
              <button
                type="submit"
                disabled={isGeneratingUhid}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Plus className="h-4 w-4" />
                Finalize Registry &amp; Issue UHID
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
