import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Sarabun } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { site } from '@/content/site';
import { t } from '@/lib/i18n';

const sarabun = Sarabun({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['thai', 'latin'],
  variable: '--font-sarabun',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: `${t(site.name)} — ${t(site.tagline)}`,
  description: t(site.hero.body),
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="th" suppressHydrationWarning>
      <body className={`${sarabun.variable} font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
