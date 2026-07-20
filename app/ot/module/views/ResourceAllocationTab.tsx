'use client';

import { useState } from 'react';
import { BedDouble, Package, Users } from 'lucide-react';

import type { OtRoom } from '../lib/otMockData';
import {
  MOCK_EQUIPMENT,
  MOCK_OT_ROOMS,
  MOCK_PREOP_CHECKLISTS,
  MOCK_SURGICAL_TEAMS,
} from '../lib/otMockData';
import {
  ChecklistPill,
  DrawerOverlay,
  OtPanel,
  OtRoomStatusPill,
  SecureIdentityPlaceholder,
  StatusPill,
} from '../components/otUi';

export default function ResourceAllocationTab() {
  const [drawerRoom, setDrawerRoom] = useState<OtRoom | null>(null);

  return (
    <div className="grid grid-cols-1 gap-2 xl:grid-cols-2">
      <div className="space-y-2">
        <OtPanel title="OT Room Availability Matrix" icon={BedDouble} subtitle="Occupied · cleaning · sterilization · maintenance">
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
            {MOCK_OT_ROOMS.map((room) => (
              <button
                key={room.id}
                type="button"
                onClick={() => setDrawerRoom(room)}
                className={`rounded border px-2 py-2 text-left hover:border-[#2563EB]/40 ${
                  room.status === 'Occupied' ? 'border-violet-200 bg-violet-50/50' : room.status === 'Maintenance' ? 'border-red-200 bg-red-50/30' : 'border-[#E2E8F0] bg-white'
                }`}
              >
                <p className="text-[10px] font-bold text-[#0F172A]">{room.roomLabel}</p>
                <p className="text-[8px] text-slate-500">{room.floor}</p>
                <OtRoomStatusPill status={room.status} />
                {room.patientName && <p className="mt-0.5 truncate text-[8px] text-slate-600">{room.patientName}</p>}
              </button>
            ))}
          </div>
        </OtPanel>

        <OtPanel title="Surgical Team Allocations" icon={Users} subtitle="Surgeon · assistant · anesthesia · nursing · tech">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-[#F8FAFC]">
                {['OT Room', 'Surgeon', 'Anesthesiologist', 'OT Nurse', 'Tech'].map((h) => (
                  <th key={h} className="px-1.5 py-1 text-[8px] font-bold uppercase text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MOCK_SURGICAL_TEAMS.map((t) => (
                <tr key={t.id} className="border-b border-slate-50">
                  <td className="px-1.5 py-1 text-[9px] font-semibold text-[#0F172A]">{t.otRoom}</td>
                  <td className="px-1.5 py-1 text-[8px] text-slate-600">{t.surgeon}<br /><span className="text-slate-400">{t.assistant}</span></td>
                  <td className="px-1.5 py-1 text-[8px] text-slate-600">{t.anesthesiologist}</td>
                  <td className="px-1.5 py-1 text-[8px] text-slate-600">{t.otNurse}</td>
                  <td className="px-1.5 py-1 text-[8px] text-slate-500">{t.technician}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </OtPanel>
      </div>

      <div className="space-y-2">
        <OtPanel title="Pre-Operative Checklist" subtitle="Patient ID · fasting · allergy · blood · implant · consent">
          <SecureIdentityPlaceholder verified />
          <table className="mt-2 w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-[#F8FAFC]">
                {['Patient', 'ID', 'Fasting', 'Allergy', 'Blood Bank', 'Implant'].map((h) => (
                  <th key={h} className="px-1.5 py-1 text-[8px] font-bold uppercase text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MOCK_PREOP_CHECKLISTS.map((c) => (
                <tr key={c.id} className="border-b border-slate-50">
                  <td className="px-1.5 py-1">
                    <p className="text-[9px] font-semibold">{c.patientName}</p>
                    {c.consentVerified && <span className="text-[7px] text-emerald-600">Consent Verified</span>}
                  </td>
                  <td className="px-1.5 py-1"><ChecklistPill status={c.patientId} /></td>
                  <td className="px-1.5 py-1"><ChecklistPill status={c.fasting} /></td>
                  <td className="px-1.5 py-1"><ChecklistPill status={c.allergy} /></td>
                  <td className="px-1.5 py-1"><ChecklistPill status={c.bloodBank} /></td>
                  <td className="px-1.5 py-1"><ChecklistPill status={c.implant} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </OtPanel>

        <OtPanel title="Equipment & Instrument Readiness" icon={Package} subtitle="Sterilization status · case assignment">
          <ul className="space-y-1">
            {MOCK_EQUIPMENT.map((eq) => (
              <li key={eq.id} className="flex items-center justify-between rounded border border-[#E2E8F0] px-2 py-1.5">
                <div>
                  <p className="text-[9px] font-semibold text-[#0F172A]">{eq.name}</p>
                  <p className="text-[8px] text-slate-500">{eq.otRoom} · Sterilized {eq.lastSterilized}</p>
                  {eq.assignedCase && <p className="text-[7px] text-[#2563EB]">{eq.assignedCase}</p>}
                </div>
                <StatusPill status={eq.status} />
              </li>
            ))}
          </ul>
        </OtPanel>
      </div>

      {drawerRoom && (
        <DrawerOverlay title={`${drawerRoom.roomLabel} — Detail`} onClose={() => setDrawerRoom(null)}>
          <dl className="space-y-2 text-[10px]">
            <div><dt className="text-slate-400">Floor</dt><dd className="font-semibold">{drawerRoom.floor}</dd></div>
            <div><dt className="text-slate-400">Status</dt><dd><OtRoomStatusPill status={drawerRoom.status} /></dd></div>
            {drawerRoom.currentCase && (
              <>
                <div><dt className="text-slate-400">Active Case</dt><dd className="font-mono text-[#2563EB]">{drawerRoom.currentCase}</dd></div>
                <div><dt className="text-slate-400">Patient</dt><dd>{drawerRoom.patientName ?? '—'}</dd></div>
                <div><dt className="text-slate-400">Team Lead</dt><dd>{drawerRoom.teamLead ?? '—'}</dd></div>
              </>
            )}
            <SecureIdentityPlaceholder verified />
          </dl>
        </DrawerOverlay>
      )}
    </div>
  );
}
