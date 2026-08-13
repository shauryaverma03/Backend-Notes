# 📗 10 — Authentication & Authorization

---

## Authentication vs Authorization

| Concept | Authentication (AuthN) | Authorization (AuthZ) |
|---------|----------------------|----------------------|
| Question | **Who are you?** | **What can you do?** |
| Purpose | Verify identity | Verify permissions |
| When | Before authorization | After authentication |
| Example | Login with email/password | Admin can delete users |
| HTTP Status | 401 Unauthorized | 403 Forbidden |

---

## Password Hashing with bcrypt

**NEVER store plain-text passwords!** Always hash them.

```bash
npm install bcryptjs
```

### How bcrypt Works

```
"password123"  →  bcrypt.hash()  →  "$2b$12$LJ3m4ysfI..."
                  (salt + hash)
```

- **Salt**: Random data added to the password before hashing (prevents rainbow table attacks)
- **Rounds**: Number of hashing iterations (higher = slower + more secure). Default: 10-12

```javascript
const bcrypt = require('bcryptjs');

// Hash a password
const hashPassword = async (plainPassword) => {
  const salt = await bcrypt.genSalt(12);  // Generate salt with 12 rounds
  const hashedPassword = await bcrypt.hash(plainPassword, salt);
  return hashedPassword;
  // Returns: "$2b$12$LJ3m4ysf..."
};

// Shorthand (auto-generates salt)
const hash = await bcrypt.hash('password123', 12);

// Compare password
const isMatch = await bcrypt.compare('password123', hashedPassword);
// Returns: true or false
```

### In Mongoose Pre-Save Hook

```javascript
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, select: false },
});

userSchema.pre('save', async function (next) {
  // Only hash if password was modified
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};
```

---

## JWT (JSON Web Tokens)

### What is JWT?

JWT is a **compact, self-contained token** used to securely transmit information between parties. It's the standard for **stateless authentication** in APIs.

### JWT Structure

```
eyJhbGciOiJIUzI1NiJ9.eyJpZCI6MSwiZW1haWwiOiJqb2huQG1haWwuY29tIn0.abc123signature
└──────── Header ────────┘.└────────── Payload ─────────────────────────┘.└── Signature ──┘
```

| Part | Contains | Encoded |
|------|----------|---------|
| **Header** | Algorithm (HS256) + token type (JWT) | Base64 |
| **Payload** | Claims (user data, expiry, etc.) | Base64 |
| **Signature** | HMAC-SHA256(header + payload, secret) | Hashed |

> The payload is **encoded, NOT encrypted**. Anyone can decode and read it. The signature only ensures it hasn't been tampered with.

### Using JWT

```bash
npm install jsonwebtoken
```

```javascript
const jwt = require('jsonwebtoken');

// Generate token
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },          // Payload (claims)
    process.env.JWT_SECRET,   // Secret key
    { expiresIn: '7d' }      // Options: 7 days
  );
};

// Verify token
const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
    // { id: 1, iat: 1234567890, exp: 1234567890 }
  } catch (err) {
    throw new Error('Invalid or expired token');
  }
};
```

### Token Expiration Options
```javascript
{ expiresIn: '15m' }    // 15 minutes
{ expiresIn: '1h' }     // 1 hour
{ expiresIn: '7d' }     // 7 days
{ expiresIn: '30d' }    // 30 days
{ expiresIn: 3600 }     // 3600 seconds (1 hour)
```

---

## Complete Auth System

### Register

```javascript
// controllers/authController.js
const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// Register
exports.register = async (req, res) => {
  const { name, email, password } = req.body;

  // Check if user exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(409).json({ error: 'Email already registered' });
  }

  // Create user (password hashed by pre-save hook)
  const user = await User.create({ name, email, password });

  // Generate token
  const token = generateToken(user._id);

  res.status(201).json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
    },
  });
};
```

### Login

```javascript
exports.login = async (req, res) => {
  const { email, password } = req.body;

  // Validate input
  if (!email || !password) {
    return res.status(400).json({ error: 'Please provide email and password' });
  }

  // Find user (include password since select: false)
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Check password
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Generate token
  const token = generateToken(user._id);

  res.json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
};
```

