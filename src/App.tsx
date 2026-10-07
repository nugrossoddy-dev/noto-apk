import React, { useState, useEffect } from 'react';
import { Task, TimelineEvent, TabType, UserPreferences } from './types';
import { INITIAL_TASKS, INITIAL_TIMELINE, INITIAL_USER_PREFS } from './data/initialData';
import { TopAppBar } from './components/TopAppBar';
import { TodayScreen } from './components/TodayScreen';
import { TasksScreen } from './components/TasksScreen';
import { FocusScreen } from './components/FocusScreen';
import { NotesScreen } from './components/NotesScreen';
import { BottomNav } from './components/BottomNav';
import { QuickAddModal } from './components/QuickAddModal';
import { TuneModal } from './components/TuneModal';
import { AICoachModal } from './components/AICoachModal';
import { AILiveVoiceModal } from './components/AILiveVoiceModal';
import { NotoProModal } from './components/NotoProModal';
import { PremiumScreen } from './components/PremiumScreen';
import { playChime } from './utils/audio';

export default function App() {
  // Persistence via localStorage with graceful fallback
  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const saved = localStorage.getItem('noto_tasks');
      return saved ? JSON.parse(saved) : INITIAL_TASKS;
    } catch {
      return INITIAL_TASKS;
    }
  });

  const [timeline, setTimeline] = useState<TimelineEvent[]>(() => {
    try {
      const saved = localStorage.getItem('noto_timeline');
      return saved ? JSON.parse(saved) : INITIAL_TIMELINE;
    } catch {
      return INITIAL_TIMELINE;
    }
  });

  const [userPrefs, setUserPrefs] = useState<UserPreferences>(() => {
    try {
      const saved = localStorage.getItem('noto_prefs');
      return saved ? JSON.parse(saved) : INITIAL_USER_PREFS;
    } catch {
      return INITIAL_USER_PREFS;
    }
  });

  const [activeTab, setActiveTab] = useState<TabType>('today');
  const [taskFilter, setTaskFilter] = useState<'all' | 'today' | 'upcoming'>('all');
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isTuneOpen, setIsTuneOpen] = useState(false);
  const [isAICoachOpen, setIsAICoachOpen] = useState(false);
  const [isAILiveVoiceOpen, setIsAILiveVoiceOpen] = useState(false);
  const [isProModalOpen, setIsProModalOpen] = useState(false);
  const [layoutMode, setLayoutMode] = useState<'mobile' | 'split'>('mobile');
  const [focusTask, setFocusTask] = useState<Task | null>(() => {
    return tasks.find((t) => t.id === 'task-1') || tasks[0] || null;
  });

  const handleOpenAICoach = () => {
    setIsAICoachOpen(true);
  };

  const handleOpenLiveVoice = () => {
    setIsAILiveVoiceOpen(true);
  };

  const handleOpenProModal = () => {
    setActiveTab('premium');
  };

  const handleUpgradePro = (plan: 'monthly' | 'semi-annual' | 'annual') => {
    setUserPrefs((prev) => ({
      ...prev,
      isPro: true,
      proPlan: plan,
    }));
  };

  // Persist state updates
  useEffect(() => {
    try {
      localStorage.setItem('noto_tasks', JSON.stringify(tasks));
    } catch {
      // ignore
    }
  }, [tasks]);

  useEffect(() => {
    try {
      localStorage.setItem('noto_timeline', JSON.stringify(timeline));
    } catch {
      // ignore
    }
  }, [timeline]);

  useEffect(() => {
    try {
      localStorage.setItem('noto_prefs', JSON.stringify(userPrefs));
    } catch {
      // ignore
    }
  }, [userPrefs]);

  // Toggle task completion
  const handleToggleTask = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const willComplete = !t.completed;
          if (willComplete && userPrefs.soundEnabled) {
            playChime(660, 1.0);
          }
          return { ...t, completed: willComplete };
        }
        return t;
      })
    );

    // Sync corresponding timeline event if any
    setTimeline((prev) =>
      prev.map((event) => {
        if (event.taskId === taskId) {
          return {
            ...event,
            status: event.status === 'done' ? 'active' : 'done',
          };
        }
        return event;
      })
    );
  };

  // Toggle timeline event
  const handleToggleTimelineEvent = (eventId: string) => {
    setTimeline((prev) =>
      prev.map((event) => {
        if (event.id === eventId) {
          const nextStatus: TimelineEvent['status'] =
            event.status === 'done' ? 'active' : event.status === 'active' ? 'upcoming' : 'done';
          return { ...event, status: nextStatus };
        }
        return event;
      })
    );
  };

  // Start focus on a specific task
  const handleStartFocus = (task: Task) => {
    setFocusTask(task);
    setActiveTab('focus');
  };

  // Complete task from focus session
  const handleCompleteTaskFromFocus = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, completed: true } : t))
    );
    setTimeline((prev) =>
      prev.map((e) => (e.taskId === taskId ? { ...e, status: 'done' } : e))
    );
  };

  // Add task
  const handleAddTask = (newTaskData: Omit<Task, 'id' | 'createdAt'>) => {
    const newTask: Task = {
      ...newTaskData,
      id: `task-${Date.now()}`,
      createdAt: Date.now(),
    };
    setTasks((prev) => [newTask, ...prev]);

    // If added for today, optionally add to timeline if time provided
    if (newTask.timeframe === 'today' && newTask.dueTime) {
      setTimeline((prev) => [
        ...prev,
        {
          id: `tl-${Date.now()}`,
          time: newTask.dueTime || '15:00',
          title: newTask.title,
          status: 'upcoming',
          taskId: newTask.id,
          durationText: `${newTask.durationMin}m`,
        },
      ]);
    }
  };

  // Reset to initial showcase data
  const handleResetData = () => {
    setTasks(INITIAL_TASKS);
    setTimeline(INITIAL_TIMELINE);
    setUserPrefs(INITIAL_USER_PREFS);
    setFocusTask(INITIAL_TASKS[0]);
    localStorage.removeItem('noto_tasks');
    localStorage.removeItem('noto_timeline');
    localStorage.removeItem('noto_prefs');
    localStorage.removeItem('noto_daily_notes');
  };

  const todayTasksCount = tasks.filter((t) => t.timeframe === 'today').length;
  const upcomingTasksCount = tasks.filter((t) => t.timeframe === 'upcoming').length;

  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col justify-start items-center selection:bg-surface-container selection:text-on-surface">
      {/* Top Subtle Desktop Mode Bar for quick preview switching */}
      <div className="hidden lg:flex w-full items-center justify-between px-8 py-2 bg-surface-container border-b border-surface-container-highest text-[12px] text-on-surface-variant">
        <div className="flex items-center space-x-2 font-medium">
          <span className="w-2 h-2 rounded-full bg-secondary"></span>
          <span>NOTO — Warm Editorial Minimalism</span>
        </div>
        <div className="flex items-center space-x-3">
          <span className="text-[11px] uppercase tracking-wider text-outline font-semibold">View Mode:</span>
          <div className="inline-flex rounded-lg bg-surface-container-high p-0.5 border border-surface-container-highest">
            <button
              type="button"
              onClick={() => setLayoutMode('mobile')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                layoutMode === 'mobile'
                  ? 'bg-surface-container-lowest text-on-surface shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Device View (Screenshot 1:1)
            </button>
            <button
              type="button"
              onClick={() => setLayoutMode('split')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                layoutMode === 'split'
                  ? 'bg-surface-container-lowest text-on-surface shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Split Editorial (Dual Column)
            </button>
          </div>
        </div>
      </div>

      {layoutMode === 'split' ? (
        /* Dual Column Editorial Desktop Spread */
        <div className="w-full max-w-6xl px-8 py-8 flex-1 grid grid-cols-12 gap-8">
          {/* Column 1: Today Screen */}
          <div className="col-span-6 bg-surface-container-lowest border border-surface-container-highest rounded-2xl p-6 shadow-sm">
            <TopAppBar
              activeTab="today"
              avatarUrl={userPrefs.avatarUrl}
              userName={userPrefs.name}
              onOpenTune={() => setIsTuneOpen(true)}
              onOpenAICoach={handleOpenAICoach}
              onOpenLiveVoice={handleOpenLiveVoice}
              onOpenProModal={handleOpenProModal}
              isPro={userPrefs.isPro}
            />
            <div className="pt-3">
              <TodayScreen
                tasks={tasks}
                timeline={timeline}
                userPrefs={userPrefs}
                onStartFocus={handleStartFocus}
                onToggleTimelineEvent={handleToggleTimelineEvent}
                onNavigateToTasks={() => setActiveTab('tasks')}
                onOpenAICoach={handleOpenAICoach}
                onOpenLiveVoice={handleOpenLiveVoice}
              />
            </div>
          </div>

          {/* Column 2: Tasks Screen / Focus Screen / Notes */}
          <div className="col-span-6 bg-surface-container-lowest border border-surface-container-highest rounded-2xl p-6 shadow-sm flex flex-col">
            {activeTab === 'focus' ? (
              <FocusScreen
                activeTask={focusTask}
                onCompleteTask={handleCompleteTaskFromFocus}
                onBackToToday={() => setActiveTab('today')}
              />
            ) : activeTab === 'notes' ? (
              <NotesScreen />
            ) : activeTab === 'premium' ? (
              <PremiumScreen
                userPrefs={userPrefs}
                onUpdatePrefs={setUserPrefs}
                onNavigateToTab={(tab) => setActiveTab(tab)}
              />
            ) : (
              <>
                <TopAppBar
                  activeTab="tasks"
                  avatarUrl={userPrefs.avatarUrl}
                  userName={userPrefs.name}
                  onOpenTune={() => setIsTuneOpen(true)}
                  onOpenAICoach={handleOpenAICoach}
                  onOpenLiveVoice={handleOpenLiveVoice}
                  onOpenProModal={handleOpenProModal}
                  isPro={userPrefs.isPro}
                  taskFilter={taskFilter}
                  onTaskFilterChange={setTaskFilter}
                  todayCount={todayTasksCount}
                  upcomingCount={upcomingTasksCount}
                />
                <div className="pt-3 flex-1">
                  <TasksScreen
                    tasks={tasks}
                    filter={taskFilter}
                    onToggleTask={handleToggleTask}
                    onSelectTaskForFocus={handleStartFocus}
                    onOpenAICoach={handleOpenAICoach}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        /* Mobile Device Container Viewport (Exact 1:1 match to screenshot) */
        <div className="w-full max-w-md min-h-screen flex flex-col bg-surface relative pb-24 shadow-sm border-x border-surface-container-highest/60">
          {/* Shared Header */}
          <TopAppBar
            activeTab={activeTab}
            avatarUrl={userPrefs.avatarUrl}
            userName={userPrefs.name}
            onOpenTune={() => setIsTuneOpen(true)}
            onOpenAICoach={handleOpenAICoach}
            onOpenLiveVoice={handleOpenLiveVoice}
            onOpenProModal={handleOpenProModal}
            isPro={userPrefs.isPro}
            taskFilter={taskFilter}
            onTaskFilterChange={setTaskFilter}
            todayCount={todayTasksCount}
            upcomingCount={upcomingTasksCount}
          />

          {/* Main Content Area */}
          <main className="flex-1 px-5 pt-3 pb-8">
            {activeTab === 'today' && (
              <TodayScreen
                tasks={tasks}
                timeline={timeline}
                userPrefs={userPrefs}
                onStartFocus={handleStartFocus}
                onToggleTimelineEvent={handleToggleTimelineEvent}
                onNavigateToTasks={() => setActiveTab('tasks')}
                onOpenAICoach={handleOpenAICoach}
                onOpenLiveVoice={handleOpenLiveVoice}
              />
            )}

            {activeTab === 'tasks' && (
              <TasksScreen
                tasks={tasks}
                filter={taskFilter}
                onToggleTask={handleToggleTask}
                onSelectTaskForFocus={handleStartFocus}
                onOpenAICoach={handleOpenAICoach}
              />
            )}

            {activeTab === 'focus' && (
              <FocusScreen
                activeTask={focusTask}
                onCompleteTask={handleCompleteTaskFromFocus}
                onBackToToday={() => setActiveTab('today')}
              />
            )}

            {activeTab === 'notes' && <NotesScreen />}

            {activeTab === 'premium' && (
              <PremiumScreen
                userPrefs={userPrefs}
                onUpdatePrefs={setUserPrefs}
                onNavigateToTab={(tab) => setActiveTab(tab)}
              />
            )}
          </main>

          {/* Floating Action Button for Contextual Quick Add */}
          {activeTab !== 'focus' && activeTab !== 'premium' && (
            <button
              type="button"
              onClick={() => setIsQuickAddOpen(true)}
              aria-label="Add task or focus block"
              className="fixed bottom-20 right-[max(1.5rem,calc(50%-13rem+1.5rem))] z-40 w-12 h-12 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-lg active:scale-95 transition-transform duration-150 hover:bg-[#222222] cursor-pointer"
            >
              <span className="material-symbols-outlined text-[24px]">add</span>
            </button>
          )}

          {/* Bottom Navigation Bar */}
          <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
      )}

      {/* Quick Add Modal */}
      <QuickAddModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        onAddTask={handleAddTask}
      />

      {/* Tune / Settings Modal */}
      <TuneModal
        isOpen={isTuneOpen}
        onClose={() => setIsTuneOpen(false)}
        userPrefs={userPrefs}
        onUpdatePrefs={setUserPrefs}
        onResetData={handleResetData}
        layoutMode={layoutMode}
        onChangeLayoutMode={setLayoutMode}
        onOpenProModal={handleOpenProModal}
      />

      {/* AI Flow Coach Multi-turn Chat & Search Grounding Modal */}
      <AICoachModal
        isOpen={isAICoachOpen}
        onClose={() => setIsAICoachOpen(false)}
        onOpenLiveVoice={() => setIsAILiveVoiceOpen(true)}
        onOpenProModal={handleOpenProModal}
        isPro={userPrefs.isPro}
        tasks={tasks}
        timeline={timeline}
      />

      {/* Gemini 3.8 Live API Voice Conversation Modal */}
      <AILiveVoiceModal
        isOpen={isAILiveVoiceOpen}
        onClose={() => setIsAILiveVoiceOpen(false)}
        userContextSummary={tasks.map((t) => t.title).join(', ')}
        onSwitchToTextChat={() => {
          setIsAILiveVoiceOpen(false);
          setIsAICoachOpen(true);
        }}
      />

      {/* NOTO Pro Paywall / Upgrade Modal */}
      <NotoProModal
        isOpen={isProModalOpen}
        onClose={() => setIsProModalOpen(false)}
        isPro={userPrefs.isPro}
        currentPlan={userPrefs.proPlan || 'semi-annual'}
        onUpgrade={handleUpgradePro}
        onNavigateToCheckout={(plan) => {
          setUserPrefs((prev) => ({
            ...prev,
            proPlan: plan,
          }));
          setIsProModalOpen(false);
          setActiveTab('premium');
        }}
      />
    </div>
  );
}
