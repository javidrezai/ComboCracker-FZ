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
9.9.12

### تغییرات ۹.۹.۱۲ / Changelog 9.9.12
- کتابخانهٔ سه‌بعدی (`three.min.js`، three.js r128) اکنون همراه اپ عرضه می‌شود؛ نمای «مغز» بدون نصب جداگانه رندر می‌شود و هشدار «three.min.js missing» هنگام شروع حذف شده است.
- The 3D library (`three.min.js`, three.js r128) now ships with the app, so the "brain" view renders out of the box and the startup "three.min.js missing" warning is gone.
