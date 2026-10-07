import React, { useState } from 'react';
import { Priority, Task, Timeframe } from '../types';

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
}

export const QuickAddModal: React.FC<QuickAddModalProps> = ({
  isOpen,
  onClose,
  onAddTask,
}) => {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<Priority>('Medium');
  const [durationMin, setDurationMin] = useState<number>(25);
  const [timeframe, setTimeframe] = useState<Timeframe>('today');
  const [category, setCategory] = useState('Strategy');
  const [dueTime, setDueTime] = useState('17:00');
  const [scheduledDateText, setScheduledDateText] = useState('Tomorrow, 10:00');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onAddTask({
      title: title.trim(),
      priority,
      durationMin,
      timeframe,
      category: category.trim() || 'Work',
      completed: false,
      dueTime: timeframe === 'today' ? dueTime : undefined,
      scheduledDateText: timeframe === 'upcoming' ? scheduledDateText : undefined,
    });

    setTitle('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/35 backdrop-blur-[2px] transition-all">
      <div
        className="w-full max-w-md bg-surface-container-lowest border border-surface-container-highest rounded-t-2xl sm:rounded-2xl p-5 shadow-2xl space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-2 border-b border-surface-container-high">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-secondary"></span>
            <h3 className="text-[16px] font-semibold text-on-surface">New Task or Focus Block</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-on-surface-variant hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant mb-1">
              Task Title
            </label>
            <input
              type="text"
              required
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Draft design system token guidelines"
              className="w-full px-3.5 py-2.5 rounded-xl border border-surface-container-highest bg-surface-container-low/40 focus:bg-white text-[14px] text-on-surface placeholder:text-outline-variant outline-none focus:border-on-surface transition-all"
            />
          </div>

          {/* Timeframe & Priority row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant mb-1">
                When
              </label>
              <div className="flex rounded-xl bg-surface-container-low p-1 border border-surface-container-highest">
                <button
                  type="button"
                  onClick={() => setTimeframe('today')}
                  className={`flex-1 py-1 rounded-lg text-[12px] font-semibold transition-all ${
                    timeframe === 'today'
                      ? 'bg-surface-container-lowest text-on-surface shadow-xs'
                      : 'text-on-surface-variant'
                  }`}
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => setTimeframe('upcoming')}
                  className={`flex-1 py-1 rounded-lg text-[12px] font-semibold transition-all ${
                    timeframe === 'upcoming'
                      ? 'bg-surface-container-lowest text-on-surface shadow-xs'
                      : 'text-on-surface-variant'
                  }`}
                >
                  Upcoming
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full px-3 py-2 rounded-xl border border-surface-container-highest bg-surface-container-low/40 text-[13px] text-on-surface outline-none"
              >
                <option value="High">High Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="Low">Low Priority</option>
              </select>
            </div>
          </div>

          {/* Duration & Category */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant mb-1">
                Focus Duration
              </label>
              <div className="flex items-center space-x-1.5">
                {[15, 25, 45].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDurationMin(d)}
                    className={`flex-1 py-1.5 rounded-lg text-[12px] font-semibold transition-all ${
                      durationMin === d
                        ? 'bg-primary text-white'
                        : 'bg-surface-container-low text-on-surface border border-surface-container-highest'
                    }`}
                  >
                    {d}m
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant mb-1">
                Category
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Strategy / Work / Client"
                className="w-full px-3 py-2 rounded-xl border border-surface-container-highest bg-surface-container-low/40 text-[13px] text-on-surface outline-none focus:border-on-surface"
              />
            </div>
          </div>

          {timeframe === 'upcoming' ? (
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant mb-1">
                Schedule Date Label
              </label>
              <input
                type="text"
                value={scheduledDateText}
                onChange={(e) => setScheduledDateText(e.target.value)}
                placeholder="e.g. Tomorrow, 10:00 or Thursday"
                className="w-full px-3 py-2 rounded-xl border border-surface-container-highest bg-surface-container-low/40 text-[13px] text-on-surface outline-none"
              />
            </div>
          ) : (
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant mb-1">
                Due Time
              </label>
              <input
                type="text"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                placeholder="e.g. 17:00"
                className="w-full px-3 py-2 rounded-xl border border-surface-container-highest bg-surface-container-low/40 text-[13px] text-on-surface outline-none"
              />
            </div>
          )}

          <div className="pt-2 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full text-[13px] font-medium text-on-surface-variant hover:bg-surface-container transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-full bg-primary text-on-primary hover:bg-[#222222] text-[13px] font-medium transition-transform active:scale-95"
            >
              Add Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
