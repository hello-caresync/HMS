'use client';

import { useEffect, useMemo, useState } from 'react';
import { Clock, MapPin, QrCode, User } from 'lucide-react';

import { RoomDirections } from '@/components/opd/RoomDirections';
import { opdUi, delayBadgeClass, delayLabel } from '@/lib/opd/design-tokens';
import { subscribeOpdEvents } from '@/lib/opd/realtime';
import { formatTimeLabel } from '@/lib/ecosystem/hooks';
import { useEcosystemStore } from '@/lib/ecosystem/store';
import type { EcosystemAppointment } from '@/lib/ecosystem/types';

type Props = {
  appointment: EcosystemAppointment;
};

export function LiveQueueTracker({ appointment }: Props) {
  const doctors = useEcosystemStore((s) => s.doctors);
  const appointments = useEcosystemStore((s) => s.appointments);
  const [, tick] = useState(0);

  useEffect(() => {
    const unsub = subscribeOpdEvents(() => tick((n) => n + 1));
    const interval = setInterval(() => tick((n) => n + 1), 30000);
    return () => {
      unsub();
      clearInterval(interval);
    };
  }, []);

  const doctor = doctors.find((d) => d.id === appointment.doctorId);
  const liveAppt = appointments.find((a) => a.id === appointment.id) ?? appointment;

  const waitMinutes = useMemo(() => {
    return liveAppt.estimatedWaitMinutes ?? 18;
  }, [liveAppt]);

  const delayStatus = liveAppt.delayStatus ?? 'on-time';

  if (!doctor) return null;

  const displayName = doctor.name.replace(/^Dr\.\s*/i, 'Dr. ');

  return (
    <article className={`${opdUi.card} overflow-hidden border-[#8E7692]/40`}>
      <div className={`${opdUi.topBar} px-5 py-4`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="flex items-center gap-2 text-lg font-black">
              <User className="h-5 w-5" /> {displayName}
            </p>
            <p className="text-sm text-white/80">{liveAppt.department} · {doctor.specialization.split('·')[0]?.trim()}</p>
          </div>
          <div className="flex items-center gap-1 text-sm text-white/90">
            <MapPin className="h-4 w-4" /> {liveAppt.roomNumber ?? doctor.roomNumber}
          </div>
        </div>
      </div>

      <div className="space-y-5 bg-[#E2D2C8]/40 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className={delayBadgeClass(delayStatus)}>{delayLabel(delayStatus)}</span>
          {liveAppt.status === 'In Consultation' && (
            <span className="rounded-full bg-[#572E54] px-3 py-1 text-xs font-bold text-white">
              Now serving you
            </span>
          )}
        </div>

        <div className="text-center">
          <p className="text-xs font-black uppercase tracking-widest text-[#8E7692]">Estimated Wait</p>
          <p className={opdUi.waitMetric}>
            {waitMinutes}
            <span className="ml-2 text-2xl font-bold text-[#8E7692]">min</span>
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 rounded-xl border border-[#8E7692]/30 bg-white/80 p-3 text-center text-xs">
          <div>
            <p className="font-bold text-[#8E7692]">Slot</p>
            <p className="mt-1 flex items-center justify-center gap-1 font-black text-[#482A41]">
              <Clock className="h-3 w-3" /> {formatTimeLabel(liveAppt.time)}
            </p>
          </div>
          <div>
            <p className="font-bold text-[#8E7692]">Token</p>
            <p className="mt-1 font-black text-[#572E54]">
              #{liveAppt.sequentialToken?.split('-')[1] ?? liveAppt.token.replace(/\D/g, '')}
            </p>
          </div>
          <div>
            <p className="font-bold text-[#8E7692]">Room</p>
            <p className="mt-1 font-black text-[#482A41]">{liveAppt.roomNumber ?? doctor.roomNumber}</p>
          </div>
        </div>

        <RoomDirections roomNumber={liveAppt.roomNumber ?? doctor.roomNumber} />

        {liveAppt.sequentialToken && (
          <p className="flex items-center justify-center gap-2 text-sm font-bold text-[#572E54]">
            <QrCode className="h-4 w-4" /> Queue ID: {liveAppt.sequentialToken}
          </p>
        )}
      </div>
    </article>
  );
}
