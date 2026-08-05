import type { EcosystemAppointment, EcosystemDoctor, OpdAnalyticsSnapshot } from '@/lib/ecosystem/types';

import { computeWaitEstimate } from './scheduling-ai';

export type { OpdAnalyticsSnapshot };

export function computeOpdAnalytics(
  appointments: EcosystemAppointment[],
  doctors: EcosystemDoctor[],
  waitingHallOccupancy = 0,
  waitingHallCapacity = 80,
): OpdAnalyticsSnapshot {
  const today = new Date().toISOString().slice(0, 10);
  const todayAppts = appointments.filter((a) => a.date === today && a.status !== 'Cancelled');

  const checkedIn = todayAppts.filter((a) =>
    ['Checked-In', 'In Consultation', 'Completed'].includes(a.status),
  );

  let totalWait = 0;
  let waitCount = 0;
  checkedIn.forEach((a) => {
    const doctor = doctors.find((d) => d.id === a.doctorId);
    if (!doctor) return;
    const w = a.estimatedWaitMinutes ?? computeWaitEstimate(a, doctor, todayAppts);
    totalWait += w;
    waitCount++;
  });

  const avgConsult =
    doctors.reduce((s, d) => s + (d.avgConsultMinutes ?? 12), 0) / Math.max(doctors.length, 1);

  const hourCounts: Record<string, number> = {};
  todayAppts.forEach((a) => {
    const hour = `${a.time.split(':')[0]}:00`;
    hourCounts[hour] = (hourCounts[hour] ?? 0) + 1;
  });
  const peakHour = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '10:00';

  const slotsPerDoctor = 16;
  const utilization = Math.min(
    100,
    Math.round((todayAppts.length / Math.max(doctors.length * slotsPerDoctor, 1)) * 100),
  );

  const scheduledOrPast = todayAppts.filter((a) =>
    ['Confirmed', 'Checked-In', 'In Consultation', 'Completed', 'No-Show'].includes(a.status),
  );
  const noShows = todayAppts.filter((a) => a.status === 'No-Show');
  const noShowRatePct = scheduledOrPast.length
    ? Math.round((noShows.length / scheduledOrPast.length) * 100)
    : 0;

  const rated = todayAppts.filter((a) => a.satisfactionRating != null);
  const avgSatisfactionRating = rated.length
    ? Math.round((rated.reduce((s, a) => s + (a.satisfactionRating ?? 0), 0) / rated.length) * 10) / 10
    : 4.6;

  const occupancy = waitingHallOccupancy || checkedIn.filter((a) => a.status === 'Checked-In').length;
  const waitingHallOccupancyPct = Math.min(
    100,
    Math.round((occupancy / Math.max(waitingHallCapacity, 1)) * 100),
  );

  return {
    totalPatientsToday: todayAppts.length,
    avgWaitMinutes: waitCount ? Math.round(totalWait / waitCount) : 0,
    avgConsultMinutes: Math.round(avgConsult),
    doctorUtilizationPct: utilization,
    peakHour,
    noShowRatePct,
    avgSatisfactionRating,
    waitingHallOccupancyPct,
    updatedAt: new Date().toISOString(),
  };
}

export function computeWaitingHallOccupancy(appointments: EcosystemAppointment[]): number {
  const today = new Date().toISOString().slice(0, 10);
  return appointments.filter((a) => a.date === today && a.status === 'Checked-In').length;
}
