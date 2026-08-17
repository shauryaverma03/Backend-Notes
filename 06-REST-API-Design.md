# 📗 06 — REST API Design & HTTP Methods (Partwise Guide)

---

## What is REST?

**REST** (Representational State Transfer) is an architectural style for designing networked applications. A **RESTful API** uses HTTP methods to operate on resources identified by URLs.

### Core REST Principles

| Principle | Description |
|-----------|-------------|
| **Client-Server** | Client and server are completely decoupled. |
| **Stateless** | Every request contains all information needed; server stores no client session context. |
| **Uniform Interface** | Consistent URL structures, standard HTTP verbs, and standard status codes. |
| **Cacheable** | Responses must explicitly declare whether they can be cached. |
| **Layered System** | Client doesn't need to know whether it's connected directly to the end server or an intermediate proxy/load balancer. |

---

## 🎯 RESTful URL Design Rules

### ✅ Good URL Conventions
```http
GET    /api/v1/users              → Fetch list of all users
GET    /api/v1/users/42           → Fetch single user by ID (42)
POST   /api/v1/users              → Create a new user
PUT    /api/v1/users/42           → Completely replace user 42
PATCH  /api/v1/users/42           → Partially update fields of user 42
DELETE /api/v1/users/42           → Delete user 42

GET    /api/v1/users/42/posts     → Fetch all posts written by user 42
POST   /api/v1/users/42/posts     → Create a post under user 42
```

### ❌ Anti-Patterns (Bad URLs)
```http
GET  /getUsers                 ← Verb in URL (❌ Bad)
GET  /api/user                 ← Singular resource name (❌ Use plural /users)
POST /api/users/create         ← Action verb in URL (❌ Use POST /api/users)
GET  /api/users/delete/42      ← Using GET to perform mutation/deletion (❌ Bad)
```

---

# 🛠️ Partwise Breakdown of HTTP Methods

Below is the step-by-step breakdown of each HTTP method with dedicated implementation code, request/response structures, and status codes.

---

## 📍 Part 1: GET — Retrieving Data (Read)

The `GET` method requests a representation of the specified resource. Requests using `GET` should **only retrieve data** and should have no side effects on the server data.

### Key Characteristics
- **Safe**: Yes (Does not alter server state)
- **Idempotent**: Yes (Multiple identical requests return the same result)
- **Request Body**: No (Data is sent via URL params or Query strings)
- **Success Status Codes**: `200 OK`

### 1.1 GET All Resources (with Filtering & Pagination)
```javascript
// GET /api/v1/users?name=john&page=1&limit=10
app.get('/api/v1/users', (req, res) => {
  let result = [...usersDatabase];

  // 1. Filtering by name (query parameter)
  if (req.query.name) {
    result = result.filter(u => 
      u.name.toLowerCase().includes(req.query.name.toLowerCase())
    );
  }

  // 2. Pagination (query parameters)
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const startIndex = (page - 1) * limit;
  const paginatedData = result.slice(startIndex, startIndex + limit);

  res.status(200).json({
    success: true,
    count: paginatedData.length,
    total: result.length,
    page,
    totalPages: Math.ceil(result.length / limit),
    data: paginatedData
  });
});
```

### 1.2 GET Single Resource by ID
```javascript
// GET /api/v1/users/42
app.get('/api/v1/users/:id', (req, res) => {
  const userId = parseInt(req.params.id, 10);
  const user = usersDatabase.find(u => u.id === userId);

  if (!user) {
    return res.status(404).json({
      success: false,
      error: `User with ID ${userId} not found`
    });
  }

  res.status(200).json({
    success: true,
    data: user
  });
});
```

---

## 📍 Part 2: POST — Creating New Data (Create)

The `POST` method submits an entity to the specified resource, causing a state change or side effects on the server (e.g. creating a new database record).

### Key Characteristics
- **Safe**: No (Mutates server state)
- **Idempotent**: No (Sending the same POST 5 times creates 5 separate records)
- **Request Body**: Yes (JSON payload containing new object data)
- **Success Status Codes**: `201 Created`

### 2.1 Implementation Code
```javascript
// POST /api/v1/users
app.post('/api/v1/users', (req, res) => {
  const { name, email, role } = req.body;

  // 1. Validation: Ensure required fields are present
  if (!name || !email) {
    return res.status(400).json({
      success: false,
      error: 'Please provide both name and email'
    });
  }

  // 2. Conflict Check: Ensure uniqueness (e.g., email)
  const existingUser = usersDatabase.find(u => u.email === email);
  if (existingUser) {
    return res.status(409).json({
      success: false,
      error: 'User with this email already exists'
    });
  }

  // 3. Create & Save New Record
  const newUser = {
    id: nextUserId++,
    name,
    email,
    role: role || 'user',
    createdAt: new Date().toISOString()
  };

  usersDatabase.push(newUser);

  // 4. Return 201 Created with newly created resource
  res.status(201).json({
    success: true,
    message: 'User created successfully',
    data: newUser
  });
});
```

### Sample Request & Response
```json
// POST Request Body:
{
  "name": "Alex Johnson",
  "email": "alex@example.com",
  "role": "developer"
}

// 201 Created Response:
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "id": 3,
    "name": "Alex Johnson",
    "email": "alex@example.com",
    "role": "developer",
    "createdAt": "2026-08-18T00:00:00.000Z"
  }
}
```

---

## 📍 Part 3: PUT — Complete Replacement (Update / Replace)

The `PUT` method **replaces the target resource entirely** with the request payload. If fields are omitted in a `PUT` request, those omitted fields will be set to `null` or overwritten.

