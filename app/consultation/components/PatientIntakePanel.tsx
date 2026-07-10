'use client';

import type { ComponentType } from 'react';
import {
  Activity,
  AlertTriangle,
  Calendar,
  ClipboardList,
  Droplets,
  Heart,
  Mail,
  MapPin,
  Phone,
  Scale,
  ShieldAlert,
  Thermometer,
  User,
  Wind,
} from 'lucide-react';

import { useConsultation } from '../context/ConsultationProvider';
import { CLINICAL } from '../lib/theme';

export default function PatientIntakePanel() {
  const { encounter } = useConsultation();
  const { vitals, demographics, nurseAssessment, safetyAlerts } = encounter;

  const assessedTime = new Intl.DateTimeFormat('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(nurseAssessment.assessedAt));

  return (
    <aside className="space-y-2.5">
      {/* Demographics */}
      <section
        className="rounded-xl border p-3 shadow-sm"
        style={{ borderColor: CLINICAL.border, backgroundColor: CLINICAL.panel }}
      >
        <header className="mb-2.5 flex items-start justify-between gap-2">
          <div>
            <p
              className="font-mono text-[10px] font-bold tracking-wider"
              style={{ color: CLINICAL.mint }}
            >
              {encounter.uhid}
            </p>
            <h2 className="text-base font-bold" style={{ color: CLINICAL.text }}>
              {encounter.patientName}
            </h2>
            <p className="text-xs font-medium" style={{ color: CLINICAL.textMuted }}>
              {encounter.age}y · {encounter.gender} · {demographics.bloodGroup}
            </p>
          </div>
          <span
            className="shrink-0 rounded-lg px-2 py-1 font-mono text-[10px] font-bold"
            style={{ backgroundColor: CLINICAL.mintLight, color: CLINICAL.mint }}
          >
            {encounter.tokenNumber}
          </span>
        </header>

        <dl className="grid grid-cols-1 gap-1.5 text-[11px]">
          <DemoRow icon={Calendar} label="DOB" value={demographics.dateOfBirth} />
          <DemoRow icon={Phone} label="Phone" value={demographics.phone} />
          <DemoRow icon={Mail} label="Email" value={demographics.email} />
          <DemoRow icon={MapPin} label="Address" value={demographics.address} />
          <DemoRow icon={User} label="Emergency" value={demographics.emergencyContact} />
          {demographics.insuranceId && (
            <DemoRow icon={ShieldAlert} label="Insurance" value={demographics.insuranceId} />
          )}
        </dl>

        <p className="mt-2 text-[10px]" style={{ color: CLINICAL.textSubtle }}>
          {encounter.doctorName} · {encounter.department}
        </p>
      </section>

      {/* Patient Safety Alerts */}
      <section
        className="rounded-xl border-2 p-3"
        style={{
          borderColor: CLINICAL.alertBorder,
          backgroundColor: CLINICAL.alertBg,
        }}
      >
        <p
          className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider"
          style={{ color: CLINICAL.alert }}
        >
          <ShieldAlert className="h-3.5 w-3.5" />
          Patient Safety Alerts
        </p>
        <ul className="space-y-1.5">
          {safetyAlerts.map((alert) => (
            <li
              key={alert.id}
              className="flex items-start gap-2 rounded-lg border px-2.5 py-2"
              style={{
                borderColor: alert.severity === 'high' ? '#f0b8b8' : '#f5dcc0',
                backgroundColor: '#fff',
              }}
            >
              <AlertTriangle
                className="mt-0.5 h-3.5 w-3.5 shrink-0"
                style={{ color: alert.severity === 'high' ? CLINICAL.alert : '#c27803' }}
              />
              <div>
                <p className="text-[11px] font-semibold" style={{ color: CLINICAL.charcoal }}>
                  {alert.label}
                </p>
                <p className="text-[9px] font-bold uppercase tracking-wide text-rose-600">
                  {alert.severity} · {alert.type}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Nurse Assessment + Vitals */}
      <section
        className="rounded-xl border p-3 shadow-sm"
        style={{ borderColor: CLINICAL.border, backgroundColor: CLINICAL.panel }}
      >
        <header className="mb-2 flex items-center justify-between">
          <p
            className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider"
            style={{ color: CLINICAL.mint }}
          >
            <ClipboardList className="h-3.5 w-3.5" />
            Nurse Assessment
          </p>
          <span
            className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${
              nurseAssessment.triageLevel === 'Emergent'
                ? 'bg-rose-100 text-rose-700'
                : nurseAssessment.triageLevel === 'Urgent'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-emerald-100 text-emerald-700'
            }`}
          >
            {nurseAssessment.triageLevel}
          </span>
        </header>

        <p className="mb-2 text-xs font-medium leading-snug" style={{ color: CLINICAL.charcoal }}>
          {nurseAssessment.chiefComplaint}
        </p>
        <p className="mb-3 text-[10px] leading-relaxed" style={{ color: CLINICAL.textSubtle }}>
          {nurseAssessment.notes}
        </p>
        <p className="mb-2 text-[9px]" style={{ color: CLINICAL.textSubtle }}>
          {nurseAssessment.assessedBy} · {assessedTime} · Pain {nurseAssessment.painScore}/10
        </p>

        {/* Vitals grid */}
        <div
          className="rounded-lg border p-2"
          style={{ borderColor: CLINICAL.borderLight, backgroundColor: CLINICAL.mintSoft }}
        >
          <p
            className="mb-2 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider"
            style={{ color: CLINICAL.mint }}
          >
            <Activity className="h-3 w-3" />
            Captured Vitals
          </p>
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
            <VitalCell icon={Heart} label="BP" value={vitals.bp} unit="mmHg" highlight />
            <VitalCell icon={Activity} label="Pulse" value={String(vitals.pulse)} unit="bpm" />
            <VitalCell icon={Wind} label="SpO₂" value={String(vitals.spO2)} unit="%" alert={vitals.spO2 < 92} />
            <VitalCell icon={Thermometer} label="Temp" value={String(vitals.temp)} unit="°F" />
            <VitalCell icon={Scale} label="Weight" value={String(vitals.weight)} unit={vitals.weightUnit} />
          </div>
        </div>
      </section>

      {/* Medical history compact */}
      <section
        className="rounded-xl border p-3"
        style={{ borderColor: CLINICAL.border, backgroundColor: CLINICAL.panel }}
      >
        <p
          className="mb-1.5 text-[10px] font-bold uppercase tracking-wider"
          style={{ color: CLINICAL.textSubtle }}
        >
          Medical History
        </p>
        <ul className="space-y-1">
          {encounter.medicalHistory.map((item) => (
            <li
              key={item}
              className="flex gap-1.5 text-[11px] leading-snug"
              style={{ color: CLINICAL.textMuted }}
            >
              <Droplets className="mt-0.5 h-3 w-3 shrink-0" style={{ color: CLINICAL.mintAccent }} />
              {item}
            </li>
          ))}
        </ul>
      </section>
    </aside>
  );
}

function DemoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ className?: string; style?: React.CSSProperties }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex gap-2">
      <Icon className="mt-0.5 h-3 w-3 shrink-0" style={{ color: CLINICAL.textSubtle }} />
      <div className="min-w-0">
        <dt className="text-[9px] font-bold uppercase tracking-wide" style={{ color: CLINICAL.textSubtle }}>
          {label}
        </dt>
        <dd className="truncate font-medium" style={{ color: CLINICAL.charcoal }}>
          {value}
        </dd>
      </div>
    </div>
  );
}

function VitalCell({
  icon: Icon,
  label,
  value,
  unit,
  alert,
  highlight,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
  unit: string;
  alert?: boolean;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-lg px-2 py-1.5 ${
        alert ? 'bg-rose-50 ring-1 ring-rose-200' : highlight ? 'bg-white ring-1 ring-[#c8ebe0]' : 'bg-white/80'
      }`}
    >
      <p className="flex items-center gap-0.5 text-[9px] font-bold uppercase" style={{ color: CLINICAL.textSubtle }}>
        <Icon className="h-2.5 w-2.5" />
        {label}
      </p>
      <p
        className={`text-sm font-bold tabular-nums ${alert ? 'text-rose-700' : ''}`}
        style={{ color: alert ? undefined : CLINICAL.text }}
      >
        {value}
        <span className="ml-0.5 text-[9px] font-normal" style={{ color: CLINICAL.textSubtle }}>
          {unit}
        </span>
      </p>
    </div>
  );
}
