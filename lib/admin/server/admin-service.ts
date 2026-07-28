import type { AdminSession } from '@/lib/doctor/server/auth';
import { DEV_DOCTOR_ACCOUNTS } from '@/lib/doctor/auth/dev-auth';

export async function getEntrepreneurDashboard(_session: AdminSession) {
  const doctors = DEV_DOCTOR_ACCOUNTS.map((d) => ({
    id: d.id,
    fullName: d.fullName,
    email: d.email,
    specialization: d.specialization,
    role: d.role,
    appointmentCount: 42,
    prescriptionCount: 28,
    patientAssignments: 12,
  }));

  return {
    dashboard: {
      kpis: {
        doctors: doctors.length,
        patients: 128,
        appointmentsToday: 24,
        activeAdmissions: 5,
        pendingLabs: 7,
        systemHealth: 'operational',
      },
      hospitals: [{ id: '00000000-0000-4000-a000-000000000001', name: 'Nexora Multispeciality Hospital', code: 'NX-HOSP-01' }],
      doctors,
      recentActivity: [
        { id: 'act-1', action: 'LOGIN', entityType: 'doctor', entityId: doctors[0]?.id ?? 'doc', at: new Date().toISOString() },
      ],
    },
  };
}
