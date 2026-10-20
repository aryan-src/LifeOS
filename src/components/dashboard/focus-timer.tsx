'use client';

import React, { useState, useEffect, useCallback, useRef, useTransition } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  CloudRain,
  MoreVertical,
  ChevronDown,
  Plus,
  Square,
  Search,
} from 'lucide-react';
import { logFocusSession, getFocusBindingContext } from '@/lib/actions/focus-session';
import { updateTaskStatus } from '@/lib/actions/tasks';
import { getTodayDate } from '@/lib/utils/date';

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

interface PresetOption {
  label: string;
  seconds: number;
  mode: TimerMode;
  name: string;
}

const PRESET_OPTIONS: PresetOption[] = [
  { label: '15m', seconds: 900, mode: 'focus', name: 'Micro-Flow' },
  { label: '25m', seconds: 1500, mode: 'focus', name: 'Pomodoro' },
  { label: '50m', seconds: 3000, mode: 'focus', name: 'Deep Flow' },
  { label: '5m Rest', seconds: 300, mode: 'break', name: 'Short Pause' },
  { label: '15m Long', seconds: 900, mode: 'rest', name: 'Resting Flow' },
];

// Circular SVG Progress: Radius = 104 -> Circumference = 2 * PI * 104 ≈ 653.45
const CIRCUMFERENCE = 653.45;

/**
 * 100% Offline Ambient Sound Synthesizer via Web Audio API.
 * Synthesizes tranquil forest rain noise with lowpass filtering.
 */
class ForestRainAudioEngine {
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

const ambientAudioEngine = new ForestRainAudioEngine();

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

  // Sync available tasks when propTasks changes
  useEffect(() => {
    if (propTasks && propTasks.length > 0) {
      setAvailableTasks(propTasks);
    }
  }, [propTasks]);

  // Sync boundTaskId from parent prop
  useEffect(() => {
    if (propBoundTaskId) {
      const found = availableTasks.find((t) => t.id === propBoundTaskId);
      if (found) {
        setBoundTask(found);
      }
    } else if (propBoundTaskId === null && boundTask && availableTasks.some((t) => t.id === boundTask.id)) {
      setBoundTask(null);
    }
  }, [propBoundTaskId, availableTasks]);

  // Fetch binding context from server if not provided
  useEffect(() => {
    if (!propTasks || propTasks.length === 0) {
      startTransition(async () => {
        const res = await getFocusBindingContext();
        if (res.tasks.length > 0) {
          setAvailableTasks(res.tasks);
        }
      });
    }
  }, [propTasks]);

  // Outside click listener to dismiss task dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (taskDropdownRef.current && !taskDropdownRef.current.contains(event.target as Node)) {
        setIsTaskDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  // Circular progress metrics
  const elapsedSeconds = Math.max(0, totalDurationSeconds - remainingSeconds);
  const progressFraction = totalDurationSeconds > 0 ? elapsedSeconds / totalDurationSeconds : 0;
  const strokeDashoffset = CIRCUMFERENCE - progressFraction * CIRCUMFERENCE;
  const percentCompleted = Math.round(progressFraction * 100);

  // Auto-sync task status to in_progress
  const handleTaskStart = useCallback(
    (taskId: string) => {
      if (onTaskStatusChange) {
        onTaskStatusChange(taskId, true);
      } else {
        startTransition(async () => {
          await updateTaskStatus(taskId, { in_progress: true });
        });
      }
    },
    [onTaskStatusChange]
  );

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

