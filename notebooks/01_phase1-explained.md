# Phase 1 — Setup & Auth: Everything Explained
### From scratch to deep — read this after Phase 1 is done
*Your AI mentor | SmartHire build series*

---

## What we built in Phase 1

A working React frontend with:
- A professional Login page with form validation and show/hide password
- A Register page with a role toggle (recruiter / candidate)
- JWT-aware routing that protects pages based on who's logged in
- A global auth state that survives page refresh
- A pre-configured HTTP client that auto-attaches your token to every request

None of these pages talk to a real backend yet — that's Phase 6.
But the architecture is production-grade from day one.

---

## Tool 1 — Vite

### What is Vite?
Vite is the tool that runs your development server and builds your app for production.
Before Vite existed, developers used a tool called Webpack, which was slow.
Vite is 10-100x faster because it uses native ES modules in the browser during development —
it doesn't bundle your entire app every time you save a file.

### The command that created the project
```bash
npm create vite@latest frontend -- --template react
```
This downloads a Vite project template with React pre-configured.
`--template react` means: use JSX (JavaScript + HTML mixed syntax).

### What `npm run dev` does
Starts a local web server at `http://localhost:5173`.
Every time you save a file, Vite instantly updates the browser — this is called **HMR** (Hot Module Replacement).

### What `npm run build` does
Compiles your React code into plain HTML, CSS, and JavaScript files
that any web server can serve. Output goes to the `dist/` folder.
The 236KB JS file we saw is your entire app, minified.

### vite.config.js — what it does
```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
})
```
- `react()` — teaches Vite to understand JSX syntax
- `tailwindcss()` — teaches Vite to process Tailwind classes
Think of plugins as "extensions" for Vite's compiler.

---

## Tool 2 — Tailwind CSS

### What is Tailwind?
Tailwind is a CSS framework, but unlike Bootstrap (which gives you pre-built components),
Tailwind gives you low-level utility classes you compose yourself.

### Old way vs Tailwind way
```css
/* Old way — write CSS separately */
.login-button {
  background-color: #4f46e5;
  color: white;
  padding: 10px 16px;
  border-radius: 12px;
}
```
```jsx
{/* Tailwind way — classes directly in JSX */}
<button className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl">
  Sign in
</button>
```
No separate CSS file. The styles live right where the component lives.

### How Tailwind classes work (the naming system)
```
bg-indigo-600   → background-color: indigo shade 600
text-white      → color: white
px-4            → padding-left + padding-right: 1rem (16px)
py-2.5          → padding-top + padding-bottom: 0.625rem (10px)
rounded-xl      → border-radius: 0.75rem (12px)
min-h-screen    → min-height: 100vh
flex            → display: flex
items-center    → align-items: center
justify-center  → justify-content: center
gap-4           → gap: 1rem (space between flex/grid children)
text-sm         → font-size: 0.875rem (14px)
font-medium     → font-weight: 500
shadow-sm       → a subtle box-shadow
border          → border: 1px solid (default color)
```

### Tailwind v4 (what we installed)
We got Tailwind v4 automatically. In v4, there's no `tailwind.config.js` file.
Instead, you just add `@import "tailwindcss"` at the top of your CSS and it works.
The Vite plugin handles everything else.

---

## Tool 3 — React Router

### What is routing?
In a traditional website, every URL loads a different HTML file from the server.
In a React app (called a **Single Page Application / SPA**), there's only ONE HTML file.
React Router intercepts URL changes and shows/hides components instead of loading new pages.

### How we set it up in App.jsx
```jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

<BrowserRouter>           // ← listens to URL changes
  <Routes>               // ← container for all route definitions
    <Route path="/login" element={<Login />} />     // URL /login → show Login component
    <Route path="/register" element={<Register />} /> // URL /register → show Register
    <Route path="/" element={<Navigate to="/login" replace />} /> // / → redirect to /login
  </Routes>
</BrowserRouter>
```

### The `replace` prop on Navigate
```jsx
<Navigate to="/login" replace />
```
Without `replace`: navigating to `/login` adds an entry to browser history.
Pressing Back goes to `/` which redirects to `/login` again → infinite loop.
With `replace`: it replaces the current history entry, so Back works correctly.

### The `/*` in path="/recruiter/*"
```jsx
<Route path="/recruiter/*" element={...} />
```
The `*` means "match any URL that starts with /recruiter/".
So `/recruiter/dashboard`, `/recruiter/jobs`, `/recruiter/settings` all match.
In Phase 2, we'll add nested routes inside the recruiter section.

---

## Tool 4 — Zustand (auth store)

### What is state management?
"State" is any data in your app that can change.
The logged-in user is global state — many components across many pages need to know who's logged in.
If you stored it inside a single component, other components couldn't access it.
Zustand is a library that creates a global store all components can read from.

### Our authStore.js, line by line
```js
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useAuthStore = create(
  persist(
    (set, get) => ({
```
- `create()` — creates a new store
- `persist()` — middleware that automatically saves the store to localStorage
  so the user stays logged in after a page refresh
