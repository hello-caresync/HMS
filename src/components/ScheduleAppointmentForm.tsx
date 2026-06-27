"use client";

import { useFormStatus } from "react-dom";
import { scheduleAppointment } from "../app/actions";

type Doctor = { id: string; full_name: string; };

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className="mt-2 rounded-full bg-zinc-50 px-4 py-2.5 text-sm font-medium text-black transition-colors hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? "Scheduling..." : "Schedule Appointment"}
    </button>
  );
}

export function ScheduleAppointmentForm({ doctors }: { doctors: Doctor[] }) {
  const fieldClassName = "rounded-xl border border-white/10 bg-black px-4 py-2.5 text-zinc-50 outline-none transition-colors placeholder:text-zinc-600 focus:border-white/20 focus:ring-2 focus:ring-white/10";

  return (
    <aside className="h-fit rounded-2xl border border-white/10 bg-zinc-950 p-6 shadow-2xl shadow-black/40">
      <h2 className="text-lg font-semibold text-zinc-50">Schedule Appointment</h2>
      <form action={scheduleAppointment} className="flex flex-col gap-4">
        <select name="doctor_id" required disabled={doctors.length === 0} className={fieldClassName}>
          <option value="" disabled>Select a doctor</option>
          {doctors.map((d) => <option key={d.id} value={d.id}>{d.full_name}</option>)}
        </select>
        <input type="text" name="patient_name" required className={fieldClassName} placeholder="Patient name" />
        <input type="datetime-local" name="scheduled_at" required className={`${fieldClassName} [color-scheme:dark]`} />
        <SubmitButton disabled={doctors.length === 0} />
      </form>
    </aside>
  );
}