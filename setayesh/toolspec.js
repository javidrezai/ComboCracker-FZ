'use strict';
// The AI tool catalogue (JSON schemas for Claude/OpenAI-compatible tool use),
// split out of index.js as pure static data. index.js filters this per-caller
// in toolsFor(ctx) (permissions/feature flags) — the schemas themselves have no
// runtime state, so they live here.

// ---------------- Native tool-use (Claude decides on its own) ----------------
// When the active engine is Anthropic, we expose these as real tools instead
// of guessing intent from keywords. Claude reads the conversation and decides
// naturally whether a tool is needed — this is what makes detection feel
// smarter/more human than regex triggers, and is how "other AI models" and
// the machine toolkit (scan/hash/security) become things Claude can actually
// reach for mid-conversation, not separate UI panels.
const TOOLS_SPEC = [
  {
    name: 'build_project',
    description: "Create or update a multi-file project — several files and folders that belong together, like a small website or a program with modules. Write every file's complete final content. The project is saved but nothing runs. To run it, use request_run, which asks the owner first.",
    input_schema: {
      type: 'object',
      properties: {
        project: { type: 'string', description: 'Project name, e.g. my-website.' },
        files: {
          type: 'array',
          description: 'The files.',
          items: { type: 'object', properties: {
            path: { type: 'string', description: 'Relative path, e.g. src/app.py or index.html' },
            content: { type: 'string' },
          }, required: ['path', 'content'] },
        },
      },
      required: ['project', 'files'],
    },
  },
  {
    name: 'request_run',
    description: "Ask the owner for permission to run a file in a project. You do NOT run it yourself — this puts it in the father's approval queue, and it runs only if he approves. Tell the user you have asked and that only their father can allow it.",
    input_schema: {
      type: 'object',
      properties: {
        project: { type: 'string' },
        file: { type: 'string', description: 'Which file to run, e.g. main.py' },
        why: { type: 'string', description: 'One line: what running it will do.' },
      },
      required: ['project', 'file'],
    },
  },
  {
    name: 'request_install',
    description: "When a project needs a tool or library that is not installed, ask the owner rather than assuming. This queues the exact install command for his approval; it is never run automatically.",
    input_schema: {
      type: 'object',
      properties: {
        what: { type: 'string', description: 'What is needed and why, in one line.' },
        command: { type: 'string', description: 'The exact command, e.g. pip install requests' },
      },
      required: ['what', 'command'],
    },
  },
  {
    name: 'notify_father',
    description: "Send a message to the father — for when something is finished, something needs his attention, or something important came up. Use level 'done' when a task you were doing is complete, 'urgent' for something that needs him soon. He gets it as a notification in the app, a line on the family board, and (for urgent things) an email. It only ever reaches HIM — you cannot send it to anyone else.",
    input_schema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Short headline.' },
        body: { type: 'string', description: 'The detail.' },
        level: { type: 'string', description: 'info | done | urgent' },
      },
      required: ['title'],
    },
  },
  {
    name: 'check_environment',
    description: "See which programming languages this computer can actually run right now (Python, Node.js, Shell) and their versions. Use this before proposing to run something, so you know whether the tool is present or must be installed first.",
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'manage_scripts',
    description: "List, read, save or delete the user's saved Python scripts. Use this when they refer to a script by name ('run my backup script', 'delete the old one', 'save this as cleanup.py'). Saving overwrites an existing file of the same name, so read it first if you are editing rather than replacing.",
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', description: 'list | read | save | delete' },
        name: { type: 'string', description: 'Script filename, e.g. cleanup.py' },
        content: { type: 'string', description: 'Full script content, for save.' },
      },
      required: ['action'],
    },
  },
  {
    name: 'fill_form',
    description: "Read an online form (by URL) or a form the user described, work out every field it asks for, and produce a completed draft they can copy in and submit themselves. Use what you already know about them from memory, ask for anything genuinely missing, and mark clearly anything you had to guess. You NEVER submit — a wrong submission to an authority cannot be taken back.",
    input_schema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'Link to the form, when there is one.' },
        notes: { type: 'string', description: 'What the form is for, and any details the user gave.' },
      },
    },
  },
  {
    name: 'read_own_source',
    description: "Read your own source code. Call self_map first to find the right file, then read it here before proposing any change, so you edit the real current file. You can read any file listed by self_map (all backend modules, routes/*, public/*.js, public/index.html, public/app.css).",
    input_schema: {
      type: 'object',
      properties: {
        file: { type: 'string', description: 'A path from self_map, e.g. index.js | providers.js | homedevices.js | routes/board.js | public/app.js | public/index.html' },
        find: { type: 'string', description: 'Optional: return only the part around this text, so you do not pull the whole file.' },
      },
      required: ['file'],
    },
  },
  {
    name: 'self_map',
    description: "Get the full map of your own project: every file and what it does. Use this FIRST whenever the owner asks where something is, what a file does, how a feature works, or before you read/fix your own code — so you know which file to open with read_own_source. Returns the running version and the file list with a one-line purpose for each.",
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'propose_change',
    description: "Propose a change to your own code. You do NOT apply it — the owner reviews a diff and decides. Pass the COMPLETE new file content, not a fragment. Always read_own_source first so you are editing the current version. The server syntax-checks your proposal and, for index.js, actually boots it before showing it to the owner; a proposal that will not run is rejected. Explain in `reason` what you changed and why, in one or two plain sentences.",
    input_schema: {
      type: 'object',
      properties: {
        file: { type: 'string', description: 'Which file to change.' },
        code: { type: 'string', description: 'The complete new contents of that file.' },
        reason: { type: 'string', description: 'What changed and why, in plain language.' },
      },
      required: ['file', 'code', 'reason'],
    },
  },
  {
    name: 'remember',
    description: "Save something durable about this user so you still know it in future conversations: an ongoing project, a preference, a fact about their work or life, a document you handled, or a deadline. Use it when the user tells you something that will still matter next week — don't ask permission, just save it and mention briefly that you noted it. For anything with a date (a Frist, an appointment, a renewal), always set `due` so it can be reminded about.",
    input_schema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'One clear sentence, written so it makes sense months later.' },
        kind: { type: 'string', description: 'fact | preference | project | document | deadline' },
        due: { type: 'string', description: 'Deadline as YYYY-MM-DD, when there is one.' },
      },
      required: ['text'],
    },
  },
  {
    name: 'request_approval',
    description: "Ask the admin (Javid) to approve a HIGH-PRIVILEGE action before you do it — sending an email, deploying/publishing, changing your own core structure, spending money, or deleting/overwriting data. Routine work (browsing, research, drafting, reading/sorting email) does NOT need this — just do it. Calling this pings Javid on Telegram with ✅/❌ buttons and adds it to the approvals panel; it does NOT perform the action, it only asks. Tell the user briefly that you've asked for approval.",
    input_schema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'One short line naming the action, e.g. "ارسال ایمیل به اداره کار".' },
        detail: { type: 'string', description: 'What exactly will happen if approved — recipients, what is sent/changed/deleted.' },
      },
      required: ['title'],
    },
  },
  {
    name: 'make_files',
    description: "Write one or more finished files into the owner's workspace and package them as a downloadable ZIP. Use this whenever you have produced something complete the user should keep: a finished script or project, a converted document, a report, a filled-in form draft. Give every file its real name and full final content — no placeholders, no 'rest of code here'. Returns a download link.",
    input_schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          description: 'The files to write.',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Filename, may include a subfolder like src/app.py' },
              content: { type: 'string', description: 'The complete file content.' },
            },
            required: ['name', 'content'],
          },
        },
        zipName: { type: 'string', description: 'Name for the ZIP, e.g. my-project.zip' },
      },
      required: ['files'],
    },
  },
  {
    name: 'convert_file',
    description: "Convert a text-based document into another format — text/markdown/HTML to PDF, text to HTML, and so on — and return a download link. Use when the user asks to turn something into a PDF or another format.",
    input_schema: {
      type: 'object',
      properties: {
        content: { type: 'string', description: 'The source text or markdown.' },
        to: { type: 'string', description: 'Target format: pdf, html, txt, md' },
        name: { type: 'string', description: 'Output filename without extension.' },
      },
      required: ['content', 'to'],
    },
  },
  {
    name: 'run_python',
    description: "Execute Python code on this machine and get back its output. Use this to actually verify calculations, test code you wrote, process data, or check that a script works — instead of guessing what it would print. The code runs in a dedicated workspace folder with a 20-second limit. Files you create there persist. Available to the owner's account only.",
    input_schema: {
      type: 'object',
      properties: { code: { type: 'string', description: 'Complete, runnable Python source. Print what you want to see.' } },
      required: ['code'],
    },
  },
  {
    name: 'web_fetch',
    description: "Read the actual text content of a specific web page by URL. Use this whenever the user gives you a link, or when you need real documentation, an API reference, a formula, a spec, pricing, or any page content you cannot be certain of from memory. Always prefer reading the real page over guessing. Returns the page's readable text.",
    input_schema: {
      type: 'object',
      properties: { url: { type: 'string', description: 'Full URL including https://' } },
      required: ['url'],
    },
  },
  {
    name: 'web_search',
    description: "Search the internet and get back result titles, URLs, and snippets. Use this to find a specific page, current information, documentation, a library, a price, or anything that may have changed since your training. Follow up with web_fetch on the most promising result to read it properly.",
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query — keep it short and specific.' },
        count: { type: 'integer', description: 'How many results (1-8). Default 5.' },
      },
      required: ['query'],
    },
  },
  {
    name: 'github_search',
    description: "Search GitHub for open-source repositories (libraries, tools, example code). Returns the top repos with their full name (owner/name), star count, main language, description and URL. Use it to find a library or reference implementation, then read its files with github_file. Public, read-only.",
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'What to look for, e.g. "pdf table extraction python" or "jwt auth express".' },
        count: { type: 'integer', description: 'How many repos (1-8). Default 5.' },
      },
      required: ['query'],
    },
  },
  {
    name: 'github_file',
    description: "Read a single file's text from a public GitHub repository — e.g. a library's source file, its README.md, or an example. Use this after github_search (or when the user gives a repo) to actually read the code/docs. Read-only; it never changes anything.",
    input_schema: {
      type: 'object',
      properties: {
        repo: { type: 'string', description: 'Repository as "owner/name", e.g. "expressjs/express".' },
        path: { type: 'string', description: 'File path inside the repo, e.g. "README.md" or "lib/router/index.js".' },
        ref: { type: 'string', description: 'Optional branch/tag/commit. Default the repo\'s default branch.' },
      },
      required: ['repo', 'path'],
    },
  },
  {
    name: 'ask_other_models',
    description: 'Ask one or more OTHER configured AI models (not yourself) the same question and read their raw answers, so you can cross-check facts or get a second opinion before writing your own final answer to the user. Use this when the user wants extra certainty/a second opinion, or when you are genuinely unsure and other engines are configured.',
    input_schema: {
      type: 'object',
      properties: {
        question: { type: 'string', description: 'The question to send to the other models, in the same language the user used.' },
        count: { type: 'integer', description: 'How many other models to ask (1-3). Default 2.' },
      },
      required: ['question'],
    },
  },
  {
    name: 'generate_image',
    description: 'Generate an image from a text description and show it to the user. Use when the user asks you to draw, create, or generate a picture/image.',
    input_schema: {
      type: 'object',
      properties: { prompt: { type: 'string', description: 'A clear visual description of the image to generate, in English for best results.' } },
      required: ['prompt'],
    },
  },
  {
    name: 'network_scan',
    description: "Scan the user's local/private network for live devices. Only works on private IP ranges (home/office LAN) — never public internet. Use when the user asks what devices are on their network.",
    input_schema: {
      type: 'object',
      properties: { cidr: { type: 'string', description: 'Private network range, e.g. 192.168.1.0/24. Omit to auto-detect the current network.' } },
    },
  },
  {
    name: 'port_scan',
    description: "Scan open ports on ONE private/local host on the user's own network. Use when they ask what services/ports are open on a specific device they own.",
    input_schema: {
      type: 'object',
      properties: {
        host: { type: 'string', description: 'The private IP address to scan, e.g. 192.168.1.50' },
        ports: { type: 'array', items: { type: 'integer' }, description: 'Optional specific ports to check.' },
      },
      required: ['host'],
    },
  },
  {
    name: 'web_security_scan',
    description: "Run a passive, defensive security check on a public website the user owns or manages (HTTPS, security headers, cookies, mixed content). Returns a score and findings. Use when the user asks to check/audit a website's security.",
    input_schema: {
      type: 'object',
      properties: { url: { type: 'string', description: 'The website URL to check.' } },
      required: ['url'],
    },
  },
  {
    name: 'hash_text',
    description: 'Compute cryptographic hashes (md5, sha1, sha256, sha512) of a piece of text.',
    input_schema: {
      type: 'object',
      properties: {
        text: { type: 'string' },
        algos: { type: 'array', items: { type: 'string' }, description: 'e.g. ["sha256","md5"]. Omit for all common ones.' },
      },
      required: ['text'],
    },
  },
  {
    name: 'identify_hash',
    description: 'Guess what type of hash a given string is (MD5, SHA-1, bcrypt, etc.) from its length and format. Use when the user pastes a hash and asks what kind it is.',
    input_schema: {
      type: 'object',
      properties: { hash: { type: 'string' } },
      required: ['hash'],
    },
  },
  {
    name: 'password_strength',
    description: "Estimate the strength (entropy, rough offline-crack time) of the user's OWN password. Purely local computation.",
    input_schema: {
      type: 'object',
      properties: { password: { type: 'string' } },
      required: ['password'],
    },
  },
  // ---- Bluetooth and the cable ---------------------------------------------
  {
    name: 'hardware_inventory',
    description: "Everything physically attached to this machine right now, in full detail: every USB device with its manufacturer, model, serial, driver and version; every serial/COM port and which device it belongs to; every paired Bluetooth device with what it is and what it can do. Use when the owner asks what is plugged in, what is connected, or about a specific cable or Bluetooth device. Read-only.",
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'bluetooth_devices',
    description: "List Bluetooth devices — the paired ones, and optionally what is broadcasting nearby right now. Returns each device's name, type (speaker, keyboard, phone…), battery where it reports one, signal strength and the services it offers. Set scan:true to look around; that is passive listening, nothing is contacted.",
    input_schema: {
      type: 'object',
      properties: {
        scan: { type: 'boolean', description: 'Also look for devices broadcasting nearby.' },
        seconds: { type: 'number', description: 'How long to listen, 3–20 (default 6).' },
      },
    },
  },
  {
    name: 'bluetooth_info',
    description: "Everything about ONE Bluetooth device by its address: name, kind, manufacturer, paired/connected state, battery, signal, and the full list of services it exposes. Use before offering to connect to something, so you know what it actually is.",
    input_schema: { type: 'object', properties: { mac: { type: 'string' } }, required: ['mac'] },
  },
  {
    name: 'bluetooth_connect',
    description: "Pair, connect, trust, disconnect or forget a Bluetooth device. The device shows its OWN confirmation (a PIN, a button to hold) — Setayesh never guesses a PIN and never bypasses pairing. Requires device level 2; say so plainly if the account does not have it.",
    input_schema: {
      type: 'object',
      properties: {
        mac: { type: 'string' },
        action: { type: 'string', description: 'pair, connect, trust, disconnect or forget' },
      },
      required: ['mac', 'action'],
    },
  },
  {
    name: 'serial_talk',
    description: "Send a line down a serial/USB cable to a device and read what it answers — for an Arduino, an ESP32, a modem, a router console, a 3D printer, anything with a serial connection. Give `port` from hardware_inventory. `send` is text (a newline is added), or `hex` for raw bytes. Requires device level 2.",
    input_schema: {
      type: 'object',
      properties: {
        port: { type: 'string', description: 'COM3 on Windows, /dev/ttyUSB0 on Linux.' },
        send: { type: 'string', description: 'Text to send, e.g. "AT".' },
        hex: { type: 'string', description: 'Raw bytes as hex instead of text.' },
        baud: { type: 'number', description: 'Speed, default 115200.' },
        waitMs: { type: 'number', description: 'How long to wait for a reply, default 1500.' },
      },
      required: ['port'],
    },
  },
  {
    name: 'dev_libraries',
    description: "The household's stocked shelf of the best libraries for every programming language it works in. action 'catalog' returns the curated top libraries per language (Python, JS/TS, front-end/design, Rust, Go, Java, C#, PHP, Ruby, C/C++, Swift, Dart) and which package managers are installed on this machine; action 'download' fetches a language's set into a local folder using the installed manager (download only, no install scripts run). Use when the owner asks what the best library for X is, to set up a language, or to stock the machine.",
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', description: "'catalog' (default) or 'download'" },
        language: { type: 'string', description: 'python, javascript, typescript, frontend, rust, go, java, csharp, php, ruby, cpp, swift, dart' },
        names: { type: 'array', items: { type: 'string' }, description: 'Optional subset; omit to fetch the whole shelf for that language.' },
      },
    },
  },
  // ---- Language: grammar and letters ---------------------------------------
  {
    name: 'check_grammar',
    description: "Check Persian, English or German writing for real mistakes and give back a corrected version. Catches Persian half-space (نیم‌فاصله) and Arabic letters used in Persian words, English homophones and spelling, German das/dass, seit/seid and noun capitalisation. Use whenever someone asks you to check, correct or proofread something they wrote, or before sending anything they will show to other people. It returns each mistake with its position and a confidence — pass on the uncertain ones as questions, not corrections, and use your own judgement for anything a rule cannot catch (sentence structure, wrong case, clumsy phrasing).",
    input_schema: {
      type: 'object',
      properties: {
        text: { type: 'string' },
        language: { type: 'string', description: 'fa, en or de. Omit to detect it.' },
        apply: { type: 'string', description: '"sure" (default), "likely" or "all" — how bold the auto-correction should be.' },
      },
      required: ['text'],
    },
  },
  {
    name: 'letter_style',
    description: "Get the REAL conventions for writing a letter or e-mail in Persian, English or German at a given level of formality: the correct salutation, the closing, du/Sie or شما/تو, date placement and the layout rules. Call this BEFORE writing any letter or e-mail so it reads as genuinely written in that language instead of translated. For German letters to an authority (Amt, Jobcenter, Ausländerbehörde, Krankenkasse) set authority:true — those have extra rules that matter.",
    input_schema: {
      type: 'object',
      properties: {
        language: { type: 'string', description: 'fa, en or de' },
        formality: { type: 'string', description: 'formal or informal' },
        recipientName: { type: 'string', description: "The recipient's name, if known." },
        authority: { type: 'boolean', description: 'True for a government office or an institution.' },
      },
      required: ['language'],
    },
  },
  // ---- Devices, safety and the network -------------------------------------
  {
    name: 'scan_devices',
    description: "Find every device around this machine — plugged in over USB, paired over Bluetooth, drives and memory sticks, and everything on the home network (TVs, speakers, printers, phones, smart plugs). For network devices it also reports the manufacturer, model, firmware and the exact list of things that device will let you do. Use when the owner asks what is connected, what is on the Wi-Fi, or wants to control something.",
    input_schema: {
      type: 'object',
      properties: {
        transports: { type: 'array', items: { type: 'string' },
          description: 'Any of usb, bluetooth, drive, network. Omit for all of them.' },
        safety: { type: 'boolean', description: 'Also judge each device for risk (default true).' },
      },
    },
  },
  {
    name: 'device_command',
    description: "Send a command to a device that the owner has ALLOWED — play, pause, stop, next, previous, volume, mute, play_url. Call scan_devices first to get the device id and the list of commands that device actually supports. A device the owner has not allowed is refused; Setayesh never bypasses a device's own pairing.",
    input_schema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Device id from scan_devices.' },
        action: { type: 'string', description: 'play, pause, stop, next, previous, volume, mute, unmute, play_url, status' },
        value: { type: 'string', description: 'Volume 0–100, or the http URL for play_url.' },
      },
      required: ['id', 'action'],
    },
  },
  {
    name: 'scan_file_threats',
    description: "Check a file for signs of malicious code — hidden PowerShell, downloaders, reverse shells, ransomware behaviour, Office macros, a program disguised as a document. Use when the owner asks whether a download or an attachment is safe. This is heuristics, NOT an antivirus: always pass on that limitation with the answer.",
    input_schema: { type: 'object', properties: { path: { type: 'string' } }, required: ['path'] },
  },
  {
    name: 'network_status',
    description: "Report what network this house is on and whether it looks trustworthy: online or not, captive portal, DNS being redirected, and whether something is opening TLS traffic (a man in the middle). Use when the owner asks about the internet, a slow or strange connection, or whether a network is safe to use.",
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'emergency_internet',
    description: "When the house is offline, list the ways back online ranked best-first: networks already saved on this machine, then open ones, with the trade-off of each spelled out. It only LISTS them — connecting needs the owner to pick one and approve it, and a password he gives. Never presents a network as already joined.",
    input_schema: { type: 'object', properties: {} },
  },
  // ---- Big files, any extension --------------------------------------------
  // These four are how she reads a file that is far too big to paste into a
  // chat: open it to see its shape, search it to find where the answer is,
  // then read only that slice. A 300 MB log costs the same memory as a small
  // one, so "I can't read that, it's too big" stopped being an answer.
  {
    name: 'open_file',
    description: "Open a file on this machine BY PATH and get everything needed to work with it: type, size, encoding, line count, a structural map (functions, classes, headings, routes) and the first lines. Works on files of any size — nothing is loaded whole. Use this FIRST whenever the owner names a file or asks about code, a log, a document, a spreadsheet or a PDF on his computer. For .pdf/.docx/.xlsx/.pptx it returns the real content, not bytes.",
    input_schema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Full path to the file; ~ for the home folder.' },
        lines: { type: 'number', description: 'How many opening lines to include (default 120).' },
      },
      required: ['path'],
    },
  },
  {
    name: 'file_search',
    description: "Search inside a file of any size for text or a regular expression, returning matching lines with their line numbers and surrounding context. This is how you locate the relevant part of a big file before reading it. Streams the file, so a multi-gigabyte log is fine.",
    input_schema: {
      type: 'object',
      properties: {
        path: { type: 'string' },
        pattern: { type: 'string', description: 'Text to find, or a regular expression when regex is true.' },
        regex: { type: 'boolean' },
        context: { type: 'number', description: 'Lines of context around each hit (0–10, default 2).' },
        max: { type: 'number', description: 'Maximum hits to return (default 60).' },
      },
      required: ['path', 'pattern'],
    },
  },
  {
    name: 'file_slice',
    description: "Read an exact line range out of a file of any size, with line numbers. Use after open_file or file_search has told you WHERE to look. Reading 200 lines out of the middle of a 2 GB file is as cheap as reading a small file.",
    input_schema: {
      type: 'object',
      properties: {
        path: { type: 'string' },
        from: { type: 'number', description: 'First line (1-based).' },
        to: { type: 'number', description: 'Last line.' },
      },
      required: ['path', 'from'],
    },
  },
  {
    name: 'file_profile',
    description: "Statistics about a data file without loading it: for CSV/TSV every column's type, how many values are filled, unique counts, min/max/mean for numbers and example values for text; for JSON/JSONL the record shape; for logs and text the line statistics. Use before analysing a dataset so you know what is actually in it.",
    input_schema: { type: 'object', properties: { path: { type: 'string' } }, required: ['path'] },
  },
  {
    name: 'convert_any',
    description: "Convert a file ON DISK from one format to another and give the owner a download link — e.g. .docx to Markdown, PDF to text, CSV to Excel (.xlsx), Excel to CSV or JSON, JSON to CSV, Markdown to Word. Text, data, Office and PDF all work with nothing installed; image/audio/video conversion needs ffmpeg or ImageMagick on the machine and says so plainly if they are missing. Use file_formats to see what a given extension can become.",
    input_schema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'The source file on this machine.' },
        to: { type: 'string', description: 'Target extension, e.g. xlsx, csv, json, md, docx, html, txt.' },
        name: { type: 'string', description: 'Optional output filename without extension.' },
      },
      required: ['path', 'to'],
    },
  },
  {
    name: 'file_formats',
    description: "List which file extensions Setayesh understands and what each one can be converted into. Call this when the owner asks 'can you open X', 'what formats do you support', or before promising a conversion. Pass an extension to ask about just that one.",
    input_schema: {
      type: 'object',
      properties: { ext: { type: 'string', description: 'Optional single extension, e.g. "xlsx".' } },
    },
  },
  {
    // "Check my email" has to work regardless of HOW the mailbox is wired up.
    // The house has two independent paths — the Google connector (OAuth) and
    // a plain IMAP login with an App Password — and before this tool existed
    // the chat could only ever see the Google one, so an IMAP-only household
    // was told the mailbox did not exist. This tool takes whichever is
    // configured and working. Read-only by design.
    name: 'check_email',
    description: "Check the owner's inbox and list the most recent emails (sender, subject, date, and a short preview). This is THE tool to use whenever the owner asks about their email, mail or inbox — e.g. «ایمیل‌ها رو چک کن», 'any new mail?', 'what's in my inbox'. It works with whichever mailbox is set up on this machine (Google connector or IMAP). Read-only.",
    input_schema: {
      type: 'object',
      properties: { limit: { type: 'number', description: '1–25, default 10' } },
    },
  },
  {
    name: 'gmail_list',
    description: "List the most recent emails in the owner's connected Gmail inbox (sender, subject, date, a short snippet, and an id). Use when the owner asks what mail they have or to check their inbox. Only works once Google is connected in the Connectors panel.",
    input_schema: {
      type: 'object',
      properties: { limit: { type: 'number', description: '1–25, default 10' } },
    },
  },
  {
    name: 'gmail_read',
    description: "Read the full body of one Gmail message by its id (get the id from gmail_list first). Use to summarize or answer questions about a specific email.",
    input_schema: {
      type: 'object',
      properties: { id: { type: 'string' } },
      required: ['id'],
    },
  },
  {
    name: 'gmail_send',
    description: "Send an email from the owner's connected Gmail. Confirm the recipient, subject and content with the owner before sending. Plain text body.",
    input_schema: {
      type: 'object',
      properties: {
        to: { type: 'string', description: 'recipient email address' },
        subject: { type: 'string' },
        body: { type: 'string' },
      },
      required: ['to', 'body'],
    },
  },
  {
    name: 'calendar_list',
    description: "List the owner's upcoming Google Calendar events (title, start, end, location). Use when asked what's on the schedule or whether a time is free.",
    input_schema: {
      type: 'object',
      properties: { limit: { type: 'number', description: '1–25, default 10' } },
    },
  },
  {
    name: 'calendar_add',
    description: "Create a Google Calendar event / appointment. `start` (and optional `end`) accept an ISO date-time (2026-09-10T15:00:00) or a plain date (2026-09-10) for an all-day event; if `end` is omitted a timed event defaults to one hour. Confirm the details with the owner first.",
    input_schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        start: { type: 'string', description: 'ISO date-time or YYYY-MM-DD' },
        end: { type: 'string', description: 'optional ISO date-time or YYYY-MM-DD' },
        location: { type: 'string' },
        description: { type: 'string' },
      },
      required: ['title', 'start'],
    },
  },
  {
    name: 'recall',
    description: "Search this user's own saved notes and memories by meaning/keywords and get the most relevant snippets back. Use it to ground an answer in what the family has told you before (appointments, preferences, facts, projects) instead of guessing. Returns up to `limit` matches with a relevance score.",
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'what to look for' },
        limit: { type: 'number', description: '1–10, default 5' },
      },
      required: ['query'],
    },
  },
  {
    name: 'search_mind',
    description: "Setayesh's OWN internal search engine — a single strong index over EVERYTHING she knows: this user's long-term memories, past conversations, the family knowledge vault, and her own repositories (her source code, docs, and the module map of how she works). This is broader than `recall`. Use it liberally to ground yourself BEFORE answering — 'where did I save X', 'what do I know about Y', 'how does my own Z work', 'have we talked about this before'. Everything is local and private. Returns ranked hits with source, title and a snippet; each hit's `source` says where it came from (memory / chat / knowledge / vault / docs / self).",
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'what to look for, in the user\'s own words' },
        sources: { type: 'array', items: { type: 'string' }, description: "optional filter: any of memory, chat, knowledge, vault, docs, self" },
        limit: { type: 'number', description: '1–20, default 8' },
      },
      required: ['query'],
    },
  },
];

module.exports = { TOOLS_SPEC };
