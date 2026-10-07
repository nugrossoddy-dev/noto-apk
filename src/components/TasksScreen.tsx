import React from 'react';
import { Task } from '../types';
import { WeeklyTaskSummary } from './WeeklyTaskSummary';

interface TasksScreenProps {
  tasks: Task[];
  filter: 'all' | 'today' | 'upcoming';
  onToggleTask: (taskId: string) => void;
  onSelectTaskForFocus?: (task: Task) => void;
  onDeleteTask?: (taskId: string) => void;
  onOpenAICoach?: (initialPrompt?: string) => void;
}

export const TasksScreen: React.FC<TasksScreenProps> = ({
  tasks,
  filter,
  onToggleTask,
  onSelectTaskForFocus,
  onOpenAICoach,
}) => {
  const todayTasks = tasks.filter((t) => t.timeframe === 'today');
  const upcomingTasks = tasks.filter((t) => t.timeframe === 'upcoming');

  const showToday = filter === 'all' || filter === 'today';
  const showUpcoming = filter === 'all' || filter === 'upcoming';

  const renderPriorityBadge = (priority: Task['priority']) => {
    if (priority === 'High') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#cf6721]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#cf6721]"></span>
          High
        </span>
      );
    }
    if (priority === 'Medium') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#406e54]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#3a674f]"></span>
          Medium
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-outline">
        <span className="w-1.5 h-1.5 rounded-full bg-outline"></span>
        Low
      </span>
    );
  };

  const renderTaskItem = (task: Task) => {
    return (
      <article
        key={task.id}
        className="group py-3.5 flex items-start gap-3.5 transition-colors duration-150 hover:bg-surface-container-low/40 px-1 rounded-lg"
      >
        {/* Circular Checkbox (18px diameter) */}
        <button
          type="button"
          aria-label={`Mark task ${task.title} as ${task.completed ? 'incomplete' : 'complete'}`}
          onClick={() => onToggleTask(task.id)}
          className={`mt-0.5 w-[18px] h-[18px] rounded-full border-[1.5px] flex items-center justify-center shrink-0 transition-all duration-150 cursor-pointer ${
            task.completed
              ? 'bg-secondary border-secondary text-on-secondary'
              : 'border-outline-variant hover:border-secondary bg-transparent'
          }`}
        >
          {task.completed && (
            <span className="material-symbols-outlined text-[13px] font-bold text-white">
              check
            </span>
          )}
        </button>

        {/* Task Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-2">
            <p
              onClick={() => onToggleTask(task.id)}
              className={`text-[14px] leading-tight cursor-pointer transition-all select-none ${
                task.completed ? 'task-strikethrough text-outline' : 'text-on-surface font-normal'
              }`}
            >
              {task.title}
            </p>

            <div className="flex items-center space-x-1 shrink-0">
              {onOpenAICoach && !task.completed && (
                <button
                  type="button"
                  onClick={() =>
                    onOpenAICoach(
                      `Break down "${task.title}" (${task.durationMin} min, ${task.priority} priority) into 3 bite-sized steps.`
                    )
                  }
                  title="Ask AI Coach to deconstruct task"
                  className="opacity-0 group-hover:opacity-100 p-1 text-on-surface-variant hover:text-secondary transition-opacity"
                >
                  <span className="material-symbols-outlined text-[16px]">psychology</span>
                </button>
              )}
              {onSelectTaskForFocus && !task.completed && (
                <button
                  type="button"
                  onClick={() => onSelectTaskForFocus(task)}
                  title="Focus on this task"
                  className="opacity-0 group-hover:opacity-100 p-1 text-on-surface-variant hover:text-secondary transition-opacity"
                >
                  <span className="material-symbols-outlined text-[16px]">play_circle</span>
                </button>
              )}
            </div>
          </div>

          <div className="mt-1.5 flex items-center gap-2 flex-wrap">
            {/* Priority Micro-Pip */}
            {renderPriorityBadge(task.priority)}

            <span className="text-outline text-[11px]">·</span>

            {/* Duration Pill */}
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-on-surface-variant">
              <span className="material-symbols-outlined text-[13px]">schedule</span>
              {task.durationMin} min
            </span>

            {/* Scheduled Date for Upcoming */}
            {task.scheduledDateText && (
              <>
                <span className="text-outline text-[11px]">·</span>
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-on-surface-variant">
                  {task.scheduledDateText}
                </span>
              </>
            )}

            <span className="text-outline text-[11px]">·</span>

            {/* Category Tag */}
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-surface-container text-[11px] font-medium text-on-surface">
              {task.category}
            </span>
          </div>
        </div>
      </article>
    );
  };

  return (
    <div className="w-full flex flex-col pt-1 pb-6">
      {/* Subtle Motivational Insight Banner (Japanese spatial discipline) */}
      <div className="mb-6 p-4 rounded-xl border border-surface-container-highest bg-surface-container-low/60 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="material-symbols-outlined text-secondary text-[20px]">lightbulb</span>
          <p className="text-[13px] text-on-surface-variant font-normal leading-relaxed">
            Focus on 1 priority before midday to protect deep momentum.
          </p>
        </div>
        {onOpenAICoach && (
          <button
            type="button"
            onClick={() => onOpenAICoach('How can I optimize my priorities before midday?')}
            className="shrink-0 ml-3 px-2.5 py-1 rounded-full bg-surface-container-lowest hover:bg-white border border-surface-container-highest text-[11px] font-semibold text-secondary flex items-center space-x-1 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[14px]">psychology</span>
            <span>Ask Coach</span>
          </button>
        )}
      </div>

      {/* Weekly Summary & Completion Trends Visualization (Recharts) */}
      <WeeklyTaskSummary tasks={tasks} />

      {/* SECTION: Today */}
      {showToday && (
        <section className="mb-8">
          <div className="flex items-center justify-between pb-2 mb-1 border-b border-surface-container-highest/60">
            <h2 className="text-[13px] font-semibold tracking-wider text-on-surface-variant uppercase">
              Today
            </h2>
            <span className="text-[11px] font-medium text-outline">
              {todayTasks.length} {todayTasks.length === 1 ? 'item' : 'items'}
            </span>
          </div>
          <div className="divide-y divide-surface-container-highest">
            {todayTasks.length > 0 ? (
              todayTasks.map((t) => renderTaskItem(t))
            ) : (
              <p className="text-[13px] text-outline py-4 text-center">No tasks for today.</p>
            )}
          </div>
        </section>
      )}

      {/* SECTION: Upcoming */}
      {showUpcoming && (
        <section className="mb-10">
          <div className="flex items-center justify-between pb-2 mb-1 border-b border-surface-container-highest/60">
            <h2 className="text-[13px] font-semibold tracking-wider text-on-surface-variant uppercase">
              Upcoming
            </h2>
            <span className="text-[11px] font-medium text-outline">
              {upcomingTasks.length} {upcomingTasks.length === 1 ? 'item' : 'items'}
            </span>
          </div>
          <div className="divide-y divide-surface-container-highest">
            {upcomingTasks.length > 0 ? (
              upcomingTasks.map((t) => renderTaskItem(t))
            ) : (
              <p className="text-[13px] text-outline py-4 text-center">No upcoming tasks.</p>
            )}
          </div>
        </section>
      )}
    </div>
  );
};
