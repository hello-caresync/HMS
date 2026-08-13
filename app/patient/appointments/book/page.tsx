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
} from 'lucide-react';

interface FamilyMemberOption {
  id: string;
  name: string;
  relation: string;
}

export default function BookAppointmentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // PATIENT SELECTION STATE (SELF + FAMILY MEMBERS)
  const [selectedPatientName, setSelectedPatientName] = useState<string>('Aishwarya D S (Self)');
  const [patientOptions, setPatientOptions] = useState<FamilyMemberOption[]>([]);

  // DOCTOR & APPOINTMENT DETAILS
  const [assignedDoctor, setAssignedDoctor] = useState<string>('Dr. Suriraju V');
  const [selectedDept, setSelectedDept] = useState<string>('Urology');
  const [consultationFee, setConsultationFee] = useState<string>('₹700');
  const [reason, setReason] = useState<string>('');

  const [appointmentDate, setAppointmentDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [slotTime, setSlotTime] = useState<string>('10:30 AM');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);

  useEffect(() => {
    // 1. Parse URL Parameters from Doctor Directory
    const docParam = searchParams.get('doctor');
    const deptParam = searchParams.get('department');
    const feeParam = searchParams.get('fee');

    if (docParam) setAssignedDoctor(docParam);
    if (deptParam) setSelectedDept(deptParam);
    if (feeParam) setConsultationFee(feeParam);

    // 2. Load Patient & Linked Family Members from Profile Data
    loadPatientAndFamilyOptions();
  }, [searchParams]);

  const loadPatientAndFamilyOptions = async () => {
    let primaryName = 'Aishwarya D S';
    let familyMembersList: FamilyMemberOption[] = [];

    // Check localStorage first
    if (typeof window !== 'undefined') {
      const savedProfile = localStorage.getItem('curasync_patient_profile');
      const storedName = localStorage.getItem('patient_full_name');
      
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

    // Attempt Supabase Fetch
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
      console.warn('Profile sync notice, using local options');
    } finally {
      // Build options array
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

    // Clean patient name (remove relationship tag like "(Self)" or "(Parent)" for backend storage)
    const cleanPatientName = selectedPatientName.replace(/\s\([^)]+\)/, '').trim();

    let existingAppts: any[] = [];
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('curasync_appointments');
      if (saved) {
        try {
          existingAppts = JSON.parse(saved);
        } catch (e) {}
      }
    }

    const calculatedToken = existingAppts.length + 1;

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

    // 1. Save to Local Storage
    if (typeof window !== 'undefined') {
      localStorage.setItem(
        'curasync_appointments',
        JSON.stringify([newAppt, ...existingAppts])
      );
    }

    // 2. Dual-Table Backend Insertion for Doctor Workspace Dashboard
    try {
      await supabase.from('patient_appointments').insert(newAppt);
      await supabase.from('hms_opd_queue').insert(newAppt);
    } catch (err) {
      console.warn('DB Sync fallback active');
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
      {/* HEADER */}
      <div className="border-b border-[#D5E8E3] pb-4">
        <h1 className="text-2xl font-black text-[#0E2924]">Confirm Consultation Booking</h1>
        <p className="text-xs font-bold text-[#227B6B]">
          Facility: <span className="text-[#113831] font-black">Regal Hospital</span>
        </p>
      </div>

      {/* SUCCESS BANNER */}
      {success && (
        <div className="flex items-center gap-3 rounded-2xl bg-[#EAF5F2] p-4 text-xs font-bold text-[#113831] border border-[#227B6B]/30 shadow-sm">
          <CheckCircle2 className="h-5 w-5 text-[#227B6B] shrink-0" />
          <span>Appointment booked! Redirecting to active tokens...</span>
        </div>
      )}

      {/* BOOKING FORM */}
      <form
        onSubmit={handleBookAppointment}
        className="rounded-3xl border border-[#D5E8E3] bg-white p-8 shadow-sm space-y-6"
      >
        {/* SELECT PATIENT / FAMILY MEMBER DROPDOWN */}
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

        {/* CONSULTANT & FEE DISPLAY */}
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label className="flex items-center gap-1.5 text-[10px] font-black uppercase text-[#227B6B] mb-1.5">
              <User className="h-3.5 w-3.5" /> SELECTED CONSULTANT
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
              <Stethoscope className="h-3.5 w-3.5" /> DEPARTMENT & FEE
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
            <FileText className="h-3.5 w-3.5" /> REASON FOR VISIT / SYMPTOMS (OPTIONAL)
          </label>
          <textarea
            rows={3}
            placeholder="Describe health issue or reason for visiting (e.g., Fever, Routine checkup, Knee pain)..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full rounded-2xl border border-[#D5E8E3] bg-[#F4F8F7] p-4 text-xs font-bold text-[#0E2924] focus:border-[#113831] focus:outline-none"
          />
        </div>

        {/* DATE & TIME SLOTS */}
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label className="flex items-center gap-1.5 text-[10px] font-black uppercase text-[#227B6B] mb-1.5">
              <Calendar className="h-3.5 w-3.5" /> APPOINTMENT DATE *
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
              <Clock className="h-3.5 w-3.5" /> TIME SLOT *
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

        {/* SUBMIT BUTTON */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#113831] py-4 text-xs font-black text-white shadow-lg hover:bg-[#227B6B] transition disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-[#A6E2D8]" /> Confirming Booking...
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