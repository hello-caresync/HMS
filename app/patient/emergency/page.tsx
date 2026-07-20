'use client';

import { useCallback, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Ambulance,
  CalendarDays,
  FileHeart,
  MapPin,
  Phone,
  Plus,
  ShieldAlert,
  Siren,
  User,
  Users,
} from 'lucide-react';

type SosStatus = 'SOS Idle' | 'SOS Triggered - Dispatching Alert' | 'Ambulance Requested';

type FamilyRelation = 'Parent' | 'Spouse' | 'Child' | 'Self';

type FamilyMemberProfile = {
  id: string;
  name: string;
  relation: FamilyRelation;
  patientId: string;
  age: string;
  bloodGroup: string;
  medicalRecordRef: string;
  nextAppointment: string;
  recordAlert?: string;
};

type EmergencyContact = {
  id: string;
  name: string;
  relation: string;
  phone: string;
  verified: boolean;
};

type FamilyOperationalItem = {
  id: string;
  member: string;
  type: 'Appointment' | 'Medical Record Alert';
  detail: string;
  timestamp: string;
};

const VERIFIED_TAG =
  'bg-[#00A481]/10 text-[#00A481] border border-[#00A481]/20 font-bold px-2.5 py-0.5 rounded-full text-[10px]';

const PANEL_CLASS = 'rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm';

const FAMILY_CARD_CLASS =
  'rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm transition-all hover:border-[#008588]/30';

const SWITCH_PROFILE_CLASS =
  'mt-3 block w-full rounded-lg border border-[#008588]/10 bg-[#008588]/5 px-3 py-1.5 text-center text-xs font-bold text-[#008588] transition-colors hover:bg-[#008588]/10';

const PRIMARY_SELF: FamilyMemberProfile = {
  id: 'self',
  name: 'Aishwarya D S',
  relation: 'Self',
  patientId: 'ID_NEX_9021',
  age: '34 yrs',
  bloodGroup: 'B+',
  medicalRecordRef: 'MR-NEX-9021-A',
  nextAppointment: 'Cardiology Teleconsult · 16 Jul 2026 · 10:30 AM',
  recordAlert: 'HbA1c within target · last updated 12 Jul 2026',
};

const FAMILY_MEMBERS: FamilyMemberProfile[] = [
  PRIMARY_SELF,
  {
    id: 'fam-1',
    name: 'R. Srinivasan',
    relation: 'Spouse',
    patientId: 'ID_NEX_9022',
    age: '38 yrs',
    bloodGroup: 'O+',
    medicalRecordRef: 'MR-NEX-9022-B',
    nextAppointment: 'Dental Checkup · 15 Jul 2026 · 10:00 AM',
    recordAlert: 'Routine dental · no active alerts',
  },
  {
    id: 'fam-2',
    name: 'S. Lakshmi',
    relation: 'Parent',
    patientId: 'ID_NEX_9018',
    age: '62 yrs',
    bloodGroup: 'A+',
    medicalRecordRef: 'MR-NEX-9018-C',
    nextAppointment: 'General Medicine OPD · 20 Jul 2026 · 09:15 AM',
    recordAlert: 'Hypertension monitoring · medication adherence OK',
  },
  {
    id: 'fam-3',
    name: 'A. Arjun',
    relation: 'Child',
    patientId: 'ID_NEX_9041',
    age: '9 yrs',
    bloodGroup: 'B+',
    medicalRecordRef: 'MR-NEX-9041-D',
    nextAppointment: 'Pediatrics Follow-up · 22 Jul 2026 · 11:00 AM',
    recordAlert: 'Allergy Alert Updated · Penicillin sensitivity flagged',
  },
];

const EMERGENCY_CONTACTS: EmergencyContact[] = [
  {
    id: 'ec-1',
    name: 'R. Srinivasan',
    relation: 'Spouse · Primary Guardian',
    phone: '+91 97654 32109',
    verified: true,
  },
  {
    id: 'ec-2',
    name: 'S. Lakshmi',
    relation: 'Mother · Secondary Contact',
    phone: '+91 98450 11223',
    verified: true,
  },
  {
    id: 'ec-3',
    name: 'Nexora Emergency Desk',
    relation: 'Hospital · 24/7 Triage Line',
    phone: '+91 1800 266 9021',
    verified: true,
  },
];

