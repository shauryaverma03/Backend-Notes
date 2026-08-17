# 📗 10 — Authentication & Authorization (Partwise Guide)

---

## Authentication vs Authorization

| Feature | Authentication (AuthN) | Authorization (AuthZ) |
|---------|----------------------|----------------------|
| **Question** | *Who are you?* | *What are you allowed to do?* |
| **Purpose** | Verifying identity | Verifying access permissions |
| **Execution** | Occurs first (at Login) | Occurs after identity is confirmed |
| **HTTP Status Code** | `401 Unauthorized` | `403 Forbidden` |

---

# 🛠️ Partwise Breakdown of Security Architecture

---

## 📍 Part 1: Password Hashing with bcrypt

**Rule**: Never store plain-text passwords in databases.

```bash
npm install bcryptjs
```

### Password Hashing & Comparison Implementation
```javascript
const bcrypt = require('bcryptjs');

// Hash password with 12 salt rounds
const hashPassword = async (plainTextPassword) => {
  const salt = await bcrypt.genSalt(12);
  const hashedPassword = await bcrypt.hash(plainTextPassword, salt);
  return hashedPassword; // Example: "$2b$12$LJ3m4ysfI..."
};

// Compare candidate password against stored hash
const verifyPassword = async (candidatePassword, storedHash) => {
  return await bcrypt.compare(candidatePassword, storedHash); // returns true or false
};
```

---

## 📍 Part 2: JWT (JSON Web Tokens) Deep Dive

### 2.1 JWT Structure
A JWT consists of 3 dot-separated Base64 parts:
`HEADER.PAYLOAD.SIGNATURE`

```
eyJhbGciOiJIUzI1NiJ9.eyJpZCI6MSwiZW1haWwiOiJqb2huQG1haWwuY29tIn0.abc123signature
```

### 2.2 Token Generation & Verification
```javascript
const jwt = require('jsonwebtoken');

// Generate JWT token
const issueToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: '7d' } // Token expires in 7 days
  );
};

// Verify JWT token
const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};
```

---

## 📍 Part 3: Complete Authentication System (Register & Login Controllers)

```javascript
// controllers/authController.js
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Register Controller
exports.register = async (req, res) => {
  const { name, email, password } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(409).json({ error: 'Email already registered' });
  }

  const user = await User.create({ name, email, password });
  const token = issueToken(user._id);

  res.status(201).json({
    success: true,
    token,
    user: { id: user._id, name: user.name, email: user.email }
  });
};

// Login Controller
exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Please provide email and password' });
  }

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = issueToken(user._id);

  res.status(200).json({
    success: true,
    token,
    user: { id: user._id, name: user.name, email: user.email, role: user.role }
  });
};
```

---

## 📍 Part 4: Route Protection & Role-Based Access Control (RBAC)

### 4.1 Protect Middleware (Authentication Guard)
```javascript
// middleware/auth.js
exports.protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ error: 'Not authorized to access this route' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token verification failed' });
  }
};
```

### 4.2 Role-Based Authorization Guard (AuthZ)
```javascript
exports.authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `User role '${req.user.role}' is not authorized for this resource`
      });
    }
    next();
  };
};
```

---

## 📍 Part 5: Dual Token Pattern (Access & Refresh Tokens)

```
Client               Server
  │  ── Login ─────────▶ │ Issue Access (15m) + Refresh (7d)
  │  ◀─ Token & Cookie ─ │
  │                      │
  │  ── Request + Access ──▶ Validated
  │                      │
  │  ── Access Expired ──▶ 401 Unauthorized
  │  ── Post Refresh ───▶ Returns new 15m Access Token
```

```javascript
// Refresh token endpoint
exports.refreshToken = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) return res.status(401).json({ error: 'Refresh token missing' });

  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET);
    const newAccessToken = jwt.sign({ id: decoded.id }, process.env.JWT_SECRET, { expiresIn: '15m' });
    res.json({ accessToken: newAccessToken });
  } catch (err) {
    res.status(403).json({ error: 'Invalid or expired refresh token' });
  }
};
```

---

## 🎯 Interview Questions & Key Takeaways

> **Q: Where should JWTs be stored in the frontend?**
> In `httpOnly`, `secure`, and `sameSite` HTTP cookies to prevent XSS script access and theft.

> **Q: Why use bcrypt over fast hash algorithms like MD5 or SHA-256?**
> bcrypt has adaptive cost rounds making computational brute-force impractical, and automatically incorporates random salt.
