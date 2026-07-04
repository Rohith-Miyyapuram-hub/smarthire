# Phase 5 -- Candidate Portal: Everything Explained
### From scratch to deep -- read this after Phase 5 is done
*Your AI mentor | SmartHire build series*

---

## What we built in Phase 5

- A top-navigation candidate layout (different from the sidebar recruiter layout)
- Job Board: searchable, filterable grid of open positions
- Job Detail: full JD page driven by URL params with a sticky apply sidebar
- Apply Form: 3-step multi-step form with file drag-and-drop and a success screen
- My Applications: status tracker with a progress bar and expandable activity timeline
- A reusable `.input` CSS class shared across all form fields

---

## Concept 1 -- Two Different Layouts for Two User Types

SmartHire has two portals:
- Recruiter portal: sidebar navigation (complex, power-user tool)
- Candidate portal: top navigation bar (simpler, content-focused)

Both use the same nested routing pattern from Phase 2 -- a parent route renders
a layout with `<Outlet />` and all child routes share that layout automatically.

The structural difference:

```
RecruiterLayout:                CandidateLayout:
+--------+------------------+   +---------------------------+
| aside  | header           |   | header (sticky topnav)    |
| sidebar| +----------------+   +---------------------------+
|        | | main (Outlet)  |   | main (max-w-6xl, centered)|
|        | |                |   |   <Outlet />              |
+--------+----------------  +   +---------------------------+
```

CandidateLayout uses `sticky top-0 z-30` on the header so it stays at the top
of the screen as the candidate scrolls through job listings and descriptions.
RecruiterLayout doesn't need this because the sidebar stays fixed and the main
area has its own `overflow-y-auto`.

---

## Concept 2 -- `useMemo` for Search Filtering

In JobBoard.jsx we used `useMemo` to filter the job list:

```jsx
const filtered = useMemo(() => {
  const q = search.toLowerCase()
  return MOCK_JOBS.filter((j) => {
    const matchesSearch =
      !q ||
      j.title.toLowerCase().includes(q) ||
      j.department.toLowerCase().includes(q) ||
      j.tags.some((t) => t.toLowerCase().includes(q))
    const matchesDept = dept === 'All' || j.department === dept
    const matchesType = type === 'All' || j.type === type
    return matchesSearch && matchesDept && matchesType
  })
}, [search, dept, type])
```

### What useMemo does

Every time a component re-renders, all the code inside it runs again.
Without useMemo, `MOCK_JOBS.filter(...)` runs on every keystroke, every
state change -- even if search/dept/type haven't changed.

`useMemo` caches the result and only recomputes it when one of the
values in the dependency array changes (`[search, dept, type]`).

### When to use useMemo vs when not to

Use it when:
- The computation is expensive (large arrays, nested loops, regex)
- The result is used directly in the render

Don't use it for:
- Simple calculations (adding two numbers)
- Memoizing JSX directly (use React.memo for that)
- Values that change on every render anyway

Rule of thumb: if you can feel a lag when typing in the search box, add useMemo.
If you can't feel a difference, it's premature optimization.

---

## Concept 3 -- useParams for Detail Pages

Job Detail and Apply Form both need to know WHICH job they're showing.
The job ID comes from the URL, not from props.

```jsx
// App.jsx -- :id is a URL parameter
<Route path="jobs/:id"       element={<JobDetail />} />
<Route path="jobs/:id/apply" element={<ApplyForm />} />

// Inside JobDetail.jsx and ApplyForm.jsx
import { useParams } from 'react-router-dom'
const { id } = useParams()

// id = 'job-1', 'job-2', etc. (whatever is in the URL)
const job = MOCK_JOBS[id]
```

### Why URL params instead of props?

Because the URL is the source of truth for navigation. If a user bookmarks
`/candidate/jobs/job-1`, they should land directly on the Senior React Developer
page. If the job ID were stored in component state or props, a direct URL
visit would break the page.

URL params also let you share links. Right click -> "Copy link" from a job card,
paste it to a friend, they see the same job. That's not possible with state-based navigation.

### Not-found handling

```jsx
const job = MOCK_JOBS[id]

if (!job) {
  return (
    <div>
      <p>Job not found</p>
      <Link to="/candidate/jobs">Back to job board</Link>
    </div>
  )
}
```

Always handle the case where the param doesn't match any data. Users copy-paste
URLs, edit them, or follow stale links. A crash is worse than a not-found message.

---

## Concept 4 -- Multi-Step Forms

A multi-step form is just a single component that renders different content
based on a `step` number in state. No routing, no multiple pages.

```jsx
const [step, setStep] = useState(1)

// One big form state object for ALL steps
const [form, setForm] = useState({
  firstName: '', lastName: '', email: '',   // step 1
  resumeFile: null, resumeName: '',          // step 2
  coverLetter: '', source: '',               // step 3
})

// Generic updater -- works for any field
function onChange(key, value) {
  setForm((prev) => ({ ...prev, [key]: value }))
}

// Render the right step
{step === 1 && <StepPersonal form={form} onChange={onChange} />}
{step === 2 && <StepResume   form={form} onChange={onChange} />}
{step === 3 && <StepCoverLetter form={form} onChange={onChange} />}
```

