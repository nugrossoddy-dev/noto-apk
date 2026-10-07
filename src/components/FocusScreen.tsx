import React, { useState, useEffect } from 'react';
import { Task } from '../types';
import { playChime, startAmbientSound, stopAmbientSound } from '../utils/audio';

interface FocusScreenProps {
  activeTask: Task | null;
  onCompleteTask: (taskId: string) => void;
  onBackToToday: () => void;
}

export const FocusScreen: React.FC<FocusScreenProps> = ({
  activeTask,
  onCompleteTask,
  onBackToToday,
}) => {
  const defaultDuration = (activeTask?.durationMin || 45) * 60;
  const [timeLeft, setTimeLeft] = useState<number>(defaultDuration);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [ambientSound, setAmbientSound] = useState<'off' | 'rain' | 'brown'>('off');

  // Reset timer if active task changes
  useEffect(() => {
    setTimeLeft((activeTask?.durationMin || 45) * 60);
    setIsRunning(false);
  }, [activeTask?.id, activeTask?.durationMin]);

  // Interval ticker
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isRunning && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            playChime(528, 3.0);
            setIsRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isRunning, timeLeft]);

  // Ambient sound management
  const handleAmbientChange = (type: 'off' | 'rain' | 'brown') => {
    setAmbientSound(type);
    if (type === 'off') {
      stopAmbientSound();
    } else {
      startAmbientSound(type, 0.12);
    }
  };

  useEffect(() => {
    return () => {
      stopAmbientSound();
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleRunning = () => {
    if (!isRunning) {
      playChime(440, 1.2);
    }
    setIsRunning(!isRunning);
  };

  const handleAddFiveMinutes = () => {
    setTimeLeft((prev) => prev + 300);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft((activeTask?.durationMin || 45) * 60);
  };

  const handleFinish = () => {
    playChime(660, 2.5);
    if (activeTask) {
      onCompleteTask(activeTask.id);
    }
    stopAmbientSound();
    setAmbientSound('off');
    onBackToToday();
  };

  const totalSeconds = (activeTask?.durationMin || 45) * 60;
  const progressPercent = Math.min(100, Math.max(0, ((totalSeconds - timeLeft) / totalSeconds) * 100));

  return (
    <div className="w-full flex flex-col items-center justify-center py-4 px-2 space-y-6">
      {/* Return Pill */}
      <div className="w-full flex items-center justify-between">
        <button
          type="button"
          onClick={onBackToToday}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface-variant text-[13px] font-medium transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          <span>Back to Today</span>
        </button>

        <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-secondary-container text-on-secondary-container text-[11px] font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>
          <span>Deep Flow</span>
        </span>
      </div>

      {/* Task Headline */}
      <div className="text-center space-y-2 max-w-sm pt-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">
          Current Focus Block
        </span>
        <h2 className="text-[22px] font-medium text-on-surface tracking-tight leading-snug">
          {activeTask?.title || 'Finish marketing research proposal'}
        </h2>
        <div className="flex items-center justify-center space-x-2 text-[13px] text-on-surface-variant">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-surface-container text-[11px] font-medium">
            {activeTask?.category || 'Deep Work'}
          </span>
          <span>•</span>
          <span>Target: {activeTask?.durationMin || 45} mins</span>
        </div>
      </div>

      {/* Minimalistic Zen Clock / Timer Dial */}
      <div className="relative w-64 h-64 flex items-center justify-center my-4">
        {/* SVG Circular Ring */}
        <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 240 240">
          <circle
            cx="120"
            cy="120"
            r="105"
            stroke="currentColor"
            strokeWidth="3.5"
            className="text-surface-container-highest"
            fill="transparent"
          />
          <circle
            cx="120"
            cy="120"
            r="105"
            stroke="currentColor"
            strokeWidth="4"
            className="text-secondary transition-all duration-500 ease-linear"
            strokeDasharray={2 * Math.PI * 105}
            strokeDashoffset={2 * Math.PI * 105 * (1 - progressPercent / 100)}
            strokeLinecap="round"
            fill="transparent"
          />
        </svg>

        {/* Center Display */}
        <div className="absolute flex flex-col items-center justify-center space-y-1">
          <span className="text-[44px] font-semibold tracking-tight text-on-surface font-mono">
            {formatTime(timeLeft)}
          </span>
          <span className="text-[12px] font-medium text-on-surface-variant">
            {isRunning ? 'Flow active' : timeLeft === 0 ? 'Session Complete' : 'Paused'}
          </span>
        </div>
      </div>

      {/* Primary Timer Controls */}
      <div className="flex items-center space-x-4">
        <button
          type="button"
          onClick={handleReset}
          title="Reset timer"
          className="w-11 h-11 rounded-full border border-surface-container-highest bg-surface-container-lowest flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors active:scale-95"
        >
          <span className="material-symbols-outlined text-[20px]">restart_alt</span>
        </button>

        <button
          type="button"
          onClick={toggleRunning}
          className={`h-14 px-8 rounded-full flex items-center justify-center space-x-2 text-[16px] font-medium transition-all duration-150 active:scale-95 shadow-sm ${
            isRunning
              ? 'bg-[#191919] text-[#ffffff] hover:bg-[#2c2c2c]'
              : 'bg-secondary text-white hover:bg-[#2f5541]'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">
            {isRunning ? 'pause' : 'play_arrow'}
          </span>
          <span>{isRunning ? 'Pause' : 'Start Focus'}</span>
        </button>

        <button
          type="button"
          onClick={handleAddFiveMinutes}
          title="Add 5 minutes"
          className="w-11 h-11 rounded-full border border-surface-container-highest bg-surface-container-lowest flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors active:scale-95 text-[13px] font-semibold"
        >
          +5m
        </button>
      </div>

      {/* Ambient Audio Pill Selector */}
      <div className="w-full max-w-xs bg-surface-container-lowest border border-surface-container-highest rounded-xl p-3 space-y-2">
        <div className="flex items-center justify-between text-[11px] font-semibold tracking-wider text-on-surface-variant uppercase">
          <span className="flex items-center space-x-1">
            <span className="material-symbols-outlined text-[14px]">headphones</span>
            <span>Ambient Soundscape</span>
          </span>
          <span className="text-secondary">{ambientSound !== 'off' ? 'Playing' : 'Muted'}</span>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          <button
            type="button"
            onClick={() => handleAmbientChange('off')}
            className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold transition-colors ${
              ambientSound === 'off'
                ? 'bg-primary text-on-primary'
                : 'bg-surface-container-low text-on-surface hover:bg-surface-container'
            }`}
          >
            Silent
          </button>
          <button
            type="button"
            onClick={() => handleAmbientChange('brown')}
            className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold transition-colors ${
              ambientSound === 'brown'
                ? 'bg-secondary text-on-secondary'
                : 'bg-surface-container-low text-on-surface hover:bg-surface-container'
            }`}
          >
            Brown Noise
          </button>
          <button
            type="button"
            onClick={() => handleAmbientChange('rain')}
            className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold transition-colors ${
              ambientSound === 'rain'
                ? 'bg-secondary text-on-secondary'
                : 'bg-surface-container-low text-on-surface hover:bg-surface-container'
            }`}
          >
            Soft Rain
          </button>
        </div>
      </div>

      {/* Complete Session Button */}
      <div className="w-full max-w-xs pt-1">
        <button
          type="button"
          onClick={handleFinish}
          className="w-full h-11 border border-secondary text-secondary hover:bg-secondary/10 rounded-full text-[14px] font-medium flex items-center justify-center space-x-2 transition-colors active:scale-[0.99]"
        >
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
          <span>Mark Task Completed &amp; Finish</span>
        </button>
      </div>
    </div>
  );
};
