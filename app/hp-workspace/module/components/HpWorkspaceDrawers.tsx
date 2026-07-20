'use client';

import type { ActivePatientSummary } from '../lib/hpWorkspaceMockData';
import { MEDICAL_HISTORY, MEDICAL_ORDERS, PRESCRIPTIONS } from '../lib/hpWorkspaceMockData';
import { DrawerOverlay, SecureIdentityPlaceholder } from './hpWorkspaceUi';

type EmrShortcutDrawerProps = {
  patient: ActivePatientSummary;
  onClose: () => void;
};

export function EmrShortcutDrawer({ patient, onClose }: EmrShortcutDrawerProps) {
  const history = MEDICAL_HISTORY[patient.id] ?? [];
  const orders = MEDICAL_ORDERS.filter((o) => patient.id === 'pt-1' || patient.id === 'pt-2');
  const rx = PRESCRIPTIONS.filter((_, i) => (patient.id === 'pt-1' ? i < 2 : i >= 2));

  return (
    <DrawerOverlay title="EMR Shortcut — Read Only" subtitle={`${patient.name} · ${patient.uhid}`} onClose={onClose}>
      <SecureIdentityPlaceholder verified={patient.identityVerified} />
      <div className="mt-3 space-y-2">
        <div className="rounded-md border border-[#E2E8F0] bg-[#F8FAFC] p-2">
          <p className="text-[9px] font-bold uppercase text-slate-500">Demographics</p>
          <p className="text-[11px] font-semibold text-[#0F172A]">{patient.name}</p>
          <p className="text-[9px] text-slate-600">{patient.age}y · {patient.gender} · {patient.ward}</p>
          <p className="text-[9px] text-slate-600">Attending: {patient.attendingPhysician}</p>
          <p className="text-[9px] text-slate-600">Dx: {patient.diagnosis}</p>
        </div>
        {patient.allergies.length > 0 && (
          <div className="rounded-md border border-red-200 bg-red-50 p-2">
            <p className="text-[9px] font-bold uppercase text-red-700">Allergy Alerts</p>
            <p className="text-[10px] font-semibold text-red-800">{patient.allergies.join(' · ')}</p>
          </div>
        )}
        <div>
          <p className="mb-1 text-[9px] font-bold uppercase text-slate-500">Medical History Timeline</p>
          <ul className="space-y-1">
            {history.map((e) => (
              <li key={e.id} className="rounded border border-slate-100 px-2 py-1 text-[9px]">
                <span className="font-bold text-[#2563EB]">{e.date}</span> · {e.type} — {e.summary}
                <span className="block text-[8px] text-slate-500">{e.provider}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mb-1 text-[9px] font-bold uppercase text-slate-500">Active Prescriptions</p>
          {rx.map((p) => (
            <div key={p.id} className="mb-1 rounded border border-slate-100 px-2 py-1 text-[9px]">
              <span className="font-semibold">{p.medication}</span> {p.dosage} · {p.frequency}
              <span className={`ml-1 rounded px-1 text-[7px] font-bold uppercase ${p.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-sky-100 text-sky-800'}`}>{p.status}</span>
            </div>
          ))}
        </div>
        <div>
          <p className="mb-1 text-[9px] font-bold uppercase text-slate-500">Medical Orders</p>
          {orders.slice(0, 3).map((o) => (
            <div key={o.id} className="mb-1 rounded border border-slate-100 px-2 py-1 text-[9px]">
              {o.orderType}: {o.details}
              <span className="block text-[8px] text-slate-500">{o.status} · {o.priority}</span>
            </div>
          ))}
        </div>
        <p className="text-[8px] italic text-slate-400">Read-only EMR view — full chart access via EMR module</p>
      </div>
    </DrawerOverlay>
  );
}

type MessageThreadDrawerProps = {
  channel: string;
  lastMessage: string;
  participants: string;
  onClose: () => void;
};

export function MessageThreadDrawer({ channel, lastMessage, participants, onClose }: MessageThreadDrawerProps) {
  return (
    <DrawerOverlay title={channel} subtitle={participants} onClose={onClose}>
      <div className="space-y-2">
        <div className="rounded-md border border-slate-100 bg-[#F8FAFC] p-2 text-[10px]">
          <p className="font-semibold text-[#0F172A]">Latest</p>
          <p className="mt-1 text-slate-700">{lastMessage}</p>
        </div>
        <div className="space-y-1">
          {[
            { from: 'Dr. Meera Iyer', msg: 'Trauma bay activated — neuro consult requested', time: '08:10' },
            { from: 'ICU Charge', msg: 'Bed 4 prepped for post-op transfer', time: '08:05' },
            { from: 'Blood Bank', msg: '4 units PRBC cross-matched and reserved', time: '07:58' },
          ].map((m, i) => (
            <div key={i} className="rounded border border-slate-100 px-2 py-1.5">
              <div className="flex justify-between text-[8px] text-slate-500">
                <span className="font-bold text-[#2563EB]">{m.from}</span>
                <span>{m.time}</span>
              </div>
              <p className="text-[9px] text-slate-700">{m.msg}</p>
            </div>
          ))}
        </div>
        <input className="w-full rounded-md border border-[#E2E8F0] px-2 py-1.5 text-[10px]" placeholder="Type message…" />
        <button type="button" onClick={onClose} className="w-full rounded-md bg-[#2563EB] py-2 text-[10px] font-bold text-white">Send</button>
      </div>
    </DrawerOverlay>
  );
}
