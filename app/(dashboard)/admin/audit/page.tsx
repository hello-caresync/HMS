import SecurityAuditDashboard from '../../../administration/admin/components/SecurityAuditDashboard';

export const metadata = {
  title: 'Security Audit · CuraSync ERP',
  description: 'IT security audit log console',
};

export default function AdminAuditPage() {
  return <SecurityAuditDashboard />;
}
