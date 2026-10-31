<?php
/**
 * StreetSub Standalone Single-File Subtitle AI Translator
 * Hosted on https://arefkyanmehr.ir/srt.php
 * Powered by Google Apps Script Relay + Gemini AI
 */

// --------------------------------------------------------------------------
// 1. BACKEND API HANDLER (Proxying translation through Google Apps Script)
// --------------------------------------------------------------------------
$CLOUDFLARE_WORKER_RELAY = "https://morning-unit-5fce.arefkyanmehr9.workers.dev/";
$GOOGLE_APPS_SCRIPT_RELAY = "https://script.google.com/macros/s/AKfycbzNZ0rtOa9cwko8iE4B77Mydl178eUuNs8vKegZqnCdB-bi3pBO12cSYtKRmDSAznUH/exec";

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_GET['action'])) {
    header('Content-Type: application/json; charset=utf-8');
    
    $rawInput = file_get_contents('php://input');
    $inputData = json_decode($rawInput, true);
    
    if (!$inputData) {
        echo json_encode(['error' => 'Invalid JSON input']);
        exit;
    }

    $apiKey = !empty($inputData['apiKey']) ? trim($inputData['apiKey']) : '';
    if (empty($apiKey)) {
        echo json_encode(['error' => 'لطفاً کلید Gemini API Key را وارد نمایید.']);
        exit;
    }

    $action = $_GET['action'];

    if ($action === 'translate_chunk') {
        $cues = $inputData['cues'] ?? [];
        $tone = $inputData['tone'] ?? 'tehrani_casual';
        $customPrompt = $inputData['customInstructions'] ?? '';
        
        $toneDesc = "فارسی محاوره‌ای روان و زنده متناسب با فضای فیلم";
        if ($tone === 'street_lati') {
            $toneDesc = "لحن خیابانی و عامیانه اما کاملاً طبیعی و خوش‌خوان؛ بدون واژه‌های عجیب و غریب یا لاتی کهنه و منسوخ. استفاده از اصطلاحات امروزی مانند داداش، ستون، بزن به چاک، دمت گرم.";
        } elseif ($tone === 'comedy_sarcastic') {
            $toneDesc = "لحن کمدی، تیکه‌دار، طنزآمیز و پر از متلک‌های بامزه و خوش‌ریتم بدون الفاظ رکیک زننده.";
        } elseif ($tone === 'gen_z_teen') {
            $toneDesc = "لحن جوانانه و صمیمی، اصطلاحات روزمره نوجوانان و جوانان ایرانی (پشمام، حله، فاز بد نده، دمت گرم).";
        } elseif ($tone === 'action_gritty') {
            $toneDesc = "لحن اکشن، کوبنده و هیجانی مناسب صحنه‌های درگیری و بدون کلمات کتابی.";
        } elseif ($tone === 'drama_emotional') {
            $toneDesc = "لحن درام، احساسی، عمیق و گفتاری متناسب با لحظات تنهایی و غم.";
        }

        $systemPrompt = "# PROFESSIONAL NETFLIX SUBTITLE TRANSLATION & SEGMENTATION ENGINE
شما برترین و حرفه‌ای‌ترین مترجم ارشد، ویراستار دیالوگ و بازرس کنترل کیفی زیرنویس سینمای جهان و استانداردهای رسمی نتفلیکس (Netflix Subtitle Standards) هستید.

وظیفه شما ترجمه کلمه به کلمه زیرنویس نیست!
وظیفه شما این است که گفتار خام انگلیسی/اصلی را به یک زیرنویس استاندارد، طبیعی، فوق‌العاده خوانا و سینمایی در سطح پلتفرم‌های تراز اول استریمینگ تبدیل کنید. بیننده باید حس کند در حال تماشای فیلم است، نه خواندن رونوشت یک ربات!

قوانین حیاتی و تخلف‌ناپذیر استاندارد نتفلیکس:
۱. نظم ۲ خطی و حداکثر ۴۲ کاراکتر (Two-Line & 42-Character Limit):
   - هر رویداد زیرنویس حداکثر ۲ خط دارد (در صورت نیاز به ۲ خط، خطوط را با \\n جدا کن).
   - هر سطر باید حداکثر حدود ۴۲ کاراکتر باشد. خطوط هرگز نباید به ۳ خط برسد.
۲. شکستن بر اساس واحد معنایی و ساختار نحوی فارسی (Semantic Line Breaks):
   - به هیچ وجه مانند گفتار ماشینی (ACP/ASR) کلمه به کلمه نچینید و در جاهای نامناسب نشکنید!
   - هر سطر باید یک واحد دستوری و معنایی منسجم باشد.
   - هرگز بین صفت و موصوف، مضاف و مضاف‌الیه، فعل و فعل کمکی، «می/نمی» و ریشه فعل، نام و نام خانوادگی، یا عدد و واحد خط را نشکنید.
۳. ترجمه مفهوم و لحن واقعی دیالوگ (نه ترجمه تحت‌اللفظی و ماشینی):
   - حس، طنز، کنایه، خشم، ترس و لحن شخصیتی کاراکتر را دقیقاً منتقل کنید.
   - دیالوگ‌ها باید دقیقاً شبیه به مکالمه واقعی انسان‌ها در دوبله‌های درجه‌یک و فیلم‌های برجسته سینمایی باشد.
۴. علائم نگارشی استاندارد فارسی (؟ ! ، .) و نیم‌فاصله برای افعال و جمع‌ها.
۵. ترجمه ۱۰۰٪ اجباری تک‌تک خطوط بدون استثناء برای تمام idها.

{$toneDesc}
{$customPrompt}";

        $linesToTranslate = [];
        foreach ($cues as $c) {
            $linesToTranslate[] = [
                'id' => $c['id'],
                'text' => $c['originalText'] ?? $c['text'] ?? ''
            ];
        }

        $geminiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=" . urlencode($apiKey);

        $payload = [
            'contents' => [
                [
                    'parts' => [
                        ['text' => json_encode($linesToTranslate, JSON_UNESCAPED_UNICODE)]
                    ]
                ]
            ],
            'systemInstruction' => [
                'parts' => [
                    ['text' => $systemPrompt]
                ]
            ],
            'generationConfig' => [
                'temperature' => 0.4,
                'responseMimeType' => 'application/json'
            ]
        ];

        // Call Google Apps Script Relay
        $relayPayload = json_encode([
            'url' => $geminiUrl,
            'method' => 'POST',
            'headers' => [
                'Content-Type' => 'application/json'
            ],
            'payload' => json_encode($payload)
        ]);

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $GOOGLE_APPS_SCRIPT_RELAY);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $relayPayload);
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 90);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

        $res = curl_exec($ch);
        $err = curl_error($ch);
        curl_close($ch);

        if ($err) {
            echo json_encode(['error' => 'خطا در ارتباط با رله گوگل اسکریپت: ' . $err]);
            exit;
        }

        $decodedRes = json_decode($res, true);
        if (!$decodedRes || !isset($decodedRes['body'])) {
            echo json_encode(['error' => 'پاسخ نامعتبر از رله', 'raw' => $res]);
            exit;
        }

        $geminiData = json_decode($decodedRes['body'], true);
        if (isset($geminiData['error'])) {
            echo json_encode(['error' => 'خطای Gemini: ' . ($geminiData['error']['message'] ?? 'نامشخص')]);
            exit;
        }

        $rawText = $geminiData['candidates'][0]['content']['parts'][0]['text'] ?? '{}';
        $parsed = json_decode($rawText, true);

        echo json_encode([
            'success' => true,
            'translatedCues' => $parsed['translatedCues'] ?? []
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    echo json_encode(['error' => 'Invalid action']);
    exit;
}
?>
<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>StreetSub - ترجمه هوشمند زیرنویس فیلم به فارسی محاوره‌ای</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Vazirmatn', sans-serif; }
    .font-mono-num { font-family: monospace; }
  </style>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen flex flex-col antialiased selection:bg-amber-500/30 selection:text-amber-200">

  <!-- Top Navigation Header -->
  <header class="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-40 px-4 py-3">
    <div class="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/20 font-black text-slate-950 text-xl">
          🎬
        </div>
        <div>
          <div class="flex items-center gap-2">
            <h1 class="text-base sm:text-lg font-black tracking-tight text-white">StreetSub</h1>
            <span class="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold">نسخه وب‌سرور ایران</span>
          </div>
          <p class="text-xs text-slate-400">ترجمه زیرنویس فیلم به فارسی محاوره‌ای اصیل • بدون نیاز به فیلترشکن</p>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <div class="flex items-center gap-1.5 bg-slate-800/90 border border-slate-700/80 rounded-xl px-3 py-1.5">
          <span class="text-xs text-slate-400">کلید Gemini:</span>
          <input type="password" id="apiKeyInput" placeholder="کلید API خود را وارد کنید..." class="bg-slate-900 text-xs px-2 py-1 rounded border border-slate-700 text-amber-300 w-36 sm:w-48 focus:outline-none focus:border-amber-500 font-mono" />
          <button onclick="saveApiKey()" class="text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-2 py-1 rounded cursor-pointer transition">ذخیره</button>
        </div>
      </div>
    </div>
  </header>

  <!-- Main Workspace -->
  <main class="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-5">

    <!-- Uploader & Settings Grid -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      
      <!-- Upload Card -->
      <div class="md:col-span-2 border border-slate-800 rounded-2xl bg-slate-900/60 p-5 space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="font-bold text-sm text-slate-200 flex items-center gap-2">
            <span>📥 بارگذاری زیرنویس انگلیسی (SRT / VTT)</span>
          </h2>
          <span id="cuesCountBadge" class="text-xs font-mono bg-slate-800 text-slate-400 px-2.5 py-1 rounded-lg border border-slate-700">0 خط دیالوگ</span>
        </div>

        <div id="dropZone" class="border-2 border-dashed border-slate-700 hover:border-amber-500/50 rounded-xl p-6 text-center cursor-pointer transition bg-slate-950/40">
          <input type="file" id="fileInput" accept=".srt,.vtt,.txt" class="hidden" />
          <div class="space-y-2">
            <span class="text-3xl">📁</span>
            <p class="text-sm font-medium text-slate-300">فایل زیرنویس (.srt یا .vtt) را بکشید و اینجا رها کنید</p>
            <p class="text-xs text-slate-500">یا برای انتخاب فایل از کامپیوتر یا موبایل کلیک کنید</p>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-2 pt-2">
          <button onclick="loadSample()" class="text-xs bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 px-3 py-1.5 rounded-lg cursor-pointer transition">
            💡 بارگذاری نمونه تستی (فیلم پدرخوانده)
          </button>
          <button onclick="clearAll()" class="text-xs text-slate-400 hover:text-red-400 px-3 py-1.5 cursor-pointer transition">
            پاک کردن میزکار
          </button>
        </div>
      </div>

      <!-- Settings Card -->
      <div class="border border-slate-800 rounded-2xl bg-slate-900/60 p-5 space-y-4 flex flex-col justify-between">
        <div class="space-y-4">
          <h2 class="font-bold text-sm text-slate-200">🎭 تنظیم لحن ترجمه</h2>
          
          <div>
            <label class="block text-xs text-slate-400 mb-1.5">لحن پیشنهادی:</label>
            <select id="toneSelect" class="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500">
              <option value="tehrani_casual" selected>فارسی محاوره‌ای تهرانی (روان و طبیعی)</option>
              <option value="street_lati">خیابانی و عامیانه (لاتی طبیعی و خوش‌خوان)</option>
              <option value="comedy_sarcastic">کمدی و طنزآمیز (پر از متلک‌های بامزه ایرانی)</option>
              <option value="gen_z_teen">جوانانه و تینیجری (اصطلاحات دهه هشتادی)</option>
              <option value="action_gritty">اکشن و هیجانی (دیالوگ‌های سنگین و کوبنده)</option>
              <option value="drama_emotional">درام و احساسی (دیالوگ‌های عمیق و غمگین)</option>
            </select>
          </div>

          <div>
            <label class="block text-xs text-slate-400 mb-1.5">دستور یا توضیح اختصاصی برای مترجم (اختیاری):</label>
            <input type="text" id="customPrompt" placeholder="مثلاً: اسامی به فارسی باشد، کاراکتر اصلی عصبانی است" class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500" />
          </div>
        </div>

        <button id="startBtn" onclick="startTranslation()" class="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black py-3 rounded-xl shadow-lg shadow-amber-500/20 text-sm cursor-pointer transition flex items-center justify-center gap-2">
          <span>⚡ شروع ترجمه هوشمند با هوش مصنوعی</span>
        </button>
      </div>

    </div>

    <!-- Actions & Quick Polish Toolbar -->
    <div id="toolbar" class="border border-slate-800 rounded-2xl bg-slate-900/60 p-4 flex flex-wrap items-center justify-between gap-3 hidden">
      <div class="flex items-center gap-2 flex-wrap">
        <span class="text-xs font-bold text-slate-300">ابزارهای تکمیلی:</span>
        <button onclick="polishPunctuation()" class="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 px-3 py-1.5 rounded-lg cursor-pointer transition">
          ✨ تنظیم علائم نگارشی فارسی و سه‌نقطه (...)
        </button>
        <button onclick="promptWatermark()" class="text-xs bg-orange-500/10 text-orange-400 border border-orange-500/30 hover:bg-orange-500/20 px-3 py-1.5 rounded-lg cursor-pointer transition">
          📢 درج امضای مترجم یا تبلیغات در سکوت
        </button>
        <button onclick="shiftTimecodes(0.5)" class="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-2.5 py-1.5 rounded-lg font-mono cursor-pointer transition">
          +۰.۵s تأخیر
        </button>
        <button onclick="shiftTimecodes(-0.5)" class="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-2.5 py-1.5 rounded-lg font-mono cursor-pointer transition">
          -۰.۵s جلو
        </button>
      </div>

      <button onclick="exportSrt()" class="text-xs bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2 rounded-xl shadow cursor-pointer transition flex items-center gap-1.5">
        <span>💾 دانلود زیرنویس فارسی (SRT UTF-8)</span>
      </button>
    </div>

    <!-- Progress Bar -->
    <div id="progressContainer" class="border border-slate-800 rounded-2xl bg-slate-900/60 p-4 space-y-2 hidden">
      <div class="flex items-center justify-between text-xs">
        <span id="progressText" class="text-amber-400 font-bold">در حال پردازش دیالوگ‌ها...</span>
        <span id="progressPercent" class="font-mono text-slate-300">0%</span>
      </div>
      <div class="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
        <div id="progressBar" class="bg-amber-500 h-2.5 rounded-full transition-all duration-300" style="width: 0%"></div>
      </div>
    </div>

    <!-- Subtitle Table Editor -->
    <div id="tableContainer" class="border border-slate-800 rounded-2xl bg-slate-900/60 overflow-hidden hidden">
      <div class="max-h-[600px] overflow-y-auto divide-y divide-slate-800" id="cuesList">
        <!-- Rendered lines -->
      </div>
    </div>

  </main>

  <footer class="border-t border-slate-800 py-4 text-center text-xs text-slate-500">
    طراحی شده با استانداردهای نوین سینمای ایران • اتصال مستقیم به رله اختصاصی گوگل اسکریپت
  </footer>

  <script>
    let cues = [];
    let isTranslating = false;

    // Load saved API Key
    const savedKey = localStorage.getItem('gemini_api_key') || '';
    if (savedKey) {
      document.getElementById('apiKeyInput').value = savedKey;
    }

    function saveApiKey() {
      const key = document.getElementById('apiKeyInput').value.trim();
      if (!key) {
        alert('لطفاً کلید معتبر وارد کنید');
        return;
      }
      localStorage.setItem('gemini_api_key', key);
      alert('کلید با موفقیت در مرورگر شما ذخیره شد.');
    }

    // Drag and Drop & File Input
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');

    dropZone.onclick = () => fileInput.click();
    fileInput.onchange = (e) => {
      const file = e.target.files[0];
      if (file) readFile(file);
    };

    dropZone.ondragover = (e) => { e.preventDefault(); dropZone.classList.add('border-amber-500'); };
    dropZone.ondragleave = () => { dropZone.classList.remove('border-amber-500'); };
    dropZone.ondrop = (e) => {
      e.preventDefault();
      dropZone.classList.remove('border-amber-500');
      const file = e.dataTransfer.files[0];
      if (file) readFile(file);
    };

    function readFile(file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        parseSrt(e.target.result);
      };
      reader.readAsText(file);
    }

    function parseSrt(content) {
      const normalized = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
      const blocks = normalized.trim().split(/\n\s*\n/);
      
      cues = [];
      let currentId = 1;

      for (const block of blocks) {
        const lines = block.trim().split('\n');
        if (lines.length < 2) continue;

        let timeLine = '';
        let textLines = [];

        if (lines[0].includes('-->')) {
          timeLine = lines[0];
          textLines = lines.slice(1);
        } else if (lines[1] && lines[1].includes('-->')) {
          timeLine = lines[1];
          textLines = lines.slice(2);
        } else {
          continue;
        }

        const [start, end] = timeLine.split('-->').map(s => s.trim());
        const originalText = textLines.join(' ').replace(/<[^>]*>/g, '').trim();

        if (start && end && originalText) {
          cues.push({
            id: currentId++,
            startTime: start,
            endTime: end,
            originalText: originalText,
            persianText: '',
            isPromo: false
          });
        }
      }

      renderCues();
    }

    function loadSample() {
      const sample = `1
00:00:02,120 --> 00:00:05,400
I believe in America. America has made my fortune.

2
00:00:06,000 --> 00:00:09,800
And I raised my daughter in the American fashion.

3
00:00:10,500 --> 00:00:14,200
I gave her freedom, but I taught her never to dishonor her family.

4
00:00:15,000 --> 00:00:18,500
She found a boyfriend, not an Italian. She went to the movies with him.

5
00:00:19,200 --> 00:00:22,800
Two months ago, he took her for a drive with another boyfriend.`;

      parseSrt(sample);
    }

    function renderCues() {
      document.getElementById('cuesCountBadge').textContent = cues.length + ' خط دیالوگ';
      const list = document.getElementById('cuesList');
      list.innerHTML = '';

      if (cues.length === 0) {
        document.getElementById('toolbar').classList.add('hidden');
        document.getElementById('tableContainer').classList.add('hidden');
        return;
      }

      document.getElementById('toolbar').classList.remove('hidden');
      document.getElementById('tableContainer').classList.remove('hidden');

      cues.forEach(cue => {
        const div = document.createElement('div');
        div.className = 'p-3 hover:bg-slate-800/40 transition flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs';
        
        div.innerHTML = `
          <div class="flex items-center gap-2 shrink-0 font-mono text-slate-400">
            <span class="w-8 text-slate-500 font-bold">#${cue.id}</span>
            <span class="bg-slate-800 px-2 py-0.5 rounded text-[11px]">${cue.startTime} ➔ ${cue.endTime}</span>
            ${cue.isPromo ? '<span class="bg-orange-500/10 text-orange-400 border border-orange-500/30 px-1.5 py-0.5 rounded text-[10px]">امضا / تبلیغات</span>' : ''}
          </div>
          <div class="w-full md:w-5/12 text-slate-300 font-mono text-left dir-ltr">
            ${escapeHtml(cue.originalText)}
          </div>
          <div class="w-full md:w-5/12">
            <input type="text" value="${escapeHtml(cue.persianText)}" onchange="updatePersian(${cue.id}, this.value)" placeholder="ترجمه فارسی..." class="w-full bg-slate-900 border ${cue.persianText ? 'border-slate-700 text-amber-200 font-medium' : 'border-slate-800 text-slate-400'} px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-amber-500 text-xs" />
          </div>
        `;
        list.appendChild(div);
      });
    }

    function updatePersian(id, val) {
      const cue = cues.find(c => c.id === id);
      if (cue) cue.persianText = val;
    }

    function escapeHtml(text) {
      return (text || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function clearAll() {
      cues = [];
      renderCues();
    }

    // Translation Engine
    async function startTranslation() {
      if (cues.length === 0) {
        alert('لطفاً ابتدا یک فایل زیرنویس بارگذاری نمایید.');
        return;
      }
      const apiKey = document.getElementById('apiKeyInput').value.trim();
      if (!apiKey) {
        alert('لطفاً کلید Gemini API Key خود را در کادر بالای صفحه وارد کنید.');
        return;
      }

      isTranslating = true;
      const startBtn = document.getElementById('startBtn');
      startBtn.disabled = true;
      startBtn.classList.add('opacity-50');

      const progressContainer = document.getElementById('progressContainer');
      const progressBar = document.getElementById('progressBar');
      const progressText = document.getElementById('progressText');
      const progressPercent = document.getElementById('progressPercent');

      progressContainer.classList.remove('hidden');

      const tone = document.getElementById('toneSelect').value;
      const customPrompt = document.getElementById('customPrompt').value;

      const chunkSize = 20; // 20 lines per batch
      const total = cues.length;
      let processed = 0;

      for (let i = 0; i < total; i += chunkSize) {
        const chunk = cues.slice(i, i + chunkSize);
        progressText.textContent = `در حال ترجمه سطرهای ${i + 1} تا ${Math.min(i + chunkSize, total)} از ${total}...`;

        try {
          const res = await fetch('srt.php?action=translate_chunk', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              apiKey: apiKey,
              tone: tone,
              customInstructions: customPrompt,
              cues: chunk
            })
          });

          const data = await res.json();
          if (data.error) {
            alert('خطا در ترجمه: ' + data.error);
            break;
          }

          if (data.translatedCues) {
            data.translatedCues.forEach(t => {
              const cue = cues.find(c => c.id === t.id);
              if (cue) cue.persianText = t.persianText;
            });
            renderCues();
          }

          processed += chunk.length;
          const pct = Math.min(100, Math.round((processed / total) * 100));
          progressBar.style.width = pct + '%';
          progressPercent.textContent = pct + '%';

        } catch (err) {
          alert('خطای اتصال به سرور: ' + err.message);
          break;
        }
      }

      progressText.textContent = 'ترجمه هوشمند با موفقیت تکمیل شد! 🎉';
      startBtn.disabled = false;
      startBtn.classList.remove('opacity-50');
      isTranslating = false;
    }

    // Auto Polish Persian Punctuation & Ellipses
    function polishPunctuation() {
      if (cues.length === 0) return;
      
      const continuationWords = ['که', 'و', 'اما', 'چون', 'اگه', 'ولی', 'تا', 'یا', 'اگر', 'چراکه'];

      cues.forEach((cue, idx) => {
        let text = (cue.persianText || '').trim();
        if (!text) return;

        text = text.replace(/\?/g, '؟').replace(/,/g, '،').replace(/;/g, '؛');

        const words = text.split(/\s+/);
        const lastWord = words[words.length - 1];

        if (continuationWords.includes(lastWord) && !text.endsWith('...')) {
          text = text.replace(/[\.،؟!]+$/, '') + '...';
        }

        cue.persianText = text;
      });

      renderCues();
      alert('علائم نگارشی استاندارد فارسی و سه‌نقطه (...) برای جملات ادامه‌دار تنظیم شدند.');
    }

    // Insert Smart Promo Watermark in Gaps
    function promptWatermark() {
      if (cues.length === 0) return;
      const promoText = prompt('متن امضا یا تبلیغات خود را وارد کنید (مثلاً: ترجمه اختصاصی: کانال مووی | @MyMovie):', 'ترجمه اختصاصی: کانال مووی | @MyMovie');
      if (!promoText) return;

      // Insert at opening
      cues.unshift({
        id: 0,
        startTime: '00:00:01,000',
        endTime: '00:00:04,500',
        originalText: '[Translator Credit / Promo]',
        persianText: promoText,
        isPromo: true
      });

      // Renumber IDs
      cues.forEach((c, i) => c.id = i + 1);
      renderCues();
      alert('امضای اختصاصی شما با موفقیت به تیتراژ ابتدایی افزوده شد.');
    }

    // Timecode Shifter
    function shiftTimecodes(deltaSeconds) {
      if (cues.length === 0) return;

      function toSec(str) {
        const parts = str.replace(',', '.').split(':');
        return parseFloat(parts[0]) * 3600 + parseFloat(parts[1]) * 60 + parseFloat(parts[2]);
      }

      function toTimestamp(sec) {
        if (sec < 0) sec = 0;
        const h = Math.floor(sec / 3600);
        const m = Math.floor((sec % 3600) / 60);
        const s = sec % 60;
        const sInt = Math.floor(s);
        const ms = Math.round((s - sInt) * 1000);
        return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0') + ':' + String(sInt).padStart(2, '0') + ',' + String(ms).padStart(3, '0');
      }

      cues.forEach(c => {
        c.startTime = toTimestamp(toSec(c.startTime) + deltaSeconds);
        c.endTime = toTimestamp(toSec(c.endTime) + deltaSeconds);
      });

      renderCues();
    }

    // Export Final SRT with UTF-8 BOM
    function exportSrt() {
      if (cues.length === 0) return;

      let srtContent = '';
      cues.forEach(c => {
        const text = c.persianText || c.originalText;
        srtContent += `${c.id}\n${c.startTime} --> ${c.endTime}\n${text}\n\n`;
      });

      const bom = new Uint8Array([0xEF, 0xBB, 0xBF]); // UTF-8 BOM for perfect Persian rendering in TVs
      const blob = new Blob([bom, srtContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'persian_subtitles.srt';
      a.click();
      URL.revokeObjectURL(url);
    }
  </script>
</body>
</html>
