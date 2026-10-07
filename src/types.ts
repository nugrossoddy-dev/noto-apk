export type Priority = 'High' | 'Medium' | 'Low';
export type Timeframe = 'today' | 'upcoming';
export type TabType = 'today' | 'tasks' | 'focus' | 'notes' | 'premium';
export type ProPlanId = 'monthly' | 'semi-annual' | 'annual';

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

export interface PlanDetail {
  id: ProPlanId;
  name: string;
  durationLabel: string;
  durationDays: number;
  price: number;
  priceFormatted: string;
  originalPriceFormatted?: string;
  tag?: string;
  savingsNote?: string;
  description: string;
  features: string[];
}

export interface PaymentTransaction {
  id: string;
  orderId: string;
  planId: ProPlanId;
  planName: string;
  amount: number;
  amountFormatted: string;
  method: 'qris' | 'bca_va' | 'mandiri_va' | 'bri_va' | 'bni_va' | 'gopay' | 'dana' | 'bank_transfer';
  methodName: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  senderName?: string;
  senderBank?: string;
  paymentProofUrl?: string;
  proofFileName?: string;
  notes?: string;
  paidAt: number;
  verifiedAt?: number;
  expiresAt: number;
  durationDays: number;
  status: 'paid' | 'pending';
  features: string[];
}

export interface UserPreferences {
  name: string;
  avatarUrl: string;
  soundEnabled: boolean;
  silentPeriodStart: string;
  silentPeriodEnd: string;
  showSilentNotice: boolean;
  isPro?: boolean;
  proPlan?: ProPlanId;
  activeTransaction?: PaymentTransaction;
  customQrisPayload?: string;
  customQrisImageUrl?: string;
}
