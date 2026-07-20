'use client';

import { useState } from 'react';
import { Columns2, Monitor, Radiation, ShieldCheck } from 'lucide-react';

import {
  MOCK_DICOM_SERIES,
  MOCK_DOSE_LOGS,
  MOCK_SAFETY_CHECKLISTS,
} from '../lib/radiologyMockData';
import { ModalityPill, RadPanel, SecureIdentityPlaceholder, StatusPill } from '../components/radiologyUi';

export default function PacsSafetyTab() {
  const [comparisonMode, setComparisonMode] = useState(false);
  const [activeSeries, setActiveSeries] = useState('ds2');

  const currentSeries = MOCK_DICOM_SERIES.find((s) => s.id === activeSeries) ?? MOCK_DICOM_SERIES[1];
  const priorSeries = MOCK_DICOM_SERIES.find((s) => s.id === 'ds4');

  return (
    <div className="grid grid-cols-1 gap-2 xl:grid-cols-2">
      <div className="space-y-2">
        <RadPanel
          title="PACS Image Viewer Frame"
          subtitle="Multi-series view · DICOM metadata · comparison canvas"
          icon={Monitor}
          dark
          headerRight={
            <button
              type="button"
              onClick={() => setComparisonMode((v) => !v)}
              className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[8px] font-bold uppercase ${
                comparisonMode ? 'bg-[#2563EB] text-white' : 'border border-slate-600 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Columns2 className="h-3 w-3" />
              {comparisonMode ? 'Comparison On' : 'Compare Prior'}
            </button>
          }
        >
          <SecureIdentityPlaceholder verified />

          <div className={`mt-2 grid gap-1.5 ${comparisonMode ? 'grid-cols-2' : 'grid-cols-1'}`}>
            <div className="relative aspect-[4/3] overflow-hidden rounded-md border border-slate-600 bg-black">
              <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
                <div className="flex h-full flex-col items-center justify-center p-4">
                  <div className="mb-2 h-32 w-32 rounded-full border-2 border-slate-600 bg-gradient-radial from-slate-700 to-black opacity-80" />
                  <p className="text-[9px] font-bold text-slate-400">Current Study — {currentSeries.description}</p>
                  <p className="mt-1 font-mono text-[8px] text-slate-500">
                    Series {currentSeries.seriesNumber} · {currentSeries.sliceCount} slices · {currentSeries.acquisitionTime}
                  </p>
                </div>
              </div>
              <div className="absolute left-1 top-1 rounded bg-black/70 px-1.5 py-0.5 font-mono text-[7px] text-emerald-400">
                W/L: 400/40 · Zoom 1.2x
              </div>
              <div className="absolute bottom-1 right-1 rounded bg-black/70 px-1.5 py-0.5 font-mono text-[7px] text-sky-400">
                {currentSeries.modality} · 512×512 · 1.0mm
              </div>
            </div>

            {comparisonMode && priorSeries && (
              <div className="relative aspect-[4/3] overflow-hidden rounded-md border border-amber-600/50 bg-black ring-1 ring-amber-500/30">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-amber-950/20 to-slate-900">
                  <div className="flex h-full flex-col items-center justify-center p-4">
                    <div className="mb-2 h-32 w-32 rounded-full border-2 border-amber-700/50 bg-gradient-radial from-slate-700 to-black opacity-70" />
                    <p className="text-[9px] font-bold text-amber-400">Prior Study — {priorSeries.description}</p>
                    <p className="mt-1 font-mono text-[8px] text-slate-500">
                      Series {priorSeries.seriesNumber} · {priorSeries.sliceCount} slices · {priorSeries.acquisitionTime}
                    </p>
                  </div>
                </div>
                <div className="absolute left-1 top-1 rounded bg-amber-900/80 px-1.5 py-0.5 text-[7px] font-bold uppercase text-amber-200">
                  Prior Comparison
                </div>
              </div>
            )}
          </div>

          <div className="mt-2 flex flex-wrap gap-1">
            {MOCK_DICOM_SERIES.filter((s) => s.id !== 'ds4').map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setActiveSeries(s.id)}
                className={`rounded border px-2 py-1 text-[8px] font-semibold ${
                  activeSeries === s.id
                    ? 'border-[#2563EB] bg-[#2563EB]/20 text-sky-300'
                    : 'border-slate-600 text-slate-400 hover:border-slate-500'
                }`}
              >
                S{s.seriesNumber}: {s.description.slice(0, 24)}…
              </button>
            ))}
          </div>

          <div className="mt-2 rounded-md border border-slate-700 bg-slate-900/50 p-2">
            <p className="mb-1 text-[8px] font-bold uppercase text-slate-400">DICOM Metadata</p>
            <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 font-mono text-[7px] text-slate-500">
              <span>Patient ID: [MASKED]</span>
              <span>Study UID: 1.2.840…604688119</span>
              <span>Accession: RAD-2026-5521</span>
              <span>Body Part: CHEST</span>
              <span>Protocol: PE Angiography</span>
              <span>Contrast: Iohexol 350 — 80mL</span>
            </div>
          </div>
        </RadPanel>
      </div>

      <div className="space-y-2">
        <RadPanel title="Patient Preparation & Safety Screening" subtitle="Pregnancy · contrast allergy · fasting verification" icon={ShieldCheck}>
          <SecureIdentityPlaceholder verified />
          <table className="mt-2 w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-[#F8FAFC]">
                {['Patient', 'Pregnancy', 'Contrast Allergy', 'Fasting', 'ID Check'].map((h) => (
                  <th key={h} className="px-1.5 py-1 text-[8px] font-bold uppercase text-slate-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MOCK_SAFETY_CHECKLISTS.map((sc) => (
                <tr key={sc.id} className="border-b border-slate-50 hover:bg-slate-50/80">
                  <td className="px-1.5 py-1">
                    <p className="text-[9px] font-semibold text-[#0F172A]">{sc.patientName}</p>
                    <p className="font-mono text-[7px] text-slate-500">{sc.uhid}</p>
                  </td>
                  <td className="px-1.5 py-1">
                    <StatusPill status={sc.pregnancyScreening} />
                  </td>
                  <td className="px-1.5 py-1">
                    <StatusPill status={sc.contrastAllergy} />
                  </td>
                  <td className="px-1.5 py-1">
                    <StatusPill status={sc.fastingStatus} />
                  </td>
                  <td className="px-1.5 py-1">
                    <span className="text-[8px] italic text-slate-500">[Identity Verification Checked/Masked for Security]</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </RadPanel>

        <RadPanel title="Radiation Dose Tracking" subtitle="CTDIvol · DLP · effective dose metrics log" icon={Radiation}>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-[#F8FAFC]">
                {['Patient', 'Study', 'Modality', 'CTDIvol', 'DLP', 'Eff. Dose', 'Time'].map((h) => (
                  <th key={h} className="px-1.5 py-1 text-[8px] font-bold uppercase text-slate-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MOCK_DOSE_LOGS.map((d) => (
                <tr key={d.id} className="border-b border-slate-50">
                  <td className="px-1.5 py-1 text-[9px] font-semibold">{d.patientName}</td>
                  <td className="max-w-[100px] truncate px-1.5 py-1 text-[8px] text-slate-600" title={d.study}>
                    {d.study}
                  </td>
                  <td className="px-1.5 py-1">
                    <ModalityPill modality={d.modality} />
                  </td>
                  <td className="px-1.5 py-1 font-mono text-[8px] tabular-nums text-slate-600">{d.ctdiVol}</td>
                  <td className="px-1.5 py-1 font-mono text-[8px] tabular-nums text-slate-600">{d.dlp}</td>
                  <td className="px-1.5 py-1 font-mono text-[8px] font-bold tabular-nums text-amber-700">{d.effectiveDose}</td>
                  <td className="px-1.5 py-1 text-[8px] text-slate-400">{d.timestamp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </RadPanel>
      </div>
    </div>
  );
}
