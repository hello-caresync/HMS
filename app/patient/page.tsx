'use client'; 

  

import React, { useState, useEffect } from 'react'; 

import { useRouter } from 'next/navigation'; 

import ScheduleClinicalCheckInModal, {
  type ClinicalCheckInFormData,
} from '../components/ScheduleClinicalCheckInModal';

import {
  DISEASE_LOOKUP,
  filterHospitalsByCriteria,
  type MedicalClassification,
} from '../lib/scheduleCheckInData';

  

// 🚀 TS STRUCTURAL TYPE INTERFACES 

interface NavLink { 

  name: string; 

  id: string; 

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

  

export default function CompletePatientApp() { 

  const router = useRouter(); 

   

  // Dynamic Tab State 

  const [activeTab, setActiveTab] = useState<string>('Dashboard');  

   

  // Modal State for Booking Form 

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false); 

  const [modalInitialValues, setModalInitialValues] = useState<
    Partial<ClinicalCheckInFormData> | undefined
  >(undefined);

  const [hasAppointment, setHasAppointment] = useState<boolean>(false); 

  

  // Filter state for viewing doctor timetables 

  const [scheduleFilter, setScheduleFilter] = useState<string>('All'); 

  

  // AI SYMPTOM CHECKER PLATFORM STATE 

  const [userSymptomInput, setUserSymptomInput] = useState<string>(''); 

  const [isAiAnalyzing, setIsAiAnalyzing] = useState<boolean>(false); 

  const [aiTriageResponse, setAiTriageResponse] = useState<{ 

    assessment: string; 

    recommendedSpecialty: string; 

    confidence: string; 

  } | null>(null); 

  

  // SELF-CHECK-IN & TOKEN GENERATOR STATES 

  const [isCheckingIn, setIsCheckingIn] = useState<boolean>(false); 

  const [isCheckedIn, setIsCheckedIn] = useState<boolean>(false); 

  

  // 🚀 NEW: REAL-TIME QUEUE COUNTER TRACKING PIPELINE STATES 

  const [peopleAhead, setPeopleAhead] = useState<number>(6); 

  const [currentServingToken, setCurrentServingToken] = useState<number>(18); 

  const [estimatedWaitMinutes, setEstimatedWaitMinutes] = useState<number>(18); 

  const [userTokenNumber, setUserTokenNumber] = useState<number>(24); 

  

  // LIVE EMR LEDGER DATABASE STATE 

  const [isUploadingReport, setIsUploadingReport] = useState<boolean>(false); 

  const [emrRecords, setEmrRecords] = useState<EmrRecord[]>([ 

    { 

      id: "EMR-2026-902A", 

      source: "Core Hospital Database Network", 

      date: "2026-07-02", 

      recordType: "Cardiovascular Lab Panel", 

      summary: "Sinus rhythm verified. Baseline troponin levels resting within standard non-critical boundaries.", 

      metrics: "Troponin: <0.01 ng/mL, Potassium: 4.2 mEq/L", 

      status: "Unified" 

    } 

  ]); 

  

  // DIGITAL HEALTH RECORDS DATABASE 

  const clinicalRecordsHistory: MedicalRecord[] = [ 

    { 

      id: "REC-2026-0419", 

      date: "2026-07-02", 

      doctorName: "Dr. Rachel Green", 

      specialty: "Cardiology", 

      diagnosis: "Mild Hypertension & Sinus Tachycardia", 

      treatmentPlan: "Commence Telmisartan 40mg management regime.", 

      labResults: [ 

        { parameter: "Systolic Blood Pressure", value: "142 mmHg", referenceRange: "90 - 120 mmHg", status: "Elevated" } 

      ], 

      scanNotes: "ECG shows normal sinus rhythm." 

    } 

  ]; 

  

  // Core App State 

  const [patientData, setPatientData] = useState({ 

    name: "Alex Mercer", 

    assignedDoctor: "General Health Practitioner", 

    hospitalRoom: "Manipal Hospital, Bengaluru", 

    emrStatus: "Connected (Apollo Health Cloud)", 

    lastSync: "Today, 12:24 PM" 

  }); 

  

  // 🚀 NEW: LIVE TIMELINE TICKER HOOK 

  // Simulates true asynchronous hospital server web-sockets pushing database updates down to the phone 