const FAMILY_OPERATIONAL: FamilyOperationalItem[] = [
  {
    id: 'op-1',
    member: 'Spouse',
    type: 'Appointment',
    detail: 'Dental Checkup Tomorrow at 10:00 AM · Dr. Ananya Rao',
    timestamp: '15 Jul 2026',
  },
  {
    id: 'op-2',
    member: 'Child',
    type: 'Medical Record Alert',
    detail: 'Allergy Alert Updated · Penicillin sensitivity · guardian notified',
    timestamp: '13 Jul 2026',
  },
  {
    id: 'op-3',
    member: 'Self',
    type: 'Appointment',
    detail: 'Cardiology Teleconsult · 16 Jul 2026 · 10:30 AM · Dr. Rajesh Kumar',
    timestamp: '16 Jul 2026',
  },
  {
    id: 'op-4',
    member: 'Parent',
    type: 'Medical Record Alert',
    detail: 'Blood pressure log synced · within physician-defined range',
    timestamp: '12 Jul 2026',
  },
  {
    id: 'op-5',
    member: 'Child',
    type: 'Appointment',
    detail: 'Pediatrics Follow-up · 22 Jul 2026 · 11:00 AM',
    timestamp: '22 Jul 2026',
  },
];

const SOS_STATUS_STYLES: Record<SosStatus, string> = {
  'SOS Idle': 'border-slate-200/60 bg-white text-slate-700',
  'SOS Triggered - Dispatching Alert': 'border-rose-500/40 bg-rose-500/10 text-rose-800',
  'Ambulance Requested': 'border-amber-500/30 bg-amber-500/10 text-amber-900',
};

