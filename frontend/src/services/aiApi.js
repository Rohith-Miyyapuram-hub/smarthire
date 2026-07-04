import api from './api'

export const aiApi = {
  // Score a candidate against a job -- called after application submit
  rankCandidate: (applicationId) =>
    api.post('/ai/rank-candidate', { applicationId }).then((r) => r.data),

  // Generate interview questions for a role + stage
  interviewQuestions: ({ jobId, stage, candidateName, candidateBackground }) =>
    api.post('/ai/interview-questions', { jobId, stage, candidateName, candidateBackground })
       .then((r) => r.data),

  // Deep AI JD analysis (bias + suggestions)
  analyzeJD: ({ description, title, requirements }) =>
    api.post('/ai/analyze-jd', { description, title, requirements }).then((r) => r.data),

  // 3-bullet candidate summary
  summarizeCandidate: (applicationId) =>
    api.post('/ai/summarize-candidate', { applicationId }).then((r) => r.data),
}
