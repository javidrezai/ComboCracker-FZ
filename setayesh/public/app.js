(function(){
'use strict';

/* ================= i18n ================= */
var LANG={
fa:{dir:'rtl',
 tagline:'دستیار مهندسی خصوصی · کد، امنیت، معماری',username:'نام کاربری',password:'رمز عبور',login:'ورود',
 loginFoot:'اجرا روی سرور شخصی شما · نشست ۸ ساعته',newChat:'گفت‌وگوی جدید',mode:'حالت',engine:'موتور',history:'گفت‌وگوها',
 settings:'تنظیمات',changePassword:'تغییر رمز عبور',currentPassword:'رمز فعلی',newPassword:'رمز جدید',
 confirmPassword:'تکرار رمز جدید',save:'ذخیره',close:'بستن',engines:'موتورهای متصل',
 keyHint:'کلیدها در فایل .setayesh-config کنار برنامه نگهداری می‌شوند.',
 askPlaceholder:'سوال، کد، یا فایل خود را بفرستید...',send:'ارسال',compareWith:'مقایسه بین',
 accountLine:'حساب: {u}',connected:'متصل',notConnected:'تنظیم نشده',
 m_chat:'گفت‌وگو',m_code:'کدنویسی',m_security:'بررسی امنیتی',m_architect:'معماری',
 m_documents:'مدارک آلمان',m_philosophy:'فلسفه',
 s_chat:'سوال روزمره',s_code:'برنامه‌نویسی',s_security:'بررسی امنیت',s_architect:'طراحی پروژه',
 s_documents:'نامه‌های اداری',s_philosophy:'گفتگوی عمیق',
 s_chat:'پرسش عمومی و گفت‌وگو',s_code:'نوشتن، دیباگ و بازنویسی کد',
 s_security:'پیدا کردن آسیب‌پذیری در کد شما',s_architect:'طراحی و ساختار اپلیکیشن',
 w_title:'چه چیزی بسازیم؟',
 w_text:'کد بفرست تا بررسی کنم، فایل پروژه آپلود کن، یا بپرس چطور چیزی را بسازی. همه‌چیز روی سرور خودت می‌ماند.',
 c1t:'بررسی امنیتی کد',c1d:'کد را بفرست تا آسیب‌پذیری‌ها را با شدت و راه‌حل پیدا کنم',
 c2t:'دیباگ کن',c2d:'خطا یا رفتار عجیب را توضیح بده تا ریشه‌اش را پیدا کنیم',
 c3t:'معماری اپ',c3d:'می‌خواهم یک اپ بسازم — استک و ساختارش را طراحی کن',
 c4t:'بازنویسی و بهینه',c4d:'این کد کار می‌کند ولی زشت است — تمیزش کن',
 p1:'این کد را از نظر امنیتی بررسی کن و آسیب‌پذیری‌هایش را با شدت و کد اصلاح‌شده بگو:\n\n```\n\n```',
 p2:'این خطا را می‌گیرم و نمی‌دانم چرا. کد و متن خطا:\n\n```\n\n```',
 p3:'می‌خواهم یک اپ بسازم که ... . چه استک و ساختاری پیشنهاد می‌دهی و از کجا شروع کنم؟',
 p4:'این کد کار می‌کند ولی تمیز نیست. بازنویسی‌اش کن و بگو چه چیزی را چرا عوض کردی:\n\n```\n\n```',
 fillCreds:'نام کاربری و رمز عبور را وارد کنید',tooManyLogin:'تلاش‌های زیاد. کمی بعد دوباره امتحان کنید.',
 badCreds:'نام کاربری یا رمز عبور اشتباه است',noConnect:'به سرور وصل نشد — پنجره‌ی مشکی برنامه را باز نگه دار و از http://localhost:3000 وارد شو',
 sessionExpired:'نشست منقضی شده — دوباره وارد شوید',tooManyChat:'درخواست‌های زیاد. چند لحظه صبر کنید.',
 aiNotConfigured:'هیچ کلید API روی سرور تنظیم نشده است.',genericError:'خطا در دریافت پاسخ. دوباره تلاش کنید.',
 connFailed:'اتصال برقرار نشد.',passMismatch:'رمز جدید و تکرار آن یکسان نیستند',
 passTooShort:'رمز جدید باید حداقل ۶ کاراکتر باشد',passWrong:'رمز فعلی اشتباه است',
 passChanged:'رمز عبور تغییر کرد',fillAllPass:'همه‌ی فیلدها را پر کنید',
 copy:'کپی',copied:'کپی شد',you:'شما',thinking:'در حال فکر کردن',
 hint:'Enter برای ارسال · Shift+Enter خط جدید',noModels:'هیچ موتوری تنظیم نشده',
 pickCompare:'حداقل یک مدل برای مقایسه انتخاب کنید',
 theme:'تم رنگی',th_violet:'بنفش',th_cyber:'آبی سایبری',th_matrix:'سبز نئون',th_sunset:'نارنجی',
 adminTitle:'مدیریت کاربران',adminSub:'ساخت، حذف، ری‌ست رمز و حالت امن',adminUsers:'کاربران',adminNew:'کاربر جدید',
 adminAddBtn:'افزودن کاربر',adminTag:'ادمین',adminReset:'ری‌ست رمز',adminDelete:'حذف',safeMode:'حالت امن (مناسب کودک)',
 adminDone:'انجام شد',adminNewPassPrompt:'رمز جدید برای {u}:',adminDelConfirm:'کاربر {u} حذف شود؟',username:'نام کاربری',password:'رمز عبور',
 download:'دانلود',saveMsg:'ذخیره',imageStudio:'استودیو تصویر',
 devicesTitle:'دستگاه‌های خانه',devTabList:'دستگاه‌ها',devTabScan:'جستجو',devTabPerms:'دسترسی‌ها',
 imgPromptPh:'توضیح تصویر را بنویس... مثلاً: یک ربات آبی در شهر آینده، سبک سه‌بعدی',imgSize:'اندازه',generate:'بساز',
 generating:'در حال ساخت...',imgErr:'ساخت تصویر ناموفق بود. اینترنت را چک کن و دوباره تلاش کن.',imgDownload:'دانلود تصویر',
 imgTabGen:'ساخت تصویر',imgTabConv:'تبدیل فرمت',convTitle:'تبدیل فرمت تصویر',convPick:'یک عکس انتخاب کن',
 convTo:'تبدیل به',convBtn:'تبدیل و دانلود',convErr:'تبدیل ناموفق بود',imageBtn:'تصویر'},
en:{dir:'ltr',
 tagline:'Private engineering assistant · code, security, architecture',username:'Username',password:'Password',login:'Log in',
 loginFoot:'Runs on your own server · 8-hour session',newChat:'New chat',mode:'Mode',engine:'Engine',history:'Chats',
 settings:'Settings',changePassword:'Change password',currentPassword:'Current password',newPassword:'New password',
 confirmPassword:'Confirm new password',save:'Save',close:'Close',engines:'Connected engines',
 keyHint:'Keys are kept in the .setayesh-config file next to the app.',
 askPlaceholder:'Ask anything, paste code, or attach a file...',send:'Send',compareWith:'Compare across',
 accountLine:'Account: {u}',connected:'connected',notConnected:'not set',
 m_chat:'Chat',m_code:'Code',m_security:'Security audit',m_architect:'Architect',
 m_documents:'German letters',m_philosophy:'Deep talk',
 s_chat:'Ask anything',s_code:'Programming',s_security:'Check security',s_architect:'Design a project',
 s_documents:'Official letters',s_philosophy:'Think it through',
 s_chat:'General questions and conversation',s_code:'Write, debug and refactor code',
 s_security:'Find vulnerabilities in your code',s_architect:'App design and structure',
 w_title:'What are we building?',
 w_text:'Paste code for review, upload project files, or ask how to build something. Everything stays on your own server.',
 c1t:'Security review',c1d:'Paste code and I will find vulnerabilities with severity and fixes',
 c2t:'Debug this',c2d:'Describe the error or weird behaviour and we will trace the root cause',
 c3t:'Design an app',c3d:'I want to build something — design the stack and structure',
 c4t:'Refactor',c4d:'This code works but it is ugly — clean it up',
 p1:'Review this code for security vulnerabilities. Give severity, the exploit path, and fixed code:\n\n```\n\n```',
 p2:'I am getting this error and I do not understand why. Code and error:\n\n```\n\n```',
 p3:'I want to build an app that ... . What stack and structure do you recommend, and where should I start?',
 p4:'This code works but it is messy. Refactor it and tell me what you changed and why:\n\n```\n\n```',
 fillCreds:'Enter your username and password',tooManyLogin:'Too many attempts. Try again shortly.',
 badCreds:'Incorrect username or password',noConnect:'Could not reach the server — keep the app window open and open http://localhost:3000',
 sessionExpired:'Session expired — please log in again',tooManyChat:'Too many requests. Wait a moment.',
 aiNotConfigured:'No API key is configured on this server.',genericError:'Could not get a reply. Try again.',
 connFailed:'Connection failed.',passMismatch:"New password and confirmation don't match",
 passTooShort:'New password must be at least 6 characters',passWrong:'Current password is incorrect',
 passChanged:'Password changed',fillAllPass:'Fill in all fields',
 copy:'Copy',copied:'Copied',you:'You',thinking:'Thinking',
 hint:'Enter to send · Shift+Enter for a new line',noModels:'No engine configured',
 pickCompare:'Pick at least one model to compare',
 theme:'Theme',th_violet:'Violet',th_cyber:'Cyber Blue',th_matrix:'Neon Green',th_sunset:'Sunset',
 adminTitle:'Manage users',adminSub:'Create, delete, reset password, safe mode',adminUsers:'Users',adminNew:'New user',
 adminAddBtn:'Add user',adminTag:'admin',adminReset:'Reset password',adminDelete:'Delete',safeMode:'Safe mode (child-friendly)',
 adminDone:'Done',adminNewPassPrompt:'New password for {u}:',adminDelConfirm:'Delete user {u}?',username:'Username',password:'Password',
 download:'Download',saveMsg:'Save',imageStudio:'Image studio',
 devicesTitle:'Home devices',devTabList:'Devices',devTabScan:'Scan',devTabPerms:'Access',
 imgPromptPh:'Describe the image... e.g. a blue robot in a future city, 3D style',imgSize:'Size',generate:'Generate',
 generating:'Generating...',imgErr:'Image generation failed. Check your internet and try again.',imgDownload:'Download image',
 imgTabGen:'Generate',imgTabConv:'Convert format',convTitle:'Convert image format',convPick:'Pick an image',
 convTo:'Convert to',convBtn:'Convert & download',convErr:'Conversion failed',imageBtn:'Image'}
};
Object.assign(LANG.fa,{
 guideTitle:'راهنما و توانایی‌ها',textSize:'اندازه‌ی متن',tsSmall:'کوچک',tsMedium:'متوسط',tsLarge:'بزرگ',
 clearChats:'گفتگوها',clearChatsBtn:'پاک‌کردن همه‌ی گفتگوها',clearChatsConfirm:'همه‌ی گفتگوها پاک شوند؟',
 gIntro:'ستایش یک دستیار هوش مصنوعی خصوصی است که روی سرور خودت اجرا می‌شود. دو کار اصلی دارد:',
 gBeginner:'سوال‌جواب ساده',gBeginnerD:'حالت «گفت‌وگو» — هر سوالی درباره‌ی هر موضوعی بپرس؛ ساده و مناسب همه، حتی بچه‌ها.',
 gCode:'کدنویسی و کارهای فنی',gCodeD:'حالت‌های «کدنویسی»، «بررسی امنیتی» و «معماری» — نوشتن و رفع اشکال کد، پیدا کردن مشکلات امنیتی، و طراحی پروژه.',
 gMore:'کارهای دیگر:',gFiles:'خواندن عکس، PDF و فایل متنی (با موتور Gemini)',gImage:'ساخت تصویر در «استودیو تصویر»',
 gExport:'دانلود کد و ذخیره‌ی پاسخ‌ها',gEngines:'چند موتور رایگان — Groq سریع، Gemini برای فایل',
 gHow:'طرز کار: از نوار کناری «حالت» را انتخاب کن، سوال بنویس یا فایل آپلود کن، و موتور دلخواه را بردار.',
 greetMorning:'صبح بخیر',greetAfter:'عصر بخیر',greetNight:'شب بخیر',w_ask:'چطور می‌تونم کمکت کنم؟',
 autoGemini:'برای خواندن فایل، موتور Gemini انتخاب شد',
 liveSearch:'جستجوی زنده در وب',searchOnMsg:'جستجوی زنده روشن شد — با گوگل جواب می‌دهد',
 searchNeedsGemini:'جستجوی زنده به موتور Gemini نیاز دارد. اول کلید Gemini را در تنظیمات اضافه کن.',
 codeLib:'کتابخانه‌های کد',codeLibHint:'چند کتابخانه‌ی جدا بساز (پایتون، C++، CSS، …). هنگام کدنویسی بگو «از کتابخانه‌ی پایتون استفاده کن» یا «از کل کتابخانه استفاده کن».',codeLibSaved:'ذخیره شد ✓',newLib:'جدید +',uploadLib:'بارگذاری فایل',delete:'حذف'
});
Object.assign(LANG.en,{
 guideTitle:'Guide & abilities',textSize:'Text size',tsSmall:'Small',tsMedium:'Medium',tsLarge:'Large',
 clearChats:'Chats',clearChatsBtn:'Clear all chats',clearChatsConfirm:'Delete all chats?',
 gIntro:'Setayesh is a private AI assistant running on your own server. It does two main things:',
 gBeginner:'Simple questions & answers',gBeginnerD:'“Chat” mode — ask anything about any topic; simple and suitable for everyone, even kids.',
 gCode:'Coding & technical work',gCodeD:'“Code”, “Security” and “Architect” modes — write and debug code, find security issues, and design projects.',
 gMore:'Also:',gFiles:'Read images, PDFs and text files (with the Gemini engine)',gImage:'Generate images in the Image Studio',
 gExport:'Download code and save replies',gEngines:'Several free engines — Groq (fast), Gemini (files)',
 gHow:'How: pick a mode from the sidebar, type a question or attach a file, and choose your engine.',
 greetMorning:'Good morning',greetAfter:'Good afternoon',greetNight:'Good night',w_ask:'How can I help you?',
 autoGemini:'Switched to Gemini so it can read your file',
 liveSearch:'Live web search',searchOnMsg:'Live search on — answers with Google',
 searchNeedsGemini:'Live search needs the Gemini engine. Add a Gemini key in settings first.'
});
var lang=localStorage.getItem('setayesh.lang')||'en';
function t(k){return (LANG[lang]&&LANG[lang][k])||k;}

/* ============ file output helpers ============ */
function saveBlob(blob,filename){
  var url=URL.createObjectURL(blob);
  var a=document.createElement('a');a.href=url;a.download=filename;
  document.body.appendChild(a);a.click();
  setTimeout(function(){document.body.removeChild(a);URL.revokeObjectURL(url);},600);
}
function saveText(text,filename,mime){saveBlob(new Blob([text],{type:(mime||'text/plain')+';charset=utf-8'}),filename);}
var LANG_EXT={javascript:'js',js:'js',node:'js',typescript:'ts',ts:'ts',jsx:'jsx',tsx:'tsx',python:'py',py:'py',
 bash:'sh',sh:'sh',shell:'sh',zsh:'sh',powershell:'ps1',ps1:'ps1',json:'json',html:'html',xml:'xml',css:'css',scss:'scss',
 java:'java',c:'c',h:'h',cpp:'cpp','c++':'cpp',cs:'cs',csharp:'cs',go:'go',golang:'go',rust:'rs',rs:'rs',php:'php',
 ruby:'rb',rb:'rb',sql:'sql',yaml:'yml',yml:'yml',toml:'toml',ini:'ini',md:'md',markdown:'md',kotlin:'kt',kt:'kt',
 swift:'swift',dart:'dart',r:'r',lua:'lua',perl:'pl',scala:'scala',dockerfile:'dockerfile',makefile:'makefile',
 vue:'vue',svelte:'svelte',text:'txt',plaintext:'txt',code:'txt'};
function extFor(l){l=(l||'').toLowerCase();return LANG_EXT[l]||'txt';}
function tstamp(){var d=new Date();function p(n){return(n<10?'0':'')+n;}
  return d.getFullYear()+p(d.getMonth()+1)+p(d.getDate())+'-'+p(d.getHours())+p(d.getMinutes())+p(d.getSeconds());}
function safeName(s){return String(s||'').replace(/[\\/:*?"<>|]+/g,' ').replace(/\s+/g,'_').slice(0,40)||'setayesh';}
function makeSaveBtn(getText){
  var sv=document.createElement('button');sv.className='msgsave';sv.type='button';sv.title=t('saveMsg');
  sv.innerHTML='<svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg><span>'+t('saveMsg')+'</span>';
  sv.addEventListener('click',function(){saveText(getText()||'','setayesh-'+tstamp()+'.md','text/markdown');});
  return sv;
}

/* Send a reply from Setayesh straight to the family board, so a useful
   answer doesn't have to be copied and retyped somewhere else. */
function makeShareBtn(getText){
  var sh=document.createElement('button');
  sh.className='msgsave'; sh.type='button'; sh.title='فرستادن به تابلوی خانواده';
  sh.innerHTML='<svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M3 5a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2H8l-5 4V5z"/></svg><span>به خانواده</span>';
  sh.addEventListener('click',function(){
    var txt=(getText()||'').trim();
    if(!txt)return;
    sh.disabled=true;
    var span=sh.querySelector('span');
    shareToBoard(txt,'setayesh').then(function(){
      if(span)span.textContent='فرستاده شد ✓';
      refreshBoardBadge();
      watchForUpdates();
      initAutoLock();
      showBriefing();
      setTimeout(function(){ if(span)span.textContent='به خانواده'; sh.disabled=false; },2500);
    }).catch(function(e){
      if(span)span.textContent='نشد';
      setTimeout(function(){ if(span)span.textContent='به خانواده'; sh.disabled=false; },2500);
    });
  });
  return sh;
}

/* ================= state ================= */
var TOKEN_KEY='setayesh.token',USER_KEY='setayesh.username';
var token=localStorage.getItem(TOKEN_KEY)||sessionStorage.getItem(TOKEN_KEY);
var currentUsername=sessionStorage.getItem(USER_KEY)||'';
var CFG=null, mode='chat', provider='', model='';

// ثبت هر خطای جاوااسکریپت، تا اگر چیزی کار نکرد، بشود دقیقاً دید چرا.
window.__setayeshErrors=[];
window.addEventListener('error',function(e){
  window.__setayeshErrors.push({msg:e.message, src:(e.filename||'').split('/').pop(), line:e.lineno, col:e.colno});
});
window.addEventListener('unhandledrejection',function(e){
  window.__setayeshErrors.push({msg:'Promise: '+(e.reason&&e.reason.message||e.reason||'?')});
});
var chats=[], activeChat=null, pendingFiles=[], busy=false;
var VAULT={key:null,data:null,vkey:null};
var compareOn=false, compareTargets=[];
var searchOn=false;

function $(id){return document.getElementById(id);}
function el(tag,cls,txt){var e=document.createElement(tag);if(cls)e.className=cls;if(txt!=null)e.textContent=txt;return e;}

/* ================= markdown + highlighting ================= */
function esc(s){return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}

var KEYWORDS=('abstract await async break case catch class const continue debugger default delete do else enum export extends '+
'final finally for from function global goto if implements import in instanceof interface let new package private protected public '+
'raise return static super switch this throw throws try typeof var void while with yield lambda def elif except pass None True False '+
'and or not is del assert nonlocal match struct impl trait fn mut pub use mod crate where dyn unsafe select go defer chan range map '+
'echo require include namespace using virtual override sealed readonly params ref out base foreach when then do end begin nil '+
'val var object sealed data suspend companion init constructor').split(/\s+/);
var KWSET={};KEYWORDS.forEach(function(k){KWSET[k]=1;});
var TYPES=('int float double char bool boolean string String Number Boolean Object Array void long short byte unsigned signed '+
'list dict set tuple str bytes u8 u16 u32 u64 i8 i16 i32 i64 f32 f64 usize isize any unknown never null undefined self').split(/\s+/);
var TYSET={};TYPES.forEach(function(k){TYSET[k]=1;});

// Small hand-rolled tokenizer — good enough for the common C-like/Python family
// and avoids shipping a whole highlighter library.
function highlight(code){
  var out='',i=0,n=code.length;
  function isIdStart(c){return /[A-Za-z_$]/.test(c);}
  function isId(c){return /[A-Za-z0-9_$]/.test(c);}
  while(i<n){
    var c=code[i],two=code.substr(i,2);
    // comments
    if(two==='//'||c==='#'){var j=code.indexOf('\n',i);if(j===-1)j=n;out+='<span class="tok-cmt">'+esc(code.slice(i,j))+'</span>';i=j;continue;}
    if(two==='/*'){var k=code.indexOf('*/',i+2);k=k===-1?n:k+2;out+='<span class="tok-cmt">'+esc(code.slice(i,k))+'</span>';i=k;continue;}
    if(two==='<!'&&code.substr(i,4)==='<!--'){var h=code.indexOf('-->',i);h=h===-1?n:h+3;out+='<span class="tok-cmt">'+esc(code.slice(i,h))+'</span>';i=h;continue;}
    // strings (incl. triple-quoted and template literals)
    if(c==='"'||c==="'"||c==='`'){
      var tri=code.substr(i,3);
      if(tri==='"""'||tri==="'''"){var e3=code.indexOf(tri,i+3);e3=e3===-1?n:e3+3;out+='<span class="tok-str">'+esc(code.slice(i,e3))+'</span>';i=e3;continue;}
      var j2=i+1;
      while(j2<n){if(code[j2]==='\\'){j2+=2;continue;}if(code[j2]===c){j2++;break;}if(code[j2]==='\n'&&c!=='`'){break;}j2++;}
      out+='<span class="tok-str">'+esc(code.slice(i,j2))+'</span>';i=j2;continue;
    }
    // numbers
    if(/[0-9]/.test(c)&&!(i>0&&isId(code[i-1]))){
      var j3=i;while(j3<n&&/[0-9a-fA-FxXoObB._]/.test(code[j3]))j3++;
      out+='<span class="tok-num">'+esc(code.slice(i,j3))+'</span>';i=j3;continue;
    }
    // identifiers
    if(isIdStart(c)){
      var j4=i;while(j4<n&&isId(code[j4]))j4++;
      var word=code.slice(i,j4);
      var after=code.slice(j4).match(/^\s*\(/);
      if(KWSET[word])out+='<span class="tok-kw">'+esc(word)+'</span>';
      else if(TYSET[word]||/^[A-Z][A-Za-z0-9_]*$/.test(word))out+='<span class="tok-typ">'+esc(word)+'</span>';
      else if(after)out+='<span class="tok-fn">'+esc(word)+'</span>';
      else out+=esc(word);
      i=j4;continue;
    }
    // operators
    if(/[+\-*/%=<>!&|^~?:.,;(){}\[\]]/.test(c)){out+='<span class="tok-op">'+esc(c)+'</span>';i++;continue;}
    out+=esc(c);i++;
  }
  return out;
}

var SEV=/^(critical|high|medium|low|info|بحرانی|بالا|متوسط|پایین|اطلاعاتی)$/i;
function sevClass(w){
  var m=w.toLowerCase();
  if(/^(critical|بحرانی)$/.test(m))return 'sev-critical';
  if(/^(high|بالا)$/.test(m))return 'sev-high';
  if(/^(medium|متوسط)$/.test(m))return 'sev-medium';
  if(/^(low|پایین)$/.test(m))return 'sev-low';
  return 'sev-info';
}

function inline(s){
  s=s.replace(/`([^`\n]+)`/g,function(m,c){return '<code>'+esc(c)+'</code>';});
  s=s.replace(/\*\*([^*\n]+)\*\*/g,function(m,c){
    var plain=c.trim();
    if(SEV.test(plain))return '<span class="sev '+sevClass(plain)+'">'+esc(plain)+'</span>';
    return '<strong>'+esc(c)+'</strong>';
  });
  s=s.replace(/(^|[^*])\*([^*\n]+)\*/g,function(m,p,c){return p+'<em>'+esc(c)+'</em>';});
  s=s.replace(/\[([^\]\n]+)\]\((https?:\/\/[^)\s]+)\)/g,function(m,txt,url){
    return '<a href="'+esc(url)+'" target="_blank" rel="noopener noreferrer">'+esc(txt)+'</a>';});
  s=s.replace(/(^|[\s(])(https?:\/\/[^\s<)]+)/g,function(m,p,url){
    return p+'<a href="'+esc(url)+'" target="_blank" rel="noopener noreferrer">'+esc(url)+'</a>';});
  return s;
}
// Escape everything that inline() didn't already turn into markup.
function safeInline(raw){
  var parts=[],idx=0;
  var tmp=raw.replace(/`[^`\n]+`|\*\*[^*\n]+\*\*|(^|[^*])\*[^*\n]+\*|\[[^\]\n]+\]\(https?:\/\/[^)\s]+\)|(^|[\s(])https?:\/\/[^\s<)]+/g,function(m){
    parts.push(m);return '\u0000'+(idx++)+'\u0000';
  });
  tmp=esc(tmp);
  var i2=0;
  return tmp.replace(/\u0000(\d+)\u0000/g,function(m,k){return inline(parts[Number(k)]);});
}

function renderMarkdown(raw){
  var html='',lines=String(raw==null?'':raw).split('\n'),i=0;
  function flushList(type,items){
    var tag=type==='ol'?'ol':'ul';
    html+='<'+tag+' dir="auto">'+items.map(function(x){return '<li dir="auto">'+safeInline(x)+'</li>';}).join('')+'</'+tag+'>';
  }
  while(i<lines.length){
    var line=lines[i];
    // fenced code
    var fence=line.match(/^\s*```([A-Za-z0-9_+#-]*)\s*$/);
    if(fence){
      var langName=fence[1]||'code',buf=[];i++;
      while(i<lines.length&&!/^\s*```\s*$/.test(lines[i])){buf.push(lines[i]);i++;}
      i++;
      var code=buf.join('\n');
      html+='<div class="codewrap"><div class="codebar"><span class="dots"><i></i><i></i><i></i></span>'+
        '<span class="lang">'+esc(langName)+'</span>'+
        '<button class="copy" data-code="'+encodeURIComponent(code)+'">'+
        '<svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">'+
        '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>'+
        '<span>'+t('copy')+'</span></button>'+
        '<button class="copy dl" data-code="'+encodeURIComponent(code)+'" data-lang="'+esc(langName)+'" title="'+t('download')+'">'+
        '<svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">'+
        '<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>'+
        '<span>'+t('download')+'</span></button></div><pre><code>'+highlight(code)+'</code></pre></div>';
      continue;
    }
    // table
    if(/^\s*\|.*\|\s*$/.test(line)&&i+1<lines.length&&/^\s*\|[\s:|-]+\|\s*$/.test(lines[i+1])){
      var head=line.trim().replace(/^\||\|$/g,'').split('|').map(function(s){return s.trim();});
      i+=2;var rows=[];
      while(i<lines.length&&/^\s*\|.*\|\s*$/.test(lines[i])){
        rows.push(lines[i].trim().replace(/^\||\|$/g,'').split('|').map(function(s){return s.trim();}));i++;
      }
      html+='<table><thead><tr>'+head.map(function(h){return '<th>'+safeInline(h)+'</th>';}).join('')+'</tr></thead><tbody>'+
        rows.map(function(r){return '<tr>'+r.map(function(c){return '<td>'+safeInline(c)+'</td>';}).join('')+'</tr>';}).join('')+
        '</tbody></table>';
      continue;
    }
    // heading
    var h=line.match(/^(#{1,4})\s+(.*)$/);
    if(h){var lvl=h[1].length;html+='<h'+lvl+' dir="auto">'+safeInline(h[2])+'</h'+lvl+'>';i++;continue;}
    // hr
    if(/^\s*([-*_])\1{2,}\s*$/.test(line)){html+='<hr>';i++;continue;}
    // blockquote
    if(/^\s*>\s?/.test(line)){
      var q=[];while(i<lines.length&&/^\s*>\s?/.test(lines[i])){q.push(lines[i].replace(/^\s*>\s?/,''));i++;}
      html+='<blockquote dir="auto">'+q.map(function(x){return safeInline(x);}).join('<br>')+'</blockquote>';continue;
    }
    // lists
    if(/^\s*[-*+]\s+/.test(line)){
      var ul=[];while(i<lines.length&&/^\s*[-*+]\s+/.test(lines[i])){ul.push(lines[i].replace(/^\s*[-*+]\s+/,''));i++;}
      flushList('ul',ul);continue;
    }
    if(/^\s*\d+[.)]\s+/.test(line)){
      var ol=[];while(i<lines.length&&/^\s*\d+[.)]\s+/.test(lines[i])){ol.push(lines[i].replace(/^\s*\d+[.)]\s+/,''));i++;}
      flushList('ol',ol);continue;
    }
    // paragraph
    if(!line.trim()){i++;continue;}
    var para=[];
    while(i<lines.length&&lines[i].trim()&&!/^\s*(```|#{1,4}\s|>|[-*+]\s|\d+[.)]\s|\|)/.test(lines[i])){para.push(lines[i]);i++;}
    html+='<p dir="auto">'+para.map(function(x){return safeInline(x);}).join('<br>')+'</p>';
  }
  return html;
}

function wireCopy(root){
  Array.prototype.forEach.call(root.querySelectorAll('.copy'),function(b){
    if(b.dataset.wired)return;b.dataset.wired='1';
    if(b.classList.contains('dl')){
      // download-as-file button on a code block
      b.addEventListener('click',function(){
        var code=decodeURIComponent(b.getAttribute('data-code'));
        var langN=b.getAttribute('data-lang')||'code';
        saveText(code,'setayesh-'+tstamp()+'.'+extFor(langN),'text/plain');
      });
      return;
    }
    b.addEventListener('click',function(){
      var code=decodeURIComponent(b.getAttribute('data-code'));
      var done=function(){var s=b.querySelector('span');var old=s.textContent;s.textContent=t('copied');
        b.classList.add('done');setTimeout(function(){s.textContent=old;b.classList.remove('done');},1400);};
      if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(code).then(done,function(){});}
      else{var ta=el('textarea');ta.value=code;ta.style.position='fixed';ta.style.opacity='0';
        document.body.appendChild(ta);ta.select();try{document.execCommand('copy');done();}catch(e){}document.body.removeChild(ta);}
    });
  });
}

/* ================= auth ================= */
function authHeaders(extra){var h={Authorization:'Bearer '+token};if(extra)for(var k in extra)h[k]=extra[k];return h;}

async function doLogin(){
  var u=$('uField').value.trim(),p=$('pField').value;
  if(!u||!p){$('loginNote').textContent=t('fillCreds');return;}
  $('loginBtn').disabled=true;$('loginNote').textContent='';
  try{
    var remember=$('rememberDev')?$('rememberDev').checked:true;
    var r=await fetch('/api/login',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({username:u,password:p,remember:remember,deviceId:deviceId()})});
    if(r.status===429){$('loginNote').textContent=t('tooManyLogin');return;}
    if(!r.ok){$('loginNote').textContent=t('badCreds');return;}
    var d=await r.json();
    token=d.token;currentUsername=d.username||u;
    // Store the device secret so this device signs itself in next time.
    try{
      if(d.deviceSecret)localStorage.setItem('setayesh.devsecret',d.deviceSecret);
      else if(!remember)localStorage.removeItem('setayesh.devsecret');
    }catch(e){}
    // stay signed in on this device (remember me)
    try{localStorage.setItem(TOKEN_KEY,token);localStorage.setItem(USER_KEY,currentUsername);localStorage.setItem('setayesh.lastuser',currentUsername);}catch(e){}
    sessionStorage.setItem(TOKEN_KEY,token);sessionStorage.setItem(USER_KEY,currentUsername);
    await enterApp();
  }catch(e){$('loginNote').textContent=t('noConnect');}
  finally{$('loginBtn').disabled=false;}
}

async function doLogout(){
  try{await fetch('/api/logout',{method:'POST',headers:authHeaders()});}catch(e){}
  token=null;currentUsername='';chats=[];activeChat=null;pendingFiles=[];
  sessionStorage.removeItem(TOKEN_KEY);sessionStorage.removeItem(USER_KEY);
  // Logging out must also drop the device trust — otherwise the next page
  // load would sign straight back in and "log out" would mean nothing.
  try{localStorage.removeItem(TOKEN_KEY);localStorage.removeItem(USER_KEY);
      localStorage.removeItem('setayesh.devsecret');}catch(e){}
  $('appView').classList.remove('on');$('loginView').style.display='flex';$('pField').value='';
  try{var lu=localStorage.getItem('setayesh.lastuser');if(lu){$('uField').value=lu;$('pField').focus();}}catch(e){}
}

/* ================= config / engines ================= */
function allModelOptions(){
  var out=[];
  if(!CFG)return out;
  // Display order: GPT (Groq) first, Gemini moved toward the bottom.
  var ORDER={groq:0,openai:1,openrouter:2,cerebras:3,mistral:4,anthropic:5,local:6,gemini:9};
  var provs=CFG.providers.slice().sort(function(a,b){
    return (ORDER[a.id]==null?7:ORDER[a.id])-(ORDER[b.id]==null?7:ORDER[b.id]);
  });
  provs.forEach(function(p){
    if(!p.configured)return;
    p.models.forEach(function(m){out.push({provider:p.id,providerLabel:p.label,model:m.id,label:m.label,free:p.free,best:m.best});});
  });
  return out;
}

function buildModelPicker(){
  var sel=$('modelPicker');sel.innerHTML='';
  var opts=allModelOptions();
  if(!opts.length){
    var o=el('option','',t('noModels'));o.disabled=true;o.selected=true;sel.appendChild(o);return;
  }
  var byProv={};
  opts.forEach(function(o){(byProv[o.providerLabel]=byProv[o.providerLabel]||[]).push(o);});
  Object.keys(byProv).forEach(function(pl){
    var g=document.createElement('optgroup');g.label=pl;
    byProv[pl].forEach(function(o){
      var opt=el('option','',o.label+(o.best==='code'?'  ‹code›':''));
      opt.value=o.provider+'|'+o.model;
      g.appendChild(opt);
    });
    sel.appendChild(g);
  });
  var want=provider+'|'+model;
  if(opts.some(function(o){return o.provider+'|'+o.model===want;}))sel.value=want;
  else{provider=opts[0].provider;model=opts[0].model;sel.value=provider+'|'+model;}
  updateEngineTag();
}

function updateEngineTag(){
  var opts=allModelOptions();
  var cur=opts.filter(function(o){return o.provider===provider&&o.model===model;})[0];
  $('engineTagText').textContent=cur?cur.model:t('noModels');
  $('engineTag').className='tag'+(cur&&cur.free?' free':'');
}

function buildCompareChips(){
  var box=$('cmpChips');box.innerHTML='';
  allModelOptions().forEach(function(o){
    var key=o.provider+'|'+o.model;
    var c=el('button','mchip',o.model);c.type='button';
    if(compareTargets.indexOf(key)>=0)c.classList.add('on');
    c.addEventListener('click',function(){
      var at=compareTargets.indexOf(key);
      if(at>=0)compareTargets.splice(at,1);
      else{if(compareTargets.length>=3)return;compareTargets.push(key);}
      buildCompareChips();
    });
    box.appendChild(c);
  });
}

function buildModes(){
  var list=$('modeList');list.innerHTML='';
  var icons={
    chat:'<path d="M21 11.5a8.4 8.4 0 01-9 8.4 8.4 8.4 0 01-3.8-.9L3 21l1.9-5.2A8.4 8.4 0 013 11.5a8.4 8.4 0 019-8.4 8.4 8.4 0 019 8.4z"/>',
    code:'<path d="M16 18l6-6-6-6M8 6l-6 6 6 6"/>',
    shield:'<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/>',
    blocks:'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>'
  };
  (CFG?CFG.modes:[]).forEach(function(m,idx){
    var b=el('button','mode-btn'+(m.id===mode?' on':''));b.type='button';
    b.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+
      (icons[m.icon]||icons.chat)+'</svg><span>'+t('m_'+m.id)+'</span><span class="kbd">'+(idx+1)+'</span>';
    b.addEventListener('click',function(){setMode(m.id);});
    list.appendChild(b);
  });
}

function setMode(id){
  // Keep the collapsed mode label in step with what is selected.
  var mc=document.getElementById('modeCurrent');
  if(mc)mc.textContent=t('m_'+id)||id;
  mode=id;
  if(activeChat)activeChat.mode=id;
  buildModes();
  $('modeTitle').textContent=t('m_'+id);
  $('modeSub').textContent=t('s_'+id);
}

function renderKeyList(){
  var box=$('keyList');box.innerHTML='';
  (CFG?CFG.providers:[]).forEach(function(p){
    var row=el('div','keyrow');
    row.appendChild(el('span','kn',p.label));
    row.appendChild(el('span','kst '+(p.configured?'yes':'no'),p.configured?t('connected'):t('notConnected')));
    box.appendChild(row);
  });
}

/* ================= chats ================= */
function newChat(){
  var c={id:Date.now()+'-'+Math.random().toString(36).slice(2),title:'',mode:mode,messages:[],history:[]};
  chats.unshift(c);activeChat=c;renderChatList();renderThread();saveChats();
  return c;
}
function renderChatList(){
  var box=$('chatList');box.innerHTML='';
  chats.forEach(function(c){
    var it=el('div','chat-item'+(activeChat&&c.id===activeChat.id?' on':''));
    it.appendChild(el('span','t',c.title||t('newChat')));
    var x=el('button','x','×');x.type='button';
    x.addEventListener('click',function(ev){
      ev.stopPropagation();
      chats=chats.filter(function(o){return o.id!==c.id;});
      if(activeChat&&activeChat.id===c.id)activeChat=chats[0]||null;
      if(!activeChat)newChat();else{renderChatList();renderThread();}
      saveChats();
    });
    it.appendChild(x);
    it.addEventListener('click',function(){activeChat=c;setMode(c.mode||'chat');renderChatList();renderThread();closeSidebar();});
    box.appendChild(it);
  });
}

/* ===== chat memory: keep each user's conversations (per browser, ~30 days) ===== */
function chatsKey(){return 'setayesh.chats.'+(currentUsername||'default');}
function saveChats(){
  try{
    var slim=chats.slice(0,25).map(function(c){
      return {id:c.id,title:c.title,mode:c.mode,history:(c.history||[]).slice(-24),
        messages:(c.messages||[]).slice(-60).map(function(m){
          return {role:m.role,text:m.text,error:m.error,model:m.model,elapsedMs:m.elapsedMs,files:m.files,compare:m.compare,
            image:(m.image&&m.image.indexOf('data:')!==0)?m.image:''};
        })};
    });
    localStorage.setItem(chatsKey(),JSON.stringify({t:Date.now(),chats:slim}));
  }catch(e){}
}
function loadChats(){
  try{
    var raw=JSON.parse(localStorage.getItem(chatsKey())||'null');
    if(raw&&raw.chats&&(Date.now()-(raw.t||0))<30*864e5){chats=raw.chats;}else{chats=[];}
  }catch(e){chats=[];}
  activeChat=chats[0]||null;
}

/* time-based greeting with the member's name */
function greetKey(){var h=(new Date()).getHours();return h<5?'greetNight':h<12?'greetMorning':h<18?'greetAfter':'greetNight';}
function greetingText(){return t(greetKey())+(currentUsername?' '+currentUsername:'');}

/* animated per-member avatar — a unique orbiting-particle badge derived from the name */
function hashStr(s){var h=2166136261;s=s||'?';for(var i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
var AVATARS=[];
function makeAvatar(username,size){
  var d=Math.min(window.devicePixelRatio||1,2);
  var cv=document.createElement('canvas');
  cv.width=size*d;cv.height=size*d;cv.style.width=size+'px';cv.style.height=size+'px';
  cv.style.borderRadius='30%';cv.style.display='block';
  var c=cv.getContext('2d');c.scale(d,d);
  var hsh=hashStr(username);
  AVATARS.push({cv:cv,ctx:c,size:size,hue:hsh%360,dots:3+((hsh>>4)%4),spd:0.5+((hsh>>8)%80)/100,seed:(hsh%628)/100});
  if(AVATARS.length>16)AVATARS.shift();
  return cv;
}
var _at=0;
function avatarFrame(){
  _at+=0.02;
  for(var i=0;i<AVATARS.length;i++){
    var a=AVATARS[i];
    if(!a.cv.isConnected){AVATARS.splice(i,1);i--;continue;}
    var s=a.size,c=a.ctx,cx=s/2,cy=s/2;
    c.clearRect(0,0,s,s);
    var g=c.createRadialGradient(cx*0.7,cy*0.7,1,cx,cy,s*0.62);
    g.addColorStop(0,'hsl('+a.hue+',85%,58%)');
    g.addColorStop(1,'hsl('+((a.hue+45)%360)+',85%,24%)');
    c.fillStyle=g;c.beginPath();c.arc(cx,cy,s/2,0,6.283);c.fill();
    var pr=s*0.15*(1+0.2*Math.sin(_at*2+a.seed));
    c.fillStyle='rgba(255,255,255,.92)';c.beginPath();c.arc(cx,cy,pr,0,6.283);c.fill();
    for(var k=0;k<a.dots;k++){
      var ang=_at*a.spd+a.seed+k*(6.283/a.dots);
      var ox=cx+Math.cos(ang)*s*0.32, oy=cy+Math.sin(ang)*s*0.32;
      c.fillStyle='rgba(255,255,255,.85)';c.beginPath();c.arc(ox,oy,s*0.055,0,6.283);c.fill();
    }
  }
  requestAnimationFrame(avatarFrame);
}
requestAnimationFrame(avatarFrame);
function setAvatarInto(elm,username,size){ if(!elm)return; elm.textContent=''; elm.style.background='transparent'; elm.style.border='none'; elm.appendChild(makeAvatar(username,size)); }

// Age-appropriate motivational + learning lines (English). Younger set for Fardin (~8),
// older set for Setayesh (~11–12). A fresh one shows each time, never repeating twice in a row.
var QUOTES_YOUNG=[
  'Every day you learn something new and become a little smarter! ⭐',
  'Mistakes help your brain grow — keep trying!',
  'Reading is like a superpower. Read a little every day! 📚',
  'You can do hard things, one small step at a time.',
  'Be curious and ask lots of questions — that is how we learn!',
  'Practice a little each day and you will get better and better.',
  'Kind kids and curious kids grow into amazing people! 🌟',
  'Counting, reading, drawing — every skill starts small.',
  'Your brain loves to learn. Give it something fun today!',
  'Try, learn, smile, repeat — you are doing great!',
  'Big adventures start with tiny brave steps. 🚀',
  'Every question you ask makes you smarter.'
];
var QUOTES_OLDER=[
  'Every expert was once a beginner — keep going!',
  'Mistakes are proof that you are trying and learning.',
  'A little progress each day adds up to big results.',
  'Curiosity is a superpower. Ask lots of questions!',
  'Your brain grows stronger every time you learn something new.',
  'Reading a few pages a day builds a big, bright mind.',
  'Focus on understanding, not just memorizing.',
  'Believe in yourself; you can learn anything step by step.',
  'Discipline today creates freedom tomorrow.',
  'The more you learn, the more amazing things you can do.',
  'Be brave enough to try, and patient enough to learn.',
  'Today is a new page — write something wonderful on it.',
  'Hard things become easy with steady practice.',
  'Learn one thing well, then build the next on top of it.',
  'Kindness and curiosity make you smarter and stronger.',
  'You are capable of amazing things when you keep trying.'
];
function isKidUser(){var u=(currentUsername||'').toLowerCase();return u==='fardin'||u==='setayesh';}
// pick a random item from arr that isn't the same as last (tracked per key in localStorage)
function freshPick(arr,key){
  if(!arr||!arr.length)return '';
  if(arr.length===1)return arr[0];
  var last=-1; try{last=parseInt(localStorage.getItem(key),10);}catch(e){}
  var i; do{i=Math.floor(Math.random()*arr.length);}while(i===last);
  try{localStorage.setItem(key,i);}catch(e){}
  return arr[i];
}
function kidQuote(){
  var u=(currentUsername||'').toLowerCase();
  var arr=u==='fardin'?QUOTES_YOUNG:QUOTES_OLDER;
  return freshPick(arr,'setayesh.quoteIdx.'+u);
}

// A warm note from Baba, shown to each child on their welcome screen.
var DAD_NOTES={
  setayesh:[
    'ستایش عزیزم، بابا این رو با تمام عشقش برای تو ساخته 💙',
    'ستایش جان، تو باهوش و مهربونی و بابا بهت خیلی افتخار می‌کنه 🌸',
    'دخترِ گلِ بابا، هر چی خواستی از ستایش بپرس — من همیشه کنارتم 💫',
    'ستایش نازنینم، بابا برات بهترین رو می‌خواد؛ این هدیه‌ی منه به تو 🎁'
  ],
  fardin:[
    'فردینِ قهرمانِ بابا! این رو با عشق برات ساختم 💙',
    'فردین جان، بابا خیلی خیلی دوستت داره 🚀',
    'پسرِ گلِ بابا، هر سوالی داشتی بپرس — با هم یاد می‌گیریم ⭐',
    'فردین عزیزم، تو می‌تونی هر کاری بکنی؛ بابا بهت ایمان داره 🌟'
  ]
};
function dadNote(){var u=(currentUsername||'').toLowerCase();return freshPick(DAD_NOTES[u],'setayesh.dadIdx.'+u);}

function welcomeNode(){
  var w=el('div','welcome');
  var note=dadNote();
  var dad=note?'<div class="dadnote">'+esc(note)+'</div>':'';
  var kid=isKidUser()?'<div class="kidquote">🌟 '+esc(kidQuote())+'</div>':'';
  w.innerHTML='<div class="halo"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+
    '<path d="M12 2l2.4 6.2L21 10l-5.2 4 1.5 6.6L12 17l-5.3 3.6L8.2 14 3 10l6.6-1.8z"/></svg></div>'+
    '<div class="greet"><span class="gav"></span><span class="gtext">'+esc(greetingText())+'</span></div>'+
    '<p class="wsub">'+esc(t('w_ask'))+'</p>'+dad+kid;
  setAvatarInto(w.querySelector('.gav'), currentUsername, 50);
  return w;
}

function renderThread(){
  var th=$('thread');th.innerHTML='';
  if(!activeChat||!activeChat.messages.length){th.appendChild(welcomeNode());return;}
  activeChat.messages.forEach(function(m){th.appendChild(messageNode(m));});
  wireCopy(th);
  requestAnimationFrame(function(){$('scroll').scrollTop=$('scroll').scrollHeight;});
}

function messageNode(m){
  var wrap=el('div','msg '+(m.role==='user'?'user':'ai'));
  var ava=el('div','ava');
  if(m.role==='user')ava.textContent=(currentUsername||'?').slice(0,1).toUpperCase();
  else ava.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l2.4 6.2L21 10l-5.2 4 1.5 6.6L12 17l-5.3 3.6L8.2 14 3 10l6.6-1.8z"/></svg>';
  wrap.appendChild(ava);

  var body=el('div','body');
  var meta=el('div','meta');
  meta.appendChild(el('span','name',m.role==='user'?t('you'):'Setayesh'));
  if(m.model)meta.appendChild(el('span','stamp',m.model+(m.elapsedMs?' · '+(m.elapsedMs/1000).toFixed(1)+'s':'')));
  if(m.role!=='user'&&!m.error&&!m.compare&&m.text){
    meta.appendChild(makeSaveBtn(function(){return m.text;}));
    meta.appendChild(makeShareBtn(function(){return m.text;}));
  }
  body.appendChild(meta);

  if(m.files&&m.files.length){
    var fr=el('div','filetag-row');fr.style.cssText='display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px';
    m.files.forEach(function(f){
      var tag=el('span','pf');tag.style.maxWidth='none';
      tag.innerHTML='<span class="ic">📎</span><span class="n">'+esc(f)+'</span>';
      fr.appendChild(tag);
    });
    body.appendChild(fr);
  }

  var content=el('div','content');
  if(m.error)content.innerHTML='<div class="errbox">'+esc(m.error)+'</div>';
  else if(m.compare)content.appendChild(compareNode(m.compare));
  else if(m.role==='user')content.textContent=m.text;
  else content.innerHTML=renderMarkdown(m.text);
  if(m.image){
    var im2=document.createElement('img');im2.src=m.image;im2.alt='';
    im2.style.cssText='max-width:100%;border-radius:14px;margin-top:10px;display:block';
    var dl2=document.createElement('a');dl2.href=m.image;dl2.download='setayesh-image.png';
    dl2.className='btn ghost';dl2.textContent='دانلود تصویر';dl2.style.cssText='margin-top:8px;display:inline-block;text-decoration:none';
    content.appendChild(im2);content.appendChild(dl2);
  }
  body.appendChild(content);
  wrap.appendChild(body);
  return wrap;
}

function compareNode(results){
  var box=el('div','cmp');
  results.forEach(function(r){
    var card=el('div','cmp-card');
    var head=el('div','cmp-head');
    head.appendChild(el('span','n',r.providerLabel||r.provider||'—'));
    head.appendChild(el('span','m',r.model||''));
    if(r.elapsedMs)head.appendChild(el('span','ms',(r.elapsedMs/1000).toFixed(1)+'s'));
    card.appendChild(head);
    var b=el('div','cmp-body'+(r.error?' err':''));
    if(r.error)b.textContent=r.error;else b.innerHTML=renderMarkdown(r.reply||'');
    card.appendChild(b);
    box.appendChild(card);
  });
  return box;
}

/* ================= sending ================= */
function kindOf(f){
  if(f.type.indexOf('image/')===0)return 'image';
  if(f.type==='application/pdf'||/\.pdf$/i.test(f.name))return 'pdf';
  return 'text';
}
// Smart routing: if a file that only Gemini can read (image/PDF) is attached,
// switch the engine to Gemini automatically so it "just works".
function autoEngineForFiles(){
  var needs=pendingFiles.some(function(pf){var k=kindOf(pf.file);return k==='image'||k==='pdf';});
  if(!needs||provider==='gemini')return false;
  var gem=allModelOptions().filter(function(o){return o.provider==='gemini';})[0];
  if(!gem)return false;
  provider='gemini';model=gem.model;
  var sel=$('modelPicker');if(sel)sel.value='gemini|'+model;
  updateEngineTag();
  return true;
}
function renderPending(){
  var box=$('pending');box.innerHTML='';
  if(!pendingFiles.length){box.style.display='none';return;}
  box.style.display='flex';
  var switched=autoEngineForFiles();
  if(switched){
    var note=el('div','pf');note.style.cssText='background:rgba(34,211,238,.12);border-color:rgba(34,211,238,.35);color:#7ee7f5';
    note.textContent='✨ '+t('autoGemini');
    box.appendChild(note);
  }
  pendingFiles.forEach(function(pf){
    var chip=el('div','pf');var k=kindOf(pf.file);
    if(k==='image'){var img=document.createElement('img');img.src=URL.createObjectURL(pf.file);chip.appendChild(img);}
    else chip.appendChild(el('span','ic',k==='pdf'?'📄':'📝'));
    chip.appendChild(el('span','n',pf.file.name));
    var x=el('button','','✕');x.type='button';
    x.addEventListener('click',function(){pendingFiles=pendingFiles.filter(function(o){return o.id!==pf.id;});renderPending();});
    chip.appendChild(x);
    box.appendChild(chip);
  });
}

function pushMessage(m){
  if(!activeChat)newChat();
  activeChat.messages.push(m);
  var th=$('thread');
  if(activeChat.messages.length===1)th.innerHTML='';
  var node=messageNode(m);
  th.appendChild(node);
  wireCopy(node);
  $('scroll').scrollTop=$('scroll').scrollHeight;
  return node;
}

async function send(){
  if(busy)return;
  var text=$('msgBox').value.trim();
  if(!text&&!pendingFiles.length)return;

  // Offline: hold the message on the phone instead of failing. Files can't be
  // queued (they'd have to be serialised and could be large), so say so
  // plainly rather than silently dropping them.
  if(!navigator.onLine){
    if(pendingFiles.length){
      pushMessage({role:'assistant',error:'آفلاین هستی — پیام متنی در صف می‌ماند، ولی فایل را باید بعد از وصل شدن بفرستی.'});
      return;
    }
    outboxAdd({text:text,mode:mode,at:Date.now()});
    if(!activeChat)newChat();
    activeChat.msgs.push({role:'user',text:text,files:[],queued:true});
    saveChats();renderThread();
    $('msgBox').value='';autoGrow();
    return;
  }
  if(compareOn&&!compareTargets.length){
    pushMessage({role:'assistant',error:t('pickCompare')});return;
  }
  if(!activeChat)newChat();
  if(!activeChat.title)
    { activeChat.title=(text||pendingFiles.map(function(p){return p.file.name;}).join(', ')).slice(0,42); renderChatList(); }

  var files=pendingFiles.map(function(p){return p.file;});
  var names=files.map(function(f){return f.name;});
  $('msgBox').value='';autoGrow();pendingFiles=[];renderPending();
  busy=true;$('sendBtn').disabled=true;

  pushMessage({role:'user',text:text,files:names});

  var holder=pushMessage({role:'assistant',text:''});
  var slot=holder.querySelector('.content');
  slot.innerHTML='<span class="dots3"><i></i><i></i><i></i></span>';

  try{
    if(compareOn){
      var r=await fetch('/api/compare',{method:'POST',headers:authHeaders({'Content-Type':'application/json'}),
        body:JSON.stringify({message:text,history:activeChat.history,mode:mode,
          targets:compareTargets.map(function(k){var s=k.split('|');return {provider:s[0],model:s[1]};})})});
      if(!(await handleStatus(r,slot)))return;
      var d=await r.json();
      var last=activeChat.messages[activeChat.messages.length-1];
      last.compare=d.results;
      slot.innerHTML='';slot.appendChild(compareNode(d.results));
      wireCopy(slot);
      var first=d.results.filter(function(x){return x.reply;})[0];
      if(first){activeChat.history.push({role:'user',content:text});activeChat.history.push({role:'assistant',content:first.reply});}
    }else{
      var form=new FormData();
      form.append('message',text);
      form.append('history',JSON.stringify(activeChat.history));
      form.append('mode',mode);
      form.append('provider',provider);
      form.append('model',model);
      form.append('search',searchOn?'true':'false');
      files.forEach(function(f){form.append('files',f);});
      var r2=await fetch('/api/chat',{method:'POST',headers:authHeaders(),body:form});
      if(!(await handleStatus(r2,slot)))return;
      var d2=await r2.json();
      var last2=activeChat.messages[activeChat.messages.length-1];
      last2.text=d2.reply;last2.model=d2.model;last2.elapsedMs=d2.elapsedMs;last2.image=d2.image||'';
      slot.innerHTML=renderMarkdown(d2.reply);
      // A finished file is ready to download.
      if(d2.download){
        var dl=document.createElement('a');
        dl.href=d2.download.url; dl.download=d2.download.name;
        dl.style.cssText='display:inline-flex;align-items:center;gap:8px;margin-top:12px;padding:10px 16px;'+
          'border-radius:12px;background:rgba(56,189,248,.14);border:1px solid rgba(56,189,248,.45);'+
          'color:var(--cyan);text-decoration:none;font-size:13px;font-weight:600';
        dl.textContent='⬇  '+d2.download.name;
        slot.appendChild(dl);
      }
      // A commitment was heard — offer to remember it.
      if(d2.taskSuggestion){ slot.appendChild(taskChip(d2.taskSuggestion)); }
      // Privacy shield: something sensitive was stripped before sending.
      if(d2.privacyWarning){
        var pw=document.createElement('div');
        var sev=d2.privacyWarning.severe;
        pw.style.cssText='margin-top:10px;padding:10px 12px;border-radius:12px;font-size:12.5px;line-height:1.7;'+
          (sev?'background:rgba(251,113,133,.12);border:1px solid rgba(251,113,133,.45);color:#fb7185'
              :'background:rgba(251,191,36,.10);border:1px solid rgba(251,191,36,.35);color:#fbbf24');
        pw.textContent=(sev?'🛑 ':'⚠️ ')+'برای محافظت، این موارد قبل از ارسال حذف شدند: '+
          d2.privacyWarning.labels.join('، ')+'. بقیه‌ی پیام ارسال شد و جواب بالا بر همان اساس است.';
        slot.appendChild(pw);
      }
      speakText(d2.reply);
      if(d2.image){
        var im=document.createElement('img');im.src=d2.image;im.alt='';
        im.style.cssText='max-width:100%;border-radius:14px;margin-top:10px;display:block';
        var dl=document.createElement('a');dl.href=d2.image;dl.download='setayesh-image.png';
        dl.className='btn ghost';dl.textContent='دانلود تصویر';dl.style.cssText='margin-top:8px;display:inline-block;text-decoration:none';
        slot.appendChild(im);slot.appendChild(dl);
      }
      wireCopy(slot);
      var meta=holder.querySelector('.meta');
      if(meta&&!meta.querySelector('.stamp'))
        meta.appendChild(el('span','stamp',d2.model+' · '+(d2.elapsedMs/1000).toFixed(1)+'s'));
      if(meta&&!meta.querySelector('.msgsave')&&d2.reply)
        meta.appendChild(makeSaveBtn(function(){return last2.text;}));
        meta.appendChild(makeShareBtn(function(){return last2.text;}));
      activeChat.history.push({role:'user',content:d2.historyText||text});
      activeChat.history.push({role:'assistant',content:d2.reply});
    }
    if(activeChat.history.length>24)activeChat.history=activeChat.history.slice(-24);
  }catch(e){
    setErr(slot,t('connFailed'));
  }finally{
    busy=false;$('sendBtn').disabled=false;
    $('scroll').scrollTop=$('scroll').scrollHeight;
    $('msgBox').focus();
    saveChats();
  }
}

function setErr(slot,msg){
  var last=activeChat.messages[activeChat.messages.length-1];
  if(last)last.error=msg;
  slot.innerHTML='<div class="errbox">'+esc(msg)+'</div>';
}

async function handleStatus(r,slot){
  if(r.ok)return true;
  if(r.status===401){
    slot.innerHTML='';
    $('appView').classList.remove('on');$('loginView').style.display='flex';
    $('loginNote').textContent=t('sessionExpired');
    return false;
  }
  var body=null;try{body=await r.json();}catch(e){}
  var msg=(body&&body.error)?body.error:
    (r.status===429?t('tooManyChat'):r.status===503?t('aiNotConfigured'):t('genericError'));
  setErr(slot,msg);
  return false;
}

/* ================= settings ================= */
/* ---- themes ---- */
var THEMES=[
  {id:'violet',c:'linear-gradient(135deg,#7b5cff,#22d3ee)'},
  {id:'cyber', c:'linear-gradient(135deg,#2b8cff,#22e6ff)'},
  {id:'matrix',c:'linear-gradient(135deg,#22d38a,#a3e635)'},
  {id:'sunset',c:'linear-gradient(135deg,#fb923c,#f472b6)'}
];
function themeKey(){return 'setayesh.theme.'+(currentUsername||'default');}
function applyTheme(id){
  if(id&&id!=='violet')document.documentElement.setAttribute('data-theme',id);
  else document.documentElement.removeAttribute('data-theme');
  try{localStorage.setItem(themeKey(),id||'violet');}catch(e){}
  renderThemePicker(id||'violet');
}
function loadTheme(){var id='cyber';try{id=localStorage.getItem(themeKey())||'cyber';}catch(e){}applyTheme(id);}
function renderThemePicker(active){
  var box=$('themePicker');if(!box)return;box.innerHTML='';
  THEMES.forEach(function(th){
    var s=el('button','swatch'+(th.id===active?' on':''));s.type='button';s.style.background=th.c;
    s.title=t('th_'+th.id);
    s.addEventListener('click',function(){applyTheme(th.id);});
    box.appendChild(s);
  });
}

function guideHtml(){
  return '<p style="margin:0 0 4px">'+t('gIntro')+'</p>'+
    '<div class="grow"><span class="gi">💬</span><div><b>'+t('gBeginner')+'</b><br>'+t('gBeginnerD')+'</div></div>'+
    '<div class="grow"><span class="gi">👨‍💻</span><div><b>'+t('gCode')+'</b><br>'+t('gCodeD')+'</div></div>'+
    '<div><b>'+t('gMore')+'</b><ul>'+
      '<li>📎 '+t('gFiles')+'</li>'+
      '<li>🖼️ '+t('gImage')+'</li>'+
      '<li>💾 '+t('gExport')+'</li>'+
      '<li>⚡ '+t('gEngines')+'</li>'+
    '</ul></div>'+
    '<div class="ghow">'+t('gHow')+'</div>';
}
function applyTextSize(sz){
  sz=(sz==='small'||sz==='large')?sz:'medium';
  document.documentElement.setAttribute('data-textsize',sz);
  try{localStorage.setItem('setayesh.textsize',sz);}catch(e){}
  Array.prototype.forEach.call(document.querySelectorAll('#textSizeRow .seg'),function(b){
    b.classList.toggle('on',b.getAttribute('data-size')===sz);
  });
}
function loadTextSize(){
  var sz='medium';try{sz=localStorage.getItem('setayesh.textsize')||'medium';}catch(e){}
  applyTextSize(sz);
}
function clearAllChats(){
  if(!confirm(t('clearChatsConfirm')))return;
  chats=[];activeChat=null;
  newChat();renderChatList();renderThread();
  closeSettings();closeSidebar();
}
function openSettings(){
  $('curPassField').value='';$('newPassField').value='';$('confirmPassField').value='';
  $('settingsNote').textContent='';$('settingsNote').className='note';
  $('modalUserLine').textContent=t('accountLine').replace('{u}',currentUsername);
  $('guideBox').innerHTML=guideHtml();
  applyTextSize(document.documentElement.getAttribute('data-textsize')||'medium');
  // code libraries (admin only)
  if(CFG&&CFG.isAdmin){
    $('codeLibBox').style.display='';$('codeLibNote').textContent='';
    codeLibRefresh();
  } else { $('codeLibBox').style.display='none'; }
  renderThemePicker(document.documentElement.getAttribute('data-theme')||'violet');
  renderKeyList();
  $('settingsOverlay').classList.add('on');
}
function closeSettings(){$('settingsOverlay').classList.remove('on');}

async function saveNewPassword(){
  var cur=$('curPassField').value,nw=$('newPassField').value,cf=$('confirmPassField').value;
  var note=$('settingsNote');note.className='note';
  if(!cur||!nw||!cf){note.textContent=t('fillAllPass');return;}
  if(nw.length<6){note.textContent=t('passTooShort');return;}
  if(nw!==cf){note.textContent=t('passMismatch');return;}
  $('settingsSave').disabled=true;
  try{
    var r=await fetch('/api/change-password',{method:'POST',headers:authHeaders({'Content-Type':'application/json'}),
      body:JSON.stringify({currentPassword:cur,newPassword:nw})});
    if(r.status===401){note.textContent=t('passWrong');return;}
    if(r.status===429){note.textContent=t('tooManyChat');return;}
    if(!r.ok){note.textContent=t('genericError');return;}
    note.className='note ok';note.textContent=t('passChanged');
    $('curPassField').value='';$('newPassField').value='';$('confirmPassField').value='';
  }catch(e){note.textContent=t('connFailed');}
  finally{$('settingsSave').disabled=false;}
}

/* ================= language ================= */
function applyLang(){
  document.documentElement.lang=lang;
  document.documentElement.dir=LANG[lang].dir;
  var label=lang==='fa'?'EN':'FA';
  $('langBtn').textContent=label;$('langBtnLogin').textContent=label;
  document.querySelectorAll('[data-i18n]').forEach(function(e){e.textContent=t(e.getAttribute('data-i18n'));});
  document.querySelectorAll('[data-i18n-placeholder]').forEach(function(e){e.placeholder=t(e.getAttribute('data-i18n-placeholder'));});
  document.querySelectorAll('[data-i18n-arialabel]').forEach(function(e){e.setAttribute('aria-label',t(e.getAttribute('data-i18n-arialabel')));});
  $('hintLine').textContent=t('hint');
  if(CFG){buildModes();setMode(mode);buildModelPicker();buildCompareChips();renderChatList();renderThread();}
}

/* ================= ADMIN (account management) ================= */
function openAdmin(){
  $('adminNote').textContent='';$('adminNote').className='note';
  $('newUserName').value='';$('newUserPass').value='';$('newUserSafe').checked=false;
  $('adminOverlay').classList.add('on');
  loadAdminUsers();
}
function closeAdmin(){$('adminOverlay').classList.remove('on');}

async function adminFetch(path,opts){
  opts=opts||{};opts.headers=authHeaders(opts.headers||{});
  var r=await fetch(path,opts);
  if(r.status===401){closeAdmin();$('appView').classList.remove('on');$('loginView').style.display='flex';throw new Error('auth');}
  var d=null;try{d=await r.json();}catch(e){}
  if(!r.ok)throw new Error((d&&d.error)||t('genericError'));
  return d;
}

function loadAdminUsers(){
  var box=$('adminUserList');box.innerHTML='<div class="tk-hint"><span class="spin"></span></div>';
  adminFetch('/api/admin/users').then(function(d){
    box.innerHTML='';
    d.users.forEach(function(u){
      var card=el('div','tk-card');card.style.marginBottom='8px';
      var b=el('div','tk-card-b');
      var head=el('div');head.style.cssText='display:flex;align-items:center;gap:8px;margin-bottom:8px';
      var name=el('b','',u.username);name.style.fontSize='13.5px';
      head.appendChild(name);
      if(u.admin){var tag=el('span','',t('adminTag'));tag.style.cssText='font-family:var(--mono);font-size:9.5px;color:var(--cyan);border:1px solid rgba(34,211,238,.4);border-radius:5px;padding:1px 6px';head.appendChild(tag);}
      b.appendChild(head);

      var actions=el('div');actions.style.cssText='display:flex;flex-wrap:wrap;gap:6px;align-items:center';
      // safe toggle
      var safeLbl=el('label');safeLbl.style.cssText='display:flex;align-items:center;gap:6px;font-size:11.5px;color:var(--muted);cursor:pointer;margin-inline-end:auto';
      var safeCb=el('input');safeCb.type='checkbox';safeCb.checked=u.safe;
      safeCb.addEventListener('change',function(){
        adminFetch('/api/admin/safe',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:u.username,safe:safeCb.checked})})
          .catch(function(e){safeCb.checked=!safeCb.checked;$('adminNote').textContent=e.message;});
      });
      safeLbl.appendChild(safeCb);safeLbl.appendChild(el('span','',t('safeMode')));
      actions.appendChild(safeLbl);
      // reset password
      var rb=el('button','tk-btn',t('adminReset'));rb.style.cssText='padding:6px 11px;font-size:11.5px';
      rb.addEventListener('click',function(){
        var np=prompt(t('adminNewPassPrompt').replace('{u}',u.username));
        if(!np)return;
        adminFetch('/api/admin/reset',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:u.username,newPassword:np})})
          .then(function(){$('adminNote').className='note ok';$('adminNote').textContent=t('adminDone');})
          .catch(function(e){$('adminNote').className='note';$('adminNote').textContent=e.message;});
      });
      actions.appendChild(rb);
      // delete (not for admin/self)
      if(!u.admin){
        var db=el('button','tk-btn',t('adminDelete'));db.style.cssText='padding:6px 11px;font-size:11.5px;background:linear-gradient(135deg,#fb7185,#f43f5e);color:#fff';
        db.addEventListener('click',function(){
          if(!confirm(t('adminDelConfirm').replace('{u}',u.username)))return;
          adminFetch('/api/admin/delete',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:u.username})})
            .then(function(){loadAdminUsers();})
            .catch(function(e){$('adminNote').className='note';$('adminNote').textContent=e.message;});
        });
        actions.appendChild(db);
      }
      b.appendChild(actions);card.appendChild(b);box.appendChild(card);
    });
  }).catch(function(e){box.innerHTML='<div class="errbox">'+esc(e.message)+'</div>';});
}

function adminAddUser(){
  var name=$('newUserName').value.trim(),pass=$('newUserPass').value,safe=$('newUserSafe').checked;
  var note=$('adminNote');note.className='note';
  if(!name||!pass){note.textContent=t('fillAllPass');return;}
  $('adminAdd').disabled=true;
  adminFetch('/api/admin/users',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:name,password:pass,safe:safe})})
    .then(function(){$('newUserName').value='';$('newUserPass').value='';$('newUserSafe').checked=false;note.className='note ok';note.textContent=t('adminDone');loadAdminUsers();})
    .catch(function(e){note.className='note';note.textContent=e.message;})
    .then(function(){$('adminAdd').disabled=false;});
}

/* ================= misc ui ================= */
function autoGrow(){var b=$('msgBox');b.style.height='auto';b.style.height=Math.min(b.scrollHeight,190)+'px';}
function openSidebar(){$('sidebar').classList.add('open');$('scrim').classList.add('on');}
function closeSidebar(){$('sidebar').classList.remove('open');$('scrim').classList.remove('on');}

// Show the chat UI only AFTER the server confirms the token is valid.
// Previously the interface appeared first and the check ran afterwards, so a
// stale or tampered token briefly exposed the app — and if the check failed,
// the empty catch left the user sitting inside a broken session.
function showLogin(msg){
  $('appView').classList.remove('on');
  $('loginView').style.display='flex';
  $('pField').value='';
  if(msg){ var e=$('loginNote'); if(e){ e.textContent=msg; e.className='note err'; } }
  ['ccOverlay','learnOverlay','adminOverlay','settingsOverlay','toolkitOverlay','devicesOverlay']
    .forEach(function(id){ var e=$(id); if(e)e.classList.remove('on'); });
  var sh=$('sheet'); if(sh)sh.classList.remove('on');
  var ss=$('sheetScrim'); if(ss)ss.classList.remove('on');
  try{ localStorage.removeItem('setayesh.token'); }catch(err){}
  token='';
}

async function enterApp(){
  // Verify FIRST. Nothing is revealed until the server says this token is good.
  var r;
  try{
    r=await fetch('/api/config',{headers:authHeaders()});
  }catch(e){
    showLogin('اتصال به سرور برقرار نشد.');
    return;
  }
  if(!r.ok){
    showLogin(r.status===401?'نشست منقضی شده — دوباره وارد شو.':'خطای سرور.');
    return;
  }

  $('loginView').style.display='none';
  $('appView').classList.add('on');
  setAvatarInto($('avatar'),currentUsername,29);
  $('whoLine').textContent=currentUsername;
  loadTheme();
  try{
    {
      CFG=await r.json();
      provider=CFG.defaultProvider;model=CFG.defaultModel;
      // prefer Groq's free GPT-OSS as the default engine
      var pref=allModelOptions().filter(function(o){return o.provider==='groq'&&/gpt-oss/i.test(o.model);})[0]
             ||allModelOptions().filter(function(o){return o.provider==='groq';})[0];
      if(pref){provider=pref.provider;model=pref.model;}
      if(!CFG.modes.some(function(m){return m.id===mode;}))mode=CFG.modes[0].id;
      // Kids always start in English (helps them practice)
      if(isKidUser()&&lang!=='en'){lang='en';applyLang();}
      buildModes();setMode(mode);buildModelPicker();buildCompareChips();renderKeyList();
      $('adminBtn').style.display=CFG.isAdmin?'grid':'none';
      $('learnBtn').style.display=CFG.isAdmin?'grid':'none';
      $('ccBtn').style.display=CFG.isAdmin?'grid':'none';
      // The admin keeps the full interface — every tool where it was. Only
      // the family accounts get the stripped-back version, because they are
      // the ones who found it cluttered. Simplifying the owner's workspace
      // as well just took away tools he actually uses.
      // Duplication (two full menus on a phone) was never about who the
      // account belongs to — it happened on any narrow screen, admin
      // included, because the slide-in sidebar and the bottom drawer both
      // list every feature. So the de-duplication runs by SCREEN WIDTH,
      // matching the exact breakpoint the CSS itself switches on. Removing
      // features for children is a separate, content decision and stays
      // scoped to family accounts only.
      if(window.innerWidth<=860) tidySidebar();
      if(!CFG.isAdmin) simplifyForFamily();
      showVersion();
      if(CFG.isAdmin) startNotifications();
      removeDuplicateSettings();
      renderPhoneAccess();
      // Identify this device and let the server pick the right layout.
      registerDevice();
      renderOfflineBar(); flushOutbox();
      refreshBoardBadge();
    }
  }catch(e){}
  loadChats();renderChatList();
  if(!chats.length)newChat();else renderThread();
  $('msgBox').focus();
}

/* ================= events ================= */
$('loginBtn').addEventListener('click',doLogin);
$('uField').addEventListener('keydown',function(e){if(e.key==='Enter')$('pField').focus();});
$('pField').addEventListener('keydown',function(e){if(e.key==='Enter')doLogin();});
$('logoutBtn').addEventListener('click',doLogout);
$('sendBtn').addEventListener('click',send);
$('newChatBtn').addEventListener('click',function(){newChat();closeSidebar();$('msgBox').focus();});
$('burger').addEventListener('click',openSidebar);
$('scrim').addEventListener('click',closeSidebar);
$('settingsBtn').addEventListener('click',openSettings);
$('settingsBtnTop').addEventListener('click',function(){closeSidebar();openSettings();});
$('settingsX').addEventListener('click',closeSettings);
// Show the phone-access URLs (Tailscale / LAN) inside Settings.
function renderPhoneAccess(){
  var box=$('phoneAccessBox'),wrap=$('phoneUrls'); if(!box||!wrap)return;
  var urls=(CFG&&CFG.net)||[];
  if(!urls.length){box.style.display='none';return;}
  // put Tailscale (100.x) first — that's the one that works from outside
  urls=urls.slice().sort(function(a,b){var ta=/\/\/100\./.test(a)?0:1,tb=/\/\/100\./.test(b)?0:1;return ta-tb;});
  wrap.innerHTML='';
  urls.forEach(function(u){
    var row=document.createElement('div');
    row.style.cssText='display:flex;align-items:center;gap:8px;margin-bottom:7px';
    var tag=/\/\/100\./.test(u)?'<span style="font-family:var(--mono);font-size:9px;color:#7ee7c7;background:rgba(52,211,153,.12);border:1px solid rgba(52,211,153,.3);border-radius:99px;padding:2px 7px">Tailscale ⭐</span>':'';
    var code=document.createElement('code');
    code.textContent=u;code.style.cssText='flex:1;direction:ltr;text-align:left;font-size:12.5px;background:var(--panel2);border:1px solid var(--border);border-radius:8px;padding:7px 9px;overflow:auto';
    var cp=document.createElement('button');cp.className='btn ghost';cp.textContent='کپی';cp.style.cssText='margin-top:0;padding:6px 12px;flex-shrink:0';
    cp.addEventListener('click',function(){try{navigator.clipboard.writeText(u);cp.textContent='کپی شد ✓';setTimeout(function(){cp.textContent='کپی';},1400);}catch(e){}});
    row.innerHTML=tag;row.appendChild(code);row.appendChild(cp);
    wrap.appendChild(row);
  });
  box.style.display='';
}
$('settingsCancel').addEventListener('click',closeSettings);
/* ===== Daily briefing =====
   Shown once per day on the welcome screen. Built from local state only, so
   it appears instantly and says nothing when there is nothing to say — an
   assistant that manufactures updates to look busy is worse than silence. */
function briefingCard(b){
  if(!b||b.empty)return null;
  var box=el('div');
  box.style.cssText='max-width:620px;margin:0 auto 18px;padding:14px 16px;border-radius:15px;'+
    'background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.08);text-align:start';
  var h=el('div');
  h.style.cssText='font-size:13px;font-weight:600;margin-bottom:10px;color:var(--cyan)';
  h.textContent=b.greeting+' — این‌ها منتظرت هستند:';
  box.appendChild(h);

  b.items.forEach(function(it){
    var row=el('div');
    var color = it.urgency==='high' ? '#fb7185' : it.urgency==='low' ? 'var(--muted)' : 'var(--text)';
    row.style.cssText='display:flex;align-items:flex-start;gap:9px;padding:6px 0;font-size:12.8px;line-height:1.7;color:'+color;
    var icon=el('span'); icon.style.cssText='flex:0 0 auto;font-size:14px';
    var txt=el('span'); txt.style.flex='1';

    if(it.kind==='overdue'){
      icon.textContent='🔴';
      txt.textContent=it.text+'  — مهلتش '+it.daysLate+' روز گذشته ('+it.due+')';
    } else if(it.kind==='deadline'){
      icon.textContent=it.inDays<=2?'🟠':'🗓';
      txt.textContent=it.text+'  — '+(it.inDays===0?'مهلت امروز':(it.inDays+' روز مانده'))+' ('+it.due+')';
    } else if(it.kind==='board'){
      icon.textContent='💬';
      txt.textContent=it.count+' پیام خوانده‌نشده در تابلو از '+it.from.join('، ');
      row.style.cursor='pointer';
      row.addEventListener('click',openBoard);
    } else if(it.kind==='approvals'){
      icon.textContent='🧠';
      txt.textContent=it.count+' مورد یادگیری منتظر تأیید توست';
      row.style.cursor='pointer';
      row.addEventListener('click',openLearn);
    } else if(it.kind==='privacy'){
      icon.textContent='🛡';
      txt.textContent=it.count+' مورد اطلاعات حساس امروز جلویش گرفته شد';
    }
    row.appendChild(icon); row.appendChild(txt); box.appendChild(row);
  });
  return box;
}

function showBriefing(){
  // Once a day is enough; more than that is noise.
  var key='setayesh.briefing.'+new Date().toISOString().slice(0,10);
  try{ if(localStorage.getItem(key))return; }catch(e){}
  fetch('/api/briefing',{headers:authHeaders()})
    .then(function(r){return r.json();})
    .then(function(b){
      var card=briefingCard(b);
      if(!card)return;
      var w=document.querySelector('.welcome');
      if(w&&w.parentNode) w.parentNode.insertBefore(card,w.nextSibling);
      try{ localStorage.setItem(key,'1'); }catch(e){}
    }).catch(function(){});
}

/* ===== One-tap task capture =====
   When a message sounded like a commitment, offer to remember it. Offered,
   not saved: a wrong guess quietly filling someone's memory is worse than
   missing one. */
function taskChip(sug){
  var wrap=el('div');
  wrap.style.cssText='margin-top:10px;padding:9px 12px;border-radius:12px;font-size:12.5px;'+
    'background:rgba(52,211,153,.10);border:1px solid rgba(52,211,153,.32);'+
    'display:flex;align-items:center;gap:10px;flex-wrap:wrap';
  var t=el('span'); t.style.flex='1';
  t.textContent='📌 «'+sug.text+'»'+(sug.due?('  — '+sug.due):'');
  var yes=el('button','btn ghost'); yes.textContent='یادت باشه'; yes.style.padding='5px 12px';
  yes.addEventListener('click',function(){
    fetch('/api/memory',{method:'POST',headers:authHeaders({'Content-Type':'application/json'}),
      body:JSON.stringify({text:sug.text,kind:sug.due?'deadline':'fact',due:sug.due})})
      .then(function(){ t.textContent='✓ ذخیره شد'; yes.remove(); no.remove(); })
      .catch(function(){ t.textContent='ذخیره نشد'; });
  });
  var no=el('button','btn ghost'); no.textContent='نه'; no.style.padding='5px 12px';
  no.addEventListener('click',function(){ wrap.remove(); });
  wrap.appendChild(t); wrap.appendChild(yes); wrap.appendChild(no);
  return wrap;
}

/* ===== Auto-lock =====
   The realistic risk in a house is not someone guessing a password — it is a
   phone left unlocked on the table with an account already open. After a set
   idle period the session is dropped and the login screen returns.
   The device secret is kept, so signing back in is one tap, not a retype. */
var LOCK_MIN=0, lockTimer=null;
function resetLockTimer(){
  if(lockTimer)clearTimeout(lockTimer);
  if(!LOCK_MIN||!token)return;
  lockTimer=setTimeout(function(){
    // Drop the session only. The trusted-device secret survives, so the owner
    // of the phone gets straight back in and a stranger does not.
    token='';
    try{ localStorage.removeItem(TOKEN_KEY); }catch(e){}
    sessionStorage.removeItem(TOKEN_KEY);
    showLogin('برای امنیت، بعد از بی‌کاری قفل شد.');
  }, LOCK_MIN*60*1000);
}
function initAutoLock(){
  fetch('/api/lock-policy',{headers:authHeaders()})
    .then(function(r){return r.json();})
    .then(function(d){
      LOCK_MIN=Number(d.autoLockMinutes)||0;
      if(!LOCK_MIN)return;
      ['click','keydown','touchstart','scroll'].forEach(function(ev){
        document.addEventListener(ev,resetLockTimer,{passive:true});
      });
      document.addEventListener('visibilitychange',function(){ if(!document.hidden)resetLockTimer(); });
      resetLockTimer();
    }).catch(function(){});
}

/* ===== Family board =====
   One shared room. Everyone sees everything, which is exactly why it is
   simple: no private threads to police, no question of who may read whom. */
function boardNote(m,bad){ var n=$('boardNote'); if(!n)return; n.textContent=m||''; n.className='note'+(bad?' err':''); }

function openBoard(){
  boardNote('');
  $('boardOverlay').classList.add('on');
  if($('boardPinWrap')) $('boardPinWrap').style.display=(CFG&&CFG.isAdmin)?'flex':'none';
  if($('boardClearAll')) $('boardClearAll').style.display=(CFG&&CFG.isAdmin)?'':'none';
  if($('boardClearPinned')) $('boardClearPinned').style.display=(CFG&&CFG.isAdmin)?'':'none';
  loadBoard(true);
}
function closeBoard(){ $('boardOverlay').classList.remove('on'); }

function boardCard(m){
  var mine=(m.by===currentUsername);
  var isSystem=!!m.system;
  var row=el('div');
  row.style.cssText='display:flex;flex-direction:column;align-items:'+(mine?'flex-end':'flex-start')+';margin-bottom:10px';

  var who=el('div');
  who.style.cssText='font-size:11px;color:var(--muted);margin-bottom:3px;padding:0 4px';
  who.textContent=(m.pinned?'📌 ':'')+(isSystem?'ستایش (سیستم)':m.by)+' · '+new Date(m.at).toLocaleString();

  var bub=el('div');
  bub.style.cssText='max-width:82%;padding:9px 13px;border-radius:14px;font-size:13.5px;line-height:1.75;white-space:pre-wrap;word-break:break-word;'+
    (isSystem ? 'background:rgba(251,113,133,.10);border:1px solid rgba(251,113,133,.35);color:var(--text)'
     : m.pinned ? 'background:rgba(251,191,36,.12);border:1px solid rgba(251,191,36,.4);color:var(--text)'
     : mine ? 'background:rgba(56,189,248,.14);border:1px solid rgba(56,189,248,.3);color:var(--text)'
            : 'background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);color:var(--text)');
  if(m.text)bub.textContent=m.text;

  // Attachments render inline: images show, audio and video get players,
  // everything else becomes a download link.
  (m.attachments||[]).forEach(function(a){
    var url='/api/board/file/'+encodeURIComponent(a.stored);
    var holder=el('div'); holder.style.cssText='margin-top:'+(m.text?'8px':'0');
    if(a.kind==='image'){
      var im=el('img'); im.src=url; im.alt=a.name; im.loading='lazy';
      im.style.cssText='max-width:100%;max-height:260px;border-radius:10px;display:block;cursor:pointer';
      im.addEventListener('click',function(){ window.open(url,'_blank','noopener'); });
      holder.appendChild(im);
    }else if(a.kind==='audio'){
      var au=el('audio'); au.controls=true; au.src=url;
      au.style.cssText='width:100%;max-width:260px;height:38px';
      holder.appendChild(au);
    }else if(a.kind==='video'){
      var vi=el('video'); vi.controls=true; vi.src=url; vi.preload='metadata';
      vi.style.cssText='max-width:100%;max-height:260px;border-radius:10px;display:block';
      holder.appendChild(vi);
    }else{
      var lk=el('a'); lk.href=url; lk.download=a.name; lk.rel='noopener';
      lk.style.cssText='display:inline-flex;align-items:center;gap:7px;padding:7px 11px;border-radius:9px;'+
        'background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);'+
        'color:var(--cyan);text-decoration:none;font-size:12.5px';
      lk.textContent='⬇ '+a.name+'  ('+Math.max(1,Math.round(a.size/1024))+' KB)';
      holder.appendChild(lk);
    }
    bub.appendChild(holder);
  });

  // Where it came from, when it was shared out of a chat with Setayesh.
  if(m.shared){
    var tag=el('div');
    tag.style.cssText='font-size:11px;color:var(--cyan);opacity:.85;margin-top:'+(m.text||(m.attachments||[]).length?'7px':'0');
    tag.textContent='✨ از گفتگو با ستایش'+(m.shared!=='setayesh'?(' · '+m.shared):'');
    bub.appendChild(tag);
  }

  // A shared location becomes a map link, not raw numbers.
  if(m.location){
    var loc=el('div'); loc.style.cssText='margin-top:'+(m.text?'8px':'0');
    var mapUrl='https://www.google.com/maps/search/?api=1&query='+m.location.lat+','+m.location.lon;
    var a=el('a'); a.href=mapUrl; a.target='_blank'; a.rel='noopener noreferrer';
    a.style.cssText='display:flex;align-items:center;gap:9px;padding:9px 12px;border-radius:10px;'+
      'background:rgba(52,211,153,.12);border:1px solid rgba(52,211,153,.35);'+
      'color:#34d399;text-decoration:none;font-size:12.5px';
    var acc=m.location.acc?(' · دقت حدود '+Math.round(m.location.acc)+' متر'):'';
    a.textContent='📍 موقعیت روی نقشه'+acc;
    loc.appendChild(a);
    var co=el('div');
    co.style.cssText='font-size:10.5px;color:var(--muted);margin-top:4px;font-family:var(--mono)';
    co.textContent=m.location.lat+', '+m.location.lon;
    loc.appendChild(co);
    bub.appendChild(loc);
  }

  row.appendChild(who); row.appendChild(bub);

  var canDelete = mine || (CFG&&CFG.isAdmin);
  if(canDelete||(CFG&&CFG.isAdmin)){
    var acts=el('div'); acts.style.cssText='display:flex;gap:10px;margin-top:4px;padding:0 4px';
    if(CFG&&CFG.isAdmin){
      var pin=el('button'); pin.textContent=m.pinned?'برداشتن سنجاق':'سنجاق';
      pin.style.cssText='background:none;border:none;color:var(--muted);font-size:11px;cursor:pointer;font-family:inherit;padding:0';
      pin.addEventListener('click',function(){
        adminFetch('/api/board/'+m.id+'/pin',{method:'POST'}).then(function(){loadBoard();}).catch(function(e){boardNote(e.message,true);});
      });
      acts.appendChild(pin);
    }
    if(canDelete){
      var del=el('button'); del.textContent='حذف';
      del.style.cssText='background:none;border:none;color:var(--muted);font-size:11px;cursor:pointer;font-family:inherit;padding:0';
      del.addEventListener('click',function(){
        adminFetch('/api/board/'+m.id,{method:'DELETE'}).then(function(){loadBoard();}).catch(function(e){boardNote(e.message,true);});
      });
      acts.appendChild(del);
    }
    row.appendChild(acts);
  }
  return row;
}

function loadBoard(markSeen){
  var box=$('boardList'); if(!box)return;
  adminFetch('/api/board').then(function(d){
    box.innerHTML='';
    var msgs=(d.messages||[]).slice();
    if(!msgs.length){ box.innerHTML='<div class="tk-hint">هنوز پیامی نیست. اولین نفر باش.</div>'; }
    // Pinned notices first, then the rest in time order.
    var pinned=msgs.filter(function(m){return m.pinned;});
    var normal=msgs.filter(function(m){return !m.pinned;});
    pinned.concat(normal).forEach(function(m){ box.appendChild(boardCard(m)); });
    box.scrollTop=box.scrollHeight;
    if(markSeen){
      adminFetch('/api/board/seen',{method:'POST'}).then(refreshBoardBadge).catch(function(){});
    }
  }).catch(function(e){ box.innerHTML=''; boardNote(e.message,true); });
}

function refreshBoardBadge(){
  if(!token)return;
  adminFetch('/api/board').then(function(d){
    var n=d.unread||0;
    var dot=$('boardDot'); if(dot)dot.style.display=n?'':'none';
    var b=$('shBoardBadge'); if(b){ b.textContent=n; b.style.display=n?'':'none'; }
  }).catch(function(){});
}

var boardFiles=[];
function renderBoardPending(){
  var box=$('boardPending'); if(!box)return;
  box.innerHTML='';
  boardFiles.forEach(function(f,i){
    var chip=el('div');
    chip.style.cssText='display:inline-flex;align-items:center;gap:8px;margin:0 0 6px 6px;padding:6px 10px;'+
      'border-radius:9px;background:rgba(56,189,248,.12);border:1px solid rgba(56,189,248,.3);font-size:12px';
    var nm=el('span'); nm.textContent=f.name+' ('+Math.max(1,Math.round(f.size/1024))+' KB)';
    var x=el('button'); x.textContent='×';
    x.style.cssText='background:none;border:none;color:var(--muted);cursor:pointer;font-size:15px;line-height:1;padding:0';
    x.addEventListener('click',function(){ boardFiles.splice(i,1); renderBoardPending(); });
    chip.appendChild(nm); chip.appendChild(x); box.appendChild(chip);
  });
}

function sendBoard(){
  var t=$('boardText').value.trim();
  if(!t&&!boardFiles.length&&!boardLoc){ boardNote('چیزی بنویس، فایلی اضافه کن، یا موقعیت بفرست.',true); return; }
  var fd=new FormData();
  fd.append('text',t);
  fd.append('pinned',($('boardPin')&&$('boardPin').checked)?'true':'false');
  boardFiles.forEach(function(f){ fd.append('files',f,f.name); });
  if(boardLoc){ fd.append('lat',boardLoc.lat); fd.append('lon',boardLoc.lon); fd.append('acc',boardLoc.acc); }
  boardNote(boardFiles.length?'در حال ارسال...':'');
  fetch('/api/board',{method:'POST',headers:authHeaders(),body:fd})
    .then(function(r){ return r.json().then(function(d){ if(!r.ok)throw new Error(d.error||'ارسال نشد'); return d; }); })
    .then(function(){
      $('boardText').value=''; boardFiles=[]; renderBoardPending();
      boardLoc=null; $('boardLoc').style.background='';
      if($('boardPin'))$('boardPin').checked=false;
      boardNote(''); loadBoard(true);
    })
    .catch(function(e){ boardNote(e.message,true); });
}

/* Location — captured only on tap. Never polled, never stored beyond the
   message. Held in memory until the message is sent. */
var boardLoc=null;
$('boardLoc').addEventListener('click',function(){
  if(boardLoc){ boardLoc=null; $('boardLoc').style.background=''; boardNote('موقعیت برداشته شد.'); return; }
  if(!navigator.geolocation){ boardNote('این دستگاه موقعیت‌یابی ندارد.',true); return; }
  boardNote('در حال گرفتن موقعیت...');
  navigator.geolocation.getCurrentPosition(function(pos){
    boardLoc={lat:pos.coords.latitude,lon:pos.coords.longitude,acc:pos.coords.accuracy||0};
    $('boardLoc').style.background='rgba(52,211,153,.25)';
    boardNote('موقعیت آماده شد — با پیام فرستاده می‌شود. دوباره بزن تا برداشته شود.');
  },function(err){
    boardNote(err.code===1?'اجازه‌ی موقعیت داده نشد.':'گرفتن موقعیت ناموفق بود.',true);
  },{enableHighAccuracy:true,timeout:10000,maximumAge:60000});
});

/* Share something from a chat with Setayesh straight to the family board. */
function shareToBoard(text,label){
  var fd=new FormData();
  fd.append('text',String(text||'').slice(0,2000));
  fd.append('shared',label||'setayesh');
  fd.append('pinned','false');
  return fetch('/api/board',{method:'POST',headers:authHeaders(),body:fd})
    .then(function(r){ return r.json().then(function(d){ if(!r.ok)throw new Error(d.error||'ارسال نشد'); return d; }); });
}

$('boardAttach').addEventListener('click',function(){ $('boardFile').click(); });
$('boardFile').addEventListener('change',function(){
  Array.prototype.forEach.call($('boardFile').files,function(f){
    if(f.size>250*1024*1024){ boardNote(f.name+' بزرگ‌تر از ۲۵۰ مگابایت است.',true); return; }
    boardFiles.push(f);
  });
  $('boardFile').value=''; renderBoardPending();
});

/* Voice notes — recorded on the device and attached like any other file. */
var boardRec=null, boardChunks=[], boardRecTimer=null;
function stopBoardRec(){
  if(boardRec&&boardRec.state!=='inactive'){ try{ boardRec.stop(); }catch(e){} }
  if(boardRecTimer){ clearInterval(boardRecTimer); boardRecTimer=null; }
  $('boardMic').textContent='🎤';
  $('boardMic').style.background='';
}
$('boardMic').addEventListener('click',async function(){
  if(boardRec&&boardRec.state==='recording'){ stopBoardRec(); return; }
  if(!navigator.mediaDevices||!window.MediaRecorder){
    boardNote('این مرورگر ضبط صدا را پشتیبانی نمی‌کند.',true); return;
  }
  try{
    var stream=await navigator.mediaDevices.getUserMedia({audio:true});
    boardChunks=[];
    boardRec=new MediaRecorder(stream);
    boardRec.ondataavailable=function(e){ if(e.data&&e.data.size)boardChunks.push(e.data); };
    boardRec.onstop=function(){
      stream.getTracks().forEach(function(t){ t.stop(); });
      if(!boardChunks.length)return;
      var blob=new Blob(boardChunks,{type:boardRec.mimeType||'audio/webm'});
      var ext=(blob.type.indexOf('mp4')>=0)?'.m4a':'.webm';
      var f=new File([blob],'voice-'+Date.now()+ext,{type:blob.type});
      boardFiles.push(f); renderBoardPending(); boardNote('پیام صوتی آماده — دکمه‌ی بفرست را بزن.');
    };
    boardRec.start();
    var secs=0;
    $('boardMic').style.background='rgba(251,113,133,.25)';
    boardRecTimer=setInterval(function(){
      secs++; $('boardMic').textContent='⏹ '+secs;
      if(secs>=120)stopBoardRec();      // 2 minutes is plenty for a note home
    },1000);
    boardNote('در حال ضبط... دوباره بزن تا تمام شود.');
  }catch(e){ boardNote('دسترسی به میکروفون داده نشد.',true); }
});

$('boardBtn').addEventListener('click',openBoard);
$('boardClose').addEventListener('click',closeBoard);
$('boardOverlay').addEventListener('click',function(e){ if(e.target===$('boardOverlay'))closeBoard(); });
$('boardSend').addEventListener('click',sendBoard);

// Clearing the board. Pinned notices always survive — they are the ones
// someone deliberately marked as important.
function boardClear(scope,confirmText){
  if(!confirm(confirmText))return;
  adminFetch('/api/board/clear',{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({scope:scope})})
    .then(function(d){ boardNote(d.removed+' پیام پاک شد. (پیام‌های سنجاق‌شده باقی ماندند)'); loadBoard(true); refreshBoardBadge(); })
    .catch(function(e){ boardNote(e.message,true); });
}
$('boardClearMine').addEventListener('click',function(){
  boardClear('mine','همه‌ی پیام‌های خودت پاک شوند؟');
});
$('boardClearRead').addEventListener('click',function(){
  boardClear('read','پیام‌هایی که همه خوانده‌اند پاک شوند؟');
});
$('boardClearAll').addEventListener('click',function(){
  boardClear('all','کل تابلو پاک شود؟ (پیام‌های سنجاق‌شده می‌مانند)');
});
$('boardClearPinned').addEventListener('click',function(){
  boardClear('everything','همه‌چیز پاک شود، حتی پیام‌های سنجاق‌شده؟ این کار برگشت‌پذیر نیست.');
});
$('boardText').addEventListener('keydown',function(e){
  if(e.key==='Enter'&&!e.shiftKey){ e.preventDefault(); sendBoard(); }
});
$('shBoard').addEventListener('click',function(){ sheetGo(openBoard); });
$('shNew').addEventListener('click',function(){ closeSheet(); newChat(); $('msgBox').focus(); });
$('shChats').addEventListener('click',function(){ sheetGo(openSidebar); });
$('shAttach').addEventListener('click',function(){ closeSheet(); setTimeout(function(){ $('fileInput').click(); },200); });
$('shMic').addEventListener('click',function(){ closeSheet(); setTimeout(function(){ $('micBtn').click(); },200); });
$('shSearch').addEventListener('click',function(){ closeSheet(); setTimeout(function(){ $('searchBtn').click(); },200); });
// Check for new notices every couple of minutes, and whenever the app is
// brought back to the foreground.
setInterval(refreshBoardBadge, 120000);
document.addEventListener('visibilitychange',function(){ if(!document.hidden)refreshBoardBadge(); });

/* ===== Control centre (admin): engines, users, privacy, capabilities ===== */
var CC = { settings:null, dirty:{} };
function ccNote(m,bad){ var n=$('ccNote'); n.textContent=m||''; n.className='note'+(bad?' err':''); }
function openCC(){ ccNote(''); CC.dirty={}; $('ccOverlay').classList.add('on'); ccTab('engines'); loadCC(); checkRestartSupport(); }
function closeCC(){ $('ccOverlay').classList.remove('on'); }
function ccTab(which){
  ['engines','users','privacy','power','devices','look','update','scripts','actions','sync'].forEach(function(t){
    var pane=$('cc'+t.charAt(0).toUpperCase()+t.slice(1));
    if(pane)pane.style.display=(t===which)?'':'none';
  });
  Array.prototype.forEach.call(document.querySelectorAll('.cctab'),function(b){
    b.className='btn '+(b.getAttribute('data-cc')===which?'':'ghost');
    b.style.padding='7px 14px'; b.style.fontSize='12.5px';
  });
  if(which==='users')loadCCUsers();
  if(which==='privacy')loadCCPrivacy();
  if(which==='devices')loadCCDevices();
  if(which==='look')loadCCLook();
  if(which==='update')loadCCUpdate();
  if(which==='scripts')loadCCScripts();
  if(which==='actions')loadCCActions();
  updateActionBadge();
  if(which==='sync')loadCCSync();
}

/* ===== Appearance =====
   Stored as plain values and applied as CSS variables, so someone who never
   opens a file can change how the app looks — and nothing they pick here can
   break it. */
function applyTheme(t){
  if(!t)return;
  var r=document.documentElement.style;
  if(t.accent){ r.setProperty('--cyan',t.accent); }
  if(t.accent2){ r.setProperty('--violet',t.accent2); r.setProperty('--violet-2',t.accent2); }
  if(t.bg){ r.setProperty('--bg',t.bg); document.body.style.background=t.bg; }
  if(t.fontScale){ document.documentElement.style.fontSize=(t.fontScale)+'%'; }
  if(typeof t.radius==='number'){ r.setProperty('--radius',t.radius+'px'); }
  if(t.appName){
    document.title=t.appName;
    var b=document.querySelector('.brand'); if(b)b.textContent=t.appName;
    var h=document.querySelector('.topbar .title'); if(h&&!h.dataset.keep)h.textContent=t.appName;
  }
  if(t.effects===false){
    ['grid','scan','sweep'].forEach(function(c){
      Array.prototype.forEach.call(document.querySelectorAll('.'+c),function(e){e.style.display='none';});
    });
  }
  window.THEME=t;
}
function loadThemePublic(){
  fetch('/api/theme').then(function(r){return r.json();})
    .then(function(d){ applyTheme(d.theme); }).catch(function(){});
}
/* ===== Python scripts =====
   Keep the scripts you use instead of pasting them in each time. */
function loadCCSync(){
  adminFetch('/api/admin/sync').then(function(d){
    $('syEnabled').checked=!!d.enabled;
    $('syHubUrl').value=d.hubUrl||'';
    $('syBoard').checked=d.what.board; $('syMemory').checked=d.what.memory;
    $('syDevices').checked=d.what.devices; $('syKnowledge').checked=d.what.knowledge;
    if(d.keySet&&!$('syKey').value)$('syKey').placeholder='••• کلید تنظیم شده (برای عوض کردن بنویس)';
    sySetRole(d.role||'peer');
    $('syMyAddr').innerHTML=(d.myAddresses||[]).map(function(a){return 'http://'+a+':3000';}).join('<br>')||'—';
    var st=[];
    if(d.lastSync)st.push('آخرین هماهنگی: '+new Date(d.lastSync).toLocaleString());
    if(d.lastError)st.push('<span style="color:#fb7185">خطا: '+d.lastError+'</span>');
    $('syStatus').innerHTML=st.join('<br>');
  }).catch(function(e){ ccNote(e.message,true); });
}
function sySetRole(role){
  $('syHubBox').style.display=role==='hub'?'':'none';
  $('syPeerBox').style.display=role==='peer'?'':'none';
  Array.prototype.forEach.call(document.querySelectorAll('.syrole'),function(b){
    b.className='btn '+(b.getAttribute('data-role')===role?'':'ghost');
    b.style.flex='1'; b.style.padding='8px'; b.style.fontSize='12px';
  });
  $('syStatus').dataset.role=role;
}
Array.prototype.forEach.call(document.querySelectorAll('.syrole'),function(b){
  b.addEventListener('click',function(){ sySetRole(b.getAttribute('data-role')); });
});
$('sySave').addEventListener('click',function(){
  var role=$('syStatus').dataset.role||'peer';
  var body={ enabled:$('syEnabled').checked, role:role, hubUrl:$('syHubUrl').value,
    what:{ board:$('syBoard').checked, memory:$('syMemory').checked, devices:$('syDevices').checked, knowledge:$('syKnowledge').checked } };
  if($('syKey').value)body.sharedKey=$('syKey').value;
  adminFetch('/api/admin/sync/settings',{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify(body)})
    .then(function(d){ ccNote(d.keySet?'ذخیره شد.':'ذخیره شد — ولی کلید مشترک لازم است.'); $('syKey').value=''; loadCCSync(); })
    .catch(function(e){ ccNote(e.message,true); });
});
$('syNow').addEventListener('click',function(){
  ccNote('در حال هماهنگی...');
  adminFetch('/api/admin/sync/now',{method:'POST'})
    .then(function(d){ ccNote(d.lastError?('خطا: '+d.lastError):'هماهنگ شد.'); loadCCSync(); })
    .catch(function(e){ ccNote(e.message,true); });
});

function updateActionBadge(){
  adminFetch('/api/admin/actions').then(function(d){
    var n=(d.actions||[]).filter(function(a){return a.status==='pending';}).length;
    var b=document.getElementById('ccActBadge');
    if(b){ if(n){ b.textContent=n; b.style.display=''; } else b.style.display='none'; }
  }).catch(function(){});
}
function loadCCActions(){
  adminFetch('/api/admin/actions').then(function(d){
    var box=$('actList'); box.innerHTML='';
    var pend=(d.actions||[]).filter(function(a){return a.status==='pending';});
    if(!pend.length)box.innerHTML='<div class="tk-hint">چیزی منتظر تأیید نیست.</div>';
    pend.forEach(function(a){
      var card=el('div','tk-card'); card.style.cssText='margin-bottom:8px;padding:11px 13px;border-color:rgba(251,113,133,.3)';
      var t=el('div'); t.style.cssText='font-weight:600;font-size:13px;margin-bottom:4px';
      t.textContent=a.kind==='run'?('اجرای «'+a.file+'» در پروژه‌ی «'+a.project+'»'):a.kind==='install'?'نصب':'درخواست';
      card.appendChild(t);
      var b=el('div'); b.style.cssText='font-size:12px;color:var(--muted);line-height:1.7;margin-bottom:8px';
      b.textContent=a.why||a.what||(a.command?('دستور: '+a.command):'');
      card.appendChild(b);
      var row=el('div'); row.style.cssText='display:flex;gap:6px';
      var yes=el('button','btn'); yes.textContent='تأیید'; yes.style.cssText='flex:1;padding:6px;font-size:12px';
      yes.addEventListener('click',function(){
        adminFetch('/api/admin/actions/'+a.id+'/approve',{method:'POST'})
          .then(function(r){
            if(r.result){ ccNote('اجرا شد.'); showActionResult(a,r.result); }
            else if(r.command){ ccNote('تأیید شد — این دستور را خودت در ترمینال بزن: '+r.command); }
            else ccNote('تأیید شد.');
            loadCCActions();
          }).catch(function(e){ ccNote(e.message,true); });
      });
      var no=el('button','btn ghost'); no.textContent='رد'; no.style.cssText='flex:1;padding:6px;font-size:12px';
      no.addEventListener('click',function(){
        adminFetch('/api/admin/actions/'+a.id+'/reject',{method:'POST'}).then(function(){ loadCCActions(); ccNote('رد شد.'); });
      });
      row.appendChild(yes); row.appendChild(no); card.appendChild(row);
      box.appendChild(card);
    });
  }).catch(function(e){ ccNote(e.message,true); });
  adminFetch('/api/admin/notify-status').then(function(d){
    $('notifSetup').textContent=d.emailConfigured?('ایمیل تنظیم شده: '+d.address):'ایمیل هنوز تنظیم نشده.';
  }).catch(function(){});
}
function showActionResult(a,r){
  var out=el('div'); out.style.cssText='margin-top:8px;padding:9px 11px;border-radius:9px;'+
    'font-family:var(--mono);font-size:11.5px;white-space:pre-wrap;direction:ltr;text-align:left;'+
    'background:rgba(52,211,153,.08);border:1px solid rgba(52,211,153,.28);max-height:180px;overflow:auto';
  out.textContent=(r.stdout||'')+(r.stderr?'\n'+r.stderr:'')||'(بدون خروجی)';
  $('actList').insertBefore(out,$('actList').firstChild);
}
$('notifTest').addEventListener('click',function(){
  adminFetch('/api/admin/notify-test',{method:'POST'})
    .then(function(d){ ccNote(d.emailed?'اعلان و ایمیل فرستاده شد.':'اعلان در برنامه ثبت شد.'+(d.emailError?' ایمیل نشد: '+d.emailError:' (ایمیل تنظیم نشده)')); pollNotifications&&pollNotifications(); })
    .catch(function(e){ ccNote(e.message,true); });
});

function loadCCInbox(){
  adminFetch('/api/admin/inbox').then(function(d){
    $('ibFolder').textContent=d.folder||'—';
    var parts=[];
    if(d.waiting&&d.waiting.length) parts.push('⏳ منتظر: '+d.waiting.join('، '));
    if(d.files&&d.files.length) parts.push('📄 فایل‌های نگه‌داشته: '+d.files.slice(-3).join('، '));
    if(d.rejected&&d.rejected.length) parts.push('✗ رد شده: '+d.rejected.slice(-2).join('، '));
    $('ibStatus').innerHTML=parts.join('<br>')||'پوشه خالی است.';
  }).catch(function(){});
}
$('ibScan').addEventListener('click',function(){
  ccNote('در حال بررسی پوشه...');
  adminFetch('/api/admin/inbox/scan',{method:'POST'})
    .then(function(){ ccNote('بررسی شد.'); loadCCInbox(); loadCCScripts(); })
    .catch(function(e){ ccNote(e.message,true); });
});
$('runPathBtn').addEventListener('click',function(){
  var p=$('runPath').value.trim();
  if(!p){ ccNote('مسیر فایل را بنویس.',true); return; }
  var out=$('scOutput'); out.style.display='';
  out.innerHTML='<div class="tk-hint"><span class="spin"></span> در حال اجرا...</div>';
  adminFetch('/api/admin/run-path',{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({path:p})})
    .then(function(r){
      out.innerHTML='';
      var box=el('div');
      box.style.cssText='padding:10px 12px;border-radius:10px;font-family:var(--mono);font-size:12px;'+
        'white-space:pre-wrap;word-break:break-word;direction:ltr;text-align:left;max-height:220px;overflow:auto;'+
        (r.stderr? 'background:rgba(251,113,133,.10);border:1px solid rgba(251,113,133,.3)'
                 : 'background:rgba(52,211,153,.08);border:1px solid rgba(52,211,153,.28)');
      box.textContent=(r.stdout||'')+(r.stderr? '\n'+r.stderr : '') || '(بدون خروجی)';
      out.appendChild(box);
    })
    .catch(function(e){ out.innerHTML='<div class="note err">'+e.message+'</div>'; });
});

function loadCCScripts(){
  loadCCInbox();
  adminFetch('/api/admin/scripts').then(function(d){
    $('scWarn').style.display=d.canRun?'none':'';
    var box=$('scList'); box.innerHTML='';
    if(!d.scripts.length){ box.innerHTML='<div class="tk-hint">هنوز اسکریپتی نداری.</div>'; return; }
    d.scripts.forEach(function(sc){
      var card=el('div','tk-card'); card.style.cssText='margin-bottom:8px;padding:10px 12px';
      var h=el('div'); h.style.cssText='font-weight:600;font-size:13px;font-family:var(--mono)';
      h.textContent=sc.name;
      card.appendChild(h);
      if(sc.note){
        var n=el('div'); n.style.cssText='font-size:11.5px;color:var(--muted);margin-top:3px';
        n.textContent=sc.note; card.appendChild(n);
      }
      var meta=el('div'); meta.style.cssText='font-size:11px;color:var(--muted);opacity:.7;margin-top:3px';
      meta.textContent=Math.max(1,Math.round(sc.size/1024))+' KB · '+new Date(sc.at).toLocaleDateString();
      card.appendChild(meta);

      var row=el('div'); row.style.cssText='display:flex;gap:6px;margin-top:8px;flex-wrap:wrap';
      if(d.canRun){
        var run=el('button','btn'); run.textContent='▶ اجرا'; run.style.cssText='padding:5px 14px;font-size:12px';
        run.addEventListener('click',function(){ runScript(sc.name,run); });
        row.appendChild(run);
      }
      var ed=el('button','btn ghost'); ed.textContent='ویرایش'; ed.style.cssText='padding:5px 12px;font-size:12px';
      ed.addEventListener('click',function(){
        adminFetch('/api/admin/scripts/'+encodeURIComponent(sc.name)).then(function(f){
          $('scName').value=f.name; $('scCode').value=f.content;
          $('scEditor').style.display=''; $('scCode').focus();
        }).catch(function(e){ ccNote(e.message,true); });
      });
      var del=el('button','btn ghost'); del.textContent='حذف'; del.style.cssText='padding:5px 12px;font-size:12px';
      del.addEventListener('click',function(){
        if(!confirm('«'+sc.name+'» حذف شود؟'))return;
        adminFetch('/api/admin/scripts/'+encodeURIComponent(sc.name),{method:'DELETE'})
          .then(function(){ loadCCScripts(); ccNote('حذف شد.'); })
          .catch(function(e){ ccNote(e.message,true); });
      });
      row.appendChild(ed); row.appendChild(del);
      card.appendChild(row); box.appendChild(card);
    });
  }).catch(function(e){ ccNote(e.message,true); });
}

function runScript(name,btn){
  var out=$('scOutput');
  out.style.display=''; out.innerHTML='<div class="tk-hint"><span class="spin"></span> در حال اجرا...</div>';
  if(btn)btn.disabled=true;
  adminFetch('/api/admin/scripts/'+encodeURIComponent(name)+'/run',{method:'POST'})
    .then(function(r){
      out.innerHTML='';
      var box=el('div');
      box.style.cssText='padding:10px 12px;border-radius:10px;font-family:var(--mono);font-size:12px;'+
        'white-space:pre-wrap;word-break:break-word;direction:ltr;text-align:left;max-height:220px;overflow:auto;'+
        (r.stderr? 'background:rgba(251,113,133,.10);border:1px solid rgba(251,113,133,.3)'
                 : 'background:rgba(52,211,153,.08);border:1px solid rgba(52,211,153,.28)');
      box.textContent=(r.stdout||'')+(r.stderr? '\n'+r.stderr : '') || '(بدون خروجی)';
      out.appendChild(box);
    })
    .catch(function(e){ out.innerHTML='<div class="note err">'+e.message+'</div>'; })
    .then(function(){ if(btn)btn.disabled=false; });
}

$('scUpload').addEventListener('click',function(){ $('scFile').click(); });
$('scFile').addEventListener('change',function(){
  if(!this.files||!this.files[0])return;
  var fd=new FormData(); fd.append('file',this.files[0]);
  this.value='';
  fetch('/api/admin/scripts',{method:'POST',headers:authHeaders(),body:fd})
    .then(function(r){return r.json();})
    .then(function(d){ if(d.error)throw new Error(d.error); ccNote('«'+d.name+'» اضافه شد.'); loadCCScripts(); })
    .catch(function(e){ ccNote(e.message,true); });
});
$('scNew').addEventListener('click',function(){
  $('scName').value=''; $('scCode').value='# توضیح کوتاه اینجا\n\n';
  $('scEditor').style.display=''; $('scName').focus();
});
$('scCancel').addEventListener('click',function(){ $('scEditor').style.display='none'; });
$('scSave').addEventListener('click',function(){
  var n=$('scName').value.trim(), c=$('scCode').value;
  if(!n){ ccNote('نام فایل لازم است.',true); return; }
  adminFetch('/api/admin/scripts',{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({name:n,content:c})})
    .then(function(){ $('scEditor').style.display='none'; ccNote('ذخیره شد.'); loadCCScripts(); })
    .catch(function(e){ ccNote(e.message,true); });
});

function loadCCUpdate(){
  adminFetch('/api/admin/auto-update').then(function(d){
    $('auEnabled').checked=!!d.enabled;
    $('auFolder').textContent=d.folder||'—';
    var st=[];
    st.push('نسخه‌ی فعلی: <b>'+d.currentVersion+'</b>');
    if(d.pending&&d.pending.length) st.push('⏳ منتظر نصب: '+d.pending.join('، '));
    if(d.installed&&d.installed.length) st.push('✓ نصب‌شده‌ها: '+d.installed.slice(-2).join('، '));
    if(d.rejected&&d.rejected.length) st.push('<span style="color:#fb7185">✗ رد شده: '+d.rejected.slice(-2).join('، ')+'</span>');
    if(!d.restartSupported) st.push('<span style="color:#fbbf24">⚠ برای ری‌استارت خودکار باید با Start-Setayesh.bat جدید اجرا شود.</span>');
    $('auStatus').innerHTML=st.join('<br>');
    var lg=$('auLog'); lg.innerHTML='';
    (d.log||[]).slice().reverse().forEach(function(l){
      var r=el('div');
      r.style.cssText='padding:4px 0;border-bottom:1px solid rgba(255,255,255,.05);color:'+
        (l.level==='error'?'#fb7185':l.level==='ok'?'#34d399':'var(--muted)');
      r.textContent=new Date(l.at).toLocaleString()+' — '+l.msg;
      lg.appendChild(r);
    });
    if(!(d.log||[]).length)lg.innerHTML='<div class="tk-hint">هنوز چیزی نصب نشده.</div>';
  }).catch(function(e){ ccNote(e.message,true); });
}
$('upBtn').addEventListener('click',function(){ $('upFile').click(); });
$('upFile').addEventListener('change',function(){
  if(!this.files||!this.files[0])return;
  var f=this.files[0]; this.value='';
  var st=$('upStatus');
  st.innerHTML='<span class="spin"></span> در حال آپلود «'+f.name+'» ('+Math.round(f.size/1024)+' KB)...';
  var fd=new FormData(); fd.append('file',f);
  fetch('/api/admin/inbox/upload',{method:'POST',headers:authHeaders(),body:fd})
    .then(function(r){ return r.json().then(function(d){ if(!r.ok)throw new Error(d.error||'نشد'); return d; }); })
    .then(function(d){
      st.style.color='#34d399';
      st.textContent='✓ '+(d.note||'انجام شد');
      if(d.kind==='update'){
        // Server restarts itself; wait and reload.
        st.textContent='✓ نسخه '+d.version+' نصب شد — برنامه دوباره بارگذاری می‌شود...';
        setTimeout(function(){
          var t=0,iv=setInterval(function(){ t++;
            fetch('/api/health').then(function(r){ if(r.ok){ clearInterval(iv); location.reload(true); } }).catch(function(){});
            if(t>30)clearInterval(iv);
          },1000);
        },2500);
      }
    })
    .catch(function(e){ st.style.color='#fb7185'; st.textContent='✗ '+e.message; });
});

$('auEnabled').addEventListener('change',function(){
  adminFetch('/api/admin/auto-update/settings',{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({enabled:$('auEnabled').checked})})
    .then(function(){ ccNote($('auEnabled').checked?'روشن شد — هر ZIP در پوشه‌ی updates خودکار نصب می‌شود.':'خاموش شد.'); loadCCUpdate(); })
    .catch(function(e){ ccNote(e.message,true); });
});
$('auScan').addEventListener('click',function(){
  ccNote('در حال بررسی بسته...');
  adminFetch('/api/admin/auto-update/scan',{method:'POST'})
    .then(function(d){
      if(d.installed){
        ccNote('نسخه '+d.installed+' نصب شد. '+(d.note||''));
        // The server restarts itself; wait for it and reload.
        setTimeout(function(){
          var tries=0, iv=setInterval(function(){
            tries++;
            fetch('/api/health').then(function(r){
              if(r.ok){ clearInterval(iv); location.reload(true); }
            }).catch(function(){});
            if(tries>30)clearInterval(iv);
          },1000);
        },2000);
      } else { ccNote(d.note||'فایلی نبود.'); }
    })
    .catch(function(e){ ccNote(e.message,true); });
});

function loadCCLook(){
  adminFetch('/api/theme').then(function(d){
    var t=d.theme||{};
    $('thName').value=t.appName||'';
    $('thGreet').value=t.greeting||'';
    $('thAccent').value=t.accent||'#38bdf8';
    $('thAccent2').value=t.accent2||'#7b5cff';
    $('thBg').value=t.bg||'#0a0e1a';
    $('thFont').value=t.fontScale||100;   $('thFontVal').textContent=(t.fontScale||100)+'%';
    $('thRadius').value=t.radius||16;     $('thRadiusVal').textContent=(t.radius||16);
    $('thEffects').checked=t.effects!==false;
  }).catch(function(e){ ccNote(e.message,true); });
}
$('thFont').addEventListener('input',function(){ $('thFontVal').textContent=$('thFont').value+'%'; });
$('thRadius').addEventListener('input',function(){ $('thRadiusVal').textContent=$('thRadius').value; });
$('thSave').addEventListener('click',function(){
  adminFetch('/api/admin/theme',{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({theme:{
      appName:$('thName').value, greeting:$('thGreet').value,
      accent:$('thAccent').value, accent2:$('thAccent2').value, bg:$('thBg').value,
      fontScale:Number($('thFont').value), radius:Number($('thRadius').value),
      effects:$('thEffects').checked
    }})
  }).then(function(d){ applyTheme(d.theme); ccNote(d.note||'ذخیره شد.'); })
    .catch(function(e){ ccNote(e.message,true); });
});
$('thReset').addEventListener('click',function(){
  adminFetch('/api/admin/theme/reset',{method:'POST'})
    .then(function(d){ applyTheme(d.theme); loadCCLook(); ccNote(d.note||'برگشت.'); })
    .catch(function(e){ ccNote(e.message,true); });
});

/* Restart button — shown only when the launcher can actually bring the server
   back. Offering it otherwise would just kill the app. */
function checkRestartSupport(){
  adminFetch('/api/admin/restart-support').then(function(d){
    $('ccRestart').style.display=d.supported?'':'none';
  }).catch(function(){});
}
$('ccRestart').addEventListener('click',function(){
  ccNote('در حال ری‌استارت...');
  adminFetch('/api/admin/restart',{method:'POST'}).then(function(d){
    ccNote(d.note||'ری‌استارت شد.');
    // Poll until the server answers again, then reload.
    var tries=0;
    var iv=setInterval(function(){
      tries++;
      fetch('/api/health').then(function(r){
        if(r.ok){ clearInterval(iv); ccNote('آماده شد — صفحه دوباره بارگذاری می‌شود.'); setTimeout(function(){location.reload();},700); }
      }).catch(function(){});
      if(tries>30){ clearInterval(iv); ccNote('بالا نیامد — پنجره‌ی مشکی را چک کن.',true); }
    },1000);
  }).catch(function(e){ ccNote(e.message,true); });
});
function loadCCDevices(){
  var box=$('ccDevList'); box.innerHTML='<div class="tk-hint"><span class="spin"></span></div>';
  adminFetch('/api/admin/devices').then(function(d){
    box.innerHTML='';
    if(!(d.devices||[]).length){box.innerHTML='<div class="tk-hint">هنوز دستگاهی ثبت نشده.</div>';return;}
    var icon={phone:'📱',tablet:'📋','touch-desktop':'💻',desktop:'🖥️'};
    d.devices.forEach(function(v){
      var card=el('div','tk-card'); card.style.cssText='margin-bottom:8px;padding:10px 12px';
      var h=el('div'); h.style.cssText='font-weight:600;font-size:13px;margin-bottom:4px';
      h.textContent=(icon[v.kind]||'•')+' '+v.label+'  ('+v.user+')';
      var m=el('div'); m.style.cssText='font-size:11.5px;color:var(--muted);line-height:1.7';
      m.textContent=v.browser+' · '+v.screen+' · '+(v.tz||'')+'\n'+
        'آخرین بار: '+new Date(v.lastSeen).toLocaleString()+' · '+v.visits+' بار';
      m.style.whiteSpace='pre-line';
      var x=el('button','btn ghost'); x.textContent='حذف'; x.style.cssText='padding:5px 12px;margin-top:8px';
      x.addEventListener('click',function(){
        adminFetch('/api/admin/devices/'+encodeURIComponent(v.id),{method:'DELETE'})
          .then(loadCCDevices).catch(function(e){ccNote(e.message,true);});
      });
      card.appendChild(h);card.appendChild(m);card.appendChild(x);box.appendChild(card);
    });
  }).catch(function(e){box.innerHTML='';ccNote(e.message,true);});
}
function loadCC(){
  adminFetch('/api/admin/settings').then(function(d){
    CC.settings=d;
    var L=d.live;
    $('ccLive').innerHTML='نسخه '+d.version+' · موتورهای فعال: '+(L.engines.join('، ')||'هیچ')+
      ' · '+L.accounts.length+' کاربر'+(L.pendingKnowledge?(' · '+L.pendingKnowledge+' مورد منتظر تأیید'):'');
    // engine keys
    var box=$('ccKeyList'); box.innerHTML='';
    d.providers.filter(function(p){return p.id!=='local';}).forEach(function(p){
      var key='KEY_'+p.id.toUpperCase();
      var st=d.settings[key]; if(!st)return;
      var row=el('div','tk-card'); row.style.cssText='margin-bottom:8px;padding:10px 12px';
      var top=el('div'); top.style.cssText='display:flex;align-items:center;gap:8px;margin-bottom:6px';
      var nm=el('span'); nm.style.cssText='flex:1;font-size:13px;font-weight:600';
      nm.textContent=p.label+(p.free?' · رایگان':'');
      var dot=el('span'); dot.textContent=st.set?'●':'○';
      dot.style.color=st.set?'#34d399':'var(--muted)';
      top.appendChild(nm); top.appendChild(dot);
      var inp=el('input','input');
      inp.placeholder=st.set?st.value:'کلید را اینجا بگذار...';
      inp.style.fontSize='12px';
      inp.addEventListener('input',function(){ CC.dirty[key]=inp.value.trim(); });
      row.appendChild(top); row.appendChild(inp);
      if(p.keyUrl){
        var a=el('a'); a.href=p.keyUrl; a.target='_blank'; a.rel='noopener';
        a.style.cssText='font-size:11px;color:var(--cyan);text-decoration:none;display:inline-block;margin-top:6px';
        a.textContent='گرفتن کلید ↗'; row.appendChild(a);
      }
      box.appendChild(row);
    });
    // default engine
    var sel=$('ccDefault'); sel.innerHTML='';
    d.providers.forEach(function(p){
      var o=el('option'); o.value=p.id; o.textContent=p.label; 
      if(p.id===d.live.defaultProvider)o.selected=true;
      sel.appendChild(o);
    });
    sel.onchange=function(){ CC.dirty.PROVIDER=sel.value; };
    $('ccPython').checked=!!d.live.pythonEnabled;
    $('ccPython').onchange=function(){ CC.dirty.ENABLE_PYTHON=$('ccPython').checked?'1':''; };
    $('ccLocal').checked=d.live.engines.indexOf('local')>=0;
    $('ccLocal').onchange=function(){ CC.dirty.ENABLE_LOCAL=$('ccLocal').checked?'1':''; };
  }).catch(function(e){ ccNote(e.message,true); });
}
function loadCCUsers(){
  var box=$('ccUserList'); box.innerHTML='<div class="tk-hint"><span class="spin"></span></div>';
  // Who is online right now — the one thing you see about the others at a glance.
  adminFetch('/api/admin/presence').then(function(pd){
    var strip=document.getElementById('ccPresence');
    if(!strip){
      strip=el('div'); strip.id='ccPresence';
      strip.style.cssText='display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px';
      box.parentNode.insertBefore(strip,box);
    }
    strip.innerHTML='';
    (pd.users||[]).forEach(function(u){
      var chip=el('div');
      chip.style.cssText='display:flex;align-items:center;gap:7px;padding:6px 11px;border-radius:11px;'+
        'background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);font-size:12.5px';
      var dot=el('span');
      dot.style.cssText='width:8px;height:8px;border-radius:50%;background:'+(u.online?'#34d399':'#5d6478');
      var nm=el('span'); nm.textContent=u.username+(u.online?'':' · '+(u.lastActive?('آخرین بار '+new Date(u.lastActive).toLocaleTimeString()):'آفلاین'));
      nm.style.color=u.online?'var(--text)':'var(--muted)';
      chip.appendChild(dot); chip.appendChild(nm); strip.appendChild(chip);
    });
  }).catch(function(){});
  adminFetch('/api/admin/users').then(function(d){
    box.innerHTML='';
    (d.users||[]).forEach(function(u){
      var card=el('div','tk-card'); card.style.cssText='margin-bottom:8px;padding:10px 12px';
      var h=el('div'); h.style.cssText='font-weight:600;font-size:13px;margin-bottom:8px';
      h.textContent=u.username+(u.admin?' (مدیر)':'')+(u.safe?' · حالت کودک':'');
      card.appendChild(h);
      var r=el('div'); r.style.cssText='display:flex;gap:8px;flex-wrap:wrap';
      var age=el('input','input'); age.type='number'; age.placeholder='سن'; age.value=u.age||'';
      age.style.cssText='width:80px;font-size:12px';
      var intr=el('input','input'); intr.placeholder='علایق...'; intr.value=u.interests||'';
      intr.style.cssText='flex:1;min-width:140px;font-size:12px';
      var sv=el('button','btn ghost'); sv.textContent='ذخیره'; sv.style.padding='6px 12px';
      sv.addEventListener('click',function(){
        adminFetch('/api/admin/profile',{method:'POST',headers:{'Content-Type':'application/json'},
          body:JSON.stringify({username:u.username,age:age.value?Number(age.value):null,interests:intr.value})})
          .then(function(){ccNote('پروفایل '+u.username+' ذخیره شد.');})
          .catch(function(e){ccNote(e.message,true);});
      });
      r.appendChild(age); r.appendChild(intr); r.appendChild(sv);
      card.appendChild(r); box.appendChild(card);
    });
  }).catch(function(e){ box.innerHTML=''; ccNote(e.message,true); });
}
function loadCCPrivacy(){
  adminFetch('/api/admin/privacy').then(function(d){
    $('ccPrivOn').checked=!!d.enabled;
    $('ccPrivOn').onchange=function(){
      adminFetch('/api/admin/privacy/settings',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({enabled:$('ccPrivOn').checked})}).then(function(){ccNote('ذخیره شد.');});
    };
    var lb=$('ccPrivList'); lb.innerHTML='';
    if(!(d.terms||[]).length)lb.innerHTML='<div class="tk-hint">فقط نام حساب‌ها محافظت می‌شوند.</div>';
    (d.terms||[]).forEach(function(t){
      var row=el('div','tk-card'); row.style.cssText='margin-bottom:6px;padding:8px 10px;display:flex;align-items:center;gap:8px';
      var sp=el('span'); sp.style.cssText='flex:1;font-size:12.5px'; sp.textContent=t;
      var x=el('button','btn ghost'); x.textContent='حذف'; x.style.padding='4px 10px';
      x.addEventListener('click',function(){
        adminFetch('/api/admin/privacy/terms?term='+encodeURIComponent(t),{method:'DELETE'})
          .then(loadCCPrivacy).catch(function(e){ccNote(e.message,true);});
      });
      row.appendChild(sp); row.appendChild(x); lb.appendChild(row);
    });
    var lg=$('ccPrivLog'); lg.innerHTML='';
    if(!(d.blocked||[]).length)lg.innerHTML='<div class="tk-hint">چیزی مسدود نشده.</div>';
    (d.blocked||[]).slice(0,20).forEach(function(b){
      var row=el('div'); row.style.cssText='font-size:11.5px;color:var(--muted);padding:5px 0;border-bottom:1px solid rgba(255,255,255,.05)';
      row.textContent=new Date(b.at).toLocaleString()+' — '+(b.kinds||[]).join('، ')+' ('+b.where+')';
      lg.appendChild(row);
    });
  }).catch(function(e){ ccNote(e.message,true); });
}
$('ccBtn').addEventListener('click',openCC);
$('ccClose').addEventListener('click',closeCC);
$('ccOverlay').addEventListener('click',function(e){if(e.target===$('ccOverlay'))closeCC();});
Array.prototype.forEach.call(document.querySelectorAll('.cctab'),function(b){
  b.addEventListener('click',function(){ ccTab(b.getAttribute('data-cc')); });
});
$('ccPrivAdd').addEventListener('click',function(){
  var v=$('ccPrivTerm').value.trim(); if(v.length<3){ccNote('حداقل ۳ کاراکتر.',true);return;}
  adminFetch('/api/admin/privacy/terms',{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({term:v})}).then(function(){$('ccPrivTerm').value='';loadCCPrivacy();ccNote('اضافه شد.');})
    .catch(function(e){ccNote(e.message,true);});
});
$('ccSave').addEventListener('click',function(){
  var keys=Object.keys(CC.dirty);
  if(!keys.length){ccNote('چیزی تغییر نکرده.');return;}
  adminFetch('/api/admin/settings',{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({updates:CC.dirty})})
    .then(function(d){ CC.dirty={}; ccNote(d.note||'ذخیره شد.'); loadCC(); })
    .catch(function(e){ ccNote(e.message,true); });
});

/* ===== Learning control: background research + knowledge review (admin) ===== */
function loadSuggestions(){
  adminFetch('/api/admin/suggestions').then(function(d){
    var box=$('learnSuggest'); if(!box)return; box.innerHTML='';
    if(!d.items.length)return;
    var head=el('div'); head.style.cssText='font-size:12px;font-weight:700;color:#a78bfa;margin-bottom:8px';
    head.textContent='💡 ستایش این‌ها را پیشنهاد می‌دهد:';
    box.appendChild(head);
    d.items.forEach(function(s){
      var card=el('div','tk-card'); card.style.cssText='padding:12px 14px;margin-bottom:8px;border-color:rgba(167,139,250,.35);background:rgba(167,139,250,.07)';
      var t=el('div'); t.style.cssText='font-weight:600;font-size:13px;margin-bottom:4px'; t.textContent=s.title;
      var b=el('div'); b.style.cssText='font-size:12px;color:var(--muted);line-height:1.8;margin-bottom:4px'; b.textContent=s.body;
      card.appendChild(t); card.appendChild(b);
      if(s.action&&s.action.text){ var a=el('div'); a.style.cssText='font-size:11px;color:var(--cyan);margin-bottom:8px'; a.textContent='→ '+s.action.text; card.appendChild(a); }
      var row=el('div'); row.style.cssText='display:flex;gap:6px';
      var yes=el('button','btn'); yes.textContent='خوب است'; yes.style.cssText='flex:1;padding:5px;font-size:12px';
      yes.addEventListener('click',function(){ adminFetch('/api/admin/suggestions/'+s.id+'/accept',{method:'POST'}).then(function(){ loadSuggestions(); }); });
      var no=el('button','btn ghost'); no.textContent='نه ممنون'; no.style.cssText='flex:1;padding:5px;font-size:12px';
      no.addEventListener('click',function(){ adminFetch('/api/admin/suggestions/'+s.id+'/dismiss',{method:'POST'}).then(function(){ loadSuggestions(); }); });
      row.appendChild(yes); row.appendChild(no); card.appendChild(row);
      box.appendChild(card);
    });
  }).catch(function(){});
}
function pollActivity(){
  if(!token||!document.getElementById('learnOverlay').classList.contains('on'))return;
  adminFetch('/api/admin/activity').then(function(d){
    var now=$('learnNow'), pulse=$('learnPulse'), next=$('learnNext');
    if(d.current){
      now.textContent=d.current;
      pulse.style.background='#34d399'; pulse.style.animation='pulse 1.5s infinite';
    } else {
      now.textContent=d.enabled?'بی‌کار — منتظر زمان تحقیق بعدی':'یادگیری خاموش است';
      pulse.style.background=d.enabled?'#38bdf8':'#5d6478'; pulse.style.animation='';
    }
    var bits=[];
    bits.push('امروز: '+d.runsToday+' از '+d.maxPerDay+' تحقیق');
    if(d.pending)bits.push(d.pending+' مورد منتظر تأیید');
    if(d.nextRun&&d.enabled)bits.push('تحقیق بعدی حدود '+new Date(d.nextRun).toLocaleTimeString());
    next.textContent=bits.join(' · ');
    var lg=$('learnActLog'); if(lg){ lg.innerHTML='';
      (d.log||[]).forEach(function(l){
        var r=el('div'); r.style.cssText='padding:4px 0;border-bottom:1px solid rgba(255,255,255,.05);color:var(--muted)';
        r.textContent=new Date(l.at).toLocaleTimeString()+' — '+l.text;
        lg.appendChild(r);
      });
      if(!(d.log||[]).length)lg.innerHTML='<div class="tk-hint">هنوز کاری انجام نشده. یادگیری را روشن کن یا «همین حالا یک تحقیق» را بزن.</div>';
    }
  }).catch(function(){});
}
var _actTimer=null;
function openLearn(){
  if(_actTimer)clearInterval(_actTimer);
  _actTimer=setInterval(pollActivity,3000);
  setTimeout(pollActivity,300);
  loadSuggestions();
  $('learnNote').textContent='';$('learnNote').className='note';
  $('learnOverlay').classList.add('on');
  loadLearnSettings(); loadLearnKnowledge();
}
function closeLearn(){$('learnOverlay').classList.remove('on'); if(_actTimer)clearInterval(_actTimer);}
function learnNote(msg,bad){
  var n=$('learnNote'); n.textContent=msg||''; n.className='note'+(bad?' err':'');
}
function loadLearnSettings(){
  adminFetch('/api/admin/research').then(function(d){
    var st=d.settings||{};
    $('learnEnabled').checked=!!st.enabled;
    $('learnInterval').value=st.intervalMinutes||240;
    $('learnMax').value=st.maxPerDay||3;
    $('learnAuto').checked=!!st.autoApprove;
    $('learnWeb').checked=st.useWeb!==false;
    $('learnDomains').value=(st.allowedDomains||[]).join('\n');
    markLevel();
    $('learnPendingCount').textContent=d.pendingCount?('('+d.pendingCount+')'):'';
    renderLearnTopics(st.topics||[]);
  }).catch(function(e){learnNote(e.message,true);});
}
function renderLearnTopics(topics){
  var box=$('learnTopicList'); box.innerHTML='';
  if(!topics.length){ box.innerHTML='<div class="tk-hint">صف خالی است — خودش موضوع انتخاب می‌کند.</div>'; return; }
  topics.forEach(function(tp,i){
    var row=el('div','tk-card'); row.style.cssText='margin-bottom:6px;display:flex;align-items:center;gap:8px';
    var sp=el('span'); sp.style.cssText='flex:1;font-size:13px'; sp.textContent=tp;
    var del=el('button','btn ghost'); del.textContent='حذف'; del.style.padding='4px 10px';
    del.addEventListener('click',function(){
      adminFetch('/api/admin/research/topics/'+i,{method:'DELETE'})
        .then(function(d){renderLearnTopics(d.topics||[]);})
        .catch(function(e){learnNote(e.message,true);});
    });
    row.appendChild(sp); row.appendChild(del); box.appendChild(row);
  });
}
function knowledgeCard(k,pending){
  var card=el('div','tk-card'); card.style.marginBottom='8px';
  var head=el('div'); head.style.cssText='font-weight:600;font-size:13px;margin-bottom:4px';
  head.textContent=(k.flagged?'⚠️ ':'')+k.topic;
  var body=el('div'); body.style.cssText='font-size:12.5px;color:var(--muted);line-height:1.7;white-space:pre-wrap';
  body.textContent=k.content;
  var src=el('div'); src.style.cssText='font-size:11px;color:var(--muted);opacity:.7;margin-top:6px';
  src.textContent='موتورها: '+((k.sources||[]).join(' + ')||'—');
  card.appendChild(head); card.appendChild(body); card.appendChild(src);
  // Real pages it read. Clickable, so approval can be checked rather than guessed.
  if((k.sourceUrls||[]).length){
    var sw=el('div'); sw.style.cssText='margin-top:8px;padding-top:8px;border-top:1px solid rgba(255,255,255,.06)';
    var lb=el('div'); lb.style.cssText='font-size:11px;color:var(--muted);margin-bottom:4px';
    lb.textContent='از این صفحات خوانده شد:'; sw.appendChild(lb);
    k.sourceUrls.forEach(function(u){
      var a=el('a'); a.href=u; a.target='_blank'; a.rel='noopener noreferrer';
      a.style.cssText='display:block;font-size:11px;color:var(--cyan);text-decoration:none;margin-bottom:3px;word-break:break-all';
      a.textContent='↗ '+u; sw.appendChild(a);
    });
    card.appendChild(sw);
  }
  if(k.flagged){
    var w=el('div'); w.style.cssText='font-size:11.5px;color:var(--warn,#e0a800);margin-top:6px';
    w.textContent='مدل‌ها جواب‌های خیلی متفاوتی دادند — با دقت بیشتری بررسی کنید.';
    card.appendChild(w);
  }
  var acts=el('div'); acts.style.cssText='display:flex;gap:8px;margin-top:10px';
  if(pending){
    var ok=el('button','btn'); ok.textContent='✓ تأیید'; ok.style.padding='6px 14px';
    ok.addEventListener('click',function(){learnReview(k.id,'approve');});
    var no=el('button','btn ghost'); no.textContent='✗ رد'; no.style.padding='6px 14px';
    no.addEventListener('click',function(){learnReview(k.id,'reject');});
    acts.appendChild(ok); acts.appendChild(no);
  }else{
    var rm=el('button','btn ghost'); rm.textContent='حذف'; rm.style.padding='6px 14px';
    rm.addEventListener('click',function(){
      adminFetch('/api/admin/knowledge/'+k.id,{method:'DELETE'})
        .then(function(){loadLearnKnowledge();loadLearnSettings();})
        .catch(function(e){learnNote(e.message,true);});
    });
    acts.appendChild(rm);
  }
  card.appendChild(acts);
  return card;
}
function learnReview(id,action){
  adminFetch('/api/admin/knowledge/'+id+'/'+action,{method:'POST'})
    .then(function(){ learnNote(action==='approve'?'تأیید شد — از حالا در گفتگوها استفاده می‌شود.':'رد شد.'); loadLearnKnowledge(); loadLearnSettings(); })
    .catch(function(e){learnNote(e.message,true);});
}
function loadLearnKnowledge(){
  var pb=$('learnPending'), ab=$('learnApproved');
  pb.innerHTML='<div class="tk-hint"><span class="spin"></span></div>'; ab.innerHTML='';
  adminFetch('/api/admin/knowledge').then(function(d){
    var all=d.knowledge||[];
    var pend=all.filter(function(k){return k.status==='pending';});
    var appr=all.filter(function(k){return k.status==='approved';});
    pb.innerHTML=''; ab.innerHTML='';
    if(!pend.length)pb.innerHTML='<div class="tk-hint">چیزی در انتظار تأیید نیست.</div>';
    pend.forEach(function(k){pb.appendChild(knowledgeCard(k,true));});
    if(!appr.length)ab.innerHTML='<div class="tk-hint">هنوز چیزی تأیید نشده.</div>';
    appr.forEach(function(k){ab.appendChild(knowledgeCard(k,false));});
  }).catch(function(e){pb.innerHTML='';learnNote(e.message,true);});
}
$('learnBtn').addEventListener('click',openLearn);
$('learnClose').addEventListener('click',closeLearn);
$('learnOverlay').addEventListener('click',function(e){if(e.target===$('learnOverlay'))closeLearn();});
/* Learning intensity — one choice instead of three fiddly numbers.
   Same underlying settings, expressed the way a person actually thinks
   about it: how eager should she be. */
var LEVELS={
  off:    {enabled:false, intervalMinutes:240, maxPerDay:3,  label:'خاموش — هیچ تحقیقی نمی‌کند'},
  slow:   {enabled:true,  intervalMinutes:480, maxPerDay:2,  label:'آرام — روزی ۲ بار، هر ۸ ساعت'},
  normal: {enabled:true,  intervalMinutes:240, maxPerDay:4,  label:'معمولی — روزی ۴ بار، هر ۴ ساعت'},
  fast:   {enabled:true,  intervalMinutes:60,  maxPerDay:12, label:'پرشتاب — روزی ۱۲ بار، هر ساعت (مصرف API بیشتر)'},
};
function markLevel(){
  var on=$('learnEnabled').checked, iv=Number($('learnInterval').value), mx=Number($('learnMax').value);
  var cur='';
  if(!on)cur='off';
  else for(var k in LEVELS){ if(k!=='off'&&LEVELS[k].intervalMinutes===iv&&LEVELS[k].maxPerDay===mx)cur=k; }
  Array.prototype.forEach.call(document.querySelectorAll('.lvl'),function(b){
    b.className='btn '+(b.getAttribute('data-lvl')===cur?'':'ghost');
    b.style.flex='1'; b.style.padding='8px 4px'; b.style.fontSize='12px';
  });
}
Array.prototype.forEach.call(document.querySelectorAll('.lvl'),function(b){
  b.addEventListener('click',function(){
    var L=LEVELS[b.getAttribute('data-lvl')];
    $('learnEnabled').checked=L.enabled;
    $('learnInterval').value=L.intervalMinutes;
    $('learnMax').value=L.maxPerDay;
    markLevel();
    learnNote(L.label+' — «ذخیره تنظیمات» را بزن.');
  });
});

$('learnSave').addEventListener('click',function(){
  adminFetch('/api/admin/research/settings',{
    method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({
      enabled:$('learnEnabled').checked,
      autoApprove:$('learnAuto').checked,
      intervalMinutes:Number($('learnInterval').value)||240,
      maxPerDay:Number($('learnMax').value)||3,
      useWeb:$('learnWeb').checked,
      allowedDomains:$('learnDomains').value.split('\n').map(function(x){return x.trim();}).filter(Boolean)
    })
  }).then(function(d){
    learnNote('ذخیره شد.'); 
    if(d.settings){$('learnMax').value=d.settings.maxPerDay;$('learnInterval').value=d.settings.intervalMinutes;}
  }).catch(function(e){learnNote(e.message,true);});
});
$('learnAddTopic').addEventListener('click',function(){
  var v=$('learnTopic').value.trim(); if(!v)return;
  adminFetch('/api/admin/research/topics',{
    method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({topic:v})
  }).then(function(d){$('learnTopic').value='';renderLearnTopics(d.topics||[]);learnNote('به صف اضافه شد.');})
    .catch(function(e){learnNote(e.message,true);});
});
$('learnTopic').addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();$('learnAddTopic').click();}});
$('learnRunNow').addEventListener('click',function(){
  learnNote('در حال تحقیق... چند ثانیه صبر کنید.');
  // Research can take 20-60 seconds (it reads real pages). Without feedback
  // the button looked broken, which is why it seemed to "do nothing".
  learnNote('در حال تحقیق... این کار ممکن است تا یک دقیقه طول بکشد.');
  adminFetch('/api/admin/research/run-now',{method:'POST'}).then(function(d){
    if(d.entry)learnNote('یاد گرفت: «'+d.entry.topic+'» — پایین بررسی و تأیید کنید.');
    else if(d.skipped==='privacy-blocked')learnNote('موضوع حاوی اطلاعات خانوادگی بود و ارسال نشد.',true);
    else if(d.skipped==='no-provider')learnNote('هیچ موتور هوش مصنوعی کلید ندارد.',true);
    else if(d.error)learnNote(d.error,true);
    else learnNote('انجام نشد: '+(d.skipped||'نامشخص'),true);
    loadLearnKnowledge(); loadLearnSettings();
  }).catch(function(e){learnNote(e.message,true);});
});

$('adminBtn').addEventListener('click',openAdmin);
$('adminClose').addEventListener('click',closeAdmin);
$('adminAdd').addEventListener('click',adminAddUser);
$('adminOverlay').addEventListener('click',function(e){if(e.target===$('adminOverlay'))closeAdmin();});
$('settingsSave').addEventListener('click',saveNewPassword);
$('settingsOverlay').addEventListener('click',function(e){if(e.target===$('settingsOverlay'))closeSettings();});
$('clearChatsBtn').addEventListener('click',clearAllChats);
// ---- multi code-library manager ----
var codeLibList=[];
function codeLibNote(m){$('codeLibNote').textContent=m||'';if(m)setTimeout(function(){$('codeLibNote').textContent='';},1800);}
function codeLibRefresh(keep){
  return tkFetch('/api/codelibs').then(function(d){
    codeLibList=(d&&d.libs)||[];
    var sel=$('codeLibSel');var want=keep||sel.value;
    sel.innerHTML='';
    codeLibList.forEach(function(l){
      var o=document.createElement('option');o.value=l.name;
      o.textContent=l.name+' ('+Math.max(1,Math.round(l.size/1024))+'k)';
      sel.appendChild(o);
    });
    if(!codeLibList.length){var o=document.createElement('option');o.value='';o.textContent='— هنوز کتابخانه‌ای نیست —';sel.appendChild(o);$('codeLibText').value='';return;}
    if(want&&codeLibList.some(function(l){return l.name===want;}))sel.value=want;
    codeLibLoad(sel.value);
  }).catch(function(){});
}
function codeLibLoad(name){
  if(!name){$('codeLibText').value='';return;}
  tkFetch('/api/codelib?name='+encodeURIComponent(name)).then(function(d){$('codeLibText').value=(d&&d.text)||'';}).catch(function(){});
}
$('codeLibSel').addEventListener('change',function(){codeLibLoad(this.value);});
$('codeLibNew').addEventListener('click',function(){
  var name=(prompt('نام کتابخانه‌ی جدید (مثل python یا cpp):')||'').trim();
  if(!name)return;
  tkFetch('/api/codelib',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:name,text:'# '+name+'\n\n'})})
    .then(function(){return codeLibRefresh(name);}).then(function(){codeLibNote(t('codeLibSaved'));})
    .catch(function(e){codeLibNote(e.message);});
});
$('codeLibSave').addEventListener('click',function(){
  var name=$('codeLibSel').value;if(!name){codeLibNote('اول یک کتابخانه بساز.');return;}
  tkFetch('/api/codelib',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:name,text:$('codeLibText').value})})
    .then(function(){codeLibNote(t('codeLibSaved'));}).catch(function(e){codeLibNote(e.message);});
});
$('codeLibDl').addEventListener('click',function(){
  var name=$('codeLibSel').value;if(!name)return;
  window.open('/api/codelib/download?name='+encodeURIComponent(name),'_blank');
});
$('codeLibDel').addEventListener('click',function(){
  var name=$('codeLibSel').value;if(!name)return;
  if(!confirm('کتابخانه‌ی «'+name+'» حذف شود؟'))return;
  tkFetch('/api/codelib?name='+encodeURIComponent(name),{method:'DELETE'})
    .then(function(){return codeLibRefresh();}).then(function(){codeLibNote('حذف شد ✓');})
    .catch(function(e){codeLibNote(e.message);});
});
$('codeLibUp').addEventListener('click',function(){$('codeLibFile').click();});
$('codeLibFile').addEventListener('change',function(){
  var f=this.files&&this.files[0];if(!f)return;
  var fd=new FormData();fd.append('file',f);
  fetch('/api/codelib/upload',{method:'POST',headers:authHeaders(),body:fd})
    .then(function(r){return r.json();}).then(function(d){
      if(d&&d.error){codeLibNote(d.error);return;}
      codeLibRefresh(d&&d.name).then(function(){codeLibNote('بارگذاری شد ✓');});
    }).catch(function(e){codeLibNote(e.message);});
  this.value='';
});
Array.prototype.forEach.call(document.querySelectorAll('#textSizeRow .seg'),function(b){
  b.addEventListener('click',function(){applyTextSize(b.getAttribute('data-size'));});
});

$('modelPicker').addEventListener('change',function(){
  var v=$('modelPicker').value.split('|');provider=v[0];model=v[1];updateEngineTag();
});

$('cmpBtn').addEventListener('click',function(){
  compareOn=!compareOn;
  $('cmpBtn').classList.toggle('on',compareOn);
  $('cmpbar').classList.toggle('on',compareOn);
  if(compareOn&&!compareTargets.length){
    var opts=allModelOptions().slice(0,2);
    compareTargets=opts.map(function(o){return o.provider+'|'+o.model;});
    buildCompareChips();
  }
});

$('searchBtn').addEventListener('click',function(){
  // Live search borrows Gemini's grounding on the server — the visible engine
  // (GPT) stays selected; only this reply is answered with live web results.
  var gem=allModelOptions().filter(function(o){return o.provider==='gemini';})[0];
  if(!gem){ flashHint(t('searchNeedsGemini')); return; }
  searchOn=!searchOn;
  $('searchBtn').classList.toggle('on',searchOn);
  if(searchOn) flashHint(t('searchOnMsg'));
});

/* ===== Voice: speak & listen (great for the kids) ===== */
var speakOn=false, recog=null, recording=false;
function voiceLang(sample){
  if(sample&&/[؀-ۿ]/.test(sample))return 'fa-IR';
  var l=document.documentElement.getAttribute('lang');
  return l==='en'?'en-US':'fa-IR';
}
/* Setayesh should sound like a young girl, not the browser's default
   (which is usually a male voice). Pick the best FEMALE voice available for
   the language, then raise the pitch so it reads young rather than adult. */
var _voiceCache=null;
function pickFemaleVoice(lang){
  var voices=[];
  try{ voices=window.speechSynthesis.getVoices()||[]; }catch(e){ return null; }
  if(!voices.length)return null;
  var base=(lang||'').split('-')[0];
  // Named voices known to be female, best first, per platform.
  var FEMALE_NAMES=['zira','hoda','samantha','victoria','karen','moira','tessa',
                    'fiona','serena','allison','ava','susan','google us english',
                    'google uk english female','female','woman','دنا','هدی','ندا'];
  var sameLang=voices.filter(function(v){return (v.lang||'').toLowerCase().indexOf(base)===0;});
  var pool=sameLang.length?sameLang:voices;
  // 1) explicit female-sounding name
  for(var i=0;i<FEMALE_NAMES.length;i++){
    for(var j=0;j<pool.length;j++){
      if((pool[j].name||'').toLowerCase().indexOf(FEMALE_NAMES[i])>=0)return pool[j];
    }
  }
  // 2) skip voices with clearly male names
  var MALE=['david','mark','george','daniel','alex','fred','thomas','james','male','man'];
  for(var k=0;k<pool.length;k++){
    var n=(pool[k].name||'').toLowerCase(), male=false;
    for(var m=0;m<MALE.length;m++){ if(n.indexOf(MALE[m])>=0){male=true;break;} }
    if(!male)return pool[k];
  }
  return pool[0]||null;
}
// Voice list loads asynchronously in most browsers.
if('speechSynthesis' in window){
  try{ window.speechSynthesis.onvoiceschanged=function(){_voiceCache=null;}; }catch(e){}
}
function speakText(raw){
  if(!speakOn||!('speechSynthesis' in window)||!raw)return;
  // strip markdown/code so it reads naturally
  var txt=String(raw).replace(/```[\s\S]*?```/g,' . ').replace(/`[^`]*`/g,' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g,' ').replace(/\[([^\]]*)\]\([^)]*\)/g,'$1')
    .replace(/[#>*_~|]/g,' ').replace(/\s+/g,' ').trim();
  if(!txt)return;
  try{
    window.speechSynthesis.cancel();
    var u=new SpeechSynthesisUtterance(txt.slice(0,1200));
    u.lang=voiceLang(txt);
    var v=pickFemaleVoice(u.lang);
    if(v)u.voice=v;
    // Higher pitch + slightly slower = young girl rather than grown woman.
    u.pitch=1.45;
    u.rate=isKidUser()?0.95:1.02;
    window.speechSynthesis.speak(u);
  }catch(e){}
}
$('speakBtn').addEventListener('click',function(){
  if(!('speechSynthesis' in window)){flashHint('مرورگر از صدا پشتیبانی نمی‌کند');return;}
  speakOn=!speakOn;
  $('speakBtn').classList.toggle('on',speakOn);
  if(speakOn){ flashHint('🔊 جواب‌ها با صدا خوانده می‌شوند'); }
  else{ try{window.speechSynthesis.cancel();}catch(e){} }
});
$('micBtn').addEventListener('click',function(){
  var SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!SR){flashHint('مرورگر از میکروفون پشتیبانی نمی‌کند — از کروم استفاده کن');return;}
  if(recording){ try{recog&&recog.stop();}catch(e){} return; }
  recog=new SR();
  recog.lang=voiceLang($('msgBox').value); recog.interimResults=true; recog.continuous=false;
  var base=$('msgBox').value?($('msgBox').value+' '):'';
  recog.onstart=function(){recording=true;$('micBtn').classList.add('rec');flashHint('🎤 گوش می‌دهم… حرف بزن');};
  recog.onerror=function(){recording=false;$('micBtn').classList.remove('rec');};
  recog.onend=function(){recording=false;$('micBtn').classList.remove('rec');$('msgBox').focus();autoGrow&&autoGrow();};
  recog.onresult=function(e){
    var s='';for(var i=0;i<e.results.length;i++)s+=e.results[i][0].transcript;
    $('msgBox').value=base+s; autoGrow&&autoGrow();
  };
  try{recog.start();}catch(e){}
});
function flashHint(msg){
  var el2=$('pending'); if(!el2)return;
  el2.style.display='flex';
  var n=el('div','pf'); n.style.cssText='background:rgba(34,211,238,.12);border-color:rgba(34,211,238,.35);color:#7ee7f5';
  n.textContent='🔎 '+msg; el2.innerHTML=''; el2.appendChild(n);
  setTimeout(function(){ if(!pendingFiles.length){el2.style.display='none';el2.innerHTML='';} },3200);
}
/* ===== Installable app (PWA) + offline queue =====
   The service worker keeps the app openable when the home computer is off or
   the tunnel is down. Anything typed while offline is held on the phone and
   sent automatically once the server answers again — the phone stores, the
   computer still does the thinking. */
loadThemePublic();   // paint with the owner's saved look right away
/* Automatic updates.
   Nobody should have to know to press refresh. The page asks the server what
   version it is running, and when that changes it reloads itself — during a
   quiet moment, never mid-sentence while someone is typing. */
var RUNNING_VERSION=null, updatePending=false;

function applyUpdateWhenIdle(){
  updatePending=true;
  var box=$('msgBox');
  var busyTyping = box && box.value.trim().length>0;
  var anyPanelOpen = !!document.querySelector('.overlay.on');
  // Wait for a natural pause rather than yanking the page away mid-thought.
  if(busy||busyTyping||anyPanelOpen){ setTimeout(applyUpdateWhenIdle,4000); return; }
  showUpdateBar();
}

function showUpdateBar(){
  if(document.getElementById('updBar'))return;
  var bar=document.createElement('div');
  bar.id='updBar';
  bar.style.cssText='position:fixed;inset-inline:0;bottom:0;z-index:300;padding:11px 16px;'+
    'background:rgba(56,189,248,.16);border-top:1px solid rgba(56,189,248,.45);'+
    'backdrop-filter:blur(12px);display:flex;align-items:center;gap:12px;'+
    'font-size:13px;color:var(--text);padding-bottom:calc(11px + env(safe-area-inset-bottom,0px))';
  var t=document.createElement('span');
  t.style.flex='1';
  t.textContent='نسخه‌ی جدید آماده است — تا ۵ ثانیه دیگر خودکار به‌روز می‌شود.';
  var now=document.createElement('button');
  now.className='btn'; now.style.cssText='padding:6px 14px;font-size:12px';
  now.textContent='همین حالا';
  now.addEventListener('click',doReload);
  var later=document.createElement('button');
  later.className='btn ghost'; later.style.cssText='padding:6px 12px;font-size:12px';
  later.textContent='بعداً';
  later.addEventListener('click',function(){ bar.remove(); updatePending=false; });
  bar.appendChild(t); bar.appendChild(now); bar.appendChild(later);
  document.body.appendChild(bar);
  var left=5;
  var iv=setInterval(function(){
    left--;
    if(!document.body.contains(bar)){ clearInterval(iv); return; }
    if(left<=0){ clearInterval(iv); doReload(); }
    else t.textContent='نسخه‌ی جدید آماده است — تا '+left+' ثانیه دیگر خودکار به‌روز می‌شود.';
  },1000);
}

function doReload(){
  // Drop the cached shell so the new files are actually fetched.
  if('caches' in window){
    caches.keys().then(function(ks){ return Promise.all(ks.map(function(k){return caches.delete(k);})); })
      .catch(function(){}).then(function(){ location.reload(true); });
  } else location.reload(true);
}

function watchForUpdates(){
  setInterval(function(){
    if(updatePending||!token)return;
    fetch('/api/version',{cache:'no-store'})
      .then(function(r){return r.json();})
      .then(function(d){
        if(!RUNNING_VERSION){ RUNNING_VERSION=d.version; return; }
        if(d.version && d.version!==RUNNING_VERSION) applyUpdateWhenIdle();
      }).catch(function(){});
  }, 60000);
}

if('serviceWorker' in navigator){
  window.addEventListener('load',function(){
    navigator.serviceWorker.register('/sw.js').then(function(reg){
      // A waiting worker means an update downloaded while the page was open.
      if(reg.waiting) applyUpdateWhenIdle();
      reg.addEventListener('updatefound',function(){
        var nw=reg.installing;
        if(!nw)return;
        nw.addEventListener('statechange',function(){
          if(nw.state==='installed'&&navigator.serviceWorker.controller) applyUpdateWhenIdle();
        });
      });
      // Check for a new build every few minutes without the user doing anything.
      setInterval(function(){ reg.update().catch(function(){}); }, 300000);
    }).catch(function(){});
    navigator.serviceWorker.addEventListener('message',function(e){
      if(e.data&&e.data.type==='SW_UPDATED') applyUpdateWhenIdle();
    });
  });
}

var OFFLINE_KEY='setayesh.outbox';
function outboxRead(){ try{ return JSON.parse(localStorage.getItem(OFFLINE_KEY)||'[]'); }catch(e){ return []; } }
function outboxWrite(list){ try{ localStorage.setItem(OFFLINE_KEY,JSON.stringify(list.slice(-30))); }catch(e){} }
function outboxAdd(item){ var l=outboxRead(); l.push(item); outboxWrite(l); renderOfflineBar(); }

function renderOfflineBar(){
  var n=outboxRead().length;
  var bar=document.getElementById('offlineBar');
  if(!bar){
    bar=document.createElement('div'); bar.id='offlineBar';
    bar.style.cssText='display:none;margin:0 0 8px;padding:9px 13px;border-radius:11px;'+
      'background:rgba(251,191,36,.10);border:1px solid rgba(251,191,36,.35);'+
      'color:#fbbf24;font-size:12.5px;line-height:1.6';
    var wrap=document.querySelector('.composer-wrap');
    if(wrap)wrap.insertBefore(bar,wrap.firstChild); else return;
  }
  if(!navigator.onLine||n){
    bar.style.display='';
    bar.textContent=!navigator.onLine
      ? (n? '📴 آفلاین — '+n+' پیام در صف، وقتی وصل شدی فرستاده می‌شود.'
          : '📴 آفلاین — گفتگوهای قبلی را می‌توانی بخوانی. پیام بنویسی، در صف می‌ماند.')
      : '⏳ '+n+' پیام در صف ارسال...';
  } else bar.style.display='none';
}

async function flushOutbox(){
  var list=outboxRead();
  if(!list.length||!navigator.onLine||!token)return;
  var remaining=[];
  for(var i=0;i<list.length;i++){
    try{
      var fd=new FormData();
      fd.append('message',list[i].text);
      if(list[i].mode)fd.append('mode',list[i].mode);
      var r=await fetch('/api/chat',{method:'POST',headers:authHeaders(),body:fd});
      if(!r.ok)throw new Error('retry later');
      var d=await r.json();
      if(activeChat){
        activeChat.msgs.push({role:'user',text:list[i].text,files:[]});
        activeChat.msgs.push({role:'ai',text:d.reply,model:d.model,provider:d.provider});
        activeChat.history.push({role:'user',content:list[i].text});
        activeChat.history.push({role:'assistant',content:d.reply});
        saveChats();renderThread();
      }
    }catch(e){ remaining=remaining.concat(list.slice(i)); break; }
  }
  outboxWrite(remaining);
  renderOfflineBar();
}
window.addEventListener('online',function(){ renderOfflineBar(); flushOutbox(); });
window.addEventListener('offline',renderOfflineBar);

/* ===== Device recognition =====
   The browser keeps a random id. On login we send a small profile (screen,
   touch, platform, language, timezone) and the server tells us which layout
   to use. This is why the app looks right on a phone without anyone choosing
   a "mobile mode", and why per-device preferences come back next time. */
function deviceId(){
  var k='setayesh-device-id', v='';
  try{ v=localStorage.getItem(k)||''; }catch(e){}
  if(!v){
    v=(Date.now().toString(36)+Math.random().toString(36).slice(2,10));
    try{ localStorage.setItem(k,v); }catch(e){}
  }
  return v;
}
function browserFamily(){
  var u=navigator.userAgent;
  if(/Edg\//.test(u))return 'Edge';
  if(/OPR\//.test(u))return 'Opera';
  if(/Chrome\//.test(u)&&!/Chromium/.test(u))return 'Chrome';
  if(/Firefox\//.test(u))return 'Firefox';
  if(/Safari\//.test(u))return 'Safari';
  return 'Browser';
}
function platformName(){
  var u=navigator.userAgent;
  if(/iPhone/.test(u))return 'iPhone';
  if(/iPad/.test(u))return 'iPad';
  if(/Android/.test(u))return 'Android';
  if(/Windows/.test(u))return 'Windows';
  if(/Mac OS X/.test(u))return 'Mac';
  if(/Linux/.test(u))return 'Linux';
  return 'Unknown';
}
// A device is classified the instant the page paints, from signals the
// browser already has — no waiting on the network. This is what the earlier
// device-registry code was missing: it asked the server and then did
// nothing with the answer, so a tablet always got the same layout as a
// phone or a desktop, decided purely by a width media query.
function applyDevicePrefs(){
  // Placeholder for per-device saved preferences (e.g. a tablet-specific
  // font scale) coming back from the server; wired here so future prefs
  // have one place to land instead of scattering checks through the page.
  var p=DEVICE.prefs||{};
  if(p.fontScale)document.documentElement.style.setProperty('--font-scale',p.fontScale);
}
function guessDeviceKind(){
  var w=Math.max(window.innerWidth||0, window.screen&&screen.width||0);
  var touch=('ontouchstart' in window)||navigator.maxTouchPoints>0;
  var ua=navigator.userAgent||'';
  if(/iPad/.test(ua) || (touch && /Macintosh/.test(ua))) return 'tablet';  // iPadOS reports as Mac
  if(!touch) return 'desktop';  // no touch capability at all: always desktop rules, regardless of window width
  if(w<=500) return 'phone';
  if(w<=1100) return 'tablet';
  return 'touch-desktop';
}
var DEVICE={id:deviceId(),kind:guessDeviceKind(),prefs:{}};
document.documentElement.setAttribute('data-device',DEVICE.kind);
// Screens change under us: a tablet is rotated, a desktop window is dragged
// narrow, a phone is folded open. Re-detect on resize/rotate and re-apply the
// layout live, so the interface fits the screen automatically instead of being
// frozen to whatever it was at first paint. Debounced so a drag isn't a storm.
(function watchScreen(){
  var t=null;
  function reDetect(){
    var k=guessDeviceKind();
    if(k!==DEVICE.kind){
      DEVICE.kind=k;
      document.documentElement.setAttribute('data-device',k);
      var b=document.body;
      b.classList.remove('dev-phone','dev-tablet','dev-desktop','dev-touch-desktop');
      b.classList.add('dev-'+k);
      try{ applyDevicePrefs(); }catch(e){}
    }
  }
  function schedule(){ if(t)clearTimeout(t); t=setTimeout(reDetect,220); }
  window.addEventListener('resize',schedule);
  window.addEventListener('orientationchange',schedule);
})();
function registerDevice(){
  var body={
    id:DEVICE.id,
    screenW:Math.round(window.screen&&screen.width||window.innerWidth),
    screenH:Math.round(window.screen&&screen.height||window.innerHeight),
    touch:('ontouchstart' in window)||navigator.maxTouchPoints>0,
    platform:platformName(),
    browser:browserFamily(),
    lang:navigator.language||'',
    tz:(Intl.DateTimeFormat().resolvedOptions().timeZone)||''
  };
  return fetch('/api/device',{method:'POST',
    headers:authHeaders({'Content-Type':'application/json'}),
    body:JSON.stringify(body)}).then(function(r){return r.json();}).then(function(d){
      if(!d||d.error)throw new Error('device');
      DEVICE.kind=d.kind; DEVICE.prefs=d.prefs||{};
      document.documentElement.setAttribute('data-device',DEVICE.kind);
      applyDevicePrefs();
      applyDeviceLayout(d.layout,d.kind);
      return d;
    }).catch(function(){ /* device profiling is a nicety, never block the app */ });
}
function applyDeviceLayout(L,kind){
  if(!L)return;
  var b=document.body;
  b.classList.remove('dev-phone','dev-tablet','dev-desktop','dev-touch-desktop');
  b.classList.add('dev-'+kind);
  if(L.compact)b.classList.add('compact');
  if(!L.effects){
    ['grid','scan','sweep'].forEach(function(c){
      Array.prototype.forEach.call(document.querySelectorAll('.'+c),function(e){e.style.display='none';});
    });
    var fx=$('fx3d'); if(fx)fx.style.display='none';
  }
  if(L.fontScale&&L.fontScale!==1)b.style.fontSize=(L.fontScale*100)+'%';
}
function saveDevicePref(key,val){
  var o={}; o[key]=val;
  fetch('/api/device/prefs',{method:'POST',
    headers:authHeaders({'Content-Type':'application/json'}),
    body:JSON.stringify({id:DEVICE.id,prefs:o})}).catch(function(){});
}

/* ===== Notifications =====
   The approval queue is useless if the father never looks. So when Setayesh
   needs him — permission to run, something finished, something urgent — a red
   badge appears wherever he is in the app, and (if set up) an email goes out.
   Only the admin ever sees these. */
function startNotifications(){
  var bell=document.getElementById('notifBell');
  if(!bell){
    bell=document.createElement('button');
    bell.id='notifBell';
    bell.style.cssText='position:fixed;top:12px;inset-inline-end:12px;z-index:250;width:42px;height:42px;'+
      'border-radius:50%;border:1px solid var(--border);background:rgba(17,20,34,.9);backdrop-filter:blur(10px);'+
      'cursor:pointer;display:none;align-items:center;justify-content:center;color:var(--text);font-size:18px';
    bell.innerHTML='🔔<span id="notifDot" style="display:none;position:absolute;top:-3px;inset-inline-end:-3px;'+
      'min-width:18px;height:18px;padding:0 4px;border-radius:9px;background:#fb7185;color:#fff;'+
      'font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center"></span>';
    bell.addEventListener('click',openNotifications);
    document.body.appendChild(bell);
  }
  pollNotifications();
  setInterval(pollNotifications, 30000);
}
var _lastNotifId=null;
function showNotifToast(n){
  var t=document.createElement('div');
  t.style.cssText='position:fixed;top:14px;left:50%;transform:translateX(-50%);z-index:400;'+
    'max-width:90vw;padding:12px 16px;border-radius:13px;background:rgba(17,20,34,.97);'+
    'border:1px solid '+(n.level==='urgent'||n.level==='needs-approval'?'rgba(251,113,133,.5)':'rgba(56,189,248,.4)')+';'+
    'box-shadow:0 10px 40px rgba(0,0,0,.5);cursor:pointer;font-size:13px;line-height:1.6;'+
    'animation:notifIn .3s ease';
  t.innerHTML='<b>'+(n.level==='urgent'?'⚠️ ':n.level==='needs-approval'?'🔐 ':n.level==='done'?'✅ ':'🔔 ')+
    (n.title||'')+'</b>'+(n.body?'<br><span style="color:var(--muted);font-size:12px">'+n.body+'</span>':'');
  t.addEventListener('click',function(){ t.remove(); openNotifications(); });
  document.body.appendChild(t);
  setTimeout(function(){ t.style.transition='opacity .4s'; t.style.opacity='0'; setTimeout(function(){t.remove();},400); }, 7000);
}
function pollNotifications(){
  if(!token)return;
  fetch('/api/notifications',{headers:authHeaders()})
    .then(function(r){return r.json();})
    .then(function(d){
      // A genuinely new, unseen notice pops up on screen once.
      var items=d.items||[];
      if(items.length && !items[0].seen && items[0].id!==_lastNotifId){
        if(_lastNotifId!==null) showNotifToast(items[0]);
        _lastNotifId=items[0].id;
      }
      var bell=document.getElementById('notifBell'), dot=document.getElementById('notifDot');
      if(!bell)return;
      window._notifs=d.items||[];
      // The bell only exists while there is something unseen. Once everything
      // is read (or cleared), it disappears — no permanent icon sitting there.
      if(d.unseen>0){
        bell.style.display='flex'; dot.style.display='flex'; dot.textContent=d.unseen>9?'9+':d.unseen;
      } else {
        bell.style.display='none'; dot.style.display='none';
      }
    }).catch(function(){});
}
function openNotifications(){
  var items=window._notifs||[];
  var ov=document.getElementById('notifOverlay');
  if(!ov){
    ov=document.createElement('div'); ov.id='notifOverlay'; ov.className='overlay';
    ov.innerHTML='<div class="modal glass" style="max-width:520px"><h3>🔔 اعلان‌ها</h3>'+
      '<div id="notifList" style="max-height:60vh;overflow-y:auto"></div>'+
      '<div class="modal-actions"><button class="btn ghost" id="notifClear">پاک کردن همه</button>'+
      '<button class="btn ghost" id="notifClose">بستن</button></div></div>';
    document.body.appendChild(ov);
    ov.addEventListener('click',function(e){ if(e.target===ov)ov.classList.remove('on'); });
    document.getElementById('notifClose').addEventListener('click',function(){ ov.classList.remove('on'); });
    document.getElementById('notifClear').addEventListener('click',function(){
      fetch('/api/notifications/clear',{method:'POST',headers:authHeaders()})
        .then(function(){ window._notifs=[]; openNotifications(); pollNotifications(); });
    });
  }
  var list=document.getElementById('notifList'); list.innerHTML='';
  if(!items.length)list.innerHTML='<div class="tk-hint">چیزی نیست.</div>';
  items.forEach(function(n){
    var card=el('div','tk-card'); card.style.cssText='margin-bottom:8px;padding:10px 12px;'+
      (n.level==='urgent'||n.level==='needs-approval'?'border-color:rgba(251,113,133,.4)':'');
    var t=el('div'); t.style.cssText='font-weight:600;font-size:13px;margin-bottom:3px';
    t.textContent=(n.level==='urgent'?'⚠️ ':n.level==='needs-approval'?'🔐 ':n.level==='done'?'✅ ':'🔔 ')+n.title;
    card.appendChild(t);
    if(n.body){ var b=el('div'); b.style.cssText='font-size:12px;color:var(--muted);line-height:1.7'; b.textContent=n.body; card.appendChild(b); }
    var m=el('div'); m.style.cssText='display:flex;justify-content:space-between;align-items:center;font-size:10.5px;color:var(--muted);opacity:.7;margin-top:4px';
    var when=el('span'); when.textContent=new Date(n.at).toLocaleString()+(n.emailed?' · ایمیل شد':'');
    var x=el('button'); x.textContent='حذف'; x.style.cssText='background:none;border:none;color:var(--muted);cursor:pointer;font-size:11px';
    x.addEventListener('click',function(ev){ ev.stopPropagation();
      fetch('/api/notifications/'+n.id,{method:'DELETE',headers:authHeaders()}).then(function(){ card.remove(); pollNotifications(); }); });
    m.appendChild(when); m.appendChild(x);
    card.appendChild(m);
    if(n.level==='needs-approval'){
      var go=el('button','btn'); go.textContent='رفتن به تأییدها'; go.style.cssText='padding:5px 12px;font-size:12px;margin-top:8px';
      go.addEventListener('click',function(){ ov.classList.remove('on'); openCC(); setTimeout(function(){ ccTab('actions'); },200); });
      card.appendChild(go);
    }
    list.appendChild(card);
  });
  ov.classList.add('on');
  fetch('/api/notifications/seen',{method:'POST',headers:authHeaders()}).then(pollNotifications).catch(function(){});
}

/* Show the running version in the sidebar. It is read from the server rather
   than written into the page, so it can never disagree with what is actually
   running — the confusion of the last few installs. */
/* Four different buttons opened the same Settings panel: one in the sidebar,
   one in the top bar, one inside the composer, one in the drawer. Two are
   enough — the sidebar for desktop, the drawer for phones. */
function removeDuplicateSettings(){
  ['settingsBtnTop','settingsBtnComposer'].forEach(function(id){
    var e=document.getElementById(id);
    if(e)e.style.display='none';
  });
}

function openDiagnostics(){
  var ov=document.getElementById('diagOverlay');
  if(!ov){
    ov=document.createElement('div'); ov.id='diagOverlay'; ov.className='overlay';
    ov.innerHTML='<div class="modal glass" style="max-width:480px"><h3>وضعیت حساب تو</h3>'+
      '<div id="diagBody" style="font-size:13px;line-height:2;direction:ltr;text-align:left;font-family:var(--mono)"></div>'+
      '<div class="modal-actions"><button class="btn ghost" id="diagClose">بستن</button></div></div>';
    document.body.appendChild(ov);
    ov.addEventListener('click',function(e){ if(e.target===ov)ov.classList.remove('on'); });
    document.getElementById('diagClose').addEventListener('click',function(){ ov.classList.remove('on'); });
  }
  var body=document.getElementById('diagBody');
  body.textContent='در حال بررسی...';
  ov.classList.add('on');
  fetch('/api/whoami-debug',{headers:authHeaders()})
    .then(function(r){return r.json();})
    .then(function(d){
      var lines=[];
      lines.push('حساب تو: '+d.you);
      lines.push('حساب مدیر: '+(d.resolvedAdmin||'(هیچ‌کدام)'));
      lines.push('تو مدیر هستی: '+(d.youAreAdmin?'بله ✓':'نه ✗'));
      lines.push('همه‌ی حساب‌ها: '+d.knownAccounts.join(', '));
      body.innerHTML='';
      lines.forEach(function(l){
        var p=document.createElement('div');
        p.textContent=l;
        if(l.indexOf('نه ✗')>=0)p.style.color='#fb7185';
        if(l.indexOf('بله')>=0)p.style.color='#34d399';
        body.appendChild(p);
      });
      // خطاهای زمان اجرا (اگر باشند) — همان چیزی که باعث کار نکردن دکمه‌ها می‌شود.
      var errs=window.__setayeshErrors||[];
      if(errs.length){
        var eb=document.createElement('div');
        eb.style.cssText='margin-top:14px;padding:12px;border-radius:10px;background:rgba(251,113,133,.12);'+
          'border:1px solid rgba(251,113,133,.4);font-family:monospace;font-size:11px;direction:ltr;text-align:left;color:#fbb';
        eb.textContent='⚠ '+errs.length+' JS error(s):';
        errs.slice(0,5).forEach(function(x){
          var l=document.createElement('div'); l.style.marginTop='4px';
          l.textContent='• '+x.msg+(x.src?(' ('+x.src+':'+x.line+')'):'');
          eb.appendChild(l);
        });
        body.appendChild(eb);
      } else {
        var okb=document.createElement('div');
        okb.style.cssText='margin-top:14px;padding:10px;border-radius:10px;background:rgba(52,211,153,.1);border:1px solid rgba(52,211,153,.3);font-size:12px;color:#6ee7b7;direction:rtl;text-align:right';
        okb.textContent='✓ هیچ خطای جاوااسکریپتی نیست — همه‌چیز باید کار کند.';
        body.appendChild(okb);
      }
      // بررسی بارگذاری کتابخانه‌ی سه‌بعدی
      var three=document.createElement('div');
      three.style.cssText='margin-top:8px;padding:10px;border-radius:10px;font-size:12px;direction:rtl;text-align:right;'+
        (typeof THREE!=='undefined'?'background:rgba(52,211,153,.1);border:1px solid rgba(52,211,153,.3);color:#6ee7b7':'background:rgba(251,191,36,.12);border:1px solid rgba(251,191,36,.4);color:#fcd34d');
      three.textContent=typeof THREE!=='undefined'?'✓ کتابخانه‌ی سه‌بعدی بارگذاری شد — مغز کار می‌کند.':'⚠ کتابخانه‌ی سه‌بعدی بارگذاری نشد — فایل three.min.js در پوشه‌ی public نیست یا نصب ناقص بوده. مغز نمای ساده نشان می‌دهد.';
      body.appendChild(three);

      if(!d.youAreAdmin){
        var hint=document.createElement('div');
        hint.style.cssText='margin-top:14px;padding-top:14px;border-top:1px solid rgba(255,255,255,.1);'+
          'font-family:inherit;direction:rtl;text-align:right;color:var(--muted);font-size:12.5px;line-height:1.9';
        hint.textContent='برای اینکه مدیر شوی، این خط را در فایل .setayesh-config (کنار index.js) اضافه کن: ADMIN='+d.you+'  — بعد برنامه را دوباره اجرا کن.';
        body.appendChild(hint);
      }
    })
    .catch(function(e){ body.textContent='خطا: '+e.message; });
}
document.getElementById('shDiag').addEventListener('click',function(){ sheetGo(openDiagnostics); });

/* ===== SETAYESH BRAIN — 3D ===== =========================================
   A living brain wired to /api/admin/brain. Regions are real subsystems;
   their size and glow come from real counts. Neurons fire only when she is
   actually thinking. Tap a region to inspect it; tap a source-file region to
   edit her code in place. */
var BRAIN = { scene:null, cam:null, renderer:null, raf:null, regions:[], pulses:[], data:null, pollTimer:null, hovered:null };

function openBrain(){
  var ov=document.getElementById('brainOverlay');
  ov.style.display='block';
  if(typeof THREE==='undefined'){
    // نمای سه‌بعدی در دسترس نیست — به‌جای صفحه‌ی خالی، همان داده‌ها را ساده
    // نشان می‌دهیم تا مغز همیشه چیزی برای دیدن داشته باشد.
    document.getElementById('brainStatus').textContent='نمای ساده (سه‌بعدی بارگذاری نشد)';
    brainRefresh2D();
    BRAIN.pollTimer=setInterval(brainRefresh2D, 4000);
    return;
  }
  brainInit();
  brainRefresh();
  BRAIN.pollTimer=setInterval(brainRefresh, 4000);
}
function closeBrain(){
  var ov=document.getElementById('brainOverlay');
  ov.style.display='none';
  if(BRAIN.raf)cancelAnimationFrame(BRAIN.raf);
  if(BRAIN.pollTimer)clearInterval(BRAIN.pollTimer);
  document.getElementById('brainEditor').style.display='none';
  var h2=document.getElementById('brain2D'); if(h2)h2.remove();
  document.getElementById('brainCanvas').style.display='block';
}

function brainInit(){
  if(BRAIN.scene)return;   // once
  var canvas=document.getElementById('brainCanvas');
  var W=window.innerWidth, H=window.innerHeight;
  var scene=new THREE.Scene();
  scene.fog=new THREE.FogExp2(0x03040a, 0.02);
  var cam=new THREE.PerspectiveCamera(55, W/H, 0.1, 1000);
  cam.position.set(0,2,34);
  var renderer=new THREE.WebGLRenderer({canvas:canvas, antialias:true, alpha:true});
  renderer.setSize(W,H); renderer.setPixelRatio(Math.min(devicePixelRatio,2));

  scene.add(new THREE.AmbientLight(0x4466aa, 0.6));
  var p1=new THREE.PointLight(0x7b5cff,1.2,120); p1.position.set(20,20,20); scene.add(p1);
  var p2=new THREE.PointLight(0x22d3ee,1.0,120); p2.position.set(-20,-10,15); scene.add(p2);

  BRAIN.scene=scene; BRAIN.cam=cam; BRAIN.renderer=renderer;

  // --- rotation + zoom controls (no external OrbitControls needed) ---
  var rot={x:0.2,y:0}, target={x:0.2,y:0}, dist=34, targetDist=34, dragging=false, lastX,lastY;
  function down(x,y){dragging=true;lastX=x;lastY=y;}
  function move(x,y){ if(!dragging)return; target.y+=(x-lastX)*0.006; target.x+=(y-lastY)*0.006;
    target.x=Math.max(-1.2,Math.min(1.2,target.x)); lastX=x;lastY=y; }
  function up(){dragging=false;}
  canvas.addEventListener('mousedown',function(e){down(e.clientX,e.clientY);});
  window.addEventListener('mousemove',function(e){move(e.clientX,e.clientY);});
  window.addEventListener('mouseup',up);
  canvas.addEventListener('touchstart',function(e){ if(e.touches.length===1)down(e.touches[0].clientX,e.touches[0].clientY); },{passive:true});
  canvas.addEventListener('touchmove',function(e){
    if(e.touches.length===1)move(e.touches[0].clientX,e.touches[0].clientY);
    else if(e.touches.length===2){
      var dx=e.touches[0].clientX-e.touches[1].clientX, dy=e.touches[0].clientY-e.touches[1].clientY;
      var d=Math.sqrt(dx*dx+dy*dy);
      if(BRAIN._pinch)targetDist=Math.max(12,Math.min(60,targetDist-(d-BRAIN._pinch)*0.05));
      BRAIN._pinch=d;
    }
  },{passive:true});
  canvas.addEventListener('touchend',function(){ BRAIN._pinch=null; up(); });
  canvas.addEventListener('wheel',function(e){ targetDist=Math.max(12,Math.min(60,targetDist+e.deltaY*0.02)); e.preventDefault(); },{passive:false});

  // --- tap to inspect a region ---
  var ray=new THREE.Raycaster(), m=new THREE.Vector2();
  function pick(x,y){
    m.x=(x/window.innerWidth)*2-1; m.y=-(y/window.innerHeight)*2+1;
    ray.setFromCamera(m,cam);
    var hits=ray.intersectObjects(BRAIN.regions.map(function(r){return r.mesh;}));
    if(hits.length){ var reg=BRAIN.regions.find(function(r){return r.mesh===hits[0].object;}); if(reg)brainShowRegion(reg); }
  }
  canvas.addEventListener('click',function(e){ if(!dragging)pick(e.clientX,e.clientY); });

  window.addEventListener('resize',function(){
    if(document.getElementById('brainOverlay').style.display==='none')return;
    var W=window.innerWidth,H=window.innerHeight;
    cam.aspect=W/H; cam.updateProjectionMatrix(); renderer.setSize(W,H);
  });

  // --- animation loop ---
  function tick(){
    BRAIN.raf=requestAnimationFrame(tick);
    rot.x+=(target.x-rot.x)*0.08; rot.y+=(target.y-rot.y)*0.08;
    dist+=(targetDist-dist)*0.08;
    if(!dragging)target.y+=0.0009;   // gentle idle spin
    cam.position.x=Math.sin(rot.y)*Math.cos(rot.x)*dist;
    cam.position.y=Math.sin(rot.x)*dist+2;
    cam.position.z=Math.cos(rot.y)*Math.cos(rot.x)*dist;
    cam.lookAt(0,0,0);

    var t=Date.now()*0.001;
    BRAIN.regions.forEach(function(r,i){
      var s=1+Math.sin(t*1.5+i)*0.05*(r.active?2:1);
      r.mesh.scale.setScalar(r.baseScale*s);
      if(r.halo)r.halo.material.opacity=(r.active?0.5:0.2)+Math.sin(t*2+i)*0.1;
    });
    // pulses travel only when she is thinking
    var thinking=BRAIN.data&&BRAIN.data.now&&BRAIN.data.now.thinking;
    BRAIN.pulses.forEach(function(p){
      if(!thinking){ p.mesh.visible=false; return; }
      p.mesh.visible=true; p.t+=p.speed;
      if(p.t>=1){ p.t=0; p.a=BRAIN.regions[(Math.random()*BRAIN.regions.length)|0]; p.b=BRAIN.regions[(Math.random()*BRAIN.regions.length)|0]; }
      if(p.a&&p.b)p.mesh.position.lerpVectors(p.a.mesh.position,p.b.mesh.position,p.t);
    });
    renderer.render(scene,cam);
  }
  tick();
}

// Build the regions from real data.
function brainBuild(data){
  var scene=BRAIN.scene;
  // clear old
  BRAIN.regions.forEach(function(r){ scene.remove(r.mesh); if(r.halo)scene.remove(r.halo); });
  BRAIN.pulses.forEach(function(p){ scene.remove(p.mesh); });
  BRAIN.regions=[]; BRAIN.pulses=[];

  // Each subsystem is a lobe. Position on a rough brain shape.
  var lobes=[];
  lobes.push({key:'now', label:'قشر تفکر', sub:'آنچه الان می‌کند', color:0x7b5cff,
    detail:data.now.thinking?('در حال: '+(data.now.activity||'')):'در حال استراحت', size:data.now.thinking?2.4:1.6, active:data.now.thinking, pos:[0,6,2]});
  lobes.push({key:'learning', label:'یادگیری', sub:'تحقیق و دانش', color:0x22d3ee,
    detail:'امروز '+data.learning.runsToday+'/'+data.learning.maxPerDay+' · '+data.learning.pending+' منتظر تأیید · '+data.learning.approved+' تأییدشده',
    size:1.4+Math.min(data.learning.approved,20)*0.06, active:data.learning.enabled, pos:[7,3,-2]});
  lobes.push({key:'memory', label:'حافظه', sub:data.memory.totalItems+' مورد', color:0x34d399,
    detail:data.memory.regions.map(function(r){return r.user+': '+r.total;}).join(' · ')||'خالی',
    size:1.4+Math.min(data.memory.totalItems,40)*0.04, active:data.memory.totalItems>0, pos:[-7,3,-2]});
  lobes.push({key:'engines', label:'موتورهای تفکر', sub:data.engines.length+' موتور', color:0xfbbf24,
    detail:data.engines.map(function(e){return e.label+(e.cooling?' (خسته)':'');}).join(' · ')||'موتوری تنظیم نشده',
    size:1.6, active:data.engines.some(function(e){return !e.cooling;}), pos:[5,-4,3]});
  lobes.push({key:'board', label:'تابلوی خانواده', sub:data.board.messages+' پیام', color:0xfb7185,
    detail:data.board.messages+' پیام در تابلو', size:1.2+Math.min(data.board.messages,20)*0.04, active:data.board.messages>0, pos:[-5,-4,3]});
  lobes.push({key:'tools', label:'دست‌ها و ابزار', sub:data.projects+' پروژه · '+data.scripts+' اسکریپت', color:0xa78bfa,
    detail:data.projects+' پروژه · '+data.scripts+' اسکریپت · '+data.pendingActions+' منتظر اجازه',
    size:1.3, active:data.pendingActions>0, pos:[0,-6,-2]});

  // source files become a cluster of smaller nodes (the DNA / genome)
  data.sourceFiles.forEach(function(f,i){
    var ang=(i/data.sourceFiles.length)*Math.PI*2;
    lobes.push({key:'file:'+f.name, label:f.name, sub:f.lines+' خط', color:0x60a5fa,
      detail:f.lines+' خط · '+Math.round(f.size/1024)+' KB', size:0.7, active:false, editable:f.editable,
      fileName:f.name, pos:[Math.cos(ang)*11, -1+Math.sin(ang*2)*2, Math.sin(ang)*11]});
  });

  lobes.forEach(function(l){
    var geo=new THREE.IcosahedronGeometry(l.size,1);
    var mat=new THREE.MeshStandardMaterial({color:l.color, emissive:l.color, emissiveIntensity:l.active?0.6:0.25,
      roughness:0.4, metalness:0.3, transparent:true, opacity:0.92, flatShading:true});
    var mesh=new THREE.Mesh(geo,mat);
    mesh.position.set(l.pos[0],l.pos[1],l.pos[2]);
    scene.add(mesh);
    // halo
    var halo=new THREE.Mesh(new THREE.SphereGeometry(l.size*1.5,16,16),
      new THREE.MeshBasicMaterial({color:l.color,transparent:true,opacity:0.2,side:THREE.BackSide}));
    halo.position.copy(mesh.position); scene.add(halo);
    BRAIN.regions.push({mesh:mesh, halo:halo, baseScale:1, active:l.active, info:l});
  });

  // synapses between lobes
  var lineMat=new THREE.LineBasicMaterial({color:0x3355aa,transparent:true,opacity:0.22});
  for(var i=0;i<BRAIN.regions.length;i++){
    for(var j=i+1;j<BRAIN.regions.length;j++){
      var a=BRAIN.regions[i].mesh.position, b=BRAIN.regions[j].mesh.position;
      if(a.distanceTo(b)<10){
        var g=new THREE.BufferGeometry().setFromPoints([a,b]);
        scene.add(new THREE.Line(g,lineMat));
      }
    }
  }
  // pulses
  for(var k=0;k<30;k++){
    var pm=new THREE.Mesh(new THREE.SphereGeometry(0.13,6,6), new THREE.MeshBasicMaterial({color:0xffffff}));
    scene.add(pm);
    BRAIN.pulses.push({mesh:pm, a:BRAIN.regions[(Math.random()*BRAIN.regions.length)|0], b:BRAIN.regions[(Math.random()*BRAIN.regions.length)|0], t:Math.random(), speed:0.004+Math.random()*0.01});
  }
}

function brainRefresh2D(){
  adminFetch('/api/admin/brain').then(function(d){
    BRAIN.data=d;
    var canvas=document.getElementById('brainCanvas');
    canvas.style.display='none';
    var host=document.getElementById('brain2D');
    if(!host){
      host=document.createElement('div'); host.id='brain2D';
      host.style.cssText='position:absolute;inset:74px 12px 60px;overflow-y:auto;display:grid;'+
        'grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px;padding:4px';
      document.getElementById('brainOverlay').appendChild(host);
    }
    var cards=[
      {t:'قشر تفکر', s:d.now.thinking?('در حال: '+(d.now.activity||'')):'در حال استراحت', c:'#7b5cff', on:d.now.thinking},
      {t:'یادگیری', s:'امروز '+d.learning.runsToday+'/'+d.learning.maxPerDay+' · '+d.learning.pending+' منتظر', c:'#22d3ee', on:d.learning.enabled},
      {t:'حافظه', s:d.memory.totalItems+' مورد', c:'#34d399', on:d.memory.totalItems>0},
      {t:'موتورها', s:d.engines.map(function(e){return e.label;}).join('، ')||'—', c:'#fbbf24', on:d.engines.length>0},
      {t:'تابلو', s:d.board.messages+' پیام', c:'#fb7185', on:d.board.messages>0},
      {t:'دست‌ها', s:d.projects+' پروژه · '+d.scripts+' اسکریپت', c:'#a78bfa', on:d.pendingActions>0},
    ];
    d.sourceFiles.forEach(function(f){ cards.push({t:f.name, s:f.lines+' خط', c:'#60a5fa', on:false, file:f.name}); });
    host.innerHTML='';
    cards.forEach(function(c){
      var el=document.createElement('div');
      el.style.cssText='background:rgba(255,255,255,.04);border:1px solid '+(c.on?c.c:'rgba(255,255,255,.1)')+';'+
        'border-radius:14px;padding:13px;'+(c.on?'box-shadow:0 0 20px '+c.c+'55':'');
      el.innerHTML='<div style="font-weight:700;font-size:13px;color:#fff;margin-bottom:5px">'+c.t+
        (c.on?' <span style=\'color:'+c.c+'\'>●</span>':'')+'</div>'+
        '<div style="font-size:11.5px;color:#b9c4e0;line-height:1.7">'+c.s+'</div>';
      if(c.file){ el.style.cursor='pointer'; el.addEventListener('click',function(){ brainOpenEditor(c.file); }); }
      host.appendChild(el);
    });
    document.getElementById('brainStatus').textContent = d.now.thinking
      ? ('در حال کار: '+(d.now.activity||'').slice(0,40)) : ('آرام · نسخه '+d.version);
  }).catch(function(e){ document.getElementById('brainStatus').textContent='خطا: '+e.message; });
}

function brainRefresh(){
  adminFetch('/api/admin/brain').then(function(d){
    BRAIN.data=d;
    document.getElementById('brainStatus').textContent = d.now.thinking
      ? ('در حال کار: '+(d.now.activity||'').slice(0,40))
      : ('آرام · نسخه '+d.version+' · '+d.memory.totalItems+' خاطره');
    brainBuild(d);
  }).catch(function(e){ document.getElementById('brainStatus').textContent='خطا: '+e.message; });
}

function brainShowRegion(reg){
  var info=reg.info;
  document.getElementById('brainInfoTitle').textContent=info.label;
  document.getElementById('brainInfoBody').innerHTML='<div style="color:#7ee0ff;margin-bottom:6px">'+info.sub+'</div>'+info.detail;
  var act=document.getElementById('brainInfoAction');
  if(info.editable&&info.fileName){
    act.style.display=''; act.textContent='✎ ویرایش این فایل';
    act.onclick=function(){ brainOpenEditor(info.fileName); };
  } else act.style.display='none';
  document.getElementById('brainInfo').style.display='block';
}

function brainOpenEditor(name){
  var ed=document.getElementById('brainEditor');
  document.getElementById('brainEditName').textContent=name;
  document.getElementById('brainEditText').value='در حال بارگذاری…';
  document.getElementById('brainEditNote').textContent='';
  ed.style.display='flex';
  adminFetch('/api/admin/brain/file?name='+encodeURIComponent(name)).then(function(d){
    document.getElementById('brainEditText').value=d.content;
  }).catch(function(e){ document.getElementById('brainEditText').value=''; document.getElementById('brainEditNote').textContent='خطا: '+e.message; });
}

function showVersion(){
  fetch('/api/version',{cache:'no-store'})
    .then(function(r){return r.json();})
    .then(function(d){
      var e=document.getElementById('verTag');
      if(e&&d.version){ e.textContent='v'+d.version; RUNNING_VERSION=d.version; }
      // The phone has no top bar, so the version also goes in the drawer —
      // otherwise there is no way to tell which build is running.
      var sv=document.getElementById('sheetVer');
      if(sv&&d.version)sv.textContent='Setayesh AI  ·  v'+d.version;
    })
    .catch(function(){
      var e=document.getElementById('verTag'); if(e)e.textContent='—';
    });
}

/* Tools were spread across the sidebar, the top bar and the composer — the
   same panels reachable three ways. They now live in one drawer, grouped, so
   there is one place to look. */
function tidySidebar(){
  // These all have drawer entries; remove the duplicates.
  ['toolkitBtn','devicesBtn','adminBtn','boardBtn','ccBtn','learnBtn','settingsBtn','langBtn']
    .forEach(function(id){ var e=$(id); if(e)e.style.display='none'; });

  // The mode list was six entries with keyboard numbers next to them — it
  // looked like an aircraft cockpit for something most people never change.
  // It collapses to a single line that only opens when you want it.
  var ml=document.getElementById('modeList');
  if(ml&&ml.parentNode&&!ml.dataset.collapsed){
    ml.dataset.collapsed='1';
    var wrap=ml.parentNode;
    var head=document.createElement('button');
    head.className='mode-btn';
    head.style.cssText='width:100%;justify-content:space-between;margin-bottom:6px';
    var cur=document.createElement('span');
    cur.id='modeCurrent';
    cur.style.cssText='font-size:12.5px;opacity:.9';
    cur.textContent=t('m_'+mode)||'گفت‌وگو';
    var caret=document.createElement('span');
    caret.textContent='▾'; caret.style.opacity='.6';
    head.appendChild(cur); head.appendChild(caret);
    ml.style.display='none';
    head.addEventListener('click',function(){
      var open=ml.style.display!=='none';
      ml.style.display=open?'none':'';
      caret.textContent=open?'▾':'▴';
    });
    wrap.insertBefore(head, ml);
  }

  // The engine picker is an expert control; it belongs in the control centre,
  // not in everyone's line of sight.
  var eng=document.getElementById('modelPicker');
  if(eng&&eng.parentNode)eng.parentNode.style.display='none';
  // Composer: keep writing, attaching and sending. Voice and speech stay
  // because they are used mid-sentence; the rest moved to the drawer.
  ['cmpBtn','searchBtn','settingsBtnComposer'].forEach(function(id){
    var e=$(id); if(e)e.style.display='none';
  });
  // One clear way in.
  var mb=$('moreBtn');
  if(mb){ mb.style.display='inline-flex'; mb.title='منو'; }
}

/* ===== Simple mode for family accounts =====
   Not a cut-down version — everything still works, it is just not shown as a
   wall of buttons. The tools are still there when asked for by name. */
function simplifyForFamily(){
  // Composer: keep only attach and send. The rest were rarely used and made
  // the bar look like a control panel.
  // Keep the menu, attach and microphone — a child who cannot type yet still
  // needs to be able to speak. Only the expert controls go.
  ['cmpBtn','searchBtn','settingsBtnComposer'].forEach(function(id){
    var e=$(id); if(e)e.style.display='none';
  });
  var mic=$('micBtn'); if(mic)mic.style.display='inline-flex';
  // Mode picker: a child does not need to choose between architect and
  // philosophy modes — chat mode handles what they ask.
  // Mode list: a child does not need to pick between architect and philosophy
  // modes — ordinary chat handles what they ask.
  var ml=document.getElementById('modeList');
  if(ml&&ml.parentNode)ml.parentNode.style.display='none';
  // Tools and devices stay available to every family member now, not just the
  // admin — they can scan the home network, hash, make a QR, and reach the
  // home devices. Only the expert composer shortcuts are tucked away to keep
  // the bar calm for a child.
  ['toolkitBtn','devicesBtn'].forEach(function(id){
    var e=$(id); if(e)e.style.display='';
  });
  ['shAttach','shMic','shSearch'].forEach(function(id){
    var e=$(id); if(e)e.style.display='none';
  });
  // A calmer, more inviting prompt than "paste code or attach a file".
  var box=$('msgBox');
  if(box)box.placeholder='چیزی بپرس...';
  document.body.classList.add('simple-mode');
}

/* ===== Bottom sheet =====
   On a phone the top bar has no room for the admin buttons, so everything
   lives in one drawer a thumb can reach. Opening it also refreshes the
   "needs your approval" badge, so pending work is visible without hunting. */
function openSheet(){
  var admin=!!(CFG&&CFG.isAdmin);
  // shBrain stays out of this list on purpose: the brain now lives only in
  // the top-right button (single place, as asked), so the drawer never
  // re-shows it even for the admin.
  ['shCC','shLearn','shUsers','shConnectors','shAdminTitle'].forEach(function(id){
    var e=$(id); if(e)e.style.display=admin?'':'none';
  });
  $('sheet').classList.add('on'); $('sheetScrim').classList.add('on');
  if(admin){
    adminFetch('/api/admin/research').then(function(d){
      var b=$('shLearnBadge'); if(!b)return;
      if(d.pendingCount){b.textContent=d.pendingCount;b.style.display='';}
      else b.style.display='none';
    }).catch(function(){});
  }
}
function closeSheet(){ $('sheet').classList.remove('on'); $('sheetScrim').classList.remove('on'); }
function sheetGo(fn){ closeSheet(); setTimeout(fn,180); }   // let it slide away first
$('sheetScrim').addEventListener('click',closeSheet);
$('shCC').addEventListener('click',function(){sheetGo(openCC);});
$('shLearn').addEventListener('click',function(){sheetGo(openLearn);});
$('shUsers').addEventListener('click',function(){sheetGo(openAdmin);});
$('shTools').addEventListener('click',function(){sheetGo(openToolkit);});
$('shDevices').addEventListener('click',function(){sheetGo(devOpen);});
$('shPass').addEventListener('click',function(){sheetGo(openSettings);});
$('shLogout').addEventListener('click',function(){closeSheet();doLogout();});
document.addEventListener('keydown',function(e){ if(e.key==='Escape')closeSheet(); });

$('moreBtn').addEventListener('click',openSheet);
$('settingsBtnComposer').addEventListener('click',function(){
  var c=document.querySelector('.composer'); if(c)c.classList.remove('tools-open');
  openSettings();
});
$('attachBtn').addEventListener('click',function(){$('fileInput').click();});
$('fileInput').addEventListener('change',function(){
  Array.prototype.forEach.call($('fileInput').files,function(f){
    pendingFiles.push({file:f,id:Math.random().toString(36).slice(2)});
  });
  $('fileInput').value='';renderPending();
});

$('msgBox').addEventListener('keydown',function(e){
  if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send();}
});
$('msgBox').addEventListener('input',autoGrow);

// paste an image straight into the composer
$('msgBox').addEventListener('paste',function(e){
  var items=(e.clipboardData||{}).items||[];
  for(var i=0;i<items.length;i++){
    if(items[i].kind==='file'){
      var f=items[i].getAsFile();
      if(f){pendingFiles.push({file:f,id:Math.random().toString(36).slice(2)});renderPending();}
    }
  }
});

// drag & drop files anywhere in the app
document.addEventListener('dragover',function(e){e.preventDefault();});
document.addEventListener('drop',function(e){
  e.preventDefault();
  if(!token)return;
  var fl=(e.dataTransfer||{}).files||[];
  for(var i=0;i<fl.length;i++)pendingFiles.push({file:fl[i],id:Math.random().toString(36).slice(2)});
  renderPending();
});

function switchLang(){lang=lang==='fa'?'en':'fa';localStorage.setItem('setayesh.lang',lang);applyLang();}
$('langBtn').addEventListener('click',switchLang);
$('langBtnLogin').addEventListener('click',switchLang);

// ===== Brain wiring =====
$('shBrain').addEventListener('click',function(){ sheetGo(openBrain); });
// FIX: these elements are defined further down the page (lines 6101-6132),
// so they do not exist yet while this script runs. Wiring them here threw
// "Cannot read properties of null" and killed everything below it -
// toolkit, image studio and the rest never got wired. Run after the DOM.
document.addEventListener('DOMContentLoaded', function(){
  $('brainClose').addEventListener('click',closeBrain);
  $('brainInfo').addEventListener('click',function(e){ if(e.target===this)this.style.display='none'; });
  $('brainEditBack').addEventListener('click',function(){ document.getElementById('brainEditor').style.display='none'; });
  $('brainEditSave').addEventListener('click',function(){
    var name=$('brainEditName').textContent, content=$('brainEditText').value;
    var note=$('brainEditNote'); note.style.color='#8ea0c8'; note.textContent='در حال بررسی و ذخیره…';
    adminFetch('/api/admin/brain/file',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({name:name,content:content})})
      .then(function(d){
        note.style.color='#34d399';
        note.textContent='✓ '+(d.note||'ذخیره شد');
        if(d.restartSupported){
          note.textContent+='  — برای فعال شدن، برنامه از قسمت مرکز کنترل ری‌استارت کن.';
        }
      })
      .catch(function(e){ note.style.color='#fb7185'; note.textContent='✗ '+e.message; });
  });
});
$('shLang').addEventListener('click',function(){ switchLang(); var t=$('shLangTxt'); if(t)t.innerHTML=(lang==='fa'?'English':'فارسی')+'<span class="si-sub">تغییر زبان برنامه</span>'; });

// Alt+1..4 switches mode
document.addEventListener('keydown',function(e){
  if(e.altKey&&!e.ctrlKey&&!e.metaKey&&CFG){
    var n=parseInt(e.key,10);
    if(n>=1&&n<=CFG.modes.length){e.preventDefault();setMode(CFG.modes[n-1].id);}
  }
  if(e.key==='Escape'){closeSettings();closeSidebar();}
});

/* ================= TOOLKIT ================= */
var TK={
  tabs:[
    {id:'web',i18n:'tk_web',icon:'<circle cx="12" cy="12" r="9"/><path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6L5.6 18.4"/>'},
    {id:'net',i18n:'tk_net',icon:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 010 18M12 3a15 15 0 000 18"/>'},
    {id:'ports',i18n:'tk_ports',icon:'<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18"/>'},
    {id:'hash',i18n:'tk_hash',icon:'<path d="M9 3L7 21M17 3l-2 18M4 8h16M3 16h16"/>'},
    {id:'pw',i18n:'tk_pw',icon:'<circle cx="7" cy="14" r="3.4"/><path d="M9.4 11.6L20 1M16 5l3 3M14 7l2 2"/>'},
    {id:'enc',i18n:'tk_enc',icon:'<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 9l-2 3 2 3M17 9l2 3-2 3M13 8l-2 8"/>'},
    {id:'vault',i18n:'tk_vault',icon:'<rect x="3" y="11" width="18" height="10" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4M12 15v2"/>'},
    {id:'ssl',i18n:'tk_ssl',icon:'<path d="M12 2l8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6z"/><path d="M9 12l2 2 4-4"/>'},
    {id:'guard',i18n:'tk_guard',icon:'<path d="M12 2l8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6z"/>'},
    {id:'learn',i18n:'tk_learn',icon:'<path d="M22 10L12 5 2 10l10 5 10-5z"/><path d="M6 12v5c0 1 2.7 3 6 3s6-2 6-3v-5"/>'},
    {id:'mobile',i18n:'tk_mobile',icon:'<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>'},
    {id:'hw',i18n:'tk_hw',icon:'<path d="M9 3v4M15 3v4M9 17v4M15 17v4M3 9h4M3 15h4M17 9h4M17 15h4"/><rect x="7" y="7" width="10" height="10" rx="1.5"/>'},
    {id:'ext',i18n:'tk_ext',icon:'<path d="M12 2l2 5 5-1-3 4 3 4-5-1-2 5-2-5-5 1 3-4-3-4 5 1z"/>'}
  ],
  active:'web'
};
function tkT(k){return t(k);}

var TK_I18N={
 fa:{toolkit:'جعبه‌ابزار امنیت',defensive:'دفاعی · فقط دارایی‌های خودتان',
  tk_web:'اسکن وب‌سایت',tk_net:'اسکن شبکه',tk_ports:'بررسی پورت',tk_hash:'آزمایشگاه هش',tk_mobile:'اتصال موبایل',tk_hw:'سخت‌افزار',tk_ext:'افزونه‌ها',
  tk_extHint:'قابلیت جدید اضافه کنید بدون ساختن دوباره‌ی برنامه: یک فایل .js در پوشه‌ی plugins کنار برنامه بگذارید و «بارگذاری مجدد» را بزنید. نمونه‌ها در همان پوشه هستند.',
  tk_reload:'بارگذاری مجدد',tk_noext:'هیچ افزونه‌ای پیدا نشد. یک فایل .js در پوشه‌ی plugins بگذارید.',tk_extRun:'اجرا',tk_extErr:'خطای بارگذاری',
  tk_webHint:'وب‌سایت خودتان را از نظر تنظیمات امنیتی بررسی می‌کند (هدرها، کوکی‌ها، HTTPS، افشای نسخه). این بررسی passive است — فقط صفحه خوانده می‌شود، هیچ حمله‌ای انجام نمی‌شود.',
  tk_url:'آدرس سایت شما',tk_analyze:'بررسی',tk_grade:'نمره',tk_issues:'مورد',tk_clean:'مشکل مهمی پیدا نشد. ✓',tk_fix:'راه‌حل',
  tk_scan:'اسکن',tk_check:'بررسی',tk_run:'اجرا',
  tk_netHint:'میزبان‌های فعال روی شبکه‌ی محلی خودتان را پیدا می‌کند. فقط رنج‌های خصوصی (۱۹۲.۱۶۸، ۱۰.، ۱۷۲.۱۶) مجاز است.',
  tk_subnet:'رنج شبکه (CIDR)',tk_scanning:'در حال اسکن…',tk_found:'میزبان فعال',tk_openports:'پورت باز',tk_nohost:'میزبان فعالی پیدا نشد.',
  tk_host:'آدرس میزبان',tk_portsHint:'پورت‌های باز روی یک میزبان محلی را بررسی می‌کند.',
  tk_port:'پورت',tk_service:'سرویس',tk_state:'وضعیت',tk_noports:'پورتی بررسی نشد.',
  tk_hashHint:'ابزارهای محلی برای بررسی هش و قدرت رمز — هیچ‌چیز از دستگاه شما خارج نمی‌شود.',
  tk_pwlabel:'رمز عبور خود را بسنجید',tk_hashlabel:'یک رشته را هش کنید',tk_idlabel:'نوع یک هش را تشخیص دهید',
  tk_entropy:'آنتروپی',tk_cracktime:'زمان تخمینی شکستن',tk_verdict:'ارزیابی',tk_guesses:'حدس‌ها',
  tk_mobileHint:'این QR را با دوربین گوشی (روی همان وای‌فای) اسکن کنید تا اپ روی موبایل باز شود.',
  tk_hwHint:'این بخش رابط توسعه برای سخت‌افزار جانبی (Sub-GHz/RFID از طریق USB/سریال) است. در این نسخه فقط شبیه‌سازی است و هیچ سیگنالی ارسال نمی‌شود.',
  tk_serial:'پورت سریال',tk_none:'یافت نشد',tk_sim:'شبیه‌سازی',
  tk_errPrivate:'فقط شبکه‌ی محلی خودتان قابل بررسی است.',tk_loading:'در حال بارگذاری…',
  weak:'ضعیف',ok:'قابل‌قبول',strong:'قوی',excellent:'عالی'},
 en:{toolkit:'Security toolkit',defensive:'Defensive · your own assets only',
  tk_web:'Website scan',tk_net:'Network scan',tk_ports:'Port check',tk_hash:'Hash lab',tk_mobile:'Mobile link',tk_hw:'Hardware',tk_ext:'Extensions',
  tk_extHint:'Add a new tool without rebuilding: drop a .js file into the plugins folder next to the app and press Reload. Sample plugins are already in that folder.',
  tk_reload:'Reload',tk_noext:'No extensions found. Put a .js file in the plugins folder.',tk_extRun:'Run',tk_extErr:'load error',
  tk_webHint:'Checks your own website for security misconfigurations (headers, cookies, HTTPS, version disclosure). This is passive — it only reads the page, it performs no attack.',
  tk_url:'Your site URL',tk_analyze:'Scan',tk_grade:'Grade',tk_issues:'issues',tk_clean:'No major issues found.',tk_fix:'Fix',
  tk_scan:'Scan',tk_check:'Check',tk_run:'Run',
  tk_netHint:'Finds live hosts on your own local network. Only private ranges (192.168, 10., 172.16) are allowed.',
  tk_subnet:'Subnet (CIDR)',tk_scanning:'Scanning…',tk_found:'live hosts',tk_openports:'open ports',tk_nohost:'No live hosts found.',
  tk_host:'Host address',tk_portsHint:'Checks which ports are open on one local host.',
  tk_port:'Port',tk_service:'Service',tk_state:'State',tk_noports:'No ports checked.',
  tk_hashHint:'Local hash and password-strength tools — nothing leaves your machine.',
  tk_pwlabel:'Test your password strength',tk_hashlabel:'Hash a string',tk_idlabel:'Identify a hash type',
  tk_entropy:'Entropy',tk_cracktime:'Est. crack time',tk_verdict:'Verdict',tk_guesses:'Guesses',
  tk_mobileHint:'Scan this QR with your phone camera (on the same Wi-Fi) to open the app on mobile.',
  tk_hwHint:'This panel is the expansion interface for external hardware (Sub-GHz/RFID over USB/serial). In this build it is simulation only — no signal is transmitted.',
  tk_serial:'Serial port',tk_none:'none found',tk_sim:'simulation',
  tk_errPrivate:'Only your own local network can be checked.',tk_loading:'Loading…',
  weak:'weak',ok:'ok',strong:'strong',excellent:'excellent'}
};
// merge toolkit strings into the main tables
Object.keys(TK_I18N).forEach(function(l){for(var k in TK_I18N[l])LANG[l][k]=TK_I18N[l][k];});
Object.assign(LANG.fa,{
 tk_vault:'مدیریت رمزها',tk_ssl:'گواهی SSL',tk_guard:'راهنمای محافظت',
 tk_vaultHint:'رمزهای خودت را امن و رمزنگاری‌شده ذخیره کن. با یک «رمز اصلی» قفل می‌شود و همه‌چیز روی همین دستگاه می‌ماند — هیچ‌جا فرستاده نمی‌شود.',
 tk_setMaster:'یک رمز اصلی بساز',tk_enterMaster:'رمز اصلی را وارد کن',tk_create:'ساختن گاوصندوق',tk_unlock:'باز کردن',tk_lock:'قفل کردن',
 tk_wrongMaster:'رمز اصلی اشتباه است',tk_addEntry:'افزودن رمز جدید',tk_site:'سایت / سرویس',tk_user:'نام کاربری',tk_pass:'رمز عبور',
 tk_add:'افزودن',tk_reveal:'نمایش',tk_hide:'پنهان',tk_del:'حذف',tk_empty:'هنوز رمزی ذخیره نشده',tk_masterShort:'رمز اصلی حداقل ۶ کاراکتر باشد',
 tk_sslHint:'گواهی SSL سایت خودت را بررسی می‌کند: معتبر بودن، صادرکننده، و چند روز تا انقضا. فقط یک اتصال امن برای خواندن گواهی — هیچ حمله‌ای نیست.',
 tk_domain:'دامنه سایت',tk_valid:'معتبر',tk_invalid:'نامعتبر / هشدار',tk_issuer:'صادرکننده',tk_expires:'انقضا',tk_daysLeft:'روز تا انقضا',tk_expired:'منقضی شده!',
 tk_guardHint:'چند نکته‌ی ساده و مهم برای محافظت از خونه، ماشین و کامپیوترِ خودت.',
 tk_learn:'آموزش امنیت'
});
Object.assign(LANG.en,{
 tk_vault:'Passwords',tk_ssl:'SSL cert',tk_guard:'Protection',
 tk_vaultHint:'Store your passwords encrypted. Locked with one master password; everything stays on this device — nothing is sent anywhere.',
 tk_setMaster:'Create a master password',tk_enterMaster:'Enter master password',tk_create:'Create vault',tk_unlock:'Unlock',tk_lock:'Lock',
 tk_wrongMaster:'Wrong master password',tk_addEntry:'Add a password',tk_site:'Site / service',tk_user:'Username',tk_pass:'Password',
 tk_add:'Add',tk_reveal:'Show',tk_hide:'Hide',tk_del:'Delete',tk_empty:'No passwords saved yet',tk_masterShort:'Master password must be at least 6 characters',
 tk_sslHint:'Checks your own site’s SSL certificate: validity, issuer, and days until expiry. A read-only secure handshake — no attack.',
 tk_domain:'Site domain',tk_valid:'Valid',tk_invalid:'Invalid / warning',tk_issuer:'Issuer',tk_expires:'Expires',tk_daysLeft:'days left',tk_expired:'Expired!',
 tk_guardHint:'A few simple, important tips to protect your own home, car and computer.',
 tk_learn:'Security learning'
});
Object.assign(LANG.fa,{
 tk_pw:'رمزساز',tk_pwHint:'رمز عبور قوی و تصادفی بساز — کاملاً روی دستگاه خودت، هیچ‌جا فرستاده نمی‌شود.',
 tk_length:'طول',tk_upper:'حروف بزرگ ABC',tk_lower:'حروف کوچک abc',tk_digits:'اعداد ۱۲۳',tk_symbols:'نمادها !@#',
 tk_generate:'بساز',tk_copy:'کپی',tk_copied:'کپی شد',tk_pwPick:'حداقل یک نوع کاراکتر را انتخاب کن',
 tk_enc:'رمزگذار',tk_encHint:'متن را رمزگذاری/رمزگشایی کن یا توکن JWT خودت را بخوان — همه محلی و امن.',
 tk_input:'ورودی',tk_output:'خروجی',tk_b64enc:'Base64 →',tk_b64dec:'← Base64',tk_urlenc:'URL →',tk_urldec:'← URL',
 tk_jwt:'خواندن JWT',tk_encErr:'ورودی نامعتبر است'
});
Object.assign(LANG.en,{
 tk_pw:'Password gen',tk_pwHint:'Generate a strong random password — fully on your own device, nothing is sent anywhere.',
 tk_length:'Length',tk_upper:'Uppercase ABC',tk_lower:'Lowercase abc',tk_digits:'Digits 123',tk_symbols:'Symbols !@#',
 tk_generate:'Generate',tk_copy:'Copy',tk_copied:'Copied',tk_pwPick:'Pick at least one character type',
 tk_enc:'Encode/Decode',tk_encHint:'Encode/decode text or inspect your own JWT token — all local and safe.',
 tk_input:'Input',tk_output:'Output',tk_b64enc:'Base64 →',tk_b64dec:'← Base64',tk_urlenc:'URL →',tk_urldec:'← URL',
 tk_jwt:'Decode JWT',tk_encErr:'Invalid input'
});

function openToolkit(){buildTkTabs();showTkTab(TK.active);$('toolkitOverlay').classList.add('on');closeSidebar();}
function closeToolkit(){$('toolkitOverlay').classList.remove('on');}

function buildTkTabs(){
  var box=$('tkTabs');box.innerHTML='';
  TK.tabs.forEach(function(tab){
    var b=el('button','tk-tab'+(tab.id===TK.active?' on':''));b.type='button';
    b.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+tab.icon+'</svg><span>'+esc(t(tab.i18n))+'</span>';
    b.addEventListener('click',function(){showTkTab(tab.id);});
    box.appendChild(b);
  });
}
function showTkTab(id){
  TK.active=id;buildTkTabs();
  var body=$('tkBody');body.innerHTML='';
  if(id==='web')body.appendChild(tkWebPanel());
  else if(id==='net')body.appendChild(tkNetPanel());
  else if(id==='ports')body.appendChild(tkPortsPanel());
  else if(id==='hash')body.appendChild(tkHashPanel());
  else if(id==='pw')body.appendChild(tkPwPanel());
  else if(id==='enc')body.appendChild(tkEncPanel());
  else if(id==='vault')body.appendChild(tkVaultPanel());
  else if(id==='ssl')body.appendChild(tkSslPanel());
  else if(id==='guard')body.appendChild(tkGuardPanel());
  else if(id==='learn')body.appendChild(tkLearnPanel());
  else if(id==='mobile')body.appendChild(tkMobilePanel());
  else if(id==='hw')body.appendChild(tkHwPanel());
  else if(id==='ext')body.appendChild(tkExtPanel());
}

async function tkFetch(path,opts){
  opts=opts||{};opts.headers=authHeaders(opts.headers||{});
  var r=await fetch(path,opts);
  if(r.status===401){closeToolkit();$('appView').classList.remove('on');$('loginView').style.display='flex';throw new Error('auth');}
  var d=null;try{d=await r.json();}catch(e){}
  if(!r.ok)throw new Error((d&&d.error)||t('genericError'));
  return d;
}

/* ---- Website scan ---- */
function tkWebPanel(){
  var p=el('div','tk-panel');
  p.appendChild(hintNode(t('tk_webHint')));
  var row=el('div','tk-row');
  var inp=el('input','tk-input');inp.id='tkUrl';inp.placeholder='https://example.com';inp.value='https://';
  var btn=el('button','tk-btn',t('tk_analyze'));
  row.appendChild(inp);row.appendChild(btn);p.appendChild(row);
  var out=el('div');out.id='tkWebOut';p.appendChild(out);
  function run(){
    var url=inp.value.trim();if(!url||url==='https://')return;
    btn.disabled=true;out.innerHTML='<div class="tk-hint"><span class="spin"></span> '+t('tk_scanning')+'</div>';
    tkFetch('/api/tool/webscan',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({url:url})})
    .then(function(d){
      var gcolor={A:'#34d399',B:'#22d3ee',C:'#fbbf24',D:'#fb923c',F:'#fb7185'}[d.grade]||'#8b8fa8';
      var head=el('div','tk-card');
      head.innerHTML='<div class="tk-card-b" style="display:flex;align-items:center;gap:16px">'+
        '<div style="width:64px;height:64px;border-radius:16px;display:grid;place-items:center;flex-shrink:0;'+
        'font-size:30px;font-weight:800;font-family:var(--mono);color:'+gcolor+';border:2px solid '+gcolor+'55;background:'+gcolor+'14">'+d.grade+'</div>'+
        '<div style="flex:1;min-width:0"><div style="font-family:var(--mono);font-size:12px;color:var(--muted);word-break:break-all">'+esc(d.finalUrl)+'</div>'+
        '<div style="margin-top:5px;font-size:13px">'+t('tk_grade')+': <b style="color:'+gcolor+'">'+d.score+'/100</b> · '+
        (d.https?'<span style="color:var(--ok)">HTTPS</span>':'<span style="color:var(--danger)">no HTTPS</span>')+
        ' · '+d.findings.filter(function(f){return f.sev!=='info';}).length+' '+t('tk_issues')+'</div></div></div>';
      out.innerHTML='';out.appendChild(head);
      if(!d.findings.length){out.appendChild(hintNode(t('tk_clean')));btn.disabled=false;return;}
      d.findings.forEach(function(f){
        var scol={critical:'sev-critical',high:'sev-high',medium:'sev-medium',low:'sev-low',info:'sev-info'}[f.sev];
        var card=el('div','tk-card');card.style.marginTop='9px';
        card.innerHTML='<div class="tk-card-b">'+
          '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px"><span class="sev '+scol+'">'+f.sev+'</span>'+
          '<b style="font-size:13.5px">'+esc(f.title)+'</b></div>'+
          '<div style="font-size:12.5px;color:var(--muted);line-height:1.6;margin-bottom:7px">'+esc(f.detail)+'</div>'+
          '<div style="font-size:12px;background:rgba(52,211,153,.07);border:1px solid rgba(52,211,153,.2);border-radius:8px;padding:7px 10px;line-height:1.6">'+
          '<span style="color:var(--ok);font-family:var(--mono);font-size:10.5px">'+t('tk_fix')+' →</span> <span style="font-family:var(--mono);font-size:11.5px">'+esc(f.fix)+'</span></div></div>';
        out.appendChild(card);
      });
      btn.disabled=false;
    })
    .catch(function(e){out.innerHTML='<div class="errbox">'+esc(e.message)+'</div>';btn.disabled=false;});
  }
  btn.addEventListener('click',run);
  inp.addEventListener('keydown',function(e){if(e.key==='Enter')run();});
  return p;
}

/* ---- Network scan ---- */
function tkNetPanel(){
  var p=el('div','tk-panel');
  p.appendChild(hintNode(t('tk_netHint')));
  var row=el('div','tk-row');
  var inp=el('input','tk-input');inp.id='tkSubnet';inp.placeholder='192.168.1.0/24';
  var btn=el('button','tk-btn',t('tk_scan'));
  row.appendChild(inp);row.appendChild(btn);p.appendChild(row);
  var out=el('div');out.id='tkNetOut';p.appendChild(out);
  // prefill suggested subnet
  tkFetch('/api/tool/interfaces').then(function(d){if(d&&d.suggested&&!inp.value)inp.value=d.suggested;}).catch(function(){});
  btn.addEventListener('click',async function(){
    var cidr=inp.value.trim()||'192.168.1.0/24';
    btn.disabled=true;out.innerHTML='<div class="tk-hint"><span class="spin"></span> '+t('tk_scanning')+'</div>';
    try{
      var d=await tkFetch('/api/tool/netscan',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({cidr:cidr})});
      if(!d.hosts.length){out.innerHTML='<div class="tk-hint">'+t('tk_nohost')+'</div>';return;}
      var card=el('div','tk-card');
      card.innerHTML='<div class="tk-card-h">'+d.hosts.length+' '+t('tk_found')+' · '+d.scanned+' scanned</div>';
      var b=el('div','tk-card-b');var tbl=el('table','tk-table');
      tbl.innerHTML='<tr><th>'+t('tk_host')+'</th><th>'+t('tk_openports')+'</th></tr>';
      d.hosts.forEach(function(h){
        var tr=el('tr');tr.innerHTML='<td class="st-open">'+esc(h.host)+'</td><td>'+(h.open.length?h.open.join(', '):'—')+'</td>';
        tbl.appendChild(tr);
      });
      b.appendChild(tbl);card.appendChild(b);out.innerHTML='';out.appendChild(card);
    }catch(e){out.innerHTML='<div class="errbox">'+esc(e.message)+'</div>';}
    finally{btn.disabled=false;}
  });
  return p;
}

/* ---- Port check ---- */
function tkPortsPanel(){
  var p=el('div','tk-panel');
  p.appendChild(hintNode(t('tk_portsHint')));
  var row=el('div','tk-row');
  var inp=el('input','tk-input');inp.id='tkHost';inp.placeholder='192.168.1.1';
  var btn=el('button','tk-btn',t('tk_check'));
  row.appendChild(inp);row.appendChild(btn);p.appendChild(row);
  var out=el('div');out.id='tkPortOut';p.appendChild(out);
  btn.addEventListener('click',async function(){
    var host=inp.value.trim();if(!host)return;
    btn.disabled=true;out.innerHTML='<div class="tk-hint"><span class="spin"></span> '+t('tk_scanning')+'</div>';
    try{
      var d=await tkFetch('/api/tool/ports',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({host:host})});
      var card=el('div','tk-card');card.innerHTML='<div class="tk-card-h">'+esc(d.host)+' · '+d.open.length+' '+t('tk_openports')+'</div>';
      var b=el('div','tk-card-b');var tbl=el('table','tk-table');
      tbl.innerHTML='<tr><th>'+t('tk_port')+'</th><th>'+t('tk_service')+'</th><th>'+t('tk_state')+'</th></tr>';
      d.ports.forEach(function(pr){
        var tr=el('tr');tr.innerHTML='<td>'+pr.port+'</td><td>'+esc(pr.service||'—')+'</td><td class="st-'+pr.state+'">'+pr.state+'</td>';
        tbl.appendChild(tr);
      });
      b.appendChild(tbl);card.appendChild(b);out.innerHTML='';out.appendChild(card);
    }catch(e){out.innerHTML='<div class="errbox">'+esc(e.message)+'</div>';}
    finally{btn.disabled=false;}
  });
  return p;
}

/* ---- Hash lab ---- */
function tkHashPanel(){
  var p=el('div','tk-panel');
  p.appendChild(hintNode(t('tk_hashHint')));

  // password strength
  var c1=el('div','tk-card');c1.innerHTML='<div class="tk-card-h">'+t('tk_pwlabel')+'</div>';
  var b1=el('div','tk-card-b');
  var r1=el('div','tk-row');var i1=el('input','tk-input');i1.type='password';i1.placeholder='••••••••';
  var bt1=el('button','tk-btn',t('tk_check'));r1.appendChild(i1);r1.appendChild(bt1);b1.appendChild(r1);
  var o1=el('div');o1.style.marginTop='10px';b1.appendChild(o1);c1.appendChild(b1);p.appendChild(c1);
  bt1.addEventListener('click',async function(){
    if(!i1.value)return;
    try{var d=await tkFetch('/api/tool/hash',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'strength',value:i1.value})});
      var colors={weak:'#fb7185',ok:'#fbbf24',strong:'#34d399',excellent:'#22d3ee'};
      var pct=Math.min(100,Math.round(d.entropyBits/128*100));
      o1.innerHTML='<div class="meter"><i style="width:'+pct+'%;background:'+colors[d.verdict]+'"></i></div>'+
        '<div class="tk-kv"><span class="k">'+t('tk_entropy')+'</span><span class="v">'+d.entropyBits+' bits</span></div>'+
        '<div class="tk-kv"><span class="k">'+t('tk_cracktime')+'</span><span class="v">'+esc(d.crackTime)+'</span></div>'+
        '<div class="tk-kv"><span class="k">'+t('tk_verdict')+'</span><span class="v" style="color:'+colors[d.verdict]+'">'+t(d.verdict)+'</span></div>';
    }catch(e){o1.innerHTML='<div class="errbox">'+esc(e.message)+'</div>';}
  });

  // hash a string
  var c2=el('div','tk-card');c2.innerHTML='<div class="tk-card-h">'+t('tk_hashlabel')+'</div>';
  var b2=el('div','tk-card-b');
  var r2=el('div','tk-row');var i2=el('input','tk-input');i2.placeholder='text...';
  var bt2=el('button','tk-btn',t('tk_run'));r2.appendChild(i2);r2.appendChild(bt2);b2.appendChild(r2);
  var o2=el('div','hashgrid');o2.style.marginTop='10px';b2.appendChild(o2);c2.appendChild(b2);p.appendChild(c2);
  bt2.addEventListener('click',async function(){
    if(!i2.value)return;
    try{var d=await tkFetch('/api/tool/hash',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'hash',value:i2.value})});
      o2.innerHTML='';Object.keys(d.hashes).forEach(function(a){
        var hg=el('div','hg');hg.innerHTML='<span class="a">'+a+'</span><span class="v">'+esc(d.hashes[a])+'</span>';o2.appendChild(hg);});
    }catch(e){o2.innerHTML='<div class="errbox">'+esc(e.message)+'</div>';}
  });

  // identify a hash
  var c3=el('div','tk-card');c3.innerHTML='<div class="tk-card-h">'+t('tk_idlabel')+'</div>';
  var b3=el('div','tk-card-b');
  var r3=el('div','tk-row');var i3=el('input','tk-input');i3.placeholder='5f4dcc3b...';
  var bt3=el('button','tk-btn',t('tk_check'));r3.appendChild(i3);r3.appendChild(bt3);b3.appendChild(r3);
  var o3=el('div');o3.style.marginTop='10px';b3.appendChild(o3);c3.appendChild(b3);p.appendChild(c3);
  bt3.addEventListener('click',async function(){
    if(!i3.value)return;
    try{var d=await tkFetch('/api/tool/hash',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'identify',value:i3.value})});
      o3.innerHTML='<div class="tk-kv"><span class="k">length</span><span class="v">'+d.length+'</span></div>'+
        '<div class="tk-kv"><span class="k">'+t('tk_guesses')+'</span><span class="v">'+esc(d.guesses.join(', '))+'</span></div>';
    }catch(e){o3.innerHTML='<div class="errbox">'+esc(e.message)+'</div>';}
  });

  return p;
}

