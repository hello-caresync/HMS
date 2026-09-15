BEGIN;

-- Canonical procurement schema (Phase 4 consolidation)
-- Sources:
--   purchase_orders → regal-enterprise-platform.sql
--   invoices, shipments → vendor-hospital-procurement-bridge.sql
-- Safe on existing databases: CREATE TABLE IF NOT EXISTS + ADD COLUMN IF NOT EXISTS per column.

-- ============================================================================
-- purchase_orders
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_number VARCHAR(50) UNIQUE NOT NULL,
  hospital_id UUID NOT NULL DEFAULT '11111111-1111-1111-1111-111111111111'
    REFERENCES public.hospitals(id),
  hospital_code VARCHAR(50) NOT NULL DEFAULT 'HOSP-01',
  facility_code VARCHAR(50) DEFAULT 'RH-BLR-01',
  hospital_name TEXT DEFAULT 'Regal Hospital',
  vendor_id UUID NOT NULL DEFAULT '11111111-1111-1111-1111-111111111111',
  vendor_name VARCHAR(150) NOT NULL DEFAULT 'MedSupply Dispatch Pvt Ltd',
  item_details TEXT,
  quantity_ordered INTEGER,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  status VARCHAR(50) NOT NULL DEFAULT 'ISSUED',
  items JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS po_number VARCHAR(50) NOT NULL DEFAULT 'LEGACY-PO';
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS hospital_id UUID NOT NULL DEFAULT '11111111-1111-1111-1111-111111111111';
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS hospital_code VARCHAR(50) NOT NULL DEFAULT 'HOSP-01';
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS facility_code VARCHAR(50) DEFAULT 'RH-BLR-01';
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS hospital_name TEXT DEFAULT 'Regal Hospital';
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS vendor_id UUID NOT NULL DEFAULT '11111111-1111-1111-1111-111111111111';
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS vendor_name VARCHAR(150) NOT NULL DEFAULT 'MedSupply Dispatch Pvt Ltd';
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS item_details TEXT;
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS quantity_ordered INTEGER;
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS total_amount NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS status VARCHAR(50) NOT NULL DEFAULT 'ISSUED';
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS items JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_purchase_orders_hospital
  ON public.purchase_orders (hospital_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_purchase_orders_hospital_code
  ON public.purchase_orders (vendor_id, hospital_code, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_purchase_orders_vendor_status
  ON public.purchase_orders (vendor_id, status, created_at DESC);

-- ============================================================================
-- shipments
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_id UUID REFERENCES public.purchase_orders(id) ON DELETE SET NULL,
  vendor_id UUID NOT NULL DEFAULT '11111111-1111-1111-1111-111111111111',
  tracking_number TEXT NOT NULL,
  carrier_name TEXT NOT NULL,
  driver_contact TEXT,
  status TEXT NOT NULL DEFAULT 'IN_TRANSIT',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS po_id UUID;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS vendor_id UUID NOT NULL DEFAULT '11111111-1111-1111-1111-111111111111';
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS tracking_number TEXT NOT NULL DEFAULT 'UNKNOWN';
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS carrier_name TEXT NOT NULL DEFAULT 'Unknown Carrier';
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS driver_contact TEXT;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'IN_TRANSIT';
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_shipments_po
  ON public.shipments (po_id, created_at DESC);

-- ============================================================================
-- invoices (vendor procurement)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_id UUID REFERENCES public.purchase_orders(id) ON DELETE SET NULL,
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

ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS po_id UUID;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS vendor_id UUID NOT NULL DEFAULT '11111111-1111-1111-1111-111111111111';
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS invoice_number TEXT NOT NULL DEFAULT 'LEGACY-INV';
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS subtotal NUMERIC(12, 2);
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS tax_amount NUMERIC(12, 2) NOT NULL DEFAULT 0;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'SUBMITTED';
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS due_date DATE;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_invoices_po
  ON public.invoices (po_id, created_at DESC);

COMMIT;
