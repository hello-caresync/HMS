import type { Metadata } from 'next';

import ErpAppShell from './components/layout/ErpAppShell';
import AppProviders from './components/auth/AppProviders';
import './globals.css';
import { Geist, Geist_Mono } from 'next/font/google';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Nexora Hospital Back-Office ERP',
  description: 'Central hospital operations — clinical, financial, and administrative command center',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[#f1f5f9]">
        <AppProviders>
          <ErpAppShell>{children}</ErpAppShell>
        </AppProviders>
      </body>
    </html>
  );
}
