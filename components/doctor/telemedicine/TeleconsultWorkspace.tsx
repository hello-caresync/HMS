'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Mic, MicOff, MonitorUp, PhoneOff, Video, VideoOff } from 'lucide-react';
import { toast } from 'sonner';

import { ClinicalPageSkeleton } from '@/components/doctor/ClinicalSkeleton';
import { ClinicalPageHeader, PrescriptionTable } from '@/components/doctor/doctor-ui';
import {
  useGenerateDocument,
  useSaveConsultation,
  useSendPrescription,
  useTelemedicineSession,
} from '@/lib/doctor/hooks/useClinicalQueries';
import { clinicalClasses } from '@/lib/doctor/theme';

type SideTab = 'chat' | 'emr' | 'rx';

export default function TeleconsultWorkspace() {
  const { data, isLoading } = useTelemedicineSession();
  const saveConsultation = useSaveConsultation();
  const sendRx = useSendPrescription();
  const generateDoc = useGenerateDocument();

  const session = data?.session;
  const [active, setActive] = useState(false);
  const [tab, setTab] = useState<SideTab>('chat');
  const [muted, setMuted] = useState(false);
  const [camOff, setCamOff] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<{ from: string; text: string }[]>([]);
  const [rxRows, setRxRows] = useState([
    { drugName: 'Paracetamol 650mg', dosage: '1 tab', frequency: 'SOS', duration: '3d' },
  ]);

  const patient = session?.patient;

  useEffect(() => {
    if (session?.transcript?.length) {
      setMessages(session.transcript.map((t) => ({ from: t.from, text: t.text })));
    }
  }, [session?.transcript]);

  const sendChat = () => {
    if (!chatInput.trim()) return;
    setMessages((m) => [...m, { from: 'doctor', text: chatInput }]);
    setChatInput('');
  };

  const endCall = () => {
    if (!patient || !session) return;
    saveConsultation.mutate(
      {
        appointmentId: session.appointmentId,
        patientId: patient.id,
        chiefComplaint: 'Teleconsultation',
        hpi: messages.map((m) => `${m.from}: ${m.text}`).join('\n'),
      },
      {
        onSuccess: (encRes) => {
          sendRx.mutate(
            {
              encounterId: encRes.encounter.id,
              patientId: patient.id,
              medicines: rxRows.map((r) => ({
                drugName: r.drugName,
                dosage: r.dosage,
                frequency: r.frequency,
                duration: r.duration,
                instructions: 'Teleconsult',
              })),
              digitalSignatureApplied: true,
              digitalSignature: 'TELE_SIG',
            },
            {
              onSuccess: (rxRes) => {
                generateDoc.mutate(
                  {
                    patientId: patient.id,
                    documentType: 'PROGRESS_NOTE',
                    signed: true,
                    content: 'Telemedicine visit summary',
                  },
                  {
                    onSuccess: () => {
                      setActive(false);
                      toast.success(rxRes.message ?? 'Teleconsult completed · Rx dispatched');
                    },
                  },
                );
              },
              onError: (e) => toast.error(e.message),
            },
          );
        },
        onError: (e) => toast.error(e.message),
      },
    );
  };

  if (isLoading) return <ClinicalPageSkeleton rows={2} />;

  if (!session || !patient) {
    return (
      <div className={clinicalClasses.pageBg}>
        <ClinicalPageHeader title="Telemedicine" subtitle="No teleconsultation scheduled today in database" />
      </div>
    );
  }

  if (!active) {
    return (
      <div className={clinicalClasses.pageBg}>
        <ClinicalPageHeader title="Telemedicine Virtual Suite" subtitle={`Room ${session.roomId}`} />
        <button type="button" className={clinicalClasses.btnPrimary} onClick={() => setActive(true)}>
          Join {patient.fullName} · {patient.mrn}
        </button>
      </div>
    );
  }

  return (
    <div className={clinicalClasses.pageBg}>
      <ClinicalPageHeader title="Active teleconsultation" subtitle={session.roomId} />
      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="grid gap-3 lg:grid-cols-2">
          <div className={`${clinicalClasses.card} flex aspect-video flex-col items-center justify-center bg-[#0F172A] text-white`}>
            {camOff ? <VideoOff className="h-12 w-12 opacity-50" /> : <Video className="h-12 w-12 opacity-50" />}
            <p className="mt-2 text-xs text-slate-400">You</p>
          </div>
          <div className={`${clinicalClasses.card} flex aspect-video flex-col items-center justify-center bg-[#1E293B] text-white`}>
            <Video className="h-12 w-12 opacity-50" />
            <p className="mt-2 text-xs text-slate-400">{patient.fullName}</p>
          </div>
        </div>
        <div className={`${clinicalClasses.card} flex flex-col overflow-hidden p-0`}>
          <div className="flex border-b bg-[#F8FAFC]">
            {(['chat', 'emr', 'rx'] as SideTab[]).map((id) => (
              <button key={id} type="button" onClick={() => setTab(id)} className={`flex-1 py-2 text-xs font-bold ${tab === id ? 'border-b-2 border-[#0D9488] text-[#0D9488]' : 'text-[#64748B]'}`}>
                {id === 'chat' ? 'Chat' : id === 'emr' ? 'EMR' : 'e-Rx'}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto p-3 text-sm">
            {tab === 'chat' && (
              <>
                <ul className="space-y-2">
                  {messages.map((m, i) => (
                    <li key={i} className={m.from === 'doctor' ? 'text-right' : ''}>
                      <span className={`inline-block rounded-lg px-3 py-1 ${m.from === 'doctor' ? 'bg-[#0D9488] text-white' : 'bg-slate-100'}`}>{m.text}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 flex gap-2">
                  <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} className="flex-1 rounded border px-2 py-1" />
                  <button type="button" className={clinicalClasses.btnPrimary} onClick={sendChat}>
                    Send
                  </button>
                </div>
              </>
            )}
            {tab === 'emr' && (
              <div className="space-y-2 text-[#64748B]">
                <p className="font-semibold text-[#0F172A]">{patient.fullName}</p>
                <p>Allergies: {patient.allergies?.join(', ') || 'NKDA'}</p>
                <p>Chronic: {patient.chronicConditions?.join(', ') || 'None'}</p>
                <Link href={`/doctor/emr?patient=${patient.id}`} className="text-[#0D9488] font-semibold">
                  Full EMR →
                </Link>
              </div>
            )}
            {tab === 'rx' && <PrescriptionTable rows={rxRows} onRemove={(i) => setRxRows((r) => r.filter((_, idx) => idx !== i))} />}
          </div>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        <button type="button" className={clinicalClasses.btnSecondary} onClick={() => setMuted((m) => !m)}>
          {muted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />} Mute
        </button>
        <button type="button" className={clinicalClasses.btnSecondary} onClick={() => setCamOff((c) => !c)}>
          {camOff ? <VideoOff className="h-4 w-4" /> : <Video className="h-4 w-4" />} Camera
        </button>
        <button type="button" className={clinicalClasses.btnSecondary}>
          <MonitorUp className="h-4 w-4" /> Share
        </button>
        <button type="button" className={clinicalClasses.btnCritical} onClick={endCall}>
          <PhoneOff className="h-4 w-4" /> End call
        </button>
      </div>
    </div>
  );
}
