'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { isHospitalAppRole, readHospitalAppSession } from '@/lib/auth/ecosystem-sessions';
import { canManageStaffCredentials } from '@/lib/auth/hospital-rbac';
import { supabase } from '@/lib/supabase';
import {
  formatVendorDirectoryCode,
  isVendorCredentialRole,
  readStoredCredentialPasscode,
  saveHospitalVendorRecord,
  VENDOR_GSTIN_FALLBACK,
} from '@/lib/hospital/procurement';
import { mapCredentialRow } from '@/lib/auth/hospitalAuth';
import {
  classifyGovernancePersonnelRole,
  computeGovernanceDirectoryStats,
  filterGovernanceDirectory,
  governanceRoleDisplayLabel,
  GOVERNANCE_VAULT_TABS,
  revokeGovernanceEntity,
  type GovernancePersonnelClassification,
  type GovernanceVaultTab,
} from '@/lib/hospital/governance-directory';
import { validatePhoneField } from '@/lib/hospital/indian-patient';
import { fetchGovernanceVaultDirectory } from '@/lib/hospital/governance-vault-loader';
import { resolveHospitalUuid } from '@/lib/hospital/resolve-hospital-context';
import { PhoneNumberInput } from '@/components/ui/PhoneNumberInput';
import { StaffProvisioningModal } from '@/components/hospital/StaffProvisioningModal';
import { HOSPITAL_TENANT_ID, REGAL_HOSPITAL_NAME } from '@/lib/regal/constants';
import {
  UserPlus,
  Truck,
  Search,
  RefreshCw,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Building2,
  Stethoscope,
  Briefcase,
  Trash2,
  Loader2,
  ShieldAlert,
  Eye,
  EyeOff,
  Copy,
} from 'lucide-react';

import { RegalHospitalLogoMark } from '@/components/brand/RegalHospitalLogo';

interface DirectoryEntity {
  id: string;
  credentialId?: string;
  staffRecordId?: string;
  code: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  departmentOrCategory: string;
  roleOrType: string;
  rawRole: string;
  classification: string;
  isVendor: boolean;
  isActive: boolean;
  consultationFee?: number;
  accessPin?: string;
  portal_pin?: string;
  passcode?: string;
  createdAt: string;
}

const MASKED_PASSCODE = '••••••••••';

function AdminPasscodeField({
  value,
  label,
}: {
  value?: string;
  label: string;
}) {
  const [revealed, setRevealed] = useState(false);
  const secret = value?.trim() || '';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(secret);
      toast.success(`${label} copied to clipboard`);
    } catch {
      toast.error(`Could not copy ${label.toLowerCase()}`);
    }
  };

  if (!secret) {
    return <span className="text-[10px] text-slate-400">Not set</span>;
  }

  return (
    <div className="mt-1 flex items-center gap-1.5">
      <span className="font-mono text-[10px] text-teal-800">{revealed ? secret : MASKED_PASSCODE}</span>
      {!revealed ? (
        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700">
          Configured
        </span>
      ) : null}
      <button
        type="button"
        onClick={() => setRevealed((prev) => !prev)}
        className="rounded border border-slate-200 p-0.5 text-slate-500 hover:bg-slate-50"
        title={revealed ? `Hide ${label}` : `Reveal ${label}`}
      >
        {revealed ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
      </button>
      <button
        type="button"
        onClick={() => void handleCopy()}
        className="rounded border border-slate-200 p-0.5 text-slate-500 hover:bg-slate-50"
        title={`Copy ${label}`}
      >
        <Copy className="h-3 w-3" />
      </button>
    </div>
  );
}

function GovernanceVaultSkeleton() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] animate-pulse">
      <div className="border-b border-slate-200 bg-white px-8 py-6">
        <div className="h-4 w-48 rounded bg-slate-200" />
        <div className="mt-3 h-7 w-96 max-w-full rounded bg-slate-200" />
      </div>
      <div className="mx-auto max-w-[1400px] space-y-6 p-8">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-24 rounded-xl bg-white border border-slate-200" />
          ))}
        </div>
        <div className="h-12 rounded-xl bg-white border border-slate-200" />
        <div className="h-96 rounded-2xl bg-white border border-slate-200" />
      </div>
    </div>
  );
}