/* ---- Password generator (client-side, secure RNG) ---- */
function tkCopyBtn(getText){
  var b=el('button','tk-btn',t('tk_copy'));b.style.flex='0 0 auto';
  b.addEventListener('click',function(){
    var txt=getText();if(!txt)return;
    var done=function(){b.textContent=t('tk_copied');setTimeout(function(){b.textContent=t('tk_copy');},1300);};
    if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(txt).then(done,function(){});
    else{var ta=el('textarea');ta.value=txt;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();try{document.execCommand('copy');done();}catch(e){}document.body.removeChild(ta);}
  });
  return b;
}
function tkPwPanel(){
  var p=el('div','tk-panel');
  p.appendChild(hintNode(t('tk_pwHint')));
  var card=el('div','tk-card');var body=el('div','tk-card-b');
  // length
  var lrow=el('div','tk-row');lrow.style.alignItems='center';
  var llbl=el('span');llbl.textContent=t('tk_length');llbl.style.cssText='font-size:12.5px;color:var(--muted);min-width:44px';
  var len=el('input','tk-input');len.type='number';len.value='16';len.min='6';len.max='64';len.style.maxWidth='90px';
  lrow.appendChild(llbl);lrow.appendChild(len);body.appendChild(lrow);
  // options
  var opts=[['upper',t('tk_upper'),true],['lower',t('tk_lower'),true],['digits',t('tk_digits'),true],['symbols',t('tk_symbols'),true]];
  var checks={};
  var orow=el('div');orow.style.cssText='display:flex;flex-wrap:wrap;gap:12px;margin:12px 0';
  opts.forEach(function(o){
    var lab=el('label');lab.style.cssText='display:flex;align-items:center;gap:6px;font-size:12.5px;color:var(--muted);cursor:pointer';
    var cb=el('input');cb.type='checkbox';cb.checked=o[2];checks[o[0]]=cb;
    lab.appendChild(cb);lab.appendChild(el('span','',o[1]));orow.appendChild(lab);
  });
  body.appendChild(orow);
  var gen=el('button','tk-btn',t('tk_generate'));gen.style.width='100%';body.appendChild(gen);
  var out=el('div');out.style.marginTop='12px';body.appendChild(out);
  card.appendChild(body);p.appendChild(card);
  function make(){
    var pool='';
    if(checks.upper.checked)pool+='ABCDEFGHJKLMNPQRSTUVWXYZ';
    if(checks.lower.checked)pool+='abcdefghijkmnpqrstuvwxyz';
    if(checks.digits.checked)pool+='23456789';
    if(checks.symbols.checked)pool+='!@#$%^&*()-_=+[]{};:,.?';
    if(!pool){out.innerHTML='<div class="errbox">'+t('tk_pwPick')+'</div>';return;}
    var n=Math.max(6,Math.min(64,parseInt(len.value,10)||16));
    var arr=new Uint32Array(n);(window.crypto||window.msCrypto).getRandomValues(arr);
    var pw='';for(var i=0;i<n;i++)pw+=pool.charAt(arr[i]%pool.length);
    var bits=Math.round(n*Math.log(pool.length)/Math.log(2));
    var col=bits<50?'#fb7185':bits<70?'#fbbf24':bits<100?'#34d399':'#22d3ee';
    var pct=Math.min(100,Math.round(bits/128*100));
    var field=el('div','tk-row');
    var val=el('input','tk-input');val.readOnly=true;val.value=pw;val.dir='ltr';val.style.fontFamily='var(--mono)';
    field.appendChild(val);field.appendChild(tkCopyBtn(function(){return pw;}));
    out.innerHTML='';out.appendChild(field);
    var meter=el('div');meter.innerHTML='<div class="meter" style="margin-top:10px"><i style="width:'+pct+'%;background:'+col+'"></i></div>'+
      '<div class="tk-kv"><span class="k">'+t('tk_entropy')+'</span><span class="v" style="color:'+col+'">'+bits+' bits</span></div>';
    out.appendChild(meter);
  }
  gen.addEventListener('click',make);
  make();
  return p;
}

