# SmartHire — Before You Start
### Your complete beginner-to-deep orientation guide
*Written by your AI mentor with 10+ years full-stack experience*

---

## 1. The Folder Created on Your Desktop

```
SmartHire/
├── frontend/        ← All React code lives here
├── backend/         ← All Node.js + Express code lives here
└── notebooks/       ← You are here. Concept guides after every phase.
```

Think of this like a real software company: the frontend team and backend team work
in separate codebases, and they talk to each other over HTTP (network requests).

---

## 2. Which Claude Model to Use — and Why

| Model | Best For | Speed | Cost |
|---|---|---|---|
| **Claude Sonnet 4.6** ✅ | Writing code, explanations, full-stack work | Fast | Moderate |
| Claude Opus 4.8 | Deep architecture decisions, very complex reasoning | Slower | Higher |
| Claude Haiku 4.5 | Quick one-liners, autocomplete, simple Q&A | Very fast | Low |

**Recommendation: Use Claude Sonnet 4.6 (this model, right now).**

Why? It handles long code files without losing track, explains things clearly,
and is fast enough that you won't wait around. For this entire SmartHire build,
Sonnet 4.6 is your go-to. You only need Opus if you're doing something like
designing a complex AI pipeline from scratch.

---

## 3. Claude Code vs Cowork — What's the Difference?

### Cowork (where you are now)
- Chat-based, visual, beginner-friendly
- Can write files, run code in a shell, create notebooks like this one
- Great for: learning, planning, building with guidance, getting explanations
- **Best for beginners** — you can ask "why?" after every step

### Claude Code
- Terminal-based (you open it in your VS Code terminal or system terminal)
- More powerful for large codebases — it can read your entire project, run tests,
  make git commits, install packages, and fix bugs autonomously
- Best for: experienced developers, automating repetitive dev tasks, large refactors
- Steeper learning curve if you're new

### Decision for SmartHire:
**We will build SmartHire entirely here in Cowork.** Here's why that's the right
call for you:

1. Every phase produces a notebook (like this one) that teaches you *why* not just *what*
2. You can ask questions mid-build without switching tools
3. I'll write the actual files directly to your SmartHire folder on your Desktop
4. Once you're comfortable, you can open the project in VS Code and use Claude Code
   for the advanced phases (AI features, deployment)

**You get the best of both worlds:** guided learning now, professional tooling later.

---

## 4. How the Mentor System Works

After every phase of development, I will create a notebook in this folder.
Each notebook follows this structure:

```
## What we built       ← Plain English summary
## Concepts used       ← Every term explained from zero
## The code, line by line  ← Nothing left unexplained
## Common mistakes     ← What beginners get wrong here
## How to test it      ← How you verify it works
## What comes next     ← Bridge to the next phase
```

You should read the notebook *after* the code is written. Think of writing code
as doing the experiment, and the notebook as understanding why it worked.

---

## 5. Core Concepts You'll Encounter in SmartHire

Before the first line of code, let's define the vocabulary so nothing surprises you.

### What is MERN?
MERN is a set of four technologies that work together to build a complete web app:

- **M**ongoDB — the database (stores your data as JSON-like documents)
- **E**xpress.js — the backend framework (handles HTTP routes, business logic)
- **R**eact — the frontend library (builds the UI the user sees)
- **N**ode.js — the JavaScript runtime (lets you run JS outside the browser)

Think of it as: React is the shop window, Express is the shop counter, MongoDB
is the stockroom, and Node.js is the building itself.

### What is an API?
API stands for Application Programming Interface. In MERN, it means:
the frontend (React) sends HTTP requests to the backend (Express), which
processes them and sends back data (JSON).

Example:
```
React clicks "Post Job" button
→ sends POST request to http://localhost:5000/api/jobs
→ Express receives it, saves to MongoDB
→ responds with { success: true, job: { id: "123", title: "..." } }
→ React shows "Job posted!" on screen
```

### What is REST?
REST is a convention for how to design your API routes. It maps HTTP verbs to actions:

| HTTP Verb | Action | Example |
|---|---|---|
| GET | Read | GET /api/jobs → list all jobs |
| POST | Create | POST /api/jobs → create a job |
| PUT/PATCH | Update | PUT /api/jobs/123 → edit job 123 |
| DELETE | Delete | DELETE /api/jobs/123 → remove job 123 |

### What is JWT (JSON Web Token)?
When a user logs in, the server creates a JWT — a signed string of text that
proves who you are. The frontend stores this token and sends it with every
request. The backend checks the token to know who's asking and what they're
allowed to do.

Example token (it's just three base64 strings joined by dots):
```
eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiIxMjMifQ.SIGNATURE
```

### What is React?
React is a JavaScript library for building user interfaces. Instead of
manually updating HTML when data changes, you describe what the UI *should
look like* and React figures out the minimum changes needed.

Key concept: **Components** — reusable pieces of UI. A Button, a JobCard,
a Sidebar — all are components. You compose them like LEGO blocks.

### What is MongoDB?
MongoDB is a NoSQL database. Instead of tables and rows (like Excel), it
stores data as *documents* — JSON objects grouped into *collections*.

```json
// A "jobs" collection document
{
  "_id": "64ab12cd...",
  "title": "Senior React Developer",
  "status": "open",
  "requirements": ["React", "TypeScript", "3+ years"],
  "createdAt": "2026-06-27T10:00:00Z"
}
```

No fixed schema means you can add/remove fields freely — great for evolving products.

### What is State Management?
In React, "state" is data that changes over time (like whether a user is logged in,
or which jobs are loaded). State management means deciding where to store that data
and how different components access it.

SmartHire uses:
- **Zustand** — for global state (auth user, theme)
- **TanStack Query** — for server state (data fetched from the API, caching)

### What is Tailwind CSS?
Instead of writing CSS in separate files, Tailwind gives you utility classes
you apply directly in HTML/JSX:

```jsx
// Without Tailwind
<button className="submit-btn">Submit</button>
// .submit-btn { background: blue; color: white; padding: 8px 16px; ... }

// With Tailwind
<button className="bg-blue-500 text-white px-4 py-2 rounded">Submit</button>
```

Fast to write, consistent across the project, no CSS file bloat.

---

## 6. Your Learning Mindset for This Project

Here's what separates developers who get hired from those who don't:

**Don't memorize. Understand.**
You don't need to memorize syntax. You need to understand *why* something is done.
When you understand why JWT exists, you'll never forget how to use it.

**Break things on purpose.**
After I write any code, try changing something and see what breaks. Deliberate
breaking is the fastest way to learn what each piece does.

**Ask "why" at every step.**
You have an AI mentor available. Use it. Ask "why are we using useQuery here
instead of useEffect?" or "what happens if I remove this middleware?" — every
question makes your understanding stronger.

**Commit to the notebooks.**
Each notebook is your study guide for the job interview. When a recruiter asks
"how does JWT auth work?", you'll answer confidently because you *built it* and
then *read the explanation*.

---

## 7. What You'll Be Able to Say After This Project

In a job interview for a MERN developer role, you will be able to confidently answer:

- "Walk me through how your authentication works" ← JWT + refresh token flow
- "How do you handle file uploads?" ← Multer + S3 presigned URLs
- "How do you integrate AI into a web app?" ← OpenAI API + BullMQ queue
- "What's your state management approach?" ← Zustand + TanStack Query
- "How do you structure a MERN project at scale?" ← You literally built one

That's not memorizing answers. That's having built the thing.

---

*Next notebook: `01_setup-explained.md` — created after Phase 1 is complete.*
*Next step: Tell your mentor you're ready to start Phase 1.*
