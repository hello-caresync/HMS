'use client';

import type { AssetMasterRecord } from '../lib/assetMockData';
import { AMC_RECORDS, CALIBRATION_RECORDS, formatInr, formatInrCr } from '../lib/assetMockData';
import {
  AmcStatusPill,
  AssetStatusPill,
  CalibrationPill,
  CategoryPill,
  DrawerOverlay,
  SecureCompliancePlaceholder,
} from './assetUi';

type AssetDetailDrawerProps = {
  asset: AssetMasterRecord;
  onClose: () => void;
};

export function AssetDetailDrawer({ asset, onClose }: AssetDetailDrawerProps) {
  const amc = AMC_RECORDS.find((a) => a.assetTag === asset.assetTag);
  const cal = CALIBRATION_RECORDS.find((c) => c.assetTag === asset.assetTag);

  return (
    <DrawerOverlay title={asset.name} subtitle={`${asset.assetTag} · ${asset.department}`} onClose={onClose}>
      <SecureCompliancePlaceholder verified={asset.complianceVerified} />
      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-md border border-[#E2E8F0] bg-[#F8FAFC] p-2">
          <p className="text-[8px] font-bold uppercase text-slate-500">Status</p>
          <AssetStatusPill status={asset.status} />
        </div>
        <div className="rounded-md border border-[#E2E8F0] bg-[#F8FAFC] p-2">
          <p className="text-[8px] font-bold uppercase text-slate-500">Category</p>
          <CategoryPill category={asset.category} />
        </div>
        <div className="rounded-md border border-[#E2E8F0] bg-[#F8FAFC] p-2">
          <p className="text-[8px] font-bold uppercase text-slate-500">Net Book Value</p>
          <p className="text-[11px] font-bold tabular-nums text-[#2563EB]">{formatInrCr(asset.netBookValue)}</p>
        </div>
        <div className="rounded-md border border-[#E2E8F0] bg-[#F8FAFC] p-2">
          <p className="text-[8px] font-bold uppercase text-slate-500">Warranty Expiry</p>
          <p className="text-[10px] font-semibold">{asset.warrantyExpiry}</p>
        </div>
      </div>
      <div className="mt-3 space-y-2 text-[9px]">
        <p><span className="font-bold text-slate-500">Serial Ref:</span> {asset.serialRef}</p>
        <p><span className="font-bold text-slate-500">QR/RFID Tag:</span> {asset.qrRfidTag}</p>
        <p><span className="font-bold text-slate-500">Purchase Date:</span> {asset.purchaseDate}</p>
        <p><span className="font-bold text-slate-500">AMC Vendor:</span> {asset.amcVendor}</p>
      </div>
      {amc && (
        <div className="mt-3 rounded-md border border-slate-100 p-2">
          <p className="mb-1 text-[9px] font-bold uppercase text-slate-500">AMC Contract</p>
          <p className="text-[9px]">SLA Response: {amc.slaResponseHrs}h · Resolution: {amc.slaResolutionHrs}h</p>
          <p className="text-[9px]">Annual: {formatInr(amc.annualCost)} · End: {amc.contractEnd}</p>
          <AmcStatusPill status={amc.status} />
        </div>
      )}
      {cal && (
        <div className="mt-2 rounded-md border border-slate-100 p-2">
          <p className="mb-1 text-[9px] font-bold uppercase text-slate-500">Calibration</p>
          <p className="text-[9px]">{cal.regulatoryBody}</p>
          <p className="text-[9px]">Due: {cal.dueDate}</p>
          <CalibrationPill status={cal.status} />
        </div>
      )}
    </DrawerOverlay>
  );
}
