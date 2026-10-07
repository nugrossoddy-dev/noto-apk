import { Task, TimelineEvent, UserPreferences } from '../types';

export const INITIAL_TASKS: Task[] = [
  {
    id: 'task-1',
    title: 'Finish marketing research proposal',
    priority: 'High',
    durationMin: 45,
    category: 'Strategy',
    timeframe: 'today',
    completed: false,
    dueTime: '17:00',
    createdAt: Date.now() - 1000 * 60 * 60 * 4,
  },
  {
    id: 'task-2',
    title: 'Prepare presentation outline',
    priority: 'Medium',
    durationMin: 25,
    category: 'Work',
    timeframe: 'today',
    completed: false,
    createdAt: Date.now() - 1000 * 60 * 60 * 3,
  },
  {
    id: 'task-3',
    title: 'Reply to client email',
    priority: 'Low',
    durationMin: 15,
    category: 'Client',
    timeframe: 'today',
    completed: false,
    createdAt: Date.now() - 1000 * 60 * 60 * 2,
  },
  {
    id: 'task-4',
    title: 'Review campaign analytics',
    priority: 'Medium',
    durationMin: 30,
    category: 'Work',
    timeframe: 'upcoming',
    scheduledDateText: 'Tomorrow, 10:00',
    completed: false,
    createdAt: Date.now() - 1000 * 60 * 60 * 1,
  },
  {
    id: 'task-5',
    title: 'Read research article on attention spans',
    priority: 'Low',
    durationMin: 20,
    category: 'Strategy',
    timeframe: 'upcoming',
    scheduledDateText: 'Thursday',
    completed: false,
    createdAt: Date.now(),
  },
];

export const INITIAL_TIMELINE: TimelineEvent[] = [
  {
    id: 'tl-1',
    time: '09:00',
    title: 'Research & literature review',
    status: 'done',
  },
  {
    id: 'tl-2',
    time: '11:00',
    title: 'Team sync meeting',
    status: 'done',
  },
  {
    id: 'tl-3',
    time: '14:00',
    title: 'Finish marketing research proposal',
    status: 'active',
    taskId: 'task-1',
  },
  {
    id: 'tl-4',
    time: '16:30',
    title: 'Design system critique',
    status: 'upcoming',
    durationText: '45m',
  },
];

export const INITIAL_USER_PREFS: UserPreferences = {
  name: 'Oddy',
  avatarUrl:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDrSOWDyZOnLGuQGqF1cu5ceBlN2tnmdQcrq-wJ9Tu5RlIkXQUkHf9C0BhhHX4hdgp9Ni5g1kDSDNYmVcOwkxPNvTqVAgNFNEfXsW87c6l3nrobVvjC4z8HGbuXwsvdgihfWT6HLgGS3kXP7-iTFdfKv_PslJh6ORHUuTxor9Aitcrx81klx3rhY_5q6MBQigVu95_7Xnhu0rsH9jBLYsQu83gxtaMo5ALKMjPOSKYdbGxlWFUoa_SD',
  soundEnabled: true,
  silentPeriodStart: '14:00',
  silentPeriodEnd: '15:30',
  showSilentNotice: true,
};
