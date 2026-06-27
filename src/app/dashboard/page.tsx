import Link from "next/link";
import { revalidatePath } from "next/cache";
import { createClient } from "@/src/utils/supabase/server";

export const runtime = 'edge';

type Doctor = {
  id: string;
  full_name: string;
  specialty: string;
  email: string;
  created_at: string;
};

async function addDoctor(formData: FormData) {
  "use server";

  const full_name = formData.get("full_name")?.toString().trim();
  const specialty = formData.get("specialty")?.toString().trim();
  const email = formData.get("email")?.toString().trim();

  if (!full_name || !specialty || !email) {
    throw new Error("Full name, specialty, and email are required.");
  }

  const supabase = await createClient();

  const { error } = await supabase.from("doctors").insert({
    full_name,
    specialty,
    email,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard");
}

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: doctors, error } = await supabase
    .from("doctors")
    .select("id, full_name, specialty, email, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-full bg-black text-zinc-50">
      <header className="border-b border-white/10 bg-zinc-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-zinc-500">
              CareSync Admin
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-50">
              Dashboard
            </h1>
            <p className="mt-1 text-sm text-zinc-400">
              Manage doctors and appointments
            </p>
          </div>
          <Link
            href="/"
            className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:border-white/20 hover:bg-white/5 hover:text-zinc-50"
          >
            Home
          </Link>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-8 px-6 py-10 lg:grid-cols-[1fr_360px]">
        <section className="rounded-2xl border border-white/10 bg-zinc-950 p-6 shadow-2xl shadow-black/40">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-zinc-50">Doctors</h2>
              <p className="text-sm text-zinc-500">
                {doctors?.length ?? 0} registered
              </p>
            </div>
            <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400 ring-1 ring-emerald-500/20">
              Live
            </span>
          </div>

          {error ? (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              Failed to load doctors: {error.message}
            </div>
          ) : !doctors?.length ? (
            <div className="rounded-xl border border-dashed border-white/10 bg-black/40 px-6 py-12 text-center">
              <p className="text-sm font-medium text-zinc-300">No doctors yet</p>
              <p className="mt-1 text-sm text-zinc-500">
                Add your first doctor using the form on the right.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-white/10">
              {(doctors as Doctor[]).map((doctor) => (
                <li
                  key={doctor.id}
                  className="flex flex-col gap-3 py-5 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/5 text-sm font-semibold text-zinc-300 ring-1 ring-white/10">
                      {doctor.full_name
                        .split(" ")
                        .map((part) => part[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-zinc-50">
                        {doctor.full_name}
                      </p>
                      <p className="text-sm text-zinc-400">{doctor.specialty}</p>
                    </div>
                  </div>
                  <div className="sm:text-right">
                    <p className="text-sm text-zinc-300">{doctor.email}</p>
                    <p className="mt-1 text-xs text-zinc-600">
                      Added{" "}
                      {new Date(doctor.created_at).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="h-fit rounded-2xl border border-white/10 bg-zinc-950 p-6 shadow-2xl shadow-black/40">
          <h2 className="text-lg font-semibold text-zinc-50">Add Doctor</h2>
          <p className="mt-1 mb-6 text-sm text-zinc-500">
            New doctors appear in the list immediately after saving.
          </p>

          <form action={addDoctor} className="flex flex-col gap-4">
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-zinc-300">Full name</span>
              <input
                type="text"
                name="full_name"
                required
                className="rounded-xl border border-white/10 bg-black px-4 py-2.5 text-zinc-50 outline-none transition-colors placeholder:text-zinc-600 focus:border-white/20 focus:ring-2 focus:ring-white/10"
                placeholder="Dr. Jane Smith"
              />
            </label>

            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-zinc-300">Specialty</span>
              <input
                type="text"
                name="specialty"
                required
                className="rounded-xl border border-white/10 bg-black px-4 py-2.5 text-zinc-50 outline-none transition-colors placeholder:text-zinc-600 focus:border-white/20 focus:ring-2 focus:ring-white/10"
                placeholder="Cardiology"
              />
            </label>

            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-zinc-300">Email</span>
              <input
                type="email"
                name="email"
                required
                className="rounded-xl border border-white/10 bg-black px-4 py-2.5 text-zinc-50 outline-none transition-colors placeholder:text-zinc-600 focus:border-white/20 focus:ring-2 focus:ring-white/10"
                placeholder="jane.smith@hospital.com"
              />
            </label>

            <button
              type="submit"
              className="mt-2 rounded-full bg-zinc-50 px-4 py-2.5 text-sm font-medium text-black transition-colors hover:bg-zinc-200"
            >
              Add Doctor
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}