"use server"; // This directive is CRITICAL. It ensures this code runs only on the server.

import { revalidatePath } from "next/cache";
import { createClient } from "@/src/utils/supabase/server";

export async function scheduleAppointment(formData: FormData) {
  // 1. Extract and sanitize input data
  const doctor_id = formData.get("doctor_id")?.toString();
  const patient_name = formData.get("patient_name")?.toString().trim();
  const scheduled_at = formData.get("scheduled_at")?.toString();

  // 2. Validate inputs
  if (!doctor_id || !patient_name || !scheduled_at) {
    throw new Error("Missing required appointment details.");
  }

  // 3. Initialize Supabase client
  const supabase = await createClient();

  // 4. Perform database insertion
  const { error } = await supabase.from("appointments").insert({
    doctor_id,
    patient_name,
    appointment_time: new Date(scheduled_at).toISOString(),
    status: "scheduled",
  });

  // 5. Handle errors
  if (error) {
    console.error("Supabase Error:", error);
    throw new Error("Failed to save appointment to the database.");
  }

  // 6. Refresh the dashboard UI
  // This tells Next.js to re-fetch the data for the /dashboard page
  revalidatePath("/dashboard");
}