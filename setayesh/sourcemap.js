'use strict';
// The self-editing file allowlists and the plain-language project map, split
// out of index.js as pure static data. EDITABLE_SOURCES: files Setayesh may
// rewrite (propose_change); READABLE_SOURCES: the superset it may read;
// SELF_MAP: a Persian description of every file, so it can answer 'where is X'.

// Files Setayesh may EDIT (propose_change) — every one is syntax-checked, and
// index.js is actually booted, before the owner sees the diff. Only .js/.html
// (a .css would fail `node --check`).
const EDITABLE_SOURCES = [
  'index.js', 'providers.js', 'toolkit.js', 'extensions.js', 'connectors.js',
  'telegram.js', 'notify.js', 'memory.js', 'rag.js', 'codelib.js', 'sync.js',
  'homedevices.js', 'auth-stepup.js',
  'routes/board.js', 'routes/connectors.js', 'routes/devices.js',
  'routes/night.js', 'routes/plugins.js', 'routes/tools.js',
  'public/index.html', 'public/app.js', 'public/app-i18n.js',
  'public/memory-panel.js', 'public/connectors-panel.js',
  'public/secure-store.js', 'public/draft-cache.js', 'public/login-fx.js',
  'public/brain3d.js',
];
// Files Setayesh may READ (read_own_source) — a superset: also the stylesheet
// and the standalone backup tool, which it can look at but not rewrite blindly.
const READABLE_SOURCES = EDITABLE_SOURCES.concat(['public/app.css', 'decrypt-backup.js']);

// A plain-language map of the whole project, so Setayesh can answer "where is
// X / what does Y do" about itself and know what to read before fixing it.
const SELF_MAP = {
  'index.js': 'سرور اصلی: مسیرها (routes)، مسیریابی موتورهای هوش مصنوعی، ۲۹ ابزار، ورود/مدیریت، خودترمیمی و خود-ویرایشی.',
  'providers.js': 'شخصیت ستایش و موتورها: Anthropic/Gemini/Groq/OpenRouter/Cerebras/Mistral/OpenAI و موتور محلی Ollama؛ متن هویت (بابا جاوید/دختر ستایش).',
  'toolkit.js': 'جعبه‌ابزار امنیت دفاعی: اسکن شبکه/پورت، هش، QR — فقط روی شبکه‌ی خصوصی خودت.',
  'connectors.js': 'کانکتور گوگل (OAuth): Gmail، تقویم، درایو.',
  'extensions.js': 'بارگذاری افزونه‌های .js از پوشه‌ی plugins بدون ساختن دوباره‌ی برنامه.',
  'telegram.js': 'ربات تلگرام: پاسخ فقط به چت مجاز، long-polling.',
  'notify.js': 'اعلان به صاحب خانه + ایمیل خروجی + هشدار تلگرام (notifyOwner).',
  'memory.js': 'حافظه‌ی هر کاربر: کوتاه‌مدت و بلندمدت، مهلت‌ها.',
  'rag.js': 'جستجوی معنایی سبک و محلی روی حافظه (بدون سرویس بیرونی).',
  'codelib.js': 'کتابخانه‌های کد کاربر (پایتون، C++، …) برای استفاده هنگام کدنویسی.',
  'sync.js': 'همگام‌سازی بین چند کامپیوترِ خانه (مرکز/فرعی) به‌صورت رمزگذاری‌شده.',
  'homedevices.js': 'کنترل دستگاه‌های خانه: تلویزیون، دوربین، پرینتر، سرخ‌کن؛ جستجوی شبکه و دسترسی‌ها.',
  'auth-stepup.js': 'تأیید دوباره‌ی رمز برای کارهای حساس (قفل پنج‌دقیقه‌ای).',
  'decrypt-backup.js': 'ابزار جداگانه برای باز کردن بکاپ رمزگذاری‌شده‌ی درایو.',
  'routes/board.js': 'تابلوی خانواده: پیام‌های مشترک همه‌ی خانه.',
  'routes/connectors.js': 'مسیرهای وب کانکتور گوگل (اتصال/قطع/خواندن ایمیل/تقویم/بکاپ).',
  'routes/devices.js': 'مسیرهای وب دستگاه‌های خانه.',
  'routes/night.js': 'کار شبانه و به‌روزرسانی امن خودکار.',
  'routes/plugins.js': 'مسیرهای وب افزونه‌ها.',
  'routes/tools.js': 'مسیرهای وب جعبه‌ابزار امنیت.',
  'public/index.html': 'پوسته‌ی رابط کاربری: ورود، منوی کناری، مرکز کنترل، جعبه‌ابزار، پنل‌ها.',
  'public/app.js': 'مغز رابط کاربری: چت، حالت‌ها، مرکز کنترل، جعبه‌ابزار، دستگاه‌ها، یادگیری.',
  'public/app.css': 'همه‌ی ظاهر برنامه (رنگ، چیدمان، ریموت دستگاه‌ها، واکنش‌گرا).',
  'public/app-i18n.js': 'ترجمه‌ها (فارسی/انگلیسی).',
  'public/brain3d.js': 'نمای سه‌بعدی زنده‌ی «مغز ستایش».',
  'public/memory-panel.js': 'پنل حافظه‌ی کاربر.',
  'public/connectors-panel.js': 'پنل کانکتورها (گوگل).',
  'public/secure-store.js': 'ذخیره‌ی امن سمت مرورگر.',
  'public/draft-cache.js': 'نگه‌داشتن پیش‌نویس پیام هنگام تایپ.',
  'public/login-fx.js': 'افکت پس‌زمینه‌ی صفحه‌ی ورود.',
  'test/smoke.test.js': 'تست‌های حیاتی (۲۴ مورد) که پیش و پس از هر تغییر باید سبز بمانند.',
  'package.json': 'نام، نسخه و وابستگی‌ها (نسخه باید با APP_VERSION یکی باشد).',
  'README.md': 'راهنمای کامل پروژه.',
  'RULES.md': 'منشور توسعه و قوانینی که هرگز نباید شکسته شوند.',
  'CLAUDE.md': 'راهنمای کوتاه برای هوش مصنوعی توسعه‌دهنده.',
  'Start-Setayesh.bat': 'اجرای برنامه روی ویندوز (با قابلیت ری‌استارت خودکار).',
  'start.sh': 'اجرای برنامه روی لینوکس/مک.',
  'Build-Portable.bat': 'ساخت نسخه‌ی پرتابل روی USB.',
};

module.exports = { EDITABLE_SOURCES, READABLE_SOURCES, SELF_MAP };
