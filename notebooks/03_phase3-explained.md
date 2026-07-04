# Phase 3 -- Job Management: Everything Explained
### From scratch to deep
*Your AI mentor | SmartHire build series*

---

## What we built in Phase 3

- Jobs.jsx: a searchable, filterable job listings table with inline row actions
- JobForm.jsx: a create/edit form with real-time AI bias detection in the sidebar
- New routes: /recruiter/jobs, /recruiter/jobs/new, /recruiter/jobs/:id/edit

---

## Concept 1 -- Controlled Forms

A "controlled form" means React is in charge of every character in every input.
The input's value comes from state, and every keystroke updates that state.

```jsx
// Uncontrolled (the DOM holds the value -- hard to validate or reset)
<input type="text" />

// Controlled (React holds the value -- easy to validate, reset, prefill)
const [title, setTitle] = useState('')
<input value={title} onChange={e => setTitle(e.target.value)} />
```

In JobForm.jsx we use a single form object for all fields:
```jsx
const [form, setForm] = useState({
  title: '', department: '', description: '', requirements: [],
})

// Helper to update one field without touching the others
const set = (field) => (e) => setForm(p => ({ ...p, [field]: e.target.value }))

// Usage
<input value={form.title} onChange={set('title')} />
<input value={form.department} onChange={set('department')} />
```

The spread `{ ...p, [field]: value }` creates a new object with all previous
fields intact, only changing the one named by `field`. This is called
"immutable update" -- you never mutate the state object directly.

---

## Concept 2 -- useParams (reading URL variables)

In App.jsx we defined:
```jsx
<Route path="jobs/:id/edit" element={<JobForm />} />
```

The `:id` is a URL parameter -- it captures whatever is in that position.
Inside JobForm.jsx, we read it with `useParams`:

```jsx
import { useParams } from 'react-router-dom'

function JobForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)

  // id is undefined at /recruiter/jobs/new
  // id is "1" at /recruiter/jobs/1/edit
}
```

This lets ONE component handle both create and edit modes.
The difference is just whether `id` exists.

We use `isEdit` to:
- Change the page title ("Post a job" vs "Edit job")
- Change the submit button label ("Publish job" vs "Save changes")
- Load existing data in a useEffect

---

## Concept 3 -- Debouncing (the bias checker)

Debouncing means: "wait until the user stops typing before doing something expensive."

Without debounce -- fires on EVERY keystroke:
```
User types "r" -> bias check runs
User types "ro" -> bias check runs
User types "roc" -> bias check runs
User types "rock" -> bias check runs
User types "rocks" -> bias check runs
User types "rockstar" -> bias check runs
```
That's 8 API calls for one word. Terrible for performance.

With debounce -- only fires after the user pauses:
```
User types "rockstar"
... 600ms of silence ...
bias check runs once
```

How we implemented it with useRef:
```jsx
const biasTimer = useRef(null)   // useRef stores a value without causing re-renders

const handleDescChange = (e) => {
  setForm(p => ({ ...p, description: e.target.value }))

  clearTimeout(biasTimer.current)   // cancel the previous scheduled call

  biasTimer.current = setTimeout(() => {
    setBiasFlags(checkBias(e.target.value))  // run after 600ms of silence
  }, 600)
}
```

Why useRef instead of useState for the timer?
- useState causes a re-render when updated -- bad for a timer ID
- useRef stores a mutable value that NEVER causes re-renders
- It persists between renders -- the timer ID survives re-renders
- Perfect for: timers, DOM element references, previous values

---

## Concept 4 -- Regex Pattern Matching (the bias engine)

The bias checker uses JavaScript regular expressions to find biased words:

```js
const BIAS_PATTERNS = [
  {
    pattern: /\b(ninja|rockstar|guru)\b/gi,
    type: 'Exclusionary language',
    ...
  },
]
```

