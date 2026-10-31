import React, { useState, useRef } from 'react';
import { FileText, Upload, Sparkles, Check, RefreshCw } from 'lucide-react';
import { parseSrtOrVtt } from '../utils/subtitleParser';
import { SubtitleCue, SampleScene, ThemeMode } from '../types/subtitle';
import { SAMPLE_SCENES } from '../data/sampleScenes';

interface SubtitleUploaderProps {
  cues: SubtitleCue[];
  onSubtitlesLoaded: (cues: SubtitleCue[], sourceName: string) => void;
  onLoadSample: (scene: SampleScene) => void;
  onClear: () => void;
  theme: ThemeMode;
}

export const SubtitleUploader: React.FC<SubtitleUploaderProps> = ({
  cues,
  onSubtitlesLoaded,
  onLoadSample,
  onClear,
  theme,
}) => {
  const isLight = theme === 'light';
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [pastedText, setPastedText] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const parsed = parseSrtOrVtt(text);
      if (parsed.length > 0) {
        onSubtitlesLoaded(parsed, file.name);
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleParsePasted = () => {
    if (!pastedText.trim()) return;
    const parsed = parseSrtOrVtt(pastedText);
    if (parsed.length > 0) {
      onSubtitlesLoaded(parsed, 'متن وارد شده');
    }
  };

  return (
    <div className={`border rounded-2xl p-4 shadow-xs transition-colors ${
      isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
    }`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500 dark:text-amber-400">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h3 className={`text-xs font-bold flex items-center gap-1.5 ${
              isLight ? 'text-slate-900' : 'text-white'
            }`}>
              <span>زیرنویس خارجی (SRT / VTT)</span>
              {cues.length > 0 && (
                <span className="text-[10px] text-amber-600 dark:text-amber-300 font-mono bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 font-bold">
                  {cues.length.toLocaleString('fa-IR')} دیالوگ بارگذاری شد
                </span>
              )}
            </h3>
            <p className="text-[11px] text-slate-400">
              فایل زیرنویس فیلم (حتی ۴۰۰۰+ دیالوگ کامل فیلم سینمایی) را بارگذاری کنید
            </p>
          </div>
        </div>

        {cues.length > 0 && (
          <button
            onClick={onClear}
            className="text-[11px] text-slate-400 hover:text-red-500 flex items-center gap-1 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">فایل جدید</span>
          </button>
        )}
      </div>

      {cues.length === 0 ? (
        <div className="space-y-3">
          {/* Tabs */}
          <div className={`flex border-b text-xs ${
            isLight ? 'border-slate-200' : 'border-slate-800'
          }`}>
            <button
              onClick={() => setActiveTab('upload')}
              className={`pb-2 px-3 font-semibold transition border-b-2 ${
                activeTab === 'upload'
                  ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                  : 'border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              آپلود فایل (.srt یا .vtt)
            </button>
            <button
              onClick={() => setActiveTab('paste')}
              className={`pb-2 px-3 font-semibold transition border-b-2 ${
                activeTab === 'paste'
                  ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                  : 'border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              وارد کردن مستقیم متن
            </button>
          </div>

          {activeTab === 'upload' ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-5 sm:p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 ${
                dragOver
                  ? 'border-amber-500 bg-amber-500/10'
                  : isLight
                  ? 'border-slate-300 hover:border-amber-500 bg-slate-50'
                  : 'border-slate-800 hover:border-slate-700 bg-slate-950/40'
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
                <Upload className="w-5 h-5" />
              </div>
              <div className={`text-xs font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>
                فایل زیرنویس فیلم را اینجا بکشید یا برای انتخاب کلیک کنید
              </div>
              <div className="text-[11px] text-slate-400">
                پشتیبانی از فیلم‌های کامل تا ۵۰۰۰ سطر دیالوگ با فرمت‌های .srt, .vtt, .txt
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".srt,.vtt,.txt"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                }}
                className="hidden"
              />
            </div>
          ) : (
            <div className="space-y-2">
              <textarea
                rows={4}
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder={`1\n00:00:01,000 --> 00:00:03,500\nWhat the hell are you doing here, man?\n\n2\n00:00:04,000 --> 00:00:06,000\nDon't mess with me.`}
                className={`w-full px-3 py-2 text-xs font-mono rounded-xl border focus:outline-none focus:border-amber-500 ${
                  isLight 
                    ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400' 
                    : 'bg-slate-950 border-slate-800 text-slate-200 placeholder-slate-600'
                }`}
              />
              <button
                type="button"
                onClick={handleParsePasted}
                disabled={!pastedText.trim()}
                className={`w-full py-2 text-xs font-bold rounded-xl transition disabled:opacity-50 ${
                  isLight 
                    ? 'bg-slate-800 hover:bg-slate-900 text-white' 
                    : 'bg-slate-800 hover:bg-slate-700 text-white'
                }`}
              >
                تایید و بارگذاری زیرنویس
              </button>
            </div>
          )}

          {/* Quick sample chips */}
          <div className={`pt-2 border-t ${
            isLight ? 'border-slate-100' : 'border-slate-800/60'
          }`}>
            <div className="text-[11px] font-medium text-slate-400 mb-1.5 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>یا یکی از صحنه‌های معروف زیر را بارگذاری کنید:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {SAMPLE_SCENES.map((scene) => (
                <button
                  key={scene.id}
                  type="button"
                  onClick={() => onLoadSample(scene)}
                  className={`px-2.5 py-1 text-[11px] rounded-lg border transition ${
                    isLight 
                      ? 'bg-slate-100 hover:bg-amber-50 hover:border-amber-400 text-slate-800 border-slate-250' 
                      : 'bg-slate-800/80 hover:bg-amber-500/10 hover:border-amber-500/40 hover:text-amber-300 border-slate-750 text-slate-300'
                  }`}
                >
                  {scene.title}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800/80'
        }`}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
              <Check className="w-4 h-4" />
            </div>
            <div>
              <div className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                زیرنویس فیلم آماده ترجمه است
              </div>
              <div className="text-[11px] text-slate-400">
                {cues.length.toLocaleString('fa-IR')} سطر • شروع: {cues[0]?.startTime} • پایان: {cues[cues.length - 1]?.endTime}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
