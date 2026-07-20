'use client';

import { useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowRightLeft,
  HeartPulse,
  LayoutGrid,
  Pill,
  Users,
} from 'lucide-react';

import type { RoomType } from '../ipdNav.types';
import type { PatientMovement } from '../lib/ipdMockData';
import {
  MOCK_BED_ASSETS,
  MOCK_CARE_ALERTS,
  MOCK_DIET_ORDERS,
  MOCK_MED_CHECKS,
  MOCK_NURSE_ASSIGNMENTS,
  MOCK_SHIFT_HANDOVERS,
  MOCK_VITALS,
  formatDateTime,
} from '../lib/ipdMockData';
import { BedStatusPill, IpdPanel, MovementStatusPill, StatusPill, VitalCompliancePill } from '../components/ipdUi';

const ROOM_TYPES: RoomType[] = ['General', 'Semi-Private', 'Private', 'Isolation'];

const BED_STYLES: Record<string, string> = {
  Occupied: 'bg-indigo-50 border-indigo-200 text-indigo-900',
  Available: 'bg-emerald-50 border-emerald-200 text-emerald-900',
  Reserved: 'bg-amber-50 border-amber-200 text-amber-900',
  Cleaning: 'bg-slate-100 border-slate-200 text-slate-600',
};

type WardCapacityTabProps = {
  movements: PatientMovement[];
  onAdvanceMovement: (id: string) => void;
};

