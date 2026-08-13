# 📗 15 — Environment & Configuration

---

## dotenv — Environment Variables

```bash
npm install dotenv
```

```javascript
// Load at the very top of your entry file
require('dotenv').config();

// Access variables
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET;
```

```env
# .env — NEVER commit this file!
NODE_ENV=development
PORT=3000

# Database
MONGO_URI=mongodb://localhost:27017/myapp

# JWT
JWT_SECRET=super-long-random-string-at-least-32-chars
JWT_EXPIRE=7d
REFRESH_SECRET=another-long-random-string

# Cloudinary
CLOUDINARY_CLOUD_NAME=mycloud
CLOUDINARY_API_KEY=123456789
CLOUDINARY_API_SECRET=abcdef

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=myemail@gmail.com
SMTP_PASS=app-password

# Client
CLIENT_URL=http://localhost:5173
```

```gitignore
# .gitignore — MUST include
.env
.env.local
.env.production
node_modules/
logs/
uploads/
```

---

## Configuration Pattern

```javascript
// config/index.js
require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  db: {
    uri: process.env.MONGO_URI,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expire: process.env.JWT_EXPIRE || '7d',
    refreshSecret: process.env.REFRESH_SECRET,
  },
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
  },
};

// Usage
const config = require('./config');
app.listen(config.port);
jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.expire });
```

---

## Multiple Environments

```
.env                 ← Default / shared
.env.development     ← Development overrides
.env.production      ← Production values
.env.test            ← Testing values
```

```json
// package.json scripts
{
  "scripts": {
    "start": "NODE_ENV=production node server.js",
    "dev": "NODE_ENV=development nodemon server.js",
    "test": "NODE_ENV=test jest"
  }
}
```

---

## 🎯 Interview Tips

> **Q: Why use environment variables?**
> To keep secrets (API keys, DB passwords) out of source code, enable different configurations per environment (dev/staging/prod), and follow the 12-factor app methodology.

> **Q: What is the 12-factor app?**
> A methodology for building SaaS applications. Key factors: store config in environment, treat backing services as attached resources, export services via port binding, keep dev/prod parity.

---
