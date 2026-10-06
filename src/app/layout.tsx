import type { Metadata } from 'next';
import './globals.css';
import { QuickCaptureOmnibar } from '@/components/global/quick-capture';
import { Sidebar } from '@/components/navigation/sidebar';
import { TopHeader } from '@/components/navigation/top-header';

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
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
          rel="stylesheet"
        />
      </head>
      <body
        suppressHydrationWarning
        className="bg-surface font-body-md text-body-md text-on-surface antialiased"
      >
        <QuickCaptureOmnibar />
        <aside className="fixed left-0 top-0 h-full w-64 bg-surface-container-low z-50 flex flex-col justify-between py-space-md px-space-sm shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
          <Sidebar />
        </aside>
        <div className="pl-64">
          <TopHeader />
          <main className="w-full pt-14 bg-surface min-h-screen">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
