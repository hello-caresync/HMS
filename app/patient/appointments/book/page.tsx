'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabaseClient';
import {
  calculateNextOpdTokenNumber,
  formatHashTokenLabel,
} from '@/lib/hospital/operations/appointment-sync';
import {
  PATIENT_APPOINTMENTS_UUID,
  resolvePatientDbId,
} from '@/lib/patient/constants';
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
const PATIENT_BOOKING_SOURCE = 'patient_app';
const LEGACY_PATIENT_UUID_FALLBACK = '00000000-0000-0000-0000-000000009021';

/** Static registered-patient UUID fallback when Web Crypto is unavailable. */
const STATIC_PATIENT_UUID_FALLBACK = PATIENT_APPOINTMENTS_UUID;

function isValidStandardUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function isValidUUID(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value.trim())
  );
}

function resolveRegisteredPatientUuid(sessionPatientId?: string | null): string {
  const resolved = resolvePatientDbId(sessionPatientId);
  return isValidStandardUuid(resolved) ? resolved : STATIC_PATIENT_UUID_FALLBACK;
}

function stripRelationshipTag(label: string): string {
  return label.replace(/\s\([^)]+\)/, '').trim();
}

function findDoctorDirectoryEntry(doctorName: string): DoctorDirectoryItem | undefined {
  return ALL_41_DOCTORS.find((doctor) => doctor.name === doctorName);
}

function findDoctorFromUrlParam(docParam: string): DoctorDirectoryItem | undefined {
  const normalized = decodeURIComponent(docParam).trim().toLowerCase();

  return ALL_41_DOCTORS.find((doctor) => {
    const doctorName = doctor.name.toLowerCase();
    const doctorLastName = doctorName.replace(/^dr\.?\s*/i, '');
    return (
      doctorName === normalized ||
      doctorName.includes(normalized) ||
      normalized.includes(doctorLastName) ||
      doctorLastName.includes(normalized)
    );
  });
}

function mirrorAppointmentToLocalStorage(appointment: Record<string, unknown>): void {
  if (typeof window === 'undefined') return;

  try {
    const saved = localStorage.getItem('curasync_appointments');
    const existing = saved ? JSON.parse(saved) : [];
    const nextList = Array.isArray(existing) ? [appointment, ...existing] : [appointment];
    localStorage.setItem('curasync_appointments', JSON.stringify(nextList));
  } catch (storageErr) {
    console.warn('Local appointment mirror failed:', storageErr);
  }
}

async function calculateNextTokenNumber(
  doctorEmployeeId: string,
  doctorName: string,
  appointmentDate: string,
): Promise<number> {
  try {
    return await calculateNextOpdTokenNumber(
      supabase,
      doctorEmployeeId,
      doctorName,
      appointmentDate,
    );
  } catch (err) {
    console.warn('Token counter fallback:', err);
    return 1;
  }
}

function resolveBookingPatientId(existingPatientId: string): string {
  if (isValidUUID(existingPatientId)) return existingPatientId.trim();
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return LEGACY_PATIENT_UUID_FALLBACK;
}

function isSchemaCacheError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes('schema cache') ||
    lower.includes('could not find') ||
    lower.includes('does not exist') ||
    lower.includes('pgrst') ||
    lower.includes('invalid input syntax for type uuid')
  );
}

interface ComprehensiveAppointmentInput {
  patientId: string;
  patientName: string;
  doctorName: string;
  doctorCode: string;
  department: string;
  appointmentDate: string;
  slotTime: string;
  consultationFee: string;
  reason: string;
  tokenNumber: number;
  tokenLabel: string;
  createdAt: string;
}

