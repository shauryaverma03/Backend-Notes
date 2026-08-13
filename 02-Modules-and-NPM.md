# 📗 02 — Modules & npm

---

## Module System in Node.js

A **module** is a reusable block of code whose existence does not accidentally impact other code. Node.js has two module systems:

---

## CommonJS (CJS) — Default in Node.js

### Exporting

```javascript
// math.js

// Method 1: module.exports (preferred for single export)
module.exports = function add(a, b) {
  return a + b;
};

// Method 2: module.exports as object
module.exports = {
  add: (a, b) => a + b,
  subtract: (a, b) => a - b,
};

// Method 3: exports shorthand (reference to module.exports)
exports.multiply = (a, b) => a * b;
exports.divide = (a, b) => a / b;

// ⚠️ COMMON MISTAKE — This BREAKS the reference:
// exports = { add }; ← Does NOT work! Use module.exports instead
```

### Importing

```javascript
// app.js
const math = require('./math');         // Local module
const fs = require('fs');                // Built-in module
const express = require('express');      // npm package

console.log(math.add(2, 3));            // 5
```

### How `require()` Works Internally

```
require('./math')
    ↓
1. Resolve path  → /home/user/project/math.js
2. Check cache   → Module already loaded? Return cached version
3. Load file     → Read file content
4. Wrap in IIFE  → (function(exports, require, module, __filename, __dirname) { ... })
5. Execute       → Run the wrapped code
6. Cache result  → Store in require.cache
7. Return        → module.exports
```

### Module Wrapper Function

Node.js wraps every module in this function:
```javascript
(function(exports, require, module, __filename, __dirname) {
  // Your module code actually lives here
});
```
This is why `__dirname`, `__filename`, `exports`, `require`, and `module` are available in every file.

---

## ES Modules (ESM) — Modern Standard

### Enable ESM

**Option 1:** Set `"type": "module"` in `package.json`
```json
{
  "type": "module"
}
```

**Option 2:** Use `.mjs` file extension

### Exporting (ESM)

```javascript
// utils.mjs

// Named exports
export const PI = 3.14159;
export function square(x) { return x * x; }

// Default export (one per file)
export default class Calculator {
  add(a, b) { return a + b; }
}
```

### Importing (ESM)

```javascript
// app.mjs
import Calculator, { PI, square } from './utils.mjs';
import * as utils from './utils.mjs';            // Import all as namespace
import { readFile } from 'fs/promises';           // Named import from built-in

const calc = new Calculator();
console.log(calc.add(2, 3));    // 5
console.log(PI);                // 3.14159
```

---

## CJS vs ESM — Comparison

| Feature | CommonJS | ES Modules |
|---------|----------|------------|
| Syntax | `require()` / `module.exports` | `import` / `export` |
| Loading | **Synchronous** | **Asynchronous** |
| When parsed | **Runtime** | **Parse time** (static analysis) |
| Tree Shaking | ❌ Not possible | ✅ Possible |
| Top-level await | ❌ | ✅ |
| `this` at top | `module.exports` | `undefined` |
| File extension | `.js`, `.cjs` | `.mjs` or `"type": "module"` |
| Default in Node | ✅ Yes | Opt-in |

---

## Built-in Modules (No Installation Needed)

```javascript
const fs = require('fs');            // File system
const path = require('path');        // File paths
const http = require('http');        // HTTP server/client
const https = require('https');      // HTTPS server/client
const os = require('os');            // Operating system info
const events = require('events');    // Event emitter
const crypto = require('crypto');    // Cryptography
const url = require('url');          // URL parsing
const querystring = require('querystring'); // Query string parsing
const util = require('util');        // Utility functions
const stream = require('stream');    // Streams
const zlib = require('zlib');        // Compression
const child_process = require('child_process'); // Spawn processes
const cluster = require('cluster');  // Multi-process
const worker_threads = require('worker_threads'); // Multi-threading
const dns = require('dns');          // DNS lookups
const net = require('net');          // TCP sockets
```

### `path` Module (Very Commonly Used)

