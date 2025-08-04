const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const {
  JWT_SECRET
} = require('../middleware/auth.middleware');

const AuthController = {
  // Login
  login: (req, res) => {
    console.log('🔐 Login attempt started');
    const {
      email,
      password
    } = req.body;

    console.log('📧 Email:', email);
    console.log('🔑 Password provided:', password ? 'Yes' : 'No');

    if (!email || !password) {
      console.log('❌ Missing email or password');
      return res.status(400).json({
        error: 'Email and password are required'
      });
    }

    console.log('🔍 Looking up user by email...');
    User.getByEmail(email, (err, user) => {
      if (err) {
        console.error('❌ Database error during user lookup:', err);
        return res.status(500).json({
          error: 'Database error'
        });
      }

      if (!user) {
        console.log('❌ User not found');
        return res.status(401).json({
          error: 'Invalid credentials'
        });
      }

      console.log('✅ User found:', user.email, 'Role:', user.role);
      console.log('🔐 Stored password hash:', user.password ? 'Present' : 'Missing');

      bcrypt.compare(password, user.password, (err, isMatch) => {
        if (err) {
          console.error('❌ Bcrypt comparison error:', err);
          return res.status(500).json({
            error: 'Authentication error'
          });
        }

        console.log('🔐 Password match result:', isMatch);

        if (!isMatch) {
          console.log('❌ Password does not match');
          return res.status(401).json({
            error: 'Invalid credentials'
          });
        }

        console.log('✅ Password matches, creating JWT token...');

        // Create JWT token
        try {
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

          console.log('✅ JWT token created successfully');
          console.log('🚀 Sending successful login response');

          res.json({
            token,
            user: {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role
            }
          });
        } catch (jwtError) {
          console.error('❌ JWT token creation error:', jwtError);
          return res.status(500).json({
            error: 'Token creation failed'
          });
        }
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