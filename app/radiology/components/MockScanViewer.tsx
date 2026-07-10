'use client';

import { Maximize2, Scan } from 'lucide-react';

import type { ViewerType } from '../types';

type MockScanViewerProps = {
  type: ViewerType;
  label?: string;
  fileName?: string;
  className?: string;
};

/** Dark PACS-style mock viewer with modality-specific placeholder graphics */
export default function MockScanViewer({ type, label, fileName, className = '' }: MockScanViewerProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-lg border border-slate-700 bg-[#0a0e14] ${className}`}
    >
      {/* Viewer chrome */}
      <div className="flex items-center justify-between border-b border-slate-800 bg-[#111820] px-2 py-1">
        <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-slate-800">
          <Scan className="h-3 w-3" />
          {label ?? 'DICOM Viewer'}
        </span>
        <button type="button" className="rounded p-0.5 text-slate-800 hover:text-slate-900" aria-label="Fullscreen">
          <Maximize2 className="h-3 w-3" />
        </button>
      </div>

      {/* Scan canvas */}
      <div className="relative aspect-[4/3] w-full bg-[#05080c]">
        {type === 'chest-xray' && <ChestXrayPlaceholder />}
        {type === 'brain-mri' && <BrainMriPlaceholder />}
        {type === 'generic' && <GenericScanPlaceholder />}

        {/* Crosshair overlay */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-20">
          <div className="h-px w-full bg-cyan-400" />
        </div>
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-20">
          <div className="h-full w-px bg-cyan-400" />
        </div>

        {/* Corner metadata */}
        <div className="absolute left-2 top-2 font-mono text-[9px] text-cyan-400/80">
          WW: 400 · WL: 40
        </div>
        <div className="absolute bottom-2 right-2 font-mono text-[9px] text-slate-800">
          {fileName ?? 'NO IMAGE LOADED'}
        </div>
      </div>
    </div>
  );
}

function ChestXrayPlaceholder() {
  return (
    <svg viewBox="0 0 400 300" className="h-full w-full" aria-hidden>
      <defs>
        <radialGradient id="cxr-glow" cx="50%" cy="45%" r="50%">
          <stop offset="0%" stopColor="#1a2530" />
          <stop offset="100%" stopColor="#05080c" />
        </radialGradient>
      </defs>
      <rect width="400" height="300" fill="url(#cxr-glow)" />
      {/* Rib cage outline */}
      <ellipse cx="200" cy="150" rx="120" ry="130" fill="none" stroke="#2a3a4a" strokeWidth="1.5" opacity="0.6" />
      {/* Lungs */}
      <ellipse cx="140" cy="155" rx="55" ry="90" fill="#152028" stroke="#3a5060" strokeWidth="1" opacity="0.8" />
      <ellipse cx="260" cy="155" rx="55" ry="90" fill="#152028" stroke="#3a5060" strokeWidth="1" opacity="0.8" />
      {/* Heart shadow */}
      <ellipse cx="175" cy="170" rx="30" ry="40" fill="#0d1520" stroke="#2a4050" strokeWidth="0.8" opacity="0.7" />
      {/* Clavicles */}
      <path d="M80 80 Q140 60 200 75 Q260 60 320 80" fill="none" stroke="#3a5060" strokeWidth="1.2" opacity="0.5" />
      <text x="200" y="280" textAnchor="middle" fill="#4a6080" fontSize="10" fontFamily="monospace">
        CHEST PA — SIMULATED
      </text>
    </svg>
  );
}

function BrainMriPlaceholder() {
  return (
    <svg viewBox="0 0 400 300" className="h-full w-full" aria-hidden>
      <rect width="400" height="300" fill="#050810" />
      {/* Skull outline */}
      <ellipse cx="200" cy="150" rx="100" ry="115" fill="#101820" stroke="#2a4060" strokeWidth="1.5" />
      {/* Brain hemispheres */}
      <ellipse cx="165" cy="145" rx="55" ry="75" fill="#0a1525" stroke="#305070" strokeWidth="0.8" />
      <ellipse cx="235" cy="145" rx="55" ry="75" fill="#0a1525" stroke="#305070" strokeWidth="0.8" />
      {/* Ventricles */}
      <path d="M190 130 L200 160 L210 130 Z" fill="#152535" stroke="#406080" strokeWidth="0.6" />
      {/* Bright lesion dot (mock finding) */}
      <circle cx="220" cy="120" r="8" fill="#6080a0" opacity="0.5" />
      <text x="200" y="280" textAnchor="middle" fill="#4a6080" fontSize="10" fontFamily="monospace">
        BRAIN MRI T2 — SIMULATED
      </text>
    </svg>
  );
}

function GenericScanPlaceholder() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2">
      <Scan className="h-12 w-12 text-slate-900" />
      <p className="font-mono text-[10px] text-slate-800">SCAN PREVIEW</p>
    </div>
  );
}
