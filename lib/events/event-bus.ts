/**
 * Client-side event bus for optimistic UI + cross-module reactions.
 * All mutations should emit here; ecosystem-hub persists to Supabase + activity feed.
 */

import type { EcosystemEventPayload, EventBusListener, EcosystemEventType } from './types';

const listeners = new Set<EventBusListener>();

export function subscribeToEcosystemEvents(listener: EventBusListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function emitEcosystemEvent(event: EcosystemEventPayload): EcosystemEventPayload {
  const payload: EcosystemEventPayload = {
    ...event,
    timestamp: event.timestamp ?? new Date().toISOString(),
  };
  listeners.forEach((fn) => {
    try {
      fn(payload);
    } catch (err) {
      console.error('[event-bus] listener error', err);
    }
  });
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('nexora:ecosystem', { detail: payload }));
  }
  return payload;
}

/** Map hub event types to standardized bus events */
export function mapHubToBusEvent(
  hubType: string,
  meta: Omit<EcosystemEventPayload, 'type' | 'timestamp'>,
): EcosystemEventPayload {
  const map: Record<string, EcosystemEventType> = {
    'appointment.booked': 'AppointmentCreated',
    'appointment.confirmed': 'AppointmentConfirmed',
    'appointment.cancelled': 'AppointmentCancelled',
    'appointment.checked_in': 'PatientCheckedIn',
    'consultation.started': 'ConsultationStarted',
    'consultation.completed': 'ConsultationCompleted',
    'invoice.generated': 'InvoiceGenerated',
    'payment.received': 'PaymentCompleted',
    'inventory.low_stock': 'StockDepleted',
    'purchase_order.created': 'PurchaseOrderIssued',
    'admission.requested': 'AdmissionCreated',
    'vendor.delivery': 'PurchaseOrderIssued',
  };
  return emitEcosystemEvent({
    ...meta,
    type: map[hubType] ?? 'AppointmentCreated',
  });
}
