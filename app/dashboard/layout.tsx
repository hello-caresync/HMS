import { HospitalAppShell } from '@/components/nexora-hospital/shell/HospitalAppShell';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <HospitalAppShell>{children}</HospitalAppShell>;
}
