const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'secret123'; // Use environment variable in production

function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  let token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  
  // Also check for token in query parameters (for PDF downloads)
  if (!token && req.query.token) {
    token = req.query.token;
  }
  
  // Also check for token in request body (for POST requests)
  if (!token && req.body && req.body.token) {
    token = req.body.token;
  }

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

function adminOnly(req, res, next) {
  verifyToken(req, res, () => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  });
}

function teacherOnly(req, res, next) {
  verifyToken(req, res, () => {
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Teacher access required' });
    }
    next();
  });
}

function studentOnly(req, res, next) {
  verifyToken(req, res, () => {
    if (req.user.role !== 'student') {
      return res.status(403).json({ error: 'Student access required' });
    }
    next();
  });
}

function teacherOrAdmin(req, res, next) {
  verifyToken(req, res, () => {
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Teacher or Admin access required' });
    }
    next();
  });
}

module.exports = {
  verifyToken,
  adminOnly,
  teacherOnly,
  studentOnly,
  teacherOrAdmin,
  JWT_SECRET
};