  // Timer countdown engine with background drift protection
  useEffect(() => {
    if (!isRunning) return;

    if (!endTimeRef.current) {
      endTimeRef.current = Date.now() + remainingSeconds * 1000;
    }

    const interval = setInterval(() => {
      if (!endTimeRef.current) return;
      const secondsLeft = Math.max(0, Math.ceil((endTimeRef.current - Date.now()) / 1000));
      setRemainingSeconds(secondsLeft);

      if (secondsLeft === 0) {
        clearInterval(interval);
        setIsRunning(false);
        endTimeRef.current = null;

        // Vibrate if supported
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate([80, 40, 80]);
        }

        const completedMinutes = Math.max(1, Math.round(totalDurationSeconds / 60));

        if (currentMode === 'focus') {
          const nextSprintCount = completedSprints + 1;
          const nextCumulativeSeconds = cumulativeSecondsToday + totalDurationSeconds;
          setCompletedSprints(nextSprintCount);
          setCumulativeSecondsToday(nextCumulativeSeconds);

          try {
            localStorage.setItem('lifeos_focus_sprints_today', nextSprintCount.toString());
            localStorage.setItem(
              'lifeos_focus_seconds_today',
              nextCumulativeSeconds.toString()
            );
          } catch {}

          startTransition(async () => {
            const res = await logFocusSession({
              durationMinutes: completedMinutes,
              taskId: boundTask?.id || null,
              mode: 'focus',
            });
            if (res.success) {
              setTelemetryFeedback(`Logged ${completedMinutes}m to ${boundTask?.title || 'general'}`);
              setTimeout(() => setTelemetryFeedback(null), 3500);
            }
          });

          onSessionComplete?.('focus', nextSprintCount);

          // Auto-advance: Every 4th sprint triggers long break
          const nextMode: TimerMode = nextSprintCount % 4 === 0 ? 'rest' : 'break';
          const nextDuration = nextMode === 'rest' ? 900 : 300;
          setCurrentMode(nextMode);
          setTotalDurationSeconds(nextDuration);
          setRemainingSeconds(nextDuration);
        } else {
          onSessionComplete?.(currentMode, completedSprints);
          setCurrentMode('focus');
          setTotalDurationSeconds(1500);
          setRemainingSeconds(1500);
        }
      }
    }, 250);

    return () => clearInterval(interval);
  }, [
    isRunning,
    remainingSeconds,
    totalDurationSeconds,
    currentMode,
    completedSprints,
    cumulativeSecondsToday,
    boundTask,
    onSessionComplete,
  ]);

  // Start / Pause timer toggle
  const toggleTimer = useCallback(() => {
    if (isRunning) {
      setIsRunning(false);
      endTimeRef.current = null;
    } else {
      const targetSec = remainingSeconds === 0 ? totalDurationSeconds : remainingSeconds;
      setRemainingSeconds(targetSec);
      endTimeRef.current = Date.now() + targetSec * 1000;
      setIsRunning(true);

      if (boundTask) {
        handleTaskStart(boundTask.id);
      }
    }
  }, [isRunning, remainingSeconds, totalDurationSeconds, boundTask, handleTaskStart]);

  // Reset timer session
  const handleReset = useCallback(
    (seconds = totalDurationSeconds, mode: TimerMode = currentMode) => {
      setIsRunning(false);
      endTimeRef.current = null;
      setTotalDurationSeconds(seconds);
      setRemainingSeconds(seconds);
      setCurrentMode(mode);
    },
    [totalDurationSeconds, currentMode]
  );

  // Mid-session "Quit & Log" action
  const handleQuitAndLog = useCallback(() => {
    const elapsed = Math.max(0, totalDurationSeconds - remainingSeconds);
    const elapsedMins = Math.floor(elapsed / 60);

    setIsRunning(false);
    endTimeRef.current = null;
    setRemainingSeconds(totalDurationSeconds);

    if (elapsedMins >= 1) {
      const addedSeconds = elapsedMins * 60;
      const nextTotalSeconds = cumulativeSecondsToday + addedSeconds;
      setCumulativeSecondsToday(nextTotalSeconds);

      try {
        localStorage.setItem('lifeos_focus_seconds_today', nextTotalSeconds.toString());
      } catch {}

      startTransition(async () => {
        const res = await logFocusSession({
          durationMinutes: elapsedMins,
          taskId: boundTask?.id || null,
          mode: currentMode,
        });

        const contextLabel = boundTask ? boundTask.title : 'general';
        if (res.success) {
          setTelemetryFeedback(`Logged ${elapsedMins}m to ${contextLabel}`);
        } else {
          setTelemetryFeedback(res.error || 'Failed to log focus session');
        }
        setTimeout(() => setTelemetryFeedback(null), 3500);
      });
    } else {
      setTelemetryFeedback('Session under 1m not logged');
      setTimeout(() => setTelemetryFeedback(null), 3500);
    }
  }, [totalDurationSeconds, remainingSeconds, cumulativeSecondsToday, boundTask, currentMode]);

  // Apply custom duration (1 - 180 min)
  const handleApplyCustom = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const mins = Math.max(1, parseInt(customMinutesInput, 10) || 25);
    handleReset(mins * 60, 'focus');
    setIsCustomOpen(false);
  };

  // Keyboard shortcut listeners: Space (Play/Pause), M (Mute/Unmute Ambient), R (Reset), Esc
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      if (e.code === 'Space') {
        e.preventDefault();
        toggleTimer();
      } else if (e.code === 'KeyR') {
        e.preventDefault();
        handleReset();
      } else if (e.code === 'KeyM') {
        e.preventDefault();
        toggleAmbient();
      } else if (e.code === 'Escape') {
        setIsTaskDropdownOpen(false);
        setIsCustomOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleTimer, handleReset, toggleAmbient]);

  // Filtered task options for dropdown
  const filteredTasks = availableTasks.filter((t) =>
    t.title.toLowerCase().includes(taskSearchQuery.toLowerCase())
  );

  const isBreakMode = currentMode !== 'focus';
  const todayFocusHours = (cumulativeSecondsToday / 3600).toFixed(1);
  const sessionOrdinal = (completedSprints % 4) + 1;

  const sessionStatusTitle =
    currentMode === 'focus'
      ? 'Deep Flow'
      : currentMode === 'break'
      ? 'Short Pause'
      : 'Resting Flow';

  const modeSubtitle = currentMode === 'focus' ? 'Stay Present' : 'Breathe & Unwind';

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
                {todayFocusHours}h <span className="text-stone-400 dark:text-zinc-500 font-normal">/ 4h</span>
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

      {/* 4. Subdued Presets & Dynamic Completion Readout */}
      <div className="space-y-2">
        {/* Dynamic Completion Estimate Badge */}
        <div className="flex items-center justify-center -mt-1 mb-2" id="session-finish-readout">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F5F4EE] dark:bg-zinc-800/80 border border-[#E7E5DD] dark:border-zinc-700/60 text-[11px] font-mono text-stone-500 dark:text-zinc-400 shadow-[0_2px_8px_-2px_rgba(28,25,23,0.04)] select-none">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/80" />
            <span>Finishes at {finishTimeText}</span>
            <span className="text-stone-300 dark:text-zinc-600">·</span>
            <span className="text-stone-400 dark:text-zinc-500">
              {`${Math.floor(elapsedSeconds / 60)}m elapsed`}
            </span>
          </div>
        </div>

        {/* Segmented Preset Duration Track */}
        <nav
          aria-label="Preset timer durations"
          className="flex items-center justify-between p-1 rounded-2xl bg-[#F2F1EA]/80 dark:bg-zinc-800/80 border border-[#E6E4DC] dark:border-zinc-700/60 text-xs font-mono select-none"
          id="presets-container"
        >
          {PRESET_OPTIONS.map((preset) => {
            const isActive =
              currentMode === preset.mode && totalDurationSeconds === preset.seconds;
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => handleReset(preset.seconds, preset.mode)}
                className={`preset-btn px-3 py-1.5 rounded-xl transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-[#FBFBF9] dark:bg-zinc-900 text-stone-900 dark:text-zinc-100 font-medium shadow-[0_2px_8px_-2px_rgba(28,25,23,0.04)] border border-[#E3E1D7] dark:border-zinc-700'
                    : 'text-stone-500 hover:text-stone-800 dark:text-zinc-400 dark:hover:text-zinc-200'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </nav>

        {/* Custom duration drawer toggle & cycle progress */}
        <div className="flex items-center justify-between px-1 text-[11px] font-mono text-stone-400 dark:text-zinc-500">
          <button
            type="button"
            onClick={() => setIsCustomOpen(!isCustomOpen)}
            className="inline-flex items-center gap-1.5 hover:text-stone-700 dark:hover:text-zinc-300 transition-colors cursor-pointer"
            id="custom-toggle"
          >
            <Plus className="w-3 h-3" />
            <span>Custom flow duration</span>
          </button>
          <span className="tracking-tight">Cycle {sessionOrdinal} / 4 completed</span>
        </div>

        {/* Custom Input Drawer Panel */}
        {isCustomOpen && (
          <form
            onSubmit={handleApplyCustom}
            className="pt-1 flex items-center gap-2 p-2 rounded-xl bg-[#F4F3ED] dark:bg-zinc-800 border border-[#E6E4DC] dark:border-zinc-700 text-xs font-mono animate-in fade-in"
            id="custom-panel"
          >
            <span className="text-stone-500 dark:text-zinc-400 pl-1">Minutes:</span>
            <input
              type="number"
              min="1"
              max="180"
              value={customMinutesInput}
              onChange={(e) => setCustomMinutesInput(e.target.value)}
              className="w-16 px-2 py-1 bg-[#FBFBF9] dark:bg-zinc-900 border border-stone-200 dark:border-zinc-700 rounded-lg text-center text-xs text-stone-900 dark:text-zinc-100 focus:ring-1 focus:ring-stone-400 focus:outline-none"
              id="custom-minutes"
            />
            <button
              type="submit"
              className="px-3 py-1 bg-stone-900 hover:bg-stone-800 dark:bg-zinc-100 dark:text-zinc-900 text-white rounded-lg text-xs font-medium transition cursor-pointer"
              id="apply-custom"
            >
              Set
            </button>
          </form>
        )}
      </div>

      {/* 5. Notion-Style Task Callout Footer */}
      <div className="relative" ref={taskDropdownRef} data-purpose="notion-page-callout">
        <button
          type="button"
          onClick={() => setIsTaskDropdownOpen(!isTaskDropdownOpen)}
          className="w-full flex items-center justify-between p-2.5 sm:p-3 rounded-2xl bg-[#F6F5EF] hover:bg-[#EFECE3] dark:bg-zinc-800/80 dark:hover:bg-zinc-800 border border-[#E6E4DB] dark:border-zinc-700/60 transition-all duration-150 group cursor-pointer text-left"
          id="task-selector-trigger"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Notion Document Page Icon */}
            <div className="w-6 h-6 rounded-lg bg-[#EAE8DE] dark:bg-zinc-700 flex items-center justify-center text-stone-700 dark:text-zinc-200 shrink-0 text-xs font-serif shadow-[0_2px_8px_-2px_rgba(28,25,23,0.04)]">
              📄
            </div>
            <div className="truncate">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono tracking-wider uppercase text-stone-400 dark:text-zinc-500">
                  Current Page
                </span>
                <span
                  className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-[#E9E7DC] dark:bg-zinc-700 text-stone-600 dark:text-zinc-300 font-medium"
                  id="pomo-count-badge"
                >
                  🍅 2/4 Pomos
                </span>
              </div>
              <p
                className="text-xs font-medium text-stone-800 dark:text-zinc-200 truncate"
                id="selected-task-text"
              >
                {boundTask ? boundTask.title : 'Q3 Product Architecture Spec & Flow Design'}
              </p>
            </div>
          </div>
          <ChevronDown
            className={`w-3.5 h-3.5 text-stone-400 group-hover:text-stone-700 dark:text-zinc-500 dark:group-hover:text-zinc-300 shrink-0 ml-2 transition-transform duration-200 ${
              isTaskDropdownOpen ? 'rotate-180' : ''
            }`}
            id="dropdown-chevron"
          />
        </button>

        {/* Task Dropdown Selection List */}
        {isTaskDropdownOpen && (
          <div
            className="absolute left-0 right-0 bottom-full mb-2 bg-[#FBFBF9] dark:bg-zinc-900 rounded-2xl border border-[#E3E1D7] dark:border-zinc-700 shadow-xl p-2 z-30 text-xs font-sans animate-in fade-in zoom-in-95 duration-150"
            id="task-dropdown"
          >
            <div className="px-2 py-1.5 text-[10px] font-mono text-stone-400 dark:text-zinc-500 uppercase tracking-wider border-b border-[#EFECE4] dark:border-zinc-800 mb-1 flex items-center justify-between">
              <span>Linked Notion Pages &amp; Tasks</span>
            </div>

            {/* Quick search input */}
            <div className="px-1 mb-1.5">
              <div className="flex items-center gap-1.5 px-2 py-1 bg-[#F4F3ED] dark:bg-zinc-800 rounded-lg text-xs">
                <Search className="w-3 h-3 text-stone-400" />
                <input
                  type="text"
                  autoFocus
                  value={taskSearchQuery}
                  onChange={(e) => setTaskSearchQuery(e.target.value)}
                  placeholder="Search pages..."
                  className="w-full bg-transparent border-none text-xs text-stone-800 dark:text-zinc-200 outline-none placeholder:text-stone-400"
                />
              </div>
            </div>

            <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
              {filteredTasks.length > 0 ? (
                filteredTasks.map((t, idx) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setBoundTask(t);
                      onBindTask?.(t);
                      setIsTaskDropdownOpen(false);
                      if (isRunning) {
                        handleTaskStart(t.id);
                      }
                    }}
                    className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition cursor-pointer ${
                      boundTask?.id === t.id
                        ? 'bg-[#EFECE3] dark:bg-zinc-800 text-stone-900 dark:text-zinc-100 font-medium'
                        : 'hover:bg-[#F3F2EC] dark:hover:bg-zinc-800/60 text-stone-700 dark:text-zinc-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-xs">
                        {idx % 3 === 0 ? '📄' : idx % 3 === 1 ? '✨' : '📖'}
                      </span>
                      <span className="font-medium truncate">{t.title}</span>
                    </div>
                    <span className="text-[10px] font-mono text-stone-400 dark:text-zinc-500 ml-2 shrink-0">
                      {(idx % 4) + 1}/4
                    </span>
                  </button>
                ))
              ) : (
                <div className="py-3 text-center text-xs text-stone-400 dark:text-zinc-500">
                  No matching tasks found
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 6. Subtle Keyboard Shortcut Hints Footer */}
      <footer className="pt-1 flex items-center justify-center gap-3 sm:gap-4 text-[11px] font-mono text-stone-400 dark:text-zinc-500 select-none">
        <span className="flex items-center gap-1.5">
          <kbd className="px-1.5 py-0.5 rounded-md bg-[#EDEBE2] dark:bg-zinc-800 text-stone-600 dark:text-zinc-300 border border-[#DDD9CE] dark:border-zinc-700 text-[10px]">
            Space
          </kbd>{' '}
          {isRunning ? 'Pause' : 'Focus'}
        </span>
        <span className="text-stone-300 dark:text-zinc-700">·</span>
        <span className="flex items-center gap-1.5">
          <kbd className="px-1.5 py-0.5 rounded-md bg-[#EDEBE2] dark:bg-zinc-800 text-stone-600 dark:text-zinc-300 border border-[#DDD9CE] dark:border-zinc-700 text-[10px]">
            M
          </kbd>{' '}
          {isAmbientPlaying ? 'Mute' : 'Rain'}
        </span>
        <span className="text-stone-300 dark:text-zinc-700">·</span>
        <span className="flex items-center gap-1.5">
          <kbd className="px-1.5 py-0.5 rounded-md bg-[#EDEBE2] dark:bg-zinc-800 text-stone-600 dark:text-zinc-300 border border-[#DDD9CE] dark:border-zinc-700 text-[10px]">
            R
          </kbd>{' '}
          Reset
        </span>
      </footer>
    </section>
  );
}
