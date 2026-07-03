export type Appointment = {
  id: string;
  patient_name: string;
  appointment_time: string;
  status: string;
  doctors: { full_name: string } | Array<{ full_name: string }> | null;
};

type AppointmentListProps = {
  appointments: Appointment[];
};

function getDoctorName(doctors: Appointment["doctors"]): string {
  if (!doctors) {
    return "Unassigned";
  }

  if (Array.isArray(doctors)) {
    return doctors[0]?.full_name ?? "Unassigned";
  }

  return doctors.full_name;
}

function formatDateTime(isoDate: string) {
  return new Date(isoDate).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function statusStyles(status: string) {
  const normalized = status.toLowerCase();

  if (normalized === "confirmed") {
    return "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20";
  }

  if (normalized === "cancelled") {
    return "bg-red-500/10 text-red-400 ring-red-500/20";
  }

  return "bg-amber-500/10 text-amber-400 ring-amber-500/20";
}

export function AppointmentList({ appointments }: AppointmentListProps) {
  return (
    <section className="rounded-2xl border border-white/10 bg-zinc-950 p-6 shadow-2xl shadow-black/40">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-zinc-50">Appointments</h2>
        <p className="text-sm text-zinc-500">{appointments.length} scheduled</p>
      </div>

      {appointments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 bg-black/40 px-6 py-12 text-center">
          <p className="text-sm font-medium text-zinc-300">
            No appointments scheduled
          </p>
          <p className="mt-1 text-sm text-zinc-500">
            Appointments will appear here once they are booked.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-white/10">
          {appointments.map((appointment) => (
            <li
              key={appointment.id}
              className="flex flex-col gap-3 py-5 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium text-zinc-50">
                  {appointment.patient_name}
                </p>
                <p className="text-sm text-zinc-400">
                  Dr. {getDoctorName(appointment.doctors)}
                </p>
                <p className="mt-1 text-sm text-zinc-500">
                  {formatDateTime(appointment.appointment_time)}
                </p>
              </div>
              <span
                className={`w-fit rounded-full px-3 py-1 text-xs font-medium capitalize ring-1 ${statusStyles(appointment.status)}`}
              >
                {appointment.status}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
