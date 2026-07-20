'use client';

import { useCallback, useMemo, useState } from 'react';
import {
  Activity,
  GitCompare,
  Layers,
  Radio,
  Scan,
  ScanLine,
  ShieldCheck,
} from 'lucide-react';

type Modality = 'X-ray' | 'CT' | 'MRI' | 'Ultrasound';

type ImagingOrder = {
  id: string;
  tokenId: string;
  patientInitials: string;
  modality: Modality;
  region: string;
  orderedAt: string;
  status: 'Scheduled' | 'In Progress' | 'Completed';
};

type PreviousScan = {
  id: string;
  studyId: string;
  examDate: string;
  modality: Modality;
  region: string;
  status: 'Final' | 'Preliminary' | 'Archived';
  findings: string;
};

type ViewerStudy = {
  studyId: string;
  label: string;
  modality: Modality;
  tokenId: string;
  patientInitials: string;
  region: string;
};

const ROUTING_SUMMARY =
  'Standalone imaging vault · modality routing · DICOM sandbox viewer · compare prior studies · 13 Jul 2026';

const PATIENT = {
  initials: 'P.N.',
  uhid: 'NX-2026-301882',
  tokenId: 'RAD-TOK-0412',
};

const MODALITY_ORDERS: Record<Modality, ImagingOrder[]> = {
  'X-ray': [
    {
      id: 'xr-1',
      tokenId: 'RAD-XR-2201',
      patientInitials: 'P.N.',
      modality: 'X-ray',
      region: 'Chest PA',
      orderedAt: '2026-07-13 09:10',
      status: 'In Progress',
    },
  ],
  CT: [
    {
      id: 'ct-1',
      tokenId: 'RAD-CT-1188',
      patientInitials: 'K.V.',
      modality: 'CT',
      region: 'Head · non-contrast',
      orderedAt: '2026-07-13 08:45',
      status: 'Scheduled',
    },
  ],
  MRI: [
    {
      id: 'mri-1',
      tokenId: 'RAD-MR-0903',
      patientInitials: 'R.S.',
      modality: 'MRI',
      region: 'Lumbar spine',
      orderedAt: '2026-07-12 16:20',
      status: 'Completed',
    },
  ],
  Ultrasound: [
    {
      id: 'us-1',
      tokenId: 'RAD-US-0441',
      patientInitials: 'P.N.',
      modality: 'Ultrasound',
      region: 'Abdomen · FAST',
      orderedAt: '2026-07-13 10:05',
      status: 'Scheduled',
    },
  ],
};

const PREVIOUS_SCANS: PreviousScan[] = [
  {
    id: 'scan-1',
    studyId: 'STU-2026-0312',
    examDate: '2026-03-12',
    modality: 'X-ray',
    region: 'Chest PA',
    status: 'Final',
    findings: 'No acute infiltrate · heart size within normal limits · sandbox read',
  },
  {
    id: 'scan-2',
    studyId: 'STU-2025-1104',
    examDate: '2025-11-04',
    modality: 'CT',
    region: 'Abdomen · contrast',
    status: 'Archived',
    findings: 'Unremarkable hepatobiliary study · no free fluid',
  },
  {
    id: 'scan-3',
    studyId: 'STU-2025-0802',
    examDate: '2025-08-02',
    modality: 'MRI',
    region: 'Brain',
    status: 'Final',
    findings: 'No acute intracranial abnormality · prior comparison available',
  },
  {
    id: 'scan-4',
    studyId: 'STU-2026-0108',
    examDate: '2026-01-08',
    modality: 'Ultrasound',
    region: 'Thyroid',
    status: 'Final',
    findings: 'Homogeneous thyroid parenchyma · no dominant nodule flagged',
  },
];

const MODALITY_ACTIONS: {
  modality: Modality;
  label: string;
  icon: typeof Activity;
}[] = [
  { modality: 'X-ray', label: 'Order X-ray', icon: ScanLine },
  { modality: 'CT', label: 'Order CT', icon: Layers },
  { modality: 'MRI', label: 'Order MRI', icon: Scan },
  { modality: 'Ultrasound', label: 'Order Ultrasound', icon: Radio },
];

