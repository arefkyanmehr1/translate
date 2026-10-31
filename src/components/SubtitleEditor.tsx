import React, { useState, useMemo } from 'react';
import { 
  Play, 
  Volume2, 
  Wand2, 
  Edit3, 
  Check, 
  Copy, 
  Search, 
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Filter,
  CheckCircle2,
  Clock,
  ArrowRight,
  Megaphone
} from 'lucide-react';
import { SubtitleCue, ThemeMode } from '../types/subtitle';

interface SubtitleEditorProps {
  cues: SubtitleCue[];
  currentTime: number;
  onSeek: (time: number) => void;
  onUpdateCueText: (id: number, newPersian: string) => void;
  onOpenRefineModal: (cue: SubtitleCue) => void;
  onSpeakLine: (text: string) => void;
  isSpeaking: boolean;
  speakingCueId: number | null;
  theme: ThemeMode;
  onStartTranslation?: () => void;
  isTranslating?: boolean;
  onStripAudioDescriptions?: () => void;
}

export const SubtitleEditor: React.FC<SubtitleEditorProps> = ({
  cues,
  currentTime,
  onSeek,
  onUpdateCueText,
  onOpenRefineModal,
  onSpeakLine,
  isSpeaking,
  speakingCueId,
  theme,
  onStartTranslation,
  isTranslating,
  onStripAudioDescriptions,
}) => {
  const isLight = theme === 'light';

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'translated' | 'untranslated' | 'slang'>('all');
  const [pageSize, setPageSize] = useState<number>(50);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [jumpCueId, setJumpCueId] = useState<string>('');
  
  const [editingId, setEditingId] = useState<number | null>(null);
  const [tempText, setTempText] = useState('');
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // Filtered list
  const filteredCues = useMemo(() => {
    return cues.filter((c) => {
      // Filter tab
      if (filterType === 'translated' && !c.persianText) return false;
      if (filterType === 'untranslated' && !!c.persianText) return false;
      if (filterType === 'slang' && !c.slangNote) return false;

      // Search query
      if (!searchTerm.trim()) return true;
      const q = searchTerm.toLowerCase();
      return (
        c.originalText.toLowerCase().includes(q) ||
        (c.persianText && c.persianText.includes(searchTerm)) ||
        (c.slangNote && c.slangNote.includes(searchTerm)) ||
        c.id.toString() === searchTerm.trim()
      );
    });
  }, [cues, filterType, searchTerm]);

  // Pagination calculation
  const totalPages = pageSize === 0 ? 1 : Math.ceil(filteredCues.length / pageSize) || 1;
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedCues = useMemo(() => {
    if (pageSize === 0) return filteredCues; // show all
    const start = (safeCurrentPage - 1) * pageSize;
    return filteredCues.slice(start, start + pageSize);
  }, [filteredCues, safeCurrentPage, pageSize]);

  const handleJumpToCue = (e: React.FormEvent) => {
    e.preventDefault();
    const id = parseInt(jumpCueId.trim());
    if (isNaN(id)) return;

    // Find cue index in filtered list
    const index = filteredCues.findIndex((c) => c.id === id);
    if (index !== -1) {
      if (pageSize > 0) {
        const targetPage = Math.floor(index / pageSize) + 1;
        setCurrentPage(targetPage);
      }
      setJumpCueId('');
    }
  };

  const startEditing = (cue: SubtitleCue) => {
    setEditingId(cue.id);
    setTempText(cue.persianText || '');
  };

  const saveEditing = (id: number) => {
    onUpdateCueText(id, tempText);
    setEditingId(null);
  };

  const handleCopy = (id: number, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <div className={`border rounded-2xl overflow-hidden shadow-xs flex flex-col transition-colors ${
      isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
    }`}>
      
      {/* Top Search & Filter Bar */}
      <div className={`p-3.5 border-b flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 ${
        isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/80 border-slate-800'
      }`}>
        
        {/* Search Input & Jump To */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="جستجو در دیالوگ‌ها یا اصطلاحات..."
              className={`pl-3 pr-8 py-1.5 rounded-xl border text-xs focus:outline-none focus:border-amber-500 w-full sm:w-60 transition ${
                isLight 
                  ? 'bg-white border-slate-300 text-slate-900 placeholder-slate-400' 
                  : 'bg-slate-900 border-slate-750 text-white placeholder-slate-500'
              }`}
            />
          </div>

          {/* Jump to specific cue # */}
          <form onSubmit={handleJumpToCue} className="flex items-center gap-1">
            <input
              type="number"
              value={jumpCueId}
              onChange={(e) => setJumpCueId(e.target.value)}
              placeholder="پرش به #"
              className={`w-20 px-2 py-1.5 rounded-xl border text-xs text-center focus:outline-none focus:border-amber-500 font-mono transition ${
                isLight 
                  ? 'bg-white border-slate-300 text-slate-900 placeholder-slate-400' 
                  : 'bg-slate-900 border-slate-750 text-white placeholder-slate-500'
              }`}
            />
            <button
              type="submit"
              className={`px-2 py-1.5 rounded-xl border text-xs font-semibold transition ${
                isLight ? 'bg-slate-200 hover:bg-slate-300 text-slate-800 border-slate-300' : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
              title="پرش به شماره سطر"
            >
              برو
            </button>
          </form>
        </div>

        {/* Filter Tabs & Quick Start Button */}
        <div className="flex flex-wrap items-center gap-2 py-0.5 text-xs">
          {onStartTranslation && cues.some(c => !c.persianText) && (
            <button
              onClick={onStartTranslation}
              disabled={isTranslating}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-red-600 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs shadow-md transition cursor-pointer shrink-0"
            >
              <Wand2 className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>{isTranslating ? 'در حال ترجمه در سرور...' : '⚡ شروع ترجمه این دیالوگ‌ها'}</span>
            </button>
          )}

          {[
            { id: 'all', label: `همه (${cues.length})` },
            { id: 'translated', label: `ترجمه شده (${cues.filter(c => !!c.persianText).length})` },
            { id: 'untranslated', label: `باقی‌مانده (${cues.filter(c => !c.persianText).length})` },
            { id: 'slang', label: `اصطلاحات (${cues.filter(c => !!c.slangNote).length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setFilterType(tab.id as any);
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1 rounded-lg font-medium transition shrink-0 ${
                filterType === tab.id
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                  : isLight
                  ? 'text-slate-600 hover:bg-slate-200'
                  : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}

          {onStripAudioDescriptions && (
            <button
              type="button"
              onClick={onStripAudioDescriptions}
              className={`px-2.5 py-1 rounded-lg font-semibold transition shrink-0 flex items-center gap-1 text-[11px] cursor-pointer ${
                isLight
                  ? 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200'
                  : 'bg-purple-950/40 text-purple-300 hover:bg-purple-900/50 border border-purple-800/40'
              }`}
              title="حذف توصیفات صوتی مانند صدای سرفه، موزیک، صدای شلیک و افکت‌های ناشنوایان از دیالوگ‌ها"
            >
              <span>🧹</span>
              <span>حذف سرفه/موزیک (SDH)</span>
            </button>
          )}
        </div>

      </div>

      {/* Pagination Controls Bar */}
      <div className={`px-4 py-2 border-b flex flex-wrap items-center justify-between gap-2 text-xs ${
        isLight ? 'bg-slate-100/70 border-slate-200 text-slate-600' : 'bg-slate-950/40 border-slate-800 text-slate-400'
      }`}>
        <div className="flex items-center gap-2">
          <span>نمایش صفحه {safeCurrentPage} از {totalPages}</span>
          <span className="text-[11px] opacity-70">({filteredCues.length} سطر یافت شد)</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Page size dropdown */}
          <div className="flex items-center gap-1 text-[11px]">
            <span>تعداد در صفحه:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(parseInt(e.target.value));
                setCurrentPage(1);
              }}
              className={`px-2 py-1 rounded-lg border text-xs focus:outline-none ${
                isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-slate-900 border-slate-700 text-white'
              }`}
            >
              <option value="25">۲۵ سطر</option>
              <option value="50">۵۰ سطر</option>
              <option value="100">۱۰۰ سطر</option>
              <option value="250">۲۵۰ سطر</option>
              <option value="500">۵۰۰ سطر</option>
              <option value="0">نمایش همه (All)</option>
            </select>
          </div>

          {/* Nav arrows */}
          {pageSize > 0 && totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                disabled={safeCurrentPage <= 1}
                onClick={() => setCurrentPage(1)}
                className="p-1 rounded-md border disabled:opacity-30 hover:bg-amber-500 hover:text-slate-950 transition"
                title="صفحه اول"
              >
                <ChevronsRight className="w-3.5 h-3.5" />
              </button>
              <button
                disabled={safeCurrentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1 rounded-md border disabled:opacity-30 hover:bg-amber-500 hover:text-slate-950 transition"
                title="صفحه قبلی"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <span className="px-2 font-mono font-bold">{safeCurrentPage}</span>
              <button
                disabled={safeCurrentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-1 rounded-md border disabled:opacity-30 hover:bg-amber-500 hover:text-slate-950 transition"
                title="صفحه بعدی"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                disabled={safeCurrentPage >= totalPages}
                onClick={() => setCurrentPage(totalPages)}
                className="p-1 rounded-md border disabled:opacity-30 hover:bg-amber-500 hover:text-slate-950 transition"
                title="صفحه آخر"
              >
                <ChevronsLeft className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Subtitles Comparative List */}
      <div className="divide-y divide-slate-200 dark:divide-slate-800/80 max-h-[580px] overflow-y-auto">
        {paginatedCues.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            دیالوگی با شرایط انتخابی پیدا نشد.
          </div>
        ) : (
          paginatedCues.map((cue) => {
            const isActive = currentTime >= cue.startSeconds && currentTime <= cue.endSeconds;
            const isEditing = editingId === cue.id;

            return (
              <div
                key={cue.id}
                className={`p-3.5 sm:p-4 transition flex flex-col md:flex-row gap-3 items-start justify-between ${
                  isActive
                    ? isLight 
                      ? 'bg-amber-50 border-r-4 border-amber-500' 
                      : 'bg-amber-500/10 border-r-4 border-amber-500'
                    : isLight
                    ? 'hover:bg-slate-50'
                    : 'hover:bg-slate-850/50'
                }`}
              >
                
                {/* Left side: Timecode & Foreign dialogue */}
                <div className="w-full md:w-5/12 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onSeek(cue.startSeconds)}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-mono flex items-center gap-1 transition ${
                        isLight
                          ? 'bg-slate-200 hover:bg-amber-100 text-slate-700 hover:text-amber-800'
                          : 'bg-slate-800 hover:bg-amber-500/20 text-slate-400 hover:text-amber-300'
                      }`}
                      title="پرش به این ثانیه در پخش‌کننده"
                    >
                      <Play className="w-2.5 h-2.5 fill-current" />
                      <span>{cue.startTime}</span>
                    </button>
                    <span className="text-[10px] text-slate-400 font-mono">➔ {cue.endTime}</span>
                    <span className="text-[10px] text-slate-400 font-mono font-bold">#{cue.id}</span>
                    {cue.isPromo && (
                      <span className="px-2 py-0.5 rounded text-[10px] bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/30 font-bold flex items-center gap-1">
                        <Megaphone className="w-2.5 h-2.5" />
                        <span>امضا / تبلیغات</span>
                      </span>
                    )}
                  </div>

                  <p className={`text-xs sm:text-[13px] font-mono text-left dir-ltr leading-relaxed ${
                    isLight ? 'text-slate-800' : 'text-slate-200'
                  }`}>
                    {cue.originalText}
                  </p>
                </div>

                {/* Right side: Persian street translation */}
                <div className="w-full md:w-7/12 space-y-2">
                  {isEditing ? (
                    <div className="flex flex-col gap-2">
                      <textarea
                        rows={2}
                        value={tempText}
                        onChange={(e) => setTempText(e.target.value)}
                        className={`w-full p-2.5 rounded-xl border text-xs sm:text-sm focus:outline-none ${
                          isLight 
                            ? 'bg-white border-amber-500 text-slate-900' 
                            : 'bg-slate-950 border-amber-500/60 text-white'
                        }`}
                        autoFocus
                      />
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-2.5 py-1 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-white"
                        >
                          انصراف
                        </button>
                        <button
                          onClick={() => saveEditing(cue.id)}
                          className="px-3 py-1 text-xs font-bold bg-amber-500 text-slate-950 rounded-lg hover:bg-amber-400 transition flex items-center gap-1 shadow-xs"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>تایید ویرایش</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      {cue.persianText ? (
                        <div className="group/item">
                          <div className="text-xs sm:text-[14px] font-bold leading-relaxed tracking-wide flex items-baseline justify-between gap-2">
                            <span className={isLight ? 'text-amber-900 font-extrabold' : 'text-amber-200'}>
                              {cue.persianText}
                            </span>
                            {cue.isEdited && (
                              <span className="text-[9px] text-slate-400 bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded shrink-0">
                                ویرایش دستی
                              </span>
                            )}
                          </div>

                          {/* Slang Note & Alternative pill */}
                          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                            {cue.slangNote && (
                              <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border ${
                                isLight
                                  ? 'bg-amber-50 border-amber-300 text-amber-800'
                                  : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                              }`}>
                                <BookOpen className="w-3 h-3" />
                                <span>{cue.slangNote}</span>
                              </span>
                            )}

                            {cue.alternative && (
                              <button
                                onClick={() => onUpdateCueText(cue.id, cue.alternative!)}
                                className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full transition ${
                                  isLight
                                    ? 'bg-slate-100 hover:bg-amber-100 text-slate-600 hover:text-amber-800'
                                    : 'bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-amber-300'
                                }`}
                                title="کلیک برای جایگزینی با این لحن"
                              >
                                <span>طرح دیگر: «{cue.alternative}»</span>
                              </button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs text-slate-400 italic">
                          در انتظار شروع ترجمه...
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions row for cue */}
                  <div className={`flex items-center justify-between pt-1 border-t text-xs ${
                    isLight ? 'border-slate-100' : 'border-slate-800/40'
                  }`}>
                    <div className="flex items-center gap-1">
                      {/* TTS Speak Line */}
                      {cue.persianText && (
                        <button
                          onClick={() => onSpeakLine(cue.persianText!)}
                          disabled={isSpeaking && speakingCueId === cue.id}
                          className="p-1 rounded-lg text-slate-400 hover:text-amber-500 transition flex items-center gap-1 text-[11px]"
                          title="گوش دادن به اجرای صوتی دیالوگ"
                        >
                          <Volume2 className={`w-3.5 h-3.5 ${isSpeaking && speakingCueId === cue.id ? 'animate-pulse text-amber-500' : ''}`} />
                          <span className="hidden sm:inline">اجرای صوتی</span>
                        </button>
                      )}

                      {/* Quick Refine modal */}
                      <button
                        onClick={() => onOpenRefineModal(cue)}
                        className="p-1 rounded-lg text-slate-400 hover:text-orange-500 transition flex items-center gap-1 text-[11px]"
                        title="بازنویسی و تغییر لحن این سطر با هوش مصنوعی"
                      >
                        <Wand2 className="w-3.5 h-3.5 text-orange-500" />
                        <span className="hidden sm:inline">بازنویسی هوشمند</span>
                      </button>

                      {/* Manual edit */}
                      <button
                        onClick={() => startEditing(cue)}
                        className="p-1 rounded-lg text-slate-400 hover:text-blue-500 transition flex items-center gap-1 text-[11px]"
                        title="ویرایش دستی متن"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">ویرایش</span>
                      </button>
                    </div>

                    {/* Copy button */}
                    {cue.persianText && (
                      <button
                        onClick={() => handleCopy(cue.id, cue.persianText!)}
                        className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-md transition"
                        title="کپی متن فارسی"
                      >
                        {copiedId === cue.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>

                </div>

              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
