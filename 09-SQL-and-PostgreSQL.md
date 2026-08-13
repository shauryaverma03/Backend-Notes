# 📗 09 — SQL & PostgreSQL

---

## SQL Basics

SQL (Structured Query Language) is the standard language for relational databases.

### SQL vs NoSQL Comparison

| Feature | SQL (PostgreSQL, MySQL) | NoSQL (MongoDB) |
|---------|------------------------|-----------------|
| Data Model | Tables with rows/columns | Documents (JSON-like) |
| Schema | Fixed, predefined | Flexible, dynamic |
| Relationships | JOINs | Embedding / referencing |
| Transactions | Full ACID | Limited (improving) |
| Scaling | Vertical (scale up) | Horizontal (scale out) |
| Best For | Complex queries, relationships | Rapid dev, flexible data |

---

## Core SQL Commands

### DDL (Data Definition Language)

```sql
-- Create table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,                  -- Auto-increment integer
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  age INTEGER CHECK (age >= 0),
  role VARCHAR(20) DEFAULT 'user',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT,
  author_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Alter table
ALTER TABLE users ADD COLUMN phone VARCHAR(20);
ALTER TABLE users DROP COLUMN phone;
ALTER TABLE users ALTER COLUMN name SET NOT NULL;

-- Drop table
DROP TABLE IF EXISTS posts;
DROP TABLE IF EXISTS users;
```

### Data Types

```sql
-- Numeric
INTEGER, BIGINT, SERIAL (auto-increment), DECIMAL(10,2), FLOAT

-- String
VARCHAR(255), TEXT, CHAR(10)

-- Boolean
BOOLEAN -- true / false

-- Date/Time
DATE, TIME, TIMESTAMP, INTERVAL

-- JSON (PostgreSQL)
JSON, JSONB  -- JSONB is faster for queries

-- UUID
UUID -- DEFAULT gen_random_uuid()

-- Array (PostgreSQL)
INTEGER[], TEXT[]
```

---

### DML (Data Manipulation Language)

```sql
-- INSERT
INSERT INTO users (name, email, password)
VALUES ('John', 'john@mail.com', 'hashed_password');

INSERT INTO users (name, email, password) VALUES
  ('John', 'john@mail.com', 'hash1'),
  ('Jane', 'jane@mail.com', 'hash2');

-- SELECT
SELECT * FROM users;
SELECT name, email FROM users;
SELECT * FROM users WHERE role = 'admin';
SELECT * FROM users WHERE age > 18 AND is_active = true;
SELECT * FROM users WHERE name LIKE '%john%';        -- Contains 'john'
SELECT * FROM users WHERE name ILIKE '%john%';       -- Case-insensitive
SELECT * FROM users WHERE role IN ('admin', 'moderator');
SELECT * FROM users WHERE age BETWEEN 18 AND 30;
SELECT * FROM users WHERE phone IS NULL;
SELECT DISTINCT role FROM users;

-- Sorting
SELECT * FROM users ORDER BY created_at DESC;
SELECT * FROM users ORDER BY name ASC, age DESC;

-- Pagination
SELECT * FROM users ORDER BY id LIMIT 10 OFFSET 20;  -- Page 3, 10 per page

-- UPDATE
UPDATE users SET name = 'Updated Name' WHERE id = 1;
UPDATE users SET is_active = false WHERE last_login < '2024-01-01';

-- DELETE
DELETE FROM users WHERE id = 1;
DELETE FROM users WHERE is_active = false;
```

---

### Aggregate Functions

```sql
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM users WHERE role = 'admin';
SELECT AVG(age) FROM users;
SELECT SUM(age) FROM users;
SELECT MIN(age), MAX(age) FROM users;

-- GROUP BY
SELECT role, COUNT(*) as count
FROM users
GROUP BY role;

-- HAVING (filter after grouping)
SELECT role, COUNT(*) as count
FROM users
GROUP BY role
HAVING COUNT(*) > 5;
```

---

## JOINs

```sql
-- INNER JOIN — Only matching rows from both tables
SELECT users.name, posts.title
FROM users
INNER JOIN posts ON users.id = posts.author_id;

-- LEFT JOIN — All rows from left table + matching from right
SELECT users.name, posts.title
FROM users
LEFT JOIN posts ON users.id = posts.author_id;

-- RIGHT JOIN — All rows from right table + matching from left
SELECT users.name, posts.title
FROM users
RIGHT JOIN posts ON users.id = posts.author_id;

-- FULL OUTER JOIN — All rows from both tables
SELECT users.name, posts.title
FROM users
FULL OUTER JOIN posts ON users.id = posts.author_id;
```

