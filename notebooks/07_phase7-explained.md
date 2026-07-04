# Phase 7 — AI Features Explained

## What we built

Five AI endpoints bolted onto the existing Express backend, each wired to OpenAI's chat-completion API:

| Endpoint | Model | Returns |
|---|---|---|
| POST /ai/parse-resume | gpt-4o-mini | Structured resume fields |
| POST /ai/rank-candidate | gpt-4o-mini | Score 0-100 + breakdown |
| POST /ai/interview-questions | gpt-4o | 5 tailored questions |
| POST /ai/analyze-jd | gpt-4o | Bias flags + rewrite |
| POST /ai/summarize-candidate | gpt-4o-mini | Headline + bullets |

On the frontend, a `BiasCheckerSidebar` lives inside `JobForm`, and a three-tab `CandidateDrawer` (Profile / AI Questions / Notes) lives inside `Pipeline`. Candidates' applications are auto-scored immediately after submission via a fire-and-forget call.

---

## Concept 1 — How the OpenAI chat API actually works

Every call is stateless. You send an array of messages, each with a `role` (`system` or `user`) and `content`. OpenAI returns one completion.

```js
const response = await openai.chat.completions.create({
  model: 'gpt-4o-mini',
  messages: [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user',   content: 'Summarise this resume: ...'   },
  ],
  temperature: 0.3,
})
const text = response.choices[0].message.content
```

`temperature` controls randomness. 0 = deterministic, 1 = creative. For structured data extraction we use 0.3; for interview questions (needs variety) we use 0.6.

---

## Concept 2 — Structured outputs with `response_format: json_object`

When you need JSON back (not free-form prose) you add two things:

1. Tell OpenAI to force JSON mode: `response_format: { type: 'json_object' }`
2. Say "respond in JSON" somewhere in the system prompt — OpenAI requires this.

```js
const response = await openai.chat.completions.create({
  model: 'gpt-4o-mini',
  messages: [...],
  response_format: { type: 'json_object' },
  temperature: 0.3,
})
const data = JSON.parse(response.choices[0].message.content)
// data is now a real JS object — no regex, no brittle string parsing
```

We wrapped this in a `chatJSON` helper so every route just does:
```js
const result = await chatJSON(systemPrompt, userPrompt)
```

