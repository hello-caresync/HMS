-- Remove legacy seed/demo purchase orders from the live procurement table.
DELETE FROM public.procurement_purchase_orders
WHERE po_number IN ('RH-PO-2026-2002', 'RH-PO-2026-9894', 'RH-PO-2026-5374')
   OR vendor_name IN ('MedSupply Dispatch Pvt Ltd', 'Apex Pharma Distributors');

NOTIFY pgrst, 'reload schema';
