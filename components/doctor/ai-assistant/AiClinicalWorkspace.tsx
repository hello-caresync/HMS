'use client';

import { useState } from 'react';
import { toast } from 'sonner';

import { ClinicalPageSkeleton } from '@/components/doctor/ClinicalSkeleton';
import { ClinicalPageHeader } from '@/components/doctor/doctor-ui';
import { usePatients } from '@/lib/doctor/hooks/useClinicalQueries';
import { runAiDifferential } from '@/lib/doctor/client/clinical-data-service';
import { clinicalClasses } from '@/lib/doctor/theme';
import { MOCK_GUIDELINES } from '@/lib/mock-data';

type DiffResult = { diagnosis: string; confidence: number };

export default function AiClinicalWorkspace() {
  const { data: patientsData } = usePatients();
  const patient = patientsData?.patients?.[0];
  const [complaint, setComplaint] = useState('Chest pain · diaphoresis');
  const [vitals, setVitals] = useState('BP 110/70 · HR 96 · SpO₂ 97%');
  const [diffs, setDiffs] = useState<DiffResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [calc, setCalc] = useState('bmi');
  const [guideQuery, setGuideQuery] = useState('');
  const [drugQuery, setDrugQuery] = useState('');
  const [calcVals, setCalcVals] = useState<Record<string, string>>({});

  const runDx = async () => {
    setLoading(true);
    try {
      const data = await runAiDifferential({
        complaint,
        vitals,
        patientId: patient?.id,
        allergies: patient?.allergies,
      });
      setDiffs(data.results ?? []);
      toast.success('Differential engine updated from clinical context');
    } catch {
      toast.error('AI engine unavailable');
    } finally {
      setLoading(false);
    }
  };

  const calcResult = () => {
    if (calc === 'bmi') {
      const w = parseFloat(calcVals.weight ?? '0');
      const h = parseFloat(calcVals.height ?? '170') / 100;
      return w && h ? (w / (h * h)).toFixed(1) : '—';
    }
    if (calc === 'map') {
      const sbp = parseFloat(calcVals.sbp ?? '0');
      const dbp = parseFloat(calcVals.dbp ?? '0');
      return sbp && dbp ? String(Math.round(dbp + (sbp - dbp) / 3)) : '—';
    }
    return '—';
  };

  const filteredGuides = MOCK_GUIDELINES.filter(
    (g) => g.title.toLowerCase().includes(guideQuery.toLowerCase()) || g.topic.toLowerCase().includes(guideQuery.toLowerCase()),
  );

  if (!patient) return <ClinicalPageSkeleton rows={3} />;

  return (
    <div className={clinicalClasses.pageBg}>
      <ClinicalPageHeader title="AI Clinical Assistant" subtitle={`Context: ${patient.fullName} · ${patient.mrn}`} />

      <div className="grid gap-4 lg:grid-cols-2">
        <section className={`${clinicalClasses.card} p-4`}>
          <h3 className="font-semibold">Differential diagnosis</h3>
          <textarea value={complaint} onChange={(e) => setComplaint(e.target.value)} rows={2} className="mt-2 w-full rounded-lg border px-3 py-2 text-sm" />
          <input value={vitals} onChange={(e) => setVitals(e.target.value)} className="mt-2 w-full rounded-lg border px-3 py-2 text-sm" />
          <button type="button" disabled={loading} className={`mt-2 ${clinicalClasses.btnPrimary}`} onClick={runDx}>
            {loading ? 'Analyzing…' : 'Generate ranked differentials'}
          </button>
          <ul className="mt-3 space-y-2">
            {diffs.map((d) => (
              <li key={d.diagnosis} className="flex justify-between rounded-lg bg-[#F8FAFC] px-3 py-2 text-sm">
                <span>{d.diagnosis}</span>
                <span className="font-bold text-[#0D9488]">{Math.round(d.confidence * 100)}%</span>
              </li>
            ))}
          </ul>
        </section>

        <section className={`${clinicalClasses.card} p-4`}>
          <h3 className="font-semibold">Clinical calculators</h3>
          <select value={calc} onChange={(e) => setCalc(e.target.value)} className="mt-2 w-full rounded-lg border px-3 py-2 text-sm">
            <option value="bmi">BMI</option>
            <option value="map">MAP</option>
          </select>
          <div className="mt-2 space-y-2">
            <input placeholder="Value A" className="w-full rounded border px-2 py-1 text-sm" onChange={(e) => setCalcVals((v) => ({ ...v, weight: e.target.value, sbp: e.target.value }))} />
            <input placeholder="Value B" className="w-full rounded border px-2 py-1 text-sm" onChange={(e) => setCalcVals((v) => ({ ...v, height: e.target.value, dbp: e.target.value }))} />
            <p className="font-bold text-[#0D9488]">Result: {calcResult()}</p>
          </div>
        </section>

        <section className={`${clinicalClasses.card} p-4 lg:col-span-2`}>
          <h3 className="font-semibold">Guidelines & interactions</h3>
          <div className="mt-2 grid gap-2 md:grid-cols-2">
            <input value={guideQuery} onChange={(e) => setGuideQuery(e.target.value)} placeholder="Guidelines…" className="rounded-lg border px-3 py-2 text-sm" />
            <input value={drugQuery} onChange={(e) => setDrugQuery(e.target.value)} placeholder="Drug pair…" className="rounded-lg border px-3 py-2 text-sm" />
          </div>
          {drugQuery.toLowerCase().includes('warfarin') && drugQuery.toLowerCase().includes('aspirin') && (
            <p className="mt-2 rounded-lg bg-red-50 p-2 text-sm font-semibold text-[#EF4444]">Major bleeding risk · check formulary interactions table</p>
          )}
          <ul className="mt-3 space-y-2">
            {filteredGuides.map((g) => (
              <li key={g.id} className="rounded-lg border px-3 py-2 text-sm">
                <p className="font-semibold">{g.title}</p>
                <p className="text-[#64748B]">{g.topic}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