/* ---- Encoder / Decoder / JWT (client-side) ---- */
function tkEncPanel(){
  var p=el('div','tk-panel');
  p.appendChild(hintNode(t('tk_encHint')));
  var card=el('div','tk-card');var body=el('div','tk-card-b');
  var inLbl=el('div','tk-card-h');inLbl.textContent=t('tk_input');inLbl.style.marginBottom='6px';body.appendChild(inLbl);
  var inp=el('textarea','tk-input');inp.rows=3;inp.dir='ltr';inp.style.cssText='width:100%;resize:vertical;font-family:var(--mono);min-height:64px';body.appendChild(inp);
  var btns=el('div');btns.style.cssText='display:flex;flex-wrap:wrap;gap:8px;margin:11px 0';
  var actions=[['b64enc',t('tk_b64enc')],['b64dec',t('tk_b64dec')],['urlenc',t('tk_urlenc')],['urldec',t('tk_urldec')],['jwt',t('tk_jwt')]];
  var outWrap=el('div');
  function b64urlDecode(s){s=s.replace(/-/g,'+').replace(/_/g,'/');while(s.length%4)s+='=';return decodeURIComponent(escape(atob(s)));}
  function show(text){
    outWrap.innerHTML='';
    var lbl=el('div','tk-card-h');lbl.textContent=t('tk_output');lbl.style.margin='4px 0 6px';outWrap.appendChild(lbl);
    var field=el('div','tk-row');
    var ta=el('textarea','tk-input');ta.rows=4;ta.readOnly=true;ta.value=text;ta.dir='ltr';ta.style.cssText='width:100%;resize:vertical;font-family:var(--mono);min-height:80px';
    field.appendChild(ta);outWrap.appendChild(field);
    var cp=el('div');cp.style.marginTop='8px';cp.appendChild(tkCopyBtn(function(){return text;}));outWrap.appendChild(cp);
  }
  function err(){outWrap.innerHTML='<div class="errbox" style="margin-top:8px">'+t('tk_encErr')+'</div>';}
  actions.forEach(function(a){
    var b=el('button','tk-btn',a[1]);b.classList.add('ghost');
    b.addEventListener('click',function(){
      var s=inp.value;if(!s)return;
      try{
        if(a[0]==='b64enc')show(btoa(unescape(encodeURIComponent(s))));
        else if(a[0]==='b64dec')show(decodeURIComponent(escape(atob(s.trim()))));
        else if(a[0]==='urlenc')show(encodeURIComponent(s));
        else if(a[0]==='urldec')show(decodeURIComponent(s));
        else if(a[0]==='jwt'){
          var parts=s.trim().split('.');if(parts.length<2)throw 0;
          var head=JSON.parse(b64urlDecode(parts[0]));
          var payload=JSON.parse(b64urlDecode(parts[1]));
          show('HEADER:\n'+JSON.stringify(head,null,2)+'\n\nPAYLOAD:\n'+JSON.stringify(payload,null,2));
        }
      }catch(e){err();}
    });
    btns.appendChild(b);
  });
  body.appendChild(btns);body.appendChild(outWrap);
  card.appendChild(body);p.appendChild(card);
  return p;
}

