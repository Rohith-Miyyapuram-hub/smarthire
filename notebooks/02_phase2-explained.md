# Phase 2 -- Recruiter Layout & Dashboard: Everything Explained
### From scratch to deep -- read this after Phase 2 is done
*Your AI mentor | SmartHire build series*

---

## What we built in Phase 2

- A persistent sidebar with active-link highlighting
- A top navigation bar with notification bell and user avatar
- A full recruiter dashboard with metric cards, activity feed, and open jobs list
- Nested routing so every recruiter page shares the same layout automatically
- A shared icon library so SVG icons are defined once and reused everywhere

---

## Concept 1 -- Nested Routing (the most important idea in this phase)

### The problem it solves
Without nested routing, every page would have to import and render the Sidebar
and TopBar itself. If you have 8 recruiter pages, that's 8 copies of the same
layout code. Change the sidebar? Update 8 files.

### How nested routing works
React Router lets you nest routes inside a parent route. The parent renders a
layout component. The layout has an `<Outlet />` -- a placeholder that React Router
fills with whichever child route matches the current URL.

```
URL: /recruiter          -> RecruiterLayout + Dashboard fills Outlet
URL: /recruiter/jobs     -> RecruiterLayout + Jobs fills Outlet
URL: /recruiter/pipeline -> RecruiterLayout + Pipeline fills Outlet
```

The sidebar and topbar render ONCE in RecruiterLayout. The content area swaps.

### How we wrote it in App.jsx

```jsx
<Route
  path="/recruiter"
  element={
    <ProtectedRoute allowedRole="recruiter">
      <RecruiterLayout />   {/* parent -- renders sidebar + topbar + Outlet */}
    </ProtectedRoute>
  }
>
  {/* These are child routes -- they fill the Outlet */}
  <Route index          element={<Dashboard />} />
  <Route path="jobs"    element={<Jobs />} />
  <Route path="pipeline" element={<Pipeline />} />
</Route>
```

`index` means "the default child when no sub-path is given".
So `/recruiter` shows Dashboard, `/recruiter/jobs` shows Jobs.

### The Outlet component
```jsx
// Inside RecruiterLayout.jsx
import { Outlet } from 'react-router-dom'

<main className="flex-1 overflow-y-auto p-6">
  <Outlet />    {/* Dashboard / Jobs / Pipeline renders here */}
</main>
```

`<Outlet />` is a portal. React Router injects the matched child component into it.
Without this, the layout renders but child routes show nothing.

---

## Concept 2 -- NavLink vs Link

Both create anchor tags. The difference:

```jsx
import { Link, NavLink } from 'react-router-dom'

// Link -- just navigates, no awareness of active state
<Link to="/recruiter/jobs">Jobs</Link>

// NavLink -- receives isActive from React Router, lets you style the active link
<NavLink
  to="/recruiter/jobs"
  className={({ isActive }) =>
    isActive ? 'bg-indigo-50 text-indigo-700' : 'text-gray-500'
  }
>
  Jobs
</NavLink>
```

`NavLink` passes `{ isActive, isPending }` to the className function automatically.
You never have to manually compare `window.location.pathname`.

### The `end` prop
```jsx
<NavLink to="/recruiter" end>Dashboard</NavLink>
```

Without `end`: `/recruiter` matches ANY URL starting with `/recruiter`.
So `/recruiter/jobs` would also highlight the Dashboard link. That's wrong.

With `end`: only highlights when the URL is EXACTLY `/recruiter`.
Rule of thumb: always add `end` to the top-level route in a section.

---

## Concept 3 -- CSS Layout with Flexbox (how the sidebar layout works)

The full-screen sidebar layout uses two nested flex containers:

```
+---------------------------+
| aside (w-60, shrink-0)    | div (flex-1, overflow-hidden)
|                           | +----------------------------+
| Sidebar                   | | header (h-14, shrink-0)    |
|                           | +----------------------------+
|                           | | main (flex-1, overflow-y)  |
|                           | |  <Outlet /> renders here   |
|                           | +----------------------------+
+---------------------------+
```

