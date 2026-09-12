'use strict';

// Extensions (user plugins) — extracted from index.js as another cautious step
// of splitting the server monolith (charter rule 3.4). Behavior is unchanged.
//
// A plugin is a .js file dropped into the plugins dir; extensions.js loads and
// sandboxes it. The module owns the loaded PLUGINS list (it is reloadable at
// runtime via /api/plugins/reload), and returns okCount() so index.js can print
// the "N loaded" line at startup without reaching into the list.
//
// register(app, deps) mounts the routes. deps: requireAuth, toolLimiter,
// PLUGINS_DIR, APP_VERSION.

const extensions = require('../extensions');

function register(app, deps) {
  const { requireAuth, toolLimiter, PLUGINS_DIR, APP_VERSION } = deps;

  // Loaded at boot and refreshable at runtime via /api/plugins/reload.
  let PLUGINS = extensions.loadPlugins(PLUGINS_DIR);

  function pluginList() {
    return PLUGINS.map(p => ({ id: p.id, name: p.name, description: p.description, inputLabel: p.inputLabel, error: !!p.error }));
  }

  app.get('/api/plugins', requireAuth, (req, res) => {
    res.json({ version: APP_VERSION, dir: PLUGINS_DIR, plugins: pluginList() });
  });

  app.post('/api/plugins/reload', requireAuth, (req, res) => {
    PLUGINS = extensions.loadPlugins(PLUGINS_DIR);
    res.json({ plugins: pluginList() });
  });

  app.post('/api/plugin/run', requireAuth, toolLimiter, async (req, res) => {
    const { id, input } = req.body || {};
    const plugin = PLUGINS.find(p => p.id === id && !p.error);
    if (!plugin) return res.status(404).json({ error: 'افزونه پیدا نشد' });
    try {
      const result = await extensions.runPlugin(plugin, input, 15000);
      res.json({ result });
    } catch (err) {
      res.status(400).json({ error: 'خطا در اجرای افزونه: ' + err.message });
    }
  });

  return { okCount: () => PLUGINS.filter(p => !p.error).length };
}

module.exports = { register };
