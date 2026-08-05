'use client';

import { opdUi } from '@/lib/opd/design-tokens';
import { OpdSlipActions } from '@/components/opd/OpdSlipActions';
import { RoomDirections } from '@/components/opd/RoomDirections';
import { useEcosystemStore } from '@/lib/ecosystem/store';
import type { EcosystemAppointment } from '@/lib/ecosystem/types';

type Props = {
  appointment: EcosystemAppointment;
  showDirections?: boolean;
  showSlipActions?: boolean;
};

export function AppointmentPass({ appointment, showDirections = true, showSlipActions = true }: Props) {
  const doctors = useEcosystemStore((s) => s.doctors);
  const branches = useEcosystemStore((s) => s.branches);
  const doctor = doctors.find((d) => d.id === appointment.doctorId);
  const branch = branches.find((b) => b.id === (appointment.branchId ?? doctor?.branchId));

  const qrValue = appointment.qrPayload ?? `NEXORA:CHECKIN:${appointment.id}:${appointment.patientMrn}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(qrValue)}`;

  return (
    <div className="space-y-4">
      <div className={`${opdUi.cardMauve} p-5`}>
        <p className="text-xs font-black uppercase tracking-wider text-[#572E54]">Digital OPD Pass</p>
        {branch && <p className="mt-1 text-xs text-[#8E7692]">{branch.name} · {branch.city}</p>}
        <div className="mt-4 flex flex-wrap items-center gap-5">
          <img src={qrUrl} alt="Check-in QR code" className="h-40 w-40 rounded-xl border border-[#8E7692]/30 bg-white p-2" />
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-xs font-bold text-[#8E7692]">Patient</dt>
              <dd className="font-black text-[#482A41]">{appointment.patientName}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold text-[#8E7692]">Doctor</dt>
              <dd className="font-bold">{appointment.doctorName}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold text-[#8E7692]">Token</dt>
              <dd className="font-black text-[#572E54]">{appointment.sequentialToken ?? appointment.token}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold text-[#8E7692]">Room</dt>
              <dd>{appointment.roomNumber ?? doctor?.roomNumber ?? 'Assigned at check-in'}</dd>
            </div>
            {appointment.estimatedCost != null && (
              <div>
                <dt className="text-xs font-bold text-[#8E7692]">Est. Consultation</dt>
                <dd className="font-black text-[#572E54]">₹{appointment.estimatedCost}</dd>
              </div>
            )}
          </dl>
        </div>
        <p className="mt-3 text-xs text-[#8E7692]">Scan at hospital kiosk or show to reception for instant check-in.</p>
        {showSlipActions && <OpdSlipActions appointment={appointment} doctor={doctor} branch={branch} />}
      </div>
      {showDirections && <RoomDirections roomNumber={appointment.roomNumber ?? doctor?.roomNumber} />}
    </div>
  );
}
