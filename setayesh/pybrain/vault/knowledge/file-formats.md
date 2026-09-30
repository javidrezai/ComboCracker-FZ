# پسوندها و کانورتر ستایش

> این فایل **خودکار ساخته می‌شود** از جدول `FORMATS` در `formats.js`.
> دست‌نویسش نکن — کد را عوض کن، فایل خودش به‌روز می‌شود.

تعداد پسوندهای شناخته‌شده: **120**

## این‌ها بدون هیچ نصبی کار می‌کنند
متن، کد، داده (CSV/JSON/XML/YAML/INI)، اسناد Office جدید (.docx / .xlsx / .pptx)،
OpenDocument، PDF (استخراج متن)، RTF، EPUB، فایل‌های فشرده و SQLite.

## این‌ها به ابزار سیستم نیاز دارند
تبدیل تصویر، صدا و ویدیو به همدیگر با **ffmpeg** یا **ImageMagick** انجام می‌شود.
اگر روی این کامپیوتر نصب نباشند، ستایش صریح می‌گوید نصب نیست — الکی وانمود نمی‌کند.

## متن

| پسوند | خواندن | تبدیل به | توضیح |
| --- | --- | --- | --- |
| `.adoc` | ✅ | csv، html، json، md، pdf، rtf، txt، xml |  |
| `.log` | ✅ | csv، html، json، md، pdf، rtf، txt، xml |  |
| `.markdown` | ✅ | docx، html، json، md، pdf، rtf، txt |  |
| `.md` | ✅ | docx، html، json، pdf، rtf، txt |  |
| `.rst` | ✅ | csv، html، json، md، pdf، rtf، txt، xml |  |
| `.srt` | ✅ | csv، html، ini، json، jsonl، md، pdf، tsv، txt، xlsx … |  |
| `.tex` | ✅ | csv، html، json، md، pdf، rtf، txt، xml |  |
| `.text` | ✅ | csv، html، json، md، pdf، rtf، txt، xml |  |
| `.txt` | ✅ | csv، html، json، md، pdf، rtf، xml |  |
| `.vtt` | ✅ | csv، html، ini، json، jsonl، md، pdf، tsv، txt، xlsx … |  |

## کد برنامه

