/* SETAYESH_BUILD 9.9.71 */
/* Brain map — a living picture of Setayesh's whole self: a central hexagon
   core with every file as a node around it, colour-coded by area, green when
   healthy / red when missing. Click a node to see what it does and edit it.
   Self-contained (its own auth), styled to match the hexagon-core diagram. */
(function(){
  function el(id){return document.getElementById(id);}
  function tok(){ try{ return localStorage.getItem('setayesh.token')||sessionStorage.getItem('setayesh.token')||''; }catch(e){ return ''; } }
  function authH(extra){ var h={Authorization:'Bearer '+tok()}; if(extra)for(var k in extra)h[k]=extra[k]; return h; }
  var NS='http://www.w3.org/2000/svg';
  function svg(tag,attrs){ var e=document.createElementNS(NS,tag); if(attrs)for(var k in attrs)e.setAttribute(k,attrs[k]); return e; }
  var GROUP_COLORS={
    'هستهٔ سرور':'#38bdf8','مسیرها':'#34d399','رابط کاربری':'#a78bfa','اسناد و ابزار':'#fbbf24','مغز پایتون':'#f472b6'
  };
  var MAP=null, SEL=null;

  function hexPath(cx,cy,r){
    var p=''; for(var i=0;i<6;i++){ var a=Math.PI/180*(60*i-30); var x=cx+r*Math.cos(a), y=cy+r*Math.sin(a); p+=(i?'L':'M')+x.toFixed(1)+' '+y.toFixed(1); } return p+'Z';
  }

  function build(){
    var view=el('brainMapView'); if(!view)return; view.innerHTML='';
    // flatten nodes
    var nodes=[];
    Object.keys(MAP.groups||{}).forEach(function(g){
      (MAP.groups[g]||[]).forEach(function(f){ nodes.push(Object.assign({group:g},f)); });
    });
    // add the python brain as a special node
    if(MAP.pybrain){ nodes.push({group:'مغز پایتون',name:'pybrain',purpose:'مغز دوم (پایتون): خودآموز، محلی، با حافظهٔ والت.',
      editable:false, exists:MAP.pybrain.exists, special:'pybrain', lines:MAP.pybrain.knowledgeFiles||0}); }

    var W=1000,H=720, cx=W/2, cy=H/2;
    var s=svg('svg',{viewBox:'0 0 '+W+' '+H, width:'100%', height:'100%', preserveAspectRatio:'xMidYMid meet'});
    // glow defs
    var defs=svg('defs'); defs.innerHTML=
      '<radialGradient id="bmCore" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#7dd3fc"/><stop offset=".55" stop-color="#3b82f6"/><stop offset="1" stop-color="#1e1b4b"/></radialGradient>'+
      '<filter id="bmGlow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>';
    s.appendChild(defs);

    // rings
    var rings=[ {r:210,cap:9}, {r:320,cap:15}, {r:430,cap:99} ];
    var linesG=svg('g'), nodesG=svg('g');
    s.appendChild(linesG); s.appendChild(nodesG);

    var idx=0, ringI=0, inRing=0;
    // distribute
    var placement=[]; var ri=0, count=0;
    for(var i=0;i<nodes.length;i++){
      if(count>=rings[ri].cap && ri<rings.length-1){ ri++; count=0; }
      placement.push(ri); count++;
    }
    // count per ring for even spacing
    var perRing={}; placement.forEach(function(r){perRing[r]=(perRing[r]||0)+1;});
    var seen={};
    nodes.forEach(function(n,i){
      var r=placement[i]; var total=perRing[r]; var pos=(seen[r]=(seen[r]||0)); seen[r]++;
      var ang=(Math.PI*2)*(pos/total) - Math.PI/2 + (r*0.35);
      var R=rings[r].r;
      var x=cx+R*Math.cos(ang), y=cy+R*Math.sin(ang);
      n._x=x; n._y=y;
      var col=GROUP_COLORS[n.group]||'#8ea0c8';
      var health=n.exists?col:'#fb7185';
      // connector line
      var ln=svg('line',{x1:cx,y1:cy,x2:x,y2:y,stroke:n.exists?'rgba(120,160,220,.28)':'rgba(251,113,133,.5)','stroke-width':n.exists?1:1.6});
      linesG.appendChild(ln);
      // node
      var g=svg('g',{class:'bm-node',style:'cursor:pointer'});
      var dotR=n.special?18:11;
      var c=svg('circle',{cx:x,cy:y,r:dotR,fill:'rgba(10,14,26,.92)',stroke:health,'stroke-width':n.special?3:2,filter:'url(#bmGlow)'});
      var inner=svg('circle',{cx:x,cy:y,r:n.special?7:4,fill:health,opacity:n.exists?'.95':'1'});
      g.appendChild(c); g.appendChild(inner);
      var short=n.name.replace(/^public\//,'').replace(/^routes\//,'');
      var label=svg('text',{x:x,y:y+dotR+12,'text-anchor':'middle',fill:'#cbd5f5','font-size':'10',style:'pointer-events:none'});
      label.textContent=short.length>18?short.slice(0,17)+'…':short;
      g.appendChild(label);
      g.addEventListener('click',function(nn){return function(){selectNode(nn);};}(n));
      nodesG.appendChild(g);
    });

    // central hexagon core
    var core=svg('path',{d:hexPath(cx,cy,74),fill:'url(#bmCore)',stroke:'#7dd3fc','stroke-width':2,filter:'url(#bmGlow)'});
    core.style.cursor='pointer';
    core.addEventListener('click',function(){ selectCore(); });
    nodesG.appendChild(core);
    var ct=svg('text',{x:cx,y:cy-4,'text-anchor':'middle',fill:'#eaf2ff','font-size':'15','font-weight':'800'}); ct.textContent='ستایش';
    var cv=svg('text',{x:cx,y:cy+14,'text-anchor':'middle',fill:'#bcd3ff','font-size':'10'}); cv.textContent='v'+(MAP.version||'');
    nodesG.appendChild(ct); nodesG.appendChild(cv);

    view.appendChild(s);
    // legend
    var leg=el('brainMapLegend');
    if(leg){ leg.innerHTML=''; Object.keys(GROUP_COLORS).forEach(function(g){
      var sp=document.createElement('span'); sp.style.cssText='display:inline-flex;align-items:center;gap:5px;margin-inline-end:12px;font-size:11px;color:#a9b6d6';
      sp.innerHTML='<span style="width:9px;height:9px;border-radius:2px;background:'+GROUP_COLORS[g]+'"></span>'+g; leg.appendChild(sp);
    }); }
  }

  function panel(){ return el('brainMapPanel'); }
  function selectCore(){
    var p=panel(); if(!p)return;
    p.innerHTML='<div style="font-weight:800;font-size:15px;color:#7dd3fc;margin-bottom:6px">🧠 هستهٔ ستایش</div>'+
      '<div style="font-size:12.5px;color:#b9c4e0;line-height:1.9">این نقشهٔ کاملِ خودِ ستایش است. هر گره یک فایل است؛ رنگ = بخش، حلقهٔ سبز = سالم، قرمز = گم‌شده. روی هر گره بزن تا کارش را ببینی و ویرایشش کنی.</div>';
    p.style.display='block';
  }
  function selectNode(n){
    SEL=n; var p=panel(); if(!p)return;
    if(n.special==='pybrain'){
      p.innerHTML='<div style="font-weight:800;font-size:14px;color:#f472b6;margin-bottom:4px">🧠 مغز پایتون (مغز دوم)</div>'+
        '<div style="font-size:12px;color:#b9c4e0;line-height:1.8;margin-bottom:8px">'+n.purpose+'</div>'+
        '<div style="font-size:12px;color:#8ea0c8">پایتون: '+(MAP.pybrain.python?'✅ آماده':'🔴 نصب نیست')+' · فایل مغز: '+(n.exists?'✅':'🔴')+' · دانش والت: '+(n.lines||0)+' نوت</div>';
      p.style.display='block'; return;
    }
    var head='<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">'+
      '<span style="font-weight:800;font-size:13.5px;color:'+(GROUP_COLORS[n.group]||'#cbd5f5')+';direction:ltr;word-break:break-all">'+n.name+'</span>'+
      '<span style="margin-inline-start:auto;font-size:10.5px;color:'+(n.exists?'#34d399':'#fb7185')+'">'+(n.exists?'● سالم':'○ گم‌شده')+'</span></div>'+
      '<div style="font-size:10.5px;color:#8ea0c8;margin-bottom:6px">'+n.group+' · '+(n.lines||0)+' خط · '+(n.editable?'قابل ویرایش':'فقط خواندنی')+'</div>'+
      '<div style="font-size:12.5px;color:#c9d4ee;line-height:1.8;margin-bottom:10px">'+n.purpose+'</div>';
    var btns='<div style="display:flex;gap:6px"><button id="bmView" style="flex:1;padding:8px;border-radius:9px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.05);color:#dbe4f7;cursor:pointer;font-size:12px">👁️ دیدن</button>'+
      (n.editable?'<button id="bmEdit" style="flex:1;padding:8px;border-radius:9px;border:0;background:linear-gradient(135deg,#7b5cff,#22d3ee);color:#04121e;font-weight:700;cursor:pointer;font-size:12px">✏️ ویرایش</button>':'')+'</div>'+
      '<div id="bmEditor" style="display:none;margin-top:10px"></div><div id="bmNote" style="font-size:11.5px;margin-top:6px;min-height:14px"></div>';
    p.innerHTML=head+btns; p.style.display='block';
    var vb=el('bmView'); if(vb)vb.addEventListener('click',function(){ openFile(n,false); });
    var eb=el('bmEdit'); if(eb)eb.addEventListener('click',function(){ openFile(n,true); });
  }
  function openFile(n,editMode){
    var box=el('bmEditor'), note=el('bmNote'); if(!box)return;
    note.style.color='#8ea0c8'; note.textContent='در حال خواندن…'; box.style.display='block';
    fetch('/api/admin/brain/file?name='+encodeURIComponent(n.name),{headers:authH()}).then(function(r){return r.json();}).then(function(d){
      if(d.error){ note.style.color='#fb7185'; note.textContent=d.error; return; }
      note.textContent='';
      var ta=document.createElement('textarea');
      ta.value=d.content||''; ta.readOnly=!editMode;
      ta.style.cssText='width:100%;height:min(46vh,420px);background:#080b16;color:#cfe0ff;border:1px solid rgba(255,255,255,.12);border-radius:10px;padding:10px;font:400 11.5px/1.5 ui-monospace,monospace;direction:ltr;text-align:left;resize:vertical';
      box.innerHTML=''; box.appendChild(ta);
      if(editMode){
        var save=document.createElement('button');
        save.textContent='💾 ذخیره'; save.style.cssText='margin-top:8px;padding:8px 16px;border-radius:9px;border:0;background:linear-gradient(135deg,#34d399,#22d3ee);color:#04121e;font-weight:800;cursor:pointer;font-size:12.5px';
        save.addEventListener('click',function(){
          note.style.color='#8ea0c8'; note.textContent='در حال ذخیره…';
          fetch('/api/admin/brain/file',{method:'POST',headers:authH({'Content-Type':'application/json'}),body:JSON.stringify({name:n.name,content:ta.value})})
            .then(function(r){return r.json();}).then(function(d2){
              if(d2.error){ note.style.color='#fb7185'; note.textContent=d2.error; }
              else { note.style.color='#34d399'; note.textContent=(d2.note||'ذخیره شد'); }
            }).catch(function(e){ note.style.color='#fb7185'; note.textContent='خطا: '+e.message; });
        });
        box.appendChild(save);
      }
    }).catch(function(e){ note.style.color='#fb7185'; note.textContent='خطا: '+e.message; });
  }

  function open(){
    var ov=el('brainMapOverlay'); if(!ov)return;
    ov.style.display='block';
    var p=panel(); if(p){ p.style.display='none'; }
    el('brainMapView').innerHTML='<div style="color:#8ea0c8;text-align:center;padding:40px">در حال ساخت نقشه…</div>';
    fetch('/api/admin/brain/map',{headers:authH()}).then(function(r){return r.json();}).then(function(d){
      if(d&&d.error){ el('brainMapView').innerHTML='<div style="color:#fb7185;text-align:center;padding:40px">'+d.error+'</div>'; return; }
      MAP=d; build(); selectCore();
    }).catch(function(e){ el('brainMapView').innerHTML='<div style="color:#fb7185;text-align:center;padding:40px">خطا: '+e.message+'</div>'; });
  }
  function close(){ var ov=el('brainMapOverlay'); if(ov)ov.style.display='none'; }
  window.openBrainMap=open; window.closeBrainMap=close;
  document.addEventListener('DOMContentLoaded',function(){
    var c=el('brainMapClose'); if(c)c.addEventListener('click',close);
    var b=el('brainMapBtn'); if(b)b.addEventListener('click',open);
    var sh=el('shBrainMap'); if(sh)sh.addEventListener('click',function(){ if(typeof closeSheet==='function')closeSheet(); setTimeout(open,160); });
  });
})();
