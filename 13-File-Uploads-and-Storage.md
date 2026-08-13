# 📗 13 — File Uploads & Storage

---

## Multer — File Upload Middleware

```bash
npm install multer
```

### Basic File Upload

```javascript
const multer = require('multer');

// 1. Disk Storage (saves to filesystem)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');  // Directory to save files
  },
  filename: (req, file, cb) => {
    // unique-timestamp-originalname.ext
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const ext = file.originalname.split('.').pop();
    cb(null, `${uniqueName}.${ext}`);
  },
});

// 2. File Filter (validate file type)
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);   // Accept
  } else {
    cb(new Error('Only JPEG, PNG, GIF, and WebP images are allowed'), false);
  }
};

// 3. Create Multer instance
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,  // 5MB max
  },
});

// Routes
// Single file upload
app.post('/api/upload', upload.single('avatar'), (req, res) => {
  // req.file contains file info
  console.log(req.file);
  // {
  //   fieldname: 'avatar',
  //   originalname: 'photo.jpg',
  //   mimetype: 'image/jpeg',
  //   destination: 'uploads/',
  //   filename: '1234567890-123456789.jpg',
  //   path: 'uploads/1234567890-123456789.jpg',
  //   size: 52428
  // }
  res.json({ 
    message: 'File uploaded',
    url: `/uploads/${req.file.filename}`,
  });
});

// Multiple files (max 5)
app.post('/api/upload-multiple', upload.array('photos', 5), (req, res) => {
  console.log(req.files);  // Array of file objects
  res.json({ count: req.files.length });
});

// Multiple fields
const cpUpload = upload.fields([
  { name: 'avatar', maxCount: 1 },
  { name: 'gallery', maxCount: 5 },
]);
app.post('/api/upload-fields', cpUpload, (req, res) => {
  console.log(req.files.avatar);   // Array of 1
  console.log(req.files.gallery);  // Array of up to 5
});

// Memory Storage (keep in memory as Buffer — for cloud uploads)
const memoryStorage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});
// req.file.buffer contains the file data
```

### Serve Uploaded Files

```javascript
const path = require('path');

// Serve uploads directory as static
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// Now: GET /uploads/image.jpg serves the file
```

### Handle Upload Errors

```javascript
app.post('/api/upload', (req, res) => {
  upload.single('avatar')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File too large (max 5MB)' });
      }
      return res.status(400).json({ error: err.message });
    }
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    res.json({ url: `/uploads/${req.file.filename}` });
  });
});
```

---

## Cloudinary — Cloud Image Storage

```bash
npm install cloudinary multer
```

```javascript
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Upload from buffer (memory storage)
const uploadToCloudinary = async (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'avatars',
        transformation: [
          { width: 250, height: 250, crop: 'fill' },
          { quality: 'auto' },
        ],
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    stream.end(fileBuffer);
  });
};

// Route
const memUpload = multer({ storage: multer.memoryStorage() });

app.post('/api/upload', memUpload.single('image'), async (req, res) => {
  const result = await uploadToCloudinary(req.file.buffer);
  res.json({
    url: result.secure_url,       // HTTPS URL
    public_id: result.public_id,  // For deletion later
  });
});

// Delete from Cloudinary
app.delete('/api/upload/:publicId', async (req, res) => {
  await cloudinary.uploader.destroy(req.params.publicId);
  res.json({ message: 'Image deleted' });
});
```

---

## 🎯 Interview Tips

> **Q: How to handle file uploads in Node.js?**
> Use Multer middleware with disk storage for local files or memory storage for cloud uploads (Cloudinary, S3). Validate file type, size, and use unique filenames.

> **Q: Why store files in cloud storage instead of the server?**
> Servers have limited disk space, don't scale well, and files are lost on redeployment. Cloud storage (S3, Cloudinary) is scalable, durable, fast (CDN), and supports transformations.

---
