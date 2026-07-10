'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

import { APP_ROUTES } from '../../lib/routes';

import {
  VendorUserRole,
  HubActiveModule,
  POInboxFilter,
  EnterprisePO,
  GeneratedInvoice,
  ChatMessage,
  ComplianceDoc,
  ReturnRequest,
  POExtendedStatus,
} from './types';

import POInboxView from './components/POInboxView';
import LogisticsView from './components/LogisticsView';
import BillingView from './components/BillingView';
import CatalogView from './components/CatalogView';
import DocumentsView from './components/DocumentsView';
import ChatView from './components/ChatView';
import ReturnsView from './components/ReturnsView';
import AnalyticsView from './components/AnalyticsView';
import VendorSidebar from './components/VendorSidebar';
import RoleSelectorDropdown from '../../components/RoleSelectorDropdown';
import { VENDOR_NAV_ITEMS, isHubActiveModule } from './navConfig';
import { useRealtimeInventory } from '../../hooks/useRealtimeInventory';
import { toVendorCatalogProducts } from '../../lib/inventoryBus';
import {
  DashboardShellSkeleton,
  GlobalMetricsSummary,
  ModuleSkeleton,
} from './components/hubUi';
import {
  computePoLineTotal,
  normalizeChatThreads,
  normalizeInvoices,
  normalizePurchaseOrders,
  normalizeReturnsList,
  parseStorageArray,
} from './utils/storageSafe';

const SHARED_STORAGE_KEYS = {
  pos: 'curasync_shared_pos',
  invoices: 'curasync_shared_invoices',
  chats: 'curasync_shared_chats',
  returns: 'curasync_shared_returns',
} as const;

const VENDOR_ROLES: VendorUserRole[] = [
  'ADMIN',
  'SALES_MANAGER',
  'BILLING_STAFF',
  'LOGISTICS_STAFF',
];

const ROLE_LABELS: Record<VendorUserRole, string> = {
  ADMIN: 'Company Administrator',
  SALES_MANAGER: 'Sales Operations Manager',
  BILLING_STAFF: 'Billing Clerk',
  LOGISTICS_STAFF: 'Logistics Agent',
};

const NAV_ITEMS = VENDOR_NAV_ITEMS;

