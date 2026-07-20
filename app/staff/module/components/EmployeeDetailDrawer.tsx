'use client';

import { useState } from 'react';

import type { EmployeeRecord } from '../lib/staffMockData';
import { DrawerOverlay, SecureDocPlaceholder, StaffPanel, StatusPill, VerifiedPill } from './staffUi';

type EmployeeDetailDrawerProps = {
  employee: EmployeeRecord;
  onClose: () => void;
};

export default function EmployeeDetailDrawer({ employee, onClose }: EmployeeDetailDrawerProps) {
  const [tab, setTab] = useState<'details' | 'credentials' | 'performance'>('details');

  return (
    <DrawerOverlay
      title={employee.name}
      subtitle={`${employee.employeeCode} · ${employee.department} · ${employee.designation}`}
      onClose={onClose}
    >
      <div className="mb-3 flex gap-0.5 rounded-md border border-[#E2E8F0] bg-slate-50 p-0.5">
        {(
          [
            ['details', 'Employee Details'],
            ['credentials', 'Credentials & Licenses'],
            ['performance', 'Performance & Training'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`flex-1 rounded px-2 py-1 text-[9px] font-bold uppercase ${
              tab === id ? 'bg-[#0F172A] text-white' : 'text-slate-600 hover:bg-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'details' && (
        <div className="space-y-3">
          <StaffPanel title="Professional Profile">
            <dl className="grid grid-cols-2 gap-2 text-[10px]">
              <div><dt className="text-slate-400">Department</dt><dd className="font-semibold text-[#0F172A]">{employee.department}</dd></div>
              <div><dt className="text-slate-400">Designation</dt><dd className="font-semibold text-[#0F172A]">{employee.designation}</dd></div>
              <div><dt className="text-slate-400">Reporting Manager</dt><dd className="text-slate-700">{employee.reportingManager}</dd></div>
              <div><dt className="text-slate-400">Join Date</dt><dd className="text-slate-700">{employee.joinDate}</dd></div>
              <div><dt className="text-slate-400">Role</dt><dd className="text-[#2563EB]">{employee.role}</dd></div>
              <div><dt className="text-slate-400">Status</dt><dd><StatusPill status={employee.status} /></dd></div>
              <div><dt className="text-slate-400">Phone</dt><dd>{employee.phone}</dd></div>
              <div><dt className="text-slate-400">Email</dt><dd>{employee.email}</dd></div>
            </dl>
          </StaffPanel>
          <StaffPanel title="Emergency Contact">
            <p className="text-[10px] text-slate-700">{employee.emergencyContact}</p>
          </StaffPanel>
          <StaffPanel title="Employment Contract">
            <SecureDocPlaceholder label="Signed Employment Contract" verified={employee.contractVerified} />
          </StaffPanel>
        </div>
      )}

      {tab === 'credentials' && (
        <div className="space-y-3">
          {employee.medicalLicenseNo && (
            <StaffPanel title="Medical License">
              <SecureDocPlaceholder label="Medical Council Registration" verified={employee.licenseVerified} />
              <p className="mt-2 text-[10px] text-slate-600">
                Expiry: <span className={employee.medicalLicenseExpiry && new Date(employee.medicalLicenseExpiry) < new Date('2026-08-01') ? 'font-bold text-red-600' : 'font-semibold'}>{employee.medicalLicenseExpiry}</span>
              </p>
              {employee.licenseVerified && <div className="mt-2 flex justify-end"><VerifiedPill label="License Verified" /></div>}
            </StaffPanel>
          )}
          {employee.nursingRegistration && (
            <StaffPanel title="Nursing Registration">
              <SecureDocPlaceholder label="INC Nursing Registration" verified={employee.licenseVerified} />
              <p className="mt-2 text-[10px] font-bold text-red-600">Expiry alert: {employee.nursingExpiry} — renewal due within 30 days</p>
            </StaffPanel>
          )}
          {!employee.medicalLicenseNo && !employee.nursingRegistration && (
            <StaffPanel title="Identity & Compliance Documents">
              <SecureDocPlaceholder label="Government ID Verification" verified={employee.identityVerified} />
              <div className="mt-2"><SecureDocPlaceholder label="Background Check Report" verified={employee.identityVerified} /></div>
            </StaffPanel>
          )}
        </div>
      )}

      {tab === 'performance' && (
        <div className="space-y-3">
          <StaffPanel title="Appraisal Summary">
            <p className="text-[10px] text-slate-700">{employee.lastAppraisal}</p>
            <p className="mt-2 text-2xl font-bold text-[#2563EB]">{employee.kpiScore}<span className="text-sm font-normal text-slate-400">/100 KPI</span></p>
          </StaffPanel>
          <StaffPanel title="Mandatory Compliance Courses">
            <ul className="space-y-1.5">
              {employee.complianceCourses.map((c) => (
                <li key={c.name} className="flex items-center justify-between rounded border border-slate-100 px-2 py-1.5">
                  <span className="text-[10px] font-medium text-[#0F172A]">{c.name}</span>
                  <div className="flex items-center gap-2">
                    {c.dueDate && <span className="text-[8px] text-slate-400">Due {c.dueDate}</span>}
                    <StatusPill status={c.status} />
                  </div>
                </li>
              ))}
            </ul>
          </StaffPanel>
        </div>
      )}
    </DrawerOverlay>
  );
}
