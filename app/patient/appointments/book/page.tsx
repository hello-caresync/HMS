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

interface DoctorDirectoryItem {
  id: string;
  name: string;
  department: string;
  fee: string;
}

interface FamilyMemberOption {
  id: string;
  name: string;
  relation: string;
}

// COMPLETE 41 REGAL HOSPITAL CONSULTANTS
const ALL_41_DOCTORS: DoctorDirectoryItem[] = [
  { id: 'RH-D01', name: 'Dr. Suriraju V', department: 'Urology', fee: '₹700' },
  { id: 'RH-D02', name: 'Dr. Chandrakanth S. Kesari', department: 'General Surgery', fee: '₹800' },
  { id: 'RH-D03', name: 'Dr. Ananya R', department: 'General Medicine', fee: '₹600' },
  { id: 'RH-D04', name: 'Dr. Vikramaditya Rao', department: 'Cardiology', fee: '₹900' },
  { id: 'RH-D05', name: 'Dr. Meera Nambiar', department: 'Cardiology', fee: '₹850' },
  { id: 'RH-D06', name: 'Dr. Rajesh Kumar Hegde', department: 'Orthopedics', fee: '₹850' },
  { id: 'RH-D07', name: 'Dr. Shalini Deshmukh', department: 'Orthopedics', fee: '₹750' },
  { id: 'RH-D08', name: 'Dr. Arvind Swamy', department: 'Neurology', fee: '₹950' },
  { id: 'RH-D09', name: 'Dr. Kavitha Reddy', department: 'Neurosurgery', fee: '₹1200' },
  { id: 'RH-D10', name: 'Dr. Pradeep Verma', department: 'Gastroenterology', fee: '₹800' },
  { id: 'RH-D11', name: 'Dr. Sunitha Gopal', department: 'Gastroenterology', fee: '₹750' },
  { id: 'RH-D12', name: 'Dr. Anand Kulkarni', department: 'Nephrology', fee: '₹850' },
  { id: 'RH-D13', name: 'Dr. Archana Bhat', department: 'Pediatrics', fee: '₹650' },
  { id: 'RH-D14', name: 'Dr. Rohan D’Souza', department: 'Pediatrics', fee: '₹650' },
  { id: 'RH-D15', name: 'Dr. Deepa Shankar', department: 'Obstetrics & Gynecology', fee: '₹800' },
  { id: 'RH-D16', name: 'Dr. Priyanka Murthy', department: 'Obstetrics & Gynecology', fee: '₹750' },
  { id: 'RH-D17', name: 'Dr. Harish Prasad', department: 'Pulmonology', fee: '₹700' },
  { id: 'RH-D18', name: 'Dr. Nandini Sen', department: 'Dermatology', fee: '₹600' },
  { id: 'RH-D19', name: 'Dr. Karthik Subramanian', department: 'ENT', fee: '₹650' },
  { id: 'RH-D20', name: 'Dr. Smita Joshi', department: 'Ophthalmology', fee: '₹700' },
  { id: 'RH-D21', name: 'Dr. Manoj Kumar', department: 'Ophthalmology', fee: '₹700' },
  { id: 'RH-D22', name: 'Dr. Sangeetha Iyengar', department: 'Endocrinology', fee: '₹800' },
  { id: 'RH-D23', name: 'Dr. Rakesh Nair', department: 'Oncology', fee: '₹1000' },
  { id: 'RH-D24', name: 'Dr. Gautham Pai', department: 'Oncology', fee: '₹1000' },
  { id: 'RH-D25', name: 'Dr. Vani S. Rao', department: 'Psychiatry', fee: '₹750' },
  { id: 'RH-D26', name: 'Dr. Ashok Patel', department: 'Rheumatology', fee: '₹800' },
  { id: 'RH-D27', name: 'Dr. Varun Sundaram', department: 'Vascular Surgery', fee: '₹900' },
  { id: 'RH-D28', name: 'Dr. Rashmi Kulkarni', department: 'Anaesthesiology', fee: '₹700' },
  { id: 'RH-D29', name: 'Dr. Sumeet Bhalla', department: 'Plastic Surgery', fee: '₹1100' },
  { id: 'RH-D30', name: 'Dr. Nithya Srinivas', department: 'Pathology', fee: '₹500' },
  { id: 'RH-D31', name: 'Dr. Jayakrishnan Nair', department: 'Radiology', fee: '₹600' },
  { id: 'RH-D32', name: 'Dr. Bhavana Shah', department: 'Radiology', fee: '₹600' },
  { id: 'RH-D33', name: 'Dr. Santosh Shetty', department: 'Emergency Medicine', fee: '₹800' },
  { id: 'RH-D34', name: 'Dr. Madhavi Latha', department: 'Nuclear Medicine', fee: '₹900' },
  { id: 'RH-D35', name: 'Dr. Chethan Gowda', department: 'Physical Medicine & Rehab', fee: '₹650' },
  { id: 'RH-D36', name: 'Dr. Anushree Roy', department: 'Clinical Immunology', fee: '₹750' },
  { id: 'RH-D37', name: 'Dr. Girish Menon', department: 'Cardiothoracic Surgery', fee: '₹1300' },
  { id: 'RH-D38', name: 'Dr. Lavanya Krishnan', department: 'Pediatric Surgery', fee: '₹850' },
  { id: 'RH-D39', name: 'Dr. Hemanth Kumar', department: 'Geriatrics', fee: '₹700' },
  { id: 'RH-D40', name: 'Dr. Aparna Nair', department: 'Infectious Diseases', fee: '₹750' },
  { id: 'RH-D41', name: 'Dr. Balaji Venkat', department: 'Pain Management', fee: '₹800' },
];

