'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabaseClient';
import {
  calculateNextOpdTokenNumber,
} from '@/lib/hospital/operations/appointment-sync';
import { REGAL_FACILITY_CODE, REGAL_HOSPITAL_CODE } from '@/lib/regal/constants';
import { isHospitalUuid, resolveHospitalUuid } from '@/lib/hospital/resolve-hospital-context';
import { formatDoctorBookingOptionLabel } from '@/lib/hospital/doctors';
import {
  fetchPatientBookableDoctors,
  formatConsultationFee,
  type DoctorStaffRecord,
} from '@/lib/hospital/hospital-staff-roster';
import {
  DEFAULT_HOSPITAL_DEPARTMENT,
  doctorsForDepartment,
  mergeDepartmentOptions,
} from '@/lib/hospital/departments';
import {
  insertAppointmentRowResilient,
  missingColumnFromPostgrestError,
} from '@/lib/hospital/appointments';
import { resolveDoctorBookingIdentity } from '@/lib/hospital/doctor-booking-identity';
import { isUuidValue } from '@/lib/hospital/hospital-node';
import { bookDoctorTimeSlot } from '@/lib/doctor/scheduling/doctor-availability';
import { DynamicSlotPicker } from '@/components/patient/DynamicSlotPicker';
import {
  assertSlotAvailableForBooking,
  loadDynamicDoctorSchedule,
  resolveAutoSelectedSlot,
} from '@/lib/scheduling/doctor-slot-service';
import type { DynamicSlot } from '@/lib/scheduling/dynamic-slots';
import { consultationDurationMinutes, classifyConditionTier } from '@/lib/scheduling/dynamic-slots';
import { parsePatientAge, validatePhoneField } from '@/lib/hospital/indian-patient';
import {
  mintPatientUhid,
  readPatientPortalSession,
  resolveActivePatientFormIdentity,
} from '@/lib/patient/portal-session';
import { getActivePatientId, persistActivePatientNode } from '@/lib/patient/active-patient-node';
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

function toDirectoryItem(doc: DoctorStaffRecord): DoctorDirectoryItem {
  return {
    id: doc.doctor_id || doc.id,
    name: doc.full_name,
    department: doc.department,
    fee: formatConsultationFee(doc.consultation_fee),
  };
}

const REGAL_HOSPITAL = 'Regal Hospital';
const PATIENT_BOOKING_SOURCE = 'patient_app';
const PATIENT_BOOKING_STATUS = 'WAITING';

function isValidUUID(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value.trim())
  );
}

function resolveBookingPatientId(): string {
  return getActivePatientId();
}

function stripRelationshipTag(label: string): string {
  return label.replace(/\s\([^)]+\)/, '').trim();
}