/** All alias variations for patient_appointments + appointments schema compatibility. */
function buildComprehensiveAppointmentPayload(
  input: ComprehensiveAppointmentInput,
): Record<string, unknown> {
  const doctorCode = String(input.doctorCode || 'RH-D01').trim().toUpperCase();
  const doctorName = input.doctorName.trim();
  const patientName = input.patientName.trim() || 'Patient';
  const clinicalReason = input.reason.trim() || 'General OPD Consultation';
  const slotTime = input.slotTime || '10:00 AM';
  const feeDisplay = input.consultationFee || '₹800';

  return {
    // Patient identity — both name column aliases
    patient_id: input.patientId,
    name: patientName,
    patient_name: patientName,

    // Clinician routing (RH-D## + name aliases)
    doctor_name: doctorName,
    doctor_code: doctorCode,
    doctor_id: doctorCode,
    doctor_employee_id: doctorCode,

    // Facility & department
    department: input.department,
    hospital_name: REGAL_HOSPITAL,

    // Scheduling (all time-slot column aliases)
    appointment_date: input.appointmentDate,
    slot_time: slotTime,
    appointment_time: slotTime,
    time_slot: slotTime,

    // Fee (display string on both fee columns for patient_appointments compatibility)
    fee: feeDisplay,
    consultation_fee: feeDisplay,

    // Clinical intake (all complaint column aliases)
    reason: clinicalReason,
    chief_complaint: clinicalReason,
    reason_for_visit: clinicalReason,

    // Queue & token
    token_number: input.tokenNumber,
    token_label: input.tokenLabel,
    queue_number: input.tokenNumber,
    status: 'SCHEDULED',
    queue_status: 'SCHEDULED',

    // Metadata
    source: PATIENT_BOOKING_SOURCE,
    booking_source: PATIENT_BOOKING_SOURCE,
    vitals_summary: 'BP: 120/80 • HR: 72 • SpO2: 98%',
    created_at: input.createdAt,
    updated_at: input.createdAt,
  };
}

function buildPatientAppointmentPayload(input: {
  patientId: string;
  patientName: string;
  doctorName: string;
  doctorCode: string;
  department: string;
  appointmentDate: string;
  slotTime: string;
  consultationFee: string;
  reason: string;
  tokenNumber: number;
  tokenLabel: string;
  createdAt: string;
}): Record<string, unknown> {
  const patientName = input.patientName.trim() || 'Patient';
  const feeDisplay = input.consultationFee || '₹800';

  return {
    ...buildComprehensiveAppointmentPayload({ ...input, patientName }),
    name: patientName,
    patient_name: patientName,
    fee: feeDisplay,
    consultation_fee: feeDisplay,
    token_number: input.tokenNumber,
    queue_number: input.tokenNumber,
    token_label: input.tokenLabel,
    source: PATIENT_BOOKING_SOURCE,
    queue_status: 'SCHEDULED',
    created_at: input.createdAt,
  };
}

function buildAppointmentsLedgerPayload(input: {
  patientId: string;
  patientName: string;
  doctorName: string;
  doctorCode: string;
  department: string;
  appointmentDate: string;
  slotTime: string;
  consultationFee: string;
  reason: string;
  tokenNumber: number;
  tokenLabel: string;
  createdAt: string;
}): Record<string, unknown> {
  const patientName = input.patientName.trim() || 'Patient';
  const feeDisplay = input.consultationFee || '₹800';
  const feeNumeric = Number(String(feeDisplay).replace(/[^\d.]/g, '')) || 800;

  return {
    ...buildComprehensiveAppointmentPayload({ ...input, patientName }),
    name: patientName,
    patient_name: patientName,
    fee: feeDisplay,
    consultation_fee: feeNumeric,
    age: 25,
    gender: 'Female',
    token_number: input.tokenNumber,
    queue_number: input.tokenNumber,
    token_label: input.tokenLabel,
    source: PATIENT_BOOKING_SOURCE,
  };
}

