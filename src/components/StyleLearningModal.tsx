import React, { useState, useEffect, useRef } from 'react';
import { 
  GraduationCap, 
  Upload, 
  Sparkles, 
  X, 
  Check, 
  Trash2, 
  FileText, 
  CheckCircle2, 
  Loader2, 
  Flame, 
  BookOpen, 
  ChevronDown, 
  ChevronUp, 
  Layers,
  ArrowRight
} from 'lucide-react';
import { LearnedStyleProfile, ThemeMode } from '../types/subtitle';

interface StyleLearningModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeStyleId?: string;
  onSelectActiveStyle: (style: LearnedStyleProfile | null) => void;
  apiKey?: string;
  theme: ThemeMode;
}

export const StyleLearningModal: React.FC<StyleLearningModalProps> = ({
  isOpen,
  onClose,
  activeStyleId,
  onSelectActiveStyle,
  apiKey,
  theme,
}) => {
  const [styles, setStyles] = useState<LearnedStyleProfile[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Upload inputs
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [customStyleName, setCustomStyleName] = useState<string>('');
  const [expandedStyleId, setExpandedStyleId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const isLight = theme === 'light';

  // Fetch list of saved styles
  const fetchStyles = async () => {
    setIsLoadingList(true);
    try {
      const res = await fetch('/api/style-learning/list');
      if (res.ok) {
        const data = await res.json();
        setStyles(data.styles || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingList(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStyles();
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    if (!customStyleName) {
      setCustomStyleName(file.name.replace(/\.[^/.]+$/, ''));
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setFileContent(event.target?.result as string || '');
    };
    reader.readAsText(file);
  };

  const handleStartLearning = async () => {
    if (!fileContent.trim()) {
      setErrorMsg('لطفاً ابتدا فایل زیرنویس الگو (.srt یا .vtt) را انتخاب کنید.');
      return;
    }

    setIsAnalyzing(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/style-learning/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey ? { 'x-gemini-key': apiKey } : {}),
        },
        body: JSON.stringify({
          srtContent: fileContent,
          fileName: selectedFile?.name || 'master_subtitle.srt',
          styleName: customStyleName,
          apiKey,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'خطا در تحلیل زیرنویس الگو');
      }

      const data = await res.json();
      if (data.style) {
        setStyles(data.allStyles || [data.style, ...styles]);
        setExpandedStyleId(data.style.id);
        setSuccessMsg(`سبک «${data.style.name}» با موفقیت یادگیری و در کتابخانه سبک‌ها ذخیره شد! 🎉`);
        setSelectedFile(null);
        setFileContent('');
        setCustomStyleName('');
        // Automatically activate the newly learned style
        onSelectActiveStyle(data.style);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'خطا در آموزش هوش مصنوعی از زیرنویس');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDeleteStyle = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/style-learning/${id}`, { method: 'DELETE' });
      if (res.ok) {
        const data = await res.json();
        setStyles(data.styles || styles.filter((s) => s.id !== id));
        if (activeStyleId === id) {
          onSelectActiveStyle(null);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`w-full max-w-3xl rounded-2xl border flex flex-col max-h-[92vh] shadow-2xl overflow-hidden transition-colors ${
          isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-100'
        }`}
      >
        {/* Header */}
        <div className={`p-4 sm:p-5 border-b flex items-center justify-between ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-slate-950 flex items-center justify-center font-bold shrink-0 shadow-md">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold flex items-center gap-2">
                <span>مرکز آموزش و یادگیری از زیرنویس‌های الگو</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/30 font-semibold">
                  Few-Shot Style Learning
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                فایل‌های زیرنویس ترجمه شده توسط مترجمان برتر را بارگذاری کنید تا هوش مصنوعی سبک، اصطلاحات و لحن آنها را برای ترجمه‌های آینده یاد بگیرد.
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
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 text-xs">
          {/* Upload New Reference Subtitle File */}
          <div className={`p-4 rounded-2xl border space-y-3 ${
            isLight ? 'bg-amber-50/50 border-amber-200' : 'bg-amber-500/5 border-amber-500/20'
          }`}>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-xs flex items-center gap-2 text-amber-500">
                <Upload className="w-4 h-4" />
                <span>بارگذاری فایل زیرنویس الگو برای یادگیری سبک:</span>
              </h3>
              <span className="text-[10px] text-slate-400">پشتیبانی از فایل‌های .srt و .vtt</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold mb-1">فایل زیرنویس مرجع (الگو):</label>
                <input
                  type="file"
                  accept=".srt,.vtt,.txt"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={`w-full p-2.5 rounded-xl border border-dashed transition flex items-center justify-center gap-2 cursor-pointer ${
                    selectedFile
                      ? (isLight ? 'bg-white border-amber-400 text-amber-700' : 'bg-slate-900 border-amber-500 text-amber-300')
                      : (isLight ? 'bg-white border-slate-300 text-slate-600 hover:border-amber-400' : 'bg-slate-950 border-slate-700 text-slate-300 hover:border-amber-500')
                  }`}
                >
                  <FileText className="w-4 h-4 text-amber-500" />
                  <span className="truncate max-w-[200px]">{selectedFile ? selectedFile.name : 'انتخاب فایل .srt از سیستم'}</span>
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-semibold mb-1">نام یا عنوان این سبک:</label>
                <input
                  type="text"
                  value={customStyleName}
                  onChange={(e) => setCustomStyleName(e.target.value)}
                  placeholder="مثلاً: سبک لاتی حمید - سریال میرزاپور"
                  className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none focus:border-amber-500 transition ${
                    isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-750 text-white'
                  }`}
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <p className="text-[10px] text-slate-400">
                هوش مصنوعی کل فایل را خوانده، ریتم جملات، واژگان اختصاصی و طرز شکستن خطوط را بیرون می‌کشد.
              </p>
              <button
                type="button"
                onClick={handleStartLearning}
                disabled={isAnalyzing || !fileContent}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:opacity-50 text-slate-950 font-bold text-xs transition flex items-center gap-1.5 shrink-0 shadow-md shadow-amber-500/20 cursor-pointer"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>در حال تحلیل و استخراج سبک...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>شروع یادگیری این سبک</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-950/50 border border-red-800 text-red-200 text-xs">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* List of Saved Learned Styles */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-xs flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-400" />
                <span>کتابخانه سبک‌های یادگیری‌شده ({styles.length}):</span>
              </h3>
              {activeStyleId && (
                <button
                  type="button"
                  onClick={() => onSelectActiveStyle(null)}
                  className="text-[11px] text-amber-500 hover:underline"
                >
                  غیرفعال‌سازی سبک اختصاصی (استفاده از تنظیمات عادی)
                </button>
              )}
            </div>

            {styles.length === 0 ? (
              <div className={`p-6 rounded-2xl border text-center space-y-2 ${
                isLight ? 'bg-slate-50 border-slate-200 text-slate-500' : 'bg-slate-950/40 border-slate-800 text-slate-400'
              }`}>
                <GraduationCap className="w-8 h-8 mx-auto text-slate-500" />
                <p className="font-semibold">هنوز هیچ سبک زیرنویسی آموزش داده نشده است.</p>
                <p className="text-[11px] opacity-75">
                  یک فایل زیرنویس از مترجم دلخواهتان را در بالا آپلود کنید تا سیستم لحن و سبک او را استخراج و برای همیشه ذخیره کند.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {styles.map((style) => {
                  const isActive = activeStyleId === style.id;
                  const isExpanded = expandedStyleId === style.id;

                  return (
                    <div
                      key={style.id}
                      className={`rounded-2xl border transition overflow-hidden ${
                        isActive
                          ? (isLight ? 'border-amber-500 bg-amber-50/60 ring-2 ring-amber-400/30' : 'border-amber-500/60 bg-amber-500/10 ring-1 ring-amber-500/30')
                          : (isLight ? 'border-slate-200 bg-white hover:border-slate-300' : 'border-slate-800 bg-slate-950/60 hover:border-slate-700')
                      }`}
                    >
                      {/* Card Header */}
                      <div
                        onClick={() => setExpandedStyleId(isExpanded ? null : style.id)}
                        className="p-3.5 flex items-center justify-between gap-3 cursor-pointer select-none"
                      >
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectActiveStyle(isActive ? null : style);
                            }}
                            className={`w-7 h-7 rounded-xl border flex items-center justify-center transition cursor-pointer ${
                              isActive
                                ? 'bg-amber-500 border-amber-600 text-slate-950'
                                : (isLight ? 'border-slate-300 hover:border-amber-500' : 'border-slate-700 hover:border-amber-500')
                            }`}
                            title={isActive ? 'غیرفعال‌سازی این سبک' : 'فعال‌سازی این سبک برای ترجمه'}
                          >
                            {isActive && <Check className="w-4 h-4 stroke-[3]" />}
                          </button>

                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-xs text-slate-100 dark:text-slate-100">{style.name}</span>
                              {isActive && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
                                  سبک فعال ترجمه
                                </span>
                              )}
                              {style.sourceFileName && (
                                <span className="text-[10px] text-slate-400 font-mono">
                                  ({style.sourceFileName})
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                              {style.description || style.toneSummary}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => handleDeleteStyle(style.id, e)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 transition"
                            title="حذف این سبک"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <div className="text-slate-400">
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </div>
                        </div>
                      </div>

                      {/* Card Expanded Details */}
                      {isExpanded && (
                        <div className={`p-4 border-t space-y-3.5 text-[11px] ${
                          isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/90 border-slate-850'
                        }`}>
                          {style.toneSummary && (
                            <div>
                              <span className="font-bold text-amber-500">🎯 دستورالعمل لحن استخراج‌شده: </span>
                              <span className="opacity-90">{style.toneSummary}</span>
                            </div>
                          )}

                          {style.slangFormulas && style.slangFormulas.length > 0 && (
                            <div className="space-y-1">
                              <span className="font-bold text-purple-400">🔥 فرمول‌های کلامی و تکیه‌کلام‌های خاص مترجم:</span>
                              <ul className="list-disc list-inside space-y-0.5 pr-2 opacity-90">
                                {style.slangFormulas.map((formula, i) => (
                                  <li key={i}>{formula}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {style.keyVocabulary && style.keyVocabulary.length > 0 && (
                            <div className="space-y-1">
                              <span className="font-bold text-emerald-400">📖 معادل‌های واژگانی شناسایی‌شده:</span>
                              <div className="flex flex-wrap gap-1.5 pt-1">
                                {style.keyVocabulary.map((vocab, i) => (
                                  <div
                                    key={i}
                                    className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-300"
                                  >
                                    <span className="font-mono text-slate-400">{vocab.en}</span>
                                    <span> ⬅️ </span>
                                    <span className="font-bold">{vocab.fa}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {style.fewShotSamples && style.fewShotSamples.length > 0 && (
                            <div className="space-y-1.5 pt-1">
                              <span className="font-bold text-blue-400">✨ نمونه جملات الگو (Few-Shot Pairs):</span>
                              <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                                {style.fewShotSamples.map((sample, i) => (
                                  <div
                                    key={i}
                                    className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex flex-col gap-0.5"
                                  >
                                    <div className="text-slate-400 font-mono text-[10px]">{sample.en}</div>
                                    <div className="text-amber-300 font-bold">{sample.fa}</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="pt-2 flex justify-end">
                            <button
                              type="button"
                              onClick={() => onSelectActiveStyle(isActive ? null : style)}
                              className={`px-4 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-1.5 ${
                                isActive
                                  ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30'
                                  : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md'
                              }`}
                            >
                              {isActive ? 'غیرفعال‌سازی این سبک' : '✅ انتخاب و فعال‌سازی این سبک برای ترجمه'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className={`p-4 border-t flex items-center justify-between ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/70 border-slate-800'
        }`}>
          <div className="text-[11px] text-slate-400">
            {activeStyleId ? (
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                <span>سبک اختصاصی برای ترجمه فعال است.</span>
              </span>
            ) : (
              <span>از سبک پیش‌فرض استاندارد استفاده می‌شود.</span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition cursor-pointer"
          >
            بستن
          </button>
        </div>
      </div>
    </div>
  );
};
