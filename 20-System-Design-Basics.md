# 📗 20 — System Design Basics

---

## Key Concepts for Interviews

---

## Scaling

### Vertical Scaling (Scale Up)
- Add more CPU, RAM, disk to the **same server**
- Simple but has physical limits
- Single point of failure

### Horizontal Scaling (Scale Out)
- Add **more servers** and distribute load
- Requires load balancer
- More complex but no ceiling
- Better fault tolerance

---

## Load Balancing

Distributes incoming requests across multiple servers.

```
             ┌──────────────┐
             │ Load Balancer │
             │   (Nginx)     │
             └──────┬───────┘
          ┌─────────┼─────────┐
          ▼         ▼         ▼
     ┌─────────┐ ┌─────────┐ ┌─────────┐
     │ Server 1│ │ Server 2│ │ Server 3│
     └─────────┘ └─────────┘ └─────────┘
```

### Algorithms
| Algorithm | Description |
|-----------|-------------|
| **Round Robin** | Requests go to each server in turn |
| **Least Connections** | Send to server with fewest active connections |
| **IP Hash** | Same client IP always goes to same server |
| **Weighted** | Servers with more capacity get more requests |

---

## Monolith vs Microservices

### Monolith
```
┌──────────────────────────────┐
│          One Big App          │
│  ┌────────┐ ┌──────┐ ┌────┐ │
│  │  Auth  │ │ Users│ │Cart│ │
│  └────────┘ └──────┘ └────┘ │
│     Single Database           │
└──────────────────────────────┘
```
- ✅ Simple to develop, test, deploy
- ❌ Hard to scale individual parts
- ❌ One bug can crash everything
- ❌ Becomes unmanageable as it grows

### Microservices
```
┌────────┐    ┌────────┐    ┌────────┐
│  Auth  │    │ Users  │    │  Cart  │
│Service │    │Service │    │Service │
│  :3001 │    │  :3002 │    │  :3003 │
│   DB₁  │    │   DB₂  │    │   DB₃  │
└────────┘    └────────┘    └────────┘
     ▲             ▲             ▲
     └─────────────┼─────────────┘
              API Gateway
```
- ✅ Independent scaling, deployment, tech stack
- ✅ Fault isolation
- ❌ Complex: networking, data consistency, debugging
- ❌ Requires DevOps maturity

---

## API Gateway

Single entry point that routes requests to appropriate microservices.

**Responsibilities:**
- Request routing
- Authentication
- Rate limiting
- Logging
- Response caching
- Load balancing
- SSL termination

---

## Message Queues

For asynchronous, decoupled communication between services.

```
Producer → [Queue] → Consumer

User Sign Up → [Queue: send-email] → Email Service
```

**Popular Tools:**
- **RabbitMQ** — Traditional message broker
- **Apache Kafka** — High-throughput event streaming
- **Redis Pub/Sub** — Simple pub/sub messaging
- **AWS SQS** — Managed queue service
- **BullMQ** — Node.js job queue using Redis

### BullMQ Example

```bash
npm install bullmq
```

```javascript
const { Queue, Worker } = require('bullmq');

// Producer — add job to queue
const emailQueue = new Queue('email', { connection: { host: 'localhost' } });

await emailQueue.add('welcome-email', {
  to: 'user@mail.com',
  subject: 'Welcome!',
  body: 'Thanks for signing up!',
});

// Consumer — process jobs
const worker = new Worker('email', async (job) => {
  console.log(`Sending ${job.name} to ${job.data.to}`);
  await sendEmail(job.data);
}, { connection: { host: 'localhost' } });
```

---

## Database Patterns

### Replication
```
Write → [Primary DB]
         ├── [Replica 1] ← Read
         ├── [Replica 2] ← Read
         └── [Replica 3] ← Read
```
- Writes go to primary, reads distributed across replicas
- Improves read performance and availability

### Sharding (Horizontal Partitioning)
```
Users A-M → [Shard 1]
Users N-Z → [Shard 2]
```
- Split data across multiple databases
- Each shard holds a subset of data
- Enables horizontal scaling

---

## CAP Theorem

You can only guarantee **2 out of 3**:

| Property | Description |
|----------|-------------|
| **Consistency** | All nodes see the same data at the same time |
| **Availability** | Every request gets a response |
| **Partition Tolerance** | System works despite network failures |

- **CP** (Consistency + Partition): MongoDB, Redis → May reject requests during partition
- **AP** (Availability + Partition): Cassandra, DynamoDB → May return stale data
- **CA** (Consistency + Availability): Traditional RDBMS → Doesn't handle partitions well

> In distributed systems, network partitions WILL happen, so you must choose between C and A.

---

## Common System Design Questions

### 1. Design a URL Shortener
```
Components: API server, Database (key-value), Cache
Flow: 
  POST /shorten → Generate unique short code → Store (shortCode → longURL)
  GET /:code → Lookup in cache/DB → 301 Redirect to long URL
Key decisions: Base62 encoding, collision handling, analytics tracking
```

### 2. Design a Chat Application
```
Components: WebSocket server, Message queue, Database, Presence service
Flow:
  Connect → WebSocket handshake → Join rooms
  Send message → Queue → Deliver to recipients → Store in DB
Key decisions: Socket.io, Redis Pub/Sub for multi-server, message persistence
```

### 3. Design a Rate Limiter
```
Algorithms:
  - Token Bucket: Tokens replenish at fixed rate; each request costs a token
  - Sliding Window: Count requests in a sliding time window
  - Fixed Window: Count requests in fixed time intervals
Implementation: Redis (INCR + EXPIRE) for distributed rate limiting
```

---

## 🎯 Interview Tips

> **Q: How would you scale a Node.js app?**
> 1. Cluster mode (PM2) — use all CPU cores
> 2. Load balancer (Nginx) — distribute across multiple servers
> 3. Caching (Redis) — reduce DB load
> 4. Database indexing & optimization
> 5. CDN for static assets
> 6. Microservices for independent scaling
> 7. Message queues for async processing

> **Q: Monolith vs Microservices — which to choose?**
> Start with a monolith for speed of development. Move to microservices when: team grows, need independent scaling, different parts need different tech stacks, or the monolith becomes unmaintainable.

> **Q: What is eventual consistency?**
> In distributed systems, after a write, all replicas will eventually have the same data, but not immediately. Reads might return stale data for a short period. Used by NoSQL databases for higher availability and performance.

---
