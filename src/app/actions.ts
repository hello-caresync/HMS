"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/src/utils/supabase/server";

export async function addDoctor(formData: FormData) {
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

export async function scheduleAppointment(formData: FormData) {
  const doctor_id = formData.get("doctor_id")?.toString();
  const patient_name = formData.get("patient_name")?.toString().trim();
  const scheduled_at = formData.get("scheduled_at")?.toString();

  if (!doctor_id || !patient_name || !scheduled_at) {
    throw new Error("Doctor, patient name, and time are required.");
  }

  const supabase = await createClient();

  const { error } = await supabase.from("appointments").insert({
    doctor_id,
    patient_name,
    appointment_time: scheduled_at,
    status: "confirmed",
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard");
}

export async function updateDoctorAvailability(
  doctorId: string,
  availability: "available" | "in_appointment" | "off"
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("doctors")
    .update({ availability })
    .eq("id", doctorId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard");
}