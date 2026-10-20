'use client';

import React, { useState, useEffect, useRef, useTransition } from 'react';
import { VaporCountdownDigits } from '@/components/ui/countdown-vapor-digits';
import { logFocusSession, getFocusBindingContext } from '@/lib/actions/focus-session';
import { getTodayDate } from '@/lib/utils/date';
import {
  Volume2,
  VolumeX,
  Settings2,
  Check,
  Hash,
  CheckSquare,
  Sparkles,
  ChevronDown,
  X,
  Play,
  RotateCcw,
  Sliders,
} from 'lucide-react';

export type TimerMode = 'focus' | 'shortBreak' | 'longBreak';
export type DisplayStyle = 'dot-matrix' | 'monospace' | 'flip-clock';
export type AccentTheme = 'sage' | 'amber' | 'charcoal' | 'crimson';
export type ChimeSound = 'bowl' | 'bell' | 'digital' | 'silent';

export interface FocusTimerProps {
  className?: string;
  tasks?: Array<{ id: string; title: string }>;
  projects?: Array<{ id: string; title: string; slug: string }>;
  onSessionComplete?: (mode: TimerMode, completedSprints: number) => void;
}

const MODE_CONFIG: Record<
  TimerMode,
  {
    name: string;
    header: string;
    sessionLabel: string;
    badgeText: string;
    duration: number; // in seconds
  }
> = {
  focus: {
    name: 'Focus',
    header: 'DEEP WORK SPRINT',
    sessionLabel: 'Session: Pomodoro Standard',
    badgeText: 'Focus Mode',
    duration: 25 * 60,
  },
  shortBreak: {
    name: 'Short Break',
    header: 'SHORT BREAK',
    sessionLabel: 'Session: 5-Minute Recharge',
    badgeText: 'Break Mode',
    duration: 5 * 60,
  },
  longBreak: {
    name: 'Long Break',
    header: 'LONG REST',
    sessionLabel: 'Session: 15-Minute Extended Rest',
    badgeText: 'Break Mode',
    duration: 15 * 60,
  },
};

const PROTOCOL_PRESETS = [
  { label: '15m', title: 'Micro-Sprint', duration: 15 * 60, mode: 'focus' as TimerMode },
  { label: '25m', title: 'Pomodoro', duration: 25 * 60, mode: 'focus' as TimerMode },
  { label: '50m', title: 'Deep Flow', duration: 50 * 60, mode: 'focus' as TimerMode },
];

const THEME_STYLES: Record<
  AccentTheme,
  {
    name: string;
    badge: string;
    progress: string;
    dot: string;
    ring: string;
  }
> = {
  sage: {
    name: 'Muted Sage',
    badge:
      'text-[#2A6041] bg-[#CBEBD6] dark:bg-emerald-950/60 dark:text-emerald-300 border-[#A7D9B7]/60 dark:border-emerald-800/50',
    progress: 'bg-[#2D6A4F] dark:bg-emerald-500',
    dot: 'bg-[#2A6041] dark:bg-emerald-400',
    ring: 'ring-emerald-500/40 border-emerald-400/60',
  },
  amber: {
    name: 'Soft Amber',
    badge:
      'text-[#92400E] bg-[#FEF3C7] dark:bg-amber-950/60 dark:text-amber-300 border-[#FDE68A]/60 dark:border-amber-800/50',
    progress: 'bg-amber-600 dark:bg-amber-400',
    dot: 'bg-[#D97706] dark:bg-amber-400',
    ring: 'ring-amber-500/40 border-amber-400/60',
  },
  charcoal: {
    name: 'Charcoal',
    badge:
      'text-stone-800 bg-stone-200 dark:bg-zinc-800 dark:text-zinc-200 border-stone-300 dark:border-zinc-700',
    progress: 'bg-stone-800 dark:bg-zinc-300',
    dot: 'bg-stone-800 dark:bg-zinc-300',
    ring: 'ring-stone-500/40 border-stone-400/60',
  },
  crimson: {
    name: 'Crimson',
    badge:
      'text-rose-800 bg-rose-100 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-900',
    progress: 'bg-rose-600 dark:bg-rose-500',
    dot: 'bg-rose-600 dark:bg-rose-400',
    ring: 'ring-rose-500/40 border-rose-400/60',
  },
};

/**
 * Audio Synthesis Engine using Web Audio API for 100% offline harmonic chimes
 */
