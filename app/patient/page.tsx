'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// 🚀 TS STRUCTURAL TYPE INTERFACES FOR CLEAN COMPILATION
interface NavLink {
  name: string;
  id: string;
}

interface HospitalMapping {
  [key: string]: string[];
}

interface BillingItem {
  name: string;
  baseCost: number;
}

interface Invoice {
  invoiceId: string;
  date: string;
  doctor: string;
  status: string;
  items: BillingItem[];
  taxRate: number;
}

interface Medication {
  name: string;
  dosage: string;
  duration: string;
  instruction: string;
}

interface Prescription {
  id: number;
  date: string;
  doctor: string;
  specialty: string;
  diagnosis: string;
  medications: Medication[];
  notes: string;
}

interface Appointment {
  id: string;
  patientName: string;
  doctorName: string;
  department: string;
  hospital: string;
  date: string;
  time: string;
  type: string;
  status: string;
}

interface DoctorSchedule {
  name: string;
  dept: string;
  days: string;
  timings: string;
  room: string;
}

interface EmrRecord {
  id: string;
  source: string;
  date: string;
  recordType: string;
  summary: string;
  metrics: string;
  status: 'Unified' | 'Pending Sync';
}

interface LabResult {
  parameter: string;
  value: string;
  referenceRange: string;
  status: 'Normal' | 'Elevated' | 'Low';
}

interface MedicalRecord {
  id: string;
  date: string;
  doctorName: string;
  specialty: string;
  diagnosis: string;
  treatmentPlan: string;
  labResults?: LabResult[];
  scanNotes?: string;
}

interface PillReminder extends Medication {
  doctor: string;
  diagnosis: string;
  alarmSet: boolean;
  alertTime: string;
}

