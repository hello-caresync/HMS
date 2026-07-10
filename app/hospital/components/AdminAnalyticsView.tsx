'use client';

import React from 'react';

import { DepartmentBudget, RolePermissions } from '../types/procurement';
import {
  alertWarningClassName,
  bodyTextClassName,
  featureHeaderClassName,
  monoDataClassName,
  overlineClassName,
  panelClassName,
  workspaceClassName,
} from './hospitalUi';

type AdminAnalyticsViewProps = {
  budgets: DepartmentBudget[];
  totalSpend: number;
  permissions: RolePermissions;
};

export default function AdminAnalyticsView({
  budgets,
  totalSpend,
  permissions,
}: AdminAnalyticsViewProps) {
  if (!permissions.canViewAnalytics) {
    return (
      <div className={workspaceClassName}>
        <p className={alertWarningClassName}>
          Financial analytics restricted to Admin, Finance, and Procurement roles.
        </p>
      </div>
    );
  }

  const burnAlerts = budgets.filter(
    (b) => b.consumedBudget / b.allocatedBudget > 0.8,
  ).length;

  return (
    <div className={workspaceClassName}>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className={panelClassName}>
          <span className={overlineClassName}>Total spend</span>
          <p className={`text-2xl ${monoDataClassName}`}>
            ₹{totalSpend.toLocaleString('en-IN')}
          </p>
        </div>
        <div className={panelClassName}>
          <span className={overlineClassName}>Departments</span>
          <p className={`text-2xl ${monoDataClassName} text-[#A65E53]`}>
            {budgets.length}
          </p>
        </div>
        <div className={panelClassName}>
          <span className={overlineClassName}>Burn alerts</span>
          <p className={`text-2xl ${monoDataClassName} text-[#A65E53]`}>
            {burnAlerts}
          </p>
        </div>
      </div>

      {budgets.map((budget) => {
        const utilization = Math.round(
          (budget.consumedBudget / budget.allocatedBudget) * 100,
        );

        return (
          <article key={budget.departmentId} className={`${panelClassName} space-y-4`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h4 className={featureHeaderClassName}>{budget.departmentName}</h4>
              <span className={`text-sm ${monoDataClassName} text-[#A65E53]`}>
                {utilization}% utilized
              </span>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full transition-all ${utilization > 80 ? 'bg-[#D48D82]' : 'bg-[#E0A89F]'}`}
                style={{ width: `${Math.min(utilization, 100)}%` }}
              />
            </div>

            <div className="flex flex-wrap justify-between gap-3 border-t border-slate-200 pt-3">
              <span className={bodyTextClassName}>
                Allocated{' '}
                <span className={monoDataClassName}>
                  ₹{budget.allocatedBudget.toLocaleString('en-IN')}
                </span>
              </span>
              <span className={bodyTextClassName}>
                Consumed{' '}
                <span className={monoDataClassName}>
                  ₹{budget.consumedBudget.toLocaleString('en-IN')}
                </span>
              </span>
              <span className={bodyTextClassName}>
                Monthly burn{' '}
                <span className={monoDataClassName}>
                  ₹{budget.monthlyBurnRate.toLocaleString('en-IN')}
                </span>
              </span>
            </div>
          </article>
        );
      })}
    </div>
  );
}