function playAudioChime(sound: ChimeSound) {
  if (sound === 'silent' || typeof window === 'undefined') return;
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    if (sound === 'bowl') {
      // Zen Bowl: 432Hz fundamental with rich resonant harmonic overtone decay
      [432, 864, 1296].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.12 / (idx + 1), now + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 2.25);
      });
    } else if (sound === 'digital') {
      // Minimal Digital Chime: clean double ascending blip
      [880, 1318.51].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.09);
        gain.gain.setValueAtTime(0, now + idx * 0.09);
        gain.gain.linearRampToValueAtTime(0.09, now + idx * 0.09 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.09 + 0.22);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.09);
        osc.stop(now + idx * 0.09 + 0.25);
      });
    } else {
      // Soft Bell: gentle 3-note ascending chord D5 -> F#5 -> A5
      const notes = [587.33, 739.99, 880];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.12);
        gain.gain.setValueAtTime(0, now + idx * 0.12);
        gain.gain.linearRampToValueAtTime(0.12, now + idx * 0.12 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.12 + 0.8);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.12);
        osc.stop(now + idx * 0.12 + 0.85);
      });
    }
  } catch (err) {
    console.debug('Chime audio playback suppressed:', err);
  }
}

export function FocusTimer({
  className = '',
  tasks: propTasks,
  projects: propProjects,
  onSessionComplete,
}: FocusTimerProps) {
  // Core Timer State
  const [mode, setMode] = useState<TimerMode>('focus');
  const [totalDuration, setTotalDuration] = useState<number>(MODE_CONFIG.focus.duration);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(MODE_CONFIG.focus.duration);
  const [timerState, setTimerState] = useState<'idle' | 'running' | 'paused'>('idle');

  // Customization & Settings
  const [displayStyle, setDisplayStyle] = useState<DisplayStyle>('dot-matrix');
  const [accentTheme, setAccentTheme] = useState<AccentTheme>('sage');
  const [chimeSound, setChimeSound] = useState<ChimeSound>('bowl');
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isCustomInputOpen, setIsCustomInputOpen] = useState<boolean>(false);
  const [customMinutesInput, setCustomMinutesInput] = useState<string>('25');

  // Gamification & Telemetry State
  const [completedSprints, setCompletedSprints] = useState<number>(0);
  const [cumulativeSecondsToday, setCumulativeSecondsToday] = useState<number>(0);
  const [isVisualAlerting, setIsVisualAlerting] = useState<boolean>(false);
  const [telemetryFeedback, setTelemetryFeedback] = useState<string | null>(null);

  // Context Binding State
  const [boundTask, setBoundTask] = useState<{ id: string; title: string } | null>(null);
  const [boundProject, setBoundProject] = useState<{ id: string; title: string; slug: string } | null>(null);
  const [isContextDropdownOpen, setIsContextDropdownOpen] = useState<boolean>(false);
  const [contextSearchQuery, setContextSearchQuery] = useState<string>('');
  const [availableTasks, setAvailableTasks] = useState<Array<{ id: string; title: string }>>(propTasks || []);
  const [availableProjects, setAvailableProjects] = useState<Array<{ id: string; title: string; slug: string }>>(
    propProjects || []
  );

  const [, startTransition] = useTransition();
  const endTimeRef = useRef<number | null>(null);
  const settingsModalRef = useRef<HTMLDivElement>(null);
  const contextDropdownRef = useRef<HTMLDivElement>(null);

  const todayStr = getTodayDate();
  const activeTheme = THEME_STYLES[accentTheme];

  // Load daily cumulative focus and sprint streaks from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const savedDate = localStorage.getItem('lifeos_focus_date');
      if (savedDate === todayStr) {
        const savedSeconds = parseInt(localStorage.getItem('lifeos_focus_seconds_today') || '0', 10);
        const savedSprints = parseInt(localStorage.getItem('lifeos_focus_sprints_today') || '0', 10);
        setCumulativeSecondsToday(isNaN(savedSeconds) ? 0 : savedSeconds);
        setCompletedSprints(isNaN(savedSprints) ? 0 : savedSprints);
      } else {
        localStorage.setItem('lifeos_focus_date', todayStr);
        localStorage.setItem('lifeos_focus_seconds_today', '0');
        localStorage.setItem('lifeos_focus_sprints_today', '0');
      }

      const savedTheme = localStorage.getItem('lifeos_focus_theme') as AccentTheme;
      if (savedTheme && THEME_STYLES[savedTheme]) setAccentTheme(savedTheme);

      const savedStyle = localStorage.getItem('lifeos_focus_style') as DisplayStyle;
      if (savedStyle) setDisplayStyle(savedStyle);

      const savedChime = localStorage.getItem('lifeos_focus_chime') as ChimeSound;
      if (savedChime) setChimeSound(savedChime);
    } catch {}
  }, [todayStr]);

  // Fetch binding candidates if not passed as props
  useEffect(() => {
    if ((!propTasks || propTasks.length === 0) && (!propProjects || propProjects.length === 0)) {
      startTransition(async () => {
        const res = await getFocusBindingContext();
        if (res.tasks.length > 0) setAvailableTasks(res.tasks);
        if (res.projects.length > 0) setAvailableProjects(res.projects);
      });
    }
  }, [propTasks, propProjects]);

  // Outside click listener for menus
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (settingsModalRef.current && !settingsModalRef.current.contains(event.target as Node)) {
        setIsSettingsOpen(false);
      }
      if (contextDropdownRef.current && !contextDropdownRef.current.contains(event.target as Node)) {
        setIsContextDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Format time display as MM:SS
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const timeDisplay = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  // Progress percentage
  const progressPercentage = Math.min(
    100,
    Math.max(0, ((totalDuration - remainingSeconds) / totalDuration) * 100)
  );

  // Switch to Preset Interval
  const handleSelectPreset = (durationSec: number, presetTitle?: string) => {
    setTimerState('idle');
    setMode('focus');
    setTotalDuration(durationSec);
    setRemainingSeconds(durationSec);
    endTimeRef.current = null;
    setIsCustomInputOpen(false);
  };

  // Submit custom minutes (1 - 120 mins)
  const handleApplyCustomMinutes = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const val = parseInt(customMinutesInput, 10);
    if (!isNaN(val) && val >= 1 && val <= 120) {
      handleSelectPreset(val * 60, `${val}m Custom`);
      setIsCustomInputOpen(false);
    }
  };

  // Toggle Timer Play / Pause
  const handleTogglePlayPause = () => {
    if (timerState === 'running') {
      setTimerState('paused');
      endTimeRef.current = null;
    } else if (timerState === 'paused') {
      endTimeRef.current = Date.now() + remainingSeconds * 1000;
      setTimerState('running');
    } else {
      const targetSeconds = remainingSeconds === 0 ? totalDuration : remainingSeconds;
      setRemainingSeconds(targetSeconds);
      endTimeRef.current = Date.now() + targetSeconds * 1000;
      setTimerState('running');
    }
  };

  // Reset Timer
  const handleReset = () => {
    setTimerState('idle');
    setRemainingSeconds(totalDuration);
    endTimeRef.current = null;
    setIsVisualAlerting(false);
  };

  // Timer countdown engine with background tab drift protection
  useEffect(() => {
    if (timerState !== 'running') return;

    if (!endTimeRef.current) {
      endTimeRef.current = Date.now() + remainingSeconds * 1000;
    }

    const interval = setInterval(() => {
      if (!endTimeRef.current) return;
      const secondsLeft = Math.max(0, Math.ceil((endTimeRef.current - Date.now()) / 1000));
      setRemainingSeconds(secondsLeft);

      if (secondsLeft === 0) {
        clearInterval(interval);
        setTimerState('idle');
        endTimeRef.current = null;

        // Play chime alert
        playAudioChime(chimeSound);

        // Visual alert card border pulse
        setIsVisualAlerting(true);
        setTimeout(() => setIsVisualAlerting(false), 3800);

        // Calculate minutes logged
        const completedMinutes = Math.max(1, Math.round(totalDuration / 60));

        // Update gamification telemetry
        if (mode === 'focus') {
          const nextSprintCount = completedSprints + 1;
          const nextTotalSeconds = cumulativeSecondsToday + totalDuration;
          setCompletedSprints(nextSprintCount);
          setCumulativeSecondsToday(nextTotalSeconds);

          try {
            localStorage.setItem('lifeos_focus_sprints_today', nextSprintCount.toString());
            localStorage.setItem('lifeos_focus_seconds_today', nextTotalSeconds.toString());
          } catch {}

          // Invoke Server Action to record focus session telemetry in Supabase
          startTransition(async () => {
            const res = await logFocusSession({
              durationMinutes: completedMinutes,
              taskId: boundTask?.id || null,
              projectId: boundProject?.id || null,
              mode: 'focus',
            });
            if (res.success) {
              const contextLabel = boundTask ? boundTask.title : boundProject ? `#${boundProject.slug}` : 'general';
              setTelemetryFeedback(`Logged ${completedMinutes}m to ${contextLabel}`);
              setTimeout(() => setTelemetryFeedback(null), 3500);
            }
          });

          onSessionComplete?.('focus', nextSprintCount);

          // Auto-advance mode: 4th sprint triggers long break; otherwise short break
          const nextMode: TimerMode = nextSprintCount % 4 === 0 ? 'longBreak' : 'shortBreak';
          setMode(nextMode);
          setTotalDuration(MODE_CONFIG[nextMode].duration);
          setRemainingSeconds(MODE_CONFIG[nextMode].duration);
        } else {
          onSessionComplete?.(mode, completedSprints);
          setMode('focus');
          setTotalDuration(MODE_CONFIG.focus.duration);
          setRemainingSeconds(MODE_CONFIG.focus.duration);
        }
      }
    }, 250);

    return () => clearInterval(interval);
  }, [
    timerState,
    mode,
    completedSprints,
    remainingSeconds,
    totalDuration,
    chimeSound,
    boundTask,
    boundProject,
    cumulativeSecondsToday,
    onSessionComplete,
  ]);

  // Spacebar hotkey
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        e.preventDefault();
        handleTogglePlayPause();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [timerState, remainingSeconds, totalDuration]);

  // Filtered tasks and projects for context binding
  const filteredTasks = availableTasks.filter((t) =>
    t.title.toLowerCase().includes(contextSearchQuery.toLowerCase())
  );
  const filteredProjects = availableProjects.filter(
    (p) =>
      p.title.toLowerCase().includes(contextSearchQuery.toLowerCase()) ||
      p.slug.toLowerCase().includes(contextSearchQuery.toLowerCase())
  );

  const isRunning = timerState === 'running';
  const isPaused = timerState === 'paused';
  const isBreakMode = mode !== 'focus';
  const todayFocusMinutes = Math.floor(cumulativeSecondsToday / 60);

  return (
    <div
      className={`relative bg-surface-container-lowest dark:bg-zinc-900/50 border border-outline-variant/30 dark:border-zinc-800/60 p-6 sm:p-7 rounded-3xl shadow-xs flex flex-col gap-5 transition-all duration-300 ${
        isVisualAlerting
          ? 'ring-2 ring-emerald-500/60 border-emerald-400/80 animate-pulse'
          : ''
      } ${className}`}
      role="region"
      aria-label="Pomodoro Focus Timer"
    >
      {/* 1. Header: Phase Title, Daily Sprints Streak Strip & Settings Popover */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="font-mono text-xs font-semibold text-outline dark:text-zinc-400 uppercase tracking-widest select-none truncate">
            {MODE_CONFIG[mode].header}
          </span>
          {/* Daily Sprint Streak Strip (● ● ◌ ◌) */}
          <div
            className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-surface-container dark:bg-zinc-800/80 text-[11px] font-mono select-none"
            title={`${completedSprints} sprints completed today`}
          >
            <div className="flex items-center gap-1">
              {[0, 1, 2, 3].map((idx) => (
                <span
                  key={idx}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${
                    idx < completedSprints % 4 || (completedSprints > 0 && completedSprints % 4 === 0)
                      ? `${activeTheme.dot} scale-110`
                      : 'bg-stone-300 dark:bg-zinc-600'
                  }`}
                />
              ))}
            </div>
            <span className="text-[10px] text-outline dark:text-zinc-400 font-medium">
              {completedSprints % 4}/4 Sprints
            </span>
          </div>
        </div>

        {/* Header Right: Focus Mode Badge & Settings Trigger */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Cumulative Focus Metric Badge */}
          <span
            className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-mono text-[11px] bg-surface-container dark:bg-zinc-800 text-outline dark:text-zinc-400"
            title="Total focus time accumulated today"
          >
            <span>{todayFocusMinutes}m focused today</span>
          </span>

          {/* Mode Pill Badge */}
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-mono text-xs font-medium transition-all select-none ${
              isBreakMode
                ? 'text-[#92400E] bg-[#FEF3C7] dark:bg-amber-950/60 dark:text-amber-300 border border-[#FDE68A]/60 dark:border-amber-800/50'
                : activeTheme.badge
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isBreakMode ? 'bg-[#D97706] dark:bg-amber-400' : activeTheme.dot
              } ${isRunning ? 'animate-pulse' : ''}`}
            />
            <span>{MODE_CONFIG[mode].badgeText}</span>
          </span>

          {/* Settings Customization Popover Button */}
          <div className="relative" ref={settingsModalRef}>
            <button
              type="button"
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className="p-1.5 rounded-lg text-outline dark:text-zinc-400 hover:text-on-surface dark:hover:text-zinc-100 hover:bg-surface-container dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Display & Chime Customization"
              aria-label="Timer settings"
            >
              <Settings2 className="w-4 h-4" />
            </button>

            {/* Customization Settings Menu */}
            {isSettingsOpen && (
              <div
                className="absolute right-0 mt-2 w-64 rounded-2xl bg-surface-container-lowest dark:bg-zinc-900 border border-outline-variant/40 dark:border-zinc-800 shadow-xl p-3.5 z-50 flex flex-col gap-3 font-sans text-xs animate-in fade-in zoom-in-95 duration-150"
                role="dialog"
                aria-label="Timer Settings"
              >
                <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20 dark:border-zinc-800">
                  <span className="font-semibold text-on-surface dark:text-zinc-100">
                    Cockpit Preferences
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsSettingsOpen(false)}
                    className="p-1 rounded text-outline hover:text-on-surface cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Display Style Selector */}
                <div>
                  <span className="block text-[11px] font-mono text-outline dark:text-zinc-500 uppercase tracking-wider mb-1.5">
                    Display Typography
                  </span>
                  <div className="grid grid-cols-3 gap-1 bg-surface-container-low dark:bg-zinc-800/50 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => {
                        setDisplayStyle('dot-matrix');
                        try {
                          localStorage.setItem('lifeos_focus_style', 'dot-matrix');
                        } catch {}
                      }}
                      className={`py-1 text-[11px] rounded-lg font-medium transition cursor-pointer ${
                        displayStyle === 'dot-matrix'
                          ? 'bg-surface-container-lowest dark:bg-zinc-700 text-on-surface dark:text-zinc-100 shadow-xs'
                          : 'text-outline dark:text-zinc-400 hover:text-on-surface'
                      }`}
                    >
                      Vapor
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDisplayStyle('monospace');
                        try {
                          localStorage.setItem('lifeos_focus_style', 'monospace');
                        } catch {}
                      }}
                      className={`py-1 text-[11px] rounded-lg font-medium transition cursor-pointer ${
                        displayStyle === 'monospace'
                          ? 'bg-surface-container-lowest dark:bg-zinc-700 text-on-surface dark:text-zinc-100 shadow-xs'
                          : 'text-outline dark:text-zinc-400 hover:text-on-surface'
                      }`}
                    >
                      Mono
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDisplayStyle('flip-clock');
                        try {
                          localStorage.setItem('lifeos_focus_style', 'flip-clock');
                        } catch {}
                      }}
                      className={`py-1 text-[11px] rounded-lg font-medium transition cursor-pointer ${
                        displayStyle === 'flip-clock'
                          ? 'bg-surface-container-lowest dark:bg-zinc-700 text-on-surface dark:text-zinc-100 shadow-xs'
                          : 'text-outline dark:text-zinc-400 hover:text-on-surface'
                      }`}
                    >
                      Card
                    </button>
                  </div>
                </div>

                {/* Aesthetic Theme Selector */}
                <div>
                  <span className="block text-[11px] font-mono text-outline dark:text-zinc-500 uppercase tracking-wider mb-1.5">
                    Active Accent Tone
                  </span>
                  <div className="flex items-center gap-1.5">
                    {(['sage', 'amber', 'charcoal', 'crimson'] as AccentTheme[]).map((thm) => (
                      <button
                        key={thm}
                        type="button"
                        onClick={() => {
                          setAccentTheme(thm);
                          try {
                            localStorage.setItem('lifeos_focus_theme', thm);
                          } catch {}
                        }}
                        className={`px-2 py-1 rounded-lg text-[11px] font-medium border flex items-center gap-1 transition cursor-pointer ${
                          accentTheme === thm
                            ? 'border-primary dark:border-zinc-200 bg-surface-container dark:bg-zinc-800'
                            : 'border-outline-variant/30 text-outline hover:text-on-surface'
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${THEME_STYLES[thm].dot}`} />
                        <span className="capitalize">{thm}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Chime Alert Selector */}
                <div>
                  <span className="block text-[11px] font-mono text-outline dark:text-zinc-500 uppercase tracking-wider mb-1.5">
                    Completion Audio Chime
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {(
                      [
                        { id: 'bowl', label: 'Zen Bowl' },
                        { id: 'bell', label: 'Soft Bell' },
                        { id: 'digital', label: 'Digital' },
                        { id: 'silent', label: 'Silent' },
                      ] as const
                    ).map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setChimeSound(c.id);
                          playAudioChime(c.id);
                          try {
                            localStorage.setItem('lifeos_focus_chime', c.id);
                          } catch {}
                        }}
                        className={`px-2 py-1.5 rounded-lg border text-[11px] font-medium flex items-center justify-between transition cursor-pointer ${
                          chimeSound === c.id
                            ? 'border-primary dark:border-zinc-200 bg-surface-container dark:bg-zinc-800 text-on-surface dark:text-zinc-100'
                            : 'border-outline-variant/30 text-outline hover:text-on-surface'
                        }`}
                      >
                        <span>{c.label}</span>
                        {chimeSound === c.id && <Check className="w-3 h-3 text-emerald-600" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Dynamic Interval Presets & Custom Stepper Pills */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          {PROTOCOL_PRESETS.map((preset) => {
            const isActive = mode === 'focus' && totalDuration === preset.duration;
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => handleSelectPreset(preset.duration, preset.title)}
                className={`px-2.5 py-1 rounded-full text-xs font-mono font-medium border transition-all cursor-pointer ${
                  isActive
                    ? `${activeTheme.badge} shadow-xs font-semibold`
                    : 'bg-surface-container-low/50 dark:bg-zinc-800/40 border-outline-variant/30 dark:border-zinc-800 text-outline dark:text-zinc-400 hover:text-on-surface dark:hover:text-zinc-200 hover:border-outline-variant'
                }`}
                title={preset.title}
              >
                {preset.label}
              </button>
            );
          })}

          {/* Break Presets */}
          <button
            type="button"
            onClick={() => {
              setTimerState('idle');
              setMode('shortBreak');
              setTotalDuration(5 * 60);
              setRemainingSeconds(5 * 60);
            }}
            className={`px-2.5 py-1 rounded-full text-xs font-mono font-medium border transition-all cursor-pointer ${
              mode === 'shortBreak'
                ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800 font-semibold shadow-xs'
                : 'bg-surface-container-low/50 dark:bg-zinc-800/40 border-outline-variant/30 dark:border-zinc-800 text-outline dark:text-zinc-400 hover:text-on-surface dark:hover:text-zinc-200'
            }`}
          >
            5m Break
          </button>
          <button
            type="button"
            onClick={() => {
              setTimerState('idle');
              setMode('longBreak');
              setTotalDuration(15 * 60);
              setRemainingSeconds(15 * 60);
            }}
            className={`px-2.5 py-1 rounded-full text-xs font-mono font-medium border transition-all cursor-pointer ${
              mode === 'longBreak'
                ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800 font-semibold shadow-xs'
                : 'bg-surface-container-low/50 dark:bg-zinc-800/40 border-outline-variant/30 dark:border-zinc-800 text-outline dark:text-zinc-400 hover:text-on-surface dark:hover:text-zinc-200'
            }`}
          >
            15m Rest
          </button>
        </div>

        {/* Custom Duration Input Stepper Trigger */}
        <div className="relative">
          {isCustomInputOpen ? (
            <form
              onSubmit={handleApplyCustomMinutes}
              className="flex items-center gap-1 bg-surface-container-lowest dark:bg-zinc-900 border border-outline-variant/50 dark:border-zinc-700 rounded-lg p-0.5 shadow-sm"
            >
              <input
                type="number"
                min="1"
                max="120"
                autoFocus
                value={customMinutesInput}
                onChange={(e) => setCustomMinutesInput(e.target.value)}
                className="w-12 px-1.5 py-0.5 text-xs font-mono text-center bg-transparent border-none text-on-surface dark:text-zinc-100 outline-none"
                placeholder="25"
              />
              <span className="text-[10px] font-mono text-outline pr-1">m</span>
              <button
                type="submit"
                className="px-1.5 py-0.5 rounded bg-stone-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-[10px] font-semibold cursor-pointer"
              >
                Set
              </button>
              <button
                type="button"
                onClick={() => setIsCustomInputOpen(false)}
                className="p-1 text-outline hover:text-on-surface cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setIsCustomInputOpen(true)}
              className="inline-flex items-center gap-1 text-[11px] font-mono text-outline dark:text-zinc-400 hover:text-on-surface dark:hover:text-zinc-200 hover:underline cursor-pointer"
              title="Set custom duration (1 - 120m)"
            >
              <Sliders className="w-3 h-3" />
              <span>Custom</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. Middle Row: Digits Display (Dot-Matrix, Monospace, or Flip-Clock) & Main Action Controls */}
      <div className="flex items-center justify-between py-1">
        <div
          className="flex items-center cursor-pointer select-none"
          onClick={() => {
            if (timerState === 'idle') setIsCustomInputOpen(true);
          }}
          title={timerState === 'idle' ? 'Click to customize duration' : undefined}
        >
          {/* Style 1: Retro Dot-Matrix */}
          {displayStyle === 'dot-matrix' && (
            <VaporCountdownDigits
              minutes={minutes}
              seconds={seconds}
              isRunning={isRunning}
              digitClassName="text-5xl sm:text-6xl"
            />
          )}

          {/* Style 2: Minimalist Monospace */}
          {displayStyle === 'monospace' && (
            <div className="font-mono text-5xl sm:text-6xl font-bold tracking-tight text-on-surface dark:text-zinc-100 tabular-nums">
              {timeDisplay}
            </div>
          )}

          {/* Style 3: Clean Flip-Clock Cards */}
          {displayStyle === 'flip-clock' && (
            <div className="flex items-center gap-1.5">
              <div className="relative px-3 py-2 rounded-xl bg-surface-container dark:bg-zinc-800 border border-outline-variant/30 dark:border-zinc-700/60 shadow-xs">
                <span className="font-mono text-4xl sm:text-5xl font-bold tracking-tight text-on-surface dark:text-zinc-100 tabular-nums">
                  {String(minutes).padStart(2, '0')}
                </span>
                <div className="absolute inset-x-0 top-1/2 h-px bg-outline-variant/30 dark:bg-zinc-900 pointer-events-none" />
              </div>
              <span className="font-mono text-3xl font-bold text-outline animate-pulse">:</span>
              <div className="relative px-3 py-2 rounded-xl bg-surface-container dark:bg-zinc-800 border border-outline-variant/30 dark:border-zinc-700/60 shadow-xs">
                <span className="font-mono text-4xl sm:text-5xl font-bold tracking-tight text-on-surface dark:text-zinc-100 tabular-nums">
                  {String(seconds).padStart(2, '0')}
                </span>
                <div className="absolute inset-x-0 top-1/2 h-px bg-outline-variant/30 dark:bg-zinc-900 pointer-events-none" />
              </div>
            </div>
          )}
        </div>

        {/* Main Action Control (Play / Pause / Reset) */}
        <div className="flex items-center gap-2">
          {/* Reset button when paused or timer has run */}
          {(isPaused || remainingSeconds !== totalDuration) && (
            <button
              type="button"
              onClick={handleReset}
              className="w-9 h-9 rounded-xl text-outline dark:text-zinc-400 hover:text-on-surface dark:hover:text-zinc-100 hover:bg-surface-container dark:hover:bg-zinc-800 flex items-center justify-center transition-colors cursor-pointer"
              title="Reset Timer"
              aria-label="Reset Timer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}

          {/* Main Squircle Action Button */}
          <button
            type="button"
            onClick={handleTogglePlayPause}
            className="w-14 h-14 rounded-2xl bg-black text-white hover:bg-neutral-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 flex items-center justify-center transition-all cursor-pointer shadow-md active:scale-95 shrink-0"
            title={
              isRunning
                ? 'Pause Timer (Space)'
                : isPaused
                ? 'Resume Timer (Space)'
                : remainingSeconds === 0
                ? 'Reset Session'
                : 'Start Focus Timer (Space)'
            }
            aria-label={
              isRunning
                ? 'Pause Timer'
                : isPaused
                ? 'Resume Timer'
                : remainingSeconds === 0
                ? 'Reset Session'
                : 'Start Timer'
            }
          >
            <span className="material-symbols-outlined text-[28px]">
              {isRunning ? 'pause' : isPaused ? 'play_arrow' : remainingSeconds === 0 ? 'replay' : 'timer'}
            </span>
          </button>
        </div>
      </div>

      {/* 4. Bottom Row: Flat Progress Bar Bound to Exact Completion Percentage */}
      <div className="w-full bg-[#F4ECE3] dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ease-linear ${
            isBreakMode ? 'bg-amber-600 dark:bg-amber-400' : activeTheme.progress
          }`}
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      {/* 5. Task & Project Context Binding Quick-Selector */}
      <div className="relative pt-1 border-t border-outline-variant/20 dark:border-zinc-800/60" ref={contextDropdownRef}>
        <div className="flex items-center justify-between text-xs">
          {/* Active Context Chip or Selector Trigger */}
          {boundTask || boundProject ? (
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span className="text-[11px] font-mono text-outline dark:text-zinc-500 uppercase tracking-wider shrink-0">
                Bound to:
              </span>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-container dark:bg-zinc-800 border border-outline-variant/30 dark:border-zinc-700/60 text-on-surface dark:text-zinc-200 text-xs font-medium truncate">
                {boundTask ? (
                  <>
                    <CheckSquare className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="truncate">{boundTask.title}</span>
                  </>
                ) : (
                  <>
                    <Hash className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                    <span className="truncate">#{boundProject?.slug}</span>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setBoundTask(null);
                    setBoundProject(null);
                  }}
                  className="ml-1 p-0.5 rounded hover:bg-stone-200 dark:hover:bg-zinc-700 text-outline hover:text-on-surface cursor-pointer"
                  title="Clear context binding"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsContextDropdownOpen(!isContextDropdownOpen)}
              className="inline-flex items-center gap-1.5 text-xs text-outline dark:text-zinc-400 hover:text-on-surface dark:hover:text-zinc-200 transition-colors cursor-pointer py-0.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-stone-400" />
              <span>Binding to: Select Task or #Project...</span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>
          )}

          {/* Telemetry save notification pill */}
          {telemetryFeedback && (
            <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 animate-in fade-in">
              {telemetryFeedback} ✓
            </span>
          )}
        </div>

        {/* Dropdown Menu for Task & Project Binding */}
        {isContextDropdownOpen && (
          <div
            className="absolute left-0 bottom-full mb-2 w-full max-w-sm rounded-2xl bg-surface-container-lowest dark:bg-zinc-900 border border-outline-variant/40 dark:border-zinc-800 shadow-xl p-2.5 z-50 flex flex-col gap-2 font-sans text-xs animate-in fade-in zoom-in-95 duration-150"
            role="menu"
          >
            <div className="relative">
              <input
                type="text"
                autoFocus
                value={contextSearchQuery}
                onChange={(e) => setContextSearchQuery(e.target.value)}
                placeholder="Search tasks or #projects..."
                className="w-full px-3 py-1.5 rounded-lg bg-surface-container dark:bg-zinc-800 border border-outline-variant/30 dark:border-zinc-700 text-on-surface dark:text-zinc-100 placeholder:text-outline text-xs outline-none"
              />
            </div>

            <div className="max-h-48 overflow-y-auto flex flex-col gap-1 pr-1">
              {/* Tasks Section */}
              {filteredTasks.length > 0 && (
                <div>
                  <span className="block px-2 py-1 text-[10px] font-mono text-outline dark:text-zinc-500 uppercase tracking-wider">
                    Tasks
                  </span>
                  {filteredTasks.slice(0, 5).map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setBoundTask(t);
                        setBoundProject(null);
                        setIsContextDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-surface-container dark:hover:bg-zinc-800 text-left transition cursor-pointer"
                    >
                      <CheckSquare className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <span className="truncate text-on-surface dark:text-zinc-200">{t.title}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Projects Section */}
              {filteredProjects.length > 0 && (
                <div>
                  <span className="block px-2 py-1 text-[10px] font-mono text-outline dark:text-zinc-500 uppercase tracking-wider mt-1">
                    Projects
                  </span>
                  {filteredProjects.slice(0, 5).map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setBoundProject(p);
                        setBoundTask(null);
                        setIsContextDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-surface-container dark:hover:bg-zinc-800 text-left transition cursor-pointer"
                    >
                      <Hash className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <span className="truncate text-on-surface dark:text-zinc-200">
                        #{p.slug} <span className="opacity-60 font-normal">({p.title})</span>
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {filteredTasks.length === 0 && filteredProjects.length === 0 && (
                <div className="py-4 text-center text-outline dark:text-zinc-500 text-xs">
                  No matching tasks or projects.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
