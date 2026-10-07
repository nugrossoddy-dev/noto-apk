import React, { useState } from 'react';
import { playChime } from '../utils/audio';

interface NotoProModalProps {
  isOpen: boolean;
  onClose: () => void;
  isPro?: boolean;
  currentPlan?: 'monthly' | 'semi-annual' | 'annual';
  onUpgrade: (plan: 'monthly' | 'semi-annual' | 'annual') => void;
}

export const NotoProModal: React.FC<NotoProModalProps> = ({
  isOpen,
  onClose,
  isPro = false,
  currentPlan = 'semi-annual',
  onUpgrade,
}) => {
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'semi-annual' | 'annual'>(currentPlan);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleUnlock = () => {
    playChime(660, 2.0);
    setIsSuccess(true);
    setTimeout(() => {
      onUpgrade(selectedPlan);
      setIsSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-[3px] animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-surface-container-lowest border border-surface-container-highest rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Header with Close Button */}
        <div className="flex items-center justify-between px-5 pt-4 pb-2 border-b border-surface-container-high/60 shrink-0">
          <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-secondary/15 text-secondary text-[11px] font-semibold tracking-wider uppercase">
            <span className="material-symbols-outlined text-[13px]">verified</span>
            <span>NOTO Pro</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-on-surface-variant hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5 no-scrollbar">
          {/* SECTION 1: Brand & Pitch */}
          <div className="text-center space-y-1.5 pt-1">
            <h2 className="text-[24px] font-semibold tracking-tight text-on-surface leading-tight">
              NOTO Pro
            </h2>
            <div className="space-y-0.5 text-on-surface-variant text-[14px]">
              <p className="font-medium text-on-surface">Get more done with NOTO.</p>
              <p className="text-[13px] leading-relaxed">
                AI-powered tools for better work and focus.
              </p>
            </div>
          </div>

          {/* SECTION 2: Feature Highlights (3 Core Cards) */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container-highest flex flex-col space-y-1">
              <span className="material-symbols-outlined text-secondary text-[18px]">
                splitscreen_vertical
              </span>
              <span className="text-[13px] font-semibold text-on-surface leading-tight">
                AI Task Breakdown
              </span>
              <span className="text-[11px] text-on-surface-variant leading-tight">
                Deconstruct heavy work into calm 15–25m sprints.
              </span>
            </div>

            <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container-highest flex flex-col space-y-1">
              <span className="material-symbols-outlined text-secondary text-[18px]">
                all_inclusive
              </span>
              <span className="text-[13px] font-semibold text-on-surface leading-tight">
                Unlimited AI Chat
              </span>
              <span className="text-[11px] text-on-surface-variant leading-tight">
                Uncapped multi-turn coaching with Gemini 3.5 &amp; 3.1.
              </span>
            </div>

            <div className="col-span-2 p-3 rounded-xl bg-surface-container-low border border-surface-container-highest flex items-start space-x-2.5">
              <span className="material-symbols-outlined text-secondary text-[18px] pt-0.5">
                travel_explore
              </span>
              <div>
                <span className="text-[13px] font-semibold text-on-surface leading-tight block">
                  Smart References &amp; Search Grounding
                </span>
                <span className="text-[11px] text-on-surface-variant leading-relaxed">
                  Real-time cognitive research, attention studies, and web citations.
                </span>
              </div>
            </div>
          </div>

          {/* SECTION 3: Pricing Plans Selector */}
          <div className="space-y-2.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant block">
              Choose Your Plan
            </span>

            {/* Top 2 Plans Row */}
            <div className="grid grid-cols-2 gap-2.5">
              {/* Plan: Monthly */}
              <button
                type="button"
                onClick={() => setSelectedPlan('monthly')}
                className={`p-3.5 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                  selectedPlan === 'monthly'
                    ? 'border-secondary bg-[#F4F7F5] shadow-xs'
                    : 'border-surface-container-highest bg-surface-container-lowest hover:border-outline-variant'
                }`}
              >
                <div className="space-y-0.5">
                  <span className="text-[11px] font-medium text-on-surface-variant uppercase tracking-wider block">
                    Monthly
                  </span>
                  <p className="text-[18px] font-semibold text-on-surface tabular-nums">
                    Rp39.000
                  </p>
                  <p className="text-[11px] text-outline">/month</p>
                </div>
                <div className="pt-2 flex justify-end">
                  <span
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      selectedPlan === 'monthly'
                        ? 'border-secondary bg-secondary text-white'
                        : 'border-outline-variant'
                    }`}
                  >
                    {selectedPlan === 'monthly' && (
                      <span className="material-symbols-outlined text-[11px] font-bold">check</span>
                    )}
                  </span>
                </div>
              </button>

              {/* Plan: 6 Months (BEST VALUE) */}
              <button
                type="button"
                onClick={() => setSelectedPlan('semi-annual')}
                className={`p-3.5 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                  selectedPlan === 'semi-annual'
                    ? 'border-secondary bg-[#F4F7F5] shadow-xs ring-1 ring-secondary'
                    : 'border-surface-container-highest bg-surface-container-lowest hover:border-outline-variant'
                }`}
              >
                {/* BEST VALUE Pill */}
                <span className="absolute -top-2 right-2.5 px-2 py-0.5 rounded-full bg-secondary text-white text-[9px] font-bold uppercase tracking-wider shadow-xs">
                  BEST VALUE
                </span>

                <div className="space-y-0.5">
                  <span className="text-[11px] font-medium text-on-surface-variant uppercase tracking-wider block">
                    6 Months
                  </span>
                  <p className="text-[18px] font-semibold text-on-surface tabular-nums">
                    Rp149.000
                  </p>
                  <p className="text-[11px] text-secondary font-medium">/6 months</p>
                </div>
                <div className="pt-2 flex justify-end">
                  <span
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      selectedPlan === 'semi-annual'
                        ? 'border-secondary bg-secondary text-white'
                        : 'border-outline-variant'
                    }`}
                  >
                    {selectedPlan === 'semi-annual' && (
                      <span className="material-symbols-outlined text-[11px] font-bold">check</span>
                    )}
                  </span>
                </div>
              </button>
            </div>

            {/* Plan: Annual Row */}
            <button
              type="button"
              onClick={() => setSelectedPlan('annual')}
              className={`w-full p-3.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                selectedPlan === 'annual'
                  ? 'border-secondary bg-[#F4F7F5] shadow-xs'
                  : 'border-surface-container-highest bg-surface-container-lowest hover:border-outline-variant'
              }`}
            >
              <div className="space-y-0.5">
                <div className="flex items-center space-x-2">
                  <span className="text-[11px] font-medium text-on-surface-variant uppercase tracking-wider">
                    Annual
                  </span>
                  <span className="px-1.5 py-0.2 rounded bg-surface-container text-[10px] font-semibold text-on-surface">
                    Save 51%
                  </span>
                </div>
                <div className="flex items-baseline space-x-1.5">
                  <p className="text-[18px] font-semibold text-on-surface tabular-nums">
                    Rp229.000
                  </p>
                  <span className="text-[12px] text-outline font-medium">/ year (~Rp19k/mo)</span>
                </div>
              </div>

              <span
                className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                  selectedPlan === 'annual'
                    ? 'border-secondary bg-secondary text-white'
                    : 'border-outline-variant'
                }`}
              >
                {selectedPlan === 'annual' && (
                  <span className="material-symbols-outlined text-[11px] font-bold">check</span>
                )}
              </span>
            </button>
          </div>

          {/* SECTION 4: Free vs Pro Comparison Table */}
          <div className="bg-surface-container-low/60 rounded-xl p-3.5 border border-surface-container-highest space-y-2.5">
            <div className="flex items-center justify-between border-b border-surface-container-high pb-2">
              <span className="text-[12px] font-semibold text-on-surface uppercase tracking-wider">
                Free vs Pro
              </span>
              <div className="flex items-center space-x-6 text-[11px] font-semibold text-on-surface-variant">
                <span>Free</span>
                <span className="text-secondary">Pro</span>
              </div>
            </div>

            {/* Row 1: AI Chat */}
            <div className="flex items-center justify-between text-[13px] py-0.5">
              <span className="text-on-surface">AI Chat</span>
              <div className="flex items-center space-x-7 text-[12px]">
                <span className="text-outline tabular-nums">5/day</span>
                <span className="font-semibold text-secondary tabular-nums">∞</span>
              </div>
            </div>

            {/* Row 2: Task Breakdown */}
            <div className="flex items-center justify-between text-[13px] py-0.5">
              <span className="text-on-surface">Task Breakdown</span>
              <div className="flex items-center space-x-8 text-[12px]">
                <span className="text-outline">—</span>
                <span className="font-bold text-secondary">✓</span>
              </div>
            </div>

            {/* Row 3: Smart Reference */}
            <div className="flex items-center justify-between text-[13px] py-0.5">
              <span className="text-on-surface">Smart Reference</span>
              <div className="flex items-center space-x-6 text-[12px]">
                <span className="text-outline">Basic</span>
                <span className="font-bold text-secondary">✓</span>
              </div>
            </div>

            {/* Row 4: Focus Mode */}
            <div className="flex items-center justify-between text-[13px] py-0.5">
              <span className="text-on-surface">Focus Mode</span>
              <div className="flex items-center space-x-8 text-[12px]">
                <span className="text-on-surface-variant">✓</span>
                <span className="font-bold text-secondary">✓</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Footer: CTA Button */}
        <div className="p-4 bg-surface-container-lowest border-t border-surface-container-high shrink-0 space-y-2">
          {isSuccess ? (
            <div className="w-full h-12 bg-secondary text-white rounded-full flex items-center justify-center space-x-2 font-medium animate-pulse">
              <span className="material-symbols-outlined text-[20px]">done_all</span>
              <span>NOTO Pro Activated!</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleUnlock}
              className="w-full h-12 bg-primary hover:bg-[#222222] text-on-primary rounded-full font-medium text-[16px] flex items-center justify-center space-x-2 active:scale-[0.99] transition-all cursor-pointer shadow-sm"
            >
              <span>{isPro ? 'Update NOTO Pro Plan' : 'Unlock NOTO Pro'}</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          )}

          <p className="text-[10px] text-center text-outline leading-tight">
            Cancel anytime in settings. Billed in IDR. Instant activation.
          </p>
        </div>
      </div>
    </div>
  );
};