```
INNER JOIN:      LEFT JOIN:       RIGHT JOIN:      FULL OUTER JOIN:
  ┌───┐            ┌───┐            ┌───┐            ┌───┐
  │ A ∩ B │        │ A █ B │        │ A █ B │        │ A █ B │
  └───┘            └───┘            └───┘            └───┘
 Only overlap    All A + match   match + All B    All A + All B
```

---

## Normalization

The process of organizing data to reduce redundancy.

### 1NF (First Normal Form)
- Each cell contains a single value (no arrays)
- Each row is unique

### 2NF (Second Normal Form)
- Must be in 1NF
- No partial dependencies (every non-key column depends on the whole primary key)

### 3NF (Third Normal Form)
- Must be in 2NF
- No transitive dependencies (non-key columns don't depend on other non-key columns)

**Example:**
```
❌ Bad (unnormalized):
users: id, name, email, order_id, order_date, product_name, product_price

✅ Good (normalized):
users:    id, name, email
orders:   id, user_id (FK), order_date
products: id, name, price
order_items: order_id (FK), product_id (FK), quantity
```

---

## Using PostgreSQL with Node.js

### Option 1: `pg` (node-postgres) — Raw SQL

```bash
npm install pg
```

```javascript
const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'myapp',
  user: 'postgres',
  password: 'password',
});

// Query
async function getUsers() {
  const { rows } = await pool.query('SELECT * FROM users');
  return rows;
}

// Parameterized query (prevents SQL injection!)
async function getUserById(id) {
  const { rows } = await pool.query(
    'SELECT * FROM users WHERE id = $1',
    [id]
  );
  return rows[0];
}

// Insert
async function createUser(name, email) {
  const { rows } = await pool.query(
    'INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *',
    [name, email]
  );
  return rows[0];
}
```

### Option 2: Knex.js — Query Builder

```bash
npm install knex pg
```

```javascript
const knex = require('knex')({
  client: 'pg',
  connection: {
    host: 'localhost',
    database: 'myapp',
    user: 'postgres',
    password: 'password',
  },
});

// Select
const users = await knex('users').select('*');
const user = await knex('users').where({ id: 1 }).first();
const admins = await knex('users').where('role', 'admin').orderBy('name');

// Insert
const [newUser] = await knex('users')
  .insert({ name: 'John', email: 'john@mail.com' })
  .returning('*');

// Update
await knex('users').where({ id: 1 }).update({ name: 'Updated' });

// Delete
await knex('users').where({ id: 1 }).del();

// Join
const posts = await knex('posts')
  .join('users', 'posts.author_id', 'users.id')
  .select('posts.title', 'users.name as author');
```

### Option 3: Sequelize — Full ORM

```bash
npm install sequelize pg pg-hstore
```

```javascript
const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize('myapp', 'postgres', 'password', {
  host: 'localhost',
  dialect: 'postgres',
});

// Define model
const User = sequelize.define('User', {
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, unique: true, allowNull: false },
  role: { type: DataTypes.ENUM('user', 'admin'), defaultValue: 'user' },
});

// CRUD
const users = await User.findAll();
const user = await User.findByPk(1);
const user = await User.findOne({ where: { email: 'john@mail.com' } });
const user = await User.create({ name: 'John', email: 'john@mail.com' });
await User.update({ name: 'Updated' }, { where: { id: 1 } });
await User.destroy({ where: { id: 1 } });

// Sync (create tables from models)
await sequelize.sync();         // Create if not exists
await sequelize.sync({ alter: true }); // Alter to match model
```

---

## Transactions

```javascript
// With pg
const client = await pool.connect();
try {
  await client.query('BEGIN');
  await client.query('UPDATE accounts SET balance = balance - 100 WHERE id = $1', [1]);
  await client.query('UPDATE accounts SET balance = balance + 100 WHERE id = $1', [2]);
  await client.query('COMMIT');
} catch (err) {
  await client.query('ROLLBACK');
  throw err;
} finally {
  client.release();
}

// With Sequelize
const t = await sequelize.transaction();
try {
  await Account.update({ balance: sequelize.literal('balance - 100') },
    { where: { id: 1 }, transaction: t });
  await Account.update({ balance: sequelize.literal('balance + 100') },
    { where: { id: 2 }, transaction: t });
  await t.commit();
} catch (err) {
  await t.rollback();
}
```

---

## 🎯 Interview Tips

> **Q: What is ACID?**
> **A**tomicity (all or nothing), **C**onsistency (valid state), **I**solation (concurrent transactions don't interfere), **D**urability (committed data survives crashes).

> **Q: What are indexes and why use them?**
> Indexes are data structures that speed up reads by allowing the database to find rows without scanning the entire table. Trade-off: faster reads, slower writes, more storage.

> **Q: What is SQL injection and how to prevent it?**
> Attacker inserts malicious SQL via user input. Prevent with parameterized queries (`$1`, `?` placeholders) — NEVER concatenate user input into SQL strings.

---
