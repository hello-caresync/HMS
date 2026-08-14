'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import {
  Stethoscope,
  Calendar,
  Clock,
  User,
  CheckCircle2,
  ArrowRight,
  Loader2,
  FileText,
  Users,
  Building2,
  AlertCircle,
} from 'lucide-react';

interface FamilyMemberOption {
  id: string;
  name: string;
  relation: string;
}

export default function BookAppointmentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // PATIENT SELECTION STATE (SELF + SAVED DEPENDENTS)
  const [selectedPatientName, setSelectedPatientName] = useState<string>('Aishwarya D S (Self)');
  const [patientOptions, setPatientOptions] = useState<FamilyMemberOption[]>([]);

  // CLINICAL DETAILS
  const [assignedDoctor, setAssignedDoctor] = useState<string>('Dr. Chandrakanth S. Kesari');
  const [selectedDept, setSelectedDept] = useState<string>('General Surgery');
  const [consultationFee, setConsultationFee] = useState<string>('₹800');
  const [reason, setReason] = useState<string>('');

  // SCHEDULING DETAILS
  const [appointmentDate, setAppointmentDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [slotTime, setSlotTime] = useState<string>('10:30 AM');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    // 1. Read URL params passed from Doctor Directory
    const docParam = searchParams.get('doctor');
    const deptParam = searchParams.get('department');
    const feeParam = searchParams.get('fee');

    if (docParam) setAssignedDoctor(docParam);
    if (deptParam) setSelectedDept(deptParam);
    if (feeParam) setConsultationFee(feeParam);

    // 2. Load Patient & Linked Family Members
    loadPatientAndFamilyOptions();
  }, [searchParams]);

  const loadPatientAndFamilyOptions = async () => {
    let primaryName = 'Aishwarya D S';
    let familyMembersList: FamilyMemberOption[] = [];

    // Check Local Storage
    if (typeof window !== 'undefined') {
      const storedName = localStorage.getItem('patient_full_name');
      const savedProfile = localStorage.getItem('curasync_patient_profile');

      if (storedName) primaryName = storedName;

      if (savedProfile) {
        try {
          const parsed = JSON.parse(savedProfile);
          if (parsed.full_name) primaryName = parsed.full_name;
          if (Array.isArray(parsed.family_members)) {
            familyMembersList = parsed.family_members;
          }
        } catch (e) {}
      }
    }

    // Check Supabase Backend
    try {
      const { data, error } = await supabase
        .from('patient_profiles')
        .select('full_name, family_members')
        .eq('patient_id', 'NEX_9021')
        .single();

      if (!error && data) {
        if (data.full_name) primaryName = data.full_name;
        if (Array.isArray(data.family_members)) {
          familyMembersList = data.family_members;
        }
      }
    } catch (err) {
      console.warn('Profile sync notice, loaded fallback options');
    } finally {
      const options: FamilyMemberOption[] = [
        { id: 'self', name: `${primaryName} (Self)`, relation: 'Self' },
        ...familyMembersList.map((m) => ({
          id: m.id || m.name,
          name: `${m.name} (${m.relation})`,
          relation: m.relation,
        })),
      ];

      setPatientOptions(options);
      setSelectedPatientName(options[0].name);
    }
  };

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    // Clean label tag like "(Self)" or "(Parent)" for database storage
    const cleanPatientName = selectedPatientName.replace(/\s\([^)]+\)/, '').trim();

    // 1. Calculate dynamic sequential token number
    let calculatedToken = 1;
    try {
      const { count } = await supabase
        .from('patient_appointments')
        .select('*', { count: 'exact', head: true })
        .eq('doctor_name', assignedDoctor);

      calculatedToken = (count || 0) + 1;
    } catch (err) {
      calculatedToken = Math.floor(Math.random() * 20) + 1;
    }

    // 2. Build complete appointment payload
    const newAppt = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'apt_' + Date.now(),
      patient_id: 'NEX_9021',
      patient_name: cleanPatientName,
      doctor_name: assignedDoctor,
      department: selectedDept,
      hospital_name: 'Regal Hospital',
      appointment_date: appointmentDate,
      slot_time: slotTime,
      fee: consultationFee,
      reason: reason.trim() || 'General OPD Checkup',
      token_number: calculatedToken,
      queue_status: 'SCHEDULED',
      created_at: new Date().toISOString(),
    };

    // 3. Save to Local Storage Cache
    let existingAppts: any[] = [];
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('curasync_appointments');
      if (saved) {
        try {
          existingAppts = JSON.parse(saved);
        } catch (e) {}
      }
      localStorage.setItem(
        'curasync_appointments',
        JSON.stringify([newAppt, ...existingAppts])
      );
    }

    // 4. Save directly into Supabase backend
    try {
      // Primary appointments table
      const { error: apptErr } = await supabase
        .from('patient_appointments')
        .insert([newAppt]);

      if (apptErr) console.warn('Supabase appt write:', apptErr.message);

      // Mirror to canonical appointments table for doctor dashboard realtime
      const { error: doctorApptErr } = await supabase.from('appointments').insert([
        {
          patient_id: 'b0000000-0000-0000-0000-000000000002',
          doctor_id: '56284599-9a5f-4672-9b53-b90e18146a00',
          department: selectedDept,
          reason_for_visit: reason.trim() || 'General OPD Checkup',
          appointment_date: appointmentDate,
          appointment_time: slotTime,
          status: 'SCHEDULED',
        },
      ]);

      if (doctorApptErr) console.warn('Doctor appointments mirror write:', doctorApptErr.message);

      // Mirror directly to HMS OPD Queue for Doctor Console
      const { error: queueErr } = await supabase
        .from('hms_opd_queue')
        .insert([newAppt]);

      if (queueErr) console.warn('Supabase queue write:', queueErr.message);
    } catch (err: any) {
      console.warn('Backend sync completed with local cache fallback');
    } finally {
      setIsSubmitting(false);
      setSuccess(true);
      setTimeout(() => {
        router.push('/patient/appointments');
      }, 1000);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 font-sans text-[#0E2924]">
      {/* HEADER SECTION */}
      <div className="border-b border-[#D5E8E3] pb-4">
        <h1 className="text-2xl font-black text-[#0E2924]">Confirm Consultation Booking</h1>
        <p className="text-xs font-bold text-[#227B6B]">
          Facility: <span className="text-[#113831] font-black">Regal Hospital</span> • OPD Consultation
        </p>
      </div>

      {/* SUCCESS BANNER */}
      {success && (
        <div className="flex items-center gap-3 rounded-2xl bg-[#EAF5F2] p-4 text-xs font-bold text-[#113831] border border-[#227B6B]/30 shadow-sm">
          <CheckCircle2 className="h-5 w-5 text-[#227B6B] shrink-0" />
          <span>Appointment booked successfully! Redirecting to live token dashboard...</span>
        </div>
      )}

      {/* ERROR BANNER */}
      {errorMessage && (
        <div className="flex items-center gap-3 rounded-2xl bg-rose-50 p-4 text-xs font-bold text-rose-800 border border-rose-200">
          <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* BOOKING FORM */}
      <form
        onSubmit={handleBookAppointment}
        className="rounded-3xl border border-[#D5E8E3] bg-white p-8 shadow-sm space-y-6"
      >
        {/* PATIENT / DEPENDENT SELECTOR */}
        <div>
          <label className="flex items-center gap-1.5 text-[10px] font-black uppercase text-[#227B6B] mb-1.5">
            <Users className="h-3.5 w-3.5 text-[#227B6B]" /> PATIENT FOR CONSULTATION *
          </label>
          <select
            value={selectedPatientName}
            onChange={(e) => setSelectedPatientName(e.target.value)}
            className="w-full rounded-2xl border border-[#D5E8E3] bg-[#EAF5F2]/40 p-4 text-xs font-bold text-[#0E2924] focus:border-[#113831] focus:outline-none shadow-sm cursor-pointer"
          >
            {patientOptions.map((opt) => (
              <option key={opt.id} value={opt.name}>
                {opt.name}
              </option>
            ))}
          </select>
        </div>

        {/* CLINICIAN & DEPARTMENT / FEE */}
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label className="flex items-center gap-1.5 text-[10px] font-black uppercase text-[#227B6B] mb-1.5">
              <User className="h-3.5 w-3.5 text-[#227B6B]" /> SELECTED CONSULTANT
            </label>
            <input
              type="text"
              readOnly
              value={assignedDoctor}
              className="w-full rounded-2xl border border-[#D5E8E3] bg-[#F4F8F7] p-4 text-xs font-black text-[#113831]"
            />
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-[10px] font-black uppercase text-[#227B6B] mb-1.5">
              <Stethoscope className="h-3.5 w-3.5 text-[#227B6B]" /> DEPARTMENT & FEE
            </label>
            <input
              type="text"
              readOnly
              value={`${selectedDept} (${consultationFee})`}
              className="w-full rounded-2xl border border-[#D5E8E3] bg-[#F4F8F7] p-4 text-xs font-black text-[#113831]"
            />
          </div>
        </div>

        {/* REASON FOR VISIT (OPTIONAL) */}
        <div>
          <label className="flex items-center gap-1.5 text-[10px] font-black uppercase text-[#227B6B] mb-1.5">
            <FileText className="h-3.5 w-3.5 text-[#227B6B]" /> REASON FOR VISIT / SYMPTOMS (OPTIONAL)
          </label>
          <textarea
            rows={3}
            placeholder="Describe symptoms or clinical concern (e.g., Fever, Routine checkup, Knee pain, Chronic cough)..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full rounded-2xl border border-[#D5E8E3] bg-[#F4F8F7] p-4 text-xs font-bold text-[#0E2924] focus:border-[#113831] focus:outline-none"
          />
        </div>

        {/* DATE & TIME SLOTS */}
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label className="flex items-center gap-1.5 text-[10px] font-black uppercase text-[#227B6B] mb-1.5">
              <Calendar className="h-3.5 w-3.5 text-[#227B6B]" /> APPOINTMENT DATE *
            </label>
            <input
              type="date"
              required
              value={appointmentDate}
              onChange={(e) => setAppointmentDate(e.target.value)}
              className="w-full rounded-2xl border border-[#D5E8E3] bg-[#F4F8F7] p-4 text-xs font-bold text-[#0E2924] focus:border-[#113831] focus:outline-none"
            />
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-[10px] font-black uppercase text-[#227B6B] mb-1.5">
              <Clock className="h-3.5 w-3.5 text-[#227B6B]" /> TIME SLOT *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['09:30 AM', '10:30 AM', '11:30 AM', '02:00 PM', '03:30 PM', '05:00 PM'].map((slot) => (
                <button
                  type="button"
                  key={slot}
                  onClick={() => setSlotTime(slot)}
                  className={`p-2.5 rounded-xl text-[11px] font-black border transition ${
                    slotTime === slot
                      ? 'bg-[#113831] text-white border-[#113831] shadow-sm'
                      : 'bg-[#F4F8F7] text-[#0E2924] border-[#D5E8E3] hover:border-[#113831]'
                  }`}
                >
                  {slot}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* FACILITY CONFIRMATION */}
        <div className="flex items-center gap-2 text-xs font-bold text-[#227B6B] bg-[#EAF5F2]/40 p-3.5 rounded-2xl border border-[#D5E8E3]">
          <Building2 className="h-4 w-4 shrink-0 text-[#113831]" />
          <span>Consultation Location: <strong>Regal Hospital OPD Block</strong></span>
        </div>

        {/* SUBMIT BUTTON */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#113831] py-4 text-xs font-black text-white shadow-lg hover:bg-[#227B6B] transition disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-[#A6E2D8]" /> Confirming OPD Booking...
            </>
          ) : (
            <>
              <ArrowRight className="h-4 w-4 text-[#A6E2D8]" /> Confirm & Generate SmartQ Token
            </>
          )}
        </button>
      </form>
    </div>
  );
}