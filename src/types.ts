export type Priority = 'High' | 'Medium' | 'Low';
export type Timeframe = 'today' | 'upcoming';
export type TabType = 'today' | 'tasks' | 'focus' | 'notes';

export interface Task {
  id: string;
  title: string;
  priority: Priority;
  durationMin: number;
  category: string;
  timeframe: Timeframe;
  completed: boolean;
  scheduledDateText?: string;
  dueTime?: string;
  notes?: string;
  createdAt: number;
}

export interface TimelineEvent {
  id: string;
  time: string;
  title: string;
  status: 'done' | 'active' | 'upcoming';
  durationText?: string;
  taskId?: string;
}

export interface GroundingSource {
  uri: string;
  title?: string;
}

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  modelUsed?: string;
  sources?: GroundingSource[];
}

export interface UserPreferences {
  name: string;
  avatarUrl: string;
  soundEnabled: boolean;
  silentPeriodStart: string;
  silentPeriodEnd: string;
  showSilentNotice: boolean;
  isPro?: boolean;
  proPlan?: 'monthly' | 'semi-annual' | 'annual';
}
