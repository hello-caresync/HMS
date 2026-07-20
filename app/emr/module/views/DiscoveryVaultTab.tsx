'use client';

import { ChevronDown, ChevronRight, FolderTree, Monitor } from 'lucide-react';

import type { RecordDetail } from '../lib/emrMockData';
import { FOLDER_TREE } from '../lib/emrMockData';
import { EmrPanel, SecureIdentityPlaceholder, ViewOnlyBadge } from '../components/emrUi';

type DiscoveryVaultTabProps = {
  expandedCategories: Set<string>;
  selectedRecordId: string;
  recordDetail: RecordDetail;
  onToggleCategory: (id: string) => void;
  onSelectRecord: (recordId: string) => void;
};

export default function DiscoveryVaultTab({
  expandedCategories,
  selectedRecordId,
  recordDetail,
  onToggleCategory,
  onSelectRecord,
}: DiscoveryVaultTabProps) {
  return (
    <div className="grid grid-cols-1 gap-2 xl:grid-cols-12">
      <EmrPanel title="Historical Record Index" icon={FolderTree} subtitle="Nested directory — view-only folders" className="xl:col-span-4">
        <ul className="space-y-0.5">
          {FOLDER_TREE.map((cat) => {
            const expanded = expandedCategories.has(cat.id);
            return (
              <li key={cat.id}>
                <button
                  type="button"
                  onClick={() => onToggleCategory(cat.id)}
                  className="flex w-full items-center gap-1 rounded px-1.5 py-1 text-left hover:bg-slate-50"
                >
                  {expanded ? <ChevronDown className="h-3 w-3 text-slate-400" /> : <ChevronRight className="h-3 w-3 text-slate-400" />}
                  <span className="text-[10px] font-semibold text-[#0F172A]">{cat.label}</span>
                  <span className="ml-auto text-[8px] text-slate-400">{cat.count}</span>
                </button>
                {expanded && cat.children && (
                  <ul className="ml-4 border-l border-slate-100 pl-2">
                    {cat.children.map((child) => (
                      <li key={child.id}>
                        <button
                          type="button"
                          onClick={() => onSelectRecord(child.id)}
                          className={`w-full rounded px-1.5 py-1 text-left text-[9px] hover:bg-blue-50/50 ${
                            selectedRecordId === child.id ? 'bg-blue-50 font-semibold text-[#2563EB]' : 'text-slate-600'
                          }`}
                        >
                          {child.label}
                          <span className="block text-[7px] text-slate-400">{child.date}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </EmrPanel>

      <div className="space-y-2 xl:col-span-8">
        <EmrPanel
          title={recordDetail.title}
          subtitle="Immutable audited record panel"
          headerRight={<ViewOnlyBadge compact />}
        >
          <SecureIdentityPlaceholder verified />
          <p className="mt-2 rounded-md border border-dashed border-slate-200 bg-slate-50 px-2 py-1.5 text-[10px] italic text-slate-600">
            {recordDetail.summary}
          </p>
          <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-[9px]">
            <div><dt className="text-slate-400">Authored By</dt><dd className="font-medium">{recordDetail.authoredBy}</dd></div>
            <div><dt className="text-slate-400">Signed At</dt><dd>{recordDetail.signedAt}</dd></div>
          </dl>

          {recordDetail.diagnoses.length > 0 && (
            <div className="mt-2">
              <p className="mb-1 text-[8px] font-bold uppercase text-slate-500">Diagnoses</p>
              <ul className="space-y-0.5">
                {recordDetail.diagnoses.map((d) => (
                  <li key={d} className="rounded bg-[#F8FAFC] px-2 py-1 text-[9px] text-[#0F172A]">{d}</li>
                ))}
              </ul>
            </div>
          )}

          {recordDetail.chronicConditions.length > 0 && (
            <div className="mt-2">
              <p className="mb-1 text-[8px] font-bold uppercase text-slate-500">Chronic Conditions</p>
              <ul className="space-y-0.5">
                {recordDetail.chronicConditions.map((c) => (
                  <li key={c} className="text-[9px] text-slate-700">{c}</li>
                ))}
              </ul>
            </div>
          )}

          {recordDetail.surgeries.length > 0 && (
            <div className="mt-2">
              <p className="mb-1 text-[8px] font-bold uppercase text-slate-500">Surgery History</p>
              {recordDetail.surgeries.map((s) => (
                <p key={s} className="text-[9px] text-slate-700">{s}</p>
              ))}
            </div>
          )}

          {recordDetail.medications.length > 0 && (
            <div className="mt-2">
              <p className="mb-1 text-[8px] font-bold uppercase text-slate-500">Medication Reconciliation</p>
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100 bg-[#F8FAFC]">
                    {['Medicine', 'Dose', 'Status'].map((h) => (
                      <th key={h} className="px-1.5 py-1 text-[8px] font-bold uppercase text-slate-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recordDetail.medications.map((m) => (
                    <tr key={m.name} className="border-b border-slate-50">
                      <td className="px-1.5 py-1 text-[9px] font-semibold">{m.name}</td>
                      <td className="px-1.5 py-1 text-[9px]">{m.dose}</td>
                      <td className="px-1.5 py-1 text-[9px] text-emerald-700">{m.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {recordDetail.criticalValues.length > 0 && (
            <div className="mt-2">
              <p className="mb-1 text-[8px] font-bold uppercase text-slate-500">Critical Values</p>
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100 bg-[#F8FAFC]">
                    {['Test', 'Value', 'Flag'].map((h) => (
                      <th key={h} className="px-1.5 py-1 text-[8px] font-bold uppercase text-slate-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recordDetail.criticalValues.map((v) => (
                    <tr key={v.test} className="border-b border-slate-50">
                      <td className="px-1.5 py-1 text-[9px] font-semibold">{v.test}</td>
                      <td className="px-1.5 py-1 text-[9px] tabular-nums">{v.value}</td>
                      <td className={`px-1.5 py-1 text-[9px] font-bold ${v.flag === 'High' ? 'text-red-600' : 'text-emerald-600'}`}>{v.flag}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </EmrPanel>

        {selectedRecordId.startsWith('rad') && (
          <EmrPanel title="PACS Image Viewer" icon={Monitor} subtitle="Radiology imaging — view-only frame">
            <div className="flex h-32 items-center justify-center rounded-md border-2 border-dashed border-violet-200 bg-violet-50/50">
              <div className="text-center">
                <Monitor className="mx-auto mb-1 h-8 w-8 text-violet-400" />
                <p className="text-[10px] font-bold text-violet-800">PACS Viewer — Chest X-Ray PA</p>
                <p className="text-[8px] text-slate-500">[DICOM study masked for security — authenticated view only]</p>
                <ViewOnlyBadge compact />
              </div>
            </div>
          </EmrPanel>
        )}
      </div>
    </div>
  );
}