  useEffect(() => { 

    let queueInterval: NodeJS.Timeout; 

  

    if (isCheckedIn && peopleAhead > 0) { 

      queueInterval = setInterval(() => { 

        setPeopleAhead((prev) => { 

          if (prev <= 1) { 

            setEstimatedWaitMinutes(2); 

            return 1; // Holds at 1 person left until doctor signals entry 

          } 

          // Decrement estimated wait time along with line processing 

          setEstimatedWaitMinutes((time) => Math.max(time - 3, 3)); 

          setCurrentServingToken((token) => token + 1); 

          return prev - 1; 

        }); 

      }, 7000); // Ticks and moves the line forward every 7 seconds for simulation testing 

    } 

  

    return () => { 

      if (queueInterval) clearInterval(queueInterval); 

    }; 

  }, [isCheckedIn, peopleAhead]); 

  

  // Scheduled Appointments Ledger List 

  const [appointmentsList, setAppointmentsList] = useState<Appointment[]>([ 

    { 

      id: "APT-9901", 

      patientName: "Alex Mercer", 

      doctorName: "Dr. Rachel Green", 

      department: "Cardiology", 

      hospital: "Manipal Hospital (Old Airport Road), Bengaluru", 

      date: "2026-07-15", 

      time: "10:30 AM", 

      type: "In-Person", 

      status: "Confirmed" 

    } 

  ]); 

  

  // Doctor Schedules 

  const doctorSchedules: DoctorSchedule[] = [ 

    { name: "Dr. Rachel Green", dept: "Cardiology", days: "Mon, Wed, Fri", timings: "09:00 AM - 01:00 PM", room: "OPD Suite 4" }, 

    { name: "Dr. Ross Geller", dept: "Pediatrics", days: "Tue, Thu, Sat", timings: "04:00 PM - 07:05 PM", room: "OPD Suite 9" } 

  ]; 

  

  // Mock Invoices 

  const billingLedger: Invoice[] = [ 

    { 

      invoiceId: "INV-2026-8891", 

      date: "July 02, 2026", 

      doctor: "Dr. Rachel Green (Cardiology)", 

      status: "Unpaid", 

      items: [{ name: "Specialist Consultation Fee", baseCost: 850 }], 

      taxRate: 0.18 

    } 

  ]; 

  

  // Mock Prescriptions 

  const activePrescriptions: Prescription[] = [ 

    { 

      id: 1, 

      date: "July 02, 2026", 

      doctor: "Dr. Rachel Green", 

      specialty: "Cardiology", 

      diagnosis: "Mild Hypertension", 

      medications: [{ name: "Telmisartan 40mg", dosage: "1 Tab", duration: "90 Days", instruction: "Post Food" }], 

      notes: "Avoid high-sodium dietary logs." 

    } 

  ]; 

  

  const [expandedPrescription, setExpandedPrescription] = useState<number | null>(0); 

  

  const handleFacilitySelfCheckIn = () => { 

    setIsCheckingIn(true); 

    setTimeout(() => { 

      const startingToken = 42; 

      const currentlyServing = 36; 

      const ahead = startingToken - currentlyServing; 

  

      setUserTokenNumber(startingToken); 

      setCurrentServingToken(currentlyServing); 

      setPeopleAhead(ahead); 

      setEstimatedWaitMinutes(ahead * 4); // Allocates roughly 4 minutes per diagnostic slot 

  

      setPatientData((prev) => ({ 

        ...prev, 

        assignedDoctor: "Dr. Rachel Green (Cardiology Wing)", 

        hospitalRoom: "OPD Clinic Counter 4, First Floor" 

      })); 

  

      setIsCheckedIn(true); 

      setIsCheckingIn(false); 

    }, 1800); 

  }; 

  

  const handleSimulatedReportUpload = (e: React.ChangeEvent<HTMLInputElement>) => { 

    if (!e.target.files || e.target.files.length === 0) return; 

    setIsUploadingReport(true); 

    setTimeout(() => { 

      setIsUploadingReport(false); 

      alert(`Processed and merged successfully.`); 

    }, 1000);  

  }; 

  

  const analyzeSymptomsWithAI = (e: React.FormEvent) => { 

    e.preventDefault(); 

    if (!userSymptomInput.trim()) return; 

    setIsAiAnalyzing(true); 

    setTimeout(() => { 

      setAiTriageResponse({ 

        assessment: 'Symptoms routing logged successfully inside system directories rows index parameters.', 

        recommendedSpecialty: 'Cardiology', 

        confidence: '94%' 

      }); 

      setIsAiAnalyzing(false); 

    }, 1000); 

  }; 

  

