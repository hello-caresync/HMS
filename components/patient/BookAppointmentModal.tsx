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
import { DynamicSlotPicker } from '@/components/patient/DynamicSlotPicker';
import { bookAppointmentWithDoctor } from '@/lib/patient/book-appointment';
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
import { supabase } from '@/lib/supabaseClient';

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
  patientId?: string;
  onBookingSuccess?: (appointmentRecord: Record<string, unknown>) => void;
}

export function BookAppointmentModal({
  isOpen,
  onClose,
  hospitalId,
  patientId,
  onBookingSuccess,
}: BookAppointmentModalProps) {
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
  }, [hospitalId, isOpen, selectedDept]);

  useEffect(() => {
    if (isOpen) {
      void fetchDoctors();
    }
  }, [isOpen, fetchDoctors]);

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
      return;
    }

    let cancelled = false;
    setLoadingSlots(true);
    void loadDynamicDoctorSchedule(supabase, selectedDoctorId, appointmentDate, symptoms).then(
      ({ slots }) => {
        if (cancelled) return;
        setDynamicSlots(slots);
        const auto = resolveAutoSelectedSlot(slots, appointmentTime);
        setAppointmentTime(auto?.time ?? '');
        setLoadingSlots(false);
      },
    );

    return () => {
      cancelled = true;
    };
  }, [isOpen, selectedDoctorId, appointmentDate, symptoms]);

  const activeDoctor = doctors.find((doctor) => doctor.id === selectedDoctorId);
  const hasSelectableSlot = dynamicSlots.some((slot) => slot.isSelectable);

  const handleConfirmBooking = async (event: React.FormEvent) => {
    event.preventDefault();
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
      const bookingPatientId =
        patientId || sessionIdentity?.patient_id || getActivePatientId() || session?.patient_id;

      const bookingDepartment =
        selectedDept === 'ALL' ? activeDoctor.department : selectedDept;

      const rosterDoctor = allDoctors.find(
        (row) =>
          row.doctor_id === activeDoctor.id ||
          row.id === activeDoctor.id ||
          row.full_name === activeDoctor.name,
      );

      const result = await bookAppointmentWithDoctor({
        patientId: bookingPatientId,
        patientName: sessionIdentity?.patient_name || session?.patient_name,
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
      console.error('Booking submission failed:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to book appointment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Book Outpatient Consultation</h3>
            <p className="text-xs text-slate-500">Live scheduling with verified hospital physicians</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 font-semibold text-lg p-1"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleConfirmBooking} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Department
            </label>
            <select
              value={selectedDept}
              onChange={(event) => {
                setSelectedDept(event.target.value);
                setSelectedDoctorId('');
              }}
              className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-sm font-medium text-slate-800 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
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
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Consulting Physician
            </label>
            {loadingDoctors ? (
              <div className="p-3 text-xs text-slate-400 border border-slate-200 rounded-xl animate-pulse bg-slate-50">
                Fetching available physicians...
              </div>
            ) : doctors.length === 0 ? (
              <div className="p-3 text-xs text-amber-800 bg-amber-50 rounded-xl border border-amber-200 font-medium">
                No active doctors currently registered under this department.
              </div>
            ) : (
              <select
                value={selectedDoctorId}
                onChange={(event) => setSelectedDoctorId(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-sm font-semibold text-slate-800 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
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
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-teal-50/70 border border-teal-200/70">
              <div>
                <p className="text-xs font-bold text-teal-900">{activeDoctor.name}</p>
                <p className="text-[11px] text-teal-700">
                  {activeDoctor.qualification || 'MBBS, MD'} • {activeDoctor.department}
                </p>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-teal-700 tracking-wider block">
                  Consultation Fee
                </span>
                <span className="text-sm font-extrabold text-teal-900">
                  {formatConsultationFee(activeDoctor.consultation_fee)}
                </span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Preferred Date
              </label>
              <input
                type="date"
                required
                value={appointmentDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(event) => setAppointmentDate(event.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-sm text-slate-800 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Preferred Slot
              </label>
              {!selectedDoctorId ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-500">
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
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Reason for Visit / Symptoms
            </label>
            <input
              type="text"
              placeholder="e.g., Chest discomfort, routine follow-up, knee fracture review"
              value={symptoms}
              onChange={(event) => setSymptoms(event.target.value)}
              className="w-full rounded-xl border border-slate-200 p-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition"
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
              className="px-5 py-2 text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 rounded-xl shadow-md transition"
            >
              {submitting ? 'Confirming...' : 'Confirm Appointment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
