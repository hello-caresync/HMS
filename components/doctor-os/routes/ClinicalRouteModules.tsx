'use client';

import { useEffect } from 'react';

import DoctorOsCareCenter from '@/components/doctor-os/care-center/DoctorOsCareCenter';
import { useCareCenterStore } from '@/lib/doctor/stores/care-center-store';

export function OpdConsultationPage() {
  const setTab = useCareCenterStore((s) => s.setTab);
  useEffect(() => {
    setTab('opd');
  }, [setTab]);
  return <DoctorOsCareCenter />;
}

export function IpdManagementPage() {
  const setTab = useCareCenterStore((s) => s.setTab);
  useEffect(() => {
    setTab('ipd');
  }, [setTab]);
  return <DoctorOsCareCenter />;
}
