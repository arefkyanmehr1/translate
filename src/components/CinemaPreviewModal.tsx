import React, { useState, useEffect, useRef } from 'react';
import { X, Play, Pause, RotateCcw, Volume2, Type, Eye, Sparkles } from 'lucide-react';
import { SubtitleCue } from '../types/subtitle';

interface CinemaPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  cues: SubtitleCue[];
  audioUrl: string | null;
  currentTime: number;
  onSeek: (time: number) => void;
  movieTitle?: string;
}

export const CinemaPreviewModal: React.FC<CinemaPreviewModalProps> = ({
  isOpen,
  onClose,
  cues,
  audioUrl,
  currentTime,
  onSeek,
  movieTitle = 'پیش‌نمایش سینمایی صحنه فیلم',
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [fontSize, setFontSize] = useState<'sm' | 'md' | 'lg' | 'xl'>('lg');
  const [showBilingual, setShowBilingual] = useState(false);
  const [subtitleColor, setSubtitleColor] = useState<'yellow' | 'white' | 'amber'>('yellow');
  
  const timerRef = useRef<number | null>(null);
  const internalAudioRef = useRef<HTMLAudioElement | null>(null);

  const duration = cues.length > 0 ? cues[cues.length - 1].endSeconds + 2 : 60;

  // Find active cue based on currentTime
  const activeCue = cues.find(
    (cue) => currentTime >= cue.startSeconds && currentTime <= cue.endSeconds
  );

  useEffect(() => {
    if (isPlaying) {
      const start = Date.now() - currentTime * 1000;
      const interval = window.setInterval(() => {
        const nextTime = (Date.now() - start) / 1000;
        if (nextTime >= duration) {
          setIsPlaying(false);
          onSeek(0);
        } else {
          onSeek(nextTime);
        }
      }, 50);
      timerRef.current = interval;
      return () => clearInterval(interval);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [isPlaying, duration, onSeek]);

  // Handle keyboard shortcuts (space for play/pause, escape to close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying((p) => !p);
      } else if (e.code === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  const getFontSizeClass = () => {
    switch (fontSize) {
      case 'sm': return 'text-base sm:text-lg';
      case 'md': return 'text-lg sm:text-2xl';
      case 'lg': return 'text-xl sm:text-3xl';
      case 'xl': return 'text-2xl sm:text-4xl';
    }
  };

  const getColorStyle = () => {
    switch (subtitleColor) {
      case 'yellow': return 'text-amber-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]';
      case 'white': return 'text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]';
      case 'amber': return 'text-amber-400 drop-shadow-[0_2px_6px_rgba(245,158,11,0.6)]';
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    const ms = Math.floor((secs % 1) * 10);
    return `${mins}:${s < 10 ? '0' : ''}${s}.${ms}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-5xl shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Top bar */}
        <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse"></span>
            <h3 className="text-xs font-bold text-white tracking-wide">
              {movieTitle} - پیش‌نمایش زیرنویس زنده
            </h3>
          </div>

          <div className="flex items-center gap-3">
            {/* Bilingual toggle */}
            <button
              onClick={() => setShowBilingual(!showBilingual)}
              className={`text-[11px] px-2.5 py-1 rounded-lg border transition flex items-center gap-1 ${
                showBilingual
                  ? 'border-amber-500/50 bg-amber-500/10 text-amber-300'
                  : 'border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>زیرنویس همزمان انگلیسی</span>
            </button>

            {/* Font size */}
            <div className="flex items-center bg-slate-800 rounded-lg p-0.5 text-xs text-slate-300">
              {(['sm', 'md', 'lg', 'xl'] as const).map((sz) => (
                <button
                  key={sz}
                  onClick={() => setFontSize(sz)}
                  className={`px-2 py-0.5 rounded-md font-semibold ${
                    fontSize === sz ? 'bg-amber-500 text-slate-950' : 'hover:text-white'
                  }`}
                >
                  {sz.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Cinema Screen Box */}
        <div className="relative aspect-video w-full bg-slate-950 flex flex-col items-center justify-center overflow-hidden border-b border-slate-800 shadow-inner group">
          
          {/* Subtle cinematic gradient background */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-slate-950/80 to-slate-900/60 pointer-events-none"></div>

          {/* Film Grain / Ambient Glow */}
          <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-900/30 via-slate-950 to-black"></div>

          {/* Scene Title Watermark */}
          <div className="absolute top-4 right-4 text-[11px] text-slate-600 font-mono tracking-widest uppercase">
            STREETSUB CINEMA PREVIEW • 24 FPS
          </div>

          {/* Hidden or real audio element if user uploaded audio */}
          {audioUrl && (
            <audio
              ref={internalAudioRef}
              src={audioUrl}
              onEnded={() => setIsPlaying(false)}
            />
          )}

          {/* Subtitle Display Overlay */}
          <div className="absolute bottom-8 left-6 right-6 flex flex-col items-center text-center z-10 space-y-2 pointer-events-none">
            {activeCue ? (
              <div className="space-y-1.5 animate-in fade-in zoom-in-95 duration-100 max-w-3xl">
                {/* Persian Street Slang Subtitle */}
                <div 
                  className={`font-black tracking-normal px-4 py-1.5 rounded-xl bg-black/60 backdrop-blur-xs border border-white/5 inline-block ${getFontSizeClass()} ${getColorStyle()}`}
                >
                  {activeCue.persianText || activeCue.originalText}
                </div>

                {/* Optional Bilingual Foreign Subtitle */}
                {showBilingual && (
                  <div className="text-xs sm:text-sm text-slate-300/90 font-mono tracking-wide px-3 py-1 bg-black/40 rounded-lg backdrop-blur-xs">
                    {activeCue.originalText}
                  </div>
                )}

                {/* Slang Badge if available */}
                {activeCue.slangNote && (
                  <div className="text-[10px] text-amber-400/80 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full inline-block">
                    اصطلاح: {activeCue.slangNote}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-xs text-slate-600 font-mono">
                [سکوت یا موسیقی صحنه...]
              </div>
            )}
          </div>

          {/* Center Play Overlay when paused */}
          {!isPlaying && (
            <button
              onClick={() => setIsPlaying(true)}
              className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/20 transition cursor-pointer"
            >
              <div className="w-16 h-16 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center shadow-xl shadow-amber-500/30 transition transform hover:scale-105">
                <Play className="w-7 h-7 fill-slate-950 ml-1" />
              </div>
            </button>
          )}

        </div>

        {/* Player Controls */}
        <div className="p-4 bg-slate-950 flex flex-col gap-2.5">
          {/* Progress bar */}
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-mono text-amber-400 w-12 text-left">
              {formatTime(currentTime)}
            </span>
            <input
              type="range"
              min="0"
              max={duration}
              step="0.05"
              value={currentTime}
              onChange={(e) => onSeek(parseFloat(e.target.value))}
              className="flex-1 accent-amber-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
            />
            <span className="text-[11px] font-mono text-slate-500 w-12 text-right">
              {formatTime(duration)}
            </span>
          </div>

          {/* Buttons row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition"
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-slate-950" /> : <Play className="w-4 h-4 fill-slate-950" />}
                <span>{isPlaying ? 'توقف' : 'پخش'}</span>
              </button>

              <button
                onClick={() => {
                  setIsPlaying(false);
                  onSeek(0);
                }}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                title="شروع مجدد صحنه"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <div className="text-[11px] text-slate-400 pr-2">
                کلید Space: پخش / توقف • کلید Esc: بستن
              </div>
            </div>

            {/* Quick cue jump list */}
            <div className="flex items-center gap-1 max-w-sm overflow-x-auto py-1">
              {cues.slice(0, 8).map((cue) => (
                <button
                  key={cue.id}
                  onClick={() => onSeek(cue.startSeconds)}
                  className={`text-[10px] px-2 py-1 rounded-lg border font-mono transition shrink-0 ${
                    activeCue?.id === cue.id
                      ? 'border-amber-500 bg-amber-500/20 text-amber-300'
                      : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  #{cue.id}
                </button>
              ))}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
