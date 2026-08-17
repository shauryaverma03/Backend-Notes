# 📗 08 — MongoDB & Mongoose (Partwise Guide)

---

## What is MongoDB?

MongoDB is a **NoSQL document database**. It stores data in flexible, JSON-like documents (BSON) instead of traditional tables, rows, and columns.

### SQL vs MongoDB Terminology Matrix

| SQL Term | MongoDB Term | Concept |
|----------|--------------|---------|
| Database | Database | Container for collections |
| Table | Collection | Group of related documents |
| Row | Document | Single JSON/BSON data object |
| Column | Field | Key-value pair in document |
| Primary Key | `_id` | Auto-generated 12-byte ObjectId |
| JOIN | `$lookup` / `populate()` | Combining data across collections |

---

# 🛠️ Partwise Breakdown of MongoDB & Mongoose

---

## 📍 Part 1: Connecting Node.js to MongoDB via Mongoose

Mongoose is an **ODM (Object Data Modeling)** library providing schema validation, type casting, middleware hooks, and query builders.

```bash
npm install mongoose
```

### Database Connection Handler (`config/db.js`)
```javascript
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`🍃 MongoDB Connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`Database Connection Error: ${err.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
```

---

## 📍 Part 2: Mongoose Schemas, Validation & Models

### 2.1 Complete Schema Definition (`models/User.js`)
```javascript
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email format']
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false // Excluded from query results by default
    },
    role: {
      type: String,
      enum: ['user', 'admin', 'moderator'],
      default: 'user'
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true // Auto-generates createdAt and updatedAt fields
  }
);

const User = mongoose.model('User', userSchema);
module.exports = User;
```

---

## 📍 Part 3: CRUD Operations Deep Dive

### 3.1 CREATE Operations
```javascript
// Method 1: User.create()
const user = await User.create({
  name: 'John Doe',
  email: 'john@example.com',
  password: 'hashedpassword123'
});

// Method 2: new User() + save()
const newUser = new User({ name: 'Jane', email: 'jane@example.com' });
await newUser.save();
```

### 3.2 READ Operations (Querying, Projection & Pagination)
```javascript
// Find with filter & projection
const admins = await User.find({ role: 'admin' }).select('name email -_id');

// Find Single Document by ID
const user = await User.findById(userId);

// Pagination & Sorting (Newest First)
const page = 2;
const limit = 10;
const paginatedUsers = await User.find()
  .sort({ createdAt: -1 })
  .skip((page - 1) * limit)
  .limit(limit);
```

### 3.3 UPDATE Operations
```javascript
// findByIdAndUpdate (returns updated doc with validators)
const updatedUser = await User.findByIdAndUpdate(
  userId,
  { name: 'John Updated' },
  { new: true, runValidators: true }
);

// Bulk update
await User.updateMany({ isActive: false }, { $set: { role: 'inactive' } });
```

### 3.4 DELETE Operations
```javascript
// Find and delete single document
const deletedUser = await User.findByIdAndDelete(userId);

// Bulk delete
await User.deleteMany({ isActive: false });
```

---

## 📍 Part 4: Query Operators Cheat Sheet

```javascript
// Comparison Operators
User.find({ age: { $gt: 18 } });                    // Greater than
User.find({ age: { $gte: 18, $lte: 65 } });         // Range check
User.find({ role: { $in: ['admin', 'moderator'] } });// Value in array

// Logical Operators
User.find({ $or: [{ role: 'admin' }, { isActive: true }] });

// Regex Search
User.find({ name: { $regex: /john/i } });           // Case-insensitive regex
```

---

## 📍 Part 5: Population (MongoDB "JOIN" Equivalent)

```javascript
// Post model referencing User
const postSchema = new mongoose.Schema({
  title: String,
  content: String,
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
});
const Post = mongoose.model('Post', postSchema);

// Populate author details into post query
const posts = await Post.find().populate('author', 'name email');
```

---

## 📍 Part 6: Aggregation Pipeline (Data Processing)

```javascript
const stats = await User.aggregate([
  // Stage 1: Match active users
  { $match: { isActive: true } },

  // Stage 2: Group by role and compute statistics
  {
    $group: {
      _id: '$role',
      totalUsers: { $sum: 1 },
      avgAge: { $avg: '$age' }
    }
  },

  // Stage 3: Sort by count descending
  { $sort: { totalUsers: -1 } }
]);
```

---

## 🎯 Interview Questions & Key Takeaways

> **Q: What is `populate()` in Mongoose?**
> It automates substituting document reference IDs (`ObjectId`) with actual documents from another collection, functioning like a SQL JOIN.

> **Q: What is an ObjectId?**
> A 12-byte unique identifier containing a 4-byte timestamp, 5-byte random value, and a 3-byte incrementing counter.
