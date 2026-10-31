import React from 'react';
import { X, Sliders, MessageSquare, User, BookOpen, Check, Sparkles, Flame } from 'lucide-react';
import { TONE_OPTIONS } from '../data/sampleScenes';
import { TranslationSettings, ThemeMode, SlangLevel } from '../types/subtitle';

interface ToneSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: TranslationSettings;
  onSaveSettings: (settings: TranslationSettings) => void;
  theme: ThemeMode;
}

export const ToneSettingsModal: React.FC<ToneSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  theme,
}) => {
  const isLight = theme === 'light';
  const [localSettings, setLocalSettings] = React.useState<TranslationSettings>(settings);

  React.useEffect(() => {
    setLocalSettings(settings);
  }, [settings, isOpen]);

  if (!isOpen) return null;

  const activeTone = TONE_OPTIONS.find((t) => t.id === localSettings.tone) || TONE_OPTIONS[0];

  const handleSave = () => {
    onSaveSettings(localSettings);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className={`border rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden transition-colors ${
          isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Modal Header */}
        <div className={`p-4 sm:p-5 border-b flex items-center justify-between ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/50 border-slate-800'
        }`}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold flex items-center gap-2">
                تنظیم دقیق لحن و بافت داستانی فیلم
              </h2>
              <p className="text-xs text-slate-400">
                تعیین غلظت اصطلاحات خیابونی، روحیه کاراکترها و دستورات اختصاصی ترجمه
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition ${
              isLight ? 'text-slate-400 hover:text-slate-900 hover:bg-slate-200' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs">
          
          {/* Tone Selector Cards */}
          <div>
            <label className={`block font-bold uppercase tracking-wider mb-2.5 flex items-center gap-1.5 ${
              isLight ? 'text-slate-700' : 'text-slate-300'
            }`}>
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>انتخاب لحن اصلی زیرنویس:</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {TONE_OPTIONS.map((tone) => {
                const isSelected = localSettings.tone === tone.id;
                return (
                  <button
                    key={tone.id}
                    type="button"
                    onClick={() => setLocalSettings({ ...localSettings, tone: tone.id })}
                    className={`relative text-right p-3 rounded-xl border transition flex flex-col justify-between gap-2 text-start ${
                      isSelected
                        ? isLight
                          ? 'border-amber-500 bg-amber-50 text-amber-900 ring-2 ring-amber-400/40'
                          : 'border-amber-500 bg-amber-500/10 text-amber-200 ring-1 ring-amber-500/40'
                        : isLight
                        ? 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800'
                        : 'border-slate-800 bg-slate-850/60 hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="font-bold text-sm">{tone.label}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                          isLight ? 'bg-slate-200 text-amber-800' : 'bg-slate-800 text-amber-400'
                        }`}>
                          {tone.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                        {tone.subLabel}
                      </p>
                    </div>

                    {isSelected && (
                      <div className="self-end flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 font-bold">
                        <Check className="w-3.5 h-3.5" />
                        <span>انتخاب شده</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tone Example Preview Box */}
          <div className={`p-3.5 rounded-xl border space-y-1.5 ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/70 border-slate-800'
          }`}>
            <div className="text-[11px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
              <span>نمونه ترجمه با لحن «{activeTone.label}»:</span>
            </div>
            <div className="text-slate-400 font-mono text-[11px] dir-ltr text-left">
              EN: "{activeTone.sampleBefore}"
            </div>
            <div className={`font-semibold font-sans ${isLight ? 'text-emerald-700' : 'text-emerald-300'}`}>
              FA: «{activeTone.sampleAfter}»
            </div>
          </div>

          {/* Slang Intensity Level */}
          <div>
            <label className={`block font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5 ${
              isLight ? 'text-slate-700' : 'text-slate-300'
            }`}>
              <Flame className="w-4 h-4 text-orange-500" />
              <span>شدت و غلظت کلمات خیابونی و لاتی:</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                { id: 'light', label: 'ملایم و خودمانی', desc: 'شکستن افعال، بدون کلمات خیلی سنگین' },
                { id: 'medium', label: 'متوسط و پرکاربرد', desc: 'تعادل عالی بین روانی و اصطلاحات عامیانه' },
                { id: 'heavy', label: 'خیابونی تمام‌عیار 🔥', desc: 'لاتی سنگین، اصیل و بدون تعارف' },
              ].map((lvl) => {
                const isSelected = localSettings.slangLevel === lvl.id;
                return (
                  <button
                    key={lvl.id}
                    type="button"
                    onClick={() => setLocalSettings({ ...localSettings, slangLevel: lvl.id as SlangLevel })}
                    className={`p-3 rounded-xl border text-right transition ${
                      isSelected
                        ? isLight
                          ? 'border-orange-500 bg-orange-50 text-orange-900 ring-2 ring-orange-400/40'
                          : 'border-orange-500 bg-orange-500/10 text-orange-200 ring-1 ring-orange-500/30'
                        : isLight
                        ? 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800'
                        : 'border-slate-800 bg-slate-850 hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="font-bold mb-0.5">{lvl.label}</div>
                    <div className="text-[11px] text-slate-400">{lvl.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Movie Context & Plot */}
          <div>
            <label className={`block font-bold mb-1.5 flex items-center gap-1.5 ${
              isLight ? 'text-slate-700' : 'text-slate-300'
            }`}>
              <BookOpen className="w-3.5 h-3.5 text-blue-500" />
              <span>توضیحات و بافت داستانی فیلم (Movie Context):</span>
            </label>
            <textarea
              rows={2}
              value={localSettings.movieContext}
              onChange={(e) => setLocalSettings({ ...localSettings, movieContext: e.target.value })}
              placeholder="مثلاً: فیلم مافیایی جنایی در دهه ۹۰، فضای تاریک رفاقتی، دو شرخر که در مخمصه افتادن..."
              className={`w-full px-3.5 py-2.5 rounded-xl border focus:outline-none focus:border-amber-500 transition resize-none ${
                isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
              }`}
            />
          </div>

          {/* Character Voice Profiles */}
          <div>
            <label className={`block font-bold mb-1.5 flex items-center gap-1.5 ${
              isLight ? 'text-slate-700' : 'text-slate-300'
            }`}>
              <User className="w-3.5 h-3.5 text-purple-500" />
              <span>شخصیت‌پردازی کاراکترها و نوع بیان:</span>
            </label>
            <textarea
              rows={2}
              value={localSettings.characterDescriptions}
              onChange={(e) => setLocalSettings({ ...localSettings, characterDescriptions: e.target.value })}
              placeholder="مثلاً: کاراکتر ۱ مرد ۵۰ ساله لاتی و باسابقه، کاراکتر ۲ پسری ترسو و تازه کار که دائم هول می‌کنه..."
              className={`w-full px-3.5 py-2.5 rounded-xl border focus:outline-none focus:border-amber-500 transition resize-none ${
                isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
              }`}
            />
          </div>

          {/* Custom Specific Instructions */}
          <div>
            <label className={`block font-bold mb-1.5 flex items-center gap-1.5 ${
              isLight ? 'text-slate-700' : 'text-slate-300'
            }`}>
              <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
              <span>دستورات و اصطلاحات سفارشی یا واژه‌نامه خاص:</span>
            </label>
            <input
              type="text"
              value={localSettings.customInstructions}
              onChange={(e) => setLocalSettings({ ...localSettings, customInstructions: e.target.value })}
              placeholder="مثلاً: به جای Bro بگو 'داش' یا 'ستون' | کلمات خشن رو فیلتر نکن | جملات کوتاه باشه"
              className={`w-full px-3.5 py-2.5 rounded-xl border focus:outline-none focus:border-amber-500 transition ${
                isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
              }`}
            />
          </div>

          {/* Netflix Standards, Uncensored Mode & Anti-Filter Relay Toggles */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            
            {/* Uncensored 18+ Card */}
            <div className={`p-3.5 rounded-xl border flex flex-col justify-between gap-2 transition ${
              localSettings.uncensored !== false
                ? 'border-amber-500/50 bg-amber-500/10 text-amber-200 ring-1 ring-amber-500/30'
                : (isLight ? 'border-slate-200 bg-slate-50' : 'border-slate-800 bg-slate-950')
            }`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-base">🔞</span>
                  <div>
                    <h3 className="font-bold text-xs text-amber-500 dark:text-amber-400">بدون سانسور (صریح و لاتی)</h3>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">ترجمه واقعی دشنام‌ها و فحش‌های خیابانی</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={localSettings.uncensored !== false}
                  onChange={(e) => setLocalSettings({ ...localSettings, uncensored: e.target.checked })}
                  className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 cursor-pointer"
                />
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                ترجمه دقیق کلمات Fuck، Shit، Motherfucker و... به معادل‌های واقعی فارسی (کون لقت، کیرم توت، گوه نخور) بدون سانسور تلویزیونی.
              </p>
            </div>

            {/* Netflix Standard Card */}
            <div className={`p-3.5 rounded-xl border flex flex-col justify-between gap-2 ${
              localSettings.netflixStandard !== false
                ? 'border-red-500/40 bg-red-500/5'
                : (isLight ? 'border-slate-200 bg-slate-50' : 'border-slate-800 bg-slate-950')
            }`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-base">🔴</span>
                  <div>
                    <h3 className="font-bold text-xs text-red-500 dark:text-red-400">استاندارد رسمی نتفلیکس</h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">سقف ۲ خط، حداکثر ۴۲ کاراکتر و شکستن نحوی</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={localSettings.netflixStandard !== false}
                  onChange={(e) => setLocalSettings({ ...localSettings, netflixStandard: e.target.checked })}
                  className="w-4 h-4 rounded text-red-600 focus:ring-red-500 cursor-pointer"
                />
              </div>
              <p className="text-[10px] text-slate-400">
                حذف چیدمان کلمه به کلمه گفتار ASR و تبدیل دیالوگ‌ها به جملات خوش‌خوان و سینمایی.
              </p>
            </div>

            {/* Anti-Sanction Relay Tunnel Card */}
            <div className={`p-3.5 rounded-xl border flex flex-col justify-between gap-2 ${
              localSettings.useRelay !== false
                ? 'border-emerald-500/40 bg-emerald-500/5'
                : (isLight ? 'border-slate-200 bg-slate-50' : 'border-slate-800 bg-slate-950')
            }`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-base">🛡️</span>
                  <div>
                    <h3 className="font-bold text-xs text-emerald-500 dark:text-emerald-400">تونل رله ایران (بدون فیلتر)</h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">ارسال مستقیم ضدتحریم</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={localSettings.useRelay !== false}
                  onChange={(e) => setLocalSettings({ ...localSettings, useRelay: e.target.checked })}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
              </div>
              <input
                type="text"
                value={localSettings.relayUrl || "https://arefkyanmehr.ir/srt.php"}
                onChange={(e) => setLocalSettings({ ...localSettings, relayUrl: e.target.value })}
                placeholder="آدرس رله هاست ایران"
                className={`w-full px-2 py-1 text-[11px] font-mono rounded border ${
                  isLight ? 'bg-white border-slate-300' : 'bg-slate-900 border-slate-700 text-slate-300'
                }`}
              />
            </div>

          </div>

        </div>

        {/* Modal Footer */}
        <div className={`p-4 border-t flex items-center justify-between ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/70 border-slate-800'
        }`}>
          <button
            type="button"
            onClick={() => {
              setLocalSettings({
                tone: 'street_gangster',
                slangLevel: 'heavy',
                movieContext: '',
                characterDescriptions: '',
                customInstructions: '',
                preserveTiming: true,
              });
            }}
            className="text-xs text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition"
          >
            پیش‌فرض لاتی
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 text-xs font-medium rounded-xl transition ${
                isLight ? 'text-slate-600 hover:bg-slate-200' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              انصراف
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 text-xs font-bold bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 rounded-xl transition shadow-md shadow-amber-500/20"
            >
              ذخیره و اعمال تنظیمات
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
