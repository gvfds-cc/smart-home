require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const config = require('./config');

const app = express();

// CORS
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:8080'],
  credentials: true,
}));

app.use(express.json());

// 确保 uploads 目录存在
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer 文件上传配置
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp|bmp/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) return cb(null, true);
    cb(new Error('仅支持 jpg/png/gif/webp/bmp 格式的图片'));
  },
});

// 静态文件服务 - 提供上传图片访问
app.use('/uploads', express.static(uploadsDir));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/houses', require('./routes/houses'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/contracts', require('./routes/contracts'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/finance', require('./routes/finance'));
app.use('/api/admin', require('./routes/admin'));

// 图片上传接口（需登录，房东可用）
app.post('/api/upload', require('./middleware/auth').authenticate, require('./middleware/auth').authorize('landlord'), (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ message: '图片大小不能超过 10MB' });
        }
        return res.status(400).json({ message: '文件上传失败' });
      }
      return res.status(400).json({ message: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ message: '请选择要上传的图片' });
    }
    // 返回可访问的图片 URL
    const url = `/uploads/${req.file.filename}`;
    res.json({ url, filename: req.file.filename });
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ message: '服务器内部错误' });
});

// Connect to MongoDB with in-memory fallback
async function start() {
  try {
    await mongoose.connect(config.mongodbUri);
    console.log('MongoDB 连接成功');
  } catch (err) {
    console.warn('MongoDB 连接失败，尝试使用内存数据库...');
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      const uri = mongod.getUri();
      await mongoose.connect(uri);
      console.log('MongoDB 内存数据库启动成功');
    } catch (memErr) {
      console.error('内存数据库启动失败:', memErr);
      process.exit(1);
    }
  }

  app.listen(config.port, () => {
    console.log(`服务器启动成功 http://localhost:${config.port}`);
  });
}

start();

// Handle mongoose connection error after initial connection
mongoose.connection.on('error', (err) => {
  console.error('MongoDB 连接异常:', err);
});

module.exports = app;
