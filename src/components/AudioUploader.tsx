import React, { useRef, useState } from 'react';
import { Volume2, Upload, Mic, MicOff, Play, Pause, Trash2, Wand2, CheckCircle2 } from 'lucide-react';
import { fileToBase64 } from '../utils/audioSynth';
import { ThemeMode } from '../types/subtitle';

interface AudioUploaderProps {
  audioFile: File | null;
  audioUrl: string | null;
  audioBase64: { data: string; mimeType: string } | null;
  onAudioSelected: (file: File | null, url: string | null, base64: { data: string; mimeType: string } | null) => void;
  onTranscribeDirectly: (duration?: number) => void;
  isTranscribing: boolean;
  currentTime: number;
  onSeek: (time: number) => void;
  theme: ThemeMode;
}

export const AudioUploader: React.FC<AudioUploaderProps> = ({
  audioFile,
  audioUrl,
  audioBase64,
  onAudioSelected,
  onTranscribeDirectly,
  isTranscribing,
  currentTime,
  onSeek,
  theme,
}) => {
  const isLight = theme === 'light';
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    try {
      const base64 = await fileToBase64(file);
      onAudioSelected(file, url, base64);
    } catch (err) {
      console.error('Error reading audio file:', err);
      onAudioSelected(file, url, null);
    }
  };

  const handleRemoveAudio = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setIsPlaying(false);
    onAudioSelected(null, null, null);
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      onSeek(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  // Sync external seek with audio element
  React.useEffect(() => {
    if (audioRef.current && Math.abs(audioRef.current.currentTime - currentTime) > 0.5) {
      audioRef.current.currentTime = currentTime;
    }
  }, [currentTime]);

  // Voice recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const file = new File([audioBlob], 'recorded_movie_audio.webm', { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        const base64 = await fileToBase64(file);
        onAudioSelected(file, url, base64);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start recording:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      setIsRecording(false);
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className={`border rounded-2xl p-4 shadow-xs transition-colors ${
      isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
    }`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-orange-500/10 text-orange-500">
            <Volume2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className={`text-xs font-bold flex items-center gap-1.5 ${
              isLight ? 'text-slate-900' : 'text-white'
            }`}>
              <span>صدای صحنه / فیلم</span>
              {audioFile && (
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-normal bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  <CheckCircle2 className="w-3 h-3" /> متصل شد
                </span>
              )}
            </h3>
            <p className="text-[11px] text-slate-400">
              بارگذاری فایل صوتی یا ویدیوی فیلم برای تطبیق لحن و همگام‌سازی زمان
            </p>
          </div>
        </div>

        {audioFile && (
          <button
            onClick={handleRemoveAudio}
            className="text-[11px] text-red-500 hover:text-red-600 flex items-center gap-1 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>حذف صدا</span>
          </button>
        )}
      </div>

      {audioUrl ? (
        <div className={`space-y-3 p-3 rounded-xl border ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/70 border-slate-800/80'
        }`}>
          <audio
            ref={audioRef}
            src={audioUrl}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={() => setIsPlaying(false)}
          />

          <div className="flex items-center gap-3">
            <button
              onClick={togglePlay}
              className="w-9 h-9 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center transition shadow-md shadow-amber-500/20 shrink-0"
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-slate-950" /> : <Play className="w-4 h-4 fill-slate-950 ml-0.5" />}
            </button>

            <div className="flex-1 space-y-1">
              <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                <span>{formatTime(currentTime)}</span>
                <span className={`truncate max-w-[140px] font-sans ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  {audioFile?.name}
                </span>
                <span>{formatTime(duration)}</span>
              </div>
              <input
                type="range"
                min="0"
                max={duration || 100}
                step="0.1"
                value={currentTime}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  onSeek(val);
                  if (audioRef.current) audioRef.current.currentTime = val;
                }}
                className="w-full accent-amber-500 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          {/* AI Transcribe from audio action */}
          <div className={`pt-2 border-t flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 ${
            isLight ? 'border-slate-200' : 'border-slate-800/60'
          }`}>
            <span className="text-[11px] text-slate-400">
              زیرنویس نداری؟ پیاده‌سازی و ترجمه مستقیم از صدای فیلم:
            </span>
            <button
              type="button"
              onClick={() => onTranscribeDirectly(duration)}
              disabled={isTranscribing}
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-orange-600/10 hover:bg-orange-600/20 text-orange-600 dark:text-orange-300 border border-orange-500/30 transition disabled:opacity-50 cursor-pointer"
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>{isTranscribing ? 'در حال تحلیل صوت...' : 'استخراج و ترجمه مستقیم'}</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {/* Upload Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={`flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed transition text-xs group ${
              isLight 
                ? 'border-slate-300 hover:border-amber-500 bg-slate-50 hover:bg-amber-50/50 text-slate-700' 
                : 'border-slate-750 hover:border-amber-500/60 bg-slate-950/40 hover:bg-slate-800/50 text-slate-300'
            }`}
          >
            <Upload className="w-4 h-4 text-amber-500 group-hover:scale-110 transition" />
            <span>آپلود فایل صوتی یا ویدیویی فیلم (.mp3, .wav, .mp4)</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*,video/*"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Record Button */}
          <button
            type="button"
            onClick={isRecording ? stopRecording : startRecording}
            className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs transition ${
              isRecording
                ? 'border-red-500 bg-red-500/10 text-red-500 animate-pulse'
                : isLight
                ? 'border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700'
                : 'border-slate-800 bg-slate-850/60 hover:bg-slate-800 text-slate-300'
            }`}
          >
            {isRecording ? (
              <>
                <MicOff className="w-4 h-4 text-red-500" />
                <span>در حال ضبط صدای صحنه... (کلیک برای اتمام)</span>
              </>
            ) : (
              <>
                <Mic className="w-4 h-4 text-slate-400" />
                <span>ضبط صدای فیلم از میکروفن سیستم</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
