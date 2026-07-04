const express = require('express')
const jwt     = require('jsonwebtoken')
const { body, validationResult } = require('express-validator')
const User    = require('../models/User')
const { protect } = require('../middleware/auth')

const router = express.Router()

// ── Helper: sign a JWT ────────────────────────────────────────────────────────

function signToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  })
}

// ── POST /api/auth/register ───────────────────────────────────────────────────

router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('Password must be 8+ characters'),
    body('role').optional().isIn(['recruiter', 'candidate']).withMessage('Invalid role'),
  ],
  async (req, res) => {
    // Validate input
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg })
    }

    try {
      const { name, email, password, role } = req.body

      // Check if email already exists
      const existing = await User.findOne({ email })
      if (existing) {
        return res.status(409).json({ message: 'Email is already registered.' })
      }

      // Create user (password hashed by pre-save hook)
      const user = await User.create({ name, email, password, role })

      const token = signToken(user._id)

      res.status(201).json({
        token,
        user: { id: user._id, name: user.name, email: user.email, role: user.role },
      })
    } catch (err) {
      res.status(500).json({ message: 'Registration failed.', error: err.message })
    }
  }
)

// ── POST /api/auth/login ──────────────────────────────────────────────────────

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg })
    }

    try {
      const { email, password } = req.body

      // Explicitly select password (it's select:false in schema)
      const user = await User.findOne({ email }).select('+password')
      if (!user) {
        return res.status(401).json({ message: 'Invalid email or password.' })
      }

      const isMatch = await user.comparePassword(password)
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid email or password.' })
      }

      const token = signToken(user._id)

      res.json({
        token,
        user: { id: user._id, name: user.name, email: user.email, role: user.role },
      })
    } catch (err) {
      res.status(500).json({ message: 'Login failed.', error: err.message })
    }
  }
)

// ── GET /api/auth/me ──────────────────────────────────────────────────────────

router.get('/me', protect, (req, res) => {
  res.json({
    user: { id: req.user._id, name: req.user.name, email: req.user.email, role: req.user.role },
  })
})

module.exports = router
