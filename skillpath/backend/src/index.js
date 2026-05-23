require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./auth/auth.routes');
const employeeRoutes = require('./employees/employees.routes');
const mainRoutes = require('./routes');

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());

// CORS — barcha so'rovlarga ruxsat
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Preflight
app.options('*', cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'Juda ko\'p so\'rov yuborildi. Keyinroq urinib ko\'ring.' }
});
app.use('/api/', limiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Juda ko\'p kirish urinishi. 15 daqiqadan keyin urinib ko\'ring.' }
});
app.use('/api/auth/login', authLimiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'SkillPath Bank LMS API',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api', mainRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: `Route topilmadi: ${req.method} ${req.path}` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server xatosi:', err);
  res.status(500).json({ 
    error: process.env.NODE_ENV === 'production' ? 'Server xatosi yuz berdi' : err.message 
  });
});

app.listen(PORT, () => {
  console.log(`SkillPath Backend ishga tushdi — Port: ${PORT}`);
});

module.exports = app;
