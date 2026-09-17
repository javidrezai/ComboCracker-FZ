'use strict';
// ---------------------------------------------------------------------------
// Whole-UI localization sweep
// ---------------------------------------------------------------------------
// The app is authored in Persian. This flips the ENTIRE interface to English
// (and back) by matching each UI phrase against a Persian->English dictionary.
// It runs from applyLang() and via a MutationObserver, so panels that are built
// on the fly (Control centre, Toolbox, Devices, …) are localized too.
//
// SAFETY: it never touches the user's OWN content — chat messages, memory, the
// family board, code blocks, and anything typed into an input — and it only
// changes text that EXACTLY matches a dictionary entry. The original Persian is
// stashed per-node so switching back to Persian restores it exactly.
//
// Growing it is one line: add a "فارسی":"English" pair to FA2EN below. No code
// change, no risk. If a phrase still shows in the wrong language, that phrase
// just isn't in the dictionary yet.

window.__FA2EN = {
  // — common actions / words —
  'ذخیره':'Save','ذخیره شد':'Saved','ذخیره شد ✓':'Saved ✓','ذخیره شد.':'Saved.','ذخیره نشد':'Not saved',
  'بستن':'Close','حذف':'Delete','لغو':'Cancel','انصراف':'Cancel','بازگشت':'Back','باز کردن':'Open',
  'افزودن':'Add','+ افزودن':'+ Add','ارسال':'Send','دانلود':'Download','کپی':'Copy','کپی شد':'Copied','کپی شد ✓':'Copied ✓',
  'ورود':'Log in','خروج':'Log out','جدید +':'New +','بساز':'Create','شروع':'Start','پاک کن':'Clear','وصل کن':'Connect',
  'روشن':'On','خاموش':'Off','فعال':'Enabled','پنهان':'Hidden','نمایش':'Show','بخوان':'Read','بفرست':'Send',
  'انجام شد':'Done','— انجام شد':'— done','تمام شد ✓':'Done ✓','وصل شد ✓':'Connected ✓','قطع شد':'Disconnected',
  'وصل است':'Connected','وصل نیست':'Not connected','در دسترس':'Available','آماده':'Ready','● آماده':'● Ready','✅ آماده':'✅ Ready',
  'سالم':'Healthy','● سالم':'● Healthy','بی‌کار':'Idle','مشغول':'Busy','آنلاین':'Online','آفلاین':'Offline',
  'نه ممنون':'No thanks','هیچ‌وقت':'Never','خوب است':'is fine','در انتظار':'Pending','منتظر اجازه':'Awaiting permission',
  'نشد. دوباره امتحان کن.':'Failed. Try again.','خطای شبکه. دوباره امتحان کن.':'Network error. Try again.',
  'داده‌ای نیست.':'No data.','چیزی عوض نشده.':'Nothing changed.','چیزی تغییر نکرده.':'Nothing changed.',
  'اتصال به سرور برقرار نشد.':'Could not reach the server.','ورودی نامعتبر است':'Invalid input','بارگذاری فایل':'Upload file',
  // — sidebar / sections (also covered by data-i18n, harmless overlap) —
  'گفتگو':'Chat','گفتگوی جدید':'New chat','گفت‌وگوی جدید':'New chat','گفتگوهای قبلی':'Past chats','گفتگوها':'Chats','گفت‌وگوها':'Chats',
  'پیوست فایل':'Attach file','عکس، PDF، متن':'Photo, PDF, text','گفتن با صدا':'Speak','جستجوی زنده در اینترنت':'Live web search',
  'خانواده':'Family','تابلوی خانواده':'Family board','پیام‌های همه‌ی خانه':'Messages from everyone',
  'حافظه‌ی من':'My memory','کوتاه‌مدت و بلندمدت':'Short & long term','مدیریت':'Admin','مرکز کنترل':'Control centre',
  'کلیدها، کاربران، حریم خصوصی، قابلیت‌ها':'Keys, users, privacy, capabilities','یادگیری خودکار':'Auto-learning',
  'آنچه یاد گرفته را تأیید کن':'Approve what it learned','کاربران':'Users','افزودن، رمز، حالت کودک':'Add, password, kid mode',
  'کانکتورها':'Connectors','گوگل، Gmail، تقویم':'Google, Gmail, Calendar','ایمیل و تلگرام':'Email & Telegram','تنظیم و تست':'Set up & test',
  'ابزارها':'Tools','جعبه‌ابزار':'Toolbox','شبکه، امنیت، هش، QR':'Network, security, hash, QR','دستگاه‌های خانه':'Home devices',
  'تلویزیون، پرینتر، دوربین':'TV, printer, camera','حساب':'Account','تنظیمات':'Settings','رمز، تم، اندازه‌ی متن، راهنما':'Password, theme, text size, help',
  'مغز ستایش':'Setayesh’s brain','ببین چه می‌کند، چه می‌داند، ویرایش کن':'See what it does, knows, edit',
  'زبان برنامه':'App language','تغییر به English':'Switch to English','وضعیت حساب':'Account status',
  'اگر چیزی درست نیست، این را ببین':'If something is off, check here','به خانواده':'To family',
  'فرستادن به تابلوی خانواده':'Send to the family board','فرستاده شد ✓':'Sent ✓',
  // — control centre —
  '⚙️ مرکز کنترل':'⚙️ Control centre','موتورها و کلیدها':'Engines & keys','موتورها':'Engines','کلیدها':'Keys','ابزار و کد':'Tools & code',
  'تأییدها':'Approvals','قابلیت‌ها':'Capabilities','حافظه':'Memory','حریم خصوصی':'Privacy','دستگاه‌ها':'Devices',
  'به‌روزرسانی':'Update','سیستم':'System','شخصی‌سازی و امنیت':'Personalization & security','اسکریپت‌ها و پروژه‌ها':'Scripts & projects',
  'افزودن موتور':'Add engine','افزودن موتور دلخواه':'Add a custom engine','افزودن کلید موتور':'Add engine key','افزودن کلید':'Add key',
  'گرفتن کلید ↗':'Get key ↗','ساختن توکن ↗':'Create token ↗','پاک کردن کلید':'Remove key','🗑 پاک کردن کلید':'🗑 Remove key',
  'کلید را اینجا بگذار...':'Paste the key here...','کلید API (اختیاری)':'API key (optional)','برگشت به پیش‌فرض.':'Back to default.',
  'برگشت به پیش‌فرض':'Back to default','بازگشت به حالت اولیه':'Reset to default','ذخیره تنظیمات':'Save settings','ذخیره‌ی کلیدها':'Save keys',
  'موتور پیش‌فرض':'Default engine','موتور محلی Ollama':'Local engine (Ollama)','روشن‌کردن موتور محلی':'Turn on the local engine',
  'وضعیت زنده‌ی موتورها':'Live engine status','موتورهای فعال':'Active engines','موتورهای متصل':'Connected engines','موتورهای تفکر':'Thinking engines',
  'موتوری تنظیم نشده':'No engine configured','کلیدها در فایل':'Keys in the file','کنار برنامه نگهداری می‌شوند.':'are kept next to the app.',
  // — engine health / research —
  'خنک‌سازی':'Cooling down','(خسته)':'(tired)','در حال استراحت':'Resting','برگرداندن همه به چرخه':'Return all to rotation',
  'یادگیری خودکار ستایش':'Setayesh auto-learning','🧠 یادگیری خودکار ستایش':'🧠 Setayesh auto-learning','ستایش الان چه می‌کند':'What Setayesh is doing now',
  'آنچه الان می‌کند':'What it is doing now','ستایش الان چه می‌کند؟':'What is Setayesh doing now?','کارهای اخیر ستایش':'Setayesh’s recent work',
  'کارهای در انتظار تأیید':'Items awaiting approval','مورد یادگیری منتظر تأیید توست':'A learned item is awaiting your approval',
  'دانش تأییدنشده':'Unapproved knowledge','دانش آموخته‌شده':'Learned knowledge','دانش جدید':'New knowledge','تحقیق و دانش':'Research & knowledge',
  'یادگیری خاموش است':'Auto-learning is off','یادگیری روشن باشد':'Keep auto-learning on','یادگیری خودکار روشن باشد':'Keep auto-learning on',
  'همین حالا یک تحقیق':'Run a research cycle now','همین حالا بررسی کن':'Check now','مقایسه با دفعه‌ی قبل…':'Comparing with last time…',
  'بی‌کار — منتظر زمان تحقیق بعدی':'Idle — waiting for the next research time','تحقیق بعدی حدود':'Next research about','موضوعات در صف':'Topics in queue',
  'چیزی در کوتاه‌مدت نیست.':'Nothing in short-term.','⏳ کوتاه‌مدت':'⏳ Short-term','📚 بلندمدت':'📚 Long-term','💡 دانسته':'💡 Known','○ گم‌شده':'○ Missing',
  'حداکثر در روز':'Max per day','هر چند دقیقه یک‌بار':'Every how many minutes','از اینترنت بخواند (با ذکر منبع)':'Read from the internet (with source)',
  'فقط از این سایت‌ها (اختیاری)':'Only from these sites (optional)','شدت یادگیری':'Learning intensity',
  // — toolkit tabs & panels —
  'جعبه‌ابزار امنیت':'Security toolkit','دفاعی · فقط شبکه‌ی خودتان':'Defensive · your own network only','بررسی سایت':'Website scan',
  'اسکن شبکه':'Network scan','بررسی پورت':'Port check','هش':'Hash lab','ساخت رمز':'Password gen','رمزنگاری/رمزگشایی':'Encode/Decode',
  'رمزها':'Passwords','گواهی SSL':'SSL cert','محافظت':'Protection','آموزش امنیت':'Security learning','سخت‌افزار':'Hardware',
  'گرامر و صدا':'Grammar & voice','بلوتوث':'Bluetooth','کابل و سریال':'Cable & serial','افزونه‌ها':'Extensions','افزونه':'Extension',
  'کتابخانه‌های کد':'Code libraries','دانلود کتابخانه‌های':'Download libraries for','کتابخانه‌ها':'Libraries','کتابخانه':'Library',
  'اتصال گوشی':'Mobile link','بلوتوث/USB گوشی':'Phone Bluetooth/USB','متن را اینجا بنویس یا بچسبان...':'Write or paste the text here...',
  'فقط مطمئن‌ها':'Confident only','تشخیص خودکار':'Auto-detect','بررسی کن':'Check','زبان نوشتن و لحن':'Writing language & tone',
  'مدیرش نصب نیست':'Its manager is not installed','مدیرهای نصب‌شده:':'Installed managers:','نصب‌شده:':'Installed:','رد شده:':'Rejected:',
  'هنوز کتابخانه‌ای نصب نشده.':'No library installed yet.','دانلودِ همه':'Download all','چیزی مسدود نشده.':'Nothing is blocked.',
  'آخرین جلوگیری‌ها':'Recent blocks','عبارت‌های محافظت‌شده':'Protected phrases','راهنمای محافظت':'Protection guide','آخرین بار':'Last time',
  'دامنه سایت':'Site domain','سایت / سرویس':'Site / service','صادرکننده':'Issuer','روز تا انقضا':'days to expiry','منقضی شده!':'Expired!',
  'حروف بزرگ ABC':'Uppercase ABC','حروف کوچک abc':'Lowercase abc','اعداد ۱۲۳':'Digits 123','نمادها !@#':'Symbols !@#','یک متن بنویس.':'Write some text.',
  // — devices —
  'جست‌وجوی دستگاه‌ها':'Scan for devices','جستجوی دستگاه‌ها':'Scan for devices','هیچ دستگاهی پیدا نشد.':'No device found.',
  'دستگاهی با این نام نیست.':'No device by that name.','این دستگاه حذف شود؟':'Remove this device?','دستگاه پیدا شد':'Device found',
  'نام دستگاه؟':'Device name?','نام دستگاه':'Device name','تازه وصل شد:':'Just connected:','چه چیزی تازه وصل شد؟':'What just connected?',
  'دسترسی‌ها':'Access','دسترسی':'Access','دسترسی موقت داده شد.':'Temporary access granted.','هنوز دسترسی به دستگاهی ندارید.':'You have no device access yet.',
  'شناسه‌ی دستگاه در Tuya:':'Device id in Tuya:','تایمر':'Timer','قطع خاموش':'Sleep off','حالت خانه':'Home mode','ضبط':'Record',
  'حالت خصوصی':'Private mode','چرخش عمودی':'Rotate','چرخش':'Rotate','ری‌استارت':'Restart','🔄 ری‌استارت':'🔄 Restart',
  // — settings / account —
  'تغییر رمز عبور':'Change password','رمز فعلی':'Current password','رمز جدید':'New password','تکرار رمز جدید':'Confirm new password',
  'رمز عبور':'Password','نام کاربری':'Username','رمز اصلی':'Master password','افزودن رمز جدید':'Add a new password','مدیریت رمزها':'Manage passwords',
  'هنوز رمزی ذخیره نشده':'No password saved yet','یک رمز اصلی بساز':'Create a master password','رمز اصلی را وارد کن':'Enter the master password',
  'رمز اصلی اشتباه است':'Master password is wrong','تم رنگی':'Theme','رنگ‌ها':'Colors','رنگ اصلی':'Primary color','رنگ دوم':'Secondary color',
  'اندازه‌ی متن':'Text size','ظاهر':'Appearance','ذخیره‌ی ظاهر':'Save appearance','حالت امن (مناسب کودک)':'Safe mode (child-friendly)','حالت کودک':'Kid mode',
  'کاربر جدید':'New user','افزودن کاربر':'Add user','مدیریت کاربران':'Manage users','ساخت، حذف، ری‌ست رمز و حالت امن':'Create, delete, reset password, safe mode',
  'حساب بابا همیشه درجه‌ی ۲ است.':'The owner account is always level 2.','این بخش برای مدیر است':'This section is for the admin','فقط مدیر':'Admin only',
  'کدام کاربر؟':'Which user?','نقش این کامپیوتر':'This computer’s role','درجه ۱ — دیدن':'Level 1 — view','درجه ۲ — کنترل':'Level 2 — control',
  // — connectors / telegram / email —
  'اتصال به گوگل':'Connect to Google','ذخیره و تست تلگرام':'Save & test Telegram','توکن ربات (123456:ABC...)':'Bot token (123456:ABC...)',
  'خواندن پاسخ با صدا':'Read replies aloud','📥 خواندن ایمیل‌ها':'📥 Read emails','✉️ ارسال ایمیل':'✉️ Send email','متن ایمیل...':'Email text...',
  'گیرنده (email)':'Recipient (email)','فرستادن یک اعلان آزمایشی':'Send a test notification','پیام خوش‌آمد (خالی = پیش‌فرض)':'Welcome message (empty = default)',
  'با ستایش از بیرون خانه حرف بزن':'Talk to Setayesh from outside the house','فقط خواندنی':'Read-only','قابل ویرایش':'Editable',
  // — secure link (https) —
  'اتصال امن (https)':'Secure link (HTTPS)','روشن کردن اتصال امن (HTTPS) برای گوشی':'Turn on the secure link (HTTPS) for the phone',
  'در حال ساخت گواهی…':'Generating the certificate…','روی گوشی این آدرس را باز کن:':'Open this address on the phone:',
  // — status / misc —
  'در حال فکر کردن':'Thinking','در حال بارگذاری…':'Loading…','در حال خواندن…':'Reading…','در حال دانلود…':'Downloading…',
  'در حال ذخیره...':'Saving...','در حال ذخیره…':'Saving…','در حال بررسی…':'Checking…','در حال بررسی توکن…':'Checking the token…',
  'در حال وصل…':'Connecting…','در حال اجرا…':'Running…','در حال کار:':'Working:','گشتن دور و بر':'Scanning around',
  'باتری':'Battery','وضعیت':'Status','وضعیت شبکه':'Network status','نسخه':'Version','گزارش':'Report','رویداد':'Event','موضوع':'Topic',
  'پیام':'Message','پیام‌ها':'Messages','پاسخ‌ها':'Replies','فایل‌ها':'Files','فایل یا عکس':'File or photo','عکس و اسکرین‌شات':'Photo & screenshot',
  'صبح بخیر':'Good morning','عصر بخیر':'Good afternoon','شب بخیر':'Good night','چطور می‌تونم کمکت کنم؟':'How can I help you?',
  'چیزی برای خانواده بنویس...':'Write something for the family...','چیزی بنویس تا مغز اول اجرا کند…':'Type something for the primary brain…',
  'مرورگر از صدا پشتیبانی نمی‌کند':'The browser does not support voice','🎤 گوش می‌دهم… حرف بزن':'🎤 Listening… speak',
  'همه‌ی گفتگوها پاک شوند؟':'Clear all chats?','پاک‌کردن همه‌ی گفتگوها':'Clear all chats','پاک کردن پیام‌های من':'Clear my messages',
  'اتصال امن روشن باشد':'Keep the secure link on','سپر حریم خصوصی روشن باشد':'Keep the privacy shield on','همگام‌سازی روشن باشد':'Keep sync on',
  'همگام‌سازی':'Sync','بزرگ‌نمایی':'Zoom in','کوچک‌نمایی':'Zoom out','بازخوانی':'Refresh','↻ بازخوانی':'↻ Refresh',
  'انتخاب فایل و نصب':'Choose a file & install','همین حالا بررسی و نصب کن':'Check & install now','نصب خودکار از پوشه‌ی updates':'Auto-install from the updates folder',
  'ساخت نسخه از خودم':'Build a copy of myself','بساز نسخه‌ی نصبی از خودم':'Build an installable copy of myself','مسیر پوشه':'Folder path',
  'راهنما و توانایی‌ها':'Help & capabilities','باز کردن تنظیمات':'Open settings','مثلاً نام فامیل...':'e.g. a surname...','یک رمز که فقط تو می‌دانی':'A password only you know',
  // — device controls —
  'بی‌صدا':'Mute','باصدا':'Unmute','🔊 باصدا':'🔊 Unmute','🔇 بی‌صدا':'🔇 Mute','صدا':'Volume','صدا روی':'Volume','خانه':'Home','ورودی':'Input',
  'اطلاعات':'Info','دیدن':'View','حرکت روشن':'Motion on','حرکت خاموش':'Motion off','آژیر خاموش':'Siren off','آژیر روشن':'Siren on',
  'قطع اتصال':'Disconnect','چرخش عمودی':'Flip','ضبط':'Record','حالت خصوصی':'Private mode','حالت خانه':'Home mode','قطع خاموش':'Sleep off','تایمر':'Timer',
  // — control centre: hints, buttons, placeholders —
  'پنهان کن':'Hide','نمایش بده':'Show','موتور پنهان شد.':'Engine hidden.','موتور نمایش داده شد.':'Engine shown.','حذف موتور':'Remove engine',
  'موتور حذف شد.':'Engine removed.','موتور اضافه شد.':'Engine added.','کلید پاک شد.':'Key cleared.','کلید ذخیره شد.':'Key saved.',
  'کلید هر سرویس را اینجا بگذار. بلافاصله فعال می‌شود. هر موتور را می‌توانی «پنهان» کنی تا از فهرست چت حذف شود، یا موتور دلخواه اضافه کنی.':'Paste each service’s key here. It activates immediately. You can “hide” any engine to drop it from the chat list, or add a custom engine.',
  'روزمره':'Everyday','آدرس پایه، مثل https://api.example.com/v1':'Base URL, e.g. https://api.example.com/v1','نام نمایشی (مثل هوش من)':'Display name (e.g. My AI)',
  'شناسه (انگلیسی، مثل myai)':'ID (English, e.g. myai)','مدل‌ها (با کاما جدا کن)':'Models (comma-separated)','آدرس مرکز':'Hub address',
  // — scripts / vault —
  'اجرای کد پایتون (فقط حساب تو)':'Run Python code (your account only)','نوشتن اسکریپت جدید':'Write a new script','نام فایل':'File name',
  'نام فایل، مثلاً cleanup.py':'File name, e.g. cleanup.py','# کد پایتون...':'# Python code...','آپلود فایل .py':'Upload a .py file','اجرای فایل با مسیر':'Run a file by path',
  'ساختن گاوصندوق':'Create a vault','مسیر والت':'Vault path','مخازن کد':'Code repos','اسکریپت‌ها':'Scripts','اسکریپت':'Script','پروژه‌ها':'Projects',
  // — status / small words —
  'خطا:':'Error:','خطای سرور.':'Server error.','وضعیت:':'Status:','امروز:':'Today:','آرام':'Calm','بزرگ':'Large','کوچک':'Small','متوسط':'Medium',
  'عادی':'Normal','معمولی':'Normal','در حال کار':'Working','در حال:':'Doing:','خواندن…':'Reading…','گشتن…':'Scanning…','گشتن دور و بر':'Scanning around',
  'تست ناموفق':'Test failed','اجرا نشد':'Did not run','انجام نشد':'Failed','خوانده نشد':'Could not read','باز کن ›':'Open ›','مثلاً qwen2.5':'e.g. qwen2.5',
  'روز تا انقضا':'days to expiry','روز مانده':'days left','روز پیش':'days ago','ماه پیش':'months ago','ساعت':'hours','دقیقه':'minutes','ثانیه':'seconds',
  // — calendar / notifications —
  '🗓️ ثبت قرار در تقویم':'🗓️ Add event to calendar','📅 قرارهای پیش‌رو':'📅 Upcoming events','ثبت قرار':'Add event','عنوان قرار':'Event title',
  'پایان (اختیاری)':'End (optional)','فرستادن موقعیت':'Send location','اعلان به تو':'Notify you','فرستادن یک اعلان آزمایشی':'Send a test notification',
  // — voice / misc —
  'خواندن پاسخ با صدا':'Read replies aloud','صحبت کن':'Speak','ضبط صدا':'Record audio','بلوتوث در دسترس نیست.':'Bluetooth is not available.',
  'بخش گوشی بارگذاری نشد.':'The phone section did not load.','چند دقیقه؟ (حداکثر ۴۰)':'How many minutes? (max 40)','برای چند ساعت؟':'For how many hours?',
  'در حال ساخت…':'Generating…','ساخت تصویر':'Generate image','تبدیل فرمت':'Convert format','یک عکس انتخاب کن':'Pick an image','تبدیل به':'Convert to',
  'اندازه':'Size','بساز نسخه‌ی نصبی از خودم':'Build an installable copy of myself','نصب‌شده‌ها':'Installed','رد شده':'Rejected','نسخه‌ی فعلی':'Current version',
  // — second sweep pass (found by walking every panel in the browser) —
  'این دستگاه را بشناس و دفعه‌ی بعد خودکار وارد شو':'Remember this device and sign in automatically next time',
  '⚠️ شبکه امن نیست — این شبکه جلوی اینترنت یک صفحه‌ی ورود گذاشته است.':'⚠️ Network is not secure — this network put a login page in front of the internet.',
  '🏠 تابلوی خانواده':'🏠 Family board','سنجاق کن (بالای تابلو بماند)':'Pin (keep at the top of the board)',
  'پاک کردن خوانده‌شده‌ها':'Clear read ones','پاک کردن همه (به‌جز سنجاق‌شده)':'Clear all (except pinned)','پاک کردن همه (با سنجاق‌شده‌ها)':'Clear all (including pinned)',
  'هر سرویس سازگار با OpenAI (مثل یک سرور محلی یا ابری). آدرس پایه و نام مدل‌ها را بده.':'Any OpenAI-compatible service (a local or cloud server). Give the base URL and model names.',
  'سن و علایق هر نفر — رفتار ستایش با آن‌ها متناسب می‌شود.':'Each person’s age and interests — Setayesh adapts to them.',
  'نام فامیل، نام مدرسه و هرچه نباید بیرون برود. نام حساب‌ها خودکار محافظت می‌شوند.':'Surname, school name and anything that must not leak. Account names are protected automatically.',
  '🤖 حالت خودمختار — خودش تغییر را انجام دهد':'🤖 Autonomous mode — let it make the change itself','وقتی روشن باشد، هر تغییری که':'When on, any change that',
  'خودت در همین برنامه':'yourself, inside this app','محافظت:':'Protection:',
  'دستورهایی که از تلگرام، ایمیل، اینباکس یا کارهای پس‌زمینه می‌آیند':'Commands coming from Telegram, email, inbox or background jobs',
  'کد روی این کامپیوتر اجرا می‌شود. فقط اگر پایتون نصب است.':'Code runs on this computer. Only if Python is installed.',
  'برای وقتی که می‌خواهی هیچ‌چیز از این کامپیوتر خارج نشود.':'For when you want nothing to leave this computer.',
  '🎛️ مدل‌های لوکال (Ollama) — کم و زیاد کن':'🎛️ Local models (Ollama) — add or remove','🔎 شناسایی از Ollama':'🔎 Detect from Ollama',
  '🔎 موتورهای جستجو — کم و زیاد کن':'🔎 Search engines — add or remove','ذخیره موتورهای جستجو':'Save search engines',
  '🧠 مغز پایتون + کتابخانه‌ها':'🧠 Python brain + libraries','📥 دانلود کتابخانه‌های مهم پایتون':'📥 Download key Python libraries',
  'دستگاه‌هایی که به ستایش وصل شده‌اند. اگر چیز ناآشنایی دیدی، حذفش کن و رمزها را عوض کن.':'Devices connected to Setayesh. If you see anything unfamiliar, remove it and change your passwords.',
  'چند کامپیوتر خانه اطلاعاتشان را یکی می‌کنند. رمزگذاری‌شده، فقط بین کامپیوترهای خودت.':'Several home computers merge their data. Encrypted, only between your own computers.',
  'مرکز (مینی‌پی‌سی)':'Hub (mini-PC)','فرعی (لپ‌تاپ)':'Secondary (laptop)','کلید مشترک (روی همه‌ی کامپیوترها یکی)':'Shared key (same on all computers)',
  'آدرس این مرکز (به کامپیوترهای دیگر بده)':'This hub’s address (give it to the other computers)','چه چیزی یکی شود':'What to merge',
  'حافظه و مهلت‌ها':'Memory & deadlines','همین حالا هماهنگ کن':'Sync now',
  'برای دریافت ایمیل، آدرس ایمیلت را در بخش موتورها/تنظیمات بگذار (NOTIFY_EMAIL).':'To receive email, set your email address in Engines/Settings (NOTIFY_EMAIL).',
  '📥 پوشه‌ی ورودی — همه‌چیز یک‌جا':'📥 Inbox folder — everything in one place','هر فایلی در این پوشه بگذاری، خودش می‌فهمد چیست:':'Drop any file in this folder and it figures out what it is:',
  'فایل':'File','→ کتابخانه‌ی اسکریپت ·':'→ Script library ·','به‌روزرسانی → نصب · بقیه → نگه داشته می‌شود':'Update → install · the rest → kept',
  'فایل‌های پایتون خودت. آپلود کن، اجرا کن، حذف کن.':'Your own Python files. Upload, run, delete.','📲 آپلود از گوشی':'📲 Upload from phone',
  'حالت تعمیر: نصب مجدد همان نسخه (برای کامل‌کردن نصب ناقص)':'Repair mode: reinstall the same version (to finish a partial install)',
  'یا یک فایل ZIP در پوشه‌ی':'or a ZIP file in the folder','بگذار — خودش نصب می‌کند و ری‌استارت می‌شود.':'drop it — it installs itself and restarts.',
  '📦 بساز و دانلود کن (نسخه‌ی فعلی)':'📦 Build & download (current version)','بدون دست‌زدن به کد. تغییر بده، ذخیره کن، صفحه را رفرش کن.':'No touching the code. Change it, save, refresh the page.',
  'چهرهٔ ستایش':'Setayesh’s face','بارگذاری نشد':'Failed to load','کروم نقره‌ای':'Silver chrome','کریستال':'Crystal','طلایی':'Gold','نئون':'Neon',
  'چینی سفید':'White porcelain','هولوگرام':'Hologram','ذخیرهٔ چهره':'Save face','🎲 نمونه‌های تازه':'🎲 Fresh samples','⬆️ آپلود عکس خودم':'⬆️ Upload my own photo',
  'پیش‌فرض':'Default','اسم برنامه':'App name','پس‌زمینه':'Background','گردی گوشه‌ها':'Corner roundness','افکت‌های پس‌زمینه (روی کامپیوتر)':'Background effects (on desktop)',
  'یک انتخاب، همه‌ی تنظیمات را با هم عوض می‌کند.':'One choice changes all the settings together.','پرشتاب':'Fast',
  'صفحات واقعی را می‌خواند و لینکشان را کنار هر مطلب می‌گذارد تا خودت بررسی کنی.':'It reads real pages and puts their link next to each item so you can check.',
  'خالی = کل اینترنت. یک دامنه در هر خط، مثلاً developer.mozilla.org':'Empty = the whole internet. One domain per line, e.g. developer.mozilla.org',
  'تأیید خودکار (بدون بررسی من) — پیشنهاد نمی‌شود':'Auto-approve (without my review) — not recommended','در انتظار تأیید شما':'Awaiting your approval',
  'تأییدشده (در حال استفاده)':'Approved (in use)','📱 باز کردن روی گوشی':'📱 Open on phone','مغز محلی ستایش (پایتون)':'Setayesh local brain (Python)','📦 بساز نسخه':'📦 Build a version',
  'بچرخان · با دو انگشت یا اسکرول زوم کن · روی هر بخش بزن':'Rotate · pinch or scroll to zoom · tap any part','آنچه ستایش درباره‌ی تو به‌خاطر سپرده':'What Setayesh has remembered about you',
  '💡 دانسته':'💡 Known','⭐ ترجیح':'⭐ Preference','📦 پروژه':'📦 Project','📄 سند':'📄 Document','⏰ مهلت':'⏰ Deadline',
  'مهلت‌ها و موارد اخیر':'Deadlines & recent items','دانسته‌ها، ترجیح‌ها و پروژه‌ها':'Facts, preferences & projects','اتصال ستایش به سرویس‌های بیرونی':'Connect Setayesh to external services',
  '🔍 پیدا کن':'🔍 Find','Google · Gmail و تقویم':'Google · Gmail & Calendar','🔐 بکاپ رمزنگاری‌شده → درایو':'🔐 Encrypted backup → Drive','رمزنگاری و آپلود به Google Drive':'Encrypt & upload to Google Drive',
  'تلگرام':'Telegram','یک ربات از':'a bot from','بساز و توکنش را بگذار. Chat ID خودت را از':'create one and paste its token. Get your Chat ID from','بگیر.':'get it.',
  'مغز':'Brain','جستجوی زنده':'Live search','منو':'Menu',
  'هنوز کاری انجام نشده. یادگیری را روشن کن یا «همین حالا یک تحقیق» را بزن.':'Nothing done yet. Turn on learning or press “Run a research cycle now”.',
  'صف خالی است — خودش موضوع انتخاب می‌کند.':'The queue is empty — it picks topics itself.','چیزی در انتظار تأیید نیست.':'Nothing awaiting approval.',
  // engine picker composite labels
  'Google · Gemini · رایگان':'Google · Gemini · free','Groq · ultra-fast · رایگان':'Groq · ultra-fast · free','OpenRouter · many models · رایگان':'OpenRouter · many models · free',
  'Cerebras · fast · رایگان':'Cerebras · fast · free','Mistral · رایگان':'Mistral · free','مغز محلی ستایش (پایتون) · رایگان':'Setayesh local brain (Python) · free',
  'Bad Engine · دلخواه':'Bad Engine · custom','Good Engine · دلخواه':'Good Engine · custom','Stub · دلخواه':'Stub · custom','مغز محلی ستایش (پایتون) (پیش‌فرض)':'Setayesh local brain (Python) (default)',
  // placeholders
  'نام مدل‌ها با کاما، مثل gpt-4o,gpt-4o-mini':'Model names, comma-separated, e.g. gpt-4o,gpt-4o-mini','یک رمز که فقط تو می‌دانی — حداقل ۸ حرف':'A password only you know — at least 8 characters',
  'مثلاً: سلام، چه کمکی می‌خوای؟':'e.g. Hi, how can I help?','موضوعی که می‌خواهید یاد بگیرد...':'A topic you want it to learn...','چیزی که می‌خواهی به‌خاطر بسپارد...':'Something you want it to remember...',
  'یا مسیر والت را دستی بنویس…':'Or type the vault path manually…','ghp_… (خالی = قطع اتصال)':'ghp_… (empty = disconnect)',
  'رمز پشتیبان (حداقل ۸ حرف — همین را برای بازیابی لازم داری)':'Backup password (at least 8 chars — you’ll need it to restore)','Chat ID (مثلاً 123456789)':'Chat ID (e.g. 123456789)',
  // — third sweep pass (final stragglers) —
  'مغز ستایش ۰.۶':'Setayesh brain 0.6','✕ بستن':'✕ Close','در حال انتخاب موضوع برای تحقیق…':'Choosing a research topic…',
  'هنوز چیزی تأیید نشده.':'Nothing approved yet.','دستگاه‌ها:':'Devices:','والتی پیدا نشد — مسیر را دستی بنویس.':'No vault found — type the path manually.',
  'تنظیم نشده':'Not set','بسته':'Closed','مغز محلی ستایش (پایتون) (default)':'Setayesh local brain (Python) (default)',
  'تعمیر (نصب مجدد)':'Repair (reinstall)','بعداً':'Later'
};

