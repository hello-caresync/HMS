function isUuidValue(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

export function normalizeSlotKey(value: unknown): string {
  const raw = String(value ?? '').trim().toUpperCase();
  const match = raw.match(/(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?/);
  if (!match) return raw.replace(/\s+/g, '');

  let hours = Number(match[1]);
  const minutes = match[2];
  const meridiem = match[3];
  if (meridiem === 'PM' && hours < 12) hours += 12;
  if (meridiem === 'AM' && hours === 12) hours = 0;
  return `${String(hours).padStart(2, '0')}:${minutes}`;
}

function asRecord(item: unknown): Record<string, unknown> {
  return item && typeof item === 'object' ? (item as Record<string, unknown>) : {};
}

export function encounterAppointmentKey(item: unknown): string {
  const row = asRecord(item);
  const appointmentId = String(row.appointmentId ?? row.appointment_id ?? '').trim();
  if (appointmentId) return appointmentId;
  const id = String(row.id ?? '').trim();
  return isUuidValue(id) ? id : '';
}

/** Collapse 11:30 AM / 11:30:00 and duplicate appointment ids into one queue card. */
export function encounterIdentityKey(item: unknown): string {
  const row = asRecord(item);
  const token = String(row.token_number ?? row.token ?? row.uhid ?? '').trim().toUpperCase();
  if (/^NX-(WLK|OPD)-/.test(token)) {
    const date = String(row.appointment_date ?? row.created_at ?? '').slice(0, 10);
    return date ? `walkin:${token}:${date}` : `walkin:${token}`;
  }

  const appointmentId = String(row.appointment_id ?? row.appointmentId ?? '').trim();
  if (appointmentId) return `apt:${appointmentId}`;
  const id = String(row.id ?? '').trim();
  if (id) return `id:${id}`;
  const patient = String(row.patient_id ?? row.patientId ?? '').trim();
  if (patient && token) return `tok:${patient}-${token}`;
  return encounterSlotKey(item);
}

export function encounterSlotKey(item: unknown): string {
  const row = asRecord(item);
  const patient = String(row.patientId ?? row.patient_id ?? row.patient_name ?? row.name ?? '')
    .trim()
    .toLowerCase();
  const date = String(row.appointment_date ?? row.created_at ?? '').slice(0, 10);
  const time = normalizeSlotKey(
    row.time ?? row.appointment_time ?? row.time_slot ?? row.slot_time ?? row.scheduled_time,
  );
  const token = String(row.token_number ?? row.token ?? '').replace(/\D/g, '');
  return `enc:${patient}:${date}:${time || token}`;
}

function richness(item: unknown): number {
  const row = asRecord(item);
  return [
    row.appointment_id ?? row.appointmentId,
    row.patient_id ?? row.patientId,
    row.token_number,
    row.chief_complaint,
    row.reason_for_visit,
    row.checked_in_at,
    row.queue_type,
  ].filter((value) => value != null && String(value).trim() !== '').length;
}

function preferRicher<T>(current: T, incoming: T): T {
  return richness(incoming) > richness(current) ? incoming : current;
}

/** Collapse the same encounter coming from appointments, tokens, and queue tables. */
export function dedupeEncounterList<T>(rows: T[]): T[] {
  const byIdentity = new Map<string, T>();
  for (const item of rows) {
    const key = encounterIdentityKey(item);
    const existing = byIdentity.get(key);
    byIdentity.set(key, existing ? preferRicher(existing, item) : item);
  }

  const bySlot = new Map<string, T>();
  for (const item of byIdentity.values()) {
    const slot = encounterSlotKey(item);
    const canMergeSlot = slot.startsWith('enc:') && slot !== 'enc:::';
    const existing = canMergeSlot ? bySlot.get(slot) : undefined;
    if (existing) {
      bySlot.set(slot, preferRicher(existing, item));
      continue;
    }
    bySlot.set(canMergeSlot ? slot : `${slot}:${encounterIdentityKey(item)}`, item);
  }

  return Array.from(bySlot.values());
}
