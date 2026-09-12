/* webbt.js — the phone's OWN Bluetooth and cable, run from the browser.
 *
 * Every other hardware tool in Setayesh runs on the PC where the server lives.
 * This one runs in the phone's own browser, so the admin's phone connects to a
 * device directly — nothing goes through the PC. That is exactly what "the
 * phone does it independently" means.
 *
 * It rides on three browser APIs:
 *   navigator.bluetooth  — Web Bluetooth  (scan + connect to BLE, read/write GATT)
 *   navigator.serial     — Web Serial     (a real serial link over a USB-OTG cable)
 *   navigator.hid        — WebHID         (raw HID devices)
 *
 * WHY IT MAY SAY "NOT AVAILABLE" — and this is the honest part, shown to the
 * user instead of a dead button:
 *   1. SECURE CONTEXT. All three APIs are switched off unless the page is
 *      HTTPS (or localhost). The app is reached over http://192.168.x.x, which
 *      is NOT secure, so the browser hides the APIs entirely. The app can serve
 *      HTTPS — drop tls-cert.pem / tls-key.pem next to it and open with https://
 *      — and then they light up.
 *   2. THE BROWSER. iOS (every browser on iPhone/iPad, Safari included) has no
 *      Web Bluetooth / Serial / HID at all — Apple does not ship them. Only
 *      Chrome/Edge on Android and on desktop have them.
 *
 * WHAT NO WEB PAGE CAN DO, ON ANY PHONE: make the phone PRESENT ITSELF as a
 * keyboard (or any input device) to another machine. That is the HID
 * *peripheral* role; browsers only give the *central* (the-one-that-connects)
 * role. The panel says so plainly rather than pretending. The honest near-thing
 * — the phone typing INTO a device it connects to over a serial/GATT link — is
 * here and does work where the APIs are available.
 *
 * Level 1 may look and read; level 2 may connect and write. The browser adds
 * its own hard gate on top: every connect pops a native chooser and nothing is
 * touched until the person picks a device, so this can never reach a device on
 * its own.
 */