| پسوند | خواندن | تبدیل به | توضیح |
| --- | --- | --- | --- |
| `.asm` | ✅ | csv، html، json، md، pdf، rtf، txt، xml |  |
| `.bash` | ✅ | csv، html، json، md، pdf، rtf، txt، xml |  |
| `.bat` | ✅ | csv، html، json، md، pdf، rtf، txt، xml |  |
| `.c` | ✅ | csv، html، json، md، pdf، rtf، txt، xml |  |
| `.cc` | ✅ | csv، html، json، md، pdf، rtf، txt، xml |  |
| `.cjs` | ✅ | csv، html، json، md، pdf، rtf، txt، xml |  |
| `.cmd` | ✅ | csv، html، json، md، pdf، rtf، txt، xml |  |
| `.cpp` | ✅ | csv، html، json، md، pdf، rtf، txt، xml |  |
| `.cs` | ✅ | csv، html، json، md، pdf، rtf، txt، xml |  |
| `.dart` | ✅ | csv، html، json، md، pdf، rtf، txt، xml |  |
| `.go` | ✅ | csv، html، json، md، pdf، rtf، txt، xml |  |
| `.h` | ✅ | csv، html، json، md، pdf، rtf، txt، xml |  |
| `.hpp` | ✅ | csv، html، json، md، pdf، rtf، txt، xml |  |
| `.ipynb` | ✅ | docx، html، json، md، pdf، rtf، txt | دفترچه‌ی Jupyter — سلول‌های کد و متن جدا خوانده می‌شوند. |
| `.java` | ✅ | csv، html، json، md، pdf، rtf، txt، xml |  |
| `.js` | ✅ | csv، html، json، md، pdf، rtf، txt، xml |  |
| `.jsx` | ✅ | csv، html، json، md، pdf، rtf، txt، xml |  |
| `.kt` | ✅ | csv، html، json، md، pdf، rtf، txt، xml |  |
| `.lua` | ✅ | csv، html، json، md، pdf، rtf، txt، xml |  |
| `.m` | ✅ | csv، html، json، md، pdf، rtf، txt، xml |  |
| `.mjs` | ✅ | csv، html، json، md، pdf، rtf، txt، xml |  |
| `.php` | ✅ | csv، html، json، md، pdf، rtf، txt، xml |  |
| `.pl` | ✅ | csv، html، json، md، pdf، rtf، txt، xml |  |
| `.ps1` | ✅ | csv، html، json، md، pdf، rtf، txt، xml |  |
| `.py` | ✅ | csv، html، json، md، pdf، rtf، txt، xml |  |
| `.r` | ✅ | csv، html، json، md، pdf، rtf، txt، xml |  |
| `.rb` | ✅ | csv، html، json، md، pdf، rtf، txt، xml |  |
| `.rs` | ✅ | csv، html، json، md، pdf، rtf، txt، xml |  |
| `.scala` | ✅ | csv، html، json، md، pdf، rtf، txt، xml |  |
| `.sh` | ✅ | csv، html، json، md، pdf، rtf، txt، xml |  |
| `.sql` | ✅ | csv، html، json، md، pdf، rtf، txt، xml |  |
| `.svelte` | ✅ | csv، html، json، md، pdf، rtf، txt، xml |  |
| `.swift` | ✅ | csv، html، json، md، pdf، rtf، txt، xml |  |
| `.ts` | ✅ | csv، html، json، md، pdf، rtf، txt، xml |  |
| `.tsx` | ✅ | csv، html، json، md، pdf، rtf، txt، xml |  |
| `.vue` | ✅ | csv، html، json، md، pdf، rtf، txt، xml |  |
| `.zsh` | ✅ | csv، html، json، md، pdf، rtf، txt، xml |  |

## داده و تنظیمات

| پسوند | خواندن | تبدیل به | توضیح |
| --- | --- | --- | --- |
| `.cfg` | ✅ | csv، html، ini، json، jsonl، md، pdf، tsv، txt، xlsx … |  |
| `.conf` | ✅ | csv، html، ini، json، jsonl، md، pdf، tsv، txt، xlsx … |  |
| `.csv` | ✅ | html، ini، json، jsonl، md، pdf، tsv، txt، xlsx، xml … |  |
| `.env` | ✅ | csv، html، ini، json، jsonl، md، pdf، tsv، txt، xlsx … | ممکن است کلید و رمز داشته باشد — ستایش مقدارها را در خروجی می‌پوشاند. |
| `.htm` | ✅ | docx، html، json، md، pdf، rtf، txt |  |
| `.html` | ✅ | docx، json، md، pdf، rtf، txt |  |
| `.ini` | ✅ | csv، html، json، jsonl، md، pdf، tsv، txt، xlsx، xml … |  |
| `.json` | ✅ | csv، html، ini، jsonl، md، pdf، tsv، txt، xlsx، xml … |  |
| `.jsonl` | ✅ | csv، html، ini، json، md، pdf، tsv، txt، xlsx، xml … |  |
| `.ndjson` | ✅ | csv، html، ini، json، jsonl، md، pdf، tsv، txt، xlsx … |  |
| `.properties` | ✅ | csv، html، ini، json، jsonl، md، pdf، tsv، txt، xlsx … |  |
| `.toml` | ✅ | csv، html، ini، json، jsonl، md، pdf، tsv، txt، xlsx … |  |
| `.tsv` | ✅ | csv، html، ini، json، jsonl، md، pdf، txt، xlsx، xml … |  |
| `.xml` | ✅ | docx، html، json، md، pdf، rtf، txt |  |
| `.yaml` | ✅ | csv، html، ini، json، jsonl، md، pdf، tsv، txt، xlsx … | YAML ساده (کلید: مقدار و فهرست‌ها). YAML خیلی پیچیده به متن خوانده می‌شود. |
| `.yml` | ✅ | csv، html، ini، json، jsonl، md، pdf، tsv، txt، xlsx … |  |

