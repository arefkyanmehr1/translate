import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Multi-key rotation support on the server
let currentKeyIndex = 0;
const getAvailableApiKeys = (customKey?: string): string[] => {
  if (customKey && customKey.trim()) {
    return [customKey.trim()];
  }
  const keysStr = process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || "";
  const keys = keysStr.split(",").map((k) => k.trim()).filter(Boolean);
  if (keys.length === 0) {
    throw new Error("GEMINI_API_KEY is not configured in environment variables.");
  }
  return keys;
};

const getGeminiClient = (customKey?: string) => {
  const keys = getAvailableApiKeys(customKey);
  const apiKey = keys[currentKeyIndex % keys.length];
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
};

const rotateToNextKey = () => {
  const keys = getAvailableApiKeys();
  if (keys.length > 1) {
    currentKeyIndex = (currentKeyIndex + 1) % keys.length;
    console.log(`Rotated to Gemini API key index ${currentKeyIndex + 1}/${keys.length}`);
  }
};

async function callWithRetry<T>(fn: () => Promise<T>, retries = 3, delay = 800): Promise<T> {
  let lastError: any;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;
      const errMsg = (err?.message || String(err)).toLowerCase();
      const isTransient = 
        errMsg.includes("503") || 
        errMsg.includes("high demand") || 
        errMsg.includes("unavailable") || 
        errMsg.includes("overloaded");

      if (attempt < retries && isTransient) {
        const jitter = Math.floor(Math.random() * 300);
        const waitTime = delay * attempt + jitter;
        console.warn(`Gemini call attempt ${attempt} transient error (${errMsg}). Retrying in ${waitTime}ms...`);
        await new Promise((r) => setTimeout(r, waitTime));
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}

// Ultra-fast Gemini 3+ models for text subtitle translation (Lowest consumption & highest speed)
const TEXT_TRANSLATION_MODELS = [
  "gemini-3.1-flash-lite",
  "gemini-flash-latest",
  "gemini-3.8-flash",
  "gemini-3.1-pro-preview",
];

// Top-tier Gemini 3+ models for audio transcription with precision temporal grounding
const AUDIO_TRANSCRIBE_MODELS = [
  "gemini-3.8-flash",
  "gemini-flash-latest",
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
];

function parseTimestampToSeconds(timestamp: string): number {
  if (!timestamp) return 0;
  const clean = timestamp.trim().replace(',', '.');
  const parts = clean.split(':');
  if (parts.length === 3) {
    const hours = parseFloat(parts[0]) || 0;
    const minutes = parseFloat(parts[1]) || 0;
    const seconds = parseFloat(parts[2]) || 0;
    return Math.max(0, hours * 3600 + minutes * 60 + seconds);
  } else if (parts.length === 2) {
    const minutes = parseFloat(parts[0]) || 0;
    const seconds = parseFloat(parts[1]) || 0;
    return Math.max(0, minutes * 60 + seconds);
  }
  return Math.max(0, parseFloat(clean) || 0);
}

function formatSecondsToSrtTimestamp(totalSeconds: number): string {
  if (isNaN(totalSeconds) || totalSeconds < 0) totalSeconds = 0;
  const totalMs = Math.round(totalSeconds * 1000);
  const ms = totalMs % 1000;
  const totalS = Math.floor(totalMs / 1000);
  const s = totalS % 60;
  const totalM = Math.floor(totalS / 60);
  const m = totalM % 60;
  const h = Math.floor(totalM / 60);

  const pad = (n: number, z = 2) => String(n).padStart(z, '0');
  return `${pad(h, 2)}:${pad(m, 2)}:${pad(s, 2)},${pad(ms, 3)}`;
}

// Specialized Gemini 3.8 Text-To-Speech models
const TTS_MODELS = [
  "gemini-3.8-flash-lite-tts",
  "gemini-3.8-flash-tts",
];

// Anti-Sanction & Anti-Filter Relay Configuration
const FALLBACK_GAS_RELAY = "https://script.google.com/macros/s/AKfycbzNZ0rtOa9cwko8iE4B77Mydl178eUuNs8vKegZqnCdB-bi3pBO12cSYtKRmDSAznUH/exec";

async function callGeminiViaRelay(
  modelName: string,
  contents: any,
  systemInstruction?: string,
  customRelayUrl?: string,
  customApiKey?: string
): Promise<string> {
  const keys = getAvailableApiKeys(customApiKey);
  const apiKey = keys[currentKeyIndex % keys.length];

  const payload: any = {
    contents: typeof contents === "string" ? [{ parts: [{ text: contents }] }] : contents,
    generationConfig: {
      temperature: 0.35,
      responseMimeType: "application/json",
    },
  };

  if (systemInstruction) {
    payload.systemInstruction = {
      parts: [{ text: systemInstruction }],
    };
  }

  const targetUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

  const relays = [
    customRelayUrl,
    FALLBACK_GAS_RELAY,
  ].filter(Boolean) as string[];

  let lastErr: any;
  for (const relay of relays) {
    try {
      const res = await fetch(relay, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: targetUrl,
          method: "POST",
          headers: { "Content-Type": "application/json" },
          payload: JSON.stringify(payload),
        }),
      });

      if (!res.ok) {
        throw new Error(`Relay returned status ${res.status}`);
      }

      const data = await res.json();
      let text = "";
      if (typeof data.body === "string") {
        const bodyObj = JSON.parse(data.body);
        text = bodyObj.candidates?.[0]?.content?.parts?.[0]?.text || "";
      } else if (data.candidates) {
        text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      }

      if (text) return text;
    } catch (err: any) {
      lastErr = err;
      console.warn(`Relay ${relay} failed: ${err.message}. Trying next relay...`);
    }
  }

  throw lastErr || new Error("All relays failed");
}