export default function WardCapacityTab({ movements, onAdvanceMovement }: WardCapacityTabProps) {
  const [roomFilter, setRoomFilter] = useState<RoomType | 'All'>('All');

  const bedsByType = useMemo(() => {
    const grouped: Record<RoomType, typeof MOCK_BED_ASSETS> = {
      General: [],
      'Semi-Private': [],
      Private: [],
      Isolation: [],
    };
    MOCK_BED_ASSETS.forEach((b) => grouped[b.roomType].push(b));
    return grouped;
  }, []);

  const visibleTypes = roomFilter === 'All' ? ROOM_TYPES : [roomFilter];

  return (
    <div className="space-y-3">
      <IpdPanel
        title="Bed Occupancy Map"
        subtitle="General · semi-private · private · isolation — real-time asset matrix"
        icon={LayoutGrid}
        headerRight={
          <div className="flex flex-wrap gap-1">
            {(['All', ...ROOM_TYPES] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setRoomFilter(t)}
                className={`rounded px-2 py-0.5 text-[8px] font-bold uppercase ${
                  roomFilter === t ? 'bg-[#0F172A] text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        }
      >
        <div className="mb-2 flex flex-wrap gap-2">
          {(['Occupied', 'Available', 'Reserved', 'Cleaning'] as const).map((s) => (
            <BedStatusPill key={s} status={s} />
          ))}
        </div>
        <div className="space-y-3">
          {visibleTypes.map((type) => (
            <div key={type}>
              <p className="mb-1 text-[9px] font-bold uppercase text-[#0F172A]">{type} Rooms · {bedsByType[type].length} beds</p>
              <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-5 md:grid-cols-6">
                {bedsByType[type].map((bed) => (
                  <div key={bed.id} className={`rounded border px-1.5 py-1.5 text-center ${BED_STYLES[bed.status]}`}>
                    <p className="text-[10px] font-bold">{bed.label}</p>
                    <p className="text-[7px] opacity-80">{bed.ward}</p>
                    <BedStatusPill status={bed.status} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </IpdPanel>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-12">
        <div className="space-y-3 xl:col-span-7">
          <IpdPanel title="Nurse Assignments" icon={Users} subtitle="Station · shift · patient load">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-[#F8FAFC]">
                  {['Nurse', 'Station', 'Ward', 'Shift', 'Patients'].map((h) => (
                    <th key={h} className="px-2 py-1 text-[8px] font-bold uppercase text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MOCK_NURSE_ASSIGNMENTS.map((n) => (
                  <tr key={n.id} className="border-b border-slate-50">
                    <td className="px-2 py-1 text-[10px] font-semibold text-[#0F172A]">{n.nurseName}</td>
                    <td className="px-2 py-1 text-[9px] text-slate-600">{n.station}</td>
                    <td className="px-2 py-1 text-[9px] text-slate-600">{n.ward}</td>
                    <td className="px-2 py-1 text-[8px] text-slate-500">{n.shift}</td>
                    <td className="px-2 py-1 text-[10px] font-bold tabular-nums text-[#2563EB]">{n.patientsAssigned}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </IpdPanel>

          <IpdPanel title="Shift Handovers" icon={Activity} subtitle="Active nursing shift transitions">
            <ul className="space-y-1">
              {MOCK_SHIFT_HANDOVERS.map((h) => (
                <li key={h.id} className="flex items-center justify-between rounded border border-[#E2E8F0] px-2 py-1.5">
                  <span className="text-[9px] text-[#0F172A]">
                    <strong>{h.ward}</strong> · {h.fromNurse} → {h.toNurse}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[8px] text-slate-400">{h.pendingTasks} tasks</span>
                    <StatusPill status={h.status} />
                  </div>
                </li>
              ))}
            </ul>
          </IpdPanel>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <IpdPanel title="Medication Administration" icon={Pill} className="min-h-0">
              <ul className="space-y-1">
                {MOCK_MED_CHECKS.map((m) => (
                  <li key={m.id} className="flex items-center justify-between rounded border border-slate-100 px-2 py-1">
                    <div>
                      <p className="text-[9px] font-semibold text-[#0F172A]">{m.patientName}</p>
                      <p className="text-[8px] text-slate-500">{m.medication} · {m.scheduledTime}</p>
                    </div>
                    <StatusPill status={m.status} />
                  </li>
                ))}
              </ul>
            </IpdPanel>

            <IpdPanel title="Vital Sign Records" icon={HeartPulse}>
              <ul className="space-y-1">
                {MOCK_VITALS.map((v) => (
                  <li key={v.id} className="rounded border border-slate-100 px-2 py-1">
                    <div className="flex items-center justify-between">
                      <p className="text-[9px] font-semibold text-[#0F172A]">{v.patientName}</p>
                      <VitalCompliancePill status={v.compliance} />
                    </div>
                    <p className="text-[8px] text-slate-500">
                      BP {v.bp} · P {v.pulse} · T {v.temp} · SpO₂ {v.spo2} · {v.lastRecorded}
                    </p>
                  </li>
                ))}
              </ul>
            </IpdPanel>
          </div>
        </div>

        <div className="space-y-3 xl:col-span-5">
          <IpdPanel title="Care Coordination Alerts" icon={AlertTriangle} subtitle="Fall risk · infection control · diet orders">
            <ul className="mb-2 space-y-1">
              {MOCK_CARE_ALERTS.map((a) => (
                <li key={a.id} className="rounded border border-l-4 border-l-red-400 border-[#E2E8F0] px-2 py-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-[9px] font-bold text-[#0F172A]">{a.patientName} — {a.type}</p>
                      <p className="text-[8px] text-slate-600">{a.detail}</p>
                    </div>
                    <StatusPill status={a.severity} />
                  </div>
                  <StatusPill status={a.status} />
                </li>
              ))}
            </ul>
            <p className="mb-1 text-[8px] font-bold uppercase text-slate-400">Diet Order Status</p>
            <ul className="space-y-1">
              {MOCK_DIET_ORDERS.map((d) => (
                <li key={d.id} className="flex items-center justify-between rounded bg-[#F8FAFC] px-2 py-1">
                  <span className="text-[9px] text-[#0F172A]">{d.patientName} · {d.dietType} · {d.mealSlot}</span>
                  <StatusPill status={d.status} />
                </li>
              ))}
            </ul>
          </IpdPanel>

          <IpdPanel title="Patient Movement Tracker" icon={ArrowRightLeft} subtitle="OT · diagnostic · ICU · ward transfers">
            <ul className="space-y-1.5">
              {movements.map((m) => (
                <li key={m.id} className="rounded border border-[#E2E8F0] px-2 py-1.5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-[10px] font-semibold text-[#0F172A]">{m.patientName}</p>
                      <p className="text-[8px] font-medium text-violet-700">{m.type}</p>
                      <p className="text-[8px] text-slate-500">
                        {m.fromLocation} → {m.toLocation}
                      </p>
                      <p className="text-[8px] text-slate-400">{formatDateTime(m.scheduledAt)}</p>
                    </div>
                    <button type="button" onClick={() => onAdvanceMovement(m.id)} title="Advance movement status">
                      <MovementStatusPill status={m.status} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </IpdPanel>
        </div>
      </div>
    </div>
  );
}
