# Phase 6 -- Backend with Node.js, Express, MongoDB: Everything Explained
### From scratch to deep -- read this after Phase 6 is done
*Your AI mentor | SmartHire build series*

---

## What we built in Phase 6

- A Node.js + Express server with structured folder layout
- MongoDB database with 3 Mongoose models: User, Job, Application
- Auth routes: register (POST /api/auth/register), login (POST /api/auth/login), me (GET /api/auth/me)
- Jobs CRUD API: list, get, create, update, delete
- Applications API: submit (with resume file upload), list, update stage, save notes
- JWT middleware to protect routes
- Role-based authorization (recruiter vs candidate)
- Multer file upload middleware for resume handling
- API service layer in the frontend (jobsApi.js, applicationsApi.js)
- All frontend pages replaced mock data with useQuery/useMutation hooks
- A seed script to populate demo data

---

## Concept 1 -- REST API Design

REST (Representational State Transfer) is a set of conventions for designing APIs
over HTTP. The core idea: URLs identify resources, HTTP verbs describe what to do.

### The 5 HTTP verbs you need

```
GET     -- read data (does not change anything)
POST    -- create a new resource
PUT     -- replace a resource entirely
PATCH   -- update part of a resource
DELETE  -- remove a resource
```

### How we designed SmartHire's API

```
Resource: Jobs
GET    /api/jobs          -- list all active jobs (public)
GET    /api/jobs/:id      -- get one job (public)
POST   /api/jobs          -- create a job (recruiter only)
PATCH  /api/jobs/:id      -- update a job (recruiter only)
DELETE /api/jobs/:id      -- delete a job (recruiter only)

Resource: Applications
GET    /api/applications              -- list apps (filtered by role)
POST   /api/applications             -- submit an application (candidate)
GET    /api/applications/:id         -- get one application
PATCH  /api/applications/:id/stage  -- move candidate to a stage (recruiter)
PATCH  /api/applications/:id/notes  -- save recruiter notes (recruiter)

Resource: Auth (not a real resource, but conventional)
POST   /api/auth/register  -- create account
POST   /api/auth/login     -- get a JWT token
GET    /api/auth/me        -- get the logged-in user
```

### HTTP status codes

Your API responses should always use the right status code:

```
200 OK           -- success (GET, PATCH, DELETE)
201 Created      -- resource was created (POST)
400 Bad Request  -- client sent invalid data
401 Unauthorized -- not logged in
403 Forbidden    -- logged in but not allowed
404 Not Found    -- resource doesn't exist
409 Conflict     -- duplicate (e.g. email already registered)
500 Server Error -- something broke on the server
```

---

## Concept 2 -- Express.js: How a Server Works

Express is a minimal web framework for Node.js. It handles one thing:
mapping HTTP requests to JavaScript functions.

### The basic structure

```js
const express = require('express')
const app = express()

// Register middleware (runs before route handlers)
app.use(express.json())  // parse request body as JSON

// Define a route
app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello!' })
})

// Start the server
app.listen(5000, () => console.log('Server on port 5000'))
```

Every route handler receives:
- `req` (request): contains headers, body, params, query, user (if auth ran)
- `res` (response): methods to send back data (res.json, res.status, res.send)
- `next`: function to pass control to the next middleware

### Middleware

Middleware is a function that runs between the request arriving and the route
handler executing. It's how you add functionality that applies to many routes
without repeating code.

```js
// This runs for EVERY request to the app
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`)
  next()  // must call next() or the request hangs
})

// This only runs for requests to /api/*
app.use('/api', authMiddleware)
```

The middleware chain in our server:
```
Request arrives
  -> cors() handles cross-origin headers
  -> express.json() parses the body
  -> Router matches the URL
  -> protect() verifies JWT (on protected routes)
  -> restrictTo() checks role (on role-protected routes)
  -> Route handler runs
  -> res.json() sends the response
