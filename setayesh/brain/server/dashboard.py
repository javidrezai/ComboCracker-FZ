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

    graph_md = graph_markdown(vault.knowledge_graph())
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

## گراف دانش
{graph_md}

## آخرین درس‌های خودآموخته
{vault.read_lessons(limit=5) or '- (هنوز درسی ثبت نشده)'}

---
*این فایل را مغز به‌صورت خودکار می‌نویسد.*
"""
    vault.write_dashboard(md)
    return md


def _esc(t):
    return t.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def graph_svg(graph, size=560):
    """گراف دانش را به‌صورت SVG (چیدمان دایره‌ای) می‌کشد — برای داشبورد وب."""
    import math
    nodes, edges = graph["nodes"], graph["edges"]
    n = len(nodes)
    if n == 0:
        return "<p>گراف دانش خالی است.</p>"
    cx = cy = size / 2
    R = size / 2 - 78
    pos = {}
    for i, name in enumerate(nodes):
        a = -math.pi / 2 + 2 * math.pi * i / n
        pos[name] = (cx + R * math.cos(a), cy + R * math.sin(a))
    deg = {name: 0 for name in nodes}
    for u, v in edges:
        deg[u] += 1
        deg[v] += 1
    p = [f'<svg viewBox="0 0 {size} {size}" width="100%" style="max-width:{size}px;height:auto" '
         f'xmlns="http://www.w3.org/2000/svg" font-family="Vazirmatn,Tahoma,sans-serif">']
    for u, v in edges:
        x1, y1 = pos[u]; x2, y2 = pos[v]
        p.append(f'<line x1="{x1:.0f}" y1="{y1:.0f}" x2="{x2:.0f}" y2="{y2:.0f}" '
                 f'stroke="#4f7cf0" stroke-opacity="0.45" stroke-width="1.4"/>')
    for name in nodes:
        x, y = pos[name]
        r = 5 + min(deg[name], 6) * 1.6
        p.append(f'<circle cx="{x:.0f}" cy="{y:.0f}" r="{r:.0f}" fill="#e8b64a" '
                 f'stroke="#0c111d" stroke-width="1.5"/>')
        anchor = "start" if x > cx + 8 else ("end" if x < cx - 8 else "middle")
        dx = 8 if anchor == "start" else (-8 if anchor == "end" else 0)
        dy = -10 if abs(y - cy) < 8 else (16 if y > cy else -8)
        p.append(f'<text x="{x + dx:.0f}" y="{y + dy:.0f}" fill="#e8ecf5" font-size="11" '
                 f'text-anchor="{anchor}">{_esc(name)}</text>')
    p.append("</svg>")
    return "".join(p)


def graph_markdown(graph):
    """فهرست مجاورتِ گراف دانش برای داشبورد مارک‌داون."""
    nodes, edges = graph["nodes"], graph["edges"]
    if not nodes:
        return "- (گراف خالی)"
    adj = {n: [] for n in nodes}
    for u, v in edges:
        adj[u].append(v); adj[v].append(u)
    lines = [f"- **{n}** → {'، '.join(adj[n]) if adj[n] else '—'}" for n in nodes]
    return f"({len(nodes)} گره، {len(edges)} یال)\n" + "\n".join(lines)