- `set` — function to update the store
- `get` — function to read the current store values from inside the store

```js
      user: null,
      token: null,
      isAuthenticated: false,
```
These are the initial values — no one is logged in when the app first loads.

```js
      login: (user, token) => set({
        user,
        token,
        isAuthenticated: true,
      }),
```
`login()` is a function we call after a successful API response.
It updates all three fields at once. Components subscribed to this store
automatically re-render with the new values.

```js
      logout: () => set({
        user: null,
        token: null,
        isAuthenticated: false,
      }),
```
`logout()` clears everything. Combined with `persist`, this also wipes localStorage.

```js
      getRole: () => get().user?.role || null,
```
`?.` is optional chaining — if `user` is null, it returns null instead of crashing.

```js
    { name: 'smarthire-auth' }
```
This is the localStorage key. Open DevTools → Application → Local Storage to see it.

### How components use the store
```jsx
// Read a single value — component re-renders only when `isAuthenticated` changes
const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

// Read a function — functions are stable, won't cause re-renders
const login = useAuthStore((state) => state.login)
```
Selecting only what you need is a performance best practice.
Don't do `const store = useAuthStore()` — that would re-render on any change.

---

## Tool 5 — Axios + Interceptors

### What is Axios?
Axios is a library for making HTTP requests (talking to your backend API).
The browser has a built-in `fetch()` function, but Axios is cleaner to use and
has better error handling.

### Our api.js, line by line
```js
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
```
`axios.create()` creates a custom axios instance with default settings.
`baseURL` means you never have to write the full URL in every request:
```js
// Without baseURL:
api.get('http://localhost:5000/api/jobs')
// With baseURL:
api.get('/jobs')  // ← much cleaner
```
`import.meta.env.VITE_API_URL` reads from a `.env` file — in production
you'd set this to your real server URL. We'll add that `.env` file in Phase 6.

### Request interceptor — attaching the JWT
```js
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
```
An interceptor is a function that runs on EVERY request before it's sent.
`useAuthStore.getState()` — note we use `.getState()` not the hook here,
because this is outside a React component (plain JS, not JSX).
`Bearer` is a naming convention. When the backend receives this header, it
knows to look at the token value after the word "Bearer".

### Response interceptor — handling expired tokens
```js
api.interceptors.response.use(
  (response) => response,    // success: just pass it through
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)
```
HTTP 401 = Unauthorized = your token expired or is invalid.
When this happens: log out automatically + redirect to login.
`return Promise.reject(error)` — re-throws the error so the component
that made the request can also catch it and show an error message.

---

## Tool 6 — TanStack Query (React Query)

### What problem does it solve?
Without TanStack Query, you'd fetch data like this in every component:
```jsx
const [jobs, setJobs] = useState([])
const [loading, setLoading] = useState(true)
const [error, setError] = useState(null)

useEffect(() => {
  setLoading(true)
  api.get('/jobs')
    .then(res => setJobs(res.data))
    .catch(err => setError(err))
    .finally(() => setLoading(false))
}, [])
```
That's 8 lines of boilerplate for every single data fetch.
With TanStack Query:
```jsx
const { data: jobs, isLoading, error } = useQuery({
  queryKey: ['jobs'],
  queryFn: () => api.get('/jobs').then(r => r.data)
})
```
3 lines. And you get: automatic caching, background refetching,
loading states, error states, and deduplication for free.

### QueryClient setup in main.jsx
```js
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,             // if a request fails, try once more before giving up
      staleTime: 1000 * 60, // data is "fresh" for 1 minute — won't refetch unnecessarily
    },
  },
})
```
This single client instance holds the entire cache for the app.
Wrapping `<App />` in `<QueryClientProvider client={queryClient}>` makes it
available to every component.

### Why we use useMutation for Login/Register
`useQuery` is for **reading** data (GET requests).
`useMutation` is for **writing** data (POST, PUT, DELETE).
```js
const { mutate, isPending, error } = useMutation({
  mutationFn: (data) => api.post('/auth/login', data),
  onSuccess: (res) => {
    // runs after a successful response
    loginUser(res.data.user, res.data.token)
    navigate('/recruiter')
  },
})

// To trigger it:
mutate({ email: 'test@test.com', password: 'password' })
```
`isPending` is `true` while the request is in-flight — we use this to
show the loading spinner on the button.

---

## The ProtectedRoute — how role-based auth works

```jsx
function ProtectedRoute({ children, allowedRole }) {
  const { isAuthenticated, user } = useAuthStore()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />    // not logged in → go to login
  }

  if (allowedRole && user?.role !== allowedRole) {
    return <Navigate to={`/${user.role}`} replace />  // wrong role → go to correct portal
  }

  return children   // all good → render the page
}
```

The three possible outcomes:
1. Not logged in → `/login`
2. Logged in as candidate, trying to visit `/recruiter/*` → redirected to `/candidate`
3. Logged in, correct role → see the page

