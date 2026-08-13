'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  bookAppointmentWithDoctor,
  DEFAULT_DOCTOR_ID,
  DEFAULT_PATIENT_ID,
} from '@/lib/patient/book-appointment';
import {
  Stethoscope,
  Calendar,
  Clock,
  User,
  CheckCircle2,
  ArrowRight,
  Loader2,
  AlertCircle,
} from 'lucide-react';

interface SpecialityOption {
  department: string;
  doctor: string;
  fee: string;
}

const MEDICAL_SPECIALTIES: SpecialityOption[] = [
  { department: 'Urology', doctor: 'Dr. Suriraju V', fee: '₹700' },
  { department: 'General Surgery', doctor: 'Dr. Chandrakanth S. Kesari', fee: '₹800' },
  { department: 'General Medicine', doctor: 'Dr. Ananya R', fee: '₹600' },
  { department: 'Cardiology', doctor: 'Dr. Vikramaditya Rao', fee: '₹900' },
  { department: 'Orthopedics', doctor: 'Dr. Rajesh Kumar Hegde', fee: '₹850' },
  { department: 'Neurology', doctor: 'Dr. Arvind Swamy', fee: '₹950' },
  { department: 'Neurosurgery', doctor: 'Dr. Kavitha Reddy', fee: '₹1200' },
  { department: 'Gastroenterology', doctor: 'Dr. Pradeep Verma', fee: '₹800' },
  { department: 'Nephrology', doctor: 'Dr. Anand Kulkarni', fee: '₹850' },
  { department: 'Pediatrics', doctor: 'Dr. Archana Bhat', fee: '₹650' },
  { department: 'Obstetrics & Gynecology', doctor: 'Dr. Deepa Shankar', fee: '₹800' },
  { department: 'Pulmonology', doctor: 'Dr. Harish Prasad', fee: '₹700' },
  { department: 'Dermatology', doctor: 'Dr. Nandini Sen', fee: '₹600' },
  { department: 'ENT', doctor: 'Dr. Karthik Subramanian', fee: '₹650' },
  { department: 'Ophthalmology', doctor: 'Dr. Smita Joshi', fee: '₹700' },
  { department: 'Endocrinology', doctor: 'Dr. Sangeetha Iyengar', fee: '₹800' },
  { department: 'Oncology', doctor: 'Dr. Rakesh Nair', fee: '₹1000' },
  { department: 'Psychiatry', doctor: 'Dr. Vani S. Rao', fee: '₹750' },
  { department: 'Rheumatology', doctor: 'Dr. Ashok Patel', fee: '₹800' },
  { department: 'Vascular Surgery', doctor: 'Dr. Varun Sundaram', fee: '₹900' },
  { department: 'Anaesthesiology', doctor: 'Dr. Rashmi Kulkarni', fee: '₹700' },
  { department: 'Plastic Surgery', doctor: 'Dr. Sumeet Bhalla', fee: '₹1100' },
  { department: 'Pathology', doctor: 'Dr. Nithya Srinivas', fee: '₹500' },
  { department: 'Radiology', doctor: 'Dr. Jayakrishnan Nair', fee: '₹600' },
  { department: 'Emergency Medicine', doctor: 'Dr. Santosh Shetty', fee: '₹800' },
  { department: 'Nuclear Medicine', doctor: 'Dr. Madhavi Latha', fee: '₹900' },
  { department: 'Physical Medicine & Rehab', doctor: 'Dr. Chethan Gowda', fee: '₹650' },
  { department: 'Clinical Immunology', doctor: 'Dr. Anushree Roy', fee: '₹750' },
  { department: 'Cardiothoracic Surgery', doctor: 'Dr. Girish Menon', fee: '₹1300' },
  { department: 'Pediatric Surgery', doctor: 'Dr. Lavanya Krishnan', fee: '₹850' },
  { department: 'Geriatrics', doctor: 'Dr. Hemanth Kumar', fee: '₹700' },
  { department: 'Infectious Diseases', doctor: 'Dr. Aparna Nair', fee: '₹750' },
  { department: 'Pain Management', doctor: 'Dr. Balaji Venkat', fee: '₹800' },
];

