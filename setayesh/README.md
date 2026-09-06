# ستایش (Setayesh) AI

یک دستیار هوش مصنوعی خانوادگی و خصوصی که به‌صورت محلی روی دستگاه خانواده اجرا می‌شود.
A private, family AI assistant that runs locally on the family's own machine.

> 📜 قوانین و ضوابط توسعه در [`RULES.md`](RULES.md) — و راهنمای Claude Code در [`CLAUDE.md`](CLAUDE.md). Development charter in `RULES.md`.

## امکانات / Features
- چت با چند ارائه‌دهنده (Anthropic, Gemini, Groq, OpenRouter, Cerebras, Mistral, OpenAI, و سرور محلی Ollama/LM Studio)
- پنل مدیریت، حساب‌های کاربری، حافظه، تابلوی خانواده، اعلان‌ها
- ابزارهای امنیتی دفاعی (اسکن شبکهٔ خصوصی، پورت، SSL، هش، QR) — محدود به فضای آدرس محلی/خصوصی
- افزونه‌ها (drop-in plugins)، به‌روزرسانی خودکار و خودترمیمی
- نمای «مغز سه‌بعدی» بر پایهٔ three.js

## اجرا / Run
**ساده‌ترین راه (ویندوز):** روی فایل **`Start-Setayesh.bat`** دوبار کلیک کن — خودش وابستگی‌ها را نصب، سرور را اجرا و مرورگر را باز می‌کند. **پنجرهٔ مشکی را باز نگه دار.**
**مک/لینوکس:** `./start.sh` را اجرا کن.

راه دستی:
```bash
npm install
npm start
```
سپس مرورگر را روی `http://localhost:3000` باز کنید. برای اجرای فقط-محلی:
```bash
SETAYESH_HOST=127.0.0.1 npm start
```

- نیازمند Node.js 18 یا بالاتر (برای دکمهٔ «ری‌استارت» داخل برنامه، از لانچر استفاده کنید).
- کلیدهای API از طریق پنل تنظیمات وارد می‌شوند.
- اگر پیام «Could not reach the server» دیدید یعنی سرور اجرا نیست یا پنجره‌اش بسته شده — لانچر را دوباره اجرا و از `http://localhost:3000` وارد شوید (نه با باز کردن مستقیم فایل).

## HTTPS محلی (اختیاری) / Local HTTPS (optional)
برای رمزنگاری ترافیک روی LAN/Tailscale، یک گواهی کنار برنامه بگذارید — بدون هیچ وابستگیِ جدید:
- فایل‌ها را با نام `tls-cert.pem` و `tls-key.pem` کنار برنامه قرار دهید (یا مسیرشان را در `SETAYESH_TLS_CERT` / `SETAYESH_TLS_KEY` بدهید).
- گرفتن گواهی: با **Tailscale** (`tailscale cert <نام-دستگاه>`) یا **mkcert**.
- اگر گواهی نباشد، برنامه مثل قبل روی HTTP اجرا می‌شود (بدون تغییر).

Drop `tls-cert.pem` + `tls-key.pem` next to the app (or set `SETAYESH_TLS_CERT`/`SETAYESH_TLS_KEY`) to serve HTTPS; get a cert from Tailscale or mkcert. No cert → plain HTTP as before.

## نکات امنیتی / Security notes
- رمز پیش‌فرض حساب `admin` را در اولین ورود تغییر دهید.
- فایل‌های حالت زمان‌اجرا (`.setayesh-users.json`، `backups/`، `code-library/` و ...) کامیت نمی‌شوند و در `.gitignore` قرار دارند.
- گواهی TLS هرگز به‌صورت پیش‌فرض غیرفعال نمی‌شود.

## تست / Tests
```bash
npm test
```
مجموعهٔ تستِ مسیرهای حیاتی (ورود، پیکربندی، حافظه، کانکتورها، SPA) با تست‌ران داخلی Node — بدون وابستگی جدید. سرور روی پورت موقت با داده‌های موقت اجرا می‌شود و داده‌های واقعی را دست نمی‌زند. Critical-path smoke tests via Node's built-in runner; boots the server on a temp port with throwaway state.

## نسخه / Version
9.9.44

### تغییرات ۹.۹.۴۴ / Changelog 9.9.44 — ابزار گیت‌هاب (کتابخانه‌های متن‌باز)
- **دو ابزار جدید و بدون‌کلید برای مغز:** `github_search` (جستجوی مخازن/کتابخانه‌ها با ستاره و زبان و توضیح) و `github_file` (خواندنِ متنِ هر فایل از یک مخزنِ عمومی، مثل سورس یا README). فقط‌خواندنی — هیچ‌وقت چیزی را push یا تغییر نمی‌دهد. حالا ستایش می‌تواند کتابخانه پیدا کند و کدِ واقعی‌اش را بخواند به‌جای حدس. محتوا «داده» است نه دستور (همان قانونِ اعتمادِ وب).
  GitHub tools (keyless, read-only): github_search finds open-source repositories/libraries; github_file reads any file from a public repo (source, README, examples). Lets the brain find a library and read its real code instead of guessing. Uses the public API + raw.githubusercontent.com; content is treated as data, never instructions.


### تغییرات ۹.۹.۴۳ / Changelog 9.9.43 — مدل‌های لوکالِ بیشتر (DeepSeek و…)
- به فهرستِ موتورِ **محلی (Ollama/LM Studio)** مدل‌های محبوب اضافه شد: **DeepSeek R1**، **DeepSeek Coder V2**، Qwen2.5 / Qwen2.5 Coder، Llama 3.1 / 3.2، Gemma 2، Mistral. بعد از روشن‌کردنِ کلیدِ «موتور محلی (Ollama)» در تنظیمات و pull‌کردنِ مدل در Ollama، مستقیم قابل‌انتخاب‌اند. کاملاً آفلاین، بدون سقفِ توکن، بدون کلید.
  More local models for the built-in Ollama/LM Studio engine: DeepSeek R1, DeepSeek Coder V2, Qwen2.5(-Coder), Llama 3.1/3.2, Gemma 2, Mistral. Enable the "Local engine (Ollama)" toggle in settings, `ollama pull` the model, and pick it — fully offline, no token cap, no key.


