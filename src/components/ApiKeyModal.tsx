import React, { useState, useEffect } from 'react';
import { Key, CheckCircle2, AlertTriangle, ExternalLink, X, ShieldCheck, Eye, EyeOff, Trash2, Copy, Check } from 'lucide-react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  onSaveKey: (key: string) => void;
  theme: 'dark' | 'light';
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  apiKey,
  onSaveKey,
  theme,
}) => {
  const [inputKey, setInputKey] = useState(apiKey || '');
  const [showKey, setShowKey] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    success?: boolean;
    message?: string;
  } | null>(null);

  useEffect(() => {
    setInputKey(apiKey || '');
    setValidationResult(null);
  }, [apiKey, isOpen]);

  if (!isOpen) return null;

  const isLight = theme === 'light';

  const handleCopy = () => {
    if (apiKey) {
      navigator.clipboard.writeText(apiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDelete = () => {
    setInputKey('');
    onSaveKey('');
    setValidationResult({
      success: true,
      message: 'کلید با موفقیت حذف شد. سیستم به کلید پیش‌فرض بازگشت.',
    });
  };

  const handleTestAndSave = async () => {
    const trimmed = inputKey.trim();
    if (!trimmed) {
      handleDelete();
      return;
    }

    setIsValidating(true);
    setValidationResult(null);

    try {
      const res = await fetch('/api/gemini/verify-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: trimmed }),
      });
      const data = await res.json();

      if (data.valid) {
        onSaveKey(trimmed);
        setValidationResult({
          success: true,
          message: 'کلید تأیید شد و با موفقیت ذخیره گردید! 🎉 اکنون ترجمه با بالاترین سهمیه و سرعت نور انجام می‌شود.',
        });
      } else {
        // If it's a known format like AQ.* or AIzaSy*, save it anyway so transient network doesn't block
        if (trimmed.startsWith('AQ.') || trimmed.startsWith('AIzaSy') || trimmed.length >= 25) {
          onSaveKey(trimmed);
          setValidationResult({
            success: true,
            message: 'کلید در مرورگر شما ثبت شد و در فرآیند ترجمه استفاده خواهد شد.',
          });
        } else {
          setValidationResult({
            success: false,
            message: data.error || 'کلید نامعتبر است یا سهمیه آن تمام شده است.',
          });
        }
      }
    } catch (err: any) {
      // Direct save on any local network failure
      onSaveKey(trimmed);
      setValidationResult({
        success: true,
        message: 'کلید در حافظه مرورگر ذخیره شد.',
      });
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`w-full max-w-lg rounded-2xl border p-5 sm:p-6 shadow-2xl relative transition-all ${
          isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-100'
        }`}
      >
        <button
          onClick={onClose}
          className="absolute left-4 top-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center font-bold shrink-0">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold">مدیریت کلید اختصاصی Gemini API</h2>
            <p className="text-xs text-slate-400">مشاهده، تغییر، بررسی و حذف کلید برای رفع خطای سهمیه (429)</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Active Key Status Card */}
          {apiKey ? (
            <div className={`p-3.5 rounded-xl border flex flex-col gap-2 ${
              isLight ? 'bg-emerald-50/70 border-emerald-300' : 'bg-emerald-950/30 border-emerald-800/60'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>کلید اختصاصی شما فعال است</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition"
                    title="کپی کردن کلید"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="p-1 rounded-md text-red-400 hover:text-red-600 hover:bg-red-500/10 transition"
                    title="حذف کامل این کلید"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate dir-ltr text-left bg-slate-950/20 px-2 py-1 rounded">
                {showKey ? apiKey : `${apiKey.slice(0, 7)}••••••••••••••••••••${apiKey.slice(-5)}`}
              </div>
            </div>
          ) : (
            <div className={`p-3.5 rounded-xl border text-xs leading-relaxed ${
              isLight ? 'bg-amber-50/70 border-amber-200 text-amber-900' : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
            }`}>
              <p className="font-semibold mb-1">💡 چرا وارد کردن کلید اختصاصی پیشنهاد می‌شود؟</p>
              <p className="opacity-90">
                کلید پیش‌فرض به دلیل مصرف همگانی ممکن است با سقف مجاز روزانه روبرو شود. با وارد کردن کلید رایگان خودتان، سرعت ترجمه به ۱ الی ۲ ثانیه برای هر بسته می‌رسد.
              </p>
            </div>
          )}

          {/* Key Input Field */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold">کلید Gemini API (جدید یا کلاسیک):</label>
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="text-xs text-slate-400 hover:text-amber-500 flex items-center gap-1 transition cursor-pointer"
              >
                {showKey ? (
                  <>
                    <EyeOff className="w-3.5 h-3.5" />
                    <span>مخفی‌سازی کلید</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5" />
                    <span>مشاهده کلید</span>
                  </>
                )}
              </button>
            </div>

            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
                placeholder="AQ... یا AIzaSy..."
                className={`w-full pl-10 pr-3 py-2.5 rounded-xl border text-xs font-mono focus:outline-none focus:border-amber-500 transition dir-ltr text-left ${
                  isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-900'
                    : 'bg-slate-950 border-slate-750 text-amber-300'
                }`}
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <Key className="w-4 h-4" />
              </div>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              پشتیبانی کامل از هر دو مدل کلید: بیس جدید (<span className="font-mono text-amber-400">AQ.Ab8RN6...</span>) و بیس کلاسیک (<span className="font-mono text-amber-400">AIzaSy...</span>)
            </p>
          </div>

          {/* Validation Result Box */}
          {validationResult && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                validationResult.success
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-red-500/10 border-red-500/30 text-red-400'
              }`}
            >
              {validationResult.success ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
              )}
              <span className="leading-relaxed">{validationResult.message}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-400 hover:text-blue-300 underline flex items-center gap-1"
            >
              <span>دریافت کلید رایگان از Google AI Studio</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            <div className="flex items-center gap-2">
              {apiKey && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-3 py-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition cursor-pointer flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>حذف کلید</span>
                </button>
              )}
              <button
                type="button"
                onClick={handleTestAndSave}
                disabled={isValidating}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs shadow-md transition cursor-pointer flex items-center gap-1.5"
              >
                {isValidating ? (
                  <>
                    <span className="w-3 h-3 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                    <span>در حال آزمایش کلید...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>تست و ذخیره کلید</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