## سند

| پسوند | خواندن | تبدیل به | توضیح |
| --- | --- | --- | --- |
| `.doc` | — | — | فرمت قدیمی Word (باینری). در خود Word به .docx ذخیره کن تا خوانده شود. |
| `.docx` | ✅ | html، json، md، pdf، rtf، txt |  |
| `.epub` | ✅ | docx، html، json، md، pdf، rtf، txt |  |
| `.odt` | ✅ | docx، html، json، md، pdf، rtf، txt |  |
| `.pdf` | ✅ | csv، html، json، md، rtf، txt، xml | متن PDF استخراج می‌شود؛ PDFِ اسکن‌شده متن ندارد (برای آن فایل را به چت بده تا با چشم بخوانمش). |
| `.rtf` | ✅ | csv، html، json، md، pdf، txt، xml |  |

## صفحه‌گسترده

| پسوند | خواندن | تبدیل به | توضیح |
| --- | --- | --- | --- |
| `.ods` | ✅ | csv، html، ini، json، jsonl، md، pdf، tsv، txt، xlsx … |  |
| `.xls` | — | — | فرمت قدیمی Excel (باینری). در Excel به .xlsx ذخیره کن. |
| `.xlsx` | ✅ | csv، html، ini، json، jsonl، md، pdf، tsv، txt، xml … |  |

## ارائه

| پسوند | خواندن | تبدیل به | توضیح |
| --- | --- | --- | --- |
| `.ppt` | — | — | فرمت قدیمی PowerPoint (باینری). به .pptx ذخیره کن. |
| `.pptx` | ✅ | docx، html، json، md، pdf، rtf، txt |  |

## تصویر

| پسوند | خواندن | تبدیل به | توضیح |
| --- | --- | --- | --- |
| `.avif` | — | bmp، gif، heic، ico، jpeg، jpg، png، svg، tiff، webp |  |
| `.bmp` | — | avif، gif، heic، ico، jpeg، jpg، png، svg، tiff، webp |  |
| `.gif` | — | avif، bmp، heic، ico، jpeg، jpg، png، svg، tiff، webp |  |
| `.heic` | — | avif، bmp، gif، ico، jpeg، jpg، png، svg، tiff، webp |  |
| `.ico` | — | avif، bmp، gif، heic، jpeg، jpg، png، svg، tiff، webp |  |
| `.jpeg` | — | avif، bmp، gif، heic، ico، jpg، png، svg، tiff، webp |  |
| `.jpg` | — | avif، bmp، gif، heic، ico، jpeg، png، svg، tiff، webp |  |
| `.png` | — | avif، bmp، gif، heic، ico، jpeg، jpg، svg، tiff، webp | ابعاد و اطلاعات خوانده می‌شود؛ تبدیل به فرمت دیگر به ImageMagick/ffmpeg نیاز دارد. |
| `.svg` | ✅ | avif، bmp، csv، gif، heic، html، ico، jpeg، jpg، json … | SVG در واقع XML است، پس مثل متن خوانده و ویرایش می‌شود. |
| `.tiff` | — | avif، bmp، gif، heic، ico، jpeg، jpg، png، svg، webp |  |
| `.webp` | — | avif، bmp، gif، heic، ico، jpeg، jpg، png، svg، tiff |  |

## صدا

