import type { EcosystemAppointment, EcosystemDoctor } from '@/lib/ecosystem/types';

export type SlotRecommendation = {
  slot: string;
  score: number;
  estimatedWaitMinutes: number;
  queueDepth: number;
  label: string;
  factors: AiSchedulingFactor[];
};

export type AiSchedulingFactor = {
  name: string;
  impact: 'positive' | 'neutral' | 'negative';
  detail: string;
};

function formatSlotLabel(slot: string): string {
  const [h, m] = slot.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

/** AI Smart Scheduling — scores slots by queue depth, consult speed, emergency buffer, historical delays */
export function recommendAiSlot(
  doctor: EcosystemDoctor,
  date: string,
  appointments: EcosystemAppointment[],
): SlotRecommendation | null {
  if (!doctor.slots.length) return null;

  const doctorAppts = appointments.filter(
    (a) =>
      a.doctorId === doctor.id &&
      a.date === date &&
      !['Cancelled', 'Completed', 'No-Show'].includes(a.status),
  );

  const avgConsult = doctor.avgConsultMinutes ?? 12;
  const historicalDelay = doctor.historicalDelayMinutes ?? 8;
  const emergencyBuffer = doctorAppts.some((a) => a.isEmergency || a.priorityTier === 'emergency') ? 15 : 0;
  const roomAvailable = true;

  let best: SlotRecommendation | null = null;

  for (const slot of doctor.slots) {
    const slotMins = parseTime(slot);
    const ahead = doctorAppts.filter((a) => {
      const apptMins = parseTime(a.time);
      return apptMins <= slotMins && ['Confirmed', 'Checked-In', 'In Consultation'].includes(a.status);
    });

    const queueDepth = ahead.length;
    const vipAhead = ahead.filter((a) => a.priorityTier === 'vip' || a.priorityTier === 'senior').length;
    const waitMinutes = Math.round(queueDepth * avgConsult + emergencyBuffer + historicalDelay * 0.3 + vipAhead * 5);
    const score = 100 - waitMinutes - queueDepth * 3 - (roomAvailable ? 0 : 20);

    const factors: AiSchedulingFactor[] = [
      {
        name: 'Queue depth',
        impact: queueDepth <= 2 ? 'positive' : queueDepth <= 5 ? 'neutral' : 'negative',
        detail: `${queueDepth} patients ahead at ${formatSlotLabel(slot)}`,
      },
      {
        name: 'Consultation speed',
        impact: avgConsult <= 12 ? 'positive' : 'neutral',
        detail: `Dr. avg ${avgConsult} min/consultation`,
      },
      {
        name: 'Historical delays',
        impact: historicalDelay <= 8 ? 'positive' : 'negative',
        detail: `Typical delay pattern +${historicalDelay} min`,
      },
      {
        name: 'Emergency buffer',
        impact: emergencyBuffer ? 'negative' : 'positive',
        detail: emergencyBuffer ? 'Emergency cases active — buffer applied' : 'No emergency buffer needed',
      },
      {
        name: 'Room availability',
        impact: roomAvailable ? 'positive' : 'negative',
        detail: `${doctor.roomNumber} available for OPD`,
      },
    ];

    const candidate: SlotRecommendation = {
      slot,
      score,
      estimatedWaitMinutes: waitMinutes,
      queueDepth,
      label: `⭐ AI Recommended Slot (${formatSlotLabel(slot)} — Lowest Wait Time)`,
      factors,
    };

    if (!best || candidate.score > best.score) best = candidate;
  }

  return best;
}

export function buildAiSchedulingSummary(
  doctor: EcosystemDoctor,
  date: string,
  appointments: EcosystemAppointment[],
): { recommendation: SlotRecommendation | null; summaryLines: string[] } {
  const recommendation = recommendAiSlot(doctor, date, appointments);
  if (!recommendation) {
    return { recommendation: null, summaryLines: ['No slots available for AI analysis today.'] };
  }

  const todayQueue = appointments.filter(
    (a) =>
      a.doctorId === doctor.id &&
      a.date === date &&
      ['Confirmed', 'Checked-In', 'In Consultation'].includes(a.status),
  );

  const summaryLines = [
    `Optimal slot: ${formatSlotLabel(recommendation.slot)} · ~${recommendation.estimatedWaitMinutes} min wait`,
    `${todayQueue.length} patients in live queue · ${doctor.roomNumber}`,
    `Factors: queue depth (${recommendation.queueDepth}), consult avg (${doctor.avgConsultMinutes}m), historical delay (+${doctor.historicalDelayMinutes ?? 8}m)`,
  ];

  return { recommendation, summaryLines };
}

export function computeWaitEstimate(
  appointment: EcosystemAppointment,
  doctor: EcosystemDoctor,
  queue: EcosystemAppointment[],
): number {
  const avgConsult = doctor.avgConsultMinutes ?? 12;
  const historicalDelay = Math.round((doctor.historicalDelayMinutes ?? 8) * 0.25);
  const position =
    appointment.queuePosition ??
    queue.filter(
      (a) =>
        a.doctorId === appointment.doctorId &&
        a.date === appointment.date &&
        ['Checked-In', 'Confirmed'].includes(a.status) &&
        parseTime(a.time) <= parseTime(appointment.time),
    ).length;

  const emergencyPenalty = queue.some(
    (a) => (a.isEmergency || a.priorityTier === 'emergency') && a.doctorId === appointment.doctorId,
  )
    ? 12
    : 0;
  const priorityPenalty =
    appointment.priorityTier === 'vip' || appointment.priorityTier === 'senior' ? -8 : 0;
  const inConsult = queue.find((a) => a.status === 'In Consultation' && a.doctorId === appointment.doctorId);
  const consultRemain = inConsult ? Math.ceil(avgConsult / 2) : 0;

  return Math.max(0, (position - 1) * avgConsult + consultRemain + emergencyPenalty + historicalDelay + priorityPenalty);
}

export function computeDelayStatus(
  appointment: EcosystemAppointment,
  waitMinutes: number,
  queue: EcosystemAppointment[],
): 'on-time' | 'slight-delay' | 'urgent' {
  if (
    appointment.isEmergency ||
    appointment.priorityTier === 'emergency' ||
    queue.some((a) => (a.isEmergency || a.priorityTier === 'emergency') && a.doctorId === appointment.doctorId)
  ) {
    return 'urgent';
  }
  if (waitMinutes > 15) return 'slight-delay';
  return 'on-time';
}

function parseTime(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + (m || 0);
}

export function generateSequentialToken(prefix: string, appointments: EcosystemAppointment[], doctorId: string): string {
  const nums = appointments
    .filter((a) => a.doctorId === doctorId && a.sequentialToken?.startsWith(prefix))
    .map((a) => parseInt(a.sequentialToken?.split('-')[1] ?? '0', 10))
    .filter((n) => !Number.isNaN(n));
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return `${prefix}-${String(next).padStart(3, '0')}`;
}

export function buildQrPayload(appointmentId: string, patientMrn: string): string {
  return `NEXORA:CHECKIN:${appointmentId}:${patientMrn}`;
}

export function parseQrPayload(raw: string): { appointmentId: string; mrn: string } | null {
  const match = raw.trim().match(/^NEXORA:CHECKIN:([^:]+):(.+)$/);
  if (!match) return null;
  return { appointmentId: match[1], mrn: match[2] };
}

export function priorityWeight(tier?: EcosystemAppointment['priorityTier']): number {
  switch (tier) {
    case 'emergency':
      return 0;
    case 'vip':
      return 1;
    case 'senior':
      return 2;
    default:
      return 3;
  }
}
