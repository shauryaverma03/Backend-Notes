# 📗 21 — Top Interview Questions & Answers

---

## Node.js Core

### Q1: What is Node.js? Why use it?
Node.js is a JavaScript runtime built on V8 engine that executes JS outside the browser. It uses event-driven, non-blocking I/O, making it ideal for I/O-heavy applications like APIs, chat apps, and streaming.

### Q2: Is Node.js single-threaded? How does it handle concurrency?
Yes, Node.js has a single main thread for JavaScript execution. But it handles concurrency through:
- **Event loop** for scheduling async callbacks
- **libuv thread pool** (4 threads by default) for heavy I/O (file, DNS, crypto)
- **OS kernel** for network async operations (epoll/kqueue/IOCP)

### Q3: What is the Event Loop? Explain its phases.
The event loop is a mechanism that processes callbacks in this order:
1. **Timers** — `setTimeout`, `setInterval`
2. **Pending Callbacks** — deferred I/O callbacks
3. **Poll** — retrieve new I/O events, execute I/O callbacks
4. **Check** — `setImmediate()`
5. **Close** — `socket.on('close')`

Between each phase, **microtask queues** run: `process.nextTick()` first, then `Promise` callbacks.

### Q4: Difference between `process.nextTick()` and `setImmediate()`?
- `process.nextTick()` fires **before** any I/O event or timer, between event loop phases
- `setImmediate()` fires in the **Check phase**, after I/O events
- `nextTick` has higher priority and can starve the event loop if called recursively

### Q5: What are Streams? Types of Streams?
Streams handle data in chunks, not all at once. Types:
- **Readable** — data source (fs.createReadStream)
- **Writable** — data destination (fs.createWriteStream)
- **Duplex** — both read and write (TCP socket)
- **Transform** — modify data passing through (zlib.createGzip)

### Q6: CommonJS vs ES Modules?
- **CommonJS**: `require()`/`module.exports`, synchronous loading, runtime resolution
- **ES Modules**: `import`/`export`, asynchronous loading, static analysis (tree shaking possible), top-level await

---

## Express.js

### Q7: What is middleware in Express?
Functions that have access to `req`, `res`, and `next`. They execute in order during the request-response cycle. Types: application-level, router-level, error-handling (4 params), built-in, third-party.

### Q8: How does error handling work in Express?
Error-handling middleware has 4 parameters: `(err, req, res, next)`. You trigger it by calling `next(err)`. Use `catchAsync` wrapper to avoid try-catch in every async route.

### Q9: What is the difference between `app.use()` and `app.get()`?
- `app.use()` matches ALL HTTP methods and matches sub-paths (`/api` matches `/api/users`)
- `app.get()` only matches GET requests to the exact path

### Q10: Explain the MVC pattern.
- **Model** — data layer (Mongoose schemas, database logic)
- **View** — presentation layer (EJS templates, JSON responses)
- **Controller** — business logic (handles requests, calls models, sends responses)

---

## Databases

### Q11: SQL vs NoSQL — when to use which?
**SQL** (PostgreSQL, MySQL): Complex relationships, ACID transactions, structured data, reporting/analytics.
**NoSQL** (MongoDB): Flexible schemas, rapid development, hierarchical data, horizontal scaling, high write throughput.

### Q12: What is indexing? Why is it important?
Indexes are data structures (B-tree) that speed up read queries by allowing the database to find records without scanning every row. Trade-off: faster reads, slower writes (index must be updated), more storage.

### Q13: What is the N+1 query problem?
Fetching N records, then making N extra queries for related data. Solution: use JOIN (SQL), `populate()` (Mongoose), or `$lookup` (MongoDB aggregation) to fetch all data in 1-2 queries.

### Q14: What are ACID properties?
- **Atomicity**: All operations succeed or all fail (no partial updates)
- **Consistency**: Database always moves from one valid state to another
- **Isolation**: Concurrent transactions don't interfere with each other
- **Durability**: Committed data survives system crashes

### Q15: What is normalization?
Organizing data to reduce redundancy and improve integrity:
- **1NF**: Atomic values in each cell
- **2NF**: No partial dependencies on composite key
- **3NF**: No transitive dependencies between non-key columns

### Q16: Explain MongoDB aggregation pipeline.
A sequence of stages that process and transform documents:
`$match` (filter) → `$group` (aggregate) → `$sort` → `$project` (reshape) → `$limit`. Each stage passes its output to the next.

---

## Authentication & Security

### Q17: How does JWT authentication work?
1. User logs in with credentials
2. Server verifies and generates a JWT (header.payload.signature)
3. Client stores JWT and sends it in `Authorization: Bearer <token>` header
4. Server verifies the signature and extracts user info from payload
5. No server-side session storage needed (stateless)

