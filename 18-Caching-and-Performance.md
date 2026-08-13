# 📗 18 — Caching & Performance

---

## Why Caching?

```
Without cache:  Client → Server → Database → Server → Client  (100ms)
With cache:     Client → Server → Cache → Server → Client      (5ms)
```

---

## Types of Caching

| Type | Where | Example |
|------|-------|---------|
| **Browser Cache** | Client | Cache-Control headers |
| **CDN Cache** | Edge servers | CloudFront, Cloudflare |
| **Application Cache** | Server memory | node-cache, Map |
| **Distributed Cache** | Separate server | Redis, Memcached |
| **Database Cache** | DB query cache | MongoDB WiredTiger, PostgreSQL |

---

## In-Memory Cache (Simple)

```bash
npm install node-cache
```

```javascript
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 300 }); // 5 min default TTL

// Middleware
const cacheMiddleware = (duration) => (req, res, next) => {
  const key = req.originalUrl;
  const cached = cache.get(key);

  if (cached) {
    console.log('Cache HIT');
    return res.json(cached);
  }

  // Override res.json to cache the response
  const originalJson = res.json.bind(res);
  res.json = (body) => {
    cache.set(key, body, duration);
    console.log('Cache MISS — cached for', duration, 'seconds');
    return originalJson(body);
  };

  next();
};

// Usage
app.get('/api/products', cacheMiddleware(300), async (req, res) => {
  const products = await Product.find();
  res.json({ data: products });
});

// Invalidate cache on write
app.post('/api/products', async (req, res) => {
  await Product.create(req.body);
  cache.del('/api/products');  // Clear cached products
  res.status(201).json({ message: 'Product created' });
});
```

---

## Redis — Distributed Cache

```bash
npm install redis
```

```javascript
const redis = require('redis');

const client = redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});
client.connect();

client.on('error', (err) => console.error('Redis error:', err));
client.on('connect', () => console.log('Redis connected'));

// Basic operations
await client.set('key', 'value');
await client.set('key', 'value', { EX: 3600 });  // Expires in 1 hour
const value = await client.get('key');             // 'value' or null
await client.del('key');

// Store objects (as JSON string)
await client.set('user:1', JSON.stringify({ name: 'John', email: 'john@mail.com' }));
const user = JSON.parse(await client.get('user:1'));

// Redis cache middleware
const redisCache = (duration) => async (req, res, next) => {
  const key = `cache:${req.originalUrl}`;
  const cached = await client.get(key);

  if (cached) {
    return res.json(JSON.parse(cached));
  }

  const originalJson = res.json.bind(res);
  res.json = async (body) => {
    await client.set(key, JSON.stringify(body), { EX: duration });
    return originalJson(body);
  };

  next();
};

app.get('/api/products', redisCache(300), async (req, res) => {
  const products = await Product.find();
  res.json({ data: products });
});
```

### Redis Data Structures

```javascript
// Strings
await client.set('name', 'John');
await client.get('name');

// Lists (queue)
await client.lPush('queue', 'task1');   // Add to left
await client.rPop('queue');              // Remove from right

// Sets (unique values)
await client.sAdd('tags', ['node', 'express', 'mongodb']);
await client.sMembers('tags');           // ['node', 'express', 'mongodb']
await client.sIsMember('tags', 'node');  // true

// Hashes (object-like)
await client.hSet('user:1', { name: 'John', age: '25' });
await client.hGet('user:1', 'name');     // 'John'
await client.hGetAll('user:1');          // { name: 'John', age: '25' }

// Sorted Sets (leaderboard)
await client.zAdd('leaderboard', [
  { score: 100, value: 'Alice' },
  { score: 85, value: 'Bob' },
]);
await client.zRange('leaderboard', 0, -1);  // ['Bob', 'Alice']

// TTL
await client.expire('key', 3600);       // Set TTL in seconds
await client.ttl('key');                 // Remaining TTL
```

---

## HTTP Caching Headers

```javascript
// Cache-Control header
app.get('/api/static-data', (req, res) => {
  res.set('Cache-Control', 'public, max-age=3600');  // Cache for 1 hour
  res.json({ data: staticData });
});

// No caching (for sensitive data)
app.get('/api/profile', protect, (req, res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.json({ user: req.user });
});

// ETag (conditional caching)
app.use(require('express').static('public', { etag: true }));
```

---

## Compression

```bash
npm install compression
```

```javascript
const compression = require('compression');
app.use(compression());  // Gzip compress all responses
// Typically reduces response size by 60-80%
```

---

## Performance Tips

```javascript
// 1. Use pagination — never return all records
const users = await User.find().skip(offset).limit(limit);

// 2. Select only needed fields
const users = await User.find().select('name email');

// 3. Use lean() for read-only queries (faster — skips Mongoose overhead)
const users = await User.find().lean();

// 4. Create indexes for frequently queried fields
userSchema.index({ email: 1 });
userSchema.index({ createdAt: -1 });

// 5. Use connection pooling
mongoose.connect(uri, { maxPoolSize: 10 });

// 6. Avoid N+1 queries — use populate or $lookup
// ❌ N+1 (bad)
const posts = await Post.find();
for (const post of posts) {
  post.author = await User.findById(post.authorId); // N extra queries!
}
// ✅ Single query with populate
const posts = await Post.find().populate('author');
```

---

## 🎯 Interview Tips

> **Q: What is Redis and why use it?**
> Redis is an in-memory key-value store used for caching, session storage, rate limiting, pub/sub, and queues. It's extremely fast (100K+ ops/sec) because data lives in RAM.

> **Q: What caching strategies are there?**
> **Cache-Aside**: App checks cache, if miss → query DB → store in cache. **Write-Through**: Write to cache and DB simultaneously. **Write-Behind**: Write to cache first, async write to DB. **TTL**: Auto-expire after time.

> **Q: What is the N+1 query problem?**
> When you fetch N records and then make N additional queries to get related data. Solution: use JOIN/populate to fetch all data in 1-2 queries.

---
