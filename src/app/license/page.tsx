import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Scale, ExternalLink } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Open Source License',
  description: 'LifeOS is licensed under the standard MIT License.',
};

export default function LicensePage() {
  return (
    <div className="min-h-screen bg-[#fff8f5] dark:bg-[#121110] text-[#1e1b18] dark:text-[#f5f5f0] font-sans antialiased selection:bg-[#2f5c3a] selection:text-white transition-colors py-12 px-6 sm:px-8">
      <div className="max-w-3xl mx-auto space-y-10">
        {/* Navigation */}
        <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors font-mono"
          >
            <ArrowLeft size={16} />
            <span>Return to Overview</span>
          </Link>
          <a
            href="https://github.com/aryan-src/LifeOS"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-mono text-stone-500 hover:text-stone-900 dark:hover:text-stone-200 transition-colors"
          >
            <span>GitHub Repository</span>
            <ExternalLink size={12} />
          </a>
        </div>

        {/* Header */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-stone-200/70 dark:bg-stone-800/60 border border-stone-300 dark:border-stone-700 text-stone-800 dark:text-stone-200 text-xs font-mono">
            <Scale size={14} />
            <span>Open Source Software</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-stone-900 dark:text-stone-100">
            MIT License
          </h1>
          <p className="text-base text-stone-600 dark:text-stone-400 leading-relaxed">
            Copyright &copy; 2026 Aryan Prajapati. LifeOS is open source software distributed under the terms of the MIT License.
          </p>
        </div>

        {/* License Block */}
        <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-stone-900/60 border border-stone-200/80 dark:border-stone-800 font-mono text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed space-y-4 shadow-xs">
          <p>
            Permission is hereby granted, free of charge, to any person obtaining a copy
            of this software and associated documentation files (the &quot;Software&quot;), to deal
            in the Software without restriction, including without limitation the rights
            to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
            copies of the Software, and to permit persons to whom the Software is
            furnished to do so, subject to the following conditions:
          </p>
          <p>
            The above copyright notice and this permission notice shall be included in all
            copies or substantial portions of the Software.
          </p>
          <p className="uppercase text-stone-500 dark:text-stone-400 text-xs">
            THE SOFTWARE IS PROVIDED &quot;AS IS&quot;, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
            IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
            FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
            AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
            LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
            OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
            SOFTWARE.
          </p>
        </div>

        {/* Footer */}
        <div className="pt-8 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between text-xs font-mono text-stone-500">
          <span>LifeOS Architecture</span>
          <Link href="/privacy" className="hover:text-stone-900 dark:hover:text-stone-200 transition-colors">
            Privacy Statement
          </Link>
        </div>
      </div>
    </div>
  );
}
