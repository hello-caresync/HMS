'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { Building, Loader2, RefreshCw, Send, Stethoscope, Truck, Users, Wifi } from 'lucide-react';

import type { RegalDoctor } from '@/components/nexora-hospital/HospitalOperationsCenter';
import { createClient } from '@/lib/supabase/client';
import {
  ECOSYSTEM_HOSPITAL_ADMIN_ID,
  ECOSYSTEM_VENDOR_TARGET_ID,
  formatChannelTime,
  HOSPITAL_SENDER_NAME,
  isHospitalSender,
  loadEcosystemChannelMessages,
  sendHospitalEcosystemMessage,
  subscribeEcosystemChannel,
  type EcosystemChannelMessage,
  type EcosystemChannelTab,
} from '@/lib/ecosystem/ecosystem-channels';
import { matchesHospitalDoctorThread } from '@/lib/ecosystem/hospital-doctor-messaging';

type PatientOption = { uhid: string; name: string };

type EcosystemMessagesViewProps = {
  doctors: RegalDoctor[];
  patients: PatientOption[];
};

type ThreadItem = {
  id: string;
  label: string;
  sublabel?: string;
  preview: string;
  latestAt: string;
  badge?: string;
};

const DEFAULT_DOCTOR_ID = 'RH-D02';
const VENDOR_THREAD_ID = 'vendor-apex';

function senderBadge(msg: EcosystemChannelMessage): string {
  if (isHospitalSender(String(msg.sender_role))) return HOSPITAL_SENDER_NAME;
  if (msg.sender_role === 'vendor') return msg.sender_name || 'Apex Pharma';
  if (msg.sender_role === 'doctor') return msg.sender_name || `Dr. ${msg.sender_id ?? ''}`;
  if (msg.sender_role === 'patient') {
    const uhid = msg.sender_id ?? msg.recipient_id ?? 'Patient';
    return msg.sender_name ? `${msg.sender_name} · ${uhid}` : `Patient ${uhid}`;
  }
  return msg.sender_name || 'Unknown';
}

function matchesPatientThread(row: EcosystemChannelMessage, uhid: string): boolean {
  const id = uhid.toLowerCase();
  return (
    row.recipient_id?.toLowerCase() === id ||
    row.sender_id?.toLowerCase() === id ||
    (row.sender_role === 'patient' && row.recipient_id?.toLowerCase() === ECOSYSTEM_HOSPITAL_ADMIN_ID.toLowerCase())
  );
}

function filterMessagesForContext(
  rows: EcosystemChannelMessage[],
  channel: EcosystemChannelTab,
  doctorId: string,
  patientUhid: string,
): EcosystemChannelMessage[] {
  if (channel === 'doctor') {
    return rows.filter((row) => matchesHospitalDoctorThread(row, doctorId));
  }
  if (channel === 'patient' && patientUhid) {
    return rows.filter((row) => matchesPatientThread(row, patientUhid));
  }
  return rows;
}

function normalizeUnreadChannel(type: string): EcosystemChannelTab | null {
  const value = type.toLowerCase();
  if (value.includes('vendor') || value === 'vendor_procurement') return 'vendor';
  if (value === 'doctor' || value === 'hospital_desk') return 'doctor';
  if (value.includes('patient') || value === 'patient_inquiries') return 'patient';
  return null;
}

