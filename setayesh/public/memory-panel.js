/* Memory panel — a calm, visual view of each account's own memory, split into
   short-term (deadlines & the last few days) and long-term (durable knowledge).
   Uses the existing /api/memory endpoints, so it works for any signed-in user. */
(function(){
  var KIND={
    fact:{i:'💡',t:'دانسته',c:'#38bdf8'}, preference:{i:'⭐',t:'ترجیح',c:'#a78bfa'},
    project:{i:'📦',t:'پروژه',c:'#34d399'}, document:{i:'📄',t:'سند',c:'#fbbf24'},
    deadline:{i:'⏰',t:'مهلت',c:'#fb7185'}
  };
  function el(id){return document.getElementById(id);}
  // Self-contained auth (the main script's authHeaders is module-scoped), same
  // token the rest of the app and the 3D brain use.
  function tok(){ try{ return localStorage.getItem('setayesh.token')||sessionStorage.getItem('setayesh.token')||''; }catch(e){ return ''; } }
  function authH(extra){ var h={Authorization:'Bearer '+tok()}; if(extra)for(var k in extra)h[k]=extra[k]; return h; }
  function faNum(n){return String(n).replace(/\d/g,function(d){return '۰۱۲۳۴۵۶۷۸۹'[d];});}
  function when(iso){
    try{
      var ms=Date.now()-new Date(iso).getTime(), d=Math.floor(ms/86400000);
      if(d<=0)return 'امروز'; if(d===1)return 'دیروز'; if(d<30)return faNum(d)+' روز پیش';
      return faNum(Math.floor(d/30))+' ماه پیش';
    }catch(e){return '';}
  }
  function isShort(m){
    if(m.kind==='deadline'||m.due)return true;
    try{ return (Date.now()-new Date(m.createdAt).getTime()) < 3*86400000; }catch(e){ return false; }
  }
  function card(m){
    var k=KIND[m.kind]||KIND.fact;
    var d=document.createElement('div');
    d.setAttribute('style','position:relative;padding:11px 12px;border-radius:13px;background:rgba(255,255,255,.035);'+
      'border:1px solid rgba(255,255,255,.08);border-inline-start:3px solid '+k.c);
    var head='<div style="display:flex;align-items:center;gap:7px;margin-bottom:4px">'+
      '<span style="font-size:13px">'+k.i+'</span>'+
      '<span style="font-size:10.5px;font-weight:700;color:'+k.c+'">'+k.t+'</span>'+
      (m.due?'<span style="font-size:10.5px;color:#fb7185">· '+ (''+m.due).replace(/</g,'') +'</span>':'')+
      '<span style="margin-inline-start:auto;font-size:10px;color:var(--muted,#8ea0c8)">'+when(m.createdAt)+'</span></div>';
    var body=document.createElement('div');
    body.setAttribute('style','font-size:13px;line-height:1.6;color:var(--text,#e8ecf7);word-break:break-word');
    body.textContent=m.text||'';
    var del=document.createElement('button');
    del.textContent='حذف'; del.title='حذف این خاطره';
    del.setAttribute('style','position:absolute;inset-inline-end:8px;bottom:8px;font-size:10.5px;padding:2px 8px;'+
      'border-radius:8px;border:1px solid rgba(251,113,133,.35);background:rgba(251,113,133,.10);color:#fda4af;cursor:pointer');
    del.addEventListener('click',function(){ delMem(m.id,d); });
    d.innerHTML=head; d.appendChild(body); d.appendChild(del);
    return d;
  }
  function empty(txt){
    var e=document.createElement('div');
    e.setAttribute('style','font-size:12px;color:var(--muted,#8ea0c8);padding:10px;text-align:center;'+
      'border:1px dashed rgba(255,255,255,.10);border-radius:12px');
    e.textContent=txt; return e;
  }
  function render(list){
    var shortBox=el('memShort'), longBox=el('memLong');
    shortBox.innerHTML=''; longBox.innerHTML='';
    var s=0,l=0;
    (list||[]).forEach(function(m){
      if(isShort(m)){ shortBox.appendChild(card(m)); s++; }
      else { longBox.appendChild(card(m)); l++; }
    });
    if(!s)shortBox.appendChild(empty('چیزی در کوتاه‌مدت نیست.'));
    if(!l)longBox.appendChild(empty('هنوز حافظه‌ی بلندمدتی ساخته نشده.'));
    el('memShortCount').textContent=faNum(s)+' مورد';
    el('memLongCount').textContent=faNum(l)+' مورد';
    var badge=el('shMemoryBadge');
    if(badge){ if(s){badge.textContent=faNum(s);badge.style.display='';} else badge.style.display='none'; }
  }
  function load(){
    return fetch('/api/memory',{headers:authH()}).then(function(r){return r.json();})
      .then(function(d){ render((d&&d.memory)||[]); })
      .catch(function(){ render([]); });
  }
  function delMem(id,node){
    fetch('/api/memory/'+encodeURIComponent(id),{method:'DELETE',headers:authH()})
      .then(function(r){ if(r.ok&&node)node.remove(); load(); })
      .catch(function(){});
  }
  function addMem(){
    var t=(el('memAddText').value||'').trim(), kind=el('memAddKind').value, note=el('memAddNote');
    note.textContent='';
    if(!t){ note.textContent='یک متن بنویس.'; return; }
    fetch('/api/memory',{method:'POST',headers:authH({'Content-Type':'application/json'}),
      body:JSON.stringify({text:t,kind:kind})})
      .then(function(r){return r.json().then(function(d){return {ok:r.ok,d:d};});})
      .then(function(x){ if(!x.ok){ note.textContent=(x.d&&x.d.error)||'ذخیره نشد'; return; }
        el('memAddText').value=''; load(); })
      .catch(function(){ note.textContent='خطای شبکه'; });
  }
  function openMem(){ el('memScrim').style.display='block'; el('memPanel').style.display='block'; load(); }
  function closeMem(){ el('memScrim').style.display='none'; el('memPanel').style.display='none'; }
  window.openMemoryPanel=openMem;
  document.addEventListener('DOMContentLoaded',function(){
    var b=el('shMemory'); if(b)b.addEventListener('click',function(){ if(typeof closeSheet==='function')closeSheet(); setTimeout(openMem,160); });
    el('memClose').addEventListener('click',closeMem);
    el('memScrim').addEventListener('click',closeMem);
    el('memAddBtn').addEventListener('click',addMem);
    el('memAddText').addEventListener('keydown',function(e){ if(e.key==='Enter')addMem(); });
  });
})();
