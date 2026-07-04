# Phase 8 — Deployment Explained

## What we did in this phase

Made SmartHire production-ready and prepared it for deployment on three free-tier services:

- **MongoDB Atlas** — cloud database (replaces localhost MongoDB)
- **Railway** — backend hosting (Node.js + Express)
- **Vercel** — frontend hosting (Vite + React)

Files changed/added:
- `backend/package.json` — added `engines: { node: ">=18" }` (tells hosting platforms which Node version to use)
- `backend/src/index.js` — auto-creates uploads dir, multi-origin CORS
- `backend/railway.json` — Railway deployment config
- `frontend/vercel.json` — Vercel SPA routing fallback
- `.gitignore` (root + both packages)

---

## Step-by-step deployment guide

### Step 1 — Push to GitHub

Before deploying, the code needs to be on GitHub. If you haven't done this yet:

```bash
# In C:\Users\rohit\Desktop\SmartHire
git init
git add .
git commit -m "feat: SmartHire complete — Phases 1-8"
```

Create a new repo at github.com (call it `smarthire`), then:

```bash
git remote add origin https://github.com/YOUR_USERNAME/smarthire.git
git branch -M main
git push -u origin main
```

The root `.gitignore` ensures `node_modules/`, `.env`, and `uploads/` never get committed.

---

### Step 2 — MongoDB Atlas (cloud database)

Local MongoDB at `localhost:27017` won't be reachable from Railway. Replace it with Atlas.

1. Go to **mongodb.com/cloud/atlas** → sign up (free)
2. Create a **free M0 cluster** (512 MB, plenty for a portfolio project)
3. **Database Access** → Add a database user → username + password (save both)
4. **Network Access** → Add IP Address → **Allow Access from Anywhere** (0.0.0.0/0)
5. **Connect** → **Drivers** → copy the connection string:
   ```
   mongodb+srv://YOUR_USER:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/smarthire?retryWrites=true&w=majority
   ```

Save this string — you'll paste it into Railway as `MONGO_URI`.

**Why Atlas instead of localhost?**
Railway (or any cloud host) runs your code on a server somewhere in the world. That server can't reach your laptop's MongoDB. Atlas is a MongoDB server that lives in the cloud and accepts connections from anywhere.

---

### Step 3 — Deploy backend to Railway

Railway builds and runs your Node.js backend. The `railway.json` file tells it exactly how.

1. Go to **railway.app** → sign up with GitHub
2. **New Project** → **Deploy from GitHub repo**
3. Select your `smarthire` repository
4. Railway will detect a Node.js project and offer to deploy. Click the backend directory or configure it to deploy from `/backend`.
   - In Railway: **Settings** → **Root Directory** → set to `backend`
5. **Variables** tab → add all environment variables:

| Key | Value |
|---|---|
| `MONGO_URI` | Your Atlas connection string |
| `JWT_SECRET` | A long random string (use a password generator, 32+ chars) |
| `JWT_EXPIRES_IN` | `7d` |
| `NODE_ENV` | `production` |
| `OPENAI_API_KEY` | Your actual OpenAI key |
| `CLIENT_URL` | Your Vercel frontend URL (add after step 4) |

6. Railway will auto-deploy. Watch the logs tab — you should see `MongoDB connected` and `Server running on port XXXX`.
7. Copy your Railway URL (looks like `https://smarthire-production-abc123.up.railway.app`).
8. Test: visit `https://your-railway-url.up.railway.app/api/health` — should return `{"status":"ok","timestamp":"..."}`.

**What `railway.json` does:**
```json
{
  "deploy": {
    "startCommand": "node src/index.js",
    "healthcheckPath": "/api/health"
  }
}
```
Railway pings `/api/health` after each deploy to confirm the server started. If it returns 200, the deploy is marked successful. If not, Railway rolls back automatically.

---

### Step 4 — Deploy frontend to Vercel

Vercel is purpose-built for Vite/React. It detects Vite automatically.

1. Go to **vercel.com** → sign up with GitHub
2. **Add New Project** → Import your `smarthire` repo
3. Configure:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Vite (Vercel detects this automatically)
   - **Build Command**: `npm run build` (default, already correct)
   - **Output Directory**: `dist` (default, already correct)
4. **Environment Variables** → add:

| Key | Value |
|---|---|
| `VITE_API_URL` | `https://your-railway-url.up.railway.app/api` |

5. Click **Deploy**. Vercel builds and deploys in ~30 seconds.
6. Copy your Vercel URL (looks like `https://smarthire-abc123.vercel.app`).

**Go back to Railway** → Variables → add `CLIENT_URL` = your Vercel URL. Railway will redeploy automatically.

---

### Step 5 — Re-seed the database (optional)

The seed script populates MongoDB with sample data. To run it against Atlas:

```bash
# In backend/ folder, with MONGO_URI pointing to Atlas
MONGO_URI="mongodb+srv://..." node src/seed.js
```

Or temporarily change `.env` to use the Atlas URI, run the seed, then revert.

---

### Step 6 — Test the live app

