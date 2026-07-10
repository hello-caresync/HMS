import type { ComputedLineItem, InvoiceLineItem, InvoiceTotals } from '../types';

export function computeLineTax(
  basePrice: number,
  gstPercent: number,
  quantity = 1,
): number {
  return Math.round(basePrice * quantity * (gstPercent / 100) * 100) / 100;
}

export function computeLineNet(
  basePrice: number,
  gstPercent: number,
  quantity = 1,
): number {
  const sub = basePrice * quantity;
  return Math.round((sub + computeLineTax(basePrice, gstPercent, quantity)) * 100) / 100;
}

export function computeLineItem(line: InvoiceLineItem): ComputedLineItem {
  const taxAmount = computeLineTax(line.basePrice, line.gstPercent, line.quantity);
  const netTotal = computeLineNet(line.basePrice, line.gstPercent, line.quantity);
  return { ...line, taxAmount, netTotal };
}

export function computeInvoiceTotals(
  lineItems: InvoiceLineItem[],
  discount: number,
): InvoiceTotals {
  const computed = lineItems.map(computeLineItem);
  const subtotal = computed.reduce((s, l) => s + l.basePrice * l.quantity, 0);
  const totalTax = computed.reduce((s, l) => s + l.taxAmount, 0);
  const safeDiscount = Math.max(0, Math.min(discount, subtotal + totalTax));
  const grandTotal = Math.round((subtotal + totalTax - safeDiscount) * 100) / 100;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    totalTax: Math.round(totalTax * 100) / 100,
    discount: safeDiscount,
    grandTotal,
  };
}

export function validateSplitTotal(
  splits: { amount: number }[],
  grandTotal: number,
  tolerance = 0.01,
): { valid: boolean; splitSum: number; difference: number } {
  const splitSum = Math.round(splits.reduce((s, l) => s + (l.amount || 0), 0) * 100) / 100;
  const difference = Math.round((splitSum - grandTotal) * 100) / 100;
  return {
    valid: Math.abs(difference) <= tolerance,
    splitSum,
    difference,
  };
}