export default function IdentityAccessGovernanceVault() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [accessState, setAccessState] = useState<'checking' | 'granted' | 'denied'>('checking');
  const [items, setItems] = useState<DirectoryEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<GovernanceVaultTab>('All Entities');
  
  // Modals
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  const [isSavingVendor, setIsSavingVendor] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const [vendorForm, setVendorForm] = useState({
    gstin: '',
    company_name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    portal_passcode: '',
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const hospitalNodeId =
        (await resolveHospitalUuid(supabase, HOSPITAL_TENANT_ID)) || HOSPITAL_TENANT_ID;

      const { credentialRows: rawCredentialRows, vendorRows, staffMembers, errors } =
        await fetchGovernanceVaultDirectory(supabase, hospitalNodeId);

      if (errors.length > 0) {
        console.warn('Governance directory partial load:', errors);
      }

      const staffByEmail = new Map(
        staffMembers
          .filter((row) => row.email.trim())
          .map((row) => [row.email.toLowerCase(), row]),
      );

      const passcodeByEmail = new Map<string, string>();
      const vendorCredentialByEmail = new Map<string, Record<string, unknown>>();

      for (const row of rawCredentialRows) {
        const email = String(row.email ?? '').trim().toLowerCase();
        const passcode = readStoredCredentialPasscode(row);
        if (email && passcode) passcodeByEmail.set(email, passcode);
        if (email && isVendorCredentialRole(String(row.role))) {
          vendorCredentialByEmail.set(email, row);
        }
      }

      const personnelCredentialRows = rawCredentialRows.filter(
        (row) => !isVendorCredentialRole(String(row.role)),
      );

      const unifiedStaff: DirectoryEntity[] = personnelCredentialRows.map((row) => {
        const credential = mapCredentialRow(row);
        const staff = staffByEmail.get(credential.email.toLowerCase());
        const classification = classifyGovernancePersonnelRole(credential.role);

        return {
          id: credential.id,
          credentialId: credential.id,
          staffRecordId: staff?.id,
          code: String(row.badge_id ?? credential.employee_id ?? staff?.staff_id_code ?? ''),
          name: credential.full_name,
          contactPerson: '',
          email: credential.email,
          phone: credential.phone || '',
          departmentOrCategory: credential.department || staff?.department || 'Clinical Support',
          roleOrType: governanceRoleDisplayLabel(classification, credential.role),
          rawRole: String(row.role ?? credential.role),
          classification,
          isVendor: false,
          isActive: credential.is_active,
          consultationFee:
            staff && staff.consultation_fee != null && staff.consultation_fee > 0
              ? staff.consultation_fee
              : undefined,
          accessPin:
            readStoredCredentialPasscode(row) ||
            staff?.passcode_key ||
            passcodeByEmail.get(credential.email.toLowerCase()) ||
            undefined,
          createdAt: staff?.created_at ?? new Date().toISOString(),
        };
      });

      const vendorByEmail = new Map<string, DirectoryEntity>();

      const resolveVendorPasscode = (email: string, credential?: Record<string, unknown>) =>
        (credential ? readStoredCredentialPasscode(credential) : '') ||
        passcodeByEmail.get(email) ||
        undefined;

      for (const row of vendorRows) {
        const email = String(row.email ?? '').trim().toLowerCase();
        if (!email) continue;
        const credential = vendorCredentialByEmail.get(email);
        const pin = resolveVendorPasscode(email, credential);

        vendorByEmail.set(email, {
          id: String(row.id ?? credential?.id ?? email),
          credentialId: credential ? String(credential.id ?? '') : undefined,
          code: formatVendorDirectoryCode(row, credential),
          name: String(row.company_name ?? credential?.full_name ?? 'Vendor'),
          contactPerson: String(row.contact_person ?? ''),
          email,
          phone: String(row.phone ?? credential?.phone ?? ''),
          departmentOrCategory:
            row.gstin && String(row.gstin) !== VENDOR_GSTIN_FALLBACK
              ? `GSTIN ${String(row.gstin)}`
              : 'Supplies',
          roleOrType: 'Vendor',
          rawRole: 'vendor',
          classification: 'Verified Vendor',
          isVendor: true,
          isActive: credential ? credential.is_active !== false : true,
          accessPin: pin,
          portal_pin: pin,
          passcode: pin,
          createdAt: String(row.created_at ?? credential?.created_at ?? new Date().toISOString()),
        });
      }

      for (const [email, credential] of vendorCredentialByEmail.entries()) {
        if (vendorByEmail.has(email)) continue;
        const pin = resolveVendorPasscode(email, credential);

        vendorByEmail.set(email, {
          id: String(credential.id ?? email),
          credentialId: String(credential.id ?? ''),
          code: formatVendorDirectoryCode(null, credential),
          name: String(credential.full_name ?? 'Vendor'),
          contactPerson: '',
          email,
          phone: String(credential.phone ?? ''),
          departmentOrCategory: 'Supplies',
          roleOrType: 'Vendor',
          rawRole: 'vendor',
          classification: 'Verified Vendor',
          isVendor: true,
          isActive: credential.is_active !== false,
          accessPin: pin,
          portal_pin: pin,
          passcode: pin,
          createdAt: String(credential.created_at ?? new Date().toISOString()),
        });
      }

      setItems([...unifiedStaff, ...Array.from(vendorByEmail.values())]);

      if (errors.length > 0 && unifiedStaff.length === 0 && vendorByEmail.size === 0) {
        toast.error('Could not load governance directory');
      }
    } catch (err: unknown) {
      console.error('Failed loading governance data:', err instanceof Error ? err.message : err);
      toast.error('Could not load governance directory');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setIsMounted(true);
    const session = readHospitalAppSession();
    const staffType = session?.staff_type || '';

    if (!session?.hospital_id || !isHospitalAppRole(staffType)) {
      router.replace('/hospital/login');
      return;
    }

    if (!canManageStaffCredentials(session)) {
      setAccessState('denied');
      router.replace('/dashboard?unauthorized=staff-credentials');
      return;
    }

    setAccessState('granted');
  }, [router]);

  useEffect(() => {
    if (accessState !== 'granted') return;

    void fetchData();

    const channel = supabase
      .channel('governance_vault_directory')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'hospital_user_credentials' },
        () => void fetchData(),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'hospital_staff' },
        () => void fetchData(),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'vendors' },
        () => void fetchData(),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'doctors' },
        () => void fetchData(),
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [accessState, fetchData]);

  const handleToggleStatus = async (item: DirectoryEntity) => {
    try {
      if (item.isVendor) {
        toast.info('Vendor suspend/resume is not available — use Revoke to remove a supplier.');
        return;
      } else {
        if (item.credentialId) {
          const { error: credentialError } = await supabase
            .from('hospital_user_credentials')
            .update({ is_active: !item.isActive })
            .eq('id', item.credentialId);
          if (credentialError) throw credentialError;
        }

        if (item.staffRecordId) {
          const { error: staffError } = await supabase
            .from('hospital_staff')
            .update({ is_active: !item.isActive })
            .eq('id', item.staffRecordId);
          if (staffError) throw staffError;
        }
      }

      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, isActive: !item.isActive } : i))
      );
    } catch (err: unknown) {
      alert(`Status update failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleRevokeAccess = async (item: DirectoryEntity) => {
    const label = item.isVendor ? 'vendor supplier' : 'personnel credential';
    const confirmed = window.confirm(
      `Revoke and permanently delete this ${label}?\n\n${item.name} (${item.code})\n\nThis removes portal access and linked directory records.`,
    );
    if (!confirmed) return;

    setRevokingId(item.id);
    try {
      const result = await revokeGovernanceEntity(supabase, {
        isVendor: item.isVendor,
        id: item.id,
        credentialId: item.credentialId,
        staffRecordId: item.staffRecordId,
        email: item.email,
        code: item.code,
        rawRole: item.rawRole,
        classification: item.classification,
        name: item.name,
      });

      if (!result.ok) {
        throw new Error(result.error ?? 'Could not revoke access');
      }

      toast.success(`${item.name} removed from governance directory`);
      setItems((prev) => prev.filter((row) => row.id !== item.id));
      await fetchData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Revocation failed');
    } finally {
      setRevokingId(null);
    }
  };

  const handleSaveVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSavingVendor) return;
    setIsSavingVendor(true);

    try {
      const phoneCheck = validatePhoneField(vendorForm.phone, false);
      if (!phoneCheck.ok) {
        toast.error(phoneCheck.message);
        return;
      }

      const portalPasscode = vendorForm.portal_passcode.trim();
      if (!portalPasscode) {
        toast.error('Portal Security PIN is required for vendor login.');
        return;
      }

      const result = await saveHospitalVendorRecord(supabase, HOSPITAL_TENANT_ID, {
        company_name: vendorForm.company_name.trim(),
        gstin: vendorForm.gstin.trim() || '',
        contact_person: vendorForm.contact_person.trim() || undefined,
        email: vendorForm.email.trim().toLowerCase(),
        phone: phoneCheck.phone ?? undefined,
        address: vendorForm.address.trim() || undefined,
        passcode: portalPasscode,
        portal_pin: portalPasscode,
      });

      if (!result.ok) {
        console.error('Vendor save failure:', result.error);
        toast.error(result.error || 'Could not save vendor record');
        return;
      }

      toast.success(`Vendor "${vendorForm.company_name.trim()}" successfully registered!`);
      setIsVendorModalOpen(false);
      setVendorForm({
        gstin: '',
        company_name: '',
        contact_person: '',
        email: '',
        phone: '',
        address: '',
        portal_passcode: '',
      });
      await fetchData();
    } catch (err: unknown) {
      console.error('Vendor save failure:', err);
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message?: string }).message)
          : err instanceof Error
            ? err.message
            : 'Could not save vendor record';
      toast.error(message);
    } finally {
      setIsSavingVendor(false);
    }
  };

  const filteredItems = useMemo(
    () => filterGovernanceDirectory(items, activeTab, search),
    [items, activeTab, search],
  );

  const directoryStats = useMemo(() => {
    const personnel = items.filter((item) => !item.isVendor);
    return computeGovernanceDirectoryStats(
      personnel.map((item) => ({
        classification: item.classification as GovernancePersonnelClassification,
        isActive: item.isActive,
      })),
      items.filter((item) => item.isVendor).length,
    );
  }, [items]);

  if (!isMounted || accessState === 'checking') {
    return <GovernanceVaultSkeleton />;
  }

  if (accessState === 'denied') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC] p-6">
        <div className="max-w-md rounded-2xl border border-rose-200 bg-white p-8 text-center shadow-sm">
          <ShieldAlert className="mx-auto h-10 w-10 text-rose-600" />
          <h1 className="mt-4 text-lg font-bold text-slate-900">Access Restricted</h1>
          <p className="mt-2 text-sm text-slate-600">
            Admin privileges are required to view the Staff &amp; Vendor Access Governance Vault.
          </p>
          <Link
            href="/dashboard"
            className="mt-6 inline-flex items-center justify-center rounded-xl bg-cyan-700 px-4 py-2 text-xs font-bold text-white hover:bg-cyan-800"
          >
            Return to Hospital Command Center
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800">
      {/* Top Navbar */}
      <div className="border-b border-slate-200 bg-white px-8 py-4">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <Link className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-600 hover:text-teal-700 mb-1" href="/dashboard">
              <ArrowLeft className="h-3.5 w-3.5"/> Back to Hospital Command Center
            </Link>
            <div className="flex items-center gap-3">
              <RegalHospitalLogoMark heightClass="h-7" className="h-10 border border-slate-200" />
              <div>
                <h1 className="text-xl font-bold text-slate-900">
                  Staff & Vendor Access Governance Vault
                </h1>
                <p className="text-xs text-slate-500">
                  Regal Hospital (Node HOSP-01) • Identity credential matrix & supplier privilege control
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void fetchData()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              Sync Directory
            </button>
            <button
              onClick={() => setIsVendorModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3.5 py-2 text-xs font-bold text-amber-800 hover:bg-amber-100 transition shadow-sm"
            >
              <Truck className="h-4 w-4 text-amber-600"/> + Add Supplier / Vendor
            </button>
            <button
              onClick={() => setIsStaffModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-teal-700 transition"
            >
              <UserPlus className="h-4 w-4"/> + Provision Staff
            </button>
          </div>
        </div>
      </div>

      <div className="p-8 max-w-[1400px] mx-auto space-y-6">
        {/* Metric Cards — unified teal/slate palette; color reserved for health % only */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          {(
            [
              {
                label: 'Total Active Roster',
                value: items.filter((i) => i.isActive).length,
                icon: Building2,
              },
              {
                label: 'Clinicians On-Duty',
                value: directoryStats.clinicians,
                icon: Stethoscope,
              },
              {
                label: 'Ops & Triage Staff',
                value: directoryStats.triage,
                icon: Briefcase,
              },
              {
                label: 'Verified Vendors',
                value: directoryStats.vendors,
                icon: Truck,
              },
            ] as const
          ).map((metric) => (
            <div
              key={metric.label}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-teal-200 hover:shadow-md"
            >
              <div className="flex items-center justify-between text-slate-600">
                <span className="text-[11px] font-bold uppercase tracking-wider">{metric.label}</span>
                <metric.icon className="h-4 w-4 text-teal-600" />
              </div>
              <p className="mt-2 text-2xl font-black text-slate-900 tabular-nums">{metric.value}</p>
            </div>
          ))}

          <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 shadow-sm transition hover:border-emerald-300 hover:shadow-md">
            <div className="flex items-center justify-between text-emerald-800">
              <span className="text-[11px] font-bold uppercase tracking-wider">Healthy Status</span>
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <p className="mt-2 text-2xl font-black text-emerald-900 tabular-nums">
              {Math.round((items.filter((i) => i.isActive).length / (items.length || 1)) * 100)}%
            </p>
            <p className="mt-1 text-[10px] font-semibold text-emerald-700">Active credentials</p>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400"/>
            <input
              type="text"
              placeholder="Search by name, ID/Code, department, or supply category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-4 text-xs shadow-sm focus:border-teal-500 focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap gap-1.5 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
            {GOVERNANCE_VAULT_TABS.map((tabLabel) => (
              <button
                key={tabLabel}
                type="button"
                onClick={() => setActiveTab(tabLabel)}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                  activeTab === tabLabel
                    ? tabLabel === 'Vendors & Suppliers'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'bg-teal-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tabLabel}
              </button>
            ))}
          </div>
        </div>

        {/* Main Governance Table */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3.5">Entity / Legal Name</th>
                <th className="px-5 py-3.5">ID / Code</th>
                <th className="px-5 py-3.5">Dept / Category</th>
                <th className="px-5 py-3.5">Classification</th>
                <th className="px-5 py-3.5">Contact / Verification</th>
                <th className="px-5 py-3.5">Access State</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Loading credential directory...
                  </td>
                </tr>
              )}
              {!loading &&
                filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/70 transition">
                  <td className="px-5 py-3.5">
                    <div className="font-bold text-slate-900">{item.name}</div>
                    <div className="text-[11px] text-slate-400">
                      {item.isVendor
                        ? item.contactPerson
                          ? `Rep: ${item.contactPerson}`
                          : 'Authorized Hospital Supplier'
                        : 'Hospital Medical Staff'}
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="font-mono font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      {item.code}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 font-medium text-slate-600">
                    {item.departmentOrCategory}
                  </td>
                  <td className="px-5 py-3.5">
                    {item.isVendor ? (
                      <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200">
                        Vendor Entity
                      </span>
                    ) : item.roleOrType.toLowerCase().includes('doctor') ? (
                      <span className="inline-flex items-center rounded-full bg-violet-50 px-2.5 py-0.5 text-[10px] font-bold text-violet-700 border border-violet-200">
                        Physician / Surgeon
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-sky-50 px-2.5 py-0.5 text-[10px] font-bold text-sky-700 border border-sky-200">
                        {item.roleOrType}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-slate-500">
                    <div>{item.email || 'No email registered'}</div>
                    <div className="text-[11px] text-slate-400">{item.phone || '--'}</div>
                    <div className="mt-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                      {item.isVendor ? 'Portal PIN' : 'Passcode'}
                    </div>
                    <AdminPasscodeField
                      value={item.accessPin ?? item.portal_pin ?? item.passcode}
                      label={item.isVendor ? 'Portal PIN' : 'Passcode'}
                    />
                  </td>
                  <td className="px-5 py-3.5">
                    <button
                      onClick={() => handleToggleStatus(item)}
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold border transition ${
                        item.isActive
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                          : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                      }`}
                    >
                      {item.isActive ? (
                        <>
                          <CheckCircle2 className="h-3 w-3"/> Active
                        </>
                      ) : (
                        <>
                          <XCircle className="h-3 w-3"/> Suspended
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={revokingId === item.id}
                        onClick={() => void handleRevokeAccess(item)}
                        className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-700 shadow-sm hover:bg-rose-100 transition disabled:opacity-60"
                      >
                        {revokingId === item.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Trash2 className="h-3 w-3" />
                        )}
                        Revoke
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && filteredItems.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <p className="text-sm font-semibold text-slate-700">
                      No records match &ldquo;{activeTab}&rdquo;
                      {search.trim() ? ` for “${search.trim()}”` : ''}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      Try another tab, clear the search box, or click Sync Directory to refresh credentials.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <StaffProvisioningModal
        open={isStaffModalOpen}
        onClose={() => setIsStaffModalOpen(false)}
        hospitalId={HOSPITAL_TENANT_ID}
        hospitalName={REGAL_HOSPITAL_NAME}
        onSuccess={async () => {
          await fetchData();
        }}
      />

      {/* Modal 2: Add Vendor */}
      {isVendorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <h2 className="text-base font-bold text-slate-900">Provision Supplier / Vendor Credentials</h2>
            <p className="text-xs text-slate-500 mt-0.5">Enables purchase orders, supply intake, and supplier verification.</p>
            <form onSubmit={handleSaveVendor} className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold uppercase text-slate-500">Company / Supplier Name</label>
                  <input
                    type="text"
                    required
                    value={vendorForm.company_name}
                    onChange={(e) => setVendorForm({ ...vendorForm, company_name: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:outline-none focus:border-amber-500"
                    placeholder="e.g. Medtronic Supplies India Ltd"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase text-slate-500">GSTIN (optional)</label>
                  <input
                    type="text"
                    value={vendorForm.gstin}
                    onChange={(e) => setVendorForm({ ...vendorForm, gstin: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs focus:outline-none focus:border-amber-500"
                    placeholder="22AAAAA0000A1Z5"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold uppercase text-slate-500">Representative Name</label>
                  <input
                    type="text"
                    required
                    value={vendorForm.contact_person}
                    onChange={(e) => setVendorForm({ ...vendorForm, contact_person: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:outline-none focus:border-amber-500"
                    placeholder="e.g. Suresh Kumar"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase text-slate-500">Address (optional)</label>
                  <input
                    type="text"
                    value={vendorForm.address}
                    onChange={(e) => setVendorForm({ ...vendorForm, address: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:outline-none focus:border-amber-500"
                    placeholder="Registered office address"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold uppercase text-slate-500">Official Email</label>
                  <input
                    type="email"
                    required
                    value={vendorForm.email}
                    onChange={(e) => setVendorForm({ ...vendorForm, email: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:outline-none focus:border-amber-500"
                    placeholder="orders@supplier.in"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase text-slate-500">Phone</label>
                  <PhoneNumberInput
                    value={vendorForm.phone}
                    onChange={(phone) => setVendorForm({ ...vendorForm, phone })}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase text-slate-500">Portal Security PIN</label>
                <input
                  type="password"
                  required
                  maxLength={12}
                  value={vendorForm.portal_passcode}
                  onChange={(e) => setVendorForm({ ...vendorForm, portal_passcode: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono focus:outline-none focus:border-amber-500"
                  placeholder="Vendor portal login PIN"
                />
              </div>
              <div className="mt-5 flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsVendorModalOpen(false)}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingVendor}
                  className="rounded-lg bg-amber-600 px-4 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-amber-700 disabled:opacity-60"
                >
                  {isSavingVendor ? 'Saving...' : 'Save Vendor Credentials'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}