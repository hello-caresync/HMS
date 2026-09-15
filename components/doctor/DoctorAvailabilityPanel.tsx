'use client';

import { useState } from 'react';
import { CalendarClock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { createClient } from '@/lib/supabase/client';
import {
  materializeDoctorSlotsForDate,
  upsertDoctorScheduleBlock,
} from '@/lib/doctor/scheduling/doctor-availability';
import { portalSurfaces } from '@/lib/shared/portal-surfaces';

const SLOT_TIMES = ['09:30 AM', '10:30 AM', '11:30 AM', '02:00 PM', '03:30 PM', '05:00 PM'];

type DoctorAvailabilityPanelProps = {
  doctorId: string;
  doctorName?: string;
};

export function DoctorAvailabilityPanel({ doctorId, doctorName }: DoctorAvailabilityPanelProps) {
  const doctorSurface = portalSurfaces.doctor;
  const [busy, setBusy] = useState(false);
  const [slotDate, setSlotDate] = useState(new Date().toISOString().slice(0, 10));

  const publishSlots = async () => {
    if (!doctorId) return;
    setBusy(true);
    try {
      const supabase = createClient();
      const day = new Date(slotDate).getDay();
      await upsertDoctorScheduleBlock(supabase, {
        doctor_id: doctorId,
        doctor_name: doctorName,
        day_of_week: day,
        start_time: '09:30:00',
        end_time: '17:30:00',
        slot_duration_minutes: 60,
        is_active: true,
      });
      const result = await materializeDoctorSlotsForDate(
        supabase,
        doctorId,
        slotDate,
        SLOT_TIMES,
        doctorName,
      );
      if (!result.ok) throw new Error(result.error);
      toast.success('Open consultation slots published for patients');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Could not publish slots');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`rounded-2xl border p-4 shadow-sm ${doctorSurface.card}`}>
      <div className="mb-3 flex items-center gap-2">
        <CalendarClock className="h-4 w-4 text-[#2A9D8F]" />
        <p className="text-xs font-black uppercase tracking-wider text-[#173F5F]">
          Availability Scheduling
        </p>
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-[10px] font-bold uppercase text-slate-500">Date</label>
          <input
            type="date"
            value={slotDate}
            onChange={(e) => setSlotDate(e.target.value)}
            className="rounded-xl border border-[#D5E8E3] px-3 py-2 text-sm"
          />
        </div>
        <button
          type="button"
          disabled={busy || !doctorId}
          onClick={() => void publishSlots()}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold text-white disabled:opacity-50 ${doctorSurface.btnPrimary}`}
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Publish open slots
        </button>
      </div>
      <p className="mt-2 text-[11px] font-medium text-slate-500">
        Patients can only book published open slots — booked slots are locked automatically.
      </p>
    </div>
  );
}