```

### Router modules

Instead of defining all routes in index.js, we split them into files:

```js
// src/routes/jobs.js
const router = require('express').Router()
router.get('/', handler)
router.post('/', protect, restrictTo('recruiter'), handler)
module.exports = router

// src/index.js
app.use('/api/jobs', require('./routes/jobs'))
```

`express.Router()` creates a mini-app with its own routes. You mount it on a
prefix in the main app. All routes defined in the router automatically get
that prefix. `/api/jobs` + `router.get('/')` = `GET /api/jobs`.

---

## Concept 3 -- MongoDB and Mongoose

MongoDB is a NoSQL document database. Instead of SQL tables and rows,
it stores JSON-like documents in collections.

### SQL vs MongoDB comparison

```
SQL                  MongoDB
----                 -------
Table                Collection
Row                  Document
Column               Field
Primary key (id)     _id (auto-generated ObjectId)
Foreign key          Reference (ObjectId stored in a field)
JOIN                 .populate()
```

A MongoDB document looks like:
```json
{
  "_id": "64f1a2b3c4d5e6f7a8b9c0d1",
  "title": "Senior React Developer",
  "department": "Engineering",
  "status": "active",
  "postedBy": "64f1a2b3c4d5e6f7a8b9c0d2",
  "createdAt": "2026-06-20T10:30:00.000Z"
}
```

### Mongoose: Schema + Model

Mongoose adds a schema layer on top of MongoDB (which is schema-less by default).

```js
const mongoose = require('mongoose')

// Schema: defines the shape and validation rules
const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],  // validation with message
      trim: true,
    },
    status: {
      type: String,
      enum: ['active', 'draft', 'paused', 'closed'],  // only these values allowed
      default: 'active',
    },
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,  // reference to User collection
      ref: 'User',
    },
  },
  { timestamps: true }  // adds createdAt and updatedAt automatically
)

// Model: the class you use to interact with the collection
const Job = mongoose.model('Job', jobSchema)
```

`mongoose.model('Job', jobSchema)` creates a `Job` class that maps to the
`jobs` collection in MongoDB (lowercase, pluralized automatically).

### CRUD with Mongoose

```js
// Create
const job = await Job.create({ title: 'Engineer', department: 'Eng' })

// Read all
const jobs = await Job.find({ status: 'active' })

// Read one by ID
const job = await Job.findById('64f1a2b...')

// Update
await Job.findByIdAndUpdate(id, { status: 'paused' }, { new: true })

// Delete
await Job.findByIdAndDelete(id)

// Filtering and sorting
const jobs = await Job.find({ status: 'active' })
  .sort({ createdAt: -1 })  // newest first
  .limit(10)                // max 10 results
  .populate('postedBy', 'name email')  // replace ObjectId with User data
```

`await` is used for every database call because MongoDB is asynchronous.
It's like making a network call -- it takes time, and you wait for the result
before continuing.

---

## Concept 4 -- Authentication with JWT

JWT (JSON Web Token) is a way to prove identity without storing sessions.

### The flow

```
1. User submits email + password
2. Server verifies: find user, compare bcrypt hash
3. If valid: server signs a JWT with the user's ID
4. Server returns: { token: "eyJhbG...", user: {...} }
5. Client stores token (Zustand + localStorage)
6. Client sends token on every protected request:
   Authorization: Bearer eyJhbG...
7. Server's protect() middleware verifies the token on each request
8. If valid: attaches the user to req.user and lets the request proceed
```

### Why not sessions?

Sessions store a session ID in a cookie, and the server keeps a session record
in memory or a database. JWTs are self-contained -- the server can verify them
without a database lookup (just cryptographic verification).

This makes JWTs better for:
- APIs consumed by mobile and web clients (no cookie support required)
- Distributed systems (any server can verify the token without shared state)
- Stateless scaling (no session store to sync between servers)

### How bcrypt works

Plain text passwords are never stored. bcrypt hashes them:

```js
// Storing password
const hash = await bcrypt.hash('mypassword123', 12)
// hash = "$2b$12$K8nMO7w3vQp..." (irreversible)
// Cost factor 12 = 2^12 = 4096 iterations (slower = harder to brute-force)

