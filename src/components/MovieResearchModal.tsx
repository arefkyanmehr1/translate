import React, { useState } from 'react';
import { Search, Sparkles, X, Check, BookOpen, Users, HelpCircle, Film, Globe2, Loader2, ArrowRight } from 'lucide-react';
import { MovieResearchData, ThemeMode } from '../types/subtitle';

interface MovieResearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentMovieTitle: string;
  researchedData?: MovieResearchData;
  onApplyResearch: (data: MovieResearchData) => void;
  apiKey?: string;
  theme: ThemeMode;
}

export const MovieResearchModal: React.FC<MovieResearchModalProps> = ({
  isOpen,
  onClose,
  currentMovieTitle,
  researchedData,
  onApplyResearch,
  apiKey,
  theme,
}) => {
  const [movieName, setMovieName] = useState(currentMovieTitle || '');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<MovieResearchData | null>(researchedData || null);

  React.useEffect(() => {
    if (currentMovieTitle && !movieName) {
      setMovieName(currentMovieTitle);
    }
  }, [currentMovieTitle]);

  React.useEffect(() => {
    if (researchedData) {
      setResult(researchedData);
    }
  }, [researchedData]);

  if (!isOpen) return null;

  const isLight = theme === 'light';

  const handleStartResearch = async (titleToResearch?: string) => {
    const title = (titleToResearch || movieName).trim();
    if (!title) {
      setErrorMsg('لطفاً نام فیلم یا سریال را وارد کنید (مثلاً: Mirzapur یا Dexter)');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/movie/research', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey ? { 'x-gemini-key': apiKey } : {}),
        },
        body: JSON.stringify({
          movieTitle: title,
          apiKey,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'خطا در تحقیق درباره اثر');
      }

      const json = await res.json();
      if (json.data) {
        setResult(json.data);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'خطا در ارتباط با هوش مصنوعی برای تحقیق اثر');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = () => {
    if (result) {
      onApplyResearch(result);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`w-full max-w-2xl rounded-2xl border flex flex-col max-h-[92vh] shadow-2xl overflow-hidden transition-colors ${
          isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-100'
        }`}
      >
        {/* Header */}
        <div className={`p-4 sm:p-5 border-b flex items-center justify-between ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/30 flex items-center justify-center shrink-0">
              <Search className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold flex items-center gap-1.5">
                <span>تحقیق خودکار درباره فیلم و کاراکترها</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20 font-semibold">
                  جلوگیری از سوتی و اشتباه اسامی
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                استخراج خلاصه داستان، لحن، املای رسمی اسامی (مثل آکاندا، گودو، دکستر) و اصطلاحات خاص
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

        {/* Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs">
          {/* Movie Title Input & Quick Search */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold">نام فیلم یا سریال (انگلیسی یا فارسی):</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={movieName}
                  onChange={(e) => setMovieName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleStartResearch()}
                  placeholder="مثلاً: Mirzapur یا Dexter یا Peaky Blinders..."
                  className={`w-full pl-9 pr-3 py-2.5 rounded-xl border text-xs focus:outline-none focus:border-blue-500 transition ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-750 text-white'
                  }`}
                />
                <Film className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
              <button
                type="button"
                onClick={() => handleStartResearch()}
                disabled={isLoading || !movieName.trim()}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs transition flex items-center gap-1.5 shrink-0 shadow-md shadow-blue-600/20 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>در حال تحقیق...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>تحقیق چند ثانیه‌ای</span>
                  </>
                )}
              </button>
            </div>

            {/* Quick Suggestions */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[11px] text-slate-400">
              <span>پیشنهادات سریع:</span>
              {['Mirzapur', 'Dexter', 'Peaky Blinders', 'Breaking Bad', 'The Godfather'].map((title) => (
                <button
                  key={title}
                  type="button"
                  onClick={() => {
                    setMovieName(title);
                    handleStartResearch(title);
                  }}
                  className="px-2 py-0.5 rounded-md bg-slate-800/40 hover:bg-slate-800 border border-slate-700/60 text-slate-300 transition"
                >
                  {title}
                </button>
              ))}
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-950/50 border border-red-800 text-red-200 text-xs">
              {errorMsg}
            </div>
          )}

          {/* Research Results View */}
          {result && (
            <div className="space-y-4 animate-in fade-in pt-2">
              {/* Summary Card */}
              <div className={`p-4 rounded-xl border space-y-2 ${
                isLight ? 'bg-blue-50/60 border-blue-200' : 'bg-blue-950/20 border-blue-900/40'
              }`}>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h3 className="font-black text-sm text-blue-500 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4" />
                    <span>خلاصه و اتمسفر: {result.movieTitle} {result.year ? `(${result.year})` : ''}</span>
                  </h3>
                  {result.genre && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      {result.genre}
                    </span>
                  )}
                </div>
                <p className="text-xs leading-relaxed opacity-90">{result.summary}</p>
                {result.tone && (
                  <div className="text-[11px] text-amber-500 font-semibold pt-1">
                    🎯 لحن پیشنهادی: {result.tone}
                  </div>
                )}
              </div>

              {/* Character Names Dictionary */}
              {result.characters && result.characters.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-bold text-xs flex items-center gap-1.5 text-slate-300">
                    <Users className="w-4 h-4 text-purple-400" />
                    <span>واژه‌نامه اسامی شخصیت‌ها (جلوگیری از اشتباه آکاندا با آخاند و...):</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {result.characters.map((char, idx) => (
                      <div
                        key={idx}
                        className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 ${
                          isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'
                        }`}
                      >
                        <div>
                          <div className="font-bold text-xs text-amber-400">{char.fa}</div>
                          <div className="text-[11px] font-mono text-slate-400">{char.en}</div>
                        </div>
                        {char.role && (
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 max-w-[120px] truncate text-left">
                            {char.role}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Key Story Glossary */}
              {result.keyGlossary && result.keyGlossary.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-bold text-xs flex items-center gap-1.5 text-slate-300">
                    <Globe2 className="w-4 h-4 text-emerald-400" />
                    <span>اصطلاحات و واژگان کلیدی داستان:</span>
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {result.keyGlossary.map((item, idx) => (
                      <div
                        key={idx}
                        className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[11px] flex items-center gap-1.5"
                      >
                        <span className="font-mono text-slate-400">{item.term}:</span>
                        <span className="font-bold">{item.fa}</span>
                        {item.note && <span className="opacity-75 text-[10px]">({item.note})</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Cultural Notes */}
              {result.culturalNotes && (
                <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/50 text-slate-300 text-[11px] leading-relaxed">
                  <span className="font-bold text-amber-400">💡 نکات فرهنگی و بومی: </span>
                  {result.culturalNotes}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`p-4 border-t flex items-center justify-between ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/70 border-slate-800'
        }`}>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs text-slate-400 hover:text-slate-200 transition cursor-pointer"
          >
            انصراف
          </button>

          {result && (
            <button
              type="button"
              onClick={handleApply}
              className="px-5 py-2 text-xs font-black bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl transition shadow-md shadow-blue-500/20 flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>اعمال نتایج در تنظیمات ترجمه فیلم</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
