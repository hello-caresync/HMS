'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { fetchDoctorByUuid, type BookableDoctor } from '@/lib/doctor/bookable-doctors';
import { DEFAULT_PATIENT_ID } from '@/lib/clinical/bridge';
import {
  bookAppointmentWithDoctor,
  type BookAppointmentPayload,
} from '@/lib/patient/book-appointment';
import { loadBeneficiaryOptionsForActivePatient } from '@/lib/patient/family-members';
import {
  readPatientPortalSession,
  resolveActivePatientFormIdentity,
} from '@/lib/patient/portal-session';
import { ProfileCompletionGate } from '@/components/patient/ProfileCompletionGate';
import { usePatientProfileCompleteness } from '@/lib/patient/usePatientProfileCompleteness';
import { profileIncompleteBookingMessage } from '@/lib/utils/profileCompleteness';
import { toast } from 'sonner';
import {
  AlertCircle,
  Calendar as CalendarIcon,
  CheckCircle2,
  ChevronLeft,
  Clock,
  IndianRupee,
  Loader2,
  Stethoscope,
  User,
  UserPlus,
} from 'lucide-react';

interface FamilyMember {
  id: string;
  full_name: string;
  relation: string;
}

const PATIENT_ID = DEFAULT_PATIENT_ID;

const inputClass =
  'w-full rounded-2xl border border-[#e6ccb2] bg-[#faf7f2] p-3.5 text-xs font-bold text-[#43281c] outline-none focus:border-[#b08968] focus:ring-2 focus:ring-[#ede0d4]';

function BookAppointmentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedDoctorId = searchParams.get('doctorId') ?? '';

  const [loadingData, setLoadingData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [primaryPatientName, setPrimaryPatientName] = useState<string | null>(null);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [selectedPatient, setSelectedPatient] = useState('');

  const [selectedDoctor, setSelectedDoctor] = useState<BookableDoctor | null>(null);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [reasonForVisit, setReasonForVisit] = useState('OPD consultation');
  const [appointmentDate, setAppointmentDate] = useState(
    new Date().toISOString().split('T')[0],
  );
  const {
    loading: profileGateLoading,
    complete: profileComplete,
    missingFields: profileMissingFields,
  } = usePatientProfileCompleteness();

  const hospitalName =
    typeof window !== 'undefined'
      ? localStorage.getItem('selected_hospital_name') || 'Regal Hospital'
      : 'Regal Hospital';

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void (async () => {
        setLoadingData(true);
        setErrorMsg('');

        const identity = resolveActivePatientFormIdentity();
        const beneficiaryOptions = loadBeneficiaryOptionsForActivePatient();
        const selfOption = beneficiaryOptions.find((option) => option.relation === 'Self');

        setPrimaryPatientName(selfOption?.name ?? identity?.patient_name ?? null);
        setSelectedPatient(selfOption?.name ?? identity?.patient_name ?? '');
        setFamilyMembers(
          beneficiaryOptions
            .filter((option) => option.relation !== 'Self')
            .map((option) => ({
              id: option.id,
              full_name: option.name,
              relation: option.relation,
            })),
        );

        if (!selectedDoctorId) {
          setErrorMsg('No clinician selected. Please choose a doctor from the directory.');
          setLoadingData(false);
          return;
        }

        try {
          const doctor = await fetchDoctorByUuid(selectedDoctorId);
          if (!doctor) {
            setErrorMsg('Clinician not found for the provided doctor_id UUID.');
            setLoadingData(false);
            return;
          }

          setSelectedDoctor(doctor);
          setAvailableSlots(doctor.slots);
          setSelectedSlot(doctor.slots[0] ?? '');

        } catch (err) {
          console.warn('Notice loading booking context:', err);
          setErrorMsg('Failed to load clinician details.');
        } finally {
          setLoadingData(false);
        }
      })();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [selectedDoctorId]);

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileComplete) {
      toast.error(profileIncompleteBookingMessage(profileMissingFields));
      router.push('/patient/profile');
      return;
    }
    const patientSession = readPatientPortalSession();
    if (!patientSession) {
      toast.error('Session expired. Please log in again.');
      router.push('/patient/login');
      return;
    }
    if (!selectedPatient) {
      setErrorMsg('Please select a valid patient profile.');
      return;
    }
    if (!selectedDoctor?.employeeId && !selectedDoctor?.doctor_id) {
      setErrorMsg('Clinician not loaded. Please refresh and try again.');
      return;
    }
    if (!selectedDoctor.department) {
      setErrorMsg('Doctor department is required.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      await bookAppointmentWithDoctor({
        patientId: patientSession.patient_id || PATIENT_ID,
        patientName: selectedPatient || patientSession.patient_name,
        patient_name: selectedPatient || patientSession.patient_name,
        doctor: selectedDoctor,
        doctor_id: selectedDoctor.employeeId,
        doctor_name: selectedDoctor.name,
        appointmentDate,
        slotTime: selectedSlot,
        reasonForVisit,
        hospitalName,
        hospital_id: patientSession.hospital_id,
      } satisfies BookAppointmentPayload);

      toast.success(`Appointment confirmed with ${selectedDoctor.name}!`);
      router.push('/patient/dashboard');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to record appointment.';
      toast.error(`Booking failed: ${message}`);
      setErrorMsg(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8 font-sans text-[#43281c]">
      <div className="flex items-center justify-between border-b border-[#e6ccb2] pb-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-[#43281c] shadow-sm transition hover:bg-[#ede0d4]"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-[#43281c]">Book OPD Consultation</h1>
            <p className="text-xs font-bold text-[#4B736B]">
              Facility: <span className="font-black text-[#7f5539]">{hospitalName}</span>
            </p>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2 rounded-2xl bg-rose-100 p-4 text-xs font-bold text-rose-800">
          <AlertCircle className="h-5 w-5 shrink-0 text-[#E63950]" />
          <span>{errorMsg}</span>
        </div>
      )}

      {profileGateLoading ? (
        <div className="rounded-2xl border border-[#e6ccb2] bg-white p-6 text-xs font-bold text-[#4B736B]">
          Checking profile readiness for OPD booking…
        </div>
      ) : !profileComplete ? (
        <ProfileCompletionGate missingFields={profileMissingFields} />
      ) : null}

      {loadingData ? (
        <div className="flex items-center gap-2 rounded-3xl border border-[#e6ccb2] bg-white p-8 text-xs font-bold text-[#4B736B]">
          <Loader2 className="h-4 w-4 animate-spin text-[#b08968]" /> Loading clinician…
        </div>
      ) : selectedDoctor && profileComplete ? (
        <form
          onSubmit={(event) => void handleBookAppointment(event)}
          className="space-y-6 rounded-3xl border border-[#e6ccb2] bg-white p-6 shadow-sm sm:p-8"
        >
          <div className="rounded-2xl border border-[#e6ccb2] bg-[#ede0d4] p-4">
            <p className="text-[10px] font-black uppercase tracking-wider text-[#4B736B]">
              Selected Clinician
            </p>
            <p className="mt-1 text-sm font-black text-[#7f5539]">{selectedDoctor.name}</p>
            <p className="text-xs font-bold text-[#4B736B]">
              {selectedDoctor.department} • {selectedDoctor.specialization} •{' '}
              {selectedDoctor.employeeId}
            </p>
            <p className="mt-2 truncate font-mono text-[10px] font-semibold text-[#b08968]">
              doctor_id: {selectedDoctor.doctor_id}
            </p>
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#43281c]">
              <User className="h-4 w-4 text-[#b08968]" /> Select Registered Patient Profile *
            </label>

            {!primaryPatientName && familyMembers.length === 0 ? (
              <div className="space-y-3 rounded-2xl border border-[#e6ccb2] bg-[#ede0d4] p-5 text-center">
                <p className="text-xs font-bold text-[#43281c]">
                  No profile details found. Please set up your profile first.
                </p>
                <button
                  type="button"
                  onClick={() => router.push('/patient/profile')}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#7f5539] px-4 py-2.5 text-xs font-black text-white"
                >
                  <UserPlus className="h-4 w-4 text-[#ede0d4]" /> Set Up Profile
                </button>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {primaryPatientName && (
                  <button
                    type="button"
                    onClick={() => setSelectedPatient(primaryPatientName)}
                    className={`rounded-2xl border p-4 text-left transition ${
                      selectedPatient === primaryPatientName
                        ? 'border-[#7f5539] bg-[#7f5539] text-white'
                        : 'border-[#e6ccb2] bg-[#faf7f2] text-[#43281c] hover:border-[#b08968]'
                    }`}
                  >
                    <p className="text-sm font-black">{primaryPatientName}</p>
                    <p
                      className={`text-[10px] font-bold ${
                        selectedPatient === primaryPatientName ? 'text-[#ede0d4]' : 'text-[#4B736B]'
                      }`}
                    >
                      Primary Account Holder
                    </p>
                  </button>
                )}
                {familyMembers.map((member) => (
                  <button
                    type="button"
                    key={member.id}
                    onClick={() => setSelectedPatient(member.full_name)}
                    className={`rounded-2xl border p-4 text-left transition ${
                      selectedPatient === member.full_name
                        ? 'border-[#7f5539] bg-[#7f5539] text-white'
                        : 'border-[#e6ccb2] bg-[#faf7f2] text-[#43281c] hover:border-[#b08968]'
                    }`}
                  >
                    <p className="text-sm font-black">{member.full_name}</p>
                    <p
                      className={`text-[10px] font-bold ${
                        selectedPatient === member.full_name ? 'text-[#ede0d4]' : 'text-[#4B736B]'
                      }`}
                    >
                      Family ({member.relation})
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="mb-2 block text-xs font-black uppercase tracking-wider text-[#43281c]">
              Reason for Visit
            </label>
            <input
              type="text"
              value={reasonForVisit}
              onChange={(e) => setReasonForVisit(e.target.value)}
              className={inputClass}
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#43281c]">
                <CalendarIcon className="h-4 w-4 text-[#b08968]" /> Appointment Date *
              </label>
              <input
                type="date"
                required
                value={appointmentDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setAppointmentDate(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#43281c]">
                <Clock className="h-4 w-4 text-[#b08968]" /> Available Time Slots *
              </label>
              <select
                value={selectedSlot}
                onChange={(e) => setSelectedSlot(e.target.value)}
                className={inputClass}
              >
                {availableSlots.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedPatient && (
            <div className="space-y-1 rounded-2xl border border-[#e6ccb2] bg-[#ede0d4] p-4 text-xs font-bold">
              <p className="text-[10px] font-black uppercase text-[#4B736B]">Booking Summary</p>
              <p className="text-[#43281c]">
                Consultation for{' '}
                <span className="font-black text-[#7f5539]">{selectedPatient}</span> with{' '}
                <span className="font-black text-[#7f5539]">{selectedDoctor.name}</span> on{' '}
                <span className="font-black text-[#7f5539]">{appointmentDate}</span> at{' '}
                {selectedSlot}.
              </p>
              <p className="flex items-center gap-1 pt-1 text-[11px] font-black text-[#b08968]">
                <IndianRupee className="h-3.5 w-3.5" /> Fee: ₹{selectedDoctor.fee}
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || !selectedPatient || !selectedDoctor.doctor_id}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#7f5539] py-4 text-xs font-black text-white shadow-lg transition hover:bg-[#43281c] disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Confirming Appointment…
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 text-[#ede0d4]" /> Confirm & Generate SmartQ Token
              </>
            )}
          </button>
        </form>
      ) : (
        <div className="rounded-3xl border border-[#e6ccb2] bg-[#ede0d4] p-8 text-center">
          <Stethoscope className="mx-auto mb-3 h-8 w-8 text-[#b08968]" />
          <p className="text-xs font-bold text-[#4B736B]">
            Choose a doctor from the{' '}
            <button
              type="button"
              onClick={() => router.push('/patient/doctors')}
              className="font-black text-[#7f5539] underline"
            >
              Doctor Directory
            </button>
            .
          </p>
        </div>
      )}
    </div>
  );
}

export default function PatientBookPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center p-12 text-xs font-bold text-[#4B736B]">
          <Loader2 className="mr-2 h-4 w-4 animate-spin text-[#b08968]" />
          Loading booking form…
        </div>
      }
    >
      <BookAppointmentContent />
    </Suspense>
  );
}
