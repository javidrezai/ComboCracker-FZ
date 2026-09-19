'use strict';
// Pure mapping of a provider/network error to a friendly, family-readable
// message (Persian), split out of index.js. No shared state: it takes the error
// and the provider's label and returns { status, error }. A family member
// seeing "ECONNREFUSED" learns nothing; they need to know whether to wait,
// check the internet, or tell the admin. Unit-tested in smoke.test.js.

function friendlyProviderError(err, providerLabel) {
  err = err || {};
  if (err.name === 'AbortError') return { status: 504, error: 'مدل خیلی طول کشید و درخواست لغو شد.' };
  if (!err.status) {
    const cause = (err && (err.cause && (err.cause.code || err.cause.message) || err.message)) || 'unknown';
    console.error(`${providerLabel} request threw:`, cause, err && err.stack ? err.stack.split('\n')[0] : '');
    const c = String(cause).toUpperCase();
    if (/ECONNREFUSED|ENOTFOUND|EAI_AGAIN|ENETUNREACH/.test(c)) {
      return { status: 503, error: `به ${providerLabel} نمی‌شود وصل شد. اینترنت را چک کن؛ اگر وصل است، این سرویس موقتاً در دسترس نیست — کمی بعد دوباره امتحان کن یا از تنظیمات موتور دیگری انتخاب کن.` };
    }
    if (/ETIMEDOUT|ECONNRESET/.test(c)) {
      return { status: 504, error: `${providerLabel} جواب نداد (اتصال قطع شد). دوباره امتحان کن.` };
    }
    if (/CERT|TLS|SSL/.test(c)) {
      return { status: 502, error: 'مشکل گواهی امنیتی — احتمالاً آنتی‌ویروس در مسیر است. راهنمای TLS را در README ببین.' };
    }
    return { status: 500, error: `ارتباط با ${providerLabel} برقرار نشد (${cause}).` };
  }
  console.error(`${providerLabel} API error:`, err.status, err.detail);
  // Pull the real one-line reason out of the provider's error body.
  let reason = '';
  try {
    const d = JSON.parse(err.detail || '{}');
    reason = (d.error && (d.error.message || d.error.status)) || '';
  } catch (e) { reason = (err.detail || '').toString().slice(0, 160); }
  reason = (reason || '').toString().replace(/\s+/g, ' ').slice(0, 180);
  const tail = reason ? ` — ${reason}` : '';
  if (err.status === 413) return { status: 413, error: 'پیام برای سقف این مدل خیلی بزرگ است (محدودیت توکن در دقیقه). گفتگوی جدید شروع کنید یا یک موتور دیگر انتخاب کنید.' };
  if (err.status === 429) return { status: 429, error: 'سقف این سرویس پر شده — کمی بعد دوباره امتحان کنید.' };
  if (err.status === 401 || err.status === 403) return { status: 502, error: 'کلید API پذیرفته نشد. آن را بررسی کنید.' + tail };
  if (err.status === 404) return { status: 502, error: 'مدل/سرویس پیدا نشد (۴۰۴) — احتمالاً این مدل روی کلید شما در دسترس نیست یا بازنشسته شده. یک مدل دیگر از تنظیمات انتخاب کنید.' + tail };
  if (err.status === 400) return { status: 502, error: 'درخواست نامعتبر (۴۰۰)' + tail };
  return { status: 502, error: 'سرویس خطا برگرداند (' + err.status + ')' + tail };
}

module.exports = { friendlyProviderError };
