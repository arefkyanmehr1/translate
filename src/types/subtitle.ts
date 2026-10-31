export interface SubtitleCue {
  id: number;
  startTime: string;
  endTime: string;
  startSeconds: number;
  endSeconds: number;
  originalText: string;
  persianText?: string;
  slangNote?: string;
  alternative?: string;
  isEdited?: boolean;
  isPromo?: boolean;
}

export interface PromoSettings {
  text: string;
  insertAtStart: boolean;
  repeatCount: number;
  durationSeconds: number;
  minGapSeconds: number;
}

export type ToneId = 
  | 'street_gangster' 
  | 'tehrani_casual' 
  | 'comedy_sarcastic' 
  | 'gen_z_teen' 
  | 'action_gritty' 
  | 'drama_emotional'
  | 'custom';

export type SlangLevel = 'light' | 'medium' | 'heavy';

export interface ToneOption {
  id: ToneId;
  label: string;
  subLabel: string;
  description: string;
  badge: string;
  color: string;
  sampleBefore: string;
  sampleAfter: string;
}

export interface TranslationSettings {
  tone: ToneId;
  slangLevel: SlangLevel;
  movieContext: string;
  characterDescriptions: string;
  customInstructions: string;
  preserveTiming: boolean;
  netflixStandard?: boolean; // استانداردهای رسمی نتفلیکس (سقف ۲ خط، ۴۲ کاراکتر و شکستن گرامری)
  uncensored?: boolean;      // حالت بدون سانسور (ترجمه واقعی و صریح فحش‌ها و اصطلاحات لاتی)
  useRelay?: boolean;        // ارسال درخواست‌ها از طریق تونل رله ایران
  relayUrl?: string;         // آدرس رله اختصاصی (مثلاً https://arefkyanmehr.ir/srt.php)
  apiKey?: string;           // کلید اختصاصی کاربر برای جمنای جهت جلوگیری از خطای سهمیه (429)
  activeLearnedStyleId?: string;    // شناسه سبک آموزش‌دیده انتخاب‌شده
  activeLearnedStylePrompt?: string; // پرامپت و فرمول استخراج‌شده سبک آموزش‌دیده
  researchedMovieData?: MovieResearchData; // داده‌های تحقیق هوشمند درباره فیلم
}

export interface MovieResearchData {
  movieTitle: string;
  summary: string;
  tone: string;
  genre: string;
  year?: string;
  characters: Array<{ en: string; fa: string; role?: string; notes?: string }>;
  culturalNotes?: string;
  keyGlossary?: Array<{ term: string; fa: string; note?: string }>;
}

export interface LearnedStyleProfile {
  id: string;
  name: string;
  sourceFileName?: string;
  createdAt: number;
  description: string;
  toneSummary: string;
  slangFormulas: string[];
  characterNamingRules: string[];
  keyVocabulary: Array<{ en: string; fa: string; context?: string }>;
  fewShotSamples: Array<{ en: string; fa: string }>;
  isActive?: boolean;
}

export interface SampleScene {
  id: string;
  title: string;
  movieName: string;
  genre: string;
  description: string;
  recommendedTone: ToneId;
  subtitlesRaw: string;
  audioFrequency?: number; // for audio simulation or sample
}

export type ThemeMode = 'dark' | 'light';

export interface TranslationProgressInfo {
  isTranslating: boolean;
  isPaused: boolean;
  currentChunk: number;
  totalChunks: number;
  currentRange: string;
  totalTranslated: number;
  totalCues: number;
  percent: number;
  speedPerSec: number;
  elapsedSeconds: number;
  remainingSeconds: number;
}


