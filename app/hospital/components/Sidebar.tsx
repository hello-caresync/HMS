"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, Calendar, Users, Stethoscope, FileText, Pill,
  FlaskConical, Image, Activity, BedDouble, Video, MessageSquare, 
  Bell, BrainCircuit, FolderOpen, BarChart3, Settings, ChevronDown, ChevronRight
} from 'lucide-react';

// Navigation structure schema mapping
interface NavItem {
  title: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavSection {
  category: string;
  items: NavItem[];
}

export default function Sidebar() {
  const pathname = usePathname();
  
  // State tracking for collapsing sections if needed
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    'CLINICAL OPERATIONS': true,
    'DIAGNOSTICS & PROCEDURES': true,
    'COMMUNICATION & COLLABORATION': true,
    'CLINICAL INTELLIGENCE': true,
    'PRODUCTIVITY': true,
    'MANAGEMENT': true,
  });

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const navigationData: NavSection[] = [
    {
      category: "CLINICAL OPERATIONS",
      items: [
        { title: "Dashboard", path: "/hospital/dashboard", icon: LayoutDashboard },
        { title: "Appointments", path: "/hospital/appointments", icon: Calendar },
        { title: "My Patients", path: "/hospital/patients", icon: Users },
        { title: "Active Consultation", path: "/hospital/consultation", icon: Stethoscope },
        { title: "EMR", path: "/hospital/emr", icon: FileText },
        { title: "e-Prescription", path: "/hospital/prescription", icon: Pill },
      ]
    },
    {
      category: "DIAGNOSTICS & PROCEDURES",
      items: [
        { title: "Laboratory", path: "/hospital/diagnostics/laboratory", icon: FlaskConical },
        { title: "Radiology", path: "/hospital/diagnostics/radiology", icon: Image },
        { title: "Surgical Theatre", path: "/hospital/procedures/surgical", icon: Activity },
        { title: "Inpatient Care", path: "/hospital/procedures/inpatient", icon: BedDouble },
      ]
    },
    {
      category: "COMMUNICATION & COLLABORATION",
      items: [
        { title: "Telemedicine", path: "/hospital/communication/telemedicine", icon: Video },
        { title: "Communication Center", path: "/hospital/communication/center", icon: MessageSquare },
        { title: "Notification Center", path: "/hospital/communication/notifications", icon: Bell },
      ]
    },
    {
      category: "CLINICAL INTELLIGENCE",
      items: [
        { title: "AI Clinical Assistant", path: "/hospital/intelligence/ai-assistant", icon: BrainCircuit },
      ]
    },
    {
      category: "PRODUCTIVITY",
      items: [
        { title: "Document Hub", path: "/hospital/productivity/documents", icon: FolderOpen },
        { title: "Calendar", path: "/hospital/productivity/calendar", icon: Calendar },
      ]
    },
    {
      category: "MANAGEMENT",
      items: [
        { title: "Practice Analytics", path: "/hospital/management/analytics", icon: BarChart3 },
        { title: "Profile & Settings", path: "/hospital/management/settings", icon: Settings },
      ]
    }
  ];

  return (
    <aside className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-200/80 bg-white shadow-sm overflow-y-auto">
      {/* Brand Header Header Branding */}
      <div className="flex h-16 items-center px-6 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-md shadow-indigo-200">
            <Stethoscope className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-black tracking-wider text-slate-800 uppercase">Nexora</h1>
            <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-600">Clinical Suite</p>
          </div>
        </div>
      </div>

      {/* Navigation Matrix Workspace List */}
      <nav className="flex-1 space-y-6 px-4 py-6">
        {navigationData.map((section) => {
          const isSectionOpen = openSections[section.category];
          
          return (
            <div key={section.category} className="space-y-1">
              {/* Category Dropdown Toggle Header Label */}
              <button
                onClick={() => toggleSection(section.category)}
                className="flex w-full items-center justify-between px-2 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 hover:text-slate-600 transition-colors"
              >
                <span>{section.category}</span>
                {isSectionOpen ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
              </button>

              {/* Dynamic Sub-items Nested Container */}
              {isSectionOpen && (
                <div className="space-y-0.5 pl-1 transition-all duration-200">
                  {section.items.map((item) => {
                    const isActive = pathname === item.path;
                    const IconComponent = item.icon;

                    return (
                      <Link
                        key={item.path}
                        href={item.path}
                        className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition-all duration-150 ${
                          isActive
                            ? "bg-indigo-50/70 text-indigo-600 shadow-sm shadow-indigo-50/20"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        }`}
                      >
                        <IconComponent 
                          className={`h-4 w-4 shrink-0 ${
                            isActive ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600"
                          }`} 
                        />
                        <span className="truncate">{item.title}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Embedded Logged-in System User Context Card */}
      <div className="mt-auto border-t border-slate-100 p-4 bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-sm font-bold text-slate-700">
            DR
          </div>
          <div className="flex flex-col truncate">
            <span className="text-xs font-bold text-slate-800 truncate">Active Staff Profile</span>
            <span className="text-[10px] text-slate-500 font-medium truncate">Clinical Operator</span>
          </div>
        </div>
      </div>
    </aside>
  );
}