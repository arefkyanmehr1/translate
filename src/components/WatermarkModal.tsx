import React, { useState } from 'react';
import { X, Megaphone, Check, Trash2, Clock, Sparkles, AlertCircle, Info } from 'lucide-react';
import { SubtitleCue, PromoSettings, ThemeMode } from '../types/subtitle';
import { insertSmartPromoWatermarks } from '../utils/subtitleParser';

interface WatermarkModalProps {
  isOpen: boolean;
  onClose: () => void;
  cues: SubtitleCue[];
  onApplyWatermark: (newCues: SubtitleCue[], count: number) => void;
  onRemoveWatermarks: () => void;
  theme: ThemeMode;
}

export const WatermarkModal: React.FC<WatermarkModalProps> = ({
  isOpen,
  onClose,
  cues,
  onApplyWatermark,
  onRemoveWatermarks,
  theme,
}) => {
  const isLight = theme === 'light';

  const [text, setText] = useState('ترجمه اختصاصی: بالیوود مووی | @BollywoodMovie');
  const [insertAtStart, setInsertAtStart] = useState(true);
  const [repeatCount, setRepeatCount] = useState(5);
  const [durationSeconds, setDurationSeconds] = useState(3.5);

  if (!isOpen) return null;

  const currentPromoCount = cues.filter((c) => c.isPromo).length;

  const handleApply = () => {
    if (!text.trim()) return;

    const promo: PromoSettings = {
      text: text.trim(),
      insertAtStart,
      repeatCount: Number(repeatCount),
      durationSeconds: Number(durationSeconds),
      minGapSeconds: Number(durationSeconds) + 0.6,
    };

    const { updatedCues, insertedCount } = insertSmartPromoWatermarks(cues, promo);
    onApplyWatermark(updatedCues, insertedCount);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className={`border rounded-2xl w-full max-w-xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden transition-colors ${
          isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className={`p-4 sm:p-5 border-b flex items-center justify-between ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/50 border-slate-800'
        }`}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-500 border border-orange-500/20">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold flex items-center gap-2">
                افزودن امضا و تبلیغات هوشمند در فواصل سکوت
              </h2>
              <p className="text-xs text-slate-400">
                درج نام کانال یا سایت شما در ابتدای فیلم و تکرار خودکار در صحنه‌های بدون کلام
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs">
          
          {/* Text Input */}
          <div className="space-y-2">
            <label className="font-bold flex items-center gap-1.5 text-sm">
              <span>متن امضا یا تبلیغات زیرنویس:</span>
              <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="مثال: ترجمه اختصاصی: بالیوود مووی | @BollywoodMovie"
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium transition focus:outline-hidden focus:ring-2 focus:ring-amber-500 ${
                isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-750 text-white'
              }`}
            />
            <p className="text-[11px] text-slate-400">
              این متن در فایل زیرنویس نهایی (.srt یا .vtt) به عنوان خط تبلیغاتی قرار می‌گیرد.
            </p>
          </div>

          {/* Placement Options Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Insert at start */}
            <label className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition ${
              insertAtStart 
                ? (isLight ? 'bg-amber-50/70 border-amber-300' : 'bg-amber-500/10 border-amber-500/30')
                : (isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800')
            }`}>
              <input
                type="checkbox"
                checked={insertAtStart}
                onChange={(e) => setInsertAtStart(e.target.checked)}
                className="mt-0.5 rounded text-amber-500 focus:ring-amber-500"
              />
              <div className="space-y-1">
                <span className="font-bold block">درج در ابتدای فیلم</span>
                <span className="text-[11px] opacity-75 block">
                  قبل از شروع اولین دیالوگ در ثانیه‌های آغازین نمایش داده می‌شود.
                </span>
              </div>
            </label>

            {/* Repeat count slider */}
            <div className={`p-3.5 rounded-xl border space-y-2 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'
            }`}>
              <div className="flex items-center justify-between">
                <span className="font-bold">تعداد تکرار در طول فیلم:</span>
                <span className="font-mono font-bold text-amber-500 text-sm px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                  {repeatCount} بار
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                step="1"
                value={repeatCount}
                onChange={(e) => setRepeatCount(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <span className="text-[10px] text-slate-400 block">
                توزیع یکنواخت در کل مدت زمان فیلم با اولویت فواصل سکوت
              </span>
            </div>
          </div>

          {/* Duration setting */}
          <div className={`p-3.5 rounded-xl border flex items-center justify-between gap-4 ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'
          }`}>
            <div className="space-y-0.5">
              <span className="font-bold block">مدت زمان نمایش هر بار:</span>
              <span className="text-[11px] opacity-75 block">مدت زمانی که زیرنویس روی پرده می‌ماند</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="2.0"
                max="6.0"
                step="0.5"
                value={durationSeconds}
                onChange={(e) => setDurationSeconds(Number(e.target.value))}
                className={`w-20 px-2.5 py-1.5 rounded-lg border text-center font-mono font-bold ${
                  isLight ? 'bg-white border-slate-300' : 'bg-slate-900 border-slate-700'
                }`}
              />
              <span className="text-xs text-slate-400">ثانیه</span>
            </div>
          </div>

          {/* Smart Placement Note */}
          <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-700 dark:text-indigo-300 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 shrink-0 text-indigo-500 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold block">سیستم جاگذاری هوشمند بدون تداخل (Zero-Collision):</span>
              <p className="text-[11px] opacity-90 leading-relaxed">
                الگوریتم ابتدا کل فیلم را اسکن می‌کند و بزرگ‌ترین وقفه‌های زمانی بین دیالوگ‌ها (مثلاً بین صحنه‌ها، موسیقی یا سکوت بیش از ۴ ثانیه) را پیدا کرده و تبلیغ را دقیقاً در قلب آن سکوت جاگذاری می‌کند تا روی هیچ دیالوگی نیفتد.
              </p>
            </div>
          </div>

          {/* Current Watermarks Notice if any */}
          {currentPromoCount > 0 && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between gap-2">
              <span className="text-amber-600 dark:text-amber-400 font-medium text-xs">
                در حال حاضر {currentPromoCount} خط امضا در زیرنویس وجود دارد. با اعمال مجدد، خطوط قبلی جایگزین خواهند شد.
              </span>
              <button
                type="button"
                onClick={() => {
                  onRemoveWatermarks();
                  onClose();
                }}
                className="px-2.5 py-1 rounded-lg bg-red-600/10 hover:bg-red-600/20 text-red-600 dark:text-red-400 border border-red-500/30 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer shrink-0"
              >
                <Trash2 className="w-3 h-3" />
                <span>حذف همه</span>
              </button>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className={`p-4 border-t flex flex-wrap items-center justify-between gap-2 ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/50 border-slate-800'
        }`}>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition cursor-pointer"
          >
            انصراف
          </button>

          <div className="flex items-center gap-2">
            {currentPromoCount > 0 && (
              <button
                type="button"
                onClick={() => {
                  onRemoveWatermarks();
                  onClose();
                }}
                className="px-3.5 py-2 rounded-xl border border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-500/10 text-xs font-semibold transition cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>حذف تبلیغات</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleApply}
              disabled={!text.trim()}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-slate-950 font-bold text-xs shadow-md transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>درج هوشمند امضا در فواصل سکوت</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