export default function VendorSecureHubWorkspace() {
  const searchParams = useSearchParams();
  const [isMounted, setIsMounted] = useState(false);
  const [currentRole, setCurrentRole] = useState<VendorUserRole>('ADMIN');
  const [activeModule, setActiveModule] = useState<HubActiveModule>('po_inbox');
  const [isModuleLoading, setIsModuleLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [poStatusFilter, setPoStatusFilter] = useState<POInboxFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [purchaseOrders, setPurchaseOrders] = useState<EnterprisePO[]>([]);
  const [invoices, setInvoices] = useState<GeneratedInvoice[]>([]);
  const [chatThreads, setChatThreads] = useState<ChatMessage[]>([]);
  const [returnsList, setReturnsList] = useState<ReturnRequest[]>([]);

  const [trackingInput, setTrackingInput] = useState<string>('');
  const [podReceiver, setPodReceiver] = useState<string>('');
  const [podQty, setPodQty] = useState<string>('');
  const [chatInput, setChatInput] = useState<string>('');

  const { inventory } = useRealtimeInventory();
  const catalog = useMemo(
    () => toVendorCatalogProducts(inventory),
    [inventory],
  );

  const [documents] = useState<ComplianceDoc[]>([
    {
      id: 'DOC-GST',
      name: 'Corporate GSTIN Certificate (Form REG-06)',
      type: 'Tax Registration',
      status: 'Verified',
    },
    {
      id: 'DOC-DRUG',
      name: 'Wholesale Drug License (Form 20B/21B)',
      type: 'Medical Compliance',
      status: 'Verified',
      expiryDate: '2029-12-31',
    },
  ]);

  useEffect(() => {
    const moduleParam = searchParams.get('module');
    if (isHubActiveModule(moduleParam) && moduleParam !== 'po_inbox') {
      setActiveModule(moduleParam);
    }
  }, [searchParams]);

  useEffect(() => {
    const runMemorySync = () => {
      if (typeof window === 'undefined') return;

      try {
        setPurchaseOrders(
          parseStorageArray(
            localStorage.getItem(SHARED_STORAGE_KEYS.pos),
            normalizePurchaseOrders,
          ),
        );
        setInvoices(
          parseStorageArray(
            localStorage.getItem(SHARED_STORAGE_KEYS.invoices),
            normalizeInvoices,
          ),
        );
        setChatThreads(
          parseStorageArray(
            localStorage.getItem(SHARED_STORAGE_KEYS.chats),
            normalizeChatThreads,
          ),
        );
        setReturnsList(
          parseStorageArray(
            localStorage.getItem(SHARED_STORAGE_KEYS.returns),
            normalizeReturnsList,
          ),
        );
      } catch {
        setPurchaseOrders([]);
        setInvoices([]);
        setChatThreads([]);
        setReturnsList([]);
      }
    };

    runMemorySync();
    setIsMounted(true);

    window.addEventListener('storage', runMemorySync);
    const poller = window.setInterval(runMemorySync, 1000);

    return () => {
      window.removeEventListener('storage', runMemorySync);
      window.clearInterval(poller);
    };
  }, []);

  const safePurchaseOrders = useMemo(
    () => purchaseOrders ?? [],
    [purchaseOrders],
  );
  const safeInvoices = useMemo(() => invoices ?? [], [invoices]);
  const safeChatThreads = useMemo(() => chatThreads ?? [], [chatThreads]);
  const safeReturnsList = useMemo(() => returnsList ?? [], [returnsList]);

  const triggerToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 3500);
  };

  const persistPurchaseOrders = (updated: EnterprisePO[]) => {
    const normalized = normalizePurchaseOrders(updated);
    setPurchaseOrders(normalized);
    if (typeof window !== 'undefined') {
      localStorage.setItem(
        SHARED_STORAGE_KEYS.pos,
        JSON.stringify(normalized),
      );
    }
  };

  const updatePOStatus = (poId: string, nextStatus: POExtendedStatus) => {
    const updated = safePurchaseOrders.map((po) =>
      po.id === poId
        ? {
            ...po,
            status: nextStatus,
            courierTrackingId:
              nextStatus === 'Dispatched' ? trackingInput : po.courierTrackingId,
          }
        : po,
    );

    persistPurchaseOrders(updated);
    triggerToast(`Order status updated to ${nextStatus}`);

    if (nextStatus === 'Dispatched') {
      setTrackingInput('');
    }
  };

  const registerPODDelivery = (poId: string) => {
    if (!podReceiver.trim()) {
      triggerToast('Compliance failure: receiver name required.');
      return;
    }

    const finalQty = parseInt(podQty, 10) || 5000;
    const updated = safePurchaseOrders.map((po) =>
      po.id === poId
        ? {
            ...po,
            status: 'Delivered' as POExtendedStatus,
            receiverName: podReceiver,
            items: (po.items ?? []).map((item) => ({
              ...item,
              quantityDelivered: finalQty,
            })),
          }
        : po,
    );

    persistPurchaseOrders(updated);
    triggerToast(`POD saved for ${podReceiver}.`);
    setPodReceiver('');
    setPodQty('');
  };

  const executeInvoiceGeneration = (po: EnterprisePO) => {
    const base = computePoLineTotal(po);
    const gst = base * 0.12;

    const newInv: GeneratedInvoice = {
      id: `INV-CURA-${Math.floor(2000 + Math.random() * 7000)}`,
      poReferenceId: po.id ?? '—',
      hospitalName: po.hospitalName ?? 'Unknown Hospital',
      baseAmount: base,
      gstAmount: gst,
      totalAmount: base + gst,
      status: 'Submitted',
      dateCreated: new Date().toISOString().split('T')[0],
    };

    const updatedInvoices = normalizeInvoices([newInv, ...safeInvoices]);
    setInvoices(updatedInvoices);
    if (typeof window !== 'undefined') {
      localStorage.setItem(
        SHARED_STORAGE_KEYS.invoices,
        JSON.stringify(updatedInvoices),
      );
    }
    triggerToast(`Tax invoice ${newInv.id} compiled.`);
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const newMsg: ChatMessage = {
      id: `MSG-${Date.now()}`,
      sender: 'Vendor',
      text: chatInput.trim(),
      timestamp: 'Just Now',
    };

    const updatedChats = normalizeChatThreads([...safeChatThreads, newMsg]);
    setChatThreads(updatedChats);
    if (typeof window !== 'undefined') {
      localStorage.setItem(
        SHARED_STORAGE_KEYS.chats,
        JSON.stringify(updatedChats),
      );
    }
    setChatInput('');
  };

  const handleProcessReturn = (returnId: string) => {
    const updated = normalizeReturnsList(
      safeReturnsList.map((ret) =>
        ret.id === returnId
          ? { ...ret, status: 'Received & Replaced' as const }
          : ret,
      ),
    );

    setReturnsList(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem(
        SHARED_STORAGE_KEYS.returns,
        JSON.stringify(updated),
      );
    }
    triggerToast('Reverse logistics pickup finalized.');
  };

  const totalBilledAmount = safeInvoices.reduce(
    (sum, inv) => sum + (Number(inv?.totalAmount) || 0),
    0,
  );
  const totalPaidRevenue = safeInvoices
    .filter((inv) => inv?.status === 'Paid')
    .reduce((sum, inv) => sum + (Number(inv?.totalAmount) || 0), 0);

  const newPoCount = safePurchaseOrders.filter((po) => po?.status === 'New').length;
  const inPipelineCount = safePurchaseOrders.filter(
    (po) =>
      po?.status !== 'New' &&
      po?.status !== 'Rejected' &&
      po?.status !== 'Delivered',
  ).length;

  const openInvoicesCount = safeInvoices.filter(
    (inv) => inv?.status !== 'Paid',
  ).length;

  const renderActiveModule = () => {
    if (isModuleLoading) return <ModuleSkeleton />;

    switch (activeModule) {
      case 'po_inbox':
        return (
          <POInboxView
            purchaseOrders={safePurchaseOrders}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            poStatusFilter={poStatusFilter}
            setPoStatusFilter={setPoStatusFilter}
            updatePOStatus={updatePOStatus}
          />
        );
      case 'logistics':
        return (
          <LogisticsView
            purchaseOrders={safePurchaseOrders}
            trackingInput={trackingInput}
            setTrackingInput={setTrackingInput}
            podReceiver={podReceiver}
            setPodReceiver={setPodReceiver}
            podQty={podQty}
            setPodQty={setPodQty}
            updatePOStatus={updatePOStatus}
            registerPODDelivery={registerPODDelivery}
          />
        );
      case 'billing':
        return (
          <BillingView
            purchaseOrders={safePurchaseOrders}
            invoices={safeInvoices}
            currentRole={currentRole}
            executeInvoiceGeneration={executeInvoiceGeneration}
          />
        );
      case 'catalog':
        return <CatalogView catalog={catalog ?? []} />;
      case 'documents':
        return (
          <DocumentsView
            documents={documents ?? []}
            triggerToast={triggerToast}
          />
        );
      case 'communication':
        return (
          <ChatView
            chatThreads={safeChatThreads}
            chatInput={chatInput}
            setChatInput={setChatInput}
            handleSendChat={handleSendChat}
          />
        );
      case 'returns':
        return (
          <ReturnsView
            returnsList={safeReturnsList}
            handleProcessReturn={handleProcessReturn}
          />
        );
      case 'analytics':
        return (
          <AnalyticsView
            totalPaidRevenue={totalPaidRevenue}
            totalBilledAmount={totalBilledAmount}
          />
        );
      default:
        return null;
    }
  };

  if (!isMounted) {
    return <DashboardShellSkeleton />;
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#F4F7F6] text-slate-900 flex flex-col font-sans antialiased">
      <header className="shrink-0 z-30 flex flex-col gap-3 border-b border-[#3d4f50] bg-[#4A5D5E] px-6 py-3.5 text-white shadow-md md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md border border-white/20 bg-white/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-200">
              Secure B2B Node
            </span>
            <h1 className="text-lg font-black tracking-tight text-white">
              CuraSync Logistics & Supply Portal
            </h1>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <Link
              href={APP_ROUTES.vendorGateway}
              className="text-xs font-semibold text-white/70 transition-colors hover:text-white"
            >
              ← Supplier gateway
            </Link>
            <span className="hidden text-white/30 sm:inline">·</span>
            <Link
              href={APP_ROUTES.hospital}
              className="text-xs font-semibold text-white/70 transition-colors hover:text-white"
            >
              Hospital procurement console →
            </Link>
            <span className="hidden text-white/30 sm:inline">·</span>
            <Link
              href={APP_ROUTES.patient}
              className="text-xs font-semibold text-white/70 transition-colors hover:text-white"
            >
              Patient prescription console →
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-white/15 bg-[#3d4f50]/80 px-3 py-2">
          <span className="shrink-0 text-[10px] font-black uppercase tracking-wider text-white/60">
            Role
          </span>
          <RoleSelectorDropdown
            value={currentRole}
            onChange={setCurrentRole}
            options={VENDOR_ROLES.map((role) => ({
              value: role,
              label: ROLE_LABELS[role],
            }))}
            align="right"
          />
        </div>
      </header>

      {toast && (
        <div
          role="status"
          className="fixed top-5 right-5 z-[250] flex items-center gap-2.5 rounded-xl border border-slate-700 bg-slate-900 px-5 py-3.5 text-xs font-medium text-white shadow-lg"
        >
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
          {toast}
        </div>
      )}

      <div className="relative flex w-full flex-1 overflow-hidden">
        <VendorSidebar
          navItems={NAV_ITEMS}
          activeModule={activeModule}
          newPoCount={newPoCount}
        />

        <main className="custom-scrollbar flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-[#F4F7F6]">
          {activeModule === 'po_inbox' && (
            <div className="mx-auto w-full max-w-5xl shrink-0 space-y-0 px-6 pt-6 pb-4">
              <GlobalMetricsSummary
                newPoCount={newPoCount}
                inPipelineCount={inPipelineCount}
                openInvoicesCount={openInvoicesCount}
              />
            </div>
          )}

          <div
            className={`custom-scrollbar flex-1 overflow-y-auto px-6 pb-24 ${activeModule === 'po_inbox' ? '' : 'pt-6'}`}
          >
            <div className="mx-auto w-full max-w-5xl">
              {renderActiveModule()}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
