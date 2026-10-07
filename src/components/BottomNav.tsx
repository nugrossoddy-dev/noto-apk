import React from 'react';
import { TabType } from '../types';

interface BottomNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  return (
    <nav
      aria-label="Bottom Navigation"
      className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 py-2 bg-surface border-t border-surface-container-highest max-w-md mx-auto inset-x-0"
    >
      {/* Tab 1: Today */}
      <button
        type="button"
        onClick={() => onTabChange('today')}
        className={`flex flex-col items-center justify-center transition-all duration-150 active:scale-95 py-1 px-3 rounded-lg ${
          activeTab === 'today'
            ? 'text-primary font-medium'
            : 'text-on-surface-variant font-normal hover:text-on-surface'
        }`}
      >
        <span
          className={`material-symbols-outlined text-[22px] ${
            activeTab === 'today' ? 'filled' : ''
          }`}
          style={{ fontVariationSettings: activeTab === 'today' ? "'FILL' 1" : "'FILL' 0" }}
        >
          calendar_today
        </span>
        <span className="text-[11px] font-semibold tracking-wider mt-0.5">Today</span>
      </button>

      {/* Tab 2: Tasks */}
      <button
        type="button"
        onClick={() => onTabChange('tasks')}
        className={`flex flex-col items-center justify-center transition-all duration-150 active:scale-95 py-1 px-3 rounded-lg ${
          activeTab === 'tasks'
            ? 'text-primary font-medium'
            : 'text-on-surface-variant font-normal hover:text-on-surface'
        }`}
      >
        <span
          className={`material-symbols-outlined text-[22px] ${
            activeTab === 'tasks' ? 'filled' : ''
          }`}
          style={{ fontVariationSettings: activeTab === 'tasks' ? "'FILL' 1" : "'FILL' 0" }}
        >
          check_circle
        </span>
        <span className="text-[11px] font-semibold tracking-wider mt-0.5">Tasks</span>
      </button>

      {/* Tab 3: Focus */}
      <button
        type="button"
        onClick={() => onTabChange('focus')}
        className={`flex flex-col items-center justify-center transition-all duration-150 active:scale-95 py-1 px-3 rounded-lg ${
          activeTab === 'focus'
            ? 'text-primary font-medium'
            : 'text-on-surface-variant font-normal hover:text-on-surface'
        }`}
      >
        <span
          className={`material-symbols-outlined text-[22px] ${
            activeTab === 'focus' ? 'filled' : ''
          }`}
          style={{ fontVariationSettings: activeTab === 'focus' ? "'FILL' 1" : "'FILL' 0" }}
        >
          hourglass_empty
        </span>
        <span className="text-[11px] font-semibold tracking-wider mt-0.5">Focus</span>
      </button>

      {/* Tab 4: Notes */}
      <button
        type="button"
        onClick={() => onTabChange('notes')}
        className={`flex flex-col items-center justify-center transition-all duration-150 active:scale-95 py-1 px-3 rounded-lg ${
          activeTab === 'notes'
            ? 'text-primary font-medium'
            : 'text-on-surface-variant font-normal hover:text-on-surface'
        }`}
      >
        <span
          className={`material-symbols-outlined text-[22px] ${
            activeTab === 'notes' ? 'filled' : ''
          }`}
          style={{ fontVariationSettings: activeTab === 'notes' ? "'FILL' 1" : "'FILL' 0" }}
        >
          edit_note
        </span>
        <span className="text-[11px] font-semibold tracking-wider mt-0.5">Notes</span>
      </button>
    </nav>
  );
};
