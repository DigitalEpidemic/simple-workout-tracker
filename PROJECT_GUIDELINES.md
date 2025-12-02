# Project Guidelines & Context

## Project Overview

React Native workout tracking application built with TypeScript, following offline-first architecture principles.

## Engineering Assistant Instructions

### Core Responsibilities

- Implement the project **task by task**, producing **full, complete code files** for each step
- Follow the phased implementation plan outlined below
- Reference all planning documents in `project_plan/` folder before implementing features
- **Do not invent new features** unless explicitly asked
- Ask for clarification **only when necessary**
- Assume the app must work **completely offline**

### Technology Stack

**Required:**

- React Native + TypeScript
- React Navigation
- SQLite (offline-first local database)
- Bulletproof React architecture (feature-based organization)

**Future:**

- Firebase (optional sync in Phase 5)

### Architecture Principles

**Must follow:**

- Feature-based organization (see `project_plan/1.1-folder-structure.md`)
- Modular and clean architecture
- Offline-first approach
- No cross-feature dependencies
- Shared code in `lib/`, `stores/`, and top-level `components/`
- **NO barrel files (index.ts/tsx for re-exports)** - Import directly from named files (e.g., `import { Button } from '@/components/ui/button'`, NOT `from '@/components/ui'`)

**Existing structure to preserve:**

- Top-level `components/` folder
- Top-level `assets/` folder
- Top-level `types.ts` file

---

## Features to Implement

### Core MVP Features (Phases 1-4)

- ✅ Workout templates (CRUD)
- ✅ Exercises with sets/reps/weight
- ✅ Rest timer
- ✅ Workout session timer
- ✅ Reorder exercises mid-workout
- ✅ Previous set autofill
- ✅ Workout history

### Extended Features (Phase 4+)

- ✅ Calendar view
- ✅ PR tracking (1-12 reps)
- ✅ Analytics (graphs, volume, PR timeline)
- ✅ Multi-day program system (Phases 8.1-8.5)

### Future Features (Phase 5+)

- 📋 Firebase sync
- 📋 Haptics and animations
- 📋 Testing and deployment

---

## Project Phases

### Phase 0 – Requirements Finalization

- **0.1** ✅ Define TypeScript interfaces → `types.ts`
- **0.2** ✅ Define app screens → `project_plan/0.2-screens-and-navigation.md`
- **0.3** ✅ Define MVP vs extended features → `project_plan/0.3-mvp-vs-extended-features.md`

### Phase 1 – Base Architecture

- **1.1** ✅ Project folder structure → `project_plan/1.1-folder-structure.md`
- **1.2** ✅ Expo Router navigation setup → `project_plan/1.2-expo-router-notes.md`
- **1.3** ✅ App theme
- **1.4** ✅ SQLite schema + migrations
- **1.5** ✅ Database helper utilities

### Phase 2 – Template System

- **2.1** ✅ CRUD for workout templates
- **2.2** ✅ Template selection screen
- **2.3** ✅ Starting a workout from a template

### Phase 3 – Active Workout System

- **3.1** ✅ Workout session screen + timer
- **3.2** ✅ Exercise screen (reps/sets/weight)
- **3.3** ✅ Rest timer
- **3.4** ✅ Workout completion flow

### Phase 4 – History & Analytics

- **4.1** ✅ Workout history
- **4.2** ✅ Calendar view
- **4.3** ✅ Exercise history + previous set autofill
- **4.4** ✅ Analytics charts
- **4.5** ✅ PR system
- **4.6** ✅ User settings (weight unit toggle: lbs/kg, default rest timer)

### Phase 5 – Sync

- **5.1** ⏳ Firebase setup
- **5.2** ⏳ Offline sync queue
- **5.3** ⏳ Manual sync UI
- **5.4** ⏳ Conflict resolution rules

### Phase 6 – UI Polish

- **6.1** ⏳ Haptics, animations, visual improvements

### Phase 7 – Testing & Deployment

- **7.1** ⏳ Unit tests, E2E tests, release builds

### Phase 8 – Multi-Day Program System

- **8.1** Data Model

  - **8.1.1** ✅ Create new SQLite tables: `programs`, `program_days`, `program_day_exercises`, `program_history`
  - **8.1.2** ✅ Migration scripts (create / alter / foreign keys)
  - **8.1.3** ✅ Add SQLite helper hooks for program execution + program history

- **8.2** Program Management Screens

  - **8.2.1** ✅ Program list + Create Program screen
  - **8.2.2** ✅ Program Day Editor (add/edit/remove days)
  - **8.2.3** ✅ Day Exercise Editor (add/edit/remove exercises for each program day)

- **8.3** Program Activation

  - **8.3.1** ✅ Mark a single active program
  - **8.3.2** ✅ Track `current_day_index`
  - **8.3.3** ✅ UI to switch the active program (optional)

- **8.4** Program Day Execution

  - **8.4.1** ✅ "Next Program Day" screen
  - **8.4.2** ✅ "Choose Different Day" flow (flexible execution)
  - **8.4.3** ✅ Load program day + exercises from SQLite

