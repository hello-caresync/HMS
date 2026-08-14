'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, User } from 'lucide-react';
import {
  appointmentStatusBadgeClass,
  appointmentStatusLabel,
  normalizeAppointmentStatus,
} from '@/lib/doctor/appointment-status';
import {
  confirmAppointment,
  completeAppointment,
  startConsultationAppointment,
  type DoctorAppointmentRow,
} from '@/lib/doctor/appointments-service';
import { ccClasses } from '@/lib/doctor/command-center/theme';

type Props = {
  appointments: DoctorAppointmentRow[];
  isLoading?: boolean;
  onRefresh: () => void;
};

function formatTime(raw: string): string {
  if (!raw) return '—';
  if (/AM|PM/i.test(raw)) return raw;
  const [h, m] = raw.split(':');
  const hour = Number(h);
  if (Number.isNaN(hour)) return raw;
  const meridiem = hour >= 12 ? 'PM' : 'AM';
  const display = hour % 12 || 12;
  return `${display}:${m ?? '00'} ${meridiem}`;
}

export function TodaysAppointments({ appointments, isLoading, onRefresh }: Props) {
  const router = useRouter();

  const handleConfirm = async (id: string) => {
    await confirmAppointment(id);
    onRefresh();
  };

  const handleStart = async (id: string) => {
    await startConsultationAppointment(id);
    router.push(`/doctor/consultations?appointmentId=${id}`);
  };

  const handleComplete = async (id: string) => {
    await completeAppointment(id);
    onRefresh();
  };

  return (
    <div className={`p-6 ${ccClasses.card}`}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-black text-[#173F5F]">Today&apos;s Appointments</h2>
        <span className="text-xs font-bold text-[#5A7A94]">{appointments.length} scheduled</span>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 py-8 text-sm font-semibold text-[#5A7A94]">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading appointments…
        </div>
      ) : appointments.length === 0 ? (
        <p className="py-6 text-sm font-semibold text-[#5A7A94]">
          No appointments for today. Patient bookings appear here in real time.
        </p>
      ) : (
        <div className="space-y-3">
          {appointments.map((appt) => {
            const status = normalizeAppointmentStatus(appt.status);
            return (
              <div
                key={appt.appointment_id}
                className="rounded-2xl border border-[#E8F1F8] bg-[#F6F9FB] p-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-black text-[#173F5F]">
                        {formatTime(appt.appointment_time)}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-black ${appointmentStatusBadgeClass(status)}`}
                      >
                        {appointmentStatusLabel(status)}
                      </span>
                      {appt.token_number && (
                        <span className="rounded-full bg-[#173F5F]/10 px-2 py-0.5 text-[10px] font-black text-[#173F5F]">
                          Token {appt.token_number}
                        </span>
                      )}
                    </div>
                    <p className="flex items-center gap-1.5 text-sm font-black text-[#20639B]">
                      <User className="h-3.5 w-3.5" />
                      {appt.patient_name}
                    </p>
                    <p className="text-xs font-semibold text-[#173F5F]">
                      {appt.patient_age != null ? `${appt.patient_age} yrs` : '— yrs'}
                      {' · '}
                      {appt.patient_gender ?? '—'}
                      {' · BG '}
                      {appt.patient_blood_group ?? '—'}
                    </p>
                    <p className="text-xs font-semibold text-[#5A7A94]">
                      {appt.reason_for_visit || 'General consultation'}
                      {appt.department ? ` · ${appt.department}` : ''}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {status === 'requested' && (
                      <button
                        type="button"
                        onClick={() => void handleConfirm(appt.appointment_id)}
                        className={ccClasses.btnAccent}
                      >
                        Confirm
                      </button>
                    )}
                    <Link
                      href={`/doctor/patients/${appt.patient_id}/`}
                      className={ccClasses.btnGhost}
                    >
                      View Patient
                    </Link>
                    {(status === 'confirmed' || status === 'requested') && (
                      <button
                        type="button"
                        onClick={() => void handleStart(appt.appointment_id)}
                        className={ccClasses.btnPrimary}
                      >
                        Start Consultation
                      </button>
                    )}
                    {status === 'in_progress' && (
                      <>
                        <button
                          type="button"
                          onClick={() => router.push(`/doctor/consultations?appointmentId=${appt.appointment_id}`)}
                          className={ccClasses.btnGhost}
                        >
                          Open EMR
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleComplete(appt.appointment_id)}
                          className={ccClasses.btnAccent}
                        >
                          Complete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default TodaysAppointments;
