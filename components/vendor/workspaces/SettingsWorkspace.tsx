'use client';

import ProfileSettingsWorkspace from '@/components/vendor/workspaces/ProfileSettingsWorkspace';

/** @deprecated Use ProfileSettingsWorkspace */
function SettingsWorkspace() {
  return <ProfileSettingsWorkspace />;
}

export default SettingsWorkspace;
export { SettingsWorkspace, ProfileSettingsWorkspace };
