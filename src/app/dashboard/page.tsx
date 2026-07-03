import { createClient } from "@/src/utils/supabase/server";
import { DoctorList } from "@/src/components/DoctorList";
import { AppointmentList } from "@/src/components/AppointmentList";
import { DashboardHeader } from "@/src/components/DashboardHeader";
import { DashboardActions } from "@/src/components/DashboardActions";

export const runtime = "edge";

export default async function DashboardPage() {
  const supabase = await createClient();

  const [{ data: doctors }, { data: appointments }] = await Promise.all([
    supabase
      .from("doctors")
      .select("id, full_name, specialty, email, availability")
      .order("full_name", { ascending: true }),
    supabase
      .from("appointments")
      .select("id, patient_name, appointment_time, status, doctors(full_name)")
      .order("appointment_time", { ascending: true }),
  ]);

  return (
    <div className="min-h-full bg-black text-zinc-50">
      <DashboardHeader />
      <main className="mx-auto grid max-w-6xl gap-8 px-6 py-10 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-8">
          <DoctorList doctors={doctors ?? []} />
          <AppointmentList appointments={appointments ?? []} />
        </div>
        <aside className="flex flex-col gap-8">
          <DashboardActions doctors={doctors ?? []} />
        </aside>
      </main>
    </div>
  );
}