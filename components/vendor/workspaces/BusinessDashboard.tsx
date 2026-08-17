'use client';

import DashboardWorkspace from './DashboardWorkspace';

/** Legacy alias — delegates to the live Supabase-backed dashboard. */
function BusinessDashboard() {
  return <DashboardWorkspace />;
}

export default BusinessDashboard;
export { BusinessDashboard };
