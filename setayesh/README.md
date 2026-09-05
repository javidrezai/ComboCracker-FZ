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
9.9.23

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