### Why one form state object for all steps?

If you split state across steps (useState per step), you lose data when unmounting.
React destroys local state when a component unmounts. If the user goes back from
step 3 to step 1, all of step 3's state is gone.

With one object in the parent (ApplyForm), every step receives the full form
and can update any key. Going back and forth never loses data.

### Step validation: canAdvance

```jsx
function canAdvance() {
  if (step === 1) return form.firstName && form.lastName && form.email && form.experience
  if (step === 2) return Boolean(form.resumeName)
  return true  // step 3 is optional
}

<button
  onClick={() => setStep(step + 1)}
  disabled={!canAdvance()}
>
  Continue
</button>
```

The Continue button is disabled until required fields are filled. This prevents
the user from submitting incomplete data and gives immediate feedback.

---

## Concept 5 -- File Input and Drag-to-Upload

The resume upload area supports two methods: click-to-browse and drag-and-drop.

### Method 1: Click to browse

```jsx
const fileRef = useRef(null)

<input
  ref={fileRef}
  type="file"
  accept=".pdf,.doc,.docx"
  className="hidden"           // invisible, triggered programmatically
  onChange={handleFile}
/>

<div onClick={() => fileRef.current?.click()}>
  Drop your resume here
</div>
```

The `<input type="file">` is hidden. Clicking the styled drop-zone triggers
`fileRef.current.click()` programmatically -- the browser opens the file picker.
This lets you style the upload area however you want.

### Method 2: Drag and drop

```jsx
function handleDrop(e) {
  e.preventDefault()                    // prevent browser from opening the file
  const file = e.dataTransfer.files[0]  // get the dropped file
  onChange('resumeFile', file)
  onChange('resumeName', file.name)
}

<div
  onDragOver={(e) => e.preventDefault()}   // required to allow drops
  onDrop={handleDrop}
>
```

`e.dataTransfer.files` is the FileList from a native drag-and-drop operation.
`e.dataTransfer` is separate from `e.target.files` (which comes from the input).
Both give you the same File object.

### The File object

```js
// What you get from either method
file.name     // "Rohit_Resume_2026.pdf"
file.size     // 245678 (bytes)
file.type     // "application/pdf"
file.lastModified  // timestamp

// To upload in Phase 6: FormData
const formData = new FormData()
formData.append('resume', file)
// POST to /upload with Content-Type: multipart/form-data
```

In Phase 5 we store the File object in state and display the name. In Phase 6,
we will actually upload it to S3 via the backend.

---

## Concept 6 -- The Success Screen Pattern

After submit, we don't navigate to a new page. We render a completely different
UI inside the same component based on a `submitted` boolean.

```jsx
const [submitted, setSubmitted] = useState(false)

async function handleSubmit() {
  setSubmitting(true)
  await new Promise(r => setTimeout(r, 1200))  // fake API delay
  setSubmitting(false)
  setSubmitted(true)
}

if (submitted) {
  return <SuccessScreen />  // completely different render
}

return <FormUI />
```

This is called "conditional rendering" at the component level. It's simpler than
navigating to a /success route because:
1. The success screen has context (which job you applied to)
2. No need to pass data through URL params or router state
3. The back button in the browser won't go to a weird state

---

## Concept 7 -- Application Status UI (Progress Bar + Timeline)

### Progress bar

The progress bar shows which stage the application is in:

```jsx
const STAGE_ORDER = ['Applied', 'Screening', 'Interview', 'Offer', 'Rejected']

{STAGE_ORDER.filter(s => s !== 'Rejected').map((s) => {
  const stageIdx = STAGE_ORDER.indexOf(app.stage)
  const thisIdx  = STAGE_ORDER.indexOf(s)
  const filled   = !isRejected && thisIdx <= stageIdx

  return (
    <div key={s} className="flex-1 h-1.5 rounded-full"
      style={{ background: filled ? '#4f46e5' : '#e5e7eb' }}
    />
  )
})}
```

The logic: a stage segment is filled (indigo) if its index in STAGE_ORDER is
less than or equal to the current stage's index. So if you're at "Interview"
(index 2), Applied (0) and Screening (1) are also filled.

### Collapsible timeline

```jsx
const [expanded, setExpanded] = useState(false)

<button onClick={() => setExpanded(!expanded)}>
  Activity timeline
  <svg style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0)' }} />
</button>

{expanded && <Timeline events={app.timeline} />}
```

The chevron rotates 180 degrees when expanded using `style={{ transform }}`.
The timeline content only mounts when expanded -- saves rendering cost when
multiple cards are on screen.

---

## Concept 8 -- CSS `.input` Class (global reusable styles)

Instead of repeating Tailwind classes on every form input:

```jsx
// Without shared class -- repeat this 10+ times
<input className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" />
```

We defined a `.input` class in `index.css`:

```css
.input {
  width: 100%;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.input:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
}
```

Now every form input just needs `className="input"`. One place to update styles.

