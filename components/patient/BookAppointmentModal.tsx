'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { formatDoctorBookingOptionLabel } from '@/lib/hospital/doctors';
import {
  doctorsForDepartment,
  mergeDepartmentOptions,
} from '@/lib/hospital/departments';
import { HOSPITAL_TENANT_ID } from '@/lib/regal/constants';
import {
  fetchPatientBookableDoctors,
  formatConsultationFee,
  type DoctorStaffRecord,
} from '@/lib/hospital/hospital-staff-roster';
import { resolveHospitalUuid } from '@/lib/hospital/resolve-hospital-context';
import { getActivePatientId } from '@/lib/patient/active-patient-node';
import {
  familyMembersStorageKey,
  formatBeneficiaryLabel,
  loadBeneficiaryOptionsForActivePatient,
  SELF_BENEFICIARY_ID,
  type BeneficiaryOption,
} from '@/lib/patient/family-members';
import { patientProfileStorageKey } from '@/lib/patient/profileStore';
import { DynamicSlotPicker } from '@/components/patient/DynamicSlotPicker';
import { ProfileCompletionGate } from '@/components/patient/ProfileCompletionGate';
import { bookAppointmentWithDoctor } from '@/lib/patient/book-appointment';
import { usePatientProfileCompleteness } from '@/lib/patient/usePatientProfileCompleteness';
import { profileIncompleteBookingMessage } from '@/lib/utils/profileCompleteness';
import {
  mintPatientUhid,
  readPatientPortalSession,
  resolveActivePatientFormIdentity,
} from '@/lib/patient/portal-session';
import {
  loadDynamicDoctorSchedule,
  resolveAutoSelectedSlot,
} from '@/lib/scheduling/doctor-slot-service';
import type { DynamicSlot } from '@/lib/scheduling/dynamic-slots';
import { resolveActiveAuthUser } from '@/lib/auth/resolve-active-auth-user';
import { createClient } from '@/lib/supabase/client';

export interface DoctorOption {
  id: string;
  name: string;
  department: string;
  specialization: string;
  qualification?: string;
  consultation_fee: number;
  hospital_id?: string;
}

function toDoctorOption(row: DoctorStaffRecord): DoctorOption {
  return {
    id: row.doctor_id || row.id,
    name: row.full_name,
    department: row.department,
    specialization: row.specialization || row.department || 'Consultant Physician',
    qualification: row.qualification || 'MBBS, MD',
    consultation_fee: row.consultation_fee,
  };
}

export interface BookAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  hospitalId?: string;
  /** Linked `public.patients.id` or portal patient identifier from dashboard */
  patientId?: string;
  /** Supabase Auth user id from parent dashboard */
  userId?: string;
  onBookingSuccess?: (appointmentRecord: Record<string, unknown>) => void;
}

