import { getModuleConfig } from '../_config/moduleRegistry';
import HospitalInteractiveModuleShell from '../_components/HospitalInteractiveModuleShell';

export function renderHospitalModule(moduleKey: string) {
  return <HospitalInteractiveModuleShell {...getModuleConfig(moduleKey)} />;
}
