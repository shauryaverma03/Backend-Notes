# 📗 08 — MongoDB & Mongoose

---

## What is MongoDB?

MongoDB is a **NoSQL document database**. It stores data in flexible, JSON-like documents (BSON) instead of rows and columns.

### SQL vs MongoDB Terminology

| SQL | MongoDB |
|-----|---------|
| Database | Database |
| Table | Collection |
| Row | Document |
| Column | Field |
| Primary Key | `_id` (auto-generated ObjectId) |
| JOIN | `$lookup` / populate |

### When to Use MongoDB?
- Flexible/evolving schemas
- Rapid development
- Hierarchical data (comments, nested objects)
- High write throughput
- Horizontal scaling (sharding)

### When NOT to Use MongoDB?
- Complex relationships (use SQL)
- Transactions across many collections
- Strong ACID requirements
- Reporting / analytics with complex joins

---

## Connecting with Mongoose

Mongoose is an **ODM (Object Data Modeling)** library for MongoDB + Node.js. It provides schema validation, middleware, and an elegant API.

```bash
npm install mongoose
```

```javascript
// config/db.js
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // These options are no longer needed in Mongoose 6+
      // but good to know for interviews
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
```

```javascript
// server.js
require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');

connectDB().then(() => {
  app.listen(3000, () => console.log('Server running'));
});
```

```env
# .env
MONGO_URI=mongodb://localhost:27017/myapp
# OR MongoDB Atlas:
MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/myapp
```

---

## Schema & Model

### Defining a Schema

```javascript
// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false,  // Don't include in queries by default
    },
    age: {
      type: Number,
      min: [0, 'Age cannot be negative'],
      max: [150, 'Age is too high'],
    },
    role: {
      type: String,
      enum: ['user', 'admin', 'moderator'],
      default: 'user',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    profilePicture: {
      type: String,
      default: 'default.jpg',
    },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
    },
    hobbies: [String],  // Array of strings
    posts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',  // Reference to Post model
      },
    ],
  },
  {
    timestamps: true,  // Adds createdAt and updatedAt automatically
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

const User = mongoose.model('User', userSchema);
module.exports = User;
```

### Schema Types

```javascript
String, Number, Boolean, Date, Buffer,
mongoose.Schema.Types.ObjectId,  // Reference to another document
mongoose.Schema.Types.Mixed,      // Any type
[String],                         // Array of strings
Map                              // Key-value pairs
```

---

## CRUD Operations

### CREATE

```javascript
// Method 1: create()
const user = await User.create({
  name: 'John',
  email: 'john@mail.com',
  password: 'hashedpassword',
});

// Method 2: new + save()
const user = new User({
  name: 'John',
  email: 'john@mail.com',
});
await user.save();

// Create multiple
await User.insertMany([
  { name: 'John', email: 'john@mail.com' },
  { name: 'Jane', email: 'jane@mail.com' },
]);
```

### READ

```javascript
// Find all
const users = await User.find();

// Find with filter
const admins = await User.find({ role: 'admin' });

// Find one
const user = await User.findOne({ email: 'john@mail.com' });

// Find by ID
const user = await User.findById('64a1b2c3d4e5f6a7b8c9d0e1');

// Select specific fields
const users = await User.find().select('name email -_id');
// or
const users = await User.find().select({ name: 1, email: 1, _id: 0 });

// Sorting
const users = await User.find().sort({ createdAt: -1 }); // Newest first
const users = await User.find().sort('-createdAt name');  // Same thing

// Pagination
const page = 2;
const limit = 10;
const users = await User.find()
  .skip((page - 1) * limit)
  .limit(limit);

// Count
const count = await User.countDocuments({ role: 'admin' });

// Check existence
const exists = await User.exists({ email: 'john@mail.com' });
```

### UPDATE

```javascript
// findByIdAndUpdate (returns old document by default)
const user = await User.findByIdAndUpdate(
  id,
  { name: 'Updated Name' },
  {
    new: true,             // Return updated document
    runValidators: true,   // Run schema validators on update
  }
);

// findOneAndUpdate
const user = await User.findOneAndUpdate(
  { email: 'john@mail.com' },
  { $set: { name: 'New Name' } },
  { new: true, runValidators: true }
);

// updateOne (doesn't return the document)
await User.updateOne({ _id: id }, { name: 'Updated' });

// updateMany
await User.updateMany({ role: 'user' }, { isActive: true });
```

### DELETE

```javascript
// findByIdAndDelete
const user = await User.findByIdAndDelete(id);

// findOneAndDelete
const user = await User.findOneAndDelete({ email: 'john@mail.com' });

// deleteOne
await User.deleteOne({ _id: id });

// deleteMany
await User.deleteMany({ isActive: false });
```

---

## Query Operators

