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

## دو مغز، دو مکان، متصل 🔗

مغز ستایش دو نیم‌کرهٔ جدا دارد که با یک **پل اتصال git** همگام می‌شوند:

- **مکان ۱ — مغز سرور:** `setayesh/brain/` (روی سرور شما، حلقهٔ عامل).
- **مکان ۲ — مغز ابسیدین:** والت مستقل (`setayesh/vault/`)، قابل تبدیل به مخزن جدا.

مغز سرور **قبل از هر اجرا `pull`** می‌کند (تا ویرایش‌های شما در Obsidian را بخواند)
و **بعد از هر اجرا `push`** می‌کند (تا لاگ/درس/داشبورد به والت برگردد).

### راه‌اندازی مکان دوم (والت مستقل)
```bash
# ۱. یک مخزن خصوصی خالی روی GitHub بسازید (مثلاً setayesh-vault)
# ۲. والت را به آن مخزن وصل و push کنید:
bash setayesh/scripts/setup-vault-repo.sh git@github.com:javidrezai/setayesh-vault.git
# ۳. در setayesh/vault/config/brain-settings.md مقدار vault_remote را بگذارید
#    و متغیر SETAYESH_VAULT را به مسیر والت مستقل اشاره دهید.
```
اگر این مرحله را انجام ندهید، مغز همچنان کار می‌کند و والت را **محلی** می‌خواند/می‌نویسد (بدون همگام‌سازی).

## راه‌اندازی سریع

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
