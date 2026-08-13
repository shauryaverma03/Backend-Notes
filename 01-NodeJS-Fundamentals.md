# 📗 01 — Node.js Fundamentals

---

## What is Node.js?

Node.js is a **JavaScript runtime** built on Chrome's **V8 JavaScript engine**. It allows you to run JavaScript **outside the browser** — on servers, CLIs, and more.

### Key Characteristics

| Feature | Description |
|---------|-------------|
| **Single-threaded** | Uses one main thread with an event loop |
| **Non-blocking I/O** | Asynchronous operations don't block the main thread |
| **Event-driven** | Uses events and callbacks to handle async operations |
| **Cross-platform** | Works on Windows, Linux, macOS |
| **npm ecosystem** | Largest package registry in the world |

---

## V8 Engine

- Written in **C++** by Google
- Compiles JavaScript directly to **machine code** (no interpreter)
- Uses **JIT (Just-In-Time)** compilation
- Node.js wraps V8 and adds APIs for file system, networking, etc.

```
JavaScript Code → V8 Engine → Machine Code → CPU
```

---

## How Node.js Works Internally

```
┌─────────────────────────┐
│      Your JS Code       │
└────────────┬────────────┘
             ▼
┌─────────────────────────┐
│     Node.js Bindings    │  ← C++ bindings (fs, http, crypto)
└────────────┬────────────┘
             ▼
┌─────────────────────────┐
│        libuv            │  ← Async I/O, Event Loop, Thread Pool
└─────────────────────────┘
```

### libuv
- C library that provides the **event loop** and **async I/O**
- Maintains a **thread pool** (default 4 threads) for heavy tasks like file I/O, DNS lookups, compression
- Handles OS-level async operations (epoll on Linux, kqueue on macOS, IOCP on Windows)

---

## ⭐ The Event Loop (Most Important Interview Topic)

The event loop is the heart of Node.js. It processes callbacks and events in a specific order.

### Event Loop Phases

```
   ┌───────────────────────────┐
┌─▶│         Timers             │  ← setTimeout, setInterval callbacks
│  └─────────────┬─────────────┘
│  ┌─────────────▼─────────────┐
│  │     Pending Callbacks      │  ← I/O callbacks deferred from previous cycle
│  └─────────────┬─────────────┘
│  ┌─────────────▼─────────────┐
│  │     Idle, Prepare          │  ← Internal use only
│  └─────────────┬─────────────┘
│  ┌─────────────▼─────────────┐
│  │         Poll               │  ← Retrieve new I/O events; execute I/O callbacks
│  └─────────────┬─────────────┘
│  ┌─────────────▼─────────────┐
│  │         Check              │  ← setImmediate() callbacks
│  └─────────────┬─────────────┘
│  ┌─────────────▼─────────────┐
│  │    Close Callbacks         │  ← socket.on('close'), etc.
│  └─────────────┬─────────────┘
└────────────────┘
```

### Microtask Queues (Run BETWEEN each phase)

```
1. process.nextTick() queue    ← Highest priority
2. Promise .then() / .catch()  ← Second priority
3. Next event loop phase
```

### Classic Interview Question — Predict the Output

```javascript
console.log('1');

setTimeout(() => console.log('2'), 0);

Promise.resolve().then(() => console.log('3'));

process.nextTick(() => console.log('4'));

console.log('5');
```

**Output:**
```
1
5
4
3
2
```

**Explanation:**
1. `console.log('1')` — synchronous, runs first
2. `console.log('5')` — synchronous, runs next
3. `process.nextTick` — microtask queue (highest priority), runs before promises
4. `Promise.then` — microtask queue (after nextTick)
5. `setTimeout` — timer phase of next event loop iteration

---

## Asynchronous Patterns in Node.js

### 1. Callbacks (Old Way)

```javascript
const fs = require('fs');

fs.readFile('file.txt', 'utf8', (err, data) => {
  if (err) {
    console.error('Error:', err);
    return;
  }
  console.log(data);
});
```

**Callback Hell (Problem):**
```javascript
fs.readFile('file1.txt', (err, data1) => {
  fs.readFile('file2.txt', (err, data2) => {
    fs.readFile('file3.txt', (err, data3) => {
      // Deeply nested — hard to read and maintain
    });
  });
});
```

