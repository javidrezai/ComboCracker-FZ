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

  // Language: mirror the app's current choice (index.html's lang attribute is
  // the one global both app.js and the sweep keep in sync). L(fa,en) picks the
  // string; the panel is rebuilt on open, so it always reflects the live choice.
  function L(fa, en) { return (document.documentElement.lang === 'en') ? en : fa; }

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
  // Built per call (not once at load) so the labels follow a mid-session
  // language switch — L() reads the live document language each time.
  function GATT_NAMES_MAP() { return {
    '0x1800': L('دسترسی عمومی', 'Generic access'), '0x1801': L('تغییرات سرویس', 'Service changed'),
    '0x180a': L('اطلاعات دستگاه', 'Device information'), '0x180f': L('باتری', 'Battery'), '0x180d': L('ضربان قلب', 'Heart rate'),
    '0x1812': L('کیبورد/موس (HID)', 'Keyboard/mouse (HID)'), '0x1804': L('توان فرستنده', 'Tx power'),
    '0x2a00': L('نام دستگاه', 'Device name'), '0x2a19': L('درصد باتری', 'Battery level'), '0x2a24': L('شماره مدل', 'Model number'),
    '0x2a25': L('شماره سریال', 'Serial number'), '0x2a26': L('نسخه فریم‌ور', 'Firmware version'), '0x2a27': L('نسخه سخت‌افزار', 'Hardware version'),
    '0x2a29': L('سازنده', 'Manufacturer'), '0x2a37': L('ضربان قلب', 'Heart rate'),
    '6e400001-b5a3-f393-e0a9-e50e24dcca9e': L('Nordic UART (کنسول سریال BLE)', 'Nordic UART (BLE serial console)'),
    '6e400002-b5a3-f393-e0a9-e50e24dcca9e': L('UART ورودی (بنویس)', 'UART in (write)'),
    '6e400003-b5a3-f393-e0a9-e50e24dcca9e': L('UART خروجی (بخوان)', 'UART out (read)'),
  }; }
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
    var m = GATT_NAMES_MAP();
    return m[short] || m[u] || '';
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
      box.innerHTML = L('گوشی‌ات خودش می‌تواند وصل شود — این کارها روی همین گوشی انجام می‌شوند، نه روی کامپیوتر.',
        'Your phone can connect on its own — these actions run on this very phone, not the computer.') +
        '<div style="color:#8ea0c8;margin-top:5px">' +
        (cap.bluetooth ? L('بلوتوث ✓ ', 'Bluetooth ✓ ') : L('بلوتوث ✕ ', 'Bluetooth ✕ ')) +
        (cap.serial ? L('· کابل/سریال ✓', '· cable/serial ✓') : L('· کابل/سریال ✕', '· cable/serial ✕')) + '</div>';
      return box;
    }
    box.style.cssText += ';background:rgba(251,191,36,.10);border:1px solid rgba(251,191,36,.35);color:#fbbf24';
    if (cap.ios) {
      box.innerHTML = L(
        '<b>روی آیفون/آیپد این کار از داخل مرورگر ممکن نیست.</b><br>' +
        'اپل هیچ مرورگری روی iOS را به بلوتوث/سریال وصل نمی‌کند (نه سافاری، نه کروم). ' +
        'دو راه داری:<br>' +
        '۱) از یک گوشی/تبلت <b>اندروید</b> با مرورگر Chrome باز کن.<br>' +
        '۲) همین حالا از تبِ «بلوتوث» و «کابل و سریال» استفاده کن — آن‌ها روی خودِ کامپیوتر کار می‌کنند و همین‌جا هم جواب می‌دهند.',
        '<b>On iPhone/iPad this cannot be done from inside a browser.</b><br>' +
        'Apple connects no browser on iOS to Bluetooth/serial (neither Safari nor Chrome). ' +
        'You have two options:<br>' +
        '1) Open it on an <b>Android</b> phone/tablet with Chrome.<br>' +
        '2) Use the “Bluetooth” and “Cable & serial” tabs right now — they run on the computer itself and work here.');
    } else if (!cap.secure) {
      box.innerHTML = L(
        '<b>این صفحه روی «http» باز شده، برای همین مرورگر بلوتوث/سریال را قفل کرده.</b><br>' +
        'این APIها فقط روی <b>https</b> (یا localhost) روشن می‌شوند — یک قانون امنیتی خود مرورگر است.<br>' +
        'راه‌حل: کنار برنامه فایل‌های <code>tls-cert.pem</code> و <code>tls-key.pem</code> را بگذار ' +
        '(با mkcert یا <code>tailscale cert</code>)، برنامه را دوباره باز کن و این‌بار با <b>https://</b> وارد شو. ' +
        'آن‌وقت این بخش خودش روشن می‌شود.',
        '<b>This page was opened over “http”, so the browser has locked Bluetooth/serial.</b><br>' +
        'These APIs turn on only over <b>https</b> (or localhost) — a security rule of the browser itself.<br>' +
        'Fix: put <code>tls-cert.pem</code> and <code>tls-key.pem</code> next to the app ' +
        '(with mkcert or <code>tailscale cert</code>), reopen the app and this time enter with <b>https://</b>. ' +
        'Then this section turns on by itself.');
    } else {
      box.innerHTML = L(
        '<b>این مرورگر Web Bluetooth/Serial ندارد.</b><br>' +
        'روی گوشی/تبلت اندروید یا کامپیوتر با <b>Chrome</b> یا <b>Edge</b> باز کن. ' +
        'در ضمن، تبِ «بلوتوث» و «کابل و سریال» روی خودِ کامپیوتر همیشه کار می‌کنند.',
        '<b>This browser has no Web Bluetooth/Serial.</b><br>' +
        'Open it on an Android phone/tablet or a computer with <b>Chrome</b> or <b>Edge</b>. ' +
        'Also, the “Bluetooth” and “Cable & serial” tabs always work on the computer itself.');
    }
    return box;
  }

  // The one thing to state plainly and never fake.
  function keyboardNote() {
    var d = el('details');
    d.style.cssText = 'margin-top:12px;font-size:12px;color:#8ea0c8;border-top:1px solid rgba(255,255,255,.08);padding-top:10px';
    d.innerHTML = L(
      '<summary style="cursor:pointer;color:#aeb7cf">«گوشی خودش را کیبرد معرفی کند» — چرا از مرورگر نمی‌شود</summary>' +
      '<div style="margin-top:7px;line-height:1.9">' +
      'برای اینکه گوشی برای یک دستگاهِ دیگر نقش <b>کیبرد</b> بازی کند، باید نقشِ «دستگاهِ ورودی» (HID peripheral) را بگیرد. ' +
      'هیچ صفحه‌ی وبی روی هیچ گوشی‌ای این اجازه را ندارد — مرورگر فقط اجازه‌ی نقشِ «وصل‌شونده» را می‌دهد. ' +
      'روی آیفون حتی یک اپ نصبی هم عملاً نمی‌تواند. ' +
      'کارِ نزدیک و شدنی این است که گوشی به دستگاه وصل شود و <b>روی آن بنویسد/فرمان بفرستد</b> — همان کاری که همین‌جا با GATT و سریال انجام می‌شود.' +
      '</div>',
      '<summary style="cursor:pointer;color:#aeb7cf">“Make the phone present itself as a keyboard” — why the browser can’t</summary>' +
      '<div style="margin-top:7px;line-height:1.9">' +
      'For the phone to act as a <b>keyboard</b> to another device, it must take the “input device” (HID peripheral) role. ' +
      'No web page on any phone is allowed that — the browser only grants the “the-one-that-connects” role. ' +
      'On iPhone even an installed app essentially cannot. ' +
      'The close, doable thing is for the phone to connect to a device and <b>write to it / send it commands</b> — exactly what happens here over GATT and serial.' +
      '</div>');
    return d;
  }

  // ---- Web Bluetooth ------------------------------------------------------
  function btSection(host, level) {
    var s = card(L('بلوتوثِ گوشی', 'Phone Bluetooth'));
    var btn = el('button', 'btn', L('وصل شدن به یک دستگاه', 'Connect to a device'));
    btn.style.fontSize = '13px';
    s.body.appendChild(btn);
    var note = el('div');
    note.style.cssText = 'font-size:12px;min-height:16px;margin:8px 0';
    s.body.appendChild(note);
    var out = el('div');
    s.body.appendChild(out);
    function say(t, ok) { note.style.color = ok ? '#34d399' : '#fb7185'; note.textContent = t; }

    btn.addEventListener('click', function () {
      say(L('یک پنجره‌ی انتخاب دستگاه باز می‌شود — دستگاه خودت را انتخاب کن…', 'A device chooser opens — pick your device…'), true);
      navigator.bluetooth.requestDevice({ acceptAllDevices: true, optionalServices: OPTIONAL_SERVICES })
        .then(function (device) {
          out.innerHTML = '';
          say(L('در حال اتصال به «', 'Connecting to “') + (device.name || device.id) + L('»…', '”…'), true);
          device.addEventListener('gattserverdisconnected', function () { say(L('ارتباط قطع شد.', 'Disconnected.'), false); });
          return device.gatt.connect().then(function (server) { return { device: device, server: server }; });
        })
        .then(function (ctx) {
          say(L('وصل شد ✓ — ', 'Connected ✓ — ') + (ctx.device.name || ctx.device.id), true);
          renderDevice(ctx.device, ctx.server, out, level);
        })
        .catch(function (e) {
          if (e && e.name === 'NotFoundError') say(L('چیزی انتخاب نشد.', 'Nothing was selected.'), false);
          else say(L('اتصال ممکن نشد: ', 'Could not connect: ') + (e && e.message || e), false);
        });
    });
    host.appendChild(s.card);
  }

  function renderDevice(device, server, host, level) {
    host.innerHTML = '';
    var head = el('div');
    head.style.cssText = 'font-size:13px;margin-bottom:8px';
    head.innerHTML = '<b>' + esc(device.name || L('دستگاه بلوتوث', 'Bluetooth device')) + '</b>' +
      '<span style="color:#8ea0c8;font-size:11px;direction:ltr"> · ' + esc(device.id || '') + '</span>';
    host.appendChild(head);
    var wrap = el('div');
    wrap.innerHTML = '<div class="tk-hint"><span class="spin"></span> ' + L('خواندن سرویس‌ها…', 'Reading services…') + '</div>';
    host.appendChild(wrap);

    server.getPrimaryServices().then(function (services) {
      wrap.innerHTML = '';
      if (!services.length) { wrap.innerHTML = '<div class="tk-hint">' + L('این دستگاه سرویسی که مرورگر اجازه بدهد نشان نداد.', 'This device exposed no service the browser is allowed to show.') + '</div>'; return; }
      var chain = Promise.resolve();
      services.forEach(function (svc) {
        chain = chain.then(function () {
          var svcName = gattName(svc.uuid);
          var sb = el('div');
          sb.style.cssText = 'margin:6px 0;padding:7px 9px;border-radius:9px;background:rgba(255,255,255,.03)';
          sb.innerHTML = '<div style="font-size:11.5px;color:#8ea0c8">' + L('سرویس: ', 'Service: ') +
            esc(svcName || svc.uuid) + '</div>';
          wrap.appendChild(sb);
          return svc.getCharacteristics().then(function (chars) {
            chars.forEach(function (ch) { renderChar(ch, sb, level); });
          }).catch(function () {});
        });
      });
    }).catch(function (e) {
      wrap.innerHTML = '<div class="tk-hint" style="color:#fbbf24">' + L('سرویس‌ها خوانده نشد: ', 'Could not read services: ') + esc(e && e.message || e) + '</div>';
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
      var rd = el('button', 'btn ghost', L('بخوان', 'Read'));
      rd.style.cssText = 'font-size:10.5px;padding:3px 8px';
      rd.addEventListener('click', function () {
        rd.disabled = true;
        ch.readValue().then(function (dv) {
          rd.disabled = false;
          val.textContent = bytesToText(dv) || ('0x' + bytesToHex(dv)) || L('(خالی)', '(empty)');
        }).catch(function (e) { rd.disabled = false; val.textContent = '— ' + (e && e.message || e); });
      });
      row.appendChild(rd);
    }
    if (ch.properties.notify) {
      var nt = el('button', 'btn ghost', L('گوش بده', 'Listen'));
      nt.style.cssText = 'font-size:10.5px;padding:3px 8px';
      nt.addEventListener('click', function () {
        ch.startNotifications().then(function () {
          nt.textContent = L('در حال گوش دادن', 'Listening');
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
      inp.placeholder = L('متن یا 0x هگز', 'text or 0x hex');
      inp.style.cssText = 'font-size:10.5px;width:96px;padding:3px 6px;direction:ltr';
      var wr = el('button', 'btn ghost', L('بنویس', 'Write'));
      wr.style.cssText = 'font-size:10.5px;padding:3px 8px';
      wr.addEventListener('click', function () {
        if (!inp.value.trim()) return;
        if (!confirm(L('روی این مشخصه نوشته شود؟ نوشتن اشتباه می‌تواند دستگاه را خراب کند.', 'Write to this characteristic? A wrong write can damage the device.'))) return;
        var data = /^0x/i.test(inp.value) ? hexToBuf(inp.value) : new TextEncoder().encode(inp.value);
        wr.disabled = true;
        var p = ch.properties.write ? ch.writeValueWithResponse(data) : ch.writeValueWithoutResponse(data);
        p.then(function () { wr.disabled = false; val.textContent = L('نوشته شد ✓', 'Written ✓'); })
          .catch(function (e) { wr.disabled = false; val.textContent = '— ' + (e && e.message || e); });
      });
      row.appendChild(inp);
      row.appendChild(wr);
    }
    host.appendChild(row);
  }

  // ---- Web Serial ---------------------------------------------------------
  function serialSection(host, level) {
    var s = card(L('کابل / سریالِ گوشی', 'Phone cable / serial'));
    if (level < 2) {
      s.body.appendChild(el('div', 'tk-hint', L('حساب تو درجه‌ی ۱ است — گفتگوی سریال (نوشتن روی دستگاه) درجه‌ی ۲ لازم دارد.', 'Your account is level 1 — the serial link (writing to a device) needs level 2.')));
      host.appendChild(s.card);
      return;
    }
    var btn = el('button', 'btn', L('انتخاب پورت و اتصال', 'Choose port and connect'));
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
        push(L('— وصل شد (', '— connected (') + baud.value + ' baud) —');
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
        cmd.placeholder = L('دستور، مثل AT', 'command, e.g. AT');
        cmd.style.cssText = 'flex:1;font-size:12px;direction:ltr;text-align:left;padding:5px 9px';
        var send = el('button', 'btn', L('بفرست', 'Send'));
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
        s.body.appendChild(el('div', 'tk-hint', L('پورت باز نشد: ', 'Could not open the port: ') + esc(e && e.message || e)));
      });
    });
    host.appendChild(s.card);
  }

  // ---- the panel ----------------------------------------------------------
  window.renderPhoneHwPanel = function (host, level) {
    level = Number(level) || 0;
    host.innerHTML = '';
    var intro = el('div', 'tk-warn', L(
      'این بخش روی خودِ گوشیِ تو کار می‌کند — گوشی مستقیم به دستگاه وصل می‌شود، مستقل از کامپیوتر. ' +
      'هر اتصال یک پنجره‌ی انتخاب باز می‌کند و تا خودت دستگاه را انتخاب نکنی به چیزی وصل نمی‌شود.',
      'This section runs on your phone itself — the phone connects directly to the device, independent of the computer. ' +
      'Every connection opens a chooser, and nothing is connected until you pick the device yourself.'));
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
    btn.textContent = L('روشن کردن اتصال امن (HTTPS) برای گوشی', 'Turn on the secure link (HTTPS) for the phone');
    btn.style.cssText = 'width:100%;padding:11px;border:0;border-radius:10px;background:#22d3ee;color:#06252b;font-weight:700;font-size:13px;cursor:pointer';
    var msg = el('div');
    msg.style.cssText = 'font-size:12px;line-height:1.9;color:#8ea0c8;margin-top:9px';
    msg.textContent = L('یک گواهی امن برای خانه می‌سازد تا بلوتوث و کابلِ گوشی روشن شود. فقط بابا این دکمه را می‌بیند.', 'Builds a secure certificate for the home so the phone’s Bluetooth and cable turn on. Only the admin sees this button.');
    btn.onclick = function () {
      btn.disabled = true; btn.textContent = L('در حال ساخت گواهی…', 'Building the certificate…');
      fetch('/api/admin/secure-link', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ on: true }),
      }).then(function (r) { return r.json(); }).then(function (d) {
        if (d && d.ok) {
          btn.style.display = 'none';
          var links = (d.urls || []).map(function (u) { return '<div style="font-family:var(--mono);color:#6ee7b7">' + u + '</div>'; }).join('');
          msg.innerHTML = L(
            '<b style="color:#6ee7b7">آماده شد — همین الان فعال شد، بدون ری‌استارت.</b><br>' +
            'روی گوشی این آدرس را باز کن:',
            '<b style="color:#6ee7b7">Ready — enabled right now, no restart.</b><br>' +
            'Open this address on the phone:') + links +
            '<div style="margin-top:7px">' + L(
            'بار اول مرورگر هشدار می‌دهد؛ «Advanced» بعد «Proceed / ادامه» را بزن. ' +
            'آن وقت همین بخش خودش روشن می‌شود. برای حذف کامل هشدار: Tailscale یا mkcert.',
            'The first time the browser warns; tap “Advanced” then “Proceed”. ' +
            'Then this section turns on by itself. To remove the warning entirely: Tailscale or mkcert.') + '</div>';
        } else {
          btn.disabled = false; btn.textContent = L('روشن کردن اتصال امن (HTTPS) برای گوشی', 'Turn on the secure link (HTTPS) for the phone');
          msg.textContent = (d && d.error) ? d.error : L('نشد. دوباره امتحان کن.', 'Didn’t work. Try again.');
        }
      }).catch(function () {
        btn.disabled = false; btn.textContent = L('روشن کردن اتصال امن (HTTPS) برای گوشی', 'Turn on the secure link (HTTPS) for the phone');
        msg.textContent = L('خطای شبکه. دوباره امتحان کن.', 'Network error. Try again.');
      });
    };
    wrap.appendChild(btn); wrap.appendChild(msg);
    return wrap;
  }
})();