/* ---- SSL certificate inspector ---- */
function tkSslPanel(){
  var p=el('div','tk-panel');
  p.appendChild(hintNode(t('tk_sslHint')));
  var row=el('div','tk-row');
  var inp=el('input','tk-input');inp.placeholder='example.com';inp.dir='ltr';
  var btn=el('button','tk-btn',t('tk_check'));
  row.appendChild(inp);row.appendChild(btn);p.appendChild(row);
  var out=el('div');out.style.marginTop='12px';p.appendChild(out);
  function run(){
    var host=inp.value.trim();if(!host)return;
    btn.disabled=true;out.innerHTML='<div class="tk-hint"><span class="spin"></span> '+t('tk_scanning')+'</div>';
    tkFetch('/api/tool/ssl',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({host:host})})
    .then(function(d){
      btn.disabled=false;
      var expired=d.daysLeft<0;
      var col=expired?'#fb7185':d.daysLeft<15?'#fb923c':d.daysLeft<40?'#fbbf24':'#34d399';
      var okCol=d.authorized?'#34d399':'#fb923c';
      out.innerHTML='<div class="tk-card"><div class="tk-card-b">'+
        '<div style="display:flex;align-items:center;gap:14px">'+
        '<div style="width:64px;height:64px;border-radius:16px;display:grid;place-items:center;flex-shrink:0;font-size:24px;font-weight:800;font-family:var(--mono);color:'+col+';border:2px solid '+col+'55;background:'+col+'14">'+(expired?'✕':d.daysLeft)+'</div>'+
        '<div style="flex:1;min-width:0"><div style="font-family:var(--mono);font-size:13px;word-break:break-all">'+esc(d.subject)+'</div>'+
        '<div style="margin-top:5px;font-size:12.5px;color:'+okCol+'">'+(d.authorized?t('tk_valid'):t('tk_invalid'))+'</div></div></div>'+
        '<div class="tk-kv"><span class="k">'+t('tk_issuer')+'</span><span class="v">'+esc(d.issuer)+'</span></div>'+
        '<div class="tk-kv"><span class="k">'+t('tk_expires')+'</span><span class="v" dir="ltr">'+esc(d.validTo)+'</span></div>'+
        '<div class="tk-kv"><span class="k">'+t('tk_daysLeft')+'</span><span class="v" style="color:'+col+'">'+(expired?t('tk_expired'):d.daysLeft)+'</span></div>'+
        '</div></div>';
    }).catch(function(e){btn.disabled=false;out.innerHTML='<div class="errbox">'+esc(e.message)+'</div>';});
  }
  btn.addEventListener('click',run);
  inp.addEventListener('keydown',function(e){if(e.key==='Enter')run();});
  return p;
}

