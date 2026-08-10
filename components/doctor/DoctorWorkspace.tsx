'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Users, Activity, Bell, CheckCircle2, Clock, 
  AlertTriangle, Send, FileText, Wifi, WifiOff 
} from 'lucide-react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface QueueItem {
  id: string;
  token_number: string;
  patient_id: string;
  patient_name: string;
  age: number;
  gender: string;
  blood_group: string;
  vitals: { bp?: string; hr?: string; temp?: string; spo2?: string };
  allergies: string[];
  priority: 'ROUTINE' | 'URGENT' | 'EMERGENCY';
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
}

export default function DoctorWorkspace() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [activePatient, setActivePatient] = useState<QueueItem | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [prescription, setPrescription] = useState('');
  const [clinicalAdvice, setClinicalAdvice] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    fetchQueue();

    const channel = supabase
      .channel('opd_queue_doctor_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'opd_queue' },
        (payload) => handleRealtimeUpdate(payload)
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') setIsOnline(true);
        if (status === 'CLOSED' || status === 'CHANNEL_ERROR') setIsOnline(false);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchQueue = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('opd_queue')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;

      const queueData = data || [];
      setQueue(queueData);
      localStorage.setItem('curasync_doctor_queue_cache', JSON.stringify(queueData));

      const currentActive = queueData.find((item) => item.status === 'IN_PROGRESS');
      if (currentActive) setActivePatient(currentActive);
    } catch (err) {
      console.warn('Backend connection issue, fallback to cache:', err);
      setIsOnline(false);
      const cached = localStorage.getItem('curasync_doctor_queue_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        setQueue(parsed);
        setActivePatient(parsed.find((i: QueueItem) => i.status === 'IN_PROGRESS') || null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRealtimeUpdate = (payload: any) => {
    setQueue((prevQueue) => {
      let updated = [...prevQueue];
      if (payload.eventType === 'INSERT') {
        updated.push(payload.new);
      } else if (payload.eventType === 'UPDATE') {
        updated = updated.map((item) => (item.id === payload.new.id ? payload.new : item));
      } else if (payload.eventType === 'DELETE') {
        updated = updated.filter((item) => item.id === payload.old.id);
      }
      localStorage.setItem('curasync_doctor_queue_cache', JSON.stringify(updated));
      
      if (payload.new && payload.new.status === 'IN_PROGRESS') {
        setActivePatient(payload.new);
      }
      return updated;
    });
  };

  const updatePatientStatus = async (id: string, newStatus: QueueItem['status']) => {
    const updatedQueue = queue.map((p) => {
      if (p.id === id) return { ...p, status: newStatus };
      if (newStatus === 'IN_PROGRESS' && p.id !== id && p.status === 'IN_PROGRESS') {
        return { ...p, status: 'COMPLETED' as const };
      }
      return p;
    });

    setQueue(updatedQueue);
    const target = updatedQueue.find((p) => p.id === id) || null;
    if (newStatus === 'IN_PROGRESS') setActivePatient(target);
    if (newStatus === 'COMPLETED' && activePatient?.id === id) setActivePatient(null);

    try {
      await supabase.from('opd_queue').update({ status: newStatus }).eq('id', id);
    } catch (err) {
      console.error('Failed to update state on backend:', err);
    }
  };

  const handleSendPrescription = async () => {
    if (!activePatient) return;
    setIsSending(true);

    try {
      const { error } = await supabase.from('clinical_notes').insert({
        patient_id: activePatient.patient_id,
        doctor_id: '11111111-1111-1111-1111-111111111111',
        prescription,
        clinical_advice: clinicalAdvice,
      });

      if (error) throw error;

      await updatePatientStatus(activePatient.id, 'COMPLETED');
      setPrescription('');
      setClinicalAdvice('');
      alert('Prescription successfully sent to Patient App!');
    } catch (err) {
      console.error('Error dispatching prescription:', err);
      alert('Failed to send prescription');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-slate-900 text-slate-100 font-sans h-full min-h-screen">
      {/* Header */}
      <header className="h-16 border-b border-slate-800 px-6 flex items-center justify-between bg-slate-900/50 backdrop-blur">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-white">OPD Clinical Suite</h2>
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
            Active Queue: {queue.filter((q) => q.status !== 'COMPLETED').length} Patients
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs">
            {isOnline ? <Wifi className="w-4 h-4 text-emerald-400" /> : <WifiOff className="w-4 h-4 text-amber-400" />}
            <span className={isOnline ? 'text-emerald-400 font-medium' : 'text-amber-400 font-medium'}>
              {isOnline ? 'Supabase Live' : 'Offline Cache'}
            </span>
          </div>

          <button className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-purple-500 rounded-full" />
          </button>
        </div>
      </header>

      {/* Main Grid Layout */}
      <div className="flex-1 grid grid-cols-12 overflow-hidden min-h-0">
        
        {/* Left SmartQ Column */}
        <div className="col-span-4 border-r border-slate-800 flex flex-col bg-slate-950/40">
          <div className="p-4 border-b border-slate-800 flex justify-between items-center">
            <h3 className="font-semibold text-slate-200 text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-400" /> Live SmartQ Deck
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
            {isLoading ? (
              <div className="h-40 flex items-center justify-center text-xs text-slate-400">
                Loading SmartQ deck...
              </div>
            ) : queue.length === 0 ? (
              <div className="h-40 flex flex-col items-center justify-center text-center p-4 text-slate-500">
                <Users className="w-8 h-8 stroke-1 text-slate-600 mb-1" />
                <p className="text-xs">No patients currently in queue.</p>
              </div>
            ) : (
              queue.map((item) => {
                const isActive = activePatient?.id === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => setActivePatient(item)}
                    className={`p-3.5 rounded-xl border transition cursor-pointer ${
                      isActive
                        ? 'bg-purple-950/40 border-purple-500 shadow-lg shadow-purple-950/50'
                        : item.status === 'COMPLETED'
                        ? 'bg-slate-900/30 border-slate-800/50 opacity-60'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">{item.token_number}</span>
                        <h4 className="font-semibold text-slate-100 text-sm leading-tight mt-0.5">{item.patient_name}</h4>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          item.priority === 'EMERGENCY'
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : item.priority === 'URGENT'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {item.priority}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-xs text-slate-400">
                      <span>{item.age} yrs • {item.gender}</span>
                      <div className="flex gap-1.5">
                        {item.status !== 'IN_PROGRESS' && item.status !== 'COMPLETED' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updatePatientStatus(item.id, 'IN_PROGRESS');
                            }}
                            className="px-2 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded text-[11px] font-medium transition"
                          >
                            Call Deck
                          </button>
                        )}
                        {item.status === 'IN_PROGRESS' && (
                          <span className="flex items-center gap-1 text-emerald-400 font-medium text-xs">
                            <Activity className="w-3 h-3 animate-pulse" /> On Deck
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Active Patient Column */}
        <div className="col-span-8 flex flex-col overflow-y-auto p-6 bg-slate-900/30">
          {activePatient ? (
            <div className="space-y-6">
              <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold text-white">{activePatient.patient_name}</h2>
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-slate-800 text-slate-300">
                      {activePatient.token_number}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {activePatient.age} Yrs • {activePatient.gender} • Blood Group: <span className="text-slate-200 font-semibold">{activePatient.blood_group}</span>
                  </p>
                </div>

                <button
                  onClick={() => updatePatientStatus(activePatient.id, 'COMPLETED')}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs rounded-xl flex items-center gap-2 transition"
                >
                  <CheckCircle2 className="w-4 h-4" /> Finish Consultation
                </button>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80">
                  <p className="text-xs text-slate-400 font-medium">Blood Pressure</p>
                  <p className="text-lg font-bold text-purple-400 mt-1">{activePatient.vitals?.bp || '120/80'}</p>
                </div>
                <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80">
                  <p className="text-xs text-slate-400 font-medium">Heart Rate</p>
                  <p className="text-lg font-bold text-emerald-400 mt-1">{activePatient.vitals?.hr || '72 bpm'}</p>
                </div>
                <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80">
                  <p className="text-xs text-slate-400 font-medium">Spo2</p>
                  <p className="text-lg font-bold text-cyan-400 mt-1">{activePatient.vitals?.spo2 || '98%'}</p>
                </div>
                <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80">
                  <p className="text-xs text-slate-400 font-medium">Known Allergies</p>
                  <div className="flex items-center gap-1 text-amber-400 text-xs font-semibold mt-1">
                    <AlertTriangle className="w-3 h-3" />
                    {activePatient.allergies?.length ? activePatient.allergies.join(', ') : 'None'}
                  </div>
                </div>
              </div>

              <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-4">
                <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-purple-400" /> Rx & Direct Guidance Dispatcher
                </h3>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">e-Prescription</label>
                    <textarea
                      rows={3}
                      value={prescription}
                      onChange={(e) => setPrescription(e.target.value)}
                      placeholder="Tab Paracetamol 500mg 1-0-1..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 focus:border-purple-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Direct Advice to Patient App</label>
                    <textarea
                      rows={2}
                      value={clinicalAdvice}
                      onChange={(e) => setClinicalAdvice(e.target.value)}
                      placeholder="Drink warm water, rest for 2 days..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 focus:border-purple-500 focus:outline-none"
                    />
                  </div>

                  <button
                    onClick={handleSendPrescription}
                    disabled={isSending}
                    className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-800 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {isSending ? 'Syncing...' : 'Send Direct to Patient App'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-500">
              <Users className="w-12 h-12 stroke-1 text-slate-600 mb-2" />
              <p className="text-sm">Select or call a patient from the SmartQ deck to start consultation.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}