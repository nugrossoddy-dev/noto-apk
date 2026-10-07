import React from 'react';
import { TabType } from '../types';

interface TopAppBarProps {
  activeTab: TabType;
  avatarUrl: string;
  userName: string;
  onOpenTune: () => void;
  onOpenAICoach?: () => void;
  onOpenLiveVoice?: () => void;
  onOpenProModal?: () => void;
  isPro?: boolean;
  // Tasks-specific filter state
  taskFilter?: 'all' | 'today' | 'upcoming';
  onTaskFilterChange?: (filter: 'all' | 'today' | 'upcoming') => void;
  todayCount?: number;
  upcomingCount?: number;
}

export const TopAppBar: React.FC<TopAppBarProps> = ({
  activeTab,
  avatarUrl,
  userName,
  onOpenTune,
  onOpenAICoach,
  onOpenLiveVoice,
  onOpenProModal,
  isPro = false,
  taskFilter = 'all',
  onTaskFilterChange,
  todayCount = 3,
  upcomingCount = 2,
}) => {
  if (activeTab === 'tasks') {
    return (
      <header className="sticky top-0 z-40 bg-surface border-b border-surface-container-highest transition-colors duration-150">
        <div className="flex justify-between items-center w-full px-5 py-3">
          {/* Leading: Brand Profile/Context */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface text-[13px] font-semibold ring-1 ring-outline-variant/30">
              N
            </div>
            <div className="flex items-center space-x-2">
              <h1 className="text-[18px] font-semibold text-on-surface leading-tight">Tasks</h1>
              {isPro && (
                <span className="px-1.5 py-0.2 rounded bg-secondary/15 text-secondary text-[10px] font-bold">
                  PRO
                </span>
              )}
            </div>
          </div>
          {/* Trailing Action: Quick Filter / Tuning & AI */}
          <div className="flex items-center space-x-1">
            {onOpenProModal && !isPro && (
              <button
                type="button"
                onClick={onOpenProModal}
                className="px-2.5 py-1 rounded-full bg-surface-container hover:bg-surface-container-high border border-surface-container-highest text-[10px] font-bold tracking-wider text-on-surface transition-colors cursor-pointer mr-0.5"
              >
                PRO
              </button>
            )}
            {onOpenAICoach && (
              <button
                type="button"
                onClick={onOpenAICoach}
                title="Open AI Flow Coach"
                className="w-9 h-9 rounded-full flex items-center justify-center text-secondary hover:bg-secondary/10 transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">psychology</span>
              </button>
            )}
            <button
              type="button"
              onClick={onOpenTune}
              aria-label="Search and filter tasks"
              className="p-2 rounded-full hover:bg-surface-container transition-colors duration-150 active:opacity-80 flex items-center justify-center text-on-surface-variant"
            >
              <span className="material-symbols-outlined text-[20px]">tune</span>
            </button>
          </div>
        </div>

        {/* Segmented Filter Control */}
        <div className="px-5 pb-3 pt-1 flex items-center space-x-2 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => onTaskFilterChange?.('all')}
            className={`px-3.5 py-1.5 rounded-full text-[11px] font-semibold transition-colors ${
              taskFilter === 'all'
                ? 'bg-primary text-on-primary'
                : 'bg-surface-container-low text-on-surface border border-surface-container-highest hover:bg-surface-container'
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => onTaskFilterChange?.('today')}
            className={`px-3.5 py-1.5 rounded-full text-[11px] font-semibold transition-colors ${
              taskFilter === 'today'
                ? 'bg-primary text-on-primary'
                : 'bg-surface-container-low text-on-surface border border-surface-container-highest hover:bg-surface-container'
            }`}
          >
            Today ({todayCount})
          </button>
          <button
            type="button"
            onClick={() => onTaskFilterChange?.('upcoming')}
            className={`px-3.5 py-1.5 rounded-full text-[11px] font-semibold transition-colors ${
              taskFilter === 'upcoming'
                ? 'bg-primary text-on-primary'
                : 'bg-surface-container-low text-on-surface-variant border border-surface-container-highest hover:bg-surface-container'
            }`}
          >
            Upcoming ({upcomingCount})
          </button>
        </div>
      </header>
    );
  }

  // Today Tab Header
  if (activeTab === 'today') {
    return (
      <header className="sticky top-0 z-40 bg-surface flex justify-between items-center w-full px-5 py-3 transition-colors duration-150">
        <div className="flex items-center space-x-3">
          {/* User Profile Avatar */}
          <div className="relative w-8 h-8 rounded-full overflow-hidden ring-1 ring-outline-variant/30 flex items-center justify-center bg-surface-container-high shrink-0">
            {avatarUrl ? (
              <img
                className="w-full h-full object-cover"
                alt={userName}
                src={avatarUrl}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <span className="text-[12px] font-semibold text-on-surface">{userName.charAt(0)}</span>
            )}
          </div>
          <div className="flex flex-col">
            <span className="text-[18px] font-semibold tracking-tight text-on-surface leading-tight">
              Today
            </span>
          </div>
        </div>
        {/* Trailing Icon Action */}
        <div className="flex items-center space-x-1">
          {onOpenProModal && !isPro && (
            <button
              type="button"
              onClick={onOpenProModal}
              className="px-2.5 py-1 rounded-full bg-surface-container hover:bg-surface-container-high border border-surface-container-highest text-[10px] font-bold tracking-wider text-on-surface transition-colors cursor-pointer mr-0.5"
            >
              PRO
            </button>
          )}
          {isPro && (
            <span className="px-2 py-0.5 rounded-full bg-secondary/15 text-secondary text-[10px] font-bold tracking-wider mr-1">
              PRO
            </span>
          )}
          {onOpenAICoach && (
            <button
              type="button"
              onClick={onOpenAICoach}
              title="Open AI Flow Coach"
              className="w-9 h-9 rounded-full flex items-center justify-center text-secondary hover:bg-secondary/10 transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">psychology</span>
            </button>
          )}
          {onOpenLiveVoice && (
            <button
              type="button"
              onClick={onOpenLiveVoice}
              title="Start Gemini 3.8 Live Voice Session"
              className="w-9 h-9 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">record_voice_over</span>
            </button>
          )}
          <button
            type="button"
            onClick={onOpenTune}
            aria-label="Settings and preferences"
            className="w-9 h-9 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container active:opacity-80 transition-all duration-150"
          >
            <span className="material-symbols-outlined text-[20px]">tune</span>
          </button>
        </div>
      </header>
    );
  }

  // Focus Tab Header
  if (activeTab === 'focus') {
    return (
      <header className="sticky top-0 z-40 bg-surface flex justify-between items-center w-full px-5 py-3 border-b border-surface-container-highest transition-colors duration-150">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-secondary/15 flex items-center justify-center text-secondary">
            <span className="material-symbols-outlined text-[18px]">hourglass_top</span>
          </div>
          <span className="text-[18px] font-semibold tracking-tight text-on-surface leading-tight">
            Focus Session
          </span>
        </div>
        <button
          type="button"
          onClick={onOpenTune}
          aria-label="Settings"
          className="w-9 h-9 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">tune</span>
        </button>
      </header>
    );
  }

  // Premium Tab Header
  if (activeTab === 'premium') {
    return (
      <header className="sticky top-0 z-40 bg-surface flex justify-between items-center w-full px-5 py-3 border-b border-surface-container-highest transition-colors duration-150">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-secondary/15 flex items-center justify-center text-secondary">
            <span className="material-symbols-outlined text-[18px]">workspace_premium</span>
          </div>
          <div className="flex items-center space-x-2">
            <h1 className="text-[18px] font-semibold tracking-tight text-on-surface leading-tight">
              NOTO Pro
            </h1>
            {isPro && (
              <span className="px-1.5 py-0.2 rounded bg-secondary/15 text-secondary text-[10px] font-bold">
                ACTIVE
              </span>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={onOpenTune}
          aria-label="Settings"
          className="w-9 h-9 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">tune</span>
        </button>
      </header>
    );
  }

  // Notes Tab Header
  return (
    <header className="sticky top-0 z-40 bg-surface flex justify-between items-center w-full px-5 py-3 border-b border-surface-container-highest transition-colors duration-150">
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface">
          <span className="material-symbols-outlined text-[18px]">edit_note</span>
        </div>
        <span className="text-[18px] font-semibold tracking-tight text-on-surface leading-tight">
          Notes &amp; Reflections
        </span>
      </div>
      <button
        type="button"
        onClick={onOpenTune}
        aria-label="Settings"
        className="w-9 h-9 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors"
      >
        <span className="material-symbols-outlined text-[20px]">tune</span>
      </button>
    </header>
  );
};
