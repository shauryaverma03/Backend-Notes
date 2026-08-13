# 📗 16 — Testing

---

## Types of Testing

| Type | What | How | Speed |
|------|------|-----|-------|
| **Unit** | Individual functions/methods | Isolated, mocked dependencies | ⚡ Fast |
| **Integration** | Multiple components together | Test with real DB/services | 🔄 Medium |
| **E2E (End-to-End)** | Full user workflows | Simulate real user interactions | 🐢 Slow |

---

## Jest — Testing Framework

```bash
npm install --save-dev jest
```

```json
// package.json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watchAll",
    "test:coverage": "jest --coverage"
  }
}
```

### Basic Test Structure

```javascript
// math.js
const add = (a, b) => a + b;
const divide = (a, b) => {
  if (b === 0) throw new Error('Cannot divide by zero');
  return a / b;
};
module.exports = { add, divide };
```

```javascript
// math.test.js (or __tests__/math.test.js)
const { add, divide } = require('./math');

describe('Math functions', () => {
  describe('add()', () => {
    test('should add two positive numbers', () => {
      expect(add(2, 3)).toBe(5);
    });

    test('should handle negative numbers', () => {
      expect(add(-1, 1)).toBe(0);
    });

    test('should handle zero', () => {
      expect(add(0, 0)).toBe(0);
    });
  });

  describe('divide()', () => {
    test('should divide two numbers', () => {
      expect(divide(10, 2)).toBe(5);
    });

    test('should throw on division by zero', () => {
      expect(() => divide(10, 0)).toThrow('Cannot divide by zero');
    });
  });
});
```

### Common Jest Matchers

```javascript
// Equality
expect(value).toBe(5);              // Strict equality (===)
expect(obj).toEqual({ a: 1 });      // Deep equality
expect(value).not.toBe(3);          // Negation

// Truthiness
expect(value).toBeTruthy();
expect(value).toBeFalsy();
expect(value).toBeNull();
expect(value).toBeUndefined();
expect(value).toBeDefined();

// Numbers
expect(value).toBeGreaterThan(3);
expect(value).toBeGreaterThanOrEqual(3);
expect(value).toBeLessThan(5);
expect(value).toBeCloseTo(0.3, 1);  // For floating point

// Strings
expect(str).toMatch(/regex/);
expect(str).toContain('substring');

// Arrays
expect(arr).toContain(item);
expect(arr).toHaveLength(3);

// Objects
expect(obj).toHaveProperty('name');
expect(obj).toHaveProperty('name', 'John');
expect(obj).toMatchObject({ name: 'John' });

// Exceptions
expect(() => fn()).toThrow();
expect(() => fn()).toThrow('specific message');
expect(() => fn()).toThrow(ErrorType);

// Async
await expect(asyncFn()).resolves.toBe(value);
await expect(asyncFn()).rejects.toThrow('error');
```

---

## Testing APIs with Supertest

```bash
npm install --save-dev supertest
```

```javascript
// app.test.js
const request = require('supertest');
const app = require('./app');  // Your Express app (without .listen())
const mongoose = require('mongoose');
const User = require('./models/User');

// Connect to test database before tests
beforeAll(async () => {
  await mongoose.connect(process.env.TEST_MONGO_URI);
});

// Clean up after each test
afterEach(async () => {
  await User.deleteMany({});
});

// Disconnect after all tests
afterAll(async () => {
  await mongoose.connection.close();
});

describe('POST /api/auth/register', () => {
  test('should register a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'John',
        email: 'john@mail.com',
        password: 'password123',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.email).toBe('john@mail.com');
  });

  test('should not register with existing email', async () => {
    // First registration
    await request(app).post('/api/auth/register').send({
      name: 'John', email: 'john@mail.com', password: 'password123',
    });

    // Duplicate registration
    const res = await request(app).post('/api/auth/register').send({
      name: 'Jane', email: 'john@mail.com', password: 'password456',
    });

    expect(res.statusCode).toBe(409);
    expect(res.body.success).toBe(false);
  });

  test('should return 400 if fields missing', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'John' });

    expect(res.statusCode).toBe(400);
  });
});

describe('GET /api/users', () => {
  test('should return 401 without token', async () => {
    const res = await request(app).get('/api/users');
    expect(res.statusCode).toBe(401);
  });

  test('should return users with valid token', async () => {
    // Register to get token
    const authRes = await request(app)
      .post('/api/auth/register')
      .send({ name: 'John', email: 'john@mail.com', password: 'password123' });

    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${authRes.body.token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
  });
});
```

---

## Mocking

```javascript
// Mock a module
jest.mock('./services/emailService');
const emailService = require('./services/emailService');

test('should send welcome email on registration', async () => {
  emailService.sendWelcomeEmail = jest.fn().mockResolvedValue(true);

  await request(app)
    .post('/api/auth/register')
    .send({ name: 'John', email: 'john@mail.com', password: 'password123' });

  expect(emailService.sendWelcomeEmail).toHaveBeenCalledWith('john@mail.com');
  expect(emailService.sendWelcomeEmail).toHaveBeenCalledTimes(1);
});
```

---

## 🎯 Interview Tips

> **Q: Difference between `toBe` and `toEqual`?**
> `toBe` uses strict equality (`===`), good for primitives. `toEqual` checks deep equality, good for objects and arrays.

> **Q: What is TDD (Test-Driven Development)?**
> Write failing tests first → Write minimum code to pass → Refactor. Red → Green → Refactor cycle.

---
