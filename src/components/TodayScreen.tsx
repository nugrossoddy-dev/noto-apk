import React from 'react';
import { Task, TimelineEvent, UserPreferences } from '../types';

interface TodayScreenProps {
  tasks: Task[];
  timeline: TimelineEvent[];
  userPrefs: UserPreferences;
  onStartFocus: (task: Task) => void;
  onToggleTimelineEvent: (eventId: string) => void;
  onNavigateToTasks: () => void;
  onOpenAICoach?: () => void;
  onOpenLiveVoice?: () => void;
}

export const TodayScreen: React.FC<TodayScreenProps> = ({
  tasks,
  timeline,
  userPrefs,
  onStartFocus,
  onToggleTimelineEvent,
  onNavigateToTasks,
  onOpenAICoach,
  onOpenLiveVoice,
}) => {
  // Compute metrics dynamically from current state
  const todayTasks = tasks.filter((t) => t.timeframe === 'today');
  const completedTodayTasks = todayTasks.filter((t) => t.completed).length;
  const totalTodayTasks = todayTasks.length;
  const taskProgressPercent =
    totalTodayTasks > 0 ? Math.round((completedTodayTasks / totalTodayTasks) * 100) : 0;

  const unfinishedTasks = todayTasks.filter((t) => !t.completed);
  const tasksLeft = unfinishedTasks.length;
  const importantTasks = todayTasks.filter((t) => t.priority === 'High' && !t.completed).length;
  const totalFocusMin = todayTasks.reduce((acc, t) => (t.completed ? acc : acc + t.durationMin), 0);

  // Next up task: first unfinished high/medium task, or fallback to the primary one
  const nextUpTask =
    tasks.find((t) => t.id === 'task-1' && !t.completed) ||
    unfinishedTasks[0] ||
    tasks[0];

  // Timeline events scheduled count & on track count
  const doneTimelineCount = timeline.filter((e) => e.status === 'done').length;
  const totalTimelineCount = timeline.length;
  const onTrackSummary = `${doneTimelineCount + 1} of ${totalTimelineCount} on track`;

  // SVG circle calculations for the progress ring
  const ringRadius = 18;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringDashOffset = ringCircumference - (taskProgressPercent / 100) * ringCircumference;

  return (
    <div className="w-full flex flex-col space-y-6">
      {/* Monastic Greeting & Calibrated Mindset */}
      <section className="space-y-1">
        <div className="flex items-center justify-between">
          <p className="text-[13px] text-on-surface-variant font-normal">
            Good afternoon, {userPrefs.name}.
          </p>
          {/* Status Pill */}
          <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-surface-container-high text-on-secondary-container">
            <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
            <span className="text-[11px] font-semibold tracking-wider">{onTrackSummary}</span>
          </div>
        </div>
        <h1 className="text-[28px] font-semibold tracking-tight text-on-surface leading-tight">
          Wednesday, 23 September
        </h1>
      </section>

      {/* DAILY PROGRESS VISUALIZATION (Ring & Bar for Today's Tasks) */}
      <section
        onClick={onNavigateToTasks}
        title="Click to view and manage Today's tasks"
        className="bg-surface-container-lowest rounded-xl p-4 border border-surface-container-highest transition-colors duration-150 shadow-[0_2px_8px_-3px_rgba(0,0,0,0.02)] cursor-pointer hover:border-outline-variant/60"
      >
        <div className="flex items-center justify-between gap-3.5">
          {/* Progress Ring */}
          <div className="relative w-12 h-12 shrink-0 flex items-center justify-center">
            <svg className="w-12 h-12 -rotate-90 transform" viewBox="0 0 44 44">
              {/* Background ring track */}
              <circle
                cx="22"
                cy="22"
                r={ringRadius}
                stroke="currentColor"
                strokeWidth="3"
                className="text-surface-container-highest"
                fill="transparent"
              />
              {/* Filled progress ring */}
              <circle
                cx="22"
                cy="22"
                r={ringRadius}
                stroke="currentColor"
                strokeWidth="3.2"
                className="text-secondary transition-all duration-500 ease-out"
                strokeDasharray={ringCircumference}
                strokeDashoffset={ringDashOffset}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>
            {/* Center percentage or check icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              {taskProgressPercent === 100 ? (
                <span className="material-symbols-outlined text-[16px] text-secondary font-bold">
                  check
                </span>
              ) : (
                <span className="text-[11px] font-semibold tracking-tight text-on-surface">
                  {taskProgressPercent}%
                </span>
              )}
            </div>
          </div>

          {/* Progress Details & Bar */}
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant block">
                  Today's Completion
                </span>
                <p className="text-[13px] font-medium text-on-surface leading-tight">
                  {completedTodayTasks} of {totalTodayTasks} tasks finished
                </p>
              </div>
              <div className="flex items-center space-x-1.5">
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                    taskProgressPercent === 100
                      ? 'bg-secondary-container text-on-secondary-container'
                      : 'bg-surface-container text-on-surface-variant'
                  }`}
                >
                  {taskProgressPercent === 100
                    ? 'All Done'
                    : taskProgressPercent > 0
                    ? `${taskProgressPercent}% Done`
                    : 'Starting'}
                </span>
                <span className="material-symbols-outlined text-[16px] text-outline-variant">
                  chevron_right
                </span>
              </div>
            </div>

            {/* Hairline Progress Bar */}
            <div className="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
              <div
                className="h-full bg-secondary rounded-full transition-all duration-500 ease-out"
                style={{ width: `${taskProgressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* HERO BENTO: NEXT UP (Active Sprint Spotlight) */}
      <section className="relative bg-surface-container-lowest rounded-xl p-5 border border-surface-container-highest transition-colors duration-150 shadow-[0_2px_8px_-3px_rgba(0,0,0,0.03)]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-[11px] tracking-wider uppercase text-on-surface-variant font-semibold">
              NEXT UP
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#ffb68e]"></span>
          </div>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-medium">
            {nextUpTask?.category || 'Deep Work'}
          </span>
        </div>

        <h2 className="text-[22px] font-medium text-on-surface mb-3 tracking-tight leading-snug">
          {nextUpTask?.title || 'Finish marketing research proposal'}
        </h2>

        {/* Contextual Metadata Hairline Row */}
        <div className="flex items-center space-x-4 pt-1 pb-5 text-on-surface-variant text-[13px] border-b border-surface-container-high">
          <div className="flex items-center space-x-1.5">
            <span className="material-symbols-outlined text-[16px] text-secondary">
              hourglass_empty
            </span>
            <span className="text-[15px] font-medium">
              {nextUpTask?.durationMin || 45} min focus
            </span>
          </div>
          <span className="text-outline-variant">•</span>
          <div className="flex items-center space-x-1.5">
            <span className="material-symbols-outlined text-[16px]">schedule</span>
            <span className="text-[15px] font-medium">
              Due {nextUpTask?.dueTime || '17:00'}
            </span>
          </div>
        </div>

        {/* Prominent Primary Focus CTA & AI Deconstruct */}
        <div className="pt-4 flex items-center space-x-2">
          <button
            type="button"
            onClick={() => nextUpTask && onStartFocus(nextUpTask)}
            className="flex-1 h-12 bg-primary text-on-primary hover:bg-[#222222] rounded-full text-[17px] font-medium flex items-center justify-center space-x-2 active:scale-[0.99] transition-all duration-150 cursor-pointer shadow-sm"
          >
            <span>Start Focus</span>
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>

          {onOpenAICoach && (
            <button
              type="button"
              onClick={onOpenAICoach}
              title="Ask AI Flow Coach to decompose this task into sprints"
              className="h-12 px-3.5 border border-surface-container-highest bg-surface-container-low/60 hover:bg-surface-container rounded-full text-[12px] font-semibold text-on-surface flex items-center space-x-1.5 transition-colors cursor-pointer shrink-0"
            >
              <span className="material-symbols-outlined text-[18px] text-secondary">psychology</span>
              <span className="hidden sm:inline">AI Sprint</span>
            </button>
          )}
        </div>
      </section>

      {/* Minimal Metrics Strip (Airy & Monastic) */}
      <section
        onClick={onNavigateToTasks}
        title="View all tasks"
        className="grid grid-cols-3 divide-x divide-surface-container-highest bg-surface-container-lowest rounded-xl py-3 px-1 border border-surface-container-highest cursor-pointer hover:border-outline-variant/50 transition-colors"
      >
        <div className="flex flex-col items-center justify-center py-1">
          <span className="text-[15px] font-semibold text-on-surface">{tasksLeft}</span>
          <span className="text-[11px] text-on-surface-variant tracking-normal font-semibold">
            tasks left
          </span>
        </div>
        <div className="flex flex-col items-center justify-center py-1">
          <span className="text-[15px] font-semibold text-on-surface">{importantTasks}</span>
          <span className="text-[11px] text-on-surface-variant tracking-normal font-semibold">
            important
          </span>
        </div>
        <div className="flex flex-col items-center justify-center py-1">
          <span className="text-[15px] font-semibold text-on-surface">{totalFocusMin}m</span>
          <span className="text-[11px] text-on-surface-variant tracking-normal font-semibold">
            total focus
          </span>
        </div>
      </section>

      {/* Upcoming Schedule (Asymmetric Minimal Timeline) */}
      <section className="space-y-4 pt-1">
        <div className="flex items-center justify-between">
          <h3 className="text-[18px] text-on-surface font-medium leading-none">Timeline</h3>
          <span className="text-[11px] font-semibold tracking-wider text-on-surface-variant">
            {timeline.length} events scheduled
          </span>
        </div>

        <div className="space-y-2.5">
          {timeline.map((event) => {
            if (event.status === 'done') {
              return (
                <div
                  key={event.id}
                  onClick={() => onToggleTimelineEvent(event.id)}
                  className="group flex items-start space-x-3.5 p-3.5 rounded-xl bg-surface-container-lowest border border-surface-container-highest cursor-pointer hover:border-outline-variant/60 transition-colors"
                >
                  <span className="text-[15px] font-medium text-outline pt-0.5 w-12 shrink-0">
                    {event.time}
                  </span>
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <span className="w-4 h-4 rounded-full bg-secondary flex items-center justify-center text-on-secondary shrink-0">
                      <span className="material-symbols-outlined text-[12px] font-bold">check</span>
                    </span>
                    <span className="text-[14px] line-through text-outline truncate">
                      {event.title}
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-outline shrink-0">Done</span>
                </div>
              );
            }

            if (event.status === 'active') {
              return (
                <div
                  key={event.id}
                  onClick={() => onToggleTimelineEvent(event.id)}
                  className="group flex items-start space-x-3.5 p-3.5 rounded-xl bg-[#F4F7F5] border border-secondary cursor-pointer shadow-[0_1px_3px_rgba(58,103,79,0.08)] transition-all"
                >
                  <span className="text-[15px] font-medium text-secondary pt-0.5 w-12 shrink-0">
                    {event.time}
                  </span>
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <span className="w-4 h-4 rounded-full border-[1.5px] border-secondary flex items-center justify-center shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                    </span>
                    <div className="min-w-0">
                      <p className="text-[14px] font-medium text-on-surface truncate">
                        {event.title}
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-secondary shrink-0">Active</span>
                </div>
              );
            }

            // upcoming
            return (
              <div
                key={event.id}
                onClick={() => onToggleTimelineEvent(event.id)}
                className="group flex items-start space-x-3.5 p-3.5 rounded-xl bg-surface-container-lowest border border-surface-container-highest cursor-pointer hover:border-outline-variant/60 transition-colors"
              >
                <span className="text-[15px] font-medium text-on-surface-variant pt-0.5 w-12 shrink-0">
                  {event.time}
                </span>
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <span className="w-4 h-4 rounded-full border-[1.5px] border-outline-variant shrink-0 group-hover:border-secondary transition-colors"></span>
                  <span className="text-[14px] text-on-surface truncate">{event.title}</span>
                </div>
                <span className="text-[11px] font-semibold text-on-surface-variant shrink-0">
                  {event.durationText || 'Upcoming'}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* AI Coach Whisper (Monastic Insight Bar) */}
      {userPrefs.showSilentNotice && (
        <section className="p-4 rounded-xl bg-surface-container border border-surface-container-highest flex items-start justify-between space-x-3">
          <div className="flex items-start space-x-3">
            <span className="material-symbols-outlined text-secondary text-[20px] pt-0.5 shrink-0">
              lightbulb
            </span>
            <div className="space-y-0.5">
              <p className="text-[13px] text-on-surface font-medium">Silent Period Ahead</p>
              <p className="text-[13px] text-on-surface-variant leading-relaxed">
                No notifications between {userPrefs.silentPeriodStart} and {userPrefs.silentPeriodEnd}{' '}
                to preserve deep state flow.
              </p>
            </div>
          </div>

          {onOpenAICoach && (
            <button
              type="button"
              onClick={onOpenAICoach}
              className="shrink-0 px-3 py-1.5 rounded-full bg-surface-container-lowest hover:bg-white border border-surface-container-highest text-[11px] font-semibold text-secondary flex items-center space-x-1 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[14px]">psychology</span>
              <span>Ask AI</span>
            </button>
          )}
        </section>
      )}
    </div>
  );
};