The key Tailwind classes:

```
flex h-screen overflow-hidden    -- outer container fills viewport, no scroll
w-60 shrink-0                    -- sidebar is exactly 240px, never shrinks
flex-1 min-w-0                   -- main area takes all remaining width
                                    min-w-0 prevents content from overflowing
flex flex-col                    -- stack header + main vertically
h-14 shrink-0                    -- topbar is exactly 56px tall, never shrinks
flex-1 overflow-y-auto           -- main content fills remaining height, scrolls
```

Why `overflow-hidden` on the outer div?
Without it, if any child overflows, the whole page gets a scrollbar instead
of just the content area scrolling independently.

Why `min-w-0` on the main area?
Flex children have `min-width: auto` by default -- they expand to fit their content.
`min-w-0` overrides this and lets the content be contained, preventing horizontal overflow.

---

## Concept 4 -- Component Composition (the MetricCard pattern)

In Dashboard.jsx, we defined MetricCard as a function inside the file:

```jsx
function MetricCard({ label, value, change, up, Icon, color }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      ...
    </div>
  )
}
```

Then used it with a `.map()`:
```jsx
{METRICS.map((m) => (
  <MetricCard key={m.label} {...m} />
))}
```

`{...m}` is the spread operator -- it unpacks all keys from the `m` object as props.
This is equivalent to writing:
```jsx
<MetricCard
  label={m.label}
  value={m.value}
  change={m.change}
  up={m.up}
  Icon={m.Icon}
  color={m.color}
/>
```

### Why pass `Icon` as a prop (capital I)?
```jsx
const METRICS = [
  { label: 'Open Jobs', Icon: BriefcaseIcon, ... },
]

// Inside MetricCard:
function MetricCard({ Icon }) {
  return <Icon className="w-4 h-4" />
}
```

In React, components must start with a capital letter. If you wrote `icon` (lowercase),
React would treat it as a plain HTML element and crash. When you pass a component
as a prop, name it with a capital letter so you can render it directly.

---

## Concept 5 -- The Icon Library (icons.jsx)

We created `src/components/ui/icons.jsx` with every SVG icon in one place.

```jsx
// How each icon is defined
export function BriefcaseIcon({ className }) {
  return (
    <svg
      className={className || 'w-5 h-5'}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path d="..." />
    </svg>
  )
}

// How it's used
import { BriefcaseIcon } from '../ui/icons'
<BriefcaseIcon className="w-4 h-4 text-indigo-500" />
```

Why a single file instead of individual icon components?
- One import to update if you swap icon libraries
- All icons follow the same API (className prop)
- Easy to find: every icon in the whole project is in one place

The `stroke="currentColor"` means the icon inherits the text color of its parent.
So `text-indigo-500` on the parent automatically makes the icon indigo.

---

## Concept 6 -- Mock Data (and why we use it)

All dashboard data is hardcoded arrays at the top of Dashboard.jsx:

```js
const METRICS = [
  { label: 'Open Jobs', value: 8, ... },
  ...
]
```

This is intentional. The frontend and backend are built separately.
Using mock data means:
1. You can build and test the entire UI without a running server
2. You can get the design right before the API exists
3. When the API is ready (Phase 6), you just replace the mock data
   with a `useQuery` call -- the component doesn't need structural changes

This is called the "shape-first" approach. Design the data shape you need,
mock it, build the UI, then wire up the real API.

---

## Concept 7 -- Color Maps (the lookup table pattern)

In Dashboard.jsx we used color maps instead of long if/else chains:

```js
// Without color map -- messy
function getColor(color) {
  if (color === 'indigo') return 'bg-indigo-50 text-indigo-600'
  if (color === 'amber') return 'bg-amber-50 text-amber-600'
  ...
}

// With color map -- clean
const COLOR = {
  indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600' },
  amber:  { bg: 'bg-amber-50',  text: 'text-amber-600'  },
}

// Usage
const c = COLOR[color]   // e.g. COLOR['indigo']
<div className={c.bg}>
```