export default function PatientEmergencyPage() {
  const [sosStatus, setSosStatus] = useState<SosStatus>('SOS Idle');
  const [shareLiveLocation, setShareLiveLocation] = useState(false);
  const [activeProfileId, setActiveProfileId] = useState<string>(PRIMARY_SELF.id);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');

  const activeProfile = useMemo(
    () => FAMILY_MEMBERS.find((member) => member.id === activeProfileId) ?? PRIMARY_SELF,
    [activeProfileId],
  );

  const showNotice = useCallback((message: string) => {
    setActionNotice(message);
    window.setTimeout(() => setActionNotice(null), 4500);
  }, []);

  const handleSosTrigger = useCallback(() => {
    setSosStatus('SOS Triggered - Dispatching Alert');
    setShareLiveLocation(true);
    showNotice(
      'SOS alert dispatched · emergency desk notified · live location ping activated · sandbox mode',
    );
  }, [showNotice]);

  const handleAmbulanceRequest = useCallback(() => {
    setSosStatus('Ambulance Requested');
    setShareLiveLocation(true);
    showNotice('Ambulance dispatch requested · ETA tracking queued · sandbox coordination');
  }, [showNotice]);

  const handleResetSos = useCallback(() => {
    setSosStatus('SOS Idle');
    showNotice('Crisis console reset · SOS standing down · sandbox confirmation');
  }, [showNotice]);

  const handleSwitchProfile = useCallback(
    (memberId: string) => {
      setActiveProfileId(memberId);
      const member = FAMILY_MEMBERS.find((m) => m.id === memberId);
      showNotice(`Profile context switched · ${member?.name ?? 'Member'} · sandbox dashboard view`);
    },
    [showNotice],
  );

  const handleCallContact = useCallback(
    (contact: EmergencyContact) => {
      showNotice(`Dialing ${contact.name} · ${contact.phone} · sandbox telephony bridge`);
    },
    [showNotice],
  );

  const handleAddMember = useCallback(() => {
    const name = newMemberName.trim();
    if (!name) return;
    setShowAddMember(false);
    setNewMemberName('');
    showNotice(`Family member invite queued · ${name} · pending guardian verification`);
  }, [newMemberName, showNotice]);

  return (
    <div className="min-h-screen w-full space-y-6 bg-slate-50/70 p-6 font-sans text-slate-950">
      {/* Logistical hub header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#00758C]">
            Emergency Dispatch Center &amp; Family Circle
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-600">
            24/7 care coordination · rapid monitoring updates · crisis dispatch bridge · family
            network sync · 14 Jul 2026
          </p>
        </div>
        <div
          className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-wide ${SOS_STATUS_STYLES[sosStatus]}`}
        >
          <Siren className="h-4 w-4" aria-hidden />
          {sosStatus}
        </div>
      </header>

      {actionNotice ? (
        <p className="rounded-xl border border-[#008588]/20 bg-[#008588]/5 px-4 py-2 text-sm font-bold text-[#008588]">
          {actionNotice}
        </p>
      ) : null}

      {/* Top high-alert interaction bar — SOS console */}
      <section
        aria-label="SOS emergency console"
        className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm"
      >
        <div className="mb-4 flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-rose-600" aria-hidden />
          <h2 className="text-base font-black text-[#00758C]">Crisis Response Console</h2>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-[auto_1fr_auto] md:items-center">
          <button
            type="button"
            onClick={handleSosTrigger}
            className="flex w-full animate-pulse cursor-pointer items-center justify-center gap-3 rounded-2xl bg-rose-600 px-8 py-4 text-lg font-black text-white shadow-lg transition-all hover:bg-rose-700 md:w-auto"
          >
            <Siren className="h-6 w-6" aria-hidden />
            🚨 TRIGGER SOS ALERT
          </button>

          <button
            type="button"
            onClick={handleAmbulanceRequest}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
          >
            <Ambulance className="h-4 w-4 text-[#008588]" aria-hidden />
            Ambulance Request
          </button>

          <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm md:justify-center">
            <div className="flex items-center gap-2">
              <MapPin
                className={`h-4 w-4 ${shareLiveLocation ? 'text-[#00A481]' : 'text-slate-400'}`}
                aria-hidden
              />
              <span className="text-sm font-bold text-slate-700">Share Live Location</span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={shareLiveLocation}
              onClick={() => {
                setShareLiveLocation((prev) => !prev);
                showNotice(
                  shareLiveLocation
                    ? 'Live location sharing stopped · sandbox tracking off'
                    : 'Live location ping active · external tracking enabled · sandbox mode',
                );
              }}
              className={`relative h-7 w-12 rounded-full transition-colors ${
                shareLiveLocation ? 'bg-[#00A481]' : 'bg-slate-300'
              }`}
            >
              <span
                className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
                  shareLiveLocation ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
        </div>

        {sosStatus !== 'SOS Idle' ? (
          <button
            type="button"
            onClick={handleResetSos}
            className="mt-4 text-xs font-bold text-[#008588] hover:underline"
          >
            Reset crisis console · stand down alert
          </button>
        ) : null}
      </section>

      {/* Active profile context banner */}
      <div className="rounded-xl border border-[#008588]/20 bg-[#008588]/5 px-4 py-3">
        <p className="text-[10px] font-black uppercase tracking-wider text-[#008588]">
          Active Profile Context
        </p>
        <p className="mt-1 text-sm font-black text-[#00758C]">
          {activeProfile.name} · {activeProfile.relation} · {activeProfile.patientId}
        </p>
        <p className="text-xs font-medium text-slate-600">
          Medical Record {activeProfile.medicalRecordRef} · Next: {activeProfile.nextAppointment}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,55fr)_minmax(0,45fr)]">
        {/* Left column — family network (55%) */}
        <section aria-label="Family members network" className={PANEL_CLASS}>
          <div className="mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-[#008588]" aria-hidden />
            <h2 className="text-lg font-black text-[#00758C]">Family Members Directory</h2>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {FAMILY_MEMBERS.map((member) => {
              const isActive = member.id === activeProfileId;

              return (
                <article
                  key={member.id}
                  className={`${FAMILY_CARD_CLASS} ${
                    isActive ? 'ring-2 ring-[#008588]/30 border-[#008588]/40' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#008588]/10">
                        <User className="h-5 w-5 text-[#008588]" aria-hidden />
                      </div>
                      <div>
                        <p className="text-sm font-black text-[#00758C]">{member.name}</p>
                        <p className="text-xs font-bold text-[#008588]">{member.relation}</p>
                      </div>
                    </div>
                    {isActive ? (
                      <span className={`inline-flex uppercase ${VERIFIED_TAG}`}>ACTIVE</span>
                    ) : null}
                  </div>

                  <dl className="mt-4 space-y-2 text-xs">
                    <div>
                      <dt className="font-bold uppercase tracking-wider text-slate-500">
                        Patient ID
                      </dt>
                      <dd className="font-mono font-black text-[#008588]">{member.patientId}</dd>
                    </div>
                    <div>
                      <dt className="font-bold uppercase tracking-wider text-slate-500">
                        Family Medical Records
                      </dt>
                      <dd className="flex flex-wrap items-center gap-2 font-medium text-slate-800">
                        {member.medicalRecordRef}
                        <span className={`inline-flex uppercase ${VERIFIED_TAG}`}>VERIFIED_RECORD</span>
                      </dd>
                    </div>
                    <div>
                      <dt className="font-bold uppercase tracking-wider text-slate-500">
                        Family Appointments
                      </dt>
                      <dd className="font-medium text-slate-700">{member.nextAppointment}</dd>
                    </div>
                    {member.recordAlert ? (
                      <div className="rounded-lg border border-[#5EC283]/30 bg-[#5EC283]/10 p-2">
                        <dt className="flex items-center gap-1 font-bold text-[#00758C]">
                          <AlertTriangle className="h-3 w-3" aria-hidden />
                          Record Flag
                        </dt>
                        <dd className="mt-0.5 text-[11px] font-medium text-slate-700">
                          {member.recordAlert}
                        </dd>
                      </div>
                    ) : null}
                  </dl>

                  {!isActive ? (
                    <button
                      type="button"
                      onClick={() => handleSwitchProfile(member.id)}
                      className={SWITCH_PROFILE_CLASS}
                    >
                      Switch to Profile
                    </button>
                  ) : (
                    <p className="mt-3 text-center text-xs font-bold text-[#00A481]">
                      Currently viewing this profile
                    </p>
                  )}
                </article>
              );
            })}

            {/* Add new family member */}
            <button
              type="button"
              onClick={() => setShowAddMember((prev) => !prev)}
              className="flex min-h-[200px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#008588]/30 bg-[#008588]/5 p-5 transition-all hover:border-[#008588]/50 hover:bg-[#008588]/10"
            >
              <Plus className="h-8 w-8 text-[#008588]" aria-hidden />
              <span className="mt-2 text-sm font-black text-[#00758C]">Add New Family Member</span>
              <span className="mt-1 text-xs font-medium text-slate-600">
                Invite dependent · guardian verification required
              </span>
            </button>
          </div>

          {showAddMember ? (
            <div className="mt-4 rounded-xl border border-slate-200/60 bg-slate-50/80 p-4">
              <label htmlFor="new-member-name" className="text-xs font-bold text-slate-700">
                Member full name
              </label>
              <div className="mt-2 flex gap-2">
                <input
                  id="new-member-name"
                  type="text"
                  value={newMemberName}
                  onChange={(event) => setNewMemberName(event.target.value)}
                  placeholder="Enter family member name…"
                  className="flex-1 rounded-xl border border-slate-200/80 bg-white px-4 py-2.5 text-sm font-medium focus:border-[#008588]/30 focus:outline-none focus:ring-2 focus:ring-[#008588]/20"
                />
                <button
                  type="button"
                  onClick={handleAddMember}
                  className="rounded-xl bg-[#00758C] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#008588]"
                >
                  Send Invite
                </button>
              </div>
            </div>
          ) : null}
        </section>

        {/* Right column — contacts & operational summary (45%) */}
        <aside className="space-y-6">
          <section aria-label="Emergency contacts" className={PANEL_CLASS}>
            <div className="mb-4 flex items-center gap-2">
              <Phone className="h-5 w-5 text-[#008588]" aria-hidden />
              <h2 className="text-base font-black text-[#00758C]">Primary Emergency Contacts</h2>
            </div>
            <ul className="space-y-3">
              {EMERGENCY_CONTACTS.map((contact) => (
                <li
                  key={contact.id}
                  className="rounded-xl border border-slate-200/60 bg-slate-50/50 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-black text-[#00758C]">{contact.name}</p>
                      <p className="text-xs font-bold text-slate-600">{contact.relation}</p>
                    </div>
                    {contact.verified ? (
                      <span className={`inline-flex uppercase ${VERIFIED_TAG}`}>VERIFIED</span>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCallContact(contact)}
                    className="mt-3 inline-flex items-center gap-2 text-sm font-black text-[#00758C] hover:underline"
                  >
                    <Phone className="h-4 w-4" aria-hidden />
                    {contact.phone}
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section aria-label="Family operational summary" className={PANEL_CLASS}>
            <div className="mb-4 flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-[#008588]" aria-hidden />
              <h2 className="text-base font-black text-[#00758C]">Family Operational Summary</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[320px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200/80 bg-slate-50/80">
                    <th className="px-3 py-2 text-left text-[10px] font-black uppercase text-[#00758C]">
                      Member
                    </th>
                    <th className="px-3 py-2 text-left text-[10px] font-black uppercase text-[#00758C]">
                      Type
                    </th>
                    <th className="px-3 py-2 text-left text-[10px] font-black uppercase text-[#00758C]">
                      Detail
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {FAMILY_OPERATIONAL.map((item) => (
                    <tr key={item.id} className="border-b border-slate-200/60">
                      <td className="px-3 py-3 text-xs font-black text-[#00758C]">{item.member}</td>
                      <td className="px-3 py-3">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase ${
                            item.type === 'Appointment'
                              ? 'text-[#008588]'
                              : 'text-amber-800'
                          }`}
                        >
                          {item.type === 'Appointment' ? (
                            <CalendarDays className="h-3 w-3" aria-hidden />
                          ) : (
                            <FileHeart className="h-3 w-3" aria-hidden />
                          )}
                          {item.type}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <p className="text-xs font-medium text-slate-800">{item.detail}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-bold text-slate-500">{item.timestamp}</span>
                          <span className={`inline-flex uppercase ${VERIFIED_TAG}`}>VERIFIED_RECORD</span>
                        </div>
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
