"use client"; // Required for interactivity and useFormStatus

import { useFormStatus } from "react-dom";
import { scheduleAppointment } from "../app/actions"; // Correct import path

type Doctor = {
  id: string;
  full_name: string;
};

type ScheduleAppointmentFormProps = {
  doctors: Doctor[];
};

const fieldClassName =
  "rounded-xl border border-white/10 bg-black px-4 py-2.5 text-zinc-50 outline-none transition-colors placeholder:text-zinc-600 focus:border-white/20 focus:ring-2 focus:ring-white/10";

// Sub-component for the submit button to handle loading states
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

export function ScheduleAppointmentForm({ doctors }: ScheduleAppointmentFormProps) {
  return (
    <aside className="h-fit rounded-2xl border border-white/10 bg-zinc-950 p-6 shadow-2xl shadow-black/40">
      <h2 className="text-lg font-semibold text-zinc-50">Schedule Appointment</h2>
      <p className="mt-1 mb-6 text-sm text-zinc-500">
        Book a new appointment with an available doctor.
      </p>

      <form action={scheduleAppointment} className="flex flex-col gap-4">
        {/* Doctor Selection */}
        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium text-zinc-300">Doctor</span>
          <select
            name="doctor_id"
            required
            disabled={doctors.length === 0}
            className={`${fieldClassName} disabled:cursor-not-allowed disabled:opacity-50`}
            defaultValue=""
          >
            <option value="" disabled>
              {doctors.length === 0 ? "No doctors available" : "Select a doctor"}
            </option>
            {doctors.map((doctor) => (
              <option key={doctor.id} value={doctor.id}>
                {doctor.full_name}
              </option>
            ))}
          </select>
        </label>

        {/* Patient Name Input */}
        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium text-zinc-300">Patient name</span>
          <input
            type="text"
            name="patient_name"
            required
            className={fieldClassName}
            placeholder="John Doe"
          />
        </label>

        {/* Appointment Time Input */}
        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium text-zinc-300">Appointment time</span>
          <input
            type="datetime-local"
            name="scheduled_at"
            required
            className={`${fieldClassName} [color-scheme:dark]`}
          />
        </label>

        <SubmitButton disabled={doctors.length === 0} />
      </form>
    </aside>
  );
}