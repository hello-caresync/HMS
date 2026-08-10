'use client';

import { useEffect, useState } from 'react';
import { Loader2, MapPin, X } from 'lucide-react';
import { toast } from 'sonner';

import {
  acquireGpsCoords,
  dispatchRakshakSos,
  type EmergencyAlert,
  type GpsCoords,
} from '@/lib/patient/emergency/rakshak-sos.service';
import { ensureRegalHospitalSelected, type SelectedHospital } from '@/lib/patient/hospital-context';

type EmergencyDispatchModalProps = {
  open: boolean;
  onClose: () => void;
  patientId: string;
  patientName: string;
  patientPhone?: string | null;
  bloodGroup?: string | null;
  onDispatched: (alert: EmergencyAlert) => void;
};

export function EmergencyDispatchModal({
  open,
  onClose,
  patientId,
  patientName,
  patientPhone,
  bloodGroup,
  onDispatched,
}: EmergencyDispatchModalProps) {
  const [emergencyLocation, setEmergencyLocation] = useState('');
  const [emergencyDescription, setEmergencyDescription] = useState('');
  const [coords, setCoords] = useState<GpsCoords | null>(null);
  const [geoWarning, setGeoWarning] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [hospital, setHospital] = useState<SelectedHospital | null>(null);

  useEffect(() => {
    if (!open) return;

    setHospital(ensureRegalHospitalSelected());
    setEmergencyLocation('');
    setEmergencyDescription('');
    setCoords(null);
    setGeoWarning(null);
    void refreshGps();
  }, [open]);

  const refreshGps = async () => {
    setLocating(true);
    const { coords: nextCoords, geoWarning: warning } = await acquireGpsCoords();
    setCoords(nextCoords);
    setGeoWarning(warning);
    setLocating(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!emergencyLocation.trim()) {
      toast.error('Emergency location is required');
      return;
    }

    let dispatchCoords = coords;
    if (!dispatchCoords) {
      const { coords: fallbackCoords } = await acquireGpsCoords();
      dispatchCoords = fallbackCoords;
    }

    setSubmitting(true);
    const result = await dispatchRakshakSos({
      patientId,
      patientName,
      patientPhone,
      bloodGroup,
      placeDescription: emergencyLocation.trim(),
      emergencyNotes: emergencyDescription,
      coords: dispatchCoords,
      hospital: hospital ?? undefined,
    });
    setSubmitting(false);

    if (!result.ok) {
      toast.error('Emergency dispatch failed', { description: result.error });
      return;
    }

    toast.success('Emergency dispatch sent', {
      description: `${hospital?.name ?? 'Regal Hospital'} has been notified.`,
    });
    onDispatched(result.alert);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-900/50 p-4 sm:items-center">
      <div className="absolute inset-0" aria-hidden onClick={() => !submitting && onClose()} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="emergency-dispatch-title"
        className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 id="emergency-dispatch-title" className="text-lg font-black text-patient-plum">
            Emergency Dispatch
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4 p-6">
          <p className="text-xs font-semibold text-patient-lavender">
            Alert will be sent to <span className="font-black text-patient-plum">{hospital?.name ?? 'Regal Hospital'}</span>
          </p>

          <div>
            <label htmlFor="emergency-location" className="mb-1.5 block text-xs font-black uppercase tracking-wider text-patient-plum">
              Emergency Location / Place *
            </label>
            <input
              id="emergency-location"
              required
              value={emergencyLocation}
              onChange={(e) => setEmergencyLocation(e.target.value)}
              placeholder="e.g. Regal Hospital main gate, Chokkanahalli"
              className="w-full rounded-xl border border-patient-lavender/30 bg-white px-4 py-2.5 text-sm font-medium text-patient-charcoal focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
            />
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-[10px] font-black uppercase text-slate-600">
                <MapPin className="h-3.5 w-3.5" /> GPS fallback
              </span>
              <button
                type="button"
                onClick={() => void refreshGps()}
                disabled={locating}
                className="text-[10px] font-bold text-patient-primary hover:underline disabled:opacity-50"
              >
                Refresh
              </button>
            </div>
            {locating ? (
              <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-slate-500">
                <Loader2 className="h-3 w-3 animate-spin" /> Acquiring coordinates…
              </p>
            ) : coords ? (
              <p className="mt-1.5 font-mono text-[11px] text-slate-600">
                {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
                {geoWarning ? ` · ${geoWarning}` : ''}
              </p>
            ) : null}
          </div>

          <div>
            <label htmlFor="emergency-description" className="mb-1.5 block text-xs font-black uppercase tracking-wider text-patient-plum">
              Emergency Description
            </label>
            <textarea
              id="emergency-description"
              value={emergencyDescription}
              onChange={(e) => setEmergencyDescription(e.target.value)}
              rows={3}
              placeholder="Optional — symptoms, injuries, or urgency details"
              className="w-full resize-none rounded-xl border border-patient-lavender/30 bg-white px-4 py-2.5 text-sm font-medium text-patient-charcoal focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-black uppercase tracking-wider text-white hover:bg-rose-700 disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Dispatching…
                </>
              ) : (
                'Dispatch Emergency'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/** @deprecated Use EmergencyDispatchModal */
export const RakshakSosModal = EmergencyDispatchModal;
