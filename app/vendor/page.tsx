'use client';

import React from 'react';
import Link from 'next/link';

import { APP_ROUTES } from '../lib/routes';

export default function VendorMainGatewayShell() {
  return (
    <div className="flex min-h-screen w-screen flex-col items-center justify-center bg-slate-50 p-6 font-sans text-slate-900 antialiased">
      <div className="w-full max-w-lg space-y-6">
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xs transition-all hover:shadow-md">
          <span
            className="absolute top-0 left-0 h-full w-1 bg-emerald-500"
            aria-hidden
          />

          <div className="pl-2">
            <span className="inline-flex items-center rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-700">
              CuraSync Unified Gateway
            </span>

            <h1 className="mt-4 text-xl font-black tracking-tight text-slate-800">
              Supplier Operations Terminal
            </h1>
            <p className="mt-2 text-xs font-medium text-slate-800">
              Authorized node dashboard for enterprise contract pipelines,
              logistics tracking, and hospital procurement sync.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-all hover:shadow-md">
            <span
              className="absolute top-0 left-0 h-full w-1 bg-[#4A5D5E]"
              aria-hidden
            />
            <p className="pl-3 text-[11px] font-black uppercase tracking-wider text-slate-800">
              Vendor lane
            </p>
            <p className="mt-2 pl-3 font-mono text-2xl font-black text-slate-800">
              B2B
            </p>
            <p className="mt-1 pl-3 text-xs font-medium text-slate-800">
              Secure logistics hub
            </p>
            <Link
              href={APP_ROUTES.vendorSecureHub}
              className="mt-4 ml-3 inline-flex w-[calc(100%-0.75rem)] items-center justify-center bg-[#4A5D5E] px-5 py-2.5 text-xs font-black text-white shadow-xs transition-all hover:bg-slate-800 rounded-xl"
            >
              Enter secure hub
            </Link>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-teal-200 bg-white p-5 shadow-xs transition-all hover:shadow-md">
            <span className="absolute top-0 left-0 h-full w-1 bg-teal-600" aria-hidden />
            <p className="pl-3 text-[11px] font-black uppercase tracking-wider text-slate-800">
              Nexora SRM
            </p>
            <p className="mt-2 pl-3 font-mono text-2xl font-black text-slate-800">Portal</p>
            <p className="mt-1 pl-3 text-xs font-medium text-slate-800">
              Full procurement collaboration suite
            </p>
            <Link
              href={APP_ROUTES.vendorPortalDashboard}
              className="mt-4 ml-3 inline-flex w-[calc(100%-0.75rem)] items-center justify-center rounded-xl bg-teal-700 px-5 py-2.5 text-xs font-black text-white shadow-xs transition-all hover:bg-teal-800"
            >
              Open Nexora Vendor App
            </Link>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-all hover:shadow-md sm:col-span-2 lg:col-span-1">
            <span
              className="absolute top-0 left-0 h-full w-1 bg-blue-500"
              aria-hidden
            />
            <p className="pl-3 text-[11px] font-black uppercase tracking-wider text-slate-800">
              Hospital lane
            </p>
            <p className="mt-2 pl-3 font-mono text-2xl font-black text-slate-800">
              PO
            </p>
            <p className="mt-1 pl-3 text-xs font-medium text-slate-800">
              Procurement console
            </p>
            <Link
              href={APP_ROUTES.hospital}
              className="mt-4 ml-3 inline-flex w-[calc(100%-0.75rem)] items-center justify-center bg-blue-600 px-5 py-2.5 text-xs font-black text-white shadow-xs transition-all hover:bg-blue-700 rounded-xl"
            >
              Open procurement wing
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50/50 px-5 py-4 text-center">
          <p className="text-[11px] font-black uppercase tracking-wider text-slate-800">
            Terminal node
          </p>
          <p className="mt-1 font-mono text-xs font-black text-slate-800">
            authenticated-supplier-node
          </p>
        </div>
      </div>
    </div>
  );
}
