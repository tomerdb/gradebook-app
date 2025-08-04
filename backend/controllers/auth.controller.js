const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const {
  JWT_SECRET
} = require('../middleware/auth.middleware');

const AuthController = {
  // Login
  login: (req, res) => {
    const {
      email,
      password
    } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required'
      });
    }

    User.getByEmail(email, (err, user) => {
      if (err) {
        return res.status(500).json({
          error: 'Database error'
        });
      }

      if (!user) {
        return res.status(401).json({
          error: 'Invalid credentials'
        });
      }

      bcrypt.compare(password, user.password, (err, isMatch) => {
        if (err) {
          return res.status(500).json({
            error: 'Authentication error'
          });
        }

        if (!isMatch) {
          return res.status(401).json({
            error: 'Invalid credentials'
          });
        }

        // Create JWT token
        const token = jwt.sign({
            id: user.id,
            email: user.email,
            role: user.role,
            name: user.name
          },
          JWT_SECRET, {
            expiresIn: '24h'
          }
        );

        res.json({
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
          }
        });
      });
    });
  },

  // Register (Admin only)
  register: (req, res) => {
    const {
      name,
      email,
      password,
      role
    } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({
        error: 'All fields are required'
      });
    }

    if (!['admin', 'teacher', 'student'].includes(role)) {
      return res.status(400).json({
        error: 'Invalid role'
      });
    }

    // Check if user already exists
    User.getByEmail(email, (err, existingUser) => {
      if (err) {
        return res.status(500).json({
          error: 'Database error'
        });
      }

      if (existingUser) {
        return res.status(409).json({
          error: 'User already exists'
        });
      }

      // Hash password
      bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) {
          return res.status(500).json({
            error: 'Password hashing failed'
          });
        }

        // Create user
        User.create({
          name,
          email,
          password: hashedPassword,
          role
        }, (err, userId) => {
          if (err) {
            return res.status(500).json({
              error: 'User creation failed'
            });
          }

          res.status(201).json({
            message: 'User created successfully',
            userId
          });
        });
      });
    });
  },

  // Get current user profile
  profile: (req, res) => {
    User.getById(req.user.id, (err, user) => {
      if (err) {
        return res.status(500).json({
          error: 'Database error'
        });
      }

      if (!user) {
        return res.status(404).json({
          error: 'User not found'
        });
      }

      res.json(user);
    });
  }
};

module.exports = AuthController;