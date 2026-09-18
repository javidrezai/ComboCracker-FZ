'use strict';
// The allowlist of settings the control centre may edit, split out of index.js
// as pure static data. Only a key present here can be written to the config
// file; `secret:true` keys are never echoed back to the browser in full.

// ---------------- Control centre: edit settings from inside the app ----------------
// Previously every setting meant opening .setayesh-config in Notepad. These
// endpoints let the owner change them from the UI instead. Only a known list
// of keys can be written, so a stray value can't corrupt the file, and API
// keys are never sent back to the browser in full.
const EDITABLE_KEYS = {
  KEY_ANTHROPIC: { secret: true,  label: 'Claude (Anthropic)' },
  KEY_GEMINI:    { secret: true,  label: 'Google Gemini' },
  KEY_GEMINI2:   { secret: true,  label: 'Google Gemini — کلید دوم (وقتی اولی پر شد، خودکار می‌رود روی این)' },
  KEY_GEMINI3:   { secret: true,  label: 'Google Gemini — کلید سوم (اختیاری)' },
  KEY_GROQ:      { secret: true,  label: 'Groq' },
  KEY_OPENROUTER:{ secret: true,  label: 'OpenRouter' },
  KEY_CEREBRAS:  { secret: true,  label: 'Cerebras' },
  KEY_MISTRAL:   { secret: true,  label: 'Mistral' },
  KEY_OPENAI:    { secret: true,  label: 'OpenAI' },
  KEY_BRAVE:     { secret: true,  label: 'Brave Search' },
  KEY_TAVILY:    { secret: true,  label: 'Tavily Search' },
  PROVIDER:      { secret: false, label: 'موتور پیش‌فرض' },
  ENABLE_LOCAL:  { secret: false, label: 'موتور محلی (Ollama)' },
  ENABLE_RESEARCH: { secret: false, label: 'تحقیق و یادگیریِ خودکار (۱=همیشه روشن، ۰=خاموش)' },
  ENABLE_PYTHON: { secret: false, label: 'اجرای کد پایتون' },
  ENABLE_SELF_EDIT: { secret: false, label: 'اجازه‌ی تغییر کد خودش (با تأیید تو)' },
  AUTO_TLS:          { secret: false, label: 'اتصال امن HTTPS برای گوشی (گواهی خودساخته — یک‌بار باید در مرورگر تأیید شود)' },
  LOGIN_ALERTS:      { secret: false, label: 'اعلام ورود از دستگاه جدید در تابلو' },
  AUTO_LOCK_MINUTES: { secret: false, label: 'قفل خودکار بعد از چند دقیقه بی‌کاری (۰ = خاموش)' },
  MAIL_PROVIDER:     { secret: false, label: 'سرویس ایمیل (gmail / outlook / yahoo)' },
  MAIL_USER:         { secret: false, label: 'آدرس ایمیل' },
  MAIL_PASS:         { secret: true,  label: 'App Password ایمیل (نه رمز اصلی!)' },
  GOOGLE_CLIENT_ID:  { secret: false, label: 'Google OAuth Client ID (برای Gmail و تقویم)' },
  GOOGLE_CLIENT_SECRET: { secret: true, label: 'Google OAuth Client Secret' },
  TELEGRAM_BOT_TOKEN: { secret: true,  label: 'توکن ربات تلگرام (از @BotFather)' },
  TELEGRAM_CHAT_ID:   { secret: false, label: 'Chat ID مجاز تلگرام (فقط همین چت پاسخ می‌گیرد)' },
  MAIL_HOST:         { secret: false, label: 'سرور IMAP دستی (اختیاری)' },
  MAIL_PORT:         { secret: false, label: 'پورت IMAP (پیش‌فرض ۹۹۳)' },
  NOTIFY_EMAIL:      { secret: false, label: 'ایمیل تو برای دریافت اعلان‌های ستایش' },
  SMTP_HOST:         { secret: false, label: 'سرور SMTP دستی (اختیاری)' },
  GITHUB_TOKEN:      { secret: true,  label: 'توکن GitHub (برای مخزن‌های خصوصی)' },
  OBSIDIAN_VAULT:    { secret: false, label: 'مسیر والت Obsidian' },
  LOCAL_FIRST:       { secret: false, label: 'اول موتور محلی (۱ = همه چیز داخل خانه می‌ماند، ولی کندتر است)' },
  TUYA_CLIENT_ID:    { secret: false, label: 'Tuya Client ID (برای دوربین‌های LSC)' },
  TUYA_SECRET:       { secret: true,  label: 'Tuya Client Secret' },
  TUYA_REGION:       { secret: false, label: 'منطقه‌ی Tuya (eu / us / cn / in)' },
  HOME_LAT:          { secret: false, label: 'عرض جغرافیایی خانه (برای محافظ ایرفرایر)' },
  HOME_LON:          { secret: false, label: 'طول جغرافیایی خانه (برای محافظ ایرفرایر)' },
};

module.exports = { EDITABLE_KEYS };
