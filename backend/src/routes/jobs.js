const express = require('express')
const { body, validationResult } = require('express-validator')
const Job = require('../models/Job')
const { protect, restrictTo } = require('../middleware/auth')

const router = express.Router()

// ── GET /api/jobs ─────────────────────────────────────────────────────────────
// Public: candidates browse open jobs
// Query params: ?search=react&department=Engineering&type=Full-time&status=active

router.get('/', async (req, res) => {
  try {
    const { search, department, type, status } = req.query
    const filter = {}

    // Default to active jobs for public access
    filter.status = status || 'active'

    if (department) filter.department = department
    if (type) filter.type = type

    // Text search using MongoDB text index
    if (search) {
      filter.$text = { $search: search }
    }

    const jobs = await Job.find(filter)
      .populate('postedBy', 'name email')
      .sort({ createdAt: -1 })

    res.json({ count: jobs.length, jobs })
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch jobs.', error: err.message })
  }
})

// ── GET /api/jobs/:id ─────────────────────────────────────────────────────────

router.get('/:id', async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).populate('postedBy', 'name email')
    if (!job) return res.status(404).json({ message: 'Job not found.' })
    res.json({ job })
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch job.', error: err.message })
  }
})

// ── POST /api/jobs ────────────────────────────────────────────────────────────
// Recruiter only

router.post(
  '/',
  protect,
  restrictTo('recruiter'),
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('department').trim().notEmpty().withMessage('Department is required'),
    body('location').trim().notEmpty().withMessage('Location is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg })
    }

    try {
      const job = await Job.create({
        ...req.body,
        postedBy: req.user._id,
      })
      res.status(201).json({ job })
    } catch (err) {
      res.status(500).json({ message: 'Failed to create job.', error: err.message })
    }
  }
)

// ── PATCH /api/jobs/:id ───────────────────────────────────────────────────────
// Recruiter only -- update any field

router.patch('/:id', protect, restrictTo('recruiter'), async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
    if (!job) return res.status(404).json({ message: 'Job not found.' })

    // Only the recruiter who posted it (or any recruiter in an org, simplified here)
    const allowed = ['title', 'department', 'location', 'type', 'salary', 'description', 'requirements', 'status']
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) job[field] = req.body[field]
    })

    await job.save()
    res.json({ job })
  } catch (err) {
    res.status(500).json({ message: 'Failed to update job.', error: err.message })
  }
})

// ── DELETE /api/jobs/:id ──────────────────────────────────────────────────────
// Recruiter only

router.delete('/:id', protect, restrictTo('recruiter'), async (req, res) => {
  try {
    const job = await Job.findByIdAndDelete(req.params.id)
    if (!job) return res.status(404).json({ message: 'Job not found.' })
    res.json({ message: 'Job deleted.' })
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete job.', error: err.message })
  }
})

module.exports = router
