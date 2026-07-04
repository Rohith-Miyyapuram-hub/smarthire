const express     = require('express')
const { chatJSON, chatText } = require('../services/openai')
const Job         = require('../models/Job')
const Application = require('../models/Application')
const { protect, restrictTo } = require('../middleware/auth')

const router = express.Router()

// ── POST /api/ai/parse-resume ─────────────────────────────────────────────────
// Extract structured data from resume text
// Used by: candidate after uploading resume (Phase 8 enhancement)

router.post('/parse-resume', protect, async (req, res) => {
  try {
    const { resumeText } = req.body
    if (!resumeText || resumeText.trim().length < 50) {
      return res.status(400).json({ message: 'Resume text is too short to parse.' })
    }

    const system = `You are a resume parser. Extract structured information from the resume text.
Return a JSON object with exactly these keys:
- name: string (full name)
- email: string
- phone: string
- summary: string (2-3 sentence professional summary)
- skills: string[] (technical and soft skills)
- experience: array of { title, company, duration, highlights: string[] }
- education: array of { degree, institution, year }
- totalYearsExperience: number (estimated)
If a field is not found, use null for strings and [] for arrays.`

    const parsed = await chatJSON(system, `Parse this resume:\n\n${resumeText}`)

    res.json({ parsed })
  } catch (err) {
    res.status(500).json({ message: 'Resume parsing failed.', error: err.message })
  }
})

// ── POST /api/ai/rank-candidate ───────────────────────────────────────────────
// Score a candidate (0-100) against a job's requirements
// Called automatically when an application is submitted

router.post('/rank-candidate', protect, async (req, res) => {
  try {
    const { applicationId } = req.body

    const application = await Application.findById(applicationId).populate('job')
    if (!application) return res.status(404).json({ message: 'Application not found.' })

    const job = application.job
    const { personalInfo, coverLetter } = application

    const system = `You are an AI recruiting assistant. Score how well a candidate matches a job.
Return a JSON object with:
- score: number 0-100 (overall match score)
- breakdown: { skills: number, experience: number, communication: number } (each 0-100)
- strengths: string[] (top 3 things that match well)
- gaps: string[] (top 2-3 things missing or unclear)
- recommendation: string (one sentence: "Strong match", "Potential match", or "Weak match" + why)

Be fair, objective, and base your score only on the information provided.
Score 70+ = strong match, 50-69 = potential match, below 50 = weak match.`

    const userPrompt = `
JOB REQUIREMENTS:
Title: ${job.title}
Department: ${job.department}
Description: ${job.description}
Requirements: ${(job.requirements || []).join(', ')}

CANDIDATE PROFILE:
Name: ${personalInfo.firstName} ${personalInfo.lastName}
Experience level: ${personalInfo.experience || 'Not specified'}
LinkedIn: ${personalInfo.linkedin || 'Not provided'}
Portfolio: ${personalInfo.portfolio || 'Not provided'}
Cover letter: ${coverLetter || 'Not provided'}
`

    const result = await chatJSON(system, userPrompt)

    // Persist score to database
    await Application.findByIdAndUpdate(applicationId, {
      score: Math.round(result.score),
      recruiterNotes: application.recruiterNotes
        ? application.recruiterNotes
        : `AI Analysis:\nScore: ${result.score}/100\n${result.recommendation}\n\nStrengths: ${result.strengths?.join(', ')}\nGaps: ${result.gaps?.join(', ')}`,
    })

    res.json({ score: result.score, breakdown: result.breakdown, strengths: result.strengths, gaps: result.gaps, recommendation: result.recommendation })
  } catch (err) {
    res.status(500).json({ message: 'Candidate ranking failed.', error: err.message })
  }
})

// ── POST /api/ai/interview-questions ─────────────────────────────────────────
// Generate targeted interview questions for a candidate at a given stage

