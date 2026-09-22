'use client';

import React, { Suspense, useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Crown,
  Building2,
  Copy,
  Check,
  Eye,
  EyeOff,
  Search,
  RefreshCw,
  Hospital,
  PlusCircle,
  ShieldCheck,
  ArrowLeft,
  ChevronRight,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@supabase/supabase-js';

import { OnboardHospitalModal, type OnboardHospitalResult } from '@/components/admin/OnboardHospitalModal';
import { credentialRoleToStaffType, resolveCredentialDashboardRoute } from '@/lib/auth/hospitalAuth';
import { isUuidValue } from '@/lib/utils/formatters';
import {
  fetchSuperAdminStaffCredentials,
  fetchSuperAdminTenantStaffCredentials,
} from '@/lib/super-admin/staff-credentials-loader';
import {
  credentialBelongsToTenant,
  formatTenantCredentialScopeLabel,
} from '@/lib/super-admin/tenant-credential-scope';
import {
  dedupeHospitalTenantsByCode,
  fetchSuperAdminHospitalTenantByIdentifier,
  fetchSuperAdminHospitalTenants,
  formatHospitalTenantBadge,
  matchHospitalTenantByIdentifier,
  type SuperAdminHospitalTenant,
} from '@/lib/super-admin/hospital-tenants';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

interface StaffCredential {
  id: string;
  hospital_id: string;
  hospital_name: string;
  full_name: string;
  staff_type: 'Doctor' | 'Nurse' | 'Receptionist' | 'Pharmacist' | 'Admin';
  department: string;
  email: string;
  temporary_passcode: string;
  phone?: string;
  portal_access: string;
  status: 'Active' | 'Restricted';
  created_at?: string;
  badge_id: string;
  staff_id?: string;
  doctor_id?: string;
  doctor_code?: string;
}

function resolveDisplayStaffType(row: Record<string, unknown>): StaffCredential['staff_type'] {
  const explicit = String(row.staff_type ?? row.role ?? '').trim();
  if (
    explicit === 'Doctor' ||
    explicit === 'Nurse' ||
    explicit === 'Admin' ||
    explicit === 'Receptionist' ||
    explicit === 'Pharmacist'
  ) {
    return explicit;
  }

  const role = String(row.role ?? explicit ?? 'staff').toLowerCase();
  const department = String(row.department ?? '').toLowerCase();

  if (role.includes('admin')) return 'Admin';
  if (role.includes('doctor')) return 'Doctor';
  if (role.includes('nurse')) return 'Nurse';
  if (department.includes('pharmacy') || department.includes('pharmacist') || role.includes('pharmacist')) {
    return 'Pharmacist';
  }
  if (department.includes('reception') || role.includes('reception')) return 'Receptionist';

  return credentialRoleToStaffType(
    String(row.role ?? 'staff') as 'admin' | 'doctor' | 'staff' | 'nurse',
  ) as StaffCredential['staff_type'];
}

function enrichCredentialsWithHospitalNames(
  creds: StaffCredential[],
  tenants: SuperAdminHospitalTenant[],
): StaffCredential[] {
  const nameByKey = new Map<string, string>();

  for (const tenant of tenants) {
    nameByKey.set(tenant.id, tenant.name);
    nameByKey.set(tenant.id.toUpperCase(), tenant.name);
    nameByKey.set(tenant.hospital_code.toUpperCase(), tenant.name);
  }

  return creds.map((cred) => ({
    ...cred,
    hospital_name:
      nameByKey.get(cred.hospital_id) ??
      nameByKey.get(cred.hospital_id.toUpperCase()) ??
      cred.hospital_name,
  }));
}

function normalizeCredential(row: Record<string, unknown>): StaffCredential {
  const badge_id = String(row.staff_id_code ?? '').trim().toUpperCase();

  return {
    id: String(row.id ?? ''),
    hospital_id: String(row.hospital_id ?? ''),
    hospital_name: String(row.hospital_name ?? ''),
    full_name: String(row.full_name ?? ''),
    staff_type: resolveDisplayStaffType(row),
    department: String(row.department ?? ''),
    email: String(row.email ?? ''),
    temporary_passcode: String(row.passcode_key ?? ''),
    phone: row.phone ? String(row.phone) : undefined,
    portal_access: String(row.portal_access ?? '/dashboard'),
    status: row.is_active === false ? 'Restricted' : 'Active',
    created_at: row.created_at ? String(row.created_at) : undefined,
    badge_id: badge_id || String(row.id ?? ''),
    staff_id: row.staff_id ? String(row.staff_id) : undefined,
    doctor_id: row.doctor_id ? String(row.doctor_id) : undefined,
    doctor_code: row.doctor_code ? String(row.doctor_code) : undefined,
  };
}

type SuperAdminHospitalBlocksDashboardProps = {
  /** Route param or deep-link identifier — UUID or hospital_code such as HOSP-01. */
  initialTenantIdentifier?: string;
};

export function SuperAdminHospitalBlocksDashboard({
  initialTenantIdentifier,
}: SuperAdminHospitalBlocksDashboardProps = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [hospitals, setHospitals] = useState<SuperAdminHospitalTenant[]>([]);
  const [credentials, setCredentials] = useState<StaffCredential[]>([]);
  const [tenantCredentials, setTenantCredentials] = useState<StaffCredential[]>([]);
  const [selectedHospitalCode, setSelectedHospitalCode] = useState<string | null>(null);
  const [missingTenantIdentifier, setMissingTenantIdentifier] = useState<string | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('All');
  const [visibleKeys, setVisibleKeys] = useState<{ [id: string]: boolean }>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingStaffId, setDeletingStaffId] = useState<string | null>(null);

  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [createdPacket, setCreatedPacket] = useState<StaffCredential | null>(null);

  const requestedTenantIdentifier =
    initialTenantIdentifier?.trim() ||
    searchParams.get('tenant')?.trim() ||
    searchParams.get('id')?.trim() ||
    null;

  const loadTenantStaffDirectory = useCallback(
    async (tenant: SuperAdminHospitalTenant | undefined) => {
      if (!supabase || !tenant) {
        setTenantCredentials([]);
        return;
      }

      const staffResult = await fetchSuperAdminTenantStaffCredentials(
        supabase,
        tenant.id,
        tenant.hospital_code,
      );

      if (staffResult.error) {
        console.warn('[super-admin] tenant hospital_staff load error:', staffResult.error);
      }

      setTenantCredentials(
        staffResult.rows.map((row) => normalizeCredential(row as Record<string, unknown>)),
      );
    },
    [],
  );

  // Load all hospitals and credentials
  const loadPlatformData = useCallback(async () => {
    setIsLoading(true);
    if (supabase) {
      try {
        const [loadedTenants, staffResult] = await Promise.all([
          fetchSuperAdminHospitalTenants(supabase),
          fetchSuperAdminStaffCredentials(supabase),
        ]);

        if (staffResult.error) {
          console.warn('[super-admin] hospital_staff load error:', staffResult.error);
        }

        let tenantRows = loadedTenants;

        if (requestedTenantIdentifier) {
          let matchedTenant = matchHospitalTenantByIdentifier(
            tenantRows,
            requestedTenantIdentifier,
          );

          if (!matchedTenant) {
            matchedTenant = await fetchSuperAdminHospitalTenantByIdentifier(
              supabase,
              requestedTenantIdentifier,
            );
          }

          if (matchedTenant) {
            tenantRows = dedupeHospitalTenantsByCode([...tenantRows, matchedTenant]);
            setSelectedHospitalCode(matchedTenant.hospital_code);
            setMissingTenantIdentifier(null);
          } else {
            setSelectedHospitalCode(null);
            setMissingTenantIdentifier(requestedTenantIdentifier);
          }
        } else {
          setMissingTenantIdentifier(null);
          setSelectedHospitalCode(null);
        }

        const creds = enrichCredentialsWithHospitalNames(
          staffResult.rows.map((row) => normalizeCredential(row as Record<string, unknown>)),
          tenantRows,
        );

        setCredentials(creds);
        setHospitals(tenantRows);
      } catch (err) {
        console.error('Error fetching data from Supabase:', err);
      }
    }
    setIsLoading(false);
  }, [requestedTenantIdentifier]);

  useEffect(() => {
    loadPlatformData();

    if (supabase) {
      const channel = supabase
        .channel('super_admin_blocks_realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'hospitals' }, () => {
          void loadPlatformData();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'hospital_staff' }, () => {
          void loadPlatformData();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [loadPlatformData]);

  const selectedHospitalData = hospitals.find(
    (h) => h.hospital_code === selectedHospitalCode,
  );

  useEffect(() => {
    if (!selectedHospitalData) {
      setTenantCredentials([]);
      return;
    }
    void loadTenantStaffDirectory(selectedHospitalData);
  }, [selectedHospitalData, loadTenantStaffDirectory, credentials]);

  const handleOnboardSuccess = (result: OnboardHospitalResult) => {
    setSelectedHospitalCode(null);
    setCreatedPacket(
      normalizeCredential({
        id: result.staffRecordId,
        hospital_id: result.hospitalId,
        hospital_name: result.hospitalName,
        full_name: result.adminName,
        staff_type: 'Admin',
        role: 'Admin',
        department: 'HOSPITAL ADMINISTRATION',
        email: result.adminEmail,
        passcode_key: result.passcode,
        staff_id_code: `${result.hospitalCode}-ADM01`,
        portal_access: resolveCredentialDashboardRoute('admin'),
        is_active: true,
        created_at: new Date().toISOString(),
      }),
    );
    void loadPlatformData();
  };

  const resolveAdminLoginUrl = () => {
    const baseUrl =
      typeof window !== 'undefined' ? window.location.origin : 'https://nexora-doctorapp.pages.dev';
    return `${baseUrl}/hospital/login`;
  };

  const handleDeleteStaffCredential = async (staff: StaffCredential) => {
    const confirmed = window.confirm(
      `Revoke and delete credentials for ${staff.full_name} (${staff.email})?`,
    );
    if (!confirmed) return;

    if (!supabase) {
      toast.error('Supabase is not configured.');
      return;
    }

    setDeletingStaffId(staff.id);
    try {
      if (staff.staff_type === 'Doctor') {
        const doctorFilters = [`email.eq.${staff.email.trim().toLowerCase()}`];

        if (staff.badge_id) {
          doctorFilters.push(`doctor_code.eq.${staff.badge_id}`);
          doctorFilters.push(`doctor_id.eq.${staff.badge_id}`);
        }

        if (isUuidValue(staff.id)) {
          doctorFilters.push(`id.eq.${staff.id}`);
        }

        const { error: doctorDeleteError } = await supabase
          .from('doctors')
          .delete()
          .or(doctorFilters.join(','));

        if (doctorDeleteError) {
          console.warn('[super-admin] doctors cleanup skipped:', doctorDeleteError.message);
        }
      }

      const { error } = await supabase.from('hospital_staff').delete().eq('id', staff.id);
      if (error) throw error;

      setCredentials((previous) => previous.filter((item) => item.id !== staff.id));
      setTenantCredentials((previous) => previous.filter((item) => item.id !== staff.id));
      toast.success(`${staff.full_name} removed from the credential vault.`);
    } catch (err) {
      console.error('Failed to delete credential:', err);
      const message = err instanceof Error ? err.message : 'Failed to delete credential';
      toast.error(message);
    } finally {
      setDeletingStaffId(null);
    }
  };

  const copyLoginPacket = (staff: StaffCredential) => {
    const targetLoginUrl = resolveAdminLoginUrl();

    const text = [
      '=====================================',
      staff.hospital_name.toUpperCase(),
      'OFFICIAL CLINICAL ACCESS PASS',
      '=====================================',
      `Hospital Node: ${staff.hospital_name} (${staff.hospital_id.toUpperCase()})`,
      `Staff ID: ${staff.badge_id}`,
      `Staff Member: ${staff.full_name}`,
      `Role: ${staff.staff_type} (${staff.department})`,
      `Login Email: ${staff.email}`,
      `Security Passcode: ${staff.temporary_passcode}`,
      `Portal Login URL: ${targetLoginUrl}`,
      `Target Workspace: ${staff.portal_access}`,
      '=====================================',
    ].join('\n');

    navigator.clipboard.writeText(text);
    setCopiedId(staff.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const tenantRoster = useMemo(() => {
    if (!selectedHospitalData) return [];
    if (tenantCredentials.length > 0) {
      return enrichCredentialsWithHospitalNames(tenantCredentials, [selectedHospitalData]);
    }
    return credentials.filter((credential) => credentialBelongsToTenant(credential, selectedHospitalData));
  }, [credentials, selectedHospitalData, tenantCredentials]);

  const scopedCredentials = useMemo(() => {
    if (!selectedHospitalCode || !selectedHospitalData) return [];
    return tenantRoster.filter((c) => {
      const matchesRole = selectedRoleFilter === 'All' || c.staff_type === selectedRoleFilter;
      const badgeLabel = (c.badge_id ?? '').toLowerCase();
      const matchesSearch =
        c.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.department?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        badgeLabel.includes(searchQuery.toLowerCase());

      return matchesRole && matchesSearch;
    });
  }, [tenantRoster, selectedHospitalCode, selectedHospitalData, selectedRoleFilter, searchQuery]);

  const tenantScopeLabel = formatTenantCredentialScopeLabel(selectedHospitalData);
  const tenantVaultMissing = Boolean(selectedHospitalCode && !selectedHospitalData);
  const tenantRosterCount = tenantRoster.length;
  const isDetailView = Boolean(selectedHospitalCode || requestedTenantIdentifier);

  const openTenantVault = (hospitalCode: string) => {
    router.push(`/super-vault-access/${encodeURIComponent(hospitalCode)}`);
  };

  const returnToTenantDirectory = () => {
    setSelectedHospitalCode(null);
    setMissingTenantIdentifier(null);
    router.push('/super-vault-access');
  };

  return (
    <div className="w-full min-h-screen bg-slate-50 text-slate-800 font-sans p-4 sm:p-8">
      <div className="w-full max-w-[1440px] mx-auto space-y-6">

        {/* Super Admin Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-950 via-purple-950 to-slate-900 text-white shadow-xl border border-purple-900/30">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-[11px] font-mono font-bold text-purple-300">
              <Crown className="w-3.5 h-3.5 text-amber-400"/>
              <span>SUPER ADMIN PLATFORM ROOT</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Hospital Tenant Directory & Credentials
            </h1>
            <p className="text-xs text-purple-200">
              Select any hospital block to inspect its dedicated staff credentials, or onboard a new healthcare facility.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {!isDetailView ? (
              <button
                onClick={() => setShowOnboardModal(true)}
                className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-purple-600/30 transition flex items-center gap-2 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4"/>
                <span>+ Onboard New Hospital</span>
              </button>
            ) : null}
            <button
              onClick={loadPlatformData}
              className="p-2.5 rounded-xl bg-purple-900/50 border border-purple-700/60 text-purple-200 hover:text-white transition flex items-center gap-1.5 text-xs font-bold cursor-pointer"
              title="Sync Platform Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* VIEW 1: HOSPITAL BLOCKS (GRID VIEW) */}
        {!selectedHospitalCode ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-purple-600"/>
                Connected Hospital Tenants ({hospitals.length})
              </h2>
              <span className="text-xs text-slate-400">Click any block to open credential vault</span>
            </div>

            {isLoading ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm font-semibold text-slate-500">
                Syncing platform tenant directory...
              </div>
            ) : hospitals.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-purple-200 bg-white p-10 text-center shadow-xs">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-50 text-purple-700">
                  <Hospital className="h-7 w-7" />
                </div>
                <h3 className="text-lg font-black text-slate-900">No Active Hospital Tenant Found</h3>
                <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                  Please onboard a new hospital facility from the directory.
                  {missingTenantIdentifier ? (
                    <>
                      {' '}
                      Requested tenant{' '}
                      <span className="font-semibold text-purple-700">{missingTenantIdentifier}</span> could
                      not be resolved by UUID or hospital code.
                    </>
                  ) : null}
                </p>
                <button
                  type="button"
                  onClick={() => setShowOnboardModal(true)}
                  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-purple-700 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-md transition hover:bg-purple-600"
                >
                  <PlusCircle className="h-4 w-4" />
                  + Onboard New Hospital
                </button>
              </div>
            ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {hospitals.map((hosp) => {
                const hospCreds = credentials.filter((c) => credentialBelongsToTenant(c, hosp));
                const docCount = hospCreds.filter((c) => c.staff_type === 'Doctor').length;
                const staffCount = hospCreds.length - docCount;

                return (
                  <div
                    key={hosp.hospital_code}
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedRoleFilter('All');
                      openTenantVault(hosp.hospital_code);
                    }}
                    className="group relative bg-white rounded-2xl border border-slate-200 hover:border-purple-500 p-6 shadow-xs hover:shadow-xl transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-5"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-1 rounded-md text-[10px] font-mono font-bold bg-purple-50 text-purple-700 border border-purple-200">
                          {formatHospitalTenantBadge(hosp)}
                        </span>
                        <span className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"/>
                          {hosp.status}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-lg font-black text-slate-900 group-hover:text-purple-700 transition">
                          {hosp.name}
                        </h3>
                        <p className="text-xs text-slate-400">{hosp.city}, Karnataka</p>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 grid grid-cols-3 gap-2 text-center">
                      <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="text-base font-black text-slate-900">{hospCreds.length}</div>
                        <div className="text-[10px] font-medium text-slate-400 uppercase">Accounts</div>
                      </div>
                      <div className="p-2 rounded-xl bg-blue-50/50 border border-blue-100">
                        <div className="text-base font-black text-blue-700">{docCount}</div>
                        <div className="text-[10px] font-medium text-blue-500 uppercase">Doctors</div>
                      </div>
                      <div className="p-2 rounded-xl bg-teal-50/50 border border-teal-100">
                        <div className="text-base font-black text-teal-700">{staffCount}</div>
                        <div className="text-[10px] font-medium text-teal-500 uppercase">Staff</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 pt-2 text-xs font-bold text-purple-700">
                      <span>View Hospital Vault</span>
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition"/>
                    </div>
                  </div>
                );
              })}
            </div>
            )}
          </div>
        ) : (
          
          /* VIEW 2: ISOLATED HOSPITAL VAULT */
          <div className="space-y-4 animate-in fade-in">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={returnToTenantDirectory}
                className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-slate-900 text-xs font-bold flex items-center gap-2 cursor-pointer shadow-2xs hover:bg-slate-50 transition"
              >
                <ArrowLeft className="w-4 h-4"/>
                <span>Back to All Hospital Blocks</span>
              </button>

              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-slate-500">Credential Audit —</span>
                <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-xs font-black">
                  {selectedHospitalData?.name ?? selectedHospitalCode ?? 'Unknown'} (
                  {selectedHospitalData ? formatHospitalTenantBadge(selectedHospitalData) : selectedHospitalCode ?? '—'})
                </span>
                <span className="text-[11px] font-medium text-slate-500">
                  Read-only roster · staff created from Hospital App syncs here
                </span>
              </div>
            </div>

            {tenantVaultMissing ? (
              <div className="rounded-2xl border border-dashed border-purple-200 bg-white p-10 text-center shadow-xs">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-50 text-purple-700">
                  <Hospital className="h-7 w-7" />
                </div>
                <h3 className="text-lg font-black text-slate-900">No Active Hospital Tenant Found</h3>
                <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                  Please onboard a new hospital facility from the directory.
                  {selectedHospitalCode ? (
                    <>
                      {' '}
                      Tenant{' '}
                      <span className="font-semibold text-purple-700">{selectedHospitalCode}</span> is no
                      longer available — it may have been purged or never existed.
                    </>
                  ) : null}
                </p>
                <button
                  type="button"
                  onClick={returnToTenantDirectory}
                  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-700 shadow-md transition hover:bg-slate-50 border border-slate-200"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Tenant Directory
                </button>
              </div>
            ) : (
            <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"/>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={`Search within ${selectedHospitalData?.name ?? 'this facility'}...`}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:border-purple-600 focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                  {['All', 'Admin', 'Doctor', 'Nurse', 'Receptionist', 'Pharmacist'].map((role) => (
                    <button
                      key={role}
                      onClick={() => setSelectedRoleFilter(role)}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition whitespace-nowrap cursor-pointer ${
                        selectedRoleFilter === role
                          ? 'bg-purple-700 text-white shadow-xs'
                          : 'bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>

              {scopedCredentials.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-purple-200 bg-purple-50/30 p-10 text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-purple-700 shadow-xs">
                    <ShieldCheck className="h-7 w-7" />
                  </div>
                  <h3 className="text-lg font-black text-slate-900">
                    {tenantRosterCount > 0
                      ? 'No Credentials Match Current Filters'
                      : 'No Credentials in This Vault Yet'}
                  </h3>
                  <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
                    {tenantRosterCount > 0
                      ? 'Adjust the role filter or search query to view credentials in this audit roster.'
                      : 'Hospital Admin and operational staff appear here after onboarding or when the Hospital Admin provisions staff from /dashboard.'}
                  </p>
                  <p className="mt-4 text-[11px] font-medium text-slate-500">
                    Showing {scopedCredentials.length} of {tenantRosterCount} credentials for{' '}
                    {tenantScopeLabel}
                  </p>
                </div>
              ) : (
              <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
                <div className="max-h-[580px] overflow-y-auto overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="sticky top-0 bg-slate-100 border-b border-slate-200 text-[10px] font-black text-slate-500 uppercase tracking-wider z-10">
                      <tr>
                        <th className="py-3 px-4">Staff Member & ID</th>
                        <th className="py-3 px-4">Department & Role</th>
                        <th className="py-3 px-4">Workspace Route</th>
                        <th className="py-3 px-4">Security Passcode</th>
                        <th className="py-3 px-4 text-center">Access Pass</th>
                        <th className="py-3 px-4 text-right">Revoke</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {scopedCredentials.map((staff) => {
                        const isVisible = visibleKeys[staff.id];
                        return (
                          <tr key={staff.id} className="hover:bg-purple-50/30 transition-colors">
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold tracking-wide bg-purple-50 text-purple-800 border border-purple-200">
                                  {staff.badge_id}
                                </span>
                                <div>
                                  <div className="font-bold text-slate-900 text-xs">{staff.full_name}</div>
                                  <div className="font-mono text-[10px] text-slate-400">{staff.email}</div>
                                </div>
                              </div>
                            </td>

                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-1.5">
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 border border-slate-200 text-slate-700">
                                  {staff.department}
                                </span>
                                <span className="text-[9px] font-bold font-mono text-purple-700">
                                  ● {staff.staff_type}
                                </span>
                              </div>
                            </td>

                            <td className="py-3.5 px-4 font-mono text-purple-700 font-semibold text-[11px]">
                              {staff.portal_access}
                            </td>

                            <td className="py-3.5 px-4 font-mono">
                              <div className="flex items-center gap-2">
                                <span className={`px-2.5 py-1 rounded text-[11px] font-bold border ${
                                  isVisible 
                                    ? 'bg-purple-50 text-purple-900 border-purple-200' 
                                    : 'bg-slate-100 text-slate-400 border-slate-200'
                                }`}>
                                  {isVisible ? staff.temporary_passcode : '••••••••••••••••'}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setVisibleKeys((prev) => ({ ...prev, [staff.id]: !isVisible }))}
                                  className="text-slate-400 hover:text-slate-700 transition cursor-pointer"
                                  title="Toggle Visibility"
                                >
                                  {isVisible ? <EyeOff className="w-3.5 h-3.5"/> : <Eye className="w-3.5 h-3.5"/>}
                                </button>
                              </div>
                            </td>

                            <td className="py-3.5 px-4 text-center">
                              <button
                                type="button"
                                onClick={() => copyLoginPacket(staff)}
                                className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[10px] font-bold uppercase transition cursor-pointer ${
                                  copiedId === staff.id
                                    ? 'bg-purple-100 border-purple-300 text-purple-800'
                                    : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                                }`}
                                title="Copy Access Pass"
                              >
                                {copiedId === staff.id ? <Check className="w-3.5 h-3.5"/> : <Copy className="w-3.5 h-3.5"/>}
                                <span>{copiedId === staff.id ? 'Copied' : 'Copy'}</span>
                              </button>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <button
                                type="button"
                                onClick={() => void handleDeleteStaffCredential(staff)}
                                disabled={deletingStaffId === staff.id}
                                className="p-1.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 transition hover:bg-rose-100 disabled:opacity-60"
                                title="Revoke Credential"
                              >
                                <Trash2 className={`w-3.5 h-3.5 ${deletingStaffId === staff.id ? 'animate-pulse' : ''}`} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
              )}

              <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 pt-2">
                <span>
                  Showing {scopedCredentials.length} credential{scopedCredentials.length === 1 ? '' : 's'} for{' '}
                  {tenantScopeLabel}
                </span>
                <span>Protected against cross-tenant exposure</span>
              </div>
            </div>
            )}
          </div>
        )}

        <OnboardHospitalModal
          open={showOnboardModal}
          onClose={() => setShowOnboardModal(false)}
          onSuccess={handleOnboardSuccess}
        />

        {/* Modal: Handover Pass */}
        {createdPacket && (
          <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in">
              <div className="text-center space-y-1.5">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-full w-fit mx-auto border border-emerald-200">
                  <ShieldCheck className="w-6 h-6"/>
                </div>
                <h3 className="text-lg font-black text-slate-900">Hospital Block Created!</h3>
                <p className="text-xs text-slate-500">Deliver this credential handover pass to the Hospital Administrator.</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 text-white font-mono text-xs space-y-2 border border-slate-800">
                <div className="text-purple-300 font-bold border-b border-slate-800 pb-1.5">
                  🏥 {createdPacket.hospital_name}
                </div>
                <div className="text-slate-300">Admin Name: <span className="text-white font-bold">{createdPacket.full_name}</span></div>
                <div className="text-slate-300">Official Login: <span className="text-white font-bold">{createdPacket.email}</span></div>
                <div className="text-slate-300">Security Passcode: <span className="text-emerald-400 font-bold">{createdPacket.temporary_passcode}</span></div>
                <div className="text-slate-300">
                  Login Gateway:{' '}
                  <span className="text-indigo-300 underline">{resolveAdminLoginUrl()}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => copyLoginPacket(createdPacket)}
                  className="flex-1 py-3 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  <Copy className="w-4 h-4"/>
                  <span>{copiedId === createdPacket.id ? 'Copied Pass!' : 'Copy Handover Pass'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCreatedPacket(null)}
                  className="px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

function SuperAdminHospitalBlocksDashboardFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm font-semibold text-slate-500">
      Syncing Super Admin tenant directory…
    </div>
  );
}

export default function SuperAdminHospitalBlocksDashboardPage() {
  return (
    <Suspense fallback={<SuperAdminHospitalBlocksDashboardFallback />}>
      <SuperAdminHospitalBlocksDashboard />
    </Suspense>
  );
}