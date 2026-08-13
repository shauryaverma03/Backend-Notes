# 📗 04 — HTTP & Networking

---

## How the Web Works (Quick Recap)

```
Client (Browser)                          Server (Node.js)
     │                                         │
     │──── HTTP Request (GET /users) ─────────▶│
     │                                         │ Process request
     │◀─── HTTP Response (200 OK + JSON) ──────│
     │                                         │
```

### URL Anatomy

```
https://api.example.com:3000/users?page=1&limit=10#section2
└─┬──┘ └──────┬───────┘└┬─┘└──┬─┘└───────┬───────┘└───┬──┘
protocol    hostname   port  path    query string    fragment
        └──────┬──────┘
             host
```

---

## HTTP Methods

| Method | Purpose | Idempotent | Body |
|--------|---------|------------|------|
| **GET** | Retrieve data | ✅ Yes | ❌ No |
| **POST** | Create new resource | ❌ No | ✅ Yes |
| **PUT** | Replace entire resource | ✅ Yes | ✅ Yes |
| **PATCH** | Partially update resource | ❌ No | ✅ Yes |
| **DELETE** | Delete resource | ✅ Yes | ❌ Usually no |
| **HEAD** | Same as GET but no body | ✅ Yes | ❌ No |
| **OPTIONS** | Check allowed methods (CORS preflight) | ✅ Yes | ❌ No |

> **Idempotent** = Making the same request multiple times gives the same result.

---

## HTTP Status Codes

### 1xx — Informational
| Code | Meaning |
|------|---------|
| 100 | Continue |
| 101 | Switching Protocols (WebSocket upgrade) |

### 2xx — Success ✅
| Code | Meaning | When to Use |
|------|---------|-------------|
| **200** | OK | Successful GET, PUT, PATCH |
| **201** | Created | Successful POST (resource created) |
| **204** | No Content | Successful DELETE (nothing to return) |

### 3xx — Redirection ↩️
| Code | Meaning |
|------|---------|
| 301 | Moved Permanently |
| 302 | Found (temporary redirect) |
| 304 | Not Modified (cached) |

### 4xx — Client Error ❌
| Code | Meaning | When to Use |
|------|---------|-------------|
| **400** | Bad Request | Invalid input / validation error |
| **401** | Unauthorized | Not authenticated (no token / bad token) |
| **403** | Forbidden | Authenticated but no permission |
| **404** | Not Found | Resource doesn't exist |
| **405** | Method Not Allowed | Wrong HTTP method |
| **409** | Conflict | Duplicate resource (e.g., email exists) |
| **422** | Unprocessable Entity | Valid JSON but semantic errors |
| **429** | Too Many Requests | Rate limit exceeded |

### 5xx — Server Error 💥
| Code | Meaning |
|------|---------|
| **500** | Internal Server Error (generic) |
| **502** | Bad Gateway |
| **503** | Service Unavailable |
| **504** | Gateway Timeout |

---

## Creating an HTTP Server (No Framework)

```javascript
const http = require('http');

const server = http.createServer((req, res) => {
  // req = IncomingMessage (readable stream)
  // res = ServerResponse (writable stream)

  // Request info
  console.log(req.method);   // 'GET'
  console.log(req.url);      // '/users?page=1'
  console.log(req.headers);  // { 'content-type': 'application/json', ... }

  // Parse URL
  const url = new URL(req.url, `http://${req.headers.host}`);
  console.log(url.pathname);          // '/users'
  console.log(url.searchParams.get('page')); // '1'

  // Routing
  if (req.method === 'GET' && url.pathname === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end('<h1>Home Page</h1>');
  } 
  else if (req.method === 'GET' && url.pathname === '/api/users') {
    const users = [{ id: 1, name: 'John' }, { id: 2, name: 'Jane' }];
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(users));
  } 
  else if (req.method === 'POST' && url.pathname === '/api/users') {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      const user = JSON.parse(body);
      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'User created', user }));
    });
  } 
  else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not Found' }));
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

---

## HTTP Headers

### Common Request Headers
```
Content-Type: application/json          ← Body format
Authorization: Bearer <token>           ← Auth token
Accept: application/json                ← Expected response format
User-Agent: Mozilla/5.0                 ← Client info
Cookie: session=abc123                  ← Cookies
Origin: http://localhost:3000           ← Request origin (CORS)
```

### Common Response Headers
```
Content-Type: application/json          ← Body format
Set-Cookie: session=abc123; HttpOnly    ← Set cookie
Access-Control-Allow-Origin: *          ← CORS
Cache-Control: no-cache                 ← Caching policy
Location: /users/123                    ← Redirect URL (with 301/302)
X-RateLimit-Remaining: 99              ← Rate limit info
```

---

## Making HTTP Requests from Node.js

### Using Built-in `http`/`https`

```javascript
const https = require('https');

https.get('https://jsonplaceholder.typicode.com/users', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log(JSON.parse(data));
  });
}).on('error', (err) => {
  console.error(err);
});
```

### Using `fetch` (Built-in since Node 18)

```javascript
// GET
const response = await fetch('https://api.example.com/users');
const users = await response.json();

// POST
const response = await fetch('https://api.example.com/users', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'John', email: 'john@mail.com' }),
});
const newUser = await response.json();
```

### Using `axios` (Popular Library)

```javascript
const axios = require('axios');

// GET
const { data } = await axios.get('https://api.example.com/users');

// POST
const { data } = await axios.post('https://api.example.com/users', {
  name: 'John',
  email: 'john@mail.com',
});

// With config
const response = await axios({
  method: 'put',
  url: '/users/1',
  data: { name: 'Updated Name' },
  headers: { Authorization: 'Bearer token123' },
  timeout: 5000,
});
```

---

## JSON — The Language of APIs

```javascript
// JavaScript Object → JSON String
const obj = { name: 'John', age: 25 };
const jsonString = JSON.stringify(obj);
// '{"name":"John","age":25}'

// JSON String → JavaScript Object
const parsed = JSON.parse(jsonString);
// { name: 'John', age: 25 }

// Pretty print
JSON.stringify(obj, null, 2);
// {
//   "name": "John",
//   "age": 25
// }
```

---

## 🎯 Interview Tips

> **Q: Difference between PUT and PATCH?**
> PUT replaces the **entire** resource. PATCH updates only the **specified fields**. PUT is idempotent, PATCH may not be.

> **Q: Difference between 401 and 403?**
> 401 (Unauthorized) = "Who are you?" — the user is not authenticated.
> 403 (Forbidden) = "I know who you are, but you can't do this." — authenticated but no permission.

> **Q: What is idempotency?**
> An operation is idempotent if performing it multiple times produces the same result as performing it once. GET, PUT, DELETE are idempotent. POST is NOT (creates a new resource each time).

---
