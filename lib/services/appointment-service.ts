import { createClient } from '@supabase/supabase-js';

export interface AppointmentPayload {
  patientId: string;
  doctorId: string;
  appointmentDate: string;
  slotTime: string;
  chiefComplaint?: string;
}

export class AppointmentService {
  // Pass env variables directly to satisfy createClient(url, key) signature
  private static getSupabase() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-project.supabase.co';
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';
    return createClient(url, key);
  }

  // 1. Patient App: Book Appointment
  static async bookAppointment(payload: AppointmentPayload) {
    const supabase = this.getSupabase();
    const { data, error } = await supabase
      .from('appointments')
      .insert({
        patient_id: payload.patientId,
        doctor_id: payload.doctorId,
        appointment_date: payload.appointmentDate,
        slot_time: payload.slotTime,
        chief_complaint: payload.chiefComplaint || '',
        status: 'requested',
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  // 2. Doctor App: Accept Appointment
  static async acceptAppointment(appointmentId: string) {
    const supabase = this.getSupabase();
    const { data, error } = await supabase
      .from('appointments')
      .update({ status: 'confirmed' })
      .eq('id', appointmentId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  // 3. Doctor / Patient / HMS: Cancel or Reject Appointment
  static async cancelAppointment(appointmentId: string, reason: string, isRejection = false) {
    const supabase = this.getSupabase();
    const { data, error } = await supabase
      .from('appointments')
      .update({ 
        status: isRejection ? 'rejected' : 'cancelled',
        cancellation_reason: reason 
      })
      .eq('id', appointmentId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  // 4. Doctor / HMS App: Reschedule Appointment
  static async rescheduleAppointment(appointmentId: string, newDate: string, newTime: string) {
    const supabase = this.getSupabase();
    const { data, error } = await supabase
      .from('appointments')
      .update({ 
        status: 'rescheduled',
        appointment_date: newDate,
        slot_time: newTime,
        rescheduled_date: newDate,
        rescheduled_time: newTime
      })
      .eq('id', appointmentId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }
}