Visit your Vercel URL. Test the full flow:
1. Register as a recruiter → create a job → publish it
2. Register as a candidate → browse jobs → apply with a resume PDF
3. Log in as recruiter → open Pipeline → see the application → move stage → generate AI interview questions
4. Check the JD bias checker in the job form

---

## Concept 1 — Why we need three separate services

A common beginner question: why not run everything on one server?

**The problem:** Vercel and Railway are specialized. Vercel runs static files + serverless functions at the edge (very fast for frontend). Railway runs long-lived Node.js processes (needed for Express). MongoDB Atlas manages database replication and backups. Each does one thing extremely well.

**The flow:**
```
Browser (Vercel CDN)
    |
    | VITE_API_URL = https://your-api.railway.app/api
    |
Express (Railway)
    |
    | MONGO_URI = mongodb+srv://...atlas...
    |
MongoDB (Atlas)
```

Each layer talks to the next via a URL stored in an environment variable — never hardcoded.

---

## Concept 2 — Environment variables in production

In development, `.env` is a file on your laptop. In production, you can't put a file on Railway's server — you set env vars through the dashboard UI.

**Critical rule: VITE_ prefix for frontend env vars**
Vite only exposes variables prefixed with `VITE_` to browser code. During build, Vite replaces `import.meta.env.VITE_API_URL` with the actual string. Variables without the prefix are never sent to the browser (good for secrets).

```
VITE_API_URL   → exposed to browser JavaScript (fine, it's just a URL)
JWT_SECRET     → never sent to browser (stays on the server)
OPENAI_API_KEY → never sent to browser (stays on the server)
```

This is why `VITE_API_URL` is in the frontend `.env` and `JWT_SECRET` is in the backend `.env`. Two separate files, two separate contexts.

---

## Concept 3 — SPA routing and the vercel.json fix

When you deploy a React SPA to a static host, navigating directly to `https://your-app.vercel.app/candidate/jobs` causes a 404. Why?

The server tries to find a file at `candidate/jobs/index.html`. That file doesn't exist — only `index.html` (at root) exists. React Router handles routing in the browser, not on the server.

Fix: tell Vercel to serve `index.html` for every path.

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

This says: "whatever URL the user requests, respond with `index.html`." React Router then reads the URL, matches the route, and renders the right component. The server never needs to know about `/candidate/jobs`.

---

## Concept 4 — CORS in production

CORS (Cross-Origin Resource Sharing) is a browser security rule: JavaScript on `https://smarthire.vercel.app` is blocked from calling `https://smarthire.railway.app` unless the server explicitly says "this origin is allowed."

Our production CORS setup:
```js
const allowedOrigins = [
  'http://localhost:5173',   // local frontend dev
  'http://localhost:4173',   // local frontend preview (npm run preview)
  process.env.CLIENT_URL,   // Vercel production URL
]

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true)  // Postman / curl
    if (allowedOrigins.includes(origin)) return callback(null, true)
    callback(new Error(`CORS: origin ${origin} not allowed`))
  },
  credentials: true,
}))
```

`CLIENT_URL` is set in Railway's env var dashboard after you know the Vercel URL. That's why it's added last — it's a chicken-and-egg situation (you need the backend URL to configure the frontend, and the frontend URL to configure the backend). Deploy backend first, then frontend, then go back and add `CLIENT_URL`.

---

## Concept 5 — The uploads limitation on Railway

Railway (and Render, Fly, etc.) uses **ephemeral file systems**. When a new deployment happens, the entire file system is reset. Any resumes uploaded to `backend/uploads/` between deployments are permanently lost.

**Portfolio / learning: acceptable.** The project works, you can demo it.

**Production fix: Cloudinary or AWS S3.**
Instead of saving to disk via Multer, you'd stream the file to cloud storage and save the URL:

```js
// Instead of: diskStorage saving to uploads/
// Use: cloudinary.uploader.upload_stream(...)
// Then save the returned secure_url to the database
```

This is Phase 9 material — mentioned in the notebook so you know it exists, but beyond scope for this project.

---

## Concept 6 — What `engines` in package.json does

```json
"engines": {
  "node": ">=18"
}
```

This tells Railway (and npm) the minimum Node.js version required. Without it, the host might use Node 16, which lacks native fetch and has subtle differences that can cause runtime errors. With it, Railway picks the latest compatible version (currently Node 22).

---

## What a senior dev would do next

- **Custom domain** — Add your own domain (e.g. smarthire.yourname.dev) in Vercel's dashboard. Free with any domain registrar.
- **Upload to Cloudinary** — Replace Multer disk storage with Cloudinary upload stream so resumes survive redeployments.
- **GitHub Actions CI** — On every push to main, run `npm run build` and tests automatically. Deploy only if CI passes.
- **Rate limiting** — Add `express-rate-limit` middleware on AI routes to prevent expensive OpenAI calls from being triggered in a loop.
- **Monitoring** — Add Railway's built-in metrics alerts for memory and CPU spikes. Add Sentry for frontend error tracking.
- **Database indexes** — Check slow query logs in Atlas. Add indexes on `Application.job` and `Application.candidate` if not already compound-indexed.
