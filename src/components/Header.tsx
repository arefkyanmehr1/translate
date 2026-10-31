import React, { useState } from 'react';
import { Film, Sparkles, Sliders, Play, Download, Sun, Moon, Menu, X, Megaphone, Key, GraduationCap, Search } from 'lucide-react';
import { SAMPLE_SCENES } from '../data/sampleScenes';
import { SampleScene, ThemeMode } from '../types/subtitle';

interface HeaderProps {
  onLoadSample: (scene: SampleScene) => void;
  onOpenSettings: () => void;
  onOpenExport: () => void;
  onOpenCinemaPreview: () => void;
  onOpenWatermark?: () => void;
  onOpenApiKeyModal?: () => void;
  onOpenMovieResearch?: () => void;
  onOpenStyleLearning?: () => void;
  hasCustomApiKey?: boolean;
  activeStyleName?: string;
  isResearched?: boolean;
  hasCues: boolean;
  hasPersian: boolean;
  theme: ThemeMode;
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onLoadSample,
  onOpenSettings,
  onOpenExport,
  onOpenCinemaPreview,
  onOpenWatermark,
  onOpenApiKeyModal,
  onOpenMovieResearch,
  onOpenStyleLearning,
  hasCustomApiKey,
  activeStyleName,
  isResearched,
  hasCues,
  hasPersian,
  theme,
  onToggleTheme,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sampleMenuOpen, setSampleMenuOpen] = useState(false);

  const isLight = theme === 'light';

  return (
    <header className={`border-b sticky top-0 z-40 backdrop-blur-md transition-colors ${
      isLight 
        ? 'border-slate-200 bg-white/90 text-slate-900 shadow-xs' 
        : 'border-slate-800/80 bg-slate-950/85 text-slate-100'
    }`}>
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 sm:h-18 flex items-center justify-between">
        
        {/* Logo & Brand */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="relative flex items-center justify-center w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-amber-500 via-orange-600 to-red-600 shadow-md shadow-amber-500/20 ring-1 ring-amber-400/30 shrink-0">
            <Film className="w-5 h-5 sm:w-6 sm:h-6 text-slate-950 stroke-[2.2]" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5 sm:h-3 sm:w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 sm:h-3 sm:w-3 bg-amber-500"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h1 className={`text-lg sm:text-2xl font-black tracking-tight flex items-center gap-1 ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}>
                Street<span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-500">Sub</span>
              </h1>
              <span className="px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[11px] font-semibold tracking-wide uppercase bg-amber-500/10 text-amber-500 dark:text-amber-300 border border-amber-500/30 rounded-full">
                نسخه فارسی خیابونی
              </span>
              <span className="px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-bold tracking-wide bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 rounded-full flex items-center gap-1 hidden sm:flex">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>رله ضدتحریم فعال</span>
              </span>
              <span className="px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-bold tracking-wide bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30 rounded-full hidden sm:flex items-center gap-1">
                <span>استاندارد نتفلیکس</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden md:block">
              مترجم هوشمند صدای فیلم و زیرنویس به فارسی محاوره‌ای، لاتی و کوچه بازاری
            </p>
          </div>
        </div>

        {/* Desktop Quick Actions */}
        <div className="hidden lg:flex items-center gap-2.5">
          
          {/* Sample Scenes Dropdown */}
          <div className="relative group">
            <button className={`flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-xl border transition shadow-xs ${
              isLight 
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-250' 
                : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-750'
            }`}>
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>نمونه فیلم‌ها</span>
            </button>
            <div className={`absolute left-0 mt-1 w-64 rounded-2xl shadow-2xl p-2 hidden group-hover:block z-50 border ${
              isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-750 text-white'
            }`}>
              <div className="text-[11px] font-semibold text-slate-400 px-2 py-1 border-b border-slate-200 dark:border-slate-800 mb-1">
                تست سریع با صحنه‌های معروف:
              </div>
              {SAMPLE_SCENES.map((scene) => (
                <button
                  key={scene.id}
                  onClick={() => onLoadSample(scene)}
                  className={`w-full text-right px-2.5 py-2 text-xs rounded-xl transition flex flex-col gap-0.5 ${
                    isLight 
                      ? 'hover:bg-amber-50 hover:text-amber-700 text-slate-800' 
                      : 'hover:bg-amber-500/10 hover:text-amber-300 text-slate-300'
                  }`}
                >
                  <span className="font-bold">{scene.title}</span>
                  <span className="text-[10px] text-slate-400 truncate">{scene.genre}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tone Settings Button */}
          <button
            onClick={onOpenSettings}
            className={`flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-xl border transition shadow-xs ${
              isLight 
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-250' 
                : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-750'
            }`}
            title="تنظیمات لحن و بافت فیلم"
          >
            <Sliders className="w-3.5 h-3.5 text-orange-500" />
            <span>تنظیم لحن و کاراکترها</span>
          </button>

          {/* Movie Research Button */}
          {onOpenMovieResearch && (
            <button
              onClick={onOpenMovieResearch}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border transition shadow-xs cursor-pointer ${
                isResearched
                  ? 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 border-blue-500/30'
                  : (isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300' : 'bg-slate-850 hover:bg-slate-800 text-slate-300 border-slate-750')
              }`}
              title="تحقیق خودکار درباره فیلم، داستان و اسامی شخصیت‌ها"
            >
              <Search className="w-3.5 h-3.5 text-blue-400" />
              <span>{isResearched ? '🔍 فیلم تحقیق‌شده' : '🔍 تحقیق فیلم'}</span>
            </button>
          )}

          {/* Master Subtitle Style Learning Lab Button */}
          {onOpenStyleLearning && (
            <button
              onClick={onOpenStyleLearning}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border transition shadow-xs cursor-pointer ${
                activeStyleName
                  ? 'bg-purple-500/15 hover:bg-purple-500/25 text-purple-400 border-purple-500/40 ring-1 ring-purple-500/30'
                  : (isLight ? 'bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200' : 'bg-purple-950/40 hover:bg-purple-900/50 text-purple-300 border-purple-800/40')
              }`}
              title="آموزش هوش مصنوعی از زیرنویس مترجمان برتر (حمید، مووی‌جوان و...)"
            >
              <GraduationCap className="w-3.5 h-3.5 text-purple-400" />
              <span>{activeStyleName ? `🎓 سبک: ${activeStyleName}` : '🎓 آموزش سبک'}</span>
            </button>
          )}

          {/* Gemini API Key Button */}
          {onOpenApiKeyModal && (
            <button
              onClick={onOpenApiKeyModal}
              className={`flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl border transition shadow-xs cursor-pointer ${
                hasCustomApiKey
                  ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 dark:text-emerald-400 border-emerald-500/30'
                  : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 dark:text-amber-400 border-amber-500/30'
              }`}
              title="تنظیم کلید Gemini API جهت رهایی از خطای سهمیه و سرعت بی‌نهایت"
            >
              <Key className="w-3.5 h-3.5" />
              <span>{hasCustomApiKey ? '🔑 کلید Gemini فعال' : '🔑 تنظیم کلید Gemini'}</span>
            </button>
          )}

          {/* Watermark / Promo Credit Button */}
          {hasCues && onOpenWatermark && (
            <button
              onClick={onOpenWatermark}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border transition shadow-xs cursor-pointer ${
                isLight 
                  ? 'bg-orange-50/70 hover:bg-orange-100/70 text-orange-700 border-orange-200' 
                  : 'bg-orange-500/10 hover:bg-orange-500/20 text-orange-300 border-orange-500/30'
              }`}
              title="درج نام سایت، کانال یا امضای مترجم در فواصل سکوت"
            >
              <Megaphone className="w-3.5 h-3.5 text-orange-500" />
              <span>امضا و تبلیغات</span>
            </button>
          )}

          {/* Cinema Preview Button */}
          {hasCues && (
            <button
              onClick={onOpenCinemaPreview}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-600 dark:text-indigo-300 border border-indigo-500/30 transition shadow-xs"
              title="پیش‌نمایش سینمایی با زیرنویس آنلاین"
            >
              <Play className="w-3.5 h-3.5 text-indigo-500 fill-indigo-500" />
              <span>پخش سینمایی</span>
            </button>
          )}

          {/* Export Button */}
          {hasPersian && (
            <button
              onClick={onOpenExport}
              className="flex items-center gap-1.5 text-xs font-black px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 transition shadow-md shadow-amber-500/20"
            >
              <Download className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>دانلود خروجی (.SRT)</span>
            </button>
          )}

          {/* Theme Toggle Button */}
          <button
            onClick={onToggleTheme}
            className={`p-2 rounded-xl border transition shadow-xs flex items-center justify-center ${
              isLight 
                ? 'bg-slate-100 hover:bg-slate-200 text-amber-600 border-slate-250' 
                : 'bg-slate-900 hover:bg-slate-800 text-amber-400 border-slate-750'
            }`}
            title={isLight ? 'تغییر به تم تاریک (سینمایی)' : 'تغییر به تم روشن (روز)'}
          >
            {isLight ? <Moon className="w-4 h-4 text-slate-700" /> : <Sun className="w-4 h-4 text-amber-400" />}
          </button>
        </div>

        {/* Mobile / Tablet Compact Action Bar */}
        <div className="flex lg:hidden items-center gap-1.5">
          {/* API Key Button on Mobile Header */}
          {onOpenApiKeyModal && (
            <button
              onClick={onOpenApiKeyModal}
              className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold transition flex items-center gap-1 shadow-xs cursor-pointer ${
                hasCustomApiKey
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-600 dark:text-emerald-400'
                  : 'bg-amber-500/10 border-amber-500/40 text-amber-600 dark:text-amber-400'
              }`}
              title="مشاهده، تنظیم یا حذف کلید Gemini"
            >
              <Key className="w-3.5 h-3.5" />
              <span className="text-[11px] font-semibold">{hasCustomApiKey ? 'کلید فعال' : 'کلید API'}</span>
            </button>
          )}

          {/* Theme toggle mobile */}
          <button
            onClick={onToggleTheme}
            className={`p-2 rounded-lg border text-xs transition cursor-pointer ${
              isLight ? 'bg-slate-100 border-slate-300 text-slate-800' : 'bg-slate-900 border-slate-800 text-amber-400'
            }`}
            title="تغییر تم"
          >
            {isLight ? <Moon className="w-4 h-4 text-slate-700" /> : <Sun className="w-4 h-4 text-amber-400" />}
          </button>

          {/* Quick export mobile */}
          {hasPersian && (
            <button
              onClick={onOpenExport}
              className="p-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 text-slate-950 font-bold cursor-pointer"
              title="دانلود خروجی"
            >
              <Download className="w-4 h-4 stroke-[2.5]" />
            </button>
          )}

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`p-2 rounded-lg border transition cursor-pointer ${
              isLight ? 'bg-slate-100 border-slate-300 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-200'
            }`}
            aria-label="منوی موبایل"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>

      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className={`lg:hidden border-t p-4 space-y-3 animate-in fade-in duration-150 ${
          isLight ? 'bg-white border-slate-200' : 'bg-slate-950 border-slate-800'
        }`}>
          <div className="grid grid-cols-2 gap-2">
            {onOpenApiKeyModal && (
              <button
                onClick={() => {
                  onOpenApiKeyModal();
                  setMobileMenuOpen(false);
                }}
                className={`p-2.5 text-xs font-bold rounded-xl border flex items-center justify-center gap-2 cursor-pointer ${
                  hasCustomApiKey
                    ? (isLight ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-emerald-950/40 text-emerald-300 border-emerald-800')
                    : (isLight ? 'bg-amber-50 text-amber-800 border-amber-300' : 'bg-amber-950/40 text-amber-300 border-amber-800')
                }`}
              >
                <Key className="w-4 h-4 text-amber-500" />
                <span>{hasCustomApiKey ? 'مشاهده/حذف کلید API' : 'تنظیم کلید Gemini API'}</span>
              </button>
            )}

            {onOpenMovieResearch && (
              <button
                onClick={() => {
                  onOpenMovieResearch();
                  setMobileMenuOpen(false);
                }}
                className={`p-2.5 text-xs font-bold rounded-xl border flex items-center justify-center gap-2 cursor-pointer ${
                  isResearched
                    ? (isLight ? 'bg-blue-50 text-blue-800 border-blue-300' : 'bg-blue-950/40 text-blue-300 border-blue-800')
                    : (isLight ? 'bg-slate-100 text-slate-900 border-slate-200' : 'bg-slate-900 text-white border-slate-850')
                }`}
              >
                <Search className="w-4 h-4 text-blue-400" />
                <span>{isResearched ? 'فیلم تحقیق‌شده' : 'تحقیق درباره فیلم'}</span>
              </button>
            )}

            {onOpenStyleLearning && (
              <button
                onClick={() => {
                  onOpenStyleLearning();
                  setMobileMenuOpen(false);
                }}
                className={`p-2.5 text-xs font-bold rounded-xl border flex items-center justify-center gap-2 cursor-pointer ${
                  activeStyleName
                    ? (isLight ? 'bg-purple-50 text-purple-800 border-purple-300' : 'bg-purple-950/40 text-purple-300 border-purple-800')
                    : (isLight ? 'bg-slate-100 text-slate-900 border-slate-200' : 'bg-slate-900 text-white border-slate-850')
                }`}
              >
                <GraduationCap className="w-4 h-4 text-purple-400" />
                <span>{activeStyleName ? `سبک: ${activeStyleName}` : 'آموزش از زیرنویس الگو'}</span>
              </button>
            )}

            <button
              onClick={() => {
                onOpenSettings();
                setMobileMenuOpen(false);
              }}
              className={`p-2.5 text-xs font-bold rounded-xl border flex items-center justify-center gap-2 cursor-pointer ${
                isLight ? 'bg-slate-100 text-slate-900 border-slate-200' : 'bg-slate-900 text-white border-slate-850'
              }`}
            >
              <Sliders className="w-4 h-4 text-orange-500" />
              <span>تنظیم لحن و فیلم</span>
            </button>

            {hasCues && onOpenWatermark && (
              <button
                onClick={() => {
                  onOpenWatermark();
                  setMobileMenuOpen(false);
                }}
                className={`p-2.5 text-xs font-bold rounded-xl border flex items-center justify-center gap-2 ${
                  isLight ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-orange-950/60 text-orange-300 border-orange-800/50'
                }`}
              >
                <Megaphone className="w-4 h-4 text-orange-500" />
                <span>امضا و تبلیغات</span>
              </button>
            )}

            {hasCues && (
              <button
                onClick={() => {
                  onOpenCinemaPreview();
                  setMobileMenuOpen(false);
                }}
                className={`p-2.5 text-xs font-bold rounded-xl border flex items-center justify-center gap-2 ${
                  isLight ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-indigo-950/60 text-indigo-300 border-indigo-800/50'
                }`}
              >
                <Play className="w-4 h-4 fill-current" />
                <span>پخش سینمایی</span>
              </button>
            )}
          </div>

          {/* Sample scenes mobile list */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-850">
            <div className="text-[11px] font-semibold text-slate-400 mb-2 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>بارگذاری نمونه فیلم‌های سینمایی:</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {SAMPLE_SCENES.map((scene) => (
                <button
                  key={scene.id}
                  onClick={() => {
                    onLoadSample(scene);
                    setMobileMenuOpen(false);
                  }}
                  className={`p-2 text-right text-xs rounded-lg border transition ${
                    isLight 
                      ? 'bg-slate-50 border-slate-200 hover:bg-amber-50 text-slate-800' 
                      : 'bg-slate-900 border-slate-800 hover:bg-slate-850 text-slate-200'
                  }`}
                >
                  <div className="font-bold truncate">{scene.title}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
