import React, { useState } from 'react';
import { X, Download, Copy, Check, CheckCircle2 } from 'lucide-react';
import { SubtitleCue, ThemeMode } from '../types/subtitle';
import { generateSrtContent, generateVttContent, generateBilingualScript, downloadFile } from '../utils/subtitleParser';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  cues: SubtitleCue[];
  movieTitle?: string;
  theme: ThemeMode;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  cues,
  movieTitle = 'StreetSub_Movie',
  theme,
}) => {
  const isLight = theme === 'light';
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'srt' | 'vtt' | 'bilingual'>('srt');

  if (!isOpen) return null;

  const srtContent = generateSrtContent(cues, true);
  const vttContent = generateVttContent(cues, true);
  const bilingualContent = generateBilingualScript(cues);

  const getActiveContent = () => {
    switch (activeTab) {
      case 'srt': return srtContent;
      case 'vtt': return vttContent;
      case 'bilingual': return bilingualContent;
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getActiveContent());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const cleanName = movieTitle.replace(/[^a-zA-Z0-9_\u0600-\u06FF]/g, '_');
    if (activeTab === 'srt') {
      downloadFile(srtContent, `${cleanName}_Persian_Street.srt`, true);
    } else if (activeTab === 'vtt') {
      downloadFile(vttContent, `${cleanName}_Persian_Street.vtt`, false);
    } else {
      downloadFile(bilingualContent, `${cleanName}_Bilingual_Script.txt`, true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className={`border rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col overflow-hidden transition-colors ${
          isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`p-4 border-b flex items-center justify-between ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold">
                دریافت و دانلود زیرنویس ترجمه شده
              </h3>
              <p className="text-[11px] text-slate-400">
                فرمت استاندارد UTF-8 با تضمین خوانش صحیح فارسی در تمام پلیرها (VLC، KMPlayer، پات‌پلیر)
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
        <div className="p-4 sm:p-5 space-y-4">
          
          {/* Format Tabs */}
          <div className="flex gap-2">
            {[
              { id: 'srt', label: 'فرمت SRT استاندارد', ext: '.srt' },
              { id: 'vtt', label: 'فرمت WebVTT', ext: '.vtt' },
              { id: 'bilingual', label: 'فیلم‌نامه دوزبانه (EN + FA)', ext: '.txt' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 py-2 px-2.5 text-xs rounded-xl border font-bold transition text-center ${
                  activeTab === tab.id
                    ? isLight
                      ? 'border-amber-500 bg-amber-50 text-amber-900'
                      : 'border-amber-500 bg-amber-500/10 text-amber-300'
                    : isLight
                    ? 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Preview Box */}
          <div className="relative">
            <pre className={`w-full h-52 sm:h-56 p-3.5 rounded-xl border text-[11px] font-mono overflow-y-auto whitespace-pre-wrap leading-relaxed ${
              isLight ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-slate-950 border-slate-800 text-slate-300'
            }`}>
              {getActiveContent()}
            </pre>
            <button
              onClick={handleCopy}
              className={`absolute top-2.5 left-2.5 flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] border transition shadow-xs ${
                isLight ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300' : 'bg-slate-850 hover:bg-slate-800 text-slate-300 border-slate-700'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-600 font-bold">کپی شد!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>کپی در کلیپ‌بورد</span>
                </>
              )}
            </button>
          </div>

          {/* Compatibility badge */}
          <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-600 dark:text-emerald-300">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
            <span>
              فرمت خروجی با کدگذاری استاندارد UTF-8 with BOM ذخیره می‌شود و حروف فارسی در تمام تلویزیون‌های هوشمند و دستگاه‌ها بدون نقص نمایش داده می‌شوند.
            </span>
          </div>

        </div>

        {/* Footer */}
        <div className={`p-4 border-t flex items-center justify-end gap-2 ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/70 border-slate-800'
        }`}>
          <button
            onClick={onClose}
            className={`px-4 py-2 text-xs font-medium rounded-xl transition ${
              isLight ? 'text-slate-600 hover:bg-slate-200' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            بستن
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-5 py-2 text-xs font-bold bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 rounded-xl transition shadow-md shadow-amber-500/20"
          >
            <Download className="w-4 h-4 stroke-[2.2]" />
            <span>دانلود فایل {activeTab.toUpperCase()}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
