'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { toast } from 'sonner';

import { SupplyOrdersCommandCenter } from '@/components/hospital/SupplyOrdersCommandCenter';
import { readHospitalAppSession } from '@/lib/auth/ecosystem-sessions';
import { isHospitalUuid } from '@/lib/hospital/resolve-hospital-context';
import { fetchPurchaseOrders, type PurchaseOrderRow } from '@/lib/hospital/procurement';
import { HOSPITAL_TENANT_ID } from '@/lib/regal/constants';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export default function DashboardSupplyPage() {
  const session = readHospitalAppSession();
  const hospitalId = isHospitalUuid(session?.hospital_id ?? '')
    ? session!.hospital_id!.trim()
    : session?.hospital_id?.trim() || HOSPITAL_TENANT_ID;

  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrderRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const loadPurchaseOrders = useCallback(async () => {
    if (!supabase) {
      setPurchaseOrders([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const orders = await fetchPurchaseOrders(supabase, hospitalId);
      setPurchaseOrders(orders);
    } catch (err: unknown) {
      console.error('Unexpected query error:', err);
      toast.error('Could not refresh orders list');
      setPurchaseOrders([]);
    } finally {
      setLoading(false);
    }
  }, [hospitalId]);

  useEffect(() => {
    void loadPurchaseOrders();
  }, [loadPurchaseOrders]);

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <SupplyOrdersCommandCenter
        hospitalId={hospitalId}
        hospitalName={session?.hospital_name || 'Regal Hospital'}
        purchaseOrders={purchaseOrders}
        ordersLoading={loading}
        onRefreshPurchaseOrders={loadPurchaseOrders}
        onPurchaseOrdersChange={setPurchaseOrders}
      />
    </div>
  );
}