export function EcosystemMessagesView({ doctors, patients }: EcosystemMessagesViewProps) {
  const supabase = useMemo(() => createClient(), []);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [activeChannel, setActiveChannel] = useState<EcosystemChannelTab>('vendor');
  const [selectedDoctorId, setSelectedDoctorId] = useState(DEFAULT_DOCTOR_ID);
  const [selectedPatientUhid, setSelectedPatientUhid] = useState('');
  const [allMessages, setAllMessages] = useState<EcosystemChannelMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [connected, setConnected] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [unread, setUnread] = useState<Record<EcosystemChannelTab, number>>({
    vendor: 0,
    doctor: 0,
    patient: 0,
  });

  const patientOptions = useMemo(() => {
    const seen = new Set<string>();
    return patients.filter((patient) => {
      if (!patient.uhid || seen.has(patient.uhid)) return false;
      seen.add(patient.uhid);
      return true;
    });
  }, [patients]);

  useEffect(() => {
    if (!selectedPatientUhid && patientOptions.length > 0) {
      setSelectedPatientUhid(patientOptions[0].uhid);
    }
  }, [patientOptions, selectedPatientUhid]);

  const channelMessages = useMemo(
    () => allMessages.filter((row) => row.channel_type === activeChannel),
    [allMessages, activeChannel],
  );

  const visibleMessages = useMemo(
    () => filterMessagesForContext(channelMessages, activeChannel, selectedDoctorId, selectedPatientUhid),
    [channelMessages, activeChannel, selectedDoctorId, selectedPatientUhid],
  );

  const refreshUnread = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('channel_messages')
        .select('channel_type, sender_role, is_read')
        .eq('is_read', false);

      const counts: Record<EcosystemChannelTab, number> = { vendor: 0, doctor: 0, patient: 0 };
      for (const row of data ?? []) {
        const role = String(row.sender_role ?? '').toLowerCase();
        if (isHospitalSender(role)) continue;
        const tab = normalizeUnreadChannel(String(row.channel_type ?? ''));
        if (tab) counts[tab]++;
      }
      setUnread(counts);
    } catch {
      /* best-effort */
    }
  }, [supabase]);

  const loadAllChannelMessages = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    const [vendorRes, doctorRes, patientRes] = await Promise.all([
      loadEcosystemChannelMessages(supabase, 'vendor'),
      loadEcosystemChannelMessages(supabase, 'doctor'),
      loadEcosystemChannelMessages(supabase, 'patient'),
    ]);

    const merged = [...vendorRes.rows, ...doctorRes.rows, ...patientRes.rows].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );

    const error = vendorRes.error ?? doctorRes.error ?? patientRes.error;
    setAllMessages(merged);
    setLoadError(error ?? null);
    setIsLoading(false);
    void refreshUnread();
  }, [supabase, refreshUnread]);

  useEffect(() => {
    void loadAllChannelMessages();
  }, [loadAllChannelMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [visibleMessages, activeChannel]);

  useEffect(() => {
    const unsubs = (['vendor', 'doctor', 'patient'] as EcosystemChannelTab[]).map((channel) =>
      subscribeEcosystemChannel(channel, (row) => {
        setConnected(true);
        setAllMessages((prev) => {
          if (prev.some((item) => item.id === row.id)) return prev;
          return [...prev, row];
        });

        const tab = normalizeUnreadChannel(String(row.channel_type));
        if (tab && !isHospitalSender(String(row.sender_role)) && tab !== activeChannel) {
          setUnread((current) => ({ ...current, [tab]: current[tab] + 1 }));
        }
      }),
    );

    setConnected(true);
    return () => unsubs.forEach((fn) => fn());
  }, [activeChannel]);

  const doctorThreads = useMemo((): ThreadItem[] => {
    const doctorMessages = allMessages.filter((m) => normalizeUnreadChannel(String(m.channel_type)) === 'doctor');
    return doctors.map((doctor) => {
      const thread = doctorMessages.filter((m) => matchesHospitalDoctorThread(m, doctor.id));
      const sorted = [...thread].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      );
      const latest = sorted[sorted.length - 1];
      return {
        id: doctor.id,
        label: doctor.name,
        sublabel: `${doctor.id} · ${doctor.department}`,
        preview: latest?.message ?? 'No messages yet',
        latestAt: latest?.created_at ?? '',
      };
    });
  }, [allMessages, doctors]);

  const patientThreads = useMemo((): ThreadItem[] => {
    const patientMessages = allMessages.filter((m) => normalizeUnreadChannel(String(m.channel_type)) === 'patient');
    return patientOptions.map((patient) => {
      const thread = patientMessages.filter((m) => matchesPatientThread(m, patient.uhid));
      const sorted = [...thread].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      );
      const latest = sorted[sorted.length - 1];
      return {
        id: patient.uhid,
        label: patient.name,
        sublabel: patient.uhid,
        preview: latest?.message ?? 'No inquiries yet',
        latestAt: latest?.created_at ?? '',
        badge: patient.uhid,
      };
    });
  }, [allMessages, patientOptions]);

  const vendorThread: ThreadItem = useMemo(() => {
    const sorted = [...channelMessages].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );
    const latest = sorted[sorted.length - 1];
    return {
      id: VENDOR_THREAD_ID,
      label: 'Apex Pharma / MedSupply',
      sublabel: ECOSYSTEM_VENDOR_TARGET_ID,
      preview: latest?.message ?? 'Procurement channel ready',
      latestAt: latest?.created_at ?? '',
    };
  }, [channelMessages]);

  const sidebarThreads =
    activeChannel === 'vendor'
      ? [vendorThread]
      : activeChannel === 'doctor'
        ? doctorThreads
        : patientThreads;

  const activeThreadId =
    activeChannel === 'vendor'
      ? VENDOR_THREAD_ID
      : activeChannel === 'doctor'
        ? selectedDoctorId
        : selectedPatientUhid;

  const handleChannelSwitch = (channel: EcosystemChannelTab) => {
    setActiveChannel(channel);
    setUnread((current) => ({ ...current, [channel]: 0 }));
  };

  const handleSendMessage = async (event?: FormEvent) => {
    event?.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed || isSending) return;

    if (activeChannel === 'patient' && !selectedPatientUhid) {
      setLoadError('Select a patient UHID before sending.');
      return;
    }

    const recipientId =
      activeChannel === 'doctor'
        ? selectedDoctorId
        : activeChannel === 'patient'
          ? selectedPatientUhid
          : ECOSYSTEM_VENDOR_TARGET_ID;

    const optimistic: EcosystemChannelMessage = {
      id: `optimistic-${Date.now()}`,
      channel_type: activeChannel,
      sender_role: 'hospital',
      sender_id: ECOSYSTEM_HOSPITAL_ADMIN_ID,
      sender_name: HOSPITAL_SENDER_NAME,
      recipient_type: activeChannel,
      recipient_id: recipientId,
      message: trimmed,
      created_at: new Date().toISOString(),
      is_read: true,
    };

    setAllMessages((prev) => [...prev, optimistic]);
    setInputText('');
    setIsSending(true);
    setLoadError(null);

    const result = await sendHospitalEcosystemMessage(supabase, {
      channel: activeChannel,
      message: trimmed,
      recipientId,
      recipientType: activeChannel,
    });

    if (!result.ok) {
      setAllMessages((prev) => prev.filter((item) => item.id !== optimistic.id));
      setInputText(trimmed);
      setLoadError(result.error ?? 'Send failed.');
    } else if (result.row) {
      setAllMessages((prev) =>
        prev.map((item) => (item.id === optimistic.id ? result.row! : item)),
      );
    }

    setIsSending(false);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void handleSendMessage();
    }
  };

  const targetLabel = useMemo(() => {
    if (activeChannel === 'vendor') return 'Vendor (Apex Pharma / MedSupply)';
    if (activeChannel === 'doctor') {
      const doctor = doctors.find((item) => item.id === selectedDoctorId);
      return `Doctor: ${doctor?.name ?? 'Clinical Desk'}`;
    }
    const patient = patientOptions.find((item) => item.uhid === selectedPatientUhid);
    return patient ? `Patient: ${patient.name} (${patient.uhid})` : 'Patient App';
  }, [activeChannel, doctors, patientOptions, selectedDoctorId, selectedPatientUhid]);

  const channelTabs: { id: EcosystemChannelTab; label: string; icon: typeof Truck; accent: string }[] = [
    { id: 'vendor', label: 'Vendor Supply Portal', icon: Truck, accent: 'text-amber-400' },
    { id: 'doctor', label: 'Clinical & Doctor Desk', icon: Stethoscope, accent: 'text-emerald-400' },
    { id: 'patient', label: 'Patient Inquiries', icon: Users, accent: 'text-teal-400' },
  ];

  return (
    <div className="mb-6 flex h-[calc(100vh-140px)] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Channel tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50/75 px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          {channelTabs.map((tab) => {
            const Icon = tab.icon;
            const count = unread[tab.id];
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleChannelSwitch(tab.id)}
                className={`relative flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all ${
                  activeChannel === tab.id
                    ? 'bg-[#0F3E5D] text-white shadow-sm'
                    : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Icon className={`h-4 w-4 ${activeChannel === tab.id ? 'text-white' : tab.accent}`} />
                {tab.label}
                {count > 0 ? (
                  <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                    {count > 99 ? '99+' : count}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full border border-teal-200 bg-teal-50 px-2 py-0.5 text-[10px] font-bold text-teal-700">
            <Wifi className="h-3 w-3" />
            {connected ? 'Live' : 'Syncing'}
          </span>
          <button
            type="button"
            onClick={() => void loadAllChannelMessages()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-bold text-slate-600 hover:bg-slate-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* 2-pane: thread sidebar + chat */}
      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[280px_1fr]">
        <aside className="flex flex-col border-b border-slate-200 lg:border-b-0 lg:border-r">
          <div className="border-b border-slate-100 px-3 py-2.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              {activeChannel === 'vendor' ? 'Vendor Thread' : activeChannel === 'doctor' ? 'Doctor Threads' : 'Patient UHIDs'}
            </p>
            <p className="text-[10px] text-slate-400">{sidebarThreads.length} active</p>
          </div>
          <div className="custom-scrollbar max-h-[220px] flex-1 overflow-y-auto lg:max-h-none">
            {sidebarThreads.map((thread) => {
              const isActive = thread.id === activeThreadId;
              return (
                <button
                  key={thread.id}
                  type="button"
                  onClick={() => {
                    if (activeChannel === 'doctor') setSelectedDoctorId(thread.id);
                    if (activeChannel === 'patient') setSelectedPatientUhid(thread.id);
                  }}
                  className={`w-full border-b border-slate-100 px-3 py-2.5 text-left transition hover:bg-slate-50 ${
                    isActive ? 'bg-[#0F3E5D]/5' : ''
                  }`}
                >
                  <p className="truncate text-xs font-bold text-slate-900">{thread.label}</p>
                  {thread.sublabel ? (
                    <p className="truncate text-[10px] text-slate-500">{thread.sublabel}</p>
                  ) : null}
                  <p className="mt-0.5 truncate text-[10px] text-slate-400">{thread.preview}</p>
                </button>
              );
            })}
          </div>

          {activeChannel === 'doctor' ? (
            <div className="border-t border-slate-100 p-3">
              <label className="mb-1 block text-[10px] font-semibold text-slate-500">Direct to doctor</label>
              <select
                value={selectedDoctorId}
                onChange={(event) => setSelectedDoctorId(event.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#00A896]"
              >
                {doctors.map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>
                    {doctor.name} ({doctor.department})
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          {activeChannel === 'patient' && patientOptions.length > 0 ? (
            <div className="border-t border-slate-100 p-3">
              <label className="mb-1 block text-[10px] font-semibold text-slate-500">Patient UHID</label>
              <select
                value={selectedPatientUhid}
                onChange={(event) => setSelectedPatientUhid(event.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#00A896]"
              >
                {patientOptions.map((patient) => (
                  <option key={patient.uhid} value={patient.uhid}>
                    {patient.uhid} · {patient.name}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
        </aside>

        <div className="flex min-h-0 flex-col">
          {loadError ? (
            <p className="border-b border-red-100 bg-red-50 px-4 py-2 text-xs font-medium text-red-700">{loadError}</p>
          ) : null}

          <div className="flex-1 space-y-4 overflow-y-auto bg-[#F8FAFC] p-5">
            {isLoading ? (
              <div className="flex h-full items-center justify-center gap-2 text-xs text-slate-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading {activeChannel} channel…
              </div>
            ) : visibleMessages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-xs text-slate-400">
                <Building className="mb-2 h-8 w-8 opacity-30" />
                <span>No messages in the {activeChannel} channel yet.</span>
                <span className="mt-1">Start the conversation below.</span>
              </div>
            ) : (
              visibleMessages.map((msg) => {
                const fromHospital = isHospitalSender(String(msg.sender_role));
                return (
                  <div key={msg.id} className={`flex flex-col ${fromHospital ? 'items-end' : 'items-start'}`}>
                    <div className="mb-1 flex items-center gap-1.5 px-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        {fromHospital ? HOSPITAL_SENDER_NAME : senderBadge(msg)}
                      </span>
                      <span className="text-[10px] text-slate-400">• {formatChannelTime(msg.created_at)}</span>
                    </div>
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed shadow-sm ${
                        fromHospital
                          ? 'rounded-br-none bg-[#00A896] text-white'
                          : 'rounded-bl-none border border-slate-200 bg-slate-100 text-slate-900'
                      }`}
                    >
                      {msg.message}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          <form
            onSubmit={(event) => void handleSendMessage(event)}
            className="sticky bottom-0 flex flex-col gap-2 border-t border-slate-200 bg-white p-4"
          >
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Messaging {targetLabel}
            </p>
            <div className="flex items-end gap-3">
              <textarea
                rows={2}
                value={inputText}
                onChange={(event) => setInputText(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Type message to ${targetLabel}… (Enter to send)`}
                className="flex-1 resize-none rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00A896]"
              />
              <button
                type="submit"
                disabled={isSending || !inputText.trim()}
                className="flex items-center gap-2 rounded-xl bg-[#00A896] px-5 py-3 text-xs font-bold text-white transition-all hover:bg-[#009181] disabled:opacity-50"
              >
                {isSending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                Send
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default EcosystemMessagesView;
