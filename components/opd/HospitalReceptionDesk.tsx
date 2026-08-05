'use client';

import { useMemo, useState } from 'react';
import { Merge, Printer, UserPlus, Users } from 'lucide-react';
import { toast } from 'sonner';

import { AiSchedulingSummary } from '@/components/opd/AiSchedulingSummary';
import { AppointmentPass } from '@/components/opd/AppointmentPass';
import { opdUi } from '@/lib/opd/design-tokens';
import { DEPARTMENTS } from '@/lib/ecosystem/seed';
import { useDoctors } from '@/lib/ecosystem/hooks';
import { useEcosystemStore } from '@/lib/ecosystem/store';

export function HospitalReceptionDesk() {
  const registerWalkIn = useEcosystemStore((s) => s.registerWalkIn);
  const qrCheckIn = useEcosystemStore((s) => s.qrCheckIn);
  const reassignSlot = useEcosystemStore((s) => s.reassignSlot);
  const setPriorityTier = useEcosystemStore((s) => s.setPriorityTier);
  const mergeDepartmentQueues = useEcosystemStore((s) => s.mergeDepartmentQueues);
  const markNoShow = useEcosystemStore((s) => s.markNoShow);
  const appointments = useEcosystemStore((s) => s.appointments);
  const hospitalQueue = useEcosystemStore((s) => s.hospitalQueue);
  const opdDisplay = useEcosystemStore((s) => s.opdDisplay);
  const analytics = useEcosystemStore((s) => s.opdAnalytics);
  const doctors = useDoctors('', 'all');

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [reason, setReason] = useState('');
  const [priorityTier, setPriorityTierLocal] = useState<'standard' | 'senior' | 'vip'>('standard');
  const [qrInput, setQrInput] = useState('');
  const [lastPass, setLastPass] = useState<ReturnType<typeof registerWalkIn> | null>(null);
  const [reassignId, setReassignId] = useState('');
  const [reassignDate, setReassignDate] = useState('');
  const [reassignTime, setReassignTime] = useState('10:00');
  const [mergeDept, setMergeDept] = useState(DEPARTMENTS[0]);

  const effectiveDoctorId = doctorId || doctors[0]?.id || '';
  const selectedDoctor = doctors.find((d) => d.id === effectiveDoctorId) ?? doctors[0];
  const today = new Date().toISOString().slice(0, 10);

  const todayAppts = useMemo(
    () => appointments.filter((a) => a.date === today && !['Cancelled', 'Completed'].includes(a.status)),
    [appointments, today],
  );

  const handleWalkIn = () => {
    if (!name.trim() || !selectedDoctor) {
      toast.error('Patient name and doctor required');
      return;
    }
    const appt = registerWalkIn({
      patientName: name.trim(),
      phone,
      doctorId: selectedDoctor.id,
      reason: reason || 'Walk-in consultation',
      priorityTier,
    });
    setLastPass(appt);
    toast.success(`Walk-in registered · ${appt.sequentialToken}`);
  };

  const handleQrScan = () => {
    try {
      const appt = qrCheckIn(qrInput.trim());
      toast.success(`Checked in · ${appt.sequentialToken}`);
      setLastPass(appt);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'QR check-in failed');
    }
  };

  const handleReassign = () => {
    if (!reassignId || !reassignDate) return;
    try {
      reassignSlot(reassignId, reassignDate, reassignTime);
      toast.success('Slot reassigned · patient notified');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Reassignment failed');
    }
  };

  return (
    <div className={`min-h-screen ${opdUi.canvas} p-6`}>
      <header className={`${opdUi.topBar} mb-6 rounded-2xl px-6 py-4`}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-black">Hospital Reception · Smart OPD Desk</h1>
            <p className="text-sm text-white/80">Walk-in · QR check-in · VIP/Senior priority · slot reassignment</p>
          </div>
          <div className="flex gap-4 text-sm">
            <div className="rounded-xl bg-white/10 px-4 py-2">
              <p className="text-white/70">Waiting Hall</p>
              <p className="font-black">{opdDisplay.waitingHallOccupancy}/{opdDisplay.waitingHallCapacity} ({analytics.waitingHallOccupancyPct}%)</p>
            </div>
            <div className="rounded-xl bg-white/10 px-4 py-2">
              <p className="text-white/70">Queue Today</p>
              <p className="font-black">{todayAppts.length} patients</p>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-2">
        <section className={`${opdUi.card} p-6`}>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-black text-[#482A41]">
            <UserPlus className="h-5 w-5 text-[#572E54]" /> Walk-in Registration
          </h2>
          <div className="space-y-3">
            <input className="w-full rounded-xl border border-[#8E7692]/40 px-4 py-2.5 text-sm" placeholder="Patient full name" value={name} onChange={(e) => setName(e.target.value)} />
            <input className="w-full rounded-xl border border-[#8E7692]/40 px-4 py-2.5 text-sm" placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <select className="w-full rounded-xl border border-[#8E7692]/40 px-4 py-2.5 text-sm" value={effectiveDoctorId} onChange={(e) => setDoctorId(e.target.value)}>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>{d.name} · {d.department} · ₹{d.consultationFee}</option>
              ))}
            </select>
            <select className="w-full rounded-xl border border-[#8E7692]/40 px-4 py-2.5 text-sm" value={priorityTier} onChange={(e) => setPriorityTierLocal(e.target.value as typeof priorityTier)}>
              <option value="standard">Standard queue</option>
              <option value="senior">Senior Citizen priority</option>
              <option value="vip">VIP priority</option>
            </select>
            <input className="w-full rounded-xl border border-[#8E7692]/40 px-4 py-2.5 text-sm" placeholder="Reason for visit" value={reason} onChange={(e) => setReason(e.target.value)} />
            <button type="button" onClick={handleWalkIn} className={`${opdUi.btnPrimary} w-full`}>
              Register & Allocate Slot
            </button>
          </div>
        </section>

        <section className={`${opdUi.card} p-6`}>
          <h2 className="mb-4 text-lg font-black text-[#482A41]">QR Check-In Scanner</h2>
          <textarea
            className="min-h-[100px] w-full rounded-xl border border-[#8E7692]/40 px-4 py-2.5 font-mono text-sm"
            placeholder="Scan or paste QR payload (NEXORA:CHECKIN:...)"
            value={qrInput}
            onChange={(e) => setQrInput(e.target.value)}
          />
          <button type="button" onClick={handleQrScan} className={`${opdUi.btnPrimary} mt-3 w-full`}>
            Process Check-In
          </button>
        </section>

        {selectedDoctor && (
          <div className="lg:col-span-2">
            <AiSchedulingSummary doctor={selectedDoctor} date={today} appointments={appointments} />
          </div>
        )}

        <section className={`${opdUi.card} p-6`}>
          <h2 className="mb-4 text-lg font-black text-[#482A41]">Slot Reassignment</h2>
          <select className="mb-2 w-full rounded-xl border border-[#8E7692]/40 px-3 py-2 text-sm" value={reassignId} onChange={(e) => setReassignId(e.target.value)}>
            <option value="">Select appointment</option>
            {todayAppts.map((a) => (
              <option key={a.id} value={a.id}>{a.patientName} · {a.time} · {a.doctorName}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <input type="date" className="flex-1 rounded-xl border border-[#8E7692]/40 px-3 py-2 text-sm" value={reassignDate} onChange={(e) => setReassignDate(e.target.value)} />
            <input type="time" className="w-32 rounded-xl border border-[#8E7692]/40 px-3 py-2 text-sm" value={reassignTime} onChange={(e) => setReassignTime(e.target.value)} />
          </div>
          <button type="button" onClick={handleReassign} className={`${opdUi.btnSecondary} mt-3 w-full`}>
            Reassign Slot
          </button>
        </section>

        <section className={`${opdUi.card} p-6`}>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-black text-[#482A41]">
            <Merge className="h-5 w-5" /> Queue Management
          </h2>
          <select className="mb-2 w-full rounded-xl border border-[#8E7692]/40 px-3 py-2 text-sm" value={mergeDept} onChange={(e) => setMergeDept(e.target.value)}>
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          <button type="button" onClick={() => { mergeDepartmentQueues(mergeDept); toast.success(`Merged ${mergeDept} queues`); }} className={`${opdUi.btnSecondary} w-full`}>
            Merge Department Queues
          </button>
          <ul className="mt-4 max-h-48 space-y-2 overflow-y-auto text-sm">
            {hospitalQueue.slice(0, 8).map((q) => (
              <li key={q.id} className="flex items-center justify-between rounded-lg border border-[#8E7692]/25 px-3 py-2">
                <span>{q.patientName}</span>
                <div className="flex gap-1">
                  {q.priorityTier && q.priorityTier !== 'standard' && (
                    <span className="rounded bg-[#D8A657]/30 px-2 text-xs font-bold uppercase">{q.priorityTier}</span>
                  )}
                  <button type="button" className="text-xs text-[#572E54] hover:underline" onClick={() => setPriorityTier(q.appointmentId, 'vip')}>VIP</button>
                  <button type="button" className="text-xs text-[#8E7692] hover:underline" onClick={() => markNoShow(q.appointmentId)}>No-show</button>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {lastPass && (
          <div className="lg:col-span-2">
            <AppointmentPass appointment={lastPass} />
            <button type="button" onClick={() => window.print()} className={`${opdUi.btnSecondary} mt-3`}>
              <Printer className="h-4 w-4" /> Print Thermal Slip
            </button>
          </div>
        )}
      </div>

      <p className="mx-auto mt-6 flex max-w-6xl items-center gap-2 text-xs text-[#8E7692]">
        <Users className="h-4 w-4" /> Waiting hall occupancy tracked live · synchronized with Display Board
      </p>
    </div>
  );
}
