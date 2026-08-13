# 📗 17 — WebSockets & Real-time Communication

---

## HTTP vs WebSockets

| Feature | HTTP | WebSocket |
|---------|------|-----------|
| Connection | New connection per request | Persistent connection |
| Direction | Client → Server (request-response) | **Bidirectional** (full-duplex) |
| Overhead | Headers sent every request | Minimal overhead after handshake |
| Use Case | CRUD APIs, web pages | Chat, notifications, live data |

```
HTTP:
Client ──request──▶ Server
Client ◀──response── Server
(connection closed)

WebSocket:
Client ◀──────────▶ Server
(persistent bidirectional connection)
```

---

## Socket.io

```bash
npm install socket.io           # Server
npm install socket.io-client    # Client (if using in Node/React)
```

### Server Setup

```javascript
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

// Connection event
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Listen for events from client
  socket.on('chat:message', (data) => {
    console.log('Message received:', data);

    // Send to ALL connected clients (including sender)
    io.emit('chat:message', {
      user: data.user,
      text: data.text,
      timestamp: new Date(),
    });
  });

  // Send to ALL EXCEPT sender
  socket.on('typing', (username) => {
    socket.broadcast.emit('typing', username);
  });

  // Send to ONLY the sender
  socket.emit('welcome', { message: 'Welcome to the chat!' });

  // Rooms
  socket.on('join:room', (roomName) => {
    socket.join(roomName);
    io.to(roomName).emit('system', `A user joined ${roomName}`);
  });

  socket.on('room:message', ({ room, message }) => {
    io.to(room).emit('chat:message', message);
  });

  socket.on('leave:room', (roomName) => {
    socket.leave(roomName);
  });

  // Disconnect
  socket.on('disconnect', (reason) => {
    console.log(`User disconnected: ${socket.id}, reason: ${reason}`);
  });
});

server.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

### Client (Browser)

```html
<script src="/socket.io/socket.io.js"></script>
<script>
  const socket = io('http://localhost:3000');

  // Connected
  socket.on('connect', () => {
    console.log('Connected:', socket.id);
  });

  // Send message
  function sendMessage(text) {
    socket.emit('chat:message', {
      user: 'John',
      text: text,
    });
  }

  // Receive message
  socket.on('chat:message', (data) => {
    console.log(`${data.user}: ${data.text}`);
    // Append to DOM
  });

  // Join room
  socket.emit('join:room', 'general');

  // Typing indicator
  input.addEventListener('input', () => {
    socket.emit('typing', 'John');
  });

  socket.on('typing', (username) => {
    console.log(`${username} is typing...`);
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log('Disconnected from server');
  });
</script>
```

---

## Socket.io Emit Cheat Sheet

```javascript
// To the sender only
socket.emit('event', data);

// To ALL connected clients (including sender)
io.emit('event', data);

// To all EXCEPT the sender
socket.broadcast.emit('event', data);

// To all in a specific room
io.to('room-name').emit('event', data);

// To all in room EXCEPT sender
socket.to('room-name').emit('event', data);

// To a specific socket by ID
io.to(socketId).emit('event', data);
```

---

## Socket.io with Authentication

```javascript
// Server-side middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('Authentication required'));

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded;
    next();
  } catch (err) {
    next(new Error('Invalid token'));
  }
});

io.on('connection', (socket) => {
  console.log(`Authenticated user: ${socket.user.id}`);
});

// Client-side
const socket = io('http://localhost:3000', {
  auth: { token: 'my-jwt-token' },
});
```

---

## 🎯 Interview Tips

> **Q: When to use WebSockets vs HTTP?**
> WebSockets: chat apps, live notifications, real-time dashboards, multiplayer games, collaborative editing. HTTP: CRUD APIs, file uploads, form submissions, static content.

> **Q: What is Socket.io?**
> A library that enables real-time, bidirectional communication between client and server. It uses WebSockets with automatic fallback to HTTP long-polling for compatibility.

> **Q: What are rooms in Socket.io?**
> Rooms are arbitrary channels that sockets can join and leave. You can broadcast to all sockets in a room. Useful for chat rooms, game lobbies, or group notifications.

---
