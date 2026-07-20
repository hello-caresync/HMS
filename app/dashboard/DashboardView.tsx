'use client';

import ExecutiveOpsDashboard from './components/executive-ops/ExecutiveOpsDashboard';

type DashboardViewProps = {
  onNavigate?: (moduleId: string) => void;
};

export default function DashboardView({ onNavigate }: DashboardViewProps) {
  return <ExecutiveOpsDashboard onNavigate={onNavigate} />;
}