```javascript
const path = require('path');

path.join('/users', 'john', 'docs', 'file.txt');
// → '/users/john/docs/file.txt' (OS-aware)

path.resolve('docs', 'file.txt');
// → '/absolute/path/to/docs/file.txt'

path.basename('/users/john/file.txt');     // → 'file.txt'
path.dirname('/users/john/file.txt');      // → '/users/john'
path.extname('/users/john/file.txt');      // → '.txt'

path.parse('/users/john/file.txt');
// → { root: '/', dir: '/users/john', base: 'file.txt', ext: '.txt', name: 'file' }
```

### `os` Module

```javascript
const os = require('os');

os.cpus();          // CPU info (array of cores)
os.totalmem();      // Total RAM in bytes
os.freemem();       // Free RAM in bytes
os.homedir();       // Home directory
os.hostname();      // Machine hostname
os.platform();      // 'darwin', 'win32', 'linux'
os.arch();          // 'x64', 'arm64'
os.uptime();        // System uptime in seconds
```

### `crypto` Module

```javascript
const crypto = require('crypto');

// Hash a string
const hash = crypto.createHash('sha256').update('password').digest('hex');

// Random bytes
const token = crypto.randomBytes(32).toString('hex');

// UUID
const uuid = crypto.randomUUID(); // 'a1b2c3d4-...'

// HMAC
const hmac = crypto.createHmac('sha256', 'secret-key')
  .update('message')
  .digest('hex');
```

---

## npm (Node Package Manager)

### package.json — The Heart of Any Node.js Project

```bash
npm init          # Interactive setup
npm init -y       # Default setup (accept all defaults)
```

```json
{
  "name": "my-backend",
  "version": "1.0.0",
  "description": "My backend project",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js",
    "test": "jest"
  },
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^7.5.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.0",
    "jest": "^29.7.0"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

### Common npm Commands

```bash
# Install packages
npm install express              # Install & add to dependencies
npm install nodemon --save-dev   # Install & add to devDependencies
npm install -g nodemon           # Install globally
npm install                      # Install all from package.json

# Shortcuts
npm i express                    # Same as npm install express
npm i -D nodemon                 # Same as --save-dev

# Remove
npm uninstall express            # Remove package

# Update
npm update                       # Update all packages
npm outdated                     # Check for outdated packages

# Info
npm list                         # List installed packages
npm list --depth=0               # Top-level only
npm info express                 # Package details

# Scripts
npm run dev                      # Run custom script
npm start                        # Run start script (shorthand)
npm test                         # Run test script (shorthand)
```

### Semantic Versioning (SemVer)

```
MAJOR.MINOR.PATCH
  4  .  18 .  2

MAJOR → Breaking changes (not backward compatible)
MINOR → New features (backward compatible)
PATCH → Bug fixes (backward compatible)
```

**Version Ranges in package.json:**
```
"^4.18.2"  → >=4.18.2 and <5.0.0  (minor + patch updates allowed)
"~4.18.2"  → >=4.18.2 and <4.19.0 (only patch updates allowed)
"4.18.2"   → Exactly 4.18.2
"*"        → Any version
">=4.0.0"  → 4.0.0 or higher
```

### package-lock.json

- **Auto-generated** — DO NOT edit manually
- Locks **exact versions** of all dependencies (including sub-dependencies)
- Ensures identical installs across different machines
- **Always commit** to version control

### node_modules

- Directory where all packages are installed
- **Never commit** to git — add to `.gitignore`
- Recreated from `package.json` + `package-lock.json` via `npm install`

```gitignore
# .gitignore
node_modules/
.env
```

---

## npx — Execute npm Packages

```bash
npx nodemon index.js        # Run without installing globally
npx create-react-app my-app # Run package binary directly
npx -y cowsay "Hello"       # Auto-install and run
```

---

## 🎯 Interview Tips

> **Q: What is the difference between `dependencies` and `devDependencies`?**
> `dependencies` are needed in production (express, mongoose). `devDependencies` are only for development (nodemon, jest, eslint). In production, `npm install --production` skips devDependencies.

> **Q: What is the Module Wrapper Function?**
> Node wraps every module in `(function(exports, require, module, __filename, __dirname) { ... })`. This provides module-level scope and gives access to those 5 parameters.

> **Q: Why use `path.join()` instead of string concatenation?**
> `path.join()` handles OS-specific path separators (`/` vs `\`), resolves `..` and `.`, and prevents double-slash issues. String concatenation can break across operating systems.

---
