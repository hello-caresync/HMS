import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

import { AppProviders } from './providers';

import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Nexora ERP',
  description: 'Hospital enterprise resource planning',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="font-sans antialiased" style={{ fontFamily: 'var(--font-inter), Inter, system-ui, sans-serif' }}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
