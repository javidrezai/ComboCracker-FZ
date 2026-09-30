'use strict';
// Office / ZIP → readable text, split out of index.js (pure: bytes in, text out).
// A .docx/.xlsx/.pptx is a ZIP of XML, so a dependency-free ZIP reader plus the
// XML→text helper covers them all; a plain ZIP is listed and its readable files
// inlined. No shared state — everything it needs is required here.
const path = require('path');
const zlib = require('zlib');
const { xmlToText } = require('./htmltext');
const { MAX_TEXT_CHARS, TEXT_EXTENSIONS } = require('./filekind');

// Central-directory walk of a ZIP buffer → {name,size,method,data()} entries.
// Dependency-free (Node zlib for deflate); ZIP64 and directory entries skipped.
function zipEntries(buf) {
  const EOCD_SIG = 0x06054b50, CEN_SIG = 0x02014b50, LOC_SIG = 0x04034b50;
  let eocd = -1;
  const from = Math.max(0, buf.length - 66000);
  for (let i = buf.length - 22; i >= from; i--) {
    if (buf.readUInt32LE(i) === EOCD_SIG) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('این فایل ZIP سالم نیست.');

  const count = buf.readUInt16LE(eocd + 10);
  let ptr = buf.readUInt32LE(eocd + 16);
  const out = [];

  for (let n = 0; n < count && ptr + 46 <= buf.length; n++) {
    if (buf.readUInt32LE(ptr) !== CEN_SIG) break;
    const method   = buf.readUInt16LE(ptr + 10);
    const compSize = buf.readUInt32LE(ptr + 20);
    const rawSize  = buf.readUInt32LE(ptr + 24);
    const nameLen  = buf.readUInt16LE(ptr + 28);
    const extraLen = buf.readUInt16LE(ptr + 30);
    const cmtLen   = buf.readUInt16LE(ptr + 32);
    const localAt  = buf.readUInt32LE(ptr + 42);
    const name     = buf.slice(ptr + 46, ptr + 46 + nameLen).toString('utf8');
    ptr += 46 + nameLen + extraLen + cmtLen;

    if (name.endsWith('/')) continue;                 // directory entry
    if (compSize === 0xFFFFFFFF || rawSize === 0xFFFFFFFF) continue;  // ZIP64

    out.push({
      name, size: rawSize, method,
      data() {
        if (buf.readUInt32LE(localAt) !== LOC_SIG) throw new Error('ورودی ZIP خراب است: ' + name);
        const lNameLen  = buf.readUInt16LE(localAt + 26);
        const lExtraLen = buf.readUInt16LE(localAt + 28);
        const start = localAt + 30 + lNameLen + lExtraLen;
        const raw = buf.slice(start, start + compSize);
        if (method === 0) return raw;
        if (method === 8) return zlib.inflateRawSync(raw);
        throw new Error('فشرده‌سازی پشتیبانی‌نشده در ' + name);
      },
    });
  }
  return out;
}

// .docx/.xlsx/.pptx/.odt/… → readable text, keeping paragraph and cell breaks.
function officeToText(buf, filename) {
  const entries = zipEntries(buf);
  const byName = {};
  for (const e of entries) byName[e.name] = e;
  const read = (n) => { try { return byName[n] ? byName[n].data().toString('utf8') : ''; } catch (e) { return ''; } };
  const ext = path.extname(filename).toLowerCase();

  // Word
  if (ext === '.docx' || ext === '.docm' || byName['word/document.xml']) {
    let t = xmlToText(read('word/document.xml'));
    for (const e of entries) {
      if (/^word\/(header|footer)\d*\.xml$/.test(e.name)) {
        const extra = xmlToText(e.data().toString('utf8'));
        if (extra) t += '\n' + extra;
      }
    }
    return t;
  }

  // Excel — resolve the shared string table, then walk every sheet
  if (ext === '.xlsx' || ext === '.xlsm' || byName['xl/workbook.xml']) {
    const shared = [];
    const ss = read('xl/sharedStrings.xml');
    if (ss) {
      const m = ss.match(/<si>[\s\S]*?<\/si>/g) || [];
      for (const one of m) shared.push(xmlToText(one));
    }
    const sheets = entries.filter((e) => /^xl\/worksheets\/sheet\d+\.xml$/.test(e.name))
                          .sort((a, b) => a.name.localeCompare(b.name));
    const parts = [];
    for (const sh of sheets) {
      let xml;
      try { xml = sh.data().toString('utf8'); } catch (e) { continue; }
      const rows = xml.match(/<row[\s\S]*?<\/row>/g) || [];
      const lines = [];
      for (const row of rows) {
        const cells = row.match(/<c[\s\S]*?(?:\/>|<\/c>)/g) || [];
        const vals = [];
        for (const c of cells) {
          const isShared = /t="s"/.test(c);
          const vm = c.match(/<v>([\s\S]*?)<\/v>/);
          const im = c.match(/<is>[\s\S]*?<\/is>/);
          let v = '';
          if (im) v = xmlToText(im[0]);
          else if (vm) v = isShared ? (shared[parseInt(vm[1], 10)] || '') : vm[1];
          vals.push(v);
        }
        if (vals.some((v) => v !== '')) lines.push(vals.join('\t'));
      }
      if (lines.length) parts.push('# ' + sh.name.replace(/^xl\/worksheets\//, '') + '\n' + lines.join('\n'));
    }
    return parts.join('\n\n');
  }

  // PowerPoint
  if (ext === '.pptx' || ext === '.pptm' || byName['ppt/presentation.xml']) {
    const slides = entries.filter((e) => /^ppt\/slides\/slide\d+\.xml$/.test(e.name))
                          .sort((a, b) => {
                            const na = parseInt(a.name.replace(/\D+/g, ''), 10);
                            const nb = parseInt(b.name.replace(/\D+/g, ''), 10);
                            return na - nb;
                          });
    const parts = [];
    slides.forEach((sl, i) => {
      let t = '';
      try { t = xmlToText(sl.data().toString('utf8')); } catch (e) {}
      if (t) parts.push('--- اسلاید ' + (i + 1) + ' ---\n' + t);
    });
    return parts.join('\n\n');
  }

  // OpenDocument (.odt/.ods/.odp)
  if (byName['content.xml']) return xmlToText(read('content.xml'));

  return '';
}

// A plain ZIP: list what is inside, and include the readable files.
function zipToText(buf, filename) {
  const entries = zipEntries(buf);
  const lines = ['محتوای ' + filename + ' — ' + entries.length + ' فایل:'];
  for (const e of entries.slice(0, 400)) {
    lines.push('  ' + e.name + '  (' + e.size + ' بایت)');
  }
  if (entries.length > 400) lines.push('  … و ' + (entries.length - 400) + ' فایل دیگر');

  let budget = Math.floor(MAX_TEXT_CHARS * 0.8);
  const bodies = [];
  for (const e of entries) {
    const ext = path.extname(e.name).toLowerCase();
    if (!TEXT_EXTENSIONS.has(ext)) continue;
    if (e.size > 400 * 1024) continue;
    if (budget <= 0) break;
    let txt = '';
    try { txt = e.data().toString('utf8'); } catch (err) { continue; }
    if (txt.length > budget) txt = txt.slice(0, budget) + '\n… (بریده شد)';
    budget -= txt.length;
    bodies.push('\n--- ' + e.name + ' ---\n' + txt);
  }
  return lines.join('\n') + (bodies.length ? '\n' + bodies.join('\n') : '');
}

module.exports = { zipEntries, officeToText, zipToText };