  const handleLaunchAiPreFilledBooking = () => { 

    if (!aiTriageResponse) return; 

    const classificationMap: Record<string, MedicalClassification> = { 

      Cardiology: 'Cardiology', 

      Neurology: 'Neurology', 

      Pediatrics: 'Pediatrics', 

      Orthopedics: 'Orthopedics', 

      'General Medicine': 'General Medicine', 

    }; 

    const medicalClassification = classificationMap[aiTriageResponse.recommendedSpecialty] ?? 'General Medicine'; 

    const specificDisease = DISEASE_LOOKUP[medicalClassification][0]; 

    const matchedHospitals = filterHospitalsByCriteria(medicalClassification, specificDisease); 

    setModalInitialValues({ 

      patientName: 'Alex Mercer', 

      email: 'alex@example.com', 

      mobileNumber: '9876543210', 

      medicalClassification, 

      specificDisease, 

      hospitalId: matchedHospitals[0]?.id ?? '', 

      symptomsDescription: `AI Triage: ${userSymptomInput}`, 

      targetDate: '2026-07-15', 

      targetTime: '10:30', 

    }); 

    setIsModalOpen(true); 

  }; 

  

  const handleModalClose = () => { 

    setIsModalOpen(false); 

    setModalInitialValues(undefined); 

  }; 

  

  const handleModalConfirm = (_data: ClinicalCheckInFormData) => { 

    setHasAppointment(true); 

    setIsModalOpen(false); 

    setModalInitialValues(undefined); 

  }; 

  

  const filteredSchedules = doctorSchedules.filter((doc: DoctorSchedule) =>  

    scheduleFilter === 'All' ? true : doc.dept === scheduleFilter 

  ); 

  

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

       

      {/* ─── FIXED LEFT SIDEBAR PANEL ─── */} 

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

                activeTab === link.id 

                  ? 'bg-[#C18988] text-white shadow-sm border border-[#916A5A]/30' 

