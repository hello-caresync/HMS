'use client';

import { AlertTriangle, CheckCircle2, Info, Lock, Unlock } from 'lucide-react';

import { useSettings } from '../context/SettingsProvider';
import { PERMISSION_DEFINITIONS } from '../types';

export default function RbacMatrixPanel() {
  const {
    roles,
    permissions,
    permissionsLocked,
    togglePermission,
    saveAccessPolicies,
    unlockAccessPolicies,
  } = useSettings();

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded border border-slate-200 bg-white px-3 py-2 shadow-sm">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-800">
            RBAC Matrix
          </p>
          <p className="text-[11px] font-bold text-slate-900">
            Role-Based Access Control · Permission Grid
          </p>
        </div>
        <div className="flex items-center gap-2">
          {permissionsLocked ? (
            <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-800 ring-1 ring-slate-200">
              <Lock className="h-3 w-3" />
              Locked
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-800 ring-1 ring-amber-200">
              <Unlock className="h-3 w-3" />
              Editing
            </span>
          )}
          {permissionsLocked ? (
            <button
              type="button"
              onClick={unlockAccessPolicies}
              className="rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-[10px] font-bold text-slate-900 hover:bg-slate-50"
            >
              Unlock Matrix
            </button>
          ) : (
            <button
              type="button"
              onClick={saveAccessPolicies}
              className="rounded-md bg-slate-800 px-3 py-1.5 text-[10px] font-bold text-white hover:bg-slate-900"
            >
              Save Access Policies
            </button>
          )}
        </div>
      </div>

      {!permissionsLocked && (
        <div className="flex items-center gap-2 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-[10px] text-amber-800">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          Matrix is unlocked. Sensitive permissions are highlighted. Save to lock and enforce.
        </div>
      )}

      <div className="overflow-x-auto rounded border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[720px] border-collapse text-[11px]">
          <thead>
            <tr className="border-b-2 border-slate-200 bg-slate-100">
              <th className="sticky left-0 z-10 border-r border-slate-200 bg-slate-100 px-3 py-2 text-left font-black uppercase tracking-wider text-slate-950">
                System Role
              </th>
              {PERMISSION_DEFINITIONS.map((p) => (
                <th
                  key={p.key}
                  className={`px-2 py-2 text-center font-black uppercase tracking-wider ${
                    p.sensitive ? 'text-rose-600' : 'text-slate-800'
                  }`}
                >
                  <span className="block max-w-[72px] leading-tight">{p.label}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {roles.map((role, i) => (
              <tr
                key={role.id}
                className={`border-b-2 border-slate-200 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}
              >
                <td className="sticky left-0 z-10 border-r border-slate-200 bg-inherit px-3 py-2">
                  <p className="font-bold text-slate-800">{role.name}</p>
                  <p className="text-[9px] text-slate-800">{role.description}</p>
                </td>
                {PERMISSION_DEFINITIONS.map((p) => {
                  const granted = permissions[role.id]?.[p.key] ?? false;
                  return (
                    <td key={p.key} className="px-2 py-2 text-center">
                      <label
                        className={`inline-flex h-7 w-7 items-center justify-center rounded border transition ${
                          permissionsLocked
                            ? 'cursor-not-allowed opacity-80'
                            : 'cursor-pointer hover:border-slate-400'
                        } ${
                          granted
                            ? p.sensitive
                              ? 'border-rose-400 bg-rose-50'
                              : 'border-emerald-400 bg-emerald-50'
                            : 'border-slate-200 bg-white'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={granted}
                          disabled={permissionsLocked}
                          onChange={() => togglePermission(role.id, p.key)}
                          className="sr-only"
                          aria-label={`${role.name} — ${p.label}`}
                        />
                        {granted && (
                          <CheckCircle2
                            className={`h-3.5 w-3.5 ${p.sensitive ? 'text-rose-600' : 'text-emerald-600'}`}
                          />
                        )}
                      </label>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="flex items-center gap-1.5 text-[10px] text-slate-800">
        <Info className="h-3 w-3" />
        Red-highlighted columns denote sensitive permissions requiring administrator approval.
      </p>
    </div>
  );
}