### 2. Promises (Better Way)

```javascript
const fs = require('fs').promises;

fs.readFile('file.txt', 'utf8')
  .then(data => console.log(data))
  .catch(err => console.error(err));
```

**Creating a Promise:**
```javascript
function fetchUser(id) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (id > 0) {
        resolve({ id, name: 'John' });
      } else {
        reject(new Error('Invalid ID'));
      }
    }, 1000);
  });
}

fetchUser(1)
  .then(user => console.log(user))
  .catch(err => console.error(err));
```

**Promise Combinators:**
```javascript
// Wait for ALL promises to resolve
Promise.all([p1, p2, p3])
  .then(([r1, r2, r3]) => console.log(r1, r2, r3));

// First promise to settle (resolve or reject)
Promise.race([p1, p2, p3])
  .then(result => console.log(result));

// Wait for all to settle (never rejects)
Promise.allSettled([p1, p2, p3])
  .then(results => console.log(results));

// First promise to RESOLVE (ignores rejections)
Promise.any([p1, p2, p3])
  .then(result => console.log(result));
```

### 3. Async/Await (Best Way — Syntactic Sugar over Promises)

```javascript
const fs = require('fs').promises;

async function readFiles() {
  try {
    const data1 = await fs.readFile('file1.txt', 'utf8');
    const data2 = await fs.readFile('file2.txt', 'utf8');
    console.log(data1, data2);
  } catch (err) {
    console.error('Error:', err);
  }
}

readFiles();
```

**Parallel Execution with async/await:**
```javascript
async function fetchAll() {
  // ❌ Sequential — slow
  const user = await fetchUser();
  const posts = await fetchPosts();

  // ✅ Parallel — fast
  const [user, posts] = await Promise.all([
    fetchUser(),
    fetchPosts()
  ]);
}
```

---

## Global Objects in Node.js

```javascript
// These are available everywhere (no require needed)

__dirname      // Absolute path of the directory containing the current file
__filename     // Absolute path of the current file
process        // Info about the current Node.js process
console        // Console output methods
setTimeout     // Schedule a callback after delay
setInterval    // Schedule a callback repeatedly
setImmediate   // Execute in the Check phase of event loop
Buffer         // Handle binary data
global         // The global object (like `window` in browser)
```

### The `process` Object

```javascript
process.env           // Environment variables
process.argv          // Command-line arguments
process.cwd()         // Current working directory
process.pid           // Process ID
process.exit(0)       // Exit with code 0 (success)
process.exit(1)       // Exit with code 1 (error)
process.memoryUsage() // RAM usage stats
process.uptime()      // Seconds since process started
process.version       // Node.js version
process.platform      // 'darwin', 'win32', 'linux'

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught:', err);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
  process.exit(1);
});
```

---

## REPL (Read-Eval-Print Loop)

```bash
$ node          # Enter REPL
> 2 + 2
4
> .help         # Show commands
> .exit         # Exit REPL
```

---

## Node.js vs Browser JavaScript

| Feature | Browser | Node.js |
|---------|---------|---------|
| DOM | ✅ `document`, `window` | ❌ Not available |
| File System | ❌ (sandboxed) | ✅ `fs` module |
| HTTP Server | ❌ | ✅ `http` module |
| Global Object | `window` | `global` |
| Module System | ES Modules | CommonJS + ES Modules |
| `this` in top-level | `window` | `module.exports` (or `{}` in ESM) |

---

## 🎯 Interview Tips

> **Q: Why is Node.js single-threaded but still fast?**
> Because it uses non-blocking I/O. While one request waits for database response, Node processes other requests. The event loop + libuv thread pool handle concurrency without creating a new thread per request.

> **Q: When NOT to use Node.js?**
> CPU-intensive tasks (image/video processing, machine learning, heavy computation) because they block the single thread. Use Worker Threads or offload to a different service for such tasks.

> **Q: What is the difference between `process.nextTick()` and `setImmediate()`?**
> `process.nextTick()` fires BEFORE any I/O event or timer. `setImmediate()` fires in the Check phase AFTER the Poll phase. nextTick has higher priority.

---