### Protect Middleware

```javascript
// middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
  let token;

  // Check for token in header
  if (req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  // Or check in cookies
  else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({ error: 'Not authorized, no token' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from token
    req.user = await User.findById(decoded.id);
    if (!req.user) {
      return res.status(401).json({ error: 'User no longer exists' });
    }

    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};
```

### Role-Based Authorization

```javascript
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Role '${req.user.role}' is not authorized`,
      });
    }
    next();
  };
};
```

### Routes

```javascript
// routes/authRoutes.js
const router = require('express').Router();
const { register, login } = require('../controllers/authController');
const { protect, authorize } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, (req, res) => {
  res.json({ user: req.user });
});

// Admin only route
router.delete('/users/:id', protect, authorize('admin'), deleteUser);
```

---

## Refresh Token Pattern

```
┌─────────┐                              ┌──────────┐
│  Client  │──── Login ──────────────────▶│  Server   │
│          │◀─── Access Token (15min)  ───│           │
│          │◀─── Refresh Token (7 days) ──│           │
│          │                              │           │
│          │──── Request + Access Token ──▶│           │
│          │◀─── Response ────────────────│           │
│          │                              │           │
│          │──── Access Token EXPIRED ────▶│ 401       │
│          │──── Send Refresh Token ──────▶│           │
│          │◀─── New Access Token ────────│           │
└─────────┘                              └──────────┘
```

```javascript
// Login — send both tokens
const accessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
  expiresIn: '15m',
});
const refreshToken = jwt.sign({ id: user._id }, process.env.REFRESH_SECRET, {
  expiresIn: '7d',
});

// Store refresh token in httpOnly cookie
res.cookie('refreshToken', refreshToken, {
  httpOnly: true,
  secure: true,
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
});

// Refresh endpoint
exports.refreshToken = async (req, res) => {
  const { refreshToken } = req.cookies;
  if (!refreshToken) return res.status(401).json({ error: 'No refresh token' });

  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET);
    const newAccessToken = jwt.sign(
      { id: decoded.id },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );
    res.json({ accessToken: newAccessToken });
  } catch (err) {
    res.status(403).json({ error: 'Invalid refresh token' });
  }
};
```

---

## OAuth 2.0 (Social Login)

### How OAuth Works

```
User → "Login with Google" → Redirect to Google → User grants permission
→ Google redirects back with authorization code → Server exchanges code for tokens
→ Server gets user profile from Google → Create/login user → Issue JWT
```

### Using Passport.js

```bash
npm install passport passport-google-oauth20
```

```javascript
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: '/api/auth/google/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      // Find or create user
      let user = await User.findOne({ googleId: profile.id });
      if (!user) {
        user = await User.create({
          googleId: profile.id,
          name: profile.displayName,
          email: profile.emails[0].value,
          avatar: profile.photos[0].value,
        });
      }
      done(null, user);
    }
  )
);

// Routes
app.get('/api/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/api/auth/google/callback',
  passport.authenticate('google', { session: false }),
  (req, res) => {
    const token = generateToken(req.user._id);
    res.redirect(`/dashboard?token=${token}`);
  }
);
```

---

## 🎯 Interview Tips

> **Q: Why bcrypt instead of SHA-256 for passwords?**
> bcrypt is intentionally slow (adjustable rounds), making brute force attacks impractical. SHA-256 is fast, so attackers can try billions of combinations per second. bcrypt also auto-includes a salt.

> **Q: Where to store JWT — localStorage vs cookies?**
> Cookies with `httpOnly`, `secure`, and `sameSite` flags are more secure (immune to XSS). localStorage is vulnerable to XSS attacks.

> **Q: What is the difference between access token and refresh token?**
> Access token: short-lived (15min), sent with every request. Refresh token: long-lived (7 days), stored securely, used only to get a new access token when the current one expires.

> **Q: How does OAuth 2.0 work?**
> The app redirects the user to the OAuth provider (Google). The user grants permission. The provider redirects back with an authorization code. The server exchanges this code for an access token and fetches the user's profile.

---
