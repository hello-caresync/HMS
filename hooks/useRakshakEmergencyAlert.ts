'use client';

import { useCallback, useEffect, useState } from 'react';

import { resolvePatientDbId } from '@/lib/patient/constants';
import {
  type EmergencyAlert,
  fetchActiveEmergencyAlert,
  subscribeEmergencyAlert,
} from '@/lib/patient/emergency/rakshak-sos.service';

export function useRakshakEmergencyAlert(sessionPatientId?: string | null) {
  const patientId = resolvePatientDbId(sessionPatientId);
  const [activeAlert, setActiveAlert] = useState<EmergencyAlert | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const alert = await fetchActiveEmergencyAlert(patientId);
      setActiveAlert(alert);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!activeAlert?.id) return undefined;
    return subscribeEmergencyAlert(activeAlert.id, setActiveAlert);
  }, [activeAlert?.id]);

  return {
    patientId,
    activeAlert,
    loading,
    refresh,
    setActiveAlert,
  };
}
