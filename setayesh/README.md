# 🧠 ستایش — مغز دستیار محلی و شفاف

> صفر هزینه · خودآموز · خودتعمیر · شفافیت کامل · مالکیت کاربر

ستایش یک **مغز دوقلو** است: یک مغز روی سرور شما استدلال و اجرا می‌کند، و یک مغز
در والت Obsidian حافظهٔ دائمی را نگه می‌دارد. همه‌چیز روی سخت‌افزار خودتان و با
فایل‌های متنی سادهٔ قابل ویرایش.

```
setayesh/
├── docs/ARCHITECTURE.md   ← سند معماری کامل
├── brain/                 ← مغز سرور (اصلی)
│   ├── docker-compose.yml ← Ollama + موتور مغز
│   ├── config/            ← پیش‌فرض‌ها
│   └── server/            ← حلقهٔ عامل (پایتون، بدون وابستگی)
└── vault/                 ← مغز ابسیدین (حافظهٔ دائمی)
    ├── knowledge/         ← گراف دانش شما (فقط‌خواندنی برای مغز)
    ├── lessons/           ← درس‌های خودآموخته
    ├── config/            ← تنظیمات زنده (بدون ری‌استارت)
    ├── dashboard/         ← داشبورد زنده
    └── logs/              ← گزارش استدلال و خودتعمیری
```

## کارکرد محلیِ تضمین‌شده (بدون اولاما هم کار می‌کند) ✅

ستایش یک **موتور محلیِ جایگزین** دارد که وقتی اولاما در دسترس نیست، مغز باز هم کار کند:
محاسبهٔ ریاضی (با ارقام فارسی)، زمان/تاریخ، جست‌وجوی گراف دانش والت، و جست‌وجوی وب.
اولویت همیشه با مدل واقعی (اولاما) است؛ فقط در نبودِ آن، موتور محلی فعال می‌شود.

```bash
python setayesh/brain/server/main.py "۱۲۵ ضربدر ۸ چند می‌شود؟"   # → 1000  (بدون اولاما)
python setayesh/brain/server/main.py "ساعت الان چند است؟"
python setayesh/brain/server/main.py "ستایش چیست؟"
```
موتور فعال در داشبورد و در `--doctor` نمایش داده می‌شود.

## اتصال اولاما (Ollama) به ستایش — خودکار 🤖

مغز سرور خودش اتصال به مدل محلی را برقرار می‌کند؛ **نیازی به کار دستی نیست**. در هر
اجرا این مراحل خودکار انجام می‌شود:

1. **بررسی سلامت:** آیا اولاما روی `ollama_host` بالا است؟
2. **راه‌اندازی خودکار:** اگر اولاما نصب است ولی اجرا نشده → ستایش خودش `ollama serve` را بالا می‌آورد.
3. **دانلود خودکار مدل:** اگر مدل تنظیم‌شده نصب نیست → خودش `ollama pull <model>` می‌کند.
4. **گرم‌کردن:** مدل را در حافظه بارگذاری می‌کند تا اولین پاسخ سریع باشد.

تنظیمات مربوطه در `vault/config/brain-settings.md`:
```
ollama_host: http://localhost:11434
auto_start_ollama: true      # خودکار ollama serve
auto_pull_model: true        # خودکار دانلود مدل
model: qwen2.5:7b
```

**بررسی سلامت هر زمان:**
```bash
python setayesh/brain/server/main.py --doctor
```
که وضعیت اولاما، مدل، مدل‌های نصب‌شده و اتصال والت را نشان می‌دهد.

## زمان‌بندِ داخلی — کارهای خودکار ⏱️

وقتی مغز در حالت `--serve` یا `--daemon` اجرا می‌شود، سه کار را خودش دوره‌ای انجام می‌دهد:

| کار | پیش‌فرض | تنظیم |
|-----|---------|-------|
| بازسازی داشبورد زنده | هر ۶۰ ثانیه | `dashboard_interval` |
| همگام‌سازی والت (pull/push) | هر ۱۲۰ ثانیه | `sync_interval` |
| بررسی و برقراری دوبارهٔ اتصال اولاما | هر ۳۰۰ ثانیه | `health_interval` |

خاموش‌کردن: `scheduler: false` در تنظیمات. هر خطا در یک کار، مغز را متوقف نمی‌کند.

```bash
python setayesh/brain/server/main.py --daemon   # فقط زمان‌بند پس‌زمینه (بدون وبهوک)
```

## اجرای دائمی روی سرور 🖥️

برای اینکه مغز در بوت بالا بیاید، خودکار به اولاما وصل شود و وبهوک/داشبورد را سرو کند:
```bash
sudo bash setayesh/deploy/install-server.sh
# وضعیت: systemctl status setayesh-brain
# لاگ:   journalctl -u setayesh-brain -f
```

