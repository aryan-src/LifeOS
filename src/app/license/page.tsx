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
    <div className="min-h-screen bg-[#FAF9F5] dark:bg-zinc-950 text-textMain dark:text-zinc-100 font-sans antialiased selection:bg-sage selection:text-white transition-colors py-12 px-6 sm:px-8">
      <div className="max-w-3xl mx-auto space-y-10">
        {/* Navigation */}
        <div className="flex items-center justify-between border-b border-borderWarm dark:border-zinc-800 pb-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-textMuted dark:text-zinc-400 hover:text-textMain dark:hover:text-zinc-100 transition-colors font-mono"
          >
            <ArrowLeft size={16} />
            <span>Return to Overview</span>
          </Link>
          <a
            href="https://github.com/aryan-src/LifeOS"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-mono text-textSubtle hover:text-textMain dark:hover:text-zinc-200 transition-colors"
          >
            <span>GitHub Repository</span>
            <ExternalLink size={12} />
          </a>
        </div>

        {/* Header */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#FAF9F5] dark:bg-zinc-800/60 border border-borderWarm dark:border-zinc-700 text-textMain dark:text-zinc-200 text-xs font-mono">
            <Scale size={14} />
            <span>Open Source Software</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-textMain dark:text-zinc-100 font-serif">
            MIT License
          </h1>
          <p className="text-base text-textMuted dark:text-zinc-400 leading-relaxed">
            Copyright &copy; 2026 Aryan Prajapati. LifeOS is open source software distributed under the terms of the MIT License.
          </p>
        </div>

        {/* License Block */}
        <div className="p-6 sm:p-8 rounded-2xl bg-ivory dark:bg-zinc-900/60 border border-borderWarm dark:border-zinc-800 font-mono text-xs sm:text-sm text-textMain dark:text-zinc-300 leading-relaxed space-y-4 shadow-xs">
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
          <p className="uppercase text-textSubtle dark:text-zinc-400 text-xs">
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
        <div className="pt-8 border-t border-borderWarm dark:border-zinc-800 flex items-center justify-between text-xs font-mono text-textSubtle">
          <span>LifeOS Architecture</span>
          <Link href="/privacy" className="hover:text-textMain dark:hover:text-zinc-200 transition-colors">
            Privacy Statement
          </Link>
        </div>
      </div>
    </div>
  );
}