(function () {
  'use strict';

  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[<>&"]/g, function (c) {
      return { '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c];
    });
  }
  function card(title) {
    var c = el('div', 'tk-card');
    c.appendChild(el('div', 'tk-card-h', esc(title)));
    var b = el('div', 'tk-card-b');
    c.appendChild(b);
    return { card: c, body: b };
  }

  // Common GATT service/characteristic names, so a value list reads as words.
  var GATT_NAMES = {
    '0x1800': 'دسترسی عمومی', '0x1801': 'تغییرات سرویس',
    '0x180a': 'اطلاعات دستگاه', '0x180f': 'باتری', '0x180d': 'ضربان قلب',
    '0x1812': 'کیبورد/موس (HID)', '0x1804': 'توان فرستنده',
    '0x2a00': 'نام دستگاه', '0x2a19': 'درصد باتری', '0x2a24': 'شماره مدل',
    '0x2a25': 'شماره سریال', '0x2a26': 'نسخه فریم‌ور', '0x2a27': 'نسخه سخت‌افزار',
    '0x2a29': 'سازنده', '0x2a37': 'ضربان قلب',
    '6e400001-b5a3-f393-e0a9-e50e24dcca9e': 'Nordic UART (کنسول سریال BLE)',
    '6e400002-b5a3-f393-e0a9-e50e24dcca9e': 'UART ورودی (بنویس)',
    '6e400003-b5a3-f393-e0a9-e50e24dcca9e': 'UART خروجی (بخوان)',
  };
  // Services safe to ask for. HID (0x1812) and the two generic ones are on the
  // Web Bluetooth blocklist — requesting them throws — so they are left out.
  var OPTIONAL_SERVICES = [
    'device_information', 'battery_service', 'heart_rate', 'tx_power',
    'immediate_alert', 'link_loss', 'current_time', 'user_data',
    '6e400001-b5a3-f393-e0a9-e50e24dcca9e', // Nordic UART
    0x1826, 0xfe59,
  ];
  function gattName(uuid) {
    var u = String(uuid).toLowerCase();
    var short = u.replace(/^0000([0-9a-f]{4})-0000-1000-8000-00805f9b34fb$/, '0x$1');
    return GATT_NAMES[short] || GATT_NAMES[u] || '';
  }
  function bytesToText(dv) {
    try {
      var s = new TextDecoder('utf-8', { fatal: false }).decode(dv);
      return /^[\x09\x0a\x0d\x20-\x7e -￿]*$/.test(s) ? s : '';
    } catch (e) { return ''; }
  }
  function bytesToHex(dv) {
    var out = [];
    for (var i = 0; i < dv.byteLength; i++) out.push(('0' + dv.getUint8(i).toString(16)).slice(-2));
    return out.join('');
  }
  function hexToBuf(hex) {
    var clean = String(hex).replace(/[^0-9a-f]/gi, '');
    if (clean.length % 2) clean = clean.slice(0, -1);
    var arr = new Uint8Array(clean.length / 2);
    for (var i = 0; i < arr.length; i++) arr[i] = parseInt(clean.substr(i * 2, 2), 16);
    return arr;
  }

  // ---- the capability check, told honestly -------------------------------
  function capabilities() {
    var secure = !!window.isSecureContext;
    return {
      secure: secure,
      bluetooth: secure && !!(navigator.bluetooth),
      serial: secure && !!(navigator.serial),
      hid: secure && !!(navigator.hid),
      // Detect iOS specifically, because there the answer is "never", not "turn
      // on HTTPS" — no point sending him chasing a certificate that won't help.
      ios: /iP(hone|ad|od)/.test(navigator.platform || '') ||
           (/Mac/.test(navigator.platform || '') && navigator.maxTouchPoints > 1) ||
           /iPhone|iPad|iPod/i.test(navigator.userAgent || ''),
    };
  }

  function banner(cap) {
    var box = el('div');
    box.style.cssText = 'padding:11px 13px;border-radius:12px;margin-bottom:12px;font-size:12.5px;line-height:1.9';
    if (cap.bluetooth || cap.serial) {
      box.style.cssText += ';background:rgba(52,211,153,.10);border:1px solid rgba(52,211,153,.30);color:#6ee7b7';
      box.innerHTML = 'گوشی‌ات خودش می‌تواند وصل شود — این کارها روی همین گوشی انجام می‌شوند، نه روی کامپیوتر.' +
        '<div style="color:#8ea0c8;margin-top:5px">' +
        (cap.bluetooth ? 'بلوتوث ✓ ' : 'بلوتوث ✕ ') +
        (cap.serial ? '· کابل/سریال ✓' : '· کابل/سریال ✕') + '</div>';
      return box;
    }
    box.style.cssText += ';background:rgba(251,191,36,.10);border:1px solid rgba(251,191,36,.35);color:#fbbf24';
    if (cap.ios) {
      box.innerHTML = '<b>روی آیفون/آیپد این کار از داخل مرورگر ممکن نیست.</b><br>' +
        'اپل هیچ مرورگری روی iOS را به بلوتوث/سریال وصل نمی‌کند (نه سافاری، نه کروم). ' +
        'دو راه داری:<br>' +
        '۱) از یک گوشی/تبلت <b>اندروید</b> با مرورگر Chrome باز کن.<br>' +
        '۲) همین حالا از تبِ «بلوتوث» و «کابل و سریال» استفاده کن — آن‌ها روی خودِ کامپیوتر کار می‌کنند و همین‌جا هم جواب می‌دهند.';
    } else if (!cap.secure) {
      box.innerHTML = '<b>این صفحه روی «http» باز شده، برای همین مرورگر بلوتوث/سریال را قفل کرده.</b><br>' +
        'این APIها فقط روی <b>https</b> (یا localhost) روشن می‌شوند — یک قانون امنیتی خود مرورگر است.<br>' +
        'راه‌حل: کنار برنامه فایل‌های <code>tls-cert.pem</code> و <code>tls-key.pem</code> را بگذار ' +
        '(با mkcert یا <code>tailscale cert</code>)، برنامه را دوباره باز کن و این‌بار با <b>https://</b> وارد شو. ' +
        'آن‌وقت این بخش خودش روشن می‌شود.';
    } else {
      box.innerHTML = '<b>این مرورگر Web Bluetooth/Serial ندارد.</b><br>' +
        'روی گوشی/تبلت اندروید یا کامپیوتر با <b>Chrome</b> یا <b>Edge</b> باز کن. ' +
        'در ضمن، تبِ «بلوتوث» و «کابل و سریال» روی خودِ کامپیوتر همیشه کار می‌کنند.';
    }
    return box;
  }

  // The one thing to state plainly and never fake.
  function keyboardNote() {
    var d = el('details');
    d.style.cssText = 'margin-top:12px;font-size:12px;color:#8ea0c8;border-top:1px solid rgba(255,255,255,.08);padding-top:10px';
    d.innerHTML = '<summary style="cursor:pointer;color:#aeb7cf">«گوشی خودش را کیبرد معرفی کند» — چرا از مرورگر نمی‌شود</summary>' +
      '<div style="margin-top:7px;line-height:1.9">' +
      'برای اینکه گوشی برای یک دستگاهِ دیگر نقش <b>کیبرد</b> بازی کند، باید نقشِ «دستگاهِ ورودی» (HID peripheral) را بگیرد. ' +
      'هیچ صفحه‌ی وبی روی هیچ گوشی‌ای این اجازه را ندارد — مرورگر فقط اجازه‌ی نقشِ «وصل‌شونده» را می‌دهد. ' +
      'روی آیفون حتی یک اپ نصبی هم عملاً نمی‌تواند. ' +
      'کارِ نزدیک و شدنی این است که گوشی به دستگاه وصل شود و <b>روی آن بنویسد/فرمان بفرستد</b> — همان کاری که همین‌جا با GATT و سریال انجام می‌شود.' +
      '</div>';
    return d;
  }

  // ---- Web Bluetooth ------------------------------------------------------
  function btSection(host, level) {
    var s = card('بلوتوثِ گوشی');
    var btn = el('button', 'btn', 'وصل شدن به یک دستگاه');
    btn.style.fontSize = '13px';
    s.body.appendChild(btn);
    var note = el('div');
    note.style.cssText = 'font-size:12px;min-height:16px;margin:8px 0';
    s.body.appendChild(note);
    var out = el('div');
    s.body.appendChild(out);
    function say(t, ok) { note.style.color = ok ? '#34d399' : '#fb7185'; note.textContent = t; }

    btn.addEventListener('click', function () {
      say('یک پنجره‌ی انتخاب دستگاه باز می‌شود — دستگاه خودت را انتخاب کن…', true);
      navigator.bluetooth.requestDevice({ acceptAllDevices: true, optionalServices: OPTIONAL_SERVICES })
        .then(function (device) {
          out.innerHTML = '';
          say('در حال اتصال به «' + (device.name || device.id) + '»…', true);
          device.addEventListener('gattserverdisconnected', function () { say('ارتباط قطع شد.', false); });
          return device.gatt.connect().then(function (server) { return { device: device, server: server }; });
        })
        .then(function (ctx) {
          say('وصل شد ✓ — ' + (ctx.device.name || ctx.device.id), true);
          renderDevice(ctx.device, ctx.server, out, level);
        })
        .catch(function (e) {
          if (e && e.name === 'NotFoundError') say('چیزی انتخاب نشد.', false);
          else say('اتصال ممکن نشد: ' + (e && e.message || e), false);
        });
    });
    host.appendChild(s.card);
  }

  function renderDevice(device, server, host, level) {
    host.innerHTML = '';
    var head = el('div');
    head.style.cssText = 'font-size:13px;margin-bottom:8px';
    head.innerHTML = '<b>' + esc(device.name || 'دستگاه بلوتوث') + '</b>' +
      '<span style="color:#8ea0c8;font-size:11px;direction:ltr"> · ' + esc(device.id || '') + '</span>';
    host.appendChild(head);
    var wrap = el('div');
    wrap.innerHTML = '<div class="tk-hint"><span class="spin"></span> خواندن سرویس‌ها…</div>';
    host.appendChild(wrap);

    server.getPrimaryServices().then(function (services) {
      wrap.innerHTML = '';
      if (!services.length) { wrap.innerHTML = '<div class="tk-hint">این دستگاه سرویسی که مرورگر اجازه بدهد نشان نداد.</div>'; return; }
      var chain = Promise.resolve();
      services.forEach(function (svc) {
        chain = chain.then(function () {
          var svcName = gattName(svc.uuid);
          var sb = el('div');
          sb.style.cssText = 'margin:6px 0;padding:7px 9px;border-radius:9px;background:rgba(255,255,255,.03)';
          sb.innerHTML = '<div style="font-size:11.5px;color:#8ea0c8">سرویس: ' +
            esc(svcName || svc.uuid) + '</div>';
          wrap.appendChild(sb);
          return svc.getCharacteristics().then(function (chars) {
            chars.forEach(function (ch) { renderChar(ch, sb, level); });
          }).catch(function () {});
        });
      });
    }).catch(function (e) {
      wrap.innerHTML = '<div class="tk-hint" style="color:#fbbf24">سرویس‌ها خوانده نشد: ' + esc(e && e.message || e) + '</div>';
    });
  }

  function renderChar(ch, host, level) {
    var row = el('div');
    row.style.cssText = 'display:flex;gap:6px;align-items:center;flex-wrap:wrap;padding:4px 0;font-size:11.5px';
    var props = [];
    if (ch.properties.read) props.push('read');
    if (ch.properties.write || ch.properties.writeWithoutResponse) props.push('write');
    if (ch.properties.notify) props.push('notify');
    var label = el('span');
    label.style.cssText = 'flex:1;min-width:120px';
    label.innerHTML = esc(gattName(ch.uuid) || ch.uuid.slice(0, 8)) +
      '<span style="color:#8ea0c8;direction:ltr"> · ' + props.join('/') + '</span>';
    var val = el('span');
    val.style.cssText = 'color:#6ee7b7;min-width:60px;direction:ltr;text-align:left;word-break:break-all';
    row.appendChild(label);
    row.appendChild(val);

    if (ch.properties.read) {
      var rd = el('button', 'btn ghost', 'بخوان');
      rd.style.cssText = 'font-size:10.5px;padding:3px 8px';
      rd.addEventListener('click', function () {
        rd.disabled = true;
        ch.readValue().then(function (dv) {
          rd.disabled = false;
          val.textContent = bytesToText(dv) || ('0x' + bytesToHex(dv)) || '(خالی)';
        }).catch(function (e) { rd.disabled = false; val.textContent = '— ' + (e && e.message || e); });
      });
      row.appendChild(rd);
    }
    if (ch.properties.notify) {
      var nt = el('button', 'btn ghost', 'گوش بده');
      nt.style.cssText = 'font-size:10.5px;padding:3px 8px';
      nt.addEventListener('click', function () {
        ch.startNotifications().then(function () {
          nt.textContent = 'در حال گوش دادن';
          ch.addEventListener('characteristicvaluechanged', function (ev) {
            var dv = ev.target.value;
            val.textContent = bytesToText(dv) || ('0x' + bytesToHex(dv));
          });
        }).catch(function (e) { val.textContent = '— ' + (e && e.message || e); });
      });
      row.appendChild(nt);
    }
    // Writing changes the device, so it needs level 2 — the same rule the PC
    // tabs follow.
    if ((ch.properties.write || ch.properties.writeWithoutResponse) && level >= 2) {
      var inp = el('input', 'input');
      inp.placeholder = 'متن یا 0x هگز';
      inp.style.cssText = 'font-size:10.5px;width:96px;padding:3px 6px;direction:ltr';
      var wr = el('button', 'btn ghost', 'بنویس');
      wr.style.cssText = 'font-size:10.5px;padding:3px 8px';
      wr.addEventListener('click', function () {
        if (!inp.value.trim()) return;
        if (!confirm('روی این مشخصه نوشته شود؟ نوشتن اشتباه می‌تواند دستگاه را خراب کند.')) return;
        var data = /^0x/i.test(inp.value) ? hexToBuf(inp.value) : new TextEncoder().encode(inp.value);
        wr.disabled = true;
        var p = ch.properties.write ? ch.writeValueWithResponse(data) : ch.writeValueWithoutResponse(data);
        p.then(function () { wr.disabled = false; val.textContent = 'نوشته شد ✓'; })
          .catch(function (e) { wr.disabled = false; val.textContent = '— ' + (e && e.message || e); });
      });
      row.appendChild(inp);
      row.appendChild(wr);
    }
    host.appendChild(row);
  }

  // ---- Web Serial ---------------------------------------------------------
  function serialSection(host, level) {
    var s = card('کابل / سریالِ گوشی');
    if (level < 2) {
      s.body.appendChild(el('div', 'tk-hint', 'حساب تو درجه‌ی ۱ است — گفتگوی سریال (نوشتن روی دستگاه) درجه‌ی ۲ لازم دارد.'));
      host.appendChild(s.card);
      return;
    }
    var btn = el('button', 'btn', 'انتخاب پورت و اتصال');
    btn.style.fontSize = '13px';
    var baud = el('select', 'input');
    baud.style.cssText = 'font-size:11.5px;width:auto;padding:5px 8px;margin-inline-start:8px';
    [9600, 19200, 38400, 57600, 115200, 230400, 921600].forEach(function (b) {
      var o = el('option'); o.value = b; o.textContent = b; if (b === 115200) o.selected = true; baud.appendChild(o);
    });
    s.body.appendChild(btn); s.body.appendChild(baud);
    var log = el('div');
    log.style.cssText = 'font-size:11.5px;line-height:1.8;direction:ltr;text-align:left;white-space:pre-wrap;' +
      'max-height:200px;overflow:auto;background:rgba(0,0,0,.22);border-radius:9px;padding:8px 10px;margin-top:8px';
    function push(t) { log.textContent += t + '\n'; log.scrollTop = log.scrollHeight; }

    btn.addEventListener('click', function () {
      navigator.serial.requestPort().then(function (port) {
        return port.open({ baudRate: Number(baud.value) }).then(function () { return port; });
      }).then(function (port) {
        s.body.appendChild(log);
        push('— وصل شد (' + baud.value + ' baud) —');
        var dec = new TextDecoder();
        (function readLoop() {
          var reader = port.readable && port.readable.getReader();
          if (!reader) return;
          reader.read().then(function step(res) {
            if (res.done) { reader.releaseLock(); return; }
            var t = dec.decode(res.value);
            if (t) push(t.replace(/\r/g, ''));
            return reader.read().then(step);
          }).catch(function () { try { reader.releaseLock(); } catch (e) {} });
        })();
        var line = el('div');
        line.style.cssText = 'display:flex;gap:6px;margin-top:8px';
        var cmd = el('input', 'input');
        cmd.placeholder = 'دستور، مثل AT';
        cmd.style.cssText = 'flex:1;font-size:12px;direction:ltr;text-align:left;padding:5px 9px';
        var send = el('button', 'btn', 'بفرست');
        send.style.cssText = 'font-size:12px';
        send.addEventListener('click', function () {
          if (!port.writable) return;
          var w = port.writable.getWriter();
          w.write(new TextEncoder().encode(cmd.value + '\r\n')).then(function () {
            w.releaseLock(); push('> ' + cmd.value); cmd.value = '';
          }).catch(function (e) { try { w.releaseLock(); } catch (x) {} push('! ' + (e && e.message || e)); });
        });
        cmd.addEventListener('keydown', function (e) { if (e.key === 'Enter') send.click(); });
        line.appendChild(cmd); line.appendChild(send);
        s.body.appendChild(line);
      }).catch(function (e) {
        if (e && e.name === 'NotFoundError') return;
        s.body.appendChild(el('div', 'tk-hint', 'پورت باز نشد: ' + esc(e && e.message || e)));
      });
    });
    host.appendChild(s.card);
  }

  // ---- the panel ----------------------------------------------------------
  window.renderPhoneHwPanel = function (host, level) {
    level = Number(level) || 0;
    host.innerHTML = '';
    var intro = el('div', 'tk-warn',
      'این بخش روی خودِ گوشیِ تو کار می‌کند — گوشی مستقیم به دستگاه وصل می‌شود، مستقل از کامپیوتر. ' +
      'هر اتصال یک پنجره‌ی انتخاب باز می‌کند و تا خودت دستگاه را انتخاب نکنی به چیزی وصل نمی‌شود.');
    host.appendChild(intro);

    var cap = capabilities();
    host.appendChild(banner(cap));

    // When the page is on plain http (no secure context) and the viewer is the
    // admin, offer the one-tap fix: turn on a self-signed HTTPS link. Not shown
    // on iOS (HTTPS won't help there) or when HTTPS is already running.
    if (!cap.secure && !cap.ios && window.CFG && window.CFG.isAdmin) {
      host.appendChild(secureLinkButton());
    }

    if (cap.bluetooth) btSection(host, level);
    if (cap.serial) serialSection(host, level);

    host.appendChild(keyboardNote());
  };

  // One-tap "turn on the secure link" for the admin. Calls the server to enable
  // AUTO_TLS, generate the certificate, and switch the live listener to https
  // WITHOUT a restart — so the admin just reopens the https address. We are
  // honest: the browser warns once (self-signed); Tailscale/mkcert removes it.
  function secureLinkButton() {
    var wrap = el('div');
    wrap.style.cssText = 'margin:4px 0 12px;padding:12px 13px;border-radius:12px;background:rgba(34,211,238,.08);border:1px solid rgba(34,211,238,.28)';
    var btn = el('button');
    btn.textContent = 'روشن کردن اتصال امن (HTTPS) برای گوشی';
    btn.style.cssText = 'width:100%;padding:11px;border:0;border-radius:10px;background:#22d3ee;color:#06252b;font-weight:700;font-size:13px;cursor:pointer';
    var msg = el('div');
    msg.style.cssText = 'font-size:12px;line-height:1.9;color:#8ea0c8;margin-top:9px';
    msg.textContent = 'یک گواهی امن برای خانه می‌سازد تا بلوتوث و کابلِ گوشی روشن شود. فقط بابا این دکمه را می‌بیند.';
    btn.onclick = function () {
      btn.disabled = true; btn.textContent = 'در حال ساخت گواهی…';
      fetch('/api/admin/secure-link', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ on: true }),
      }).then(function (r) { return r.json(); }).then(function (d) {
        if (d && d.ok) {
          btn.style.display = 'none';
          var links = (d.urls || []).map(function (u) { return '<div style="font-family:var(--mono);color:#6ee7b7">' + u + '</div>'; }).join('');
          msg.innerHTML = '<b style="color:#6ee7b7">آماده شد — همین الان فعال شد، بدون ری‌استارت.</b><br>' +
            'روی گوشی این آدرس را باز کن:' + links +
            '<div style="margin-top:7px">بار اول مرورگر هشدار می‌دهد؛ «Advanced» بعد «Proceed / ادامه» را بزن. ' +
            'آن وقت همین بخش خودش روشن می‌شود. برای حذف کامل هشدار: Tailscale یا mkcert.</div>';
        } else {
          btn.disabled = false; btn.textContent = 'روشن کردن اتصال امن (HTTPS) برای گوشی';
          msg.textContent = (d && d.error) ? d.error : 'نشد. دوباره امتحان کن.';
        }
      }).catch(function () {
        btn.disabled = false; btn.textContent = 'روشن کردن اتصال امن (HTTPS) برای گوشی';
        msg.textContent = 'خطای شبکه. دوباره امتحان کن.';
      });
    };
    wrap.appendChild(btn); wrap.appendChild(msg);
    return wrap;
  }
})();
