import type { Metadata } from 'next';
import { Geist, JetBrains_Mono, Playfair_Display } from 'next/font/google';
import './globals.css';
import { Analytics } from '@vercel/analytics/react';
import { getValidSiteUrl } from '@/lib/utils/url';

const geist = Geist({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-geist',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-playfair-display',
  display: 'swap',
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
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geist.variable} ${jetbrainsMono.variable} ${playfairDisplay.variable} font-sans`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('lifeos_theme')||localStorage.getItem('theme')||'monsoon-garden';var d=document.documentElement;var isDark=t==='dark'||t==='tui'||t==='crimson-dark'||t==='crimson-cream'||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(isDark){d.classList.add('dark');}else{d.classList.remove('dark');}d.setAttribute('data-theme',t==='monsoon-garden'||t==='monsoon'?'monsoon-garden':(isDark?'dark':'light'));}catch(e){}})();`,
          }}
        />
      </head>
      <body
        suppressHydrationWarning
        className="font-sans antialiased bg-surface text-on-surface selection:bg-secondary-container selection:text-on-secondary-container"
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}