/* ---- Protection guide (defensive, educational) ---- */
function guardHtml(){
  var fa=(lang==='fa');
  var items=fa?[
    ['🚗','ریموت خونه و ماشین','از ریموت با «کد ثابت» استفاده نکن؛ مدل‌های rolling code امن‌ترن. ریموت رو جای امن نگه‌دار.'],
    ['💻','کامپیوتر (BadUSB)','هیچ فلش یا USB ناشناسی رو به کامپیوتر وصل نکن — می‌تونه بدافزار تزریق کنه. قفل خودکار صفحه رو روشن کن.'],
    ['🔑','رمزها','برای هر سرویس رمز قوی و متفاوت بذار (از تب «مدیریت رمزها» استفاده کن) و ورود دو مرحله‌ای (2FA) را روشن کن.'],
    ['📶','وای‌فای','رمز روتر را از حالت پیش‌فرض عوض کن و از WPA2/WPA3 استفاده کن.'],
    ['🎣','فیشینگ','روی لینک مشکوک توی ایمیل/پیامک کلیک نکن؛ آدرس سایت را خودت تایپ کن.']
  ]:[
    ['🚗','Home & car remotes','Avoid fixed-code remotes; rolling-code models are safer. Keep remotes somewhere safe.'],
    ['💻','Computer (BadUSB)','Never plug an unknown USB stick into your PC — it can inject malware. Enable auto screen-lock.'],
    ['🔑','Passwords','Use a strong, unique password per service (use the Passwords tab) and turn on 2FA.'],
    ['📶','Wi-Fi','Change the router’s default password and use WPA2/WPA3.'],
    ['🎣','Phishing','Don’t click suspicious links in email/SMS; type the site address yourself.']
  ];
  return items.map(function(it){return '<div class="grow"><span class="gi">'+it[0]+'</span><div><b>'+esc(it[1])+'</b><br>'+esc(it[2])+'</div></div>';}).join('');
}
function tkGuardPanel(){
  var p=el('div','tk-panel');
  p.appendChild(hintNode(t('tk_guardHint')));
  var box=el('div','guidebox');box.innerHTML=guardHtml();p.appendChild(box);
  return p;
}

