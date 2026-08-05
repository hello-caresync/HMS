'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { useEcosystemStore } from '@/lib/ecosystem/store';
import {
  fetchRealTimeSlots,
  type RealTimeSlot,
} from '@/lib/patient/booking/fetchRealTimeSlots';
import { getSupabaseBrowserClient } from '@/lib/supabase';

function localBookedTimesForDoctor(doctorId: string, date: string): string[] {
  return useEcosystemStore
    .getState()
    .appointments.filter(
      (a) =>
        a.doctorId === doctorId &&
        a.date === date &&
        !['Cancelled', 'No-Show'].includes(a.status),
    )
    .map((a) => a.time);
}

type Options = {
  fallbackSlotTimes?: string[];
};

export function useRealTimeSlots(
  selectedDoctorId: string | null | undefined,
  selectedDate: string | null | undefined,
  options: Options = {},
) {
  const [availableTimeSlots, setAvailableTimeSlots] = useState<RealTimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotSource, setSlotSource] = useState<'supabase' | 'local' | 'idle'>('idle');
  const [slotError, setSlotError] = useState<string | null>(null);
  const fetchIdRef = useRef(0);
  const fallbackRef = useRef<string[]>(options.fallbackSlotTimes ?? []);
  fallbackRef.current = options.fallbackSlotTimes ?? [];

  const loadSlots = useCallback(async () => {
    if (!selectedDoctorId || !selectedDate) {
      setAvailableTimeSlots([]);
      setSlotSource('idle');
      setLoadingSlots(false);
      return;
    }

    const fetchId = ++fetchIdRef.current;
    setLoadingSlots(true);
    setSlotError(null);

    const fallback = fallbackRef.current;
    const localBooked = localBookedTimesForDoctor(selectedDoctorId, selectedDate);

    try {
      const supabase = getSupabaseBrowserClient();

      if (!supabase) {
        const slots = fallback.map((slotTime, i) => ({
          id: `local-${selectedDoctorId}-${i}`,
          slotTime,
          dayOfWeek: new Date(`${selectedDate}T12:00:00`).getDay(),
          isBooked: localBooked.includes(slotTime),
        }));
        if (fetchId === fetchIdRef.current) {
          setAvailableTimeSlots(slots);
          setSlotSource('local');
        }
        return;
      }

      const result = await fetchRealTimeSlots(
        supabase,
        selectedDoctorId,
        selectedDate,
        fallback,
        localBooked,
      );

      if (fetchId === fetchIdRef.current) {
        setAvailableTimeSlots(result.slots);
        setSlotSource(result.source);
      }
    } catch (err) {
      if (fetchId === fetchIdRef.current) {
        setSlotError(err instanceof Error ? err.message : 'Failed to load slots');
        setAvailableTimeSlots(
          fallback.map((slotTime, i) => ({
            id: `local-${selectedDoctorId}-${i}`,
            slotTime,
            dayOfWeek: new Date(`${selectedDate}T12:00:00`).getDay(),
            isBooked: localBooked.includes(slotTime),
          })),
        );
        setSlotSource('local');
      }
    } finally {
      if (fetchId === fetchIdRef.current) setLoadingSlots(false);
    }
  }, [selectedDoctorId, selectedDate]);

  const loadSlotsRef = useRef(loadSlots);
  loadSlotsRef.current = loadSlots;

  useEffect(() => {
    void loadSlots();
  }, [loadSlots]);

  /** Supabase Realtime — refetch when appointments or slot config change */
  useEffect(() => {
    if (!selectedDoctorId || !selectedDate) return;

    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const channel = supabase
      .channel(`patient-booking-slots-${selectedDoctorId}-${selectedDate}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments',
          filter: `doctor_id=eq.${selectedDoctorId}`,
        },
        () => {
          void loadSlotsRef.current();
        },
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'doctor_time_slots',
          filter: `doctor_id=eq.${selectedDoctorId}`,
        },
        () => {
          void loadSlotsRef.current();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [selectedDoctorId, selectedDate]);

  /** Refresh when local ecosystem appointments change (same-tab booking) */
  const ecosystemAppointments = useEcosystemStore((s) => s.appointments);
  useEffect(() => {
    if (!selectedDoctorId || !selectedDate) return;
    void loadSlotsRef.current();
  }, [ecosystemAppointments, selectedDoctorId, selectedDate]);

  const openSlots = availableTimeSlots.filter((s) => !s.isBooked);

  return {
    availableTimeSlots,
    openSlots,
    loadingSlots,
    slotSource,
    slotError,
    refreshSlots: loadSlots,
  };
}