export default function BookAppointmentPage() {
  const router = useRouter();

  const [selectedDept, setSelectedDept] = useState<string>('Urology');
  const [assignedDoctor, setAssignedDoctor] = useState<string>('Dr. Suriraju V');
  const [consultationFee, setConsultationFee] = useState<string>('₹700');

  const [appointmentDate, setAppointmentDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [slotTime, setSlotTime] = useState<string>('10:30 AM');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSpecialtyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const dept = e.target.value;
    setSelectedDept(dept);

    const match = MEDICAL_SPECIALTIES.find((s) => s.department === dept);
    if (match) {
      setAssignedDoctor(match.doctor);
      setConsultationFee(match.fee);
    }
  };

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const patientName =
      typeof window !== 'undefined'
        ? localStorage.getItem('patient_full_name') || 'Aishwarya D S'
        : 'Aishwarya D S';

    try {
      const result = await bookAppointmentWithDoctor({
        doctor_id: DEFAULT_DOCTOR_ID,
        doctorId: DEFAULT_DOCTOR_ID,
        appointment_date: appointmentDate,
        appointment_time: slotTime,
        department: selectedDept,
        reason_for_visit: `${selectedDept} consultation with ${assignedDoctor}`,
        reason: `${selectedDept} consultation with ${assignedDoctor}`,
      });

      const cacheEntry = {
        id: result.appointment_id,
        patient_id: DEFAULT_PATIENT_ID,
        patient_name: patientName,
        doctor_name: assignedDoctor,
        department: selectedDept,
        hospital_name: 'Regal Hospital',
        appointment_date: appointmentDate,
        slot_time: slotTime,
        token_number: result.token_number,
        queue_status: 'SCHEDULED',
        created_at: new Date().toISOString(),
      };

      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('curasync_appointments');
        let existingAppts: unknown[] = [];
        if (saved) {
          try {
            existingAppts = JSON.parse(saved) as unknown[];
          } catch {
            existingAppts = [];
          }
        }
        localStorage.setItem(
          'curasync_appointments',
          JSON.stringify([cacheEntry, ...existingAppts]),
        );
      }

      setSuccessMessage(result.message ?? `Token ${result.token_label} generated successfully.`);
      setSuccess(true);

      setTimeout(() => {
        router.push('/patient/appointments');
      }, 1200);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to book appointment.';
      setErrorMessage(msg);
      setSuccess(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 font-sans text-[#0E2924]">
      {/* HEADER */}
      <div className="border-b border-[#D5E8E3] pb-4">
        <h1 className="text-2xl font-black text-[#0E2924]">Book OPD Consultation</h1>
        <p className="text-xs font-bold text-[#227B6B]">
          Facility: <span className="text-[#113831] font-black">Regal Hospital</span>
        </p>
      </div>

      {/* SUCCESS BANNER */}
      {success && (
        <div className="flex items-center gap-3 rounded-2xl bg-[#EAF5F2] p-4 text-xs font-bold text-[#113831] border border-[#227B6B]/30 shadow-sm">
          <CheckCircle2 className="h-5 w-5 text-[#227B6B] shrink-0" />
          <span>{successMessage ?? 'Appointment booked successfully! Redirecting to live token dashboard...'}</span>
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
        {/* MEDICAL SPECIALTY DROPDOWN */}
        <div>
          <label className="flex items-center gap-1.5 text-[10px] font-black uppercase text-[#227B6B] mb-1.5">
            <Stethoscope className="h-3.5 w-3.5 text-[#227B6B]" /> MEDICAL SPECIALTY *
          </label>
          <select
            value={selectedDept}
            onChange={handleSpecialtyChange}
            className="w-full rounded-2xl border border-[#D5E8E3] bg-[#EAF5F2]/40 p-4 text-xs font-bold text-[#0E2924] focus:border-[#113831] focus:outline-none shadow-sm cursor-pointer"
          >
            {MEDICAL_SPECIALTIES.map((s) => (
              <option key={s.department} value={s.department}>
                {s.department}
              </option>
            ))}
          </select>
        </div>

        {/* ASSIGNED DOCTOR & FEE DISPLAY */}
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label className="flex items-center gap-1.5 text-[10px] font-black uppercase text-[#227B6B] mb-1.5">
              <User className="h-3.5 w-3.5" /> ASSIGNED CONSULTANT
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
              OPD CONSULTATION FEE
            </label>
            <input
              type="text"
              readOnly
              value={consultationFee}
              className="w-full rounded-2xl border border-[#D5E8E3] bg-[#F4F8F7] p-4 text-xs font-black text-[#113831]"
            />
          </div>
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
              <Loader2 className="h-4 w-4 animate-spin text-[#A6E2D8]" /> Generating SmartQ Token...
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