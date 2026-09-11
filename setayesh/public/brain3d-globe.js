/* SETAYESH_BUILD 9.9.78 */
/* Setayesh's brain as ONE 3D brain you can spin like a globe.
   - Blue half  = the main app (Node): every source file is a node on that side.
   - Orange half = the Python brain: its engine files and its named vault
     branches sit on that side.
   - It turns by itself and you can drag it in any direction, or pinch/wheel to
     zoom. Click any node to open its detail / edit panel.
   - Real traffic between the parts (memory → engine, python → core, a web
     search, a chat hitting an engine) is polled from the server and drawn as a
     pulse of light travelling along the matching link — so what you see moving
     is what is actually happening, not decoration.
   Uses the three.js already bundled with the app; no new dependency. */
(function () {
  var S = null;   // live scene state, so re-opening cleans up first

  function tok() {
    try { return localStorage.getItem('setayesh.token') || sessionStorage.getItem('setayesh.token') || ''; }
    catch (e) { return ''; }
  }

  var GROUP_COLORS = {
    'هستهٔ سرور': 0x38bdf8, 'مسیرها': 0x34d399, 'رابط کاربری': 0xa78bfa,
    'اسناد و ابزار': 0xfbbf24, 'مغز پایتون': 0xf472b6
  };

  /* ---------------------------------------------------------------- labels */
  // Text is drawn to a canvas and shown as a sprite, so it always faces the
  // camera and stays readable however the brain is turned.
  function makeLabel(THREE, text, color) {
    var pad = 8, font = '600 26px system-ui, sans-serif';
    var m = document.createElement('canvas').getContext('2d');
    m.font = font;
    var w = Math.ceil(m.measureText(text).width) + pad * 2;
    var h = 40;
    var c = document.createElement('canvas');
    c.width = w; c.height = h;
    var g = c.getContext('2d');
    g.font = font; g.textBaseline = 'middle';
    g.fillStyle = 'rgba(4,8,18,.72)';
    g.fillRect(0, 0, w, h);
    g.fillStyle = color || '#cbd5f5';
    g.fillText(text, pad, h / 2);
    var tex = new THREE.CanvasTexture(c);
    tex.minFilter = THREE.LinearFilter;
    var sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
    sp.scale.set(w / h * 0.26, 0.26, 1);
    return sp;
  }

  /* ----------------------------------------------------------- brain shell */
  // A hemisphere with its vertices nudged outward in a wavy pattern, so it
  // reads as a brain lobe rather than a plain ball.
  function hemisphere(THREE, R, flip, color, emissive) {
    var geo = new THREE.SphereGeometry(R, 64, 48, 0, Math.PI);
    var pos = geo.attributes.position, v = new THREE.Vector3();
    for (var i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      var n = v.clone().normalize();
      var lump = 0.055 * Math.sin(n.y * 11) * Math.cos(n.z * 9)
               + 0.035 * Math.sin(n.x * 15 + n.z * 7);
      v.addScaledVector(n, lump * R);
      pos.setXYZ(i, v.x, v.y, v.z);
    }
    geo.computeVertexNormals();
    var mesh = new THREE.Mesh(geo, new THREE.MeshPhongMaterial({
      color: color, emissive: emissive, emissiveIntensity: 0.5,
      shininess: 42, transparent: true, opacity: 0.96, side: THREE.DoubleSide
    }));
    // rotate so the flat face sits on the mid-plane, one lobe each side
    mesh.rotation.y = flip ? -Math.PI / 2 : Math.PI / 2;
    mesh.position.x = flip ? -0.04 * R : 0.04 * R;
    return mesh;
  }

  /* --------------------------------------------------- node placement */
  // Evenly spread points over ONE half of the sphere (Fibonacci spiral),
  // pushed a little outside the surface so they float above the lobe.
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

    view.innerHTML = '<canvas id="bmGlobe" style="width:100%;height:100%;display:block;cursor:grab"></canvas>' +
      '<div id="bmHint" style="position:absolute;inset-inline-start:14px;bottom:12px;font-size:11.5px;color:#7e8fb5;pointer-events:none">' +
      'بکش تا بچرخانی · اسکرول برای بزرگ‌نمایی · روی هر بخش بزن</div>';
    var canvas = document.getElementById('bmGlobe');

    var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(45, 1, 0.1, 200);
    scene.add(new THREE.AmbientLight(0x8098d0, 0.85));
    var lA = new THREE.PointLight(0x66ccff, 1.5, 80); lA.position.set(-8, 6, 10); scene.add(lA);
    var lB = new THREE.PointLight(0xff8a3d, 1.3, 80); lB.position.set(9, -4, 8); scene.add(lB);

    var root = new THREE.Group(); scene.add(root);
    var R = 3.2;

    // the two lobes: blue = the app, orange = the python brain
    root.add(hemisphere(THREE, R, true, 0x2f7fd4, 0x0d2c55));   // blue  (-x)
    root.add(hemisphere(THREE, R, false, 0xe06a1f, 0x4a1a00));  // orange (+x)
    // the fissure between them
    var fis = new THREE.Mesh(
      new THREE.CylinderGeometry(R * 1.002, R * 1.002, 0.05, 64, 1, true),
      new THREE.MeshBasicMaterial({ color: 0x05070f, transparent: true, opacity: 0.9, side: THREE.DoubleSide })
    );
    fis.rotation.z = Math.PI / 2; root.add(fis);

    /* ---- gather the parts ---- */
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

    var picks = [];          // clickable meshes
    var labels = [];         // name sprites (faded when they turn to the back)
    var byKey = {};          // signal endpoint -> position

    function addNode(n, p, colorHex) {
      var col = new THREE.Color(colorHex);
      var dot = new THREE.Mesh(
        new THREE.SphereGeometry(0.11, 16, 12),
        new THREE.MeshBasicMaterial({ color: col })
      );
      dot.position.copy(p);
      dot.userData.node = n;
      root.add(dot); picks.push(dot);
      // halo
      var halo = new THREE.Mesh(
        new THREE.SphereGeometry(0.2, 16, 12),
        new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.22 })
      );
      halo.position.copy(p); root.add(halo);
      // link from the centre out to the node
      var lg = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), p.clone()]);
      root.add(new THREE.Line(lg, new THREE.LineBasicMaterial({
        color: col, transparent: true, opacity: n.exists === false ? 0.5 : 0.28
      })));
      // label
      var short = n.short || String(n.name).replace(/^public\//, '').replace(/^routes\//, '').replace(/^pybrain\/.*\//, '');
      if (short.length > 18) short = short.slice(0, 17) + '…';
      var lab = makeLabel(THREE, short, n.exists === false ? '#fb7185' : '#dbe4f7');
      lab.position.copy(p).multiplyScalar(1.14);
      root.add(lab); labels.push(lab);
      byKey[String(n.name)] = p.clone();
      if (n.short) byKey[n.short] = p.clone();
    }

    appNodes.forEach(function (n, i) {
      addNode(n, halfSpherePoint(THREE, R * 1.32, i, appNodes.length, -1), GROUP_COLORS[n.group] || 0x8ea0c8);
    });
    pyNodes.forEach(function (n, i) {
      addNode(n, halfSpherePoint(THREE, R * 1.32, i, pyNodes.length, 1), 0xf472b6);
    });

    // side captions
    var capA = makeLabel(THREE, 'مغز اصلی (نود)', '#9fd0ff');
    capA.position.set(-R * 1.25, -R * 1.35, 0); capA.scale.multiplyScalar(1.25); root.add(capA);
    var capB = makeLabel(THREE, 'مغز پایتون', '#ffc79a');
    capB.position.set(R * 1.25, -R * 1.35, 0); capB.scale.multiplyScalar(1.25); root.add(capB);

    // where signal endpoints live
    byKey['core'] = new THREE.Vector3(0, 0, 0);
    byKey['chat'] = new THREE.Vector3(0, 0, 0);
    byKey['pybrain'] = byKey['main.py'] || new THREE.Vector3(R * 1.1, 0, 0);
    byKey['memory'] = byKey['memory.js'] || new THREE.Vector3(-R * 1.1, 0, 0);
    byKey['web'] = new THREE.Vector3(0, R * 1.5, 0);
    function endpoint(k) {
      if (byKey[k]) return byKey[k];
      var hit = Object.keys(byKey).find(function (n) { return n.indexOf(k) >= 0; });
      return hit ? byKey[hit] : new THREE.Vector3(0, 0, 0);
    }

    /* ---- live traffic: a pulse of light per real event ---- */
    var pulses = [];
    function addPulse(from, to, colorHex) {
      var a = endpoint(from).clone(), b = endpoint(to).clone();
      var m = new THREE.Mesh(
        new THREE.SphereGeometry(0.13, 12, 10),
        new THREE.MeshBasicMaterial({ color: colorHex || 0xffffff })
      );
      m.position.copy(a); root.add(m);
      // the line it rides along, briefly lit
      var lg = new THREE.BufferGeometry().setFromPoints([a, b]);
      var ln = new THREE.Line(lg, new THREE.LineBasicMaterial({ color: colorHex || 0xffffff, transparent: true, opacity: 0.8 }));
      root.add(ln);
      pulses.push({ m: m, ln: ln, a: a, b: b, t: 0 });
    }

    var lastSig = 0, firstPoll = true;
    function pollSignals() {
      fetch('/api/admin/brain/signals?since=' + lastSig, { headers: { Authorization: 'Bearer ' + tok() } })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (d) {
          if (!d) return;
          lastSig = d.last || lastSig;
          // on the first poll just catch up silently, then animate what's new
          if (firstPoll) { firstPoll = false; return; }
          (d.signals || []).slice(-6).forEach(function (s, i) {
            setTimeout(function () { addPulse(s.from, s.to, 0x9be8ff); }, i * 180);
          });
        }).catch(function () {});
    }
    pollSignals();
    var poll = setInterval(pollSignals, 2500);

    /* ---- interaction: spin it like a globe ---- */
    var rotX = 0.2, rotY = 0.4, velX = 0, velY = 0, dragging = false, auto = true;
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
      velY = dx * 0.005; velX = dy * 0.005;
      rotY += velY; rotX += velX;
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

    // click a node -> its panel (only when it wasn't a drag)
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
      } else if (P.core) P.core();   // clicking the brain body = the core panel
    });

    function onResize() {
      var w = view.clientWidth || window.innerWidth;
      var h = view.clientHeight || window.innerHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / Math.max(h, 1); camera.updateProjectionMatrix();
    }
    window.addEventListener('resize', onResize);
    onResize();

    function frame() {
      S.raf = requestAnimationFrame(frame);
      if (document.hidden) return;
      if (auto && !dragging) { rotY += 0.0026; rotX += 0.0006; }
      rotX = Math.max(-1.2, Math.min(1.2, rotX));
      root.rotation.y = rotY; root.rotation.x = rotX;
      camera.position.set(0, 0, dist); camera.lookAt(0, 0, 0);
      // only the names on the side facing you stay bright — otherwise ~40
      // labels pile on top of each other and nothing is readable
      for (var L = 0; L < labels.length; L++) {
        var lp = labels[L].position.clone().applyMatrix4(root.matrixWorld);
        var f = Math.max(0, Math.min(1, (lp.z + 1.2) / 4));
        labels[L].material.opacity = 0.06 + 0.94 * f * f;
      }
      // advance the light pulses
      for (var i = pulses.length - 1; i >= 0; i--) {
        var p = pulses[i];
        p.t += 0.022;
        if (p.t >= 1) {
          root.remove(p.m); root.remove(p.ln);
          p.m.geometry.dispose(); p.ln.geometry.dispose();
          pulses.splice(i, 1); continue;
        }
        p.m.position.lerpVectors(p.a, p.b, p.t);
        p.ln.material.opacity = 0.8 * (1 - p.t);
      }
      renderer.render(scene, camera);
    }

    S = { renderer: renderer, raf: 0, poll: poll, onResize: onResize };
    frame();
  };
})();
