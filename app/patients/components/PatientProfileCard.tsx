'use client';

import { Calendar, Droplet, Mail, Phone, User } from 'lucide-react';

import { calculateAgeFromDob, formatPatientName } from '../lib/uhid';
import type { PatientRecord } from '../types';

type PatientProfileCardProps = {
  record: PatientRecord;
  onSelect?: (record: PatientRecord) => void;
};

export default function PatientProfileCard({ record, onSelect }: PatientProfileCardProps) {
  const { profile, insurance, emergencyContact } = record;
  const age = profile.isTemporary
    ? profile.estimatedAge
    : calculateAgeFromDob(profile.dob);

  return (
    <article
      className={`rounded-xl border bg-white p-3 shadow-xs transition hover:shadow-md ${
        profile.isTemporary ? 'border-amber-200 ring-1 ring-amber-100' : 'border-slate-200'
      } ${onSelect ? 'cursor-pointer' : ''}`}
      onClick={() => onSelect?.(record)}
      onKeyDown={(e) => e.key === 'Enter' && onSelect?.(record)}
      role={onSelect ? 'button' : undefined}
      tabIndex={onSelect ? 0 : undefined}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-mono text-[11px] font-semibold text-primary">{profile.uhid}</p>
          <h3 className="truncate text-sm font-semibold text-slate-900">
            {formatPatientName(profile)}
          </h3>
        </div>
        {profile.isTemporary && (
          <span className="shrink-0 rounded-md bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-800">
            Temp
          </span>
        )}
      </div>

      <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-slate-800">
        <span className="flex items-center gap-1">
          <User className="h-3 w-3 text-slate-800" />
          {profile.gender}
          {age != null && ` · ${age}y`}
        </span>
        <span className="flex items-center gap-1">
          <Droplet className="h-3 w-3 text-slate-800" />
          {profile.bloodGroup}
        </span>
        <span className="flex items-center gap-1 col-span-2">
          <Phone className="h-3 w-3 text-slate-800" />
          {profile.phone}
        </span>
        {profile.email && (
          <span className="flex items-center gap-1 col-span-2 truncate">
            <Mail className="h-3 w-3 shrink-0 text-slate-800" />
            {profile.email}
          </span>
        )}
        {profile.dob && (
          <span className="flex items-center gap-1 col-span-2">
            <Calendar className="h-3 w-3 text-slate-800" />
            DOB {profile.dob}
          </span>
        )}
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5 border-t border-slate-200 pt-2">
        <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-800">
          {insurance?.billingType ?? 'Self'}
        </span>
        {emergencyContact && (
          <span className="rounded-md bg-sky-50 px-1.5 py-0.5 text-[10px] text-sky-700">
            NOK: {emergencyContact.contactName}
          </span>
        )}
      </div>
    </article>
  );
}