Breaking down the regex `/\b(ninja|rockstar|guru)\b/gi`:
- `/` -- start of regex
- `\b` -- word boundary (so "ninjas" doesn't match "ninja")
- `(ninja|rockstar|guru)` -- match any of these words
- `\b` -- word boundary at the end
- `/` -- end of regex
- `g` -- "global" flag: find ALL matches, not just the first
- `i` -- "case insensitive": matches "Ninja", "NINJA", "ninja"

How we use it:
```js
const matches = text.match(pattern)  // returns array of all matches, or null
if (matches) {
  flags.push({ type, found: [...new Set(matches)] })
  //                        ^^^^^^^^^^^^^^^^^^^
  //                        Set removes duplicates
}
```

`new Set(array)` is a JavaScript data structure that only keeps unique values.
If someone writes "ninja" twice, we show the flag once.
`[...new Set(matches)]` spreads the Set back into an array.

---

## Concept 5 -- Tag Input (requirements field)

The requirements field is a custom tag input built from scratch.
No library -- just React state and keyboard events.

```jsx
// State: array of requirement strings
const [requirements, setRequirements] = useState([])
const [reqInput, setReqInput] = useState('')

// Add on Enter or comma
const handleKeyDown = (e) => {
  if ((e.key === 'Enter' || e.key === ',') && reqInput.trim()) {
    e.preventDefault()
    setRequirements(prev => [...prev, reqInput.trim()])
    setReqInput('')
  }
  // Delete last tag on Backspace when input is empty
  if (e.key === 'Backspace' && !reqInput && requirements.length > 0) {
    setRequirements(prev => prev.slice(0, -1))
  }
}

// Remove by index
const removeReq = (idx) => {
  setRequirements(prev => prev.filter((_, i) => i !== idx))
}
```

The UI wraps both tags and the input in a single styled container:
```jsx
<div className="flex flex-wrap gap-2 p-3 border rounded-xl focus-within:ring-2">
  {requirements.map((req, i) => (
    <span key={i} className="bg-indigo-50 text-indigo-700 px-2.5 py-1.5 rounded-lg text-xs">
      {req}
      <button onClick={() => removeReq(i)}>x</button>
    </span>
  ))}
  <input value={reqInput} onChange={...} onKeyDown={handleKeyDown} />
</div>
```

`focus-within:ring-2` is a Tailwind pseudo-class that applies the ring
when ANY descendant element has focus -- the input inside the div.

---

## Concept 6 -- Filter Tabs with Counts

The status tabs (All / Open / Draft / Closed) are computed from the jobs array:

```js
const TABS = ['all', 'open', 'draft', 'closed']

const counts = TABS.reduce((acc, t) => {
  acc[t] = t === 'all' ? jobs.length : jobs.filter(j => j.status === t).length
  return acc
}, {})
// Result: { all: 6, open: 4, draft: 1, closed: 1 }
```

`reduce` starts with an empty object `{}` and adds one key per tab.
It's more efficient than calling `.filter().length` four separate times.

The filtered list combines tab + search:
```js
const filtered = jobs.filter(j => {
  const matchTab    = tab === 'all' || j.status === tab
  const matchSearch = j.title.toLowerCase().includes(search.toLowerCase())
  return matchTab && matchSearch   // BOTH must be true
})
```

---

## Concept 7 -- Optimistic UI (delete confirmation dialog)

Instead of using the browser's `window.confirm()` (ugly, blocks the thread),
we built our own confirmation dialog using state:

```js
const [deleting, setDeleting] = useState(null)  // stores the ID to delete

// Click delete -> show dialog with the target ID
const handleDelete = (id) => setDeleting(id)

// Confirm -> actually remove it
const confirmDelete = () => {
  setJobs(prev => prev.filter(j => j.id !== deleting))
  setDeleting(null)
}

// Cancel -> just clear the state
const cancelDelete = () => setDeleting(null)
```

In JSX, the dialog only renders when `deleting` is not null:
```jsx
{deleting && (
  <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
    {/* modal content */}
  </div>
)}
```

`fixed inset-0` means: position fixed, stretch to all four edges (full screen overlay).
`bg-black/30` is a Tailwind shorthand for `background: rgba(0,0,0,0.30)` -- the dark backdrop.
`z-50` ensures the modal renders on top of everything else.

---

## Concept 8 -- The Inclusivity Score

The bias checker computes a score from 0-100:

```js
const biasScore = biasFlags.length === 0
  ? 100
  : Math.max(
      0,
      100
        - (biasFlags.filter(f => f.level === 'error').length * 20)    // errors = -20 each
        - (biasFlags.filter(f => f.level === 'warning').length * 10)  // warnings = -10 each
    )
```

`Math.max(0, value)` clamps the score -- it can never go below 0.

The score drives the progress bar width:
```jsx
<div style={{ width: `${biasScore}%` }} className="h-full bg-green-500 transition-all duration-500" />
```

`transition-all duration-500` makes the bar animate smoothly when the score changes.
Setting width as an inline style (not a Tailwind class) is intentional --
dynamic values like `width: 73%` cannot be used as Tailwind classes because
Tailwind generates CSS at build time and can't know your runtime values.

---

## File structure after Phase 3

```
src/pages/recruiter/
  Dashboard.jsx   (Phase 2)
  Jobs.jsx        (Phase 3) -- search, filter, table, delete dialog
  JobForm.jsx     (Phase 3) -- create/edit form + AI bias checker
```

---

## How to test Phase 3 manually

1. Run npm run dev, set localStorage auth (see Phase 2 notebook)
2. Go to /recruiter/jobs -- you should see 6 mock jobs in the table
3. Test search: type "React" -- table filters live
4. Test tab filter: click "Draft" -- only the draft job shows
5. Hover a row: edit/toggle/delete icons appear on the right
6. Click delete: custom confirmation dialog appears
7. Click "Post a job": navigates to /recruiter/jobs/new
8. In the form, type in the description: "We need a rockstar ninja developer"
   -> After 600ms, bias checker fires and shows 2 flags
9. Clear to a clean description -> score goes to 100 / "Inclusive"
10. Click "Save as draft" -> navigates back to jobs list (fake save, no backend yet)
11. Click edit on job #1 -> /recruiter/jobs/1/edit, form pre-filled with mock data
    -> bias checker fires immediately on the pre-filled description

---

## Common mistakes at this phase

### 1. Mutating state directly
```js
// WRONG
jobs.push(newJob)         // mutates the array -- React won't re-render
jobs[0].status = 'closed' // mutates an object -- React won't re-render

// CORRECT
setJobs(prev => [...prev, newJob])
setJobs(prev => prev.map(j => j.id === id ? { ...j, status: 'closed' } : j))
```

### 2. Using array index as key for dynamic lists
```jsx
// WRONG -- index changes when items are deleted
{jobs.map((job, i) => <Row key={i} job={job} />)}

// CORRECT -- stable unique ID
{jobs.map(job => <Row key={job.id} job={job} />)}
```
When you delete item at index 2, everything after shifts down.
React uses key to track identity -- if index 2 disappears,
React doesn't know if the item was deleted or just moved.

### 3. Inline regex in render
```jsx
// WRONG -- creates a new regex object on every render
if (/rockstar/gi.test(text)) { ... }

// CORRECT -- define outside the component
const BIAS_PATTERN = /rockstar/gi
```

---

## Interview questions this phase prepares you for

**Q: What is a controlled component?**
A: A form element whose value is controlled by React state. The input's value
prop comes from state, and onChange updates that state. This gives you full
control for validation, formatting, and resetting the form.

**Q: How do you debounce a search/analysis function?**
A: Store a timer ID in useRef. On every input change, clear the previous timer
and set a new one with setTimeout. The function only runs when the user pauses
typing for the specified duration (e.g. 600ms).

**Q: Why use useRef instead of useState for the timer?**
A: useRef stores a value that persists between renders but does NOT trigger
re-renders when changed. A timer ID has no visual effect -- storing it in
useState would cause unnecessary re-renders.

**Q: How do you handle both create and edit in the same form component?**
A: Use useParams to read the :id URL parameter. If id exists, load the existing
data in a useEffect and set the form state. If not, the form starts empty.
One component, two modes, decided by the URL.

---

*Phase 3 complete. Next: Phase 4 -- Candidate Pipeline (Kanban board).*
*Notebook: 04_phase4-explained.md created after Phase 4.*
