'use client';

import { useEffect } from 'react';
import { AlertTriangle, Loader2, MapPin, Phone, Siren } from 'lucide-react';
import { toast } from 'sonner';
import { getDoctorSession } from '@/lib/doctor/session';
import {
  useAcknowledgeEmergency,
  useDoctorContext,
  useEmergencyAlertsRealtime,
  useEscalateEmergency,
} from '@/lib/doctor/command-center/hooks';
import { ccClasses } from '@/lib/doctor/command-center/theme';

export function EmergencyCenter() {
  const session = getDoctorSession();
  const { data: ctx } = useDoctorContext(session.employeeId);
  const doctorUuid = ctx?.doctorUuid ?? '';

  const { data: alerts = [], isLoading } = useEmergencyAlertsRealtime(doctorUuid);
  const ack = useAcknowledgeEmergency();
  const escalate = useEscalateEmergency();

  const critical = alerts.filter((a) => a.severity === 'CRITICAL' && a.status === 'ACTIVE');
  const active = alerts.filter((a) => a.status === 'ACTIVE');

  useEffect(() => {
    if (critical.length > 0 && typeof window !== 'undefined') {
      try {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 880;
        gain.gain.value = 0.05;
        osc.start();
        setTimeout(() => osc.stop(), 400);
      } catch {
        /* audio blocked */
      }
    }
  }, [critical.length]);

  return (
    <div className="space-y-6">
      {critical.length > 0 && (
        <div className="animate-pulse rounded-2xl border-2 border-[#D9534F] bg-[#D9534F]/15 px-6 py-4">
          <div className="flex items-center gap-3">
            <Siren className="h-6 w-6 text-[#D9534F]" />
            <p className="text-lg font-black text-[#D9534F]">
              CRITICAL SOS — {critical.length} alert(s) require immediate response
            </p>
          </div>
        </div>
      )}

      <header className={`p-6 ${ccClasses.card}`}>
        <h1 className="flex items-center gap-2 text-2xl font-black text-[#173F5F]">
          <AlertTriangle className="h-6 w-6 text-[#D9534F]" /> Emergency SOS Command Center
        </h1>
        <p className="mt-1 text-sm font-semibold text-[#5A7A94]">
          Real-time alerts from emergency_alerts — acknowledge or escalate to ER.
        </p>
      </header>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center gap-2 text-sm font-semibold text-[#5A7A94]">
          <Loader2 className="h-5 w-5 animate-spin" /> Monitoring emergency channel…
        </div>
      ) : alerts.length === 0 ? (
        <div className={`p-12 text-center ${ccClasses.card}`}>
          <Siren className="mx-auto h-10 w-10 text-[#2E8B70]" />
          <p className="mt-3 font-black text-[#173F5F]">All clear — no emergency alerts</p>
        </div>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => (
            <article
              key={alert.id}
              className={`p-5 ${
                alert.severity === 'CRITICAL' && alert.status === 'ACTIVE'
                  ? 'border-2 border-[#D9534F]/40 bg-[#D9534F]/5'
                  : ccClasses.card
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
                      alert.severity === 'CRITICAL'
                        ? 'bg-[#D9534F] text-white'
                        : 'bg-[#E8F1F8] text-[#173F5F]'
                    }`}
                  >
                    {alert.severity} · {alert.status}
                  </span>
                  <h2 className="mt-2 text-xl font-black text-[#173F5F]">
                    {alert.patient_name || `Patient ${alert.patient_id?.slice(0, 8)}`}
                  </h2>
                  <p className="mt-1 text-sm font-semibold text-[#5A7A94]">{alert.message || 'SOS triggered'}</p>
                  {alert.location && (
                    <p className="mt-2 flex items-center gap-1 text-xs font-bold text-[#20639B]">
                      <MapPin className="h-3.5 w-3.5" /> {alert.location}
                    </p>
                  )}
                  {alert.emergency_contact && (
                    <p className="mt-1 flex items-center gap-1 text-xs font-bold text-[#173F5F]">
                      <Phone className="h-3.5 w-3.5" /> {alert.emergency_contact}
                    </p>
                  )}
                  {alert.vitals_summary && (
                    <p className="mt-2 text-xs font-semibold text-[#5A7A94]">Vitals: {alert.vitals_summary}</p>
                  )}
                </div>
                {alert.status === 'ACTIVE' && (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        void ack.mutateAsync(alert.id);
                        toast.success('Alert acknowledged');
                      }}
                      className={ccClasses.btnPrimary}
                    >
                      Acknowledge
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        void escalate.mutateAsync(alert.id);
                        toast.warning('Escalated to ER team');
                      }}
                      className="rounded-xl bg-[#D9534F] px-4 py-2 text-xs font-black text-white"
                    >
                      Escalate to ER
                    </button>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export default EmergencyCenter;
