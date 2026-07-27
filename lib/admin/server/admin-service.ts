import { getPrisma } from '@/lib/prisma';
import type { AdminSession } from '@/lib/doctor/server/auth';

export async function getEntrepreneurDashboard(_session: AdminSession) {
  const prisma = await getPrisma();
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const [
    doctorCount,
    patientCount,
    appointmentsToday,
    activeAdmissions,
    pendingLabs,
    hospitals,
    doctors,
    recentAudit,
  ] = await Promise.all([
    prisma.doctor.count({ where: { deletedAt: null } }),
    prisma.patient.count({ where: { deletedAt: null } }),
    prisma.appointment.count({
      where: { scheduledAt: { gte: start, lt: end }, deletedAt: null },
    }),
    prisma.ipdAdmission.count({ where: { status: 'ADMITTED', deletedAt: null } }),
    prisma.labOrder.count({
      where: { status: { in: ['ORDERED', 'IN_PROGRESS', 'SAMPLE_COLLECTED'] }, deletedAt: null },
    }),
    prisma.hospital.findMany({ select: { id: true, name: true, code: true } }),
    prisma.doctor.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        fullName: true,
        email: true,
        specialization: true,
        role: true,
        hospitalId: true,
        _count: {
          select: {
            appointments: true,
            prescriptions: true,
            patientAssignments: true,
          },
        },
      },
      take: 50,
    }),
    prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 15 }),
  ]);

  const doctorStats = doctors.map((d) => ({
    id: d.id,
    fullName: d.fullName,
    email: d.email,
    specialization: d.specialization,
    role: d.role,
    appointmentCount: d._count.appointments,
    prescriptionCount: d._count.prescriptions,
    patientAssignments: d._count.patientAssignments,
  }));

  return {
    dashboard: {
      kpis: {
        doctors: doctorCount,
        patients: patientCount,
        appointmentsToday,
        activeAdmissions,
        pendingLabs,
        systemHealth: 'operational',
      },
      hospitals,
      doctors: doctorStats,
      recentActivity: recentAudit.map((l) => ({
        id: l.id,
        action: l.action,
        entityType: l.entityType,
        entityId: l.entityId,
        at: l.createdAt.toISOString(),
      })),
    },
  };
}