(function(){
  var FA2EN = window.__FA2EN || {};
  // Normalize so tiny differences (an ellipsis char vs "...", doubled spaces)
  // don't cause a miss. Lookups go through the normalized table.
  function norm(s){ return String(s).replace(/…/g, '...').replace(/\s+/g, ' ').trim(); }
  var NORM = {};
  for (var kk in FA2EN) NORM[norm(kk)] = FA2EN[kk];
  function lookup(raw){ var k = norm(raw); return k && NORM[k] != null ? NORM[k] : null; }

  var ORIG = new WeakMap();                       // text node -> original Persian
  // Text-node skip: never translate the user's OWN content areas or code.
  // Note: <select> is intentionally NOT skipped — <option> labels are UI chrome
  // (engine/model names), not user-typed values, so they should localize too.
  var SKIP = '#thread, #msgBox, textarea, input, [contenteditable], code, pre, .msg, .bubble, #boardList, #boardBody, #memList, #memBody, [data-noi18n]';
  // Attribute skip is narrower: a placeholder/title on an input IS UI chrome and
  // must be translated — we only ever touch those attributes, never a value.
  var ATTR_SKIP = '#thread, #boardList, #boardBody, #memList, #memBody, [data-noi18n]';
  function closestSel(el, sel){ try { return el && el.closest && el.closest(sel); } catch(e){ return false; } }
  function inSkip(el){ return closestSel(el, SKIP); }
  function inAttrSkip(el){ return closestSel(el, ATTR_SKIP); }
  var ATTRS = ['placeholder','title','aria-label'];
  var observer = null, curLang = 'fa';

  function apply(lang){
    // text nodes
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
    var nodes = [], n;
    while ((n = walker.nextNode())) nodes.push(n);
    for (var i=0;i<nodes.length;i++){
      var tn = nodes[i], p = tn.parentNode;
      if (!p || inSkip(p)) continue;
      if (lang === 'en'){
        var key = (tn.nodeValue||'').trim();
        var en = key && lookup(key);
        if (en != null){
          if (!ORIG.has(tn)) ORIG.set(tn, tn.nodeValue);
          tn.nodeValue = tn.nodeValue.replace(key, en);
        }
      } else if (ORIG.has(tn)){
        tn.nodeValue = ORIG.get(tn); ORIG.delete(tn);
      }
    }
    // attributes
    for (var a=0;a<ATTRS.length;a++){
      var attr = ATTRS[a], els = document.querySelectorAll('['+attr+']'), oAttr = 'data-o-'+attr;
      for (var j=0;j<els.length;j++){
        var el = els[j]; if (inAttrSkip(el)) continue;
        if (lang === 'en'){
          var v = (el.getAttribute(attr)||'').trim();
          var ven = v && lookup(v);
          if (ven != null){
            if (!el.hasAttribute(oAttr)) el.setAttribute(oAttr, el.getAttribute(attr));
            el.setAttribute(attr, ven);
          }
        } else if (el.hasAttribute(oAttr)){
          el.setAttribute(attr, el.getAttribute(oAttr)); el.removeAttribute(oAttr);
        }
      }
    }
  }

  function sweep(lang){
    curLang = (lang === 'en') ? 'en' : 'fa';
    if (observer) observer.disconnect();          // don't observe our own edits
    try { apply(curLang); } catch(e){}
    if (observer) try { observer.observe(document.body, { childList:true, subtree:true, characterData:false }); } catch(e){}
  }

  // Localize panels that render after a language switch (only meaningful in en).
  var pending = false;
  observer = new MutationObserver(function(){
    if (curLang !== 'en' || pending) return;
    pending = true;
    (window.requestAnimationFrame || setTimeout)(function(){
      pending = false;
      if (observer) observer.disconnect();
      try { apply('en'); } catch(e){}
      if (observer) try { observer.observe(document.body, { childList:true, subtree:true, characterData:false }); } catch(e){}
    });
  });

  window.i18nSweep = sweep;   // app.js calls this from applyLang()
})();