### Q18: Session-based vs Token-based auth?
| | Sessions | JWT |
|-|----------|-----|
| Storage | Server (memory/DB) | Client |
| Scalability | Needs shared store | Any server can verify |
| Logout | Easy (delete session) | Hard (token valid until expiry) |
| Best for | SSR web apps | APIs, mobile, microservices |

### Q19: Where to store JWT — localStorage vs cookies?
**httpOnly cookies** are more secure because:
- Not accessible via JavaScript (immune to XSS)
- `secure` flag ensures HTTPS only
- `sameSite` flag prevents CSRF
localStorage is vulnerable to XSS attacks (any JS can read it).

### Q20: What is CORS? How to handle it?
Cross-Origin Resource Sharing — browser security that blocks requests from different origins. Server must explicitly allow origins via `Access-Control-Allow-Origin` header. Use the `cors` npm package with whitelist of allowed origins.

### Q21: How to prevent SQL injection?
Always use **parameterized queries** (`$1`, `?` placeholders). Never concatenate user input into SQL strings. Use ORM/query builder.

### Q22: What is XSS and how to prevent it?
Cross-Site Scripting — injecting malicious scripts. Prevention: input sanitization, output encoding (escape HTML), `httpOnly` cookies, Content-Security-Policy header, `helmet` middleware.

### Q23: What is CSRF and how to prevent it?
Cross-Site Request Forgery — tricking authenticated users into unwanted actions. Prevention: `sameSite: 'strict'` cookies, CSRF tokens, check `Origin`/`Referer` headers.

### Q24: Why use bcrypt over SHA-256 for passwords?
bcrypt is intentionally **slow** (adjustable cost factor), making brute force impractical. SHA-256 is fast (billions per second). bcrypt also automatically includes a unique salt per password.

### Q25: What is the refresh token pattern?
- **Access token**: short-lived (15min), sent with every request
- **Refresh token**: long-lived (7 days), stored in httpOnly cookie
- When access token expires, use refresh token to get a new one
- Avoids frequent re-login while keeping access tokens short-lived

---

## API Design

### Q26: What makes an API RESTful?
- Uses HTTP methods correctly (GET=read, POST=create, PUT=replace, PATCH=update, DELETE=delete)
- Resource-based URLs with nouns (/users not /getUsers)
- Stateless — each request contains all info needed
- Proper status codes (200, 201, 400, 401, 404, 500)
- Consistent response format

### Q27: PUT vs PATCH?
- **PUT**: Replace the **entire** resource (send all fields)
- **PATCH**: Update **specific fields** only (partial update)

### Q28: 401 vs 403?
- **401 Unauthorized**: "Who are you?" — not authenticated (no/invalid token)
- **403 Forbidden**: "I know you, but no." — authenticated but no permission

### Q29: How to handle API versioning?
1. **URL**: `/api/v1/users` (most common)
2. **Header**: `Accept: application/vnd.api.v2+json`
3. **Query**: `/api/users?version=2`

---

## Performance & Scaling

### Q30: How to scale a Node.js application?
1. **Cluster mode** (PM2) — use all CPU cores
2. **Load balancer** (Nginx) — multiple servers
3. **Caching** (Redis) — reduce DB queries
4. **DB optimization** — indexes, query optimization
5. **CDN** — static assets
6. **Microservices** — independent scaling
7. **Message queues** — async processing

### Q31: What is Redis? Use cases?
In-memory key-value store. Use cases:
- Caching (API responses, DB queries)
- Session storage
- Rate limiting
- Job queues (BullMQ)
- Pub/Sub messaging
- Leaderboards (sorted sets)

### Q32: What is a message queue?
Asynchronous communication between services. Producer puts messages in queue, consumer processes them independently. Enables: decoupling, load leveling, fault tolerance. Tools: RabbitMQ, Kafka, BullMQ.

### Q33: What is a reverse proxy?
Server (Nginx) that sits in front of your application. Benefits: SSL termination, load balancing, caching, security, serving static files. Client talks to Nginx, Nginx forwards to Node.js.

### Q34: Monolith vs Microservices?
**Monolith**: Single codebase, simple, good for small teams. **Microservices**: Independent services, independently scalable, complex operations. Start monolith, migrate to microservices when needed.

### Q35: What is the CAP theorem?
In distributed systems, choose 2 of 3: **Consistency**, **Availability**, **Partition Tolerance**. Since partitions are inevitable, choose CP (strong consistency) or AP (high availability with eventual consistency).

---

## Real-time & Advanced

### Q36: WebSocket vs HTTP?
HTTP: request-response, one-direction at a time, new connection per request. WebSocket: persistent, full-duplex (bidirectional), low latency. Use WebSocket for chat, live updates, gaming.

