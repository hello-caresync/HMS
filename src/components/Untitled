"use client";

import { useFormStatus } from "react-dom";
import { useRef } from "react";
import { scheduleAppointment } from "@/src/app/actions";

type Doctor = {
  id: string;
  full_name: string;
};

type ScheduleAppointmentFormProps = {
  doctors: Doctor[];
  onSuccess: () => void;
};

const fieldClassName =
  "rounded-xl border border-white/10 bg-black px-4 py-2.5 text-zinc-50 outline-none transition-colors placeholder:text-zinc-600 focus:border-white/20 focus:ring-2 focus:ring-white/10";

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

export function ScheduleAppointmentForm({
  doctors,
  onSuccess,
}: ScheduleAppointmentFormProps) {
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(formData: FormData) {
    await scheduleAppointment(formData);
    formRef.current?.reset();
    onSuccess();
  }

  return (
    <form ref={formRef} action={handleSubmit} className="flex flex-col gap-4">
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
  );
}