const express     = require('express')
const Application = require('../models/Application')
const Job         = require('../models/Job')
const upload      = require('../middleware/upload')
const { protect, restrictTo } = require('../middleware/auth')

const router = express.Router()

// ── POST /api/applications ────────────────────────────────────────────────────
// Candidate submits an application with resume upload

router.post('/', protect, restrictTo('candidate'), upload.single('resume'), async (req, res) => {
  try {
    const { jobId, firstName, lastName, email, phone, linkedin, portfolio, experience, coverLetter, source } = req.body

    // Verify job exists
    const job = await Job.findById(jobId)
    if (!job) return res.status(404).json({ message: 'Job not found.' })
    if (job.status !== 'active') return res.status(400).json({ message: 'This job is no longer accepting applications.' })

    // Check for duplicate application
    const existing = await Application.findOne({ job: jobId, candidate: req.user._id })
    if (existing) return res.status(409).json({ message: 'You have already applied for this job.' })

    const application = await Application.create({
      job: jobId,
      candidate: req.user._id,
      personalInfo: { firstName, lastName, email, phone, linkedin, portfolio, experience },
      resumeUrl: req.file ? `/uploads/${req.file.filename}` : '',
      resumeOriginalName: req.file ? req.file.originalname : '',
      coverLetter: coverLetter || '',
      source: source || '',
      stage: 'Applied',
      stageHistory: [{ stage: 'Applied', note: 'Application submitted' }],
    })

    // Increment application count on job
    await Job.findByIdAndUpdate(jobId, { $inc: { applicationCount: 1 } })

    await application.populate('job', 'title department')

    res.status(201).json({ application })
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'You have already applied for this job.' })
    }
    res.status(500).json({ message: 'Failed to submit application.', error: err.message })
  }
})

// ── GET /api/applications ─────────────────────────────────────────────────────
// Recruiter: ?jobId=xxx to get all apps for a job
// Candidate: automatically filtered to their own applications

router.get('/', protect, async (req, res) => {
  try {
    const filter = {}

    if (req.user.role === 'candidate') {
      // Candidates only see their own applications
      filter.candidate = req.user._id
    } else if (req.user.role === 'recruiter') {
      // Recruiters can filter by job
      if (req.query.jobId) filter.job = req.query.jobId
      if (req.query.stage) filter.stage = req.query.stage
    }

    const applications = await Application.find(filter)
      .populate('job', 'title department location')
      .populate('candidate', 'name email')
      .sort({ createdAt: -1 })

    res.json({ count: applications.length, applications })
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch applications.', error: err.message })
  }
})

// ── GET /api/applications/:id ─────────────────────────────────────────────────

router.get('/:id', protect, async (req, res) => {
  try {
    const application = await Application.findById(req.params.id)
      .populate('job', 'title department location')
      .populate('candidate', 'name email')

    if (!application) return res.status(404).json({ message: 'Application not found.' })

    // Authorization: candidate can only view their own
    if (
      req.user.role === 'candidate' &&
      application.candidate._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Access denied.' })
    }

    res.json({ application })
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch application.', error: err.message })
  }
})

// ── PATCH /api/applications/:id/stage ────────────────────────────────────────
// Recruiter moves a candidate to a new stage

router.patch('/:id/stage', protect, restrictTo('recruiter'), async (req, res) => {
  try {
    const { stage, note } = req.body
    const validStages = ['Applied', 'Screening', 'Interview', 'Offer', 'Rejected']

    if (!validStages.includes(stage)) {
      return res.status(400).json({ message: `Invalid stage. Must be one of: ${validStages.join(', ')}` })
    }

    const application = await Application.findById(req.params.id)
    if (!application) return res.status(404).json({ message: 'Application not found.' })

    application.stage = stage
    application.stageHistory.push({ stage, note: note || '' })
    await application.save()

    res.json({ application })
  } catch (err) {
    res.status(500).json({ message: 'Failed to update stage.', error: err.message })
  }
})

// ── PATCH /api/applications/:id/notes ────────────────────────────────────────
// Recruiter saves notes on an application

router.patch('/:id/notes', protect, restrictTo('recruiter'), async (req, res) => {
  try {
    const application = await Application.findByIdAndUpdate(
      req.params.id,
      { recruiterNotes: req.body.notes || '' },
      { new: true }
    )
    if (!application) return res.status(404).json({ message: 'Application not found.' })
    res.json({ application })
  } catch (err) {
    res.status(500).json({ message: 'Failed to save notes.', error: err.message })
  }
})

module.exports = router
