export type Doctor = {
  id: string;
  full_name: string;
  specialty: string;
  email: string;
};

type DoctorListProps = {
  doctors: Doctor[];
};

function getInitials(fullName: string) {
  return fullName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function DoctorList({ doctors }: DoctorListProps) {
  return (
    <section className="rounded-2xl border border-white/10 bg-zinc-950 p-6 shadow-2xl shadow-black/40">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-zinc-50">Doctors</h2>
        <p className="text-sm text-zinc-500">{doctors.length} registered</p>
      </div>

      {doctors.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 bg-black/40 px-6 py-12 text-center">
          <p className="text-sm font-medium text-zinc-300">No doctors yet</p>
          <p className="mt-1 text-sm text-zinc-500">
            Add your first doctor using the form on the right.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-white/10">
          {doctors.map((doctor) => (
            <li
              key={doctor.id}
              className="flex flex-col gap-3 py-5 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/5 text-sm font-semibold text-zinc-300 ring-1 ring-white/10">
                  {getInitials(doctor.full_name)}
                </div>
                <div>
                  <p className="font-medium text-zinc-50">{doctor.full_name}</p>
                  <p className="text-sm text-zinc-400">{doctor.specialty}</p>
                </div>
              </div>
              <p className="text-sm text-zinc-300 sm:text-right">{doctor.email}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
