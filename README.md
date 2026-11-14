# Personal Progressive Overload Tracker

A fitness tracking web application built specifically for **progressive overload with fixed-weight dumbbells**, where muscle progression is driven by **repetition volume increases, set progression, and personal records** rather than constantly switching to heavier dumbbell pairs.

Designed with a **dark olive-green aesthetic** (`#28301C`, `#323D25`, `#9A7E3B`, `#D2CF9A`), minimal distraction, responsive layouts, and persistent SQLite database storage.

---

## Visual Identity & Color Scheme

| Color | Hex Code | Role |
|---|---|---|
| Primary Background | `#28301C` | Deep olive-green canvas |
| Surface / Cards | `#323D25` | Sidebar, cards, headers, interactive surfaces |
| Accent | `#9A7E3B` | Muted gold buttons, active indicators, charts, PR trophies |
| Text / Highlights | `#D2CF9A` | Primary typography, key numbers, labels |

---

## Key Features

1. **Progressive Overload Engine (Fixed-Weight Dumbbells)**:
   - Tracks repetitions per set and calculates total session repetitions.
   - Live side-by-side comparison with the previous workout for that specific exercise.
   - Automatically calculates rep deltas (e.g., `+6 reps`), percentage changes (`+24%`), and personal records (`PR 🏆`).
   - Evaluates rep progression against customizable targets (e.g., `8–12 reps`: progressing → approaching → target achieved).

2. **Configurable 6-Day Workout Routine**:
   - Split: `1. Arms`, `2. Back`, `3. Legs`, `4. Rest`, `5. Arms`, `6. Back`.
   - Workouts reuse templates (Arms template, Back template, Legs template).
   - Reorderable, expandable, customizable schedule cycle.
   - Dynamic cycle progression tracking (knows which day is scheduled next).

3. **Active Workout Session Interface**:
   - Displays scheduled routine exercises with previous performance right beside current inputs.
   - Large, mobile-friendly input controls for quick entry during workouts.
   - Live workout timer with pause and resume.
   - Ability to add/remove sets, skip exercises, and add extra exercises on the fly.
   - Prevents accidental exit data loss with confirmation dialogs.

4. **Exercise Management & History**:
   - Manage exercises across 8 muscle groups (`Biceps`, `Triceps`, `Shoulders`, `Forearms`, `Back`, `Legs`, `Chest`, `Other`).
   - Configurable default dumbbell weight and target min/max reps.
   - Preserves historical records; prevents deleting exercises with logged history.

5. **Progress & Analytics**:
   - Dedicated progress view per exercise with time range filters (`7 days`, `30 days`, `3 months`, `All time`).
   - Interactive Recharts visual volume progression.
   - Complete historical set table.

6. **History & Exports**:
   - Browse all past sessions with detailed modal inspection.
   - One-click JSON backup and spreadsheet-ready CSV export.
   - Safe reset controls with confirmation dialogs.

---

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **Visuals & Charts**: Recharts, Lucide React
- **Backend**: Node.js, Express, TypeScript, TSX
- **Database**: SQLite with `better-sqlite3` (WAL mode enabled, foreign keys enforced)

---

## Running the Project

### Install Dependencies:
```bash
# Server dependencies
cd server && npm install

# Client dependencies
cd ../client && npm install
```

### Run in Development:
```bash
# Terminal 1: Backend API (port 5000)
cd server && npm run dev

# Terminal 2: Frontend Client (port 5173 with API proxy)
cd client && npm run dev
```

Visit [http://localhost:5173](http://localhost:5173) in your browser.
