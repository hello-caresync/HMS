import UnifiedRegistrationPanel from '../../../frontoffice/patients/components/UnifiedRegistrationPanel';

export const metadata = {
  title: 'Patient Registration · CuraSync ERP',
  description: 'Unified registration and identity verification desk',
};

export default function PatientRegisterPage() {
  return (
    <div className="p-4 sm:p-6">
      <UnifiedRegistrationPanel />
    </div>
  );
}
