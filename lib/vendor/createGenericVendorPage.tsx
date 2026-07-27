'use client';

import { GenericModuleWorkspace } from '@/components/vendor/workspaces/GenericModuleWorkspace';
import { VENDOR_MODULE_REGISTRY } from '@/lib/vendor/modules/registry';

export function createGenericVendorPage(slug: keyof typeof VENDOR_MODULE_REGISTRY) {
  const config = VENDOR_MODULE_REGISTRY[slug];

  return function GenericVendorModulePage() {
    return <GenericModuleWorkspace config={config} />;
  };
}
