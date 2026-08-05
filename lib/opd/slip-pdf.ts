import type { EcosystemAppointment, EcosystemDoctor, HospitalBranch } from '@/lib/ecosystem/types';

import { getRoomDirections } from './room-directions';

export function downloadOpdSlipPdf(
  appointment: EcosystemAppointment,
  doctor?: EcosystemDoctor,
  branch?: HospitalBranch,
) {
  if (typeof window === 'undefined') return;

  const directions = getRoomDirections(appointment.roomNumber ?? doctor?.roomNumber);
  const qrValue = appointment.qrPayload ?? `NEXORA:CHECKIN:${appointment.id}:${appointment.patientMrn}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(qrValue)}`;

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>OPD Pass — ${appointment.patientName}</title>
<style>
  body { font-family: system-ui, sans-serif; color: #482A41; padding: 32px; max-width: 480px; margin: 0 auto; }
  h1 { font-size: 18px; color: #572E54; margin: 0 0 4px; }
  .sub { font-size: 12px; color: #8E7692; margin-bottom: 20px; }
  .card { border: 1px solid #8E7692; border-radius: 12px; padding: 20px; background: #fff; }
  .row { display: flex; justify-content: space-between; margin: 8px 0; font-size: 13px; }
  .label { color: #8E7692; font-weight: 600; }
  .val { font-weight: 700; }
  .token { font-size: 22px; color: #572E54; text-align: center; margin: 16px 0; }
  .directions { margin-top: 16px; padding-top: 12px; border-top: 1px dashed #CEB2C0; font-size: 12px; }
  .directions ol { margin: 8px 0 0; padding-left: 18px; }
  img { display: block; margin: 12px auto; }
  @media print { body { padding: 16px; } }
</style></head><body>
  <h1>Nexora Digital OPD Pass</h1>
  <p class="sub">${branch?.name ?? 'Nexora Healthcare'} · ${branch?.address ?? ''}</p>
  <div class="card">
    <img src="${qrUrl}" width="140" height="140" alt="QR" />
    <p class="token">${appointment.sequentialToken ?? appointment.token}</p>
    <div class="row"><span class="label">Patient</span><span class="val">${appointment.patientName}</span></div>
    <div class="row"><span class="label">Doctor</span><span class="val">${appointment.doctorName}</span></div>
    <div class="row"><span class="label">Department</span><span class="val">${appointment.department}</span></div>
    <div class="row"><span class="label">Date & Time</span><span class="val">${appointment.date} · ${appointment.time}</span></div>
    <div class="row"><span class="label">Room</span><span class="val">${appointment.roomNumber ?? doctor?.roomNumber ?? 'TBA'}</span></div>
    ${appointment.estimatedCost ? `<div class="row"><span class="label">Est. Cost</span><span class="val">₹${appointment.estimatedCost}</span></div>` : ''}
    ${directions ? `<div class="directions"><strong>Indoor Directions — ${directions.wing}</strong><ol>${directions.steps.map((s) => `<li>${s}</li>`).join('')}</ol></div>` : ''}
  </div>
  <p style="font-size:11px;color:#8E7692;margin-top:16px;text-align:center">Scan QR at kiosk for instant check-in · Nexora Smart OPD</p>
</body></html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, '_blank', 'noopener,noreferrer,width=520,height=720');
  if (win) {
    win.onload = () => {
      setTimeout(() => win.print(), 400);
    };
  }
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
