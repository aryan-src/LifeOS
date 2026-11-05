import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { AppShell } from '@/components/layout/app-shell';
import { WorkspaceHeader } from '@/components/navigation/workspace-header';
import { Analytics } from '@vercel/analytics/react';
import { getValidSiteUrl } from '@/lib/utils/url';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
});

const siteUrlObject = getValidSiteUrl();
const siteUrl = siteUrlObject.toString();

export const metadata: Metadata = {
  metadataBase: siteUrlObject,
  title: {
    default: 'LifeOS — A Quiet Personal Dashboard for Students and Builders',
    template: '%s | LifeOS',
  },
  description:
    'A quiet personal dashboard for students and builders: tasks, projects, assignments, habits, and an allowance-aware ledger, protected by Postgres Row-Level Security.',
  openGraph: {
    title: 'LifeOS — A Quiet Personal Dashboard for Students and Builders',
    description:
      'A quiet personal dashboard for students and builders: tasks, projects, assignments, habits, and an allowance-aware ledger, protected by Postgres Row-Level Security.',
    url: siteUrl,
    siteName: 'LifeOS',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LifeOS — A Quiet Personal Dashboard for Students and Builders',
    description:
      'A quiet personal dashboard for students and builders: tasks, projects, assignments, habits, and an allowance-aware ledger, protected by Postgres Row-Level Security.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('lifeos_theme')||localStorage.getItem('theme')||'nordic';if(t==='spatial-glass'){document.documentElement.setAttribute('data-theme','spatial-glass');}else if(t==='risograph'||t==='crimson-dark'||t==='crimson-cream'||t==='crimson-light'){document.documentElement.setAttribute('data-theme','risograph');if(t==='crimson-dark'||t==='crimson-cream'){document.documentElement.classList.add('dark');}else{document.documentElement.classList.remove('dark');}}else if(t==='tui'||t==='dark'){document.documentElement.setAttribute('data-theme','tui');document.documentElement.classList.add('dark');}else if(t==='tactile'){document.documentElement.setAttribute('data-theme','tactile');document.documentElement.classList.remove('dark');}else{document.documentElement.setAttribute('data-theme','nordic');document.documentElement.classList.remove('dark');}}catch(e){}})();`,
          }}
        />
      </head>
      <body
        suppressHydrationWarning
        className="bg-[#FAF9F5] dark:bg-zinc-950 font-sans text-stone-900 dark:text-zinc-100 antialiased selection:bg-secondary-container selection:text-on-secondary-container"
      >
        <AppShell>
          <WorkspaceHeader />
          <main className="w-full max-w-7xl mx-auto px-6 pb-28 sm:pb-32 flex-1 flex flex-col">
            {children}
          </main>
        </AppShell>
        <Analytics />
      </body>
    </html>
  );
}
