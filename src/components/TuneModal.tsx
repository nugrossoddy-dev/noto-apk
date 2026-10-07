import React, { useState } from 'react';
import { UserPreferences } from '../types';

interface TuneModalProps {
  isOpen: boolean;
  onClose: () => void;
  userPrefs: UserPreferences;
  onUpdatePrefs: (prefs: UserPreferences) => void;
  onResetData: () => void;
  layoutMode: 'mobile' | 'split';
  onChangeLayoutMode: (mode: 'mobile' | 'split') => void;
  onOpenProModal?: () => void;
}

export const TuneModal: React.FC<TuneModalProps> = ({
  isOpen,
  onClose,
  userPrefs,
  onUpdatePrefs,
  onResetData,
  layoutMode,
  onChangeLayoutMode,
  onOpenProModal,
}) => {
  const [name, setName] = useState(userPrefs.name);
  const [silentStart, setSilentStart] = useState(userPrefs.silentPeriodStart);
  const [silentEnd, setSilentEnd] = useState(userPrefs.silentPeriodEnd);
  const [soundEnabled, setSoundEnabled] = useState(userPrefs.soundEnabled);
  const [showSilentNotice, setShowSilentNotice] = useState(userPrefs.showSilentNotice);

  if (!isOpen) return null;

  const handleSave = () => {
    onUpdatePrefs({
      ...userPrefs,
      name,
      silentPeriodStart: silentStart,
      silentPeriodEnd: silentEnd,
      soundEnabled,
      showSilentNotice,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]">
      <div
        className="w-full max-w-sm bg-surface-container-lowest border border-surface-container-highest rounded-2xl p-5 shadow-2xl space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-2 border-b border-surface-container-high">
          <div className="flex items-center space-x-2">
            <span className="material-symbols-outlined text-secondary text-[20px]">tune</span>
            <h3 className="text-[16px] font-semibold text-on-surface">Preferences &amp; Calm Tuning</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-on-surface-variant hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="space-y-3.5">
          {/* Membership Card */}
          <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container-highest flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="material-symbols-outlined text-secondary text-[20px]">
                {userPrefs.isPro ? 'verified' : 'star_rate'}
              </span>
              <div>
                <p className="text-[13px] font-semibold text-on-surface">
                  {userPrefs.isPro ? 'NOTO Pro Active' : 'Free Plan'}
                </p>
                <p className="text-[11px] text-on-surface-variant">
                  {userPrefs.isPro
                    ? `Subscribed to ${userPrefs.proPlan || 'Pro'} plan`
                    : 'Unlimited AI Chat & Task Breakdown with Pro'}
                </p>
              </div>
            </div>
            {onOpenProModal && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenProModal();
                }}
                className={`px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${
                  userPrefs.isPro
                    ? 'bg-surface-container text-on-surface hover:bg-surface-container-high'
                    : 'bg-primary text-white hover:bg-[#222]'
                }`}
              >
                {userPrefs.isPro ? 'Manage' : 'Upgrade'}
              </button>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant mb-1">
              Your Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-surface-container-highest bg-surface-container-low/40 text-[14px] text-on-surface outline-none focus:border-on-surface"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant mb-1">
              Silent Flow Period
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={silentStart}
                onChange={(e) => setSilentStart(e.target.value)}
                placeholder="Start (14:00)"
                className="w-full px-3 py-2 rounded-xl border border-surface-container-highest bg-surface-container-low/40 text-[13px] text-on-surface outline-none"
              />
              <input
                type="text"
                value={silentEnd}
                onChange={(e) => setSilentEnd(e.target.value)}
                placeholder="End (15:30)"
                className="w-full px-3 py-2 rounded-xl border border-surface-container-highest bg-surface-container-low/40 text-[13px] text-on-surface outline-none"
              />
            </div>
          </div>

          {/* Desktop display format toggle */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant mb-1">
              Desktop Viewport Mode
            </label>
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-surface-container-low rounded-xl border border-surface-container-highest">
              <button
                type="button"
                onClick={() => onChangeLayoutMode('mobile')}
                className={`py-1.5 rounded-lg text-[12px] font-semibold transition-all ${
                  layoutMode === 'mobile'
                    ? 'bg-surface-container-lowest text-on-surface shadow-xs'
                    : 'text-on-surface-variant'
                }`}
              >
                Mobile View
              </button>
              <button
                type="button"
                onClick={() => onChangeLayoutMode('split')}
                className={`py-1.5 rounded-lg text-[12px] font-semibold transition-all ${
                  layoutMode === 'split'
                    ? 'bg-surface-container-lowest text-on-surface shadow-xs'
                    : 'text-on-surface-variant'
                }`}
              >
                Split Editorial
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between py-1">
            <span className="text-[13px] text-on-surface">Show Silent Period Banner</span>
            <input
              type="checkbox"
              checked={showSilentNotice}
              onChange={(e) => setShowSilentNotice(e.target.checked)}
              className="w-4 h-4 accent-secondary rounded cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between py-1">
            <span className="text-[13px] text-on-surface">Zen Focus Chimes &amp; Sounds</span>
            <input
              type="checkbox"
              checked={soundEnabled}
              onChange={(e) => setSoundEnabled(e.target.checked)}
              className="w-4 h-4 accent-secondary rounded cursor-pointer"
            />
          </div>

          <div className="pt-2 border-t border-surface-container-high flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Reset all tasks and data back to initial showcase state?')) {
                  onResetData();
                  onClose();
                }
              }}
              className="text-[12px] text-outline hover:text-error transition-colors"
            >
              Reset Demo Data
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-1.5 rounded-full bg-primary text-on-primary text-[13px] font-medium hover:bg-[#222] transition-colors"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
