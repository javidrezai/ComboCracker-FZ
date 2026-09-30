'use strict';
// ---------------------------------------------------------------------------
// Autonomy & the Golden Guardrail — the permission matrix from the Super-Agent
// blueprint, turned into code.
// ---------------------------------------------------------------------------
// The blueprint (Sotayesh v2.0) says: act autonomously for routine work — web
// navigation, research, drafting — but REQUIRE the admin's explicit approval for
// the dangerous, irreversible things: sending email, deploying/production code,
// changing its own core structure, spending money, deleting data.
//
// This module is the single, pure, testable source of truth for that decision.
// It does NOT execute anything and holds no state — index.js asks it "may I do
// this on my own, or must Javid approve first?" and it answers with a domain,
// a mode, and a human reason. Keeping it here (not scattered in prompts) means
// the guardrail can't be talked around by a clever model reply.

// The domains from the blueprint's Permission Matrix, most-permissive first.
// mode: 'auto' = do it now; 'approval' = create a pending request for the admin.
const DOMAINS = [
  { id: 'web',      mode: 'auto',     label: 'گشتن وب و پر کردن فرم',        test: (a) => /web|browse|scroll|navigate|form|fill|search|scrape|extract|صفحه|جستجو|فرم|مرورگر/i.test(a) },
  { id: 'research', mode: 'auto',     label: 'تحقیق، نوشتن، نمونهٔ کد',       test: (a) => /research|gather|draft|write|copy|prototype|design|asset|تحقیق|نوشتن|پیش‌نویس|نمونه|طراحی/i.test(a) },
  { id: 'email_read', mode: 'auto',   label: 'خواندن/مرتب‌کردن ایمیل',        test: (a) => /(read|scan|sort|organi[sz]e|label|draft).*(mail|email|inbox)|(mail|email|inbox).*(read|scan|sort|draft)|خواندن.*ایمیل|مرتب.*ایمیل|پیش‌نویس.*ایمیل/i.test(a) },

  // Everything below needs the admin's explicit yes.
  { id: 'email_send', mode: 'approval', label: 'فرستادن ایمیل',              test: (a) => /send|dispatch|reply-?all|forward|ارسال.*ایمیل|فرستادن.*ایمیل|ایمیل.*بفرست/i.test(a) },
  { id: 'deploy',     mode: 'approval', label: 'انتشار/دیپلویِ برنامه',       test: (a) => /deploy|publish|release|production|go-?live|انتشار|دیپلوی|رفتن.*رو.*لایو/i.test(a) },
  { id: 'self_core',  mode: 'approval', label: 'تغییرِ ساختار/هستهٔ خود',     test: (a) => /self-?edit|modify.*core|core.*(change|update)|architecture|rewrite.*source|apply.*(patch|change)|تغییرِ?.*(هسته|ساختار|کدِ خود)|خودویرایش/i.test(a) },
  { id: 'money',      mode: 'approval', label: 'خرید/پرداخت/هزینه',           test: (a) => /pay|purchase|buy|checkout|order|subscribe|charge|invoice|خرید|پرداخت|هزینه|سفارش|اشتراک/i.test(a) },
  { id: 'destructive',mode: 'approval', label: 'حذف/بازنویسیِ داده',          test: (a) => /delete|remove|wipe|drop|erase|overwrite|format|rm\s|حذف|پاک.*کردن|بازنویسی|فرمت/i.test(a) },
];

// Classify a free-text action description into a domain + mode + reason.
// Approval-required domains are checked FIRST (a message that is both "draft and
// send an email" must land on the stricter send rule), then the auto ones. An
// action that matches nothing is treated as routine (auto) — but the caller can
// pass opts.defaultMode='approval' to be strict about the unknown.
function classifyAction(action, opts) {
  opts = opts || {};
  const a = String(action || '');
  const approval = DOMAINS.filter((d) => d.mode === 'approval');
  const auto = DOMAINS.filter((d) => d.mode === 'auto');
  for (const d of approval) {
    if (d.test(a)) return { domain: d.id, mode: 'approval', label: d.label, reason: `«${d.label}» طبق قانونِ گاردریل نیاز به تأییدِ ادمین دارد.` };
  }
  for (const d of auto) {
    if (d.test(a)) return { domain: d.id, mode: 'auto', label: d.label, reason: `«${d.label}» کارِ روزمره است و خودکار انجام می‌شود.` };
  }
  const mode = opts.defaultMode === 'approval' ? 'approval' : 'auto';
  return { domain: 'other', mode, label: 'نامشخص', reason: mode === 'approval'
    ? 'این کار شناخته‌نشده است؛ برای احتیاط تأیید می‌خواهد.'
    : 'کارِ روزمرهٔ شناخته‌نشده؛ خودکار انجام می‌شود.' };
}

function needsApproval(action, opts) { return classifyAction(action, opts).mode === 'approval'; }

module.exports = { DOMAINS, classifyAction, needsApproval };