This runs instantly on every route change — no API call needed, because
the user object is already in memory (Zustand store).

---

## Client-side form validation

In Login.jsx and Register.jsx we validate before hitting the API:
```js
const validate = () => {
  const e = {}
  if (!form.email) e.email = 'Email is required'
  else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email'
  setErrors(e)
  return Object.keys(e).length === 0  // true = valid, false = has errors
}
```
`/\S+@\S+\.\S+/.test(email)` is a **regex** (regular expression):
- `\S+` — one or more non-whitespace characters
- `@` — literal @ symbol
- `\S+` — more non-whitespace
- `\.` — literal dot
- `\S+` — more non-whitespace
This is a basic check. The backend will do a deeper validation too.

Why validate on both? Client-side = fast, instant feedback.
Server-side = the real safety net (users can bypass client validation).

---

## The file structure we created

```
src/
├── components/
│   ├── ui/
│   │   ├── Button.jsx     ← reusable, used in every form
│   │   ├── Input.jsx      ← reusable labelled input with error state
│   │   └── Spinner.jsx    ← loading indicator
│   └── layout/
│       └── ProtectedRoute.jsx  ← auth guard for all protected pages
├── pages/
│   └── auth/
│       ├── Login.jsx      ← full login form with show/hide password
│       └── Register.jsx   ← register with recruiter/candidate toggle
├── store/
│   └── authStore.js       ← global auth state (Zustand + persist)
├── services/
│   └── api.js             ← axios instance with JWT interceptors
├── App.jsx                ← router config
├── main.jsx               ← app entry point (QueryClient lives here)
└── index.css              ← Tailwind import
```

Why organize it this way?
- `components/ui/` — building blocks used everywhere. No business logic.
- `components/layout/` — structural wrappers like ProtectedRoute, Sidebar (coming Phase 2)
- `pages/` — full screens. Each maps to a URL.
- `store/` — global state. One file per domain (auth, jobs, etc.)
- `services/` — all API communication. Components never call axios directly.

This separation means:
- You can change the API URL in one place (`api.js`)
- You can update the Button design in one place (`Button.jsx`)
- You can read a page file and understand a full feature without jumping around

---

## Common mistakes beginners make here

### 1. Importing useAuthStore wrong
```js
// WRONG — calling it outside a component without .getState()
const token = useAuthStore().token

// CORRECT inside a React component
const token = useAuthStore((state) => state.token)

// CORRECT outside a React component (e.g. api.js)
const token = useAuthStore.getState().token
```

### 2. Forgetting to wrap the app in QueryClientProvider
If you see "No QueryClient set, use QueryClientProvider to set one" — you forgot
to wrap `<App />` with `<QueryClientProvider>` in main.jsx.

### 3. Using useEffect for mutations (old pattern)
```js
// Old, bad pattern
useEffect(() => {
  if (formSubmitted) {
    api.post('/auth/login', form).then(...)
  }
}, [formSubmitted])

// Correct pattern with TanStack Query
const { mutate } = useMutation({ mutationFn: (data) => api.post('/auth/login', data) })
// then just call mutate(form) in your event handler
```

### 4. Storing the token in a plain variable
```js
// WRONG — lost on page refresh
let token = response.data.token

// CORRECT — persisted to localStorage via Zustand
loginUser(res.data.user, res.data.token)
```

---

## How to test Phase 1 manually

1. Open terminal in `SmartHire/frontend`
2. Run: `npm run dev`
3. Open `http://localhost:5173` in browser
4. You should be redirected to `/login` automatically (ProtectedRoute + Navigate)
5. The Login page should render with the SmartHire logo, form, and show/hide password
6. The Register page at `/register` should show the role toggle
7. Try submitting an empty form — validation errors should appear instantly
8. Submitting a valid form will fail (no backend yet) — you'll see the red error banner

---

## Interview questions this phase prepares you for

**Q: What is a Single Page Application?**
A: A web app where the entire UI is loaded once. React Router intercepts URL changes
and swaps components in/out without a full page reload. Faster UX, one HTML file.

**Q: How do you handle authentication in React?**
A: JWT from the server stored in Zustand (persisted to localStorage). A Axios
request interceptor attaches it to every request. A response interceptor auto-logs
out on 401. ProtectedRoute checks auth state before rendering any protected page.

**Q: What is the difference between useQuery and useMutation?**
A: useQuery is for reading data (GET) — it runs automatically and caches the result.
useMutation is for writes (POST/PUT/DELETE) — it runs when you call mutate() and
gives you isPending/error/onSuccess callbacks.

**Q: Why Zustand over Redux?**
A: Zustand is 8x smaller, needs no boilerplate (no actions/reducers/dispatchers),
and the API is just a plain function. For a project this size, the extra structure
of Redux adds complexity without benefit.

---

*Phase 1 complete. Next: Phase 2 — Recruiter Layout & Dashboard.*
*Notebook: `02_phase2-explained.md` created after Phase 2.*
