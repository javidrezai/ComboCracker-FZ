'use strict';

// Telegram connector — reach Setayesh from outside the house.
//
// No new dependency: the Telegram Bot API is plain HTTPS over the global
// fetch, and we use long-polling (getUpdates), so it works from behind a home
// NAT with no public URL or webhook.
//
// SECURITY: the bot only ever answers ONE chat — the id in TELEGRAM_CHAT_ID.
// Anyone else who messages the bot is refused and told their own chat id (so
// the owner can whitelist themselves once), never served. The token lives in
// the 0600 config like every other secret.

function makeTelegram(opts) {
  const getCfg = opts.getCfg || (() => ({}));
  let polling = false;
  let stopFlag = false;
  let offset = 0;

  const token = () => (getCfg() || {}).TELEGRAM_BOT_TOKEN || '';
  const allowedChat = () => String((getCfg() || {}).TELEGRAM_CHAT_ID || '').trim();
  const configured = () => !!token();

  async function api(method, body, timeoutMs) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs || 15000);
    try {
      const r = await fetch(`https://api.telegram.org/bot${token()}/${method}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body || {}),
        signal: ctrl.signal,
      });
      const d = await r.json().catch(() => ({}));
      if (!d || !d.ok) throw new Error((d && d.description) || ('telegram ' + method + ' failed'));
      return d.result;
    } finally { clearTimeout(timer); }
  }

  // `buttons` (optional) is a flat array of { text, data } — rendered as an
  // inline keyboard so the owner can tap ✅/❌ for an approval, no typing. This
  // is the Telegram Approval Gateway from the Super-Agent blueprint (Phase 3).
  async function send(text, chatId, buttons) {
    if (!configured()) return false;
    const to = chatId || allowedChat();
    if (!to) return false;
    const s = String(text == null ? '' : text);
    const markup = (buttons && buttons.length)
      ? { reply_markup: { inline_keyboard: [buttons.map((b) => ({ text: b.text, callback_data: String(b.data).slice(0, 60) }))] } }
      : {};
    // Telegram caps a message near 4096 chars; chunk long replies. Buttons ride
    // on the LAST chunk so they attach to the final bubble.
    for (let i = 0; i < s.length || i === 0; i += 3900) {
      const isLast = i + 3900 >= s.length;
      await api('sendMessage', Object.assign({ chat_id: to, text: s.slice(i, i + 3900) || '…' }, isLast ? markup : {}));
      if (s.length <= 3900) break;
    }
    return true;
  }

  async function pollOnce(onMessage, onCallback) {
    const updates = await api('getUpdates', { offset, timeout: 25, allowed_updates: ['message', 'callback_query'] }, 30000);
    for (const u of updates || []) {
      offset = u.update_id + 1;

      // A tapped inline button (Approve/Reject on an approval request).
      if (u.callback_query) {
        const cq = u.callback_query;
        const from = String((cq.message && cq.message.chat && cq.message.chat.id) || (cq.from && cq.from.id) || '');
        if (allowedChat() && from === allowedChat() && onCallback) {
          let note = '';
          try { note = await onCallback(String(cq.data || ''), from); } catch (e) { note = 'خطا'; }
          try { await api('answerCallbackQuery', { callback_query_id: cq.id, text: (note || 'انجام شد').slice(0, 190) }); } catch (e) {}
          if (note) { try { await send(note, from); } catch (e) {} }
        } else {
          try { await api('answerCallbackQuery', { callback_query_id: cq.id, text: '⛔️' }); } catch (e) {}
        }
        continue;
      }

      const m = u.message;
      if (!m || !m.text) continue;
      const from = String((m.chat && m.chat.id) || '');
      if (!allowedChat()) {
        try { await api('sendMessage', { chat_id: from, text: 'برای فعال شدن، این Chat ID را در مرکز کنترل ستایش ثبت کن:\n' + from }); } catch (e) {}
        continue;
      }
      if (from !== allowedChat()) {
        try { await api('sendMessage', { chat_id: from, text: '⛔️ این ربات خصوصی است.' }); } catch (e) {}
        continue;
      }
      try {
        await api('sendChatAction', { chat_id: from, action: 'typing' }).catch(() => {});
        const reply = await onMessage(m.text, from);
        if (reply) await send(reply, from);
      } catch (e) {
        try { await send('خطا: ' + (e.message || 'ناموفق'), from); } catch (e2) {}
      }
    }
  }

  async function loop(onMessage, onCallback) {
    if (polling) return;
    polling = true; stopFlag = false;
    while (!stopFlag && configured()) {
      try { await pollOnce(onMessage, onCallback); }
      catch (e) { await new Promise((r) => setTimeout(r, 5000)); }  // back off on error/timeout
    }
    polling = false;
  }

  function start(onMessage, onCallback) { if (configured() && !polling) loop(onMessage, onCallback); }
  function stop() { stopFlag = true; }
  function status() { return { configured: configured(), chatSet: !!allowedChat(), polling }; }

  return { configured, send, start, stop, status };
}

module.exports = { makeTelegram };
