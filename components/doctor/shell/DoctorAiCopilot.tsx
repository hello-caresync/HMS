'use client';

import { useState } from 'react';
import { Bot, X } from 'lucide-react';
import { toast } from 'sonner';

import { useDoctorShell } from '@/components/doctor/shell/DoctorShellContext';
import { usePatients } from '@/lib/doctor/hooks/useClinicalQueries';
import { runAiDifferential } from '@/lib/doctor/client/clinical-data-service';
import { MOCK_AI_DIFFERENTIALS } from '@/lib/mock-data';
import { sageUi } from '@/lib/doctor/ui-tokens';

type DiffResult = { diagnosis: string; confidence: number };

export default function DoctorAiCopilot() {
  const { aiOpen, setAiOpen } = useDoctorShell();
  const { data: patientsData } = usePatients();
  const patient = patientsData?.patients?.[0];
  const [complaint, setComplaint] = useState('Chest pain · diaphoresis · risk factors');
  const [diffs, setDiffs] = useState<DiffResult[]>(MOCK_AI_DIFFERENTIALS);
  const [loading, setLoading] = useState(false);

  const runDx = async () => {
    setLoading(true);
    try {
      const data = await runAiDifferential({
        complaint,
        vitals: 'BP 110/70 · HR 96',
        patientId: patient?.id,
        allergies: patient?.allergies,
      });
      setDiffs(data.results ?? MOCK_AI_DIFFERENTIALS);
      toast.success('AI differential updated');
    } catch {
      toast.error('AI engine unavailable');
    } finally {
      setLoading(false);
    }
  };

  if (!aiOpen) return null;

  return (
    <aside
      className="fixed bottom-4 right-4 z-[90] flex w-[min(420px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-[#C7C39E]/60 bg-[#FAFAF5]/95 shadow-2xl backdrop-blur-xl"
      aria-label="AI Clinical Copilot"
    >
      <div className="flex items-center justify-between border-b border-[#E6E3C5] bg-gradient-to-r from-[#A39E75]/20 to-transparent px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#A39E75] text-white">
            <Bot className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-bold text-[#2B2A22]">AI Clinical Copilot</p>
            <p className="text-[10px] text-[#5C5A4E]">Context-aware · {patient?.fullName ?? 'No patient'}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setAiOpen(false)}
          className="rounded-lg p-1.5 text-[#5C5A4E] hover:bg-[#E6E3C5]/50"
          aria-label="Close AI copilot"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="custom-scrollbar max-h-[min(480px,70vh)] space-y-3 overflow-y-auto p-4">
        <div className={`${sageUi.cardSolid} p-3`}>
          <p className="text-[10px] font-bold uppercase text-[#A39E75]">Clinical suggestion</p>
          <p className="mt-1 text-sm text-[#2B2A22]">
            Consider ACS pathway: ECG within 10 min, serial troponins, aspirin if not contraindicated.
          </p>
        </div>

        <label className="block text-xs font-semibold text-[#5C5A4E]">
          Chief complaint context
          <textarea
            value={complaint}
            onChange={(e) => setComplaint(e.target.value)}
            rows={2}
            className={`${sageUi.input} mt-1`}
          />
        </label>

        <button type="button" disabled={loading} onClick={runDx} className={`${sageUi.btnPrimary} w-full`}>
          {loading ? 'Analyzing…' : 'Refresh differential diagnosis'}
        </button>

        <ul className="space-y-2">
          {diffs.map((d) => (
            <li key={d.diagnosis} className={`${sageUi.cardSolid} flex items-center justify-between px-3 py-2`}>
              <span className="text-sm font-medium text-[#2B2A22]">{d.diagnosis}</span>
              <span className="rounded-full bg-[#A39E75]/15 px-2 py-0.5 text-xs font-bold text-[#A39E75]">
                {Math.round(d.confidence * 100)}%
              </span>
            </li>
          ))}
        </ul>

        <div className={`${sageUi.card} p-3 text-xs text-[#5C5A4E]`}>
          Voice-to-text, guideline lookup, and drug interaction checks available in Consultations workspace.
        </div>
      </div>
    </aside>
  );
}
