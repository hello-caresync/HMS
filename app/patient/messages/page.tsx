'use client';

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
  Send,
  Stethoscope,
  User,
  RotateCw,
  MessageSquare,
  CheckCircle2,
} from 'lucide-react';

interface DoctorOption {
  name: string;
  department: string;
}

interface ChatMessage {
  id: string;
  patient_id: string;
  patient_name: string;
  doctor_name: string;
  department: string;
  sender_role: 'patient' | 'doctor';
  message: string;
  created_at: string;
}

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
  { name: 'Dr. Rohan D’Souza', department: 'Pediatrics' },
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
  const uniqueDepartments = Array.from(
    new Set(DOCTORS_DATABASE.map((d) => d.department))
  );

  const [selectedDept, setSelectedDept] = useState<string>('Cardiology');
  const [availableDoctors, setAvailableDoctors] = useState<DoctorOption[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<string>('Dr. Vikramaditya Rao');

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [sending, setSending] = useState<boolean>(false);

  const chatBottomRef = useRef<HTMLDivElement>(null);

  // 1. UPDATE AVAILABLE DOCTORS WHEN DEPARTMENT CHANGES
  useEffect(() => {
    const matchingDocs = DOCTORS_DATABASE.filter((d) => d.department === selectedDept);
    setAvailableDoctors(matchingDocs);

    if (matchingDocs.length > 0) {
      setSelectedDoctor(matchingDocs[0].name);
    }
  }, [selectedDept]);

  // 2. FETCH MESSAGES & SUBSCRIBE TO REALTIME updates (EXPLICITLY TYPED PAYLOAD)
  useEffect(() => {
    fetchMessages();

    const channel = supabase
      .channel('clinical_messages_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'clinical_messages' },
        (_payload: any) => {
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedDoctor]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchMessages = async () => {
    let list: ChatMessage[] = [];

    // Local Storage Read
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`curasync_chat_${selectedDoctor}`);
      if (saved) {
        try {
          list = JSON.parse(saved);
        } catch (e) {}
      }
    }

    // Supabase DB Read
    try {
      const { data, error } = await supabase
        .from('clinical_messages')
        .select('*')
        .eq('doctor_name', selectedDoctor)
        .order('created_at', { ascending: true });

      if (!error && data) {
        list = data;
        if (typeof window !== 'undefined') {
          localStorage.setItem(`curasync_chat_${selectedDoctor}`, JSON.stringify(data));
        }
      }
    } catch (err) {
      console.warn('DB read notice');
    } finally {
      setMessages(list);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    setSending(true);

    const patientName =
      typeof window !== 'undefined'
        ? localStorage.getItem('patient_full_name') || 'Aishwarya D S'
        : 'Aishwarya D S';

    const newMsg: ChatMessage = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'msg_' + Date.now(),
      patient_id: 'NEX_9021',
      patient_name: patientName,
      doctor_name: selectedDoctor,
      department: selectedDept,
      sender_role: 'patient',
      message: inputMessage.trim(),
      created_at: new Date().toISOString(),
    };

    const updated = [...messages, newMsg];
    setMessages(updated);
    setInputMessage('');

    if (typeof window !== 'undefined') {
      localStorage.setItem(`curasync_chat_${selectedDoctor}`, JSON.stringify(updated));
    }

    try {
      await supabase.from('clinical_messages').insert(newMsg);
    } catch (err) {
      console.warn('Message sync fallback active');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-sans text-[#0E2924]">
      
      {/* HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#D5E8E3] pb-4">
        <div>
          <h1 className="text-2xl font-black text-[#0E2924]">Clinical Messaging</h1>
          <p className="text-xs font-bold text-[#227B6B]">
            Secure chat with your care team — doctor advice lands here in real time.
          </p>
        </div>

        <button
          onClick={fetchMessages}
          className="flex items-center gap-2 rounded-2xl border border-[#D5E8E3] bg-white px-4 py-2.5 text-xs font-black text-[#113831] hover:bg-[#EAF5F2] transition shadow-sm"
        >
          <RotateCw className="h-4 w-4 text-[#227B6B]" /> Refresh Chat
        </button>
      </div>

      {/* DEPARTMENT & DOCTOR SELECTION CONTROL BOARD */}
      <div className="rounded-3xl border border-[#D5E8E3] bg-white p-6 shadow-sm space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          
          {/* 1. DEPARTMENT SELECTOR */}
          <div>
            <label className="flex items-center gap-1.5 text-[10px] font-black uppercase text-[#227B6B] mb-1.5">
              <Stethoscope className="h-3.5 w-3.5 text-[#227B6B]" /> SELECT DEPARTMENT
            </label>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full rounded-2xl border border-[#D5E8E3] bg-[#EAF5F2]/40 p-3.5 text-xs font-bold text-[#0E2924] focus:outline-none cursor-pointer"
            >
              {uniqueDepartments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          {/* 2. DOCTOR SELECTOR */}
          <div>
            <label className="flex items-center gap-1.5 text-[10px] font-black uppercase text-[#227B6B] mb-1.5">
              <User className="h-3.5 w-3.5 text-[#227B6B]" />
              {availableDoctors.length > 1
                ? `SELECT CLINICIAN (${availableDoctors.length} Available)`
                : 'ASSIGNED CLINICIAN'}
            </label>
            
            {availableDoctors.length > 1 ? (
              <select
                value={selectedDoctor}
                onChange={(e) => setSelectedDoctor(e.target.value)}
                className="w-full rounded-2xl border border-[#D5E8E3] bg-white p-3.5 text-xs font-black text-[#113831] focus:outline-none cursor-pointer"
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
      </div>

      {/* MESSAGING CANVAS */}
      <div className="rounded-3xl border border-[#D5E8E3] bg-white p-6 shadow-sm space-y-6 flex flex-col h-[450px]">
        
        {/* ACTIVE CHAT HEADER */}
        <div className="flex items-center justify-between border-b border-[#EAF5F2] pb-3 shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#113831] text-white text-xs font-black">
              {selectedDoctor.replace('Dr. ', '').charAt(0)}
            </div>
            <div>
              <h3 className="text-xs font-black text-[#0E2924]">{selectedDoctor}</h3>
              <p className="text-[10px] font-bold text-[#227B6B]">{selectedDept} Specialist</p>
            </div>
          </div>
          <span className="flex items-center gap-1 text-[10px] font-black text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            <CheckCircle2 className="h-3 w-3" /> Live Channel Active
          </span>
        </div>

        {/* CHAT MESSAGES DISPLAY */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-2 text-slate-400">
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
              const isPatient = msg.sender_role === 'patient';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isPatient ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl p-4 text-xs font-bold leading-relaxed shadow-sm ${
                      isPatient
                        ? 'bg-[#113831] text-white rounded-br-none'
                        : 'bg-[#EAF5F2] text-[#0E2924] border border-[#D5E8E3] rounded-bl-none'
                    }`}
                  >
                    <p className="text-[10px] opacity-75 mb-1 font-black">
                      {isPatient ? 'You' : msg.doctor_name}
                    </p>
                    <p>{msg.message}</p>
                    <span className="text-[9px] opacity-60 mt-1 block text-right font-normal">
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

        {/* CHAT INPUT FORM */}
        <form onSubmit={handleSendMessage} className="flex gap-3 shrink-0 pt-2 border-t border-[#EAF5F2]">
          <input
            type="text"
            placeholder={`Type your problem or question for ${selectedDoctor}...`}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            className="flex-1 rounded-2xl border border-[#D5E8E3] bg-[#F4F8F7] px-4 py-3.5 text-xs font-bold text-[#0E2924] focus:border-[#113831] focus:outline-none shadow-sm"
          />
          <button
            type="submit"
            disabled={sending || !inputMessage.trim()}
            className="flex items-center gap-2 rounded-2xl bg-[#113831] px-6 py-3.5 text-xs font-black text-white hover:bg-[#227B6B] transition shadow-md disabled:opacity-50"
          >
            <Send className="h-4 w-4 text-[#A6E2D8]" /> Send
          </button>
        </form>

      </div>

    </div>
  );
}