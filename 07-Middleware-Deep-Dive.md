# 📗 07 — Middleware Deep Dive

---

## What is Middleware?

Middleware functions are functions that have access to the **request object** (`req`), the **response object** (`res`), and the **next middleware function** (`next`) in the request-response cycle.

```
Request → Middleware 1 → Middleware 2 → ... → Route Handler → Response
```

```javascript
function myMiddleware(req, res, next) {
  // Do something with req/res
  console.log('Middleware executed');
  next(); // Pass control to the next middleware/route
}
```

> If `next()` is not called, the request hangs forever!

---

## Types of Middleware

### 1. Application-Level Middleware

```javascript
// Runs on EVERY request
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url} - ${new Date().toISOString()}`);
  next();
});

// Runs only on /api/* routes
app.use('/api', (req, res, next) => {
  console.log('API route accessed');
  next();
});
```

### 2. Router-Level Middleware

```javascript
const router = express.Router();

// Middleware for this router only
router.use((req, res, next) => {
  console.log('User router middleware');
  next();
});

router.get('/', (req, res) => {
  res.json({ users: [] });
});
```

### 3. Built-in Middleware

```javascript
app.use(express.json());                         // Parse JSON bodies
app.use(express.urlencoded({ extended: true }));  // Parse form data
app.use(express.static('public'));                // Serve static files
```

### 4. Third-Party Middleware

```javascript
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');

app.use(cors());                    // Enable CORS
app.use(morgan('dev'));             // HTTP request logger
app.use(helmet());                  // Security headers
app.use(cookieParser());           // Parse cookies
```

### 5. Error-Handling Middleware (4 parameters)

```javascript
// MUST have exactly 4 parameters: (err, req, res, next)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    error: err.message || 'Internal Server Error',
  });
});
```

---

## Middleware Execution Order

**Order matters!** Middleware runs in the order it's defined.

```javascript
// 1. Runs first
app.use(express.json());

// 2. Runs second
app.use(morgan('dev'));

// 3. Runs third (only for matching routes)
app.get('/users', (req, res) => { res.send('Users'); });

// 4. Error handler (runs last — catches errors from above)
app.use((err, req, res, next) => { res.status(500).json({ error: err.message }); });

// ⚠️ 404 handler (put AFTER all routes, BEFORE error handler)
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});
```

---

## Custom Middleware Examples

### Logger Middleware

```javascript
const logger = (req, res, next) => {
  const start = Date.now();

  // After response is sent
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
  });

  next();
};

app.use(logger);
```

### Authentication Middleware

```javascript
const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
  // Get token from header
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Attach user info to request
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Use on specific routes
app.get('/api/profile', protect, (req, res) => {
  res.json({ user: req.user });
});

// Use on all routes in a router
router.use(protect);
```

### Role-Based Authorization Middleware

```javascript
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'You do not have permission to perform this action',
      });
    }
    next();
  };
};

// Only admin can delete users
app.delete('/api/users/:id', protect, authorize('admin'), (req, res) => {
  res.json({ message: 'User deleted' });
});

// Admin or moderator can update
app.put('/api/posts/:id', protect, authorize('admin', 'moderator'), (req, res) => {
  res.json({ message: 'Post updated' });
});
```

### Validation Middleware

```javascript
const validateUser = (req, res, next) => {
  const { name, email, password } = req.body;
  const errors = [];

  if (!name || name.trim().length < 2) {
    errors.push('Name must be at least 2 characters');
  }
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    errors.push('Valid email is required');
  }
  if (!password || password.length < 6) {
    errors.push('Password must be at least 6 characters');
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }

  next();
};

app.post('/api/users', validateUser, (req, res) => {
  // req.body is validated ✅
  res.status(201).json({ message: 'User created' });
});
```

### Rate Limiting Middleware

```javascript
const rateLimit = (maxRequests, windowMs) => {
  const requests = new Map();

  return (req, res, next) => {
    const ip = req.ip;
    const now = Date.now();

    if (!requests.has(ip)) {
      requests.set(ip, []);
    }

    // Filter out old requests outside the window
    const userRequests = requests.get(ip).filter(time => now - time < windowMs);
    requests.set(ip, userRequests);

    if (userRequests.length >= maxRequests) {
      return res.status(429).json({
        error: 'Too many requests. Please try again later.',
      });
    }

    userRequests.push(now);
    next();
  };
};

// Max 100 requests per 15 minutes
app.use('/api', rateLimit(100, 15 * 60 * 1000));
```

---

## Error Handling Pattern

### Custom Error Class

```javascript
// utils/AppError.js
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // Distinguish from programming bugs
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
```

### Async Error Wrapper (Eliminates try-catch in every route)

```javascript
// utils/catchAsync.js
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next); // Pass error to next()
  };
};

module.exports = catchAsync;
```

### Usage

```javascript
const AppError = require('./utils/AppError');
const catchAsync = require('./utils/catchAsync');

// Without catchAsync (repetitive try-catch)
app.get('/users/:id', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) throw new AppError('User not found', 404);
    res.json(user);
  } catch (err) {
    next(err);
  }
});

// With catchAsync (clean!)
app.get('/users/:id', catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new AppError('User not found', 404);
  res.json(user);
}));
```

### Global Error Handler

```javascript
// middleware/errorHandler.js
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    message = 'Resource not found';
    statusCode = 404;
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    message = 'Duplicate field value entered';
    statusCode = 409;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    message = Object.values(err.errors).map(e => e.message).join(', ');
    statusCode = 400;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    message = 'Invalid token';
    statusCode = 401;
  }

  if (err.name === 'TokenExpiredError') {
    message = 'Token expired';
    statusCode = 401;
  }

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
```

---

## 🎯 Interview Tips

> **Q: What is middleware in Express?**
> Functions that execute during the request-response lifecycle. They can modify req/res, end the cycle, or pass control to the next middleware using `next()`.

> **Q: What happens if you forget to call `next()`?**
> The request will hang — the client never receives a response and eventually times out.

> **Q: How does error-handling middleware differ?**
> It has 4 parameters `(err, req, res, next)` instead of 3. Express identifies it by the parameter count. You trigger it by calling `next(err)`.

> **Q: Explain the `catchAsync` pattern.**
> It's a wrapper that catches rejected promises from async route handlers and passes the error to `next()`, avoiding repetitive try-catch blocks.

---
