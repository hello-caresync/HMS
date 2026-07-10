'use client';

import { useCallback, useState } from 'react';
import { FileUp, Upload, X } from 'lucide-react';

import { useRadiology } from '../context/RadiologyProvider';
import type { RadiologyOrder } from '../types';
import { viewerTypeForModality } from '../types';
import MockScanViewer from './MockScanViewer';

type UploadScanModalProps = {
  order: RadiologyOrder | null;
  open: boolean;
  onClose: () => void;
};

export default function UploadScanModal({ order, open, onClose }: UploadScanModalProps) {
  const { uploadScan } = useRadiology();
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [uploaded, setUploaded] = useState(false);

  const handleClose = () => {
    setFileName(null);
    setUploaded(false);
    setDragOver(false);
    onClose();
  };

  const simulateUpload = useCallback(
    (name: string) => {
      if (!order) return;
      setFileName(name);
      uploadScan(order.id, name);
      setUploaded(true);
    },
    [order, uploadScan],
  );

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) simulateUpload(file.name);
  };

  if (!open || !order) return null;

  const viewerType = viewerTypeForModality(order.modality);

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" onClick={handleClose} aria-hidden />
      <div className="fixed inset-4 z-50 mx-auto flex max-w-4xl flex-col overflow-hidden rounded-xl border border-slate-700 bg-[#111820] shadow-2xl lg:inset-auto lg:left-1/2 lg:top-1/2 lg:max-h-[90vh] lg:w-full lg:-translate-x-1/2 lg:-translate-y-1/2">
        <header className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
          <div>
            <h2 className="text-sm font-bold text-white">Upload Scan Diagnostics</h2>
            <p className="text-[11px] text-slate-800">
              {order.patientName} · {order.uhid} · {order.scanDetails}
            </p>
          </div>
          <button type="button" onClick={handleClose} className="rounded p-1 text-slate-800 hover:bg-slate-800 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="grid flex-1 gap-4 overflow-y-auto p-4 lg:grid-cols-2">
          {/* Drop zone */}
          <div>
            {!uploaded ? (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-12 transition ${
                  dragOver
                    ? 'border-cyan-500 bg-cyan-950/30'
                    : 'border-slate-600 bg-slate-900/50 hover:border-slate-500'
                }`}
              >
                <Upload className="mb-3 h-10 w-10 text-slate-800" />
                <p className="text-sm font-medium text-slate-900">Drag & drop DICOM / study files</p>
                <p className="mt-1 text-[11px] text-slate-800">or click to browse (simulated)</p>
                <button
                  type="button"
                  onClick={() =>
                    simulateUpload(
                      `${order.modality.replace(/\s/g, '_')}_${order.uhid.replace(/-/g, '')}.dcm`,
                    )
                  }
                  className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-cyan-700 px-4 py-2 text-xs font-semibold text-white hover:bg-cyan-600"
                >
                  <FileUp className="h-4 w-4" />
                  Simulate Upload
                </button>
              </div>
            ) : (
              <div className="rounded-xl border border-emerald-800 bg-emerald-950/40 px-4 py-3 text-sm text-emerald-300">
                ✓ Uploaded: <span className="font-mono">{fileName}</span>
                <p className="mt-1 text-[11px] text-emerald-500">Status → Ready for Interpretation</p>
              </div>
            )}
          </div>

          {/* Mock viewer preview */}
          <MockScanViewer
            type={uploaded ? viewerType : 'generic'}
            label={`${order.modality} Preview`}
            fileName={fileName ?? undefined}
          />
        </div>

        <footer className="border-t border-slate-800 px-4 py-3">
          <button
            type="button"
            onClick={handleClose}
            className="w-full rounded-lg bg-slate-700 py-2 text-xs font-semibold text-white hover:bg-slate-600"
          >
            {uploaded ? 'Close & Return to Queue' : 'Cancel'}
          </button>
        </footer>
      </div>
    </>
  );
}
