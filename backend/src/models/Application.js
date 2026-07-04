const mongoose = require('mongoose')

const stageHistorySchema = new mongoose.Schema({
  stage: { type: String, required: true },
  movedAt: { type: Date, default: Date.now },
  note: { type: String, default: '' },
}, { _id: false })

const applicationSchema = new mongoose.Schema(
  {
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
    },
    candidate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Snapshot of candidate info at time of application
    personalInfo: {
      firstName:  { type: String, required: true },
      lastName:   { type: String, required: true },
      email:      { type: String, required: true },
      phone:      { type: String, default: '' },
      linkedin:   { type: String, default: '' },
      portfolio:  { type: String, default: '' },
      experience: { type: String, default: '' },
    },
    resumeUrl: {
      type: String,
      default: '',  // local path in dev, S3 URL in production
    },
    resumeOriginalName: {
      type: String,
      default: '',
    },
    coverLetter: {
      type: String,
      default: '',
    },
    source: {
      type: String,
      default: '',
    },
    stage: {
      type: String,
      enum: ['Applied', 'Screening', 'Interview', 'Offer', 'Rejected'],
      default: 'Applied',
    },
    stageHistory: {
      type: [stageHistorySchema],
      default: [],
    },
    recruiterNotes: {
      type: String,
      default: '',
    },
    score: {
      type: Number,
      min: 0,
      max: 100,
      default: null,  // set by AI ranking in Phase 7
    },
  },
  { timestamps: true }
)

// Prevent duplicate applications (one candidate per job)
applicationSchema.index({ job: 1, candidate: 1 }, { unique: true })

module.exports = mongoose.model('Application', applicationSchema)