const REGAL_HOSPITAL = 'Regal Hospital';

function stripRelationshipTag(label: string): string {
  return label.replace(/\s\([^)]+\)/, '').trim();
}

function getDoctorSearchKey(doctorName: string): string {
  const withoutPrefix = doctorName.replace(/^Dr\.?\s*/i, '').trim();
  const [firstNamePart] = withoutPrefix.split(/\s+/);
  return firstNamePart && firstNamePart.length >= 4 ? firstNamePart : withoutPrefix;
}

export default function BookAppointmentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // PATIENT SELECTION (SELF + LINKED FAMILY MEMBERS)
  const [selectedPatientName, setSelectedPatientName] = useState<string>('Aishwarya D S (Self)');
  const [patientOptions, setPatientOptions] = useState<FamilyMemberOption[]>([]);

  // CLINICIAN & CLINICAL DETAILS
  const [selectedDoctorName, setSelectedDoctorName] = useState<string>('Dr. Chandrakanth S. Kesari');
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
    // 1. Read URL query parameters if routed from Directory
    const docParam = searchParams.get('doctor');
    const deptParam = searchParams.get('department');
    const feeParam = searchParams.get('fee');

    if (docParam) {
      const match = ALL_41_DOCTORS.find(
        (d) => d.name.toLowerCase() === docParam.toLowerCase()
      );
      if (match) {
        setSelectedDoctorName(match.name);
        setSelectedDept(match.department);
        setConsultationFee(match.fee);
      } else {
        setSelectedDoctorName(docParam);
        if (deptParam) setSelectedDept(deptParam);
        if (feeParam) setConsultationFee(feeParam);
      }
    }

    // 2. Load Patient & Linked Family Members from Local Storage & Supabase
    loadPatientAndFamilyOptions();
  }, [searchParams]);

  const loadPatientAndFamilyOptions = async () => {
    let primaryName = 'Aishwarya D S';
    let familyMembersList: FamilyMemberOption[] = [];

    // Local Storage check
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

    // Supabase DB check
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
      console.warn('Profile sync fallback active');
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

  // Handle selecting a doctor from the full 41-doctor list
  const handleDoctorSelectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const docName = e.target.value;
    setSelectedDoctorName(docName);

    const match = ALL_41_DOCTORS.find((d) => d.name === docName);
    if (match) {
      setSelectedDept(match.department);
      setConsultationFee(match.fee);
    }
  };

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccess(false);

    const cleanPatientName = stripRelationshipTag(selectedPatientName);
    const doctorSearchKey = getDoctorSearchKey(selectedDoctorName);

    // 1. Calculate dynamic sequential token count from Supabase for this doctor + date
    let calculatedToken = 1;
    const { count, error: countError } = await supabase
      .from('patient_appointments')
      .select('*', { count: 'exact', head: true })
      .ilike('doctor_name', `%${doctorSearchKey}%`)
      .eq('appointment_date', appointmentDate);

    if (countError) {
      console.error('Token count query failed:', countError.message);
      setErrorMessage(`Unable to calculate queue token: ${countError.message}`);
      setIsSubmitting(false);
      return;
    }

    calculatedToken = (count ?? 0) + 1;

    // 2. Build complete appointment payload — facility locked to Regal Hospital
    const newAppt = {
      id:
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `apt_${Date.now()}`,
      patient_id: 'NEX_9021',
      patient_name: cleanPatientName,
      doctor_name: selectedDoctorName,
      department: selectedDept,
      hospital_name: REGAL_HOSPITAL,
      appointment_date: appointmentDate,
      slot_time: slotTime,
      fee: consultationFee,
      reason: reason.trim() || 'General OPD Consultation',
      token_number: calculatedToken,
      queue_status: 'SCHEDULED',
      created_at: new Date().toISOString(),
    };

    // 3. Mandatory cloud write — booking fails if Supabase insert fails
    const { error: apptErr } = await supabase.from('patient_appointments').insert([newAppt]);

    if (apptErr) {
      console.error('Supabase patient_appointments insert failed:', apptErr.message);
      setErrorMessage(
        `Booking could not be saved to the hospital cloud queue. ${apptErr.message}`,
      );
      setIsSubmitting(false);
      return;
    }

    // Secondary queue mirror (best-effort; does not block patient confirmation)
    try {
      const { error: queueErr } = await supabase.from('hms_opd_queue').insert([newAppt]);
      if (queueErr) {
        console.warn('Supabase hms_opd_queue mirror notice:', queueErr.message);
      }
    } catch (mirrorErr) {
      console.warn('hms_opd_queue mirror exception:', mirrorErr);
    }

    // 4. Local cache only after successful cloud write
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('curasync_appointments');
      const existing = saved ? JSON.parse(saved) : [];
      localStorage.setItem('curasync_appointments', JSON.stringify([newAppt, ...existing]));
    }

    setIsSubmitting(false);
    setSuccess(true);

    setTimeout(() => {
      router.push('/patient/appointments');
    }, 1000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 font-sans text-[#0E2924]">
      {/* HEADER SECTION */}
      <div className="border-b border-[#D5E8E3] pb-4">
        <h1 className="text-2xl font-black text-[#0E2924]">Confirm Consultation Booking</h1>
        <p className="text-xs font-bold text-[#227B6B]">
          Facility: <span className="text-[#113831] font-black">{REGAL_HOSPITAL}</span> • OPD Consultation
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

        {/* CLINICIAN (ALL 41 DOCTORS INCLUDED) */}
        <div>
          <label className="flex items-center gap-1.5 text-[10px] font-black uppercase text-[#227B6B] mb-1.5">
            <User className="h-3.5 w-3.5 text-[#227B6B]" /> SELECT CLINICIAN (41 SPECIALISTS AVAILABLE) *
          </label>
          <select
            value={selectedDoctorName}
            onChange={handleDoctorSelectionChange}
            className="w-full rounded-2xl border border-[#D5E8E3] bg-white p-4 text-xs font-black text-[#113831] focus:border-[#113831] focus:outline-none shadow-sm cursor-pointer"
          >
            {ALL_41_DOCTORS.map((doc) => (
              <option key={doc.id} value={doc.name}>
                {doc.name} — {doc.department} ({doc.fee})
              </option>
            ))}
          </select>
        </div>

        {/* DEPARTMENT & FEE SUMMARY */}
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label className="flex items-center gap-1.5 text-[10px] font-black uppercase text-[#227B6B] mb-1.5">
              <Stethoscope className="h-3.5 w-3.5 text-[#227B6B]" /> CLINICAL DEPARTMENT
            </label>
            <input
              type="text"
              readOnly
              value={selectedDept}
              className="w-full rounded-2xl border border-[#D5E8E3] bg-[#F4F8F7] p-4 text-xs font-black text-[#113831]"
            />
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-[10px] font-black uppercase text-[#227B6B] mb-1.5">
              CONSULTATION FEE
            </label>
            <input
              type="text"
              readOnly
              value={consultationFee}
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

        {/* FACILITY LOCATION */}
        <div className="flex items-center gap-2 text-xs font-bold text-[#227B6B] bg-[#EAF5F2]/40 p-3.5 rounded-2xl border border-[#D5E8E3]">
          <Building2 className="h-4 w-4 shrink-0 text-[#113831]" />
          <span>Consultation Location: <strong>{REGAL_HOSPITAL} OPD Block</strong></span>
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