const STATUS_STYLES: Record<PreviousScan['status'], string> = {
  Final: 'bg-emerald-100 text-emerald-950 border border-emerald-400 font-bold',
  Preliminary: 'bg-amber-100 text-amber-950 border border-amber-400 font-bold',
  Archived: 'bg-slate-100 text-slate-950 border border-slate-400 font-bold',
};

function createOrderId(): string {
  return `ord-${Date.now()}`;
}

function scanToViewerStudy(scan: PreviousScan): ViewerStudy {
  return {
    studyId: scan.studyId,
    label: `${scan.modality} · ${scan.region}`,
    modality: scan.modality,
    tokenId: PATIENT.tokenId,
    patientInitials: PATIENT.initials,
    region: scan.region,
  };
}

function ViewerPanel({
  study,
  slotLabel,
}: {
  study: ViewerStudy | null;
  slotLabel: string;
}) {
  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-xl border-2 border-slate-800 bg-slate-900">
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgb(148 163 184 / 0.35) 1px, transparent 1px), linear-gradient(to bottom, rgb(148 163 184 / 0.35) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
        aria-hidden
      />
      <div className="absolute inset-0 flex items-center justify-center" aria-hidden>
        <div className="h-full w-px bg-slate-500/60" />
      </div>
      <div className="absolute inset-0 flex items-center justify-center" aria-hidden>
        <div className="h-px w-full bg-slate-500/60" />
      </div>

      <div className="absolute left-3 top-3 rounded-md border border-slate-700 bg-slate-950/80 px-2 py-1 text-[10px] font-black uppercase text-slate-100">
        {slotLabel}
      </div>

      {study ? (
        <>
          <div className="absolute left-3 top-10 space-y-0.5 text-[10px] font-bold text-slate-200">
            <p>{study.patientInitials} · {study.tokenId}</p>
            <p className="font-mono text-slate-300">{study.studyId}</p>
            <p>{study.modality} · {study.region}</p>
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="rounded-lg border border-slate-600 bg-slate-950/70 px-4 py-2 text-xs font-black uppercase tracking-wider text-slate-100">
              DICOM Sandbox · {study.label}
            </p>
          </div>
        </>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            No study loaded
          </p>
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 border-t border-slate-700 bg-slate-950/90 px-3 py-2 text-[10px] font-bold text-slate-300">
        View Images · window/level simulated · read-only sandbox
      </div>
    </div>
  );
}

export default function RadiologyWorkspacePage() {
  const [orders, setOrders] = useState<Record<Modality, ImagingOrder[]>>(MODALITY_ORDERS);
  const [primaryStudy, setPrimaryStudy] = useState<ViewerStudy | null>({
    studyId: 'STU-2026-0312',
    label: 'X-ray · Chest PA',
    modality: 'X-ray',
    tokenId: PATIENT.tokenId,
    patientInitials: PATIENT.initials,
    region: 'Chest PA',
  });
  const [compareStudy, setCompareStudy] = useState<ViewerStudy | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [actionNote, setActionNote] = useState<string | null>(null);

  const allOrders = useMemo(
    () =>
      (Object.keys(orders) as Modality[]).flatMap((modality) => orders[modality]),
    [orders],
  );

  const showNotice = useCallback((message: string) => {
    setActionNote(message);
    window.setTimeout(() => setActionNote(null), 4500);
  }, []);

  const handleOrderModality = (modality: Modality) => {
    const tokenPrefix =
      modality === 'X-ray'
        ? 'RAD-XR'
        : modality === 'CT'
          ? 'RAD-CT'
          : modality === 'MRI'
            ? 'RAD-MR'
            : 'RAD-US';

    const newOrder: ImagingOrder = {
      id: createOrderId(),
      tokenId: `${tokenPrefix}-${Math.floor(1000 + Math.random() * 9000)}`,
      patientInitials: PATIENT.initials,
      modality,
      region: 'To be confirmed · sandbox',
      orderedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
      status: 'Scheduled',
    };

    setOrders((prev) => ({
      ...prev,
      [modality]: [newOrder, ...prev[modality]],
    }));
    showNotice(`${modality} requisition queued · ${newOrder.tokenId} · routing sandbox only`);
  };

  const loadScanForCompare = (scan: PreviousScan, asPrimary: boolean) => {
    const viewerStudy = scanToViewerStudy(scan);
    if (asPrimary || !compareMode) {
      setPrimaryStudy(viewerStudy);
      if (compareMode && compareStudy?.studyId === viewerStudy.studyId) {
        setCompareStudy(null);
      }
    } else {
      setCompareStudy(viewerStudy);
    }
    setCompareMode(true);
    showNotice(`Historical scan loaded · ${scan.studyId} · ${scan.modality} · side-by-side ready`);
  };

  const toggleCompareMode = () => {
    setCompareMode((prev) => {
      if (prev) setCompareStudy(null);
      return !prev;
    });
  };

  return (
    <div className="min-h-screen w-full font-sans text-slate-950 selection:bg-slate-200">
      <div className="w-full space-y-5 p-4 sm:p-6 lg:p-8">
        {/* Imaging header */}
        <header className="flex w-full flex-col gap-4 border-b-2 border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
              Radiology Imaging &amp; Requisition Vault
            </h1>
            <p className="mt-1 max-w-3xl text-sm font-medium leading-relaxed text-slate-800">
              {ROUTING_SUMMARY}
            </p>
            <p className="mt-2 font-mono text-xs font-black text-slate-950">
              Active routing · {allOrders.length} open requisitions · {PATIENT.initials} ·{' '}
              {PATIENT.uhid}
            </p>
          </div>
          <div className="inline-flex shrink-0 items-center gap-2 rounded-lg border-2 border-slate-200 bg-white px-3 py-2 text-xs font-black uppercase tracking-wide text-slate-950 shadow-sm">
            <ShieldCheck className="h-4 w-4 text-emerald-700" aria-hidden />
            <span>DICOM_VIEWER_READY</span>
          </div>
        </header>

        {actionNote && (
          <p
            role="status"
            className="w-full rounded-lg border-2 border-sky-300 bg-sky-50 px-4 py-2.5 text-sm font-bold text-sky-950"
          >
            {actionNote}
          </p>
        )}

        {/* Modality requisition deck */}
        <section aria-label="Modality requisition deck" className="w-full">
          <div className="grid w-full grid-cols-2 gap-3 lg:grid-cols-4">
            {MODALITY_ACTIONS.map(({ modality, label, icon: Icon }) => (
              <button
                key={modality}
                type="button"
                onClick={() => handleOrderModality(modality)}
                className="group flex flex-col items-start gap-3 rounded-xl border border-slate-200/80 bg-white shadow-[0_4px_16px_-4px_rgba(0,117,140,0.03)] p-4 text-left shadow-sm transition-all hover:scale-[1.02] hover:border-slate-300 hover:bg-slate-50"
              >
                <span className="rounded-lg border border-slate-200 bg-slate-50 p-2 text-slate-950 transition-colors group-hover:border-sky-300 group-hover:bg-sky-50 group-hover:text-sky-950">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <span className="text-sm font-black text-slate-950">{label}</span>
                <span className="text-[10px] font-bold text-slate-800">
                  {orders[modality].length} active order(s)
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* Split canvas workspace */}
        <div className="grid w-full grid-cols-1 gap-5 xl:grid-cols-2">
          {/* Left — DICOM viewer sandbox */}
          <section
            aria-label="Radiological DICOM viewer sandbox"
            className="w-full space-y-3 rounded-xl border border-slate-200/80 bg-white shadow-[0_4px_16px_-4px_rgba(0,117,140,0.03)] p-4 shadow-sm sm:p-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-base font-black text-slate-950">View Images</h2>
              <button
                type="button"
                onClick={toggleCompareMode}
                className={`inline-flex items-center gap-2 rounded-lg border-2 px-3 py-1.5 text-[10px] font-black uppercase tracking-wide ${
                  compareMode
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-200 bg-white text-slate-950 hover:bg-slate-50'
                }`}
              >
                <GitCompare className="h-3.5 w-3.5" aria-hidden />
                Compare Previous Scans
              </button>
            </div>

            {compareMode ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <ViewerPanel study={primaryStudy} slotLabel="Primary Study" />
                <ViewerPanel study={compareStudy} slotLabel="Comparison Study" />
              </div>
            ) : (
              <ViewerPanel study={primaryStudy} slotLabel="Active Viewport" />
            )}

            <div className="flex flex-wrap gap-2 rounded-lg border-2 border-slate-200 bg-slate-50 px-3 py-2 text-[10px] font-bold text-slate-800">
              <span>Patient · {PATIENT.initials}</span>
              <span>·</span>
              <span className="font-mono">{PATIENT.tokenId}</span>
              <span>·</span>
              <span>UHID {PATIENT.uhid}</span>
            </div>
          </section>

          {/* Right — reports & archive */}
          <section
            aria-label="Clinical documentation and archive"
            className="w-full space-y-4 rounded-xl border border-slate-200/80 bg-white shadow-[0_4px_16px_-4px_rgba(0,117,140,0.03)] p-4 shadow-sm sm:p-5"
          >
            <div>
              <h2 className="text-base font-black text-slate-950">View Reports</h2>
              <p className="text-xs font-medium text-slate-800">
                Prior study archive · pull historical scans into comparison viewport
              </p>
            </div>

            {primaryStudy && (
              <article className="rounded-lg border-2 border-slate-200 bg-slate-50 p-4">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-800">
                  Current Study Findings
                </p>
                <p className="mt-2 text-sm font-black text-slate-950">{primaryStudy.label}</p>
                <p className="mt-1 text-xs font-bold leading-relaxed text-slate-800">
                  {PREVIOUS_SCANS.find((s) => s.studyId === primaryStudy.studyId)?.findings ??
                    'Sandbox imaging read · no acute cardiopulmonary process · correlate clinically.'}
                </p>
              </article>
            )}

            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] border-collapse text-sm">
                <thead>
                  <tr className="border-b-2 border-slate-200 bg-slate-100">
                    <th className="px-3 py-2 text-left text-[10px] font-black uppercase text-slate-950">
                      Examination Date
                    </th>
                    <th className="px-3 py-2 text-left text-[10px] font-black uppercase text-slate-950">
                      Modality Class
                    </th>
                    <th className="px-3 py-2 text-left text-[10px] font-black uppercase text-slate-950">
                      Anatomical Region
                    </th>
                    <th className="px-3 py-2 text-left text-[10px] font-black uppercase text-slate-950">
                      Status
                    </th>
                    <th className="px-3 py-2 text-right text-[10px] font-black uppercase text-slate-950">
                      Compare
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {PREVIOUS_SCANS.map((scan) => (
                    <tr key={scan.id} className="border-b-2 border-slate-200">
                      <td className="px-3 py-2.5 font-mono text-xs font-black text-slate-950">
                        {scan.examDate}
                      </td>
                      <td className="px-3 py-2.5 font-black text-slate-950">{scan.modality}</td>
                      <td className="px-3 py-2.5 font-bold text-slate-950">{scan.region}</td>
                      <td className="px-3 py-2.5">
                        <span
                          className={`inline-flex rounded-md px-2 py-0.5 text-[10px] uppercase ${STATUS_STYLES[scan.status]}`}
                        >
                          {scan.status}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <div className="flex flex-wrap justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => loadScanForCompare(scan, true)}
                            className="text-[10px] font-black uppercase text-sky-800 hover:text-sky-950"
                          >
                            Load Primary
                          </button>
                          <span className="text-slate-400">|</span>
                          <button
                            type="button"
                            onClick={() => loadScanForCompare(scan, false)}
                            className="text-[10px] font-black uppercase text-slate-950 hover:text-slate-800"
                          >
                            Load Compare
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800">
              <Activity className="mr-1 inline h-4 w-4 text-slate-950" aria-hidden />
              Archive index · {PREVIOUS_SCANS.length} prior studies · isolated sandbox · no PACS
              integration
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