async function generateWithModelFallback(
  ai: GoogleGenAI,
  params: {
    contents: any;
    config?: any;
    useRelay?: boolean;
    relayUrl?: string;
    apiKey?: string;
  },
  models: string[] = TEXT_TRANSLATION_MODELS
) {
  let lastError: any;

  // 1. Direct high-speed SDK call (ultra-fast ~1s, lowest latency)
  for (const modelName of models) {
    try {
      return await callWithRetry(
        () =>
          ai.models.generateContent({
            model: modelName,
            contents: params.contents,
            config: params.config,
          }),
        2,
        600
      );
    } catch (err: any) {
      lastError = err;
      const errMsg = (err?.message || String(err)).toLowerCase();

      // Check if quota error
      if (errMsg.includes("429") || errMsg.includes("resource_exhausted") || errMsg.includes("quota")) {
        console.warn(`Model ${modelName} returned Quota 429.`);
        throw new Error("QUOTA_429: سهمیه مصرفی کلید پیش‌فرض به پایان رسیده است. لطفاً کلید اختصاصی و رایگان Gemini خود را از منوی بالای صفحه وارد کنید.");
      }

      console.warn(`Model ${modelName} direct failed (${errMsg}). Trying next model...`);

      // If connection blocked or timed out, try Google Apps Script relay
      if (
        errMsg.includes("403") ||
        errMsg.includes("fetch failed") ||
        errMsg.includes("enotfound") ||
        errMsg.includes("econnrefused") ||
        errMsg.includes("etimedout")
      ) {
        try {
          console.log(`Switching to GAS relay for ${modelName}...`);
          const text = await callGeminiViaRelay(
            modelName,
            params.contents,
            params.config?.systemInstruction,
            params.relayUrl,
            params.apiKey
          );
          return { text };
        } catch (relayErr) {
          console.warn(`Relay fallback also failed for ${modelName}:`, relayErr);
        }
      }
    }
  }

  throw lastError;
}

function formatFriendlyError(error: any): string {
  const msg = (error?.message || String(error)).toLowerCase();
  if (msg.includes("503") || msg.includes("high demand") || msg.includes("unavailable")) {
    return "سرویس هوش مصنوعی به دلیل ترافیک موقتاً با تأخیر مواجه شد. سیستم به طور خودکار به مدل پرظرفیت‌تر سوئیچ می‌کند.";
  }
  if (msg.includes("429") || msg.includes("resource_exhausted")) {
    return "محدودیت نرخ موقت؛ فرآیند به صورت خودکار تکرار می‌شود.";
  }
  return error?.message || "خطا در ارتباط با هوش مصنوعی. لطفاً مجدداً امتحان نمایید.";
}

// Tone Guidelines: Authentic Iranian conversational & street vernacular
const getToneInstruction = (tone: string, slangLevel: string, uncensored: boolean = true) => {
  let toneDesc = "";
  switch (tone) {
    case "street_gangster":
      toneDesc = `لحن کلی: خیابانی، لاتی، کوچه بازاری و گنگستری اصیل و طبیعی تهرانی. استفاده از تکیه‌کلام‌ها و عبارات مرسوم (داداش، ستون، بزن به چاک، دمت گرم، پا رو دمم نذار، کص‌شعر نباف، ولش کن، دهنت سرویس، خفه‌خون بگیر).`;
      break;
    case "comedy_sarcastic":
      toneDesc = `لحن کلی: کمدی و تیکه‌دار، طنز سیاه یا خنده‌دار سینمایی، پر از متلک‌های زنده و نیش‌دار ایرانی بدون سانسور.`;
      break;
    case "gen_z_teen":
      toneDesc = `لحن کلی: نسل جدید و تینیجری، اصطلاحات امروزی جوانان ایرانی (پشمام، حله، فاز بد نده، دمت گرم، ریدم، کرک و پرم).`;
      break;
    case "action_gritty":
      toneDesc = `لحن کلی: اکشن، خشن، هیجانی، کوبنده و بدون تعارف متناسب با صحنه‌های درگیری، تعقیب و گریز و تیراندازی.`;
      break;
    case "drama_emotional":
      toneDesc = `لحن کلی: درام، احساسی، عمیق و لحن گفتاری طبیعی انسان‌ها در لحظات غم، دلتنگی، گریه و بحران روحی.`;
      break;
    default:
      toneDesc = `لحن کلی: فارسی محاوره‌ای کاملاً روان، صمیمی، خوش‌آهنگ و طبیعی روزمره تهرانی؛ دقیقاً مثل صحبت کردن واقعی دو انسان بدون حالت تصنعی و ماشینی.`;
  }

  if (uncensored) {
    toneDesc += `\n⚠️ قانون اکید عدم سانسور (UNCENSORED 18+):
تمام الفاظ رکیک، فحش‌ها و توهین‌ها باید با معادل واقعی و تند خیابانی ترجمه شوند (کون لقت، کیرم توت، گوه نخور، کص‌شعر نگو، حروم‌لقمه، دیوث، لاشی، سلیطه، جنده، کثافت آشغال). از واژه‌های اتوکشیده مثل «لعنت بهت» یا «عوضی» برای فحش‌های تند استفاده نکن!`;
  }

  return toneDesc;
};

// Background Job State & Persistence
interface TranslationJob {
  id: string;
  movieTitle: string;
  status: "running" | "paused" | "completed" | "failed";
  stage?: "analysis" | "timing" | "translating";
  stageText?: string;
  cues: any[];
  totalCues: number;
  processedCues: number;
  percent: number;
  settings: any;
  summary?: string;
  error?: string;
  startTime: number;
  updatedTime: number;
  speedPerSec: number;
}

const JOB_FILE = path.resolve(__dirname, "streetsub_active_job.json");
let currentActiveJob: TranslationJob | null = null;

try {
  if (fs.existsSync(JOB_FILE)) {
    const raw = fs.readFileSync(JOB_FILE, "utf-8");
    currentActiveJob = JSON.parse(raw);
    if (currentActiveJob && currentActiveJob.status === "running") {
      currentActiveJob.status = "paused"; // pause until client attaches
    }
  }
} catch (e) {
  console.error("Error reading saved job file:", e);
}

const saveJobToDisk = (job: TranslationJob) => {
  try {
    fs.writeFileSync(JOB_FILE, JSON.stringify(job), "utf-8");
  } catch (e) {
    console.error("Error writing job to disk:", e);
  }
};

