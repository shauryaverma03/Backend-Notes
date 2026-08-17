# 📗 07 — Middleware Deep Dive (Partwise Guide)

---

## What is Middleware?

Middleware functions are functions that have access to the **request object** (`req`), the **response object** (`res`), and the **next middleware function** (`next`) in the application request-response cycle.

```
Request → [Middleware 1] → [Middleware 2] → [Route Handler] → Response
```

```javascript
function myMiddleware(req, res, next) {
  console.log('Middleware executed');
  next(); // Pass control to the next middleware in the stack
}
```

> **Warning**: If `next()` is not called and a response is not sent, the request will hang indefinitely until timeout!

---

# 🛠️ Partwise Breakdown of Middleware Architecture

---

## 📍 Part 1: The 5 Core Types of Middleware

### 1.1 Application-Level Middleware
```javascript
// Executes on EVERY request to the application
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Executes only on paths starting with /api
app.use('/api', (req, res, next) => {
  console.log('API middleware triggered');
  next();
});
```

### 1.2 Router-Level Middleware
```javascript
const router = express.Router();

// Middleware bound specifically to this router instance
router.use((req, res, next) => {
  console.log('Router-specific auth check');
  next();
});

router.get('/profile', (req, res) => res.json({ status: 'ok' }));
```

### 1.3 Built-In Middleware
```javascript
app.use(express.json());                         // Parse JSON payloads
app.use(express.urlencoded({ extended: true }));  // Parse URL-encoded body
app.use(express.static('public'));                // Serve static assets
```

### 1.4 Third-Party Middleware
```javascript
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');

app.use(cors());          // Cross-Origin Resource Sharing
app.use(morgan('dev'));   // HTTP request logger
app.use(helmet());        // Security headers
app.use(cookieParser());  // Parse cookie header
```

### 1.5 Error-Handling Middleware (4 Parameters)
```javascript
// MUST accept 4 arguments: (err, req, res, next)
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
});
```

---

## 📍 Part 2: Middleware Execution Order & Pipeline Rules

Execution order depends strictly on declaration order in code:

```javascript
// 1. First: Parse incoming JSON
app.use(express.json());

// 2. Second: Request Logger
app.use(morgan('dev'));

// 3. Third: Route Handler
app.get('/api/users', (req, res) => res.send('Users list'));

// 4. Fourth: 404 Handler (Placed AFTER all valid routes)
app.use((req, res, next) => {
  res.status(404).json({ error: 'Route not found' });
});

// 5. Fifth: Global Error Handler (Placed LAST in app.use stack)
app.use((err, req, res, next) => {
  res.status(500).json({ error: err.message });
});
```

---

## 📍 Part 3: Production Custom Middleware Library

### 3.1 Custom Request Logger Middleware
```javascript
const logger = (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.originalUrl} [${res.statusCode}] - ${duration}ms`);
  });
  next();
};

app.use(logger);
```

### 3.2 Authentication Guard Middleware
```javascript
const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization token required' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Attach decoded user info to request object
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};
```

### 3.3 Role-Based Authorization Middleware (Higher-Order Function)
```javascript
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Forbidden: Insufficient privileges'
      });
    }
    next();
  };
};

// Usage: Only admins can access delete user route
app.delete('/api/users/:id', protect, authorize('admin'), (req, res) => {
  res.json({ message: 'User deleted' });
});
```

---

## 📍 Part 4: Enterprise Async Error Handling Pattern

### 4.1 Custom AppError Class
```javascript
// utils/AppError.js
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // Distinguishes operational errors from bugs
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
```

### 4.2 Async Wrapper (`catchAsync`)
Eliminates repetitive `try-catch` blocks in every async controller:

```javascript
// utils/catchAsync.js
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

module.exports = catchAsync;
```

### 4.3 Controller Usage Example
```javascript
const AppError = require('./utils/AppError');
const catchAsync = require('./utils/catchAsync');

app.get('/users/:id', catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return next(new AppError('User not found with that ID', 404));
  }
  res.status(200).json({ success: true, data: user });
}));
```

---

## 🎯 Interview Questions & Key Takeaways

> **Q: How does Express identify error-handling middleware?**
> By checking the function's arity (parameter count). Error middleware MUST take exactly 4 parameters: `(err, req, res, next)`.

> **Q: What is the purpose of `catchAsync`?**
> It wraps async functions and catches rejected promises, passing the error directly to `next(err)` to eliminate boilerplate `try-catch` blocks across controllers.
