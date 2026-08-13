# 📗 03 — File System & Streams

---

## The `fs` Module

The `fs` module allows interaction with the file system. Every method has 3 versions:

| Version | Suffix | When to Use |
|---------|--------|-------------|
| Asynchronous (callback) | `fs.readFile()` | Default — non-blocking |
| Synchronous | `fs.readFileSync()` | Scripts, CLI tools (blocks event loop) |
| Promise-based | `fs.promises.readFile()` | Modern async/await code |

```javascript
const fs = require('fs');
const fsPromises = require('fs').promises; // or require('fs/promises');
```

---

## Reading Files

```javascript
// 1. Callback
fs.readFile('data.txt', 'utf8', (err, data) => {
  if (err) throw err;
  console.log(data);
});

// 2. Synchronous (blocks!)
const data = fs.readFileSync('data.txt', 'utf8');
console.log(data);

// 3. Promises + async/await (recommended)
async function readFile() {
  try {
    const data = await fsPromises.readFile('data.txt', 'utf8');
    console.log(data);
  } catch (err) {
    console.error(err);
  }
}
```

> Without `'utf8'` encoding, `readFile` returns a **Buffer** (raw binary data), not a string.

---

## Writing Files

```javascript
// Overwrite entire file (creates if doesn't exist)
fs.writeFileSync('output.txt', 'Hello World');

// Append to file
fs.appendFileSync('log.txt', 'New log entry\n');

// Async write
await fsPromises.writeFile('output.txt', 'Hello World');

// Write with options
fs.writeFileSync('output.txt', 'data', {
  encoding: 'utf8',
  flag: 'w',    // 'w' = write (overwrite), 'a' = append, 'r' = read
  mode: 0o644,  // Unix file permissions
});
```

---

## Directory Operations

```javascript
// Create directory
fs.mkdirSync('new-folder');
fs.mkdirSync('path/to/nested/folder', { recursive: true }); // Create nested

// Read directory contents
const files = fs.readdirSync('./');
console.log(files); // ['index.js', 'package.json', ...]

// Remove directory
fs.rmdirSync('empty-folder');
fs.rmSync('folder-with-contents', { recursive: true, force: true }); // rm -rf

// Check if exists
fs.existsSync('./data.txt'); // true or false
```

---

## File Info & Operations

```javascript
// File stats
const stats = fs.statSync('file.txt');
stats.isFile();          // true
stats.isDirectory();     // false
stats.size;              // Size in bytes
stats.birthtime;         // Created time
stats.mtime;             // Modified time

// Rename/Move
fs.renameSync('old.txt', 'new.txt');

// Copy
fs.copyFileSync('source.txt', 'dest.txt');

// Delete file
fs.unlinkSync('file.txt');

// Watch for changes
fs.watch('file.txt', (eventType, filename) => {
  console.log(`${filename} was ${eventType}`);
});
```

---

## Streams

Streams handle data in **chunks** instead of loading the entire content into memory. Essential for large files, network data, and real-time processing.

### Why Streams?

```javascript
// ❌ Without streams — loads entire 2GB file into RAM
const data = fs.readFileSync('huge-file.txt');

// ✅ With streams — processes in small chunks (64KB default)
const stream = fs.createReadStream('huge-file.txt');
stream.on('data', (chunk) => {
  console.log(`Received ${chunk.length} bytes`);
});
```

### Types of Streams

| Type | Description | Example |
|------|-------------|---------|
| **Readable** | Source of data | `fs.createReadStream()`, HTTP request |
| **Writable** | Destination for data | `fs.createWriteStream()`, HTTP response |
| **Duplex** | Both readable and writable | TCP socket |
| **Transform** | Modify data as it passes through | `zlib.createGzip()` |

### Readable Stream

```javascript
const readable = fs.createReadStream('big-file.txt', {
  encoding: 'utf8',
  highWaterMark: 16 * 1024, // Chunk size: 16KB (default: 64KB)
});

readable.on('data', (chunk) => {
  console.log(`Chunk: ${chunk.length} bytes`);
});

readable.on('end', () => {
  console.log('Done reading');
});

readable.on('error', (err) => {
  console.error('Error:', err);
});
```

### Writable Stream

