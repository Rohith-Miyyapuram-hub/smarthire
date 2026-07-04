# Phase 4 -- Candidate Pipeline Kanban: Everything Explained
### From scratch to deep -- read this after Phase 4 is done
*Your AI mentor | SmartHire build series*

---

## What we built in Phase 4

- A full Kanban board with 5 stage columns (Applied, Screening, Interview, Offer, Rejected)
- Drag-and-drop to move candidates between columns using the HTML5 Drag API
- A slide-in drawer to view candidate details, edit notes, and move stages
- Job-based filtering so recruiters see only candidates for a specific posting
- Visual drag feedback -- columns highlight when a card is dragged over them

---

## Concept 1 -- The HTML5 Drag and Drop API

This is built into every browser. No library needed. It works with 4 events.

### Step 1: Make an element draggable

```jsx
<div draggable onDragStart={handleDragStart}>
  Drag me
</div>
```

`draggable` is a plain HTML attribute. Setting it to true tells the browser:
"this element can be picked up and moved." A drag cursor appears on hover.

### Step 2: The 4 events

```
onDragStart   -- fires when the user starts dragging
onDragEnd     -- fires when the drag ends (drop OR cancel)
onDragOver    -- fires continuously while dragging OVER a target element
onDrop        -- fires when the dragged item is dropped onto a target
```

Here is how each was used in Pipeline.jsx:

```jsx
// On the draggable card:
<CandidateCard
  draggable
  onDragStart={() => handleDragStart(candidate.id)}
  onDragEnd={handleDragEnd}
/>

// On each stage column (the drop target):
<div
  onDragOver={(e) => handleDragOver(e, stage)}
  onDrop={() => handleDrop(stage)}
>
```

### Step 3: Why `e.preventDefault()` in onDragOver?

```js
function handleDragOver(e, stage) {
  e.preventDefault()     // <-- THIS IS REQUIRED
  setDragOverStage(stage)
}
```

By default, browser elements are NOT valid drop targets. The browser cancels the
drop unless you call `e.preventDefault()` inside `onDragOver`. If you forget this,
`onDrop` never fires. This is the single most common drag-and-drop bug.

### Step 4: Communicating what is being dragged

We could use `e.dataTransfer.setData('text', id)` (the official API), but for
React state-based UIs it's simpler to just store the dragging ID in state:

```js
const [draggingId, setDraggingId] = useState(null)

function handleDragStart(id) {
  setDraggingId(id)
}

function handleDrop(targetStage) {
  if (!draggingId) return
  setCandidates(prev =>
    prev.map(c => c.id === draggingId ? { ...c, stage: targetStage } : c)
  )
  setDraggingId(null)
  setDragOverStage(null)
}

function handleDragEnd() {
  // Clean up if user cancels (drags outside a valid target)
  setDraggingId(null)
  setDragOverStage(null)
}
```

### Why handleDragEnd matters

If the user drags a card but drops it outside any column (onto the sidebar, for
example), `onDrop` never fires. Only `onDragEnd` fires. Without that cleanup,
`draggingId` stays set and the card looks "stuck" mid-drag forever.

### Visual drag feedback

```jsx
const isOver = dragOverStage === stage
<div
  style={{
    background: isOver ? '#eef2ff' : '#f9fafb',
    border: isOver ? '2px dashed #818cf8' : '2px solid transparent',
  }}
>
```

We used inline styles here because these are RUNTIME values -- they change based
on which column is currently being dragged over. Tailwind classes are compiled
at build time, so you cannot conditionally compose them with runtime data.

---

## Concept 2 -- Fixed Position Overlays and Z-Index

The candidate drawer slides in from the right side of the screen. It doesn't
scroll with the page -- it sits on top of everything and stays put.

### The CSS `position` values you need to know

```
static   -- default, part of normal document flow
relative -- offset from where it would normally be, still in flow
absolute -- positioned relative to nearest non-static ancestor, out of flow
fixed    -- positioned relative to the VIEWPORT (browser window), out of flow
sticky   -- like relative until scroll threshold, then behaves like fixed
```

`position: fixed` is the right choice for overlays because:
1. It stays in place even when the content behind it scrolls
2. It's positioned relative to the window, not a parent element
3. You can pin it to any edge: `right: 0`, `top: 0`, `bottom: 0`

### How the drawer and backdrop work together