// Verifying
const isMatch = await bcrypt.compare('mypassword123', hash)
// true -- bcrypt knows how to compare the plain text with the hash
```

We used a pre-save Mongoose hook so hashing happens automatically:

```js
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next()  // don't re-hash if unchanged
  this.password = await bcrypt.hash(this.password, 12)
  next()
})
```

`this.isModified('password')` returns false if only the name or email changed.
Without this check, every time you updated a user's name, it would re-hash an
already-hashed password, making it unverifiable.

### The protect middleware

```js
async function protect(req, res, next) {
  // 1. Extract token from Authorization header
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ message: 'Not authenticated' })

  // 2. Verify the token cryptographically
  const decoded = jwt.verify(token, process.env.JWT_SECRET)
  // decoded = { id: '64f1a2b...', iat: 1718000000, exp: 1718604800 }

  // 3. Look up the actual user (confirms they still exist)
  const user = await User.findById(decoded.id)
  if (!user) return res.status(401).json({ message: 'User no longer exists' })

  // 4. Attach user to request for downstream handlers
  req.user = user
  next()
}
```

`jwt.verify()` throws an error if the token is expired or tampered with.
We wrap the whole function in try/catch (in the real implementation) to
return 401 on any JWT error.

---

## Concept 5 -- Role-Based Access Control (RBAC)

Not all authenticated users should be able to do everything.
Recruiters can create/edit/delete jobs. Candidates cannot.

```js
function restrictTo(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' })
    }
    next()
  }
}

// Usage: protect first (verify token), then restrictTo (check role)
router.post('/jobs', protect, restrictTo('recruiter'), createJob)
router.post('/applications', protect, restrictTo('candidate'), submitApplication)
```

`protect` always runs first. It attaches `req.user`. `restrictTo` reads
`req.user.role` -- this is why order matters in middleware chains.

The HTTP status codes matter here:
- 401 = "I don't know who you are" (not authenticated)
- 403 = "I know who you are, but you can't do this" (not authorized)

---

## Concept 6 -- File Uploads with Multer

Multer is Express middleware for handling `multipart/form-data` (the encoding
used for file uploads).

```js
const multer = require('multer')

// Configure where files go and what they're named
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, './uploads'),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${req.user._id}-${file.originalname}`
    cb(null, unique)
  },
})

// Add a file type filter
const fileFilter = (req, file, cb) => {
  const allowed = ['.pdf', '.doc', '.docx']
  const ext = path.extname(file.originalname).toLowerCase()
  cb(null, allowed.includes(ext))  // true = accept, false = reject
}

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } })

// Use in a route: upload.single('resume') processes one file from the 'resume' field
router.post('/applications', protect, upload.single('resume'), async (req, res) => {
  const resumePath = req.file?.path  // multer adds req.file
  // req.body contains all other form fields
})
```

On the frontend, file uploads use `FormData`:

```js
const fd = new FormData()
fd.append('jobId', '64f1a2b...')
fd.append('firstName', 'Priya')
fd.append('resume', fileObject)  // File object from <input type="file">

// axios detects FormData and sets Content-Type: multipart/form-data automatically
axios.post('/api/applications', fd)
```

In Phase 7, the resume URL will point to S3 instead of the local filesystem.

---

## Concept 7 -- CORS (Cross-Origin Resource Sharing)

By default, browsers block JavaScript from making requests to a different
domain/port than the page is served from. This is called the "same-origin policy".

Our setup:
- Frontend: http://localhost:5173 (Vite dev server)
- Backend: http://localhost:5000 (Express)

These are different ports, so the browser blocks the request -- unless the
backend explicitly allows it with CORS headers.

```js
const cors = require('cors')

app.use(cors({
  origin: 'http://localhost:5173',  // only allow our frontend
  credentials: true,                // allow cookies and auth headers
}))
```

