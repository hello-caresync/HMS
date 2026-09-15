'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { RegalHospitalLogo } from '@/components/brand/RegalHospitalLogo';
import {
  Activity,
  AlertTriangle,
  ClipboardList,
  Loader2,
  PackageMinus,
  Pill,
  Plus,
  RefreshCw,
  Search,
  Timer,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

import {
  addFormularyMedicine,
  countTodayAppointments,
  dispensePrescription,
  fetchClinicalRecords,
  fetchFormularyMedicines,
  fetchInventoryTransactions,
  fetchPharmacyPrescriptions,
  isExpiringSoon,
  isLowStock,
  isOutOfStock,
  isSameLocalDay,
  type ClinicalRecord,
  type FormularyMedicine,
  type InventoryTransaction,
  type PharmacyPrescription,
} from '@/lib/hospital/records-pharmacy';
import { HOSPITAL_TENANT_ID } from '@/lib/regal/constants';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

type RecordChip = 'all' | 'today' | 'consultation' | 'prescription' | 'lab';
type RxTab = 'all' | 'new' | 'partially_dispensed' | 'dispensed';
type CommandFilter = 'none' | 'records-today' | 'pending-rx' | 'low-stock' | 'dispensed-today';

type FormularyDraftState = {
  name: string;
  sku: string;
  category: string;
  strength: string;
  unit: string;
  reorder_level: number;
  opening_stock: number;
  batch_number: string;
  expiry_date: string;
};

const EMPTY_DRAFT: FormularyDraftState = {
  name: '',
  sku: '',
  category: 'Medicine',
  strength: '',
  unit: 'strip',
  reorder_level: 10,
  opening_stock: 0,
  batch_number: '',
  expiry_date: '',
};

function formatClock(iso?: string | null): string {
  if (!iso) return '—';
  const value = new Date(iso);
  if (Number.isNaN(value.getTime())) return '—';
  return value.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function statusTone(status: string): string {
  const value = status.toLowerCase();
  if (value.includes('out')) return 'bg-rose-50 text-rose-700 border-rose-200';
  if (value.includes('low') || value.includes('partial') || value.includes('expir')) {
    return 'bg-amber-50 text-amber-700 border-amber-200';
  }
  if (value.includes('dispense') || value.includes('stock') || value.includes('complete')) {
    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  }
  return 'bg-slate-50 text-slate-600 border-slate-200';
}

function matchesRecordChip(record: ClinicalRecord, chip: RecordChip): boolean {
  if (chip === 'all') return true;
  if (chip === 'today') return isSameLocalDay(record.created_at);
  if (chip === 'consultation') return /consult/i.test(record.activity_type) || /consult/i.test(record.activity);
  if (chip === 'prescription') return /prescript/i.test(record.activity_type) || /prescrib/i.test(record.activity);
  if (chip === 'lab') return /lab/i.test(record.activity_type) || /lab/i.test(record.activity);
  return true;
}

export function RecordsPharmacyCommandCenter({
  hospitalId,
  hospitalName,
  onInventoryChanged,
  hideTitle = false,
}: {
  hospitalId: string;
  hospitalName: string;
  onInventoryChanged?: () => void;
  hideTitle?: boolean;
}) {
  const nodeId = hospitalId || HOSPITAL_TENANT_ID;
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [records, setRecords] = useState<ClinicalRecord[]>([]);
  const [prescriptions, setPrescriptions] = useState<PharmacyPrescription[]>([]);
  const [medicines, setMedicines] = useState<FormularyMedicine[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [appointmentsToday, setAppointmentsToday] = useState(0);
  const [commandFilter, setCommandFilter] = useState<CommandFilter>('none');
  const [recordChip, setRecordChip] = useState<RecordChip>('all');
  const [recordQuery, setRecordQuery] = useState('');
  const [rxTab, setRxTab] = useState<RxTab>('all');
  const [formularyQuery, setFormularyQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSavingMedicine, setIsSavingMedicine] = useState(false);
  const [draft, setDraft] = useState<FormularyDraftState>(EMPTY_DRAFT);
  const [dispenseRx, setDispenseRx] = useState<PharmacyPrescription | null>(null);
  const [dispenseQty, setDispenseQty] = useState<Record<string, number>>({});
  const [isDispensing, setIsDispensing] = useState(false);
  const [drawerRecord, setDrawerRecord] = useState<ClinicalRecord | null>(null);

  const loadAll = useCallback(
    async (silent = false) => {
      if (!supabase) return;
      if (!silent) setIsRefreshing(true);
      try {
        const [nextRecords, nextRx, nextMeds, nextTx, nextAppts] = await Promise.all([
          fetchClinicalRecords(supabase, nodeId),
          fetchPharmacyPrescriptions(supabase, nodeId),
          fetchFormularyMedicines(supabase, nodeId),
          fetchInventoryTransactions(supabase, nodeId),
          countTodayAppointments(supabase, nodeId),
        ]);
        setRecords(nextRecords);
        setPrescriptions(nextRx);
        setMedicines(nextMeds);
        setTransactions(nextTx);
        setAppointmentsToday(nextAppts);
        setLastUpdated(new Date());
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Unable to refresh pharmacy workspace');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [nodeId],
  );

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  useEffect(() => {
    if (!supabase) return;
    const channel = supabase
      .channel(`records_pharmacy_${nodeId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'clinical_medical_records', filter: `hospital_id=eq.${nodeId}` },
        () => void loadAll(true),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'hospital_clinical_records', filter: `hospital_id=eq.${nodeId}` },
        () => void loadAll(true),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'hospital_appointments', filter: `hospital_id=eq.${nodeId}` },
        () => void loadAll(true),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'hospital_prescriptions', filter: `hospital_id=eq.${nodeId}` },
        () => void loadAll(true),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'prescriptions', filter: `hospital_id=eq.${nodeId}` },
        () => void loadAll(true),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pharmacy_prescriptions', filter: `hospital_id=eq.${nodeId}` },
        () => void loadAll(true),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'medical_records', filter: `hospital_id=eq.${nodeId}` },
        () => void loadAll(true),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pharmacy_inventory', filter: `hospital_id=eq.${nodeId}` },
        () => {
          void loadAll(true);
          onInventoryChanged?.();
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'hospital_medicines', filter: `hospital_id=eq.${nodeId}` },
        () => {
          void loadAll(true);
          onInventoryChanged?.();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [loadAll, nodeId, onInventoryChanged]);

  useEffect(() => {
    if (commandFilter === 'records-today') setRecordChip('today');
    if (commandFilter === 'pending-rx') setRxTab('new');
    if (commandFilter === 'dispensed-today') setRxTab('dispensed');
  }, [commandFilter]);

  const recordsTodayCount = useMemo(
    () => Math.max(records.filter((row) => isSameLocalDay(row.created_at)).length, appointmentsToday),
    [appointmentsToday, records],
  );
  const pendingRxCount = useMemo(
    () => prescriptions.filter((row) => row.status === 'new' || row.status === 'partially_dispensed').length,
    [prescriptions],
  );
  const lowStockCount = useMemo(() => medicines.filter(isLowStock).length, [medicines]);
  const dispensedTodayCount = useMemo(
    () =>
      prescriptions.filter(
        (row) => row.status === 'dispensed' && isSameLocalDay(row.dispensed_at || row.created_at),
      ).length,
    [prescriptions],
  );

  const visibleRecords = useMemo(() => {
    const query = recordQuery.trim().toLowerCase();
    return records.filter((row) => {
      if (!matchesRecordChip(row, recordChip)) return false;
      if (commandFilter === 'records-today' && !isSameLocalDay(row.created_at)) return false;
      if (!query) return true;
      return (
        row.uhid.toLowerCase().includes(query) ||
        row.patient_name.toLowerCase().includes(query) ||
        row.activity.toLowerCase().includes(query) ||
        row.doctor_name.toLowerCase().includes(query)
      );
    });
  }, [commandFilter, recordChip, recordQuery, records]);

  const visiblePrescriptions = useMemo(() => {
    return prescriptions.filter((row) => {
      if (commandFilter === 'pending-rx') {
        return row.status === 'new' || row.status === 'partially_dispensed';
      }
      if (commandFilter === 'dispensed-today') {
        return row.status === 'dispensed' && isSameLocalDay(row.dispensed_at || row.created_at);
      }
      if (rxTab === 'all') return true;
      if (rxTab === 'new') return row.status === 'new';
      return row.status === rxTab;
    });
  }, [commandFilter, prescriptions, rxTab]);

  const visibleMedicines = useMemo(() => {
    const query = formularyQuery.trim().toLowerCase();
    return medicines.filter((row) => {
      if (commandFilter === 'low-stock' && !isLowStock(row) && !isOutOfStock(row)) return false;
      if (!query) return true;
      return (
        row.name.toLowerCase().includes(query) ||
        row.sku.toLowerCase().includes(query) ||
        row.category.toLowerCase().includes(query)
      );
    });
  }, [commandFilter, formularyQuery, medicines]);

  const alerts = useMemo(() => {
    const low = medicines.filter(isLowStock);
    const empty = medicines.filter(isOutOfStock);
    const expiring = medicines.filter((item) => isExpiringSoon(item));
    return { low, empty, expiring };
  }, [medicines]);

  const activityFeed = useMemo(() => {
    const clinical = records.map((row) => ({
      id: `rec-${row.id}`,
      at: row.created_at,
      title: row.activity,
      meta: [row.patient_name, row.doctor_name].filter(Boolean).join(' · '),
      tone: 'record' as const,
    }));
    const stock = transactions.map((row) => ({
      id: `txn-${row.id}`,
      at: row.created_at,
      title: row.notes || `${row.txn_type} ${row.medicine_name}`,
      meta: `${row.quantity > 0 ? '+' : ''}${row.quantity}${row.balance_after != null ? ` · bal ${row.balance_after}` : ''}`,
      tone: 'stock' as const,
    }));
    return [...clinical, ...stock]
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
      .slice(0, 12);
  }, [records, transactions]);

  const patientTimeline = useMemo(() => {
    if (!drawerRecord) return [];
    const key = drawerRecord.uhid || drawerRecord.patient_name;
    return records
      .filter((row) => (row.uhid && drawerRecord.uhid ? row.uhid === drawerRecord.uhid : row.patient_name === key))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [drawerRecord, records]);

  const openDispense = (rx: PharmacyPrescription) => {
    const next: Record<string, number> = {};
    for (const item of rx.items) {
      const remaining = Math.max(0, item.qty_required - item.qty_dispensed);
      const stock =
        medicines.find(
          (med) =>
            (item.medicine_id && med.id === item.medicine_id) ||
            med.name.toLowerCase() === item.medicine_name.toLowerCase(),
        )?.current_stock ?? 0;
      next[item.id] = Math.min(remaining, stock);
    }
    setDispenseQty(next);
    setDispenseRx(rx);
  };

  const handleAddMedicine = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!supabase || isSavingMedicine) return;
    setIsSavingMedicine(true);
    try {
      const result = await addFormularyMedicine(supabase, nodeId, draft, medicines);
      if (!result.ok) {
        toast.error(result.error || 'Could not add formulary item');
        return;
      }
      toast.success(`${draft.name.trim()} added to formulary`);
      setDraft(EMPTY_DRAFT);
      setShowAddModal(false);
      await loadAll(true);
      onInventoryChanged?.();
    } finally {
      setIsSavingMedicine(false);
    }
  };

  const handleDispense = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!supabase || !dispenseRx || isDispensing) return;

    for (const item of dispenseRx.items) {
      const qty = Number(dispenseQty[item.id] ?? 0);
      const stock =
        medicines.find(
          (med) =>
            (item.medicine_id && med.id === item.medicine_id) ||
            med.name.toLowerCase() === item.medicine_name.toLowerCase(),
        )?.current_stock ?? 0;
      if (qty > stock) {
        toast.error(`Cannot dispense ${qty} of ${item.medicine_name}. Available: ${stock}`);
        return;
      }
    }

    setIsDispensing(true);
    try {
      const result = await dispensePrescription(
        supabase,
        nodeId,
        dispenseRx.id,
        dispenseRx.items.map((item) => ({
          item_id: item.id,
          medicine_id: item.medicine_id,
          sku: item.sku,
          medicine_name: item.medicine_name,
          qty: Number(dispenseQty[item.id] ?? 0),
        })),
      );
      if (!result.ok) {
        toast.error(result.error || 'Dispense failed');
        return;
      }
      toast.success(`Prescription ${result.status === 'partially_dispensed' ? 'partially dispensed' : 'dispensed'}`);
      setDispenseRx(null);
      await loadAll(true);
      onInventoryChanged?.();
    } finally {
      setIsDispensing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-xs font-bold text-slate-500">
        <Loader2 className="mr-2 h-4 w-4 animate-spin text-cyan-700" />
        Loading Records &amp; Pharmacy…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!hideTitle ? (
      <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <RegalHospitalLogo heightClass="h-8" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black leading-tight text-slate-900">Records &amp; Pharmacy</h1>
              <span className="rounded border border-teal-200 bg-teal-50 px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-teal-700">
                {nodeId}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              Patient medical records, prescriptions, and pharmacy operations
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200/80 bg-slate-50 px-3 py-1.5 text-xs">
            <span className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
              LIVE SYNC
            </span>
            <span className="text-slate-300">|</span>
            <span className="font-mono text-[11px] text-slate-400">
              {lastUpdated ? formatClock(lastUpdated.toISOString()) : 'Just now'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => void loadAll()}
            disabled={isRefreshing}
            title="Refresh records"
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 p-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-60"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-teal-600 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            id: 'records-today' as const,
            label: 'Records Updated Today',
            value: recordsTodayCount,
            hint: 'Today’s appointments + clinical notes',
          },
          {
            id: 'pending-rx' as const,
            label: 'Pending Prescriptions',
            value: pendingRxCount,
            hint: 'New + partially dispensed',
          },
          {
            id: 'low-stock' as const,
            label: 'Low Stock Items',
            value: lowStockCount,
            hint: 'At or below reorder level',
          },
          {
            id: 'dispensed-today' as const,
            label: 'Dispensed Today',
            value: dispensedTodayCount,
            hint: 'Fulfilled prescriptions',
          },
        ].map((card) => (
          <button
            key={card.id}
            type="button"
            onClick={() => setCommandFilter((prev) => (prev === card.id ? 'none' : card.id))}
            className={`rounded-2xl border bg-white p-5 text-left ${
              commandFilter === card.id ? 'border-cyan-600 ring-2 ring-cyan-100' : 'border-slate-200'
            }`}
          >
            <div className="font-mono text-[11px] font-bold uppercase tracking-wider text-slate-400">{card.label}</div>
            <div className="mt-2 text-3xl font-black text-slate-900">{card.value}</div>
            <div className="mt-1 text-xs font-medium text-cyan-700">{card.hint}</div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[65fr_35fr]">
        <div className="space-y-5">
          <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h4 className="text-sm font-black text-slate-900">Recent Medical Records</h4>
                <p className="text-[11px] text-slate-500">Live searchable clinical timeline</p>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  value={recordQuery}
                  onChange={(e) => setRecordQuery(e.target.value)}
                  placeholder="UHID, patient, doctor"
                  className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-xs sm:w-56"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ['all', 'All'],
                  ['today', 'Today'],
                  ['consultation', 'Consultations'],
                  ['prescription', 'Prescriptions'],
                  ['lab', 'Lab Results'],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setRecordChip(id);
                    if (id !== 'today') setCommandFilter((prev) => (prev === 'records-today' ? 'none' : prev));
                  }}
                  className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase ${
                    recordChip === id ? 'border-cyan-600 bg-cyan-50 text-cyan-800' : 'border-slate-200 text-slate-500'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            {visibleRecords.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center">
                <ClipboardList className="mx-auto h-7 w-7 text-slate-300" />
                <p className="mt-2 text-xs font-bold text-slate-500">No clinical records for this filter</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-500">
                    <tr>
                      <th className="px-3 py-3">UHID</th>
                      <th className="px-3 py-3">Patient Name</th>
                      <th className="px-3 py-3">Activity</th>
                      <th className="px-3 py-3">Doctor</th>
                      <th className="px-3 py-3">Time</th>
                      <th className="px-3 py-3">Status</th>
                      <th className="px-3 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {visibleRecords.map((row) => (
                      <tr key={`${row.id}|${row.uhid}|${row.activity}|${row.created_at}`}>
                        <td className="px-3 py-3 font-mono font-bold">{row.uhid || '—'}</td>
                        <td className="px-3 py-3 font-bold">{row.patient_name}</td>
                        <td className="px-3 py-3 text-slate-600">{row.activity}</td>
                        <td className="px-3 py-3">{row.doctor_name || '—'}</td>
                        <td className="px-3 py-3 text-slate-500">{formatClock(row.created_at)}</td>
                        <td className="px-3 py-3">
                          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${statusTone(row.status)}`}>
                            {row.status}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => setDrawerRecord(row)}
                            className="text-[11px] font-bold text-cyan-700 hover:underline"
                          >
                            View Record
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
            <div>
              <h4 className="text-sm font-black text-slate-900">Pharmacy Prescription Queue</h4>
              <p className="text-[11px] text-slate-500">Dispense against live doctor prescriptions</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ['all', 'All'],
                  ['new', 'New'],
                  ['partially_dispensed', 'Partially Dispensed'],
                  ['dispensed', 'Dispensed'],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setRxTab(id);
                    setCommandFilter((prev) =>
                      prev === 'pending-rx' || prev === 'dispensed-today' ? 'none' : prev,
                    );
                  }}
                  className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase ${
                    rxTab === id ? 'border-cyan-600 bg-cyan-50 text-cyan-800' : 'border-slate-200 text-slate-500'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            {visiblePrescriptions.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center">
                <Pill className="mx-auto h-7 w-7 text-slate-300" />
                <p className="mt-2 text-xs font-bold text-slate-500">No prescriptions in this queue</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-500">
                    <tr>
                      <th className="px-3 py-3">UHID</th>
                      <th className="px-3 py-3">Patient</th>
                      <th className="px-3 py-3">Physician</th>
                      <th className="px-3 py-3">Meds</th>
                      <th className="px-3 py-3">Status</th>
                      <th className="px-3 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {visiblePrescriptions.map((rx) => (
                      <tr key={rx.id}>
                        <td className="px-3 py-3 font-mono font-bold">{rx.uhid || '—'}</td>
                        <td className="px-3 py-3 font-bold">{rx.patient_name}</td>
                        <td className="px-3 py-3">{rx.doctor_name}</td>
                        <td className="px-3 py-3 font-mono">{rx.items.length}</td>
                        <td className="px-3 py-3">
                          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${statusTone(rx.status)}`}>
                            {rx.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-right">
                          {rx.status === 'dispensed' ? (
                            <span className="text-[11px] font-bold text-slate-400">Fulfilled</span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => openDispense(rx)}
                              className="rounded-lg bg-cyan-700 px-2.5 py-1 text-[11px] font-bold text-white"
                            >
                              Dispense
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        <div className="space-y-5">
          <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
            <h4 className="text-sm font-black text-slate-900">Pharmacy Attention Alerts</h4>
            {alerts.empty.map((item) => (
              <div key={`out-${item.id}`} className="rounded-xl border border-rose-200 bg-rose-50 p-3">
                <div className="text-[10px] font-black uppercase text-rose-700">Out of Stock</div>
                <div className="mt-1 text-xs font-bold text-rose-900">{item.name}</div>
                <div className="text-[11px] text-rose-700">SKU {item.sku} · stock 0</div>
              </div>
            ))}
            {alerts.low.map((item) => (
              <div key={`low-${item.id}`} className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                <div className="text-[10px] font-black uppercase text-amber-700">Low Stock</div>
                <div className="mt-1 text-xs font-bold text-amber-900">{item.name}</div>
                <div className="text-[11px] text-amber-700">
                  {item.current_stock} left · reorder {item.reorder_level}
                </div>
              </div>
            ))}
            {alerts.expiring.map((item) => (
              <div key={`exp-${item.id}`} className="rounded-xl border border-orange-200 bg-orange-50 p-3">
                <div className="text-[10px] font-black uppercase text-orange-700">Expiring Soon</div>
                <div className="mt-1 text-xs font-bold text-orange-900">{item.name}</div>
                <div className="text-[11px] text-orange-700">Expiry {item.expiry_date}</div>
              </div>
            ))}
            {alerts.empty.length + alerts.low.length + alerts.expiring.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-400">
                No stock alerts for this node.
              </div>
            )}
          </section>

          <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-cyan-700" />
              <h4 className="text-sm font-black text-slate-900">Recent Activity Feed</h4>
            </div>
            {activityFeed.length === 0 ? (
              <p className="text-xs text-slate-400">Movements and clinical updates will appear here.</p>
            ) : (
              <ul className="space-y-3">
                {activityFeed.map((item) => (
                  <li key={item.id} className="border-l-2 border-slate-200 pl-3">
                    <div className="text-xs font-bold text-slate-800">{item.title}</div>
                    <div className="text-[11px] text-slate-500">{item.meta}</div>
                    <div className="text-[10px] text-slate-400">{formatClock(item.at)}</div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>

      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h4 className="text-sm font-black text-slate-900">Medicine Formulary</h4>
            <p className="text-[11px] text-slate-500">Searchable inventory with reorder and expiry controls</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                value={formularyQuery}
                onChange={(e) => setFormularyQuery(e.target.value)}
                placeholder="Name, SKU, category"
                className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-xs sm:w-52"
              />
            </div>
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-700 px-3.5 py-2 text-xs font-bold text-white"
            >
              <Plus className="h-3.5 w-3.5" /> Add Formulary Item
            </button>
          </div>
        </div>
        {visibleMedicines.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 p-10 text-center">
            <Pill className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-2 text-sm font-bold text-slate-700">Formulary empty</p>
            <p className="text-xs text-slate-400">Add the first medicine for {hospitalName}.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-3">Medicine Name</th>
                  <th className="px-3 py-3">SKU</th>
                  <th className="px-3 py-3">Category</th>
                  <th className="px-3 py-3">Stock Level</th>
                  <th className="px-3 py-3">Reorder Level</th>
                  <th className="px-3 py-3">Expiry Date</th>
                  <th className="px-3 py-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibleMedicines.map((item) => (
                  <tr key={item.id || item.sku}>
                    <td className="px-3 py-3 font-bold">{item.name}</td>
                    <td className="px-3 py-3 font-mono">{item.sku}</td>
                    <td className="px-3 py-3">{item.category}</td>
                    <td className="px-3 py-3 font-mono">{item.current_stock}</td>
                    <td className="px-3 py-3 font-mono">{item.reorder_level}</td>
                    <td className="px-3 py-3">{item.expiry_date || '—'}</td>
                    <td className="px-3 py-3 text-right">
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${statusTone(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {showAddModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <form
            onSubmit={(event) => void handleAddMedicine(event)}
            className="w-full max-w-lg space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Add Formulary Item</h3>
              <button type="button" disabled={isSavingMedicine} onClick={() => setShowAddModal(false)} className="text-slate-400">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <input
                required
                disabled={isSavingMedicine}
                value={draft.name}
                onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Medicine name"
                className="col-span-2 rounded-xl border border-slate-200 px-3 py-2.5"
              />
              <input
                required
                disabled={isSavingMedicine}
                value={draft.sku}
                onChange={(e) => setDraft((prev) => ({ ...prev, sku: e.target.value.toUpperCase() }))}
                placeholder="Unique SKU"
                className="rounded-xl border border-slate-200 px-3 py-2.5 font-mono"
              />
              <input
                disabled={isSavingMedicine}
                value={draft.category}
                onChange={(e) => setDraft((prev) => ({ ...prev, category: e.target.value }))}
                placeholder="Category"
                className="rounded-xl border border-slate-200 px-3 py-2.5"
              />
              <input
                disabled={isSavingMedicine}
                value={draft.strength}
                onChange={(e) => setDraft((prev) => ({ ...prev, strength: e.target.value }))}
                placeholder="Strength"
                className="rounded-xl border border-slate-200 px-3 py-2.5"
              />
              <input
                disabled={isSavingMedicine}
                value={draft.unit}
                onChange={(e) => setDraft((prev) => ({ ...prev, unit: e.target.value }))}
                placeholder="Unit"
                className="rounded-xl border border-slate-200 px-3 py-2.5"
              />
              <input
                type="number"
                min={0}
                disabled={isSavingMedicine}
                value={draft.reorder_level}
                onChange={(e) => setDraft((prev) => ({ ...prev, reorder_level: Number(e.target.value) }))}
                placeholder="Reorder level"
                className="rounded-xl border border-slate-200 px-3 py-2.5 font-mono"
              />
              <input
                type="number"
                min={0}
                disabled={isSavingMedicine}
                value={draft.opening_stock}
                onChange={(e) => setDraft((prev) => ({ ...prev, opening_stock: Number(e.target.value) }))}
                placeholder="Opening stock"
                className="rounded-xl border border-slate-200 px-3 py-2.5 font-mono"
              />
              <input
                disabled={isSavingMedicine}
                value={draft.batch_number}
                onChange={(e) => setDraft((prev) => ({ ...prev, batch_number: e.target.value }))}
                placeholder="Batch number"
                className="rounded-xl border border-slate-200 px-3 py-2.5"
              />
              <input
                type="date"
                disabled={isSavingMedicine}
                value={draft.expiry_date}
                onChange={(e) => setDraft((prev) => ({ ...prev, expiry_date: e.target.value }))}
                className="rounded-xl border border-slate-200 px-3 py-2.5"
              />
            </div>
            <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
              <button
                type="button"
                disabled={isSavingMedicine}
                onClick={() => setShowAddModal(false)}
                className="rounded-lg bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSavingMedicine}
                className="rounded-lg bg-emerald-600 px-5 py-2 text-xs font-semibold text-white disabled:opacity-60"
              >
                {isSavingMedicine ? 'Saving…' : '+ Add to Formulary'}
              </button>
            </div>
          </form>
        </div>
      )}

      {dispenseRx && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <form
            onSubmit={(event) => void handleDispense(event)}
            className="w-full max-w-2xl space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Dispense Prescription</h3>
                <p className="text-[11px] text-slate-500">
                  {dispenseRx.patient_name} · {dispenseRx.uhid || 'No UHID'} · {dispenseRx.doctor_name}
                </p>
              </div>
              <button type="button" disabled={isDispensing} onClick={() => setDispenseRx(null)} className="text-slate-400">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3">
              {dispenseRx.items.map((item) => {
                const stock =
                  medicines.find(
                    (med) =>
                      (item.medicine_id && med.id === item.medicine_id) ||
                      med.name.toLowerCase() === item.medicine_name.toLowerCase(),
                  )?.current_stock ?? 0;
                const remaining = Math.max(0, item.qty_required - item.qty_dispensed);
                const qty = Number(dispenseQty[item.id] ?? 0);
                return (
                  <div key={item.id} className="rounded-2xl border border-slate-200 p-3 text-xs">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-bold text-slate-900">{item.medicine_name}</div>
                        <div className="text-[11px] text-slate-500">
                          {item.dosage || 'Dose n/a'} · {item.frequency || 'Frequency n/a'} · SKU {item.sku || '—'}
                        </div>
                        <div className="mt-1 text-[11px] text-slate-500">
                          Required {item.qty_required} · already {item.qty_dispensed} · available {stock}
                        </div>
                      </div>
                      <input
                        type="number"
                        min={0}
                        max={Math.min(remaining, stock)}
                        disabled={isDispensing || stock <= 0}
                        value={qty}
                        onChange={(e) =>
                          setDispenseQty((prev) => ({
                            ...prev,
                            [item.id]: Math.min(Math.max(0, Number(e.target.value) || 0), Math.min(remaining, stock)),
                          }))
                        }
                        className="w-20 rounded-xl border border-slate-200 px-2 py-2 font-mono"
                      />
                    </div>
                    {stock <= 0 && (
                      <div className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-rose-600">
                        <PackageMinus className="h-3.5 w-3.5" /> Out of stock — cannot dispense
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
              <button
                type="button"
                disabled={isDispensing}
                onClick={() => setDispenseRx(null)}
                className="rounded-lg bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isDispensing}
                className="rounded-lg bg-cyan-700 px-5 py-2 text-xs font-semibold text-white disabled:opacity-60"
              >
                {isDispensing ? 'Dispensing…' : 'Confirm Dispense'}
              </button>
            </div>
          </form>
        </div>
      )}

      {drawerRecord && (
        <div className="fixed inset-0 z-[70] flex justify-end bg-slate-950/40">
          <button type="button" className="h-full flex-1" aria-label="Close record drawer" onClick={() => setDrawerRecord(null)} />
          <aside className="flex h-full w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 p-5">
              <div>
                <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Clinical Timeline</div>
                <h3 className="mt-1 text-sm font-black text-slate-900">{drawerRecord.patient_name}</h3>
                <p className="font-mono text-[11px] text-slate-500">{drawerRecord.uhid || 'No UHID'}</p>
              </div>
              <button type="button" onClick={() => setDrawerRecord(null)} className="text-slate-400">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto p-5">
              <div className="rounded-2xl border border-slate-200 p-3">
                <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Doctor notes</div>
                <p className="mt-2 text-xs text-slate-800">
                  {drawerRecord.clinical_notes || drawerRecord.diagnosis || drawerRecord.activity || 'No notes recorded'}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 p-3">
                <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Vitals</div>
                {Object.keys(drawerRecord.vitals ?? {}).length === 0 ? (
                  <p className="mt-2 text-xs text-slate-500">No vitals captured</p>
                ) : (
                  <dl className="mt-2 grid grid-cols-2 gap-2 text-xs">
                    {Object.entries(drawerRecord.vitals ?? {}).map(([key, value]) => (
                      <div key={key}>
                        <dt className="text-[10px] font-bold uppercase text-slate-400">{key}</dt>
                        <dd className="font-bold text-slate-800">{String(value)}</dd>
                      </div>
                    ))}
                  </dl>
                )}
              </div>
              <div className="rounded-2xl border border-slate-200 p-3">
                <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Prescribed medications</div>
                {(drawerRecord.medications ?? []).length === 0 ? (
                  <p className="mt-2 text-xs text-slate-500">No medications on this record</p>
                ) : (
                  <ul className="mt-2 space-y-1.5 text-xs">
                    {(drawerRecord.medications ?? []).map((med) => (
                      <li key={med.name} className="rounded-xl bg-slate-50 px-3 py-2">
                        <span className="font-bold">{med.name}</span>
                        <span className="text-slate-500"> · {med.dosage || 'dose n/a'} · {med.frequency || 'freq n/a'}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {patientTimeline.map((row) => (
                <div key={row.id} className="rounded-2xl border border-slate-200 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${statusTone(row.activity_type)}`}>
                      {row.activity_type}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] text-slate-400">
                      <Timer className="h-3 w-3" />
                      {formatClock(row.created_at)}
                    </span>
                  </div>
                  <p className="mt-2 text-xs font-bold text-slate-800">{row.activity}</p>
                  <p className="mt-1 text-[11px] text-slate-500">{row.doctor_name || 'Clinical desk'}</p>
                </div>
              ))}
            </div>
          </aside>
        </div>
      )}

      {commandFilter !== 'none' && (
        <div className="fixed bottom-5 right-5 z-30 hidden items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-bold text-amber-800 shadow-sm lg:flex">
          <AlertTriangle className="h-3.5 w-3.5" />
          KPI filter active
          <button type="button" onClick={() => setCommandFilter('none')} className="underline">
            Clear
          </button>
        </div>
      )}
    </div>
  );
}