```jsx
{/* Backdrop -- covers everything behind the drawer */}
<div
  style={{
    position: 'fixed',
    inset: 0,          // shorthand for top/right/bottom/left: 0
    background: 'rgba(0,0,0,0.25)',
    zIndex: 40,
  }}
  onClick={() => setSelected(null)}   // click outside to close
/>

{/* Drawer panel */}
<div
  style={{
    position: 'fixed',
    top: 0,
    right: 0,
    bottom: 0,
    width: 400,
    background: '#fff',
    zIndex: 50,         // drawer sits ON TOP of the backdrop
    overflowY: 'auto',
  }}
>
```

### The z-index stacking model

Think of z-index as layers on a table:

```
z-index 1  -- page content (normal)
z-index 10 -- sticky headers, tooltips
z-index 40 -- backdrop (semi-transparent overlay)
z-index 50 -- drawer panel, modals
z-index 60 -- toasts, dropdowns (above modals)
```

Rules:
1. z-index only works when `position` is set to anything except `static`
2. Higher number = on top
3. Elements with the same z-index stack in DOM order (later = on top)
4. z-index is scoped to a "stacking context" -- children can't escape their parent's stacking context

### Why we didn't use Tailwind classes for the drawer

```jsx
// WRONG -- w-400 is not a real Tailwind class
<div className="fixed top-0 right-0 bottom-0 w-400 z-50">

// CORRECT -- arbitrary value in Tailwind
<div className="fixed top-0 right-0 bottom-0 w-[400px] z-50">

// Also correct -- inline style (what we used)
<div style={{ position: 'fixed', width: 400 }}>
```

Tailwind v4 supports arbitrary values like `w-[400px]`. Both approaches work.
We used inline styles in Pipeline.jsx to keep the STAGE_CFG color objects
(which must be inline anyway) consistent with everything else in the file.

---

## Concept 3 -- State Lifting

When two components both need to change the same data, you "lift" that state
to their closest common parent.

In Pipeline.jsx:

```
Pipeline (parent -- owns candidates state)
  |-- Column (renders candidates per stage)
  |     |-- CandidateCard (drag events, click to open drawer)
  |-- CandidateDrawer (shows detail, has "Move to next stage" buttons)
```

Both CandidateCard (drag) and CandidateDrawer (button click) need to change
a candidate's stage. So the `candidates` array lives in Pipeline.

### The handleMoveStage function

```js
function handleMoveStage(candidateId, newStage) {
  // Update the candidates list
  setCandidates(prev =>
    prev.map(c => c.id === candidateId ? { ...c, stage: newStage } : c)
  )
  // Also update the drawer's copy so it shows the new stage immediately
  setSelected(prev => prev ? { ...prev, stage: newStage } : null)
}
```

Why update `selected` too? Because the drawer shows the candidate's current
stage. If you only update `candidates`, the drawer would still show the old
stage until you close and reopen it. Keeping both in sync is the key.

This is passed down as a prop:
```jsx
<CandidateDrawer
  candidate={selected}
  onMoveStage={handleMoveStage}
  onClose={() => setSelected(null)}
/>
```

Inside the drawer:
```jsx
<button onClick={() => onMoveStage(candidate.id, nextStage)}>
  Move to {nextStage}
</button>
```

The drawer doesn't own the data. It receives it and calls back up to Pipeline
when it needs to change something. This is called "lifting state up" and it is
one of the most fundamental patterns in React.

---

## Concept 4 -- Compound Components (sub-components in one file)

Pipeline.jsx defines three components in a single file:

```
CandidateCard   -- one card in a Kanban column
CandidateDrawer -- the slide-in detail panel
Pipeline        -- the main page that holds state and layout
```

This is called the "compound component" pattern. All three are closely related
and only used together. Putting them in separate files would mean:
- 3 files to understand to follow the logic
- Props drilling through unrelated files
- Can't easily see how they interact

### The alternative: component files splitting

For a large, reusable component (like a date picker), separate files make sense.
For tightly coupled components that only exist in one context, one file is cleaner.

Rule of thumb:
- Will this component be reused in 3+ other places? --> Separate file
- Is this component only meaningful inside one parent? --> Same file

CandidateCard is only used inside Pipeline. CandidateDrawer is only used inside
Pipeline. One file is the right call here.

---

## Concept 5 -- Kanban Board Architecture

A Kanban board is a filtered + grouped list with drag-to-reorder.

