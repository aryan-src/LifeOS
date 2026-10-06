import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { QuickCaptureOmnibar } from '@/components/global/quick-capture';
import { Sidebar } from '@/components/navigation/sidebar';
import { TopHeader } from '@/components/navigation/top-header';

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

export const metadata: Metadata = {
  title: 'LifeOS — Unified Operating System',
  description: 'Relational personal operating system for Projects, Tasks, Finances, and Notes.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
        />
      </head>
      <body
        suppressHydrationWarning
        className="bg-surface font-sans text-on-surface antialiased selection:bg-secondary-container selection:text-on-secondary-container"
      >
        <QuickCaptureOmnibar />
        <Sidebar />
        <div className="pl-0 lg:pl-64 min-h-screen transition-[padding] duration-200 flex flex-col">
          <TopHeader />
          <main className="w-full pt-14 bg-surface min-h-screen flex-1">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
