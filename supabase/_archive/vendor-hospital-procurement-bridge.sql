-- Hospital ↔ Vendor procurement bridge (Regal RH-BLR-01)
-- Shared purchase_orders, shipments, invoices · safe to re-run.

CREATE TABLE IF NOT EXISTS public.purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL DEFAULT '11111111-1111-1111-1111-111111111111',
  po_number TEXT NOT NULL,
  hospital_name TEXT NOT NULL DEFAULT 'Regal Hospital',
  item_details TEXT,
  quantity_ordered INTEGER,
  total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'ISSUED',
  facility_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.purchase_orders
  ADD COLUMN IF NOT EXISTS vendor_id UUID DEFAULT '11111111-1111-1111-1111-111111111111',
  ADD COLUMN IF NOT EXISTS po_number TEXT,
  ADD COLUMN IF NOT EXISTS hospital_name TEXT DEFAULT 'Regal Hospital',
  ADD COLUMN IF NOT EXISTS item_details TEXT,
  ADD COLUMN IF NOT EXISTS quantity_ordered INTEGER,
  ADD COLUMN IF NOT EXISTS total_amount NUMERIC(12, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ISSUED',
  ADD COLUMN IF NOT EXISTS facility_code TEXT,
  ADD COLUMN IF NOT EXISTS hospital_code TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Mirror facility_code into hospital_code for vendor portal filtering.
UPDATE public.purchase_orders
SET hospital_code = COALESCE(hospital_code, facility_code, 'RH-BLR-01')
WHERE hospital_code IS NULL OR hospital_code = '';

CREATE INDEX IF NOT EXISTS idx_purchase_orders_hospital_code
  ON public.purchase_orders (vendor_id, hospital_code, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_purchase_orders_vendor_status
  ON public.purchase_orders (vendor_id, status, created_at DESC);

CREATE TABLE IF NOT EXISTS public.shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_id UUID REFERENCES public.purchase_orders(id),
  vendor_id UUID DEFAULT '11111111-1111-1111-1111-111111111111',
  tracking_number TEXT NOT NULL,
  carrier_name TEXT NOT NULL,
  driver_contact TEXT,
  status TEXT NOT NULL DEFAULT 'IN_TRANSIT',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.shipments
  ADD COLUMN IF NOT EXISTS vendor_id UUID DEFAULT '11111111-1111-1111-1111-111111111111',
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_id UUID REFERENCES public.purchase_orders(id),
  vendor_id UUID NOT NULL DEFAULT '11111111-1111-1111-1111-111111111111',
  invoice_number TEXT NOT NULL,
  subtotal NUMERIC(12, 2),
  tax_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'SUBMITTED',
  due_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS subtotal NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS due_date DATE,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.purchase_orders;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.shipments;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.invoices;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS purchase_orders_anon_all ON public.purchase_orders;
CREATE POLICY purchase_orders_anon_all ON public.purchase_orders FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS shipments_anon_all ON public.shipments;
CREATE POLICY shipments_anon_all ON public.shipments FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS invoices_anon_all ON public.invoices;
CREATE POLICY invoices_anon_all ON public.invoices FOR ALL USING (true) WITH CHECK (true);
