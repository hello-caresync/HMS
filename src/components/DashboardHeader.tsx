import Link from "next/link";

export function DashboardHeader() {
  return (
    <header className="border-b border-white/10 bg-zinc-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-zinc-500">
            CareSync Admin
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-50">
            Dashboard
          </h1>
        </div>
        <Link
          href="/"
          className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:border-white/20 hover:bg-white/5 hover:text-zinc-50"
        >
          Home
        </Link>
      </div>
    </header>
  );
}