export default function CompletePatientApp() {
  const router = useRouter();
  
  // Navigation & UI Core States
  const [activeTab, setActiveTab] = useState<string>('Dashboard'); 
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [scheduleFilter, setScheduleFilter] = useState<string>('All');
  const [userSymptomInput, setUserSymptomInput] = useState<string>('');
  const [isAiAnalyzing, setIsAiAnalyzing] = useState<boolean>(false);
  const [aiTriageResponse, setAiTriageResponse] = useState<{
    assessment: string;
    recommendedSpecialty: string;
    confidence: string;
  } | null>(null);

  // 📍 QUEUE MANAGEMENT PIPELINE STATES
  const [isCheckedIn, setIsCheckedIn] = useState<boolean>(false);
  const [userToken, setUserToken] = useState<string>('--');
  const [baseTokenNumber, setBaseTokenNumber] = useState<number>(0);
  const [peopleAhead, setPeopleAhead] = useState<number>(0);
  const [checkoutDuration, setCheckoutDuration] = useState<number>(15);
  
  // 🕒 DOWN-TO-THE-SECOND COUNTDOWN CLOCK STATE MANAGER
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);

  // Form Booking Meta Target Summary Data
  const [activeBookingSummary, setActiveBookingSummary] = useState({
    doctor: "Consultant Medical Officer",
    room: "General OPD Enclosure Wing",
    timestamp: ""
  });

  // 📋 MODAL COMPONENT FORM STATES
  const [formData, setFormData] = useState({
    patientName: '',
    email: '',
    mobileNumber: '',
    diseaseCategory: 'General Medicine',
    specificDisease: 'Seasonal Influenza (Cold/Flu)',
    hospitalName: 'Victoria Hospital, Bengaluru',
    diseaseDescription: ''
  });

  // EMR LIVE FILES DATA ARRAY
  const [isUploadingReport, setIsUploadingReport] = useState<boolean>(false);
  const [emrRecords, setEmrRecords] = useState<EmrRecord[]>([
    {
      id: "EMR-2026-902A",
      source: "Core Hospital Database Network",
      date: "2026-07-02",
      recordType: "Cardiovascular Lab Panel",
      summary: "Sinus rhythm verified. Baseline troponin levels resting within standard boundaries.",
      metrics: "Troponin: <0.01 ng/mL, Potassium: 4.2 mEq/L",
      status: "Unified"
    }
  ]);

  // DIGITAL FINANCIAL INVOICES
  const [billingLedger] = useState<Invoice[]>([
    {
      invoiceId: "INV-2026-8891",
      date: "July 02, 2026",
      doctor: "Dr. Rachel Green (Cardiology Wing)",
      status: "Unpaid",
      items: [
        { name: "Specialist Consultation Fee", baseCost: 850 },
        { name: "Electrocardiogram (ECG Test)", baseCost: 1200 }
      ],
      taxRate: 0.18
    }
  ]);

  // CLINICAL HEALTH RECORDS
  const clinicalRecordsHistory: MedicalRecord[] = [
    {
      id: "REC-2026-0419",
      date: "2026-07-02",
      doctorName: "Dr. Rachel Green",
      specialty: "Cardiology",
      diagnosis: "Mild Hypertension & Sinus Tachycardia",
      treatmentPlan: "Commence Telmisartan 40mg management regime. Restrict simple table salt logs down to less than 2g per day cycle.",
      labResults: [
        { parameter: "Systolic Blood Pressure", value: "142 mmHg", referenceRange: "90 - 120 mmHg", status: "Elevated" }
      ]
    }
  ];

  // PRESCRIPTIONS DATA BASE ROWS
  const [activePrescriptions] = useState<Prescription[]>([
    {
      id: 1,
      date: "July 02, 2026",
      doctor: "Dr. Rachel Green",
      specialty: "Cardiology",
      diagnosis: "Mild Hypertension",
      medications: [
        { name: "Telmisartan 40mg", dosage: "1 Tab - Morning", duration: "90 Days", instruction: "Post Food" }
      ],
      notes: "Avoid high-sodium dietary logs."
    }
  ]);

  const [pillSchedule, setPillSchedule] = useState<PillReminder[]>([]);

  // Hospital Mapping Filter Matrix
  const hospitalMapping: HospitalMapping = {
    'General Medicine': ['Victoria Hospital, Bengaluru', 'St. John Medical College Hospital, Bengaluru'],
    'Cardiology': ['Jayadeva Institute of Cardiovascular Sciences, Bengaluru', 'Narayana Hrudayalaya, Bengaluru', 'Manipal Hospital, Bengaluru'],
    'Neurology': ['NIMHANS, Bengaluru', 'Aster CMI Hospital, Bengaluru', 'Sakra World Hospital, Bengaluru'],
    'Pediatrics': ['Indira Gandhi Institute of Child Health, Bengaluru', 'Rainbow Children Hospital, Bengaluru'],
    'Orthopedics': ['HOSMAT Hospital, Bengaluru', 'Sparsh Hospital, Bengaluru']
  };

  const diseaseTaxonomyMapping: { [key: string]: string[] } = {
    'General Medicine': ['Seasonal Influenza (Cold/Flu)', 'Acute Viral Fever', 'Acute Migraine Headache', 'Type 2 Diabetes Mellitus Management'],
    'Cardiology': ['Angina Pectoris (Chest Pain)', 'Chronic Congestive Heart Failure', 'Sinus Tachycardia / Arrhythmia', 'Coronary Artery Disease (CAD)'],
    'Neurology': ['Epilepsy and Chronic Seizure Disorders', 'Acute Ischemic Stroke Recovery', 'Multiple Sclerosis (MS) Flare-up'],
    'Pediatrics': ['Pediatric Asthma & Wheezing', 'Neonatal Jaundice Clearance', 'Childhood Chickenpox / Measles'],
    'Orthopedics': ['Osteoarthritis (Knee/Hip Pain)', 'Rheumatoid Arthritis Inflammation', 'Hairline Fracture Recovery']
  };

  // 🕒 REAL-TIME DOWN-TO-THE-SECOND CLOCK TICKER HOOK
  useEffect(() => {
    let clockTimer: NodeJS.Timeout;

    if (isCheckedIn && secondsRemaining > 0) {
      clockTimer = setInterval(() => {
        setSecondsRemaining((prevSeconds) => {
          const nextSeconds = prevSeconds - 1;

          // Dynamically adjust peopleAhead index based on remaining duration slots
          // Each patient ahead takes exactly checkoutDuration minutes
          const slotSeconds = checkoutDuration * 60;
          const updatedPeopleAhead = Math.floor(nextSeconds / slotSeconds);
          setPeopleAhead(updatedPeopleAhead);

          if (nextSeconds <= 0) {
            clearInterval(clockTimer);
            // 🚨 TRIGGER LOUD AUDIO-VISUAL SYSTEM ALARM NOTIFICATION
            setTimeout(() => {
              alert(`🔔 ATTENTION CURASYNC PATIENT: It is now your turn for your appointment!\nAn SMS notification has been dispatched to your mobile number: ${formData.mobileNumber}.\nPlease proceed to the clinic enclosure room immediately.`);
            }, 100);
            return 0;
          }
          return nextSeconds;
        });
      }, 1000); // Decerements total count strictly every 1 second
    }

    return () => { if (clockTimer) clearInterval(clockTimer); };
  }, [isCheckedIn, secondsRemaining, checkoutDuration, formData.mobileNumber]);

  // Parse Medication Alarms on mount cleanly
  useEffect(() => {
    const parsedReminders = activePrescriptions.flatMap((rx: Prescription) =>
      rx.medications.map((med: Medication, index: number) => ({
        ...med,
        doctor: rx.doctor,
        diagnosis: rx.diagnosis,
        alarmSet: true,
        alertTime: index === 0 ? "08:00 AM" : "09:30 PM"
      }))
    );
    setPillSchedule(parsedReminders);
  }, [activePrescriptions]);

  // Format total seconds into clean dynamic MM:SS display blocks
  const formatCountdownDisplay = (totalSeconds: number): string => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    const formattedMins = mins < 10 ? `0${mins}` : mins;
    const formattedSecs = secs < 10 ? `0${secs}` : secs;

    if (hrs > 0) {
      return `${hrs}h ${formattedMins}m ${formattedSecs}s`;
    }
    return `${formattedMins}:${formattedSecs}`;
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedCategory = e.target.value;
    setFormData({
      ...formData,
      diseaseCategory: selectedCategory,
      specificDisease: diseaseTaxonomyMapping[selectedCategory]?.[0] || '',
      hospitalName: hospitalMapping[selectedCategory]?.[0] || hospitalMapping['General Medicine'][0]
    });
  };

  // 🚀 PROCESSING SELECTIONS INTO SECONDS MEMORY MATRIX
  const handleBookingFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let slotDurationInMinutes = 15; 
    let assignedPhysician = "General Practitioner Specialist";
    let assignedRoom = "OPD Desk Suite 2, Ground Floor";

    if (formData.diseaseCategory === 'Cardiology') {
      slotDurationInMinutes = 30; 
      assignedPhysician = "Dr. Rachel Green (Senior Cardiologist)";
      assignedRoom = "OPD Cardiac Enclosure Room 4";
    } else if (formData.diseaseCategory === 'Neurology') {
      slotDurationInMinutes = 45;
      assignedPhysician = "Dr. Aster Lin (Chief Neurologist)";
      assignedRoom = "Neurological Scanning Unit B";
    } else if (formData.diseaseCategory === 'Pediatrics') {
      slotDurationInMinutes = 20;
      assignedPhysician = "Dr. Ross Geller (Pediatric Care Consultant)";
      assignedRoom = "Children's Outpatient Block Wing 9";
    } else if (formData.diseaseCategory === 'Orthopedics') {
      slotDurationInMinutes = 25;
      assignedPhysician = "Dr. Sparsh Hegde (Joint Replacement Expert)";
      assignedRoom = "Trauma Ortho Wing Room 1";
    }

    const generatedRandomTokenValue = Math.floor(Math.random() * 20) + 40; 
    const currentPeopleAheadCount = 2; // Sets exact baseline line metrics matching layout guidelines
    
    // Compute exact wait limits into true running seconds variables matrix
    const computedTotalWaitSeconds = (currentPeopleAheadCount * slotDurationInMinutes) * 60;

    setBaseTokenNumber(generatedRandomTokenValue);
    setUserToken(`T-${generatedRandomTokenValue}`);
    setPeopleAhead(currentPeopleAheadCount);
    setCheckoutDuration(slotDurationInMinutes);
    setSecondsRemaining(computedTotalWaitSeconds); // Initialize countdown state variables

    setActiveBookingSummary({
      doctor: assignedPhysician,
      room: `${formData.hospitalName} — ${assignedRoom}`,
      timestamp: `Today (${new Date().toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })})`
    });

    setIsCheckedIn(true);
    setIsModalOpen(false); 
  };

  const toggleAlarmState = (targetIndex: number) => {
    setPillSchedule((prev: PillReminder[]) =>
      prev.map((pill: PillReminder, idx: number) => 
        idx === targetIndex ? { ...pill, alarmSet: !pill.alarmSet } : pill
      )
    );
  };

  const handleSimulatedReportUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setIsUploadingReport(true);
    setTimeout(() => {
      setIsUploadingReport(false);
      alert(`Success! Unified into main hospital file.`);
    }, 1000); 
  };

  const analyzeSymptomsWithAI = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userSymptomInput.trim()) return;
    setIsAiAnalyzing(true);
    setTimeout(() => {
      setAiTriageResponse({
        assessment: 'Symptoms evaluation processed into respiratory general matrix.',
        recommendedSpecialty: 'General Medicine',
        confidence: '94%'
      });
      setIsAiAnalyzing(false);
    }, 800);
  };

  const navLinks: NavLink[] = [
    { name: 'Dashboard', id: 'Dashboard' },
    { name: 'Hospital EMR Integration', id: 'EMR' },
    { name: 'Access to Medical Records', id: 'Records' },
    { name: 'Digital Prescriptions & Bills', id: 'Billing' },
    { name: 'Virtual Consultations', id: 'Telehealth' },
    { name: 'Appointment Viewing', id: 'Appointments' },
  ];

  return (
    <div className="h-screen w-screen bg-[#FFF8F1] text-black flex flex-col md:flex-row antialiased overflow-hidden fixed inset-0">
      
      {/* SIDEBAR PANEL */}
      <aside className="w-full md:w-64 bg-[#C89D8C] border-r border-[#916A5A]/30 flex flex-col shrink-0 h-auto md:h-full z-50 shadow-md">
        <div className="p-6 border-b border-[#916A5A]/30 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#C18988] font-black text-lg text-white shadow-sm">C</div>
          <div>
            <h2 className="text-lg font-black tracking-tight text-white leading-none">CuraSync</h2>
            <span className="text-xs font-bold text-stone-100 mt-1.5 block">Patient Hub</span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto no-scrollbar">
          {navLinks.map((link: NavLink) => (
            <button
              key={link.id}
              onClick={() => setActiveTab(link.id)}
              className={`w-full flex items-center px-4 py-3.5 text-sm font-bold rounded-xl transition-all cursor-pointer text-left ${
                activeTab === link.id ? 'bg-[#C18988] text-white shadow-sm border border-[#916A5A]/30' : 'text-white/90 hover:bg-white/10'
              }`}
            >
              <span className="truncate">{link.name}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* MAIN VIEWPORT WORKSPACE */}
      <main className="flex-1 p-6 sm:p-8 overflow-y-auto h-full relative z-10 w-full bg-[#FFF8F1]">
        <div className="w-full flex flex-col pb-24 max-w-5xl mx-auto">
          
          <header className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 w-full shrink-0">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[#916A5A]">Patient Workspace</p>
              <h1 className="mt-1 text-3xl font-black tracking-tight text-black">
                {activeTab === 'Dashboard' ? 'Patient Command Center' : activeTab === 'Records' ? 'Digital Health History Records' : activeTab === 'EMR' ? 'Hospital EMR Matrix Integration' : activeTab === 'Billing' ? 'Digital Prescriptions & Invoices' : activeTab}
              </h1>
            </div>
            {activeTab === 'Dashboard' && (
              <button 
                onClick={() => setIsModalOpen(true)} 
                className="rounded-xl bg-[#C18988] hover:opacity-95 text-white font-bold text-sm px-5 py-3 shadow-sm border border-[#916A5A]/20 cursor-pointer shrink-0 transition-all"
              >
                ＋ Book New Appointment
              </button>
            )}
          </header>

          {/* TAB CONTENT 1: DASHBOARD HUB */}
          {activeTab === 'Dashboard' && (
            <div className="space-y-6 flex-1 w-full">
              
              {/* 📍 MODULE: ARRIVAL CHECK-IN & REAL-TIME MANUAL COUNTDOWN CLOCK TIMELINE */}
              <section className="w-full bg-white rounded-2xl border border-[#916A5A]/30 p-6 shadow-sm">
                {!isCheckedIn ? (
                  <div className="p-4 text-center text-stone-500 font-medium bg-[#FFF8F1]/40 border rounded-xl border-dashed border-[#916A5A]/30">
                    No active appointment session logged. Click <strong className="text-black font-black">"Book New Appointment"</strong> above to select a hospital and generate your live queue index ticket.
                  </div>
                ) : (
                  <div className="space-y-5 animate-scaleUp">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#916A5A]/20 pb-4">
                      <div>
                        <span className="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-black uppercase tracking-wider text-emerald-700">● Live Token Confirmed</span>
                        <h2 className="mt-3 text-2xl font-black text-black">{activeBookingSummary.doctor}</h2>
                        <p className="text-sm font-medium text-[#916A5A] mt-0.5">Enclosure: <span className="text-black font-bold">{activeBookingSummary.room}</span></p>
                        <p className="text-xs text-stone-400 font-bold mt-1">Diagnosis Target: <span className="text-stone-700">{formData.specificDisease}</span></p>
                      </div>
                      
                      {/* ⏳ PRECISE SECONDS COUNTDOWN LAYER WRAPPER */}
                      <div className="rounded-xl bg-[#C18988] px-5 py-3.5 shadow-sm min-w-[170px] border border-[#916A5A]/20 text-center sm:text-right">
                        <span className="text-xs text-white/90 uppercase tracking-wider font-bold block">Live Wait Countdown</span>
                        <span className="text-2xl font-mono font-black text-white mt-0.5 block tracking-tight">
                          ⏳ {formatCountdownDisplay(secondsRemaining)}
                        </span>
                      </div>
                    </div>

                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-4 w-full">
                      <div className="rounded-xl bg-[#FFF8F1] p-4 border border-[#916A5A]/20">
                        <span className="text-xs text-[#916A5A] uppercase tracking-wider font-black block">Your Ticket Token</span>
                        <span className="text-3xl font-black mt-1 block text-[#C18988]">{userToken}</span>
                      </div>
                      <div className="rounded-xl bg-[#FFF8F1] p-4 border border-[#916A5A]/20">
                        <span className="text-xs text-[#916A5A] uppercase tracking-wider font-black block">Now Calling</span>
                        <span className="text-3xl font-black mt-1 block text-stone-900">
                          {secondsRemaining <= 0 ? userToken : `T-${baseTokenNumber - peopleAhead}`}
                        </span>
                      </div>
                      <div className="rounded-xl bg-[#FFF8F1] p-4 border border-[#916A5A]/20">
                        <span className="text-xs text-[#916A5A] uppercase tracking-wider font-black block">Queue Position Ahead</span>
                        <span className="text-2xl font-black mt-1 block text-stone-900">👥 {peopleAhead} {peopleAhead === 1 ? 'Patient' : 'Patients'}</span>
                      </div>
                      <div className="rounded-xl bg-[#FFE7D5]/40 p-4 border border-[#916A5A]/30 flex flex-col justify-between">
                        <div>
                          <span className="text-xs text-[#916A5A] uppercase tracking-wider font-black block">Consultation Time</span>
                          <span className="text-lg font-black block text-stone-900 mt-1">🕒 {checkoutDuration} Mins</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </section>

              {/* MEDICATION REMINDERS ALARMS GRID */}
              <section className="w-full bg-white rounded-2xl border border-[#916A5A]/30 p-6 shadow-sm space-y-4">
                <h3 className="text-xl font-black text-stone-900">Active Medication Alarms</h3>
                {pillSchedule.map((med, idx) => (
                  <div key={idx} className="bg-[#FFF8F1]/60 rounded-xl border border-[#916A5A]/20 p-4 flex items-center justify-between gap-4">
                    <div>
                      <h4 className="font-black text-stone-900 text-base">{med.name}</h4>
                      <p className="text-xs font-bold text-[#916A5A]">{med.dosage} — <span>{med.instruction}</span></p>
                    </div>
                    <span className="text-sm font-mono font-black text-stone-900 bg-white px-3 py-1 rounded-md border border-stone-200">{med.alertTime}</span>
                  </div>
                ))}
              </section>
            </div>
          )}

          {/* Core Tab Placeholders */}
          {activeTab === 'Records' && (
            <div className="space-y-6 w-full flex-1 animate-fadeIn">
              <div className="grid gap-6 grid-cols-1 w-full">
                {clinicalRecordsHistory.map((record: MedicalRecord, rIdx: number) => (
                  <div key={rIdx} className="bg-white rounded-2xl border border-[#916A5A]/30 p-6 shadow-sm space-y-5 w-full">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-stone-100 pb-3">
                      <div>
                        <span className="text-xs font-mono text-[#916A5A] font-black uppercase tracking-wider">{record.id}</span>
                        <h3 className="text-xl font-black text-stone-900 mt-1">{record.diagnosis}</h3>
                      </div>
                    </div>
                    <p className="text-sm font-medium text-stone-800 leading-relaxed bg-stone-50 p-3 rounded-xl border border-stone-200">{record.treatmentPlan}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {activeTab === 'EMR' && <div className="p-6 bg-white rounded-2xl border border-[#916A5A]/30 font-bold w-full flex-1">Hospital EMR Sync Pipeline Core Active.</div>}
          {activeTab === 'Billing' && <div className="p-6 bg-white rounded-2xl border border-[#916A5A]/30 font-bold w-full flex-1">Financial Invoices Matrix Ledger.</div>}
          {activeTab === 'Appointments' && <div className="p-6 bg-white rounded-2xl border border-[#916A5A]/30 font-bold text-black w-full flex-1">Appointment Viewing Tracker Area.</div>}
          {activeTab === 'Telehealth' && <div className="p-6 bg-white rounded-2xl border border-[#916A5A]/30 font-bold text-black w-full flex-1">Virtual Consultations Telehealth Interface Active.</div>}

        </div>
      </main>

      {/* ─── INTERACTIVE APPOINTMENT MODAL POPUP DIALOG ─── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl border border-[#B8BDC2]/60 shadow-xl max-w-lg w-full p-6 space-y-4 my-8 relative animate-fadeIn">
            <div>
              <h3 className="text-xl font-black text-stone-900">Schedule Medical Intake Check-In</h3>
              <p className="text-xs text-stone-400 font-bold mt-0.5">Please fill out your parameters to claim an automated live queue entry token.</p>
            </div>

            <form onSubmit={handleBookingFormSubmit} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-[#916A5A] mb-1">Patient Name</label>
                  <input type="text" required placeholder="e.g. Aishwarya" className="w-full rounded-xl border border-[#916A5A]/30 bg-stone-50/60 px-3.5 py-2 text-sm font-bold text-black focus:outline-none" value={formData.patientName} onChange={(e) => setFormData({...formData, patientName: e.target.value})} />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-[#916A5A] mb-1">Email Address</label>
                  <input type="email" required placeholder="name@example.com" className="w-full rounded-xl border border-[#916A5A]/30 bg-stone-50/60 px-3.5 py-2 text-sm font-bold text-black focus:outline-none" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-[#916A5A] mb-1">Phone Number</label>
                  <input type="tel" required placeholder="10-digit mobile" pattern="[0-9]{10}" className="w-full rounded-xl border border-[#916A5A]/30 bg-stone-50/60 px-3.5 py-2 text-sm font-bold text-black focus:outline-none" value={formData.mobileNumber} onChange={(e) => setFormData({...formData, mobileNumber: e.target.value})} />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-[#916A5A] mb-1">Department Specialty</label>
                  <select className="w-full rounded-xl border border-[#916A5A]/30 bg-stone-50/60 px-3 py-2 text-xs font-black text-black focus:outline-none cursor-pointer" value={formData.diseaseCategory} onChange={handleCategoryChange}>
                    <option value="General Medicine">General Medicine (Common Ailments)</option>
                    <option value="Cardiology">Cardiology (Heart Diagnostics)</option>
                    <option value="Neurology">Neurology (Brain & Nervous System)</option>
                    <option value="Pediatrics">Pediatrics (Child Care Operations)</option>
                    <option value="Orthopedics">Orthopedics (Bone & Joint Wing)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-[#916A5A] mb-1">Specific Diagnosed Disease Condition</label>
                <select className="w-full rounded-xl border border-[#916A5A]/30 bg-stone-50/60 px-3 py-2 text-xs font-black text-black focus:outline-none cursor-pointer" value={formData.specificDisease} onChange={(e) => setFormData({...formData, specificDisease: e.target.value})}>
                  {(diseaseTaxonomyMapping[formData.diseaseCategory] || []).map((disease: string, idx: number) => (
                    <option key={idx} value={disease}>{disease}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-[#916A5A] mb-1">Available Hospital Facilities</label>
                <select className="w-full rounded-xl border border-[#916A5A]/30 bg-stone-50/60 px-3 py-2 text-xs font-black text-black focus:outline-none cursor-pointer" value={formData.hospitalName} onChange={(e) => setFormData({...formData, hospitalName: e.target.value})}>
                  {(hospitalMapping[formData.diseaseCategory] || hospitalMapping['General Medicine']).map((hosp: string, i: number) => (
                    <option key={i} value={hosp}>{hosp}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-[#916A5A] mb-1">Disease Symptom Description</label>
                <textarea required placeholder="Describe what you are feeling..." rows={3} className="w-full rounded-xl border border-[#916A5A]/30 bg-stone-50/60 px-3.5 py-2 text-sm font-bold text-black focus:outline-none resize-none" value={formData.diseaseDescription} onChange={(e) => setFormData({...formData, diseaseDescription: e.target.value})} />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-xs font-black text-stone-500 rounded-xl hover:bg-stone-50 cursor-pointer">Cancel</button>
                <button type="submit" className="rounded-xl bg-[#C18988] hover:opacity-95 text-white font-black text-xs px-5 py-2.5 shadow-md border border-[#916A5A]/20 cursor-pointer transition-all">Confirm Schedule & Issue Token</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}