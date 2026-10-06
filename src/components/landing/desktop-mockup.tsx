'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export function DesktopMockup() {
  const [activeTab, setActiveTab] = useState<'command' | 'ledger' | 'focus' | 'kanban' | 'obsidian'>('command');
  
  // Interactive Pomodoro Timer (24:18 default)
  const [timerSeconds, setTimerSeconds] = useState(24 * 60 + 18);
  const [isRunning, setIsRunning] = useState(true);

  useEffect(() => {
    let interval: any = null;
    if (isRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, timerSeconds]);

  const mins = Math.floor(timerSeconds / 60).toString().padStart(2, '0');
  const secs = (timerSeconds % 60).toString().padStart(2, '0');

  // Interactive sample task state
  const [tasks, setTasks] = useState([
    { id: '1', title: 'Review Consensus Raft Algorithm proof draft', category: 'P1 Core', tracked: '45m', completed: true },
    { id: '2', title: 'Log hostel grocery split in Pocket Ledger', category: 'P3 Admin', tracked: '₹640', completed: true },
    { id: '3', title: 'Synthesize 5 papers on Vector Search indexing', category: 'P1 Essential', tracked: 'Est. 90m', completed: false },
    { id: '4', title: 'Submit Architecture Design Grant dossier', category: 'P2 Project', tracked: 'Due 11:59 PM', completed: false },
  ]);

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  return (
    <div className="w-full bg-white dark:bg-[#181716] rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-xl overflow-hidden transition-colors">
      {/* Archival Window Chrome Header */}
      <div className="px-4 py-3 bg-stone-100/70 dark:bg-stone-900/80 border-b border-stone-200/70 dark:border-stone-800 flex flex-wrap items-center justify-between gap-3 select-none">
        {/* Window Dots & Session Identifier */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-stone-300 dark:bg-stone-700 border border-stone-400/30" />
            <span className="w-2.5 h-2.5 rounded-full bg-stone-300 dark:bg-stone-700 border border-stone-400/30" />
            <span className="w-2.5 h-2.5 rounded-full bg-stone-300 dark:bg-stone-700 border border-stone-400/30" />
          </div>
          <div className="flex items-center gap-1.5 text-[12px] font-mono text-stone-600 dark:text-stone-400">
            <span className="material-symbols-outlined text-[14px] text-stone-400 dark:text-stone-500">terminal</span>
            <span>lifeos-vault :: session_active.md</span>
          </div>
        </div>

        {/* Interactive Workspace Tabs */}
        <div className="flex items-center gap-1 bg-white dark:bg-stone-950 p-1 rounded-lg border border-stone-200/60 dark:border-stone-800 text-[12px] font-mono">
          <button
            type="button"
            onClick={() => setActiveTab('command')}
            className={`px-2.5 py-1 rounded-md transition-all ${
              activeTab === 'command'
                ? 'bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-medium shadow-xs'
                : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            Global Command
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ledger')}
            className={`px-2.5 py-1 rounded-md transition-all ${
              activeTab === 'ledger'
                ? 'bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-medium shadow-xs'
                : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            Pocket Ledger
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('focus')}
            className={`px-2.5 py-1 rounded-md transition-all ${
              activeTab === 'focus'
                ? 'bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-medium shadow-xs'
                : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            Deep Work HUD
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('kanban')}
            className={`px-2.5 py-1 rounded-md transition-all ${
              activeTab === 'kanban'
                ? 'bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-medium shadow-xs'
                : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            Roadmap
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('obsidian')}
            className={`px-2.5 py-1 rounded-md transition-all ${
              activeTab === 'obsidian'
                ? 'bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-medium shadow-xs'
                : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            Obsidian Sync
          </button>
        </div>

        {/* Sync Indicator */}
        <div className="hidden sm:flex items-center gap-2 text-[12px] font-mono text-stone-500 dark:text-stone-400">
          <span className="w-1.5 h-1.5 rounded-full bg-[#2f5c3a]" />
          <span>Vault Clean</span>
        </div>
      </div>

      {/* TAB CONTENT PANELS */}
      <div className="p-5 sm:p-7 space-y-6">
        {/* TAB 1: GLOBAL COMMAND HUD */}
        {activeTab === 'command' && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 animate-in fade-in duration-200">
            {/* Sub-Col 1: Student Safe Allowance & Pomodoro Module (4 cols) */}
            <div className="md:col-span-4 space-y-4">
              {/* Allowance Snapshot */}
              <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200/70 dark:border-stone-800 space-y-3">
                <div className="flex items-center justify-between text-[11px] font-mono text-stone-500 uppercase tracking-wider">
                  <span>Monthly Safe Pace</span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-[#2f5c3a] dark:text-emerald-400 font-medium">
                    Within Target
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-mono tracking-tight text-stone-900 dark:text-stone-100 font-semibold">
                    ₹4,950
                  </span>
                  <span className="text-[12px] font-mono text-stone-500">left of ₹8,000</span>
                </div>
                <p className="text-[13px] text-stone-600 dark:text-stone-400 leading-relaxed">
                  Daily safe spending cap: <span className="font-mono font-medium text-stone-900 dark:text-stone-100">₹380.00</span> through Nov 30 without deficit.
                </p>
                <div className="w-full bg-stone-200 dark:bg-stone-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-[#2f5c3a] h-full rounded-full transition-all duration-500" style={{ width: '61%' }} />
                </div>
                <div className="flex items-center justify-between text-[11px] font-mono text-stone-500 pt-1">
                  <span>3 entries logged today</span>
                  <span className="text-[#2f5c3a] dark:text-emerald-400 font-medium">+₹450 preserved</span>
                </div>
              </div>

              {/* Live Deep Work Module */}
              <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200/70 dark:border-stone-800 space-y-3">
                <div className="flex items-center justify-between text-[11px] font-mono text-stone-500 uppercase tracking-wider">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[15px] text-[#2f5c3a]">timer</span>
                    <span>Sprint Cycle</span>
                  </div>
                  <span>Block 3 of 4</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <div>
                    <div className="text-3xl font-mono font-semibold tracking-tight text-stone-900 dark:text-stone-100">
                      {mins}:{secs}
                    </div>
                    <div className="text-[12px] text-stone-500 font-mono">Systems Proof Draft</div>
                  </div>
                  <div className={`w-12 h-12 rounded-full border-2 border-stone-200 dark:border-stone-800 border-t-[#2f5c3a] flex items-center justify-center ${isRunning ? 'animate-spin' : ''}`} style={{ animationDuration: '9s' }}>
                    <span className="material-symbols-outlined text-[18px] text-[#2f5c3a]">psychology</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-1 font-mono text-[12px]">
                  <button
                    type="button"
                    onClick={() => setIsRunning(!isRunning)}
                    className="flex-1 py-1.5 rounded-md bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900 hover:opacity-90 transition-opacity text-center font-medium shadow-xs"
                  >
                    {isRunning ? 'Pause Sprint' : 'Resume Sprint'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTimerSeconds(25 * 60);
                      setIsRunning(true);
                    }}
                    className="px-3 py-1.5 rounded-md bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:text-stone-900 transition-colors"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>

            {/* Sub-Col 2: High Leverage Tasks Matrix (5 cols) */}
            <div className="md:col-span-5 p-4 rounded-xl bg-white dark:bg-stone-900/30 border border-stone-200/70 dark:border-stone-800 space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-stone-200/60 dark:border-stone-800">
                  <div>
                    <h3 className="text-[15px] font-medium text-stone-900 dark:text-stone-100">Daily High-Leverage Tasks</h3>
                    <p className="text-[12px] font-mono text-stone-500">
                      {tasks.filter((t) => t.completed).length} of {tasks.length} completed today • Velocity +18%
                    </p>
                  </div>
                  <span className="w-6 h-6 rounded bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 flex items-center justify-center text-stone-700 dark:text-stone-300 text-[14px]">
                    +
                  </span>
                </div>

                <div className="space-y-2 pt-3 font-mono text-[13px]">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => toggleTask(task.id)}
                      className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors cursor-pointer group"
                    >
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => {}}
                        className="mt-0.5 rounded border-stone-300 text-stone-900 focus:ring-0 cursor-pointer"
                      />
                      <div className="flex-1 text-[13px]">
                        <span className={task.completed ? 'line-through text-stone-400 dark:text-stone-500 font-sans' : 'text-stone-800 dark:text-stone-200 font-sans font-medium'}>
                          {task.title}
                        </span>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-stone-500">
                          <span className="px-1.5 py-0.2 rounded bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                            {task.category}
                          </span>
                          <span>{task.tracked}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick capture task preview */}
              <div className="pt-2 border-t border-stone-200/60 dark:border-stone-800 flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-stone-400">add</span>
                <span className="w-full text-[13px] text-stone-400 font-sans">Add next high-leverage action...</span>
                <kbd className="text-[10px] font-mono text-stone-400 px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700">↵</kbd>
              </div>
            </div>

            {/* Sub-Col 3: Kanban Stream & Real-time Spark Capture (3 cols) */}
            <div className="md:col-span-3 space-y-4">
              {/* Pipelines mini card */}
              <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200/70 dark:border-stone-800 space-y-2.5">
                <div className="flex items-center justify-between text-[11px] font-mono text-stone-500 uppercase tracking-wider">
                  <span>Workstreams</span>
                  <span className="text-[#2f5c3a] dark:text-emerald-400 font-medium">3 Active</span>
                </div>
                <div className="p-2.5 rounded-lg bg-white dark:bg-stone-900 border border-stone-200/70 dark:border-stone-800 space-y-1">
                  <div className="text-[11px] font-mono text-stone-500">Research Thesis</div>
                  <div className="text-[13px] font-medium text-stone-900 dark:text-stone-100 font-sans">Spatial Memory in UIs</div>
                  <div className="flex items-center justify-between text-[11px] font-mono text-stone-500 pt-1">
                    <span>Draft Review</span>
                    <span className="text-[#2f5c3a] dark:text-emerald-400 font-medium">82%</span>
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-white dark:bg-stone-900 border border-stone-200/70 dark:border-stone-800 space-y-1">
                  <div className="text-[11px] font-mono text-stone-500">Audio Craft</div>
                  <div className="text-[13px] font-medium text-stone-900 dark:text-stone-100 font-sans">Rust Synthesizer DSP</div>
                  <div className="flex items-center justify-between text-[11px] font-mono text-stone-500 pt-1">
                    <span>Alpha Build</span>
                    <span className="text-stone-500">45%</span>
                  </div>
                </div>
              </div>

              {/* Fleeting Spark Capture Card */}
              <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200/70 dark:border-stone-800 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-mono text-stone-500">
                  <span>SPARK CAPTURE</span>
                  <span className="material-symbols-outlined text-[14px] text-[#2f5c3a]">sync</span>
                </div>
                <div className="p-2.5 rounded-lg bg-white dark:bg-stone-900 border border-stone-200/70 dark:border-stone-800 font-serif italic text-[14px] text-stone-800 dark:text-stone-200 leading-snug">
                  &ldquo;Treat spatial interfaces not as infinite glass, but as an arrangement of tactile desk drawers with physical inertia.&rdquo;
                </div>
                <div className="flex items-center justify-between text-[10px] font-mono text-stone-500 pt-1">
                  <span>⌥ + Space to capture</span>
                  <span className="text-[#2f5c3a] dark:text-emerald-400">Instant write</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: POCKET LEDGER */}
        {activeTab === 'ledger' && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-stone-200 dark:border-stone-800">
              <div>
                <h3 className="text-lg font-medium text-stone-900 dark:text-stone-100">Student Pocket Ledger &amp; Velocity Tracker</h3>
                <p className="text-[13px] text-stone-500">Calculated against ₹8,000 monthly stipend allowance • 13 days remaining</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-[#2f5c3a] dark:text-emerald-400 font-mono text-[12px] font-medium">Safe Pace: ₹380 / day</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-[13px]">
                <thead>
                  <tr className="border-b border-stone-200 dark:border-stone-800 text-stone-500 text-[11px] uppercase tracking-wider">
                    <th className="py-2 px-3 font-normal">Timestamp</th>
                    <th className="py-2 px-3 font-normal">Description</th>
                    <th className="py-2 px-3 font-normal">Category</th>
                    <th className="py-2 px-3 font-normal text-right">Amount (INR)</th>
                    <th className="py-2 px-3 font-normal text-right">Trajectory</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200/60 dark:divide-stone-800/60">
                  <tr className="hover:bg-stone-50 dark:hover:bg-stone-800/40 transition-colors">
                    <td className="py-2.5 px-3 text-stone-500">Today, 09:20</td>
                    <td className="py-2.5 px-3 font-sans font-medium text-stone-900 dark:text-stone-100">Campus Cafe Filter Roast x2</td>
                    <td className="py-2.5 px-3 text-stone-500">Daily Fuel</td>
                    <td className="py-2.5 px-3 text-right text-stone-700 dark:text-stone-300 font-medium">- ₹90.00</td>
                    <td className="py-2.5 px-3 text-right text-[#2f5c3a] dark:text-emerald-400 text-[11px]">Safe pace</td>
                  </tr>
                  <tr className="hover:bg-stone-50 dark:hover:bg-stone-800/40 transition-colors">
                    <td className="py-2.5 px-3 text-stone-500">Yesterday, 17:40</td>
                    <td className="py-2.5 px-3 font-sans font-medium text-stone-900 dark:text-stone-100">Architecture Sketchbook &amp; Micron Pens</td>
                    <td className="py-2.5 px-3 text-stone-500">Studio Material</td>
                    <td className="py-2.5 px-3 text-right text-stone-700 dark:text-stone-300 font-medium">- ₹320.00</td>
                    <td className="py-2.5 px-3 text-right text-[#2f5c3a] dark:text-emerald-400 text-[11px]">Safe pace</td>
                  </tr>
                  <tr className="hover:bg-stone-50 dark:hover:bg-stone-800/40 transition-colors">
                    <td className="py-2.5 px-3 text-stone-500">Nov 15, 12:00</td>
                    <td className="py-2.5 px-3 font-sans font-medium text-stone-900 dark:text-stone-100">Graduate TA Stipend Direct Deposit</td>
                    <td className="py-2.5 px-3 text-stone-500">Inflow Credit</td>
                    <td className="py-2.5 px-3 text-right text-[#2f5c3a] dark:text-emerald-400 font-medium">+ ₹2,500.00</td>
                    <td className="py-2.5 px-3 text-right text-[#2f5c3a] dark:text-emerald-400 text-[11px]">Reserve Boost</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: DEEP WORK HUD */}
        {activeTab === 'focus' && (
          <div className="max-w-xl mx-auto text-center space-y-4 py-4 animate-in fade-in duration-200">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-[12px] font-mono text-[#2f5c3a] dark:text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-[#2f5c3a] dark:bg-emerald-400" />
              <span>Distraction-Free Focus Protocol Active</span>
            </div>
            <div className="text-6xl sm:text-7xl font-mono font-medium tracking-tight text-stone-900 dark:text-stone-100">
              {mins}:{secs}
            </div>
            <div className="space-y-1">
              <h4 className="text-lg font-medium text-stone-900 dark:text-stone-100 font-sans">Distributed Systems Paxos vs Raft Synthesis</h4>
              <p className="text-[13px] text-stone-500 font-mono">Sprint 3 of 4 • 50m targeted deep session</p>
            </div>
          </div>
        )}

        {/* TAB 4: ROADMAP KANBAN */}
        {activeTab === 'kanban' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-[13px] animate-in fade-in duration-200">
            <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800 space-y-3">
              <div className="flex items-center justify-between text-[11px] text-stone-500 uppercase">
                <span>Queue / Conception</span>
                <span>2</span>
              </div>
              <div className="p-3 rounded-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-1">
                <div className="text-[11px] text-[#2f5c3a] dark:text-emerald-400">Creative Craft</div>
                <div className="font-sans font-medium text-stone-900 dark:text-stone-100">Linen Bookbinding Guide</div>
                <p className="text-[12px] text-stone-500 font-sans">Collate paper weights, grain lines &amp; linen thread sizing.</p>
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800 space-y-3">
              <div className="flex items-center justify-between text-[11px] text-[#2f5c3a] dark:text-emerald-400 font-medium uppercase">
                <span>In Deep Execution</span>
                <span>1 Active</span>
              </div>
              <div className="p-3 rounded-lg bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 space-y-2">
                <div className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">Sprint P1</div>
                <div className="font-sans font-medium text-stone-900 dark:text-stone-100">Distributed Consensus Defense</div>
                <div className="w-full bg-stone-200 dark:bg-stone-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-[#2f5c3a] h-full rounded-full" style={{ width: '74%' }} />
                </div>
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800 space-y-3">
              <div className="flex items-center justify-between text-[11px] text-stone-500 uppercase">
                <span>Shipped / Archived</span>
                <span>3</span>
              </div>
              <div className="p-3 rounded-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 opacity-70 space-y-1">
                <div className="text-[11px] text-stone-500">Architecture</div>
                <div className="font-sans font-medium text-stone-900 dark:text-stone-100 line-through">Winter Design Portfolio</div>
                <p className="text-[12px] text-stone-500 font-sans">Exported to 300DPI archival PDF.</p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: OBSIDIAN SYNC */}
        {activeTab === 'obsidian' && (
          <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800 space-y-3 font-mono text-[12px] animate-in fade-in duration-200">
            <div className="flex items-center justify-between text-stone-500 border-b border-stone-200 dark:border-stone-800 pb-2">
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[15px] text-[#2f5c3a]">folder_open</span>
                <span>~/lifeos-vault/atomic_notes/dieter_rams.md</span>
              </span>
              <span className="text-[#2f5c3a] dark:text-emerald-400">● Synced with Obsidian</span>
            </div>
            <div className="text-stone-400">---</div>
            <div className="text-stone-400">title: Calm Computing Principles</div>
            <div className="text-stone-400">updated: 2026-10-07 02:45</div>
            <div className="text-stone-400">---</div>
            <div className="pt-2 font-sans text-[14px] text-stone-800 dark:text-stone-200 leading-relaxed">
              # Good software is unobtrusive.<br /><br />
              A tool should behave like a fine mechanical pencil or a well-balanced Japanese drafting blade. You do not carry out a conversation with the tool; you think directly through it.
            </div>
          </div>
        )}
      </div>

      {/* Window Meta Status Bar */}
      <div className="px-4 py-2.5 bg-stone-100/70 dark:bg-stone-900/80 border-t border-stone-200/70 dark:border-stone-800 flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono text-stone-500 select-none">
        <div className="flex items-center gap-4">
          <span>MODE: NORMAL</span>
          <span>KEYMAP: VIM / EMACS</span>
          <span className="hidden sm:inline">REPO: CLEAN (main)</span>
        </div>
        <div className="flex items-center gap-3">
          <span>MEM: 18.2 MB</span>
          <span>•</span>
          <span>CORE: Rust WebAssembly</span>
        </div>
      </div>
    </div>
  );
}
