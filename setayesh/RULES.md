# منشور توسعهٔ ستایش / Setayesh Development Charter

این سند، قوانین و ضوابطِ حاکم بر پروژهٔ ستایش است. هر تغییری — چه دستی و چه از
طریق قابلیت خودویرایشیِ خودِ برنامه — باید با این قوانین سازگار باشد.
وضعیت هر قانون مشخص است: **✅ اکنون رعایت می‌شود** یا **🚧 در نقشهٔ راه**.

This is the governing charter for the Setayesh project. Every change — by hand
or via the app's own self-editing — must comply. Each rule is marked **✅
enforced today** or **🚧 roadmap**.

---

## ۱. امنیت / Security

| # | قانون / Rule | وضعیت | مرجع در کد |
|---|---|---|---|
| 1.1 | **TLS هیچ‌گاه پیش‌فرض خاموش نمی‌شود.** فقط با `SETAYESH_INSECURE_TLS=1` که باید عمداً و آگاهانه ست شود و روی هر اجرا هشدار می‌دهد. TLS is never disabled by default. | ✅ | `index.js` (`INSECURE_TLS`) |
| 1.2 | **ذخیره‌سازی محلی و 0600.** کلیدهای API، توکن‌ها و دادهٔ حساس فقط محلی و با دسترسی `0600` نوشته می‌شوند؛ رمزها فقط به‌صورت هش. Secrets local-only, mode `0600`; passwords hashed only. | ✅ | `.setayesh-config`, `.setayesh-users.json`, `.setayesh-connectors.json` |
| 1.3 | **دفاع‌های پیش‌فرض الزامی:** `helmet`، `bcrypt` برای رمزها، و `express-rate-limit`. helmet + bcrypt + rate limiting are mandatory. | ✅ | `index.js` (`helmet`, `bcrypt`, limiters) |
| 1.4 | **خودویرایشیِ کد پشت تأیید مدیر و پیش‌فرض خاموش.** ابزارهای `read_own_source`/`propose_change` فقط برای ادمین و فقط وقتی `ENABLE_SELF_EDIT=1`. هوش مصنوعی هرگز خودش کد را اعمال نمی‌کند؛ مدیر diff را تأیید می‌کند. Self-editing is admin-only, off by default, and never auto-applied. | ✅ | `SELF_EDIT_ENABLED`, `toolsFor()` |
| 1.5 | **ابزارهای امنیتی محدود به فضای آدرس محلی.** اسکن شبکه/پورت فقط روی محدوده‌های خصوصی؛ این مرز هرگز گسترده نمی‌شود. Network/port scans limited to private IP space — never widen it. | ✅ | `toolkit.js` (`PRIVATE_RANGES`) |

---

## ۲. دسترسی و شبکه / Access & Network

| # | قانون / Rule | وضعیت | مرجع |
|---|---|---|---|
| 2.1 | **کانکتور گوگل بدون وابستگیِ جدید.** OAuth2 + Gmail + Calendar فقط با `fetch` سراسری و APIهای REST گوگل. Google connector adds no npm dependency. | ✅ | `connectors.js` |
| 2.2 | **ارتباط محلی نباید بی‌رمزنگاری بماند.** ترافیک روی LAN/Tailscale باید به HTTPS محلی (گواهی self-signed یا Tailscale) ارتقا یابد. Local traffic must move to local HTTPS. | 🚧 | نقشهٔ راه |
| 2.3 | **تفکیک دسترسی بر اساس نقش.** دسترسی خانواده به ابزارها/تابلو/تنظیمات بر پایهٔ پروفایل و «حالت کودک» کنترل می‌شود. Role-based access; child mode. | ✅ | `safeUsers`, `requireAdmin`, `simplifyForFamily()` |

---

## ۳. معماری، توسعه و نگهداری / Architecture & Maintenance

| # | قانون / Rule | وضعیت | مرجع |
|---|---|---|---|
| 3.1 | **معماری سبک / کم‌وابستگی.** کمترین تعداد وابستگی (اکنون ۶ بستهٔ سبک: `bcryptjs, express, express-rate-limit, helmet, multer, qrcode`). افزودن وابستگیِ جدید نیازمند دلیل قوی است. Keep dependencies minimal (currently 6). | ✅ | `package.json` |
| 3.2 | **مدیریت خطای روشن + حلقهٔ ری‌استارت.** هنگام خطا/عدم دسترسی، پیام روشن؛ لانچرها روی کد خروج ۸۸ دوباره اجرا می‌کنند و مرورگر را باز می‌کنند. Clear errors + launcher restart loop. | ✅ | `Start-Setayesh.bat`, `start.sh`, `noConnect` |
| 3.3 | **تست برای مسیرهای حیاتی.** ورود، پیکربندی، حافظه و کانکتورها تست خودکار دارند؛ قبل و بعد از هر تغییر `npm test` باید سبز بماند. Critical paths must stay under automated test; run `npm test`. | ✅ (جزئی) | `test/smoke.test.js` |
| 3.4 | **شکستن فایل‌های Monolith.** فایل‌های غول‌پیکر باید به ماژول‌های کوچک‌تر شکسته شوند. `index.html` انجام شد (۷٬۸۰۵ ← ۹۹۴). `index.js` سمت سرور مانده. Split monoliths; `index.html` done, server `index.js` pending. | 🚧 (UI ✅ / سرور 🚧) | `public/*.js`, `index.js` |
| 3.5 | **Tool-calling فراتر از Claude.** قابلیت فراخوانی ابزار باید برای موتورهای دیگر (Gemini/Groq و OpenAI-compatible) هم یکپارچه شود، نه فقط Anthropic. Extend tool-calling beyond Claude. | 🚧 | نقشهٔ راه |

---

## اصول کار روی این پروژه / Working principles

- **قبل و بعد از هر تغییر: `npm test`.** یک تغییر که تست را قرمز کند، تمام نیست.
- **رفتار را بدون تست تغییر نده.** بازآرایی باید رفتار را حفظ کند؛ اگر رفتار عوض می‌شود، اول تست.
- **هیچ راز/کلیدی کامیت نشود.** فایل‌های `.setayesh-*` و `node_modules/` در `.gitignore` هستند.
- **هیچ قانون «هرگز» بالا با کدِ جدید نقض نشود** — به‌ویژه ۱.۱ (TLS)، ۱.۴ (خودویرایشی)، ۱.۵ (مرز اسکن)، ۳.۱ (وابستگی).