/* ---- Security learning (educational, legal) ---- */
function learnHtml(){
  var fa=(lang==='fa');
  var ethics=fa
    ?'قانون اول: فقط روی سیستم‌های خودت یا جایی که اجازه‌ی کتبی داری تست کن. تست نفوذ بدون اجازه در بیشتر کشورها جرم است — حتی «برای یادگیری».'
    :'Rule one: only test systems you own or have written permission for. Unauthorized testing is a crime in most countries — even “just to learn”.';
  var roadmap=fa?[
    ['۱','پایه','شبکه (TCP/IP، HTTP)، کار با لینوکس، و یک زبان اسکریپت مثل Python.'],
    ['۲','امنیت وب','با OWASP Top 10 شروع کن — رایج‌ترین آسیب‌پذیری‌ها و راهِ دفاع از هرکدام.'],
    ['۳','تمرین قانونی','توی محیط‌های امن و اجازه‌دارِ پایین تمرین کن — نه روی سایتِ واقعیِ کسی.'],
    ['۴','عمیق‌تر','گزارش‌نویسی، متدولوژی (مثل PTES)، و تخصصی‌شدن (وب، شبکه، موبایل).']
  ]:[
    ['1','Foundations','Networking (TCP/IP, HTTP), Linux, and a scripting language like Python.'],
    ['2','Web security','Start with the OWASP Top 10 — the most common vulnerabilities and how to defend each.'],
    ['3','Legal practice','Practice in the safe, authorized labs below — never on someone’s real site.'],
    ['4','Go deeper','Report writing, a methodology (e.g. PTES), and specialize (web, network, mobile).']
  ];
  var owasp=fa?[
    'کنترل دسترسی ناقص (Broken Access Control)','خطاهای رمزنگاری (Cryptographic Failures)',
    'تزریق (Injection — مثل SQL Injection و XSS)','طراحی ناامن (Insecure Design)',
    'پیکربندی اشتباه امنیتی (Security Misconfiguration)','کامپوننت‌های آسیب‌پذیر (Vulnerable Components)',
    'خطاهای احراز هویت (Authentication Failures)','خطای یکپارچگی داده (Integrity Failures)',
    'کمبود لاگ و مانیتورینگ (Logging & Monitoring)','SSRF (جعل درخواست سمت سرور)'
  ]:[
    'Broken Access Control','Cryptographic Failures','Injection (e.g. SQL Injection & XSS)','Insecure Design',
    'Security Misconfiguration','Vulnerable & Outdated Components','Identification & Authentication Failures',
    'Software & Data Integrity Failures','Security Logging & Monitoring Failures','Server-Side Request Forgery (SSRF)'
  ];
  var labs=[
    ['TryHackMe','https://tryhackme.com',fa?'مبتدی‌پسند، مسیر آموزشی قدم‌به‌قدم':'Beginner-friendly, guided paths'],
    ['Hack The Box','https://www.hackthebox.com',fa?'آزمایشگاه‌های عملی هک':'Hands-on hacking labs'],
    ['PortSwigger Web Security Academy','https://portswigger.net/web-security',fa?'رایگان، تخصص وب':'Free, web security'],
    ['OverTheWire','https://overthewire.org/wargames/',fa?'تمرین پایه‌ی لینوکس و شبکه':'Linux & networking basics'],
    ['OWASP Juice Shop','https://owasp.org/www-project-juice-shop/',fa?'اپ عمداً آسیب‌پذیر برای تمرین':'Deliberately vulnerable app to practice on']
  ];
  var h='<div class="tk-warn" style="margin:0 0 12px">⚖️ '+esc(ethics)+'</div>';
  h+='<b>'+(fa?'مسیر یادگیری':'Learning roadmap')+'</b>';
  roadmap.forEach(function(r){h+='<div class="grow"><span class="gi">'+r[0]+'</span><div><b>'+esc(r[1])+'</b><br>'+esc(r[2])+'</div></div>';});
  h+='<div style="margin-top:12px"><b>OWASP Top 10</b><ul>'+owasp.map(function(o){return '<li>'+esc(o)+'</li>';}).join('')+'</ul></div>';
  h+='<div style="margin-top:6px"><b>'+(fa?'محیط‌های تمرین قانونی':'Legal practice labs')+'</b></div>';
  labs.forEach(function(l){h+='<div class="grow"><span class="gi">🎯</span><div><a href="'+l[1]+'" target="_blank" rel="noopener"><b>'+esc(l[0])+'</b></a><br>'+esc(l[2])+'</div></div>';});
  return h;
}
function tkLearnPanel(){
  var p=el('div','tk-panel');
  var box=el('div','guidebox');box.innerHTML=learnHtml();p.appendChild(box);
  return p;
}

