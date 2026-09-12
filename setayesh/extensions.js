'use strict';

// Setayesh AI — extension loader.
//
// Lets the owner add NEW tools/options later WITHOUT rebuilding the .exe: drop a
// .js file into a `plugins/` folder next to the app and it shows up as a new tool
// in the Extensions tab. Each plugin is plain Node code you write.
//
// TRUST NOTE: a plugin is ordinary JavaScript running with this app's privileges
// on your machine. Only put files you wrote or trust into the plugins folder —
// same caution as running any script you downloaded.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Plugin contract (module.exports):
//   id:          unique url-safe string           (required)
//   name:        display name                      (optional, defaults to id)
//   description: one line                          (optional)
//   inputLabel:  placeholder for the input box     (optional)
//   run(input, ctx) -> string | { text } | { json }   (required)
//     input: the text the user typed
//     ctx:   { crypto, fetch } helpers
function loadPlugins(dir) {
  const out = [];
  let files = [];
  try {
    if (fs.existsSync(dir)) files = fs.readdirSync(dir).filter(f => f.toLowerCase().endsWith('.js'));
  } catch (e) { /* no plugins dir yet — that's fine */ }

  for (const f of files) {
    // Absolute path — require() treats a bare/relative path as a module name.
    const full = path.resolve(dir, f);
    try {
      // Bust the cache so a Reload picks up edits without a restart.
      try { delete require.cache[require.resolve(full)]; } catch (e) {}
      const mod = require(full);
      if (!mod || typeof mod.run !== 'function' || typeof mod.id !== 'string') {
        out.push({ id: 'invalid:' + f, name: f, description: 'plugin must export { id, run }', error: true });
        continue;
      }
      out.push({
        id: mod.id,
        name: mod.name || mod.id,
        description: mod.description || '',
        inputLabel: mod.inputLabel || '',
        run: mod.run,
        file: f,
      });
    } catch (err) {
      out.push({ id: 'error:' + f, name: f, description: 'load error: ' + err.message, error: true });
    }
  }
  return out;
}

function pluginContext() {
  return {
    crypto,
    fetch: (...a) => fetch(...a),
  };
}

// Run a plugin with a hard timeout so a bad loop can't hang the server.
async function runPlugin(plugin, input, timeoutMs) {
  const ctx = pluginContext();
  const work = Promise.resolve().then(() => plugin.run(String(input == null ? '' : input), ctx));
  let timer;
  const timeout = new Promise((_, rej) => { timer = setTimeout(() => rej(new Error('plugin timed out')), timeoutMs || 15000); });
  try {
    const result = await Promise.race([work, timeout]);
    if (typeof result === 'string') return { text: result };
    if (result && typeof result === 'object') return result;
    return { text: String(result) };
  } finally {
    clearTimeout(timer);
  }
}

module.exports = { loadPlugins, runPlugin };
