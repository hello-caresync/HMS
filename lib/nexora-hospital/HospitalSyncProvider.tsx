'use client';

import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

import { getSupabaseBrowserClient } from '@/lib/supabase/client';

import { fetchHospitalData } from './services/hospital-db';
import { useHospitalStore } from './store';
import type { EcosystemActivityItem } from '@/lib/ecosystem/ecosystem-hub';

type RealtimePayload = {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: Record<string, unknown> | null;
  old: Record<string, unknown> | null;
};

function rowFrom(payload: RealtimePayload): Record<string, unknown> | null {
  return (payload.new ?? payload.old) as Record<string, unknown> | null;
}

function appointmentToast(payload: RealtimePayload) {
  const row = rowFrom(payload);
  if (!row) return;

  const status = String(row.ecosystem_status ?? row.status ?? '');
  const patient = String(row.patient_name ?? 'Patient');

  if (payload.eventType === 'INSERT') {
    toast.info('New appointment', {
      description: `${patient} · synced from Patient App`,
    });
    return;
  }

  if (status.toLowerCase().includes('consultation')) {
    toast.info('Consultation in progress', {
      description: `${patient} · Doctor App update`,
    });
  } else if (status.toLowerCase().includes('completed')) {
    toast.info('Consultation completed', {
      description: `${patient} · billing queue updated`,
    });
  } else if (status.toLowerCase().includes('confirmed')) {
    toast.info('Appointment confirmed', { description: patient });
  }
}

function purchaseOrderToast(payload: RealtimePayload) {
  const row = rowFrom(payload);
  if (!row) return;
  const vendor = String(row.vendor_name ?? 'Vendor');
  const status = String(row.status ?? 'updated');

  toast.info('Purchase order update', {
    description: `${vendor} · ${status} · Vendor App`,
  });
}

function billingToast(payload: RealtimePayload) {
  const row = rowFrom(payload);
  if (!row) return;
  const patient = String(row.patient_name ?? 'Patient');
  const total = row.total_amount ?? row.amount;

  if (payload.eventType === 'INSERT') {
    toast.info('New invoice', {
      description: `${patient} · ₹${Number(total ?? 0).toLocaleString('en-IN')}`,
    });
  } else {
    toast.info('Billing updated', { description: patient });
  }
}

/**
 * 4-way realtime bridge: Hospital ↔ Patient ↔ Doctor ↔ Vendor
 * Mount once in the Hospital Operations Console shell.
 */
export function HospitalSyncProvider() {
  const setConnected = useHospitalStore((s) => s.setRealtimeConnected);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const refreshGenRef = useRef(0);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const scheduleRefresh = () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        const gen = ++refreshGenRef.current;
        void fetchHospitalData().then(() => {
          if (gen !== refreshGenRef.current) return;
          useHospitalStore.getState().recomputeMetrics();
        });
      }, 350);
    };

    const onSubscribed = (status: string) => {
      if (status === 'SUBSCRIBED') setConnected(true);
      if (status === 'CLOSED' || status === 'CHANNEL_ERROR') setConnected(false);
    };

    // 1. Appointments & OPD queue (Patient + Doctor updates)
    const appointmentsChannel = supabase
      .channel('hms-appointments')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'appointments' },
        (payload) => {
          appointmentToast(payload as RealtimePayload);
          scheduleRefresh();
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'opd_visits' },
        () => scheduleRefresh(),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ecosystem_appointments' },
        (payload) => {
          appointmentToast(payload as RealtimePayload);
          scheduleRefresh();
        },
      )
      .subscribe(onSubscribed);

    // 2. Inventory & vendor POs (Vendor app updates)
    const inventoryChannel = supabase
      .channel('hms-inventory')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'purchase_orders' },
        (payload) => {
          purchaseOrderToast(payload as RealtimePayload);
          scheduleRefresh();
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pharmacy_inventory' },
        (payload) => {
          const row = rowFrom(payload as RealtimePayload);
          if (row && payload.eventType !== 'DELETE') {
            const qty = Number(row.quantity_in_stock ?? 0);
            const reorder = Number(row.reorder_level ?? 10);
            if (qty <= reorder) {
              toast.warning('Low stock alert', {
                description: String(row.item_name ?? 'Inventory item'),
              });
            }
          }
          scheduleRefresh();
        },
      )
      .subscribe(onSubscribed);

    // 3. Billing & invoices (Doctor consultation completions + payments)
    const billingChannel = supabase
      .channel('hms-billing')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'billing_invoices' },
        (payload) => {
          billingToast(payload as RealtimePayload);
          scheduleRefresh();
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'invoices' },
        (payload) => {
          billingToast(payload as RealtimePayload);
          scheduleRefresh();
        },
      )
      .subscribe(onSubscribed);

    // Cross-app notification fan-in
    const notificationsChannel = supabase
      .channel('hms-notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload) => {
          const row = payload.new as {
            title?: string;
            body?: string;
            message?: string;
            recipient_role?: string;
            target_audience?: string;
          };
          if (
            row.recipient_role === 'hospital' ||
            row.target_audience === 'both' ||
            !row.recipient_role
          ) {
            toast.info(row.title ?? 'Hospital alert', {
              description: row.message ?? row.body,
            });
            scheduleRefresh();
          }
        },
      )
      .subscribe(onSubscribed);

    // Live activity feed for dashboard timeline
    const activityChannel = supabase
      .channel('hms-activity')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'ecosystem_activity' },
        (payload) => {
          const row = payload.new as {
            id: string;
            event_type: string;
            actor_role: string;
            message: string;
            created_at: string;
            related_id?: string;
          };
          const item: EcosystemActivityItem = {
            id: String(row.id),
            eventType: row.event_type as EcosystemActivityItem['eventType'],
            actorRole: row.actor_role as EcosystemActivityItem['actorRole'],
            message: row.message,
            createdAt: row.created_at,
            relatedId: row.related_id,
          };
          useHospitalStore.getState().prependActivity(item);
          scheduleRefresh();
        },
      )
      .subscribe(onSubscribed);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      setConnected(false);
      void supabase.removeChannel(appointmentsChannel);
      void supabase.removeChannel(inventoryChannel);
      void supabase.removeChannel(billingChannel);
      void supabase.removeChannel(notificationsChannel);
      void supabase.removeChannel(activityChannel);
    };
  }, [setConnected]);

  return null;
}

/** @deprecated Use HospitalSyncProvider */
export const HospitalRealtimeSync = HospitalSyncProvider;