The `cors` middleware adds this response header:
```
Access-Control-Allow-Origin: http://localhost:5173
```

Without this, every API call from the frontend fails with:
"CORS policy: No 'Access-Control-Allow-Origin' header is present"

---

## Concept 8 -- TanStack Query: useQuery and useMutation

With a real backend, we replaced all mock data with TanStack Query hooks.

### useQuery for reading data

```jsx
const { data: jobs = [], isLoading, isError } = useQuery({
  queryKey: ['jobs', 'active'],     // cache key -- unique per query
  queryFn: () => jobsApi.list({ status: 'active' }),  // async function
})
```

TanStack Query handles:
- Loading state (isLoading = true while fetching)
- Error state (isError = true if the request fails)
- Caching (don't re-fetch if data is fresh)
- Background refetch (refresh stale data automatically)
- Deduplication (multiple components using the same key = one request)

The `queryKey` is the cache key. Any time you call `queryClient.invalidateQueries({ queryKey: ['jobs'] })`,
it marks all queries starting with 'jobs' as stale and refetches them.

### useMutation for writing data

```jsx
const { mutate, isPending } = useMutation({
  mutationFn: (data) => jobsApi.create(data),
  onSuccess: () => {
    // Invalidate the jobs list so it refetches
    queryClient.invalidateQueries({ queryKey: ['recruiter-jobs'] })
    navigate('/recruiter/jobs')
  },
})

// Trigger the mutation
<button onClick={() => mutate({ title: 'Engineer', department: 'Eng' })}>
  Save
</button>
```

`mutate(data)` calls `mutationFn(data)`. On success, we invalidate the
cache so the list automatically refreshes without a manual page reload.

### The invalidation pattern

```
User creates a job
  -> useMutation fires POST /api/jobs
  -> onSuccess: queryClient.invalidateQueries(['recruiter-jobs'])
  -> useQuery(['recruiter-jobs']) detects its key is stale
  -> useQuery refetches GET /api/jobs
  -> UI updates with the new job in the list
```

This is the core of how TanStack Query keeps the UI in sync with the server.

---

## Concept 9 -- Environment Variables

Both the frontend and backend use `.env` files for configuration:

```
Backend: backend/.env
PORT=5000
MONGO_URI=mongodb://localhost:27017/smarthire
JWT_SECRET=smarthire_super_secret_change_in_production
JWT_EXPIRES_IN=7d

Frontend: frontend/.env
VITE_API_URL=http://localhost:5000/api
```

Backend reads them with `require('dotenv').config()` at app startup.
Frontend reads them with `import.meta.env.VITE_API_URL` (Vite prefix required).

### Why environment variables?

1. **Security**: secrets like JWT_SECRET and database credentials are never
   committed to git (`.env` is in `.gitignore`)
2. **Environment parity**: same code runs in dev (`localhost`), staging, and
   production just by changing the `.env`
3. **Configurability**: a DevOps engineer can deploy without reading source code

Never commit secrets to git. If you do, rotate them immediately.

---

## File structure after Phase 6

```
SmartHire/
  frontend/
    src/
      services/
        api.js              -- Axios instance + interceptors
        jobsApi.js          -- NEW: job API functions
        applicationsApi.js  -- NEW: application API functions
      pages/
        (all pages now use useQuery / useMutation)
    .env                    -- VITE_API_URL
  backend/
    src/
      index.js              -- Express app setup, DB connect
      models/
        User.js             -- Mongoose user schema
        Job.js              -- Mongoose job schema
        Application.js      -- Mongoose application schema
      routes/
        auth.js             -- /api/auth endpoints
        jobs.js             -- /api/jobs endpoints
        applications.js     -- /api/applications endpoints
      middleware/
        auth.js             -- protect + restrictTo
        upload.js           -- Multer file upload config
      seed.js               -- Demo data seeder
    .env                    -- MONGO_URI, JWT_SECRET, PORT
    .gitignore              -- node_modules, .env, uploads/
```

---

## How to run Phase 6 locally

You need MongoDB running. Install MongoDB Community Edition from mongodb.com,
or use MongoDB Atlas (free cloud tier) and update MONGO_URI in backend/.env.

### Terminal 1 -- Backend

```bash
cd SmartHire/backend
npm run dev
# Output:
# MongoDB connected
# Server running on port 5000
```

### Terminal 2 -- Seed (once only)

```bash
cd SmartHire/backend
node src/seed.js
# Output:
# Connected to MongoDB
# Cleared existing data
# Created recruiter: recruiter@smarthire.com
# Created candidate: candidate@smarthire.com
# Created 5 jobs
# Seed complete.
```

### Terminal 3 -- Frontend

```bash
cd SmartHire/frontend
npm run dev
# Open http://localhost:5173
```

Login credentials after seeding:
- Recruiter: recruiter@smarthire.com / password123
- Candidate: candidate@smarthire.com / password123

---

## Common mistakes at this phase

### CORS error in browser console
"Access-Control-Allow-Origin" missing
-> Backend is not running, or CORS origin doesn't match the frontend URL.
Check that backend is on port 5000 and CLIENT_URL in .env matches.

### "User no longer exists" on login
-> You ran seed.js after already being logged in. The old JWT references
a deleted user ID. Clear localStorage and log in again.

### req.body is undefined or empty
-> You forgot `app.use(express.json())` in index.js before your routes.
Express does not parse the body by default.

### File upload: req.file is undefined
-> The form Content-Type must be multipart/form-data, not application/json.
Use `new FormData()` on the frontend, not a plain JSON object.

### JWT_SECRET not found
-> You forgot to call `require('dotenv').config()` at the very top of index.js,
before importing anything that uses process.env.

---

## Interview questions this phase prepares you for

**Q: What is REST? How do you design a REST API?**
A: REST is a set of conventions: URLs identify resources (nouns), HTTP verbs
describe actions (GET=read, POST=create, PATCH=partial update, DELETE=remove).
Use proper status codes: 201 for creation, 400 for client errors, 401/403 for
auth, 404 for missing resources. Nest resources logically:
/jobs/:id/applications for applications belonging to a job.

**Q: How does JWT authentication work?**
A: After login, the server signs a token containing the user's ID using a
secret key. The client stores it and sends it as "Authorization: Bearer TOKEN"
on every request. The server verifies the signature (no DB lookup needed) and
attaches the user to the request. Tokens expire automatically based on the
expiry claim.

**Q: What is bcrypt and why use it for passwords?**
A: bcrypt is a one-way hashing function. It's intentionally slow (configurable
cost factor) to make brute-force attacks impractical. It includes a random
salt automatically, so two users with the same password get different hashes.
You never store or compare plain text passwords.

**Q: What is Mongoose and what problem does it solve?**
A: Mongoose is an ODM (Object Document Mapper) for MongoDB. MongoDB stores any
shape of document, which can lead to inconsistent data. Mongoose adds a schema
layer with type definitions, validation rules, default values, and pre/post hooks.
It also adds a clean API for querying and transforming documents.

**Q: What is CORS and why does it matter for full-stack apps?**
A: CORS (Cross-Origin Resource Sharing) is a browser security mechanism that
blocks requests to a different origin (domain/port) by default. In full-stack
development, the frontend (port 5173) and backend (port 5000) are different
origins. The backend must explicitly allow the frontend's origin by setting
the Access-Control-Allow-Origin response header. The cors npm package handles this.

**Q: How does TanStack Query improve on plain fetch/axios?**
A: Plain fetch requires manual loading/error state, no caching, and no cache
invalidation. TanStack Query provides: automatic loading/error states, request
deduplication, stale-while-revalidate caching, automatic background refetching,
and cache invalidation so UI stays in sync with the server after mutations.

---

*Phase 6 complete. Next: Phase 7 -- AI Features (OpenAI resume parsing, candidate ranking, interview question generator).*
*Notebook: 07_phase7-explained.md created after Phase 7.*