```javascript
const writable = fs.createWriteStream('output.txt');

writable.write('First line\n');
writable.write('Second line\n');
writable.end('Last line\n'); // Signal end

writable.on('finish', () => {
  console.log('Done writing');
});
```

### Piping (Connecting Streams)

```javascript
const readable = fs.createReadStream('input.txt');
const writable = fs.createWriteStream('output.txt');

// Pipe: readable → writable
readable.pipe(writable);

// Chaining pipes (e.g., read → compress → write)
const zlib = require('zlib');

fs.createReadStream('input.txt')
  .pipe(zlib.createGzip())               // Transform stream
  .pipe(fs.createWriteStream('input.txt.gz'))
  .on('finish', () => console.log('Compressed!'));
```

### pipeline() — Better Error Handling

```javascript
const { pipeline } = require('stream/promises');
const zlib = require('zlib');

async function compress() {
  await pipeline(
    fs.createReadStream('input.txt'),
    zlib.createGzip(),
    fs.createWriteStream('input.txt.gz')
  );
  console.log('Pipeline succeeded');
}
compress().catch(console.error);
```

---

## Buffer

A **Buffer** is a fixed-size chunk of binary data (array of bytes). Used when dealing with raw binary data — files, network packets, images.

```javascript
// Create buffers
const buf1 = Buffer.alloc(10);                    // 10 bytes, filled with 0
const buf2 = Buffer.from('Hello');                 // From string
const buf3 = Buffer.from([72, 101, 108, 108, 111]); // From array of bytes

// Convert
buf2.toString('utf8');     // 'Hello'
buf2.toString('hex');      // '48656c6c6f'
buf2.toString('base64');   // 'SGVsbG8='

// Properties
buf2.length;               // 5 (bytes, not characters)
buf2[0];                   // 72 (ASCII of 'H')

// Compare
Buffer.compare(buf1, buf2); // -1, 0, or 1
buf2.equals(buf3);           // true

// Concatenate
const combined = Buffer.concat([buf2, Buffer.from(' World')]);
console.log(combined.toString()); // 'Hello World'
```

---

## EventEmitter

The foundation of Node.js event-driven architecture. Many built-in modules (streams, http) extend EventEmitter.

```javascript
const EventEmitter = require('events');

// Create emitter
const emitter = new EventEmitter();

// Register listener
emitter.on('userJoined', (username) => {
  console.log(`${username} joined!`);
});

// Register one-time listener
emitter.once('firstVisit', () => {
  console.log('Welcome! This fires only once.');
});

// Emit event
emitter.emit('userJoined', 'John');    // "John joined!"
emitter.emit('firstVisit');             // "Welcome! This fires only once."
emitter.emit('firstVisit');             // Nothing happens (once)

// Remove listener
const handler = () => console.log('hi');
emitter.on('greet', handler);
emitter.removeListener('greet', handler);

// List events
emitter.eventNames();                   // ['userJoined', ...]
emitter.listenerCount('userJoined');    // 1
```

### Creating Custom Event-Driven Class

```javascript
class UserService extends EventEmitter {
  createUser(name) {
    // ... create user in DB
    const user = { id: 1, name };
    this.emit('userCreated', user);  // Emit event
    return user;
  }
}

const service = new UserService();
service.on('userCreated', (user) => {
  console.log(`Send welcome email to ${user.name}`);
});
service.on('userCreated', (user) => {
  console.log(`Log: User ${user.name} created`);
});

service.createUser('Alice');
// Send welcome email to Alice
// Log: User Alice created
```

---

## 🎯 Interview Tips

> **Q: Why use streams instead of `readFile`?**
> `readFile` loads the entire file into memory. For a 2GB file, that's 2GB of RAM. Streams process data in chunks (default 64KB), keeping memory usage constant regardless of file size. Essential for video streaming, large file processing, and real-time data.

> **Q: What is backpressure in streams?**
> When the writable stream can't consume data as fast as the readable stream produces it. `pipe()` handles this automatically by pausing the readable stream when the writable stream's internal buffer is full.

> **Q: What is the difference between `on` and `once`?**
> `on` registers a listener that fires every time the event is emitted. `once` registers a listener that fires only the first time.

---
