# 📗 05 — Express.js Framework (Partwise Guide)

---

## What is Express.js?

Express is a **minimal, unopinionated web framework** for Node.js. It provides a thin, high-performance layer over Node's built-in `http` module with routing, middleware pipeline, and template rendering.

```bash
npm install express
```

---

# 🛠️ Partwise Breakdown of Express.js

---

## 📍 Part 1: Basic Express Server & Setup

```javascript
const express = require('express');
const app = express();

// 1. Built-in middleware to parse incoming JSON bodies
app.use(express.json());

// 2. Built-in middleware to parse URL-encoded form data
app.use(express.urlencoded({ extended: true }));

// 3. Define root GET route
app.get('/', (req, res) => {
  res.status(200).send('Hello, Express Server is live!');
});

// 4. Start listening on port
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
```

---

## 📍 Part 2: Routing Essentials (Methods, Params, Query, Body)

### 2.1 Route Methods & Match All
```javascript
// HTTP Methods
app.get('/users', (req, res) => { /* Fetch users */ });
app.post('/users', (req, res) => { /* Create user */ });
app.put('/users/:id', (req, res) => { /* Replace user */ });
app.patch('/users/:id', (req, res) => { /* Partial update user */ });
app.delete('/users/:id', (req, res) => { /* Delete user */ });

// Match ALL HTTP methods for a path
app.all('/health', (req, res) => {
  res.json({ status: 'OK', method: req.method });
});
```

### 2.2 Route Parameters (`req.params`)
```javascript
// Route URL: /users/42/posts/7
app.get('/users/:userId/posts/:postId', (req, res) => {
  const { userId, postId } = req.params;
  res.status(200).json({
    userId,
    postId,
    message: `Fetching post ${postId} for user ${userId}`
  });
});
```

### 2.3 Query Parameters (`req.query`)
```javascript
// Request URL: /search?q=node&page=2&limit=10
app.get('/search', (req, res) => {
  const query = req.query.q;            // 'node'
  const page = req.query.page || '1';    // '2' (always string)
  const limit = req.query.limit || '10'; // '10'

  res.status(200).json({
    query,
    page: parseInt(page, 10),
    limit: parseInt(limit, 10)
  });
});
```

### 2.4 Request Body Handling (`req.body`)
```javascript
// POST /api/users with JSON payload
app.post('/api/users', (req, res) => {
  const { name, email } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }

  res.status(201).json({
    message: 'User created successfully',
    data: { id: Date.now(), name, email }
  });
});
```

---

## 📍 Part 3: Request (`req`) & Response (`res`) Objects Reference

### 3.1 Request Object Cheat Sheet
```javascript
req.params        // Route parameters   → { id: '42' }
req.query         // Query parameters   → { page: '2', limit: '10' }
req.body          // Request body payload → { name: 'John' }
req.headers       // Request headers    → { 'content-type': 'application/json' }
req.method        // HTTP method        → 'GET'
req.path          // Path portion       → '/users'
req.ip            // Client IP address
req.get('Header') // Helper to get header case-insensitively
```

### 3.2 Response Object Cheat Sheet
```javascript
res.send('Text')                       // Send plain text or HTML
res.json({ success: true })            // Send JSON response
res.status(201).json({ data: user })   // Set HTTP status code + send JSON
res.sendStatus(204)                    // Send status with default text
res.redirect('/login')                 // Perform 302 redirect
res.set('X-Custom-Header', 'Value')   // Set custom response header
res.sendFile('/absolute/path/file.pdf')// Send file directly
```

---

## 📍 Part 4: Express Router (Modular Architecture)

Separate routes into clean, maintainable module files using `express.Router()`.

### 4.1 Define Modular Router
```javascript
// routes/userRoutes.js
const express = require('express');
const router = express.Router();

// GET /api/users
router.get('/', (req, res) => {
  res.json({ success: true, users: [] });
});

// GET /api/users/:id
router.get('/:id', (req, res) => {
  res.json({ success: true, userId: req.params.id });
});

// POST /api/users
router.post('/', (req, res) => {
  res.status(201).json({ success: true, message: 'User created' });
});

module.exports = router;
```

### 4.2 Mount Router in Main Application
```javascript
// app.js
const express = require('express');
const userRoutes = require('./routes/userRoutes');

const app = express();
app.use(express.json());

// Mount user router under /api/users
app.use('/api/users', userRoutes);

app.listen(3000);
```

---

## 📍 Part 5: Serving Static Files & View Engines (SSR)

### 5.1 Static Files Middleware
```javascript
// Serve static assets from 'public' directory
app.use(express.static('public'));

// Virtual path prefix: http://localhost:3000/static/images/logo.png
app.use('/static', express.static('public'));
```

### 5.2 Server-Side Rendering with EJS
```javascript
// app.js
app.set('view engine', 'ejs');
app.set('views', './views');

app.get('/dashboard', (req, res) => {
  res.render('dashboard', {
    user: 'Alice',
    notifications: ['New message', 'System update']
  });
});
```

---

## 📍 Part 6: Enterprise MVC Architecture & App/Server Separation

### 6.1 Clean MVC Directory Layout
```
project/
├── config/           # Database & environment configuration
├── controllers/      # Route logic & request processors
├── middleware/       # Custom auth & error handling middlewares
├── models/           # Database schemas
├── routes/           # Express router endpoints
├── utils/            # Utility helpers
├── app.js            # Express app setup (Exportable for Supertest)
└── server.js         # Server entry point (starts app.listen)
```

### 6.2 Separating `app.js` and `server.js`
```javascript
// app.js (Express configuration)
const express = require('express');
const app = express();

app.use(express.json());
app.use('/api/users', require('./routes/userRoutes'));

module.exports = app;
```

```javascript
// server.js (Application Bootstrap)
const app = require('./app');
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server executing on port ${PORT}`);
});
```

---

## 🎯 Interview Questions & Key Takeaways

> **Q: What is the difference between `app.use()` and `app.get()`?**
> `app.use()` matches ALL HTTP methods and matches prefix paths (`/api` matches `/api/users`), whereas `app.get()` matches ONLY GET requests to that exact path.

> **Q: Difference between `res.send()` and `res.json()`?**
> `res.json()` explicitly converts data to JSON and sets `Content-Type: application/json`. `res.send()` auto-inspects the data type (string to HTML, object to JSON).
