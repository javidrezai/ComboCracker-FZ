# ستایش (Setayesh) AI

یک دستیار هوش مصنوعی خانوادگی و خصوصی که به‌صورت محلی روی دستگاه خانواده اجرا می‌شود.
A private, family AI assistant that runs locally on the family's own machine.

## امکانات / Features
- چت با چند ارائه‌دهنده (Anthropic, Gemini, Groq, OpenRouter, Cerebras, Mistral, OpenAI, و سرور محلی Ollama/LM Studio)
- پنل مدیریت، حساب‌های کاربری، حافظه، تابلوی خانواده، اعلان‌ها
- ابزارهای امنیتی دفاعی (اسکن شبکهٔ خصوصی، پورت، SSL، هش، QR) — محدود به فضای آدرس محلی/خصوصی
- افزونه‌ها (drop-in plugins)، به‌روزرسانی خودکار و خودترمیمی
- نمای «مغز سه‌بعدی» بر پایهٔ three.js

## اجرا / Run
```bash
npm install
npm start
```
سپس مرورگر را روی `http://localhost:3000` باز کنید. برای اجرای فقط-محلی:
```bash
SETAYESH_HOST=127.0.0.1 npm start
```

نیازمند Node.js 18 یا بالاتر. کلیدهای API از طریق پنل تنظیمات وارد می‌شوند.

## نکات امنیتی / Security notes
- رمز پیش‌فرض حساب `admin` را در اولین ورود تغییر دهید.
- فایل‌های حالت زمان‌اجرا (`.setayesh-users.json`، `backups/`، `code-library/` و ...) کامیت نمی‌شوند و در `.gitignore` قرار دارند.
- گواهی TLS هرگز به‌صورت پیش‌فرض غیرفعال نمی‌شود.

## نسخه / Version
9.9.15

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
