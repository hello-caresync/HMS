'use client';

import { useState } from 'react';
import { Bot } from 'lucide-react';

import { runAiDifferential } from '@/lib/doctor/client/clinical-data-service';
import { usePatients } from '@/lib/doctor/hooks/useClinicalQueries';
import { MOCK_AI_DIFFERENTIALS } from '@/lib/mock-data';
import { OsBtn, OsPage, OsWidget } from '@/components/doctor-os/ui/OsPrimitives';

export default function DoctorOsAiAssistantPage() {
  const { data } = usePatients();
  const patient = data?.patients?.[0];
  const [complaint, setComplaint] = useState('Chest pain · exertional');
  const [results, setResults] = useState(MOCK_AI_DIFFERENTIALS);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true);
    try {
      const res = await runAiDifferential({ complaint, patientId: patient?.id, allergies: patient?.allergies });
      setResults(res.results);
    } finally {
      setLoading(false);
    }
  };

  return (
    <OsPage>
      <div className="mb-6">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[#A39E75]">AI Clinical Assistant</p>
        <h1 className="text-[24px] font-bold text-[#2B2A22]">Differential & decision support</h1>
      </div>
      <OsWidget title="Chief complaint" accent="ai">
        <textarea
          className="w-full rounded-xl border border-[#E6E3C5] p-3 text-[13px]"
          rows={3}
          value={complaint}
          onChange={(e) => setComplaint(e.target.value)}
        />
        <OsBtn className="mt-3" onClick={run} disabled={loading}>
          <Bot className="h-4 w-4" /> Run differential
        </OsBtn>
      </OsWidget>
      <OsWidget title="Suggested diagnoses" span={2}>
        <ul className="space-y-2">
          {results.map((r) => (
            <li key={r.diagnosis} className="flex justify-between rounded-lg bg-[#F7F6E8] px-3 py-2 text-[13px]">
              <span>{r.diagnosis}</span>
              <span className="font-bold text-[#A39E75]">{Math.round(r.confidence * 100)}%</span>
            </li>
          ))}
        </ul>
      </OsWidget>
    </OsPage>
  );
}
