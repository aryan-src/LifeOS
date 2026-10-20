'use client';

import React, { useState, useEffect, useRef, useTransition } from 'react';
import { VaporCountdownDigits } from '@/components/ui/countdown-vapor-digits';
import { logFocusSession, getFocusBindingContext } from '@/lib/actions/focus-session';
import { updateTaskStatus } from '@/lib/actions/tasks';
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
  Square,
} from 'lucide-react';

export type TimerMode = 'focus' | 'break' | 'rest';

export interface FocusTimerProps {
  className?: string;
  tasks?: Array<{ id: string; title: string }>;
  projects?: Array<{ id: string; title: string; slug: string }>;
  boundTaskId?: string | null;
  onBindTask?: (task: { id: string; title: string } | null) => void;
  onTaskStatusChange?: (taskId: string, inProgress: boolean) => void;
  onSessionComplete?: (mode: string, completedSprints: number) => void;
}

export interface PresetOption {
  label: string;
  seconds: number;
  mode: TimerMode;
  name: string;
}

export const PRESET_OPTIONS: PresetOption[] = [
  { label: '15m', seconds: 900, mode: 'focus', name: 'Micro-Flow' },
  { label: '25m', seconds: 1500, mode: 'focus', name: 'Pomodoro' },
  { label: '50m', seconds: 3000, mode: 'focus', name: 'Deep Flow' },
  { label: '5m Rest', seconds: 300, mode: 'break', name: 'Short Pause' },
  { label: '15m Long', seconds: 900, mode: 'rest', name: 'Resting Flow' },
];

// Circular SVG Progress: Radius = 104 -> Circumference = 2 * PI * 104 ≈ 653.45
export const CIRCUMFERENCE = 653.45;

/**
 * 100% Offline Ambient Sound Synthesizer via Web Audio API.
 * Synthesizes tranquil forest rain noise with organic lowpass filtering.
 */
export class ForestRainAudioEngine {
  private ctx: AudioContext | null = null;
  private noiseNode: AudioNode | null = null;
  private isPlaying = false;

  start() {
    if (this.isPlaying || typeof window === 'undefined') return;
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      const bufferSize = this.ctx.sampleRate * 2;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);

      // Pink/brownian organic noise simulation
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        data[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = data[i];
        data[i] *= 2.5;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;

      // Organic lowpass filter mimicking canopy rain drops
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, this.ctx.currentTime);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.04, this.ctx.currentTime);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start();
      this.noiseNode = noise;
      this.isPlaying = true;
    } catch {
      // Audio autoplay restrictions or headless test runners
    }
  }

  stop() {
    if (!this.isPlaying) return;
    try {
      if (this.ctx) {
        this.ctx.close();
        this.ctx = null;
      }
      this.isPlaying = false;
      this.noiseNode = null;
    } catch {
      // Audio teardown safe fallback
    }
  }
}

