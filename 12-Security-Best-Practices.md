# 📗 12 — Security Best Practices (Partwise Guide)

---

## OWASP Top 10 Summary

| # | Vulnerability | Description | Primary Defense |
|---|---------------|-------------|-----------------|
| 1 | **SQL/NoSQL Injection** | Injecting malicious query syntax | Parameterized queries & sanitization |
| 2 | **Broken Authentication** | Credential stuffing, weak sessions | Rate limiting & bcrypt/JWT |
| 3 | **XSS (Cross-Site Scripting)** | Executing malicious JS in browser | Input escaping & Helmet CSP |
| 4 | **CSRF** | Tricking logged-in users into actions | SameSite cookies & Anti-CSRF tokens |
| 5 | **Broken Access Control** | Unauthorized resource access | RBAC authorization guards |

---

# 🛠️ Partwise Breakdown of Security Implementations

---

## 📍 Part 1: Preventing Injection Attacks (SQL & NoSQL)

### 1.1 SQL Injection Prevention
```javascript
// ❌ VULNERABLE
const query = `SELECT * FROM users WHERE email = '${req.body.email}'`;

// ✅ SAFE (Parameterized Queries)
const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [req.body.email]);
```

### 1.2 NoSQL Injection Prevention
```javascript
const mongoSanitize = require('express-mongo-sanitize');

// Removes $ and . operators from user input
app.use(mongoSanitize());
```

---

## 📍 Part 2: Preventing Cross-Site Scripting (XSS)

```javascript
const helmet = require('helmet');
const xssClean = require('xss-clean');

// Set Security HTTP Headers (including Content-Security-Policy)
app.use(helmet());

// Sanitize HTML/JS tags from req.body, req.query, req.params
app.use(xssClean());
```

---

## 📍 Part 3: Preventing Cross-Site Request Forgery (CSRF)

```javascript
// Store authentication token in SameSite cookie
res.cookie('token', jwtToken, {
  httpOnly: true, // Prevents JavaScript client access (XSS immune)
  secure: true,   // Transmitted only over HTTPS
  sameSite: 'strict' // Prevents cross-site cookie attachment
});
```

---

## 📍 Part 4: CORS (Cross-Origin Resource Sharing) Configuration

```javascript
const cors = require('cors');

// Production Strict CORS Setup
app.use(cors({
  origin: ['https://myapp.com', 'https://admin.myapp.com'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true, // Allow cookies
  maxAge: 86400 // Cache preflight response for 24 hours
}));
```

---

## 📍 Part 5: Rate Limiting & Brute-Force Protection

```javascript
const rateLimit = require('express-rate-limit');

// General API limiter: 100 requests per 15 minutes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests from this IP, please try again later' }
});
app.use('/api', apiLimiter);

// Strict limiter for Auth endpoints: 5 attempts per 15 mins
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Too many login attempts, account locked for 15 mins' }
});
app.use('/api/auth/login', authLimiter);
```

---

## 📍 Part 6: Production Express Hardened Security Stack

```javascript
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xssClean = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');

const app = express();

// 1. Security Headers
app.use(helmet());

// 2. Restricted CORS
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));

// 3. Global Rate Limiter
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

// 4. Payload Size Limiting (Protects against Buffer Overflow / DoS)
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// 5. Input Sanitization
app.use(mongoSanitize());
app.use(xssClean());
app.use(hpp()); // HTTP Parameter Pollution protection

module.exports = app;
```

---

## 🎯 Interview Questions & Key Takeaways

> **Q: How does `helmet` secure Express applications?**
> By automatically setting security-focused HTTP response headers like `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Strict-Transport-Security`, and `Content-Security-Policy`.