export function BookAppointmentModal({
  isOpen,
  onClose,
  hospitalId,
  patientId,
  userId,
  onBookingSuccess,
}: BookAppointmentModalProps) {
  const supabase = useMemo(() => createClient(), []);
  const [allDoctors, setAllDoctors] = useState<DoctorStaffRecord[]>([]);
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [loadingDoctors, setLoadingDoctors] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [resolvedHospitalId, setResolvedHospitalId] = useState<string>('');

  const [appointmentDate, setAppointmentDate] = useState<string>(
    new Date().toISOString().split('T')[0],
  );
  const [appointmentTime, setAppointmentTime] = useState<string>('');
  const [symptoms, setSymptoms] = useState<string>('');
  const [dynamicSlots, setDynamicSlots] = useState<DynamicSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [beneficiaryOptions, setBeneficiaryOptions] = useState<BeneficiaryOption[]>([]);
  const [selectedBeneficiaryId, setSelectedBeneficiaryId] = useState<string>(SELF_BENEFICIARY_ID);
  const { loading: profileGateLoading, complete: profileComplete, missingFields } =
    usePatientProfileCompleteness();

  const fetchDoctors = useCallback(async () => {
    if (!isOpen) return;

    setLoadingDoctors(true);
    try {
      const session = readPatientPortalSession();
      const preferredHospital = hospitalId || session?.hospital_id || '';
      const nodeId = preferredHospital || (await resolveHospitalUuid(supabase)) || HOSPITAL_TENANT_ID;

      if (!nodeId) {
        setAllDoctors([]);
        setSelectedDoctorId('');
        return;
      }

      setResolvedHospitalId(nodeId);
      const rows = await fetchPatientBookableDoctors(supabase, nodeId);
      setAllDoctors(rows);

      const visible =
        selectedDept === 'ALL' ? rows : doctorsForDepartment(rows, selectedDept);

      setSelectedDoctorId((prev) =>
        visible.some((doctor) => (doctor.doctor_id || doctor.id) === prev) ? prev : '',
      );
    } catch (err: unknown) {
      console.error('Error fetching registered doctors:', err);
      toast.error('Unable to retrieve available physicians');
      setAllDoctors([]);
      setSelectedDoctorId('');
    } finally {
      setLoadingDoctors(false);
    }
  }, [hospitalId, isOpen, selectedDept, supabase]);

  const refreshBeneficiaryOptions = useCallback(() => {
    const options = loadBeneficiaryOptionsForActivePatient();
    setBeneficiaryOptions(options);
    setSelectedBeneficiaryId((current) =>
      options.some((option) => option.id === current)
        ? current
        : (options[0]?.id ?? SELF_BENEFICIARY_ID),
    );
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    void fetchDoctors();
    refreshBeneficiaryOptions();
  }, [isOpen, fetchDoctors, refreshBeneficiaryOptions]);

  useEffect(() => {
    if (!isOpen || typeof window === 'undefined') return;

    const identity = resolveActivePatientFormIdentity();
    if (!identity?.patient_id) return;

    const familyKey = familyMembersStorageKey(identity.patient_id);
    const profileKey = patientProfileStorageKey(identity.patient_id);
    const onStorage = (event: StorageEvent) => {
      if (event.key === familyKey || event.key === profileKey) refreshBeneficiaryOptions();
    };

    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [isOpen, refreshBeneficiaryOptions]);

  const selectedBeneficiary = useMemo(
    () =>
      beneficiaryOptions.find((option) => option.id === selectedBeneficiaryId) ??
      beneficiaryOptions[0] ??
      null,
    [beneficiaryOptions, selectedBeneficiaryId],
  );

  useEffect(() => {
    if (!isOpen || !resolvedHospitalId) return;

    const channel = supabase
      .channel(`patient-doctors-live-sync-${resolvedHospitalId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'doctors',
          filter: `hospital_id=eq.${resolvedHospitalId}`,
        },
        () => {
          void fetchDoctors();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [isOpen, resolvedHospitalId, fetchDoctors]);

  const departmentOptions = useMemo(
    () => mergeDepartmentOptions(allDoctors.map((doctor) => doctor.department)),
    [allDoctors],
  );

  const doctors = useMemo(() => {
    if (selectedDept === 'ALL') return allDoctors.map(toDoctorOption);
    return doctorsForDepartment(allDoctors, selectedDept).map(toDoctorOption);
  }, [allDoctors, selectedDept]);

  useEffect(() => {
    if (doctors.length === 0) {
      setSelectedDoctorId('');
      return;
    }
    if (selectedDoctorId && !doctors.some((doctor) => doctor.id === selectedDoctorId)) {
      setSelectedDoctorId('');
    }
  }, [doctors, selectedDoctorId]);

  useEffect(() => {
    if (!isOpen || !selectedDoctorId || !appointmentDate) {
      setDynamicSlots([]);
      setAppointmentTime('');
      setLoadingSlots(false);
      return;
    }

    let cancelled = false;
    setLoadingSlots(true);

    void loadDynamicDoctorSchedule(supabase, selectedDoctorId, appointmentDate)
      .then(({ slots }) => {
        if (cancelled) return;
        setDynamicSlots(slots);
        const auto = resolveAutoSelectedSlot(slots, appointmentTime);
        setAppointmentTime(auto?.time ?? '');
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        console.error('Failed to load doctor schedule:', err);
        setDynamicSlots([]);
        setAppointmentTime('');
        toast.error('Could not load available slots. Please try again.');
      })
      .finally(() => {
        if (!cancelled) setLoadingSlots(false);
      });

    return () => {
      cancelled = true;
    };
    // Slot availability depends only on doctor + date — not reason/symptoms/beneficiary.
  }, [isOpen, selectedDoctorId, appointmentDate]);

  const activeDoctor = doctors.find((doctor) => doctor.id === selectedDoctorId);
  const hasSelectableSlot = dynamicSlots.some((slot) => slot.isSelectable);

  const handleConfirmBooking = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!profileComplete) {
      toast.error(profileIncompleteBookingMessage(missingFields));
      return;
    }
    if (!selectedDoctorId || !activeDoctor) {
      toast.error('Please select an attending doctor');
      return;
    }
    if (!appointmentTime || !hasSelectableSlot) {
      toast.error('Please choose an available future time slot');
      return;
    }

    setSubmitting(true);

    try {
      const sessionIdentity = resolveActivePatientFormIdentity();
      const session = readPatientPortalSession();
      const authContext = await resolveActiveAuthUser(
        supabase,
        userId ||
          patientId ||
          sessionIdentity?.patient_id ||
          getActivePatientId() ||
          session?.patient_id,
      );

      if (!authContext?.userId) {
        toast.error('User session not found. Please log in again.');
        return;
      }

      const bookingPatientId =
        patientId ||
        sessionIdentity?.patient_id ||
        getActivePatientId() ||
        session?.patient_id ||
        authContext.userId;

      const bookingDepartment =
        selectedDept === 'ALL' ? activeDoctor.department : selectedDept;

      const rosterDoctor = allDoctors.find(
        (row) =>
          row.doctor_id === activeDoctor.id ||
          row.id === activeDoctor.id ||
          row.full_name === activeDoctor.name,
      );

      const bookingPatientName =
        selectedBeneficiary?.name ||
        sessionIdentity?.patient_name ||
        session?.patient_name ||
        'Verified Patient';

      const bookingFor =
        selectedBeneficiaryId === SELF_BENEFICIARY_ID
          ? 'SELF'
          : selectedBeneficiary?.relation || 'DEPENDENT';

      const result = await bookAppointmentWithDoctor({
        patientId: bookingPatientId,
        authUserId: authContext.userId,
        patientName: bookingPatientName,
        phone: sessionIdentity?.phone || session?.phone,
        beneficiary_id: selectedBeneficiary?.id,
        beneficiary_relation: selectedBeneficiary?.relation,
        booking_for: bookingFor,
        skipProfileCheck: true,
        doctor_uuid: rosterDoctor?.id,
        doctor_id: rosterDoctor?.doctor_id || activeDoctor.id,
        doctor_record_id: rosterDoctor?.id || activeDoctor.id,
        doctor_code: rosterDoctor?.doctor_id || activeDoctor.id,
        doctor_name: activeDoctor.name,
        department: bookingDepartment,
        appointmentDate,
        slotTime: appointmentTime,
        reason: symptoms.trim() || 'General Consultation',
        hospitalId: resolvedHospitalId || hospitalId,
        consultation_fee: activeDoctor.consultation_fee,
      });

      toast.success(`Appointment confirmed with ${activeDoctor.name}!`);
      onBookingSuccess?.({
        appointment_id: result.appointment_id,
        token_number: result.token_number,
        doctor_name: activeDoctor.name,
        department: bookingDepartment,
        consultation_fee: activeDoctor.consultation_fee,
        appointment_date: appointmentDate,
        appointment_time: appointmentTime,
        uhid: session?.uhid || mintPatientUhid(),
      });
      onClose();
    } catch (err: unknown) {
      console.error('Booking failed:', err);
      const message =
        err instanceof Error
          ? err.message
          : 'Failed to book appointment. Please try again.';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const fieldLabelClass =
    'mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[#7C5C48]';
  const fieldControlClass =
    'w-full rounded-xl border border-[#EADBCE] bg-white px-3.5 py-2.5 text-xs font-medium text-[#2B1810] transition-all focus:border-[#8C5A3C] focus:outline-none focus:ring-2 focus:ring-[#8C5A3C]/20';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2B1810]/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg space-y-4 rounded-2xl border border-[#EADBCE] bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#F3ECE4] pb-3">
          <div>
            <h3 className="text-lg font-bold text-[#2B1810]">Book Outpatient Consultation</h3>
            <p className="text-xs text-[#7C5C48]">Live scheduling with verified hospital physicians</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-stone-400 transition hover:bg-[#FAF6F0] hover:text-[#2B1810]"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {profileGateLoading ? (
          <div className="rounded-xl border border-[#EADBCE] bg-[#FAF6F0] p-4 text-xs font-medium text-[#7C5C48]">
            Verifying profile readiness for clinical booking…
          </div>
        ) : !profileComplete ? (
          <ProfileCompletionGate missingFields={missingFields} compact />
        ) : (
        <form onSubmit={handleConfirmBooking} className="space-y-4">
          <div>
            <label className={fieldLabelClass}>Booking For</label>
            <select
              value={selectedBeneficiaryId}
              onChange={(event) => setSelectedBeneficiaryId(event.target.value)}
              className={fieldControlClass}
              required
            >
              {beneficiaryOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {formatBeneficiaryLabel(option)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={fieldLabelClass}>Department</label>
            <select
              value={selectedDept}
              onChange={(event) => {
                setSelectedDept(event.target.value);
                setSelectedDoctorId('');
              }}
              className={fieldControlClass}
            >
              <option value="ALL">All Clinical Departments</option>
              {departmentOptions.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={fieldLabelClass}>Consulting Physician</label>
            {loadingDoctors ? (
              <div className="animate-pulse rounded-xl border border-[#EADBCE] bg-[#FAF6F0] p-3 text-xs text-[#7C5C48]">
                Fetching available physicians...
              </div>
            ) : doctors.length === 0 ? (
              <div className="rounded-xl border border-[#E6CCB2] bg-[#FAF6F0] p-3 text-xs font-medium text-[#7C5C48]">
                No active doctors currently registered under this department.
              </div>
            ) : (
              <select
                value={selectedDoctorId}
                onChange={(event) => setSelectedDoctorId(event.target.value)}
                className={fieldControlClass}
              >
                <option value="">Select consulting doctor</option>
                {doctors.map((doctor) => {
                  const source = allDoctors.find(
                    (row) => (row.doctor_id || row.id) === doctor.id,
                  );
                  const doctorKey = source?.doctor_id || source?.id || doctor.id;
                  const label = source
                    ? formatDoctorBookingOptionLabel(source)
                    : `${doctor.name} - (₹${Number(doctor.consultation_fee || 0).toLocaleString('en-IN')})`;
                  return (
                    <option key={doctorKey} value={doctorKey}>
                      {label}
                    </option>
                  );
                })}
              </select>
            )}
          </div>

          {activeDoctor && (
            <div className="flex items-center justify-between rounded-xl border border-[#E6CCB2] bg-[#FAF6F0] p-4">
              <div>
                <h4 className="text-xs font-bold text-[#2B1810]">{activeDoctor.name}</h4>
                <p className="mt-0.5 text-[11px] font-medium text-[#7C5C48]">
                  {activeDoctor.qualification || 'MBBS, MD'} • {activeDoctor.department}
                </p>
              </div>
              <div className="text-right">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-[#8C5A3C]">
                  Consultation Fee
                </span>
                <span className="text-base font-extrabold text-[#2B1810]">
                  {formatConsultationFee(activeDoctor.consultation_fee)}
                </span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={fieldLabelClass}>Preferred Date</label>
              <input
                type="date"
                required
                value={appointmentDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(event) => setAppointmentDate(event.target.value)}
                className={fieldControlClass}
              />
            </div>
            <div>
              <label className={fieldLabelClass}>Preferred Slot</label>
              {!selectedDoctorId ? (
                <div className="rounded-xl border border-[#EADBCE] bg-[#FAF6F0] p-2.5 text-xs text-[#7C5C48]">
                  Select a doctor to view live slots
                </div>
              ) : (
                <DynamicSlotPicker
                  slots={dynamicSlots}
                  selectedTime={appointmentTime}
                  loading={loadingSlots}
                  clinicalReason={symptoms}
                  onSelect={(slot) => setAppointmentTime(slot.time)}
                />
              )}
            </div>
          </div>

          <div>
            <label className={fieldLabelClass}>Reason for Visit / Symptoms</label>
            <input
              type="text"
              placeholder="e.g., Chest discomfort, routine follow-up, knee fracture review"
              value={symptoms}
              onChange={(event) => setSymptoms(event.target.value)}
              className={`${fieldControlClass} placeholder:text-[#7C5C48]/60`}
            />
          </div>

          <div className="flex justify-end gap-2 border-t border-[#F3ECE4] pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-xs font-medium text-[#7C5C48] transition hover:bg-[#FAF6F0]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                !selectedDoctorId ||
                loadingDoctors ||
                loadingSlots ||
                submitting ||
                doctors.length === 0 ||
                !appointmentTime ||
                !hasSelectableSlot
              }
              className="rounded-xl bg-[#8C5A3C] px-5 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-[#6F4E37] disabled:opacity-50"
            >
              {submitting ? 'Confirming...' : 'Confirm Appointment'}
            </button>
          </div>
        </form>
        )}
      </div>
    </div>
  );
}
