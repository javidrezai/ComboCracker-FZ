# ⚙️ تنظیمات مغز ستایش

> این فایل را آزادانه ویرایش کنید. مغز در **هر گام** آن را دوباره می‌خواند — **بدون نیاز به ری‌استارت**.

model: qwen2.5:7b
temperature: 0.4
max_steps: 6

## اتصال خودکار اولاما (Ollama)
ollama_host: http://localhost:11434
auto_start_ollama: true
auto_pull_model: true

## بازیابی
retrieval: auto
embeddings_model: nomic-embed-text

## به‌روزرسانی
check_updates: true

## زمان‌بندِ داخلی (کارهای خودکار پس‌زمینه)
scheduler: true
dashboard_interval: 60
sync_interval: 120
health_interval: 300

## اتصال دو مغز (همگام‌سازی با مکان والت)
auto_sync: true
vault_remote: 

---
راهنما:
- `model` — نام مدل روی Ollama (مثلاً `qwen2.5:7b`، `llama3.1:8b`).
- `temperature` — عددی بین ۰ (دقیق) تا ۱ (خلاق).
- `max_steps` — بیشترین تعداد گام حلقهٔ عامل در هر پاسخ.
- `ollama_host` — آدرس سرویس اولاما.
- `auto_start_ollama` — اگر `true` باشد، ستایش خودش `ollama serve` را بالا می‌آورد.
- `auto_pull_model` — اگر `true` باشد، ستایش خودش مدل نبود را دانلود می‌کند.
- `retrieval` — `auto` (embeddings اگر بود، وگرنه TF-IDF)، یا `tfidf`، یا `embeddings`.
- `embeddings_model` — مدلِ برداری‌سازی روی Ollama (مثلاً `nomic-embed-text`).
- `check_updates` — اگر `true` باشد، ستایش هنگام اجرا خبر می‌دهد نسخهٔ جدیدی هست.
- `auto_sync` — اگر `true` باشد، مغز سرور قبل هر اجرا از والت `pull` و بعد از آن `push` می‌کند.
- `vault_remote` — آدرس مخزن گیت والت (اختیاری).
- `scheduler` — روشن/خاموش کردن زمان‌بند داخلی.
- `dashboard_interval` / `sync_interval` / `health_interval` — بازهٔ کارهای خودکار (ثانیه).
