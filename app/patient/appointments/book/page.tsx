'use client';

import { useState } from 'react';
import { AppointmentService } from '@/lib/services/appointment-service';
import { Calendar, Clock, User, FileText, Loader2, CheckCircle2 } from 'lucide-react';

export default function PatientBookAppointmentPage() {
  const [doctorId, setDoctorId] = useState('d0c10203-0000-0000-0000-000000000000'); // Replace with selected doctor ID
  const [patientId, setPatientId] = useState('p1002003-0000-0000-0000-000000000000'); // Replace with auth patient ID
  const [appointmentDate, setAppointmentDate] = useState(new Date().toISOString().split('T')[0]);
  const [slotTime, setSlotTime] = useState('10:30:00');
  const [chiefComplaint, setChiefComplaint] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccess(false);

    try {
      await AppointmentService.bookAppointment({
        patientId,
        doctorId,
        appointmentDate,
        slotTime,
        chiefComplaint,
      });

      setSuccess(true);
      setChiefComplaint('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to book appointment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded-3xl shadow-sm border border-slate-100 mt-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[#482A41]">Book an OPD Appointment</h1>
        <p className="text-xs text-slate-500 mt-1">
          Select date and time to request an appointment with your specialist.
        </p>
      </div>

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 text-xs font-bold">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          Appointment requested! The doctor and hospital reception have received your request.
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-800 text-xs font-semibold">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1">Appointment Date</label>
          <div className="relative">
            <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input 
              type="date"
              required
              value={appointmentDate}
              onChange={(e) => setAppointmentDate(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#007B8A]"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1">Slot Time</label>
          <div className="relative">
            <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input 
              type="time"
              required
              value={slotTime}
              onChange={(e) => setSlotTime(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#007B8A]"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1">Chief Complaint / Symptoms</label>
          <div className="relative">
            <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <textarea 
              rows={3}
              placeholder="Describe symptoms or reason for visit..."
              value={chiefComplaint}
              onChange={(e) => setChiefComplaint(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#007B8A]"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-[#004D56] hover:bg-[#007B8A] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Booking Request'}
        </button>
      </form>
    </div>
  );
}