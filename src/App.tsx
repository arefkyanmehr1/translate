/**
 * StreetSub - هوش مصنوعی ترجمه زیرنویس و صدای فیلم به فارسی محاوره‌ای و طبیعی ایرانی
 * پردازش پس‌زمینه در سمت سرور (حتی با بستن گوگل کروم)، سرعت فوق‌العاده بالا،
 * لحن محاوره‌ای اصیل و قابل فهم بدون اغراق لاتی یا خشکی ماشینی.
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Sparkles, 
  Flame, 
  Play, 
  Pause, 
  Sliders, 
  Download, 
  Wand2, 
  FileCheck, 
  AlertCircle, 
  CheckCircle2, 
  Zap, 
  Info, 
  Clock, 
  RotateCcw,
  ShieldCheck,
  Check,
  Layers,
  Radio,
  Bell,
  Megaphone,
  Key,
  Search,
  GraduationCap
} from 'lucide-react';

import { SubtitleCue, TranslationSettings, SampleScene, ThemeMode, TranslationProgressInfo } from './types/subtitle';
import { SAMPLE_SCENES, TONE_OPTIONS } from './data/sampleScenes';
import { parseSrtOrVtt, parseTimestampToSeconds, shiftAllTimecodes, autoFixOverlappingTimecodes, polishPunctuationAndEllipses, netflixSegmentAndMerge, stripAudioDescriptionsAndSdh } from './utils/subtitleParser';

import { Header } from './components/Header';
import { ToneSettingsModal } from './components/ToneSettingsModal';
import { SubtitleUploader } from './components/SubtitleUploader';
import { AudioUploader } from './components/AudioUploader';
import { SubtitleEditor } from './components/SubtitleEditor';
import { RefineSingleDialog } from './components/RefineSingleDialog';
import { CinemaPreviewModal } from './components/CinemaPreviewModal';
import { ExportModal } from './components/ExportModal';
import { WatermarkModal } from './components/WatermarkModal';
import { ApiKeyModal } from './components/ApiKeyModal';
import { MovieResearchModal } from './components/MovieResearchModal';
import { StyleLearningModal } from './components/StyleLearningModal';
import { MovieResearchData, LearnedStyleProfile } from './types/subtitle';

export default function App() {
  // Custom API key state (persistent in localStorage)
  const [userApiKey, setUserApiKey] = useState<string>(() => {
    return localStorage.getItem('user_gemini_api_key') || '';
  });
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);

  // Movie Deep Research & Style Learning modals
  const [isMovieResearchOpen, setIsMovieResearchOpen] = useState(false);
  const [isStyleLearningOpen, setIsStyleLearningOpen] = useState(false);
  const [activeLearnedStyle, setActiveLearnedStyle] = useState<LearnedStyleProfile | null>(() => {
    try {
      const saved = localStorage.getItem('streetsub_active_learned_style');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const handleSaveApiKey = (key: string) => {
    setUserApiKey(key);
    localStorage.setItem('user_gemini_api_key', key);
    setSettings((prev) => ({ ...prev, apiKey: key }));
  };

  const handleApplyMovieResearch = (data: MovieResearchData) => {
    setMovieTitle(data.movieTitle);
    setSettings((prev) => ({
      ...prev,
      movieContext: data.summary,
      characterDescriptions: data.characters?.map((c) => `${c.fa} (${c.en}): ${c.role || ''}`).join(' | ') || '',
      researchedMovieData: data,
    }));
    setRecoveredNotification(`تحقیق هوشمند فیلم اعمال شد: خلاصه داستان و اسامی رسمی ${data.characters?.length || 0} شخصیت در تنظیمات ثبت گردید.`);
    setTimeout(() => setRecoveredNotification(null), 5000);
  };

  const handleSelectActiveStyle = (style: LearnedStyleProfile | null) => {
    setActiveLearnedStyle(style);
    if (style) {
      localStorage.setItem('streetsub_active_learned_style', JSON.stringify(style));
      const stylePrompt = [
        `دستور سبک مترجم: ${style.toneSummary}`,
        style.slangFormulas?.length ? `فرمول‌های کلامی: ${style.slangFormulas.join(' | ')}` : '',
        style.characterNamingRules?.length ? `اصول نام‌گذاری: ${style.characterNamingRules.join(' | ')}` : '',
        style.keyVocabulary?.length ? `معادل‌های واژگانی شناسایی‌شده:\n${style.keyVocabulary.map((v) => `• ${v.en} ⬅️ ${v.fa}`).join('\n')}` : '',
        style.fewShotSamples?.length ? `نمونه‌های جفت دیالوگ الگو (Few-Shot):\n${style.fewShotSamples.map((s) => `• انگلیسی: "${s.en}" ⬅️ فارسی: "${s.fa}"`).join('\n')}` : '',
      ].filter(Boolean).join('\n\n');

      setSettings((prev) => ({
        ...prev,
        activeLearnedStyleId: style.id,
        activeLearnedStylePrompt: stylePrompt,
      }));
      setRecoveredNotification(`سبک آموزش‌دیده «${style.name}» با موفقیت برای ترجمه فعال شد! هوش مصنوعی دقیقاً از شیوه این مترجم پیروی می‌کند.`);
    } else {
      localStorage.removeItem('streetsub_active_learned_style');
      setSettings((prev) => ({
        ...prev,
        activeLearnedStyleId: undefined,
        activeLearnedStylePrompt: undefined,
      }));
      setRecoveredNotification('سبک اختصاصی غیرفعال شد و به تنظیمات عمومی بازگشت.');
    }
    setTimeout(() => setRecoveredNotification(null), 4000);
  };

  // Theme state (persistent in localStorage)
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('streetsub_theme');
    return (saved === 'light' || saved === 'dark') ? saved : 'dark';
  });

  useEffect(() => {
    localStorage.setItem('streetsub_theme', theme);
    if (theme === 'light') {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const isLight = theme === 'light';

  // Subtitle state (Starts empty without default preloaded dialogues)
  const [cues, setCues] = useState<SubtitleCue[]>([]);
  const [movieTitle, setMovieTitle] = useState('');
  
  // Audio state
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBase64, setAudioBase64] = useState<{ data: string; mimeType: string } | null>(null);
  const [currentTime, setCurrentTime] = useState(0);

  // Settings state (Default: Natural Iranian Colloquial Persian with Netflix Standards & Relay)
  const [settings, setSettings] = useState<TranslationSettings>({
    tone: 'tehrani_casual',
    slangLevel: 'medium',
    movieContext: 'مکالمه دو نفره روان، صمیمی و قابل فهم در صحنه فیلم.',
    characterDescriptions: 'صحبت کردن طبیعی و زنده مثل مکالمات روزمره مردم.',
    customInstructions: 'کلمات را طبیعی و گفتاری ترجمه کن. مطابق استانداردهای رسمی نتفلیکس (حداکثر ۲ خط و ۴۲ کاراکتر).',
    preserveTiming: true,
    netflixStandard: true,
    uncensored: true,
    useRelay: true,
    relayUrl: 'https://arefkyanmehr.ir/srt.php',
  });

  // Background Job tracking
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const pollingRef = useRef<number | null>(null);

  // Progress state
  const [progressInfo, setProgressInfo] = useState<TranslationProgressInfo>({
    isTranslating: false,
    isPaused: false,
    currentChunk: 0,
    totalChunks: 0,
    currentRange: '',
    totalTranslated: 0,
    totalCues: 0,
    percent: 0,
    speedPerSec: 0,
    elapsedSeconds: 0,
    remainingSeconds: 0,
  });

  const [isTranscribing, setIsTranscribing] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [recoveredNotification, setRecoveredNotification] = useState<string | null>(null);

  // Audio preview state
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingCueId, setSpeakingCueId] = useState<number | null>(null);

  // Modals state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCinemaOpen, setIsCinemaOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isWatermarkOpen, setIsWatermarkOpen] = useState(false);
  const [activeRefineCue, setActiveRefineCue] = useState<SubtitleCue | null>(null);

  // Initial load: check for active server background job or local saved project (No forced default dialogue)
  useEffect(() => {
    const initApp = async () => {
      try {
        // 1. Check if server has an active background job
        const res = await fetch('/api/jobs/active');
        if (res.ok) {
          const data = await res.json();
          if (data.activeJob && Array.isArray(data.activeJob.cues) && data.activeJob.cues.length > 0) {
            const job = data.activeJob;
            setCues(job.cues);
            if (job.movieTitle) setMovieTitle(job.movieTitle);
            if (job.settings) setSettings(job.settings);
            setActiveJobId(job.id);

            const isRunning = job.status === 'running';
            const isPaused = job.status === 'paused';
            const transCount = job.cues.filter((c: any) => !!c.persianText).length;

            setProgressInfo({
              isTranslating: isRunning,
              isPaused: isPaused,
              currentChunk: Math.ceil(transCount / 25) || 1,
              totalChunks: Math.ceil(job.totalCues / 25) || 1,
              currentRange: job.stageText || `${transCount} از ${job.totalCues} دیالوگ`,
              totalTranslated: transCount,
              totalCues: job.totalCues,
              percent: job.percent || 0,
              speedPerSec: job.speedPerSec || 0,
              elapsedSeconds: Math.floor((Date.now() - job.startTime) / 1000),
              remainingSeconds: 0,
            });

            if (isRunning) {
              setRecoveredNotification(`پردازش پس‌زمینه در سرور فعال است (${transCount.toLocaleString('fa-IR')} از ${job.totalCues.toLocaleString('fa-IR')} دیالوگ)`);
              startJobPolling(job.id);
            } else if (job.status === 'completed') {
              setRecoveredNotification(`ترجمه کامل فیلم در پس‌زمینه سرور به پایان رسیده است (${job.totalCues.toLocaleString('fa-IR')} دیالوگ).`);
            } else if (isPaused) {
              setRecoveredNotification(`پروژه قبلی با ${transCount.toLocaleString('fa-IR')} دیالوگ ذخیره شده در سرور آماده ادامه است.`);
            }

            return;
          }
        }
      } catch (e) {
        console.error('Error checking active server job:', e);
      }

      // 2. Fallback to localStorage saved project ONLY if user previously uploaded cues
      try {
        const saved = localStorage.getItem('streetsub_saved_project');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed.cues) && parsed.cues.length > 0 && parsed.movieTitle !== 'Pulp Fiction') {
            setCues(parsed.cues);
            if (parsed.movieTitle) setMovieTitle(parsed.movieTitle);
            if (parsed.settings) setSettings(parsed.settings);
            const transCount = parsed.cues.filter((c: any) => !!c.persianText).length;
            if (transCount > 0) {
              setRecoveredNotification(`پروژه قبلی بازیابی شد (${transCount.toLocaleString('fa-IR')} دیالوگ ترجمه شده حفظ شد)`);
            }
            return;
          }
        }
      } catch (e) {
        console.error('Error loading saved project:', e);
      }
      // If no file was uploaded, keep clean workspace with cues = []
    };

    initApp();

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  // Poll server for job updates
  const startJobPolling = (jobId: string) => {
    if (pollingRef.current) clearInterval(pollingRef.current);

    pollingRef.current = window.setInterval(async () => {
      try {
        const res = await fetch(`/api/jobs/status/${jobId}`);
        if (!res.ok) return;
        const data = await res.json();
        const job = data.job;

        if (job) {
          if (job.status === 'failed') {
            if (pollingRef.current) clearInterval(pollingRef.current);
            setErrorMsg(job.error || 'خطا در پردازش هوش مصنوعی در سرور');
            setIsTranscribing(false);
            setProgressInfo((prev) => ({ ...prev, isTranslating: false }));
            if (job.error?.includes('429') || job.error?.includes('سهمیه')) {
              setIsApiKeyModalOpen(true);
            }
            return;
          }

          if (Array.isArray(job.cues) && job.cues.length > 0) {
            const normalized = job.cues.map((c: any, index: number) => ({
              id: c.id || index + 1,
              startTime: c.startTime || '00:00:00,000',
              endTime: c.endTime || '00:00:03,000',
              startSeconds: c.startSeconds ?? parseTimestampToSeconds(c.startTime),
              endSeconds: c.endSeconds ?? parseTimestampToSeconds(c.endTime),
              originalText: c.originalText || c.text || '',
              persianText: c.persianText || '',
              slangNote: c.slangNote,
              alternative: c.alternative,
              isEdited: c.isEdited,
            }));
            setCues(normalized);
          }

          const transCount = job.cues.filter((c: any) => !!c.persianText).length;
          const isDone = job.status === 'completed';
          const isPaused = job.status === 'paused';

          const elapsed = Math.floor((Date.now() - job.startTime) / 1000);
          const speed = job.speedPerSec || (elapsed > 0 ? transCount / elapsed : 0);
          const remainingCues = Math.max(0, job.totalCues - transCount);
          const eta = speed > 0 ? Math.ceil(remainingCues / speed) : 0;

          setProgressInfo({
            isTranslating: job.status === 'running',
            isPaused: isPaused,
            currentChunk: Math.ceil(transCount / 40) || 1,
            totalChunks: Math.ceil(job.totalCues / 40) || 1,
            currentRange: job.stageText || `${transCount} از ${job.totalCues} دیالوگ`,
            totalTranslated: transCount,
            totalCues: job.totalCues,
            percent: job.percent || (job.totalCues > 0 ? Math.round((transCount / job.totalCues) * 100) : 0),
            speedPerSec: Math.round(speed * 10) / 10,
            elapsedSeconds: elapsed,
            remainingSeconds: isDone ? 0 : eta,
          });

          if (isDone) {
            setIsTranscribing(false);
            if (pollingRef.current) clearInterval(pollingRef.current);
            setAiSummary(job.summary || `فرآیند هوشمند (${job.totalCues.toLocaleString('fa-IR')} دیالوگ) با موفقیت در پس‌زمینه سرور به پایان رسید.`);

            // Trigger Desktop notification if supported
            try {
              if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
                new Notification('StreetSub - پایان پردازش', {
                  body: `پردازش کامل ${job.totalCues} دیالوگ با موفقیت انجام شد!`,
                  icon: '/favicon.ico',
                });
              }
            } catch (e) {}
          }
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 1200);
  };

  // Auto-save project locally whenever cues change
  useEffect(() => {
    if (cues.length > 0) {
      try {
        localStorage.setItem(
          'streetsub_saved_project',
          JSON.stringify({
            movieTitle,
            cues,
            settings,
            lastSaved: Date.now(),
          })
        );
      } catch (e) {}
    }
  }, [cues, movieTitle, settings]);

  const loadSampleScene = (scene: SampleScene) => {
    const parsed = parseSrtOrVtt(scene.subtitlesRaw);
    setCues(parsed);
    setMovieTitle(scene.title);
    setSettings((prev) => ({
      ...prev,
      tone: scene.recommendedTone || 'tehrani_casual',
      movieContext: scene.description,
    }));
    setAiSummary(null);
    setErrorMsg(null);
    setCurrentTime(0);
  };

  const handleSubtitlesLoaded = (loadedCues: SubtitleCue[], sourceName: string) => {
    setCues(loadedCues);
    setMovieTitle(sourceName.replace(/\.[^/.]+$/, ''));
    setAiSummary(null);
    setErrorMsg(null);
    setCurrentTime(0);
    setActiveJobId(null);
    if (pollingRef.current) clearInterval(pollingRef.current);
  };

  const handleClearSubtitles = async () => {
    if (activeJobId) {
      await fetch(`/api/jobs/cancel/${activeJobId}`, { method: 'POST' }).catch(() => {});
    }
    setCues([]);
    setAiSummary(null);
    setErrorMsg(null);
    setActiveJobId(null);
    if (pollingRef.current) clearInterval(pollingRef.current);
    try {
      localStorage.removeItem('streetsub_saved_project');
    } catch (e) {}
  };

  // Start High-Speed Server-Side Background Translation
  const handleStartBackgroundTranslation = async (forceReset = true) => {
    if (cues.length === 0) return;
    setErrorMsg(null);

    // Safely attempt notification permission without crashing if inside iframe
    try {
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
        if (window.self === window.top) {
          Notification.requestPermission().catch(() => {});
        }
      }
    } catch (e) {
      // ignore iframe restriction
    }

    const cuesToSend = forceReset 
      ? cues.map((c) => ({ ...c, persianText: undefined, isEdited: false }))
      : cues;

    // Immediately show visual progress in UI
    setCues(cuesToSend);
    setProgressInfo({
      isTranslating: true,
      isPaused: false,
      currentChunk: 1,
      totalChunks: Math.ceil(cues.length / 50) || 1,
      currentRange: `شروع پردازش دیالوگ‌ها در پس‌زمینه...`,
      totalTranslated: forceReset ? 0 : cues.filter((c) => !!c.persianText).length,
      totalCues: cues.length,
      percent: forceReset ? 0 : Math.round((cues.filter((c) => !!c.persianText).length / cues.length) * 100),
      speedPerSec: 0,
      elapsedSeconds: 0,
      remainingSeconds: Math.ceil(cues.length / 30),
    });

    try {
      const res = await fetch('/api/jobs/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(userApiKey ? { 'x-gemini-key': userApiKey } : {})
        },
        body: JSON.stringify({
          cues: cuesToSend,
          movieTitle,
          settings: { ...settings, apiKey: userApiKey || '' },
          forceReset,
          apiKey: userApiKey || '',
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        if (err.error?.includes('429') || err.error?.includes('سهمیه')) {
          setIsApiKeyModalOpen(true);
        }
        throw new Error(err.error || 'خطا در شروع ترجمه در سرور');
      }

      const data = await res.json();
      setActiveJobId(data.jobId);

      // Start live polling
      startJobPolling(data.jobId);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'خطا در شروع فرآیند ترجمه');
      setProgressInfo((prev) => ({ ...prev, isTranslating: false }));
    }
  };

  const handlePauseJob = async () => {
    if (!activeJobId) return;
    try {
      await fetch(`/api/jobs/pause/${activeJobId}`, { method: 'POST' });
      if (pollingRef.current) clearInterval(pollingRef.current);
      setProgressInfo((prev) => ({ ...prev, isTranslating: false, isPaused: true }));
    } catch (e) {}
  };

  const handleResumeJob = async () => {
    if (!activeJobId) {
      handleStartBackgroundTranslation();
      return;
    }
    try {
      await fetch(`/api/jobs/resume/${activeJobId}`, { method: 'POST' });
      setProgressInfo((prev) => ({ ...prev, isTranslating: true, isPaused: false }));
      startJobPolling(activeJobId);
    } catch (e) {
      handleStartBackgroundTranslation();
    }
  };

  // Transcribe & translate from audio using Server-Side Background Task with precise duration grounding
  const handleTranscribeAudio = async (audioDuration?: number) => {
    if (!audioBase64) return;
    setIsTranscribing(true);
    setErrorMsg(null);
    setRecoveredNotification('تحلیل و پیاده‌سازی صوت با دقت انطباق زمانی در پس‌زمینه سرور آغاز شد...');

    try {
      // 1. Start Server-Side Background Task with audioDuration
      const res = await fetch('/api/jobs/start-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioData: audioBase64.data,
          mimeType: audioBase64.mimeType,
          movieTitle: audioFile ? audioFile.name.replace(/\.[^/.]+$/, '') : movieTitle,
          settings,
          audioDuration: audioDuration && audioDuration > 0 ? audioDuration : undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'خطا در شروع تحلیل صوت');
      }

      const data = await res.json();
      setActiveJobId(data.jobId);
      startJobPolling(data.jobId);
    } catch (err: any) {
      console.warn('Background audio job error, falling back to direct endpoint:', err);
      // 2. Fallback to direct transcribe endpoint
      try {
        const syncRes = await fetch('/api/transcribe-audio', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            audioData: audioBase64.data,
            mimeType: audioBase64.mimeType,
            tone: settings.tone,
            movieContext: settings.movieContext,
            audioDuration: audioDuration && audioDuration > 0 ? audioDuration : undefined,
          }),
        });

        if (!syncRes.ok) {
          const syncErr = await syncRes.json().catch(() => ({}));
          throw new Error(syncErr.error || 'خطا در تبدیل صدا به زیرنویس');
        }

        const data = await syncRes.json();
        if (data.cues && Array.isArray(data.cues)) {
          const parsedCues: SubtitleCue[] = data.cues.map((c: any, index: number) => ({
            id: c.id || index + 1,
            startTime: c.startTime || '00:00:00,000',
            endTime: c.endTime || '00:00:03,000',
            startSeconds: parseTimestampToSeconds(c.startTime),
            endSeconds: parseTimestampToSeconds(c.endTime),
            originalText: c.originalText || c.text || '',
            persianText: c.persianText || '',
          }));
          setCues(parsedCues);
          setAiSummary(data.audioSummary || 'صدای فیلم با موفقیت پیاده‌سازی و همزمان به فارسی محاوره‌ای روان برگردانده شد.');
          setIsTranscribing(false);
          setRecoveredNotification(null);
          return;
        }
      } catch (fallbackErr: any) {
        console.error('Direct audio transcribe error:', fallbackErr);
        setErrorMsg(fallbackErr.message || err.message || 'خطا در تبدیل صدا به زیرنویس');
        setIsTranscribing(false);
        setRecoveredNotification(null);
      }
    }
  };

  // Timecode synchronization utilities
  const handleShiftTimecodes = (offsetSeconds: number) => {
    if (cues.length === 0) return;
    const shifted = shiftAllTimecodes(cues, offsetSeconds);
    setCues(shifted);
    setRecoveredNotification(`زمان‌بندی تمام دیالوگ‌ها ${offsetSeconds > 0 ? `+${offsetSeconds}` : offsetSeconds} ثانیه جابجا شد.`);
    setTimeout(() => setRecoveredNotification(null), 3000);
  };

  const handleFixOverlaps = () => {
    if (cues.length === 0) return;
    const fixed = autoFixOverlappingTimecodes(cues);
    setCues(fixed);
    setRecoveredNotification('تداخل‌های زمانی با موفقیت تصحیح شدند.');
    setTimeout(() => setRecoveredNotification(null), 3000);
  };

  // Smart Watermark / Promo insertion
  const handleApplyWatermark = (newCues: SubtitleCue[], insertedCount: number) => {
    setCues(newCues);
    setRecoveredNotification(`امضای اختصاصی ${insertedCount} بار در فواصل سکوت فیلم با موفقیت درج شد.`);
    setTimeout(() => setRecoveredNotification(null), 4000);
  };

  const handleRemoveWatermarks = () => {
    const clean = cues.filter((c) => !c.isPromo).map((c, idx) => ({ ...c, id: idx + 1 }));
    setCues(clean);
    setRecoveredNotification('تمامی خطوط امضا و تبلیغات از زیرنویس حذف شدند.');
    setTimeout(() => setRecoveredNotification(null), 3000);
  };

  // Smart Persian Punctuation and Continuation Ellipses Polish
  const handlePolishPunctuation = () => {
    if (cues.length === 0) return;
    const polished = polishPunctuationAndEllipses(cues);
    setCues(polished);
    setRecoveredNotification('علائم نگارشی فارسی (؟ ! ،) و سه‌نقطه (...) برای جملات ادامه‌دار با موفقیت روی تمام دیالوگ‌ها تنظیم شدند.');
    setTimeout(() => setRecoveredNotification(null), 4000);
  };

  // Re-segment & format subtitle cues according to Netflix Subtitling Standards
  const handleApplyNetflixStandards = () => {
    if (cues.length === 0) return;
    const standardized = netflixSegmentAndMerge(cues);
    setCues(standardized);
    setRecoveredNotification(`استاندارد رسمی نتفلیکس اعمال شد: قطعات مقطع گفتار در قالب ${standardized.length.toLocaleString('fa-IR')} دیالوگ منسجم با سقف ۲ خط و ۴۲ کاراکتر بازآرایی شدند.`);
    setTimeout(() => setRecoveredNotification(null), 5000);
  };

  // Strip audio description tags (SDH cleaner: coughing, music, screams, sound effects)
  const handleStripAudioDescriptions = () => {
    if (cues.length === 0) return;
    const { cleanedCues, removedCount } = stripAudioDescriptionsAndSdh(cues);
    setCues(cleanedCues);
    setRecoveredNotification(`پاکسازی صداها انجام شد: ${removedCount.toLocaleString('fa-IR')} مورد افکت صدا و توصیف صوتی (مانند سرفه، موزیک، همهمه) از متن زیرنویس حذف گردید.`);
    setTimeout(() => setRecoveredNotification(null), 5000);
  };

  // Update a single cue text
  const handleUpdateCueText = (id: number, newPersian: string) => {
    setCues((prev) =>
      prev.map((c) => (c.id === id ? { ...c, persianText: newPersian, isEdited: true } : c))
    );
  };

  // Apply single refinement
  const handleApplySingleRefine = (cueId: number, newPersian: string, styleNote?: string) => {
    setCues((prev) =>
      prev.map((c) =>
        c.id === cueId
          ? {
              ...c,
              persianText: newPersian,
              slangNote: styleNote || c.slangNote,
              isEdited: true,
            }
          : c
      )
    );
  };

  // Speak a Persian line via TTS
  const handleSpeakLine = async (text: string) => {
    if (!text) return;
    setIsSpeaking(true);

    try {
      const res = await fetch('/api/speak-persian', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.audioBase64) {
          const binary = atob(data.audioBase64);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
          }
          const blob = new Blob([bytes], { type: 'audio/wav' });
          const url = URL.createObjectURL(blob);
          const audio = new Audio(url);
          audio.onended = () => setIsSpeaking(false);
          audio.onerror = () => setIsSpeaking(false);
          audio.play();
          return;
        }
      }

      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'fa-IR';
        utterance.rate = 1.0;
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance);
      } else {
        setIsSpeaking(false);
      }
    } catch (e) {
      console.error(e);
      setIsSpeaking(false);
    }
  };

  const activeToneObj = TONE_OPTIONS.find((t) => t.id === settings.tone) || TONE_OPTIONS[0];
  const translatedCount = useMemo(() => cues.filter((c) => !!c.persianText).length, [cues]);
  const untranslatedCount = cues.length - translatedCount;
  const hasPersian = translatedCount > 0;

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${
      isLight ? 'bg-slate-50 text-slate-900' : 'bg-slate-950 text-slate-100'
    }`}>
      
      {/* Top Header */}
      <Header
        onLoadSample={loadSampleScene}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenCinemaPreview={() => setIsCinemaOpen(true)}
        onOpenWatermark={() => setIsWatermarkOpen(true)}
        onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
        onOpenMovieResearch={() => setIsMovieResearchOpen(true)}
        onOpenStyleLearning={() => setIsStyleLearningOpen(true)}
        hasCustomApiKey={!!userApiKey}
        activeStyleName={activeLearnedStyle?.name}
        isResearched={Boolean(settings.researchedMovieData)}
        hasCues={cues.length > 0}
        hasPersian={hasPersian}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-5">
        
        {/* Active Tone Banner & Movie Details */}
        <div className={`border rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-xs transition-colors ${
          isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/30 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-slate-400">لحن فعال:</span>
                <span className={`text-sm font-black px-2.5 py-0.5 rounded-lg border ${
                  isLight ? 'bg-slate-100 border-slate-200 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
                }`}>
                  {activeToneObj.label}
                </span>

                {/* Learned Style Badge */}
                {activeLearnedStyle && (
                  <button
                    type="button"
                    onClick={() => setIsStyleLearningOpen(true)}
                    className="text-[10px] px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/40 font-bold flex items-center gap-1 hover:bg-purple-500/25 transition cursor-pointer"
                    title="مشاهده جزئیات سبک آموزش‌دیده"
                  >
                    <span>🎓</span>
                    <span>سبک مترجم: {activeLearnedStyle.name}</span>
                  </button>
                )}

                {/* Researched Movie Badge */}
                {settings.researchedMovieData && (
                  <button
                    type="button"
                    onClick={() => setIsMovieResearchOpen(true)}
                    className="text-[10px] px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30 font-bold flex items-center gap-1 hover:bg-blue-500/25 transition cursor-pointer"
                    title="مشاهده اطلاعات و اسامی تحقیق‌شده اثر"
                  >
                    <span>🔍</span>
                    <span>فیلم: {settings.researchedMovieData.movieTitle} (اسامی تایید شده)</span>
                  </button>
                )}

                {/* Natural Persian Badge */}
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-semibold">
                  محاوره‌ای طبیعی • بدون اغراق لاتی
                </span>

                {/* Uncensored Badge */}
                {settings.uncensored !== false && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-semibold flex items-center gap-1">
                    <span>🔞 بدون سانسور (صریح)</span>
                  </span>
                )}

                {/* Timecode Safety Guarantee Badge */}
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  <span>تضمین سلامت زمان‌بندی</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                {activeToneObj.subLabel} {settings.movieContext ? `• داستان: ${settings.movieContext}` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
            {/* Quick Movie Research Button */}
            <button
              onClick={() => setIsMovieResearchOpen(true)}
              className={`flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl border transition cursor-pointer shadow-xs ${
                settings.researchedMovieData
                  ? 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border-blue-500/40'
                  : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border-slate-700'
              }`}
              title="تحقیق خودکار چند ثانیه‌ای درباره داستان و اسامی شخصیت‌های این اثر"
            >
              <Search className="w-3.5 h-3.5 text-blue-400" />
              <span>{settings.researchedMovieData ? 'ویرایش تحقیق اثر' : '🔍 تحقیق درباره فیلم'}</span>
            </button>

            {/* Quick Style Learning Button */}
            <button
              onClick={() => setIsStyleLearningOpen(true)}
              className={`flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl border transition cursor-pointer shadow-xs ${
                activeLearnedStyle
                  ? 'bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border-purple-500/40'
                  : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border-slate-700'
              }`}
              title="آموزش و الگوبرداری از فایل زیرنویس مترجمان برتر (حمید، مووی‌جوان و...)"
            >
              <GraduationCap className="w-3.5 h-3.5 text-purple-400" />
              <span>{activeLearnedStyle ? 'سبک آموزش‌دیده فعال' : '🎓 آموزش از الگو'}</span>
            </button>

            <button
              onClick={() => setIsApiKeyModalOpen(true)}
              className={`flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl border transition cursor-pointer shadow-xs ${
                userApiKey
                  ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/40'
                  : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/40'
              }`}
              title="مشاهده، تنظیم یا حذف کلید Gemini API"
            >
              <Key className="w-3.5 h-3.5 text-amber-500" />
              <span>{userApiKey ? '🔑 کلید فعال' : '🔑 کلید Gemini'}</span>
            </button>

            <button
              onClick={() => setIsSettingsOpen(true)}
              className={`flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl border transition ${
                isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300' : 'bg-slate-800 hover:bg-slate-750 text-slate-200 border-slate-750'
              }`}
            >
              <Sliders className="w-3.5 h-3.5 text-amber-500" />
              <span>تنظیم لحن</span>
            </button>
          </div>
        </div>

        {/* Inputs Grid: Subtitle & Movie Audio */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SubtitleUploader
            cues={cues}
            onSubtitlesLoaded={handleSubtitlesLoaded}
            onLoadSample={loadSampleScene}
            onClear={handleClearSubtitles}
            theme={theme}
          />

          <AudioUploader
            audioFile={audioFile}
            audioUrl={audioUrl}
            audioBase64={audioBase64}
            onAudioSelected={(file, url, base64) => {
              setAudioFile(file);
              setAudioUrl(url);
              setAudioBase64(base64);
            }}
            onTranscribeDirectly={handleTranscribeAudio}
            isTranscribing={isTranscribing}
            currentTime={currentTime}
            onSeek={(t) => setCurrentTime(t)}
            theme={theme}
          />
        </div>

        {/* High-Capacity Action Bar (Server-Side Background Engine) */}
        {cues.length > 0 && (
          <div className={`border rounded-2xl p-4 sm:p-5 flex flex-col gap-4 shadow-md transition-colors ${
            isLight 
              ? 'bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50/60 border-amber-200' 
              : 'bg-gradient-to-r from-amber-500/10 via-orange-600/10 to-red-600/10 border-amber-500/30'
          }`}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-black flex items-center gap-2">
                    <Zap className="w-5 h-5 text-amber-500 fill-amber-500 shrink-0" />
                    <span>موتور ترجمه پرسرعت در پس‌زمینه سرور</span>
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-bold flex items-center gap-1">
                    <Radio className="w-2.5 h-2.5 animate-pulse text-emerald-500" />
                    <span>ادامه حتی با بستن مرورگر</span>
                  </span>
                </div>
                <p className="text-xs opacity-80">
                  {cues.length.toLocaleString('fa-IR')} دیالوگ در صف • پردازش موازی ۳ دسته‌ای (بسته‌های ۴۰تایی فوق‌سریع) • ترجمه بدون سانسور و طبیعی
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                {progressInfo.isTranslating ? (
                  <button
                    type="button"
                    onClick={handlePauseJob}
                    className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs transition shadow-md"
                  >
                    <Pause className="w-4 h-4 fill-slate-950" />
                    <span>توقف موقت</span>
                  </button>
                ) : progressInfo.isPaused && untranslatedCount > 0 ? (
                  <button
                    type="button"
                    onClick={handleResumeJob}
                    className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition shadow-md shadow-emerald-600/20"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>ادامه ترجمه در سرور ({untranslatedCount.toLocaleString('fa-IR')} دیالوگ مانده)</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleStartBackgroundTranslation(true)}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-red-600 hover:from-amber-400 hover:via-orange-400 hover:to-red-500 text-slate-950 font-black text-xs sm:text-sm transition shadow-lg shadow-orange-500/25 shrink-0 cursor-pointer"
                  >
                    <Wand2 className="w-4 h-4 stroke-[2.5]" />
                    <span>
                      {hasPersian ? 'شروع مجدد ترجمه پرسرعت' : 'شروع ترجمه هوشمند فیلم'}
                    </span>
                  </button>
                )}

                {hasPersian && (
                  <button
                    type="button"
                    onClick={() => setIsCinemaOpen(true)}
                    className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 transition shrink-0 shadow-xs"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>پخش سینمایی</span>
                  </button>
                )}
              </div>
            </div>

            {/* Industrial Batch Progress Bar & Realtime Stats */}
            {(progressInfo.isTranslating || progressInfo.isPaused || progressInfo.percent > 0) && (
              <div className={`p-3 rounded-xl border space-y-2 text-xs ${
                isLight ? 'bg-white border-amber-200 text-slate-800' : 'bg-slate-950/80 border-slate-800 text-slate-200'
              }`}>
                <div className="flex flex-wrap items-center justify-between gap-2 font-semibold">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-amber-500 flex items-center gap-1">
                      {progressInfo.isTranslating && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>}
                      <span>پیشرفت سرور: {translatedCount.toLocaleString('fa-IR')} / {cues.length.toLocaleString('fa-IR')} دیالوگ</span>
                    </span>
                    {progressInfo.speedPerSec > 0 && (
                      <span className="text-[11px] px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 font-mono font-bold">
                        ~{progressInfo.speedPerSec} دیالوگ در ثانیه
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-[11px] font-mono">
                    <span>زمان: {formatSeconds(progressInfo.elapsedSeconds)}</span>
                    {progressInfo.remainingSeconds > 0 && (
                      <span className="text-amber-500">
                        تخمینی مانده: ~{formatSeconds(progressInfo.remainingSeconds)}
                      </span>
                    )}
                    <span className="font-bold text-sm text-amber-500">{progressInfo.percent}%</span>
                  </div>
                </div>

                <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-amber-500 to-orange-500 h-full transition-all duration-300 rounded-full"
                    style={{ width: `${progressInfo.percent}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Recovered Project Banner */}
        {recoveredNotification && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs flex items-center justify-between gap-2 animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
              <span className="font-semibold">{recoveredNotification}</span>
            </div>
            <button
              onClick={() => setRecoveredNotification(null)}
              className="text-[11px] underline opacity-75 hover:opacity-100"
            >
              متوجه شدم
            </button>
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-red-950/70 border border-red-800 text-red-200 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span className="leading-relaxed">{errorMsg}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsApiKeyModalOpen(true)}
                className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 rounded-xl font-bold text-xs shrink-0 transition cursor-pointer flex items-center gap-1 shadow-sm"
              >
                <span>🔑 تنظیم کلید Gemini API</span>
              </button>
              {untranslatedCount > 0 && (
                <button
                  type="button"
                  onClick={handleResumeJob}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-xl font-medium text-xs shrink-0 transition cursor-pointer"
                >
                  تلاش مجدد
                </button>
              )}
            </div>
          </div>
        )}

        {/* AI Strategy Summary Card */}
        {aiSummary && (
          <div className={`p-4 rounded-2xl border text-xs space-y-1.5 shadow-xs ${
            isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900/90 border-slate-800 text-slate-300'
          }`}>
            <div className="flex items-center gap-2 font-bold text-amber-500">
              <Info className="w-4 h-4" />
              <span>وضعیت ترجمه هوشمند:</span>
            </div>
            <p className="leading-relaxed pr-6 opacity-90">
              {aiSummary}
            </p>
          </div>
        )}

        {/* Timecode Synchronization & Fine-tuning Bar */}
        {cues.length > 0 && (
          <div className={`p-3 rounded-xl border flex flex-wrap items-center justify-between gap-3 text-xs ${
            isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-200'
          }`}>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              <span className="font-bold">همگام‌سازی و تنظیم دقیق زمان‌بندی:</span>
              <span className="text-[11px] opacity-75 hidden sm:inline">اگر زیرنویس با صدا یا تصویر جلو/عقب است، با یک کلیک تراز کنید:</span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleShiftTimecodes(-1.0)}
                className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-amber-500/10 hover:border-amber-500/40 text-[11px] font-mono transition cursor-pointer"
                title="تمام زیرنویس‌ها ۱ ثانیه جلوتر بیایند"
              >
                -۱.۰s
              </button>
              <button
                type="button"
                onClick={() => handleShiftTimecodes(-0.5)}
                className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-amber-500/10 hover:border-amber-500/40 text-[11px] font-mono transition cursor-pointer"
                title="تمام زیرنویس‌ها ۰.۵ ثانیه جلوتر بیایند"
              >
                -۰.۵s
              </button>
              <button
                type="button"
                onClick={() => handleShiftTimecodes(0.5)}
                className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-amber-500/10 hover:border-amber-500/40 text-[11px] font-mono transition cursor-pointer"
                title="تمام زیرنویس‌ها ۰.۵ ثانیه تأخیر داده شوند"
              >
                +۰.۵s
              </button>
              <button
                type="button"
                onClick={() => handleShiftTimecodes(1.0)}
                className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-amber-500/10 hover:border-amber-500/40 text-[11px] font-mono transition cursor-pointer"
                title="تمام زیرنویس‌ها ۱ ثانیه تأخیر داده شوند"
              >
                +۱.۰s
              </button>
              <button
                type="button"
                onClick={handleFixOverlaps}
                className="px-3 py-1 rounded-lg bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 text-[11px] font-bold transition cursor-pointer flex items-center gap-1"
                title="رفع خودکار هرگونه تداخل زمانی بین دیالوگ‌ها"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>رفع تداخل‌ها</span>
              </button>

              <button
                type="button"
                onClick={handleApplyNetflixStandards}
                className="px-3.5 py-1 rounded-lg bg-red-600/10 hover:bg-red-600/20 text-red-600 dark:text-red-400 border border-red-500/40 text-[11px] font-bold transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                title="ادغام قطعات مقطع گفتار ASR و شکستن اصولی ۲ خطی و ۴۲ کاراکتری بر اساس استاندارد رسمی نتفلیکس"
              >
                <span className="text-xs">🔴</span>
                <span>استانداردسازی نتفلیکس</span>
              </button>

              <button
                type="button"
                onClick={handlePolishPunctuation}
                className="px-3 py-1 rounded-lg bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[11px] font-bold transition cursor-pointer flex items-center gap-1"
                title="تنظیم خودکار علائم نگارشی فارسی (؟ ! ،) و سه‌نقطه (...) برای جملات ادامه‌دار"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>تنظیم علائم و سه‌نقطه (...)</span>
              </button>

              <button
                type="button"
                onClick={handleStripAudioDescriptions}
                className="px-3.5 py-1 rounded-lg bg-purple-600/10 hover:bg-purple-600/20 text-purple-600 dark:text-purple-400 border border-purple-500/30 text-[11px] font-bold transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                title="حذف توصیفات صوتی مانند صدای سرفه، صدای آهنگ پس‌زمینه، صدای شلیک و افکت‌های ناشنوایان از زیرنویس"
              >
                <span>🧹</span>
                <span>حذف صداها و سرفه/موزیک (SDH)</span>
              </button>

              <button
                type="button"
                onClick={() => setIsWatermarkOpen(true)}
                className="px-3 py-1 rounded-lg bg-orange-600/10 hover:bg-orange-600/20 text-orange-600 dark:text-orange-400 border border-orange-500/30 text-[11px] font-bold transition cursor-pointer flex items-center gap-1"
                title="درج نام سایت، کانال یا امضای مترجم در فواصل سکوت فیلم"
              >
                <Megaphone className="w-3.5 h-3.5" />
                <span>امضا و تبلیغات در سکوت</span>
              </button>
            </div>
          </div>
        )}

        {/* Subtitle Workspace Editor (with pagination for 4000+ subtitles) */}
        {cues.length > 0 ? (
          <SubtitleEditor
            cues={cues}
            currentTime={currentTime}
            onSeek={(t) => setCurrentTime(t)}
            onUpdateCueText={handleUpdateCueText}
            onOpenRefineModal={(cue) => setActiveRefineCue(cue)}
            onSpeakLine={handleSpeakLine}
            isSpeaking={isSpeaking}
            speakingCueId={speakingCueId}
            theme={theme}
            onStartTranslation={() => handleStartBackgroundTranslation(false)}
            isTranslating={progressInfo.isTranslating}
            onStripAudioDescriptions={handleStripAudioDescriptions}
          />
        ) : !isTranscribing && (
          <div className={`p-8 sm:p-12 rounded-2xl border text-center space-y-4 shadow-xs transition-colors ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900/60 border-slate-800'
          }`}>
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center">
              <Sparkles className="w-7 h-7" />
            </div>
            <div className="space-y-1.5 max-w-md mx-auto">
              <h3 className="text-base sm:text-lg font-bold">میزکار ترجمه آماده است</h3>
              <p className="text-xs opacity-75 leading-relaxed">
                هنوز هیچ دیالوگی بارگذاری نشده است. برای شروع، فایل زیرنویس (.srt یا .vtt) یا فایل صوتی/تصویری فیلم را در بالا بارگذاری کنید.
              </p>
            </div>
            <div className="pt-1">
              <button
                type="button"
                onClick={() => loadSampleScene(SAMPLE_SCENES[0])}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 transition cursor-pointer"
              >
                <span>بارگذاری صحنه نمونه برای آزمایش (Pulp Fiction)</span>
              </button>
            </div>
          </div>
        )}

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 pt-3 border-t border-slate-200 dark:border-slate-800/60 text-xs opacity-80">
          <div className={`p-3.5 rounded-xl border space-y-1 ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900/50 border-slate-850'
          }`}>
            <div className={`font-bold flex items-center gap-1.5 ${isLight ? 'text-slate-900' : 'text-white'}`}>
              <Radio className="w-3.5 h-3.5 text-emerald-500" />
              <span>پردازش پس‌زمینه مداوم در سرور</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              مرورگر کروم را ببندید یا کامپیوتر را ترک کنید؛ سرور در پس‌زمینه فیلم را کامل ترجمه می‌کند و کار قطع نمی‌شود.
            </p>
          </div>

          <div className={`p-3.5 rounded-xl border space-y-1 ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900/50 border-slate-850'
          }`}>
            <div className={`font-bold flex items-center gap-1.5 ${isLight ? 'text-slate-900' : 'text-white'}`}>
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>سرعت فوق‌العاده بالا</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              پردازش موازی ۵۰ دیالوگ در هر درخواست بدون سربار متنی اضافه؛ فیلم ۴۰۰۰ سطری در کمتر از چند دقیقه ترجمه می‌شود.
            </p>
          </div>

          <div className={`p-3.5 rounded-xl border space-y-1 ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900/50 border-slate-850'
          }`}>
            <div className={`font-bold flex items-center gap-1.5 ${isLight ? 'text-slate-900' : 'text-white'}`}>
              <Clock className="w-3.5 h-3.5 text-orange-500" />
              <span>فارسی محاوره‌ای اصیل و طبیعی</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              گفتار روزمره، زنده و قابل فهم بدون کلمات لاتی اغراق‌آمیز منسوخ و بدون لحن خشک کتابی ماشینی.
            </p>
          </div>
        </div>

      </main>

      {/* Modals */}
      <ToneSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={(newSettings) => setSettings(newSettings)}
        theme={theme}
      />

      <RefineSingleDialog
        cue={activeRefineCue}
        isOpen={!!activeRefineCue}
        onClose={() => setActiveRefineCue(null)}
        onApplyTranslation={handleApplySingleRefine}
        currentTone={settings.tone}
        theme={theme}
      />

      <CinemaPreviewModal
        isOpen={isCinemaOpen}
        onClose={() => setIsCinemaOpen(false)}
        cues={cues}
        audioUrl={audioUrl}
        currentTime={currentTime}
        onSeek={(t) => setCurrentTime(t)}
        movieTitle={movieTitle}
      />

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        cues={cues}
        movieTitle={movieTitle}
        theme={theme}
      />

      <WatermarkModal
        isOpen={isWatermarkOpen}
        onClose={() => setIsWatermarkOpen(false)}
        cues={cues}
        onApplyWatermark={handleApplyWatermark}
        onRemoveWatermarks={handleRemoveWatermarks}
        theme={theme}
      />

      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        apiKey={userApiKey}
        onSaveKey={handleSaveApiKey}
        theme={theme}
      />

      <MovieResearchModal
        isOpen={isMovieResearchOpen}
        onClose={() => setIsMovieResearchOpen(false)}
        currentMovieTitle={movieTitle}
        researchedData={settings.researchedMovieData}
        onApplyResearch={handleApplyMovieResearch}
        apiKey={userApiKey}
        theme={theme}
      />

      <StyleLearningModal
        isOpen={isStyleLearningOpen}
        onClose={() => setIsStyleLearningOpen(false)}
        activeStyleId={settings.activeLearnedStyleId}
        onSelectActiveStyle={handleSelectActiveStyle}
        apiKey={userApiKey}
        theme={theme}
      />

    </div>
  );
}