/* ---- Password vault (client-side AES-GCM, master-password locked) ---- */
function b64bytes(u8){var s='';for(var i=0;i<u8.length;i++)s+=String.fromCharCode(u8[i]);return btoa(s);}
function bytesFromB64(b){var s=atob(b),u=new Uint8Array(s.length);for(var i=0;i<s.length;i++)u[i]=s.charCodeAt(i);return u;}
async function vaultDeriveKey(master,salt){
  var enc=new TextEncoder();
  var km=await crypto.subtle.importKey('raw',enc.encode(master),'PBKDF2',false,['deriveKey']);
  return crypto.subtle.deriveKey({name:'PBKDF2',salt:salt,iterations:100000,hash:'SHA-256'},km,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);
}
async function vaultEncrypt(obj,key){
  var iv=crypto.getRandomValues(new Uint8Array(12));
  var data=new TextEncoder().encode(JSON.stringify(obj));
  var ct=await crypto.subtle.encrypt({name:'AES-GCM',iv:iv},key,data);
  return {iv:b64bytes(iv),ct:b64bytes(new Uint8Array(ct))};
}
async function vaultDecrypt(rec,key){
  var pt=await crypto.subtle.decrypt({name:'AES-GCM',iv:bytesFromB64(rec.iv)},key,bytesFromB64(rec.ct));
  return JSON.parse(new TextDecoder().decode(pt));
}
function tkVaultPanel(){
  var p=el('div','tk-panel');
  p.appendChild(hintNode(t('tk_vaultHint')));
  if(!(window.crypto&&window.crypto.subtle)){
    var w=el('div','tk-warn');
    w.textContent=(lang==='fa')
      ?'مدیریت رمزها برای امنیت به اتصال امن نیاز دارد: روی خود کامپیوتر با localhost:3000 بازش کن، یا از طریق آدرس https (تونل cloudflared).'
      :'For security the password manager needs a secure connection: open it on the computer via localhost:3000, or over an https address (cloudflared tunnel).';
    p.appendChild(w);return p;
  }
  var vkey='setayesh.vault.'+(currentUsername||'default');
  var rec=null;try{rec=JSON.parse(localStorage.getItem(vkey)||'null');}catch(e){}
  var body=el('div');p.appendChild(body);
  function saveRec(r){try{localStorage.setItem(vkey,JSON.stringify(r));}catch(e){}}
  async function persist(){
    var encd=await vaultEncrypt(VAULT.data,VAULT.key);
    var cur=null;try{cur=JSON.parse(localStorage.getItem(vkey)||'{}');}catch(e){cur={};}
    saveRec({salt:cur.salt,iv:encd.iv,ct:encd.ct});
  }
  function renderLocked(create){
    body.innerHTML='';
    var card=el('div','tk-card');var b=el('div','tk-card-b');
    b.innerHTML='<div class="tk-card-h" style="margin-bottom:8px">'+(create?t('tk_setMaster'):t('tk_enterMaster'))+'</div>';
    var row=el('div','tk-row');
    var inp=el('input','tk-input');inp.type='password';inp.placeholder='••••••••';
    var btn=el('button','tk-btn',create?t('tk_create'):t('tk_unlock'));
    row.appendChild(inp);row.appendChild(btn);b.appendChild(row);
    var note=el('div','note');note.style.minHeight='0';b.appendChild(note);
    card.appendChild(b);body.appendChild(card);
    inp.addEventListener('keydown',function(e){if(e.key==='Enter')btn.click();});
    btn.addEventListener('click',async function(){
      var m=inp.value;if(!m)return;
      if(create&&m.length<6){note.textContent=t('tk_masterShort');return;}
      try{
        if(create){
          var salt=crypto.getRandomValues(new Uint8Array(16));
          var key=await vaultDeriveKey(m,salt);
          var encd=await vaultEncrypt([],key);
          saveRec({salt:b64bytes(salt),iv:encd.iv,ct:encd.ct});
          VAULT.key=key;VAULT.data=[];VAULT.vkey=vkey;renderUnlocked();
        }else{
          var freshRec=null;try{freshRec=JSON.parse(localStorage.getItem(vkey)||'null');}catch(e){}
          if(!freshRec){note.textContent=t('tk_wrongMaster');return;}
          var key2=await vaultDeriveKey(m,bytesFromB64(freshRec.salt));
          var data=await vaultDecrypt(freshRec,key2);
          VAULT.key=key2;VAULT.data=data;VAULT.vkey=vkey;renderUnlocked();
        }
      }catch(e){note.textContent=t('tk_wrongMaster');}
    });
  }
  function renderUnlocked(){
    body.innerHTML='';
    var card=el('div','tk-card');var b=el('div','tk-card-b');
    b.innerHTML='<div class="tk-card-h" style="margin-bottom:8px">'+t('tk_addEntry')+'</div>';
    var s=el('input','tk-input');s.placeholder=t('tk_site');
    var u=el('input','tk-input');u.placeholder=t('tk_user');u.style.marginTop='7px';
    var pw=el('input','tk-input');pw.placeholder=t('tk_pass');pw.style.marginTop='7px';pw.dir='ltr';
    var add=el('button','tk-btn',t('tk_add'));add.style.cssText='width:100%;margin-top:9px';
    b.appendChild(s);b.appendChild(u);b.appendChild(pw);b.appendChild(add);
    card.appendChild(b);body.appendChild(card);
    add.addEventListener('click',async function(){
      if(!s.value&&!u.value&&!pw.value)return;
      VAULT.data.push({site:s.value,user:u.value,pass:pw.value});
      await persist();renderUnlocked();
    });
    var listWrap=el('div');listWrap.style.marginTop='12px';
    if(!VAULT.data.length)listWrap.appendChild(hintNode(t('tk_empty')));
    VAULT.data.forEach(function(ent,idx){
      var row=el('div','tk-card');row.style.marginTop='8px';var rb=el('div','tk-card-b');
      var head=el('div');head.style.cssText='display:flex;align-items:center;gap:8px;justify-content:space-between';
      head.innerHTML='<b style="font-size:13px;word-break:break-all">'+esc(ent.site||'—')+'</b>';
      var delb=el('button','tk-btn',t('tk_del'));delb.classList.add('ghost');delb.style.cssText='flex:0 0 auto;color:#ff9db0';
      head.appendChild(delb);rb.appendChild(head);
      if(ent.user){var uu=el('div');uu.style.cssText='font-size:12px;color:var(--muted);margin-top:4px';uu.textContent=ent.user;rb.appendChild(uu);}
      var prow=el('div','tk-row');prow.style.marginTop='7px';
      var pf=el('input','tk-input');pf.type='password';pf.readOnly=true;pf.value=ent.pass;pf.dir='ltr';pf.style.fontFamily='var(--mono)';
      var rev=el('button','tk-btn',t('tk_reveal'));rev.classList.add('ghost');rev.style.flex='0 0 auto';
      prow.appendChild(pf);prow.appendChild(rev);prow.appendChild(tkCopyBtn(function(){return ent.pass;}));
      rb.appendChild(prow);row.appendChild(rb);listWrap.appendChild(row);
      rev.addEventListener('click',function(){var hidden=pf.type==='password';pf.type=hidden?'text':'password';rev.textContent=hidden?t('tk_hide'):t('tk_reveal');});
      delb.addEventListener('click',async function(){VAULT.data.splice(idx,1);await persist();renderUnlocked();});
    });
    body.appendChild(listWrap);
    var lock=el('button','tk-btn',t('tk_lock'));lock.classList.add('ghost');lock.style.cssText='width:100%;margin-top:12px';
    lock.addEventListener('click',function(){VAULT.key=null;VAULT.data=null;VAULT.vkey=null;renderLocked(false);});
    body.appendChild(lock);
  }
  if(VAULT.key&&VAULT.data&&VAULT.vkey===vkey)renderUnlocked();
  else if(rec)renderLocked(false);
  else renderLocked(true);
  return p;
}