### Data model

```js
// Each candidate has a `stage` property that maps to a column
const candidate = {
  id: 1,
  name: 'Sarah Chen',
  jobTitle: 'Senior React Developer',
  jobId: 'job-1',
  stage: 'Interview',   // <-- this determines which column they appear in
  score: 87,
  tags: ['React', 'TypeScript'],
  appliedDate: '2026-06-10',
  notes: '',
}
```

### Rendering: filter per column

```jsx
const STAGES = ['Applied', 'Screening', 'Interview', 'Offer', 'Rejected']

{STAGES.map((stage) => {
  const columnCandidates = candidates.filter(c => {
    const matchesStage = c.stage === stage
    const matchesJob = !selectedJobId || c.jobId === selectedJobId
    return matchesStage && matchesJob
  })

  return (
    <Column
      key={stage}
      stage={stage}
      candidates={columnCandidates}
    />
  )
})}
```

Each column doesn't "own" its candidates. It just receives a filtered slice.
The full array lives in Pipeline state. When a candidate's stage changes,
the filter re-runs and the card moves to the new column automatically.

### Why this is better than N separate arrays

Bad approach:
```js
// One array per column -- nightmare to move cards
const [applied, setApplied] = useState([])
const [screening, setScreening] = useState([])
const [interview, setInterview] = useState([])
```

Moving a card now requires removing from one array AND adding to another.
Two state updates = two renders = possible bugs from render timing.

Good approach (what we use):
```js
// One array, filter per column
const [candidates, setCandidates] = useState(ALL_CANDIDATES)

// To move:
setCandidates(prev => prev.map(c =>
  c.id === id ? { ...c, stage: newStage } : c
))
```

One update, one re-render. The filter on each column automatically picks it up.

---

## Concept 6 -- Inline Style Objects for Stage Theming

We used a STAGE_CFG lookup table with inline style OBJECTS (not Tailwind strings):

```js
const STAGE_CFG = {
  Applied: {
    headerBg:     { background: '#f8fafc' },
    headerBorder: { borderBottom: '2px solid #e2e8f0' },
    dot:          { background: '#94a3b8' },
    badge:        { bg: '#f1f5f9', color: '#475569' },
  },
  Interview: {
    headerBg:     { background: '#fffbeb' },
    headerBorder: { borderBottom: '2px solid #fcd34d' },
    dot:          { background: '#f59e0b' },
    badge:        { bg: '#fef3c7', color: '#92400e' },
  },
  // ...
}
```

Why not Tailwind strings here?

The issue is that some of these color values are applied as sub-properties
of a larger style object that gets merged at runtime. For example:

```jsx
// We're already using inline style for the drag feedback:
style={{
  background: isOver ? '#eef2ff' : STAGE_CFG[stage].headerBg.background,
}}
```

You can't mix Tailwind classes and inline style properties for the same CSS
property on the same element. So if the drag-over background is an inline style,
the stage background must also be an inline style. We kept everything consistent.

---

## Concept 7 -- Controlled Notes in the Drawer

The notes textarea in the drawer is locally controlled state:

```jsx
function CandidateDrawer({ candidate, onClose, onMoveStage }) {
  const [notes, setNotes] = useState(candidate?.notes || '')
  const [notesSaved, setNotesSaved] = useState(false)

  // When candidate changes, reset notes to the new candidate's notes
  useEffect(() => {
    setNotes(candidate?.notes || '')
    setNotesSaved(false)
  }, [candidate?.id])

  function handleSaveNotes() {
    // In Phase 6: API call to PATCH /candidates/:id/notes
    setNotesSaved(true)
    setTimeout(() => setNotesSaved(false), 2000)
  }
```

