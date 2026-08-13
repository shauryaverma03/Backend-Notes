# 📗 05 — Express.js

---

## What is Express.js?

Express is a **minimal, unopinionated web framework** for Node.js. It provides a thin layer over Node's `http` module with routing, middleware, and more.

```bash
npm install express
```

---

## Basic Express Server

```javascript
const express = require('express');
const app = express();

// Built-in middleware to parse JSON body
app.use(express.json());

// Built-in middleware to parse URL-encoded form data
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (req, res) => {
  res.send('Hello World!');
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

---

## Routing

### Basic Routes

```javascript
// HTTP methods
app.get('/users', (req, res) => { /* Get all users */ });
app.post('/users', (req, res) => { /* Create user */ });
app.put('/users/:id', (req, res) => { /* Replace user */ });
app.patch('/users/:id', (req, res) => { /* Update user */ });
app.delete('/users/:id', (req, res) => { /* Delete user */ });

// Match ALL HTTP methods
app.all('/secret', (req, res) => {
  res.send('Accessed via: ' + req.method);
});
```

### Route Parameters

```javascript
// /users/42
app.get('/users/:id', (req, res) => {
  console.log(req.params.id); // '42'
  res.json({ userId: req.params.id });
});

// /users/42/posts/7
app.get('/users/:userId/posts/:postId', (req, res) => {
  console.log(req.params); // { userId: '42', postId: '7' }
});
```

### Query Parameters

```javascript
// /search?q=node&page=2&limit=10
app.get('/search', (req, res) => {
  console.log(req.query.q);      // 'node'
  console.log(req.query.page);   // '2' (always a string!)
  console.log(req.query.limit);  // '10'
});
```

### Request Body

```javascript
// POST /users with body: { "name": "John", "email": "john@mail.com" }
app.post('/users', (req, res) => {
  console.log(req.body.name);    // 'John'
  console.log(req.body.email);   // 'john@mail.com'
  res.status(201).json({ message: 'User created', user: req.body });
});
```

---

## The Request Object (`req`)

```javascript
req.params       // Route parameters  → { id: '42' }
req.query        // Query string      → { page: '2', limit: '10' }
req.body         // Request body      → { name: 'John' }
req.headers      // Request headers   → { 'content-type': 'application/json' }
req.method       // HTTP method       → 'GET'
req.url          // Full URL path     → '/users?page=2'
req.path         // URL path only     → '/users'
req.ip           // Client IP address
req.hostname     // Hostname          → 'localhost'
req.protocol     // 'http' or 'https'
req.cookies      // Parsed cookies (needs cookie-parser middleware)
req.get('Content-Type')  // Get specific header
```

---

## The Response Object (`res`)

```javascript
// Send response
res.send('Hello');                       // Send string (auto Content-Type)
res.json({ name: 'John' });             // Send JSON
res.status(201).json({ id: 1 });         // Status + JSON
res.sendStatus(204);                     // Send just the status

// Redirect
res.redirect('/login');                  // 302 redirect
res.redirect(301, '/new-url');           // 301 permanent redirect

// Set headers
res.set('X-Custom-Header', 'value');
res.cookie('name', 'value', { httpOnly: true });

// Send file
res.sendFile('/absolute/path/to/file.html');
res.download('/path/to/file.pdf');       // Prompt download

// Render template (with view engine)
res.render('index', { title: 'Home' });
```

---

## Express Router (Modular Routing)

Organize routes into separate files:

```javascript
// routes/userRoutes.js
const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ users: [] });
});

router.get('/:id', (req, res) => {
  res.json({ user: { id: req.params.id } });
});

router.post('/', (req, res) => {
  res.status(201).json({ message: 'User created' });
});

router.put('/:id', (req, res) => {
  res.json({ message: 'User updated' });
});

router.delete('/:id', (req, res) => {
  res.json({ message: 'User deleted' });
});

module.exports = router;
```

```javascript
// app.js
const express = require('express');
const userRoutes = require('./routes/userRoutes');

const app = express();
app.use(express.json());

// Mount router at /api/users
app.use('/api/users', userRoutes);
// Now: GET /api/users, GET /api/users/:id, POST /api/users, etc.

app.listen(3000);
```

---

## Route Chaining

```javascript
router.route('/users')
  .get((req, res) => { /* get all */ })
  .post((req, res) => { /* create */ });

router.route('/users/:id')
  .get((req, res) => { /* get one */ })
  .put((req, res) => { /* update */ })
  .delete((req, res) => { /* delete */ });
```

---

## Serving Static Files

```javascript
// Serve files from "public" directory
app.use(express.static('public'));
// Now: /images/logo.png → public/images/logo.png
// Now: /css/style.css   → public/css/style.css

// With virtual path prefix
app.use('/static', express.static('public'));
// Now: /static/images/logo.png → public/images/logo.png

// Multiple directories
app.use(express.static('public'));
app.use(express.static('uploads'));
```

---

## View Engines (Server-Side Rendering)

```bash
npm install ejs
```

```javascript
// app.js
app.set('view engine', 'ejs');
app.set('views', './views');  // Directory for templates

app.get('/', (req, res) => {
  res.render('index', {
    title: 'Home',
    users: ['John', 'Jane'],
  });
});
```

```html
<!-- views/index.ejs -->
<!DOCTYPE html>
<html>
<head><title><%= title %></title></head>
<body>
  <h1><%= title %></h1>
  <ul>
    <% users.forEach(user => { %>
      <li><%= user %></li>
    <% }); %>
  </ul>
</body>
</html>
```

### EJS Tags
```
<%= variable %>      Output escaped HTML (safe)
<%- variable %>      Output unescaped HTML (dangerous — XSS risk)
<% code %>           Execute JS (no output)
<%# comment %>       Comment (not rendered)
<%- include('partial') %>  Include another template
```

---

## Project Structure (MVC Pattern)

```
project/
├── config/
│   └── db.js              # Database connection
├── controllers/
│   ├── userController.js  # Business logic
│   └── authController.js
├── middleware/
│   ├── auth.js            # Auth middleware
│   └── errorHandler.js    # Error handling
├── models/
│   ├── User.js            # Database schema/model
│   └── Post.js
├── routes/
│   ├── userRoutes.js      # Route definitions
│   └── authRoutes.js
├── utils/
│   └── helpers.js         # Utility functions
├── views/                 # Templates (if using SSR)
├── public/                # Static files
├── .env                   # Environment variables
├── .gitignore
├── package.json
├── app.js                 # Express app setup
└── server.js              # Server entry point
```

### Separating App and Server

```javascript
// app.js — Express setup (exportable for testing)
const express = require('express');
const app = express();

app.use(express.json());
// ... routes, middleware

module.exports = app;
```

```javascript
// server.js — Entry point (starts the server)
const app = require('./app');
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

---

## 🎯 Interview Tips

> **Q: What is Express.js and why use it?**
> Express is a minimal web framework for Node.js. It simplifies routing, middleware, request/response handling, and building APIs compared to raw `http` module.

> **Q: What is the difference between `app.use()` and `app.get()`?**
> `app.use()` matches ANY HTTP method and also matches sub-paths (e.g., `/api` matches `/api/users`). `app.get()` only matches GET requests to the exact path.

> **Q: Difference between `res.send()` and `res.json()`?**
> `res.json()` converts the argument to JSON and sets `Content-Type: application/json`. `res.send()` auto-detects the type — objects become JSON, strings become HTML.

---