router.post('/interview-questions', protect, restrictTo('recruiter'), async (req, res) => {
  try {
    const { jobId, stage, candidateName, candidateBackground } = req.body

    const job = await Job.findById(jobId)
    if (!job) return res.status(404).json({ message: 'Job not found.' })

    const stageFocus = {
      Screening:  'high-level fit, motivation, background verification',
      Interview:  'deep technical skills, problem-solving, past projects',
      Offer:      'culture fit, expectations, long-term goals, compensation alignment',
    }

    const focus = stageFocus[stage] || 'general fit and background'

    const system = `You are an expert technical recruiter. Generate targeted interview questions.
Return a JSON object with:
- questions: array of exactly 5 objects, each with:
  - question: string (the interview question)
  - type: string ("technical" | "behavioral" | "situational" | "motivational")
  - whatToListenFor: string (what a strong answer looks like, 1-2 sentences)
  - followUp: string (a good follow-up question)

Questions should be specific to the role and stage. Avoid generic questions.`

    const userPrompt = `
Job: ${job.title} at SmartHire
Department: ${job.department}
Requirements: ${(job.requirements || []).join(', ')}
Description summary: ${job.description.substring(0, 300)}

Stage: ${stage} interview
Focus areas for this stage: ${focus}
${candidateName ? `Candidate name: ${candidateName}` : ''}
${candidateBackground ? `Candidate background: ${candidateBackground}` : ''}

Generate 5 interview questions.`

    const result = await chatJSON(system, userPrompt, 'gpt-4o')

    res.json({ questions: result.questions, jobTitle: job.title, stage })
  } catch (err) {
    res.status(500).json({ message: 'Question generation failed.', error: err.message })
  }
})

// ── POST /api/ai/analyze-jd ───────────────────────────────────────────────────
// Deep AI-powered job description analysis for bias + improvement suggestions

router.post('/analyze-jd', protect, restrictTo('recruiter'), async (req, res) => {
  try {
    const { description, title, requirements } = req.body

    if (!description || description.trim().length < 30) {
      return res.status(400).json({ message: 'Description too short to analyze.' })
    }

    const system = `You are an inclusive hiring expert. Analyze job descriptions for bias and improvement opportunities.
Return a JSON object with:
- score: number 0-100 (inclusivity score, 100 = perfectly inclusive)
- flags: array of objects, each with:
  - text: string (the exact phrase found)
  - type: string (e.g. "gender-coded", "age-bias", "exclusionary", "jargon")
  - level: "error" | "warning"
  - why: string (brief explanation, 1 sentence)
  - suggestion: string (exact replacement text or approach)
- overallFeedback: string (2-3 sentence summary of the JD's inclusivity)
- rewrittenOpening: string (rewrite the first 2 sentences to be more inclusive if needed, otherwise say "Opening looks good.")
- missingElements: string[] (important inclusive elements not present, e.g. "salary range", "remote policy", "DEI statement")`

    const userPrompt = `
Job title: ${title || 'Not specified'}
Requirements: ${(requirements || []).join(', ') || 'Not specified'}

Job description:
${description}`

    const result = await chatJSON(system, userPrompt, 'gpt-4o')

    res.json(result)
  } catch (err) {
    res.status(500).json({ message: 'JD analysis failed.', error: err.message })
  }
})

// ── POST /api/ai/summarize-candidate ─────────────────────────────────────────
// Generate a 3-bullet executive summary of a candidate for quick recruiter review

router.post('/summarize-candidate', protect, restrictTo('recruiter'), async (req, res) => {
  try {
    const { applicationId } = req.body

    const application = await Application.findById(applicationId).populate('job')
    if (!application) return res.status(404).json({ message: 'Application not found.' })

    const { personalInfo, coverLetter, score } = application
    const job = application.job

    const system = `You are a recruiting assistant. Write a concise candidate summary for a recruiter.
Return a JSON object with:
- headline: string (one sentence: who they are and their experience level)
- bullets: string[] (exactly 3 bullet points: key strength, relevant experience, potential concern)
- verdict: string ("Recommend advancing" | "Consider advancing" | "Pass") with one-sentence reason`

    const userPrompt = `
Applying for: ${job.title}
Candidate: ${personalInfo.firstName} ${personalInfo.lastName}
Experience: ${personalInfo.experience || 'Unknown'}
AI score: ${score || 'Not scored'}
Cover letter: ${coverLetter || 'Not provided'}
LinkedIn: ${personalInfo.linkedin || 'Not provided'}`

    const result = await chatJSON(system, userPrompt)

    res.json(result)
  } catch (err) {
    res.status(500).json({ message: 'Summarization failed.', error: err.message })
  }
})

module.exports = router
