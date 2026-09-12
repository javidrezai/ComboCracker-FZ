"""حلقهٔ عامل — قلب مغز سرور.

چرخه: استدلال → انتخاب ابزار → مشاهده → خودتعمیر
با محافظت سقف گام (max_steps) و ثبت کامل استدلال برای شفافیت.
"""
import re
import uuid

from tools import build_registry, tool_help


TOOL_RE = re.compile(r"TOOL:\s*([a-zA-Z_]+)\s*\((.*?)\)", re.DOTALL)
FINAL_RE = re.compile(r"FINAL:\s*(.*)", re.DOTALL)
LESSON_RE = re.compile(r"LESSON:\s*(.*)", re.DOTALL)


SYSTEM_PROMPT = """تو «ستایش» هستی، یک مغز دستیارِ محلی و شفاف.

در هر گام دقیقاً یکی از این دو کار را انجام بده:
1. اگر به ابزار نیاز داری، فقط یک خط بنویس:
   TOOL: نام_ابزار(ورودی)
2. اگر پاسخ نهایی آماده است، بنویس:
   FINAL: پاسخ نهایی به فارسی

اگر چیز تازه‌ای یاد گرفتی که ارزش ماندگاری دارد، یک خط اضافه کن:
   LESSON: حقیقتِ آموخته‌شده

ابزارهای موجود:
{tools}

قوانین:
- کوتاه و دقیق فکر کن. از ابزارها فقط وقتی لازم است استفاده کن.
- اگر ابزار خطا داد، رویکردت را اصلاح کن (خودتعمیری).
- همیشه پاسخ نهایی را با FINAL: بده."""


class AgentLoop:
    def __init__(self, llm, vault, max_steps=6, bridge=None, fallback=None):
        self.llm = llm
        self.vault = vault
        self.max_steps = max_steps
        self.bridge = bridge
        self.fallback = fallback
        self.last_trace = []

    def run(self, user_input):
        """یک ورودی کاربر را تا رسیدن به پاسخ نهایی پردازش می‌کند."""
        session_id = uuid.uuid4().hex[:8]
        registry = build_registry(self.vault)
        # اتصال: آخرین ویرایش‌های کاربر در Obsidian را بکش
        if self.bridge:
            self.bridge.pull()
        settings = self.vault.read_settings()
        max_steps = int(settings.get("max_steps", self.max_steps))
        temperature = float(settings.get("temperature", self.llm.temperature))
        model = settings.get("model", self.llm.model)

        # بازیابی زمینه از حافظهٔ دائمی
        knowledge = self.vault.retrieve(user_input, k=4)
        lessons = self.vault.read_lessons(limit=8)

        context = ""
        if knowledge:
            context += "## دانش مرتبط از والت:\n"
            for name, txt in knowledge:
                context += f"### {name}\n{txt[:600]}\n\n"
        if lessons:
            context += f"## درس‌های خودآموخته:\n{lessons}\n"

        system = SYSTEM_PROMPT.format(tools=tool_help(registry))
        messages = [
            {"role": "system", "content": system},
            {"role": "user", "content": (context + "\n---\n" if context else "") + f"درخواست کاربر:\n{user_input}"},
        ]

        engine = self.llm if self.llm.is_available() else (self.fallback or self.llm)
        engine_name = model if engine is self.llm else "مدل محلیِ جایگزین"
        trace = [f"**ورودی:** {user_input}", f"**موتور:** {engine_name} · دما {temperature} · سقف گام {max_steps}"]
        if knowledge:
            trace.append(f"**بازیابی:** {', '.join(n for n, _ in knowledge)}")

        final_answer = None
        learned = []
        for step in range(1, max_steps + 1):
            reply = engine.chat(messages, temperature=temperature, model=model)
            trace.append(f"\n**گام {step} — استدلال:**\n```\n{reply.strip()}\n```")
            messages.append({"role": "assistant", "content": reply})

            for m in LESSON_RE.findall(reply):
                lesson = m.strip().splitlines()[0].strip()
                if lesson:
                    learned.append(lesson)

            fm = FINAL_RE.search(reply)
            if fm:
                final_answer = fm.group(1).strip()
                break

            tm = TOOL_RE.search(reply)
            if tm:
                name, arg = tm.group(1).strip(), tm.group(2).strip().strip('"\'')
                fn = registry.get(name)
                if fn is None:
                    obs = f"خطا: ابزار «{name}» وجود ندارد. ابزارهای معتبر: {', '.join(registry)}"
                    trace.append(f"**مشاهده (خودتعمیر):** {obs}")
                else:
                    try:
                        obs = fn(arg)
                        trace.append(f"**ابزار `{name}({arg})` → مشاهده:**\n```\n{obs[:500]}\n```")
                    except Exception as e:  # خودتعمیری: خطا را بازخورد بده
                        obs = f"خطا در اجرای {name}: {e}. رویکرد دیگری امتحان کن."
                        trace.append(f"**خطای ابزار (خودتعمیر):** {obs}")
                messages.append({"role": "user", "content": f"OBSERVATION: {obs}"})
                continue

            # نه ابزار نه پاسخ نهایی → راهنمایی برای اصلاح
            messages.append({"role": "user", "content": "با فرمت TOOL: یا FINAL: پاسخ بده."})

        if final_answer is None:
            final_answer = "به سقف گام رسیدم بدون پاسخ نهاییِ قطعی. آخرین استدلال در لاگ ثبت شد."
            trace.append("**هشدار:** سقف گام تمام شد.")

        # نوشتن در حافظهٔ دائمی
        for lesson in learned:
            self.vault.add_lesson(lesson)
            trace.append(f"**درس ثبت‌شده:** {lesson}")
        trace.append(f"\n**پاسخ نهایی:** {final_answer}")
        self.vault.append_log(session_id, trace)
        self.last_trace = trace
        # اتصال: نوشته‌های مغز را به مکان والت برگردان
        if self.bridge:
            self.bridge.push(f"brain: session {session_id}")

        return {"session_id": session_id, "answer": final_answer,
                "lessons": learned, "trace": trace, "model": model}