| پسوند | خواندن | تبدیل به | توضیح |
| --- | --- | --- | --- |
| `.aac` | — | flac، m4a، mp3، ogg، opus، wav، wma |  |
| `.flac` | — | aac، m4a، mp3، ogg، opus، wav، wma |  |
| `.m4a` | — | aac، flac، mp3، ogg، opus، wav، wma |  |
| `.mp3` | — | aac، flac، m4a، ogg، opus، wav، wma |  |
| `.ogg` | — | aac، flac، m4a، mp3، opus، wav، wma |  |
| `.opus` | — | aac، flac، m4a، mp3، ogg، wav، wma |  |
| `.wav` | — | aac، flac، m4a، mp3، ogg، opus، wma |  |
| `.wma` | — | aac، flac، m4a، mp3، ogg، opus، wav |  |

## ویدیو

| پسوند | خواندن | تبدیل به | توضیح |
| --- | --- | --- | --- |
| `.avi` | — | flv، m4v، mkv، mov، mp4، webm، wmv |  |
| `.flv` | — | avi، m4v، mkv، mov، mp4، webm، wmv |  |
| `.m4v` | — | avi، flv، mkv، mov، mp4، webm، wmv |  |
| `.mkv` | — | avi، flv، m4v، mov، mp4، webm، wmv |  |
| `.mov` | — | avi، flv، m4v، mkv، mp4، webm، wmv |  |
| `.mp4` | — | avi، flv، m4v، mkv، mov، webm، wmv |  |
| `.webm` | — | avi، flv، m4v، mkv، mov، mp4، wmv |  |
| `.wmv` | — | avi، flv، m4v، mkv، mov، mp4، webm |  |

## فایل فشرده

| پسوند | خواندن | تبدیل به | توضیح |
| --- | --- | --- | --- |
| `.7z` | — | — | برای باز کردن به 7-Zip روی سیستم نیاز است. |
| `.bz2` | — | — |  |
| `.gz` | ✅ | csv، html، json، md، pdf، rtf، txt، xml |  |
| `.rar` | — | — |  |
| `.tar` | ✅ | csv، html، ini، json، jsonl، md، pdf، tsv، txt، xlsx … |  |
| `.tgz` | ✅ | csv، html، ini، json، jsonl، md، pdf، tsv، txt، xlsx … |  |
| `.xz` | — | — |  |
| `.zip` | ✅ | csv، html، ini، json، jsonl، md، pdf، tsv، txt، xlsx … | فهرست و محتوای فایل‌های داخلش خوانده می‌شود. |

## فونت

| پسوند | خواندن | تبدیل به | توضیح |
| --- | --- | --- | --- |
| `.otf` | — | — |  |
| `.ttf` | — | — |  |
| `.woff` | — | — |  |
| `.woff2` | — | — |  |

## باینری

| پسوند | خواندن | تبدیل به | توضیح |
| --- | --- | --- | --- |
| `.bin` | — | — |  |
| `.db` | ✅ | csv، html، ini، json، jsonl، md، pdf، tsv، txt، xlsx … | پایگاه‌داده‌ی SQLite — فهرست جدول‌ها خوانده می‌شود. |
| `.dll` | — | — |  |
| `.exe` | — | — | اجرایی ویندوز — ستایش آن را فقط بررسی می‌کند، هرگز اجرا نمی‌کند. |
| `.so` | — | — |  |
| `.sqlite` | ✅ | csv، html، ini، json، jsonl، md، pdf، tsv، txt، xlsx … |  |
| `.sqlite3` | ✅ | csv، html، ini، json، jsonl، md، pdf، tsv، txt، xlsx … |  |

## چطور استفاده کنم

- در چت بگو: «این فایل را به اکسل تبدیل کن» و فایل را بفرست.
- برای فایل بزرگ لازم نیست کل فایل را بفرستی — مسیرش را بده،
  ستایش تکه‌تکه می‌خواند و تحلیل می‌کند (`open_file` / `file_search` / `file_slice`).
- فهرست زنده‌ی همین جدول از `GET /api/formats` هم می‌آید.
