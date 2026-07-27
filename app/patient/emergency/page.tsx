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

import { PatientHeaderBadge, PatientStatusBanner } from '@/components/patient/PatientStatusBanner';
import { formatSosHeaderBadge, patientToastCopy } from '@/lib/patient/status-copy';

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
  'inline-flex rounded-full border border-patient-primary/40 bg-patient-card px-2.5 py-0.5 text-xs font-semibold tracking-wide text-[#15803d]';

const PANEL_CLASS = 'rounded-2xl border border-patient-lavender/30 bg-white p-6 shadow-sm';

const FAMILY_CARD_CLASS =
  'rounded-2xl border border-patient-lavender/30 bg-white p-5 shadow-sm transition-all hover:border-patient-lavender/30';

const SWITCH_PROFILE_CLASS =
  'mt-3 block w-full rounded-lg border border-patient-primary/10 bg-patient-card px-3 py-1.5 text-center text-xs font-bold text-patient-primary transition-colors hover:bg-patient-lavender/25';

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
    showNotice(patientToastCopy.emergencyDispatchNotified);
  }, [showNotice]);

  const handleAmbulanceRequest = useCallback(() => {
    setSosStatus('Ambulance Requested');
    setShareLiveLocation(true);
    showNotice(patientToastCopy.ambulanceRequested);
  }, [showNotice]);

  const handleResetSos = useCallback(() => {
    setSosStatus('SOS Idle');
    showNotice(patientToastCopy.sosReset);
  }, [showNotice]);

  const handleSwitchProfile = useCallback(
    (memberId: string) => {
      setActiveProfileId(memberId);
      const member = FAMILY_MEMBERS.find((m) => m.id === memberId);
      showNotice(patientToastCopy.profileSwitched(member?.name ?? 'Member'));
    },
    [showNotice],
  );

  const handleCallContact = useCallback(
    (contact: EmergencyContact) => {
      showNotice(patientToastCopy.contactDialing(contact.name));
    },
    [showNotice],
  );

  const handleAddMember = useCallback(() => {
    const name = newMemberName.trim();
    if (!name) return;
    setShowAddMember(false);
    setNewMemberName('');
    showNotice(patientToastCopy.familyInviteQueued(name));
  }, [newMemberName, showNotice]);

  const sosHeaderBadge = useMemo(() => formatSosHeaderBadge(sosStatus), [sosStatus]);

  return (
    <div className="min-h-screen w-full space-y-6 bg-patient-canvas p-6 font-sans text-patient-charcoal">
      {/* Logistical hub header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-patient-plum">
            Emergency Dispatch Center &amp; Family Circle
          </h1>
          <p className="mt-1 text-sm font-medium text-patient-lavender">
            24/7 care coordination · rapid monitoring updates · crisis dispatch bridge · family
            network sync · 14 Jul 2026
          </p>
        </div>
        <PatientHeaderBadge
          label={sosHeaderBadge.label}
          tone={sosHeaderBadge.tone}
          icon={Siren}
        />
      </header>

      {actionNotice ? (
        <PatientStatusBanner
          message={actionNotice}
          variant={sosStatus === 'SOS Idle' ? 'info' : 'warning'}
        />
      ) : null}

      {/* Top high-alert interaction bar — SOS console */}
      <section
        aria-label="SOS emergency console"
        className="rounded-2xl border border-patient-lavender/30 bg-white p-5 shadow-sm"
      >
        <div className="mb-4 flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-rose-600" aria-hidden />
          <h2 className="text-base font-black text-patient-plum">Crisis Response Console</h2>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-[auto_1fr_auto] md:items-center">
          <button
            type="button"
            onClick={handleSosTrigger}
            className="flex w-full animate-pulse cursor-pointer items-center justify-center gap-3 rounded-2xl bg-[#e63946] px-8 py-4 text-lg font-black text-white shadow-lg transition-all hover:bg-[#d62839] md:w-auto"
          >
            <Siren className="h-6 w-6" aria-hidden />
            🚨 TRIGGER SOS ALERT
          </button>

          <button
            type="button"
            onClick={handleAmbulanceRequest}
            className="flex items-center justify-center gap-2 rounded-xl border border-patient-lavender/20 200 bg-white px-4 py-3 text-sm font-bold text-patient-charcoal shadow-sm transition-colors hover:bg-patient-lavender/10"
          >
            <Ambulance className="h-4 w-4 text-patient-primary" aria-hidden />
            Ambulance Request
          </button>

          <div className="flex items-center justify-between gap-4 rounded-xl border border-patient-lavender/20 200 bg-white px-4 py-3 shadow-sm md:justify-center">
            <div className="flex items-center gap-2">
              <MapPin
                className={`h-4 w-4 ${shareLiveLocation ? 'text-patient-primary' : 'text-slate-400'}`}
                aria-hidden
              />
              <span className="text-sm font-bold text-patient-charcoal">Share Live Location</span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={shareLiveLocation}
              onClick={() => {
                setShareLiveLocation((prev) => !prev);
                showNotice(
                  shareLiveLocation
                    ? patientToastCopy.locationSharingOff
                    : patientToastCopy.locationSharingOn,
                );
              }}
              className={`relative h-7 w-12 rounded-full transition-colors ${
                shareLiveLocation ? 'bg-patient-primary' : 'bg-slate-300'
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
            className="mt-4 text-xs font-bold text-patient-primary hover:underline"
          >
            Reset crisis console · stand down alert
          </button>
        ) : null}
      </section>

      {/* Active profile context banner */}
      <div className="rounded-xl border border-patient-lavender/30 bg-patient-card px-4 py-3">
        <p className="text-[10px] font-black uppercase tracking-wider text-patient-primary">
          Active Profile Context
        </p>
        <p className="mt-1 text-sm font-black text-patient-plum">
          {activeProfile.name} · {activeProfile.relation} · {activeProfile.patientId}
        </p>
        <p className="text-xs font-medium text-patient-lavender">
          Medical Record {activeProfile.medicalRecordRef} · Next: {activeProfile.nextAppointment}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,55fr)_minmax(0,45fr)]">
        {/* Left column — family network (55%) */}
        <section aria-label="Family members network" className={PANEL_CLASS}>
          <div className="mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-patient-primary" aria-hidden />
            <h2 className="text-lg font-black text-patient-plum">Family Members Directory</h2>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {FAMILY_MEMBERS.map((member) => {
              const isActive = member.id === activeProfileId;

              return (
                <article
                  key={member.id}
                  className={`${FAMILY_CARD_CLASS} ${
                    isActive ? 'ring-2 ring-[#572E54]/30 border-patient-primary/40' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-patient-card">
                        <User className="h-5 w-5 text-patient-primary" aria-hidden />
                      </div>
                      <div>
                        <p className="text-sm font-black text-patient-plum">{member.name}</p>
                        <p className="text-xs font-bold text-patient-primary">{member.relation}</p>
                      </div>
                    </div>
                    {isActive ? (
                      <span className={`inline-flex uppercase ${VERIFIED_TAG}`}>ACTIVE</span>
                    ) : null}
                  </div>

                  <dl className="mt-4 space-y-2 text-xs">
                    <div>
                      <dt className="font-bold uppercase tracking-wider text-patient-lavender">
                        Patient ID
                      </dt>
                      <dd className="font-mono font-black text-patient-primary">{member.patientId}</dd>
                    </div>
                    <div>
                      <dt className="font-bold uppercase tracking-wider text-patient-lavender">
                        Family Medical Records
                      </dt>
                      <dd className="flex flex-wrap items-center gap-2 font-medium text-patient-text">
                        {member.medicalRecordRef}
                        <span className={`inline-flex uppercase ${VERIFIED_TAG}`}>VERIFIED_RECORD</span>
                      </dd>
                    </div>
                    <div>
                      <dt className="font-bold uppercase tracking-wider text-patient-lavender">
                        Family Appointments
                      </dt>
                      <dd className="font-medium text-patient-charcoal">{member.nextAppointment}</dd>
                    </div>
                    {member.recordAlert ? (
                      <div className="rounded-lg border border-patient-primary/30 bg-patient-card p-2">
                        <dt className="flex items-center gap-1 font-bold text-patient-plum">
                          <AlertTriangle className="h-3 w-3" aria-hidden />
                          Record Flag
                        </dt>
                        <dd className="mt-0.5 text-[11px] font-medium text-patient-charcoal">
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
                    <p className="mt-3 text-center text-xs font-bold text-patient-primary">
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
              className="flex min-h-[200px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-patient-lavender/30 bg-patient-card p-5 transition-all hover:border-patient-primary/50 hover:bg-patient-lavender/25"
            >
              <Plus className="h-8 w-8 text-patient-primary" aria-hidden />
              <span className="mt-2 text-sm font-black text-patient-plum">Add New Family Member</span>
              <span className="mt-1 text-xs font-medium text-patient-lavender">
                Invite dependent · guardian verification required
              </span>
            </button>
          </div>

          {showAddMember ? (
            <div className="mt-4 rounded-xl border border-patient-lavender/30 bg-patient-lavender/10/80 p-4">
              <label htmlFor="new-member-name" className="text-xs font-bold text-patient-charcoal">
                Member full name
              </label>
              <div className="mt-2 flex gap-2">
                <input
                  id="new-member-name"
                  type="text"
                  value={newMemberName}
                  onChange={(event) => setNewMemberName(event.target.value)}
                  placeholder="Enter family member name…"
                  className="flex-1 rounded-xl border border-patient-lavender/30 bg-white px-4 py-2.5 text-sm font-medium focus:border-patient-lavender/30 focus:outline-none focus:ring-2 focus:ring-[#572E54]/20"
                />
                <button
                  type="button"
                  onClick={handleAddMember}
                  className="rounded-xl bg-patient-primary px-4 py-2.5 text-sm font-bold text-white hover:bg-patient-plum"
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
              <Phone className="h-5 w-5 text-patient-primary" aria-hidden />
              <h2 className="text-base font-black text-patient-plum">Primary Emergency Contacts</h2>
            </div>
            <ul className="space-y-3">
              {EMERGENCY_CONTACTS.map((contact) => (
                <li
                  key={contact.id}
                  className="rounded-xl border border-patient-lavender/30 bg-patient-lavender/10/50 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-black text-patient-plum">{contact.name}</p>
                      <p className="text-xs font-bold text-patient-lavender">{contact.relation}</p>
                    </div>
                    {contact.verified ? (
                      <span className={`inline-flex uppercase ${VERIFIED_TAG}`}>VERIFIED</span>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCallContact(contact)}
                    className="mt-3 inline-flex items-center gap-2 text-sm font-black text-patient-plum hover:underline"
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
              <CalendarDays className="h-5 w-5 text-patient-primary" aria-hidden />
              <h2 className="text-base font-black text-patient-plum">Family Operational Summary</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[320px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-patient-lavender/30 bg-patient-lavender/10/80">
                    <th className="px-3 py-2 text-left text-[10px] font-black uppercase text-patient-plum">
                      Member
                    </th>
                    <th className="px-3 py-2 text-left text-[10px] font-black uppercase text-patient-plum">
                      Type
                    </th>
                    <th className="px-3 py-2 text-left text-[10px] font-black uppercase text-patient-plum">
                      Detail
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {FAMILY_OPERATIONAL.map((item) => (
                    <tr key={item.id} className="border-b border-patient-lavender/30">
                      <td className="px-3 py-3 text-xs font-black text-patient-plum">{item.member}</td>
                      <td className="px-3 py-3">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase ${
                            item.type === 'Appointment'
                              ? 'text-patient-primary'
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
                        <p className="text-xs font-medium text-patient-text">{item.detail}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-bold text-patient-lavender">{item.timestamp}</span>
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
