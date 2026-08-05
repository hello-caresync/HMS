'use client';

import React, { useState } from 'react';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { Calendar, Clock, Stethoscope, User, AlertCircle, CheckCircle2, Loader2, X } from 'lucide-react';

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-project.supabase.co';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';
  return createSupabaseClient(url, key);
}

interface PatientBookingProps {
  onSuccess?: () => void;
  onClose?: () => void;
}

export default function PatientAppointmentBooking({ onSuccess, onClose }: PatientBookingProps) {
  const supabase = getSupabaseClient();

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State initialized with sample booking details
  const [formData, setFormData] = useState({
    patient_name: 'Aishwarya D S',
    patient_gender: 'Female',
    patient_age: '24',
    doctor_name: 'Dr. Aishwarya D S',
    department: 'General Medicine',
    appointment_date: '2026-08-09',
    appointment_time: '15:30',
    reason: 'cold',
    estimated_fee: '800',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      // 1. Generate Token Number (e.g. C-051 or sequential format)
      const randomTokenSuffix = Math.floor(100 + Math.random() * 900);
      const generatedToken = `C-${randomTokenSuffix}`;

      // 2. Insert into shared Supabase 'appointments' table
      const { data, error } = await supabase.from('appointments').insert([
        {
          token_no: generatedToken,
          patient_name: formData.patient_name,
          patient_gender: formData.patient_gender,
          patient_age: parseInt(formData.patient_age, 10) || 24,
          doctor_name: formData.doctor_name,
          department: formData.department,
          appointment_date: formData.appointment_date,
          appointment_time: `${formData.appointment_time}:00`,
          reason: formData.reason,
          estimated_fee: parseFloat(formData.estimated_fee) || 800,
          status: 'REQUESTED', // Trigger status matching Doctor/Hospital workstation
        },
      ]).select();

      if (error) {
        throw new Error(error.message);
      }

      setSuccessMsg(`Appointment requested successfully! Assigned Token: ${generatedToken}`);
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      console.error('Booking submission error:', err);
      setErrorMsg(err?.message || 'Failed to request appointment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-2xl max-w-lg w-full mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-100 pb-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-[#007B8A]">Patient Portal</span>
          <h2 className="text-xl font-extrabold text-[#004D56] mt-0.5">Book New Appointment</h2>
        </div>
        {onClose && (
          <button 
            type="button" 
            onClick={onClose} 
            className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Status Alerts */}
      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold rounded-2xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-2xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Booking Form */}
      <form onSubmit={handleBookAppointment} className="space-y-4">
        <div>
          <label className="text-xs font-bold text-[#004D56] block mb-1">Select Physician</label>
          <div className="relative">
            <select
              name="doctor_name"
              value={formData.doctor_name}
              onChange={handleInputChange}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#007B8A]"
            >
              <option value="Dr. Aishwarya D S">Dr. Aishwarya D S (General Medicine)</option>
              <option value="Dr. Rajesh Kumar">Dr. Rajesh Kumar (Cardiology)</option>
              <option value="Dr. Meera Iyer">Dr. Meera Iyer (Orthopedics)</option>
            </select>
            <Stethoscope className="w-4 h-4 text-slate-400 absolute right-3 top-3.5 pointer-events-none" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-[#004D56] block mb-1">Date</label>
            <div className="relative">
              <input
                type="date"
                name="appointment_date"
                required
                value={formData.appointment_date}
                onChange={handleInputChange}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#007B8A]"
              />
              <Calendar className="w-4 h-4 text-slate-400 absolute right-3 top-3.5 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-[#004D56] block mb-1">Time</label>
            <div className="relative">
              <input
                type="time"
                name="appointment_time"
                required
                value={formData.appointment_time}
                onChange={handleInputChange}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#007B8A]"
              />
              <Clock className="w-4 h-4 text-slate-400 absolute right-3 top-3.5 pointer-events-none" />
            </div>
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-[#004D56] block mb-1">Reason for Visit / Symptoms</label>
          <input
            type="text"
            name="reason"
            required
            placeholder="e.g. cold, fever, routine checkup"
            value={formData.reason}
            onChange={handleInputChange}
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#007B8A]"
          />
        </div>

        <div className="p-4 bg-[#F0F8F9] rounded-2xl border border-[#007B8A]/20 flex justify-between items-center text-xs font-bold text-[#004D56]">
          <span>Estimated Consultation Fee</span>
          <span className="text-emerald-700 font-extrabold text-sm">₹{formData.estimated_fee}</span>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-[#007B8A] hover:bg-[#004D56] text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 shadow-md transition-all"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'CONFIRM & REQUEST APPOINTMENT'}
        </button>
      </form>
    </div>
  );
}