## دو مغز، دو مکان، متصل 🔗

مغز ستایش دو نیم‌کرهٔ جدا دارد که با یک **پل اتصال git** همگام می‌شوند:

- **مکان ۱ — مغز سرور:** `setayesh/brain/` (روی سرور شما، حلقهٔ عامل).
- **مکان ۲ — مغز ابسیدین:** والت مستقل (`setayesh/vault/`)، قابل تبدیل به مخزن جدا.

مغز سرور **قبل از هر اجرا `pull`** می‌کند (تا ویرایش‌های شما در Obsidian را بخواند)
و **بعد از هر اجرا `push`** می‌کند (تا لاگ/درس/داشبورد به والت برگردد).

### راه‌اندازی مکان دوم = فقط Obsidian (بدون GitHub) ✅
مغز دوم به هیچ سرویس ابری یا مخزن GitHub **نیاز ندارد**. کافی است:

۱. Obsidian را باز کنید → *Open folder as vault* → پوشهٔ `setayesh/vault/` را انتخاب کنید.
۲. مغز سرور را به همان پوشه وصل کنید:
```bash
export SETAYESH_VAULT=/مسیر/کامل/به/setayesh/vault
python setayesh/brain/server/main.py "سلام"
```
همین! هر دو مغز به **یک پوشهٔ مشترک** نگاه می‌کنند: هرچه در Obsidian بنویسید مغز می‌خواند،
و هرچه مغز بنویسد (لاگ/درس/داشبورد) بلافاصله در Obsidian ظاهر می‌شود.

**چند دستگاه؟** از **Obsidian Sync** (یا iCloud/Dropbox روی همان پوشه) استفاده کنید —
Obsidian خودش والت را همگام نگه می‌دارد. مغز سرور فقط پوشهٔ محلی را می‌خواند.

### (اختیاری) اتصال با git برای دو ماشین جدا
اگر مغز سرور روی یک ماشین و Obsidian روی ماشین دیگری است و می‌خواهید از git برای
همگام‌سازی استفاده کنید، اسکریپت زیر والت را به یک مخزن git وصل می‌کند:
```bash
bash setayesh/scripts/setup-vault-repo.sh git@github.com:USER/setayesh-vault.git
```
سپس `vault_remote` را در `vault/config/brain-settings.md` بگذارید. این کاملاً اختیاری است؛
بدون آن هم مغز با پوشهٔ محلیِ Obsidian کار می‌کند.

## راه‌اندازی سریع

**تک‌دستوری:**
```bash
bash setayesh/run.sh "سلام، خودت را معرفی کن"     # یک پرسش
bash setayesh/run.sh                               # حالت تعاملی
bash setayesh/run.sh --serve                       # وبهوک + داشبورد وب (http://localhost:8787)
```
`run.sh` خودش Ollama را بررسی می‌کند، مدل را آماده می‌کند و مغز را اجرا می‌کند.

**با Makefile:** `cd setayesh && make help` (اهداف: `run`, `serve`, `dashboard`, `test`, `docker`).

**تست:** `cd setayesh/brain/server && python3 -m unittest tests.test_brain`  (۱۲ تست، بدون نیاز به Ollama).


### روش ۱ — محلی (بدون Docker)
```bash
# ۱. Ollama را نصب و مدل را بکشید
ollama serve &
ollama pull qwen2.5:7b

# ۲. مغز را اجرا کنید (فقط پایتون ۳، بدون نصب وابستگی)
cd setayesh/brain/server
python main.py "سلام، خودت را معرفی کن"
```

### روش ۲ — با Docker
```bash
cd setayesh/brain
docker compose up -d
docker compose exec ollama ollama pull qwen2.5:7b
# وبهوک روی http://localhost:8787  (POST با {"input": "..."})
curl -X POST http://localhost:8787 -d '{"input":"۲۱ ضربدر ۲ چند می‌شود؟"}'
```

## حالت‌های اجرا
| فرمان | کار |
|-------|-----|
| `python main.py "سوال"` | یک پرسش |
| `python main.py` | حالت تعاملی (REPL) |
| `python main.py --serve` | وبهوک HTTP |
| `python main.py --dashboard` | ساخت داشبورد |
| `python main.py --files` | لیست فایل‌های والت |
| `python main.py --transparency` | استدلال کامل آخرین اجرا |

## باز کردن حافظه در Obsidian
پوشهٔ `setayesh/vault/` را به‌عنوان یک **والت** در Obsidian باز کنید. نوت‌ها،
درس‌ها، داشبورد و لاگ‌ها را همان‌جا ببینید و ویرایش کنید — تغییرات بلافاصله در
گام بعدیِ مغز اعمال می‌شود.

جزئیات فنی کامل: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
