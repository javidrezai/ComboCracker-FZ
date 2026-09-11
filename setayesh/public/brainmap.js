/* SETAYESH_BUILD 9.9.80 */
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

  // ---- Cover: the face of Setayesh. An ORIGINAL, hand-drawn digital woman
  // (no stock/copyrighted image), elegant, cyan/violet, matching the app. This
  // is the first thing shown; clicking "enter" reveals both brains inside. ----
  function faceSVG(){
    return ''+
    '<svg viewBox="0 0 700 760" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">'+
    '<defs>'+
    '<radialGradient id="bgGlow" cx="50%" cy="42%" r="60%"><stop offset="0" stop-color="#1a2a5e"/><stop offset="1" stop-color="#04060e" stop-opacity="0"/></radialGradient>'+
    '<linearGradient id="skin" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#dfe9ff"/><stop offset=".5" stop-color="#a9c2ec"/><stop offset="1" stop-color="#5f78b8"/></linearGradient>'+
    '<linearGradient id="hair" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b1430"/><stop offset="1" stop-color="#14224e"/></linearGradient>'+
    '<radialGradient id="halo" cx="50%" cy="50%" r="50%"><stop offset=".75" stop-color="#22d3ee" stop-opacity="0"/><stop offset=".92" stop-color="#22d3ee" stop-opacity=".55"/><stop offset="1" stop-color="#22d3ee" stop-opacity="0"/></radialGradient>'+
    '<filter id="soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>'+
    '</defs>'+
    '<rect x="0" y="0" width="700" height="760" fill="url(#bgGlow)"/>'+
    '<circle cx="350" cy="320" r="240" fill="url(#halo)"/>'+
    // faint particles
    '<g fill="#7dd3fc" opacity=".7">'+
    '<circle cx="140" cy="180" r="2.5"/><circle cx="560" cy="150" r="2"/><circle cx="600" cy="320" r="3"/><circle cx="110" cy="360" r="2"/><circle cx="150" cy="520" r="2.5"/><circle cx="580" cy="520" r="2"/><circle cx="500" cy="90" r="1.8"/><circle cx="230" cy="110" r="1.8"/>'+
    '</g>'+
    // hair — a soft feminine frame, wider and taller than the face, flowing
    // down both sides past the cheeks (drawn behind the face)
    '<path d="M350 62 C240 62 180 140 172 250 C166 330 176 420 198 512 C206 536 234 534 238 505 C226 424 228 352 242 296 C258 196 292 150 350 150 C408 150 442 196 458 296 C472 352 474 424 462 505 C466 534 494 536 502 512 C524 420 534 330 528 250 C520 140 460 62 350 62 Z" fill="url(#hair)" stroke="#22d3ee" stroke-width="1.4" opacity=".97"/>'+
    // centre part + a few strand highlights
    '<g stroke="#3a4f86" stroke-width="1.4" fill="none" opacity=".8"><path d="M350 150 C330 200 322 260 326 300 M230 300 C222 380 226 440 240 495 M470 300 C478 380 474 440 460 495"/></g>'+
    // neck + shoulders
    '<path d="M300 470 L300 545 C300 575 400 575 400 545 L400 470 Z" fill="url(#skin)"/>'+
    '<path d="M250 620 C250 560 300 545 350 545 C400 545 450 560 450 620 L450 700 L250 700 Z" fill="#16243f" stroke="#22d3ee" stroke-width="1.2" opacity=".9"/>'+
    // face
    '<path d="M350 150 C432 150 460 250 456 322 C452 392 410 452 350 476 C290 452 248 392 244 322 C240 250 268 150 350 150 Z" fill="url(#skin)" stroke="#bfe3ff" stroke-width="1.2"/>'+
    // brows
    '<path d="M286 300 C305 290 330 290 346 298" fill="none" stroke="#2a3d63" stroke-width="3" stroke-linecap="round"/>'+
    '<path d="M414 300 C395 290 370 290 354 298" fill="none" stroke="#2a3d63" stroke-width="3" stroke-linecap="round"/>'+
    // eyes (almond) + glowing iris
    '<path d="M290 322 C305 310 335 310 348 322 C335 336 305 336 290 322 Z" fill="#0a1226"/>'+
    '<path d="M352 322 C365 310 395 310 410 322 C395 336 365 336 352 322 Z" fill="#0a1226"/>'+
    '<circle cx="319" cy="322" r="8" fill="#22d3ee" filter="url(#soft)"/>'+
    '<circle cx="381" cy="322" r="8" fill="#22d3ee" filter="url(#soft)"/>'+
    '<circle cx="319" cy="322" r="3" fill="#eaffff"/><circle cx="381" cy="322" r="3" fill="#eaffff"/>'+
    // nose + lips
    '<path d="M350 330 L342 378 C346 384 354 384 358 378" fill="none" stroke="#7f93bd" stroke-width="2" stroke-linecap="round"/>'+
    '<path d="M326 410 C340 402 360 402 374 410 C360 422 340 422 326 410 Z" fill="#c98da6" opacity=".85"/>'+
    '<path d="M326 410 C340 416 360 416 374 410" fill="none" stroke="#8a5f76" stroke-width="1.5"/>'+
    // circuit accents on temple/cheek + glowing nodes
    '<g stroke="#22d3ee" stroke-width="1.4" fill="none" opacity=".9" filter="url(#soft)">'+
    '<path d="M440 250 L470 250 L470 290 M456 322 L500 322 M446 360 L482 388 M300 430 L270 458 L230 458"/>'+
    '</g>'+
    '<g fill="#7dd3fc" filter="url(#soft)">'+
    '<circle cx="470" cy="250" r="3.5"/><circle cx="500" cy="322" r="3.5"/><circle cx="482" cy="388" r="3"/><circle cx="230" cy="458" r="3"/><circle cx="270" cy="290" r="2.5"/>'+
    '</g>'+
    // subtle cheek circuit on left
    '<g stroke="#7b5cff" stroke-width="1.2" fill="none" opacity=".7"><path d="M262 300 L232 300 L232 340 M244 360 L214 386"/></g>'+
    '</svg>';
  }
  function cover(){
    var view=el('brainMapView'); if(!view)return;
    var face=window.SETAYESH_FACE||'';
    // The cover is Setayesh's face (a real 3D digital-woman image). No "enter"
    // text — clicking the picture goes inside. If the image can't load
    // (offline), fall back to the built-in SVG face, still clickable.
    view.innerHTML=''+
    '<div id="bmCover" style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:12px;cursor:pointer">'+
      '<div id="bmFaceWrap" style="width:min(60vh,340px);max-width:86vw;aspect-ratio:1;border-radius:24px;overflow:hidden;box-shadow:0 20px 60px rgba(34,211,238,.25);border:1px solid rgba(123,92,255,.35)">'+
        '<img id="bmFaceImg" src="'+face+'" alt="ستایش" style="width:100%;height:100%;object-fit:cover;display:block"/>'+
      '</div>'+
      '<div style="font-weight:900;font-size:24px;letter-spacing:1px;color:#eaf2ff;margin-top:12px">ستایش</div>'+
    '</div>';
    var cov=el('bmCover'); if(cov)cov.addEventListener('click',enterMap);
    var img=el('bmFaceImg');
    if(img)img.onerror=function(){ var w=el('bmFaceWrap'); if(w){ w.style.aspectRatio='700/760'; w.style.borderRadius='24px'; w.innerHTML=faceSVG(); } };
    var leg=el('brainMapLegend'); if(leg)leg.innerHTML='';
  }
  // Enter the brains. The side panel is NOT shown up front — it appears only
  // when you click a brain or a part (the owner asked for no permanent panel).
  function enterMap(){ build(); var p=panel(); if(p)p.style.display='none'; }

  // ---- Inside: BOTH brains side by side. Left = brain one (the Node app body:
  // its files by area). Right = brain two (the self-learning Python brain with
  // its vault knowledge). A glowing bridge shows they stay in sync. ----
  // A realistic two-hemisphere brain (top view): left half orange with a
  // circuit pattern (the digital side), right half blue with organic folds —
  // the picture the owner asked both brains to look like. Original artwork,
  // drawn in SVG. Centred at (cx,cy), scaled by s, clickable.
  function brainIcon(cx,cy,s,name,onClick){
    var g=svg('g',{style:'cursor:pointer'});
    g.setAttribute('transform','translate('+cx+' '+cy+') scale('+s+')');
    g.innerHTML=''+
      '<ellipse cx="0" cy="118" rx="96" ry="20" fill="#0a1020" opacity=".7"/>'+
      // hemispheres
      '<path d="M-4,-118 C-46,-124 -92,-96 -100,-46 C-107,6 -90,58 -58,94 C-42,112 -16,116 -6,102 C-4,60 -4,-40 -4,-118 Z" fill="url(#brL)" stroke="#ff8a1f" stroke-width="1.5" filter="url(#brGlow)"/>'+
      '<path d="M4,-118 C46,-124 92,-96 100,-46 C107,6 90,58 58,94 C42,112 16,116 6,102 C4,60 4,-40 4,-118 Z" fill="url(#brR)" stroke="#5cc0ff" stroke-width="1.5"/>'+
      // central fissure
      '<path d="M0,-116 C-3,-40 -3,50 0,104 C3,50 3,-40 0,-116 Z" fill="#05070f" opacity=".85"/>'+
      // organic folds (right/blue)
      '<g fill="none" stroke="#d3ecff" stroke-width="2.2" opacity=".55" stroke-linecap="round">'+
      '<path d="M18,-92 C42,-84 46,-60 28,-52"/><path d="M52,-78 C74,-62 68,-38 48,-34"/><path d="M22,-40 C48,-34 54,-8 34,4"/>'+
      '<path d="M60,-22 C82,-8 74,22 52,28"/><path d="M26,26 C50,38 46,66 26,70"/><path d="M58,44 C78,60 66,86 46,86"/><path d="M78,-30 C92,-14 86,14 70,20"/>'+
      '</g>'+
      // circuit lines (left/orange)
      '<g fill="none" stroke="#ffce8a" stroke-width="1.8" opacity=".95" filter="url(#brGlow)">'+
      '<path d="M-18,-92 L-42,-92 L-42,-66"/><path d="M-56,-76 L-82,-76 L-82,-46"/><path d="M-30,-44 L-58,-44 L-58,-14"/>'+
      '<path d="M-74,-22 L-74,8 L-48,8"/><path d="M-34,12 L-62,12 L-62,42"/><path d="M-46,50 L-46,76 L-22,76"/><path d="M-92,-8 L-66,-8"/>'+
      '</g>'+
      '<g fill="#ffe4b0" filter="url(#brGlow)">'+
      '<circle cx="-42" cy="-66" r="2.6"/><circle cx="-82" cy="-46" r="2.6"/><circle cx="-58" cy="-14" r="2.6"/><circle cx="-48" cy="8" r="2.6"/><circle cx="-62" cy="42" r="2.6"/><circle cx="-22" cy="76" r="2.6"/><circle cx="-66" cy="-8" r="2.4"/>'+
      '</g>'+
      // sparkle dots along edges
      '<g fill="#ffd9a0" filter="url(#brGlow)"><circle cx="-96" cy="-30" r="2"/><circle cx="-90" cy="30" r="2"/><circle cx="-66" cy="80" r="2"/><circle cx="-36" cy="-104" r="1.8"/></g>'+
      '<g fill="#bfe4ff" filter="url(#brGlow)"><circle cx="96" cy="-30" r="2"/><circle cx="90" cy="30" r="2"/><circle cx="66" cy="80" r="2"/><circle cx="36" cy="-104" r="1.8"/><circle cx="70" cy="-70" r="1.8"/></g>';
    g.addEventListener('click',onClick);
    return g;
  }
  function build(){
    var view=el('brainMapView'); if(!view)return; view.innerHTML='';
    var nodes=[];
    Object.keys(MAP.groups||{}).forEach(function(g){
      (MAP.groups[g]||[]).forEach(function(f){ nodes.push(Object.assign({group:g},f)); });
    });
    var W=1200,H=760, cy=H/2, cxA=360, cxB=880;
    var s=svg('svg',{viewBox:'0 0 '+W+' '+H, width:'100%', height:'100%', preserveAspectRatio:'xMidYMid meet'});
    var defs=svg('defs'); defs.innerHTML=
      '<radialGradient id="bmCore" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#7dd3fc"/><stop offset=".55" stop-color="#3b82f6"/><stop offset="1" stop-color="#1e1b4b"/></radialGradient>'+
      '<radialGradient id="bmCore2" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#f9a8d4"/><stop offset=".55" stop-color="#db2777"/><stop offset="1" stop-color="#3b0d2b"/></radialGradient>'+
      '<radialGradient id="brL" cx="42%" cy="40%" r="70%"><stop offset="0" stop-color="#ffd7a0"/><stop offset=".45" stop-color="#ff8a1f"/><stop offset="1" stop-color="#7a2a00"/></radialGradient>'+
      '<radialGradient id="brR" cx="58%" cy="40%" r="70%"><stop offset="0" stop-color="#cfe8ff"/><stop offset=".45" stop-color="#3fa0e6"/><stop offset="1" stop-color="#0b2f5e"/></radialGradient>'+
      '<filter id="bmGlow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>'+
      '<filter id="brGlow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>'+
      // moving signals along every connection + a gently breathing glow
      '<style>.bm-flow{stroke-dasharray:5 9;animation:bmflow .9s linear infinite}'+
      '@keyframes bmflow{to{stroke-dashoffset:-14}}'+
      '.bm-flow2{stroke-dasharray:7 10;animation:bmflow2 1.1s linear infinite}'+
      '@keyframes bmflow2{to{stroke-dashoffset:17}}</style>';
    s.appendChild(defs);
    // Static overlay (never rotates): the bridge, its pulses, brain names and
    // captions. Two rotating groups: each whole brain (core + its lines + its
    // nodes) turns about its own centre for a live, 3D feel. Node labels get a
    // matching counter-rotation so their text stays upright while they orbit.
    var staticG=svg('g'); s.appendChild(staticG);
    var rotA=svg('g'), rotB=svg('g'); s.appendChild(rotA); s.appendChild(rotB);
    var DURA=70, DURB=58;
    rotA.appendChild(svg('animateTransform',{attributeName:'transform',type:'rotate',from:'0 '+cxA+' '+cy,to:'360 '+cxA+' '+cy,dur:DURA+'s',repeatCount:'indefinite'}));
    rotB.appendChild(svg('animateTransform',{attributeName:'transform',type:'rotate',from:'0 '+cxB+' '+cy,to:'360 '+cxB+' '+cy,dur:DURB+'s',repeatCount:'indefinite'}));
    function upright(label,x,y,dur){ label.appendChild(svg('animateTransform',{attributeName:'transform',type:'rotate',from:'0 '+x+' '+y,to:'-360 '+x+' '+y,dur:dur+'s',repeatCount:'indefinite'})); }

    // bridge between the two brains — signals flow both ways across it
    var bridge=svg('line',{x1:cxA,y1:cy,x2:cxB,y2:cy,stroke:'rgba(123,92,255,.7)','stroke-width':3,filter:'url(#bmGlow)',class:'bm-flow2'});
    staticG.appendChild(bridge);
    var pulse1=svg('circle',{r:4,fill:'#c4b5fd',filter:'url(#bmGlow)'});
    pulse1.innerHTML='<animate attributeName="cx" values="'+cxA+';'+cxB+'" dur="2.4s" repeatCount="indefinite"/><animate attributeName="cy" values="'+cy+';'+cy+'" dur="2.4s" repeatCount="indefinite"/>';
    var pulse2=svg('circle',{r:3.5,fill:'#7dd3fc',filter:'url(#bmGlow)'});
    pulse2.innerHTML='<animate attributeName="cx" values="'+cxB+';'+cxA+'" dur="3s" repeatCount="indefinite"/><animate attributeName="cy" values="'+cy+';'+cy+'" dur="3s" repeatCount="indefinite"/>';
    staticG.appendChild(pulse1); staticG.appendChild(pulse2);
    var bl=svg('text',{x:(cxA+cxB)/2,y:cy-12,'text-anchor':'middle',fill:'#b9a7ff','font-size':'12','font-weight':'700'}); bl.textContent='⇄ هماهنگ';
    staticG.appendChild(bl);

    // brain one: the app files around core A, biased to the left hemisphere
    var rings=[ {r:150,cap:8}, {r:225,cap:14}, {r:300,cap:99} ];
    var placement=[], ri=0, count=0;
    for(var i=0;i<nodes.length;i++){ if(count>=rings[ri].cap && ri<rings.length-1){ ri++; count=0; } placement.push(ri); count++; }
    var perRing={}; placement.forEach(function(r){perRing[r]=(perRing[r]||0)+1;});
    var seen={};
    nodes.forEach(function(n,i){
      var r=placement[i], total=perRing[r], pos=(seen[r]=(seen[r]||0)); seen[r]++;
      var ang=Math.PI*0.5 + (Math.PI*1.5)*(total>1?pos/(total-1):0) + (r*0.18);
      var R=rings[r].r, x=cxA+R*Math.cos(ang), y=cy+R*Math.sin(ang);
      n._x=x; n._y=y;
      var col=GROUP_COLORS[n.group]||'#8ea0c8', health=n.exists?col:'#fb7185';
      rotA.appendChild(svg('line',{x1:cxA,y1:cy,x2:x,y2:y,stroke:n.exists?'rgba(120,190,255,.5)':'rgba(251,113,133,.6)','stroke-width':n.exists?1.4:1.8,class:'bm-flow'}));
      var g=svg('g',{style:'cursor:pointer'});
      g.appendChild(svg('circle',{cx:x,cy:y,r:11,fill:'rgba(10,14,26,.92)',stroke:health,'stroke-width':2,filter:'url(#bmGlow)'}));
      g.appendChild(svg('circle',{cx:x,cy:y,r:4,fill:health,opacity:n.exists?'.95':'1'}));
      var short=n.name.replace(/^public\//,'').replace(/^routes\//,'');
      var label=svg('text',{x:x,y:y+22,'text-anchor':'middle',fill:'#cbd5f5','font-size':'9.5',style:'pointer-events:none'});
      label.textContent=short.length>16?short.slice(0,15)+'…':short;
      upright(label,x,y+22,DURA);
      g.appendChild(label);
      g.addEventListener('click',function(nn){return function(){selectNode(nn);};}(n));
      rotA.appendChild(g);
    });

    // brain two: the Python brain — its own core + a ring of knowledge notes
    var pb=MAP.pybrain||{exists:false,python:false,knowledgeFiles:0};
    var kn=Math.min(pb.knowledgeFiles||0,12);
    for(var k=0;k<kn;k++){
      var a=(Math.PI*2)*(k/Math.max(kn,1)) - Math.PI/2, R2=120;
      var x2=cxB+R2*Math.cos(a), y2=cy+R2*Math.sin(a);
      rotB.appendChild(svg('line',{x1:cxB,y1:cy,x2:x2,y2:y2,stroke:'rgba(244,114,182,.55)','stroke-width':1.4,class:'bm-flow'}));
      var gk=svg('g'); gk.appendChild(svg('circle',{cx:x2,cy:y2,r:7,fill:'rgba(20,10,20,.9)',stroke:'#f472b6','stroke-width':2,filter:'url(#bmGlow)'}));
      gk.appendChild(svg('circle',{cx:x2,cy:y2,r:2.6,fill:'#f9a8d4'})); rotB.appendChild(gk);
    }
    // both cores are the same realistic two-hemisphere brain — they rotate with
    // their group, so the whole brain (and every part) turns
    rotA.appendChild(brainIcon(cxA,cy,0.62,'مغز اول',function(){selectCore();}));
    rotB.appendChild(brainIcon(cxB,cy,0.5,'مغز دوم',function(){selectPybrain();}));
    // names + captions (upright, never rotate)
    var nA=svg('text',{x:cxA,y:cy-96,'text-anchor':'middle',fill:'#eaf2ff','font-size':'14','font-weight':'800'}); nA.textContent='مغز اول';
    var nB=svg('text',{x:cxB,y:cy-80,'text-anchor':'middle',fill:'#eaf2ff','font-size':'13','font-weight':'800'}); nB.textContent='مغز دوم';
    staticG.appendChild(nA); staticG.appendChild(nB);
    var capA=svg('text',{x:cxA,y:cy+330,'text-anchor':'middle',fill:'#9db4e0','font-size':'12','font-weight':'700'}); capA.textContent='🧠 مغز اول: بدنهٔ ستایش (نود)';
    var capB=svg('text',{x:cxB,y:cy+200,'text-anchor':'middle',fill:'#f0a9cf','font-size':'12','font-weight':'700'});
    capB.textContent='🧠 مغز دوم: خودآموز '+(pb.python?'✅':'🔴')+' · '+(pb.knowledgeFiles||0)+' نوت';
    staticG.appendChild(capA); staticG.appendChild(capB);

    view.appendChild(s);
    var leg=el('brainMapLegend');
    if(leg){ leg.innerHTML=''; Object.keys(GROUP_COLORS).forEach(function(g){
      var sp=document.createElement('span'); sp.style.cssText='display:inline-flex;align-items:center;gap:5px;margin-inline-end:12px;font-size:11px;color:#a9b6d6';
      sp.innerHTML='<span style="width:9px;height:9px;border-radius:2px;background:'+GROUP_COLORS[g]+'"></span>'+g; leg.appendChild(sp);
    }); }
  }
  // A command panel that lives inside each brain: type something, press اجرا
  // (or Ctrl/Cmd+Enter), and it runs on that brain and shows the answer.
  // Brain one runs on the default engine; brain two runs on the Python brain.
  function cmdHTML(color,ph){
    return '<div style="margin-top:12px;border-top:1px solid rgba(255,255,255,.12);padding-top:10px">'+
      '<div style="font-size:12px;font-weight:700;color:'+color+';margin-bottom:6px">▮ پنل دستوری</div>'+
      '<textarea id="bmCmd" placeholder="'+ph+'" style="width:100%;height:74px;background:#080b16;color:#dbe4f7;border:1px solid rgba(255,255,255,.14);border-radius:10px;padding:8px;font:400 12px/1.6 inherit;resize:vertical"></textarea>'+
      '<button id="bmRun" style="margin-top:8px;padding:8px 18px;border-radius:9px;border:0;background:linear-gradient(135deg,'+color+',#22d3ee);color:#04121e;font-weight:800;cursor:pointer;font-size:12.5px">▶ اجرا</button>'+
      '<span style="font-size:10.5px;color:#7e8fb5;margin-inline-start:8px">Ctrl+Enter</span>'+
      '<div id="bmOut" style="font-size:12px;margin-top:8px;line-height:1.8;white-space:pre-wrap;color:#cfe0ff;max-height:34vh;overflow:auto"></div></div>';
  }
  function wireCommand(engineId){
    var run=el('bmRun'), ta=el('bmCmd'), out=el('bmOut'); if(!run||!ta||!out)return;
    function go(){
      var msg=(ta.value||'').trim(); if(!msg)return;
      out.style.color='#8ea0c8'; out.textContent='در حال اجرا…'; run.disabled=true;
      var fd=new FormData(); fd.append('message',msg); fd.append('auto','false'); if(engineId)fd.append('provider',engineId);
      fetch('/api/chat',{method:'POST',headers:authH(),body:fd})
        .then(function(r){return r.json().then(function(d){ return {ok:r.ok,d:d}; });})
        .then(function(x){ run.disabled=false;
          if(!x.ok||x.d.error){ out.style.color='#fb7185'; out.textContent='خطا: '+((x.d&&x.d.error)||'اجرا نشد'); return; }
          out.style.color='#cfe0ff'; out.textContent=x.d.reply||'(بدون پاسخ)';
        })
        .catch(function(e){ run.disabled=false; out.style.color='#fb7185'; out.textContent='خطا: '+e.message; });
    }
    run.addEventListener('click',go);
    ta.addEventListener('keydown',function(e){ if((e.ctrlKey||e.metaKey)&&e.key==='Enter'){ e.preventDefault(); go(); } });
  }
  function selectPybrain(){
    var p=panel(); if(!p)return; var pb=MAP.pybrain||{};
    p.innerHTML='<div style="font-weight:800;font-size:15px;color:#f472b6;margin-bottom:6px">🧠 مغز دوم — پایتون</div>'+
      '<div style="font-size:12.5px;color:#c9d4ee;line-height:1.9;margin-bottom:8px">مغز خودآموزِ محلی با حافظهٔ والت (Obsidian). کنار مغز اول کار می‌کند و با آن هماهنگ می‌ماند.</div>'+
      '<div style="font-size:12px;color:#8ea0c8">پایتون: '+(pb.python?'✅ آماده':'🔴 نصب نیست')+' · فایل مغز: '+(pb.exists?'✅':'🔴')+' · دانش والت: '+(pb.knowledgeFiles||0)+' نوت</div>'+
      cmdHTML('#f472b6','چیزی بنویس تا مغز دوم (پایتون) اجرا کند…');
    p.style.display='block'; wireCommand('brain');
  }

  function panel(){ return el('brainMapPanel'); }
  function selectCore(){
    var p=panel(); if(!p)return;
    p.innerHTML='<div style="font-weight:800;font-size:15px;color:#7dd3fc;margin-bottom:6px">🧠 مغز اول — ستایش</div>'+
      '<div style="font-size:12.5px;color:#b9c4e0;line-height:1.9">این نقشهٔ کاملِ خودِ ستایش است. هر گره یک فایل است؛ رنگ = بخش، حلقهٔ سبز = سالم، قرمز = گم‌شده. روی هر گره بزن تا کارش را ببینی و ویرایشش کنی.</div>'+
      cmdHTML('#7dd3fc','چیزی بنویس تا مغز اول اجرا کند…');
    p.style.display='block'; wireCommand('');
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
      MAP=d;
      // The brain is now a real 3D globe (brain3d-globe.js). No cover image —
      // opening the brain goes straight in. The flat map stays as a fallback.
      var p=panel(); if(p)p.style.display='none';
      if(typeof window.renderBrainGlobe==='function') window.renderBrainGlobe(d);
      else build();
    }).catch(function(e){ el('brainMapView').innerHTML='<div style="color:#fb7185;text-align:center;padding:40px">خطا: '+e.message+'</div>'; });
  }
  function close(){
    var ov=el('brainMapOverlay'); if(ov)ov.style.display='none';
    // stop the 3D scene so a closed brain costs nothing
    if(typeof window.closeBrainGlobe==='function')window.closeBrainGlobe();
  }
  window.openBrainMap=open; window.closeBrainMap=close;
  // the 3D globe renderer drives the same detail/edit panels
  window.__bmPanel={ node:selectNode, pybrain:selectPybrain, core:selectCore };
  document.addEventListener('DOMContentLoaded',function(){
    var c=el('brainMapClose'); if(c)c.addEventListener('click',close);
    var b=el('brainMapBtn'); if(b)b.addEventListener('click',open);
    var sh=el('shBrainMap'); if(sh)sh.addEventListener('click',function(){ if(typeof closeSheet==='function')closeSheet(); setTimeout(open,160); });
  });
})();
