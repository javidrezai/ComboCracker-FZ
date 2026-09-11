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
- **Self-editing (`read_own_source`/`propose_change`) is admin-only and never
  auto-applied** — the admin approves each diff, and a change that breaks boot
  rolls back automatically. Per the owner's decision it is now ON by default
  (disable only with `ENABLE_SELF_EDIT=0`); the admin-only and approval
  guarantees are the invariant, not the default state (rule 1.4).
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
- Keep the version in sync across five places, all asserted by smoke tests:
  `APP_VERSION` in `index.js`, `"version"` in `package.json`, and the
  `SETAYESH_BUILD <version>` marker on the first line of `public/app.js`,
  `public/brainmap.js`, and (as an HTML comment) `public/index.html`. Do NOT
  hand-edit `?v=` strings — `index.html` writes `?v=__VER__` and the server
  injects `APP_VERSION` at serve time, so cache-busting is automatic and the
  shell can never reference a version different from the server. The build
  markers let the server (`/api/admin/integrity`) detect a stale/partial
  install and warn the admin — the guard against the "my UI change never
  showed up" bug class.

## Engine routing, failover and chat memory
- **The failover in `/api/chat` must be able to see everything it passes on.**
  Anything the `catch` block hands to a substitute engine (`callOpts`,
  `messages`, `toolCtx`, `safe`) has to be declared OUTSIDE the `try` it is
  catching for. It was not, once, and every substitute call threw
  `ReferenceError` before reaching the network — the failover marked each
  engine broken and the user always saw the first engine's error. A smoke test
  now stands up two fake engines and asserts the answer comes from the healthy
  one; keep it.
- `classifyQuestion()` + `rankEngines()` pick the engine per question; health
  outweighs talent, and `noteEngine()` escalates the cooldown and quarantines
  an engine after three failures in a row. Health persists in
  `.setayesh-engine-health.json` so a restart doesn't re-discover a dead key.
- **A chat failure must never reach the user as an HTTP error.** After failover
  she tries the keyless local engines, and if even those are gone she answers
  in her own voice with `degraded` set — honest about what is wrong, never a
  red box.
- **Chat memory is kept until the owner deletes it.** Nothing expires and
  nothing is trimmed to make room. `PUT /api/chats` MERGES (a device with a
  short local list must never wipe the archive) and only an explicit delete —
  which writes a tombstone so it stays deleted on every device — removes a
  conversation.
- `LOCAL_FIRST=1` routes adults through the on-device engine (private but
  slow). Children are local-first regardless: that guarantee is theirs.

## Files, devices, network, language (9.9.83)
- **`formats.js`** — the extension registry AND the converter. `FORMATS.md` (repo
  root) and `pybrain/vault/knowledge/file-formats.md` are GENERATED from it at
  boot; never hand-edit them. Office files and PDFs are read with `zlib` alone —
  .docx/.xlsx/.pptx are ZIP+XML, and PDF text lives in zlib streams. A PDF
  filter chain is often `[ /ASCII85Decode /FlateDecode ]`, so decoders must run
  in order; Persian PDFs arrive as presentation forms in visual order, hence the
  NFKC + guarded line-reversal. Media transcoding needs system ffmpeg/ImageMagick
  and says so plainly when they are missing — never pretend.
- **`bigfile.js`** — streaming reader. Two rules: (1) every long walk yields to
  the event loop (`breathe()`), because a synchronous scan freezes the whole
  house; (2) `search` matches per WINDOW, not per line — one string per line
  meant 5.4M allocations for a 231 MB log and a 10x slowdown inside the server.
  `protect()` is registered from index.js with the REAL state-file paths; the
  name patterns are only a fallback.
- **`discover.js`** — USB / Bluetooth / drives / LAN (SSDP + mDNS). Parsers are
  pure and unit-tested; the command runners are thin. Discovery is passive.
- **`netguard.js`** — device risk, heuristic file-threat scan, network trust
  (captive portal, DNS hijack, TLS interception), emergency connectivity, and the
  X25519+AES-GCM envelope. **Never** an attack tool: no password guessing, and
  `connectWifi` refuses unless `approvedSsid === ssid`.
- **`language.js`** — fa/en/de detection, rule-based grammar check, letter
  conventions. Persian needs `(?<![؀-ۿ])` lookarounds, not `\b`; the
  Arabic→Persian letter fold is applied to a normalised copy first (1:1, so
  offsets stay valid); rules run most-certain-first so a `maybe` rule cannot
  claim a range a `sure` rule needed.
- **Device control is gated twice**: admin-only tool, AND the device id must be
  in `.setayesh-allowed-devices.json`. That is the owner's «با اجازه».
- **`network_status` is the one non-admin tool** in this group — the owner asked
  that every member see the connection state on their own device.
- **Voice**: `voiceBlock()` in index.js builds the tone rules from each member's
  `tone` and `writeLang` prefs. Children never get the adult "خودمونی" register.

## Layout
- `index.js` — server (routes, chat/engine routing, 29 AI tools, admin,
  self-heal). **Still a monolith — split module by module, behind tests** (rule 3.4).
- `providers.js`, `toolkit.js`, `connectors.js`, `extensions.js` — server modules.
- `public/` — UI: `index.html` (shell) + `app.css`, `app.js`, `brain3d.js`
  (after `three.min.js`), `login-fx.js`, `memory-panel.js`, `connectors-panel.js`.
- `test/smoke.test.js` — critical-path tests. `Start-Setayesh.bat` / `start.sh` — launchers.
- `pybrain/` — the standalone Python "Setayesh Brain" (agent loop + Obsidian
  vault memory, stdlib-only). The Node app exposes it as the keyless engine
  `brain` (provider kind `brain`): the chat hands the question to
  `pybrain/brain/server/main.py` and shows the answer. Detected at boot when
  python is on PATH; disable with `ENABLE_BRAIN=0`.

## Open roadmap
Local HTTPS for LAN/Tailscale (2.2); split server `index.js` (3.4);
tool-calling for non-Claude engines (3.5).