function applyClinicianFromUrlParams(
  docParam: string | null,
  deptParam: string | null,
  feeParam: string | null,
  setters: {
    setDoctor: (value: string) => void;
    setDoctorCode: (value: string) => void;
    setDept: (value: string) => void;
    setFee: (value: string) => void;
  },
): void {
  if (docParam) {
    const match = findDoctorFromUrlParam(docParam);
    if (match) {
      setters.setDoctor(match.name);
      setters.setDoctorCode(match.id);
      setters.setDept(match.department);
      setters.setFee(match.fee);
      return;
    }

    setters.setDoctor(decodeURIComponent(docParam));
  }

  if (deptParam) setters.setDept(decodeURIComponent(deptParam));
  if (feeParam) setters.setFee(decodeURIComponent(feeParam));
}

export default function BookAppointmentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // PATIENT SELECTION (SELF + LINKED FAMILY MEMBERS)
  const [selectedPatientName, setSelectedPatientName] = useState<string>('Aishwarya D S (Self)');
  const [patientOptions, setPatientOptions] = useState<FamilyMemberOption[]>([]);

  // CLINICIAN & CLINICAL DETAILS
  const [selectedDoctorName, setSelectedDoctorName] = useState<string>('Dr. Chandrakanth S. Kesari');
  const [selectedDoctorCode, setSelectedDoctorCode] = useState<string>('RH-D02');
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
  const [patientId, setPatientId] = useState<string>(STATIC_PATIENT_UUID_FALLBACK);
  const [bookedSummary, setBookedSummary] = useState<{
    token: number;
    doctor: string;
    date: string;
    slot: string;
  } | null>(null);

  useEffect(() => {
    applyClinicianFromUrlParams(
      searchParams.get('doctor'),
      searchParams.get('department'),
      searchParams.get('fee'),
      {
        setDoctor: setSelectedDoctorName,
        setDoctorCode: setSelectedDoctorCode,
        setDept: setSelectedDept,
        setFee: setConsultationFee,
      },
    );

    void loadPatientAndFamilyOptions();
  }, [searchParams]);

  const loadPatientAndFamilyOptions = async () => {
    let primaryName = 'Aishwarya D S';
    let familyMembersList: FamilyMemberOption[] = [];
    let resolvedPatientId = STATIC_PATIENT_UUID_FALLBACK;

    if (typeof window !== 'undefined') {
      const storedName = localStorage.getItem('patient_full_name');
      const savedProfile = localStorage.getItem('curasync_patient_profile');
      const sessionPatientId =
        localStorage.getItem('patient_id') ??
        localStorage.getItem('curasync_patient_id') ??
        undefined;

      resolvedPatientId = resolveRegisteredPatientUuid(sessionPatientId);

      if (storedName) primaryName = storedName;

      if (savedProfile) {
        try {
          const parsed = JSON.parse(savedProfile) as {
            full_name?: string;
            family_members?: FamilyMemberOption[];
            id?: string;
            patient_id?: string;
          };
          if (parsed.full_name) primaryName = parsed.full_name;
          if (Array.isArray(parsed.family_members)) {
            familyMembersList = parsed.family_members;
          }
          resolvedPatientId = resolveRegisteredPatientUuid(
            parsed.id ?? parsed.patient_id ?? sessionPatientId,
          );
        } catch {
          /* use cached defaults */
        }
      }
    }

    try {
      const profileQueries = await Promise.all([
        supabase
          .from('patient_profiles')
          .select('id, patient_id, full_name, family_members')
          .eq('id', resolvedPatientId)
          .maybeSingle(),
        supabase
          .from('patient_profiles')
          .select('id, patient_id, full_name, family_members')
          .eq('patient_id', resolvedPatientId)
          .maybeSingle(),
      ]);

      const profileRecord =
        profileQueries.find((result) => !result.error && result.data)?.data ?? null;

      if (profileRecord) {
        if (profileRecord.full_name) primaryName = String(profileRecord.full_name);
        if (Array.isArray(profileRecord.family_members)) {
          familyMembersList = profileRecord.family_members as FamilyMemberOption[];
        }
        resolvedPatientId = resolveRegisteredPatientUuid(
          String(profileRecord.id ?? profileRecord.patient_id ?? resolvedPatientId),
        );
      }
    } catch {
      console.warn('Profile sync fallback active');
    }

    const options: FamilyMemberOption[] = [
      { id: 'self', name: `${primaryName} (Self)`, relation: 'Self' },
      ...familyMembersList.map((member) => ({
        id: member.id || member.name,
        name: `${member.name} (${member.relation})`,
        relation: member.relation,
      })),
    ];

    setPatientId(resolvedPatientId);
    setPatientOptions(options);
    setSelectedPatientName(options[0]?.name ?? `${primaryName} (Self)`);
  };

  // Handle selecting a doctor from the full 41-doctor list
  const handleDoctorSelectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const docName = e.target.value;
    setSelectedDoctorName(docName);

    const match = ALL_41_DOCTORS.find((d) => d.name === docName);
    if (match) {
      setSelectedDoctorCode(match.id);
      setSelectedDept(match.department);
      setConsultationFee(match.fee);
    }
  };

  const handleBookAppointment = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccess(false);
    setBookedSummary(null);

    try {
      const cleanPatientName = stripRelationshipTag(selectedPatientName);
      const doctorEntry = findDoctorDirectoryEntry(selectedDoctorName);
      const rawDoctorName =
        selectedDoctorName || doctorEntry?.name || 'Dr CHANDRAKANTH S KESARI';
      const rawDoctorCode = (
        selectedDoctorCode ||
        doctorEntry?.id ||
        'RH-D01'
      )
        .trim()
        .toUpperCase();
      const selectedTime = slotTime || '10:00 AM';
      const calculatedToken = await calculateNextTokenNumber(
        rawDoctorCode,
        rawDoctorName,
        appointmentDate,
      );
      const tokenLabel = formatHashTokenLabel(calculatedToken);
      const clinicalReason = reason.trim() || 'General OPD Consultation';
      const createdAt = new Date().toISOString();
      const resolvedPatientId = resolveBookingPatientId(patientId);
      const department = selectedDept || doctorEntry?.department || 'General Surgery';
      const resolvedDate = appointmentDate || new Date().toISOString().split('T')[0];

      const patientPayload = buildPatientAppointmentPayload({
        patientId: resolvedPatientId,
        patientName: cleanPatientName.trim() || 'Patient',
        doctorName: rawDoctorName,
        doctorCode: rawDoctorCode,
        department,
        appointmentDate: resolvedDate,
        slotTime: selectedTime,
        consultationFee,
        reason: clinicalReason,
        tokenNumber: calculatedToken,
        tokenLabel,
        createdAt,
      });

      const appointmentsPayload = buildAppointmentsLedgerPayload({
        patientId: resolvedPatientId,
        patientName: cleanPatientName.trim() || 'Patient',
        doctorName: rawDoctorName,
        doctorCode: rawDoctorCode,
        department,
        appointmentDate: resolvedDate,
        slotTime: selectedTime,
        consultationFee,
        reason: clinicalReason,
        tokenNumber: calculatedToken,
        tokenLabel,
        createdAt,
      });

      console.log('Sending patient_appointments payload to Supabase:', patientPayload);

      let savedRecord: Record<string, unknown> | null = null;
      let persistenceSource: 'patient_appointments' | 'appointments' | 'local' = 'local';
      let patientErrorMessage: string | null = null;

      // Primary persistence — patient_appointments
      try {
        const { data: patientData, error: patientError } = await supabase
          .from('patient_appointments')
          .insert([patientPayload])
          .select()
          .maybeSingle();

        if (patientError) {
          patientErrorMessage = patientError.message || 'Unknown patient_appointments error';
          console.error('Supabase error inserting patient_appointments:', patientErrorMessage);
        } else if (patientData) {
          savedRecord = patientData as Record<string, unknown>;
          persistenceSource = 'patient_appointments';
        }
      } catch (primaryErr) {
        patientErrorMessage =
          primaryErr instanceof Error ? primaryErr.message : 'patient_appointments insert failed';
        console.error('patient_appointments insert exception:', primaryErr);
      }

      // Auxiliary mirror — appointments ledger (isolated; never blocks booking)
      try {
        console.log('Sending appointments ledger payload to Supabase:', appointmentsPayload);

        const { data: appointmentData, error: appointmentError } = await supabase
          .from('appointments')
          .insert([appointmentsPayload])
          .select()
          .maybeSingle();

        if (appointmentError) {
          console.warn('appointments mirror skipped:', appointmentError.message);
        } else if (appointmentData && !savedRecord) {
          savedRecord = appointmentData as Record<string, unknown>;
          persistenceSource = 'appointments';
        }
      } catch (mirrorErr) {
        console.warn('appointments mirror exception (non-blocking):', mirrorErr);
      }

      // Local fallback when Supabase schema/cache rejects the primary insert
      if (!savedRecord) {
        const canFallbackLocally =
          !patientErrorMessage || isSchemaCacheError(patientErrorMessage);

        if (canFallbackLocally) {
          mirrorAppointmentToLocalStorage({
            ...patientPayload,
            ...appointmentsPayload,
            source: PATIENT_BOOKING_SOURCE,
            status: 'SCHEDULED',
            queue_status: 'SCHEDULED',
          });
          savedRecord = patientPayload;
          persistenceSource = 'local';
        } else {
          setErrorMessage(`Booking could not be saved. ${patientErrorMessage}`);
          toast.error(`Booking failed: ${patientErrorMessage}`);
          return;
        }
      } else {
        mirrorAppointmentToLocalStorage({
          ...patientPayload,
          ...appointmentsPayload,
          ...(savedRecord ?? {}),
          source: PATIENT_BOOKING_SOURCE,
          status: 'SCHEDULED',
          queue_status: 'SCHEDULED',
        });
      }

      setBookedSummary({
        token: calculatedToken,
        doctor: rawDoctorName,
        date: resolvedDate,
        slot: selectedTime,
      });
      setSuccess(true);

      if (persistenceSource === 'local') {
        toast.warning(`Appointment saved locally. Token: ${tokenLabel}`);
      } else {
        toast.success(`Appointment confirmed! Token: ${tokenLabel}`);
      }

      setTimeout(() => {
        router.push('/patient/appointments');
      }, 1000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error completing booking';
      console.error('Unexpected booking error:', err);
      toast.error(message);
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
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
      {success && bookedSummary && (
        <div className="rounded-2xl border border-[#227B6B]/30 bg-gradient-to-r from-[#EAF5F2] to-white p-5 shadow-md">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#113831] text-white">
              <CheckCircle2 className="h-6 w-6 text-[#A6E2D8]" />
            </div>
            <div className="min-w-0 space-y-2">
              <p className="text-sm font-black text-[#0E2924]">
                SmartQ Token Confirmed — {REGAL_HOSPITAL}
              </p>
              <div className="grid gap-1.5 text-xs font-semibold text-[#113831] sm:grid-cols-2">
                <p>
                  Token:{' '}
                  <span className="font-black text-[#227B6B]">
                    {formatHashTokenLabel(bookedSummary.token)}
                  </span>
                </p>
                <p>
                  Clinician:{' '}
                  <span className="font-black">{bookedSummary.doctor}</span>
                </p>
                <p>
                  Date: <span className="font-black">{bookedSummary.date}</span>
                </p>
                <p>
                  Slot: <span className="font-black">{bookedSummary.slot}</span>
                </p>
              </div>
              <p className="text-[11px] font-bold text-[#227B6B]">
                Your consultation is confirmed. Redirecting to appointments...
              </p>
            </div>
          </div>
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
            required
          >
            {patientOptions.length === 0 ? (
              <option value={selectedPatientName}>{selectedPatientName}</option>
            ) : (
              patientOptions.map((opt) => (
                <option key={opt.id} value={opt.name}>
                  {opt.name}
                </option>
              ))
            )}
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