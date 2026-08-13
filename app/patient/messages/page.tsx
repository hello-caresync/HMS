'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
  Send,
  Stethoscope,
  User,
  RotateCw,
  MessageSquare,
  CheckCircle2,
  Loader2,
} from 'lucide-react';

import { DEFAULT_ACTIVE_DOCTOR_ID } from '@/lib/doctor/command-center/supabase-service';
import { DEFAULT_PATIENT_ID } from '@/lib/patient/book-appointment';

interface DoctorOption {
  name: string;
  department: string;
}

interface MessageRow {
  id: string;
  patient_id: string;
  doctor_id: string;
  sender_type: 'PATIENT' | 'DOCTOR' | string;
  content: string;
  created_at: string;
}

const ACTIVE_DOCTOR_ID = DEFAULT_ACTIVE_DOCTOR_ID;
const ACTIVE_PATIENT_ID = DEFAULT_PATIENT_ID;
const ACTIVE_DOCTOR_NAME = 'Dr. Chandrakanth S. Kesari';

const DOCTORS_DATABASE: DoctorOption[] = [
  { name: 'Dr. Suriraju V', department: 'Urology' },
  { name: 'Dr. Chandrakanth S. Kesari', department: 'General Surgery' },
  { name: 'Dr. Ananya R', department: 'General Medicine' },
  { name: 'Dr. Vikramaditya Rao', department: 'Cardiology' },
  { name: 'Dr. Meera Nambiar', department: 'Cardiology' },
  { name: 'Dr. Rajesh Kumar Hegde', department: 'Orthopedics' },
  { name: 'Dr. Shalini Deshmukh', department: 'Orthopedics' },
  { name: 'Dr. Arvind Swamy', department: 'Neurology' },
  { name: 'Dr. Kavitha Reddy', department: 'Neurosurgery' },
  { name: 'Dr. Pradeep Verma', department: 'Gastroenterology' },
  { name: 'Dr. Sunitha Gopal', department: 'Gastroenterology' },
  { name: 'Dr. Anand Kulkarni', department: 'Nephrology' },
  { name: 'Dr. Archana Bhat', department: 'Pediatrics' },
  { name: 'Dr. Rohan D\'Souza', department: 'Pediatrics' },
  { name: 'Dr. Deepa Shankar', department: 'Obstetrics & Gynecology' },
  { name: 'Dr. Priyanka Murthy', department: 'Obstetrics & Gynecology' },
  { name: 'Dr. Harish Prasad', department: 'Pulmonology' },
  { name: 'Dr. Nandini Sen', department: 'Dermatology' },
  { name: 'Dr. Karthik Subramanian', department: 'ENT' },
  { name: 'Dr. Smita Joshi', department: 'Ophthalmology' },
  { name: 'Dr. Manoj Kumar', department: 'Ophthalmology' },
  { name: 'Dr. Sangeetha Iyengar', department: 'Endocrinology' },
  { name: 'Dr. Rakesh Nair', department: 'Oncology' },
  { name: 'Dr. Gautham Pai', department: 'Oncology' },
  { name: 'Dr. Vani S. Rao', department: 'Psychiatry' },
  { name: 'Dr. Ashok Patel', department: 'Rheumatology' },
  { name: 'Dr. Varun Sundaram', department: 'Vascular Surgery' },
  { name: 'Dr. Rashmi Kulkarni', department: 'Anaesthesiology' },
  { name: 'Dr. Sumeet Bhalla', department: 'Plastic Surgery' },
  { name: 'Dr. Nithya Srinivas', department: 'Pathology' },
  { name: 'Dr. Jayakrishnan Nair', department: 'Radiology' },
  { name: 'Dr. Bhavana Shah', department: 'Radiology' },
  { name: 'Dr. Santosh Shetty', department: 'Emergency Medicine' },
  { name: 'Dr. Madhavi Latha', department: 'Nuclear Medicine' },
  { name: 'Dr. Chethan Gowda', department: 'Physical Medicine & Rehab' },
  { name: 'Dr. Anushree Roy', department: 'Clinical Immunology' },
  { name: 'Dr. Girish Menon', department: 'Cardiothoracic Surgery' },
  { name: 'Dr. Lavanya Krishnan', department: 'Pediatric Surgery' },
  { name: 'Dr. Hemanth Kumar', department: 'Geriatrics' },
  { name: 'Dr. Aparna Nair', department: 'Infectious Diseases' },
  { name: 'Dr. Balaji Venkat', department: 'Pain Management' },
];