This is the "single source of truth" principle applied to CSS. Tailwind utility
classes are great for layout and spacing. A shared class is better when the same
combination of properties repeats across many elements.

---

## Concept 9 -- The breadcrumb pattern

Both JobDetail and ApplyForm show a breadcrumb:

```
Browse Jobs / Senior React Developer / Apply
```

Each segment is a Link except the last (current page):

```jsx
<nav className="flex items-center gap-1.5 text-xs text-gray-400">
  <Link to="/candidate/jobs">Browse Jobs</Link>
  <span>/</span>
  <Link to={`/candidate/jobs/${id}`}>{jobTitle}</Link>
  <span>/</span>
  <span className="text-gray-600">Apply</span>  {/* no link, current page */}
</nav>
```

Why breadcrumbs matter:
1. Users always know where they are in the app
2. One click to go up one level
3. Google indexes the hierarchy for SEO (when using server-side rendering)

---

## File structure after Phase 5

```
src/
  components/
    layout/
      ProtectedRoute.jsx
      RecruiterLayout.jsx
      CandidateLayout.jsx     <-- NEW: top navbar + Outlet
    ui/
      icons.jsx
  pages/
    auth/
      Login.jsx
      Register.jsx
    recruiter/
      Dashboard.jsx
      Jobs.jsx
      JobForm.jsx
      Pipeline.jsx
    candidate/                <-- NEW folder
      JobBoard.jsx            <-- NEW: job grid with search/filter
      JobDetail.jsx           <-- NEW: full JD + apply CTA
      ApplyForm.jsx           <-- NEW: 3-step form with file upload
      MyApplications.jsx      <-- NEW: status tracker with timeline
  store/
    authStore.js
  services/
    api.js
  App.jsx                     <-- UPDATED: candidate portal routes
  index.css                   <-- UPDATED: .input shared class
```

---

## How to test Phase 5 manually

Set candidate auth in localStorage (different role than recruiter):

```json
{"state":{"user":{"name":"Priya Patel","email":"priya@test.com","role":"candidate"},"token":"fake-token","isAuthenticated":true},"version":0}
```

Then visit:
- http://localhost:5173/candidate/jobs -- see the job board, try searching "React"
- http://localhost:5173/candidate/jobs/job-1 -- see the full JD for React Developer
- http://localhost:5173/candidate/jobs/job-1/apply -- go through all 3 steps
- http://localhost:5173/candidate/applications -- see application status tracker

---

## Common mistakes at this phase

### Multi-step form loses data when going back
-> Your form state is split across step components instead of living in the parent.
Move all form state to ApplyForm and pass it down as props.

### File drag-and-drop doesn't work
-> You forgot `e.preventDefault()` in `onDragOver`. Without it, the browser
cancels the drop operation and `onDrop` never fires.

### Hidden file input doesn't open on click
-> Your ref is not attached: `<input ref={fileRef} />` -- the `ref` attribute must
be on the actual input element, not a wrapper div.

### useParams returns undefined
-> The Route in App.jsx doesn't have `:id` in the path, or you're reading a
different param name. Check that `path="jobs/:id"` matches `const { id } = useParams()`.

### Sticky topbar doesn't stay fixed when scrolling
-> You put `sticky top-0` on the wrong element, or a parent has `overflow: hidden`
which creates a new scroll context that clips position:sticky. Check parent elements.

---

## Interview questions this phase prepares you for

**Q: How do you implement a multi-step form in React?**
A: One `step` state variable and one shared `form` state object in the parent component.
Each step is a separate component that receives the form state and an onChange callback.
The parent renders the correct step component based on the current step number.
All data lives in the parent so going back never loses input.

**Q: How do you handle file uploads in a React form?**
A: A hidden `<input type="file">` with a `ref`. Styled UI elements call
`ref.current.click()` to open the file picker. For drag-and-drop, add `onDragOver`
(with `e.preventDefault()`) and `onDrop` to a container element. Both methods give
you a `File` object. To upload, wrap it in `FormData` and POST with
`Content-Type: multipart/form-data`.

**Q: How do you make a URL-driven detail page?**
A: `<Route path="items/:id" element={<ItemDetail />} />` in the router.
Inside ItemDetail: `const { id } = useParams()`. Use the id to look up data
from state, a store, or an API. Always handle the not-found case.

**Q: What is useMemo and when should you use it?**
A: `useMemo` caches the result of an expensive calculation and only recomputes it
when its dependencies change. Use it when a computation (like filtering a large
array) would otherwise run on every render. Don't use it for simple calculations
-- the overhead of memoization can exceed the savings.

**Q: How do you design a status/progress UI?**
A: Map your ordered stages to an array and use indexOf to compare each stage's
position against the current stage. Stages with a lower index are "complete" --
style them filled. The current stage is highlighted. Rejected is a special case
handled separately. Add a timeline for history: an array of events each with
stage, date, and a note.

---

*Phase 5 complete. Next: Phase 6 -- Backend with Node.js, Express, and MongoDB.*
*Notebook: 06_phase6-explained.md created after Phase 6.*
