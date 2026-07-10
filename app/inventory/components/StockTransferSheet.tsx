'use client';

import { useMemo, useState } from 'react';
import { ArrowRightLeft } from 'lucide-react';

import Sheet from '../../master-data/components/shared/Sheet';
import { useInventory } from '../context/InventoryProvider';
import { SOURCE_LOCATIONS, TARGET_DEPARTMENTS } from '../types';

type StockTransferSheetProps = {
  open: boolean;
  onClose: () => void;
};

export default function StockTransferSheet({ open, onClose }: StockTransferSheetProps) {
  const { items, initiateTransfer } = useInventory();
  const [itemId, setItemId] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  const [sourceLocation, setSourceLocation] = useState<string>(SOURCE_LOCATIONS[0]);
  const [targetDepartment, setTargetDepartment] = useState<string>(TARGET_DEPARTMENTS[0]);
  const [quantity, setQuantity] = useState('');
  const [error, setError] = useState<string | null>(null);

  const transferableItems = useMemo(
    () => items.filter((i) => i.batchNumber && i.quantityOnHand > 0),
    [items],
  );

  const selectedItem = items.find((i) => i.id === itemId);
  const availableQty = selectedItem?.batchNumber === batchNumber ? selectedItem.quantityOnHand : 0;
  const qtyNum = parseInt(quantity, 10) || 0;
  const exceedsAvailable = qtyNum > availableQty && qtyNum > 0;

  const handleClose = () => {
    setItemId('');
    setBatchNumber('');
    setQuantity('');
    setError(null);
    onClose();
  };

  const handleItemChange = (id: string) => {
    setItemId(id);
    const item = items.find((i) => i.id === id);
    setBatchNumber(item?.batchNumber ?? '');
    setSourceLocation(item?.location ?? SOURCE_LOCATIONS[0]);
    setError(null);
  };

  const handleSubmit = () => {
    if (!itemId || !batchNumber) {
      setError('Select an item and batch');
      return;
    }
    const result = initiateTransfer({
      itemId,
      batchNumber,
      sourceLocation,
      targetDepartment,
      quantity: qtyNum,
    });
    if (!result.success) {
      setError(result.error ?? 'Transfer failed');
      return;
    }
    handleClose();
  };

  return (
    <Sheet
      open={open}
      title="Initiate Stock Transfer"
      description="Internal requisition — source to department"
      onClose={handleClose}
      width="lg"
    >
      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-[10px] font-bold uppercase text-slate-800">
            Select Item
          </label>
          <select
            value={itemId}
            onChange={(e) => handleItemChange(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="">Choose inventory line…</option>
            {transferableItems.map((i) => (
              <option key={i.id} value={i.id}>
                {i.itemName} · {i.sku}
              </option>
            ))}
          </select>
        </div>

        {selectedItem && (
          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase text-slate-800">
              Batch Number
            </label>
            <div className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-2">
              <p className="font-mono text-sm font-semibold text-slate-800">
                {selectedItem.batchNumber}
              </p>
              <p className="text-[10px] text-slate-800">
                Available:{' '}
                <span className="font-mono font-bold text-indigo-700">
                  {selectedItem.quantityOnHand} {selectedItem.unit}
                </span>
              </p>
            </div>
          </div>
        )}

        <div>
          <label className="mb-1 block text-[10px] font-bold uppercase text-slate-800">
            Source Location
          </label>
          <select
            value={sourceLocation}
            onChange={(e) => setSourceLocation(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            {SOURCE_LOCATIONS.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-[10px] font-bold uppercase text-slate-800">
            Target Department Destination
          </label>
          <select
            value={targetDepartment}
            onChange={(e) => setTargetDepartment(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            {TARGET_DEPARTMENTS.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-[10px] font-bold uppercase text-slate-800">
            Transfer Quantity
          </label>
          <input
            type="number"
            min={1}
            max={availableQty}
            value={quantity}
            onChange={(e) => {
              setQuantity(e.target.value);
              setError(null);
            }}
            className={`w-full rounded-lg border px-2.5 py-1.5 font-mono text-sm tabular-nums focus:outline-none focus:ring-2 ${
              exceedsAvailable
                ? 'border-rose-400 bg-rose-50 focus:border-rose-500 focus:ring-rose-500/20'
                : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20'
            }`}
            placeholder="0"
          />
          {exceedsAvailable && (
            <p className="mt-1 text-[10px] font-semibold text-rose-600">
              Quantity exceeds available batch count ({availableQty})
            </p>
          )}
        </div>

        {error && (
          <p className="rounded-md border border-rose-200 bg-rose-50 px-2 py-1.5 text-xs text-rose-700">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!itemId || !quantity || exceedsAvailable || qtyNum <= 0}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ArrowRightLeft className="h-4 w-4" />
          Submit Transfer Request
        </button>
      </div>
    </Sheet>
  );
}
