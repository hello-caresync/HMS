"use client";

import React, { useState } from 'react';
import { 
  Calendar, Clock, Plus, Search, UserCheck, XCircle, 
  RefreshCw, CheckCircle2, Ticket, Users, ShieldAlert, FileText 
} from 'lucide-react';

interface AppointmentRecord {
  id: string;
  token: string;
  patientName: string;
  doctorName: string;
  department: string;
  time: string;
  type: 'Online' | 'Walk-in';
  status: 'Scheduled' | 'In Queue' | 'Completed' | 'Cancelled';
}

export default function AppointmentManagementView() {
  const [viewMode, setViewMode] = useState<'roster' | 'book'>('roster');
  const [searchQuery, setSearchQuery] = useState('');

  // Sample Enterprise Appointment Records Ledger
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([
    { id: "APT-9821", token: "OPD-A-04", patientName: "Aarav Mehta", doctorName: "Dr. Sumit Goel", department: "Cardiology", time: "09:30 AM", type: "Online", status: "In Queue" },
    { id: "APT-9822", token: "OPD-B-11", patientName: "Meera Nair", doctorName: "Dr. Shalini Iyer", department: "Pediatrics", time: "10:15 AM", type: "Walk-in", status: "Scheduled" },
    { id: "APT-9825", token: "--", patientName: "Karan Malhotra", doctorName: "Dr. Sumit Goel", department: "Cardiology", time: "11:00 AM", type: "Online", status: "Cancelled" },
    { id: "APT-9819", token: "OPD-A-01", patientName: "Ananya Das", doctorName: "Dr. Rajesh Misra", department: "General Medicine", time: "08:45 AM", type: "Walk-in", status: "Completed" },
  ]);

  // Form input mapping state
  const [formData, setFormData] = useState({
    patientName: '', doctorName: 'Dr. Sumit Goel (Cardiology)', time: '09:00 AM', type: 'Walk-in' as const
  });

  // Action: Intake Form Booking & Token Matrix Processing
  const handleBookAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    const uniqueId = `APT-${Math.floor(9000 + Math.random() * 1000)}`;
    const dept = formData.doctorName.includes("Cardiology") ? "Cardiology" : formData.doctorName.includes("Pediatrics") ? "Pediatrics" : "General Medicine";
    const docName = formData.doctorName.split(" (")[0];
    
    // Simulate real-time structural Token Generation
    const generatedToken = `OPD-${dept.charAt(0)}-${Math.floor(10 + Math.random() * 89)}`;

    const newAppointment: AppointmentRecord = {
      id: uniqueId,
      token: generatedToken,
      patientName: formData.patientName,
      doctorName: docName,
      department: dept,
      time: formData.time,
      type: formData.type,
      status: 'Scheduled'
    };

    setAppointments([newAppointment, ...appointments]);
    setViewMode('roster');
    setFormData({ patientName: '', doctorName: 'Dr. Sumit Goel (Cardiology)', time: '09:00 AM', type: 'Walk-in' });
  };

  // State modifiers for appointment state modifications
  const updateStatus = (id: string, newStatus: AppointmentRecord['status']) => {
    setAppointments(appointments.map(apt => apt.id === id ? { ...apt, status: newStatus } : apt));
  };

  const filteredAppointments = appointments.filter(apt =>
    apt.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    apt.id.includes(searchQuery) || apt.doctorName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      {/* Banner Actions Frame Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Calendar className="text-blue-400 w-6 h-6" /> Appointment Management
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Scheduling slots control engine, online registration sync, clinician routing ledger, and dynamic token emission.</p>
        </div>

        <div className="flex bg-slate-900/60 p-1 rounded-lg border border-slate-800 self-start">
          <button 
            onClick={() => setViewMode('roster')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all ${viewMode === 'roster' ? 'bg-[#1e3a8a] text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <FileText className="w-3.5 h-3.5" /> Appointment History & Roster
          </button>
          <button 
            onClick={() => setViewMode('book')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all ${viewMode === 'book' ? 'bg-[#1e3a8a] text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Plus className="w-3.5 h-3.5" /> Book New Slot
          </button>
        </div>
      </div>

      {viewMode === 'roster' ? (
        <>
          {/* Section: Operational KPI Metrics Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-[#1e293b] p-4 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Total Scheduled Today</span>
                <h3 className="text-xl font-bold text-white mt-1">{appointments.length} Slots</h3>
              </div>
              <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400"><Calendar className="w-5 h-5" /></div>
            </div>
            <div className="bg-[#1e293b] p-4 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Active Queue Load</span>
                <h3 className="text-xl font-bold text-cyan-400 mt-1">{appointments.filter(a => a.status === 'In Queue').length} Patient Tokens</h3>
              </div>
              <div className="p-3 bg-cyan-500/10 rounded-xl text-cyan-400"><Ticket className="w-5 h-5" /></div>
            </div>
            <div className="bg-[#1e293b] p-4 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Clinicians Active</span>
                <h3 className="text-xl font-bold text-indigo-400 mt-1">3 Consultants</h3>
              </div>
              <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400"><Users className="w-5 h-5" /></div>
            </div>
            <div className="bg-[#1e293b] p-4 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Cancellations</span>
                <h3 className="text-xl font-bold text-rose-400 mt-1">{appointments.filter(a => a.status === 'Cancelled').length} Rejected</h3>
              </div>
              <div className="p-3 bg-rose-500/10 rounded-xl text-rose-400"><XCircle className="w-5 h-5" /></div>
            </div>
          </div>

          {/* Search Box */}
          <div className="bg-[#1e293b] p-4 rounded-xl border border-slate-800 shadow-sm flex items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search ledger via Patient name, Consultant ID, or Appt Token..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-900/50 border border-slate-800 text-slate-200 placeholder-slate-500 rounded-lg text-xs focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Core Appt Records Roster Table Grid */}
          <div className="bg-[#1e293b] rounded-xl border border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900/40 border-b border-slate-800 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                    <th className="px-6 py-4">Appt Reference ID</th>
                    <th className="px-6 py-4">Queue Sequence Token</th>
                    <th className="px-6 py-4">Patient Demographics</th>
                    <th className="px-6 py-4">Consulting Clinician / Department</th>
                    <th className="px-6 py-4">Time Window</th>
                    <th className="px-6 py-4">Classification</th>
                    <th className="px-6 py-4">Queue Status</th>
                    <th className="px-6 py-4 text-right">Roster Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-xs text-slate-300">
                  {filteredAppointments.map((apt) => (
                    <tr key={apt.id} className={`hover:bg-slate-900/20 transition-colors ${apt.status === 'Cancelled' ? 'opacity-40' : ''}`}>
                      <td className="px-6 py-4 font-mono font-bold text-slate-400">{apt.id}</td>
                      <td className="px-6 py-4 font-mono font-bold text-amber-400 text-sm tracking-wide">{apt.token}</td>
                      <td className="px-6 py-4 font-bold text-white text-sm">{apt.patientName}</td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-200">{apt.doctorName}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{apt.department}</div>
                      </td>
                      <td className="px-6 py-4 flex items-center gap-1.5 py-5 text-slate-400 font-medium">
                        <Clock className="w-3.5 h-3.5 text-slate-500" /> {apt.time}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${apt.type === 'Online' ? 'bg-purple-500/10 text-purple-400 border border-purple-900/30' : 'bg-orange-500/10 text-orange-400 border border-orange-900/30'}`}>
                          {apt.type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider ${
                          apt.status === 'In Queue' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-900/30 animate-pulse' :
                          apt.status === 'Scheduled' ? 'bg-blue-500/10 text-blue-400 border border-blue-900/30' :
                          apt.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-900/30' :
                          'bg-rose-500/10 text-rose-400 border border-rose-900/30'
                        }`}>{apt.status}</span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-1 whitespace-nowrap">
                        {apt.status === 'Scheduled' && (
                          <button onClick={() => updateStatus(apt.id, 'In Queue')} className="px-2 py-1 bg-cyan-600 hover:bg-cyan-700 text-slate-900 font-bold rounded text-[10px] transition-colors">Check-in Token</button>
                        )}
                        {apt.status === 'In Queue' && (
                          <button onClick={() => updateStatus(apt.id, 'Completed')} className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded text-[10px] transition-colors">Complete</button>
                        )}
                        {apt.status !== 'Completed' && apt.status !== 'Cancelled' && (
                          <button onClick={() => updateStatus(apt.id, 'Cancelled')} className="p-1 text-slate-500 hover:text-rose-400 rounded transition-colors" title="Cancel Appointment Slot"><XCircle className="w-4 h-4 inline" /></button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Form Portal Block: Slot Matrix Allocation Intake */
        <form onSubmit={handleBookAppointment} className="bg-[#1e293b] rounded-xl border border-slate-800 p-6 max-w-2xl mx-auto space-y-6">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="font-bold text-white text-sm">Create New Patient Appointment Slot</h3>
            <p className="text-xs text-slate-400">Allocates specific time limits and issues corresponding token logs into the room grid lists.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Patient Full Name *</label>
              <input required type="text" value={formData.patientName} onChange={e => setFormData({...formData, patientName: e.target.value})} className="w-full p-2.5 bg-slate-900/60 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-blue-500" placeholder="e.g. Meera Nair" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Doctor Availability Ledger & Roster *</label>
              <select value={formData.doctorName} onChange={e => setFormData({...formData, doctorName: e.target.value})} className="w-full p-2.5 bg-slate-900/60 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-blue-500">
                <option>Dr. Sumit Goel (Cardiology) - Available</option>
                <option>Dr. Shalini Iyer (Pediatrics) - Available</option>
                <option>Dr. Rajesh Misra (General Medicine) - Available</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Target Time Window *</label>
              <input required type="text" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} className="w-full p-2.5 bg-slate-900/60 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-blue-500" placeholder="e.g. 10:30 AM" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Intake Origin Channel *</label>
              <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as any})} className="w-full p-2.5 bg-slate-900/60 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-blue-500">
                <option>Walk-in Appointment</option>
                <option>Online Appointment</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button type="button" onClick={() => setViewMode('roster')} className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors">Cancel</button>
            <button type="submit" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-semibold transition-colors shadow-sm">
              <CheckCircle2 className="w-4 h-4" /> Commit Reservation & Generate Token
            </button>
          </div>
        </form>
      )}
    </>
  );
}