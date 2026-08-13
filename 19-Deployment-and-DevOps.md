# 📗 19 — Deployment & DevOps

---

## Preparing for Production

### Production Checklist

```
✅ Set NODE_ENV=production
✅ Use environment variables for all secrets
✅ Enable compression (gzip)
✅ Set security headers (helmet)
✅ Configure CORS properly
✅ Enable rate limiting
✅ Set up proper logging (Winston + Morgan)
✅ Handle uncaught exceptions & unhandled rejections
✅ Use a process manager (PM2)
✅ Set up health check endpoint
✅ Remove console.log statements
```

### Health Check Endpoint

```javascript
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});
```

---

## PM2 — Process Manager

```bash
npm install -g pm2
```

```bash
# Start app
pm2 start server.js --name "my-api"

# Cluster mode (use all CPU cores)
pm2 start server.js -i max        # Auto-detect CPU count
pm2 start server.js -i 4          # 4 instances

# Manage
pm2 list                           # List all processes
pm2 logs                           # View logs
pm2 logs my-api                    # Logs for specific app
pm2 restart my-api                 # Restart
pm2 stop my-api                    # Stop
pm2 delete my-api                  # Remove
pm2 monit                          # Monitor dashboard

# Auto-restart on crash
pm2 start server.js --max-memory-restart 500M
pm2 start server.js --watch        # Restart on file changes (dev)

# Startup (auto-start on system boot)
pm2 startup
pm2 save

# Config file
# ecosystem.config.js
module.exports = {
  apps: [{
    name: 'my-api',
    script: 'server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development',
      PORT: 3000,
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 8080,
    },
  }],
};
```

---

## Docker

### Dockerfile

```dockerfile
# Use official Node.js image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files first (layer caching)
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Set environment
ENV NODE_ENV=production

# Start the app
CMD ["node", "server.js"]
```

### .dockerignore

```
node_modules
npm-debug.log
.env
.git
.gitignore
README.md
```

### Docker Compose (with MongoDB)

```yaml
# docker-compose.yml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - MONGO_URI=mongodb://mongo:27017/myapp
      - JWT_SECRET=my-secret
    depends_on:
      - mongo
    restart: always

  mongo:
    image: mongo:7
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

volumes:
  mongo_data:
```

```bash
docker-compose up -d        # Start in background
docker-compose down         # Stop
docker-compose logs -f      # Follow logs
docker-compose ps           # List services
```

---

## Nginx — Reverse Proxy

```nginx
# /etc/nginx/sites-available/myapi
server {
    listen 80;
    server_name api.example.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Why Use Nginx in Front of Node.js?

- **SSL termination** (handle HTTPS)
- **Load balancing** across multiple Node.js instances
- **Serve static files** efficiently
- **Rate limiting** at proxy level
- **Caching** at proxy level
- **Security** (hide Node.js details)

---

## CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/deploy.yml
name: Deploy API

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to server
        run: |
          # SSH into server and pull latest code
          ssh user@server "cd /app && git pull && npm install && pm2 restart all"
```

---

## Cloud Platforms

| Platform | Simplicity | Free Tier | Best For |
|----------|-----------|-----------|----------|
| **Railway** | ⭐⭐⭐⭐⭐ | Yes | Quick deploy |
| **Render** | ⭐⭐⭐⭐⭐ | Yes | Full-stack |
| **Vercel** | ⭐⭐⭐⭐ | Yes | Serverless functions |
| **Heroku** | ⭐⭐⭐⭐ | Limited | Traditional apps |
| **AWS EC2** | ⭐⭐ | Yes (12mo) | Full control |
| **DigitalOcean** | ⭐⭐⭐ | $200 credit | VPS |

---

## 🎯 Interview Tips

> **Q: What is a reverse proxy?**
> A server (Nginx) that sits in front of your application, forwarding client requests. Benefits: SSL termination, load balancing, caching, security, serving static files.

> **Q: How does Docker help in deployment?**
> Docker packages your app with all dependencies into a container that runs identically everywhere. "It works on my machine" → "It works everywhere."

> **Q: What is cluster mode in PM2?**
> PM2 creates multiple instances of your app (one per CPU core). Requests are load-balanced across instances, utilizing all CPU cores. Node.js is single-threaded, so clustering is the way to use multiple cores.

---
