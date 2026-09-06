# Setayesh — guidance for Claude Code

Setayesh AI is a private, self-hosted family assistant (Node.js + Express).
The full development charter is in **`RULES.md`** — read it before changing
anything here. The invariants below are binding for any change, hand-written or
via the app's own self-editing feature.

## Invariants (never break these)
- **TLS is never disabled by default.** Only `SETAYESH_INSECURE_TLS=1`, set
  deliberately, may skip verification (rule 1.1).
- **Secrets stay local, mode `0600`; passwords are hashed only** (rule 1.2).
- **`helmet`, `bcrypt`, and rate limiting are mandatory** (rule 1.3).
- **Self-editing (`read_own_source`/`propose_change`) is admin-only, off by
  default, and never auto-applied** — the admin approves a diff (rule 1.4).
- **Security-tool scans stay within private IP space** — never widen
  `PRIVATE_RANGES` in `toolkit.js` (rule 1.5).
- **Keep dependencies minimal** (currently 6). Adding an npm dependency needs a
  strong reason; the Google connector must add none (rules 2.1, 3.1).
- **Role-based access**: family/child accounts are gated; admin-only stays
  admin-only (rule 2.3).

## Working rules
- Run `npm test` before and after any change; keep it green. A change that
  turns the tests red is not done (rule 3.3).
- Refactors must preserve behavior; if behavior changes, add a test first.
- Never commit secrets or runtime state — `.setayesh-*` and `node_modules/` are
  gitignored.
- Keep the version in sync: `APP_VERSION` in `index.js` must equal
  `package.json` "version" (a smoke test asserts this). Bump the `?v=` query
  strings in `public/index.html` with it so cached JS/CSS refreshes.

## Layout
- `index.js` — server (routes, chat/engine routing, 29 AI tools, admin,
  self-heal). **Still a monolith — split module by module, behind tests** (rule 3.4).
- `providers.js`, `toolkit.js`, `connectors.js`, `extensions.js` — server modules.
- `public/` — UI: `index.html` (shell) + `app.css`, `app.js`, `brain3d.js`
  (after `three.min.js`), `login-fx.js`, `memory-panel.js`, `connectors-panel.js`.
- `test/smoke.test.js` — critical-path tests. `Start-Setayesh.bat` / `start.sh` — launchers.

## Open roadmap
Local HTTPS for LAN/Tailscale (2.2); split server `index.js` (3.4);
tool-calling for non-Claude engines (3.5).
