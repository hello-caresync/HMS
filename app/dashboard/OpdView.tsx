// curasync/app/dashboard/OpdView.tsx
"use client";

import React, { useState } from 'react';
import { 
  Stethoscope, Activity, FileText, Pill, FlaskConical, 
  Binary, Scissors, ArrowUpRight, Calendar, Signature, 
  CreditCard, Search, Plus, CheckCircle2, HeartPulse, UserCheck 
} from 'lucide-react';

interface OpdCaseRecord {
  visitId: string;
  uhid: string;
  patientName: string;
  ageGender: string;
  vitals: { bp: string; pulse: string; temp: string; spo2: string };
  assessment: string;
  clinicalNotes: string;
  diagnoses: { code: string; description: string }[];
  prescriptions: { medicine: string; dosage: string; frequency: string; duration: string }[];
  orders: { labs: string[]; radiology: string[]; procedures: string[] };
  referral: string;
  followUp: string;
  isSigned: boolean;
  billingStatus: 'Paid' | 'Pending Integration';
}

export default function OpdView() {
  const [activeWorkflow, setActiveWorkflow] = useState<'queue' | 'consultation'>('queue');
  const [selectedCase, setSelectedCase] = useState<OpdCaseRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Sample Live Outpatient Consultation Queue
  const [opdQueue, setOpdQueue] = useState<OpdCaseRecord[]>([
    {
      visitId: "OPD-2026-8801",
      uhid: "NX-2026-000412",
      patientName: "Rahul Sharma",
      ageGender: "38M",
      vitals: { bp: "130/85 mmHg", pulse: "78 bpm", temp: "98.6 °F", spo2: "98%" },
      assessment: "Patient presents with progressive non-productive cough and mild exertional dyspnea over 4 days.",
      clinicalNotes: "Bilateral vesicular breath sounds heard. No crepitations. Heart sounds regular.",
      diagnoses: [{ code: "J40", description: "Bronchitis, not specified as acute or chronic" }],
      prescriptions: [{ medicine: "Amoxicillin 500mg", dosage: "1 tab", frequency: "TID", duration: "5 Days" }],
      orders: { labs: ["Complete Blood Count (CBC)"], radiology: ["Chest X-Ray PA View"], procedures: [] },
      referral: "None",
      followUp: "Review in 5 days or SOS",
      isSigned: false,
      billingStatus: "Paid"
    },
    {
      visitId: "OPD-2026-8802",
      uhid: "NX-2026-000413",
      patientName: "Priya Patel",
      ageGender: "31F",
      vitals: { bp: "115/70 mmHg", pulse: "72 bpm", temp: "100.2 °F", spo2: "99%" },
      assessment: "Acute onset epigastric burning pain radiating to back, accompanied by nausea.",
      clinicalNotes: "Abdomen soft, localized epigastric tenderness present. Bowel sounds normal.",
      diagnoses: [{ code: "K29.7", description: "Gastritis, unspecified" }],
      prescriptions: [{ medicine: "Pantoprazole 40mg", dosage: "1 tab", frequency: "OD (Before Food)", duration: "14 Days" }],
      orders: { labs: ["Serum Amylase", "Serum Lipase"], radiology: ["Ultrasound Abdomen Screen"], procedures: [] },
      referral: "Gastroenterology Core Consultation if symptoms persist",
      followUp: "Review after 1 week",
      isSigned: false,
      billingStatus: "Paid"
    }
  ]);

  // Consultation state tracking variables
  const [inputMed, setInputMed] = useState({ medicine: '', dosage: '1 tab', frequency: 'TID', duration: '5 Days' });
  const [inputIcd, setInputIcd] = useState({ code: '', description: '' });
  const [inputLab, setInputLab] = useState('');
  const [inputRad, setInputRad] = useState('');
  const [inputProc, setInputProc] = useState('');

  const initiateConsultation = (record: OpdCaseRecord) => {
    setSelectedCase({ ...record });
    setActiveWorkflow('consultation');
  };

  const handleAddPrescription = () => {
    if (!selectedCase || !inputMed.medicine) return;
    setSelectedCase({
      ...selectedCase,
      prescriptions: [...selectedCase.prescriptions, inputMed]
    });
    setInputMed({ medicine: '', dosage: '1 tab', frequency: 'TID', duration: '5 Days' });
  };

  const handleAddDiagnosis = () => {
    if (!selectedCase || !inputIcd.code) return;
    setSelectedCase({
      ...selectedCase,
      diagnoses: [...selectedCase.diagnoses, inputIcd]
    });
    setInputIcd({ code: '', description: '' });
  };

  const handleAddLab = () => {
    if (!selectedCase || !inputLab) return;
    setSelectedCase({
      ...selectedCase,
      orders: { ...selectedCase.orders, labs: [...selectedCase.orders.labs, inputLab] }
    });
    setInputLab('');
  };

  const handleAddRadiology = () => {
    if (!selectedCase || !inputRad) return;
    setSelectedCase({
      ...selectedCase,
      orders: { ...selectedCase.orders, radiology: [...selectedCase.orders.radiology, inputRad] }
    });
    setInputRad('');
  };

  const handleAddProcedure = () => {
    if (!selectedCase || !inputProc) return;
    setSelectedCase({
      ...selectedCase,
      orders: { ...selectedCase.orders, procedures: [...selectedCase.orders.procedures, inputProc] }
    });
    setInputProc('');
  };

  const handleCommitConsultation = () => {
    if (!selectedCase) return;
    setOpdQueue(opdQueue.map(q => q.visitId === selectedCase.visitId ? { ...selectedCase, isSigned: true } : q));
    setActiveWorkflow('queue');
    setSelectedCase(null);
  };

  const filteredQueue = opdQueue.filter(patient => 
    patient.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    patient.uhid.includes(searchQuery) ||
    patient.visitId.includes(searchQuery)
  );

  return (
    <div className="space-y-6">
      {/* Structural Module Header Dashboard */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Stethoscope className="text-blue-400 w-6 h-6" /> OPD Clinical Desk
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Outpatient registries terminal, vitals verification, ICD diagnostic maps, electronic prescriptions, and multi-service billing loops.</p>
        </div>
        
        {activeWorkflow === 'consultation' && (
          <button 
            onClick={() => { setActiveWorkflow('queue'); setSelectedCase(null); }}
            className="text-xs border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3.5 py-1.5 rounded-lg text-slate-300 transition-colors"
          >
            ← Return to Triage Queue
          </button>
        )}
      </div>

      {activeWorkflow === 'queue' ? (
        <>
          {/* Active Waiting Room Triage Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="bg-[#1e293b] p-4 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Awaiting Consultation</span>
                <h3 className="text-xl font-bold text-white mt-1">{opdQueue.filter(q => !q.isSigned).length} Cases</h3>
              </div>
              <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400"><UserCheck className="w-5 h-5" /></div>
            </div>
            <div className="bg-[#1e293b] p-4 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">E-Sign Completed</span>
                <h3 className="text-xl font-bold text-emerald-400 mt-1">{opdQueue.filter(q => q.isSigned).length} Closed</h3>
              </div>
              <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400"><Signature className="w-5 h-5" /></div>
            </div>
            <div className="bg-[#1e293b] p-4 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">OPD Revenue Link</span>
                <h3 className="text-xl font-bold text-cyan-400 mt-1">Integrated</h3>
              </div>
              <div className="p-3 bg-cyan-500/10 rounded-xl text-cyan-400"><CreditCard className="w-5 h-5" /></div>
            </div>
          </div>

          {/* Search Filtering Utility */}
          <div className="bg-[#1e293b] p-4 rounded-xl border border-slate-800 shadow-sm flex items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search index via generated UHID, name string, or visit reference..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-900/50 border border-slate-800 text-slate-200 placeholder-slate-500 rounded-lg text-xs focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          {/* Patient Registry Roster Panel */}
          <div className="bg-[#1e293b] rounded-xl border border-slate-800 overflow-hidden shadow-sm">
            <div className="p-4 bg-slate-900/40 border-b border-slate-800 font-bold text-xs text-slate-400 uppercase tracking-wider">
              Live Outpatient Department Registration Queue
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900/20 border-b border-slate-800 text-slate-400 text-[11px] font-bold uppercase tracking-wide">
                    <th className="px-6 py-3">Visit Ref</th>
                    <th className="px-6 py-3">Patient Metrics</th>
                    <th className="px-6 py-3">Nurse Intake Vitals</th>
                    <th className="px-6 py-3">Primary Complaint Overview</th>
                    <th className="px-6 py-3">Billing</th>
                    <th className="px-6 py-3 text-right">EHR Operations</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-xs text-slate-300">
                  {filteredQueue.map((patient) => (
                    <tr key={patient.visitId} className="hover:bg-slate-900/10 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-blue-400">{patient.visitId}</td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-white text-sm">{patient.patientName}</div>
                        <div className="text-[10px] text-slate-500 font-mono">UHID: {patient.uhid} | Age/Sex: {patient.ageGender}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[11px] font-mono bg-slate-900/40 p-1.5 rounded border border-slate-800/60 max-w-xs">
                          <div>BP: <span className="text-slate-200">{patient.vitals.bp}</span></div>
                          <div>PR: <span className="text-cyan-400">{patient.vitals.pulse}</span></div>
                          <div>Temp: <span className="text-orange-400">{patient.vitals.temp}</span></div>
                          <div>SpO2: <span className="text-emerald-400">{patient.vitals.spo2}</span></div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-400 max-w-xs truncate">{patient.assessment}</td>
                      <td className="px-6 py-4">
                        <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-900/30 px-2 py-0.5 rounded text-[10px] font-bold">{patient.billingStatus}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {patient.isSigned ? (
                          <span className="text-slate-500 font-medium italic pr-2 flex items-center justify-end gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Encounter Sealed</span>
                        ) : (
                          <button 
                            onClick={() => initiateConsultation(patient)}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md text-[11px] transition-colors"
                          >
                            Open Consultation Pad
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredQueue.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-slate-500 italic">No matching outpatient records found in the current session.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Clinical Consultation Interactive EHR Desk */
        selectedCase && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column: Patient Case Summary & Vitals */}
            <div className="space-y-6">
              <div className="bg-[#1e293b] border border-slate-800 rounded-xl p-5 space-y-4">
                <div className="border-b border-slate-800 pb-2">
                  <span className="text-[10px] text-blue-400 font-mono tracking-wider block">{selectedCase.visitId}</span>
                  <h3 className="font-bold text-white text-base">{selectedCase.patientName}</h3>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">Demographics: {selectedCase.ageGender} | UHID: {selectedCase.uhid}</p>
                </div>

                {/* Live Vitals Block */}
                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1"><HeartPulse className="w-3 h-3 text-rose-400" /> Nurse Assessment Vitals</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-900/50 border border-slate-800 p-2 rounded">
                      <div className="text-[9px] text-slate-500 font-bold uppercase">Blood Pressure</div>
                      <div className="text-xs font-mono font-bold text-white mt-0.5">{selectedCase.vitals.bp}</div>
                    </div>
                    <div className="bg-slate-900/50 border border-slate-800 p-2 rounded">
                      <div className="text-[9px] text-slate-500 font-bold uppercase">Pulse Frequency</div>
                      <div className="text-xs font-mono font-bold text-cyan-400 mt-0.5">{selectedCase.vitals.pulse}</div>
                    </div>
                    <div className="bg-slate-900/50 border border-slate-800 p-2 rounded">
                      <div className="text-[9px] text-slate-500 font-bold uppercase">Thermal Ticker</div>
                      <div className="text-xs font-mono font-bold text-orange-400 mt-0.5">{selectedCase.vitals.temp}</div>
                    </div>
                    <div className="bg-slate-900/50 border border-slate-800 p-2 rounded">
                      <div className="text-[9px] text-slate-500 font-bold uppercase">Oxygen Index</div>
                      <div className="text-xs font-mono font-bold text-emerald-400 mt-0.5">{selectedCase.vitals.spo2}</div>
                    </div>
                  </div>
                </div>

                {/* Vitals Assessment Entry Textbox */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1"><Activity className="w-3 h-3 text-cyan-400" /> Presenting Symptoms / Nurse Entry</label>
                  <textarea 
                    value={selectedCase.assessment} 
                    onChange={e => setSelectedCase({...selectedCase, assessment: e.target.value})}
                    className="w-full p-2 bg-slate-900 border border-slate-800 text-xs text-slate-300 rounded focus:outline-none focus:border-blue-500 h-20 resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Middle Column: Clinical Notes, Diagnoses & ICD Coding */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Clinical Notes Notepad */}
              <div className="bg-[#1e293b] border border-slate-800 rounded-xl p-5 space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1"><FileText className="w-3.5 h-3.5 text-blue-400" /> Progress & Clinical Examination Notes</label>
                  <textarea 
                    rows={3}
                    value={selectedCase.clinicalNotes}
                    onChange={e => setSelectedCase({...selectedCase, clinicalNotes: e.target.value})}
                    placeholder="Enter targeted systemic findings, physical check updates, respiratory parameters..."
                    className="w-full p-2.5 bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded focus:outline-none focus:border-blue-500 font-sans"
                  />
                </div>

                {/* Diagnosis & ICD-10 Search Allocation Unit */}
                <div className="space-y-2 border-t border-slate-800 pt-4">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">ICD-10 Diagnostic Maps & Coding</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" placeholder="e.g. J40" value={inputIcd.code}
                      onChange={e => setInputIcd({...inputIcd, code: e.target.value})}
                      className="w-24 p-2 bg-slate-900 border border-slate-800 text-xs font-mono text-amber-400 rounded focus:outline-none focus:border-blue-500 text-center"
                    />
                    <input 
                      type="text" placeholder="ICD Condition Text string..." value={inputIcd.description}
                      onChange={e => setInputIcd({...inputIcd, description: e.target.value})}
                      className="flex-1 p-2 bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded focus:outline-none focus:border-blue-500"
                    />
                    <button type="button" onClick={handleAddDiagnosis} className="p-2 bg-slate-800 hover:bg-slate-700 rounded border border-slate-700 text-slate-300"><Plus className="w-4 h-4" /></button>
                  </div>
                  
                  {/* Active Mapped Conditions */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {selectedCase.diagnoses.map((diag, idx) => (
                      <span key={idx} className="bg-amber-500/10 text-amber-400 border border-amber-900/30 px-2.5 py-1 rounded text-[11px] font-mono font-medium inline-flex items-center gap-1.5">
                        <strong>[{diag.code}]</strong> {diag.description}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Electronic Prescription Pad (CPOE) */}
              <div className="bg-[#1e293b] border border-slate-800 rounded-xl p-5 space-y-4">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1"><Pill className="w-3.5 h-3.5 text-emerald-400" /> Electronic Prescription Pad</h4>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <input type="text" placeholder="Drug formulation..." value={inputMed.medicine} onChange={e => setInputMed({...inputMed, medicine: e.target.value})} className="p-2 bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded focus:outline-none" />
                  <input type="text" placeholder="Dosage (e.g. 1 tab)" value={inputMed.dosage} onChange={e => setInputMed({...inputMed, dosage: e.target.value})} className="p-2 bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded focus:outline-none" />
                  <input type="text" placeholder="Freq (e.g. TID)" value={inputMed.frequency} onChange={e => setInputMed({...inputMed, frequency: e.target.value})} className="p-2 bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded focus:outline-none" />
                  <div className="flex gap-1">
                    <input type="text" placeholder="5 Days" value={inputMed.duration} onChange={e => setInputMed({...inputMed, duration: e.target.value})} className="flex-1 p-2 bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded focus:outline-none" />
                    <button type="button" onClick={handleAddPrescription} className="p-2 bg-slate-800 hover:bg-slate-700 rounded border border-slate-700 text-slate-300"><Plus className="w-4 h-4" /></button>
                  </div>
                </div>

                {/* Medication Scripts List */}
                {selectedCase.prescriptions.length > 0 && (
                  <div className="bg-slate-900/50 rounded-lg border border-slate-800 p-2 divide-y divide-slate-800 text-[11px] font-mono">
                    {selectedCase.prescriptions.map((med, idx) => (
                      <div key={idx} className="py-2 flex justify-between px-2 text-slate-300 first:pt-0 last:pb-0">
                        <span>💊 <strong className="text-white">{med.medicine}</strong> — {med.dosage} ({med.frequency})</span>
                        <span className="text-slate-500">{med.duration}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Auxiliary Diagnostic & Procedure Orders Desk */}
              <div className="bg-[#1e293b] border border-slate-800 rounded-xl p-5 space-y-4">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1"><FlaskConical className="w-3.5 h-3.5 text-cyan-400" /> Diagnostic & Procedure Orders Desk</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  
                  {/* Lab Orders */}
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Laboratory Pathology</label>
                    <div className="flex gap-2">
                      <input type="text" placeholder="Request Panel..." value={inputLab} onChange={e => setInputLab(e.target.value)} className="flex-1 p-2 bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded focus:outline-none" />
                      <button type="button" onClick={handleAddLab} className="p-2 bg-slate-800 hover:bg-slate-700 rounded border border-slate-700 text-slate-300"><Plus className="w-4 h-4" /></button>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedCase.orders.labs.map((l, i) => <span key={i} className="bg-cyan-500/10 text-cyan-400 border border-cyan-900/30 px-2 py-0.5 rounded text-[10px] font-mono">{l}</span>)}
                    </div>
                  </div>

                  {/* Radiology Orders */}
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Radiology Imaging Suite</label>
                    <div className="flex gap-2">
                      <input type="text" placeholder="Request Scan..." value={inputRad} onChange={e => setInputRad(e.target.value)} className="flex-1 p-2 bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded focus:outline-none" />
                      <button type="button" onClick={handleAddRadiology} className="p-2 bg-slate-800 hover:bg-slate-700 rounded border border-slate-700 text-slate-300"><Plus className="w-4 h-4" /></button>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedCase.orders.radiology.map((r, i) => <span key={i} className="bg-purple-500/10 text-purple-400 border border-purple-900/30 px-2 py-0.5 rounded text-[10px] font-mono">{r}</span>)}
                    </div>
                  </div>

                  {/* Procedure Orders */}
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Procedure Orders</label>
                    <div className="flex gap-2">
                      <input type="text" placeholder="Request Procedure..." value={inputProc} onChange={e => setInputProc(e.target.value)} className="flex-1 p-2 bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded focus:outline-none" />
                      <button type="button" onClick={handleAddProcedure} className="p-2 bg-slate-800 hover:bg-slate-700 rounded border border-slate-700 text-slate-300"><Plus className="w-4 h-4" /></button>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedCase.orders.procedures.map((p, i) => <span key={i} className="bg-rose-500/10 text-rose-400 border border-rose-900/30 px-2 py-0.5 rounded text-[10px] font-mono">{p}</span>)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Referrals, Follow-Up Matrix & Digital Cryptographic Seal */}
              <div className="bg-[#1e293b] border border-slate-800 rounded-xl p-5 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div className="space-y-2 flex-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Referral Management</label>
                      <input type="text" value={selectedCase.referral} onChange={e => setSelectedCase({...selectedCase, referral: e.target.value})} className="w-full mt-1 p-2 bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded focus:outline-none" placeholder="None" />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Follow-up Coordination & Planning</label>
                      <input type="text" value={selectedCase.followUp} onChange={e => setSelectedCase({...selectedCase, followUp: e.target.value})} className="w-full mt-1 p-2 bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded focus:outline-none" />
                    </div>
                  </div>
                </div>

                <button 
                  type="button" 
                  onClick={handleCommitConsultation}
                  className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-3 rounded-xl text-xs transition-all shadow-md self-end shrink-0"
                >
                  <Signature className="w-4 h-4 text-blue-200" /> Digital Signature & E-Sign Commit
                </button>
              </div>

            </div>
          </div>
        )
      )}
    </div>
  );
}