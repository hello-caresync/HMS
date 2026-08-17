'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import {
  loadPatientBillsLive,
  subscribeConsultationBilling,
  type ConsultationBill,
} from '@/lib/hospital/operations/consultation-billing-sync';
import { DEFAULT_PATIENT_ID } from '@/lib/doctor/command-center/supabase-service';
import {
  Activity,
  Calendar,
  Clock,
  User,
  Stethoscope,
  Building2,
  Ticket,
  PlusCircle,
  FileText,
  RotateCw,
  CheckCircle2,
  Heart,
  IndianRupee,
  Receipt,
} from 'lucide-react';

interface ActiveTokenRecord {
  id: string;
  patient_id?: string;
  patient_name: string;
  doctor_name: string;
  department: string;
  hospital_name: string;
  appointment_date: string;
  slot_time: string;
  token_number: number;
  queue_status: string;
  fee?: string;
  reason?: string;
  created_at?: string;
}

import { formatINR } from '@/lib/utils/currency';

function billStatusLabel(status: ConsultationBill['status']): string {
  if (status === 'paid') return 'Paid';
  if (status === 'partial') return 'Partial Payment';
  if (status === 'insurance_pending') return 'Insurance Pending';
  return 'Payment Due';
}

function billStatusClass(status: ConsultationBill['status']): string {
  if (status === 'paid') return 'bg-emerald-50 text-emerald-800 border-emerald-200';
  if (status === 'partial') return 'bg-amber-50 text-amber-900 border-amber-200';
  return 'bg-rose-50 text-rose-800 border-rose-200';
}

