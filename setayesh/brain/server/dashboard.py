"""ساخت داشبورد زندهٔ نقشهٔ مغز در والت."""
import datetime


def build(vault, llm, settings, bridge=None):
    files = vault.list_files()
    knowledge = [f for f in files if f.startswith("knowledge/")]
    lessons = [f for f in files if f.startswith("lessons/")]
    logs = [f for f in files if f.startswith("logs/")]
    online = "🟢 آنلاین" if llm.is_available() else "🔴 آفلاین (Ollama در دسترس نیست)"
    link = bridge.state() if bridge else "—"
    engine = f"`{settings.get('model', llm.model)}`" if llm.is_available() else "مدل محلیِ جایگزین (اولاما آفلاین)"

    md = f"""# 🧠 داشبورد زندهٔ مغز ستایش

> آخرین به‌روزرسانی: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

## وضعیت مغز سرور
- **مدل محلی:** `{settings.get('model', llm.model)}` — {online}
- **موتور فعال:** {engine}
- **دما:** {settings.get('temperature', llm.temperature)}
- **سقف گام:** {settings.get('max_steps', 6)}
- **اتصال به والت ابسیدین:** {link}

## نقشهٔ حافظهٔ دائمی
| بخش | تعداد فایل |
|-----|-----------|
| گراف دانش (`knowledge/`) | {len(knowledge)} |
| درس‌های خودآموخته (`lessons/`) | {len(lessons)} |
| لاگ‌ها (`logs/`) | {len(logs)} |

## نوت‌های گراف دانش
{chr(10).join('- ' + f for f in knowledge) or '- (خالی)'}

## آخرین درس‌های خودآموخته
{vault.read_lessons(limit=5) or '- (هنوز درسی ثبت نشده)'}

---
*این فایل را مغز به‌صورت خودکار می‌نویسد.*
"""
    vault.write_dashboard(md)
    return md
