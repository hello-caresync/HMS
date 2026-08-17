'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { HospitalOpsShell } from '@/components/hospital-operations/HospitalOpsShell';
import { hospitalOpsClasses } from '@/lib/hospital/design-tokens';
import { postHospitalApi, getOpsSupabase } from '@/lib/hospital/operations/client-api';
import {
  admitOrTransferPatient,
  fetchBedCensus,
  summarizeBedCensus,
} from '@/lib/hospital/operations/ipd';
import type { HospitalBedRow } from '@/lib/hospital/operations/types';
import { useHospitalOpsRealtime } from '@/lib/hospital/operations/realtime';

export default function IpdBedCensusPage() {
  const [beds, setBeds] = useState<HospitalBedRow[]>([]);
  const [patientName, setPatientName] = useState('');
  const [selectedBed, setSelectedBed] = useState<string | null>(null);

  const load = useCallback(async () => {
    setBeds(await fetchBedCensus(getOpsSupabase()));
  }, []);

  useHospitalOpsRealtime(load);
  useEffect(() => {
    void load();
  }, [load]);

  const summary = summarizeBedCensus(beds);
  const wards = Array.from(new Set(beds.map((b) => b.ward)));

  const handleBedAction = async (bed: HospitalBedRow, action: 'admit' | 'discharge') => {
    try {
      if (action === 'admit') {
        if (!patientName.trim()) {
          toast.error('Enter patient name to admit');
          return;
        }
        await postHospitalApi(
          '/api/ipd/admit-transfer',
          { bedId: bed.id, patientName: patientName.trim(), action: 'admit' },
          () =>
            admitOrTransferPatient(getOpsSupabase(), {
              bedId: bed.id,
              patientName: patientName.trim(),
              action: 'admit',
            }),
        );
        toast.success(`${patientName} admitted to ${bed.ward} ${bed.bed_number}`);
        setPatientName('');
      } else {
        await postHospitalApi(
          '/api/ipd/admit-transfer',
          { bedId: bed.id, patientName: bed.patient_name ?? '', action: 'discharge' },
          () =>
            admitOrTransferPatient(getOpsSupabase(), {
              bedId: bed.id,
              patientName: bed.patient_name ?? '',
              action: 'discharge',
            }),
        );
        toast.success(`Bed ${bed.bed_number} discharged`);
      }
      void load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Bed action failed');
    }
  };

  return (
    <HospitalOpsShell
      title="Inpatient Department & Bed Census"
      subtitle="Ward grid with real-time is_occupied toggle · ICU · General · Private"
    >
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className={`${hospitalOpsClasses.surface} p-4`}>
          <p className="text-[10px] font-black uppercase text-[#52796F]">Total Beds</p>
          <p className="text-2xl font-black">{summary.total}</p>
        </div>
        <div className={`${hospitalOpsClasses.surface} p-4`}>
          <p className="text-[10px] font-black uppercase text-[#52796F]">Occupied</p>
          <p className="text-2xl font-black text-[#C94A29]">{summary.occupied}</p>
        </div>
        <div className={`${hospitalOpsClasses.surface} p-4`}>
          <p className="text-[10px] font-black uppercase text-[#52796F]">Available</p>
          <p className="text-2xl font-black text-[#52796F]">{summary.available}</p>
        </div>
      </div>

      <div className={`${hospitalOpsClasses.surface} p-4 mb-4 flex flex-wrap gap-2 items-end`}>
        <div className="flex-1 min-w-[200px]">
          <label className="text-[10px] font-black uppercase text-[#52796F]">Admit Patient</label>
          <input
            className={`${hospitalOpsClasses.input} mt-1`}
            placeholder="Patient full name"
            value={patientName}
            onChange={(e) => setPatientName(e.target.value)}
          />
        </div>
        <p className="text-[10px] text-[#84A98C] font-semibold pb-2">
          Select an available bed below to admit
        </p>
      </div>

      <div className="space-y-6">
        {wards.map((ward) => (
          <div key={ward}>
            <h2 className="text-sm font-black text-[#263238] mb-2">
              {ward}{' '}
              <span className="text-[#84A98C] font-semibold text-xs">
                ({summary.byWard[ward]?.occupied ?? 0}/{summary.byWard[ward]?.total ?? 0} occupied)
              </span>
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
              {beds
                .filter((b) => b.ward === ward)
                .map((bed, index) => {
                  const bedKey = bed.id || `${bed.ward}-${bed.bed_number}-${index}`;
                  const occupied = bed.is_occupied;
                  return (
                    <button
                      key={bedKey}
                      type="button"
                      onClick={() => setSelectedBed(bedKey)}
                      className={`rounded-xl border p-3 text-left transition ${
                        selectedBed === bedKey ? 'ring-2 ring-[#52796F]' : ''
                      } ${occupied ? 'border-[#C94A29]/40 bg-[#C94A29]/5' : 'border-[#CAD2C5] bg-white hover:border-[#52796F]'}`}
                    >
                      <p className="text-xs font-black">Bed {bed.bed_number}</p>
                      <p className="text-[10px] text-[#52796F] mt-1">
                        {occupied ? bed.patient_name ?? 'Occupied' : 'Available'}
                      </p>
                      <div className="mt-2">
                        {!occupied ? (
                          <button
                            type="button"
                            className={hospitalOpsClasses.btnPrimary}
                            onClick={(e) => {
                              e.stopPropagation();
                              void handleBedAction(bed, 'admit');
                            }}
                          >
                            Admit
                          </button>
                        ) : (
                          <button
                            type="button"
                            className={hospitalOpsClasses.btnSecondary}
                            onClick={(e) => {
                              e.stopPropagation();
                              void handleBedAction(bed, 'discharge');
                            }}
                          >
                            Discharge
                          </button>
                        )}
                      </div>
                    </button>
                  );
                })}
            </div>
          </div>
        ))}
      </div>
    </HospitalOpsShell>
  );
}