The `useEffect` watching `candidate?.id` is important: if you have the drawer
open for candidate A and click candidate B, the drawer re-uses the same component
instance (React doesn't unmount it). The effect fires when the ID changes and
resets the textarea to the new candidate's notes. Without this, you'd see
candidate A's notes when you click candidate B.

---

## Concept 8 -- The `isOver` Visual Feedback Pattern

```jsx
// State: which stage column is being hovered during drag
const [dragOverStage, setDragOverStage] = useState(null)

// Computed: is this specific column being dragged over?
const isOver = dragOverStage === stage

// Applied to the column container:
style={{
  background: isOver ? '#eef2ff' : '#f9fafb',
  border: `2px ${isOver ? 'dashed' : 'solid'} ${isOver ? '#818cf8' : 'transparent'}`,
  transition: 'background 150ms, border-color 150ms',
}}
```

The CSS `transition` property makes the color change smooth rather than a
jarring instant flash. `150ms` is fast enough to feel responsive but slow
enough that the eye registers the change.

---

## File structure after Phase 4

```
src/
  pages/
    recruiter/
      Dashboard.jsx
      Jobs.jsx
      JobForm.jsx
      Pipeline.jsx    <-- NEW: Kanban board with drag-and-drop
  components/
    layout/
      ProtectedRoute.jsx
      RecruiterLayout.jsx
    ui/
      Button.jsx
      Input.jsx
      Spinner.jsx
      icons.jsx
  store/
    authStore.js
  services/
    api.js
  App.jsx             <-- UPDATED: added Pipeline route
```

---

## How to test Phase 4 manually

1. Set localStorage auth key (same as Phase 2):
   Application tab -> Local Storage -> localhost:5173
   Key: `smarthire-auth`
   Value: {"state":{"user":{"name":"Rohit M","email":"rohit@test.com","role":"recruiter"},"token":"fake-token","isAuthenticated":true},"version":0}

2. Run `npm run dev` and go to http://localhost:5173/recruiter/pipeline

3. You should see 5 columns with candidate cards distributed across them

4. Try dragging a card to a different column -- it should move there

5. Click any candidate card -- the drawer should slide in from the right

6. In the drawer, click "Move to next stage" -- the card should move and the
   drawer should update the stage label

7. Click the backdrop (dark area) -- the drawer should close

8. Try the job filter dropdown -- only candidates for that job should show

---

## Common mistakes at this phase

### onDrop never fires
-> You forgot `e.preventDefault()` inside `onDragOver`.
The browser cancels the drop by default. preventDefault opts you in.

### Card sticks after cancelling drag
-> You didn't handle `onDragEnd` on the draggable element.
Add `onDragEnd={handleDragEnd}` and reset draggingId + dragOverStage.

### Drawer shows wrong candidate data
-> You have a `useState` for notes but no `useEffect` to reset it when the
candidate prop changes. Add `useEffect(() => { setNotes(candidate?.notes || '') }, [candidate?.id])`.

### Column doesn't highlight on drag-over
-> You're trying to use Tailwind classes for the isOver state but the value
is computed at runtime. Use inline styles for dynamic visual feedback.

### All candidates show in every column
-> Your `.filter()` is wrong. Check that you're filtering by `c.stage === stage`
AND that the stage strings exactly match (case-sensitive).

---

## Interview questions this phase prepares you for

**Q: How does HTML5 drag and drop work?**
A: You set `draggable` on the element you want to drag. Use `onDragStart` to record
what's being dragged, `onDragOver` on the target (must call `e.preventDefault()` to
allow drops), and `onDrop` to handle the actual move. `onDragEnd` cleans up if the
user cancels.

**Q: How do you make a Kanban board in React?**
A: One flat array of items in state, each with a `stage` property. Render one column
per stage, filtering the array for that stage. To move a card, update the stage property
on that item -- the filter automatically places it in the new column. One state update,
no syncing between separate arrays.

**Q: What is state lifting? When do you use it?**
A: Moving state to the nearest common ancestor of all components that need it.
You use it when two sibling components (like a drag handler and a button in a drawer)
both need to read or update the same data. The parent owns the state, passes it down
as props, and passes a callback to update it.

**Q: How do you create a slide-in drawer or modal in React?**
A: `position: fixed` to remove it from flow and pin it to the viewport edge.
A semi-transparent backdrop at `z-index 40` and the panel at `z-index 50`.
The backdrop's `onClick` closes the drawer. `overflowY: auto` on the panel
lets its content scroll independently.

**Q: Why can't you use Tailwind for dynamic values?**
A: Tailwind works by scanning source files at build time and generating CSS only
for class names it finds as complete strings. Dynamic class names like
`bg-${color}-500` are not complete strings at build time, so Tailwind won't
generate that CSS and the class does nothing. Use inline styles for runtime values,
or pre-define all possible complete class name strings in a lookup table.

---

*Phase 4 complete. Next: Phase 5 -- Candidate Portal (job board, apply form, resume upload, application tracker).*
*Notebook: 05_phase5-explained.md created after Phase 5.*