```javascript
// Comparison
User.find({ age: { $gt: 18 } });     // Greater than
User.find({ age: { $gte: 18 } });    // Greater than or equal
User.find({ age: { $lt: 30 } });     // Less than
User.find({ age: { $lte: 30 } });    // Less than or equal
User.find({ age: { $ne: 25 } });     // Not equal
User.find({ role: { $in: ['admin', 'moderator'] } });  // In array
User.find({ role: { $nin: ['admin'] } });               // Not in array

// Logical
User.find({ $and: [{ age: { $gte: 18 } }, { role: 'admin' }] });
User.find({ $or: [{ role: 'admin' }, { role: 'moderator' }] });
User.find({ age: { $not: { $gt: 30 } } });

// Element
User.find({ phone: { $exists: true } });  // Field exists
User.find({ age: { $type: 'number' } });  // Field type check

// Regex (search)
User.find({ name: { $regex: /john/i } }); // Case-insensitive search
User.find({ name: /^J/ });                // Starts with J
```

---

## Mongoose Middleware (Hooks)

Middleware runs at specific points in document lifecycle.

```javascript
// PRE middleware — runs BEFORE an operation
userSchema.pre('save', async function (next) {
  // Hash password before saving
  if (!this.isModified('password')) return next();

  const bcrypt = require('bcryptjs');
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// POST middleware — runs AFTER an operation
userSchema.post('save', function (doc) {
  console.log(`User ${doc.name} saved successfully`);
});

// Pre find — runs before any find query
userSchema.pre(/^find/, function (next) {
  // Only return active users
  this.find({ isActive: { $ne: false } });
  next();
});

// Pre remove/deleteOne
userSchema.pre('deleteOne', { document: true }, async function (next) {
  // Delete all posts by this user
  await Post.deleteMany({ author: this._id });
  next();
});
```

---

## Instance Methods & Static Methods

```javascript
// Instance method — available on document instances
userSchema.methods.comparePassword = async function (candidatePassword) {
  const bcrypt = require('bcryptjs');
  return await bcrypt.compare(candidatePassword, this.password);
};

// Usage:
const user = await User.findOne({ email }).select('+password');
const isMatch = await user.comparePassword('plaintext123');

// Static method — available on the Model itself
userSchema.statics.findByEmail = function (email) {
  return this.findOne({ email });
};

// Usage:
const user = await User.findByEmail('john@mail.com');
```

---

## Virtuals (Computed Fields)

```javascript
userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual populate — get posts without storing refs on user
userSchema.virtual('posts', {
  ref: 'Post',
  localField: '_id',
  foreignField: 'author',
});
```

---

## Population (MongoDB "JOIN")

```javascript
// Post model
const postSchema = new mongoose.Schema({
  title: String,
  content: String,
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
});

// Populate author when querying posts
const posts = await Post.find()
  .populate('author', 'name email');  // Only get name and email

// Nested populate
const posts = await Post.find()
  .populate({
    path: 'author',
    select: 'name email',
    populate: { path: 'company', select: 'name' },
  });
```

---

## Aggregation Pipeline

```javascript
const stats = await User.aggregate([
  // Stage 1: Filter
  { $match: { isActive: true } },

  // Stage 2: Group and calculate
  {
    $group: {
      _id: '$role',
      count: { $sum: 1 },
      avgAge: { $avg: '$age' },
      maxAge: { $max: '$age' },
      minAge: { $min: '$age' },
    },
  },

  // Stage 3: Sort
  { $sort: { count: -1 } },

  // Stage 4: Limit
  { $limit: 5 },
]);

// Result:
// [
//   { _id: 'user', count: 150, avgAge: 28, maxAge: 65, minAge: 18 },
//   { _id: 'admin', count: 10, avgAge: 35, maxAge: 50, minAge: 25 },
// ]
```

### Common Aggregation Stages

```javascript
$match      // Filter documents (like WHERE)
$group      // Group by field (like GROUP BY)
$sort       // Sort results
$limit      // Limit number of results
$skip       // Skip results (for pagination)
$project    // Select/transform fields (like SELECT)
$lookup     // Join with another collection (like JOIN)
$unwind     // Deconstruct array field
$addFields  // Add computed fields
$count      // Count documents
```

---

## Indexing

```javascript
// Single field index
userSchema.index({ email: 1 });      // Ascending
userSchema.index({ createdAt: -1 }); // Descending

// Compound index
userSchema.index({ name: 1, email: 1 });

// Unique index
userSchema.index({ email: 1 }, { unique: true });

// Text index (for full-text search)
userSchema.index({ name: 'text', bio: 'text' });
// Search: User.find({ $text: { $search: 'developer' } });

// TTL index (auto-delete after time)
sessionSchema.index({ createdAt: 1 }, { expireAfterSeconds: 3600 });
```

---

## 🎯 Interview Tips

> **Q: What is the difference between SQL and NoSQL?**
> SQL: structured, fixed schema, relational, ACID, vertical scaling. NoSQL: flexible schema, document-based, eventual consistency, horizontal scaling.

> **Q: What is an ObjectId?**
> A 12-byte unique identifier auto-generated by MongoDB. Contains: 4-byte timestamp + 5-byte random + 3-byte counter.

> **Q: What is `populate()` in Mongoose?**
> It replaces the stored ObjectId reference with the actual document data from another collection, similar to a JOIN in SQL.

> **Q: Difference between `save()` and `findByIdAndUpdate()`?**
> `save()` triggers pre/post save middleware and validators. `findByIdAndUpdate()` bypasses save middleware by default. Use `{ runValidators: true }` to enable validation.

---
