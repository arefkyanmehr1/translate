import { SampleScene, ToneOption } from '../types/subtitle';

export const TONE_OPTIONS: ToneOption[] = [
  {
    id: 'tehrani_casual',
    label: 'محاوره‌ای طبیعی ایرانی (پیش‌فرض)',
    subLabel: 'روان، صمیمی، خوش‌آهنگ؛ نه لاتی افراطی و نه کتابی ماشینی',
    description: 'زبان گفتاری روزمره و طبیعی ایرانیان برای تمام فیلم‌ها؛ شکستن کامل افعال، بدون لفاظی اغراق‌آمیز و کاملاً قابل فهم.',
    badge: 'طبیعی و استاندارد ⭐',
    color: 'from-amber-500 to-orange-600',
    sampleBefore: "Why are you looking at me like that? I told you I didn't take your money.",
    sampleAfter: "چرا اینطوری زل زدی به من؟ بهت که گفتم دست به پولات نزدم.",
  },
  {
    id: 'street_gangster',
    label: 'خیابونی و پرانرژی',
    subLabel: 'عامیانه تند و تیز، با اصطلاحات کوچه بازاری اما قابل فهم',
    description: 'برای فیلم‌های مافیایی و جنایی با کلمات عامیانه روزمره (داداش، ستون، بزن به چاک، دمت گرم، پا رو دمم نذار).',
    badge: 'خیابونی 🔥',
    color: 'from-red-600 to-amber-700',
    sampleBefore: "What the hell are you doing? Don't mess with me, beat it!",
    sampleAfter: "داری چه غلطی می‌کنی؟ پا رو دمم نذار، بزن به چاک تا شَر نشده!",
  },
  {
    id: 'comedy_sarcastic',
    label: 'طنز، تیکه‌دار و کنایه‌ای',
    subLabel: 'پر از متلک، طعنه، دست انداختن و مچ‌گیری',
    description: 'مناسب فیلم‌ها و سریال‌های کمدی (مثل Friends، Deadpool و The Office) با تیکه‌های خنده‌دار ایرانی.',
    badge: 'خنده‌دار و بمب 😂',
    color: 'from-emerald-500 to-teal-600',
    sampleBefore: "Congratulations genius, you just ruined everything.",
    sampleAfter: "به به! دست مریزاد نابغه، زدی همه چیو به فنا دادی رفت!",
  },
  {
    id: 'gen_z_teen',
    label: 'تینیجری و نسل زد (Gen-Z)',
    subLabel: 'اسلنگ‌های مدرن جوانان امروزی و تیکه‌های شبکه مجازی',
    description: 'استفاده از کلمات ترند مثل سم، اسید، پشمام، کرینج، داون، کراش، سیگما، فاز منفی.',
    badge: 'مدرن و ترند ⚡',
    color: 'from-fuchsia-600 to-pink-600',
    sampleBefore: "That guy is so weird, I can't believe what happened yesterday.",
    sampleAfter: "اون یارو خیلی کرینجه خدایی! دیروز رو نگم برات اصن پشمام ریخت.",
  },
  {
    id: 'action_gritty',
    label: 'اکشن خشن و هاردبویلد',
    subLabel: 'کوبنده، بی‌تعارف، ضربه‌دار و هیجانی',
    description: 'مناسب فیلم‌های هیجان‌انگیز، پلیسی، مبارزه‌ای و انتقامی (John Wick، Fast & Furious).',
    badge: 'نفس‌گیر و پرانرژی 💥',
    color: 'from-orange-600 to-red-700',
    sampleBefore: "Drop the gun right now or you're dead meat!",
    sampleAfter: "همین الان اسلحه رو بنداز زمین وگرنه کارتو تموم می‌کنم جنازه!",
  },
  {
    id: 'drama_emotional',
    label: 'درام عمیق و احساسی',
    subLabel: 'محاوره دل‌شکسته، بغض‌آلود و صمیمی',
    description: 'برای صحنه‌های غمگین، جدایی، اعتراف و صحبت‌های دلنشین دونفره.',
    badge: 'سوزناک و عاطفی 🎭',
    color: 'from-purple-600 to-violet-800',
    sampleBefore: "I really believed we could make it work, but you gave up on us.",
    sampleAfter: "من واقعاً فکر می‌کردم درستش می‌کنیم... ولی تو زودتر از این حرفا جا زدی.",
  },
];

