import type { Metadata } from 'next';
import { DM_Sans, Syne } from 'next/font/google';
import { Providers } from '@/components/providers';
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
  title: 'Platform Cardápio — pedidos que convertem',
  description:
    'Cardápio digital, gestão de pedidos e billing pré-pago para restaurantes e comércios.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${syne.variable} ${dmSans.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
