import { getSupabaseBrowserClient } from '@/lib/supabase/client';

import { getSelectedHospital, type SelectedHospital } from '../hospital-context';

export type EmergencyAlertStatus = 'Pending' | 'Dispatched' | 'Resolved';

export type EmergencyAlert = {
  id: string;
  patient_id: string;
  patient_name: string;
  patient_phone: string | null;
  hospital_id: string;
  hospital_name: string;
  place_description: string | null;
  emergency_notes: string | null;
  latitude: number | null;
  longitude: number | null;
  location_accuracy: number | null;
  blood_group: string | null;
  status: EmergencyAlertStatus;
  created_at: string;
  updated_at: string;
  dispatched_at: string | null;
  resolved_at: string | null;
};

export type GpsCoords = {
  lat: number;
  lng: number;
  accuracy: number;
};

export type DispatchRakshakSosInput = {
  patientId: string;
  patientName: string;
  patientPhone?: string | null;
  bloodGroup?: string | null;
  placeDescription: string;
  emergencyNotes?: string;
  coords: GpsCoords;
  hospital?: SelectedHospital;
};

const BENGALURU_FALLBACK: GpsCoords = { lat: 12.9716, lng: 77.5946, accuracy: 15 };

export async function acquireGpsCoords(): Promise<{ coords: GpsCoords; geoWarning: string | null }> {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    return { coords: BENGALURU_FALLBACK, geoWarning: 'Geolocation unavailable — using estimated location.' };
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          coords: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
          },
          geoWarning: null,
        });
      },
      () => {
        resolve({
          coords: BENGALURU_FALLBACK,
          geoWarning: 'GPS permission denied — using estimated network location.',
        });
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  });
}

export async function dispatchRakshakSos(
  input: DispatchRakshakSosInput,
): Promise<{ ok: true; alert: EmergencyAlert } | { ok: false; error: string }> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    return { ok: false, error: 'Supabase is not configured.' };
  }

  const hospital = input.hospital ?? getSelectedHospital();

  const payload = {
    patient_id: input.patientId,
    patient_name: input.patientName,
    patient_phone: input.patientPhone ?? null,
    hospital_id: hospital.id,
    hospital_name: hospital.name,
    place_description: input.placeDescription.trim() || null,
    emergency_notes: input.emergencyNotes?.trim() || null,
    latitude: input.coords.lat,
    longitude: input.coords.lng,
    location_accuracy: input.coords.accuracy,
    blood_group: input.bloodGroup ?? null,
    status: 'Pending' as EmergencyAlertStatus,
  };

  const { data, error } = await supabase.from('emergency_alerts').insert(payload).select().single();

  if (error) {
    return { ok: false, error: error.message };
  }

  try {
    await supabase.from('patient_notifications').insert({
      patient_id: input.patientId,
      title: '🚨 Rakshak SOS Emergency Triggered',
      message: `Emergency alert sent to ${hospital.name}. Location: ${input.placeDescription || `${input.coords.lat.toFixed(4)}, ${input.coords.lng.toFixed(4)}`}`,
      type: 'emergency',
      source_app: 'patient_app',
    });
  } catch {
    /* notification is best-effort */
  }

  return { ok: true, alert: data as EmergencyAlert };
}

export async function fetchActiveEmergencyAlert(
  patientId: string,
): Promise<EmergencyAlert | null> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;

  const { data } = await supabase
    .from('emergency_alerts')
    .select('*')
    .eq('patient_id', patientId)
    .in('status', ['Pending', 'Dispatched'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return (data as EmergencyAlert | null) ?? null;
}

export function subscribeEmergencyAlert(
  alertId: string,
  onUpdate: (alert: EmergencyAlert) => void,
): () => void {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return () => undefined;

  const channel = supabase
    .channel(`rakshak-emergency-${alertId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'emergency_alerts',
        filter: `id=eq.${alertId}`,
      },
      (payload) => {
        if (payload.new) onUpdate(payload.new as EmergencyAlert);
      },
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}