/* ---- Mobile / QR ---- */
function tkMobilePanel(){
  var p=el('div','tk-panel');
  p.appendChild(hintNode(t('tk_mobileHint')));
  var box=el('div','qrbox');box.innerHTML='<div class="tk-hint"><span class="spin"></span> '+t('tk_loading')+'</div>';
  p.appendChild(box);
  tkFetch('/api/tool/qr').then(function(d){
    box.innerHTML='';
    var frame=el('div','frame');
    if(d.svg)frame.innerHTML=d.svg;else frame.innerHTML='<div class="tk-hint">QR unavailable</div>';
    box.appendChild(frame);
    box.appendChild(el('div','u',d.url));
  }).catch(function(e){box.innerHTML='<div class="errbox">'+esc(e.message)+'</div>';});
  return p;
}

/* ---- Hardware (simulation) ---- */
function tkHwPanel(){
  var p=el('div','tk-panel');
  var w=el('div','tk-warn');w.textContent=t('tk_hwHint');p.appendChild(w);
  var box=el('div');box.innerHTML='<div class="tk-hint"><span class="spin"></span> '+t('tk_loading')+'</div>';p.appendChild(box);
  tkFetch('/api/tool/hardware').then(function(d){
    box.innerHTML='';
    var c1=el('div','tk-card');
    c1.innerHTML='<div class="tk-card-h">'+t('tk_serial')+'<span class="sim-tag">'+t('tk_sim')+'</span></div>'+
      '<div class="tk-card-b"><div class="tk-hint">'+esc(d.serial.note||t('tk_none'))+'</div></div>';
    box.appendChild(c1);

    var c2=el('div','tk-card');
    var caps=d.subghz.captures.map(function(x){return '<tr><td>'+esc(x.t)+'</td><td>'+esc(x.proto)+'</td><td>'+x.rssi+' dBm</td><td>'+x.bits+' bits</td></tr>';}).join('');
    c2.innerHTML='<div class="tk-card-h">Sub-GHz · '+esc(d.subghz.band)+'<span class="sim-tag">'+t('tk_sim')+'</span></div>'+
      '<div class="tk-card-b"><table class="tk-table"><tr><th>t</th><th>proto</th><th>rssi</th><th>len</th></tr>'+caps+'</table></div>';
    box.appendChild(c2);

    var c3=el('div','tk-card');
    var tags=d.rfid.tags.map(function(x){return '<div class="tk-kv"><span class="k">'+esc(x.type)+'</span><span class="v">'+esc(x.status)+'</span></div>';}).join('');
    c3.innerHTML='<div class="tk-card-h">RFID / NFC<span class="sim-tag">'+t('tk_sim')+'</span></div><div class="tk-card-b">'+tags+'</div>';
    box.appendChild(c3);
  }).catch(function(e){box.innerHTML='<div class="errbox">'+esc(e.message)+'</div>';});
  return p;
}

/* ---- Extensions ---- */
function tkExtPanel(){
  var p=el('div','tk-panel');
  p.appendChild(hintNode(t('tk_extHint')));
  var row=el('div','tk-row');
  var reload=el('button','tk-btn',t('tk_reload'));reload.style.background='linear-gradient(135deg,var(--violet),var(--violet-2))';reload.style.color='#fff';
  row.appendChild(reload);p.appendChild(row);
  var list=el('div');list.id='tkExtList';p.appendChild(list);
  function render(plugins){
    list.innerHTML='';
    var ok=plugins.filter(function(x){return !x.error;});
    if(!ok.length){list.appendChild(hintNode(t('tk_noext')));}
    plugins.forEach(function(pl){
      var card=el('div','tk-card');card.style.marginTop='10px';
      if(pl.error){
        card.innerHTML='<div class="tk-card-h" style="color:var(--danger)">'+esc(pl.name)+' · '+t('tk_extErr')+'</div>'+
          '<div class="tk-card-b"><div class="tk-hint">'+esc(pl.description)+'</div></div>';
        list.appendChild(card);return;
      }
      var h=el('div','tk-card-h');h.innerHTML='<span style="color:var(--violet-2)">✦</span> '+esc(pl.name)+
        (pl.description?'<span style="font-weight:400;color:var(--dim);margin-inline-start:8px">'+esc(pl.description)+'</span>':'');
      var b=el('div','tk-card-b');
      var r=el('div','tk-row');
      var inp=el('input','tk-input');inp.placeholder=pl.inputLabel||'input...';
      var btn=el('button','tk-btn',t('tk_extRun'));btn.style.background='linear-gradient(135deg,var(--violet),var(--violet-2))';btn.style.color='#fff';
      r.appendChild(inp);r.appendChild(btn);b.appendChild(r);
      var out=el('div');out.style.marginTop='9px';b.appendChild(out);
      function run(){
        btn.disabled=true;out.innerHTML='<span class="spin"></span>';
        tkFetch('/api/plugin/run',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:pl.id,input:inp.value})})
        .then(function(d){
          var res=d.result||{};
          var txt=res.text!=null?res.text:(res.json!=null?JSON.stringify(res.json,null,2):JSON.stringify(res,null,2));
          out.innerHTML='<pre style="margin:0;background:rgba(0,0,0,.3);border:1px solid var(--border);border-radius:9px;padding:10px 12px;overflow-x:auto;font-family:var(--mono);font-size:12px;white-space:pre-wrap;word-break:break-word">'+esc(txt)+'</pre>';
        })
        .catch(function(e){out.innerHTML='<div class="errbox">'+esc(e.message)+'</div>';})
        .then(function(){btn.disabled=false;});
      }
      btn.addEventListener('click',run);
      inp.addEventListener('keydown',function(e){if(e.key==='Enter')run();});
      card.appendChild(h);card.appendChild(b);list.appendChild(card);
    });
  }
  function load(reloadFlag){
    list.innerHTML='<div class="tk-hint"><span class="spin"></span> '+t('tk_loading')+'</div>';
    tkFetch(reloadFlag?'/api/plugins/reload':'/api/plugins',reloadFlag?{method:'POST'}:undefined)
      .then(function(d){render(d.plugins||[]);})
      .catch(function(e){list.innerHTML='<div class="errbox">'+esc(e.message)+'</div>';});
  }
  reload.addEventListener('click',function(){load(true);});
  load(false);
  return p;
}

function hintNode(txt){var d=el('div','tk-hint');d.textContent=txt;return d;}

$('toolkitBtn').addEventListener('click',openToolkit);
$('tkClose').addEventListener('click',closeToolkit);
$('toolkitOverlay').addEventListener('click',function(e){if(e.target===$('toolkitOverlay'))closeToolkit();});

/* ================= HOME DEVICES ================= */
/* Replaces the old Image Studio slot. Talks to /api/home/* using the app's
   own session token, so there is nothing extra to sign into.

   One design note worth keeping: the position ping below is what lets the
   air-fryer guard say yes. It runs while the app is open and reports only
   the newest point, never a trail. */

var DEV = { list: [], admin: false, drivers: [], perms: null, tab: 'list',
            scanTimer: null, found: [], stepUp: '' };

function devOpen(){ $('devicesOverlay').classList.add('on'); closeSidebar(); devLoad(); }
function devClose(){
  $('devicesOverlay').classList.remove('on');
  if(DEV.scanTimer){ clearInterval(DEV.scanTimer); DEV.scanTimer=null; }
}

/* Sensitive actions ask for the password once, then work for five minutes.
   The retry is silent so the user's original tap still happens. */
async function devApi(path, opts){
  opts = opts || {};
  var h = authHeaders({'Content-Type':'application/json'});
  if(DEV.stepUp) h['x-stepup'] = DEV.stepUp;
  var r = await fetch(path, { method: opts.method || (opts.body?'POST':'GET'),
                              headers: h, body: opts.body?JSON.stringify(opts.body):undefined });
  var d = {};
  try{ d = await r.json(); }catch(e){}
  if(!r.ok){
    if(d.stepUpRequired && !opts._retried){
      var pw = prompt('برای این کار رمز خود را دوباره وارد کنید:');
      if(!pw) throw new Error('لغو شد');
      var rr = await fetch('/api/reauth',{method:'POST',
        headers:authHeaders({'Content-Type':'application/json'}),
        body:JSON.stringify({password:pw})});
      var dd = {}; try{ dd = await rr.json(); }catch(e){}
      if(!rr.ok) throw new Error(dd.error||'رمز پذیرفته نشد');
      DEV.stepUp = dd.stepUp;
      opts._retried = true;
      return devApi(path, opts);
    }
    throw new Error(d.error || ('خطا '+r.status));
  }
  return d;
}

function devSay(msg, good){
  var b = $('devBody'); if(!b) return;
  var n = document.createElement('div');
  n.className = good ? 'note' : 'errbox';
  n.textContent = msg;
  n.style.marginBottom = '10px';
  b.insertBefore(n, b.firstChild);
  if(good) setTimeout(function(){ try{ n.remove(); }catch(e){} }, 4000);
}

async function devLoad(){
  try{
    var d = await devApi('/api/home/devices');
    DEV.list = d.devices; DEV.admin = d.admin;
    if(DEV.admin){
      DEV.drivers = (await devApi('/api/home/drivers')).drivers;
      DEV.perms   = await devApi('/api/home/permissions');
    }
    devRender();
  }catch(e){
    $('devBody').innerHTML = '<div class="errbox">'+esc(e.message)+'</div>';
  }
}

var DEV_CMD = { on:'روشن', off:'خاموش', volume_up:'صدا +', volume_down:'صدا −',
  mute:'بی‌صدا', home:'خانه', source:'ورودی', info:'اطلاعات', status:'وضعیت',
  privacy_on:'حریم خصوصی', privacy_off:'دیدن', motion_on:'حرکت روشن',
  motion_off:'حرکت خاموش', siren_off:'آژیر خاموش',
  pan_left:'◀', pan_right:'▶', tilt_up:'▲', tilt_down:'▼',
  pause:'مکث', resume:'ادامه' };

function devRender(){
  var b = $('devBody');
  if(DEV.tab === 'list')  return devRenderList(b);
  if(DEV.tab === 'scan')  return devRenderScan(b);
  if(DEV.tab === 'perms') return devRenderPerms(b);
}

function devRenderList(b){
  if(!DEV.list.length){
    b.innerHTML = '<div class="tk-hint">'+(DEV.admin
      ? 'هنوز دستگاهی اضافه نشده. از تب «جستجو» شروع کنید.'
      : 'هنوز دسترسی به دستگاهی ندارید.')+'</div>';
    return;
  }
  var h = '';
  for(var i=0;i<DEV.list.length;i++){
    var d = DEV.list[i];
    h += '<div class="tk-card"><div class="tk-card-h" style="display:flex;align-items:center;gap:8px">'+
         '<b style="flex:1">'+esc(d.name)+'</b>'+
         (d.paired?'<span class="tk-hint" style="padding:0">جفت‌شده</span>':'')+
         (DEV.admin?'<button class="btn ghost" data-devact="rename" data-id="'+d.id+'">نام</button>'+
                    '<button class="btn ghost" data-devact="cfg" data-id="'+d.id+'">تنظیم</button>'+
                    '<button class="btn ghost" data-devact="del" data-id="'+d.id+'">حذف</button>':'')+
         '</div><div class="tk-card-b">'+
         '<div class="tk-hint" style="padding:0 0 8px">'+esc(d.driverLabel)+' · '+esc(d.ip)+'</div>'+
         '<div class="tk-row" style="flex-wrap:wrap;gap:6px">';
    for(var j=0;j<d.capabilities.length;j++){
      var c = d.capabilities[j];
      if(c==='print') continue;
      if(c==='cook'){ h += '<button class="btn" data-devact="cook" data-id="'+d.id+'">شروع پخت…</button>'; continue; }
      h += '<button class="btn ghost" data-devact="cmd" data-id="'+d.id+'" data-cmd="'+c+'">'+(DEV_CMD[c]||c)+'</button>';
    }
    h += '</div></div></div>';
  }
  b.innerHTML = h;
}

function devRenderScan(b){
  if(!DEV.admin){ b.innerHTML = '<div class="tk-hint">فقط صاحب خانه می‌تواند شبکه را جستجو کند.</div>'; return; }
  var h = '<div class="tk-hint">فقط شبکه‌ای که این کامپیوتر روی آن است جستجو می‌شود.</div>'+
    '<div class="tk-row" style="margin:10px 0"><button class="btn" id="devScanGo">جستجوی دستگاه‌ها</button>'+
    '<span class="tk-hint" id="devScanTxt" style="padding:0"></span></div><div id="devScanOut"></div>'+
    '<div class="tk-card" style="margin-top:14px"><div class="tk-card-h">افزودن دستی</div><div class="tk-card-b">'+
    '<div class="tk-row" style="gap:8px;flex-wrap:wrap">'+
    '<input class="input" id="devMIp" placeholder="192.168.1.50" style="flex:1;min-width:140px">'+
    '<select class="picker" id="devMDrv" style="width:auto">';
  for(var i=0;i<DEV.drivers.length;i++)
    h += '<option value="'+DEV.drivers[i].id+'">'+esc(DEV.drivers[i].label)+'</option>';
  h += '</select><input class="input" id="devMName" placeholder="نام" style="flex:1;min-width:110px">'+
       '<button class="btn" id="devMAdd">افزودن</button></div></div></div>';
  b.innerHTML = h;
  if(DEV.found.length) devShowFound(DEV.found);
}

function devRenderPerms(b){
  if(!DEV.admin){ b.innerHTML = '<div class="tk-hint">فقط صاحب خانه دسترسی‌ها را می‌بیند.</div>'; return; }
  var p = DEV.perms;
  if(!p || !p.devices.length){ b.innerHTML = '<div class="tk-hint">اول یک دستگاه اضافه کنید.</div>'; return; }
  var h = '<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:13px">'+
          '<tr><th style="text-align:right;padding:6px 8px;border:1px solid var(--border)">کاربر</th>';
  for(var i=0;i<p.devices.length;i++)
    h += '<th style="padding:6px 4px;border:1px solid var(--border)">'+esc(p.devices[i].name)+'</th>';
  h += '</tr>';
  for(var u=0;u<p.users.length;u++){
    var user = p.users[u], adm = p.admins.indexOf(user) >= 0;
    h += '<tr><td style="text-align:right;padding:6px 8px;border:1px solid var(--border);white-space:nowrap">'+
         esc(user)+(adm?' <span class="tk-hint" style="padding:0">صاحب</span>':'')+'</td>';
    for(var k=0;k<p.devices.length;k++){
      var dv = p.devices[k];
      if(adm){ h += '<td style="text-align:center;padding:6px;border:1px solid var(--border);color:#3fb27f">✓</td>'; continue; }
      var fixed = !!(p.perms[user] && p.perms[user][dv.id]);
      var tmp = false;
      for(var g=0;g<p.grants.length;g++)
        if(p.grants[g].user===user && p.grants[g].dev===dv.id && p.grants[g].until>Date.now()) tmp = true;
      var col = fixed ? '#3fb27f' : (tmp ? '#e0a33e' : 'var(--muted)');
      var mk  = fixed ? '✓' : (tmp ? '⏱' : '·');
      h += '<td style="text-align:center;padding:6px;border:1px solid var(--border);cursor:pointer;color:'+col+
           '" data-devact="toggle" data-user="'+esc(user)+'" data-id="'+dv.id+'" data-on="'+(fixed?'1':'0')+'">'+mk+'</td>';
    }
    h += '</tr>';
  }
  h += '</table></div><div class="tk-row" style="margin-top:10px;gap:8px">'+
       '<button class="btn ghost" data-devact="temp">دسترسی موقت…</button>'+
       '<button class="btn ghost" data-devact="resetperms">بازگشت به پیش‌فرض</button></div>'+
       '<div class="tk-hint">یک ضربه روی هر خانه باز یا بسته می‌کند. ⏱ یعنی دسترسی موقت.</div>';
  b.innerHTML = h;
}

function devShowFound(found){
  DEV.found = found;
  var box = $('devScanOut'); if(!box) return;
  if(!found.length){ box.innerHTML = '<div class="tk-hint">چیزی پیدا نشد. مطمئن شوید دستگاه‌ها روشن‌اند.</div>'; return; }
  var h = '';
  for(var i=0;i<found.length;i++){
    var f = found[i];
    h += '<div class="tk-row" style="border-top:1px solid var(--border);padding:9px 0;gap:8px;align-items:center">'+
         '<div style="flex:1;min-width:0"><b>'+esc(f.name)+'</b><div class="tk-hint" style="padding:0">'+
         esc(f.ip)+(f.mac?' · '+esc(f.mac):'')+' · پورت '+f.open.join(',')+'</div></div>'+
         (f.known ? '<span class="tk-hint" style="padding:0">اضافه شده</span>'
                  : (f.driver ? '<button class="btn" data-devact="addfound" data-i="'+i+'">افزودن</button>'
                              : '<span class="tk-hint" style="padding:0">ناشناس</span>'))+'</div>';
  }
  box.innerHTML = h;
}

async function devScan(){
  var btn = $('devScanGo'); if(btn) btn.disabled = true;
  DEV.found = [];
  var out = $('devScanOut'); if(out) out.innerHTML = '';
  try{
    await devApi('/api/home/scan', { body:{} });
    if(DEV.scanTimer) clearInterval(DEV.scanTimer);
    DEV.scanTimer = setInterval(async function(){
      var s;
      try{ s = await devApi('/api/home/scan'); }
      catch(e){ clearInterval(DEV.scanTimer); DEV.scanTimer=null; if(btn) btn.disabled=false; return devSay(e.message); }
      var txt = $('devScanTxt');
      if(txt) txt.textContent = s.running ? (s.progress+' از '+s.total) : (s.error||'');
      if(!s.running){
        clearInterval(DEV.scanTimer); DEV.scanTimer = null;
        if(btn) btn.disabled = false;
        if(txt) txt.textContent = s.found.length+' دستگاه پیدا شد';
        devShowFound(s.found);
      }
    }, 1500);
  }catch(e){ if(btn) btn.disabled=false; devSay(e.message); }
}

/* One delegated listener for the whole panel: the body is re-rendered often,
   so per-button handlers would have to be re-attached every time. */
$('devBody').addEventListener('click', async function(ev){
  var el = ev.target.closest ? ev.target.closest('[data-devact]') : null;
  if(!el) {
    if(ev.target.id === 'devScanGo') return devScan();
    if(ev.target.id === 'devMAdd')   return devAddManual();
    return;
  }
  var act = el.getAttribute('data-devact');
  var id  = el.getAttribute('data-id');
  try{
    if(act === 'cmd'){
      var c = el.getAttribute('data-cmd');
      el.disabled = true;
      var r = await devApi('/api/home/devices/'+id+'/command', { body:{ command:c } });
      el.disabled = false;
      devSay(r.note || (r.state ? 'وضعیت: '+r.state : 'انجام شد'), true);
      return;
    }
    if(act === 'cook'){
      var temp = Number(prompt('دما (۴۰ تا ۲۰۰ درجه):','180')); if(!temp) return;
      var mins = Number(prompt('چند دقیقه؟ (حداکثر ۴۰)','20')); if(!mins) return;
      var rc = await devApi('/api/home/devices/'+id+'/command',
        { body:{ command:'cook', arg:{ temp:temp, minutes:mins } } });
      return devSay(rc.note||'شروع شد', true);
    }
    if(act === 'rename'){
      var cur = null;
      for(var i=0;i<DEV.list.length;i++) if(DEV.list[i].id===id) cur = DEV.list[i];
      var n = prompt('نام تازه:', cur?cur.name:''); if(!n) return;
      await devApi('/api/home/devices/'+id, { method:'PUT', body:{ name:n } });
      return devLoad();
    }
    if(act === 'del'){
      if(!confirm('این دستگاه حذف شود؟')) return;
      await devApi('/api/home/devices/'+id, { method:'DELETE' });
      devSay('حذف شد.', true);
      return devLoad();
    }
    if(act === 'cfg'){
      var dv = null;
      for(var k=0;k<DEV.list.length;k++) if(DEV.list[k].id===id) dv = DEV.list[k];
      if(!dv) return;
      var body = {};
      if(dv.driver === 'xiaomi_device'){
        var tk = prompt('توکن شیائومی (۳۲ رقم هگز) — خالی بگذارید تا تغییر نکند:');
        if(tk) body.token = tk.trim();
      } else if(dv.driver === 'tuya_device'){
        var ti = prompt('شناسه‌ی دستگاه در Tuya:'); if(!ti) return;
        body.tuyaId = ti.trim();
      } else { return devSay('این دستگاه تنظیم اضافه‌ای ندارد.'); }
      await devApi('/api/home/devices/'+id+'/flags', { body:body });
      devSay('ذخیره شد.', true);
      return devLoad();
    }
    if(act === 'addfound'){
      var f = DEV.found[Number(el.getAttribute('data-i'))];
      await devApi('/api/home/devices', { body:{ ip:f.ip, mac:f.mac, driver:f.driver,
        name:f.name, model:f.model, extra:f.extra } });
      devSay('اضافه شد — در تب دسترسی‌ها بازش کنید.', true);
      DEV.list = (await devApi('/api/home/devices')).devices;
      if(DEV.admin) DEV.perms = await devApi('/api/home/permissions');
      f.known = true; devShowFound(DEV.found);
      return;
    }
    if(act === 'toggle'){
      await devApi('/api/home/permissions', { body:{ user:el.getAttribute('data-user'),
        device:id, allowed: el.getAttribute('data-on') !== '1' } });
      DEV.perms = await devApi('/api/home/permissions');
      return devRender();
    }
    if(act === 'temp'){
      var u = prompt('کدام کاربر؟'); if(!u) return;
      var dn = prompt('نام دستگاه؟'); if(!dn) return;
      var hrs = Number(prompt('برای چند ساعت؟','12')); if(!hrs||hrs<=0) return;
      var target = null;
      for(var q=0;q<DEV.perms.devices.length;q++) if(DEV.perms.devices[q].name===dn) target = DEV.perms.devices[q];
      if(!target) return devSay('دستگاهی با این نام نیست.');
      await devApi('/api/home/permissions', { body:{ user:u, device:target.id,
        until:new Date(Date.now()+hrs*3600000).toISOString() } });
      DEV.perms = await devApi('/api/home/permissions');
      devSay('دسترسی موقت داده شد.', true);
      return devRender();
    }
    if(act === 'resetperms'){
      if(!confirm('همه‌ی دسترسی‌ها به پیش‌فرض برگردد؟')) return;
      await devApi('/api/home/permissions/reset', { body:{} });
      DEV.perms = await devApi('/api/home/permissions');
      devSay('برگشت به پیش‌فرض.', true);
      return devRender();
    }
  }catch(e){
    el.disabled = false;
    devSay(e.message);
  }
});

async function devAddManual(){
  try{
    await devApi('/api/home/devices', { body:{
      ip: $('devMIp').value.trim(), driver: $('devMDrv').value, name: $('devMName').value.trim() } });
    devSay('اضافه شد.', true);
    DEV.list = (await devApi('/api/home/devices')).devices;
    if(DEV.admin) DEV.perms = await devApi('/api/home/permissions');
  }catch(e){ devSay(e.message); }
}

$('devTabs').addEventListener('click', function(ev){
  var t = ev.target.closest ? ev.target.closest('[data-devtab]') : null;
  if(!t) return;
  DEV.tab = t.getAttribute('data-devtab');
  var all = $('devTabs').querySelectorAll('.tk-tab');
  for(var i=0;i<all.length;i++) all[i].classList.remove('on');
  t.classList.add('on');
  devRender();
  /* Accounts and devices change while the panel is open — a new person added
     in the users panel has to appear here without reopening anything. So the
     tab refetches, and re-renders again once the answer arrives. */
  (async function(){
    try{
      if(DEV.tab === 'perms' && DEV.admin){ DEV.perms = await devApi('/api/home/permissions'); }
      else if(DEV.tab === 'list'){ DEV.list = (await devApi('/api/home/devices')).devices; }
      else return;
      devRender();
    }catch(e){}
  })();
});

$('devicesBtn').addEventListener('click', devOpen);
$('devClose').addEventListener('click', devClose);
$('devicesOverlay').addEventListener('click', function(e){ if(e.target===$('devicesOverlay')) devClose(); });

/* Position ping. Only the newest point is kept, and only in the server's
   memory — this answers "is anyone nearly home", nothing more. */
function devSendPosition(){
  if(!navigator.geolocation || !token) return;
  navigator.geolocation.getCurrentPosition(function(p){
    fetch('/api/home/position',{ method:'POST',
      headers: authHeaders({'Content-Type':'application/json'}),
      body: JSON.stringify({ lat:p.coords.latitude, lon:p.coords.longitude }) }).catch(function(){});
  }, function(){}, { maximumAge:120000, timeout:8000 });
}
setTimeout(devSendPosition, 4000);
setInterval(devSendPosition, 4*60*1000);


try{loadTheme();}catch(e){}   // digital theme on the login screen too
try{loadTextSize();}catch(e){}
applyLang();
/* Boot: a session token wins; otherwise try to sign in with this device's
   stored secret. Only if BOTH fail does the login screen appear. The device
   secret is checked against a hash on the server, so this is a real
   credential — recognising the device, not skipping the check. */
(async function boot(){
  if(token){ await enterApp(); return; }
  var sec='';
  try{ sec=localStorage.getItem('setayesh.devsecret')||''; }catch(e){}
  if(sec){
    try{
      var r=await fetch('/api/auto-login',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({deviceId:deviceId(),deviceSecret:sec})});
      if(r.ok){
        var d=await r.json();
        token=d.token; currentUsername=d.username;
        try{ localStorage.setItem(TOKEN_KEY,token); localStorage.setItem(USER_KEY,currentUsername);
             localStorage.setItem('setayesh.lastuser',currentUsername); }catch(e){}
        sessionStorage.setItem(TOKEN_KEY,token); sessionStorage.setItem(USER_KEY,currentUsername);
        await enterApp();
        return;
      }
      // Device no longer trusted (revoked from the control centre) — drop it.
      try{ localStorage.removeItem('setayesh.devsecret'); }catch(e){}
    }catch(e){}
  }
  try{var lu=localStorage.getItem('setayesh.lastuser');if(lu){$('uField').value=lu;$('pField').focus();}}catch(e){}
  $('loginView').style.display='flex';
})();
})();
