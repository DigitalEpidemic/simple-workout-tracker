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
- 📋 Calendar view
- 📋 PR tracking (1-12 reps)
- 📋 Analytics (graphs, volume, PR timeline)

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
- **4.2** ⏳ Calendar view
- **4.3** ⏳ Exercise history + previous set autofill
- **4.4** ⏳ Analytics charts
- **4.5** ⏳ PR system
- **4.6** ⏳ User settings (weight unit toggle: lbs/kg, default rest timer)

### Phase 5 – Sync
- **5.1** ⏳ Firebase setup
- **5.2** ⏳ Offline sync queue
- **5.3** ⏳ Manual sync UI
- **5.4** ⏳ Conflict resolution rules

### Phase 6 – UI Polish
- **6.1** ⏳ Haptics, animations, visual improvements

### Phase 7 – Testing & Deployment
- **7.1** ⏳ Unit tests, E2E tests, release builds

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
- ❌ Do not use "kg" for weight units - use "lbs" until Phase 4.6 implements user settings

---

## Planning Documents Reference

**Must consult before implementing:**

1. **`types.ts`** - All TypeScript interfaces (already defined)
2. **`project_plan/0.2-screens-and-navigation.md`** - Screen definitions and navigation structure
3. **`project_plan/0.3-mvp-vs-extended-features.md`** - Feature scope (MVP vs extended)
4. **`project_plan/1.1-folder-structure.md`** - Bulletproof React architecture

---

## Current Project Status

**Last Completed Phase:** 4.1 (Workout history)

**Next Phase:** 4.2 (Calendar view)

**Architecture:**
- **Routing:** Expo Router (file-based routing) in `app/` directory
- **Business Logic:** Feature modules in `src/features/`
- **Shared Code:** `src/lib/` and `src/stores/`
- **UI Components:** Top-level `components/` folder
- **Theme System:** `constants/theme.ts` with design tokens and UI primitives in `components/ui/`
- **Weight Units:** Currently hardcoded to **lbs** throughout the app until Phase 4.6 implements user settings for weight unit toggle

**Navigation Structure:**
```
app/
├── _layout.tsx              # Root stack navigator
├── (tabs)/                  # Bottom tab navigator
│   ├── _layout.tsx         # Tab configuration
│   ├── index.tsx           # Home tab
│   ├── history.tsx         # History tab
│   ├── analytics.tsx       # Analytics tab
│   └── settings.tsx        # Settings tab
├── home/                    # Home stack screens
│   ├── template-list.tsx
│   ├── template-builder.tsx
│   ├── start-workout.tsx
│   ├── active-workout.tsx
│   ├── exercise-detail.tsx
│   └── workout-summary.tsx
└── rest-timer.tsx          # Modal screen

src/
├── features/               # Business logic
├── lib/                    # Utilities and database
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
