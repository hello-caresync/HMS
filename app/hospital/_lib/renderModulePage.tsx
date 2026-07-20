import { getModuleConfig } from '../_config/moduleRegistry';
import HospitalModuleShell from '../_components/HospitalModuleShell';

export function renderHospitalModule(moduleKey: string) {
  return <HospitalModuleShell {...getModuleConfig(moduleKey)} />;
}