export default function PatientDashboard() {
  const router = useRouter();

  const [activeToken, setActiveToken] = useState<ActiveTokenRecord | null>(null);
  const [patientName, setPatientName] = useState<string>('Aishwarya D S');
  const [patientId, setPatientId] = useState<string>(DEFAULT_PATIENT_ID);
  const [loading, setLoading] = useState<boolean>(true);
  const [bills, setBills] = useState<ConsultationBill[]>([]);
  const [billsLoading, setBillsLoading] = useState(true);

  const fetchBills = useCallback(async (pid: string) => {
    setBillsLoading(true);
    try {
      const rows = await loadPatientBillsLive(supabase, pid);
      setBills(rows);
    } finally {
      setBillsLoading(false);
    }
  }, []);

  const fetchActiveToken = useCallback(async () => {
    setLoading(true);
    let latestAppointment: ActiveTokenRecord | null = null;

    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('curasync_appointments');
      if (cached) {
        try {
          const parsed: ActiveTokenRecord[] = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            latestAppointment = {
              ...parsed[0],
              hospital_name: 'Regal Hospital',
            };
          }
        } catch {
          console.warn('Local storage parse notice');
        }
      }
    }

    try {
      const { data, error } = await supabase
        .from('patient_appointments')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

      if (!error && data && data.length > 0) {
        latestAppointment = {
          ...data[0],
          hospital_name: 'Regal Hospital',
        };
      }

      if (!latestAppointment) {
        const { data: apptRows } = await supabase
          .from('appointments')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1);

        if (apptRows && apptRows.length > 0) {
          const row = apptRows[0] as Record<string, unknown>;
          latestAppointment = {
            id: String(row.id ?? ''),
            patient_id: String(row.patient_id ?? row.uhid ?? ''),
            patient_name: String(row.patient_name ?? 'Patient'),
            doctor_name: String(row.doctor_name ?? 'Doctor'),
            department: String(row.department ?? 'OPD'),
            hospital_name: 'Regal Hospital',
            appointment_date: String(row.appointment_date ?? row.created_at ?? ''),
            slot_time: String(row.slot_time ?? row.created_at ?? ''),
            token_number: Number(row.token_number ?? 0),
            queue_status: String(row.status ?? 'checked_in'),
            fee: row.fee != null ? String(row.fee) : undefined,
            reason: row.chief_complaint ? String(row.chief_complaint) : undefined,
            created_at: row.created_at ? String(row.created_at) : undefined,
          };
        }
      }
    } catch {
      console.warn('Dashboard DB load fallback active');
    } finally {
      setActiveToken(latestAppointment);
      const resolvedPatientId =
        latestAppointment?.patient_id ||
        (typeof window !== 'undefined' ? localStorage.getItem('patient_id') : null) ||
        DEFAULT_PATIENT_ID;
      setPatientId(resolvedPatientId);
      void fetchBills(resolvedPatientId);
      setLoading(false);
    }
  }, [fetchBills]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedName = localStorage.getItem('patient_full_name');
      if (storedName) {
        setPatientName(storedName);
      } else {
        localStorage.setItem('patient_full_name', 'Aishwarya D S');
      }

      const cachedAppts = localStorage.getItem('curasync_appointments');
      if (cachedAppts && cachedAppts.includes('CuraSync Multi-Specialty Hospital')) {
        const sanitized = cachedAppts.replaceAll(
          'CuraSync Multi-Specialty Hospital',
          'Regal Hospital',
        );
        localStorage.setItem('curasync_appointments', sanitized);
      }
    }

    void fetchActiveToken();

    const queueChannel = supabase
      .channel('realtime_patient_dashboard')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'patient_appointments' },
        () => {
          void fetchActiveToken();
        },
      )
      .subscribe();

    const unsubscribeBilling = subscribeConsultationBilling(supabase, () => {
      void fetchBills(patientId);
    });

    return () => {
      supabase.removeChannel(queueChannel);
      unsubscribeBilling();
    };
  }, [fetchActiveToken, fetchBills, patientId]);

  const outstandingBill = bills.find((bill) => bill.status !== 'paid');
  const totalOutstanding = bills.reduce(
    (sum, bill) => sum + Math.max(bill.total_amount - bill.paid_amount, 0),
    0,
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8 font-sans text-[#0E2924]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#D5E8E3] pb-4">
        <div>
          <span className="flex items-center gap-1.5 text-xs font-black text-[#227B6B] uppercase tracking-wider">
            <CheckCircle2 className="h-4 w-4" /> Verified Patient Session
          </span>
          <h1 className="text-2xl font-black text-[#0E2924] mt-1">Welcome, {patientName}</h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => void fetchActiveToken()}
            className="flex items-center gap-2 rounded-2xl border border-[#D5E8E3] bg-white px-4 py-3 text-xs font-black text-[#113831] hover:bg-[#EAF5F2] transition shadow-sm"
          >
            <RotateCw className="h-4 w-4 text-[#227B6B]" /> Refresh Status
          </button>

          <button
            onClick={() => router.push('/patient/doctors')}
            className="flex items-center gap-2 rounded-2xl bg-[#113831] px-5 py-3 text-xs font-black text-white hover:bg-[#227B6B] transition shadow-md"
          >
            <PlusCircle className="h-4 w-4 text-[#A6E2D8]" /> Book Consultation
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-3xl border border-[#D5E8E3] bg-white p-5 shadow-sm space-y-1">
          <span className="text-[10px] uppercase text-[#227B6B] font-black flex items-center gap-1">
            <Building2 className="h-3.5 w-3.5" /> Assigned Facility
          </span>
          <p className="text-base font-black text-[#0E2924]">Regal Hospital</p>
        </div>

        <div className="rounded-3xl border border-[#D5E8E3] bg-white p-5 shadow-sm space-y-1">
          <span className="text-[10px] uppercase text-[#227B6B] font-black flex items-center gap-1">
            <Heart className="h-3.5 w-3.5" /> OPD Status
          </span>
          <p className="text-base font-black text-[#113831]">
            {activeToken ? activeToken.queue_status || 'WAITING' : 'No Active Session'}
          </p>
        </div>

        <div className="rounded-3xl border border-[#D5E8E3] bg-white p-5 shadow-sm space-y-1">
          <span className="text-[10px] uppercase text-[#227B6B] font-black flex items-center gap-1">
            <IndianRupee className="h-3.5 w-3.5" /> Billing
          </span>
          <p className="text-base font-black text-[#0E2924]">
            {totalOutstanding > 0 ? `${formatINR(totalOutstanding)} due` : 'All settled'}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-xs font-black uppercase tracking-wider text-[#227B6B] flex items-center gap-2">
          <Receipt className="h-4 w-4" /> Post-Consultation Bills · Live
        </h2>

        {billsLoading ? (
          <div className="rounded-3xl border border-[#D5E8E3] bg-white p-8 text-center text-xs font-bold text-[#227B6B]">
            Syncing invoices from Regal Hospital billing desk...
          </div>
        ) : bills.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-[#D5E8E3] bg-white p-8 text-center space-y-2">
            <IndianRupee className="h-8 w-8 text-[#227B6B]/40 mx-auto" />
            <p className="text-sm font-black text-[#0E2924]">No bills yet</p>
            <p className="text-xs font-bold text-slate-500">
              After your doctor completes the consultation, your consolidated invoice will appear here
              in real time.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {outstandingBill && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-4 text-xs font-bold text-rose-900">
                <span className="font-black uppercase tracking-wide text-[10px] block mb-1">
                  Action required
                </span>
                Proceed to the Regal Hospital cashier with invoice{' '}
                <strong>{outstandingBill.invoice_number}</strong> · Balance{' '}
                {formatINR(Math.max(outstandingBill.total_amount - outstandingBill.paid_amount, 0))}
              </div>
            )}

            {bills.map((bill) => {
              const balance = Math.max(bill.total_amount - bill.paid_amount, 0);
              return (
                <div
                  key={bill.id}
                  className="rounded-3xl border border-[#D5E8E3] bg-white p-5 shadow-sm space-y-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-black text-[#0E2924]">{bill.invoice_number}</p>
                      <p className="text-xs font-bold text-[#227B6B]">
                        {bill.doctor_name ? `Dr. ${bill.doctor_name.replace(/^Dr\.\s*/i, '')}` : 'OPD Visit'}
                      </p>
                    </div>
                    <span
                      className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase ${billStatusClass(bill.status)}`}
                    >
                      {billStatusLabel(bill.status)}
                    </span>
                  </div>

                  <ul className="space-y-1 border-t border-[#EAF5F2] pt-3">
                    {bill.lines.map((line, index) => (
                      <li
                        key={`${bill.id}-line-${index}`}
                        className="flex items-center justify-between text-xs font-bold text-slate-600"
                      >
                        <span>{line.item}</span>
                        <span className="tabular-nums text-[#0E2924]">{formatINR(line.amount)}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#EAF5F2] pt-3 text-xs font-black">
                    <span className="text-[#0E2924]">Total {formatINR(bill.total_amount)}</span>
                    <span className="text-emerald-700">Paid {formatINR(bill.paid_amount)}</span>
                    {balance > 0 && <span className="text-rose-700">Due {formatINR(balance)}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <h2 className="text-xs font-black uppercase tracking-wider text-[#227B6B]">
          Live Queue & Token Status
        </h2>

        {loading ? (
          <div className="rounded-3xl border border-[#D5E8E3] bg-white p-12 text-center text-xs font-bold text-[#227B6B]">
            Syncing live token details with Regal Hospital desk...
          </div>
        ) : !activeToken ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-[#D5E8E3] bg-white p-10 text-center space-y-4">
            <Ticket className="h-10 w-10 text-[#227B6B]/40" />
            <div>
              <h3 className="text-base font-black text-[#0E2924]">No Live Tokens In Queue</h3>
              <p className="text-xs font-bold text-slate-500 max-w-sm mt-1">
                You do not have any pending appointments for today at Regal Hospital.
              </p>
            </div>
            <button
              onClick={() => router.push('/patient/doctors')}
              className="rounded-2xl bg-[#113831] px-6 py-3 text-xs font-black text-white shadow-md hover:bg-[#227B6B] transition"
            >
              Book OPD Slot Now
            </button>
          </div>
        ) : (
          <div className="rounded-3xl border border-[#D5E8E3] bg-white p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-[#EAF5F2] pb-4">
              <div className="flex items-center gap-2 text-[#113831]">
                <Ticket className="h-5 w-5 text-[#227B6B]" />
                <span className="text-sm font-black text-[#0E2924]">
                  SmartQ Token:{' '}
                  <span className="text-lg font-black text-[#227B6B]">
                    #{activeToken.token_number || 1}
                  </span>
                </span>
              </div>

              <span className="flex items-center gap-1.5 rounded-full bg-[#EAF5F2] px-4 py-1 text-xs font-black text-[#113831] border border-[#227B6B]/20 uppercase">
                <Activity className="h-3.5 w-3.5 text-[#227B6B]" />
                {activeToken.queue_status || 'WAITING'}
              </span>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#113831] text-white font-black text-base shrink-0 shadow-sm">
                {activeToken.doctor_name ? activeToken.doctor_name.replace('Dr. ', '').charAt(0) : 'D'}
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-black text-[#0E2924]">{activeToken.doctor_name}</h3>
                <p className="text-xs font-bold text-[#227B6B] flex items-center gap-1.5">
                  <Stethoscope className="h-3.5 w-3.5" /> {activeToken.department} OPD
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 bg-[#F4F8F7] p-4 rounded-2xl border border-[#D5E8E3] text-xs font-bold">
              <div>
                <span className="text-[10px] uppercase text-[#227B6B] font-black block mb-0.5">
                  PATIENT NAME
                </span>
                <span className="text-[#0E2924] font-black flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-[#227B6B]" />{' '}
                  {activeToken.patient_name || patientName}
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase text-[#227B6B] font-black block mb-0.5">
                  FACILITY
                </span>
                <span className="text-[#0E2924] font-black flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-[#227B6B]" /> Regal Hospital
                </span>
              </div>
            </div>

            {activeToken.reason && (
              <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-3.5 text-xs font-bold text-amber-950">
                <span className="text-[10px] uppercase text-amber-800 font-black flex items-center gap-1 mb-1">
                  <FileText className="h-3 w-3" /> Consultation Symptoms / Reason
                </span>
                <p>{activeToken.reason}</p>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between border-t border-[#EAF5F2] pt-4 text-xs font-bold text-[#0E2924] gap-2">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-[#227B6B]" /> {activeToken.appointment_date}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-[#227B6B]" /> {activeToken.slot_time}
                </span>
              </div>

              {activeToken.fee && (
                <span className="rounded-xl bg-[#113831] px-3.5 py-1 text-xs font-black text-white">
                  Fee: {activeToken.fee}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
