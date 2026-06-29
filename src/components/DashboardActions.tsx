"use client";

import { useState } from "react";
import { Modal } from "./Modal";
import { AddDoctorForm } from "./AddDoctorForm";
import { ScheduleAppointmentForm } from "./ScheduleAppointmentForm";

type Doctor = {
  id: string;
  full_name: string;
};

export function DashboardActions({ doctors }: { doctors: Doctor[] }) {
  const [addDoctorOpen, setAddDoctorOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);

  return (
    <>
      <div className="flex flex-col gap-3">
        <button
          onClick={() => setAddDoctorOpen(true)}
          className="rounded-2xl border border-white/10 bg-zinc-950 px-4 py-3.5 text-left text-sm font-medium text-zinc-50 shadow-2xl shadow-black/40 transition-colors hover:bg-white/[0.03]"
        >
          + Add doctor
        </button>
        <button
          onClick={() => setScheduleOpen(true)}
          className="rounded-2xl border border-white/10 bg-zinc-950 px-4 py-3.5 text-left text-sm font-medium text-zinc-50 shadow-2xl shadow-black/40 transition-colors hover:bg-white/[0.03]"
        >
          + Schedule appointment
        </button>
      </div>

      <Modal
        open={addDoctorOpen}
        onClose={() => setAddDoctorOpen(false)}
        title="Add Doctor"
      >
        <AddDoctorForm onSuccess={() => setAddDoctorOpen(false)} />
      </Modal>

      <Modal
        open={scheduleOpen}
        onClose={() => setScheduleOpen(false)}
        title="Schedule Appointment"
      >
        <ScheduleAppointmentForm
          doctors={doctors}
          onSuccess={() => setScheduleOpen(false)}
        />
      </Modal>
    </>
  );
}