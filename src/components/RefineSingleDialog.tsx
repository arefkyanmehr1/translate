import React, { useState } from 'react';
import { X, Wand2, Sparkles, Check, Flame, Scissors, Smile } from 'lucide-react';
import { SubtitleCue, ThemeMode } from '../types/subtitle';

interface RefineSingleDialogProps {
  cue: SubtitleCue | null;
  isOpen: boolean;
  onClose: () => void;
  onApplyTranslation: (cueId: number, newPersian: string, slangNote?: string) => void;
  currentTone: string;
  theme: ThemeMode;
}

interface RefineOption {
  text: string;
  style: string;
}

export const RefineSingleDialog: React.FC<RefineSingleDialogProps> = ({
  cue,
  isOpen,
  onClose,
  onApplyTranslation,
  currentTone,
  theme,
}) => {
  const isLight = theme === 'light';
  const [customPrompt, setCustomPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [options, setOptions] = useState<RefineOption[]>([]);
  const [explanation, setExplanation] = useState('');

  if (!isOpen || !cue) return null;

  const handleRefine = async (requestType: string) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/refine-single', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalText: cue.originalText,
          currentPersian: cue.persianText || '',
          requestType,
          customNote: customPrompt,
          tone: currentTone,
        }),
      });
      const data = await res.json();
      if (data.options && data.options.length > 0) {
        setOptions(data.options);
        setExplanation(data.explanation || '');
      }
    } catch (err) {
      console.error('Error refining line:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className={`border rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden transition-colors ${
          isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`p-4 border-b flex items-center justify-between ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/50 border-slate-800'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500">
              <Wand2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold">
                بازنویسی و شخصی‌سازی دیالوگ #{cue.id}
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                {cue.startTime} ➔ {cue.endTime}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1 rounded-lg transition ${
              isLight ? 'text-slate-400 hover:text-slate-900 hover:bg-slate-200' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 space-y-4 text-xs">
          
          {/* Current Cue Box */}
          <div className={`p-3 rounded-xl border space-y-2 ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-850'
          }`}>
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-0.5 font-bold">
                متن اصلی فیلم (EN):
              </span>
              <p className={`font-mono text-left dir-ltr ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                {cue.originalText}
              </p>
            </div>
            <div className={`pt-2 border-t ${isLight ? 'border-slate-200' : 'border-slate-900'}`}>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-0.5 font-bold">
                ترجمه فعلی فارسی:
              </span>
              <p className={`font-bold font-sans ${isLight ? 'text-amber-900' : 'text-amber-300'}`}>
                {cue.persianText || 'هنوز ترجمه نشده'}
              </p>
            </div>
          </div>

          {/* Quick Preset Buttons */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 mb-2">
              تغییر سریع سبک با هوش مصنوعی:
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleRefine('more_slang')}
                className={`flex items-center gap-2 p-2.5 rounded-xl border transition disabled:opacity-50 text-right ${
                  isLight ? 'bg-slate-50 hover:bg-orange-50 border-slate-200' : 'bg-slate-850 hover:bg-slate-800 border-slate-800'
                }`}
              >
                <Flame className="w-4 h-4 text-orange-500 shrink-0" />
                <div>
                  <div className="font-bold text-[11px]">خیلی لاتی‌ترش کن</div>
                  <div className="text-[10px] text-slate-400">کوچه بازاری سنگین</div>
                </div>
              </button>

              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleRefine('shorter')}
                className={`flex items-center gap-2 p-2.5 rounded-xl border transition disabled:opacity-50 text-right ${
                  isLight ? 'bg-slate-50 hover:bg-blue-50 border-slate-200' : 'bg-slate-850 hover:bg-slate-800 border-slate-800'
                }`}
              >
                <Scissors className="w-4 h-4 text-blue-500 shrink-0" />
                <div>
                  <div className="font-bold text-[11px]">کوتاه‌تر و ضربه‌دار</div>
                  <div className="text-[10px] text-slate-400">مناسب لب‌خوانی سریع</div>
                </div>
              </button>

              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleRefine('funnier')}
                className={`flex items-center gap-2 p-2.5 rounded-xl border transition disabled:opacity-50 text-right ${
                  isLight ? 'bg-slate-50 hover:bg-emerald-50 border-slate-200' : 'bg-slate-850 hover:bg-slate-800 border-slate-800'
                }`}
              >
                <Smile className="w-4 h-4 text-emerald-500 shrink-0" />
                <div>
                  <div className="font-bold text-[11px]">طنز و تیکه‌دار</div>
                  <div className="text-[10px] text-slate-400">پر از متلک خنده‌دار</div>
                </div>
              </button>

              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleRefine('milder')}
                className={`flex items-center gap-2 p-2.5 rounded-xl border transition disabled:opacity-50 text-right ${
                  isLight ? 'bg-slate-50 hover:bg-purple-50 border-slate-200' : 'bg-slate-850 hover:bg-slate-800 border-slate-800'
                }`}
              >
                <Sparkles className="w-4 h-4 text-purple-500 shrink-0" />
                <div>
                  <div className="font-bold text-[11px]">تهرانی ملایم‌تر</div>
                  <div className="text-[10px] text-slate-400">صمیمی بدون کلمات تند</div>
                </div>
              </button>
            </div>
          </div>

          {/* Custom Prompt */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-400">
              یا دستور خاص خودت را بنویس:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="مثلاً: بگو 'حاجی پشمام ریخت' یا 'کاسه کوزه‌تو جمع کن'..."
                className={`flex-1 px-3 py-2 text-xs rounded-xl border focus:outline-none focus:border-amber-500 ${
                  isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
                }`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRefine('custom');
                }}
              />
              <button
                type="button"
                disabled={isLoading || !customPrompt.trim()}
                onClick={() => handleRefine('custom')}
                className="px-3.5 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl transition disabled:opacity-50 shrink-0"
              >
                {isLoading ? '...' : 'تولید'}
              </button>
            </div>
          </div>

          {/* Suggested Options List */}
          {options.length > 0 && (
            <div className={`space-y-2 pt-2 border-t ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
              <div className="text-[11px] font-bold text-amber-500 flex items-center justify-between">
                <span>گزینه‌های پیشنهادی هوش مصنوعی (کلیک برای جایگزینی):</span>
              </div>
              <div className="space-y-2">
                {options.map((opt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      onApplyTranslation(cue.id, opt.text, opt.style);
                      onClose();
                    }}
                    className={`w-full text-right p-3 rounded-xl border transition group flex items-start justify-between gap-2 ${
                      isLight 
                        ? 'bg-slate-50 hover:bg-amber-50 border-slate-200 hover:border-amber-400 text-slate-800' 
                        : 'bg-slate-950 hover:bg-amber-500/10 border-slate-800 hover:border-amber-500/50 text-slate-200'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold">
                        «{opt.text}»
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1">
                        سبک: {opt.style}
                      </div>
                    </div>
                    <div className="p-1 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 group-hover:bg-amber-500 group-hover:text-slate-950 shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
