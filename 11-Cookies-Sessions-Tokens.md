# 📗 11 — Cookies, Sessions & Tokens

---

## The Statelessness Problem

HTTP is **stateless** — the server doesn't remember anything between requests. But we need to remember who's logged in! Solutions:

| Approach | Where Stored | Stateful/Stateless |
|----------|--------------|--------------------|
| **Cookies** | Client (browser) | Depends on content |
| **Sessions** | Server (memory/DB) | Stateful |
| **JWT Tokens** | Client (header/cookie) | Stateless |

---

## Cookies

A **cookie** is a small piece of data stored in the browser and automatically sent with every request to the same domain.

```
Server → Set-Cookie: name=John; HttpOnly; Secure → Browser stores it
Browser → Cookie: name=John → Server reads it
```

### Setting Cookies in Express

```bash
npm install cookie-parser
```

```javascript
const cookieParser = require('cookie-parser');
app.use(cookieParser());

// Set a cookie
app.get('/set-cookie', (req, res) => {
  res.cookie('username', 'John', {
    maxAge: 24 * 60 * 60 * 1000,  // 1 day in milliseconds
    httpOnly: true,                 // Can't access via JavaScript
    secure: true,                   // Only sent over HTTPS
    sameSite: 'strict',             // CSRF protection
    path: '/',                      // Available on all paths
    domain: '.example.com',         // Available on subdomains
  });
  res.json({ message: 'Cookie set' });
});

// Read cookies
app.get('/get-cookie', (req, res) => {
  console.log(req.cookies.username);  // 'John'
  res.json({ cookies: req.cookies });
});

// Delete cookie
app.get('/clear-cookie', (req, res) => {
  res.clearCookie('username');
  res.json({ message: 'Cookie cleared' });
});
```

### Signed Cookies (Tamper Detection)

```javascript
app.use(cookieParser('my-secret-key'));

// Set signed cookie
res.cookie('userId', '42', { signed: true });

// Read signed cookie
req.signedCookies.userId;  // '42' (or false if tampered)
```

### Cookie Flags Explained

| Flag | Purpose | Security |
|------|---------|----------|
| `httpOnly` | Not accessible via `document.cookie` (JS) | Prevents **XSS** token theft |
| `secure` | Only sent over HTTPS | Prevents **eavesdropping** |
| `sameSite: 'strict'` | Not sent with cross-site requests | Prevents **CSRF** |
| `sameSite: 'lax'` | Sent with top-level navigations only | Moderate CSRF protection |
| `sameSite: 'none'` | Sent with all cross-site requests | Requires `secure: true` |
| `maxAge` | Cookie expiry in milliseconds | — |
| `expires` | Cookie expiry date | — |
| `path` | URL path the cookie is valid for | — |
| `domain` | Domain the cookie is valid for | — |

---

## Sessions

A **session** stores user data on the **server**. The client only receives a **session ID** (in a cookie) to identify themselves.

```
Login → Server creates session → Session ID stored in cookie → 
Client sends cookie → Server looks up session → Identifies user
```

### express-session

```bash
npm install express-session
```

```javascript
const session = require('express-session');

app.use(session({
  secret: 'my-secret-key',         // Used to sign the session ID cookie
  resave: false,                    // Don't save session if not modified
  saveUninitialized: false,         // Don't create session until something stored
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000,   // 1 day
  },
}));
```

### Using Sessions

```javascript
// Login — store user info in session
app.post('/login', async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  // ... verify password

  // Store in session
  req.session.userId = user._id;
  req.session.role = user.role;
  req.session.isLoggedIn = true;

  res.json({ message: 'Logged in' });
});

// Access session data
app.get('/dashboard', (req, res) => {
  if (!req.session.isLoggedIn) {
    return res.status(401).json({ error: 'Please log in' });
  }
  res.json({ userId: req.session.userId, role: req.session.role });
});

// Logout — destroy session
app.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ error: 'Logout failed' });
    res.clearCookie('connect.sid');  // Clear session cookie
    res.json({ message: 'Logged out' });
  });
});
```

### Session Stores (Production)

By default, sessions are stored **in memory** (lost on restart). For production, use a persistent store:

```bash
npm install connect-mongo   # MongoDB store
# or
npm install connect-redis   # Redis store
```

```javascript
const MongoStore = require('connect-mongo');

app.use(session({
  secret: 'my-secret',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    ttl: 24 * 60 * 60,  // 1 day in seconds
  }),
  cookie: { maxAge: 24 * 60 * 60 * 1000 },
}));
```

---

## Session vs JWT — Comparison

| Feature | Session-Based | JWT-Based |
|---------|---------------|-----------|
| Storage | Server (memory/DB) | Client (cookie/localStorage) |
| Stateful? | ✅ Yes (server stores state) | ❌ Stateless |
| Scalability | Harder (sticky sessions / shared store) | Easy (any server can verify) |
| Logout | Easy (delete session from store) | Hard (token valid until expiry) |
| Revocation | Easy (delete from DB) | Hard (need blacklist) |
| Performance | DB lookup per request | No DB lookup (just verify signature) |
| Data size | Small (just session ID in cookie) | Larger (full payload in token) |
| Best for | Traditional web apps (SSR) | APIs, microservices, mobile apps |

---

## JWT in Cookies (Best Practice)

Combine the security of cookies with the flexibility of JWTs:

```javascript
// Login — set JWT in httpOnly cookie
exports.login = async (req, res) => {
  // ... authenticate user

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });

  res.cookie('token', token, {
    httpOnly: true,       // Not accessible via JS
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',   // CSRF protection
    maxAge: 7 * 24 * 60 * 60 * 1000,  // 7 days
  });

  res.json({ success: true, user: { id: user._id, name: user.name } });
};

// Protect middleware — read JWT from cookie
exports.protect = async (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Logout — clear cookie
exports.logout = (req, res) => {
  res.cookie('token', '', {
    httpOnly: true,
    expires: new Date(0),  // Expire immediately
  });
  res.json({ success: true, message: 'Logged out' });
};
```

---

## Token Blacklisting (For JWT Logout)

```javascript
// Store invalidated tokens (use Redis in production)
const blacklistedTokens = new Set();

// Logout
exports.logout = (req, res) => {
  const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
  if (token) blacklistedTokens.add(token);
  res.clearCookie('token');
  res.json({ message: 'Logged out' });
};

// Check in protect middleware
exports.protect = async (req, res, next) => {
  const token = req.cookies.token;
  if (!token || blacklistedTokens.has(token)) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  // ... verify and continue
};
```

---

## 🎯 Interview Tips

> **Q: Cookie vs localStorage vs sessionStorage?**
> Cookies: auto-sent with requests, 4KB limit, can be httpOnly. localStorage: 5-10MB, persists forever, JS only. sessionStorage: 5-10MB, cleared when tab closes, JS only.

> **Q: How to handle CSRF attacks?**
> Use `sameSite: 'strict'` cookies, CSRF tokens, or the double-submit cookie pattern.

> **Q: Which is more secure — storing JWT in localStorage or httpOnly cookie?**
> httpOnly cookie, because it can't be accessed by JavaScript, making it immune to XSS attacks. localStorage is readable by any JS on the page, so if there's an XSS vulnerability, the token can be stolen.

---
