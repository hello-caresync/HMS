'use client';

import type { RegistryTreeNodeId } from '../masterDataNav.types';
import {
  DIAGNOSIS_TEMPLATES,
  DOCTOR_MASTER,
  EMPLOYEE_MASTER,
  INSURANCE_TPA,
  INVENTORY_MASTER,
  LAB_MASTER,
  PATIENT_CONFIG,
  PHARMACY_MASTER,
  RADIOLOGY_MASTER,
  ROOM_BED_MASTER,
  SERVICE_CHARGE_MASTER,
  USER_ROLES,
  VENDOR_MASTER,
  formatInr,
  getRegistryTitle,
} from '../lib/masterDataMockData';
import { RecordStatusPill, SecureLicensePlaceholder } from './masterDataUi';

type RegistryTableCanvasProps = {
  nodeId: RegistryTreeNodeId;
  onAdvanceStatus?: (id: string) => void;
};

export function RegistryTableCanvas({ nodeId, onAdvanceStatus }: RegistryTableCanvasProps) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-bold text-[#0F172A]">{getRegistryTitle(nodeId)}</h3>
        <SecureLicensePlaceholder verified />
      </div>

      {nodeId === 'doctor-master' && (
        <table className="w-full min-w-[520px] text-left">
          <thead>
            <tr className="border-b border-slate-100 bg-[#F8FAFC]">
              {['Doctor', 'Department', 'Consult', 'Follow-up', 'Status'].map((h) => (
                <th key={h} className="px-1.5 py-1 text-[8px] font-bold uppercase text-slate-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DOCTOR_MASTER.map((d) => (
              <tr key={d.id} className="border-b border-slate-50 hover:bg-slate-50/80">
                <td className="px-1.5 py-1 text-[9px] font-semibold">{d.name}</td>
                <td className="px-1.5 py-1 text-[8px]">{d.department}</td>
                <td className="px-1.5 py-1 text-[9px] tabular-nums">{formatInr(d.consultationCharge)}</td>
                <td className="px-1.5 py-1 text-[9px] tabular-nums">{formatInr(d.followUpCharge)}</td>
                <td className="px-1.5 py-1">
                  <button type="button" onClick={() => onAdvanceStatus?.(d.id)} title="Validate status">
                    <RecordStatusPill status={d.status} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {nodeId === 'service-charge' && (
        <table className="w-full min-w-[620px] text-left">
          <thead>
            <tr className="border-b border-slate-100 bg-[#F8FAFC]">
              {['Code', 'Description', 'Base Price', 'Discount', 'Insurance', 'Status'].map((h) => (
                <th key={h} className="px-1.5 py-1 text-[8px] font-bold uppercase text-slate-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SERVICE_CHARGE_MASTER.map((s) => (
              <tr key={s.id} className="border-b border-slate-50 hover:bg-slate-50/80">
                <td className="px-1.5 py-1 font-mono text-[8px] font-bold text-[#2563EB]">{s.code}</td>
                <td className="px-1.5 py-1 text-[9px]">{s.description}</td>
                <td className="px-1.5 py-1 text-[9px] tabular-nums font-semibold">{formatInr(s.basePrice)}</td>
                <td className="px-1.5 py-1 text-[8px] text-emerald-700">{s.discount}</td>
                <td className="px-1.5 py-1 text-[8px] text-violet-700">{s.insurance}</td>
                <td className="px-1.5 py-1"><RecordStatusPill status={s.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {nodeId === 'room-bed' && (
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-100 bg-[#F8FAFC]">
              {['Ward', 'Room', 'Bed', 'Type', 'Daily Rate', 'Status'].map((h) => (
                <th key={h} className="px-1.5 py-1 text-[8px] font-bold uppercase text-slate-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROOM_BED_MASTER.map((r) => (
              <tr key={r.id} className="border-b border-slate-50">
                <td className="px-1.5 py-1 text-[9px]">{r.ward}</td>
                <td className="px-1.5 py-1 text-[8px]">{r.room}</td>
                <td className="px-1.5 py-1 text-[8px]">{r.bed}</td>
                <td className="px-1.5 py-1 text-[8px]">{r.bedType}</td>
                <td className="px-1.5 py-1 text-[9px] tabular-nums">{formatInr(r.dailyRate)}</td>
                <td className="px-1.5 py-1"><RecordStatusPill status={r.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {nodeId === 'lab-master' && (
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-100 bg-[#F8FAFC]">
              {['Code', 'Test', 'Sample', 'Normal Range', 'TAT', 'Status'].map((h) => (
                <th key={h} className="px-1.5 py-1 text-[8px] font-bold uppercase text-slate-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {LAB_MASTER.map((l) => (
              <tr key={l.id} className={`border-b border-slate-50 ${l.status === 'Pending' ? 'bg-amber-50/30' : ''}`}>
                <td className="px-1.5 py-1 font-mono text-[8px] font-bold">{l.testCode}</td>
                <td className="px-1.5 py-1 text-[9px] font-semibold">{l.testName}</td>
                <td className="px-1.5 py-1 text-[8px]">{l.sampleType}</td>
                <td className="px-1.5 py-1 text-[8px] text-slate-600">{l.normalRange}</td>
                <td className="px-1.5 py-1 text-[8px] tabular-nums">{l.tatHrs}h</td>
                <td className="px-1.5 py-1"><RecordStatusPill status={l.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {nodeId === 'pharmacy-master' && (
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-100 bg-[#F8FAFC]">
              {['Generic', 'Brand', 'Form', 'Strength', 'Reorder', 'Status'].map((h) => (
                <th key={h} className="px-1.5 py-1 text-[8px] font-bold uppercase text-slate-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PHARMACY_MASTER.map((p) => (
              <tr key={p.id} className="border-b border-slate-50">
                <td className="px-1.5 py-1 text-[9px] font-semibold">{p.generic}</td>
                <td className="px-1.5 py-1 text-[8px]">{p.brand}</td>
                <td className="px-1.5 py-1 text-[8px]">{p.dosageForm}</td>
                <td className="px-1.5 py-1 text-[8px]">{p.strength}</td>
                <td className="px-1.5 py-1 text-[8px] tabular-nums">{p.reorderLevel}</td>
                <td className="px-1.5 py-1"><RecordStatusPill status={p.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {nodeId === 'vendor-master' && (
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-100 bg-[#F8FAFC]">
              {['Vendor', 'Category', 'Compliance', 'Terms', 'Status'].map((h) => (
                <th key={h} className="px-1.5 py-1 text-[8px] font-bold uppercase text-slate-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {VENDOR_MASTER.map((v) => (
              <tr key={v.id} className={`border-b border-slate-50 ${!v.complianceVerified ? 'bg-amber-50/30' : ''}`}>
                <td className="px-1.5 py-1 text-[9px] font-semibold">{v.vendorName}</td>
                <td className="px-1.5 py-1 text-[8px]">{v.category}</td>
                <td className="px-1.5 py-1 text-[8px] italic">{v.complianceVerified ? '[Verified]' : '[Pending Verification]'}</td>
                <td className="px-1.5 py-1 text-[8px]">{v.paymentTerms}</td>
                <td className="px-1.5 py-1"><RecordStatusPill status={v.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {nodeId === 'employee-master' && (
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-100 bg-[#F8FAFC]">
              {['Name', 'Role', 'Shift', 'Department', 'Status'].map((h) => (
                <th key={h} className="px-1.5 py-1 text-[8px] font-bold uppercase text-slate-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {EMPLOYEE_MASTER.map((e) => (
              <tr key={e.id} className="border-b border-slate-50">
                <td className="px-1.5 py-1 text-[9px] font-semibold">{e.name}</td>
                <td className="px-1.5 py-1 text-[8px]">{e.role}</td>
                <td className="px-1.5 py-1 text-[8px]">{e.shift}</td>
                <td className="px-1.5 py-1 text-[8px]">{e.department}</td>
                <td className="px-1.5 py-1"><RecordStatusPill status={e.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {nodeId === 'user-roles' && (
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-100 bg-[#F8FAFC]">
              {['Role', 'Module Access', 'Users', 'Status'].map((h) => (
                <th key={h} className="px-1.5 py-1 text-[8px] font-bold uppercase text-slate-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {USER_ROLES.map((u) => (
              <tr key={u.id} className="border-b border-slate-50">
                <td className="px-1.5 py-1 text-[9px] font-semibold">{u.role}</td>
                <td className="px-1.5 py-1 text-[8px] text-slate-600">{u.modules}</td>
                <td className="px-1.5 py-1 text-[8px] tabular-nums">{u.users}</td>
                <td className="px-1.5 py-1"><RecordStatusPill status={u.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {nodeId === 'patient-config' && (
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-100 bg-[#F8FAFC]">
              {['Field', 'Configuration', 'Mandatory', 'Status'].map((h) => (
                <th key={h} className="px-1.5 py-1 text-[8px] font-bold uppercase text-slate-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PATIENT_CONFIG.map((p) => (
              <tr key={p.id} className="border-b border-slate-50">
                <td className="px-1.5 py-1 text-[9px] font-semibold">{p.field}</td>
                <td className="px-1.5 py-1 text-[8px] italic text-indigo-700">{p.value}</td>
                <td className="px-1.5 py-1 text-[8px]">{p.mandatory ? 'Yes' : 'No'}</td>
                <td className="px-1.5 py-1"><RecordStatusPill status={p.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {nodeId === 'diagnosis-templates' && (
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-100 bg-[#F8FAFC]">
              {['ICD Code', 'Description', 'Specialty', 'Status'].map((h) => (
                <th key={h} className="px-1.5 py-1 text-[8px] font-bold uppercase text-slate-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DIAGNOSIS_TEMPLATES.map((d) => (
              <tr key={d.id} className="border-b border-slate-50">
                <td className="px-1.5 py-1 font-mono text-[8px] font-bold">{d.icdCode}</td>
                <td className="px-1.5 py-1 text-[9px]">{d.description}</td>
                <td className="px-1.5 py-1 text-[8px]">{d.specialty}</td>
                <td className="px-1.5 py-1"><RecordStatusPill status={d.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {nodeId === 'radiology-master' && (
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-100 bg-[#F8FAFC]">
              {['Modality', 'Procedure', 'Charge Code', 'Base Price', 'Status'].map((h) => (
                <th key={h} className="px-1.5 py-1 text-[8px] font-bold uppercase text-slate-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {RADIOLOGY_MASTER.map((r) => (
              <tr key={r.id} className="border-b border-slate-50">
                <td className="px-1.5 py-1 text-[8px] font-bold">{r.modality}</td>
                <td className="px-1.5 py-1 text-[9px]">{r.procedure}</td>
                <td className="px-1.5 py-1 font-mono text-[8px]">{r.chargeCode}</td>
                <td className="px-1.5 py-1 text-[9px] tabular-nums">{formatInr(r.basePrice)}</td>
                <td className="px-1.5 py-1"><RecordStatusPill status={r.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {nodeId === 'inventory-master' && (
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-100 bg-[#F8FAFC]">
              {['SKU', 'Item', 'UOM', 'Category', 'Reorder', 'Status'].map((h) => (
                <th key={h} className="px-1.5 py-1 text-[8px] font-bold uppercase text-slate-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {INVENTORY_MASTER.map((i) => (
              <tr key={i.id} className="border-b border-slate-50">
                <td className="px-1.5 py-1 font-mono text-[8px]">{i.sku}</td>
                <td className="px-1.5 py-1 text-[9px] font-semibold">{i.item}</td>
                <td className="px-1.5 py-1 text-[8px]">{i.uom}</td>
                <td className="px-1.5 py-1 text-[8px]">{i.category}</td>
                <td className="px-1.5 py-1 text-[8px] tabular-nums">{i.reorder}</td>
                <td className="px-1.5 py-1"><RecordStatusPill status={i.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {nodeId === 'insurance-tpa' && (
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-100 bg-[#F8FAFC]">
              {['Payer', 'Package Code', 'Coverage', 'Status'].map((h) => (
                <th key={h} className="px-1.5 py-1 text-[8px] font-bold uppercase text-slate-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {INSURANCE_TPA.map((i) => (
              <tr key={i.id} className="border-b border-slate-50">
                <td className="px-1.5 py-1 text-[9px] font-semibold">{i.payer}</td>
                <td className="px-1.5 py-1 font-mono text-[8px]">{i.packageCode}</td>
                <td className="px-1.5 py-1 text-[8px]">{i.coverageType}</td>
                <td className="px-1.5 py-1"><RecordStatusPill status={i.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
