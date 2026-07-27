'use client';

/** Styled mock GPS tracker — warehouse → hospital with progress. */
export function LiveRouteMap({
  progressPct = 68,
  driverName = 'R. Kumar',
  origin = 'MedSupply Warehouse · BLR',
  destination = 'Nexora City Hospital',
}: {
  progressPct?: number;
  driverName?: string;
  origin?: string;
  destination?: string;
}) {
  return (
    <div className="rounded-xl border border-vendor-accent/25 bg-gradient-to-br from-vendor-cream to-white p-4">
      <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wide text-vendor-muted">
        <span>Live route</span>
        <span className="text-vendor-success">In transit</span>
      </div>
      <div className="relative mt-4 h-28 overflow-hidden rounded-lg bg-vendor-charcoal/90">
        <svg viewBox="0 0 320 100" className="h-full w-full" aria-hidden>
          <path d="M20,70 Q80,20 160,50 T300,40" fill="none" stroke="#FFB703" strokeWidth="3" strokeDasharray="6 4" />
          <circle cx="20" cy="70" r="6" fill="#F77F00" />
          <circle cx="300" cy="40" r="6" fill="#2A9D8F" />
          <circle cx={20 + (280 * progressPct) / 100} cy={70 - (30 * progressPct) / 100} r="8" fill="#FFB703" />
        </svg>
        <p className="absolute bottom-2 left-2 text-[10px] font-bold text-white/90">{origin}</p>
        <p className="absolute right-2 top-2 text-[10px] font-bold text-white/90">{destination}</p>
      </div>
      <div className="mt-3">
        <div className="flex justify-between text-xs font-bold text-vendor-charcoal">
          <span>Driver · {driverName}</span>
          <span>{progressPct}% complete</span>
        </div>
        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-vendor-accent/25">
          <div className="h-full rounded-full bg-vendor-primary transition-all" style={{ width: `${progressPct}%` }} />
        </div>
      </div>
    </div>
  );
}
