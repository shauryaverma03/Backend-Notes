# 📗 14 — Error Handling & Logging

---

## Error Types in Node.js

| Type | Example | Handling |
|------|---------|----------|
| **Operational** | Invalid user input, DB connection failed, file not found | Expected; handle gracefully |
| **Programming** | TypeError, null reference, wrong API usage | Bugs; fix the code |
| **Unhandled** | Uncaught exceptions, unhandled rejections | Catch globally; crash & restart |

---

## Express Error Handling

### Custom Error Class

```javascript
// utils/AppError.js
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
```

### Async Error Wrapper

```javascript
// utils/catchAsync.js
const catchAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = catchAsync;
```

### Global Error Handler

```javascript
// middleware/errorHandler.js
const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  } else {
    // Production: don't leak error details
    if (err.isOperational) {
      res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    } else {
      console.error('NON-OPERATIONAL ERROR:', err);
      res.status(500).json({
        status: 'error',
        message: 'Something went wrong',
      });
    }
  }
};

module.exports = errorHandler;
```

### Usage in Routes

```javascript
const AppError = require('./utils/AppError');
const catchAsync = require('./utils/catchAsync');

app.get('/api/users/:id', catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  res.json({ success: true, data: user });
}));

// 404 handler (after all routes)
app.all('*', (req, res, next) => {
  next(new AppError(`Route ${req.originalUrl} not found`, 404));
});

// Global error handler (LAST middleware)
app.use(errorHandler);
```

---

## Global Process Error Handlers

```javascript
// Catch unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('UNHANDLED REJECTION:', reason);
  // Graceful shutdown
  server.close(() => process.exit(1));
});

// Catch uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err);
  process.exit(1);  // Must exit — process is in undefined state
});

// Graceful shutdown on SIGTERM (e.g., from Docker/Heroku)
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated');
  });
});
```

---

## Logging

### Morgan — HTTP Request Logger

```bash
npm install morgan
```

```javascript
const morgan = require('morgan');

// Predefined formats
app.use(morgan('dev'));       // :method :url :status :response-time ms
app.use(morgan('combined'));  // Apache combined log format
app.use(morgan('tiny'));      // Minimal output

// Custom format
app.use(morgan(':method :url :status :response-time ms - :date[iso]'));

// Log to file
const fs = require('fs');
const path = require('path');
const accessLogStream = fs.createWriteStream(
  path.join(__dirname, 'access.log'),
  { flags: 'a' }  // Append mode
);
app.use(morgan('combined', { stream: accessLogStream }));
```

### Winston — Application Logger

```bash
npm install winston
```

```javascript
// utils/logger.js
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'my-api' },
  transports: [
    // Write errors to error.log
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
    }),
    // Write all logs to combined.log
    new winston.transports.File({
      filename: 'logs/combined.log',
    }),
  ],
});

// In development, also log to console
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    ),
  }));
}

module.exports = logger;
```

```javascript
// Usage
const logger = require('./utils/logger');

logger.info('Server started on port 3000');
logger.warn('Deprecated API endpoint accessed');
logger.error('Database connection failed', { error: err.message });
logger.debug('Request body:', req.body);
```

### Log Levels

```
error: 0    ← Most severe
warn:  1
info:  2
http:  3
verbose: 4
debug: 5
silly: 6    ← Least severe
```

---

## 🎯 Interview Tips

> **Q: What is the `catchAsync` pattern?**
> A wrapper function that catches rejected promises from async route handlers and forwards the error to Express's error-handling middleware via `next(err)`, eliminating repetitive try-catch blocks.

> **Q: Why separate operational errors from programming errors?**
> Operational errors (invalid input, timeout) are expected and handled gracefully with user-friendly messages. Programming errors (bugs) indicate the app is in an undefined state and should crash to be restarted by a process manager like PM2.

---
