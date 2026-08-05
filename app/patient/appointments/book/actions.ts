'use server';

import { revalidatePath } from 'next/cache';

export async function revalidatePatientDashboard() {
  revalidatePath('/patient/dashboard');
  revalidatePath('/patient/appointments');
}
