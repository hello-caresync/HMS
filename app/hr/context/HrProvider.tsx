'use client';

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

import {
  PENDING_LEAVE_REQUESTS,
  SEED_EMPLOYEES,
  SEED_ROTA,
  SHIFT_OVERLAP_COUNT,
} from '../lib/seedHr';
import type {
  AttendanceRecord,
  Employee,
  HrTab,
  PayrollDisbursementPayload,
  PayrollLine,
  WeeklyRotaEntry,
  WorkforceMetrics,
} from '../types';
import {
  computeNetPayable,
  evaluateClockIn,
  generatePayrollRunId,
  scheduledStartForShift,
} from '../types';

type HrContextValue = {
  activeTab: HrTab;
  setActiveTab: (tab: HrTab) => void;
  employees: Employee[];
  rota: WeeklyRotaEntry[];
  attendance: Record<string, AttendanceRecord>;
  metrics: WorkforceMetrics;
  payrollLines: PayrollLine[];
  payrollLocked: boolean;
  disbursementPayload: PayrollDisbursementPayload | null;
  selectedEmployeeId: string | null;
  setSelectedEmployeeId: (id: string | null) => void;
  attendanceTerminalEnabled: boolean;
  setAttendanceTerminalEnabled: (v: boolean) => void;
  clockIn: (employeeId: string) => { success: boolean; flag?: AttendanceRecord['flag'] };
  clockOut: (employeeId: string) => void;
  approveAndRunPayroll: () => PayrollDisbursementPayload;
  getTodayShift: (employeeId: string) => import('../types').ShiftBlock;
};

const HrContext = createContext<HrContextValue | null>(null);

function todayDayKey(): import('../types').DayKey {
  const d = new Date().getDay();
  const map: import('../types').DayKey[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  return map[d] ?? 'mon';
}

export function HrProvider({ children }: { children: React.ReactNode }) {
  const [activeTab, setActiveTab] = useState<HrTab>('directory');
  const [employees] = useState<Employee[]>(SEED_EMPLOYEES);
  const [rota] = useState<WeeklyRotaEntry[]>(SEED_ROTA);
  const [attendance, setAttendance] = useState<Record<string, AttendanceRecord>>({});
  const [payrollLocked, setPayrollLocked] = useState(false);
  const [disbursementPayload, setDisbursementPayload] =
    useState<PayrollDisbursementPayload | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(SEED_EMPLOYEES[0]?.id ?? null);
  const [attendanceTerminalEnabled, setAttendanceTerminalEnabled] = useState(false);

  const getTodayShift = useCallback(
    (employeeId: string) => {
      const entry = rota.find((r) => r.employeeId === employeeId);
      const day = todayDayKey();
      return entry?.days[day] ?? 'Unassigned';
    },
    [rota],
  );

  const metrics = useMemo<WorkforceMetrics>(() => ({
    totalActiveStaff: employees.filter((e) => e.status !== 'On Leave').length,
    staffOnDutyNow: employees.filter((e) => e.status === 'On Duty').length,
    pendingLeaveRequests: PENDING_LEAVE_REQUESTS,
    upcomingShiftOverlaps: SHIFT_OVERLAP_COUNT,
  }), [employees]);

  const payrollLines = useMemo<PayrollLine[]>(
    () =>
      employees.map((emp) => ({
        employeeId: emp.id,
        employeeName: emp.name,
        baseSalary: emp.baseSalary,
        shiftsCompleted: emp.shiftsCompleted,
        lopDays: emp.lopDays,
        bonusModifierPct: emp.bonusModifierPct,
        taxDeductions: emp.taxDeductions,
        netPayable: computeNetPayable(emp),
      })),
    [employees],
  );

  const clockIn = useCallback(
    (employeeId: string) => {
      const shift = getTodayShift(employeeId);
      if (shift === 'Weekly Off' || shift === 'Unassigned') {
        return { success: false };
      }
      const scheduledStartHour = scheduledStartForShift(shift);
      const now = new Date();
      const flag = evaluateClockIn(scheduledStartHour, now);

      setAttendance((prev) => ({
        ...prev,
        [employeeId]: {
          employeeId,
          clockIn: now.toISOString(),
          scheduledStartHour,
          flag,
        },
      }));

      return { success: true, flag };
    },
    [getTodayShift],
  );

  const clockOut = useCallback((employeeId: string) => {
    setAttendance((prev) => {
      const existing = prev[employeeId];
      if (!existing?.clockIn) return prev;
      return {
        ...prev,
        [employeeId]: { ...existing, clockOut: new Date().toISOString() },
      };
    });
  }, []);

  const approveAndRunPayroll = useCallback(() => {
    const period = 'July 2026';
    const payload: PayrollDisbursementPayload = {
      runId: generatePayrollRunId(),
      period,
      lockedAt: new Date().toISOString(),
      currency: 'INR',
      totalDisbursed: payrollLines.reduce((s, l) => s + l.netPayable, 0),
      employeeCount: payrollLines.length,
      disbursements: payrollLines.map((line, i) => {
        const emp = employees.find((e) => e.id === line.employeeId)!;
        return {
          staffId: emp.staffId,
          name: line.employeeName,
          netPayable: line.netPayable,
          accountRef: `NEX-PAY-${emp.staffId.slice(-4)}-${1000 + i}`,
        };
      }),
    };
    setPayrollLocked(true);
    setDisbursementPayload(payload);
    return payload;
  }, [payrollLines, employees]);

  const value = useMemo(
    () => ({
      activeTab,
      setActiveTab,
      employees,
      rota,
      attendance,
      metrics,
      payrollLines,
      payrollLocked,
      disbursementPayload,
      selectedEmployeeId,
      setSelectedEmployeeId,
      attendanceTerminalEnabled,
      setAttendanceTerminalEnabled,
      clockIn,
      clockOut,
      approveAndRunPayroll,
      getTodayShift,
    }),
    [
      activeTab,
      employees,
      rota,
      attendance,
      metrics,
      payrollLines,
      payrollLocked,
      disbursementPayload,
      selectedEmployeeId,
      attendanceTerminalEnabled,
      clockIn,
      clockOut,
      approveAndRunPayroll,
      getTodayShift,
    ],
  );

  return <HrContext.Provider value={value}>{children}</HrContext.Provider>;
}

export function useHr(): HrContextValue {
  const ctx = useContext(HrContext);
  if (!ctx) throw new Error('useHr must be used within HrProvider');
  return ctx;
}