### تغییرات ۹.۹.۴۲ / Changelog 9.9.42 — جستجوی خودکارِ مستقل از مدل
- **جستجوی وب خودکار حالا بدون کلید هم کار می‌کند.** قبلاً «جستجوی خودکار» فقط وقتی روشن می‌شد که کلید **Gemini** موجود بود (چون از Google Search آن قرض می‌گرفت). حالا اگر پیام نیاز به اطلاعات روز داشته باشد ولی Gemini نباشد، برنامه خودش با جستجوی **بدون‌کلیدِ DuckDuckGo** نتیجه می‌گیرد و مستقیم به مغز می‌دهد — روی **هر موتوری، از جمله مدل‌های رایگان** که خودشان ابزار را صدا نمی‌زنند. بهترین‌تلاش: اگر جستجو کند/ناموفق بود، پاسخ بدون آن داده می‌شود. با `AUTO_SEARCH=0` قابل خاموش‌کردن.
  Model-independent auto web search: previously auto-search only worked when a Gemini key was present (it borrowed Gemini's Google Search). Now, when a question needs fresh info but Gemini isn't available, the server fetches results with the keyless DuckDuckGo search and injects them into the prompt — so "search when needed" works on any engine, including the free models that never call the web_search tool themselves. Best-effort; set AUTO_SEARCH=0 to disable.


### تغییرات ۹.۹.۴۱ / Changelog 9.9.41 — نسخهٔ قابل‌حمل روی USB
- **`Build-Portable.bat`:** یک‌بار روی کامپیوترِ خودت اجرا کن تا پوشهٔ **`Setayesh-Portable`** ساخته شود که **`node.exe` خودت + همهٔ وابستگی‌ها + برنامه** را در خود دارد. این پوشه را روی USB می‌بری و روی **هر** ویندوز با دوبار کلیکِ `Setayesh.bat` اجرا می‌کنی — **بدون نصبِ Node و بدون اینترنت**.
- داده‌ها (`.setayesh-*`) کنارِ برنامه روی USB می‌مانند، پس هر کپی، حساب/کلید/حافظهٔ خودش را دارد؛ چیزی روی کامپیوترِ میزبان نوشته نمی‌شود.
  Portable USB build: run Build-Portable.bat once to produce a self-contained Setayesh-Portable folder (bundles your own node.exe + node_modules + the app). Copy it to a USB stick and double-click Setayesh.bat on any Windows PC — no Node install, no internet. Data lives next to the app on the stick.


### تغییرات ۹.۹.۴۰ / Changelog 9.9.40 — بالا آمدن مطمئن با فایلِ گم‌شده
- **اگر یک ماژولِ اختیاری (کانکتور گوگل `connectors.js` یا `telegram.js`) در پوشه نباشد، دیگر کلِ سرور نمی‌خوابد.** به‌جای کرشِ «Cannot find module»، یک استاب بار می‌شود: آن قابلیت «تنظیم‌نشده» گزارش می‌شود و بقیهٔ برنامه (لاگین، چت، …) کار می‌کند. با شبیه‌سازیِ نبودِ هر دو فایل تأیید شد که سرور سالم بالا می‌آید.
  Boot resiliently when an optional module file is missing: connectors.js / telegram.js are now loaded defensively, so a half-copied update folder no longer crashes the whole server with "Cannot find module" — the feature just reports not-configured and login/chat keep working.


### تغییرات ۹.۹.۳۹ / Changelog 9.9.39 — رفع حلقهٔ نصبِ به‌روزرسانی
- **رفع باگِ حلقهٔ نصب:** حالا فایلِ zipِ به‌روزرسانی **بلافاصله بعد از اعتبارسنجی و پیش از نوشتن/ری‌استارت** از پوشهٔ updates بیرون برده می‌شود، پس هر بسته دقیقاً یک‌بار نصب می‌شود؛ اگر ری‌استارت وسطِ کار قطع شود دیگر بی‌نهایت‌بار همان نسخه دوباره نصب نمی‌شود. (نصبِ نسخهٔ قدیمی‌تر از قبل رد می‌شد.)
  Fix the auto-update reinstall loop: the update zip is now moved out of the updates folder right after it validates (contents already in memory) and before writing files or restarting, so each package installs exactly once even if the restart is interrupted.


### تغییرات ۹.۹.۳۸ / Changelog 9.9.38 — شروع شکستن رابط: جدا کردن ترجمه‌ها (بدون ریسک)
- **اولین برشِ `app.js` (۴٬۶۶۲ خطی):** شیءِ بزرگِ ترجمه‌ها (`LANG`، فارسی/انگلیسی/آلمانی، ~۹۰ خط دادهٔ خالص) به `public/app-i18n.js` منتقل شد و به‌صورتِ `window.__LANG` قبل از `app.js` بارگذاری می‌شود؛ در `app.js` فقط یک خط شد: `var LANG = window.__LANG`.
- چون `app.js` یک IIFE است (درونش خصوصی)، داده از طریقِ یک گلوبالِ `window` به اشتراک گذاشته شد — نه گلوبال‌سازیِ توابع.
- **راستی‌آزماییِ واقعی:** سرور بالا آمد و صفحه با **کرومیومِ headless** رِندر شد؛ متنِ رابط (دکمهٔ «ورود» که از `LANG` می‌آید) در DOMِ پس‌از‌JS حاضر بود — یعنی چیزی نشکسته.
- `app.js` از ۴٬۶۶۲ به **۴٬۵۷۳** خط رسید. تست‌ها ۲۴ و همه سبز.
  First cut of the 4,662-line client monolith: moved the big fa/en/de translations object (LANG, ~90 lines of pure data) out to public/app-i18n.js as window.__LANG, loaded before app.js; app.js now reads it in one line. Since app.js is an IIFE, the data is shared via a window global. Verified by a real headless-Chromium render (the login UI text from LANG appears in the post-JS DOM). app.js drops to 4,573 lines; 24/24 tests green.

### تغییرات ۹.۹.۳۷ / Changelog 9.9.37 — جدا کردن مسیرهای دستگاه (بدون ریسک)
- **مسیرهای دستگاه (ثبتِ صفحه/چیدمان، ترجیحاتِ هر دستگاه، فهرست و لغوِ دسترسی توسط مدیر) به `routes/devices.js` منتقل شد**، به‌همراه دو تابعِ خالصِ `classifyDevice`/`deviceLabel` که فقط همان‌جا استفاده می‌شدند.
- **عمداً منتقل نشد:** خودِ state (`devices`, `saveDevices`) و **مسیرِ امنیتیِ ورودِ دستگاهِ مورد اعتماد** (auto-login) در `index.js` ماند. ماژول به `devices` از طریقِ `getDevices()` دسترسی می‌کند، چون `saveDevices()` هنگام هرس به ۶۰ دستگاهِ اخیر آن را **بازتخصیص** می‌کند و یک ارجاعِ ثابت کهنه می‌شد.
- `index.js` از ۶٬۶۴۶ به **۶٬۵۵۱** خط رسید (از ابتدای این شاخه ~۲٬۳۹۰ خط سبک‌تر، در ۱۱ ماژول).
- **تست جدید:** ثبتِ دستگاه (چیدمانِ موبایل)، تنظیمِ ترجیحات، فهرست، و لغوِ دسترسی — مجموع تست‌ها ۲۴ و همه سبز.
  Extracted the device routes (screen/layout registration, per-device prefs, admin list + revoke) plus the pure classifyDevice/deviceLabel helpers into routes/devices.js. The devices state and the security-critical trusted-device login flow stay in index.js; the module reaches `devices` via getDevices() because saveDevices() reassigns it on trim. 24/24 tests green.

### تغییرات ۹.۹.۳۶ / Changelog 9.9.36 — جدا کردن همگام‌سازی بین کامپیوترها (بدون ریسک)
- **کل زیرسیستمِ Sync به `sync.js` منتقل شد**: رمزنگاریِ AES-256-GCM با کلید مشترک، snapshot/merge (board/memory/devices/knowledge)، endpointِ همتا `/api/sync/exchange`، حلقهٔ ۹۰ثانیه‌ای، و مسیرهای `/api/admin/sync*`.
- **روشِ بدون‌ریسک:** تحلیل دوطرفه نشان داد **هیچ نمادی به بیرون نشت نمی‌کند**، پس کل بخش تمیز جدا شد. چون وابستگی‌ها (board/memory/devices/knowledge و savers) **بعدتر** در `index.js` تعریف می‌شوند، ماژول **دیرتر** (بعد از تعریفشان و قبل از catch-all) ثبت شد. `knowledge` و `devices` در `index.js` بازتخصیص می‌شوند، پس با getter/setter دسترسی می‌شوند؛ `memory` و `boardRoutes` ارجاعِ پایدارند و مستقیم پاس شدند؛ `localLanIps` چون تابعِ hoist‌شده است مستقیم پاس شد.
- `index.js` از ۶٬۷۸۹ به **۶٬۶۴۶** خط رسید (از ابتدای این شاخه ~۲٬۳۰۰ خط سبک‌تر، در ۱۰ ماژول).
- **تست جدید:** وضعیت sync، ردِ exchange وقتی خاموش است (۴۰۳)، به‌روزرسانی تنظیمات، و ردِ کلیدِ اشتباه (۴۰۱) — مجموع تست‌ها ۲۳ و همه سبز.
  Extracted the whole peer-sync subsystem into sync.js (AES-256-GCM shared-key transit encryption, snapshot/merge, the /api/sync/exchange peer endpoint, the 90s loop, /api/admin/sync* routes). Zero-risk: two-way analysis showed nothing leaks out; registered late (deps defined later, before the catch-all); knowledge/devices reached via accessors (they get reassigned), memory/boardRoutes passed directly. 23/23 tests green.

### تغییرات ۹.۹.۳۵ / Changelog 9.9.35 — جدا کردن مسیرهای «شب/دستیار شبانه» (بدون ریسک)
- **مسیرهای تنظیماتِ شب و فهرستِ کارهای شب به `routes/night.js` منتقل شد** (به‌همراه تابعِ خالصِ `inQuietHours`).
- **عمداً منتقل نشد:** خودِ موتورِ self-heal/تأیید/rollback/به‌روزرسانی خودکار (که `process.exit` و ری‌استارت می‌کند) و state (`night`/`saveNight`/`nightLog`) در `index.js` ماندند — این ماشینِ حساس جای دست‌کاریِ سرسری نیست. فقط مسیرهای کوچک و **تست‌پذیر** جدا شدند و `night` با ارجاع (تغییرِ درجا) پاس داده شد.
- `index.js` از ۶٬۸۱۵ به **۶٬۷۸۹** خط رسید.
- **تست جدید:** خواندن تنظیمات، تغییرِ بازهٔ ساعت، افزودن و حذفِ کارِ شب — مجموع تست‌ها ۲۲ و همه سبز.
  Extracted the night settings + task-list routes (and the pure inQuietHours helper) into routes/night.js. The self-heal/verify/rollback/auto-update engine and the night state stay in index.js on purpose — that restart machinery is not something to relocate casually. night is passed by reference. 22/22 tests green.

### تغییرات ۹.۹.۳۴ / Changelog 9.9.34 — جدا کردن حافظهٔ بلندمدت + RAG (بدون ریسک)
- **حافظهٔ بلندمدتِ هر کاربر و مسیرهای RAG به `memory.js` منتقل شد**: مخزنِ `memory`، `addMemory`/`memoryFor`/`memoryBlock` (بلوکِ تزریق‌شده به پرامپت با ردکشنِ حریم خصوصی)، و مسیرهای `/api/memory`, `/api/rag/search`, `/api/admin/rag`, `/api/admin/memory`.
- **روشِ بدون‌ریسک:** رفتار از قبل با تست‌های CRUD حافظه و جستجوی RAG قفل شده بود؛ تحلیل ایستای دوطرفه وابستگی‌ها را اثبات کرد؛ کد **کلمه‌به‌کلمه** منتقل شد. شیءِ `memory` همان شیء است (در جا تغییر می‌کند) تا نوشتنِ درجای بیرونی (مثلاً ادغامِ همگام‌سازی) دست‌نخورده کار کند؛ توابع با wrapperهای hoist‌شده دوباره معرفی شدند. `MEMORY_FILE` در `index.js` ماند (فهرستِ پشتیبان به آن ارجاع دارد) و پاس داده شد.
- `index.js` از ۶٬۸۹۸ به **۶٬۸۱۵** خط رسید (از ابتدای این شاخه ~۲٬۱۲۰ خط سبک‌تر، در ۸ ماژول).
- تست‌ها ۲۱ و همه سبز.
  Extracted per-user long-term memory + the RAG routes into memory.js. Zero-risk: behavior already locked by the memory-CRUD and RAG-search tests, two-way static dep proof, verbatim move, the memory object shared in place (so the sync merge still works), hoisted function wrappers, MEMORY_FILE kept in index.js for the backup list. 21/21 tests green.

### تغییرات ۹.۹.۳۳ / Changelog 9.9.33 — جدا کردن اعلان‌ها و ایمیل و تلگرام (بدون ریسک)
- **زیرسیستمِ اعلان‌ها به `notify.js` منتقل شد**: مخزن اعلان‌ها، ارسال ایمیلِ SMTP (فقط به آدرسِ خودِ صاحب‌خانه)، آلارمِ تلگرام، و تابعِ مرکزیِ `notifyOwner` + مسیرهای `/api/notifications` و `/api/admin/notify-*`.
- **روشِ بدون‌ریسک:** تحلیل ایستای دوطرفه برای اثباتِ کاملِ وابستگی‌ها؛ کدِ **کلمه‌به‌کلمه** منتقل شد. چون `boardRoutes` و `pendingActions` در `index.js` **بعد از** این بلوک تعریف می‌شوند، به‌صورت **تنبل (lazy)** پاس داده شدند تا موقع بالا آمدن سرور خطای TDZ ندهد. `notifyOwner` با یک wrapperِ hoist‌شده دوباره در `index.js` معرفی شد تا هر ۶ نقطهٔ فراخوانی (و گاردِ `typeof notifyOwner === 'function'`) دقیقاً مثل قبل کار کنند.
- `index.js` از ۷٬۰۰۹ به **۶٬۸۹۸** خط رسید (از ابتدای این شاخه ~۲٬۰۴۰ خط سبک‌تر، در ۷ ماژول).
- **تست جدید:** فهرست اعلان‌ها، وضعیت ایمیل، و علامتِ خوانده‌شده — مجموع تست‌ها ۲۱ و همه سبز.
  Extracted notifications + owner email + Telegram alert into notify.js. Zero-risk: two-way static dep proof, verbatim move, lazy-passed boardRoutes/pendingActions (defined later in index.js) to avoid a boot-time TDZ, and a hoisted notifyOwner wrapper so all six call sites are byte-for-byte unchanged. 21/21 tests green.

### تغییرات ۹.۹.۳۲ / Changelog 9.9.32 — جدا کردن زیرسیستمِ دستگاه‌های خانه (بدون ریسک)
- **کل زیرسیستمِ «دستگاه‌های خانه» (~۱۳۵۰ خط) به `homedevices.js` منتقل شد**: اسکنر شبکه، درایورها (Samsung TV، چاپگر Canon با IPP، Tuya/LSC ابری، Xiaomi miio)، رجیستری دستگاه‌ها، ماتریسِ دسترسیِ هر کاربر، ارسال فرمان به سخت‌افزار، و همهٔ مسیرهای `/api/home/*`.
- **روشِ «بدون ریسک»:** اول رفتار فعلی با **تست‌های characterization** قفل شد (درایورها، وضعیت اسکن، رجیستری، ماتریس دسترسی، گاردِ step-up)، بعد جابه‌جاییِ **کلمه‌به‌کلمه**، بعد همان تست‌ها دوباره سبز. وابستگی‌های ورودی با تحلیلِ ایستا **کاملاً و اثبات‌شده** استخراج شدند (رفت و برگشت). `http`/`https` که داخل همان بخش تعریف شده بودند و سرور اصلی هم لازمشان داشت، به بالای `index.js` منتقل شدند.
- `index.js` از ۸٬۳۶۵ به **۷٬۰۰۹** خط رسید — بزرگ‌ترین کاهش تا کنون؛ از ابتدای این شاخه ~۱٬۹۳۰ خط سبک‌تر.
- **تست‌های جدید:** زیرسیستم دستگاه‌های خانه — مجموع تست‌ها ۲۰ و همه سبز.
  Moved the entire home-devices subsystem (~1350 lines: LAN scanner, Samsung/Canon/Tuya/Xiaomi drivers, registry, permission matrix, hardware command dispatch, all /api/home/* routes) into homedevices.js. Zero-risk method: characterization tests locked behavior first, then a verbatim move with a statically-proven-complete inbound-dependency set, then the same tests green. index.js drops to 7,009 lines (~1,930 lighter since this branch began). 20/20 tests green.

### تغییرات ۹.۹.۳۱ / Changelog 9.9.31 — ادامهٔ بخش‌بندی سرور (تأیید هویت دومرحله‌ای)
- **جدا کردن «تأیید مجددِ رمز» (step-up) به `auth-stepup.js`** (قانون ۳.۴): توکنِ کوتاه‌عمرِ ۵ دقیقه‌ای برای کارهای حساس (حذف حساب/دستگاه، تغییر دسترسی تلویزیون). رفتار دقیقاً همان است.
- **نکتهٔ احتیاطی:** `requireStepUp` میان‌افزارِ امنیتی است و در مسیرهایی *قبل از* محل تعریفش استفاده می‌شد؛ چون Express میان‌افزار را هنگام «ثبت مسیر» ارزیابی می‌کند، ماژول را **زودتر** (قبل از آن مسیرها) ثبت کردم تا سرور موقع بالا آمدن نخوابد. با تست تأیید شد.
- `index.js` به **۸٬۳۶۵** خط رسید (از ابتدای این شاخه ~۵۷۵ خط سبک‌تر، در ۵ ماژول).
- **تست جدید:** رمز اشتباه ۴۰۱، رمز درست توکن می‌دهد، و مسیرِ محافظت‌شده بدون توکن ۴۰۱ با `stepUpRequired` — مجموع تست‌ها ۱۹ و همه سبز.
  Extracted step-up re-authentication into `auth-stepup.js`; registered early so the security middleware is defined before the routes that use it (Express evaluates middleware at registration time). Behavior unchanged; 19/19 tests green.

### تغییرات ۹.۹.۳۰ / Changelog 9.9.30 — ادامهٔ بخش‌بندی سرور (افزونه‌ها)
- **جدا کردن مسیرهای افزونه به `routes/plugins.js`** (قانون ۳.۴): فهرست، بارگذاری مجدد، و اجرای افزونه. ماژول مالکِ لیستِ `PLUGINS` است (که با `/api/plugins/reload` تازه می‌شود) و `okCount()` را برای خطِ استارتاپ برمی‌گرداند؛ `require('./extensions')` بلااستفاده از `index.js` حذف شد.
- `index.js` از ۸٬۴۲۲ به **۸٬۴۰۰** خط رسید (از ابتدای این شاخه ~۵۴۰ خط سبک‌تر، در ۴ ماژول).
- **تست جدید:** فهرست/بارگذاری‌مجدد افزونه‌ها و ۴۰۴ برای افزونهٔ ناموجود — مجموع تست‌ها ۱۸ و همه سبز.
  Extracted the plugin routes into `routes/plugins.js` (module owns the reloadable PLUGINS list, returns okCount() for the startup line); dropped the now-unused extensions require from index.js. Behavior unchanged; 18/18 tests green.

### تغییرات ۹.۹.۲۹ / Changelog 9.9.29 — ادامهٔ بخش‌بندی سرور (مسیرهای ابزار)
- **جدا کردن مسیرهای سادهٔ ابزار به `routes/tools.js`** (قانون ۳.۴): اسکنِ شبکه/پورت/وب، بازرسِ SSL، هش، QR و مشخصاتِ سخت‌افزار. رفتار دقیقاً همان است.
- **ساختِ تصویر (`genimage`)** عمداً در `index.js` ماند، چون به دلِ موتور Gemini گره خورده — با احتیاط جابه‌جا نشد.
- `index.js` از ۸٬۵۱۹ به **۸٬۴۲۲** خط رسید (از ابتدای این شاخه ~۵۱۶ خط سبک‌تر).
- **تست جدید:** فهرستِ اینترفیس‌ها و هش — مجموع تست‌ها ۱۷ و همه سبز.
  Extracted the self-contained utility tool routes (network/port/web scan, SSL inspector, hashing, QR, hardware) into `routes/tools.js`; image generation stays inline (woven into the Gemini engine). Behavior unchanged; index.js ~516 lines lighter since this branch began; 17/17 tests green.

### تغییرات ۹.۹.۲۸ / Changelog 9.9.28 — ادامهٔ بخش‌بندی سرور (کتابخانهٔ کد)
- **جدا کردن «کتابخانهٔ کد» از فایل بزرگ به `codelib.js`** (قانون ۳.۴ منشور). کل ویژگی — توابع کمکی و همهٔ ۷ مسیر HTTP — در یک ماژول جمع شد؛ `index.js` فقط `codeLibrary()` را برای ساختِ پرامپتِ چت نگه می‌دارد. رفتار دقیقاً همان است.
- `index.js` از ۸٬۷۵۹ به ۸٬۵۱۹ خط رسید (این نسخه ~۲۴۰ خط، از ابتدای این شاخه ~۴۲۰ خط سبک‌تر).
- **تست جدید:** رفت‌وبرگشتِ ساخت/فهرست/خواندن/حذفِ کتابخانه — مجموع تست‌ها ۱۶ و همه سبز.
  Extracted the code-library feature into `codelib.js` (helpers + all 7 routes), keeping only `codeLibrary()` in index.js for the chat prompt builder. Behavior unchanged; index.js ~240 lines lighter (~420 since this branch began); new codelib round-trip smoke test (16/16 green).

### تغییرات ۹.۹.۲۷ / Changelog 9.9.27 — ادامهٔ بخش‌بندی سرور (تابلوی خانواده)
- **جدا کردن «تابلوی خانواده» از فایل بزرگ به `routes/board.js`** (قانون ۳.۴ منشور: شکستن تک‌فایلِ سرور، ماژول‌به‌ماژول و پشتِ تست). رفتار دقیقاً همان است؛ فقط جای کد عوض شده. `index.js` حدود ۱۸۰ خط سبک‌تر شد.
- ماژول مالکِ آرایهٔ `board` و `saveBoard()` است و یک API کوچک (`add/getBoard/setBoard/saveBoard`) به چند صداکنندهٔ داخلی (اعلان ورود، همگام‌سازی، هشدار فوری، خلاصهٔ خانه) می‌دهد.
- **تست جدید:** رفت‌وبرگشتِ ثبت/فهرست/حذفِ پیام تابلو — مجموع تست‌ها به ۱۵ رسید و همه سبز.
  Extracted the family board into `routes/board.js` (server-monolith split, charter 3.4) — behavior unchanged, `index.js` ~180 lines lighter, plus a new board round-trip smoke test (15/15 green).

### تغییرات ۹.۹.۲۶ / Changelog 9.9.26 — شخصی‌سازی درسی هر عضو خانواده
- **تمرکز درسیِ اختصاصی برای هر کاربر** (نقشهٔ `TUTORS` در `index.js`، بدون تغییر UI و بدون وابستگیِ جدید):
  - **ستایش** → **کلاس هفتم (Klasse 7) مدرسه در برلین**؛ تمرکز روی برنامهٔ درسیِ آلمان: **Deutsch** (محور)، **Mathematik** (کسر، اعداد منفی، معادله، درصد، هندسه)، **Englisch**، **Biologie**، **Geografie**، **Geschichte**؛ کمک به هر درس به زبان همان درس.
  - **فردین** → **کلاس دوم (Klasse 2) Grundschule در برلین**؛ درس‌های ابتدایی به زبان آلمانی: خواندن/نوشتن **Deutsch**، **Mathematik** تا ۱۰۰ و ضرب، **Sachunterricht** و انگلیسیِ ساده، با لحن بازیگوش و مثال‌های کوچک.
  - **آرزو** → تمرکز بیشتر روی **کارِ پرستاری و Pflegekraft در آلمان**: مستندات پرستاری (Pflegedokumentation)، تحویل شیفت (Übergabe)، اصطلاحات تخصصیِ آلمانیِ Pflege، ارتباط محترمانه، و پشتیبانی برای مدرک/آزمون؛ همراه با هشدارِ «پزشک نیستم» برای تصمیم‌های درمانی.
  Per-member school/work personalization: Setayesh (Berlin Klasse 7 German curriculum), Fardin (Berlin Klasse 2 Grundschule), Arezou (German Pflegekraft/nursing focus with real Pflege terminology). Server-side prompt tuning only; all 14 smoke tests green.

### تغییرات ۹.۹.۲۵ / Changelog 9.9.25 — RAG محلیِ سبک
- **جستجوی معناییِ محلی روی حافظهٔ خانواده** (`rag.js`): یک ایندکس **TF-IDF + کسینوس** با **JS خالص** — بدون Qdrant، بدون سرور جانبی، بدون وابستگیِ جدید، کاملاً آفلاین و خصوصی. فارسی و انگلیسی. Private, offline, dependency-free local semantic-ish search over the family's notes/memories.
- حافظه‌ها **خودکار ایندکس** می‌شوند (و با حذف، از ایندکس هم پاک می‌شوند). هر کاربر فقط دادهٔ **خودش** را می‌بیند؛ مدیر می‌تواند در همه جستجو کند. Memories are auto-indexed; per-user isolation (admin can search all).
- **ابزار `recall` برای هوش مصنوعی**: ستایش در چت می‌تواند حافظه را معنایی جستجو کند و پاسخ را بر پایهٔ آنچه خانواده قبلاً گفته بنا کند (به‌جای حدس). New `recall` AI tool so answers are grounded in saved memory.
- مسیرها: `GET /api/rag/search?q=`، `GET /api/admin/rag` (آمار)، `POST /api/admin/rag/reindex`.
- نکتهٔ صادقانه: این بازیابیِ **لغوی/وزنی** است، نه امبدینگِ عصبی — برای «آنچه دربارهٔ X ذخیره کرده‌ام» عالی است؛ جای امبدینگ عصبی بعداً پشت همین API قابل‌جایگزینی است. Honest scope: lexical TF-IDF retrieval, swappable for a neural embedder later.

### تغییرات ۹.۹.۲۴ / Changelog 9.9.24 — کانکتور تلگرام
- **کنترل ستایش از بیرون خانه با تلگرام**: یک ربات (از @BotFather) بساز، `TELEGRAM_BOT_TOKEN` و `TELEGRAM_CHAT_ID` را در مرکز کنترل بگذار. پیام‌های همان چتِ مجاز، **مثل خودِ صاحب‌خانه** با همان موتور و همان ابزارها (Gmail/تقویم/…) پاسخ داده می‌شوند. Reach Setayesh from outside the house via a private Telegram bot; the whitelisted chat is answered as the owner, with tools.
- **امن و بدون وابستگی**: long-polling (بدون نیاز به آدرس عمومی/webhook)، فقط به Chat ID مجاز پاسخ می‌دهد، توکن در تنظیمات ۰۶۰۰. اگر Chat ID را ندانی، یک پیام به ربات بده تا شناسه‌ات را بگوید. Zero-dep long-polling; answers only the whitelisted chat.
- **هشدارها هم به تلگرام**: اعلان‌های فوری و incidentهای خودترمیمی، علاوه بر ایمیل، به تلگرام هم می‌روند. Urgent alerts / self-heal incidents also ping Telegram.
- مسیرها: `GET /api/admin/telegram`، `POST /api/admin/telegram/test`.

### تغییرات ۹.۹.۲۳ / Changelog 9.9.23
- **انبارهٔ محلیِ رمزنگاری‌شده روی دستگاه کاربر (با انقضا)**: ماژول `secure-store.js` — داده فقط در همین مرورگر (origin-scoped)، رمزنگاری‌شده با **AES-256-GCM (Web Crypto)** و با **تاریخ انقضا** ذخیره می‌شود؛ در DevTools فقط متنِ رمزی دیده می‌شود و پس از انقضا خودکار پاک می‌گردد — فقط خودِ برنامه می‌خواند. Encrypted, expiring, device-local store (`window.secureStore`): AES-256-GCM at rest, auto-purge on expiry, opaque in DevTools.
  - **کاربرد نمونه**: `draft-cache.js` پیش‌نویسِ نافرستادهٔ کادر چت را رمزنگاری‌شده و با انقضای ۲ روزه نگه می‌دارد؛ بعد از ارسال یا انقضا پاک می‌شود. Example use: the unsent chat draft is kept encrypted with a 2-day expiry.
  - نکتهٔ صادقانه: مرورگر keystore امنِ واقعی برای JS ندارد؛ این لایه در برابر بازرسیِ ساده، خواندنِ بین‌سایتی و داده‌ی کهنه محافظت می‌کند، نه مهاجمی با کنترل کاملِ دستگاه. رمز/توکنِ بلندمدت در آن نگذارید.

### تغییرات ۹.۹.۲۲ / Changelog 9.9.22
- **آپلود بکاپ رمزنگاری‌شده به Google Drive**: از پنل «کانکتورها»، دکمهٔ «رمزنگاری و آپلود به Google Drive» — رمز پشتیبان را بده تا بکاپ با AES-256-GCM رمزنگاری و در پوشهٔ «Setayesh Backups» درایو آپلود شود (درایو فقط دادهٔ غیرقابل‌خواندن می‌بیند). One-click encrypted backup upload to Google Drive.
  - scope حداقلی `drive.file` اضافه شد (فقط فایل‌هایی که خودِ برنامه می‌سازد، نه بقیهٔ درایو). **اگر قبلاً به گوگل وصل بوده‌ای، یک بار دوباره «اتصال به گوگل» را بزن تا دسترسی درایو اضافه شود.** Uses the least-privilege `drive.file` scope; existing connections must reconnect once.
  - مسیرها: `POST /api/admin/backups/upload`، `POST /api/admin/backups/encrypt-upload`.

### تغییرات ۹.۹.۲۱ / Changelog 9.9.21 — سه قابلیت جدید
- **۰۱ · Tool-calling همگانی**: ابزارها (Gmail، تقویم، اسکریپت‌ها) از انحصار Claude خارج شد و روی موتورهای OpenAI-سازگار (Gemini, Groq, OpenRouter, …) هم در چت کار می‌کند؛ اگر مدلی ابزار را نپذیرد، بی‌خطا به پاسخ عادی برمی‌گردد. Tools now work on non-Claude engines via OpenAI-style function calling, with graceful fallback.
- **۰۲ · خودترمیمیِ امن**: خطاهای زنده (`uncaughtException`/rejection) به‌صورت incident ثبت و مدیر هشدار می‌گیرد (اعلان + ایمیل). طبق قانون ۱.۴ **هیچ کدی خودکار اعمال نمی‌شود** — رفع، دستیِ مدیر با «پیشنهاد تغییر» است. Endpoint: `/api/admin/incidents`. Live errors are captured as incidents and the admin is alerted; no code is auto-applied.
- **۰۳ · بکاپ ابری رمزنگاری‌شده**: بکاپ با **AES-256-GCM** روی همین دستگاه رمزنگاری می‌شود (کلید از رمز عبورِ تو با scrypt؛ هرگز ذخیره نمی‌شود). فایل `.enc` را هرجا آپلود کن — ابر فقط دادهٔ غیرقابل‌خواندن می‌بیند. رمزگشایی با `decrypt-backup.js` (بدون وابستگی). Route: `/api/admin/backups/encrypt`. Zero-knowledge encrypted backup with a standalone decrypt tool.
- هر سه **بدون وابستگیِ جدید** و با **تست خودکار** (اکنون ۱۱ تست، شامل رفت‌وبرگشت کامل رمزنگاری). All three: zero new deps, covered by tests (11 now).

### تغییرات ۹.۹.۲۰ / Changelog 9.9.20
- **HTTPS محلی (قانون ۲.۲)**: اگر `tls-cert.pem` + `tls-key.pem` کنار برنامه (یا `SETAYESH_TLS_CERT/KEY`) باشد، سرور HTTPS می‌شود و ترافیک LAN/Tailscale رمزنگاری می‌شود — **بدون وابستگیِ جدید** (فقط `https` داخلی Node). چک سلامتِ خودترمیمی هم پروتکل‌آگاه شد. اگر گواهی نباشد، رفتار قبلی (HTTP) بدون تغییر می‌ماند. Optional local HTTPS with zero new dependencies; falls back to HTTP when no cert is present; the self-heal health probe is now protocol-aware.

### تغییرات ۹.۹.۱۹ / Changelog 9.9.19
- **شروع ماژول‌بندی سرور (ساختار `routes/`)**: مسیرهای کانکتور گوگل از `index.js` به `routes/connectors.js` منتقل شد و با `register(app, deps)` ثبت می‌شود — اولین گامِ امنِ شکستن `index.js`، با رفتار بدون تغییر و تست‌های سبز. First safe step of splitting the server monolith: Google connector routes moved to `routes/connectors.js` (registered via `register()`), behavior unchanged, tests green.

### تغییرات ۹.۹.۱۸ / Changelog 9.9.18
- **ماژول‌بندی رابط کاربری (کاهش فایل‌های بزرگ پرریسک)**: `public/index.html` از ۷٬۸۰۵ خط به **۹۹۴ خط** رسید. منطق و استایل به فایل‌های جدا منتقل شد: `app.css`، `app.js`، `brain3d.js`، `login-fx.js`، `memory-panel.js`، `connectors-panel.js` — با همان ترتیب بارگذاری (رفتار بدون تغییر) و نسخه‌گذاریِ `?v=` برای جلوگیری از کش کهنه پس از به‌روزرسانی. UI modularized: `index.html` 7,805 → 994 lines; CSS/JS split into separate files loaded in the same order (behavior unchanged), with `?v=` cache-busting.
- تأیید: تست‌ها سبز، همهٔ دارایی‌ها ۲۰۰، ورود و رابط اصلی و پنل‌ها و مغز سه‌بعدی سالم، بدون خطای صفحه. Verified: tests green, assets 200, login + panels + 3D brain all work, no page errors.
- گام بعدی: ماژول‌بندیِ محتاطانهٔ `index.js` سمت سرور (با پوشش تست بیشتر، ماژول‌به‌ماژول). Next: careful server-side `index.js` split, module by module, behind more tests.

### تغییرات ۹.۹.۱۷ / Changelog 9.9.17
- **تست خودکار (تور ایمنی)**: افزودن `test/smoke.test.js` — بوت سرور روی پورت/داده‌ی موقت و بررسی مسیرهای حیاتی: سلامت، نسخه، ورود درست/نادرست، گیت احراز هویت، CRUD حافظه، وضعیت کانکتورها، و catch-all رابط. اولین قدمِ «اول تست، بعد بازآرایی». Automated smoke tests as the safety net before refactoring the monoliths — the first step of "tests before refactor".

### تغییرات ۹.۹.۱۶ / Changelog 9.9.16
- **لانچر آمادهٔ اجرا**: افزودن `Start-Setayesh.bat` (ویندوز) و `start.sh` (مک/لینوکس) که خودشان وابستگی‌ها را نصب، سرور را با تنظیمات درست اجرا (فعال‌سازی دکمهٔ ری‌استارت و استفاده از گواهی سیستم)، مرورگر را باز و در صورت ری‌استارت دوباره اجرا می‌کنند. Ready-to-run launchers (`Start-Setayesh.bat`, `start.sh`) that install deps, start the server correctly (enable the in-app Restart, use the OS trust store), open the browser, and relaunch on restart.
- **پیام خطای واضح‌تر**: هنگام در دسترس نبودن سرور، پیام ورود حالا دقیقاً می‌گوید پنجرهٔ برنامه را باز نگه دار و از `http://localhost:3000` وارد شو. Clearer login error that tells the user to keep the app window open and use `http://localhost:3000`.

### تغییرات ۹.۹.۱۵ / Changelog 9.9.15
- **کانکتور گوگل (Gmail + تقویم)**: پنل جدید «کانکتورها» (مدیر) برای اتصال حساب گوگل با OAuth2. پس از اتصال، ستایش می‌تواند **ایمیل بخواند و بفرستد** و **قرار در تقویم ثبت/فهرست کند** — هم مستقیم از پنل و هم به‌صورت ابزار در گفت‌وگو (وقتی موتور فعال Claude باشد). New **Google connector (Gmail + Calendar)** via OAuth2: an admin "Connectors" panel to connect a Google account, then read/send email and create/list calendar events — from the panel and as AI tools in chat.
  - راه‌اندازی: در Google Cloud یک OAuth Client «Web application» بساز، آدرس بازگشتِ نشان‌داده‌شده در پنل را ثبت کن، Client ID/Secret را وارد و «اتصال به گوگل» را بزن. Setup: create a Google "Web application" OAuth client, register the redirect URI shown in the panel, paste the Client ID/Secret, and click Connect.
  - بدون وابستگی جدید؛ توکن‌ها فقط به‌صورت محلی (۰۶۰۰) نگهداری و هرگز کامیت نمی‌شوند. No new dependency; tokens are stored locally (0600) and never committed.

### تغییرات ۹.۹.۱۴ / Changelog 9.9.14
- **انتقال خودکار و بی‌وقفه بین موتورهای هوش مصنوعی**: وقتی موتور انتخاب‌شده به محدودیت توکن‌در‌دقیقه (۴۱۳) می‌خورد، حالا **روی همان موتور** هم خودترمیم می‌شود — تاریخچه و در صورت نیاز پرامپت به‌تدریج کوچک می‌شوند تا حتی با یک موتور هم به‌جای خطا پاسخ برسد؛ و اگر موتور دیگری تنظیم شده باشد، بی‌درنگ به آن سوییچ می‌شود. Seamless auto-routing between engines: a token-per-minute (413) hit now self-heals on the same engine (progressive history/prompt trim) and still fails over to another configured engine, so the user gets an answer instead of the "start a new chat / pick another engine" error.
- **منوی کشویی کریستالی**: کشوی پایین به شیشه‌ی مات با بلور پس‌زمینه، لبه‌ی نورانی و درخشش نرم تبدیل شد (پنل حافظه هم هماهنگ شد). Crystal (frosted-glass) bottom drawer with backdrop blur, a lit rim and soft glow; the memory panel matches.

### تغییرات ۹.۹.۱۳ / Changelog 9.9.13
- **پنل «حافظه‌ی من»** برای همه‌ی کاربران: نمای تصویری حافظه با تفکیک **کوتاه‌مدت** (مهلت‌ها و موارد اخیر) و **بلندمدت** (دانسته‌ها، ترجیح‌ها، پروژه‌ها)، همراه افزودن و حذف. A visual **"My Memory"** panel for every account, split into short-term and long-term.
- **دسترسی خانواده به ابزارها و دستگاه‌ها**: کاربران غیرادمین هم اکنون جعبه‌ابزار و دستگاه‌های خانه را می‌بینند و استفاده می‌کنند. Non-admin family members can now reach the toolbox and home devices.
- **تشخیص زنده‌ی صفحه**: چیدمان با چرخش/تغییر اندازه‌ی صفحه به‌صورت خودکار دوباره تنظیم می‌شود. Live screen re-detection: the layout re-adjusts automatically on rotate/resize.
- **مغز پایدارتر**: هنگام مخفی‌بودن صفحه رندر مغز متوقف می‌شود تا گوشی کند/داغ نشود (به‌همراه عرضه‌ی داخلیِ کتابخانه‌ی سه‌بعدی). The 3D brain pauses rendering while the page is hidden.

### تغییرات ۹.۹.۱۲ / Changelog 9.9.12
- کتابخانهٔ سه‌بعدی (`three.min.js`، three.js r128) اکنون همراه اپ عرضه می‌شود؛ نمای «مغز» بدون نصب جداگانه رندر می‌شود و هشدار «three.min.js missing» هنگام شروع حذف شده است.
- The 3D library (`three.min.js`, three.js r128) now ships with the app, so the "brain" view renders out of the box and the startup "three.min.js missing" warning is gone.