Why not just tell the model "reply in JSON" without the flag? Because without the flag the model sometimes adds markdown fences (`` ```json ``), explanatory sentences, or trailing commas. The flag guarantees a parseable string every time.

---

## Concept 3 — Prompt engineering: system vs user prompt

The **system prompt** sets the persona and output contract. The **user prompt** provides the dynamic data.

```
SYSTEM:
  You are a senior technical recruiter with 15 years of experience.
  Evaluate the candidate against the job requirements.
  Respond in JSON: { score: number, strengths: string[], gaps: string[], recommendation: string }

USER:
  Job title: Senior React Developer
  Requirements: TypeScript, 5+ years React, GraphQL
  Candidate summary: 3 years React (no TypeScript), built REST APIs
```

Lessons from building SmartHire:
- Put the JSON schema in the system prompt, not the user prompt — the model treats it as a contract.
- Be explicit about data types: `score: number (0-100)` not just `score`.
- Shorter prompts = lower cost and usually better output. Strip whitespace from resume text before sending.

---

## Concept 4 — Model choice and cost

| Model | Cost (input / 1M tokens) | When to use |
|---|---|---|
| gpt-4o-mini | ~$0.15 | High-volume, simple extraction (ranking, summarising) |
| gpt-4o | ~$2.50 | Complex reasoning (bias detection, question generation) |

In SmartHire:
- Ranking and summarising use `gpt-4o-mini` — they run on every application, so volume matters.
- Interview question generation and JD analysis use `gpt-4o` — they're recruiter-triggered, infrequent, and benefit from deeper reasoning.

Rule of thumb: if the task is "classify / extract / score with a clear rubric", mini is fine. If it's "reason about nuance / generate creative output", use the full model.

---

## Concept 5 — Fire-and-forget async AI calls

Some AI tasks should not block the user. Ranking a candidate takes 2-4 seconds. Making the candidate wait on that after hitting "Submit application" is bad UX.

**Fire-and-forget pattern:**

```js
// In ApplyForm.jsx onSuccess callback
onSuccess: (application) => {
  if (application?._id) {
    aiApi.rankCandidate(application._id).catch(() => {})  // intentionally not awaited
  }
  setSubmitted(true)   // user sees success screen immediately
}
```

The `.catch(() => {})` silently swallows failures. The user never knows if ranking failed, which is fine — the recruiter just sees a missing score and can trigger it manually. This is appropriate because:
- The score is a "nice to have" not a blocker.
- Failing silently is better than surfacing an unrelated error to the candidate.

The alternative (awaiting AI before showing success) would mean the form hangs for 2-4 seconds with no feedback, making users think their submission failed.

---

## Concept 6 — AI UX patterns

Three patterns used in SmartHire:

**1. Progressive disclosure — Quick mode first, AI mode on demand**
The `BiasCheckerSidebar` always shows instant regex-based checks (finds words like "young", "aggressive", "rockstar"). The "Analyze with GPT-4o" button only appears if you want the deeper AI analysis. This means the sidebar is useful immediately, with no API cost, and the AI is an upgrade path — not a gate.

**2. Loading states for AI calls**
AI calls take 1-5 seconds. Always show a spinner with a meaningful label:
```jsx
{isLoading ? 'Generating questions...' : 'Generate AI Questions'}
```
Never just disable the button with no feedback.

**3. Non-destructive AI suggestions**
The JD analyzer returns a `rewrittenOpening`. We display it in a read-only box alongside the original — the recruiter copies it in if they like it. We never overwrite their content automatically. AI assists; it does not replace.

---

## Concept 7 — How the bias checker works (two layers)

**Layer 1 — Instant regex (zero cost)**
```js
const BIAS_PATTERNS = [
  { pattern: /\b(young|energetic|recent graduate)\b/gi, type: 'age' },
  { pattern: /\b(native speaker|mother tongue)\b/gi,    type: 'language' },
  { pattern: /\b(he\/she|chairman)\b/gi,                type: 'gender' },
  // ...
]
```
Runs in the browser on every keystroke. Highlights matches immediately.

**Layer 2 — GPT-4o deep analysis (on demand)**
Sends the full JD to GPT-4o and asks it to return:
- `score` — overall inclusivity score (0-100)
- `flags[]` — specific issues with explanation and suggestion
- `overallFeedback` — one paragraph summary
- `rewrittenOpening` — rewritten first paragraph without bias
- `missingElements[]` — standard inclusive hiring elements that are absent

Two layers because: (a) regex is fast and free for obvious cases, (b) GPT-4o catches subtle issues regex would miss ("We move fast" implicitly discourages people with disabilities who need accommodations).

---

## Concept 8 — Populating data for AI context

The ranking endpoint needs the full job description and candidate resume to do a meaningful comparison. Getting this data requires Mongoose `.populate()`:

```js
const application = await Application.findById(applicationId)
  .populate('job')        // replaces job ObjectId with full Job document
  .populate('candidate')  // replaces candidate ObjectId with full User document

// Now we can access application.job.description, application.job.requirements, etc.
```

Without populate, `application.job` is just a MongoDB ObjectId string — useless for an AI prompt. Populate is essentially a JOIN for MongoDB.

---

## Architecture diagram

```
User submits application
        |
applicationsApi.submit(formData)
        |
POST /api/applications       <-- multer parses multipart, saves resume file
        |
Application.create()         <-- stored in MongoDB
        |
 [return to client]
        |
aiApi.rankCandidate(id)      <-- fire-and-forget (not awaited)
        |
POST /api/ai/rank-candidate
        |
Application.findById().populate('job').populate('candidate')
        |
chatJSON(systemPrompt, userPrompt)   <-- gpt-4o-mini
        |
Application.findByIdAndUpdate({ score, recruiterNotes })
```

---

## Common mistakes and how to avoid them

**Mistake: Not validating the JSON shape from OpenAI**
The model sometimes returns extra keys or omits optional ones. Always access with optional chaining:
```js
result?.score ?? 0
result?.strengths ?? []
```

**Mistake: Sending the entire raw resume file to the API**
PDFs contain binary data. Extract text first (or use the resume text the candidate typed). Sending file bytes to a chat model does nothing useful.

**Mistake: One giant prompt for everything**
Separate concerns. One prompt for scoring, a different prompt for interview questions. Mixing tasks in a single prompt degrades output quality.

**Mistake: Not handling API errors**
OpenAI can rate-limit or time out. Every AI route in SmartHire has a try/catch that returns a 500 with a human-readable message rather than crashing.

---

## What a senior dev would do next

- **Streaming responses** — for long AI outputs (cover letter generation), stream tokens to the UI so the user sees text appearing rather than waiting for the full response.
- **Caching** — interview questions for the same job+stage combination are regenerated on every click. Cache them in Redis or even in the Application document.
- **Cost monitoring** — log `response.usage.total_tokens` per call to a database. Build a simple dashboard to spot runaway costs before the bill arrives.
- **Prompt versioning** — treat prompts like code. Store them with version numbers so you can A/B test and roll back.
- **Fallback model** — if gpt-4o is unavailable, retry with gpt-4o-mini rather than returning a hard error.