### Key Characteristics
- **Safe**: No (Mutates server state)
- **Idempotent**: Yes (Calling PUT with identical payload multiple times leaves resource in exact same state)
- **Request Body**: Yes (Complete resource representation)
- **Success Status Codes**: `200 OK` or `204 No Content`

### 3.1 Implementation Code
```javascript
// PUT /api/v1/users/42
app.put('/api/v1/users/:id', (req, res) => {
  const userId = parseInt(req.params.id, 10);
  const index = usersDatabase.findIndex(u => u.id === userId);

  if (index === -1) {
    return res.status(404).json({
      success: false,
      error: `Cannot update. User with ID ${userId} does not exist.`
    });
  }

  const { name, email, role } = req.body;

  // PUT requires ALL mandatory fields to be supplied
  if (!name || !email || !role) {
    return res.status(400).json({
      success: false,
      error: 'PUT requires full resource representation (name, email, role)'
    });
  }

  // Complete overwrite of the resource
  const updatedUser = {
    id: userId,
    name,
    email,
    role,
    updatedAt: new Date().toISOString()
  };

  usersDatabase[index] = updatedUser;

  res.status(200).json({
    success: true,
    message: 'User replaced successfully',
    data: updatedUser
  });
});
```

---

## 📍 Part 4: PATCH — Partial Modification (Modify)

The `PATCH` method applies **partial modifications** to a resource. Only the fields explicitly provided in the request body are updated; all other existing properties remain unchanged.

### Key Characteristics
- **Safe**: No (Mutates server state)
- **Idempotent**: Can be idempotent (depending on implementation)
- **Request Body**: Yes (Only fields that need updating)
- **Success Status Codes**: `200 OK`

### 4.1 Implementation Code
```javascript
// PATCH /api/v1/users/42
app.patch('/api/v1/users/:id', (req, res) => {
  const userId = parseInt(req.params.id, 10);
  const user = usersDatabase.find(u => u.id === userId);

  if (!user) {
    return res.status(404).json({
      success: false,
      error: `User with ID ${userId} not found`
    });
  }

  const { name, email, role } = req.body;

  // Only update fields that are defined in request body
  if (name !== undefined) user.name = name;
  if (email !== undefined) user.email = email;
  if (role !== undefined) user.role = role;

  user.updatedAt = new Date().toISOString();

  res.status(200).json({
    success: true,
    message: 'User partially updated',
    data: user
  });
});
```

### PUT vs PATCH Quick Comparison
| Feature | `PUT` (Replace) | `PATCH` (Modify) |
|---------|-----------------|------------------|
| **Scope** | Entire resource replacement | Partial field updates |
| **Missing Fields** | Reset/Overwritten to default/null | Retains existing values |
| **Payload Size** | Larger (Full object) | Smaller (Only changed fields) |

---

## 📍 Part 5: DELETE — Removing Resources (Delete)

The `DELETE` method removes the specified resource from the server storage.

### Key Characteristics
- **Safe**: No (Deletes data)
- **Idempotent**: Yes (Deleting resource ID 42 once deletes it; subsequent DELETE requests return 404 but server state remains deleted)
- **Request Body**: No
- **Success Status Codes**: `204 No Content` or `200 OK`

### 5.1 Implementation Code
```javascript
// DELETE /api/v1/users/42
app.delete('/api/v1/users/:id', (req, res) => {
  const userId = parseInt(req.params.id, 10);
  const index = usersDatabase.findIndex(u => u.id === userId);

  if (index === -1) {
    return res.status(404).json({
      success: false,
      error: `User with ID ${userId} not found`
    });
  }

  // Hard delete (remove from array/DB)
  usersDatabase.splice(index, 1);

  // Return 204 No Content (No response body)
  res.status(204).send();
});
```

---

## 📊 Summary: HTTP Methods Quick Reference

| Method | CRUD Action | Safe? | Idempotent? | Request Body? | Default Success Status |
|--------|-------------|-------|-------------|---------------|------------------------|
| **GET** | Read | ✅ Yes | ✅ Yes | ❌ No | `200 OK` |
| **POST** | Create | ❌ No | ❌ No | ✅ Yes | `201 Created` |
| **PUT** | Replace | ❌ No | ✅ Yes | ✅ Yes | `200 OK` / `204 No Content` |
| **PATCH** | Partial Update | ❌ No | ⚠️ Varies | ✅ Yes | `200 OK` |
| **DELETE** | Remove | ❌ No | ✅ Yes | ❌ No | `204 No Content` / `200 OK` |

---

## 🏷️ Standard HTTP Response Status Codes

| Code Range | Category | Common Examples |
|------------|----------|-----------------|
| **2xx** | Success | `200 OK`, `201 Created`, `204 No Content` |
| **3xx** | Redirection | `301 Moved Permanently`, `304 Not Modified` |
| **4xx** | Client Errors | `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `409 Conflict` |
| **5xx** | Server Errors | `500 Internal Server Error`, `502 Bad Gateway`, `503 Service Unavailable` |

---

## 🎯 Interview Questions & Key Takeaways

> **Q: What is the difference between PUT and PATCH?**
> `PUT` replaces the whole entity (requires all fields, missing fields are overwritten), while `PATCH` performs a partial update modifying only specified fields.

> **Q: What does Idempotent mean in REST APIs?**
> An HTTP method is idempotent if executing it multiple times produces the exact same result on the server as executing it once (`GET`, `PUT`, `DELETE` are idempotent; `POST` is NOT idempotent).