                  : 'text-white/90 hover:bg-white/10 hover:text-white' 

              }`} 

            > 

              <span className="truncate">{link.name}</span> 

            </button> 

          ))} 

        </nav> 

  

        <div className="p-4 border-t border-[#916A5A]/30"> 

          <button onClick={() => router.push('/login')} className="w-full flex items-center justify-center rounded-xl border border-[#916A5A]/40 bg-white/10 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-white/20 cursor-pointer">Sign Out</button> 

        </div> 

      </aside> 

  

      {/* ─── MAIN CONTENT DISPLAY HUB ─── */} 

      <main className="flex-1 p-6 sm:p-8 overflow-y-auto h-full relative z-10 w-full bg-[#FFF8F1]"> 

        <div className="w-full flex flex-col pb-16"> 

           

          {/* Header Bar Area */} 

          <header className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 w-full shrink-0"> 

            <div> 

              <p className="text-xs font-bold uppercase tracking-widest text-[#916A5A]">Patient Workspace</p> 

              <h1 className="mt-1 text-3xl font-black tracking-tight text-black"> 

                {activeTab === 'Dashboard' ? 'Patient Command Center' : activeTab === 'Records' ? 'Digital Health History Records' : activeTab === 'EMR' ? 'Hospital EMR Matrix Integration' : activeTab === 'Appointments' ? 'Appointment Viewing & Schedules' : activeTab} 

              </h1> 

            </div> 

          </header> 

  

          {/* TAB CONTENT 1: DASHBOARD HUB */} 

          {activeTab === 'Dashboard' && ( 

            <div className="space-y-6 flex-1 w-full"> 

               

              {/* ARRIVAL SELF-CHECK-IN & REAL-TIME QUEUE COUNTER CONTAINER */} 

              <section className="w-full bg-white rounded-2xl border border-[#916A5A]/30 p-6 shadow-sm space-y-5 animate-fadeIn"> 

                {!isCheckedIn ? ( 

                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6"> 

                    <div className="space-y-1"> 

                      <span className="text-xs font-black tracking-widest text-[#C18988] bg-[#C18988]/15 px-2.5 py-1 rounded-md border border-[#C18988]/20 uppercase">On-Site Arrival Triage</span> 

                      <h3 className="text-xl font-black text-stone-900 pt-2">Hospital Terminal Self-Check-In</h3> 

                      <p className="text-sm text-stone-500 font-medium">Arrived at the facility? Avoid long lines at the central reception desk. Tap check-in to claim an automated digital entry token instantly.</p> 

                    </div> 

                    <button 

                      onClick={handleFacilitySelfCheckIn} 

                      disabled={isCheckingIn} 

                      className="rounded-xl bg-[#C18988] text-white font-black text-sm px-6 py-4 border border-[#916A5A]/20 shadow-md cursor-pointer shrink-0 disabled:opacity-50" 

                    > 

                      {isCheckingIn ? 'Syncing Location Vitals...' : '📍 Tap to Check-In at Facility Desk'} 

                    </button> 

                  </div> 

                ) : ( 

                  /* 🚀 ACTIVE IMMERSIVE LIVE REAL-TIME QUEUE MONITORING DETAILED INTERFACE */ 

                  <div className="space-y-6 animate-scaleUp"> 

                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#916A5A]/20 pb-5"> 

                      <div> 

                        <span className="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-black uppercase tracking-wider text-emerald-700"> 

                          ● Connected to Live Clinic Room Feed Stream 

                        </span> 

                        <h2 className="mt-3 text-2xl font-black tracking-tight text-black">{patientData.assignedDoctor}</h2> 

                        <p className="text-sm font-medium text-[#916A5A] mt-1">Assigned Enclosure: <span className="text-black font-bold">{patientData.hospitalRoom}</span></p> 

                      </div> 

                       

                      {/* 🚀 DYNAMIC LIVE wait-time COUNTDOWN METRICS CARD */} 

                      <div className="rounded-xl bg-[#C18988] px-6 py-4 text-left sm:text-right shadow-sm min-w-[160px] border border-[#916A5A]/20 shrink-0"> 

                        <span className="text-xs text-white/90 uppercase tracking-wider font-bold block">Live Wait Countdown</span> 

                        <span className="text-3xl font-black text-white mt-0.5 block tracking-tight"> 

                          ⏳ {estimatedWaitMinutes} mins 

                        </span> 

                      </div> 

                    </div> 

  

                    {/* Fluid Grid displays your token parameters with real-time decrements */} 

                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-3 w-full"> 

                      <div className="rounded-xl bg-[#FFF8F1] p-5 border border-[#916A5A]/20 w-full"> 

                        <span className="text-xs text-[#916A5A] uppercase tracking-wider font-black block">Your Confirmed Token</span> 

                        <span className="text-4xl font-black mt-1.5 block tracking-tight text-[#C18988]">T-{userTokenNumber}</span> 

                        <p className="text-[11px] text-stone-400 font-bold mt-1">Present this slip to the door assistant when called</p> 

                      </div> 

                       

                      <div className="rounded-xl bg-[#FFF8F1] p-5 border border-[#916A5A]/20 w-full"> 

                        <span className="text-xs text-[#916A5A] uppercase tracking-wider font-black block">Now Calling Counter</span> 

                        <span className="text-4xl font-black mt-1.5 block tracking-tight text-stone-900">T-{currentServingToken}</span> 

                        <p className="text-[11px] text-stone-400 font-bold mt-1">Live tracking update synced milliseconds ago</p> 

                      </div> 

  

                      {/* 🚀 LIVE COUNTER: EXACT INDICATION OF PEOPLE REMAINING AHEAD */} 

                      <div className="rounded-xl bg-[#FFE7D5]/40 p-5 border border-[#916A5A]/30 w-full flex flex-col justify-between"> 

                        <div> 

                          <span className="text-xs text-[#916A5A] uppercase tracking-wider font-black block">Patients Standing Ahead</span> 

                          <span className="text-3xl font-black mt-1 block text-stone-900"> 

                            👥 {peopleAhead} {peopleAhead === 1 ? 'person' : 'people'} 

                          </span> 

                        </div> 

                        <span className="text-[11px] font-bold text-[#C18988] block mt-2"> 

                          {peopleAhead === 1 ? '👉 Proceed to the room door now!' : '👉 Relax in the lounge. We will alert you here.'} 

                        </span> 

                      </div> 

                    </div> 

                  </div> 

                )} 

              </section> 

  

              {/* AI SYMPTOM TRIAGE CHECKER */} 

              <section className="w-full bg-white rounded-2xl border border-[#916A5A]/30 p-6 shadow-sm space-y-4"> 

                <div> 

                  <span className="text-xs font-black tracking-widest text-[#C18988] bg-[#C18988]/10 px-2.5 py-1 rounded-md border border-[#C18988]/20 uppercase">AI Clinical Triage Assistant</span> 

                  <h3 className="text-xl font-black text-stone-900 mt-3">Advanced AI Symptom Evaluation</h3> 

                  <p className="text-sm text-stone-500 mt-0.5">Describe how you are feeling to auto-triage specialty routing before check-ins.</p> 

                </div> 

                <form onSubmit={analyzeSymptomsWithAI} className="space-y-3"> 

                  <textarea rows={2} required placeholder="Describe symptoms..." className="w-full rounded-xl border border-[#916A5A]/30 bg-stone-50 px-4 py-3 text-sm font-bold text-black focus:outline-none placeholder-stone-300 resize-none" value={userSymptomInput} onChange={(e) => setUserSymptomInput(e.target.value)} /> 

                  <div className="flex justify-end"> 

                    <button type="submit" disabled={isAiAnalyzing} className="rounded-xl bg-[#565B5F] text-white font-bold text-xs px-5 py-3 cursor-pointer disabled:opacity-50"> 

                      {isAiAnalyzing ? 'Evaluating Matrix...' : '🔍 Request AI Specialist Routing'} 

                    </button> 

                  </div> 

                </form> 

                {aiTriageResponse && ( 

                  <div className="p-4 bg-[#FFE7D5]/40 border border-[#916A5A]/30 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"> 

                    <div> 

                      <span className="text-xs text-[#916A5A] font-bold block">AI Match Recommendation</span> 

                      <strong className="text-base text-stone-900 mt-0.5 block">👉 Dept. of {aiTriageResponse.recommendedSpecialty}</strong> 

                    </div> 

                    <button onClick={handleLaunchAiPreFilledBooking} className="bg-[#C18988] text-white font-bold text-xs px-4 py-2.5 rounded-xl border border-[#916A5A]/20 shadow-sm cursor-pointer">Instant Schedule Slot</button> 

                  </div> 

                )} 

              </section> 

  

              {/* Bottom Cards */} 

              <div className="grid gap-6 sm:grid-cols-2 w-full"> 

                <div onClick={() => setActiveTab('Appointments')} className="group cursor-pointer rounded-2xl border border-[#916A5A]/30 bg-white p-6 shadow-sm transition-all hover:border-[#C18988]"> 

                  <h4 className="text-xl font-black text-black group-hover:text-[#C18988] transition-colors">View Live Appointments →</h4> 

                  <p className="mt-1 text-sm text-stone-500">Check token updates, check-in schedules, and clinic lines.</p> 

                </div> 

                <div onClick={() => setActiveTab('Records')} className="group cursor-pointer rounded-2xl border border-[#916A5A]/30 bg-white p-6 shadow-sm transition-all hover:border-[#C89D8C] w-full"> 

                  <h4 className="text-xl font-black text-black group-hover:text-[#C89D8C] transition-colors">Access Diagnostics History →</h4> 

                  <p className="mt-1 text-sm text-stone-500">Review clinical prescriptions, lab summaries, and medical chart files.</p> 

                </div> 

              </div> 

            </div> 

          )} 

  

          {/* VIEW 2: MEDICAL RECORDS TAB */} 

          {activeTab === 'Records' && ( 

            <div className="space-y-6 w-full flex-1 animate-fadeIn"> 

              {clinicalRecordsHistory.map((record: MedicalRecord) => ( 

                <div key={record.id} className="bg-white rounded-2xl border border-[#916A5A]/30 p-6 shadow-sm space-y-4 w-full"> 

                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-stone-100 pb-2"> 

                    <div> 

                      <span className="text-xs font-mono text-[#916A5A] font-black">{record.id}</span> 

                      <h3 className="text-xl font-black text-stone-900 mt-0.5">{record.diagnosis}</h3> 

                    </div> 

                    <span className="bg-[#FFE7D5] text-[#916A5A] font-black text-xs px-3 py-1 rounded-lg border border-[#916A5A]/10">Date: {record.date}</span> 

                  </div> 

                  <p className="text-sm font-medium text-stone-800 leading-relaxed bg-stone-50 p-3 rounded-xl border border-stone-200">{record.treatmentPlan}</p> 

                </div> 

              ))} 

            </div> 

          )} 

  

          {/* TAB CONTENT 3: EMR INTEGRATION MODULE */} 

          {activeTab === 'EMR' && ( 

            <div className="space-y-6 w-full flex-1 animate-fadeIn"> 

              <div className="space-y-3 w-full"> 

                <h3 className="text-lg font-black text-black">Unified Hospital Master File History</h3> 

                <div className="space-y-4 w-full"> 

                  {emrRecords.map((record: EmrRecord) => ( 

                    <div key={record.id} className="bg-white rounded-2xl border border-[#916A5A]/30 p-5 shadow-sm flex flex-col space-y-3 w-full relative overflow-hidden"> 

                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-stone-100 pb-3"> 

                        <div> 

                          <span className="text-xs font-mono text-stone-400 font-bold block tracking-tight">{record.id}</span> 

                          <h4 className="text-base font-black text-stone-900 mt-0.5">{record.recordType}</h4> 

                        </div> 

                        <span className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg px-2.5 py-0.5 text-xs font-black uppercase tracking-wider shrink-0">✓ {record.status} Master File</span> 

                      </div> 

                      <div className="text-sm font-medium text-stone-700 space-y-2"> 

                        <p>{record.summary}</p> 

                        <div className="p-3 bg-[#FFF8F1]/60 rounded-xl border border-[#916A5A]/15 text-xs font-bold text-black font-mono"> 

                          {record.metrics} 

                        </div> 

                      </div> 

                    </div> 

                  ))} 

                </div> 

              </div> 

            </div> 

          )} 

  

          {/* TAB CONTENT 4: DIGITAL PRESCRIPTIONS & LIVE BILL BREAKDOWNS */} 

          {activeTab === 'Billing' && ( 

            <div className="space-y-8 w-full flex-1 animate-fadeIn"> 

              <div className="space-y-4 w-full"> 

                <h3 className="text-lg font-black text-black">Live Medical Billing Ledgers</h3> 

                <div className="grid gap-6 grid-cols-1 md:grid-cols-2 w-full"> 

                  {billingLedger.map((invoice: Invoice, index: number) => { 

                    const totalBaseCost = invoice.items.reduce((sum: number, item: BillingItem) => sum + item.baseCost, 0); 

                    const totalTax = totalBaseCost * invoice.taxRate; 

                    const finalPayable = totalBaseCost + totalTax; 

  

                    return ( 

                      <div key={index} className="bg-white rounded-2xl border border-[#916A5A]/30 p-6 shadow-sm flex flex-col justify-between w-full"> 

                        <div className="flex items-start justify-between border-b border-stone-100 pb-4 mb-4"> 

                          <div> 

                            <span className="text-xs font-black tracking-wider uppercase text-[#916A5A]">{invoice.invoiceId}</span> 

                            <h4 className="text-sm font-medium text-stone-500 mt-0.5">{invoice.date}</h4> 

                            <p className="text-xs text-black mt-1 font-bold">{invoice.doctor}</p> 

                          </div> 

                        </div> 

                        <div className="border-t border-stone-100 pt-4 mt-4 space-y-1.5 text-xs font-bold text-stone-500"> 

                          <div className="flex justify-between text-base font-black text-black pt-2"> 

                            <span>Grand Total Cost</span> 

                            <span className="text-black">₹{finalPayable.toFixed(2)}</span> 

                          </div> 

                        </div> 

                      </div> 

                    ); 

                  })} 

                </div> 

              </div> 

            </div> 

          )} 

  

          {/* Tab Fallbacks */} 

          {activeTab === 'Telehealth' && <div className="p-6 bg-white rounded-2xl border border-[#916A5A]/30 font-bold text-black w-full flex-1">Virtual Consultations Telehealth Interface Active.</div>} 

          {activeTab === 'Appointments' && <div className="p-6 bg-white rounded-2xl border border-[#916A5A]/30 font-bold text-black w-full flex-1">Appointment Schedules & Timetables Open.</div>} 

  

        </div> 

      </main> 

  

      <ScheduleClinicalCheckInModal 

        isOpen={isModalOpen} 

        onClose={handleModalClose} 

        onConfirm={handleModalConfirm} 

        initialValues={modalInitialValues} 

      /> 

  

    </div> 

  ); 

} 