export const SAMPLE_SCENES: SampleScene[] = [
  {
    id: 'pulp_fiction',
    title: 'داستان عامه‌پسند (Pulp Fiction)',
    movieName: 'Pulp Fiction (1994) - کوئنتین تارانتینو',
    genre: 'جنایی / لاتی / شاهکار کلاسیک',
    description: 'صحنه معروف جولز و وینسنت در بازجویی آپارتمان با دیالوگ‌های فوق‌العاده خشن و خیابونی.',
    recommendedTone: 'street_gangster',
    subtitlesRaw: `1
00:00:01,200 --> 00:00:04,500
You know what they call a Quarter Pounder with Cheese in Paris?

2
00:00:04,800 --> 00:00:06,900
They don't call it a Quarter Pounder with Cheese?

3
00:00:07,100 --> 00:00:09,800
No, man, they got the metric system there. They call it Royale with Cheese.

4
00:00:10,200 --> 00:00:13,400
Royale with cheese! What do they call a Big Mac?

5
00:00:14,000 --> 00:00:17,500
Well, a Big Mac's a Big Mac, but they call it Le Big Mac.

6
00:00:18,200 --> 00:00:21,600
Look, don't mess with me Brett. Does Marcellus Wallace look like a bitch?

7
00:00:22,000 --> 00:00:23,800
What? No!

8
00:00:24,100 --> 00:00:28,400
Then why'd you try to screw him like one, Brett? Say what again, I dare you!`,
  },
  {
    id: 'breaking_bad',
    title: 'بریکینگ بد (Breaking Bad)',
    movieName: 'Breaking Bad - والت و جسی',
    genre: 'جنایی / درام پرتعلیق',
    description: 'دیالوگ طوفانی والتر وایت (من اونیم که در می‌زنه!) و کل‌کل با جسی پینکمن.',
    recommendedTone: 'action_gritty',
    subtitlesRaw: `1
00:00:01,000 --> 00:00:03,800
Yo, Mr. White! We gotta get out of here right now!

2
00:00:04,100 --> 00:00:06,900
The cartel is onto us, they're gonna bust the door in!

3
00:00:07,500 --> 00:00:10,200
Calm down Jesse, stop screaming like a coward.

4
00:00:10,800 --> 00:00:14,200
Who are you talking to right now? Who is it you think you see?

5
00:00:14,800 --> 00:00:18,500
You clearly don't know who you're dealing with. I am not in danger, Skyler.

6
00:00:19,000 --> 00:00:21,300
I AM the danger!

7
00:00:21,800 --> 00:00:25,900
A guy opens his door and gets shot, and you think that of me?

8
00:00:26,200 --> 00:00:29,500
No! I am the one who knocks!`,
  },
  {
    id: 'peaky_blinders',
    title: 'پیکی بلایندرز (Peaky Blinders)',
    movieName: 'Peaky Blinders - توماس شلبی',
    genre: 'گانگستری تاریخی / خشن',
    description: 'دستور معروف تامی شلبی به برادرها قبل از ورود به مهمانی: دعوا ممنوع!',
    recommendedTone: 'street_gangster',
    subtitlesRaw: `1
00:00:01,100 --> 00:00:04,300
Right, listen to me. Today is a truce, boys.

2
00:00:04,700 --> 00:00:08,200
No fighting. Absolutely no fighting!

3
00:00:08,800 --> 00:00:11,500
No pushin' each other, no breakin' bottles!

4
00:00:12,100 --> 00:00:15,700
By order of the Peaky Blinders, behave like gentlemen!

5
00:00:16,300 --> 00:00:19,800
And you, Arthur! Put that razor blade back in your cap!

6
00:00:20,400 --> 00:00:24,900
If anyone looks at us sideways, remember we run this damn city!`,
  },
  {
    id: 'wolf_of_wall_street',
    title: 'گرگ وال استریت (Wolf of Wall Street)',
    movieName: 'The Wolf of Wall Street - جردن بلفورت',
    genre: 'کمدی سیاه / کنایه‌آمیز',
    description: 'صحنه معروف رستوران با متیو مک‌کانهی و آموزش فروختن خودکار.',
    recommendedTone: 'comedy_sarcastic',
    subtitlesRaw: `1
00:00:01,000 --> 00:00:03,600
Do you see this pen? Sell me this pen.

2
00:00:04,000 --> 00:00:06,800
Go on, show me how good you really are, hot shot.

3
00:00:07,300 --> 00:00:10,700
Well, write your name on that napkin for me, sir.

4
00:00:11,100 --> 00:00:13,300
I don't have a pen.

5
00:00:13,800 --> 00:00:17,900
Exactly! Supply and demand, bro. That's how it's done!

6
00:00:18,400 --> 00:00:22,100
You gotta pump those numbers up, kid. Those are rookie numbers!`,
  },
];