### Q37: What is Socket.io?
Library for real-time bidirectional communication. Uses WebSocket with automatic fallback to HTTP long-polling. Features: rooms, namespaces, broadcasting, auto-reconnection.

### Q38: How does file upload work in Node.js?
Use **Multer** middleware. It handles `multipart/form-data`. Options: disk storage (local), memory storage (buffer for cloud upload). Always validate file type and size. Use Cloudinary/S3 for production.

---

## Coding Questions

### Q39: Implement a custom Promise

```javascript
class MyPromise {
  constructor(executor) {
    this.state = 'pending';
    this.value = undefined;
    this.callbacks = [];

    const resolve = (value) => {
      if (this.state !== 'pending') return;
      this.state = 'fulfilled';
      this.value = value;
      this.callbacks.forEach(cb => cb.onFulfilled(value));
    };

    const reject = (reason) => {
      if (this.state !== 'pending') return;
      this.state = 'rejected';
      this.value = reason;
      this.callbacks.forEach(cb => cb.onRejected(reason));
    };

    try {
      executor(resolve, reject);
    } catch (err) {
      reject(err);
    }
  }

  then(onFulfilled, onRejected) {
    return new MyPromise((resolve, reject) => {
      const handle = () => {
        try {
          if (this.state === 'fulfilled') {
            const result = onFulfilled ? onFulfilled(this.value) : this.value;
            resolve(result);
          }
          if (this.state === 'rejected') {
            if (onRejected) {
              const result = onRejected(this.value);
              resolve(result);
            } else {
              reject(this.value);
            }
          }
        } catch (err) {
          reject(err);
        }
      };

      if (this.state === 'pending') {
        this.callbacks.push({ onFulfilled: () => handle(), onRejected: () => handle() });
      } else {
        queueMicrotask(handle);
      }
    });
  }

  catch(onRejected) {
    return this.then(null, onRejected);
  }
}
```

### Q40: Implement rate limiter middleware

```javascript
function rateLimiter(maxRequests, windowMs) {
  const store = new Map();

  return (req, res, next) => {
    const key = req.ip;
    const now = Date.now();

    if (!store.has(key)) {
      store.set(key, []);
    }

    const timestamps = store.get(key).filter(t => now - t < windowMs);
    store.set(key, timestamps);

    if (timestamps.length >= maxRequests) {
      return res.status(429).json({ error: 'Too many requests' });
    }

    timestamps.push(now);
    next();
  };
}
```

### Q41: Implement a simple event emitter

```javascript
class EventEmitter {
  constructor() {
    this.events = {};
  }

  on(event, listener) {
    if (!this.events[event]) this.events[event] = [];
    this.events[event].push(listener);
    return this;
  }

  emit(event, ...args) {
    if (this.events[event]) {
      this.events[event].forEach(listener => listener(...args));
    }
    return this;
  }

  off(event, listener) {
    if (this.events[event]) {
      this.events[event] = this.events[event].filter(l => l !== listener);
    }
    return this;
  }

  once(event, listener) {
    const wrapper = (...args) => {
      listener(...args);
      this.off(event, wrapper);
    };
    this.on(event, wrapper);
    return this;
  }
}
```

---

## Quick Revision — One-Liners

| Topic | Key Point |
|-------|-----------|
| Node.js | Single-threaded, non-blocking, event-driven JS runtime on V8 |
| Event Loop | Processes async callbacks in phases: Timers → Poll → Check |
| npm | Package manager; `package.json` defines project; `node_modules` has installed code |
| Express | Minimal web framework; routing + middleware |
| Middleware | Functions with `(req, res, next)` that run in order |
| REST | HTTP methods + nouns + status codes + stateless |
| MongoDB | NoSQL document DB; Mongoose for ODM |
| SQL | Relational DB; tables + JOINs + ACID |
| bcrypt | Slow hash for passwords; salt + rounds |
| JWT | Stateless token: header.payload.signature; self-contained |
| Cookies | Auto-sent with requests; `httpOnly` + `secure` + `sameSite` |
| Sessions | Server-side state; client gets session ID in cookie |
| CORS | Server allows specific origins for cross-origin requests |
| XSS | Script injection; prevent with sanitization + CSP |
| CSRF | Exploit authenticated sessions; prevent with sameSite cookies |
| Redis | In-memory cache; sessions, rate limiting, queues |
| WebSocket | Persistent bidirectional connection for real-time |
| Docker | Containerize app with dependencies for consistent deployment |
| PM2 | Process manager; cluster mode uses all CPU cores |
| Load Balancer | Distributes requests across servers (Nginx) |
| Microservices | Independent services; scale, deploy, tech stack independently |

---

### 🎯 All the best for your placements! 🚀

---