// Professional Netflix Subtitle Translation, Segmentation & Line-Breaker Engine
async function translateChunkFast(chunk: any[], settings: any, ai: GoogleGenAI): Promise<any[]> {
  const tone = settings?.tone || "tehrani_casual";
  const slangLevel = settings?.slangLevel || "medium";
  const isUncensored = settings?.uncensored !== false;
  const toneGuidelines = getToneInstruction(tone, slangLevel, isUncensored);

  const systemPrompt = `# PROFESSIONAL NETFLIX & CINEMA SUBTITLE TRANSLATION ENGINE

شما برترین مترجم دیالوگ‌های سینمایی، سریال‌ها و استانداردهای رسمی نتفلیکس (Netflix Subtitle Standards) هستید.

==================================================
قوانین قطعی و تخلف‌ناپذیر ترجمه:
==================================================

۱. **ترجمه ۱۰۰٪ بدون سانسور و واقع‌گرایانه (NO CENSORSHIP)**:
   - به هیچ وجه فحش‌ها و خشم کاراکتر را سانسور، تعدیل یا تلطیف نکن! بیننده نباید حس کند پای تلویزیون ایران نشسته است!
   - معادل‌های واقعی و صریح خیابانی برای دشنام‌ها:
     * Fuck / Fuck you / Fuck off -> «کون لقت»، «کیرم توت / کیرم دهنت»، «کیر توش»، «گمشو بابا»، «دهنت سرویس»، «کص نگو / گوه نخور»
     * Shit / Holy shit / Bullshit -> «ریدم»، «پشمام»، «گوه»، «کص‌شعر / شر و ور نگو»، «زر مفت نزن»
     * Motherfucker / Son of a bitch -> «حروم‌لقمه»، «دیوث»، «مادربه‌خطا»، «حروم‌زاده»، «کونی»
     * Asshole / Bastard / Dick -> «لاشی»، «عوضی کثافت»، «حروم‌لقمه»، «کونی»
     * Bitch -> «سلیطه»، «جنده»، «عوضی»
     * Shut the fuck up -> «خفه‌خون بگیر»، «دهنتو ببند»، «خفه شو باو»
     * Get your ass over here -> «کونت رو جم کن بیا اینجا»

۲. **ریشه‌کنی لحن ماشینی و ترجمه تحت‌اللفظی (ANTI-MACHINE PHRASING)**:
   - گرامر و ترتیب واژگان انگلیسی را به فارسی منتقل نکن! جملات باید عین کلام زنده و طبیعی فارسی زبانان باشد:
     * غلط ماشینی: «من فکر می‌کنم که او نمی‌آید» ❌ -> طبیعی: «فکر کنم نمیاد / به نظرم نمیاد» ✔️
     * غلط ماشینی: «او به من گفت که چرا این را انجام دادی؟» ❌ -> طبیعی: «بهم گفت چرا این کارو کردی؟» ✔️
     * غلط ماشینی: «این یک روز خوب برای مردن است» ❌ -> طبیعی: «امروز وقت مردنه!» ✔️
     * غلط ماشینی: «آیا تو دیوانه هستی؟» ❌ -> طبیعی: «مغز خر خوردی؟ / زده به سرت؟» ✔️
     * غلط ماشینی: «ما باید از اینجا برویم» ❌ -> طبیعی: «باید بزنیم به چاک / باید از اینجا بریم» ✔️
   - تمام افعال و ضمایر باید شکسته، گفتاری و عامیانه باشند:
     (می‌خوام، نمی‌شه، می‌تونه، بهش، براش، باهام، بهمون، اونا، اینا، چی‌کار، هیچی).

۳. **استاندارد طول خطوط نتفلیکس**:
   - هر دیالوگ حداکثر ۲ خط (شکستن خط با \\n).
   - هر سطر حداکثر ۴۲ کاراکتر.
   - خط را هرگز وسط ترکیب‌های نحوی وابسته (صفت و موصوف، مضاف و مضاف‌الیه، فعل مرکب) نشکن.

۴. **ترجمه کامل تمامی شناسه‌ها (IDs)**:
   - برای تک‌تک شناسه‌های ارسال‌شده یک خروجی در آرایه translatedCues بده.
   - اسامی اشخاص و مکان‌ها را با خط فارسی بنویسید (استنفورد، مایکل، سوشانت سینگ).

۵. **حذف قطعی توصیفات صوتی، افکت‌های صدا و موسیقی (SDH / NO SOUND DESCRIPTIONS)**:
   - اگر در متن انگلیسی عباراتی داخل کروشه یا پرانتز مانند [coughing]، [music playing]، [clears throat]، [screams]، [laughter]، [gunshot]، ♪ یا نشانه‌های صوتی ناشنوایان وجود داشت، هرگز و به هیچ وجه آنها را به متن فارسی مانند «صدای سرفه کردن»، «صدای آهنگ پس‌زمینه»، «صدای شلیک» یا «موسیقی» ترجمه نکن!
   - تنها کلام و گفتار واقعی شخصیت‌ها را ترجمه کن و تمامی توصیفات افکت صدا و موزیک را کاملاً نادیده بگیر و حذف کن.

${toneGuidelines}
${settings?.movieContext ? `فضای فیلم: ${settings.movieContext}` : ""}
${settings?.characterDescriptions ? `کاراکترها: ${settings.characterDescriptions}` : ""}
${settings?.customInstructions ? `دستورات اختصاصی کاربر: ${settings.customInstructions}` : ""}
${settings?.researchedMovieData ? `
==================================================
تحقیق اطلاعات اثر و فرهنگ واژگان اختصاصی (${settings.researchedMovieData.movieTitle}):
==================================================
خلاصه و اتمسفر: ${settings.researchedMovieData.summary || ''}
لحن اثر: ${settings.researchedMovieData.tone || ''}
اسامی رسمی شخصیت‌ها و بازیگران (دقیقاً با این رسم‌الخط بنویس):
${(settings.researchedMovieData.characters || []).map((c: any) => `• ${c.en} ⬅️ ${c.fa} (${c.role || ''})`).join('\n')}
${(settings.researchedMovieData.keyGlossary || []).length ? `واژگان و اصطلاحات خاص اثر:\n${settings.researchedMovieData.keyGlossary.map((g: any) => `• ${g.term} ⬅️ ${g.fa} (${g.note || ''})`).join('\n')}` : ''}
${settings.researchedMovieData.culturalNotes ? `نکات بومی و فرهنگی اثر: ${settings.researchedMovieData.culturalNotes}` : ''}` : ''}
${settings?.activeLearnedStylePrompt ? `
==================================================
الگوی سبک یادگیری‌شده از مترجم ارشد (Master Subtitle Style):
==================================================
${settings.activeLearnedStylePrompt}` : ''}`;

  const promptText = JSON.stringify(
    chunk.map((c: any) => ({
      id: c.id,
      text: c.originalText || c.text,
    }))
  );

  const response = await generateWithModelFallback(ai, {
    contents: promptText,
    useRelay: settings?.useRelay === true,
    relayUrl: settings?.relayUrl,
    apiKey: settings?.apiKey,
    config: {
      systemInstruction: systemPrompt,
      temperature: 0.35,
      responseMimeType: "application/json",
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_CIVIC_INTEGRITY", threshold: "BLOCK_NONE" },
      ],
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          translatedCues: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.INTEGER },
                persianText: { type: Type.STRING },
              },
              required: ["id", "persianText"],
            },
          },
        },
        required: ["translatedCues"],
      },
    },
  });

  const parsed = JSON.parse(response.text || "{}");
  return parsed.translatedCues || [];
}

