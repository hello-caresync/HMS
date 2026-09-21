'use client';

import { useCallback, useEffect, useState } from 'react';

import { evaluatePatientProfileCompleteness } from '@/lib/patient/profile-completeness';
import { supabase } from '@/lib/supabaseClient';
import type { ProfileCompletenessResult } from '@/lib/utils/profileCompleteness';

type ProfileCompletenessState = ProfileCompletenessResult & {
  loading: boolean;
  refresh: () => Promise<void>;
};

export function usePatientProfileCompleteness(): ProfileCompletenessState {
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<ProfileCompletenessResult>({
    complete: false,
    missingFields: [],
  });

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const evaluation = await evaluatePatientProfileCompleteness(supabase);
      setResult({
        complete: evaluation.complete,
        missingFields: evaluation.missingFields,
      });
    } catch {
      setResult({
        complete: false,
        missingFields: ['Profile not found'],
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    loading,
    complete: result.complete,
    missingFields: result.missingFields,
    refresh,
  };
}
