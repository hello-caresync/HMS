'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { formatDoctorBookingOptionLabel } from '@/lib/hospital/doctors';
import {
  fetchPatientBookableDoctors,
  formatConsultationFee,
  type DoctorStaffRecord,
} from '@/lib/hospital/hospital-staff-roster';
import { REGAL_HOSPITAL_CODE } from '@/lib/regal/constants';
import { resolveHospitalUuid } from '@/lib/hospital/resolve-hospital-context';
import {
  mintPatientUhid,
  readPatientPortalSession,
  resolveActivePatientFormIdentity,
} from '@/lib/patient/portal-session';
import { supabase } from '@/lib/supabaseClient';
import { parsePatientAge, sanitizePhoneDigits, validatePhoneField } from '@/lib/hospital/indian-patient';
import { PhoneNumberInput } from '@/components/ui/PhoneNumberInput';
import { nextOpenClinicSlot, todayIsoDate } from '@/lib/hospital/smartq-wait';
import {
  DEFAULT_HOSPITAL_DEPARTMENT,
  HOSPITAL_DEPARTMENTS,
  doctorsForDepartment,
  mergeDepartmentOptions,
} from '@/lib/hospital/departments';
import { RegalHospitalLogo } from '@/components/brand/RegalHospitalLogo';

type OfferedAppointment = {
  id: string;
  doctor_name: string;
  slot_time: string;
  appointment_date: string;
  status: string;
};