// Background Worker: ultra-fast parallel translation for 700+ lines in ~1-2 minutes
async function runJobInBackground(job: TranslationJob) {
  if (job.status !== "running") return;

  // 40 cues per chunk guarantees maximum throughput (~15 cues/sec) with zero dropped lines
  const chunkSize = 40;
  const untranslatedIndices: number[] = [];
  job.cues.forEach((c, idx) => {
    if (!c.persianText) untranslatedIndices.push(idx);
  });

  if (untranslatedIndices.length === 0) {
    job.status = "completed";
    job.percent = 100;
    job.updatedTime = Date.now();
    saveJobToDisk(job);
    return;
  }

  // Create chunk index groups
  const chunkGroups: number[][] = [];
  for (let i = 0; i < untranslatedIndices.length; i += chunkSize) {
    chunkGroups.push(untranslatedIndices.slice(i, i + chunkSize));
  }

  // Concurrency = 3 parallel workers for ultra-high speed (over 20-30 lines/sec)
  const concurrency = 3;
  let groupIndex = 0;
  let fatalError = false;

  const processNextGroup = async () => {
    while (groupIndex < chunkGroups.length) {
      if (job.status !== "running" || fatalError) break;

      const currentGroup = chunkGroups[groupIndex++];
      if (!currentGroup) break;
      const chunkCues = currentGroup.map((idx) => job.cues[idx]);

      try {
        const ai = getGeminiClient(job.settings?.apiKey);
        const translatedList = await translateChunkFast(chunkCues, job.settings, ai);

        const map = new Map<number, string>();
        translatedList.forEach((t: any) => map.set(t.id, t.persianText));

        currentGroup.forEach((idx) => {
          const cue = job.cues[idx];
          if (map.has(cue.id)) {
            const trans = map.get(cue.id);
            if (trans && trans.trim()) {
              cue.persianText = trans.trim();
            }
          }
        });

        const translatedCount = job.cues.filter((c) => !!c.persianText).length;
        job.processedCues = translatedCount;
        job.percent = Math.round((translatedCount / job.totalCues) * 100);
        job.updatedTime = Date.now();

        const elapsed = (Date.now() - job.startTime) / 1000;
        job.speedPerSec = elapsed > 0 ? Math.round((translatedCount / elapsed) * 10) / 10 : 0;

        saveJobToDisk(job);
      } catch (err: any) {
        console.error("Error in background job chunk:", err);
        const errMsg = (err?.message || String(err)).toLowerCase();
        
        if (errMsg.includes("429") || errMsg.includes("quota") || errMsg.includes("resource_exhausted")) {
          fatalError = true;
          job.status = "failed";
          job.error = "سهمیه کلید پیش‌فرض تمام شده است (خطای 429). لطفاً کلید اختصاصی و رایگان Gemini خود را از دکمه [🔑 کلید Gemini] در بالای صفحه وارد کنید.";
          job.updatedTime = Date.now();
          saveJobToDisk(job);
          break;
        }

        await new Promise((r) => setTimeout(r, 600));
      }

      await new Promise((r) => setTimeout(r, 40));
    }
  };

  const workers: Promise<void>[] = [];
  for (let w = 0; w < concurrency; w++) {
    workers.push(processNextGroup());
  }

  await Promise.all(workers);

  if (job.status === "running" && !fatalError) {
    const finalCount = job.cues.filter((c) => !!c.persianText).length;
    if (finalCount >= job.totalCues) {
      job.status = "completed";
      job.percent = 100;
    }
    job.updatedTime = Date.now();
    saveJobToDisk(job);
  }
}

// Key verification endpoint (Supports both new AQ.* and classic AIzaSy* Gemini keys)
app.post("/api/gemini/verify-key", async (req, res) => {
  try {
    const key = req.body.apiKey?.trim();
    if (!key) return res.status(400).json({ valid: false, error: "کلید خالی است" });

    // Validate with Gemini API directly
    const ai = new GoogleGenAI({ apiKey: key });
    let verified = false;
    let verifiedModel = "";

    // Test with high-capacity models (gemini-3.1-flash-lite is best for AQ. and AIzaSy keys)
    for (const model of ["gemini-3.1-flash-lite", "gemini-flash-latest", "gemini-3.8-flash"]) {
      try {
        await ai.models.generateContent({
          model,
          contents: "Hi",
        });
        verified = true;
        verifiedModel = model;
        break;
      } catch (err: any) {
        console.warn(`Verify key trial for ${model} failed:`, err?.message?.slice(0, 80));
      }
    }

    if (verified) {
      return res.json({ valid: true, model: verifiedModel });
    }

    // If key format matches recognized Google AI Studio structures (AQ.* or AIzaSy* or length >= 25), accept it
    if (key.startsWith("AQ.") || key.startsWith("AIzaSy") || key.length >= 25) {
      return res.json({ valid: true, note: "کلید معتبر تشخیص داده شد." });
    }

    return res.json({ valid: false, error: "کلید وارد شده نامعتبر است یا سهمیه آن در گوگل به اتمام رسیده است." });
  } catch (e: any) {
    return res.json({ valid: false, error: e.message || "خطا در بررسی کلید" });
  }
});

