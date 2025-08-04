const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? [
    'https://grade-book-frontend.onrender.com', // Your frontend URL
    'https://gradebook-app.onrender.com',
    'https://gradebook-app-frontend.onrender.com',
    // Allow any onrender.com subdomain for testing
    /https:\/\/.*\.onrender\.com$/
  ] : ['http://localhost:8080', 'http://127.0.0.1:8080'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({
  extended: true
}));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`🌐 ${req.method} ${req.url} - ${new Date().toISOString()}`);
  console.log('📄 Request body:', req.body);
  console.log('🔗 Request headers:', req.headers);
  next();
});

// Initialize database
require('./models/db');

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/users', require('./routes/users.routes'));
app.use('/api/courses', require('./routes/courses.routes'));
app.use('/api/evaluations', require('./routes/evaluations.routes'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Grade Book API is running'
  });
});

// Test route for debugging
app.post('/api/test', (req, res) => {
  console.log('🧪 Test route hit');
  res.json({
    message: 'Test route working',
    body: req.body
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Express error handler:', err.stack);
  console.error('❌ Error message:', err.message);
  res.status(500).json({
    error: 'Something went wrong!',
    message: err.message
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found'
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;