# 📗 06 — REST API Design

---

## What is REST?

**REST** (Representational State Transfer) is an architectural style for designing networked applications. A **RESTful API** uses HTTP methods to operate on resources identified by URLs.

### REST Principles

| Principle | Description |
|-----------|-------------|
| **Client-Server** | Client and server are independent |
| **Stateless** | Each request contains all info needed; server stores no client state |
| **Uniform Interface** | Consistent URL structure and HTTP methods |
| **Cacheable** | Responses should indicate if they can be cached |
| **Layered System** | Client doesn't need to know about intermediaries (load balancers, proxies) |

---

## RESTful URL Design

### ✅ Good URL Design

```
GET    /api/users              → Get all users
GET    /api/users/42           → Get user with id 42
POST   /api/users              → Create a new user
PUT    /api/users/42           → Replace user 42
PATCH  /api/users/42           → Update fields of user 42
DELETE /api/users/42           → Delete user 42

GET    /api/users/42/posts     → Get all posts by user 42
GET    /api/users/42/posts/7   → Get post 7 by user 42
POST   /api/users/42/posts     → Create a post for user 42
```

### ❌ Bad URL Design

```
GET  /getUsers                 ← Verb in URL (❌)
GET  /api/user                 ← Singular (use plural ✅ /users)
POST /api/users/create         ← Action in URL (use HTTP method instead)
GET  /api/users/delete/42      ← Using GET for deletion
```

### Rules

1. Use **nouns**, not verbs → `/users` not `/getUsers`
2. Use **plural** → `/users` not `/user`
3. Use **kebab-case** → `/user-profiles` not `/userProfiles`
4. Use **query params** for filtering → `/users?role=admin&sort=name`
5. Use **nesting** for relationships → `/users/42/posts`
6. Don't nest more than 2 levels → `/users/42/posts` ✅ but `/users/42/posts/7/comments/3/likes` ❌

---

## Complete CRUD API Example

```javascript
const express = require('express');
const app = express();
app.use(express.json());

// In-memory database (use real DB in production)
let users = [
  { id: 1, name: 'John', email: 'john@mail.com' },
  { id: 2, name: 'Jane', email: 'jane@mail.com' },
];
let nextId = 3;

// GET all users (with filtering & pagination)
app.get('/api/users', (req, res) => {
  let result = [...users];

  // Filtering
  if (req.query.name) {
    result = result.filter(u => 
      u.name.toLowerCase().includes(req.query.name.toLowerCase())
    );
  }

  // Pagination
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;

  const paginatedResult = result.slice(startIndex, endIndex);

  res.json({
    success: true,
    count: result.length,
    page,
    totalPages: Math.ceil(result.length / limit),
    data: paginatedResult,
  });
});

// GET single user
app.get('/api/users/:id', (req, res) => {
  const user = users.find(u => u.id === parseInt(req.params.id));

  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'User not found',
    });
  }

  res.json({ success: true, data: user });
});

// POST create user
app.post('/api/users', (req, res) => {
  const { name, email } = req.body;

  // Validation
  if (!name || !email) {
    return res.status(400).json({
      success: false,
      error: 'Please provide name and email',
    });
  }

  // Check duplicate
  if (users.find(u => u.email === email)) {
    return res.status(409).json({
      success: false,
      error: 'Email already exists',
    });
  }

  const newUser = { id: nextId++, name, email };
  users.push(newUser);

  res.status(201).json({ success: true, data: newUser });
});

// PUT replace user (full update)
app.put('/api/users/:id', (req, res) => {
  const index = users.findIndex(u => u.id === parseInt(req.params.id));

  if (index === -1) {
    return res.status(404).json({
      success: false,
      error: 'User not found',
    });
  }

  const { name, email } = req.body;
  if (!name || !email) {
    return res.status(400).json({
      success: false,
      error: 'PUT requires all fields (name, email)',
    });
  }

  users[index] = { id: users[index].id, name, email };
  res.json({ success: true, data: users[index] });
});

// PATCH partial update
app.patch('/api/users/:id', (req, res) => {
  const user = users.find(u => u.id === parseInt(req.params.id));

  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'User not found',
    });
  }

  // Only update provided fields
  if (req.body.name) user.name = req.body.name;
  if (req.body.email) user.email = req.body.email;

  res.json({ success: true, data: user });
});

// DELETE user
app.delete('/api/users/:id', (req, res) => {
  const index = users.findIndex(u => u.id === parseInt(req.params.id));

  if (index === -1) {
    return res.status(404).json({
      success: false,
      error: 'User not found',
    });
  }

  users.splice(index, 1);
  res.status(204).send(); // No content
});

app.listen(3000);
```

---

## API Response Format (Consistent Structure)

### Success Response
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "John",
    "email": "john@mail.com"
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": "User not found",
  "statusCode": 404
}
```

### List Response (with pagination)
```json
{
  "success": true,
  "count": 100,
  "page": 2,
  "limit": 10,
  "totalPages": 10,
  "data": [ ... ]
}
```

---

## API Versioning

```javascript
// URL versioning (most common)
app.use('/api/v1/users', userRoutesV1);
app.use('/api/v2/users', userRoutesV2);

// Header versioning
app.get('/api/users', (req, res) => {
  const version = req.headers['api-version'] || '1';
  if (version === '2') { /* v2 logic */ }
  else { /* v1 logic */ }
});
```

---

## 🎯 Interview Tips

> **Q: What makes an API RESTful?**
> It follows REST constraints: client-server separation, statelessness, uniform interface (proper use of HTTP methods and status codes), resource-based URLs with nouns, and cacheability.

> **Q: How do you handle pagination in APIs?**
> Use query parameters: `/api/users?page=2&limit=10`. Return metadata like total count, current page, and total pages in the response.

> **Q: What is HATEOAS?**
> Hypermedia As The Engine Of Application State. API responses include links to related resources:
> ```json
> { "id": 1, "name": "John", "links": { "self": "/users/1", "posts": "/users/1/posts" } }
> ```

---
