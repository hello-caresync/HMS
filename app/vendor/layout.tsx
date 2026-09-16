import type { ReactNode } from 'react';

export default function VendorLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen w-full overscroll-none bg-gradient-to-br from-[#faf7fe] via-[#f4ecfd] to-[#eee4fb] text-[#2e1053] antialiased">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-[#ceaef2]/35 blur-[120px]" />
        <div className="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-[#a36fdb]/25 blur-[130px]" />
      </div>
      {children}
    </div>
  );
}
