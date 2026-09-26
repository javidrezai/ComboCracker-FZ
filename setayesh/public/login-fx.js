(function(){
  var cv=document.getElementById('fx3d'); if(!cv||!cv.getContext) return;
  var reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ctx=cv.getContext('2d');
  var W=0,H=0,dpr=Math.min(window.devicePixelRatio||1,2);
  var GAP=28, cols=0, rows=0, ox=0, oy=0;
  var mx=0.5, my=0.4;
  function resize(){
    W=window.innerWidth; H=window.innerHeight;
    cv.width=W*dpr; cv.height=H*dpr; ctx.setTransform(dpr,0,0,dpr,0,0);
    GAP = W<760 ? 24 : 30;
    cols=Math.ceil(W/GAP)+2; rows=Math.ceil(H/GAP)+2;
    ox=(W-(cols-1)*GAP)/2; oy=(H-(rows-1)*GAP)/2;
  }
  window.addEventListener('resize',resize);
  window.addEventListener('pointermove',function(e){
    mx=e.clientX/window.innerWidth; my=e.clientY/window.innerHeight;
  },{passive:true});

  var t=0;
  function frame(){
    t+=0.011;
    ctx.clearRect(0,0,W,H);
    var cxp=mx*W, cyp=my*H;
    for(var r=0;r<rows;r++){
      for(var c=0;c<cols;c++){
        var bx=ox+c*GAP, by=oy+r*GAP;
        // layered sine "flow field" -> wave height in [-1,1]
        var w=(Math.sin(bx*0.010+t*1.2)+Math.sin(by*0.013-t*0.9)+Math.sin((bx+by)*0.008+t*0.6))/3;
        var dy=w*11, dx=Math.cos(by*0.011+t)*6;      // flowing displacement
        var x=bx+dx, y=by+dy;
        var b=(w+1)/2;                                // 0..1 crest brightness
        var dist=Math.hypot(x-cxp,y-cyp);
        var glow=Math.max(0,1-dist/300);             // soft glow near cursor
        var a=0.08+b*0.5+glow*0.35;
        if(a<0.07) continue;
        var size=1.0+b*1.8+glow*1.5;
        var gg=Math.round(90+b*115+glow*45);         // deep-blue palette
        var bl=Math.round(205+b*50);
        ctx.fillStyle='rgba('+Math.round(28+glow*70)+','+gg+','+bl+','+(a>1?1:a).toFixed(3)+')';
        ctx.beginPath(); ctx.arc(x,y,size,0,6.283); ctx.fill();
      }
    }
    if(!reduce) requestAnimationFrame(frame);
  }
  resize();
  requestAnimationFrame(frame);
})();
