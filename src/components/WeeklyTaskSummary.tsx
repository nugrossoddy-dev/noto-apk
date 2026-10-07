import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import { Task } from '../types';

interface WeeklyTaskSummaryProps {
  tasks: Task[];
}

interface DayData {
  day: string;
  fullDate: string;
  completed: number;
  total: number;
  focusMinutes: number;
  isToday?: boolean;
}

export const WeeklyTaskSummary: React.FC<WeeklyTaskSummaryProps> = ({ tasks }) => {
  const [metricView, setMetricView] = useState<'tasks' | 'focus'>('tasks');
  const [isExpanded, setIsExpanded] = useState(true);

  // Compute today's dynamic stats from real tasks state
  const todayTasks = tasks.filter((t) => t.timeframe === 'today');
  const todayCompleted = todayTasks.filter((t) => t.completed).length;
  const todayTotal = todayTasks.length;
  const todayFocusMinutes = todayTasks.reduce(
    (acc, t) => (t.completed ? acc + t.durationMin : acc),
    0
  );

  // 7-day historical dataset culminating in Today (Wednesday)
  const weeklyData: DayData[] = [
    { day: 'Thu', fullDate: '17 Sep', completed: 4, total: 5, focusMinutes: 135 },
    { day: 'Fri', fullDate: '18 Sep', completed: 3, total: 4, focusMinutes: 90 },
    { day: 'Sat', fullDate: '19 Sep', completed: 2, total: 2, focusMinutes: 60 },
    { day: 'Sun', fullDate: '20 Sep', completed: 1, total: 1, focusMinutes: 30 },
    { day: 'Mon', fullDate: '21 Sep', completed: 5, total: 5, focusMinutes: 160 },
    { day: 'Tue', fullDate: '22 Sep', completed: 4, total: 4, focusMinutes: 120 },
    {
      day: 'Wed',
      fullDate: '23 Sep (Today)',
      completed: todayCompleted,
      total: Math.max(todayTotal, 3),
      focusMinutes: todayFocusMinutes > 0 ? todayFocusMinutes : todayCompleted * 35,
      isToday: true,
    },
  ];

  // Totals & metrics
  const totalCompletedWeek = weeklyData.reduce((acc, d) => acc + d.completed, 0);
  const totalPlannedWeek = weeklyData.reduce((acc, d) => acc + d.total, 0);
  const totalFocusMinutesWeek = weeklyData.reduce((acc, d) => acc + d.focusMinutes, 0);
  const completionRateWeek =
    totalPlannedWeek > 0 ? Math.round((totalCompletedWeek / totalPlannedWeek) * 100) : 0;
  const dailyAverage = (totalCompletedWeek / 7).toFixed(1);

  // Custom minimal tooltip adhering to Warm Editorial Minimalism
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data: DayData = payload[0].payload;
      return (
        <div className="bg-surface-container-lowest border border-surface-container-highest rounded-xl p-2.5 shadow-lg text-left space-y-1">
          <p className="text-[11px] font-semibold text-on-surface uppercase tracking-wider">
            {data.fullDate}
          </p>
          <div className="flex items-center space-x-2 text-[12px]">
            <span className="w-2 h-2 rounded-full bg-secondary"></span>
            <span className="font-medium text-on-surface">
              {data.completed} of {data.total} tasks
            </span>
          </div>
          <p className="text-[11px] text-on-surface-variant">
            {data.focusMinutes} min deep work
          </p>
          {data.isToday && (
            <span className="inline-block mt-0.5 text-[10px] font-semibold text-secondary uppercase tracking-wider">
              • Today's Live Sync
            </span>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <section className="mb-8 bg-surface-container-lowest border border-surface-container-highest rounded-2xl p-4 shadow-[0_2px_8px_-3px_rgba(0,0,0,0.02)] transition-all">
      {/* Section Header */}
      <div className="flex items-center justify-between pb-3 border-b border-surface-container-high/60">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
            <h2 className="text-[14px] font-semibold tracking-tight text-on-surface">
              7-Day Completion Velocity
            </h2>
          </div>
          <p className="text-[11px] text-on-surface-variant font-medium">
            Past 7 days performance &amp; rhythm
          </p>
        </div>

        <div className="flex items-center space-x-1.5">
          {/* Metric Selector Pills */}
          <div className="inline-flex rounded-lg bg-surface-container-low p-0.5 border border-surface-container-highest">
            <button
              type="button"
              onClick={() => setMetricView('tasks')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                metricView === 'tasks'
                  ? 'bg-surface-container-lowest text-on-surface shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Tasks
            </button>
            <button
              type="button"
              onClick={() => setMetricView('focus')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                metricView === 'focus'
                  ? 'bg-surface-container-lowest text-on-surface shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Minutes
            </button>
          </div>

          {/* Expand/Collapse Toggle */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded-lg hover:bg-surface-container text-on-surface-variant transition-colors"
            title={isExpanded ? 'Collapse chart' : 'Expand chart'}
          >
            <span className="material-symbols-outlined text-[18px]">
              {isExpanded ? 'expand_less' : 'expand_more'}
            </span>
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="pt-3 space-y-4">
          {/* Top 3 Micro-Metrics Row */}
          <div className="grid grid-cols-3 divide-x divide-surface-container-highest bg-surface-container-low/50 rounded-xl py-2 px-1 border border-surface-container-highest">
            <div className="flex flex-col items-center justify-center">
              <span className="text-[14px] font-semibold text-on-surface tabular-nums">
                {totalCompletedWeek}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-on-surface-variant font-semibold">
                Completed
              </span>
            </div>
            <div className="flex flex-col items-center justify-center">
              <span className="text-[14px] font-semibold text-on-surface tabular-nums">
                {completionRateWeek}%
              </span>
              <span className="text-[10px] uppercase tracking-wider text-on-surface-variant font-semibold">
                Rate
              </span>
            </div>
            <div className="flex flex-col items-center justify-center">
              <span className="text-[14px] font-semibold text-on-surface tabular-nums">
                {metricView === 'tasks' ? `${dailyAverage}/d` : `${Math.round(totalFocusMinutesWeek / 60)}h`}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-on-surface-variant font-semibold">
                {metricView === 'tasks' ? 'Daily Avg' : 'Total Focus'}
              </span>
            </div>
          </div>

          {/* Recharts Chart Canvas */}
          <div className="w-full h-44 pt-1">
            <ResponsiveContainer width="100%" height="100%">
              {metricView === 'tasks' ? (
                <BarChart data={weeklyData} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 11, fill: '#444748', fontFamily: 'Plus Jakarta Sans' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 10, fill: '#747878', fontFamily: 'Plus Jakarta Sans' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f5f3ef' }} />
                  <Bar dataKey="completed" radius={[4, 4, 0, 0]} maxBarSize={32}>
                    {weeklyData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.isToday ? '#3a674f' : '#738c7b'}
                        className="transition-colors hover:opacity-90"
                      />
                    ))}
                  </Bar>
                </BarChart>
              ) : (
                <AreaChart data={weeklyData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="focusGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3a674f" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#3a674f" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 11, fill: '#444748', fontFamily: 'Plus Jakarta Sans' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#747878', fontFamily: 'Plus Jakarta Sans' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="focusMinutes"
                    stroke="#3a674f"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#focusGradient)"
                  />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>

          {/* Monastic Observation Footnote */}
          <div className="flex items-center justify-between text-[11px] text-on-surface-variant pt-1 px-1 border-t border-surface-container-high/40">
            <span className="flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
              <span>
                {todayCompleted >= 2
                  ? 'Strong weekly consistency maintained.'
                  : 'Complete 1 more task today to sustain 5-day streak.'}
              </span>
            </span>
            <span className="font-medium text-on-surface">Wed: {todayCompleted} done</span>
          </div>
        </div>
      )}
    </section>
  );
};
