/* Connectors panel — configure & connect Google, then read/send mail and add
   calendar events directly (the AI can also do these in chat once connected). */
(function(){
  function el(id){return document.getElementById(id);}
  function tok(){ try{ return localStorage.getItem('setayesh.token')||sessionStorage.getItem('setayesh.token')||''; }catch(e){ return ''; } }
  function authH(extra){ var h={Authorization:'Bearer '+tok()}; if(extra)for(var k in extra)h[k]=extra[k]; return h; }
  function note(id,msg,ok){ var n=el(id); if(!n)return; n.textContent=msg||''; n.style.color=ok?'#34d399':'#fb7185'; }

  function refresh(){
    return fetch('/api/connectors',{headers:authH()}).then(function(r){return r.json();}).then(function(d){
      var g=(d&&d.google)||{};
      el('cxRedirect').value=(d&&d.redirectUri)||'';
      var dot=el('cxGDot'), st=el('cxGStatus');
      if(g.connected){
        dot.style.background='#34d399';
        st.textContent='متصل'+(g.email?(' · '+g.email):'');
        el('cxSetup').style.display='none'; el('cxConnected').style.display='block';
      } else if(g.configured){
        dot.style.background='#fbbf24';
        st.textContent='کلیدها ذخیره شده — هنوز وصل نشده';
        el('cxSetup').style.display='block'; el('cxConnected').style.display='none';
      } else {
        dot.style.background='#6b7280';
        st.textContent='تنظیم نشده';
        el('cxSetup').style.display='block'; el('cxConnected').style.display='none';
      }
    }).catch(function(){ el('cxGStatus').textContent='خطا در دریافت وضعیت'; });
  }
  function saveCreds(){
    var id=(el('cxClientId').value||'').trim(), sec=(el('cxClientSecret').value||'').trim();
    if(!id||!sec){ note('cxSetupNote','هر دو کلید لازم است.'); return Promise.resolve(false); }
    note('cxSetupNote','در حال ذخیره…',true);
    return fetch('/api/admin/settings',{method:'POST',headers:authH({'Content-Type':'application/json'}),
      body:JSON.stringify({updates:{GOOGLE_CLIENT_ID:id,GOOGLE_CLIENT_SECRET:sec}})})
      .then(function(r){return r.json().then(function(d){return {ok:r.ok,d:d};});})
      .then(function(x){ if(!x.ok){ note('cxSetupNote',(x.d&&x.d.error)||'ذخیره نشد'); return false; }
        note('cxSetupNote','ذخیره شد.',true); el('cxClientSecret').value=''; return refresh().then(function(){return true;}); });
  }
  function connect(){
    note('cxSetupNote','در حال آماده‌سازی اتصال…',true);
    fetch('/api/admin/connectors/google/auth-url',{headers:authH()})
      .then(function(r){return r.json().then(function(d){return {ok:r.ok,d:d};});})
      .then(function(x){ if(!x.ok||!x.d.url){ note('cxSetupNote',(x.d&&x.d.error)||'اتصال ممکن نشد'); return; }
        note('cxSetupNote','پنجره‌ی گوگل باز شد — بعد از تأیید، همین‌جا «قطع/وصل» را ببین.',true);
        window.open(x.d.url,'_blank'); });
  }
  function disconnect(){
    fetch('/api/admin/connectors/google/disconnect',{method:'POST',headers:authH()})
      .then(function(){ refresh(); });
  }
  function esc(s){ return String(s==null?'':s).replace(/[<>&]/g,function(c){return {'<':'&lt;','>':'&gt;','&':'&amp;'}[c];}); }
  function showRows(rows){
    var box=el('cxResult'); box.innerHTML='';
    rows.forEach(function(html){ var d=document.createElement('div');
      d.setAttribute('style','padding:9px 11px;border-radius:11px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);font-size:12.5px;line-height:1.6');
      d.innerHTML=html; box.appendChild(d); });
  }
  function readMail(){
    note('cxActionNote','در حال خواندن…',true); el('cxResult').innerHTML='';
    fetch('/api/connectors/gmail?limit=10',{headers:authH()}).then(function(r){return r.json();}).then(function(d){
      if(d.error){ note('cxActionNote',d.error); return; } note('cxActionNote','');
      showRows((d.messages||[]).map(function(m){ return '<b>'+esc(m.subject)+'</b>'+(m.unread?' <span style="color:#fbbf24">●</span>':'')+
        '<div style="color:#8ea0c8;font-size:11px;margin-top:2px">'+esc(m.from)+'</div>'+
        '<div style="color:#aeb7cf;margin-top:3px">'+esc((m.snippet||'').slice(0,140))+'</div>'; }));
      if(!(d.messages||[]).length) note('cxActionNote','صندوق خالی است یا چیزی خوانده نشد.',true);
    }).catch(function(){ note('cxActionNote','خطای شبکه'); });
  }
  function listCal(){
    note('cxActionNote','در حال خواندن…',true); el('cxResult').innerHTML='';
    fetch('/api/connectors/calendar?limit=10',{headers:authH()}).then(function(r){return r.json();}).then(function(d){
      if(d.error){ note('cxActionNote',d.error); return; } note('cxActionNote','');
      showRows((d.events||[]).map(function(e){ return '<b>'+esc(e.title)+'</b>'+
        '<div style="color:#8ea0c8;font-size:11px;margin-top:2px">'+esc(e.start)+(e.end?(' — '+esc(e.end)):'')+'</div>'+
        (e.location?('<div style="color:#aeb7cf;margin-top:2px">📍 '+esc(e.location)+'</div>'):''); }));
      if(!(d.events||[]).length) note('cxActionNote','قراری پیدا نشد.',true);
    }).catch(function(){ note('cxActionNote','خطای شبکه'); });
  }
  function sendMail(){
    var to=(el('cxTo').value||'').trim();
    if(!to){ note('cxActionNote','گیرنده لازم است.'); return; }
    note('cxActionNote','در حال ارسال…',true);
    fetch('/api/connectors/gmail/send',{method:'POST',headers:authH({'Content-Type':'application/json'}),
      body:JSON.stringify({to:to,subject:el('cxSubject').value||'',body:el('cxBody').value||''})})
      .then(function(r){return r.json();}).then(function(d){ if(d.error){ note('cxActionNote',d.error); return; }
        note('cxActionNote','ایمیل ارسال شد ✅',true); el('cxTo').value=el('cxSubject').value=el('cxBody').value=''; })
      .catch(function(){ note('cxActionNote','خطای شبکه'); });
  }
  function backupToDrive(){
    var pass=(el('cxBkPass').value||'');
    if(pass.length<8){ note('cxActionNote','رمز پشتیبان حداقل ۸ حرف لازم است.'); return; }
    note('cxActionNote','در حال رمزنگاری و آپلود به درایو…',true);
    var btn=el('cxBackupDrive'); if(btn)btn.disabled=true;
    fetch('/api/admin/backups/encrypt-upload',{method:'POST',headers:authH({'Content-Type':'application/json'}),
      body:JSON.stringify({passphrase:pass})})
      .then(function(r){return r.json().then(function(d){return {ok:r.ok,d:d};});})
      .then(function(x){ if(btn)btn.disabled=false;
        if(!x.ok){ note('cxActionNote',(x.d&&x.d.error)||'آپلود ناموفق'); return; }
        el('cxBkPass').value='';
        var link=(x.d.drive&&x.d.drive.link)||'';
        note('cxActionNote','آپلود شد ✅ '+((x.d.backup&&x.d.backup.file)||''),true);
        if(link){ var box=el('cxResult'); box.innerHTML=''; var a=document.createElement('a');
          a.href=link; a.target='_blank'; a.textContent='باز کردن در Google Drive';
          a.setAttribute('style','display:inline-block;padding:8px 12px;border-radius:10px;background:rgba(52,211,153,.12);border:1px solid rgba(52,211,153,.34);color:#6ee7b7;font-size:12.5px'); box.appendChild(a); }
      })
      .catch(function(){ if(btn)btn.disabled=false; note('cxActionNote','خطای شبکه'); });
  }
  function addEvent(){
    var title=(el('cxEvTitle').value||'').trim(), start=el('cxEvStart').value, end=el('cxEvEnd').value;
    if(!title||!start){ note('cxActionNote','عنوان و زمان شروع لازم است.'); return; }
    note('cxActionNote','در حال ثبت…',true);
    fetch('/api/connectors/calendar/add',{method:'POST',headers:authH({'Content-Type':'application/json'}),
      body:JSON.stringify({title:title,start:start,end:end||undefined})})
      .then(function(r){return r.json();}).then(function(d){ if(d.error){ note('cxActionNote',d.error); return; }
        note('cxActionNote','قرار ثبت شد ✅',true); el('cxEvTitle').value=el('cxEvStart').value=el('cxEvEnd').value=''; })
      .catch(function(){ note('cxActionNote','خطای شبکه'); });
  }
  function open(){ el('cxScrim').style.display='block'; el('cxPanel').style.display='block'; refresh(); }
  function close(){ el('cxScrim').style.display='none'; el('cxPanel').style.display='none'; }
  window.openConnectorsPanel=open;
  document.addEventListener('DOMContentLoaded',function(){
    var b=el('shConnectors'); if(b)b.addEventListener('click',function(){ if(typeof closeSheet==='function')closeSheet(); setTimeout(open,160); });
    el('cxClose').addEventListener('click',close);
    el('cxScrim').addEventListener('click',close);
    el('cxSaveCreds').addEventListener('click',saveCreds);
    el('cxConnect').addEventListener('click',function(){ if((el('cxClientId').value||'').trim()){ saveCreds().then(function(ok){ if(ok)connect(); }); } else connect(); });
    el('cxCopyRedirect').addEventListener('click',function(){ try{ el('cxRedirect').select(); document.execCommand('copy'); note('cxSetupNote','کپی شد.',true);}catch(e){} });
    el('cxDisconnect').addEventListener('click',disconnect);
    el('cxReadMail').addEventListener('click',readMail);
    el('cxListCal').addEventListener('click',listCal);
    el('cxSendMail').addEventListener('click',sendMail);
    el('cxAddEvent').addEventListener('click',addEvent);
    el('cxBackupDrive').addEventListener('click',backupToDrive);
  });
})();