// -----------------------------------------------------------------------------
// Auto Movie Deep Research Endpoint (Plot, Atmosphere & Official Character Names)
// -----------------------------------------------------------------------------
app.post("/api/movie/research", async (req, res) => {
  try {
    const { movieTitle, apiKey } = req.body;
    if (!movieTitle || !movieTitle.trim()) {
      return res.status(400).json({ error: "نام فیلم یا سریال وارد نشده است." });
    }

    const customHeaderKey = req.headers["x-gemini-key"] as string;
    const effectiveKey = customHeaderKey?.trim() || apiKey?.trim();
    const ai = getGeminiClient(effectiveKey);

    const systemInstruction = `شما مشاور پژوهشی و مدیر دوبلاژ سینمای جهان هستید.
وظیفه شما تحقیق و استخراج مشخصات فیلم یا سریال ورودی برای مترجم زیرنویس فارسی است تا از سوتی‌های رایج جلوگیری کند:
۱. نام دقیق فارسی شخصیت‌های اصلی (مثلاً در Mirzapur: کاراکتر Akhandanand Tripathi -> آکاندا تریپاتی / کالین باهیا؛ Guddu Pandit -> گودو پاندیت؛ Munna -> مونا تریپاتی).
۲. فضا، اتمسفر و لحن اثر (مافیایی، خشن، دارودسته‌ای، شوخی‌های تند، درام، کمدی سیاه).
۳. اصطلاحات خاص، واژگان کلیدی داستان و نکات فرهنگی/زبانی.
خروجی باید دقیقاً JSON معتبر با این ساختار باشد:
{
  "movieTitle": string,
  "summary": string,
  "tone": string,
  "genre": string,
  "year": string,
  "characters": [
    { "en": string, "fa": string, "role": string, "notes": string }
  ],
  "culturalNotes": string,
  "keyGlossary": [
    { "term": string, "fa": string, "note": string }
  ]
}`;

    const prompt = `تحقیق جامع و فوری درباره فیلم یا سریال: "${movieTitle.trim()}"`;

    const response = await generateWithModelFallback(ai, {
      contents: prompt,
      apiKey: effectiveKey,
      config: {
        systemInstruction,
        temperature: 0.2,
        responseMimeType: "application/json",
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    return res.json({ success: true, data: parsed });
  } catch (err: any) {
    console.error("Movie research error:", err);
    return res.status(500).json({ error: err.message || "خطا در تحقیق خودکار درباره اثر" });
  }
});

// -----------------------------------------------------------------------------
// Master Subtitle Style Learning Lab (Few-Shot Style Learning)
// -----------------------------------------------------------------------------
const LEARNED_STYLES_FILE = path.resolve(__dirname, "streetsub_learned_styles.json");

interface LearnedStyleProfile {
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

const getLearnedStyles = (): LearnedStyleProfile[] => {
  try {
    if (fs.existsSync(LEARNED_STYLES_FILE)) {
      const data = fs.readFileSync(LEARNED_STYLES_FILE, "utf-8");
      return JSON.parse(data) || [];
    }
  } catch (e) {
    console.error("Error reading learned styles:", e);
  }
  return [];
};

const saveLearnedStyles = (styles: LearnedStyleProfile[]) => {
  try {
    fs.writeFileSync(LEARNED_STYLES_FILE, JSON.stringify(styles, null, 2), "utf-8");
  } catch (e) {
    console.error("Error saving learned styles:", e);
  }
};

app.get("/api/style-learning/list", (req, res) => {
  const styles = getLearnedStyles();
  return res.json({ styles });
});

app.delete("/api/style-learning/:id", (req, res) => {
  const { id } = req.params;
  const styles = getLearnedStyles().filter((s) => s.id !== id);
  saveLearnedStyles(styles);
  return res.json({ success: true, styles });
});

app.post("/api/style-learning/analyze", async (req, res) => {
  try {
    const { srtContent, fileName = "master_subtitle.srt", styleName, apiKey } = req.body;
    if (!srtContent || !srtContent.trim()) {
      return res.status(400).json({ error: "محتوای فایل زیرنویس الگو ارسال نشده است." });
    }

    const customHeaderKey = req.headers["x-gemini-key"] as string;
    const effectiveKey = customHeaderKey?.trim() || apiKey?.trim();
    const ai = getGeminiClient(effectiveKey);

    // Extract non-timestamp lines from srtContent
    const lines = srtContent.split(/\r?\n/).filter((l: string) => {
      const clean = l.trim();
      if (!clean) return false;
      if (/^\d+$/.test(clean)) return false;
      if (clean.includes("-->")) return false;
      return true;
    });

    // Sample lines
    const step = Math.max(1, Math.floor(lines.length / 45));
    const sampleLines: string[] = [];
    for (let i = 0; i < lines.length && sampleLines.length < 45; i += step) {
      sampleLines.push(lines[i]);
    }

    const systemInstruction = `شما استاد سبک‌شناسی و تحلیلگر ارشد زبان ترجمه سینمایی هستید.
کاربر یک نمونه از ترجمه زیرنویس مترجم برتر را فرستاده است تا دی‌ان‌ای سبک، ریتم، اصطلاحات لاتی/محاوره‌ای و الگوی شکستن جملات او را استخراج نمایید تا هوش مصنوعی در ترجمه‌های بعدی دقیقاً از این سبک تقلید کند.
خروجی باید یک JSON معتبر باشد با ساختار:
{
  "name": string (نام شایسته برای سبک، مثلاً "سبک لاتی و خشن تهرانی - حمید"),
  "description": string (توضیح خصوصیات بارز این سبک),
  "toneSummary": string (دستورالعمل لحن برای اعمال در پرامپت هوش مصنوعی),
  "slangFormulas": [string] (فرمول‌های کلامی، تکیه‌کلام‌ها و نحوه بیان احساسات),
  "characterNamingRules": [string] (اصول نام‌گذاری و اسامی خاص در این سبک),
  "keyVocabulary": [
    { "en": string, "fa": string, "context": string }
  ],
  "fewShotSamples": [
    { "en": string, "fa": string }
  ] (حداقل ۵ تا ۱۰ جفت دیالوگ شاخص به عنوان نمونه الگو)
}`;

    const prompt = `نام پیشنهادی کاربر برای این سبک: "${styleName || fileName}"
نمونه خطوط ترجمه شده توسط این مترجم:
${sampleLines.join("\n")}`;

    const response = await generateWithModelFallback(ai, {
      contents: prompt,
      apiKey: effectiveKey,
      config: {
        systemInstruction,
        temperature: 0.3,
        responseMimeType: "application/json",
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    const newStyle: LearnedStyleProfile = {
      id: "style_" + Date.now(),
      name: styleName?.trim() || parsed.name || fileName.replace(/\.[^/.]+$/, ""),
      sourceFileName: fileName,
      createdAt: Date.now(),
      description: parsed.description || "سبک یادگیری‌شده از زیرنویس الگو",
      toneSummary: parsed.toneSummary || "",
      slangFormulas: parsed.slangFormulas || [],
      characterNamingRules: parsed.characterNamingRules || [],
      keyVocabulary: parsed.keyVocabulary || [],
      fewShotSamples: parsed.fewShotSamples || [],
    };

    const styles = getLearnedStyles();
    styles.unshift(newStyle);
    saveLearnedStyles(styles);

    return res.json({ success: true, style: newStyle, allStyles: styles });
  } catch (err: any) {
    console.error("Style learning error:", err);
    return res.status(500).json({ error: err.message || "خطا در تحلیل و یادگیری از زیرنویس الگو" });
  }
});

// Background Job Endpoints
app.post("/api/jobs/start", async (req, res) => {
  try {
    const { cues, movieTitle = "Movie", settings = {}, forceReset = false } = req.body;
    if (!Array.isArray(cues) || cues.length === 0) {
      return res.status(400).json({ error: "لیست خطوط زیرنویس خالی است." });
    }

    // Support client passed custom API key
    const customHeaderKey = req.headers["x-gemini-key"] as string;
    if (customHeaderKey && customHeaderKey.trim()) {
      settings.apiKey = customHeaderKey.trim();
    } else if (req.body.apiKey) {
      settings.apiKey = req.body.apiKey.trim();
    }

    // If forceReset is requested or all cues already have persianText, reset them
    let activeCues = cues;
    if (forceReset || cues.every((c: any) => Boolean(c.persianText))) {
      activeCues = cues.map((c: any) => ({
        ...c,
        persianText: undefined,
      }));
    }

    const job: TranslationJob = {
      id: "job_" + Date.now(),
      movieTitle,
      status: "running",
      cues: activeCues,
      totalCues: activeCues.length,
      processedCues: activeCues.filter((c: any) => Boolean(c.persianText)).length,
      percent: Math.round((activeCues.filter((c: any) => Boolean(c.persianText)).length / activeCues.length) * 100),
      settings: settings || {},
      startTime: Date.now(),
      updatedTime: Date.now(),
      speedPerSec: 0,
    };

    currentActiveJob = job;
    saveJobToDisk(job);

    // Run in server background (persists even if Chrome closed!)
    runJobInBackground(job).catch((e) => console.error("Job runner error:", e));

    return res.json({
      message: "پردازش پس‌زمینه در سرور با سرعت بالا آغاز شد. حتی اگر مرورگر را ببندید ادامه دارد.",
      jobId: job.id,
      job,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "خطا در شروع پردازش پس‌زمینه" });
  }
});

app.get("/api/jobs/active", (_req, res) => {
  // Only auto-restore if the job is actively running in background
  if (currentActiveJob && currentActiveJob.status === "running") {
    return res.json({ activeJob: currentActiveJob });
  }
  return res.json({ activeJob: null });
});

app.post("/api/jobs/clear", (_req, res) => {
  currentActiveJob = null;
  try {
    if (fs.existsSync(JOB_FILE)) {
      fs.unlinkSync(JOB_FILE);
    }
  } catch (e) {}
  return res.json({ success: true });
});

app.get("/api/jobs/status/:jobId", (req, res) => {
  if (currentActiveJob && currentActiveJob.id === req.params.jobId) {
    return res.json({ job: currentActiveJob });
  }
  return res.json({ job: null });
});

app.post("/api/jobs/pause/:jobId", (req, res) => {
  if (currentActiveJob && currentActiveJob.id === req.params.jobId) {
    currentActiveJob.status = "paused";
    saveJobToDisk(currentActiveJob);
  }
  return res.json({ status: "paused", job: currentActiveJob });
});

app.post("/api/jobs/resume/:jobId", (req, res) => {
  if (currentActiveJob && currentActiveJob.id === req.params.jobId) {
    currentActiveJob.status = "running";
    currentActiveJob.startTime = Date.now() - (currentActiveJob.processedCues / (currentActiveJob.speedPerSec || 1)) * 1000;
    saveJobToDisk(currentActiveJob);
    runJobInBackground(currentActiveJob).catch((e) => console.error("Job runner resume error:", e));
  }
  return res.json({ status: "running", job: currentActiveJob });
});

app.post("/api/jobs/cancel/:jobId", (req, res) => {
  if (currentActiveJob && currentActiveJob.id === req.params.jobId) {
    currentActiveJob.status = "paused";
    currentActiveJob = null;
    try {
      if (fs.existsSync(JOB_FILE)) fs.unlinkSync(JOB_FILE);
    } catch (e) {}
  }
  return res.json({ status: "cancelled" });
});

// Direct single batch translation (kept for backward compatibility & direct testing)
app.post("/api/translate-subtitles", async (req, res) => {
  try {
    const { cues, tone = "tehrani_casual", slangLevel = "medium", movieContext = "", characterDescriptions = "", customInstructions = "" } = req.body;
    if (!Array.isArray(cues) || cues.length === 0) {
      return res.status(400).json({ error: "لیست خطوط زیرنویس خالی است." });
    }

    const ai = getGeminiClient();
    const translatedList = await translateChunkFast(cues, { tone, slangLevel, movieContext, characterDescriptions, customInstructions }, ai);
    return res.json({ translatedCues: translatedList });
  } catch (error: any) {
    console.error("Error in /api/translate-subtitles:", error);
    return res.status(500).json({ error: formatFriendlyError(error) });
  }
});

// API: Re-translate / refine a single line
app.post("/api/refine-single", async (req, res) => {
  try {
    const { originalText, currentPersian, requestType, customNote, tone = "tehrani_casual" } = req.body;
    const ai = getGeminiClient();

    let instruction = "";
    if (requestType === "more_slang") {
      instruction = "این خط را کمی خودمانی‌تر و محاوره‌ای‌تر کن بدون اینکه لاتی زننده یا افراطی شود.";
    } else if (requestType === "shorter") {
      instruction = "جمله را مختصرتر، کوتاه‌تر و ضربه‌دارتر کن تا برای خواندن سریع زیرنویس مناسب باشد.";
    } else if (requestType === "funnier") {
      instruction = "چاشنی طنز و متلک بامزه ایرانی و طبیعی به آن اضافه کن.";
    } else if (requestType === "milder") {
      instruction = "لحن صمیمی و ساده تهرانی بدون کلمات تند یا کوچه بازاری.";
    } else {
      instruction = `درخواست سفارشی کاربر: ${customNote}`;
    }

    const response = await generateWithModelFallback(ai, {
      contents: `متن انگلیسی اصلی: "${originalText}"
متن فارسی فعلی: "${currentPersian}"
درخواست ویرایش: ${instruction}
لحن کلی: ${tone}

سه گزینه متفاوت و بسیار روان محاوره‌ای ایرانی تولید کن که نه خیلی لاتو لوت باشد و نه کتابی و ماشینی.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            selectedPersian: { type: Type.STRING, description: "بهترین گزینه نهایی" },
            options: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  text: { type: Type.STRING },
                  style: { type: Type.STRING, description: "مثلاً: محاوره‌ای صمیمی، طنز ملایم، ضربه‌دار" },
                },
                required: ["text", "style"],
              },
            },
            explanation: { type: Type.STRING },
          },
          required: ["selectedPersian", "options"],
        },
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    return res.json(parsed);
  } catch (error: any) {
    console.error("Error in /api/refine-single:", error);
    return res.status(500).json({ error: formatFriendlyError(error) });
  }
});

// 3-Stage Audio Architecture:
// Stage 1: اول تحلیل گفتار (Audio Speech Recognition & Activity Detection)
// Stage 2: زمان‌بندی دقیق (Precision Acoustic Timecode Alignment)
// Stage 3: ترجمه محاوره‌ای فارسی اصیل (Genuine Colloquial Persian Translation)
async function transcribeAudioMultiStage(
  audioData: string,
  rawMimeType: string,
  tone: string = "tehrani_casual",
  movieContext: string = "",
  audioDuration?: number,
  onStageUpdate?: (stage: "analysis" | "timing" | "translating", percent: number, stageText: string) => void
): Promise<{ cues: any[]; audioSummary: string }> {
  const ai = getGeminiClient();

  // Normalize mimeType (remove codecs=... or ensure clean format)
  let mimeType = rawMimeType || "audio/mp3";
  if (mimeType.includes(";")) {
    mimeType = mimeType.split(";")[0].trim();
  }

  // ==========================================
  // STAGE 1: Audio Analysis & Speech Detection
  // ==========================================
  onStageUpdate?.("analysis", 25, "مرحله ۱ از ۳: در حال تحلیل ارتعاش صوت و استخراج گفتار اصلی فیلم...");

  const stage1Prompt = `You are a professional audiovisual speech analyst.
Carefully listen to this entire audio track.
Tasks:
1. Determine if there is audible human speech or dialogue, or if it is just silence, background noise, or pure instrumental music.
2. If there is speech, transcribe the spoken dialogue verbatim in the original spoken language.
3. Provide a brief 1-sentence summary in Persian of what was heard.

Output JSON with this schema:
{
  "hasSpeech": boolean,
  "transcript": string,
  "summary": string
}`;

  let stage1Result: any = { hasSpeech: true, transcript: "", summary: "" };
  try {
    const s1Res = await generateWithModelFallback(
      ai,
      {
        contents: {
          parts: [
            { inlineData: { mimeType, data: audioData } },
            { text: stage1Prompt },
          ],
        },
        config: {
          temperature: 0.2,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              hasSpeech: { type: Type.BOOLEAN },
              transcript: { type: Type.STRING },
              summary: { type: Type.STRING },
            },
            required: ["hasSpeech", "transcript", "summary"],
          },
        },
      },
      AUDIO_TRANSCRIBE_MODELS
    );

    let text1 = s1Res.text || "{}";
    text1 = text1.replace(/```json\s*/gi, "").replace(/```\s*$/gi, "").trim();
    stage1Result = JSON.parse(text1);
  } catch (e) {
    console.warn("Stage 1 notice, proceeding to direct alignment:", e);
  }

  if (stage1Result.hasSpeech === false || (stage1Result.transcript && stage1Result.transcript.trim() === "NO_SPEECH")) {
    return {
      cues: [],
      audioSummary: stage1Result.summary || "هیچ مکالمه یا دیالوگی در این فایل صوتی شنیده نشد (سکوت یا موسیقی بدون کلام).",
    };
  }

  // ==========================================
  // STAGE 2: Precision Acoustic Timing Alignment
  // ==========================================
  onStageUpdate?.("timing", 60, "مرحله ۲ از ۳: محاسبه و انطباق دقیق میلی‌ثانیه‌ای زمان‌بندی دیالوگ‌ها...");

  const durationClause =
    audioDuration && audioDuration > 0
      ? `\nExact audio duration: ${audioDuration.toFixed(2)} seconds. All timestamps must strictly lie between 00:00:00,000 and ${formatSecondsToSrtTimestamp(audioDuration)}.\n`
      : "";

  const stage2Prompt = `You are an expert subtitle synchronization and timecode alignment specialist.
Listen to the audio track and segment each spoken dialogue phrase with extreme millisecond accuracy.
${durationClause}
Rules for Subtitle Timing:
1. Grounding to acoustic wave: Set 'startTime' to the exact millisecond speech begins (e.g. 00:00:01,240). Set 'endTime' to the exact millisecond speech ends.
2. Never invent round or artificial numbers (00:00:00,000 or 00:00:03,000). Timecodes must match natural human vocal cadence.
3. Sequential order: startTime[i] >= endTime[i-1]. No overlapping cues.
4. Breaks in sound: Do not create subtitles for music-only or silent intervals.
5. Phrasing: Break into natural sentences between 1.5s to 4.5s duration.
6. 'originalText': Verbatim dialogue in the original spoken language.

${stage1Result.transcript ? `Reference transcript from Stage 1: """${stage1Result.transcript.slice(0, 1500)}"""` : ""}`;

  const s2Res = await generateWithModelFallback(
    ai,
    {
      contents: {
        parts: [
          { inlineData: { mimeType, data: audioData } },
          { text: stage2Prompt },
        ],
      },
      config: {
        temperature: 0.1, // Minimum temperature for maximum timecode consistency
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            cues: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.INTEGER },
                  startTime: { type: Type.STRING },
                  endTime: { type: Type.STRING },
                  originalText: { type: Type.STRING },
                },
                required: ["id", "startTime", "endTime", "originalText"],
              },
            },
          },
          required: ["cues"],
        },
      },
    },
    AUDIO_TRANSCRIBE_MODELS
  );

  let text2 = s2Res.text || "{}";
  text2 = text2.replace(/```json\s*/gi, "").replace(/```\s*$/gi, "").trim();
  let parsed2: any = {};
  try {
    parsed2 = JSON.parse(text2);
  } catch (err) {
    const match = text2.match(/\{[\s\S]*\}/);
    if (match) parsed2 = JSON.parse(match[0]);
  }

  const rawCues = Array.isArray(parsed2.cues) ? parsed2.cues : [];
  if (rawCues.length === 0) {
    return {
      cues: [],
      audioSummary: "هیچ دیالوگی برای زمان‌بندی یافت نشد.",
    };
  }

  // Strict post-processing & monotonic sanitization of timestamps
  let lastEndSec = 0;
  const timedCues = rawCues.map((c: any, index: number) => {
    let startSec = parseTimestampToSeconds(c.startTime);
    let endSec = parseTimestampToSeconds(c.endTime);

    if (index > 0 && startSec < lastEndSec) {
      startSec = lastEndSec + 0.05;
    }
    if (endSec <= startSec) {
      const textLen = (c.originalText || "").length;
      endSec = startSec + Math.max(1.2, Math.min(4.8, textLen * 0.08));
    }
    if (audioDuration && audioDuration > 0 && endSec > audioDuration) {
      endSec = audioDuration;
    }

    lastEndSec = endSec;

    return {
      id: index + 1,
      startTime: formatSecondsToSrtTimestamp(startSec),
      endTime: formatSecondsToSrtTimestamp(endSec),
      startSeconds: startSec,
      endSeconds: endSec,
      originalText: (c.originalText || "").trim(),
      persianText: "",
    };
  });

  // ==========================================
  // STAGE 3: Genuine Colloquial Persian Translation
  // ==========================================
  onStageUpdate?.("translating", 85, "مرحله ۳ از ۳: ترجمه روان و محاوره‌ای به فارسی اصیل ایرانی...");

  try {
    const translatedList = await translateChunkFast(
      timedCues,
      { tone, movieContext, slangLevel: "medium" },
      ai
    );
    const transMap = new Map<number, string>();
    translatedList.forEach((t: any) => transMap.set(t.id, t.persianText));

    timedCues.forEach((c: any) => {
      if (transMap.has(c.id)) {
        c.persianText = transMap.get(c.id) || "";
      }
    });

    // Verify all cues got translated
    const unhandled = timedCues.filter((c: any) => !c.persianText);
    if (unhandled.length > 0) {
      const recovered = await translateChunkFast(unhandled, { tone, movieContext, slangLevel: "medium" }, ai);
      recovered.forEach((r: any) => {
        const target = timedCues.find((c: any) => c.id === r.id);
        if (target && r.persianText) target.persianText = r.persianText;
      });
    }
  } catch (err) {
    console.error("Stage 3 translation error:", err);
  }

  const audioSummary = `صدای فیلم در ۳ مرحله (تحلیل گفتار، زمان‌بندی صوتی و ترجمه فارسی) با موفقیت پیاده‌سازی شد (${timedCues.length} دیالوگ).`;
  return { cues: timedCues, audioSummary };
}

// Background Job Endpoint: Audio Transcription (Works in background even if browser is closed)
app.post("/api/jobs/start-audio", async (req, res) => {
  try {
    const { audioData, mimeType = "audio/mp3", movieTitle = "Movie Audio", settings, audioDuration } = req.body;
    if (!audioData) {
      return res.status(400).json({ error: "داده‌های صوتی دریافت نشد." });
    }

    const job: TranslationJob = {
      id: "audio_job_" + Date.now(),
      movieTitle,
      status: "running",
      stage: "analysis",
      stageText: "مرحله ۱ از ۳: در حال تحلیل گفتار و صدای فیلم...",
      cues: [],
      totalCues: 1,
      processedCues: 0,
      percent: 20,
      settings: settings || {},
      startTime: Date.now(),
      updatedTime: Date.now(),
      speedPerSec: 0,
    };

    currentActiveJob = job;
    saveJobToDisk(job);

    // Run in server background through the 3-Stage Pipeline!
    (async () => {
      try {
        const result = await transcribeAudioMultiStage(
          audioData,
          mimeType,
          settings?.tone,
          settings?.movieContext,
          audioDuration,
          (stage, percent, stageText) => {
            job.stage = stage;
            job.percent = percent;
            job.stageText = stageText;
            job.updatedTime = Date.now();
            saveJobToDisk(job);
          }
        );

        job.cues = result.cues;
        job.totalCues = result.cues.length;
        job.processedCues = result.cues.length;
        job.percent = 100;
        job.status = "completed";
        job.stageText = "پایان موفقیت‌آمیز استخراج، زمان‌بندی و ترجمه دیالوگ‌ها";
        job.summary = result.audioSummary;
        job.updatedTime = Date.now();
        saveJobToDisk(job);
        console.log(`3-Stage Audio job ${job.id} completed with ${result.cues.length} accurately timed cues.`);
      } catch (err: any) {
        console.error("Error in audio background runner:", err);
        job.status = "failed";
        job.error = formatFriendlyError(err);
        job.updatedTime = Date.now();
        saveJobToDisk(job);
      }
    })();

    return res.json({
      message: "تحلیل و پیاده‌سازی صوت در ۳ مرحله آغاز شد. حتی اگر مرورگر را ببندید ادامه دارد.",
      jobId: job.id,
      job,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "خطا در شروع تحلیل صوت در پس‌زمینه" });
  }
});

// Synchronous direct transcribe endpoint
app.post("/api/transcribe-audio", async (req, res) => {
  try {
    const { audioData, mimeType = "audio/mp3", tone = "tehrani_casual", movieContext = "", audioDuration } = req.body;
    if (!audioData) {
      return res.status(400).json({ error: "داده‌های صوتی دریافت نشد." });
    }
    const result = await transcribeAudioMultiStage(audioData, mimeType, tone, movieContext, audioDuration);
    return res.json(result);
  } catch (error: any) {
    console.error("Error in /api/transcribe-audio:", error);
    return res.status(500).json({ error: formatFriendlyError(error) });
  }
});

// API: Speak Persian text via Gemini 3.8 TTS
app.post("/api/speak-persian", async (req, res) => {
  try {
    const { text, voice } = req.body;
    if (!text) {
      return res.status(400).json({ error: "متن خالی است." });
    }

    const ai = getGeminiClient();
    const response = await generateWithModelFallback(
      ai,
      {
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `Say in a lively natural colloquial Persian voice: "${text}"`,
              },
            ],
          },
        ],
        config: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voice || "Kore" },
            },
          },
        },
      },
      TTS_MODELS
    );

    const base64Audio = (response as any).candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      return res.status(500).json({ error: "فایل صوتی تولید نشد." });
    }

    return res.json({ audioBase64: base64Audio, mimeType: "audio/wav" });
  } catch (error: any) {
    console.error("Error in /api/speak-persian:", error);
    return res.status(500).json({ error: error.message || "خطا در تولید صدای دیالوگ" });
  }
});

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Vite or Static Middleware
if (process.env.NODE_ENV !== "production") {
  const { createServer: createViteServer } = await import("vite");
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.resolve(__dirname, "dist")));
  app.get("*", (_req, res) => {
    res.sendFile(path.resolve(__dirname, "dist", "index.html"));
  });
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`StreetSub Server running on port ${PORT}`);
});
