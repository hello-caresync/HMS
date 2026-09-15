import { DELIVERY_WINDOWS } from '@/lib/hospital/procurement';

/** Default empty state for hospital purchase order forms. */
export const EMPTY_PO_FORM = {
  vendorId: '',
  vendorName: '',
  vendorEmail: '',
  category: 'General Supplies',
  itemName: '',
  skuDescription: '',
  quantity: 1,
  unitPrice: '',
  deliveryWindow: DELIVERY_WINDOWS[1] as string,
};

export type PurchaseOrderFormState = typeof EMPTY_PO_FORM;

/** Default empty state for legacy dashboard supply modal fields. */
export const EMPTY_SUPPLY_FORM = {
  vendor: '',
  category: 'Pharmaceuticals',
  item: '',
  sku: '',
  quantity: 1,
  unitPrice: '',
  deliveryWindow: DELIVERY_WINDOWS[1] as string,
};
