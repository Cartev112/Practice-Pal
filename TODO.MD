# Practice Pal Roadmap

## 1. Exercise Library
### 1.1 Core Features
- CRUD for exercises (✓ backend done)
- Tagging system  
  - Technique: Alternate picking, Sweep, Legato, Tapping …  
  - Genre-tags (Rock, Jazz, Classical …)  
  - UI: multi-select tag chips + “Add custom tag”
- Importers  
  - MuseScore (`.mscz`, MusicXML) → parse with `musescore-js` or `music21`  
  - PDF (basic OCR or manual bar selection) — stretch goal
- Algorithmic generation  
  - Simple pattern templates (interval sequences, scale fragments)  
  - Difficulty sliders (range, tempo, rhythmic density)  
  - Long-term: ML-based generator

### 1.2 Nice-to-haves
- Audio demo playback (MIDI/SoundFont)
- Star/favorite exercises
- Version history for edits

## 2. Practice Sessions
### 2.1 Session Setup
- Choose: premade routine / custom routine / single exercise
- Adaptive tempo toggle  
  - Start slower, auto-increase based on accuracy threshold
- Metronome  
  - Tempo slider, volume slider  
  - Sound schemes (Click, HH kick, subdivided)  
  - Count-in option

### 2.2 During Session
- Real-time accuracy graph  
  - Pitch + rhythm overlays  
  - Show “current streak”, “best streak”
- Pause / resume, discard, finish

### 2.3 Post-Session
- Summary modal (accuracy %, time, repetitions)
- Save/export data (CSV, JSON, PDF report)
- Add notes/reflections

## 3. Analytics Dashboard
- Filters: date range, exercise, tag
- Charts: progress over time, heat-map of accuracy by tempo, technique pie chart
- Compare current week vs previous

## 4. User Interface / UX
- Dark/light theme toggle (already present)
- Landing page polish (full-screen indigo ✅)
- Mobile responsiveness for all pages
- Keyboard shortcuts (space = start/pause, +/- = tempo)

## 5. Backend & Data
- Persist sessions to DB (SQLite → Postgres later)
- Authentication (email/pass, OAuth GitHub/Google)
- Cloud sync option

## 6. Stretch Goals
- Community exercise sharing
- AI feedback (tone quality, timing deviations)
- Multiplayer “practice room”

---

### Suggested Milestones
| Phase | Goals | Outcome |
|-------|-------|---------|
| **MVP** | Exercise CRUD UI, manual session with metronome & accuracy graph, save sessions to DB | Usable solo-practice tool |
| **v0.2** | Tags, adaptive tempo, analytics dashboard | Insightful feedback loop |
| **v0.3** | Import from MuseScore, routine builder | Seamless repertoire creation |
| **v1.0** | Auth, cloud sync, mobile polish | Public beta |





Fretboard-Highlighting Feature – High-Level Plan
Data Model
ts
CopyInsert
interface FretNote {
  string: 1 | 2 | 3 | 4 | 5 | 6;   // guitar strings (low-E = 6)
  fret: number;                    // 0 = open
  time: number;                    // ms from exercise start or beat index
  duration?: number;               // for sustained notes / legato
  label?: string;                  // optional finger / note name
}

interface ExerciseFretboardData {
  tuning: string[];                // ['E2','A2','D3','G3','B3','E4']
  bpm: number;
  timeSig: [number, number];
  notes: FretNote[];
}
• Stored in the exercise record (JSON column) or separate table.
• Authoring UI: grid where user clicks string/fret, sets beat index.
Rendering Component
• React + SVG (responsive, lightweight)
• Draw six horizontal lines; number frets across.
• For each active note: circle on (string, fret) coordinates.
• Colour coding: current beat = filled, upcoming = outline, missed = red.
• Optional: fretboard image underlay for realism; swap to bass/uke layouts.
Timing & Sync
• Component receives currentTime (ms) from session manager / metronome.
• Compute current beat → determine which FretNotes are considered “active” (within ±ε of currentTime).
• Smooth animation via requestAnimationFrame + interpolation for slides/bends.
User Feedback Overlay
• When user plays a note, pitch-detection module emits (stringGuess, fretGuess, timestamp).
• Compare to expected FretNote (same beat).
• Highlight circle green/red briefly for correct/incorrect; update accuracy stats.
API Surface (frontend)
tsx
CopyInsert
<FretboardDisplay
  exercise={exerciseFretboardData}
  currentTime={elapsedMs}
  detectedNotes={liveDetectionQueue}   // optional for feedback
/>
Milestone Tasks
Static SVG fretboard component (no timing).
Load exercise JSON → render full sequence as grey circles.
Add metronome sync: highlight circle when its time window is active.
Integrate pitch-detection feedback colouring.
Authoring UI for teachers/users (drag-and-drop dots).
Optimisations: virtualise long exercises, mobile pinch-zoom.
Tech & Libraries
• d3-scale for mapping fret numbers to x-coords.
• framer-motion or CSS transitions for simple animations.
• Potential 3-D view later with three.js.
Stretch Ideas
• Left-hand fingering hints (numbers inside circles).
• Animated slide/bend arrows.
• Auto-scrolling tablature under fretboard.
• Multi-instrument support (piano roll, drum pads).