export default function PatientPortalPage() {
  const router = useRouter();
  const [doctorList, setDoctorList] = useState<DoctorStaffRecord[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorStaffRecord | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<string>(DEFAULT_HOSPITAL_DEPARTMENT);
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(true);
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [isBookingAppointment, setIsBookingAppointment] = useState(false);
  const [offeredAppointment, setOfferedAppointment] = useState<OfferedAppointment | null>(null);
  const [isResolvingReschedule, setIsResolvingReschedule] = useState(false);

  useEffect(() => {
    const identity = resolveActivePatientFormIdentity();
    if (!identity) {
      router.replace('/patient/login');
      return;
    }

    setPatientName(identity.patient_name);
    setPatientPhone(sanitizePhoneDigits(identity.phone));
    if (identity.age != null && Number.isFinite(identity.age)) setAge(String(identity.age));
    if (identity.gender) setGender(identity.gender);

    const session = readPatientPortalSession();

    let cancelled = false;
    let channel: ReturnType<NonNullable<typeof supabase>['channel']> | undefined;

    void (async () => {
      const hospitalId =
        session?.hospital_id || (await resolveHospitalUuid(supabase)) || REGAL_HOSPITAL_CODE;

      const loadDoctors = () =>
        fetchPatientBookableDoctors(supabase, hospitalId).then((rows) => {
          if (cancelled) return;
          setDoctorList(rows);
          setIsLoadingDoctors(false);
        });

      void loadDoctors();
      channel = supabase
        ?.channel('patient_booking_doctors')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'doctors', filter: `hospital_id=eq.${hospitalId}` },
          () => void loadDoctors(),
        )
        .subscribe();
    })();

    const loadOffered = async () => {
      if (!supabase || !session) return;
      const hospitalId = session.hospital_id || (await resolveHospitalUuid(supabase)) || '';
      if (!hospitalId) return;
      const today = todayIsoDate();
      const phoneDigits = sanitizePhoneDigits(session.phone);
      const tables = ['appointments', 'hospital_appointments', 'hospital_opd_queue'] as const;
      let match: Record<string, unknown> | undefined;

      for (const table of tables) {
        let { data, error } = await supabase
          .from(table)
          .select('*')
          .eq('hospital_id', hospitalId)
          .eq('appointment_date', today)
          .eq('reschedule_status', 'offered');
        if (error) {
          const fallback = await supabase
            .from(table)
            .select('*')
            .eq('hospital_id', hospitalId)
            .eq('appointment_date', today);
          data = ((fallback.data || []) as Record<string, unknown>[]).filter(
            (row: Record<string, unknown>) => String(row.reschedule_status ?? '') === 'offered',
          );
        }
        match = ((data || []) as Record<string, unknown>[]).find((row: Record<string, unknown>) => {
          const record = row as Record<string, unknown>;
          const rowPhone = sanitizePhoneDigits(String(record.phone ?? record.patient_phone ?? ''));
          const rowUhid = String(record.uhid ?? '');
          return (phoneDigits && rowPhone === phoneDigits) || (session.uhid && rowUhid === session.uhid);
        });
        if (match?.id) break;
      }

      if (match?.id) {
        setOfferedAppointment({
          id: String(match.id),
          doctor_name: String(match.doctor_name ?? 'Consulting physician'),
          slot_time: String(match.slot_time ?? match.time_slot ?? ''),
          appointment_date: String(match.appointment_date ?? today),
          status: String(match.status ?? 'waiting'),
        });
      }
    };
    void loadOffered();

    return () => {
      cancelled = true;
      if (channel) void supabase?.removeChannel(channel);
    };
  }, []);

  const departmentOptions = useMemo(
    () => mergeDepartmentOptions(doctorList.map((doc) => doc.department)),
    [doctorList],
  );
  const doctorsInDepartment = useMemo(
    () => doctorsForDepartment(doctorList, selectedDepartment),
    [doctorList, selectedDepartment],
  );

  useEffect(() => {
    setSelectedDoctor((prev) => {
      if (!prev) return null;
      return (
        doctorsInDepartment.find(
          (doc) => doc.doctor_id === prev.doctor_id || doc.id === prev.id,
        ) ?? null
      );
    });
  }, [doctorsInDepartment]);

  const handleBookAppointment = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isBookingAppointment) return;

    const name = patientName.trim();
    if (!name) {
      toast.error('Patient name is required');
      return;
    }
    const phoneCheck = validatePhoneField(patientPhone, true);
    if (!phoneCheck.ok) {
      toast.error(phoneCheck.message);
      return;
    }
    const phone = phoneCheck.phone!;
    if (!selectedDoctor) {
      toast.error('Select a consulting doctor for this department');
      return;
    }

    const parsedAge = parsePatientAge(age);
    if (parsedAge == null) {
      toast.error('Enter a valid patient age between 1 and 120');
      return;
    }

    setIsBookingAppointment(true);
    try {
      const session = readPatientPortalSession();
      const hospitalId =
        session?.hospital_id || (await resolveHospitalUuid(supabase)) || REGAL_HOSPITAL_CODE;
      const uhid = session?.uhid || mintPatientUhid();
      const payload: Record<string, unknown> = {
        hospital_id: hospitalId,
        uhid,
        patient_name: name,
        patient_phone: phone,
        phone,
        age: parsedAge,
        patient_age: parsedAge,
        gender: gender.trim() || null,
        doctor_id: selectedDoctor.doctor_id || selectedDoctor.id,
        doctor_code: selectedDoctor.doctor_id || selectedDoctor.id,
        doctor_employee_id: selectedDoctor.doctor_id || selectedDoctor.id,
        doctor_name: selectedDoctor.full_name,
        department: selectedDepartment,
        consultation_fee: selectedDoctor.consultation_fee,
        status: 'WAITING',
        queue_status: 'WAITING',
        billing_status: 'pending_checkout',
        source: 'patient_app',
        appointment_date: todayIsoDate(),
      };

      let { error } = await supabase.from('appointments').insert([payload]).select().maybeSingle();
      if (error) {
        delete payload.billing_status;
        const retry = await supabase.from('appointments').insert([payload]).select().maybeSingle();
        error = retry.error;
      }
      if (error) throw error;

      toast.success(
        `Booked ${selectedDoctor.full_name} · ${formatConsultationFee(selectedDoctor.consultation_fee)}`,
      );
      setPatientName(session?.patient_name || '');
      setPatientPhone(sanitizePhoneDigits(session?.phone ?? ''));
      router.push('/patient/appointments');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Could not book appointment');
    } finally {
      setIsBookingAppointment(false);
    }
  };

  const handleRescheduleChoice = async (choice: 'keep' | 'cancel' | 'rebook') => {
    if (!supabase || !offeredAppointment || isResolvingReschedule) return;
    setIsResolvingReschedule(true);
    const tables = ['appointments', 'hospital_appointments', 'hospital_opd_queue'] as const;
    const applyUpdate = async (patch: Record<string, unknown>) => {
      let lastError: string | null = 'Could not update appointment';
      for (const table of tables) {
        const row = { ...patch };
        let { data, error } = await supabase.from(table).update(row).eq('id', offeredAppointment.id).select('id');
        if (error && /column|Could not find/i.test(error.message)) {
          const stripped = { ...row };
          delete stripped.reschedule_status;
          delete stripped.billing_status;
          delete stripped.time_slot;
          const retry = await supabase.from(table).update(stripped).eq('id', offeredAppointment.id).select('id');
          data = retry.data;
          error = retry.error;
        }
        if (error) {
          lastError = error.message;
          continue;
        }
        if (Array.isArray(data) && data.length > 0) return;
      }
      throw new Error(lastError || 'Could not update appointment');
    };
    try {
      if (choice === 'keep') {
        await applyUpdate({ reschedule_status: 'declined' });
        toast.success('You will keep waiting in the current queue');
      } else if (choice === 'cancel') {
        await applyUpdate({ status: 'cancelled', reschedule_status: 'cancelled' });
        toast.success('Appointment cancelled. No additional consultation fee will be charged.');
      } else {
        const next = nextOpenClinicSlot(offeredAppointment.slot_time);
        await applyUpdate({
          appointment_date: next.date,
          slot_time: next.slot,
          time_slot: next.slot,
          status: 'waiting',
          reschedule_status: 'accepted',
          billing_status: 'waived_reschedule',
        });
        toast.success(`Rebooked ${next.date} at ${next.slot} with no extra consultation fee`);
      }
      setOfferedAppointment(null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Could not update appointment');
    } finally {
      setIsResolvingReschedule(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <RegalHospitalLogo heightClass="h-8" showNodeBadge />
        <div className="sm:text-right">
          <h1 className="text-2xl font-black text-[#0E2924]">SmartQ Patient Booking</h1>
          <p className="text-xs font-bold text-[#227B6B]">
            {HOSPITAL_DEPARTMENTS.length} departments · {doctorList.length} specialists
          </p>
        </div>
      </div>

      {offeredAppointment ? (
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 space-y-4">
          <div>
            <h2 className="text-sm font-black text-amber-900">Queue delay — reschedule offered</h2>
            <p className="mt-1 text-xs text-amber-800">
              Your {offeredAppointment.slot_time || 'current'} slot with {offeredAppointment.doctor_name} has waited past 45 minutes.
              Keep waiting, cancel, or move to the next open slot. Consultation fees will not be re-charged.
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <button
              type="button"
              disabled={isResolvingReschedule}
              onClick={() => void handleRescheduleChoice('keep')}
              className="rounded-2xl border border-amber-300 bg-white py-2.5 text-[11px] font-black uppercase text-amber-900 disabled:opacity-50"
            >
              Keep waiting
            </button>
            <button
              type="button"
              disabled={isResolvingReschedule}
              onClick={() => void handleRescheduleChoice('cancel')}
              className="rounded-2xl border border-rose-200 bg-white py-2.5 text-[11px] font-black uppercase text-rose-700 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isResolvingReschedule}
              onClick={() => void handleRescheduleChoice('rebook')}
              className="rounded-2xl bg-[#113831] py-2.5 text-[11px] font-black uppercase text-white disabled:opacity-50"
            >
              {isResolvingReschedule ? 'Updating…' : 'Rebook next slot'}
            </button>
          </div>
        </div>
      ) : null}

      <form
        onSubmit={(event) => void handleBookAppointment(event)}
        className="rounded-3xl border border-[#D5E8E3] bg-white p-6 space-y-4"
      >
        <label className="block text-[10px] font-black uppercase text-[#227B6B]">
          Patient full name
          <input
            required
            readOnly
            disabled={isBookingAppointment}
            value={patientName}
            onChange={(e) => setPatientName(e.target.value)}
            className="mt-1 w-full rounded-2xl border border-[#D5E8E3] bg-[#EAF5F2]/40 p-3 text-xs font-bold text-[#0E2924]"
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-[10px] font-black uppercase text-[#227B6B]">
            Age (years)
            <input
              required
              type="number"
              min={1}
              max={120}
              disabled={isBookingAppointment}
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="Enter age"
              className="mt-1 w-full rounded-2xl border border-[#D5E8E3] p-3 text-xs font-bold text-[#0E2924]"
            />
          </label>
          <label className="block text-[10px] font-black uppercase text-[#227B6B]">
            Gender
            <select
              disabled={isBookingAppointment}
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="mt-1 w-full rounded-2xl border border-[#D5E8E3] p-3 text-xs font-bold text-[#0E2924]"
            >
              <option value="">Select gender</option>
              <option value="Female">Female</option>
              <option value="Male">Male</option>
              <option value="Other">Other</option>
            </select>
          </label>
        </div>
        <label className="block text-[10px] font-black uppercase text-[#227B6B]">
          Contact number
          <PhoneNumberInput
            required
            disabled={isBookingAppointment}
            value={patientPhone}
            onChange={setPatientPhone}
            className="mt-1 w-full rounded-2xl border border-[#D5E8E3] p-3 text-xs font-bold text-[#0E2924]"
          />
        </label>
        <label className="block text-[10px] font-black uppercase text-[#227B6B]">
          Clinical department
          <select
            required
            disabled={isBookingAppointment}
            value={selectedDepartment}
            onChange={(e) => {
              setSelectedDepartment(e.target.value);
              setSelectedDoctor(null);
            }}
            className="mt-1 w-full rounded-2xl border border-[#D5E8E3] p-3 text-xs font-black text-[#113831]"
          >
            {departmentOptions.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-[10px] font-black uppercase text-[#227B6B]">
          Consulting specialist
          <select
            required
            disabled={isLoadingDoctors || isBookingAppointment || doctorList.length === 0}
            value={selectedDoctor?.doctor_id ?? ''}
            onChange={(e) => {
              const next =
                doctorsInDepartment.find((doc) => doc.doctor_id === e.target.value) ?? null;
              setSelectedDoctor(next);
            }}
            className="mt-1 w-full rounded-2xl border border-[#D5E8E3] p-3 text-xs font-black text-[#113831]"
          >
            {isLoadingDoctors ? (
              <option value="">Loading specialists…</option>
            ) : doctorsInDepartment.length === 0 ? (
              <option value="" disabled>
                No doctors assigned to {selectedDepartment}
              </option>
            ) : (
              <>
                <option value="">Select consulting doctor</option>
                {doctorsInDepartment.map((doc) => (
                  <option key={doc.doctor_id} value={doc.doctor_id}>
                    {formatDoctorBookingOptionLabel(doc)}
                  </option>
                ))}
              </>
            )}
          </select>
        </label>
        <button
          type="submit"
          disabled={
            isBookingAppointment ||
            isLoadingDoctors ||
            !selectedDoctor ||
            doctorsInDepartment.length === 0
          }
          className="w-full rounded-2xl bg-[#113831] py-3 text-xs font-black text-white disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isBookingAppointment ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Booking…
            </>
          ) : (
            'Confirm appointment'
          )}
        </button>
      </form>
    </div>
  );
}
