import React, { useState, useEffect } from 'react';

export const NotesScreen: React.FC = () => {
  const [notes, setNotes] = useState<string>(() => {
    return (
      localStorage.getItem('noto_daily_notes') ||
      '• Marketing Proposal: Emphasize sample size reliability and user segmentation findings.\n• Schedule design critique debrief with Maya tomorrow morning.\n• "Quiet minds move the needle faster."'
    );
  });

  const [savedTime, setSavedTime] = useState<string>('Saved just now');

  useEffect(() => {
    localStorage.setItem('noto_daily_notes', notes);
    setSavedTime('Saved');
    const timer = setTimeout(() => {
      setSavedTime('All changes synced');
    }, 1500);
    return () => clearTimeout(timer);
  }, [notes]);

  const handleClear = () => {
    if (window.confirm('Clear all daily notes?')) {
      setNotes('');
    }
  };

  return (
    <div className="w-full flex flex-col space-y-4 pt-1 pb-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[18px] font-semibold text-on-surface">Daily Scratchpad</h2>
          <p className="text-[12px] text-on-surface-variant">
            Unburden your mind during deep work intervals
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-[11px] text-outline">{savedTime}</span>
          <button
            type="button"
            onClick={handleClear}
            className="p-1 text-on-surface-variant hover:text-error transition-colors rounded"
            title="Clear notes"
          >
            <span className="material-symbols-outlined text-[18px]">delete_sweep</span>
          </button>
        </div>
      </div>

      <div className="relative bg-surface-container-lowest rounded-xl border border-surface-container-highest p-4 shadow-sm min-h-[360px] flex flex-col">
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Jot down quick thoughts, distractions to park for later, or key takeaways..."
          className="w-full flex-1 bg-transparent resize-none outline-none text-[14px] leading-relaxed text-on-surface placeholder:text-outline-variant font-sans"
        />

        <div className="pt-3 border-t border-surface-container-high flex items-center justify-between text-[11px] text-on-surface-variant">
          <span>{notes.length} characters</span>
          <span className="flex items-center space-x-1">
            <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
            <span>Local offline storage</span>
          </span>
        </div>
      </div>

      {/* Monastic quote card */}
      <div className="p-4 rounded-xl bg-surface-container-low border border-surface-container-highest flex items-start space-x-3">
        <span className="material-symbols-outlined text-secondary text-[20px] pt-0.5">
          format_quote
        </span>
        <p className="text-[13px] text-on-surface-variant italic leading-relaxed">
          "The ability to perform deep work is becoming increasingly rare at exactly the same time it is becoming increasingly valuable in our economy."
        </p>
      </div>
    </div>
  );
};