export const ambientAudioEngine = new ForestRainAudioEngine();

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
  boundTaskId: propBoundTaskId,
  onBindTask,
  onTaskStatusChange,
  onSessionComplete,
}: FocusTimerProps) {
  // Timer countdown engine state
  const [totalDurationSeconds, setTotalDurationSeconds] = useState<number>(1500); // 25m default
  const [remainingSeconds, setRemainingSeconds] = useState<number>(1500);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [currentMode, setCurrentMode] = useState<TimerMode>('focus');

  // Gamification & Telemetry State
  const [completedSprints, setCompletedSprints] = useState<number>(2); // Session 3 of 4
  const [cumulativeSecondsToday, setCumulativeSecondsToday] = useState<number>(3.5 * 3600); // 3.5h default
  const [telemetryFeedback, setTelemetryFeedback] = useState<string | null>(null);

  // Ambient Audio
  const [isAmbientPlaying, setIsAmbientPlaying] = useState<boolean>(false);

  // Toggle ambient audio
  const toggleAmbient = useCallback(() => {
    setIsAmbientPlaying((prev) => {
      const next = !prev;
      if (next) {
        ambientAudioEngine.start();
      } else {
        ambientAudioEngine.stop();
      }
      return next;
    });
  }, []);

  // Custom Time Setter & Controls
  const [isCustomOpen, setIsCustomOpen] = useState<boolean>(false);
  const [customMinutesInput, setCustomMinutesInput] = useState<string>('35');

  // Notion-Style Task Binding
  const [isTaskDropdownOpen, setIsTaskDropdownOpen] = useState<boolean>(false);
  const [taskSearchQuery, setTaskSearchQuery] = useState<string>('');
  const [availableTasks, setAvailableTasks] = useState<Array<{ id: string; title: string }>>(
    propTasks || [
      { id: 't-1', title: 'Q3 Product Architecture Spec & Flow Design' },
      { id: 't-2', title: 'Deep Work: Zen Interface Polish & Design Tokens' },
      { id: 't-3', title: 'Reading: Scandinavian Minimal Systems' },
    ]
  );

  const initialBoundTask =
    propBoundTaskId && propTasks
      ? propTasks.find((t) => t.id === propBoundTaskId) || null
      : propBoundTaskId
      ? { id: propBoundTaskId, title: 'Bound Task' }
      : propTasks && propTasks.length > 0
      ? propTasks[0]
      : { id: 't-1', title: 'Q3 Product Architecture Spec & Flow Design' };

  const [boundTask, setBoundTask] = useState<{ id: string; title: string } | null>(initialBoundTask);

  const [, startTransition] = useTransition();
  const endTimeRef = useRef<number | null>(null);
  const taskDropdownRef = useRef<HTMLDivElement>(null);
  const todayStr = getTodayDate();

  // Load saved state from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const savedDate = localStorage.getItem('lifeos_focus_date');
      if (savedDate === todayStr) {
        const savedSeconds = parseInt(
          localStorage.getItem('lifeos_focus_seconds_today') || '0',
          10
        );
        const savedSprints = parseInt(
          localStorage.getItem('lifeos_focus_sprints_today') || '0',
          10
        );
        if (!isNaN(savedSeconds) && savedSeconds > 0) setCumulativeSecondsToday(savedSeconds);
        if (!isNaN(savedSprints) && savedSprints > 0) setCompletedSprints(savedSprints);
      } else {
        localStorage.setItem('lifeos_focus_date', todayStr);
      }
    } catch {}
  }, [todayStr]);
  // Format MM:SS helper
  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Real-time "Finishes at [HH:MM AM/PM]"
  const [finishTimeText, setFinishTimeText] = useState<string>('10:45 AM');

  useEffect(() => {
    const targetDate = new Date(Date.now() + remainingSeconds * 1000);
    const hours = targetDate.getHours();
    const mins = targetDate.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 === 0 ? 12 : hours % 12;
    const formattedMins = String(mins).padStart(2, '0');
    setFinishTimeText(`${formattedHours}:${formattedMins} ${ampm}`);
  }, [remainingSeconds, isRunning]);

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

  // Sync available tasks when propTasks changes
  useEffect(() => {
    if (propTasks && propTasks.length > 0) {
      setAvailableTasks(propTasks);
    }
  }, [propTasks]);

  // Sync available projects when propProjects changes
  useEffect(() => {
    if (propProjects && propProjects.length > 0) {
      setAvailableProjects(propProjects);
    }
  }, [propProjects]);

  // Sync boundTaskId from parent prop
  useEffect(() => {
    if (propBoundTaskId) {
      const found = availableTasks.find((t) => t.id === propBoundTaskId);
      if (found) {
        setBoundTask(found);
        setBoundProject(null);
      }
    } else if (propBoundTaskId === null && boundTask && availableTasks.some((t) => t.id === boundTask.id)) {
      setBoundTask(null);
    }
  }, [propBoundTaskId, availableTasks]);

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

  // Automatically trigger task in_progress status update
  const handleTaskStart = (taskId: string) => {
    if (onTaskStatusChange) {
      onTaskStatusChange(taskId, true);
    } else {
      startTransition(async () => {
        await updateTaskStatus(taskId, { in_progress: true });
      });
    }
  };

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
      if (boundTask) {
        handleTaskStart(boundTask.id);
      }
    } else {
      const targetSeconds = remainingSeconds === 0 ? totalDuration : remainingSeconds;
      setRemainingSeconds(targetSeconds);
      endTimeRef.current = Date.now() + targetSeconds * 1000;
      setTimerState('running');
      if (boundTask) {
        handleTaskStart(boundTask.id);
      }
    }
  };

  // Mid-Session "Quit & Log" Action:
  // Immediately stops the countdown, calculates exact elapsed focus time, logs telemetry,
  // updates daily accumulation, and returns timer to idle state.
  const handleQuitAndLog = () => {
    // 1. Calculate exact elapsed focus time:
    // elapsedSeconds = totalDurationSeconds - remainingSeconds
    // elapsedMinutes = floor(elapsedSeconds / 60)
    const elapsedSeconds = Math.max(0, totalDuration - remainingSeconds);
    const elapsedMinutes = Math.floor(elapsedSeconds / 60);

    // Stop countdown and return timer to idle state
    setTimerState('idle');
    endTimeRef.current = null;
    setRemainingSeconds(totalDuration);

    if (elapsedMinutes >= 1) {
      // 2. Optimistically add elapsedMinutes to today's cumulative focus total
      const addedSeconds = elapsedMinutes * 60;
      const nextTotalSeconds = cumulativeSecondsToday + addedSeconds;
      setCumulativeSecondsToday(nextTotalSeconds);

      try {
        localStorage.setItem(
          'lifeos_focus_seconds_today',
          nextTotalSeconds.toString()
        );
      } catch {}

      // 3. Telemetry Server Action
      startTransition(async () => {
        const res = await logFocusSession({
          durationMinutes: elapsedMinutes,
          taskId: boundTask?.id || null,
          projectId: boundProject?.id || null,
          mode: mode,
        });

        const contextLabel = boundTask
          ? boundTask.title
          : boundProject
          ? `#${boundProject.slug}`
          : 'general';

        if (res.success) {
          setTelemetryFeedback(`Logged ${elapsedMinutes}m to ${contextLabel}`);
        } else {
          setTelemetryFeedback(res.error || 'Failed to log focus session');
        }
        setTimeout(() => setTelemetryFeedback(null), 3500);
      });
    } else {
      // Graceful notice for partial session under 1 minute
      setTelemetryFeedback('Session under 1m not logged');
      setTimeout(() => setTelemetryFeedback(null), 3500);
    }
  };

  // Reset Timer (separate action to abandon session without recording elapsed minutes)
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

  const isBreakMode = currentMode !== 'focus';
  const sessionOrdinal = (completedSprints % 4) + 1;
  const sessionStatusTitle =
    currentMode === 'focus'
      ? 'Deep Flow'
      : currentMode === 'break'
      ? 'Short Pause'
      : 'Resting Flow';

  return (
    <section
      className={`w-full bg-[#FBFBF9] dark:bg-zinc-900 rounded-[32px] border border-[#ECEAE3] dark:border-zinc-800 shadow-[0_20px_48px_-12px_rgba(28,25,23,0.05),0_1px_3px_rgba(28,25,23,0.02)] p-7 sm:p-9 space-y-7 transition-all duration-300 ${className}`}
      role="region"
      aria-label="Pomodoro Focus Timer"
      data-purpose="timer-card"
    >
      {/* 1. Header: Zen Flow Badges & Ambient Sound Pill */}
      <header className="flex items-center justify-between gap-3 text-xs">
        {/* Flow status & session progression indicator */}
        <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-[#F3F2EC] dark:bg-zinc-800/80 border border-[#E7E5DC] dark:border-zinc-700/60 text-stone-600 dark:text-zinc-300 font-mono text-[11px] shadow-[0_2px_8px_-2px_rgba(28,25,23,0.04)] select-none">
          <span className="relative flex h-2 w-2">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full ${
                isBreakMode ? 'bg-amber-400' : 'bg-emerald-400'
              } opacity-60 ${isRunning ? '' : 'hidden'}`}
              id="flow-dot-ping"
            />
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                isBreakMode ? 'bg-amber-500' : 'bg-emerald-600/90'
              }`}
              id="flow-dot"
            />
          </span>
          <span className="font-medium text-stone-700 dark:text-zinc-200 tracking-tight" id="session-status-text">
            {sessionStatusTitle}
          </span>
          <span className="text-stone-300 dark:text-zinc-600">·</span>
          <span className="text-stone-500 dark:text-zinc-400 font-normal">
            Session {sessionOrdinal} of 4
          </span>
        </div>

        {/* Ambient sound & Settings toggles */}
        <div className="flex items-center gap-1.5">
          {/* Ambient Sound Toggle Badge */}
          <button
            type="button"
            onClick={toggleAmbient}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-[#E7E5DD] dark:border-zinc-700 text-[11px] font-sans transition-colors cursor-pointer group ${
              isAmbientPlaying
                ? 'bg-[#EFECE3] dark:bg-zinc-800 text-stone-900 dark:text-zinc-100 font-medium'
                : 'bg-[#F5F4EE] hover:bg-[#EFECE3] dark:bg-zinc-800/50 dark:hover:bg-zinc-800 text-stone-600 dark:text-zinc-400 opacity-80'
            }`}
            id="ambient-btn"
            title="Toggle Forest Rain audio (Press M)"
          >
            <CloudRain
              className={`w-3.5 h-3.5 transition-colors ${
                isAmbientPlaying
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : 'text-stone-400 group-hover:text-stone-700 dark:text-zinc-500 dark:group-hover:text-zinc-300'
              }`}
            />
            <span className="tracking-tight text-[11.5px]" id="ambient-label">
              {isAmbientPlaying ? 'Forest Rain' : 'Muted'}
            </span>
          </button>

          {/* Zen Settings / Custom Time Drawer Toggle */}
          <button
            type="button"
            onClick={() => setIsCustomOpen(!isCustomOpen)}
            className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 dark:text-zinc-500 dark:hover:text-zinc-200 hover:bg-[#F3F1EB] dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            id="settings-btn"
            title="Focus duration settings"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 2. Telemetry Metric Strip */}
      <div
        className="p-3 sm:p-3.5 rounded-2xl bg-[#F6F5EF] dark:bg-zinc-800/60 border border-[#E6E4DB] dark:border-zinc-700/60 text-xs font-mono select-none"
        data-purpose="telemetry-metrics"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4 items-center divide-y sm:divide-y-0 sm:divide-x divide-[#E7E5DC] dark:divide-zinc-700/60">
          {/* Column 1: Daily Focus Goal */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-stone-500 dark:text-zinc-400 font-normal tracking-tight">Focus Goal</span>
              <span className="text-stone-800 dark:text-zinc-200 font-medium tracking-tight">
                {(cumulativeSecondsToday / 3600).toFixed(1)}h <span className="text-stone-400 dark:text-zinc-500 font-normal">/ 4h</span>
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-[#E5E3D8] dark:bg-zinc-700 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                style={{
                  width: `${Math.min(100, Math.round((cumulativeSecondsToday / (4 * 3600)) * 100))}%`,
                }}
              />
            </div>
          </div>

          {/* Column 2: Flow Index */}
          <div className="pt-2.5 sm:pt-0 sm:pl-4 flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-stone-500 dark:text-zinc-400 font-normal tracking-tight">Flow Index</span>
              <span className="inline-flex items-center gap-1 text-[#0284c7] font-medium tracking-tight">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#0ea5e9]" />
                94%
              </span>
            </div>
            <div className="text-[11px] text-stone-500 dark:text-zinc-400 tracking-tight font-sans">
              <span className="text-emerald-700 dark:text-emerald-400 font-medium">Peak flow</span>{' '}
              <span className="text-stone-400 dark:text-zinc-500">·</span> No fatigue
            </div>
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

      {/* 3. Centerpiece: Circular Minimal Flow Ring & High-Contrast Serene Typography */}
      <div className="flex flex-col items-center justify-center py-2 relative" data-purpose="centerpiece-display">
        <div className="relative w-64 h-64 sm:w-68 sm:h-68 flex items-center justify-center">
          {/* Subtle outer breathing atmosphere ring */}
          <div className="absolute inset-0 rounded-full border border-stone-300/40 dark:border-zinc-700/40 animate-pulse pointer-events-none" />

          {/* SVG Circular Progress Ring */}
          <svg className="w-full h-full p-2 -rotate-90 origin-center" viewBox="0 0 240 240">
            {/* Background base track */}
            <circle
              cx="120"
              cy="120"
              fill="none"
              r="104"
              stroke="#ECEAE2"
              strokeWidth="2.5"
              className="dark:stroke-zinc-800"
            />
            {/* Active progress ring */}
            <circle
              cx="120"
              cy="120"
              fill="none"
              r="104"
              stroke={isBreakMode ? '#b45309' : '#262422'}
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              strokeWidth="3"
              className="transition-[stroke-dashoffset] duration-700 ease-out dark:stroke-zinc-200"
              id="zen-progress-ring"
            />
          </svg>

          {/* Core Numbers Display Inside Circle */}
          <div className="absolute flex flex-col items-center justify-center select-none text-center">
            <span
              className="text-[9px] font-mono tracking-widest uppercase text-stone-400 dark:text-zinc-500 mb-1"
              id="mode-subtitle"
            >
              {modeSubtitle}
            </span>
            <span
              className="font-sans font-light tracking-[-0.04em] text-6xl sm:text-7xl text-stone-900 dark:text-zinc-100 leading-none tabular-nums"
              id="timer-display"
            >
              {formatTime(remainingSeconds)}
            </span>
            <span
              className="text-xs font-mono text-stone-400 dark:text-zinc-500 mt-2 font-light tracking-tight"
              id="zen-secondary-label"
            >
              {isRunning
                ? `${percentCompleted}% · ${formatTime(remainingSeconds)} left`
                : remainingSeconds === totalDurationSeconds
                ? 'Ready · 0% completed'
                : `Paused · ${percentCompleted}%`}
            </span>
          </div>
        </div>

        {/* Tactile Quiet Interaction CTA: Minimal Smooth Circular Play/Pause & Reset */}
        <div className="mt-4 flex items-center justify-center gap-3">
          {/* Main Focus Action CTA Button */}
          <button
            type="button"
            onClick={toggleTimer}
            aria-label="Toggle focus session"
            className="relative group h-13 px-6 py-3 rounded-full bg-[#1C1A18] hover:bg-[#2F2C28] dark:bg-zinc-100 dark:hover:bg-zinc-200 text-[#FBFBF9] dark:text-zinc-900 shadow-[0_20px_48px_-12px_rgba(28,25,23,0.05)] transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-stone-400 focus:ring-offset-2 active:scale-95 shrink-0"
            id="action-btn"
          >
            {isRunning ? (
              <Pause className="w-4 h-4 fill-current transition-transform" id="icon-pause" />
            ) : (
              <Play className="w-4 h-4 fill-current translate-x-0.5 transition-transform" id="icon-play" />
            )}
            <span className="text-xs font-medium tracking-tight" id="action-label">
              {isRunning ? 'Pause' : 'Focus'}
            </span>
          </button>

          {/* Reset button */}
          <button
            type="button"
            onClick={() => handleReset(totalDurationSeconds, currentMode)}
            className="p-3 rounded-full bg-[#F3F2EB] hover:bg-[#EBE9E1] dark:bg-zinc-800 dark:hover:bg-zinc-700 active:scale-95 text-stone-500 hover:text-stone-800 dark:text-zinc-400 dark:hover:text-zinc-100 transition-all duration-150 cursor-pointer shadow-sm"
            id="reset-btn"
            title="Reset Session (R)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Mid-Session "Quit & Log" Button when active */}
          {(isRunning || remainingSeconds !== totalDurationSeconds) && (
            <button
              type="button"
              onClick={handleQuitAndLog}
              className="px-3.5 py-2.5 rounded-full bg-[#F5F4EE] hover:bg-[#EFECE3] dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-[#E7E5DD] dark:border-zinc-700 text-stone-700 dark:text-zinc-300 text-xs font-mono font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
              title="Quit & Log elapsed focus time"
              aria-label="Quit and Log"
            >
              <Square className="w-3.5 h-3.5 fill-current text-stone-600 dark:text-zinc-400" />
              <span>Quit &amp; Log</span>
            </button>
          )}
        </div>

        {/* Telemetry notification pill */}
        {telemetryFeedback && (
          <div className="mt-2 text-[11px] font-mono text-emerald-700 dark:text-emerald-400 animate-in fade-in">
            {telemetryFeedback} ✓
          </div>
        )}
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
                    onBindTask?.(null);
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
            <span
              className={`text-[11px] font-mono animate-in fade-in ${
                telemetryFeedback.includes('under 1m')
                  ? 'text-amber-700 dark:text-amber-400 font-medium'
                  : 'text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {telemetryFeedback} {telemetryFeedback.includes('under 1m') ? '•' : '✓'}
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
                        onBindTask?.(t);
                        if (timerState === 'running') {
                          handleTaskStart(t.id);
                        }
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
                        onBindTask?.(null);
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