This is called a "lookup table" pattern. It scales well -- adding a new color
means adding one line to the map, not a new if/else.

Important Tailwind note: Tailwind scans your source files and only includes CSS
for class names it finds as complete strings. Never do:
```jsx
// WRONG -- Tailwind won't find this class
`bg-${color}-50`

// CORRECT -- full class name as a string
const COLOR = { indigo: 'bg-indigo-50' }
```

---

## Concept 8 -- Initials Avatar

In RecruiterLayout.jsx:
```js
const initials = user?.name
  ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
  : 'U'
```

Step by step for "Rohit Miyyapuram":
1. `user.name.split(' ')` --> ['Rohit', 'Miyyapuram']
2. `.map((n) => n[0])`    --> ['R', 'M']
3. `.join('')`            --> 'RM'
4. `.toUpperCase()`       --> 'RM'
5. `.slice(0, 2)`         --> 'RM' (cap at 2 characters for long names)

---

## File structure after Phase 2

```
src/
  components/
    ui/
      Button.jsx
      Input.jsx
      Spinner.jsx
      icons.jsx         <-- NEW: all SVG icons in one place
    layout/
      ProtectedRoute.jsx
      RecruiterLayout.jsx  <-- NEW: sidebar + topbar + Outlet
  pages/
    auth/
      Login.jsx
      Register.jsx
    recruiter/
      Dashboard.jsx     <-- NEW: metrics, activity, open jobs
  store/
    authStore.js
  services/
    api.js
  App.jsx               <-- UPDATED: nested routing
  main.jsx
```

---

## How to test Phase 2 manually

1. Run `npm run dev` in SmartHire/frontend
2. Go to http://localhost:5173 -- lands on Login
3. Since there's no backend yet, bypass auth by opening browser DevTools:
   - Application tab -> Local Storage -> localhost:5173
   - Set key `smarthire-auth` to:
     {"state":{"user":{"name":"Rohit M","email":"rohit@test.com","role":"recruiter"},"token":"fake-token","isAuthenticated":true},"version":0}
   - Refresh and go to http://localhost:5173/recruiter
4. You should see: sidebar, topbar, dashboard with metric cards and activity feed
5. Click "Jobs", "Pipeline", etc. in the sidebar -- they should navigate and show
   the "coming soon" placeholder. The active link should highlight in indigo.
6. Hover over your name in the sidebar footer -- the logout icon should appear.

---

## Common mistakes at this phase

### Forgetting Outlet
If the layout renders but the dashboard content is blank:
-> You forgot `<Outlet />` inside RecruiterLayout.jsx.
The layout has no idea where to put the child route's component without it.

### index vs path=""
```jsx
// CORRECT -- renders at /recruiter
<Route index element={<Dashboard />} />

// Also works but less clean
<Route path="" element={<Dashboard />} />

// WRONG -- renders at /recruiter/dashboard (different URL)
<Route path="dashboard" element={<Dashboard />} />
```

### NavLink always active
If every sidebar link is always highlighted:
-> You're missing the `end` prop on the `/recruiter` route.
Add `end` to any NavLink whose path is a prefix of other routes.

---

## Interview questions this phase prepares you for

**Q: How do you avoid repeating layout code across pages?**
A: Nested routing with React Router. The layout component renders once with an Outlet.
Child routes automatically fill that Outlet. The sidebar and header exist in one file.

**Q: How do you highlight the active nav link?**
A: NavLink from React Router. Its className prop receives { isActive } -- a boolean
that React Router sets based on whether the current URL matches the link's `to` prop.
Use the `end` prop to prevent prefix-matching on parent routes.

**Q: How do you structure a dashboard with multiple sections?**
A: CSS Grid for the metric cards (auto-fit columns for responsiveness), Flexbox for
the two-column bottom section. All data starts as mock arrays at the top of the file,
shaped to match what the API will eventually return.

---

*Phase 2 complete. Next: Phase 3 -- Job Management screens.*
*Notebook: 03_phase3-explained.md created after Phase 3.*