function findDoctorDirectoryEntry(
  doctors: DoctorDirectoryItem[],
  doctorName: string,
): DoctorDirectoryItem | undefined {
  return doctors.find((doctor) => doctor.name === doctorName);
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

function formatBookingTokenLabel(tokenNumber: number): string {
  const seq = Number.isFinite(tokenNumber) && tokenNumber > 0 ? tokenNumber : 1;
  return `Token #${seq}`;
}

interface FullyAliasedBookingInput {
  patientId: string;
  patientName: string;
  uhid: string;
  phone: string;
  hospitalId: string;
  hospitalName: string;
  doctorName: string;
  doctorCode: string;
  doctorUuid?: string | null;
  department: string;
  appointmentDate: string;
  slotTime: string;
  consultationFee: string;
  reason: string;
  tokenNumber: number;
  nowIso: string;
  age?: number | null;
  gender?: string;
}

/** Canonical Supabase insert — every column alias variation in one object. */
function buildFullyAliasedBookingPayload(input: FullyAliasedBookingInput): Record<string, unknown> {
  const tokenString = formatBookingTokenLabel(input.tokenNumber);
  const patientName = input.patientName.trim();
  const doctorIdentity = resolveDoctorBookingIdentity({
    doctor_uuid: input.doctorUuid,
    doctor_code: input.doctorCode,
    doctor_id: input.doctorUuid || input.doctorCode,
    id: input.doctorUuid,
    full_name: input.doctorName,
    department: input.department,
  });
  const doctorCode = doctorIdentity.doctorCode || String(input.doctorCode || '').trim().toUpperCase();
  const doctorUuid = doctorIdentity.doctorUuid;
  const doctorName = doctorIdentity.doctorName || input.doctorName.trim();
  const department = doctorIdentity.department || input.department.trim();
  const clinicalReason = input.reason.trim();
  const slotTime = input.slotTime;
  const feeDisplay = input.consultationFee;
  const seq = Number.isFinite(input.tokenNumber) && input.tokenNumber > 0 ? input.tokenNumber : 1;

  const payload: Record<string, unknown> = {
    name: patientName,
    patient_name: patientName,
    uhid: input.uhid,
    phone: input.phone,
    patient_phone: input.phone,
    doctor_name: doctorName,
    doctor_code: doctorCode || doctorUuid,
    doctor_uuid: doctorUuid,
    doctor_id: doctorUuid || doctorCode,
    doctor_employee_id: doctorCode || doctorUuid,
    department,
    hospital_id: REGAL_HOSPITAL_CODE,
    hospital_code: REGAL_HOSPITAL_CODE,
    facility_code: REGAL_FACILITY_CODE,
    hospital_name: input.hospitalName || REGAL_HOSPITAL,
    appointment_date: input.appointmentDate,
    slot_time: slotTime,
    appointment_time: slotTime,
    time_slot: slotTime,
    slot_duration_minutes: consultationDurationMinutes(classifyConditionTier(input.reason)),
    consultation_duration_minutes: consultationDurationMinutes(classifyConditionTier(input.reason)),
    fee: feeDisplay,
    consultation_fee: feeDisplay,
    reason: clinicalReason,
    chief_complaint: clinicalReason,
    reason_for_visit: clinicalReason,
    token_number: seq,
    queue_number: seq,
    token_label: tokenString,
    source: PATIENT_BOOKING_SOURCE,
    booking_source: PATIENT_BOOKING_SOURCE,
    status: PATIENT_BOOKING_STATUS,
    queue_status: PATIENT_BOOKING_STATUS,
    billing_status: 'pending_checkout',
    created_at: input.nowIso,
    updated_at: input.nowIso,
  };

  if (typeof input.age === 'number' && Number.isFinite(input.age)) {
    payload.age = input.age;
    payload.patient_age = input.age;
  }
  if (input.gender?.trim()) {
    payload.gender = input.gender.trim();
  }

  if (isUuidValue(input.patientId)) {
    payload.patient_id = input.patientId;
  }

  return payload;
}

/** Token column aliases — token_number, queue_number, token_label. */
function buildPatientAppointmentPayload(input: FullyAliasedBookingInput): Record<string, unknown> {
  return buildFullyAliasedBookingPayload(input);
}

function buildAppointmentsLedgerPayload(input: FullyAliasedBookingInput): Record<string, unknown> {
  const feeDisplay = input.consultationFee;
  const feeNumeric = Number(String(feeDisplay).replace(/[^\d.]/g, '')) || 0;

  return {
    ...buildFullyAliasedBookingPayload(input),
    consultation_fee: feeNumeric,
  };
}

function buildOpdQueuePayload(input: FullyAliasedBookingInput): Record<string, unknown> {
  return {
    hospital_id: REGAL_HOSPITAL_CODE,
    hospital_code: REGAL_HOSPITAL_CODE,
    hospital_name: input.hospitalName || REGAL_HOSPITAL,
    token_number: formatBookingTokenLabel(input.tokenNumber),
    uhid: input.uhid,
    patient_name: input.patientName.trim(),
    phone: input.phone,
    department: input.department,
    doctor_id: input.doctorCode,
    doctor_name: input.doctorName,
    status: PATIENT_BOOKING_STATUS,
    source: PATIENT_BOOKING_SOURCE,
    appointment_date: input.appointmentDate,
  };
}

function toDirectDbPayload(payload: Record<string, unknown>): Record<string, unknown> {
  const { hospital_code: _hospitalCode, facility_code: _facilityCode, ...dbPayload } = payload;
  return dbPayload;
}

async function insertDirectLedgerRow(
  table: 'appointments' | 'patient_appointments',
  payload: Record<string, unknown>,
): Promise<{ data: Record<string, unknown> | null; errorMessage: string | null }> {
  try {
    const dbPayload: Record<string, unknown> = toDirectDbPayload(payload);
    const { data, error } = await insertAppointmentRowResilient(supabase, dbPayload, { table });

    if (error) {
      const missingColumn = missingColumnFromPostgrestError(error.message);
      if (missingColumn) {
        console.warn(`[${table}] omitted missing column: ${missingColumn}`);
      }
      return { data: null, errorMessage: error.message || 'Booking failed' };
    }

    return { data, errorMessage: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : `${table} insert failed`;
    return { data: null, errorMessage: message };
  }
}

async function insertAppointmentsLedger(
  payload: Record<string, unknown>,
): Promise<{ data: Record<string, unknown> | null; errorMessage: string | null }> {
  return insertDirectLedgerRow('appointments', payload);
}

async function insertPatientAppointmentsLedger(
  payload: Record<string, unknown>,
): Promise<{ data: Record<string, unknown> | null; errorMessage: string | null }> {
  return insertDirectLedgerRow('patient_appointments', payload);
}

function buildConfirmedLocalMirrorRecord(
  patientPayload: Record<string, unknown>,
  appointmentsPayload: Record<string, unknown>,
  nowIso: string,
  savedRecord?: Record<string, unknown> | null,
): Record<string, unknown> {
  return {
    ...patientPayload,
    ...appointmentsPayload,
    ...(savedRecord ?? {}),
    source: PATIENT_BOOKING_SOURCE,
    booking_source: PATIENT_BOOKING_SOURCE,
    status: PATIENT_BOOKING_STATUS,
    queue_status: PATIENT_BOOKING_STATUS,
    created_at: nowIso,
    updated_at: nowIso,
  };
}

export default function BookAppointmentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // PATIENT SELECTION (SELF + LINKED FAMILY MEMBERS)
  const [selectedPatientName, setSelectedPatientName] = useState<string>('');
  const [patientOptions, setPatientOptions] = useState<FamilyMemberOption[]>([]);

  const [doctorList, setDoctorList] = useState<DoctorStaffRecord[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorStaffRecord | null>(null);
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(true);
  const [selectedDoctorName, setSelectedDoctorName] = useState<string>('');
  const [selectedDoctorCode, setSelectedDoctorCode] = useState<string>('');
  const [selectedDept, setSelectedDept] = useState<string>(DEFAULT_HOSPITAL_DEPARTMENT);
  const [consultationFee, setConsultationFee] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');

  // SCHEDULING DETAILS
  const [appointmentDate, setAppointmentDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [slotTime, setSlotTime] = useState<string>('');
  const [dynamicSlots, setDynamicSlots] = useState<DynamicSlot[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState<string>('');
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [patientId, setPatientId] = useState<string>('');
  const [bookedSummary, setBookedSummary] = useState<{
    token: number;
    doctor: string;
    date: string;
    slot: string;
  } | null>(null);

  useEffect(() => {
    void loadPatientAndFamilyOptions();
  }, []);

  useEffect(() => {
    let cancelled = false;
    const applyRows = (rows: DoctorStaffRecord[]) => {
      if (cancelled) return;
      setDoctorList(rows);
      const requested = searchParams.get('doctor');
      const requestedMatch =
        rows.find((row) => row.id === requested || row.full_name === requested) ||
        (requested
          ? rows.find((row) => row.full_name.toLowerCase().includes(requested.toLowerCase()))
          : null) ||
        null;
      const department = requestedMatch?.department || DEFAULT_HOSPITAL_DEPARTMENT;
      setSelectedDept(department);
      const inDepartment = doctorsForDepartment(rows, department);
      const preselected =
        requestedMatch &&
        inDepartment.some(
          (row) =>
            row.doctor_id === requestedMatch.doctor_id || row.id === requestedMatch.id,
        )
          ? requestedMatch
          : null;
      setSelectedDoctor(preselected);
      setSelectedDoctorName(preselected?.full_name ?? '');
      setSelectedDoctorCode(preselected?.doctor_id ?? preselected?.id ?? '');
      setConsultationFee(preselected ? formatConsultationFee(preselected.consultation_fee) : '');
      setIsLoadingDoctors(false);
    };

    setIsLoadingDoctors(true);
    let channel: ReturnType<NonNullable<typeof supabase>['channel']> | undefined;

    void (async () => {
      const hospitalId =
        readPatientPortalSession()?.hospital_id ||
        (await resolveHospitalUuid(supabase)) ||
        REGAL_HOSPITAL_CODE;

      const loadBookableDoctors = () => {
        void fetchPatientBookableDoctors(supabase, hospitalId)
          .then(applyRows)
          .catch((err: unknown) => {
            console.error('Error fetching registered doctors:', err);
            if (!cancelled) {
              setDoctorList([]);
              setSelectedDoctor(null);
              setSelectedDoctorName('');
              setSelectedDoctorCode('');
              setConsultationFee('');
              setIsLoadingDoctors(false);
            }
          });
      };

      loadBookableDoctors();

      const refreshDoctors = () => {
        loadBookableDoctors();
      };

      channel = supabase
        ?.channel('patient_book_doctors')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'doctors', filter: `hospital_id=eq.${hospitalId}` },
          refreshDoctors,
        )
        .subscribe();
    })();

    return () => {
      cancelled = true;
      if (channel) void supabase?.removeChannel(channel);
    };
  }, [searchParams]);

  useEffect(() => {
    const doctorCode = selectedDoctorCode || selectedDoctor?.id;
    if (!doctorCode || !appointmentDate) {
      setDynamicSlots([]);
      setSlotTime('');
      setSelectedSlotId('');
      return;
    }

    let cancelled = false;
    setLoadingSlots(true);
    void loadDynamicDoctorSchedule(supabase, doctorCode, appointmentDate, reason).then(({ slots }) => {
      if (cancelled) return;
      setDynamicSlots(slots);
      const auto = resolveAutoSelectedSlot(slots, slotTime);
      if (auto) {
        setSlotTime(auto.time);
        setSelectedSlotId(`dynamic-${doctorCode}-${appointmentDate}-${auto.time.replace(/\s/g, '')}`);
      } else {
        setSlotTime('');
        setSelectedSlotId('');
      }
      setLoadingSlots(false);
    });

    return () => {
      cancelled = true;
    };
  }, [appointmentDate, selectedDoctor?.id, selectedDoctorCode, reason]);

  const loadPatientAndFamilyOptions = async () => {
    const sessionIdentity = resolveActivePatientFormIdentity();
    if (!sessionIdentity) {
      toast.error('Session expired. Please log in again.');
      router.push('/patient/login');
      return;
    }

    const activePatientId = sessionIdentity.patient_id || getActivePatientId();
    let primaryName = sessionIdentity.patient_name;
    let familyMembersList: FamilyMemberOption[] = [];

    if (typeof window !== 'undefined') {
      const savedProfile = localStorage.getItem('curasync_patient_profile');

      if (savedProfile) {
        try {
          const parsed = JSON.parse(savedProfile) as {
            patient_id?: string;
            id?: string;
            full_name?: string;
            family_members?: FamilyMemberOption[];
          };
          const profilePatientId = String(parsed.patient_id ?? parsed.id ?? '').trim();
          const profileMatchesSession =
            !profilePatientId ||
            profilePatientId === activePatientId ||
            profilePatientId === sessionIdentity.patient_id;

          if (profileMatchesSession) {
            if (Array.isArray(parsed.family_members)) {
              familyMembersList = parsed.family_members;
            }
          }
        } catch {
          /* ignore stale cached profile */
        }
      }
    }

    if (isValidUUID(activePatientId)) {
      try {
        const profileQueries = await Promise.all([
          supabase
            .from('patient_profiles')
            .select('id, patient_id, full_name, family_members')
            .eq('id', activePatientId)
            .maybeSingle(),
          supabase
            .from('patient_profiles')
            .select('id, patient_id, full_name, family_members')
            .eq('patient_id', activePatientId)
            .maybeSingle(),
        ]);

        const profileRecord =
          profileQueries.find((result) => !result.error && result.data)?.data ?? null;

        if (profileRecord) {
          const profilePatientId = String(profileRecord.patient_id ?? profileRecord.id ?? '').trim();
          const profileMatchesSession =
            !profilePatientId ||
            profilePatientId === activePatientId ||
            profilePatientId === sessionIdentity.patient_id;

          if (profileMatchesSession && Array.isArray(profileRecord.family_members)) {
            familyMembersList = profileRecord.family_members as FamilyMemberOption[];
          }
        }
      } catch {
        console.warn('Profile sync unavailable');
      }
    }

    persistActivePatientNode(activePatientId, primaryName);

    const options: FamilyMemberOption[] = [
      { id: 'self', name: `${primaryName} (Self)`, relation: 'Self' },
      ...familyMembersList.map((member) => ({
        id: member.id || member.name,
        name: `${member.name} (${member.relation})`,
        relation: member.relation,
      })),
    ];

    setPatientId(activePatientId);
    setPatientOptions(options);
    setSelectedPatientName(options[0]?.name ?? `${primaryName} (Self)`);
    if (sessionIdentity.age != null && Number.isFinite(sessionIdentity.age)) {
      setAge(String(sessionIdentity.age));
    }
    if (sessionIdentity.gender) setGender(sessionIdentity.gender);
  };

  const applySelectedDoctor = (match: DoctorStaffRecord | null) => {
    setSelectedDoctor(match);
    setSelectedDoctorName(match?.full_name ?? '');
    setSelectedDoctorCode(match?.doctor_id ?? match?.id ?? '');
    setConsultationFee(match ? formatConsultationFee(match.consultation_fee) : '');
  };

  const handleDoctorSelectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const match =
      doctorList.find(
        (doctor) => doctor.doctor_id === e.target.value || doctor.id === e.target.value,
      ) ?? null;
    applySelectedDoctor(match);
  };

  const departmentOptions = useMemo(
    () => mergeDepartmentOptions(doctorList.map((doc) => doc.department)),
    [doctorList],
  );
  const doctorsInDepartment = useMemo(
    () => doctorsForDepartment(doctorList, selectedDept || DEFAULT_HOSPITAL_DEPARTMENT),
    [doctorList, selectedDept],
  );

  const handleDepartmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const department = e.target.value;
    setSelectedDept(department);
    applySelectedDoctor(null);
  };

  const handleBookAppointment = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccess(false);
    setBookedSummary(null);

    try {
      const patientSession = readPatientPortalSession();
      if (!patientSession) {
        toast.error('Session expired. Please log in again.');
        router.push('/patient/login');
        return;
      }

      const cleanPatientName = stripRelationshipTag(
        selectedPatientName || patientSession.patient_name,
      );
      const doctorEntry = selectedDoctor
        ? toDirectoryItem(selectedDoctor)
        : findDoctorDirectoryEntry(doctorList.map(toDirectoryItem), selectedDoctorName);

      if (!cleanPatientName.trim()) {
        setErrorMessage('Select a registered patient before booking.');
        toast.error('Patient identity is required.');
        return;
      }

      if (!selectedDoctor || !selectedDoctorName.trim() || !selectedDoctorCode.trim()) {
        setErrorMessage('Select a consulting doctor before booking.');
        toast.error('Doctor selection is required.');
        return;
      }

      const departmentEligible = doctorsInDepartment.some(
        (doctor) =>
          doctor.doctor_id === selectedDoctor.doctor_id || doctor.id === selectedDoctor.id,
      );
      if (!departmentEligible) {
        setErrorMessage(`Select a doctor assigned to ${selectedDept}.`);
        toast.error('Selected doctor is not assigned to this department.');
        return;
      }

      const rawDoctorName = selectedDoctorName.trim();
      const rawDoctorCode = selectedDoctorCode.trim().toUpperCase();
      const department = (selectedDept || selectedDoctor.department || doctorEntry?.department || '').trim();
      if (!department) {
        setErrorMessage('Doctor department is required.');
        toast.error('Doctor department is required.');
        return;
      }

      const parsedAge = parsePatientAge(age);
      if (parsedAge == null) {
        setErrorMessage('Enter a valid patient age between 1 and 120.');
        toast.error('Patient age is required.');
        return;
      }
      const phoneCheck = validatePhoneField(patientSession.phone, true);
      if (!phoneCheck.ok) {
        setErrorMessage(phoneCheck.message);
        toast.error(phoneCheck.message);
        return;
      }
      const bookingPhone = phoneCheck.phone!;

      const targetHospitalId = REGAL_HOSPITAL_CODE;
      const tokenUhid = patientSession.uhid || mintPatientUhid();
      const resolvedDate = appointmentDate || new Date().toISOString().split('T')[0];
      const selectedTime = slotTime.trim();
      if (!selectedTime) {
        setErrorMessage('Select an available time slot before confirming.');
        toast.error('Time slot is required.');
        return;
      }

      const doctorIdentity = resolveDoctorBookingIdentity({
        doctor_uuid: selectedDoctor.id,
        doctor_code: rawDoctorCode,
        doctor_id: selectedDoctor.doctor_id,
        id: selectedDoctor.id,
        full_name: rawDoctorName,
        department,
      });
      const bookingDoctorKey = doctorIdentity.doctorUuid || doctorIdentity.doctorCode || rawDoctorCode;

      await assertSlotAvailableForBooking(supabase, {
        doctorId: bookingDoctorKey,
        appointmentDate: resolvedDate,
        slotTime: selectedTime,
      });

      const calculatedToken = await calculateNextTokenNumber(
        bookingDoctorKey,
        rawDoctorName,
        resolvedDate,
      );
      const clinicalReason = reason.trim();
      const nowIso = new Date().toISOString();
      const resolvedPatientId = resolveBookingPatientId();

      persistActivePatientNode(resolvedPatientId, cleanPatientName);

      const bookingInput: FullyAliasedBookingInput = {
        patientId: resolvedPatientId,
        patientName: cleanPatientName,
        uhid: tokenUhid,
        phone: bookingPhone,
        hospitalId: targetHospitalId,
        hospitalName: patientSession.hospital_name,
        doctorName: rawDoctorName,
        doctorCode: doctorIdentity.doctorCode || rawDoctorCode,
        doctorUuid: doctorIdentity.doctorUuid,
        department,
        appointmentDate: resolvedDate,
        slotTime: selectedTime,
        consultationFee: selectedDoctor
          ? formatConsultationFee(selectedDoctor.consultation_fee)
          : consultationFee,
        reason: clinicalReason,
        tokenNumber: calculatedToken,
        nowIso,
        age: parsedAge,
        gender: gender.trim() || patientSession.gender,
      };

      const patientPayload = buildPatientAppointmentPayload(bookingInput);
      const appointmentsPayload = buildAppointmentsLedgerPayload(bookingInput);

      let savedRecord: Record<string, unknown> | null = null;

      const ledgerResult = await insertAppointmentsLedger(appointmentsPayload);
      if (ledgerResult.data) {
        savedRecord = ledgerResult.data;
      }

      const patientResult = await insertPatientAppointmentsLedger(patientPayload);
      if (patientResult.data && !savedRecord) {
        savedRecord = patientResult.data;
      }

      try {
        await supabase.from('hospital_opd_queue').insert([buildOpdQueuePayload(bookingInput)]);
      } catch (queueErr) {
        console.warn('hospital_opd_queue mirror skipped:', queueErr);
      }

      if (!savedRecord) {
        const failMessage =
          ledgerResult.errorMessage || patientResult.errorMessage || 'Booking failed';
        console.error('Booking failed:', failMessage);
        setErrorMessage(`Booking failed: ${failMessage}`);
        toast.error(`Booking failed: ${failMessage}`);
        return;
      }

      const appointmentRecordId = String(
        savedRecord.appointment_id ?? savedRecord.id ?? appointmentsPayload.appointment_id ?? '',
      );
      if (selectedSlotId && appointmentRecordId) {
        const slotResult = await bookDoctorTimeSlot(
          supabase,
          selectedSlotId,
          appointmentRecordId,
          resolvedPatientId,
          cleanPatientName,
        );
        if (!slotResult.ok) {
          toast.error(slotResult.error ?? 'Selected slot was taken. Pick another slot.');
          return;
        }
      }

      mirrorAppointmentToLocalStorage(
        buildConfirmedLocalMirrorRecord(
          patientPayload,
          appointmentsPayload,
          nowIso,
          savedRecord,
        ),
      );

      setBookedSummary({
        token: calculatedToken,
        doctor: rawDoctorName,
        date: resolvedDate,
        slot: selectedTime,
      });
      setSuccess(true);
      toast.success(
        `Appointment confirmed with ${rawDoctorName} · ${formatConsultationFee(selectedDoctor.consultation_fee)}`,
      );

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
                    {formatBookingTokenLabel(bookedSummary.token)}
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

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-[10px] font-black uppercase text-[#227B6B]">
            Age (years) *
            <input
              required
              type="number"
              min={1}
              max={120}
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="Enter age"
              className="mt-1.5 w-full rounded-2xl border border-[#D5E8E3] bg-white p-4 text-xs font-bold text-[#0E2924] focus:border-[#113831] focus:outline-none"
            />
          </label>
          <label className="block text-[10px] font-black uppercase text-[#227B6B]">
            Gender
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="mt-1.5 w-full rounded-2xl border border-[#D5E8E3] bg-white p-4 text-xs font-bold text-[#0E2924] focus:border-[#113831] focus:outline-none"
            >
              <option value="">Select gender</option>
              <option value="Female">Female</option>
              <option value="Male">Male</option>
              <option value="Other">Other</option>
            </select>
          </label>
        </div>

        <div>
          <label className="flex items-center gap-1.5 text-[10px] font-black uppercase text-[#227B6B] mb-1.5">
            <Stethoscope className="h-3.5 w-3.5 text-[#227B6B]" /> CLINICAL DEPARTMENT *
          </label>
          <select
            required
            value={selectedDept}
            onChange={handleDepartmentChange}
            disabled={isSubmitting}
            className="w-full rounded-2xl border border-[#D5E8E3] bg-white p-4 text-xs font-black text-[#113831] focus:border-[#113831] focus:outline-none shadow-sm cursor-pointer disabled:opacity-60"
          >
            {departmentOptions.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="flex items-center gap-1.5 text-[10px] font-black uppercase text-[#227B6B] mb-1.5">
            <User className="h-3.5 w-3.5 text-[#227B6B]" /> SELECT CLINICIAN *
          </label>
          <select
            value={selectedDoctor?.doctor_id || selectedDoctorCode}
            onChange={handleDoctorSelectionChange}
            disabled={isLoadingDoctors || isSubmitting || doctorList.length === 0}
            className="w-full rounded-2xl border border-[#D5E8E3] bg-white p-4 text-xs font-black text-[#113831] focus:border-[#113831] focus:outline-none shadow-sm cursor-pointer disabled:opacity-60"
          >
            {isLoadingDoctors ? (
              <option value="">Loading specialists…</option>
            ) : doctorsInDepartment.length === 0 ? (
              <option value="" disabled>
                No doctors assigned to {selectedDept}
              </option>
            ) : (
              <>
                <option value="">Select consulting doctor</option>
                {doctorsInDepartment.map((doc) => {
                  const doctorKey = doc.doctor_id || doc.id;
                  return (
                    <option key={doctorKey} value={doctorKey}>
                      {formatDoctorBookingOptionLabel(doc)}
                    </option>
                  );
                })}
              </>
            )}
          </select>
        </div>

        {/* DEPARTMENT & FEE SUMMARY */}
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label className="flex items-center gap-1.5 text-[10px] font-black uppercase text-[#227B6B] mb-1.5">
              ASSIGNED DEPARTMENT
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
            <DynamicSlotPicker
              variant="grid"
              slots={dynamicSlots}
              selectedTime={slotTime}
              loading={loadingSlots}
              clinicalReason={reason}
              onSelect={(slot) => {
                setSlotTime(slot.time);
                setSelectedSlotId(
                  `dynamic-${selectedDoctorCode || selectedDoctor?.id}-${appointmentDate}-${slot.time.replace(/\s/g, '')}`,
                );
              }}
            />
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
          disabled={
            isSubmitting ||
            isLoadingDoctors ||
            loadingSlots ||
            !selectedDoctor ||
            doctorsInDepartment.length === 0 ||
            !slotTime ||
            !dynamicSlots.some((slot) => slot.isSelectable)
          }
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