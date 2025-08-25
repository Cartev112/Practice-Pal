# Practice Page UI Blueprint

This document proposes a production-ready UI layout for the **Practice Page**.  It combines real-time feedback, performance controls, and beautiful visuals while remaining responsive from mobile to desktop.

---

## 1. High-Level Layout
```
┌──────────────────────────────────────────────────────────────┐
│ Control Bar (top sticky)                                    │
├──────────────────────────────────────────────────────────────┤
│ ⬅ Left Column                   | ➡ Right Column            │
│  • Accuracy / Metronome Graph   |  • Gauges & Fretboard     │
│  • Exercise Progress List       |    – Accuracy Gauge       │
│                                |    – Adaptive Tempo Gauge  │
│                                |    – Virtual Fretboard     │
└──────────────────────────────────────────────────────────────┘
```
Grid areas:
* **ControlBar (sticky)** – spans full width, pinned to top inside scroll region.
* **Left** – flexible width (60% on desktop, 100% on mobile)
  * Primary line chart visual (accuracy & metronome), stacked with progress list.
* **Right** – (40% desktop, collapses below) vertical stack of gauges/fretboard.

Tailwind utility: `grid md:grid-cols-[3fr_2fr] gap-6` inside `main` element.

## 2. Component Specs

### 2.1 ControlBar
| Element | Purpose | Notes |
|---------|---------|-------|
| Elapsed Time & Tempo | quick glance stats | monospace font, subtle gradient bg |
| Pause/Resume btn | toggle `paused` state | change icon + tooltip |
| Finish btn | open confirmation modal | green accent |
| Discard btn | confirmation + redirect | red accent |

`position:sticky top-0 z-20` provides always-visible access.

### 2.2 Accuracy / Metronome Graph
Interactive line chart (Recharts or d3) overlaying:
* Pitch accuracy % (green line)
* Rhythm accuracy % (blue line)
* Optional metronome beat markers (light grid ticks)

Features:
* Tooltip on hover (desktop) showing exact % + timestamp.
* Auto-scroll – keep latest 60s visible, older values fade.
* Dark theme compliant using HSL vars from Tailwind config.

### 2.3 Exercise Progress List
Simple vertical timeline below the graph.
* Each item: index, title, planned duration, status badge.
* `current` item highlighted indigo; `completed` line-through gray.
* Scrolls horizontally on small screens.

### 2.4 Accuracy Gauge (Rushing / Dragging)
Circular gauge that maps rhythm offset (ms) → dial.
* Center at 0 ms; left = "dragging", right = "rushing".
* Animated needle every beat.
* Color zones: ±10 ms green, ±25 ms yellow, >25 ms red.

### 2.5 Adaptive Tempo Gauge
Speedometer-style gauge.
* Displays current BPM vs target ceiling.
* Smooth transition when BPM auto-adjusts.
* Shows upcoming increment tick marks.

### 2.6 Virtual Fretboard
Mini fretboard (e.g., 12-fret) rendering:
* Highlights currently played note position based on pitch detection.
* Renders string & fret markers using SVG for scalability.
* Responsive width; hide on <360 px devices.

---

## 3. Responsiveness
* **Mobile (<640 px)** – layout stacks vertically: graph, gauges, fretboard full-width under control bar. Gauges become two-column grid to save space.
* **Tablet (640-1023 px)** – default two-column listed above.
* **Large Desktop (≥1280 px)** – increase max-width to 1400 px, enlarge gauges.


## 4. Visual Style
* Use existing dark palette.
* Add subtle card borders: `border border-gray-700 rounded-lg bg-gray-800/70 backdrop-blur`.
* Shadow for elevated components (`shadow-lg/black/25`).
* 12-px grid spacing throughout.

## 5. Accessibility & UX
* High-contrast color ratios.
* All interactive controls keyboard navigable (`tabindex`, `focus:outline-none focus:ring`).
* ARIA labels on gauges and buttons.
* Reduce motion setting – disable chart animations.

## 6. Implementation Milestones
1. **Grid & basic layout** (ControlBar + placeholders).
2. **Accuracy graph** – convert existing AccuracyGraph to Recharts + scroll window.
3. **Progress list** – fetch durations; auto-advance highlighting on exercise change.
4. **Gauges** – build reusable `DialGauge` component, feed rhythm offset & tempo data.
5. **Virtual fretboard** – SVG component + pitch mapping util.
6. **Styling polish** – gradients, shadows, responsive breakpoints.
7. **Accessibility pass & dark/light toggle**.

## 7. Tech Stack
* **Tailwind CSS** – utility + custom theme.
* **Recharts** – charting.
* **React-Spring** – smooth gauge needle animation.
* **SVG / D3‐path** – fretboard rendering.

---

> When building, treat each section as an isolated card component with its own storybook story.  This enables rapid iteration and visual QA before integration into the page.