export default function ClinicalMessagingPage() {
  const uniqueDepartments = Array.from(new Set(DOCTORS_DATABASE.map((d) => d.department)));

  const [selectedDept, setSelectedDept] = useState<string>('General Surgery');
  const [availableDoctors, setAvailableDoctors] = useState<DoctorOption[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<string>(ACTIVE_DOCTOR_NAME);

  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [sending, setSending] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  const chatBottomRef = useRef<HTMLDivElement>(null);

  const isActiveDoctor = selectedDoctor === ACTIVE_DOCTOR_NAME;

  useEffect(() => {
    const matchingDocs = DOCTORS_DATABASE.filter((d) => d.department === selectedDept);
    setAvailableDoctors(matchingDocs);

    if (matchingDocs.length > 0 && !matchingDocs.some((d) => d.name === selectedDoctor)) {
      setSelectedDoctor(matchingDocs[0].name);
    }
  }, [selectedDept, selectedDoctor]);

  const fetchMessages = useCallback(async () => {
    if (!isActiveDoctor) {
      setMessages([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('id, patient_id, doctor_id, sender_type, content, created_at')
        .eq('patient_id', ACTIVE_PATIENT_ID)
        .eq('doctor_id', ACTIVE_DOCTOR_ID)
        .order('created_at', { ascending: true });

      if (error) {
        console.warn('Failed to load messages:', error.message ?? error);
        setMessages([]);
        return;
      }

      setMessages((data ?? []) as MessageRow[]);
    } finally {
      setLoading(false);
    }
  }, [isActiveDoctor]);

  useEffect(() => {
    void fetchMessages();
  }, [fetchMessages, selectedDoctor]);

  useEffect(() => {
    if (!isActiveDoctor) return;

    const channel = supabase
      .channel(`patient-messages-${ACTIVE_PATIENT_ID}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `doctor_id=eq.${ACTIVE_DOCTOR_ID}`,
        },
        () => {
          void fetchMessages();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [fetchMessages, isActiveDoctor]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !isActiveDoctor) return;

    setSending(true);
    const content = inputMessage.trim();
    setInputMessage('');

    try {
      const { error } = await supabase.from('messages').insert({
        patient_id: ACTIVE_PATIENT_ID,
        doctor_id: ACTIVE_DOCTOR_ID,
        sender_type: 'PATIENT',
        content,
      });

      if (error) throw error;
      await fetchMessages();
    } catch (err) {
      console.error('Failed to send message:', err);
      setInputMessage(content);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 font-sans text-[#0E2924]">
      <div className="flex flex-col gap-4 border-b border-[#D5E8E3] pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#0E2924]">Clinical Messaging</h1>
          <p className="text-xs font-bold text-[#227B6B]">
            Secure two-way chat with your care team — messages persist in Supabase.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void fetchMessages()}
          className="flex items-center gap-2 rounded-2xl border border-[#D5E8E3] bg-white px-4 py-2.5 text-xs font-black text-[#113831] shadow-sm transition hover:bg-[#EAF5F2]"
        >
          <RotateCw className="h-4 w-4 text-[#227B6B]" /> Refresh Chat
        </button>
      </div>

      <div className="space-y-4 rounded-3xl border border-[#D5E8E3] bg-white p-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-[10px] font-black uppercase text-[#227B6B]">
              <Stethoscope className="h-3.5 w-3.5 text-[#227B6B]" /> SELECT DEPARTMENT
            </label>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full cursor-pointer rounded-2xl border border-[#D5E8E3] bg-[#EAF5F2]/40 p-3.5 text-xs font-bold text-[#0E2924] focus:outline-none"
            >
              {uniqueDepartments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-[10px] font-black uppercase text-[#227B6B]">
              <User className="h-3.5 w-3.5 text-[#227B6B]" />
              {availableDoctors.length > 1
                ? `SELECT CLINICIAN (${availableDoctors.length} Available)`
                : 'ASSIGNED CLINICIAN'}
            </label>

            {availableDoctors.length > 1 ? (
              <select
                value={selectedDoctor}
                onChange={(e) => setSelectedDoctor(e.target.value)}
                className="w-full cursor-pointer rounded-2xl border border-[#D5E8E3] bg-white p-3.5 text-xs font-black text-[#113831] focus:outline-none"
              >
                {availableDoctors.map((doc) => (
                  <option key={doc.name} value={doc.name}>
                    {doc.name}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                readOnly
                value={selectedDoctor}
                className="w-full rounded-2xl border border-[#D5E8E3] bg-[#F4F8F7] p-3.5 text-xs font-black text-[#113831]"
              />
            )}
          </div>
        </div>

        {!isActiveDoctor && (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-bold text-amber-800">
            Secure messaging is currently enabled with {ACTIVE_DOCTOR_NAME}. Select General Surgery
            to start a live conversation.
          </p>
        )}
      </div>

      <div className="flex h-[450px] flex-col space-y-6 rounded-3xl border border-[#D5E8E3] bg-white p-6 shadow-sm">
        <div className="flex shrink-0 items-center justify-between border-b border-[#EAF5F2] pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#113831] text-xs font-black text-white">
              {selectedDoctor.replace('Dr. ', '').charAt(0)}
            </div>
            <div>
              <h3 className="text-xs font-black text-[#0E2924]">{selectedDoctor}</h3>
              <p className="text-[10px] font-bold text-[#227B6B]">{selectedDept} Specialist</p>
            </div>
          </div>
          <span className="flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-black text-emerald-700">
            <CheckCircle2 className="h-3 w-3" /> Live Channel Active
          </span>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto pr-2">
          {loading ? (
            <div className="flex h-full items-center justify-center text-xs font-bold text-[#227B6B]">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading conversation...
            </div>
          ) : messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center space-y-2 text-center text-slate-400">
              <MessageSquare className="h-10 w-10 text-[#227B6B]/40" />
              <p className="text-xs font-bold text-[#227B6B]">
                No conversation history with {selectedDoctor} yet.
              </p>
              <p className="text-[10px] text-slate-400">
                Type your health concern below to send a direct message to their dashboard.
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isPatient = msg.sender_type === 'PATIENT';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isPatient ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl p-4 text-xs font-bold leading-relaxed shadow-sm ${
                      isPatient
                        ? 'rounded-br-none bg-[#113831] text-white'
                        : 'rounded-bl-none border border-[#D5E8E3] bg-[#EAF5F2] text-[#0E2924]'
                    }`}
                  >
                    <p className="mb-1 text-[10px] font-black opacity-75">
                      {isPatient ? 'You' : selectedDoctor}
                    </p>
                    <p>{msg.content}</p>
                    <span className="mt-1 block text-right text-[9px] font-normal opacity-60">
                      {new Date(msg.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              );
            })
          )}
          <div ref={chatBottomRef} />
        </div>

        <form
          onSubmit={handleSendMessage}
          className="flex shrink-0 gap-3 border-t border-[#EAF5F2] pt-2"
        >
          <input
            type="text"
            placeholder={
              isActiveDoctor
                ? `Type your problem or question for ${selectedDoctor}...`
                : 'Select Dr. Chandrakanth S. Kesari to send messages...'
            }
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            disabled={!isActiveDoctor}
            className="flex-1 rounded-2xl border border-[#D5E8E3] bg-[#F4F8F7] px-4 py-3.5 text-xs font-bold text-[#0E2924] shadow-sm focus:border-[#113831] focus:outline-none disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={sending || !inputMessage.trim() || !isActiveDoctor}
            className="flex items-center gap-2 rounded-2xl bg-[#113831] px-6 py-3.5 text-xs font-black text-white shadow-md transition hover:bg-[#227B6B] disabled:opacity-50"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin text-[#A6E2D8]" />
            ) : (
              <Send className="h-4 w-4 text-[#A6E2D8]" />
            )}
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
