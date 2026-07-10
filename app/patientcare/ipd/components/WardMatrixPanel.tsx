'use client';

import { DIET_TAG_STYLES, type IpdWardAssignment, type IpdWardBed } from '../../../lib/patientcare';

type WardMatrixPanelProps = {
  ward: IpdWardAssignment;
  selectedBedId: string | null;
  onSelectBed: (bed: IpdWardBed) => void;
};

export default function WardMatrixPanel({
  ward,
  selectedBedId,
  onSelectBed,
}: WardMatrixPanelProps) {
  return (
    <div className="rounded-xl border border-slate-300 bg-white shadow-sm">
      <div className="border-b-2 border-slate-200 bg-slate-50 px-4 py-2.5">
        <h2 className="text-sm font-black text-slate-900">Ward Matrix</h2>
        <p className="text-[10px] text-slate-800">{ward.wardName}</p>
      </div>

      <div className="grid grid-cols-2 gap-2 p-3">
        {ward.beds.map((bed) => {
          const selected = selectedBedId === bed.bedId;
          const vacant = bed.occupancy === 'vacant';

          return (
            <button
              key={bed.bedId}
              type="button"
              disabled={vacant}
              onClick={() => onSelectBed(bed)}
              className={`rounded-lg border-2 p-2.5 text-left text-xs transition ${
                vacant
                  ? 'cursor-not-allowed border-slate-200 bg-slate-50 text-slate-800'
                  : selected
                    ? 'border-sky-500 bg-sky-50 ring-2 ring-sky-200'
                    : 'border-amber-300 bg-amber-50/80 hover:border-amber-400'
              }`}
            >
              <span className="font-mono text-[10px] font-black">{bed.label}</span>
              {vacant ? (
                <p className="mt-1 text-[9px] font-bold uppercase text-slate-800">Vacant</p>
              ) : (
                <>
                  <p className="mt-1 truncate font-bold text-slate-900">{bed.patientName}</p>
                  <p className="font-mono text-[9px] text-slate-800">{bed.patientUhid}</p>
                  {bed.dietTag && (
                    <span
                      className={`mt-1.5 inline-flex rounded px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide ring-1 ${DIET_TAG_STYLES[bed.dietTag]}`}
                    >
                      {bed.dietTag}
                    </span>
                  )}
                </>
              )}
            </button>
          );
        })}
      </div>

      <div className="border-t border-slate-200 px-3 py-2 text-[10px] text-slate-800">
        {ward.beds.filter((b) => b.occupancy === 'occupied').length} / {ward.beds.length} beds
        occupied
      </div>
    </div>
  );
}
