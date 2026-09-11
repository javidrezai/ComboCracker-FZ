/* SETAYESH_BUILD 9.9.79 */
/* Setayesh's brain as ONE crystal 3D brain you can spin like a globe.
   - Blue lobe  = the main app (Node); orange lobe = the Python brain.
   - The shell is translucent crystal with deep folds, so you can see the
     neuron web and the traffic inside it.
   - Every node is wired to its nearest neighbours (a neuron mesh), not just to
     the centre, and each node carries a soft halo.
   - Labels are real HTML positioned over the canvas — canvas text could not
     shape Persian correctly (letters came out broken and disconnected), so the
     names are drawn by the browser itself and read properly.
   - Live traffic: the server records when parts actually talk (chat → engine,
     python → core, memory → python brain, a web search). The matching link
     lights up, a pulse runs along it, and a readout names the pair, so you can
     see which part is working with which, right now.
   Uses the three.js already bundled with the app; no new dependency. */
(function () {
  var S = null;

  function tok() {
    try { return localStorage.getItem('setayesh.token') || sessionStorage.getItem('setayesh.token') || ''; }
    catch (e) { return ''; }
  }

  var GROUP_COLORS = {
    'هستهٔ سرور': 0x38bdf8, 'مسیرها': 0x34d399, 'رابط کاربری': 0xa78bfa,
    'اسناد و ابزار': 0xfbbf24, 'مغز پایتون': 0xf472b6
  };
  function hex(c) { return '#' + ('000000' + c.toString(16)).slice(-6); }

  /* A hemisphere with deep, brain-like folds, rendered as translucent crystal
     so the inside stays visible. */
  function lobe(THREE, R, flip, color, emissive) {
    var geo = new THREE.SphereGeometry(R, 96, 72, 0, Math.PI);
    var pos = geo.attributes.position, v = new THREE.Vector3();
    for (var i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      var n = v.clone().normalize();
      // several overlapping waves → gyri and sulci rather than a smooth ball
      var f = 0.085 * Math.sin(n.y * 13.0) * Math.cos(n.z * 10.0)
            + 0.060 * Math.sin(n.x * 17.0 + n.z * 8.0)
            + 0.045 * Math.cos(n.y * 21.0 + n.x * 6.0)
            + 0.030 * Math.sin(n.z * 26.0);
      v.addScaledVector(n, f * R);
      pos.setXYZ(i, v.x, v.y, v.z);
    }
    geo.computeVertexNormals();
    var g = new THREE.Group();
    g.add(new THREE.Mesh(geo, new THREE.MeshPhongMaterial({
      color: color, emissive: emissive, emissiveIntensity: 0.45, shininess: 90,
      specular: 0xffffff, transparent: true, opacity: 0.34,
      side: THREE.DoubleSide, depthWrite: false
    })));
    // a faint wireframe gives it the faceted, crystalline read
    g.add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
      color: color, wireframe: true, transparent: true, opacity: 0.10, depthWrite: false
    })));
    g.rotation.y = flip ? -Math.PI / 2 : Math.PI / 2;
    g.position.x = flip ? -0.04 * R : 0.04 * R;
    return g;
  }

  function halfSpherePoint(THREE, R, i, n, side) {
    var t = (i + 0.5) / Math.max(n, 1);
    var y = 1 - 2 * t;
    var r = Math.sqrt(Math.max(0, 1 - y * y));
    var a = Math.PI * (3 - Math.sqrt(5)) * i;
    var x = Math.cos(a) * r, z = Math.sin(a) * r;
    x = side < 0 ? -Math.abs(x) : Math.abs(x);
    return new THREE.Vector3(x * R, y * R, z * R);
  }

  function clear() {
    if (!S) return;
    try { cancelAnimationFrame(S.raf); } catch (e) {}
    try { clearInterval(S.poll); } catch (e) {}
    try { window.removeEventListener('resize', S.onResize); } catch (e) {}
    try { window.removeEventListener('mousemove', S.onMove); } catch (e) {}
    try { window.removeEventListener('mouseup', S.onUp); } catch (e) {}
    try { S.renderer.dispose(); } catch (e) {}
    S = null;
  }
  window.closeBrainGlobe = clear;

  window.renderBrainGlobe = function (MAP) {
    var view = document.getElementById('brainMapView');
    if (!view) return;
    clear();
    var THREE = window.THREE;
    if (!THREE) {
      view.innerHTML = '<div style="color:#fb7185;text-align:center;padding:40px">کتابخانهٔ سه‌بعدی بارگذاری نشد. صفحه را رفرش کن (Ctrl+Shift+R).</div>';
      return;
    }

    view.innerHTML =
      '<canvas id="bmGlobe" style="width:100%;height:100%;display:block;cursor:grab"></canvas>' +
      '<div id="bmLabels" style="position:absolute;inset:0;pointer-events:none;overflow:hidden"></div>' +
      '<div id="bmLive" style="position:absolute;top:12px;inset-inline-start:14px;font-size:12px;color:#9be8ff;' +
        'background:rgba(6,12,26,.72);border:1px solid rgba(123,92,255,.35);border-radius:10px;padding:6px 10px;' +
        'opacity:0;transition:opacity .3s;pointer-events:none;max-width:60vw"></div>' +
      '<div style="position:absolute;inset-inline-start:14px;bottom:12px;font-size:11.5px;color:#7e8fb5;pointer-events:none">' +
        'بکش تا بچرخانی · اسکرول برای بزرگ‌نمایی · روی هر بخش بزن</div>';
    var canvas = document.getElementById('bmGlobe');
    var labelBox = document.getElementById('bmLabels');
    var liveBox = document.getElementById('bmLive');

    var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(45, 1, 0.1, 200);
    scene.add(new THREE.AmbientLight(0x8098d0, 0.9));
    var lA = new THREE.PointLight(0x66ccff, 1.6, 90); lA.position.set(-8, 6, 10); scene.add(lA);
    var lB = new THREE.PointLight(0xff8a3d, 1.4, 90); lB.position.set(9, -4, 8); scene.add(lB);
    var lC = new THREE.PointLight(0xffffff, 0.7, 90); lC.position.set(0, 8, -10); scene.add(lC);

    var root = new THREE.Group(); scene.add(root);
    var R = 3.2;
    root.add(lobe(THREE, R, true, 0x49a8ff, 0x0d2c55));    // blue  = app
    root.add(lobe(THREE, R, false, 0xff8a34, 0x4a1a00));   // orange = python
    // the fissure between the halves
    var fis = new THREE.Mesh(
      new THREE.CylinderGeometry(R * 1.03, R * 1.03, 0.06, 72, 1, true),
      new THREE.MeshBasicMaterial({ color: 0x05070f, transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false })
    );
    fis.rotation.z = Math.PI / 2; root.add(fis);

    // A calm halo around the whole brain. It breathes gently all the time and
    // brightens for a moment whenever she is actually working (a signal lands).
    var auraMat = new THREE.MeshBasicMaterial({ color: 0x7fd4ff, transparent: true, opacity: 0.07, side: THREE.BackSide, depthWrite: false });
    var aura = new THREE.Mesh(new THREE.SphereGeometry(R * 1.5, 48, 36), auraMat);
    scene.add(aura);
    var busy = 0;   // decays back to the resting glow

    /* ---------------- the parts ---------------- */
    var appNodes = [];
    Object.keys(MAP.groups || {}).forEach(function (g) {
      (MAP.groups[g] || []).forEach(function (f) { appNodes.push(Object.assign({ group: g }, f)); });
    });
    var pb = MAP.pybrain || {};
    var pyNodes = [];
    (pb.core || []).forEach(function (f) {
      pyNodes.push({ group: 'مغز پایتون', name: f.file, short: f.name, purpose: 'موتور مغز پایتون', exists: f.exists, editable: false, py: true });
    });
    (pb.branches || []).forEach(function (b) {
      pyNodes.push({ group: 'مغز پایتون', name: b.file, short: b.name, purpose: 'شاخهٔ دانش مغز پایتون', exists: true, editable: false, lines: b.lines, py: true });
    });
    // the downloaded libraries — you can see which ones are on the machine
    (pb.libs || []).forEach(function (l) {
      pyNodes.push({ group: 'کتابخانه‌ها', name: l.file, short: '📦 ' + l.name, purpose: 'کتابخانهٔ پایتون — نصب‌شده در pybrain/libs/' + l.name, exists: true, editable: false, py: true, lib: true });
    });

    var picks = [], labels = [], byKey = {}, all = [];

    function addNode(n, p, colorHex) {
      var col = new THREE.Color(colorHex);
      var dot = new THREE.Mesh(new THREE.SphereGeometry(0.115, 16, 12),
        new THREE.MeshBasicMaterial({ color: col }));
      dot.position.copy(p); dot.userData.node = n;
      root.add(dot); picks.push(dot);
      // glowing halo around each node — two shells so the glow reads clearly
      var halo = new THREE.Mesh(new THREE.SphereGeometry(0.26, 16, 12),
        new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.42, depthWrite: false }));
      halo.position.copy(p); root.add(halo);
      var halo2 = new THREE.Mesh(new THREE.SphereGeometry(0.42, 16, 12),
        new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.14, depthWrite: false }));
      halo2.position.copy(p); root.add(halo2);
      // link to the core
      root.add(new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), p.clone()]),
        new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: n.exists === false ? 0.8 : 0.55, depthWrite: false })
      ));
      // HTML label — the browser shapes Persian correctly, canvas text did not
      var short = n.short || String(n.name).replace(/^public\//, '').replace(/^routes\//, '').replace(/^pybrain\/.*\//, '');
      var d = document.createElement('div');
      d.textContent = short.length > 20 ? short.slice(0, 19) + '…' : short;
      d.style.cssText = 'position:absolute;left:0;top:0;transform:translate(-50%,-50%);white-space:nowrap;font:600 11.5px system-ui,sans-serif;' +
        'color:' + (n.exists === false ? '#fb7185' : '#e6eeff') + ';background:rgba(4,8,18,.62);padding:1px 6px;border-radius:6px;' +
        'text-shadow:0 1px 3px #000;will-change:transform,opacity';
      labelBox.appendChild(d);
      labels.push({ el: d, pos: p.clone() });

      byKey[String(n.name)] = p.clone();
      if (n.short) byKey[n.short] = p.clone();
      all.push({ n: n, p: p.clone(), col: col });
    }

    appNodes.forEach(function (n, i) {
      addNode(n, halfSpherePoint(THREE, R * 1.34, i, appNodes.length, -1), GROUP_COLORS[n.group] || 0x8ea0c8);
    });
    pyNodes.forEach(function (n, i) {
      addNode(n, halfSpherePoint(THREE, R * 1.34, i, pyNodes.length, 1), 0xf472b6);
    });

    /* ---- neuron web: wire each node to its nearest neighbours ---- */
    var webMat = new THREE.LineBasicMaterial({ color: 0xa9d4ff, transparent: true, opacity: 0.45, depthWrite: false });
    for (var i = 0; i < all.length; i++) {
      var mine = all[i];
      var near = all.slice().filter(function (o) { return o !== mine; })
        .sort(function (a, b) { return a.p.distanceTo(mine.p) - b.p.distanceTo(mine.p); })
        .slice(0, 2);
      near.forEach(function (o) {
        // bow the strand outward a little so the web looks organic
        var mid = mine.p.clone().add(o.p).multiplyScalar(0.5).multiplyScalar(1.07);
        var curve = new THREE.QuadraticBezierCurve3(mine.p, mid, o.p);
        root.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(12)), webMat));
      });
    }

    // captions for the two halves
    function sideCaption(text, x, color) {
      var d = document.createElement('div');
      d.textContent = text;
      d.style.cssText = 'position:absolute;left:0;top:0;transform:translate(-50%,-50%);white-space:nowrap;font:800 13px system-ui,sans-serif;' +
        'color:' + color + ';text-shadow:0 1px 4px #000;will-change:transform,opacity';
      labelBox.appendChild(d);
      labels.push({ el: d, pos: new THREE.Vector3(x, -R * 1.45, 0) });
    }
    sideCaption('مغز اصلی (نود)', -R * 1.15, '#9fd0ff');
    sideCaption('مغز پایتون', R * 1.15, '#ffc79a');

    byKey['core'] = new THREE.Vector3(0, 0, 0);
    byKey['chat'] = new THREE.Vector3(0, 0, 0);
    byKey['pybrain'] = byKey['main.py'] || new THREE.Vector3(R * 1.1, 0, 0);
    byKey['memory'] = byKey['memory.js'] || new THREE.Vector3(-R * 1.1, 0, 0);
    byKey['web'] = new THREE.Vector3(0, R * 1.6, 0);
    function endpoint(k) {
      if (byKey[k]) return byKey[k];
      var hit = Object.keys(byKey).find(function (n) { return n.indexOf(k) >= 0; });
      return hit ? byKey[hit] : new THREE.Vector3(0, 0, 0);
    }
    var NICE = { core: 'هسته', chat: 'گفت‌وگو', pybrain: 'مغز پایتون', memory: 'حافظه', web: 'اینترنت' };
    function nice(k) { return NICE[k] || k; }

    /* ---- live traffic: light the exact link that is busy ---- */
    var pulses = [];
    function addPulse(from, to, label) {
      var a = endpoint(from).clone(), b = endpoint(to).clone();
      var mid = a.clone().add(b).multiplyScalar(0.5).multiplyScalar(1.12);
      var curve = new THREE.QuadraticBezierCurve3(a, mid, b);
      var pts = curve.getPoints(40);
      var ln = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),
        new THREE.LineBasicMaterial({ color: 0x9be8ff, transparent: true, opacity: 0.95, depthWrite: false }));
      root.add(ln);
      var m = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10),
        new THREE.MeshBasicMaterial({ color: 0xdffaff }));
      m.position.copy(pts[0]); root.add(m);
      pulses.push({ m: m, ln: ln, pts: pts, t: 0 });
      busy = 1;   // she is working → the halo brightens
      // name the pair on screen, so you can read what just talked to what
      liveBox.textContent = '⚡ ' + nice(from) + '  →  ' + nice(to) + (label ? '   ·  ' + label : '');
      liveBox.style.opacity = '1';
      clearTimeout(liveBox._t);
      liveBox._t = setTimeout(function () { liveBox.style.opacity = '0'; }, 4000);
    }

    var lastSig = 0, firstPoll = true;
    function pollSignals() {
      fetch('/api/admin/brain/signals?since=' + lastSig, { headers: { Authorization: 'Bearer ' + tok() } })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (d) {
          if (!d) return;
          lastSig = d.last || lastSig;
          if (firstPoll) { firstPoll = false; return; }
          (d.signals || []).slice(-5).forEach(function (s, i) {
            setTimeout(function () { addPulse(s.from, s.to, s.label); }, i * 260);
          });
        }).catch(function () {});
    }
    pollSignals();
    var poll = setInterval(pollSignals, 2500);

    /* ---- spin it like a globe ---- */
    var rotX = 0.2, rotY = 0.4, dragging = false, auto = true;
    var last = { x: 0, y: 0 }, moved = 0, dist = 17;
    function onDown(e) {
      dragging = true; moved = 0; auto = false; canvas.style.cursor = 'grabbing';
      var p = e.touches ? e.touches[0] : e; last.x = p.clientX; last.y = p.clientY;
    }
    function onMove(e) {
      if (!dragging) return;
      var p = e.touches ? e.touches[0] : e;
      var dx = p.clientX - last.x, dy = p.clientY - last.y;
      last.x = p.clientX; last.y = p.clientY;
      moved += Math.abs(dx) + Math.abs(dy);
      rotY += dx * 0.005; rotX += dy * 0.005;
      if (e.cancelable) e.preventDefault();
    }
    function onUp() { dragging = false; canvas.style.cursor = 'grab'; setTimeout(function () { auto = true; }, 2500); }
    canvas.addEventListener('mousedown', onDown);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    canvas.addEventListener('touchstart', onDown, { passive: true });
    canvas.addEventListener('touchmove', onMove, { passive: false });
    canvas.addEventListener('touchend', onUp);
    canvas.addEventListener('wheel', function (e) {
      dist = Math.max(8, Math.min(34, dist + (e.deltaY > 0 ? 1 : -1)));
      e.preventDefault();
    }, { passive: false });

    var ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
    canvas.addEventListener('click', function (e) {
      if (moved > 6) return;
      var b = canvas.getBoundingClientRect();
      ndc.x = ((e.clientX - b.left) / b.width) * 2 - 1;
      ndc.y = -((e.clientY - b.top) / b.height) * 2 + 1;
      ray.setFromCamera(ndc, camera);
      var hit = ray.intersectObjects(picks, false)[0];
      var P = window.__bmPanel || {};
      if (hit && hit.object.userData.node) {
        var n = hit.object.userData.node;
        if (n.py && P.pybrain && /main\.py|autolibs/.test(n.name)) P.pybrain();
        else if (P.node) P.node(n);
      } else if (P.core) P.core();
    });

    function onResize() {
      var w = view.clientWidth || window.innerWidth;
      var h = view.clientHeight || window.innerHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / Math.max(h, 1); camera.updateProjectionMatrix();
    }
    window.addEventListener('resize', onResize);
    onResize();

    var tmp = new THREE.Vector3(), clock = 0;
    function frame() {
      S.raf = requestAnimationFrame(frame);
      if (document.hidden) return;
      clock += 0.016;
      // the calm breathing halo, brighter while she is busy
      busy = Math.max(0, busy - 0.006);
      var breathe = 0.055 + 0.02 * Math.sin(clock * 1.1);
      auraMat.opacity = breathe + 0.16 * busy;
      aura.scale.setScalar(1 + 0.015 * Math.sin(clock * 1.1) + 0.05 * busy);
      if (auto && !dragging) { rotY += 0.0026; rotX += 0.0006; }
      rotX = Math.max(-1.2, Math.min(1.2, rotX));
      root.rotation.y = rotY; root.rotation.x = rotX;
      camera.position.set(0, 0, dist); camera.lookAt(0, 0, 0);
      root.updateMatrixWorld();

      // place the HTML labels over their nodes; fade the ones facing away
      var w = canvas.clientWidth, h = canvas.clientHeight;
      for (var L = 0; L < labels.length; L++) {
        var it = labels[L];
        tmp.copy(it.pos).applyMatrix4(root.matrixWorld);
        var depth = tmp.z;
        tmp.project(camera);
        var x = (tmp.x * 0.5 + 0.5) * w, y = (-tmp.y * 0.5 + 0.5) * h;
        var f = Math.max(0, Math.min(1, (depth + 1.2) / 4));
        it.el.style.transform = 'translate(-50%,-50%) translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px)';
        it.el.style.opacity = (0.05 + 0.95 * f * f).toFixed(3);
      }

      for (var i = pulses.length - 1; i >= 0; i--) {
        var p = pulses[i];
        p.t += 0.02;
        if (p.t >= 1) {
          root.remove(p.m); root.remove(p.ln);
          p.m.geometry.dispose(); p.ln.geometry.dispose();
          pulses.splice(i, 1); continue;
        }
        var idx = Math.min(p.pts.length - 1, Math.floor(p.t * (p.pts.length - 1)));
        p.m.position.copy(p.pts[idx]);
        p.ln.material.opacity = 0.95 * (1 - p.t);
      }
      renderer.render(scene, camera);
    }

    S = { renderer: renderer, raf: 0, poll: poll, onResize: onResize, onMove: onMove, onUp: onUp };
    frame();
  };
})();
