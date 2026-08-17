# 📗 18 — Caching & Performance (Partwise Guide)

---

## What is Caching?

Caching stores copies of frequently accessed data in a fast, temporary storage layer (like memory) so that future requests for that data are served significantly faster without hitting slow databases or external APIs.

---

# 🛠️ Partwise Breakdown of Caching & Optimization

---

## 📍 Part 1: In-Memory Caching vs Redis

| Feature | In-Memory (Node.js Heap) | Redis (Distributed Cache) |
|---------|--------------------------|---------------------------|
| **Location** | Inside Node process RAM | Separate dedicated server process |
| **Speed** | Sub-millisecond (Fastest) | Extremely fast (< 1-2 ms over network) |
| **Persistence** | Lost on server restart | Optional disk snapshot persistence |
| **Multi-Server** | Not shared across cluster | Shared across all microservices/instances |

---

## 📍 Part 2: Redis Caching Implementation

```bash
npm install redis
```

### 2.1 Redis Connection Setup (`config/redis.js`)
```javascript
const { createClient } = require('redis');

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.on('error', (err) => console.error('Redis Client Error:', err));
redisClient.on('connect', () => console.log('🔴 Connected to Redis Server'));

(async () => {
  await redisClient.connect();
})();

module.exports = redisClient;
```

### 2.2 Cache Middleware Pattern (Cache Aside)
```javascript
const redisClient = require('../config/redis');

// Middleware to check Redis cache before running route handler
const checkCache = (cacheKeyPrefix) => {
  return async (req, res, next) => {
    const key = `${cacheKeyPrefix}:${req.originalUrl}`;
    try {
      const cachedData = await redisClient.get(key);
      if (cachedData) {
        console.log('⚡ Cache Hit!');
        return res.status(200).json(JSON.parse(cachedData));
      }
      console.log('🐢 Cache Miss... Querying DB');
      req.cacheKey = key; // Attach key to request for controller to set
      next();
    } catch (err) {
      next(); // Fail open if Redis drops
    }
  };
};

// Route Controller
app.get('/api/products', checkCache('products'), async (req, res) => {
  const products = await Product.find();

  // Store in Redis with TTL (Time To Live) of 3600 seconds (1 hour)
  await redisClient.setEx(req.cacheKey, 3600, JSON.stringify({
    success: true,
    data: products
  }));

  res.status(200).json({ success: true, data: products });
});
```

---

## 📍 Part 3: Cache Invalidation Strategies

Data must be invalidated or updated when mutations occur:

```javascript
// POST /api/products (Create Product)
app.post('/api/products', async (req, res) => {
  const newProduct = await Product.create(req.body);

  // Invalidate product cache keys so users get fresh data
  const keys = await redisClient.keys('products:*');
  if (keys.length > 0) {
    await redisClient.del(keys);
  }

  res.status(201).json({ success: true, data: newProduct });
});
```

---

## 📍 Part 4: HTTP Compression & Asset Optimization

```bash
npm install compression
```

```javascript
const compression = require('compression');

// Compress all response bodies with Gzip/Brotli
app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  },
  threshold: 1024 // Only compress responses > 1 KB
}));
```

---

## 🎯 Interview Questions & Key Takeaways

> **Q: What is the Cache-Aside pattern?**
> The application checks the cache first. If data is found (Cache Hit), it returns it immediately. If not (Cache Miss), it queries the database, writes the result to the cache for next time, and returns the response.
