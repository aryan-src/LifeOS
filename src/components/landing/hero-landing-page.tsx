'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useUIStore } from '@/lib/store/use-ui-store';

export function HeroLandingPage() {
  const openQuickCapture = useUIStore((s) => s.openQuickCapture);

  // Live second countdown for hero focus timer (38:40)
  const [secondsLeft, setSecondsLeft] = useState(38 * 60 + 40);
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const formattedTimer = `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;

  // Focus module sprint timer (41:12)
  const [sprintTime, setSprintTime] = useState(41 * 60 + 12);
  const sprintMins = Math.floor(sprintTime / 60);
  const sprintSecs = sprintTime % 60;
  const formattedSprintTime = `${sprintMins < 10 ? '0' : ''}${sprintMins}:${sprintSecs < 10 ? '0' : ''}${sprintSecs}`;

  // Audio play/pause state
  const [isAudioPlaying, setIsAudioPlaying] = useState(true);

  // Interactive checklist state
  const [checklist, setChecklist] = useState([
    { id: 1, text: 'Review Q3 Financial Ledger & Amortization', tag: 'Finance', completed: true },
    { id: 2, text: 'Draft Section 3: "Recursive Mechanics"', tag: 'Writing', completed: true },
    { id: 3, text: 'Capital Allocation & Treasury Forecast', tag: 'In Progress', note: 'Allocated: 90m • Priority 0', completed: false },
    { id: 4, text: 'Review System Dynamics schematic with Reid', tag: 'Sprint', completed: false },
  ]);

  const toggleChecklist = (id: number) => {
    setChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item))
    );
  };

  return (
    <div className="w-[100vw] relative left-1/2 -translate-x-1/2 -mt-[48px] -mb-16 sm:-mb-20 min-h-screen bg-surface font-body-md text-body-md text-on-surface antialiased selection:bg-secondary-fixed selection:text-on-secondary-fixed overflow-x-hidden">
      <header className="fixed top-0 left-0 right-0 z-50 bg-surface/90 backdrop-blur-md border-b border-surface-container-high"><div className="h-16 max-w-7xl mx-auto px-6 lg:px-12 flex items-center justify-between"><Link className="flex items-center gap-space-sm group" href="/"><div className="w-7 h-7 rounded-lg bg-surface-container flex items-center justify-center text-primary group-hover:bg-secondary-fixed transition-colors"><span className="material-symbols-outlined text-[18px]">spa</span></div><span className="font-title-md text-title-md text-on-surface tracking-tight">LifeOS</span></Link><nav className="hidden md:flex items-center gap-space-lg" data-active-classes="text-on-surface font-semibold"><a aria-current="page" className="transition-colors text-on-surface font-semibold" href="#workspaces">Product</a><a className="text-on-surface-variant font-body-sm text-body-sm hover:text-on-surface transition-colors" href="#workspaces">Features</a><a className="text-on-surface-variant font-body-sm text-body-sm hover:text-on-surface transition-colors" href="#manifesto">About</a></nav><div className="flex items-center gap-space-md"><Link className="font-body-sm text-body-sm text-on-surface-variant hover:text-on-surface px-space-xs py-space-xs transition-colors" href="/login">Log in</Link><Link className="inline-flex items-center justify-center h-8 px-space-md rounded-lg bg-primary-container text-on-primary font-body-sm text-body-sm hover:bg-primary transition-colors" href="/login">Get started</Link><Link href="/dashboard" className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0 ml-space-xs hover:opacity-90 transition-opacity" aria-label="Open Workspace"><span className="material-symbols-outlined text-on-primary text-[18px]">person</span></Link></div></div></header><main className="w-full pt-16 bg-surface min-h-[calc(100vh-140px)]"><div className="flex flex-col w-full text-on-surface">
{/* 1. HERO SECTION */}
<section className="w-full max-w-7xl mx-auto px-6 lg:px-12 pt-12 pb-24 md:pt-20 md:pb-32 flex flex-col items-center text-center">
{/* Restrained Eyebrow / Meta Indicator */}
<div className="inline-flex items-center gap-space-xs px-3 py-1 bg-surface-container rounded-lg mb-space-lg text-on-surface-variant font-label-sm text-label-sm">
<span className="w-1.5 h-1.5 rounded-full bg-primary-container"></span>
<span>LifeOS 3.0 — The deliberate personal environment</span>
</div>
{/* Editorial Serif Hero Headline */}
<h1 className="font-display-lg text-display-lg-mobile md:text-display-lg text-on-surface tracking-tight max-w-4xl mx-auto mb-space-md">
      Everything in its place.
    </h1>
<p className="font-body-lg text-body-lg text-on-surface-variant max-w-xl mx-auto mb-space-xl">
      Your life, organized in one quiet, unified workspace. Designed for thinkers, builders, and deep craft.
    </p>
{/* CTAs */}
<div className="flex items-center justify-center gap-space-md mb-space-2xl">
<Link className="inline-flex items-center justify-center h-10 px-6 rounded-lg bg-primary-container text-on-primary font-body-sm text-body-sm font-medium hover:bg-primary transition-colors shadow-sm" href="/login">
        Get started
      </Link>
<a className="inline-flex items-center justify-center h-10 px-5 rounded-lg bg-surface-container-lowest text-on-surface font-body-sm text-body-sm font-medium hover:bg-surface-container transition-colors shadow-sm" href="#workspaces">
        Explore product
        <span className="material-symbols-outlined text-[16px] ml-1.5 text-secondary">arrow_downward</span>
</a>
</div>
{/* Ultra-realistic LifeOS Desktop Dashboard UI Frame */}
<div className="w-full max-w-6xl mx-auto bg-surface-container-lowest rounded-xl shadow-xl overflow-hidden text-left">
{/* Window Titlebar */}
<div className="h-11 bg-surface-container-low px-4 flex items-center justify-between select-none">
<div className="flex items-center gap-2">
<div className="w-2.5 h-2.5 rounded-full bg-outline-variant/60"></div>
<div className="w-2.5 h-2.5 rounded-full bg-outline-variant/60"></div>
<div className="w-2.5 h-2.5 rounded-full bg-outline-variant/60"></div>
</div>
{/* Minimal Search / Command Trigger */}
<button
  type="button"
  onClick={() => openQuickCapture()}
  className="flex items-center gap-2 px-3 py-1 bg-surface-container-lowest rounded-lg text-on-surface-variant font-body-sm text-body-sm shadow-sm w-72 justify-between hover:bg-surface-container transition-colors cursor-pointer text-left"
>
  <div className="flex items-center gap-2">
    <span className="material-symbols-outlined text-[15px] text-secondary">search</span>
    <span className="text-secondary text-[12px]">Jump to note, project or metric...</span>
  </div>
  <span className="font-code-sm text-[10px] px-1.5 py-0.5 rounded bg-surface-container text-secondary font-medium">⌘K</span>
</button>
<div className="flex items-center gap-2 text-secondary">
<span className="material-symbols-outlined text-[18px]">calendar_today</span>
<span className="font-label-sm text-label-sm">Oct 16</span>
</div>
</div>
{/* App Frame Body (Sidebar + Main Area) */}
<div className="grid grid-cols-12 min-h-[560px]">
{/* Left Sidebar (Collapsible column) */}
<div className="col-span-12 md:col-span-3 bg-surface-container-low p-4 flex flex-col justify-between">
<div className="space-y-6">
{/* Account Switcher */}
<div className="flex items-center justify-between pb-3">
<div className="flex items-center gap-2.5 min-w-0">
<div className="w-6 h-6 rounded-md bg-primary-container text-on-primary flex items-center justify-center font-title-md text-title-md text-[11px] font-semibold">
                  JV
                </div>
<div className="min-w-0">
<div className="font-title-md text-title-md text-[13px] text-on-surface truncate">Julian Vance</div>
<div className="font-label-sm text-label-sm text-secondary truncate">Personal Edition</div>
</div>
</div>
<span className="material-symbols-outlined text-[16px] text-secondary">unfold_more</span>
</div>
{/* Workspace Navigation */}
<div className="space-y-1">
<div className="font-label-sm text-[10px] tracking-wider uppercase text-secondary px-2 mb-2 font-semibold">Spaces</div>
<Link href="/dashboard" className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-surface-container text-on-surface font-body-sm text-body-sm font-medium hover:bg-surface-variant transition-colors">
<div className="flex items-center gap-2.5">
<span className="material-symbols-outlined text-[16px] text-primary">wb_sunny</span>
<span>Today</span>
</div>
<span className="font-code-sm text-[11px] text-secondary">4</span>
</Link>
<Link href="/tasks" className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-surface-container/60 text-on-surface-variant font-body-sm text-body-sm transition-colors">
<div className="flex items-center gap-2.5">
<span className="material-symbols-outlined text-[16px]">target</span>
<span>Focus</span>
</div>
<span className="w-2 h-2 rounded-full bg-primary-container"></span>
</Link>
<Link href="/finances" className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-surface-container/60 text-on-surface-variant font-body-sm text-body-sm transition-colors">
<div className="flex items-center gap-2.5">
<span className="material-symbols-outlined text-[16px]">account_balance_wallet</span>
<span>Finance</span>
</div>
</Link>
<Link href="/notes" className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-surface-container/60 text-on-surface-variant font-body-sm text-body-sm transition-colors">
<div className="flex items-center gap-2.5">
<span className="material-symbols-outlined text-[16px]">article</span>
<span>Notes</span>
</div>
<span className="font-code-sm text-[11px] text-secondary">142</span>
</Link>
<Link href="/projects" className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-surface-container/60 text-on-surface-variant font-body-sm text-body-sm transition-colors">
<div className="flex items-center gap-2.5">
<span className="material-symbols-outlined text-[16px]">folder_special</span>
<span>Projects</span>
</div>
<span className="font-code-sm text-[11px] text-secondary">6</span>
</Link>
</div>
{/* Quick Access / Pins */}
<div className="space-y-1">
<div className="font-label-sm text-[10px] tracking-wider uppercase text-secondary px-2 mb-2 font-semibold">Pinned Context</div>
<a className="flex items-center gap-2 px-2.5 py-1 text-on-surface-variant font-body-sm text-[12px] hover:text-on-surface" href="#">
<span className="material-symbols-outlined text-[13px] text-secondary">tag</span>
<span className="truncate">Q4 Synthesis</span>
</a>
<a className="flex items-center gap-2 px-2.5 py-1 text-on-surface-variant font-body-sm text-[12px] hover:text-on-surface" href="#">
<span className="material-symbols-outlined text-[13px] text-secondary">tag</span>
<span className="truncate">Physical Conditioning</span>
</a>
</div>
</div>
{/* Bottom Workspace Health */}
<div className="pt-4 space-y-3">
<div className="p-2.5 rounded-lg bg-surface-container text-on-surface">
<div className="flex items-center justify-between text-[11px] font-label-sm mb-1.5">
<span className="text-secondary">Cloud Sync</span>
<span className="text-primary font-medium">99.4% synced</span>
</div>
<div className="w-full h-1 bg-surface-variant rounded-full overflow-hidden">
<div className="h-full bg-primary-container w-[92%] rounded-full"></div>
</div>
</div>
</div>
</div>
{/* Main Dashboard Canvas */}
<div className="col-span-12 md:col-span-9 p-6 lg:p-8 bg-surface space-y-6">
{/* Context Breadcrumb & Quick Actions */}
<div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 gap-4">
<div>
<div className="font-label-sm text-label-sm text-secondary uppercase tracking-wider mb-0.5">Julian Vance • Studio</div>
<h2 className="font-headline-md text-headline-md text-on-surface">Thursday, Oct 16</h2>
</div>
<div className="flex items-center gap-2">
<button className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface-container hover:bg-surface-variant rounded-lg text-on-surface font-body-sm text-[12px] transition-colors">
<span className="material-symbols-outlined text-[15px]">add</span>
<span>Quick note</span>
</button>
<button className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-container text-on-primary rounded-lg font-body-sm text-[12px] hover:bg-primary transition-colors">
<span className="material-symbols-outlined text-[15px]">play_arrow</span>
<span>Start sprint</span>
</button>
</div>
</div>
{/* Bento Grid: Live Workspace Artifacts */}
<div className="grid grid-cols-1 md:grid-cols-12 gap-5">
{/* Today's Priorities (7 cols) */}
<div className="col-span-12 md:col-span-7 bg-surface-container-lowest p-5 rounded-lg shadow-sm">
<div className="flex items-center justify-between mb-4">
<div className="flex items-center gap-2">
<span className="material-symbols-outlined text-[18px] text-primary">check_circle</span>
<span className="font-title-md text-title-md text-[14px]">Primary Commitments</span>
</div>
<span className="font-code-sm text-[11px] text-secondary">
  {checklist.filter((i) => i.completed).length + 1} of 5 finished
</span>
</div>
<div className="space-y-2.5">
{checklist.map((item) => (
  <div
    key={item.id}
    onClick={() => toggleChecklist(item.id)}
    className={`group flex items-start gap-3 p-2.5 rounded-lg cursor-pointer transition-colors ${
      item.id === 3 && !item.completed ? 'bg-surface-container-low' : 'hover:bg-surface'
    }`}
  >
    <input
      type="checkbox"
      checked={item.completed}
      onChange={() => toggleChecklist(item.id)}
      className="mt-1 accent-primary h-4 w-4 rounded cursor-pointer"
    />
    <div className="min-w-0 flex-1">
      <div className="flex items-center justify-between gap-2 mb-0.5">
        <span
          className={`font-body-sm text-body-sm ${
            item.completed ? 'line-through text-secondary' : 'font-medium text-on-surface'
          }`}
        >
          {item.text}
        </span>
        <span
          className={`font-label-sm text-[10px] px-2 py-0.5 rounded ${
            item.tag === 'In Progress'
              ? 'bg-secondary-fixed text-on-secondary-fixed font-medium'
              : 'bg-surface-container text-secondary'
          }`}
        >
          {item.tag}
        </span>
      </div>
      {item.note && (
        <div className="font-body-sm text-[12px] text-secondary flex items-center gap-2">
          <span className="material-symbols-outlined text-[13px]">schedule</span>
          <span>{item.note}</span>
        </div>
      )}
    </div>
  </div>
))}
</div>
</div>
{/* Focus Module (5 cols) */}
<div className="col-span-12 md:col-span-5 bg-surface-container-lowest p-5 rounded-lg shadow-sm flex flex-col justify-between">
<div>
<div className="flex items-center justify-between mb-3">
<span className="font-label-sm text-[11px] uppercase tracking-wider text-secondary font-medium">Active Sprint</span>
<div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-secondary-fixed text-on-secondary-fixed font-label-sm text-[10px]">
<span className="w-1.5 h-1.5 rounded-full bg-primary-container animate-pulse"></span>
<span>Deep Work</span>
</div>
</div>
<div className="py-2 text-center">
<div className="font-code-sm text-[42px] leading-tight font-medium text-on-surface tracking-tighter" id="hero-timer">{formattedTimer}</div>
<div className="font-body-sm text-[12px] text-secondary mt-1">Focus Session: "Chapter 4 Synthesis"</div>
</div>
</div>
{/* Soundscape Selector */}
<div className="mt-4 p-2.5 bg-surface-container-low rounded-lg flex items-center justify-between">
<div className="flex items-center gap-2">
<span className="material-symbols-outlined text-[16px] text-primary">graphic_eq</span>
<div>
<div className="font-body-sm text-[12px] font-medium text-on-surface">Nordic Forest</div>
<div className="font-label-sm text-[10px] text-secondary">40Hz Binaural Drift</div>
</div>
</div>
<button type="button" onClick={() => setIsAudioPlaying(!isAudioPlaying)} className="material-symbols-outlined text-[18px] text-secondary hover:text-on-surface cursor-pointer" aria-label="Toggle soundscape">{isAudioPlaying ? "volume_up" : "volume_off"}</button>
</div>
</div>
{/* Financial Snapshot (6 cols) */}
<div className="col-span-12 md:col-span-6 bg-surface-container-lowest p-5 rounded-lg shadow-sm">
<div className="flex items-center justify-between mb-3">
<span className="font-title-md text-title-md text-[14px]">Liquid Capital & Runway</span>
<span className="font-label-sm text-[11px] text-primary font-medium">+4.2% MoM</span>
</div>
<div className="flex items-baseline gap-3 mb-2">
<span className="font-headline-sm text-headline-sm font-semibold text-on-surface">$184,200</span>
<span className="font-body-sm text-body-sm text-secondary">• 14.8 months runway</span>
</div>
{/* Clean Mini Sparkline SVG */}
<div className="w-full h-12 pt-2">
<svg className="w-full h-full text-primary" fill="none" preserveAspectRatio="none" viewBox="0 0 280 40">
<path d="M0 32 L40 28 L80 30 L120 22 L160 24 L200 15 L240 18 L280 8" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
<path d="M0 32 L40 28 L80 30 L120 22 L160 24 L200 15 L240 18 L280 8 L280 40 L0 40 Z" fill="currentColor" fillOpacity="0.08"></path>
</svg>
</div>
<div className="flex items-center justify-between font-label-sm text-[11px] text-secondary mt-2 pt-2">
<span>Burn: $12,450 / mo</span>
<span>Target: 18.0 mos</span>
</div>
</div>
{/* Recent Connected Notes / Bi-directional Link (6 cols) */}
<div className="col-span-12 md:col-span-6 bg-surface-container-lowest p-5 rounded-lg shadow-sm">
<div className="flex items-center justify-between mb-2">
<span className="font-title-md text-title-md text-[14px]">Linked Notes</span>
<span className="font-label-sm text-[11px] text-secondary">Updated 22m ago</span>
</div>
<div className="p-3 bg-surface-container-low rounded-lg space-y-1.5">
<div className="font-title-md text-title-md text-[13px] text-on-surface font-medium">Epistemic Feedback Loops</div>
<p className="font-body-sm text-[12px] text-secondary line-clamp-2 leading-relaxed">
                  "When human memory is augmented by atomic, bi-directional graphs, synthesis becomes effortless." See related: 
                  <span className="inline-flex items-center text-primary font-medium cursor-pointer hover:underline">[[System Dynamics]]</span> and 
                  <span className="inline-flex items-center text-primary font-medium cursor-pointer hover:underline">[[Quarterly Thesis]]</span>.
                </p>
</div>
<div className="flex items-center gap-2 mt-3 text-secondary font-label-sm text-[11px]">
<span className="material-symbols-outlined text-[13px]">share</span>
<span>3 incoming backlinks • 1 task connected</span>
</div>
</div>
</div>
</div>
</div>
</div>
</section>
{/* 2. PRODUCT SHOWCASE SECTION ("Show, don't explain") */}
<section className="w-full bg-surface-container-low py-24 md:py-32" id="workspaces">
<div className="max-w-7xl mx-auto px-6 lg:px-12">
{/* Section Header */}
<div className="max-w-2xl mb-20 text-left">
<span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-semibold">Core Workspaces</span>
<h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mt-2 mb-4">
          Five specialized surfaces.<br/>Zero context-switching.
        </h2>
<p className="font-body-lg text-body-lg text-on-surface-variant">
          Each tool is engineered for its specific cognitive mode, built on a shared database that keeps everything effortlessly synchronized.
        </p>
</div>
{/* Module 01: Dashboard (Split View) */}
<div className="bg-surface-container-lowest rounded-xl p-6 lg:p-10 mb-12 shadow-sm">
<div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
<div className="lg:col-span-4 space-y-3">
<span className="font-code-sm text-[12px] text-primary font-semibold">01 / DASHBOARD</span>
<h3 className="font-headline-md text-headline-md text-on-surface">A clear overview of your day.</h3>
<p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
              Synthesizes daily priorities, calendar events, current focus state, and critical metrics onto one unhurried canvas. No notification noise, only intention.
            </p>
<div className="pt-2 flex items-center gap-4 text-secondary font-label-sm text-label-sm">
<span className="flex items-center gap-1"><span className="material-symbols-outlined text-[15px] text-primary">done_all</span> Daily sync</span>
<span className="flex items-center gap-1"><span className="material-symbols-outlined text-[15px] text-primary">schedule</span> Auto-schedule</span>
</div>
</div>
{/* Functional UI Component Preview */}
<div className="lg:col-span-8 bg-surface-container rounded-lg p-5">
<div className="bg-surface-container-lowest rounded-lg p-5 shadow-sm space-y-4">
<div className="flex items-center justify-between pb-3">
<span className="font-title-md text-title-md text-[14px]">Daily Flow • Thursday</span>
<span className="font-label-sm text-[11px] text-secondary">3.5 hrs free space remaining</span>
</div>
<div className="space-y-2">
<div className="flex items-center gap-4 p-2.5 rounded-lg bg-surface-container-low text-on-surface">
<span className="font-code-sm text-[11px] text-secondary w-14">08:00 AM</span>
<div className="w-1.5 h-6 rounded-full bg-secondary"></div>
<div className="flex-1">
<div className="font-body-sm text-[13px] font-medium">Morning Review & Architectural Notes</div>
<div className="font-label-sm text-[11px] text-secondary">Studio • 45 mins</div>
</div>
<span className="material-symbols-outlined text-[16px] text-primary">check_circle</span>
</div>
<div className="flex items-center gap-4 p-2.5 rounded-lg bg-secondary-fixed text-on-secondary-fixed">
<span className="font-code-sm text-[11px] text-primary font-bold w-14">10:00 AM</span>
<div className="w-1.5 h-6 rounded-full bg-primary-container"></div>
<div className="flex-1">
<div className="font-body-sm text-[13px] font-semibold text-primary">Deep Sprint: Manuscript Revision</div>
<div className="font-label-sm text-[11px] text-secondary">No disturbances permitted</div>
</div>
<span className="font-code-sm text-[11px] px-2 py-0.5 rounded bg-primary-container text-on-primary font-medium">Running</span>
</div>
<div className="flex items-center gap-4 p-2.5 rounded-lg bg-surface-container-low text-on-surface">
<span className="font-code-sm text-[11px] text-secondary w-14">02:30 PM</span>
<div className="w-1.5 h-6 rounded-full bg-outline-variant"></div>
<div className="flex-1">
<div className="font-body-sm text-[13px] font-medium">Portfolio Rebalancing & Advisory Call</div>
<div className="font-label-sm text-[11px] text-secondary">Finance Ledger • Video</div>
</div>
<span className="font-label-sm text-[11px] text-secondary">Upcoming</span>
</div>
</div>
</div>
</div>
</div>
</div>
{/* Module 02: Focus (Immersion Panel) */}
<div className="bg-surface-container-lowest rounded-xl p-6 lg:p-10 mb-12 shadow-sm">
<div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
<div className="lg:col-span-4 lg:order-2 space-y-3">
<span className="font-code-sm text-[12px] text-primary font-semibold">02 / FOCUS</span>
<h3 className="font-headline-md text-headline-md text-on-surface">Space to do meaningful work.</h3>
<p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
              When distraction is eliminated, deep thoughts emerge. Full-screen sprint sessions with built-in ambient white noise, binaural beats, and website shield integration.
            </p>
<div className="p-3 bg-surface-container rounded-lg text-[13px] font-body-sm text-on-surface space-y-1">
<div className="flex items-center gap-2 font-medium">
<span className="material-symbols-outlined text-[16px] text-primary">shield</span>
<span>Active Shield Enabled</span>
</div>
<p className="text-[12px] text-secondary">Blocking 14 social & news outlets until session conclusion.</p>
</div>
</div>
{/* Immersion UI Card */}
<div className="lg:col-span-8 lg:order-1 bg-surface-container rounded-lg p-8 flex flex-col items-center justify-center text-center">
<div className="w-full max-w-md bg-surface-container-lowest p-8 rounded-xl shadow-md">
<span className="font-label-sm text-[11px] uppercase tracking-wider text-secondary">50-Minute Sprint Cycle</span>
<div className="my-6">
<div className="font-code-sm text-[56px] font-medium text-on-surface tracking-tight">{formattedSprintTime}</div>
<p className="font-headline-sm text-[16px] text-secondary italic mt-1">"The art of structural writing"</p>
</div>
{/* Live Audio Bar */}
<div className="flex items-center justify-between p-3 bg-surface-container-low rounded-lg mb-6">
<div className="flex items-center gap-3">
<div className="w-8 h-8 rounded-md bg-primary-container text-on-primary flex items-center justify-center">
<span className="material-symbols-outlined text-[16px]">waves</span>
</div>
<div className="text-left">
<div className="font-title-md text-[13px]">Nordic Pine & Heavy Rain</div>
<div className="font-label-sm text-[10px] text-secondary">432Hz harmonic tone • Continuous</div>
</div>
</div>
<button type="button" onClick={() => setIsAudioPlaying(!isAudioPlaying)} className="material-symbols-outlined text-[20px] text-primary cursor-pointer hover:opacity-80 transition-opacity" aria-label="Play/pause">{isAudioPlaying ? "pause_circle" : "play_circle"}</button>
</div>
<div className="flex items-center justify-center gap-3">
<button type="button" onClick={() => setSprintTime(0)} className="px-4 py-1.5 bg-surface-container hover:bg-surface-variant rounded-lg font-body-sm text-[13px] text-on-surface cursor-pointer transition-colors">End Sprint</button>
<button type="button" onClick={() => setSprintTime(prev => prev + 300)} className="px-5 py-1.5 bg-primary-container hover:bg-primary rounded-lg font-body-sm text-[13px] text-on-primary font-medium cursor-pointer transition-colors">Add +5 Min</button>
</div>
</div>
</div>
</div>
</div>
{/* Module 03: Finance (Clean Ledger UI) */}
<div className="bg-surface-container-lowest rounded-xl p-6 lg:p-10 mb-12 shadow-sm">
<div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
<div className="lg:col-span-4 space-y-3">
<span className="font-code-sm text-[12px] text-primary font-semibold">03 / FINANCE</span>
<h3 className="font-headline-md text-headline-md text-on-surface">Your money, clearly organized.</h3>
<p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
              No bloated banking dashboards. Track cash runway, recurring expenses, and capital distribution with absolute architectural restraint.
            </p>
</div>
{/* Finance Canvas Preview */}
<div className="lg:col-span-8 bg-surface-container rounded-lg p-5">
<div className="bg-surface-container-lowest rounded-lg p-6 shadow-sm space-y-5">
<div className="flex flex-wrap items-center justify-between gap-4">
<div>
<div className="font-label-sm text-[11px] text-secondary uppercase tracking-wider">Treasury Overview</div>
<div className="font-headline-sm text-headline-sm text-on-surface font-semibold">$184,200.00 <span className="font-body-sm text-[12px] font-normal text-secondary">in primary vaults</span></div>
</div>
<div className="flex items-center gap-2">
<span className="px-2.5 py-1 bg-surface-container text-secondary rounded font-label-sm text-[11px]">Monthly Burn: $12,450</span>
<span className="px-2.5 py-1 bg-secondary-fixed text-on-secondary-fixed rounded font-label-sm text-[11px] font-medium">14.8 Mos Safety</span>
</div>
</div>
{/* Minimal Transactions Table */}
<div className="space-y-1 pt-2">
<div className="flex items-center justify-between py-2 text-[13px] font-body-sm text-on-surface hover:bg-surface-container-low px-2 rounded transition-colors">
<div className="flex items-center gap-3">
<span className="material-symbols-outlined text-[16px] text-secondary">database</span>
<span>AWS & GPU Compute Infrastructure</span>
</div>
<span className="font-code-sm text-secondary font-medium">-$420.00</span>
</div>
<div className="flex items-center justify-between py-2 text-[13px] font-body-sm text-on-surface hover:bg-surface-container-low px-2 rounded transition-colors">
<div className="flex items-center gap-3">
<span className="material-symbols-outlined text-[16px] text-secondary">domain</span>
<span>Studio Space Lease • Zurich</span>
</div>
<span className="font-code-sm text-secondary font-medium">-$2,100.00</span>
</div>
<div className="flex items-center justify-between py-2 text-[13px] font-body-sm text-on-surface hover:bg-surface-container-low px-2 rounded transition-colors">
<div className="flex items-center gap-3">
<span className="material-symbols-outlined text-[16px] text-primary">call_received</span>
<span>Advisory Retainer • Systems Design</span>
</div>
<span className="font-code-sm text-primary font-medium">+$8,500.00</span>
</div>
</div>
</div>
</div>
</div>
</div>
{/* Module 04 & 05: Asymmetric Dual Column (Notes + Projects) */}
<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
{/* Module 04: Notes */}
<div className="bg-surface-container-lowest rounded-xl p-6 lg:p-8 shadow-sm flex flex-col justify-between">
<div className="space-y-3 mb-6">
<span className="font-code-sm text-[12px] text-primary font-semibold">04 / NOTES</span>
<h3 className="font-headline-md text-headline-md text-on-surface">Everything worth remembering.</h3>
<p className="font-body-md text-body-md text-on-surface-variant">
              Markdown-native canvas with typography optimized for long-form reading, nested backlinks, and fast capture.
            </p>
</div>
{/* Notes Editor Snippet */}
<div className="bg-surface-container-low p-5 rounded-lg space-y-3">
<div className="flex items-center justify-between font-label-sm text-[11px] text-secondary pb-2">
<span>essay-draft-v3.md</span>
<span>1,240 words</span>
</div>
<div className="bg-surface-container-lowest p-4 rounded shadow-sm space-y-2">
<div className="font-headline-sm text-[18px] text-on-surface font-semibold">On Cognitive Friction</div>
<p className="font-body-sm text-[13px] text-on-surface leading-relaxed">
                Modern software demands performative interaction. An optimal operating system behaves inversely: it acts as a silent repository that absorbs cognitive entropy...
              </p>
<div className="flex items-center gap-2 pt-2">
<span className="font-code-sm text-[11px] px-2 py-0.5 rounded bg-surface-container text-primary">#epistemology</span>
<span className="font-code-sm text-[11px] px-2 py-0.5 rounded bg-surface-container text-primary">#systems</span>
</div>
</div>
</div>
</div>
{/* Module 05: Projects */}
<div className="bg-surface-container-lowest rounded-xl p-6 lg:p-8 shadow-sm flex flex-col justify-between">
<div className="space-y-3 mb-6">
<span className="font-code-sm text-[12px] text-primary font-semibold">05 / PROJECTS</span>
<h3 className="font-headline-md text-headline-md text-on-surface">From ideas to execution.</h3>
<p className="font-body-md text-body-md text-on-surface-variant">
              A high-precision milestone engine without Jira bloat. Clear deliverables, deadline horizons, and linked assets.
            </p>
</div>
{/* Projects UI Card */}
<div className="bg-surface-container-low p-5 rounded-lg space-y-2.5">
<div className="flex items-center justify-between pb-2 font-label-sm text-[11px] text-secondary">
<span>Active Milestones</span>
<span>Sprint 42</span>
</div>
{/* Milestone Item 1 */}
<div className="bg-surface-container-lowest p-3 rounded shadow-sm flex items-center justify-between">
<div className="space-y-1">
<div className="font-body-sm text-[13px] font-medium text-on-surface">Publish Quarterly Manifesto</div>
<div className="flex items-center gap-2 font-label-sm text-[10px] text-secondary">
<span>Due Oct 24</span> • <span>4 linked notes</span>
</div>
</div>
<span className="px-2 py-0.5 rounded bg-primary-container text-on-primary font-label-sm text-[11px]">80%</span>
</div>
{/* Milestone Item 2 */}
<div className="bg-surface-container-lowest p-3 rounded shadow-sm flex items-center justify-between">
<div className="space-y-1">
<div className="font-body-sm text-[13px] font-medium text-on-surface">Treasury Reallocation to Seed Fund</div>
<div className="flex items-center gap-2 font-label-sm text-[10px] text-secondary">
<span>Due Nov 02</span> • <span>Finance vault linked</span>
</div>
</div>
<span className="px-2 py-0.5 rounded bg-surface-container text-secondary font-label-sm text-[11px]">Pending</span>
</div>
</div>
</div>
</div>
</div>
</section>
{/* 3. ONE CONNECTED WORKSPACE SECTION (Interconnected Canvas) */}
<section className="w-full max-w-7xl mx-auto px-6 lg:px-12 py-24 md:py-36" id="graph">
<div className="text-center max-w-3xl mx-auto mb-16">
<span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-semibold">The Unified Graph</span>
<h2 className="font-display-lg text-display-lg-mobile md:text-headline-lg text-on-surface mt-2 mb-3">
        One space. Everything connected.
      </h2>
<p className="font-body-md text-body-md text-on-surface-variant">
        No copy-pasting between disconnected silos. When you write a note, it flows directly into milestones, calendars, and ledgers.
      </p>
</div>
{/* Visual Interactive Flow Canvas */}
<div className="w-full bg-surface-container p-6 lg:p-12 rounded-xl relative shadow-sm">
{/* Connected Nodes Grid */}
<div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative z-10">
{/* Node 1: Note Capture */}
<div className="bg-surface-container-lowest p-5 rounded-lg shadow-sm space-y-3 relative">
<div className="flex items-center justify-between">
<span className="font-label-sm text-[10px] uppercase tracking-wider font-semibold text-secondary">Step 1 • Note</span>
<span className="material-symbols-outlined text-[16px] text-primary">edit_note</span>
</div>
<div className="font-title-md text-[13px] text-on-surface font-semibold">Note: "Studio Expansion Plan"</div>
<p className="font-body-sm text-[12px] text-secondary">
            Drafted initial premises. Contains 3 milestone requirements and $12k budget allocation.
          </p>
<div className="p-2 bg-surface-container-low rounded text-[11px] font-code-sm text-primary">
            + Action Item Created
          </div>
</div>
{/* Node 2: Project Milestone */}
<div className="bg-surface-container-lowest p-5 rounded-lg shadow-sm space-y-3 relative">
<div className="flex items-center justify-between">
<span className="font-label-sm text-[10px] uppercase tracking-wider font-semibold text-secondary">Step 2 • Project</span>
<span className="material-symbols-outlined text-[16px] text-primary">task_alt</span>
</div>
<div className="font-title-md text-[13px] text-on-surface font-semibold">Milestone: Lease Signing</div>
<p className="font-body-sm text-[12px] text-secondary">
            Auto-created from note tag. Owner assigned, milestone set to active cycle.
          </p>
<div className="p-2 bg-surface-container-low rounded text-[11px] font-code-sm text-secondary">
            Deadline: Oct 28
          </div>
</div>
{/* Node 3: Calendar / Focus Block */}
<div className="bg-surface-container-lowest p-5 rounded-lg shadow-sm space-y-3 relative">
<div className="flex items-center justify-between">
<span className="font-label-sm text-[10px] uppercase tracking-wider font-semibold text-secondary">Step 3 • Focus</span>
<span className="material-symbols-outlined text-[16px] text-primary">timer</span>
</div>
<div className="font-title-md text-[13px] text-on-surface font-semibold">Focus Block Reserved</div>
<p className="font-body-sm text-[12px] text-secondary">
            2hr Deep Session locked onto Friday schedule to execute contract review.
          </p>
<div className="p-2 bg-surface-container-low rounded text-[11px] font-code-sm text-primary">
            10:00 AM - 12:00 PM
          </div>
</div>
{/* Node 4: Financial Ledger */}
<div className="bg-surface-container-lowest p-5 rounded-lg shadow-sm space-y-3 relative">
<div className="flex items-center justify-between">
<span className="font-label-sm text-[10px] uppercase tracking-wider font-semibold text-secondary">Step 4 • Finance</span>
<span className="material-symbols-outlined text-[16px] text-primary">account_balance</span>
</div>
<div className="font-title-md text-[13px] text-on-surface font-semibold">Ledger Updated</div>
<p className="font-body-sm text-[12px] text-secondary">
            $12,000 security deposit allocated against cash runway calculation.
          </p>
<div className="p-2 bg-secondary-fixed text-on-secondary-fixed rounded text-[11px] font-code-sm font-semibold">
            Runway re-indexed: 14.8m
          </div>
</div>
</div>
{/* Context Ribbon Indicator */}
<div className="mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between text-secondary font-label-sm text-label-sm gap-2">
<span className="flex items-center gap-1.5">
<span className="material-symbols-outlined text-[15px] text-primary">sync_alt</span>
          Every record stays synchronized in real-time across your graph
        </span>
<span className="font-code-sm text-[11px]">End-to-end encrypted • Zero telemetry</span>
</div>
</div>
</section>
{/* 4. FINAL CTA SECTION (Spacious & Serene) */}
<section className="w-full bg-surface-container-low py-28 md:py-40" id="manifesto">
<div className="max-w-4xl mx-auto px-6 lg:px-12 text-center flex flex-col items-center">
<span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-semibold mb-3">Begin Today</span>
{/* Serif Headline */}
<h2 className="font-display-lg text-display-lg-mobile md:text-display-lg text-on-surface tracking-tight mb-4">
        Make space for more.
      </h2>
<p className="font-body-lg text-body-lg text-on-surface-variant max-w-lg mb-8 leading-relaxed">
        Experience a calm, distraction-free environment built to support your most important thoughts, habits, and commitments.
      </p>
{/* Forest Green Primary CTA Button */}
<Link className="inline-flex items-center justify-center h-12 px-8 rounded-lg bg-primary-container text-on-primary font-title-md text-title-md text-[14px] hover:bg-primary transition-colors shadow-md" href="/login">
        Get started
        <span className="material-symbols-outlined text-[18px] ml-2">arrow_forward</span>
</Link>
{/* Understated subtext */}
<p className="font-body-sm text-body-sm text-secondary mt-4">
        Free for personal use. No credit card required.
      </p>
</div>
</section>
</div>
</main><footer className="w-full bg-surface border-t border-surface-container-high pb-24"><div className="max-w-7xl mx-auto px-6 lg:px-12 py-space-xl flex flex-col md:flex-row items-center justify-between gap-space-lg"><div className="flex items-center gap-space-sm"><div className="w-6 h-6 rounded-lg bg-surface-container flex items-center justify-center text-primary"><span className="material-symbols-outlined text-[15px]">spa</span></div><span className="font-title-md text-title-md text-on-surface tracking-tight">LifeOS</span><span className="font-body-sm text-body-sm text-outline ml-space-xs">© LifeOS.</span></div><nav className="flex flex-wrap items-center justify-center gap-space-lg"><a className="font-body-sm text-body-sm text-on-surface-variant hover:text-on-surface transition-colors" href="#workspaces">Product</a><a className="font-body-sm text-body-sm text-on-surface-variant hover:text-on-surface transition-colors" href="#manifesto">About</a><a className="font-body-sm text-body-sm text-on-surface-variant hover:text-on-surface transition-colors" href="#graph">Privacy</a><a className="font-body-sm text-body-sm text-on-surface-variant hover:text-on-surface transition-colors" href="mailto:support@lifeos.sh">Contact</a></nav></div></footer>
    </div>
  );
}
