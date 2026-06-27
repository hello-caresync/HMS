import { revalidatePath } from "next/cache";
import { createClient } from "@/src/utils/supabase/server";

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

export function AddDoctorForm() {
  return (
    <aside className="h-fit rounded-2xl border border-white/10 bg-zinc-950 p-6 shadow-2xl shadow-black/40">
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
    </aside>
  );
}
