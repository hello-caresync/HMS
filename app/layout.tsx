import type { Metadata } from 'next';

import './globals.css';

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
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
