'use client';

import { useCallback, useEffect, useState } from 'react';

import {
  fetchHospitalDoctors,
  getStoredActiveHospitalId,
  type HospitalDoctorOption,
} from '@/lib/hospital/hospital-members.service';

export function useHospitalDoctors() {
  const [doctors, setDoctors] = useState<HospitalDoctorOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [hospitalId, setHospitalId] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    const activeId = getStoredActiveHospitalId();
    const rows = await fetchHospitalDoctors(activeId);
    setDoctors(rows);
    setHospitalId(rows[0]?.hospitalId ?? activeId);
    setLoading(false);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { doctors, loading, hospitalId, reload };
}

export function formatDoctorOptionLabel(doctor: HospitalDoctorOption): string {
  const fee = doctor.consultationFee ? ` · ₹${doctor.consultationFee}` : '';
  return `${doctor.fullName} (${doctor.department})${fee}`;
}
