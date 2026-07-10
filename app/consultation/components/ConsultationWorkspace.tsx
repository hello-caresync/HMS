'use client';

import Link from 'next/link';
import { ArrowLeft, Lock, Stethoscope } from 'lucide-react';

import { useConsultation } from '../context/ConsultationProvider';
import { CLINICAL } from '../lib/theme';
import ConsultationActionBar from './ConsultationActionBar';
import EmrChartingWorkspace from './EmrChartingWorkspace';
import PatientIntakePanel from './PatientIntakePanel';

export default function ConsultationWorkspace() {
  const { encounter, isLocked } = useConsultation();

  return (
    <div className="min-h-screen pb-28 font-sans" style={{ backgroundColor: CLINICAL.canvas, color: CLINICAL.charcoal }}>
      {/* Header */}
      <header
        className="sticky top-0 z-30 flex h-12 items-center justify-between border-b px-4 shadow-sm"
        style={{ borderColor: CLINICAL.border, backgroundColor: CLINICAL.header }}
      >
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="rounded-lg p-1.5 transition hover:bg-white/80"
            style={{ color: CLINICAL.textSubtle }}
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex items-center gap-2">
            <span
              className="flex h-8 w-8 items-center justify-center rounded-lg shadow-sm"
              style={{ backgroundColor: CLINICAL.mintLight }}
            >
              <Stethoscope className="h-4 w-4" style={{ color: CLINICAL.mint }} strokeWidth={2.25} />
            </span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: CLINICAL.textSubtle }}>
                Module 4 · OPD Consultation Workbench
              </p>
              <h1 className="text-xs font-bold" style={{ color: CLINICAL.text }}>
                Clinical EMR · Live Session
              </h1>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isLocked && (
            <span
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-bold uppercase"
              style={{ backgroundColor: CLINICAL.mintSoft, color: CLINICAL.mint }}
            >
              <Lock className="h-3 w-3" />
              Signed & Locked
            </span>
          )}
          <span className="hidden font-mono text-[10px] sm:inline" style={{ color: CLINICAL.textSubtle }}>
            {encounter.id}
          </span>
        </div>
      </header>

      {/* Dual-panel workbench */}
      <div className="mx-auto grid max-w-[1600px] gap-3 p-3 lg:grid-cols-[300px_1fr] xl:grid-cols-[320px_1fr] xl:gap-4 xl:p-4">
        <div className="lg:sticky lg:top-14 lg:self-start">
          <PatientIntakePanel />
        </div>
        <EmrChartingWorkspace />
      </div>

      <ConsultationActionBar />
    </div>
  );
}