- **8.5** Program Progression Logic

  - **8.5.1** ✅ Insert `program_history` record when completing a workout
  - **8.5.2** ✅ Increment `current_day_index`
  - **8.5.3** ✅ Loop back to day 0 when program ends
  - **8.5.4** ✅ Support performing a day earlier/later than planned (run any day on any date)

- **8.6** History UI Integration

  - **8.6.1** ✅ Workout history displays program day name and workout type tags
  - **8.6.2** ✅ Analytics updated with filtering by program/template/workout type
  - **8.6.3** ✅ PRs link back to program days

- **8.7** Optional Enhancements
  - **8.7.1** ⏳ Drag-and-drop reordering of program days
  - **8.7.2** ⏳ Auto-progress only if > X hours since last workout
  - **8.7.3** ⏳ Per-day auto-progression rules
  - **8.7.4** ⏳ Converter: Templates → Programs migration wizard

---

## Task Execution Protocol

### When user requests: "Implement Phase X.Y"

1. **Read relevant planning documents** from `project_plan/` folder
2. **Review TypeScript interfaces** in `types.ts`
3. **Follow folder structure** defined in `project_plan/1.1-folder-structure.md`
4. **Implement complete, working code files** (no placeholders)
5. **Update this file** to mark phase as complete (✅)
6. **Commit changes** with descriptive message

### Expected Output Format

For each phase implementation:

- Full, production-ready code files
- No TODO comments or placeholders
- Follow existing code style and patterns
- Include TypeScript types
- Add error handling where appropriate
- Ensure offline-first compatibility

### What NOT to do

- ❌ Do not create duplicate files that conflict with existing structure
- ❌ Do not invent features beyond the current phase scope
- ❌ Do not skip error handling or validation
- ❌ Do not use network-dependent features (except Phase 5)
- ❌ Do not modify existing working boilerplate without reason
- ❌ Do not create barrel files (index.ts/tsx for re-exports) - always import from named files directly
- ❌ Do not hardcode weight units - use `useWeightDisplay()` hook to respect user preferences

---

## Planning Documents Reference

**Must consult before implementing:**

1. **`types.ts`** - All TypeScript interfaces (already defined)
2. **`project_plan/0.2-screens-and-navigation.md`** - Screen definitions and navigation structure
3. **`project_plan/0.3-mvp-vs-extended-features.md`** - Feature scope (MVP vs extended)
4. **`project_plan/1.1-folder-structure.md`** - Bulletproof React architecture

---

## Current Project Status

**Last Completed Phase:** 8.6.3 (PRs link back to program days)

**Next Phase:** 8.7 (Optional Enhancements) or 5.1 (Firebase setup)

**Architecture:**

- **Routing:** Expo Router (file-based routing) in `app/` directory
- **Business Logic:** Feature modules in `src/features/`
- **Shared Code:** `src/lib/` and `src/stores/`
- **UI Components:** Top-level `components/` folder
- **Theme System:** `constants/theme.ts` with design tokens and UI primitives in `components/ui/`
- **Weight Units:** User can toggle between **lbs** and **kg** in Settings. All weights stored in lbs, converted on display. Use `useWeightDisplay()` hook for formatting.

**Navigation Structure:**

```
app/
├── _layout.tsx              # Root stack navigator
├── (tabs)/                  # Bottom tab navigator
│   ├── _layout.tsx         # Tab configuration
│   ├── index.tsx           # Home tab (with Active Program card)
│   ├── history.tsx         # History tab
│   ├── analytics.tsx       # Analytics tab
│   └── settings.tsx        # Settings tab
├── home/                    # Home stack screens
│   ├── template-list.tsx
│   ├── template-builder.tsx
│   ├── start-workout.tsx    # Supports both templates & program days
│   ├── active-workout.tsx
│   ├── exercise-detail.tsx
│   └── workout-summary.tsx
├── programs/                # Program management screens (NEW)
│   ├── _layout.tsx
│   ├── program-list.tsx
│   ├── program-builder.tsx
│   ├── program-day-editor.tsx
│   └── select-program-day.tsx
└── rest-timer.tsx          # Modal screen

src/
├── features/
│   ├── templates/          # Template system
│   ├── workouts/           # Workout sessions
│   └── programs/           # Multi-day programs (NEW)
│       ├── api/            # programService.ts
│       └── components/     # ProgramCard, ProgramDayCard, etc.
├── lib/
│   └── db/
│       └── repositories/
│           ├── templates.ts
│           ├── sessions.ts
│           └── programs.ts  # NEW
└── stores/                 # Global state

components/                 # Shared UI components (EXISTING)
assets/                     # Static assets (EXISTING)
types.ts                    # Global TypeScript types (EXISTING)
```

---

## Response Format

When ready to implement a phase, acknowledge with:

**"Ready to implement Phase X.Y: [Phase Name]"**

Then proceed with full implementation.

When implementation is complete, respond with:

**"Phase X.Y complete: [Summary of what was implemented]"**

---

## Maintenance

This file should be updated after each phase completion to:

- Mark phase as complete (✅)
- Update "Current Project Status"
- Add any new constraints or learnings
- Reference new planning documents if created
