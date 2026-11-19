import type { Metadata, Viewport } from 'next';
import { DM_Sans, Syne } from 'next/font/google';
import { Providers } from '@/components/providers';
import { PwaRegister } from '@/components/PwaRegister';
import './globals.css';

const syne = Syne({
  subsets: ['latin'],
  variable: '--font-syne',
  weight: ['500', '600', '700', '800'],
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: {
    default: 'Platform Cardápio — pedidos que convertem',
    template: '%s · Platform Cardápio',
  },
  description:
    'Cardápio digital, gestão de pedidos e billing pré-pago para restaurantes e comércios.',
  applicationName: 'Platform Cardápio',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'Platform Cardápio',
    statusBarStyle: 'default',
  },
  openGraph: {
    title: 'Platform Cardápio',
    description: 'Cardápio digital e pedidos para restaurantes.',
    locale: 'pt_BR',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#12261c' },
    { media: '(prefers-color-scheme: dark)', color: '#0c1410' },
  ],
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${syne.variable} ${dmSans.variable} antialiased`}>
        <Providers>
          <PwaRegister />
          {children}
        </Providers>
      </body>
    </html>
  );
}
