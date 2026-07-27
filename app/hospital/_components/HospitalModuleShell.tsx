import type { HospitalModuleConfig } from '../_config/moduleRegistry';

type HospitalModuleShellProps = HospitalModuleConfig;

export default function HospitalModuleShell({
  title,
  description,
  layer,
  features,
  metrics,
}: HospitalModuleShellProps) {
  return (
    <div className="w-full">
      <header className="mb-6 border-b border-slate-200/60 pb-5">
        <span className="inline-block rounded-full bg-[#00A481]/10 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-[#00A481]">
          {layer}
        </span>
        <h1 className="mt-3 text-2xl font-bold text-[#00758C] sm:text-3xl">{title}</h1>
        <p className="mt-2 max-w-3xl text-base leading-relaxed text-slate-600">{description}</p>
      </header>

      {metrics && metrics.length > 0 ? (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {metrics.map((metric) => (
            <div
              key={metric.label}
              className="rounded-xl border border-slate-200/60 border-t-4 border-t-[#00A481] bg-white p-4 shadow-sm"
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                {metric.label}
              </p>
              <p className="mt-1 text-xl font-bold tabular-nums text-[#00758C]">{metric.value}</p>
            </div>
          ))}
        </div>
      ) : null}

      <div className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm">
        <p className="mb-4 text-lg font-semibold text-[#008588]">
          Module Capability Matrix
        </p>
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {features.map((feature) => (
            <li
              key={feature}
              className="flex items-center gap-2 rounded-lg border border-slate-200/60 bg-slate-50/50 px-3 py-2 text-sm font-medium text-slate-700"
            >
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#5EC283]" aria-hidden />
              {feature}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
