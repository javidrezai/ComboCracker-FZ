/* brain3d — inlined so the updater carries it */
/* ==========================================================================
   Setayesh AI — مغز عصبی سه‌بعدی  (brain3d.js)

   Layout follows the reference: a glowing neural brain in the middle,
   perception/inputs on the right (RTL), actions/outputs on the left,
   learning underneath, and the repositories named rather than counted.

   Everything shown is real data from the running server. A normal account
   sees only its own; the admin sees the whole system.

   Only dependency is THREE (three.min.js), which the app already loads.
   Nothing in the original code is modified — this hooks the brain button.
   ========================================================================== */
(function () {
  'use strict';

  if (window.__setayeshBrain3D) return;
  window.__setayeshBrain3D = true;

  var TOKEN_KEY = 'setayesh.token';
  var POLL_MS = 9000;

  /* ------------------------------------------------------------- helpers */
  function tok() { try { return localStorage.getItem(TOKEN_KEY) || ''; } catch (e) { return ''; } }
  function api(p) {
    return fetch(p, { headers: { Authorization: 'Bearer ' + tok() } })
      .then(function (r) { return r.ok ? r.json() : null; })
      .catch(function () { return null; });
  }
  function el(tag, css, txt) {
    var n = document.createElement(tag);
    if (css) n.setAttribute('style', css);
    if (txt != null) n.textContent = txt;
    return n;
  }
  function fa(n) {
    if (n == null || isNaN(n)) return '—';
    return String(n).replace(/\d/g, function (d) { return '۰۱۲۳۴۵۶۷۸۹'[d]; });
  }
  function kb(bytes) {
    if (!bytes) return '—';
    if (bytes > 1048576) return fa((bytes / 1048576).toFixed(1)) + ' م‌ب';
    return fa(Math.round(bytes / 1024)) + ' ک‌ب';
  }
  function hex(c) { return '#' + c.toString(16).padStart(6, '0'); }

  /* ------------------------------------------------------------- regions
     x: negative = left of screen (outputs), positive = right (inputs)
     y: up/down     z: front/back                                        */
  var REGIONS = [
    // --- inside the brain -------------------------------------------------
    { id: 'core',     fa: 'هسته‌ی مرکزی',   en: 'Central Core',   grp: 'brain',
      pos: [0.00, -0.10,  0.00], color: 0x7b5cff, size: 0.19 },
    { id: 'engines',  fa: 'موتورها',        en: 'Logic Engines',  grp: 'brain',
      pos: [-0.48, 0.46,  0.42], color: 0xff7a3d, size: 0.15 },
    { id: 'memory',   fa: 'حافظه',          en: 'Memory Core',    grp: 'brain',
      pos: [0.52,  0.42,  0.34], color: 0x38bdf8, size: 0.15 },
    { id: 'code',     fa: 'مخازن کد',       en: 'Repositories',   grp: 'brain',
      pos: [-0.60,-0.42, -0.30], color: 0xfbbf24, size: 0.14 },
    { id: 'users',    fa: 'کاربران',        en: 'Users',          grp: 'brain',
      pos: [0.60, -0.42, -0.30], color: 0x60a5fa, size: 0.13 },
    { id: 'monitor',  fa: 'نظارت',          en: 'System Monitor', grp: 'brain',
      pos: [0.00,  0.62, -0.45], color: 0xfb7185, size: 0.13 },

    // --- perception, right side ------------------------------------------
    { id: 'in_text',  fa: 'متن',            en: 'Text',           grp: 'in',
      pos: [2.05,  0.72,  0.00], color: 0x9ecbff, size: 0.09 },
    { id: 'in_voice', fa: 'صدا',            en: 'Voice',          grp: 'in',
      pos: [2.25,  0.24,  0.00], color: 0x9ecbff, size: 0.09 },
    { id: 'in_img',   fa: 'تصویر',          en: 'Image',          grp: 'in',
      pos: [2.25, -0.24,  0.00], color: 0x9ecbff, size: 0.09 },
    { id: 'in_file',  fa: 'فایل',           en: 'Files',          grp: 'in',
      pos: [2.05, -0.72,  0.00], color: 0x9ecbff, size: 0.09 },
    { id: 'in_web',   fa: 'اینترنت',        en: 'Web',            grp: 'in',
      pos: [1.75,  1.15,  0.00], color: 0x22d3ee, size: 0.09 },

    // --- action, left side -------------------------------------------------
    { id: 'out_msg',  fa: 'پیام‌ها',         en: 'Messages',       grp: 'out',
      pos: [-2.05, 0.72,  0.00], color: 0xffc48a, size: 0.09 },
    { id: 'out_file', fa: 'فایل‌ها',         en: 'Files Out',      grp: 'out',
      pos: [-2.25, 0.24,  0.00], color: 0xffc48a, size: 0.09 },
    { id: 'out_task', fa: 'کارها',          en: 'Tasks',          grp: 'out',
      pos: [-2.25,-0.24,  0.00], color: 0xffc48a, size: 0.09 },
    { id: 'out_board',fa: 'تابلوی خانواده', en: 'Family Board',   grp: 'out',
      pos: [-2.05,-0.72,  0.00], color: 0xf472b6, size: 0.09 },

    // --- learning, underneath ----------------------------------------------
    { id: 'learning', fa: 'یادگیری خودکار', en: 'Learning',       grp: 'learn',
      pos: [0.00, -1.35,  0.30], color: 0x34d399, size: 0.13 },
    { id: 'libs',     fa: 'کتابخانه‌ها',     en: 'Libraries',      grp: 'learn',
      pos: [-1.15,-1.30,  0.10], color: 0xa78bfa, size: 0.10 },
    { id: 'devices',  fa: 'دستگاه‌ها',       en: 'Devices',        grp: 'learn',
      pos: [1.15, -1.30,  0.10], color: 0x2dd4bf, size: 0.10 }
  ];

  var LINKS = [
    ['in_text','core'], ['in_voice','core'], ['in_img','core'],
    ['in_file','memory'], ['in_web','monitor'],
    ['core','engines'], ['core','memory'], ['core','users'], ['core','monitor'],
    ['engines','code'], ['engines','out_msg'], ['memory','learning'],
    ['core','out_msg'], ['core','out_task'], ['code','out_file'],
    ['users','out_board'], ['learning','libs'], ['learning','core'],
    ['devices','users'], ['monitor','out_task']
  ];

  /* ------------------------------------------------------------- state */
  var S = {
    open:false, renderer:null, scene:null, camera:null, root:null,
    nodes:{}, pulses:[], cloud:null, web:null, labels:{}, raf:null,
    poll:null, data:{}, selected:null, isAdmin:false, me:'',
    rotY:0, rotX:-0.06, dist:6.2, targetDist:6.2, distOutside:6.2, distInside:0.55,
    inside:false, drag:null, autoRotate:true,
    overlay:null, canvas:null, panel:null, hud:null, clock:0, editor:null,
    monitor:null, focusTarget:null
  };

  /* ------------------------------------------------------------- brain mesh
     A dense point cloud in a brain silhouette, with short lines between
     nearby points. That is what gives the "neural network" look.         */
  function brainPoint() {
    // rejection-sample inside a brain-ish ellipsoid with a central fissure
    for (var i = 0; i < 60; i++) {
      var x = (Math.random() * 2 - 1) * 1.05;
      var y = (Math.random() * 2 - 1) * 0.85;
      var z = (Math.random() * 2 - 1) * 1.15;
      var r = (x / 1.05) * (x / 1.05) + (y / 0.85) * (y / 0.85) + (z / 1.15) * (z / 1.15);
      if (r > 1) continue;
      if (r < 0.55) continue;                       // hollow shell
      if (Math.abs(x) < 0.055 && y > -0.35) continue; // longitudinal fissure
      if (y < -0.45 && z > 0.35) continue;          // scoop out under the front
      return [x, y, z];
    }
    return [0, 0, 0];
  }

  function buildBrain(THREE, root) {
    // --- anatomical shell: two folded hemispheres, the outer "human brain"
    //     silhouette you see before zooming in. Folds come from layered sine
    //     waves on a normalized sphere, same trick real low-poly brain props
    //     use, so it reads as a brain from across the room. ---
    function foldedHemisphere(side) {
      var geo = new THREE.SphereGeometry(1, 52, 40);
      var p = geo.attributes.position, v = new THREE.Vector3();
      for (var i = 0; i < p.count; i++) {
        v.fromBufferAttribute(p, i);
        var n = v.clone().normalize();
        var folds =
          0.062 * Math.sin(n.x * 12 + n.y * 8) +
          0.048 * Math.sin(n.y * 14 - n.z * 9) +
          0.036 * Math.sin(n.z * 16 + n.x * 7) +
          0.022 * Math.sin(n.x * 24 + n.z * 20);
        var inner = side * n.x;
        if (inner < 0) v.x *= 1 + inner * 0.6;          // flatten the medial face
        v.multiplyScalar(1 + folds);
        v.x *= 0.60; v.y *= 0.80; v.z *= 1.02;
        p.setXYZ(i, v.x, v.y, v.z);
      }
      geo.computeVertexNormals();
      return geo;
    }

    var shell = new THREE.Group();
    [-1, 1].forEach(function (side) {
      var geo = foldedHemisphere(side);
      var mat = new THREE.MeshPhongMaterial({
        color: side > 0 ? 0x3c548f : 0x33477e,
        emissive: side > 0 ? 0x1c2c5c : 0x182552,
        shininess: 55, transparent: true, opacity: 0.85,
        side: THREE.DoubleSide, depthWrite: true
      });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.x = side * 0.30;
      shell.add(mesh);
    });

    // cerebellum + brainstem, so the silhouette reads as a full brain
    var cb = new THREE.Mesh(
      new THREE.SphereGeometry(0.42, 40, 28),
      new THREE.MeshPhongMaterial({ color: 0x27397a, emissive: 0x121f4a,
        shininess: 40, transparent: true, opacity: 0.85 })
    );
    cb.scale.set(1.22, 0.60, 0.82);
    cb.position.set(0, -0.74, -0.74);
    shell.add(cb);

    var stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.13, 0.20, 0.85, 22, 1, true),
      new THREE.MeshPhongMaterial({ color: 0x4a6fd6, emissive: 0x1d2f66,
        transparent: true, opacity: 0.85, side: THREE.DoubleSide })
    );
    stem.position.set(0, -1.00, -0.32);
    stem.rotation.x = 0.35;
    shell.add(stem);

    root.add(shell);
    S.shell = shell;                     // faded out once you zoom inside

    // --- neurons: a dense cloud filling the same silhouette, always visible,
    //     brighter once the shell fades so the inside reads clearly. ---
    var N = 900;
    var pos = new Float32Array(N * 3), col = new Float32Array(N * 3);
    var c = new THREE.Color();
    for (var k = 0; k < N; k++) {
      var u = Math.random() * 2 - 1, t = Math.random() * Math.PI * 2;
      var r = Math.sqrt(1 - u * u), s3 = 0.30 + Math.random() * 0.66;
      var x = r * Math.cos(t) * s3, y = u * s3, z = r * Math.sin(t) * s3;
      pos[k*3] = x * 0.60; pos[k*3+1] = y * 0.80; pos[k*3+2] = z * 1.02;
      c.setHSL(0.55 + Math.random() * 0.12, 0.95, 0.55 + Math.random() * 0.25);
      col[k*3]=c.r; col[k*3+1]=c.g; col[k*3+2]=c.b;
    }
    var ng = new THREE.BufferGeometry();
    ng.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    ng.setAttribute('color', new THREE.BufferAttribute(col, 3));
    S.cloud = new THREE.Points(ng, new THREE.PointsMaterial({
      size: 0.024, vertexColors: true, transparent: true, opacity: 0.55,
      blending: THREE.AdditiveBlending, depthWrite: false
    }));
    root.add(S.cloud);
  }

  /* ------------------------------------------------------------- nodes */
  function buildNodes(THREE, root) {
    REGIONS.forEach(function (rg) {
      var g = new THREE.Group();
      g.position.set(rg.pos[0], rg.pos[1], rg.pos[2]);

      var core = new THREE.Mesh(
        new THREE.IcosahedronGeometry(rg.size, 1),
        new THREE.MeshPhongMaterial({
          color: rg.color, emissive: rg.color, emissiveIntensity: 0.8,
          shininess: 90, transparent: true, opacity: 0.95
        })
      );
      g.add(core);

      var halo = new THREE.Mesh(
        new THREE.SphereGeometry(rg.size * 2.1, 20, 14),
        new THREE.MeshBasicMaterial({
          color: rg.color, transparent: true, opacity: 0.12,
          blending: THREE.AdditiveBlending, depthWrite: false
        })
      );
      g.add(halo);

      if (rg.grp === 'brain' || rg.grp === 'learn') {
        var ring = new THREE.Mesh(
          new THREE.TorusGeometry(rg.size * 2.6, 0.007, 8, 48),
          new THREE.MeshBasicMaterial({ color: rg.color, transparent: true, opacity: 0.45 })
        );
        ring.rotation.x = Math.PI / 2;
        g.add(ring);
        S.nodes[rg.id] = { group: g, core: core, halo: halo, ring: ring, def: rg };
      } else {
        S.nodes[rg.id] = { group: g, core: core, halo: halo, ring: null, def: rg };
      }
      root.add(g);
    });
  }

  function buildLinks(THREE, root) {
    LINKS.forEach(function (pair) {
      var a = S.nodes[pair[0]], b = S.nodes[pair[1]];
      if (!a || !b) return;
      var pa = a.group.position.clone(), pb = b.group.position.clone();
      var mid = pa.clone().add(pb).multiplyScalar(0.5);
      mid.y += 0.16; mid.z += 0.10;
      var curve = new THREE.QuadraticBezierCurve3(pa, mid, pb);
      var geo = new THREE.BufferGeometry().setFromPoints(curve.getPoints(40));
      root.add(new THREE.Line(geo, new THREE.LineBasicMaterial({
        color: 0x86bcff, transparent: true, opacity: 0.20,
        blending: THREE.AdditiveBlending
      })));

      var dot = new THREE.Mesh(
        new THREE.SphereGeometry(0.028, 8, 6),
        new THREE.MeshBasicMaterial({
          color: 0xd6ecff, transparent: true, opacity: 0.9,
          blending: THREE.AdditiveBlending
        })
      );
      root.add(dot);
      S.pulses.push({ dot: dot, curve: curve, t: Math.random(),
                      speed: 0.10 + Math.random() * 0.18 });
    });
  }

  /* ------------------------------------------------------------- labels */
  function buildLabels(host) {
    REGIONS.forEach(function (rg) {
      var box = el('div',
        'position:absolute;pointer-events:auto;cursor:pointer;transform:translate(-50%,-50%);' +
        'padding:4px 9px;border-radius:8px;white-space:nowrap;direction:rtl;' +
        'background:rgba(7,11,24,.74);border:1px solid rgba(255,255,255,.13);' +
        'font:600 11.5px/1.35 system-ui,sans-serif;color:#e8e9f2;' +
        'transition:opacity .18s,transform .18s;z-index:3');
      box.appendChild(el('div', 'font-weight:700', rg.fa));
      var v = el('div', 'font:500 9.5px/1.3 ui-monospace,monospace;opacity:.8;color:' +
        hex(rg.color), '—');
      box.appendChild(v);
      box.addEventListener('click', function (e) { e.stopPropagation(); select(rg.id); });
      host.appendChild(box);
      S.labels[rg.id] = { box: box, value: v };
    });
  }

  /* ------------------------------------------------------------- data */
  function loadData() {
    return api('/api/me').then(function (me) {
      S.isAdmin = !!(me && me.isAdmin);
      S.me = (me && me.username) || '';
      var calls = [api('/api/config'), api('/api/memory'), api('/api/board'),
                   api('/api/plugins'), api('/api/version')];
      if (S.isAdmin) {
        calls = calls.concat([api('/api/admin/brain'), api('/api/admin/users'),
                              api('/api/admin/devices'), api('/api/admin/backups'),
                              api('/api/admin/projects'), api('/api/admin/knowledge')]);
      }
      return Promise.all(calls);
    }).then(function (r) {
      S.data = {
        config: r[0] || {}, memory: r[1] || {}, board: r[2] || {},
        plugins: r[3] || {}, version: r[4] || {},
        brain: r[5] || {}, users: r[6] || {}, devices: r[7] || {},
        backups: r[8] || {}, projects: r[9] || {}, knowledge: r[10] || {}
      };
      paint();
    });
  }

  function arr(x, key) {
    if (!x) return [];
    if (Array.isArray(x)) return x;
    if (key && Array.isArray(x[key])) return x[key];
    for (var k in x) if (Array.isArray(x[k])) return x[k];
    return [];
  }

  /* Named contents per region — not just counts. */
  function detail(id) {
    var b = S.data.brain || {}, d = S.data;
    var A = S.isAdmin;

    switch (id) {
      case 'core':
        return { v: 'نسخه ' + ((d.version && d.version.version) || b.version || '—'),
          rows: [['نسخه', (d.version && d.version.version) || b.version || '—'],
                 ['آپ‌تایم', A ? fa(Math.round((b.uptime || 0) / 60)) + ' دقیقه' : '—'],
                 ['وضعیت', (b.now && b.now.thinking) ? 'در حال فکر کردن' : 'آماده'],
                 ['کار جاری', (b.now && b.now.activity) || 'بی‌کار'],
                 ['حساب تو', S.me + (A ? ' (مدیر)' : '')]] };

      case 'engines': {
        var eng = b.engines || arr(d.config, 'providers');
        var live = eng.filter(function (e) { return !e.cooling; }).length;
        return { v: fa(live) + '/' + fa(eng.length),
          rows: eng.map(function (e) {
            return [(e.label || e.id) + (e.isDefault ? ' ★' : ''),
                    (e.cooling ? 'خنک‌سازی' : 'فعال') +
                    (e.ok != null ? ' ✓' + fa(e.ok) + ' ✗' + fa(e.fail) : '')];
          }) };
      }

      case 'memory': {
        var mine = arr(d.memory, 'items');
        if (A && b.memory && b.memory.regions) {
          return { v: fa(b.memory.totalItems) + ' مورد',
            rows: b.memory.regions.map(function (m) {
              return [m.user, fa(m.total) + ' مورد'];
            }) };
        }
        var slice = mine.slice(0, 20);
        return { v: fa(mine.length) + ' مورد',
          rows: slice.map(function (m) {
            return [(m.text || m.value || m.kind || 'خاطره').slice(0, 46), m.kind || ''];
          }),
          ids: slice.map(function (m) { return m.id; }) };
      }

      case 'code': {
        var files = b.sourceFiles || [];
        return { v: fa(files.length) + ' فایل',
          rows: files.map(function (f) {
            return [f.name, fa(f.lines) + ' خط · ' + kb(f.size)];
          }), files: files };
      }

      case 'libs': {
        var pl = arr(d.plugins, 'plugins');
        var rows = pl.map(function (p) { return [p.name || p.id, p.description || 'افزونه']; });
        arr(d.projects, 'projects').forEach(function (p) {
          rows.push([p.name || String(p), 'پروژه']);
        });
        return { v: fa(rows.length), rows: rows };
      }

      case 'users': {
        if (!A) return { v: S.me, rows: [['حساب تو', S.me]] };
        return { v: fa(arr(d.users, 'users').length) + ' نفر',
          rows: arr(d.users, 'users').map(function (u) {
            return [u.username, u.admin ? 'مدیر' : (u.safe ? 'حالت کودک' : 'عادی')];
          }) };
      }

      case 'devices':
        if (!A) return { v: '—', rows: [['فقط مدیر', 'این بخش برای مدیر است']] };
        return { v: fa(arr(d.devices, 'devices').length),
          rows: arr(d.devices, 'devices').slice(0, 14).map(function (x) {
            return [x.label || x.kind || 'دستگاه', x.user || ''];
          }) };

      case 'learning':
        return { v: (b.learning && b.learning.enabled) ? 'روشن' : 'خاموش',
          rows: [['وضعیت', (b.learning && b.learning.enabled) ? 'روشن' : 'خاموش'],
                 ['امروز', fa((b.learning && b.learning.runsToday) || 0) + ' از ' +
                           fa((b.learning && b.learning.maxPerDay) || 0)],
                 ['در انتظار تأیید', fa((b.learning && b.learning.pending) || 0)],
                 ['تأییدشده', fa((b.learning && b.learning.approved) || 0)]] };

      case 'monitor':
        if (!A) return { v: '—', rows: [['فقط مدیر', 'این بخش برای مدیر است']] };
        return { v: fa((b.recentActivity || []).length) + ' رویداد',
          rows: (b.recentActivity || []).slice(0, 16).map(function (a) {
            return [a.what || a.kind || 'رویداد', a.who || a.user || ''];
          }) };

      case 'in_web':
        return { v: 'جستجوی زنده',
          rows: [['وضعیت', 'در دسترس'],
                 ['پیشنهادهای تازه', fa(b.suggestions || 0)],
                 ['دانش جدید', fa(arr(d.knowledge, 'items').length)]] };

      case 'out_board': {
        var msgs = arr(d.board, 'messages');
        return { v: fa(msgs.length) + ' پیام',
          rows: msgs.slice(-14).reverse().map(function (m) {
            return [(m.text || '').slice(0, 42) || '(پیوست)', m.by || ''];
          }) };
      }

      case 'out_task':
        return { v: fa(b.pendingActions || 0) + ' در انتظار',
          rows: [['کارهای در انتظار تأیید', fa(b.pendingActions || 0)],
                 ['اسکریپت‌ها', fa(b.scripts || 0)],
                 ['بکاپ‌ها', fa(arr(S.data.backups, 'backups').length)]] };

      case 'in_text':  return { v: 'چت', rows: [['ورودی', 'متن و کد']] };
      case 'in_voice': return { v: 'میکروفون', rows: [['ورودی', 'گفتار'],
                                 ['نیاز', 'اتصال امن (https)']] };
      case 'in_img':   return { v: 'تصویر', rows: [['ورودی', 'عکس و اسکرین‌شات']] };
      case 'in_file':  return { v: 'فایل', rows: [['ورودی', 'PDF، آفیس، زیپ، متن'],
                                 ['سقف حجم', '۲۵۰ مگابایت']] };
      case 'out_msg':  return { v: 'پاسخ‌ها', rows: [['خروجی', 'متن، کد، توضیح']] };
      case 'out_file': return { v: 'فایل‌ها', rows: [['خروجی', 'فایل‌های ساخته‌شده']] };
    }
    return { v: '—', rows: [] };
  }

  function paint() {
    Object.keys(S.labels).forEach(function (id) {
      try { S.labels[id].value.textContent = detail(id).v; } catch (e) {}
    });
    var b = S.data.brain || {};
    if (S.hud) {
      var thinking = b.now && b.now.thinking;
      S.hud.textContent = thinking
        ? '● در حال کار: ' + (b.now.activity || '')
        : '● آماده' + (S.me ? ' · ' + S.me : '') + (S.isAdmin ? ' (مدیر)' : '');
      S.hud.style.color = thinking ? '#34d399' : '#8ea0c8';
    }
    paintMonitor();
    checkRetention();
    if (S.selected) renderPanel(S.selected);
  }

  /* ------------------------------------------------------------- panel */
  function renderPanel(id) {
    var info = detail(id);
    var rg = REGIONS.filter(function (r) { return r.id === id; })[0];
    if (!rg) return;
    var col = hex(rg.color);
    S.panel.innerHTML = '';
    S.panel.style.display = 'block';
    S.panel.style.borderColor = col + '55';

    var head = el('div', 'display:flex;align-items:center;gap:8px;margin-bottom:2px');
    head.appendChild(el('span', 'width:10px;height:10px;border-radius:50%;background:' + col +
      ';box-shadow:0 0 12px ' + col));
    head.appendChild(el('div', 'font:700 15px/1.3 system-ui;color:#e8e9f2', rg.fa));
    S.panel.appendChild(head);
    S.panel.appendChild(el('div',
      'font:500 10px/1.4 ui-monospace,monospace;color:#5f6379;margin-bottom:10px', rg.en));

    // Per-region actions: only real ones, wired to real endpoints.
    if (S.isAdmin && (id === 'code' || id === 'libs')) {
      var actRow = el('div', 'display:flex;gap:6px;margin-bottom:10px');
      var upBtn = el('button',
        'flex:1;padding:7px;border-radius:8px;cursor:pointer;font:600 11px system-ui;' +
        'background:rgba(52,211,153,.12);border:1px solid rgba(52,211,153,.35);color:#a7f3d0',
        '⬆ افزودن فایل');
      upBtn.addEventListener('click', function () {
        upBtn.textContent = '…'; upBtn.disabled = true;
        uploadCodeFile(function (err) {
          upBtn.disabled = false;
          upBtn.textContent = err ? ('خطا: ' + err) : '⬆ افزودن فایل';
          if (!err) setTimeout(function () { renderPanel(id); }, 300);
        });
      });
      actRow.appendChild(upBtn);
      S.panel.appendChild(actRow);
    }

    if (!info.rows.length) {
      S.panel.appendChild(el('div', 'color:#8b8fa8;font:500 12px system-ui', 'داده‌ای نیست.'));
    }

    info.rows.forEach(function (row, i) {
      var line = el('div',
        'display:flex;justify-content:space-between;gap:10px;padding:6px 0;' +
        'border-bottom:1px solid rgba(255,255,255,.055)');
      var name = el('span', 'font:600 12px system-ui;color:#c9cee0;overflow:hidden;' +
        'text-overflow:ellipsis;flex:1', String(row[0]));
      line.appendChild(name);
      line.appendChild(el('span',
        'font:500 11px ui-monospace,monospace;color:' + col + ';white-space:nowrap',
        String(row[1])));

      // source files: click to edit, small download button
      if (id === 'code' && info.files && info.files[i]) {
        (function (fname) {
          line.style.cursor = 'pointer';
          line.style.borderRadius = '7px';
          line.style.padding = '6px';
          line.title = 'برای ویرایش بزن: ' + fname;
          line.addEventListener('mouseenter', function () { line.style.background = 'rgba(255,255,255,.06)'; });
          line.addEventListener('mouseleave', function () { line.style.background = ''; });
          line.addEventListener('click', function (e) {
            if (e.target && e.target.tagName === 'BUTTON') return;
            openEditor(fname);
          });
          name.textContent = '✎ ' + name.textContent;
          var dl = el('button',
            'margin-inline-start:6px;padding:2px 7px;border-radius:6px;cursor:pointer;' +
            'font:600 10px system-ui;background:rgba(255,255,255,.08);' +
            'border:1px solid rgba(255,255,255,.14);color:#c9cee0', '⬇');
          dl.title = 'دانلود ' + fname;
          dl.addEventListener('click', function (e) {
            e.stopPropagation();
            api('/api/admin/brain/file?name=' + encodeURIComponent(fname)).then(function (d) {
              if (d && !d.error) downloadText(fname.replace(/\//g, '_'), d.content || '');
            });
          });
          line.appendChild(dl);
        })(info.files[i].name);
      }

      // knowledge entries: small delete button, admin only
      if (id === 'memory' && S.isAdmin && info.ids && info.ids[i]) {
        (function (kid) {
          var del = el('button',
            'margin-inline-start:6px;padding:2px 7px;border-radius:6px;cursor:pointer;' +
            'font:600 10px system-ui;background:rgba(251,113,133,.12);' +
            'border:1px solid rgba(251,113,133,.35);color:#fda4af', '✕');
          del.title = 'پاک کردن این خاطره';
          del.addEventListener('click', function (e) {
            e.stopPropagation();
            del.disabled = true; del.textContent = '…';
            deleteKnowledge(kid, function (err) {
              if (!err) setTimeout(function () { renderPanel(id); }, 300);
              else { del.disabled = false; del.textContent = '✕'; }
            });
          });
          line.appendChild(del);
        })(info.ids[i]);
      }

      S.panel.appendChild(line);
    });

    var close = el('button',
      'margin-top:12px;width:100%;padding:8px;border-radius:9px;cursor:pointer;' +
      'background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);' +
      'color:#c9cee0;font:600 12px system-ui', 'بستن');
    close.addEventListener('click', function () { select(null); });
    S.panel.appendChild(close);
  }

  function select(id) {
    S.selected = id;
    if (!id) {
      S.panel.style.display = 'none';
      S.focusTarget = null;               // back to the whole-brain center
      return;
    }
    renderPanel(id);
    var n = S.nodes[id];
    if (n) {
      S.focusTarget = n.group.position.clone();
      S.inside = true;
      S.targetDist = S.distInside * 1.6;  // close enough to read, not inside the mesh
      if (S.coreBtn) S.coreBtn.textContent = 'خروج از هسته';
    }
  }

  /* ------------------------------------------------------------- editor */
  function downloadText(filename, text) {
    var blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename.replace(/[\\/]/g, '_');
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }

  function uploadCodeFile(onDone) {
    var input = document.createElement('input');
    input.type = 'file';
    input.addEventListener('change', function () {
      var f = input.files && input.files[0];
      if (!f) return;
      var fd = new FormData();
      fd.append('file', f);
      fetch('/api/codelib/upload', {
        method: 'POST', headers: { Authorization: 'Bearer ' + tok() }, body: fd
      }).then(function (r) { return r.json(); }).then(function (d) {
        onDone(d && d.error ? d.error : null);
        loadData();
      }).catch(function (e) { onDone(e.message); });
    });
    input.click();
  }

  function deleteKnowledge(id, onDone) {
    fetch('/api/admin/knowledge/' + encodeURIComponent(id), {
      method: 'DELETE', headers: { Authorization: 'Bearer ' + tok() }
    }).then(function (r) { return r.json(); }).then(function (d) {
      onDone(d && d.error ? d.error : null);
      loadData();
    }).catch(function (e) { onDone(e.message); });
  }

  function openEditor(name) {
    if (S.editor) S.editor.remove();
    var wrap = el('div',
      'position:absolute;inset:5% 6%;z-index:20;display:flex;flex-direction:column;' +
      'background:rgba(6,9,20,.97);border:1px solid rgba(255,255,255,.16);' +
      'border-radius:14px;padding:14px;direction:rtl');
    S.editor = wrap;

    var bar = el('div', 'display:flex;align-items:center;gap:10px;margin-bottom:10px');
    bar.appendChild(el('div', 'font:700 14px system-ui;color:#e8e9f2;flex:1', name));
    var note = el('div', 'font:500 11px ui-monospace,monospace;color:#8ea0c8', 'در حال خواندن…');
    bar.appendChild(note);
    wrap.appendChild(bar);

    var ta = el('textarea',
      'flex:1;width:100%;resize:none;direction:ltr;text-align:left;border-radius:10px;' +
      'padding:12px;background:#080b16;color:#cfe0ff;border:1px solid rgba(255,255,255,.1);' +
      'font:400 12px/1.55 ui-monospace,monospace');
    ta.spellcheck = false;
    wrap.appendChild(ta);

    var row = el('div', 'display:flex;gap:8px;margin-top:10px');
    function mk(t, css, fn) {
      var b = el('button', 'flex:1;padding:9px;border-radius:9px;cursor:pointer;' +
        'font:600 12px system-ui;' + css, t);
      b.addEventListener('click', fn);
      return b;
    }
    row.appendChild(mk('ذخیره', 'background:#7b5cff22;border:1px solid #7b5cff66;color:#cdbcff',
      function () {
        note.textContent = 'در حال ذخیره…';
        fetch('/api/admin/brain/file', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + tok() },
          body: JSON.stringify({ name: name, content: ta.value })
        }).then(function (r) { return r.json(); }).then(function (d) {
          if (d && d.error) { note.style.color = '#fb7185'; note.textContent = d.error; }
          else {
            note.style.color = '#34d399';
            note.textContent = 'ذخیره شد' + (d && d.restartSupported ? ' — نیاز به ری‌استارت' : '');
          }
        }).catch(function (e) {
          note.style.color = '#fb7185'; note.textContent = 'خطا: ' + e.message;
        });
      }));
    row.appendChild(mk('بستن', 'background:rgba(255,255,255,.06);' +
      'border:1px solid rgba(255,255,255,.12);color:#c9cee0',
      function () { wrap.remove(); S.editor = null; }));
    wrap.appendChild(row);

    S.overlay.appendChild(wrap);

    api('/api/admin/brain/file?name=' + encodeURIComponent(name)).then(function (d) {
      if (!d || d.error) { note.style.color = '#fb7185'; note.textContent = (d && d.error) || 'خوانده نشد'; return; }
      ta.value = d.content || '';
      note.textContent = fa((d.content || '').split('\n').length) + ' خط';
    });
  }

  /* ------------------------------------------------------------- overlay */
  function buildOverlay() {
    var ov = el('div',
      'position:fixed;inset:0;z-index:99999;display:none;overflow:hidden;' +
      'background:radial-gradient(circle at 50% 45%,#0c1330 0%,#05070f 62%,#02030a 100%)');
    S.overlay = ov;

    S.canvas = el('canvas', 'position:absolute;inset:0;width:100%;height:100%;display:block');
    ov.appendChild(S.canvas);

    var host = el('div', 'position:absolute;inset:0;pointer-events:none');
    ov.appendChild(host);
    buildLabels(host);
    buildMonitor(ov);

    // column captions
    function caption(txt, css) {
      return el('div',
        'position:absolute;direction:rtl;font:700 12px system-ui;color:#7d8bb0;' +
        'letter-spacing:.5px;pointer-events:none;z-index:3;' + css, txt);
    }
    ov.appendChild(caption('ورودی‌ها', 'top:50%;right:22px;transform:translateY(-160px)'));
    ov.appendChild(caption('خروجی‌ها', 'top:50%;left:22px;transform:translateY(-160px)'));
    ov.appendChild(caption('یادگیری و منابع', 'bottom:56px;left:0;right:0;text-align:center'));

    var title = el('div', 'position:absolute;top:16px;right:20px;direction:rtl;z-index:4');
    title.appendChild(el('div', 'font:700 17px/1.3 system-ui;color:#e8e9f2', 'مغز ستایش'));
    S.hud = el('div', 'font:600 11px/1.5 ui-monospace,monospace;color:#8ea0c8;margin-top:3px', '…');
    title.appendChild(S.hud);
    ov.appendChild(title);

    S.panel = el('div',
      'position:absolute;top:66px;right:20px;width:300px;max-height:calc(100% - 140px);' +
      'overflow:auto;padding:14px 16px;border-radius:14px;direction:rtl;display:none;' +
      'background:rgba(7,10,22,.9);border:1px solid rgba(255,255,255,.12);z-index:6');
    ov.appendChild(S.panel);

    ov.appendChild(el('div',
      'position:absolute;bottom:18px;left:0;right:0;text-align:center;direction:rtl;' +
      'font:500 11px system-ui;color:#5b6076;pointer-events:none;z-index:4',
      'بچرخان · اسکرول برای زوم · روی هر بخش بزن'));

    var bar = el('div', 'position:absolute;top:16px;left:20px;display:flex;gap:8px;z-index:7');
    function mk(t, fn) {
      var b = el('button',
        'padding:8px 13px;border-radius:10px;cursor:pointer;font:600 12px system-ui;' +
        'background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.14);color:#dfe3f0', t);
      b.addEventListener('click', fn);
      return b;
    }
    var spin = mk('توقف چرخش', function () {
      S.autoRotate = !S.autoRotate;
      spin.textContent = S.autoRotate ? 'توقف چرخش' : 'چرخش خودکار';
    });
    S.coreBtn = mk('ورود به هسته', toggleCore);
    bar.appendChild(S.coreBtn);
    bar.appendChild(spin);
    bar.appendChild(mk('تازه‌سازی', function () { loadData(); }));
    bar.appendChild(mk('بستن', close));
    ov.appendChild(bar);

    document.body.appendChild(ov);
    wireInput(ov);
  }

  function wireInput(ov) {
    function down(x, y) { S.drag = { x: x, y: y }; S.autoRotate = false; }
    function move(x, y) {
      if (!S.drag) return;
      S.rotY += (x - S.drag.x) * 0.006;
      S.rotX += (y - S.drag.y) * 0.004;
      S.rotX = Math.max(-1.0, Math.min(1.0, S.rotX));
      S.drag = { x: x, y: y };
    }
    function up() { S.drag = null; }
    ov.addEventListener('mousedown', function (e) { down(e.clientX, e.clientY); });
    window.addEventListener('mousemove', function (e) { move(e.clientX, e.clientY); });
    window.addEventListener('mouseup', up);
    ov.addEventListener('touchstart', function (e) {
      if (e.touches.length === 1) down(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });
    ov.addEventListener('touchmove', function (e) {
      if (e.touches.length === 1) move(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });
    ov.addEventListener('touchend', up);
    ov.addEventListener('dblclick', function () { toggleCore(); });
    ov.addEventListener('wheel', function (e) {
      e.preventDefault();
      S.dist = Math.max(3.4, Math.min(11, S.dist + e.deltaY * 0.0024));
    }, { passive: false });
    document.addEventListener('keydown', function (e) {
      if (S.open && e.key === 'Escape') { if (S.editor) { S.editor.remove(); S.editor = null; } else close(); }
    });
  }

  /* ------------------------------------------------------------- scene */
  function initScene() {
    var THREE = window.THREE;
    S.renderer = new THREE.WebGLRenderer({ canvas: S.canvas, antialias: true, alpha: true });
    S.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));

    S.scene = new THREE.Scene();
    S.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 120);

    S.scene.add(new THREE.AmbientLight(0x7089cc, 0.8));
    var l1 = new THREE.PointLight(0x7b5cff, 1.4, 30); l1.position.set(5, 4, 6); S.scene.add(l1);
    var l2 = new THREE.PointLight(0xff7a3d, 1.0, 30); l2.position.set(-5, -2, -4); S.scene.add(l2);

    S.root = new THREE.Group();
    S.scene.add(S.root);

    buildBrain(THREE, S.root);
    buildNodes(THREE, S.root);
    buildLinks(THREE, S.root);

    resize();
    window.addEventListener('resize', resize);
  }

  function resize() {
    if (!S.renderer) return;
    var w = S.overlay.clientWidth || window.innerWidth;
    var h = S.overlay.clientHeight || window.innerHeight;
    S.renderer.setSize(w, h, false);
    S.camera.aspect = w / h;
    S.camera.updateProjectionMatrix();
    // pull back a little on narrow screens so the columns still fit
    S.distOutside = w < 700 ? 8.6 : 6.2;
    if (!S.inside) { S.dist = S.distOutside; S.targetDist = S.distOutside; }
  }

  /* ------------------------------------------------------------- loop */
  function frame() {
    S.raf = requestAnimationFrame(frame);
    if (!S.open) return;
    // Backgrounded tab or locked phone: keep the loop alive but skip GPU work,
    // so a weak phone doesn't keep rendering an invisible scene and overheat.
    if (document.hidden) return;
    var THREE = window.THREE;
    S.clock += 0.016;

    if (S.autoRotate) S.rotY += 0.0022;
    S.root.rotation.y = S.rotY;
    S.root.rotation.x = S.rotX;

    var b = S.data.brain || {};
    var thinking = !!(b.now && b.now.thinking);

    var i = 0;
    Object.keys(S.nodes).forEach(function (id) {
      var n = S.nodes[id]; i++;
      var beat = 1 + 0.08 * Math.sin(S.clock * 1.6 + i);
      n.core.scale.setScalar(beat);
      n.halo.scale.setScalar(beat * (S.selected === id ? 1.55 : 1));
      n.halo.material.opacity = (S.selected === id ? 0.30 : 0.12) +
        0.04 * Math.sin(S.clock * 2 + i);
      if (n.ring) n.ring.rotation.z += 0.004 + (id === 'core' && thinking ? 0.014 : 0);
    });

    var rate = thinking ? 2.0 : 1;
    S.pulses.forEach(function (p) {
      p.t += p.speed * 0.016 * rate;
      if (p.t > 1) p.t -= 1;
      p.dot.position.copy(p.curve.getPoint(p.t));
      p.dot.material.opacity = 0.3 + 0.65 * Math.sin(p.t * Math.PI);
    });

    if (S.cloud) S.cloud.material.opacity = 0.75 + 0.2 * Math.sin(S.clock * 1.2);
    if (S.web) S.web.material.opacity = 0.12 + 0.06 * Math.sin(S.clock * 0.9);

    S.dist += (S.targetDist - S.dist) * 0.06;
    S.camera.near = S.inside ? 0.01 : 0.1;
    S.camera.updateProjectionMatrix();

    // Focused on one region: orbit that point instead of the brain's center.
    // The brain keeps turning, so the camera tracks the region's rotated
    // world position every frame rather than a fixed spot.
    var lookAt;
    if (S.focusTarget && S.root) {
      var worldFocus = S.focusTarget.clone().applyMatrix4(S.root.matrixWorld);
      lookAt = worldFocus;
      var dir = worldFocus.clone().normalize();
      if (dir.lengthSq() < 0.0001) dir.set(0, 0, 1);
      S.camera.position.copy(worldFocus).addScaledVector(dir, S.dist * 0.55 + 0.3);
      S.camera.position.y += 0.05;
    } else {
      lookAt = { x: 0, y: -0.15, z: 0 };
      S.camera.position.set(0, 0.25, S.dist);
    }
    S.camera.lookAt(lookAt.x, lookAt.y, lookAt.z);

    if (S.shell) {
      var wantOpacity = S.inside ? 0.05 : 0.85;
      S.shell.traverse(function (o) {
        if (o.material && o.material.opacity != null) {
          o.material.opacity += (wantOpacity - o.material.opacity) * 0.08;
        }
      });
    }
    if (S.cloud) S.cloud.material.opacity = (S.inside ? 0.95 : 0.55) + 0.15 * Math.sin(S.clock * 1.2);
    S.renderer.render(S.scene, S.camera);

    var w = S.overlay.clientWidth, h = S.overlay.clientHeight;
    if (!S._labelVec) S._labelVec = new THREE.Vector3();
    var v = S._labelVec;
    S._skipLabels = !S._skipLabels;
    if (S._skipLabels) return;
    Object.keys(S.nodes).forEach(function (id) {
      var n = S.nodes[id], lb = S.labels[id];
      if (!lb) return;
      n.group.getWorldPosition(v);
      var depth = v.clone().applyMatrix4(S.camera.matrixWorldInverse).z;
      v.project(S.camera);
      lb.box.style.left = ((v.x * 0.5 + 0.5) * w) + 'px';
      lb.box.style.top = ((-v.y * 0.5 + 0.5) * h - 30) + 'px';
      var behind = depth < -S.dist;
      lb.box.style.opacity = behind ? 0.2 : 1;
      lb.box.style.pointerEvents = behind ? 'none' : 'auto';
    });
  }


  /* ------------------------------------------------------------- enter/exit core
     Smoothly flies the camera to the middle of the brain. The outer shell
     fades away so the inside — nodes, synapses, the neuron cloud — reads
     clearly. Rotation never stops, inside or out.                          */
  function toggleCore() {
    S.inside = !S.inside;
    S.targetDist = S.inside ? S.distInside : S.distOutside;
    if (!S.inside) S.focusTarget = null;   // leaving the core always re-centers
    if (S.coreBtn) S.coreBtn.textContent = S.inside ? 'خروج از هسته' : 'ورود به هسته';
  }

  /* ------------------------------------------------------------- open/close */
  function open() {
    if (!window.THREE) { alert('کتابخانه‌ی سه‌بعدی بارگذاری نشده است.'); return; }
    if (!S.overlay) { buildOverlay(); initScene(); }
    S.open = true;
    S.overlay.style.display = 'block';
    resize();
    if (!S.raf) frame();
    loadData();
    if (S.poll) clearInterval(S.poll);
    S.poll = setInterval(loadData, POLL_MS);
  }

  function close() {
    S.open = false;
    if (S.overlay) S.overlay.style.display = 'none';
    if (S.poll) { clearInterval(S.poll); S.poll = null; }
    if (S.raf) { cancelAnimationFrame(S.raf); S.raf = null; }
    if (S.editor) { S.editor.remove(); S.editor = null; }
    select(null);
  }

  /* ------------------------------------------------------------- top button
     Sits next to the notification bell. Three states:
       dim      — nothing going on
       bright   — there is something to look at (pending work, new learning)
       working  — a rotating frame while Setayesh is actually busy            */
  var TOP = { btn: null, ring: null, state: '', poll: null };

  function buildTopButton() {
    if (document.getElementById('brainTopBtn')) return;

    var css = document.createElement('style');
    css.textContent =
      '@keyframes stysSpin{to{transform:rotate(360deg)}}' +
      '@keyframes stysBreathe{0%,100%{opacity:.55}50%{opacity:1}}' +
      '#brainTopBtn{position:fixed;top:12px;z-index:400;width:42px;height:42px;' +
      'border-radius:50%;border:1px solid var(--border,rgba(255,255,255,.12));' +
      'background:rgba(17,20,34,.9);backdrop-filter:blur(10px);cursor:pointer;' +
      'display:none;align-items:center;justify-content:center;padding:0;' +
      'transition:opacity .25s,box-shadow .25s}' +
      '#brainTopBtn.dim{opacity:.45}' +
      '#brainTopBtn.bright{opacity:1;box-shadow:0 0 16px rgba(123,92,255,.45)}' +
      '#brainTopBtn.working{opacity:1;box-shadow:0 0 22px rgba(52,211,153,.5)}' +
      '#brainTopBtn:hover{opacity:1 !important;box-shadow:0 0 20px rgba(167,139,250,.6);' +
      'border-color:rgba(167,139,250,.55)}' +
      '#brainTopBtn.dragging{cursor:grabbing;transition:none}' +
      '#brainTopRing{position:absolute;inset:-3px;border-radius:50%;pointer-events:none;' +
      'border:2px solid transparent;display:none}' +
      '#brainTopBtn.working #brainTopRing{display:block;border-top-color:#34d399;' +
      'border-right-color:#38bdf8;animation:stysSpin 1.1s linear infinite}' +
      '#brainTopBtn.bright svg{animation:stysBreathe 2.6s ease-in-out infinite}';
    document.head.appendChild(css);

    var b = document.createElement('button');
    b.id = 'brainTopBtn';
    b.title = 'مغز ستایش';
    b.innerHTML =
      '<span id="brainTopRing"></span>' +
      '<svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="#a78bfa" ' +
      'stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M9 3a3 3 0 00-3 3 3 3 0 00-2 5 3 3 0 001 5 3 3 0 003 3 3 3 0 003 1V3.5A2.5 2.5 0 009 3z"/>' +
      '<path d="M15 3a3 3 0 013 3 3 3 0 012 5 3 3 0 01-1 5 3 3 0 01-3 3 3 3 0 01-3 1V3.5A2.5 2.5 0 0115 3z"/>' +
      '<circle cx="9" cy="9" r="1"/><circle cx="15" cy="13" r="1"/><circle cx="10" cy="16" r="1"/>' +
      '</svg>';
    document.body.appendChild(b);
    TOP.btn = b;
    b.style.cursor = 'grab';

    // Start next to the real notification bell; after that the user can
    // drag it anywhere and it remembers the spot (per browser, in localStorage).
    var SAVED_KEY = 'setayesh.brainBtnPos';
    function placeDefault() {
      var bell = document.getElementById('notifBell');
      if (bell) {
        var r = bell.getBoundingClientRect();
        if (r.width) {
          var rtl = (document.documentElement.getAttribute('dir') || '') === 'rtl';
          return { top: r.top, left: rtl ? r.right + 8 : r.left - 50 };
        }
      }
      return { top: 12, left: window.innerWidth - 62 };
    }
    function place(pos) {
      b.style.top = Math.max(4, Math.min(window.innerHeight - 46, pos.top)) + 'px';
      b.style.left = Math.max(4, Math.min(window.innerWidth - 46, pos.left)) + 'px';
      b.style.right = 'auto';
    }
    var saved = null;
    try { saved = JSON.parse(localStorage.getItem(SAVED_KEY) || 'null'); } catch (e) {}
    place(saved || placeDefault());
    window.addEventListener('resize', function () {
      if (!saved) place(placeDefault());
    });

    // Drag to reposition. A real drag (moved more than a few px) is not
    // treated as a click, so it never accidentally opens the brain.
    var dragState = null;
    function startDrag(x, y) {
      var r = b.getBoundingClientRect();
      dragState = { dx: x - r.left, dy: y - r.top, moved: false };
      b.classList.add('dragging');
    }
    function moveDrag(x, y) {
      if (!dragState) return;
      dragState.moved = true;
      var pos = { top: y - dragState.dy, left: x - dragState.dx };
      place(pos);
      saved = pos;
    }
    function endDrag() {
      if (!dragState) return;
      b.classList.remove('dragging');
      if (dragState.moved) {
        try { localStorage.setItem(SAVED_KEY, JSON.stringify(saved)); } catch (e) {}
        // The document-level click hook (registered elsewhere, on document,
        // capture phase) fires BEFORE any listener on this button — so the
        // guard has to live on the shared TOP object, not here.
        TOP.justDragged = Date.now();
      }
      dragState = null;
    }
    b.addEventListener('mousedown', function (e) { startDrag(e.clientX, e.clientY); e.preventDefault(); });
    window.addEventListener('mousemove', function (e) { moveDrag(e.clientX, e.clientY); });
    window.addEventListener('mouseup', function () { endDrag(); });
    b.addEventListener('touchstart', function (e) {
      var t = e.touches[0]; startDrag(t.clientX, t.clientY);
    }, { passive: true });
    b.addEventListener('touchmove', function (e) {
      var t = e.touches[0]; moveDrag(t.clientX, t.clientY);
    }, { passive: true });
    b.addEventListener('touchend', endDrag);

    setTopState('dim');
    pollTop();
    if (TOP.poll) clearInterval(TOP.poll);
    TOP.poll = setInterval(pollTop, 12000);
  }

  function setTopState(st) {
    if (!TOP.btn || TOP.state === st) return;
    TOP.state = st;
    TOP.btn.className = st;
  }

  function pollTop() {
    if (!TOP.btn) return;
    api('/api/me').then(function (me) {
      if (!me || !me.username) { TOP.btn.style.display = 'none'; return; }
      TOP.btn.style.display = 'flex';
      S.isAdmin = !!me.isAdmin;
      if (!me.isAdmin) { setTopState('dim'); return; }
      return api('/api/admin/brain').then(function (b) {
        if (!b) { setTopState('dim'); return; }
        S.data.brain = b;
        if (b.now && b.now.thinking) { setTopState('working'); return; }
        var attention = (b.pendingActions || 0) > 0 ||
                        (b.suggestions || 0) > 0 ||
                        (b.learning && b.learning.pending > 0);
        setTopState(attention ? 'bright' : 'dim');
      });
    });
  }

  /* ------------------------------------------------------------- live monitor
     A small strip at the bottom of the brain view: what the server is doing
     right now, refreshed with the rest of the data.                          */
  function buildMonitor(ov) {
    var m = el('div',
      'position:absolute;bottom:44px;left:50%;transform:translateX(-50%);' +
      'display:flex;gap:8px;direction:rtl;z-index:5;pointer-events:none;flex-wrap:wrap;' +
      'justify-content:center;max-width:92vw');
    S.monitor = m;
    ov.appendChild(m);
  }

  function paintMonitor() {
    if (!S.monitor) return;
    var b = S.data.brain || {};
    var items = [
      ['وضعیت', (b.now && b.now.thinking) ? 'مشغول' : 'آماده',
        (b.now && b.now.thinking) ? '#34d399' : '#8ea0c8'],
      ['موتورهای فعال',
        fa((b.engines || []).filter(function (e) { return !e.cooling; }).length), '#ff7a3d'],
      ['خاطره', fa((b.memory && b.memory.totalItems) || 0), '#38bdf8'],
      ['کار در انتظار', fa(b.pendingActions || 0), '#fbbf24'],
      ['دانش تأییدنشده', fa((b.learning && b.learning.pending) || 0), '#34d399'],
      ['آپ‌تایم', fa(Math.round((b.uptime || 0) / 60)) + 'د', '#a78bfa']
    ];
    S.monitor.innerHTML = '';
    items.forEach(function (it) {
      var chip = el('div',
        'padding:5px 10px;border-radius:9px;background:rgba(8,12,26,.7);' +
        'border:1px solid rgba(255,255,255,.1);font:600 10.5px system-ui;color:#9aa3bd');
      chip.appendChild(el('span', '', it[0] + ' '));
      chip.appendChild(el('span', 'color:' + it[2] + ';font-weight:700', it[1]));
      S.monitor.appendChild(chip);
    });
  }

  /* ------------------------------------------------------------- retention
     Old board messages pile up. Once anything crosses the age limit the brain
     asks — it never deletes on its own.                                      */
  var RETAIN_DAYS = 30;

  function checkRetention() {
    if (!S.overlay || document.getElementById('stysRetain')) return;
    var msgs = arr(S.data.board, 'messages');
    var cutoff = Date.now() - RETAIN_DAYS * 86400000;
    var old = msgs.filter(function (m) {
      var t = Date.parse(m.at || '');
      return t && t < cutoff && !m.pinned;
    });
    if (old.length < 5) return;

    var box = el('div',
      'position:absolute;bottom:96px;left:50%;transform:translateX(-50%);z-index:9;' +
      'direction:rtl;padding:12px 14px;border-radius:13px;max-width:min(420px,92vw);' +
      'background:rgba(10,14,28,.95);border:1px solid rgba(251,191,36,.35)');
    box.id = 'stysRetain';
    box.appendChild(el('div', 'font:700 12.5px system-ui;color:#e8e9f2;margin-bottom:4px',
      fa(old.length) + ' پیام تابلو بیش از ' + fa(RETAIN_DAYS) + ' روز عمر دارند'));
    box.appendChild(el('div', 'font:500 11px system-ui;color:#9aa3bd;margin-bottom:10px',
      'پاک شوند؟ پیام‌های سنجاق‌شده دست‌نخورده می‌مانند.'));

    var row = el('div', 'display:flex;gap:8px');
    function mk(t, css, fn) {
      var b = el('button', 'flex:1;padding:8px;border-radius:9px;cursor:pointer;' +
        'font:600 11.5px system-ui;' + css, t);
      b.addEventListener('click', fn);
      return b;
    }
    row.appendChild(mk('پاک کن', 'background:#fbbf2422;border:1px solid #fbbf2455;color:#fde68a',
      function () {
        box.remove();
        fetch('/api/board/clear', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + tok() },
          body: JSON.stringify({ scope: 'read' })
        }).then(function () { loadData(); });
      }));
    row.appendChild(mk('بماند', 'background:rgba(255,255,255,.06);' +
      'border:1px solid rgba(255,255,255,.12);color:#c9cee0',
      function () { box.remove(); }));
    box.appendChild(row);
    S.overlay.appendChild(box);
  }

  /* ------------------------------------------------------------- hook */
  document.addEventListener('click', function (e) {
    var t = e.target && e.target.closest ? e.target.closest('#shBrain,#brainTopBtn') : null;
    if (!t) return;
    if (TOP.justDragged && Date.now() - TOP.justDragged < 250) { TOP.justDragged = 0; return; }
    e.preventDefault();
    e.stopPropagation();
    var sheet = document.getElementById('sheet');
    var scrim = document.getElementById('sheetScrim');
    if (sheet) sheet.classList.remove('on');
    if (scrim) scrim.classList.remove('on');
    open();
  }, true);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildTopButton);
  } else {
    setTimeout(buildTopButton, 0);
  }

  window.setayeshBrain = { open: open, close: close, reload: loadData,
                           refreshButton: pollTop };
})();

