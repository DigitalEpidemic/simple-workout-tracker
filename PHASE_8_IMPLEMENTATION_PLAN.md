# Phase 8: Multi-Day Program System - Implementation Plan

## Overview

This plan outlines the complete implementation of the multi-day training program system. Programs consist of multiple ordered "days" (e.g., Upper, Lower, Push, Pull) with each day containing its own exercise list. Programs advance sequentially by `current_day_index`, but users can perform any day on any real calendar date.

**Key Principle**: Completing a day logs history and advances the program. Manually selecting a different day does NOT update the sequence.

---

## 1. File Structure Changes

### New Files to Create

```
src/
├── features/
│   └── programs/                           # New feature module
│       ├── api/
│       │   └── programService.ts          # CRUD operations for programs, days, exercises
│       ├── components/
│       │   ├── ProgramCard.tsx            # Program list item display
│       │   ├── ProgramDayCard.tsx         # Day list item display
│       │   └── DayExerciseRow.tsx         # Exercise row in day editor
│       └── hooks/
│           └── useProgramExecution.ts     # Logic for starting/completing program days

app/
├── programs/                               # New program screens
│   ├── _layout.tsx                        # Stack navigator for programs
│   ├── program-list.tsx                   # List all programs
│   ├── program-builder.tsx                # Create/edit program
│   ├── program-day-editor.tsx             # Edit a specific program day
│   └── select-program-day.tsx             # Choose which day to start

src/lib/db/repositories/
└── programs.ts                            # New repository for program queries
```

### Files to Modify

```
types.ts                                   # Add new interfaces
src/lib/db/schema.ts                       # Add new tables
src/lib/db/migrations.ts                   # Add migration 2
app/(tabs)/index.tsx                       # Add "Active Program" card
app/home/start-workout.tsx                 # Support program day selection
app/home/active-workout.tsx                # Track program context
src/lib/db/repositories/sessions.ts        # Add program fields to session
src/stores/workoutStore.ts                 # Track current program day context
app/(tabs)/_layout.tsx                     # Add Programs tab (optional)
```

---

## 2. Database Schema

### New Tables

#### Table: `programs`
Stores multi-day program definitions.

```sql
CREATE TABLE IF NOT EXISTS programs (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_active INTEGER NOT NULL DEFAULT 0,      -- Boolean: 0 or 1 (only one active)
  current_day_index INTEGER NOT NULL DEFAULT 0,  -- Next day to perform (0-based)
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
```

#### Table: `program_days`
Stores individual days within a program.

```sql
CREATE TABLE IF NOT EXISTS program_days (
  id TEXT PRIMARY KEY NOT NULL,
  program_id TEXT NOT NULL,
  day_index INTEGER NOT NULL,                -- 0-based order (Day 0, Day 1, etc.)
  name TEXT NOT NULL,                        -- e.g., "Upper Body", "Lower Body"
  scheduled_weekday INTEGER,                 -- Optional: 0=Sun, 1=Mon, ... (metadata only)
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_program_days_program_id
ON program_days(program_id, day_index);
```

#### Table: `program_day_exercises`
Stores exercises for each program day.

```sql
CREATE TABLE IF NOT EXISTS program_day_exercises (
  id TEXT PRIMARY KEY NOT NULL,
  program_day_id TEXT NOT NULL,
  exercise_name TEXT NOT NULL,
  "order" INTEGER NOT NULL,
  target_sets INTEGER,
  target_reps INTEGER,
  target_weight REAL,
  rest_seconds INTEGER,
  notes TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (program_day_id) REFERENCES program_days(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_program_day_exercises_program_day_id
ON program_day_exercises(program_day_id);
```

#### Table: `program_history`
Tracks which program day was performed and when.

```sql
CREATE TABLE IF NOT EXISTS program_history (
  id TEXT PRIMARY KEY NOT NULL,
  program_id TEXT NOT NULL,
  program_day_id TEXT NOT NULL,
  workout_session_id TEXT NOT NULL,          -- Links to actual workout
  performed_at INTEGER NOT NULL,             -- Unix timestamp
  duration_seconds INTEGER,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE,
  FOREIGN KEY (program_day_id) REFERENCES program_days(id) ON DELETE CASCADE,
  FOREIGN KEY (workout_session_id) REFERENCES workout_sessions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_program_history_program_id
ON program_history(program_id, performed_at DESC);

CREATE INDEX IF NOT EXISTS idx_program_history_workout_session_id
ON program_history(workout_session_id);
```

### Modifications to Existing Tables

#### Update `workout_sessions` table
Add program tracking fields:

```sql
-- Migration will add these columns:
ALTER TABLE workout_sessions ADD COLUMN program_id TEXT;
ALTER TABLE workout_sessions ADD COLUMN program_day_id TEXT;
ALTER TABLE workout_sessions ADD COLUMN program_day_name TEXT;

-- Add foreign keys
-- Note: SQLite doesn't support ADD CONSTRAINT, so this will be done in migration via recreate
```

---

## 3. TypeScript Types

### New Types in `types.ts`

```typescript
/**
 * Program day exercise definition
 */
export interface ProgramDayExercise {
  id: string;
  programDayId: string;
  exerciseName: string;
  order: number;
  targetSets?: number;
  targetReps?: number;
  targetWeight?: number;
  restSeconds?: number;
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

/**
 * Program day - a single day in a multi-day program
 */
export interface ProgramDay {
  id: string;
  programId: string;
  dayIndex: number;                    // 0-based order in program
  name: string;                        // e.g., "Upper Body", "Lower Body"
  scheduledWeekday?: number;           // Optional: 0=Sun, 1=Mon, etc. (metadata only)
  exercises: ProgramDayExercise[];
  createdAt: number;
  updatedAt: number;
}

/**
 * Multi-day training program
 */
export interface Program {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;                   // Only one program can be active
  currentDayIndex: number;             // Next day to perform (0-based)
  days: ProgramDay[];
  createdAt: number;
  updatedAt: number;
}

/**
 * Program history entry - tracks which day was performed
 */
export interface ProgramHistoryEntry {
  id: string;
  programId: string;
  programDayId: string;
  workoutSessionId: string;
  performedAt: number;
  durationSeconds?: number;
  createdAt: number;
}
```

### Update `WorkoutSession` type

Add optional program fields:

```typescript
export interface WorkoutSession {
  id: string;
  templateId?: string;
  templateName?: string;
  programId?: string;              // NEW: If started from program
  programDayId?: string;           // NEW: Which program day
  programDayName?: string;         // NEW: Snapshot of day name
  name: string;
  exercises: Exercise[];
  startTime: number;
  endTime?: number;
  duration?: number;
  notes?: string;
  createdAt: number;
  updatedAt: number;
}
```

---

## 4. Database Layer (Repositories)

### New File: `src/lib/db/repositories/programs.ts`

Functions to implement:

```typescript
// Program CRUD
export async function createProgram(program: Omit<Program, 'days'>): Promise<void>
export async function updateProgram(id: string, updates: Partial<Program>): Promise<void>
export async function deleteProgram(id: string): Promise<void>
export async function getAllPrograms(): Promise<Program[]>
export async function getProgramById(id: string): Promise<Program | null>
export async function getActiveProgram(): Promise<Program | null>
export async function setActiveProgram(id: string): Promise<void>

// Program Day CRUD
export async function createProgramDay(day: Omit<ProgramDay, 'exercises'>): Promise<void>
export async function updateProgramDay(id: string, updates: Partial<ProgramDay>): Promise<void>
export async function deleteProgramDay(id: string): Promise<void>
export async function getProgramDaysByProgramId(programId: string): Promise<ProgramDay[]>
export async function getProgramDayById(id: string): Promise<ProgramDay | null>

// Program Day Exercise CRUD
export async function createProgramDayExercise(exercise: ProgramDayExercise): Promise<void>
export async function updateProgramDayExercise(id: string, updates: Partial<ProgramDayExercise>): Promise<void>
export async function deleteProgramDayExercise(id: string): Promise<void>
export async function getProgramDayExercisesByDayId(dayId: string): Promise<ProgramDayExercise[]>

// Program Execution
export async function advanceProgramDay(programId: string): Promise<void>
export async function logProgramHistory(entry: Omit<ProgramHistoryEntry, 'id' | 'createdAt'>): Promise<void>
export async function getProgramHistory(programId: string): Promise<ProgramHistoryEntry[]>

// Query Helpers
export async function getNextProgramDay(programId: string): Promise<ProgramDay | null>
export async function getProgramWithDaysAndExercises(programId: string): Promise<Program | null>
```

### Update: `src/lib/db/repositories/sessions.ts`

Add program context when creating/completing sessions:

```typescript
// Update createWorkoutSession to accept optional program fields
export async function createWorkoutSession(
  session: Omit<WorkoutSession, 'exercises' | 'createdAt' | 'updatedAt'>,
  programContext?: {
    programId: string;
    programDayId: string;
    programDayName: string;
  }
): Promise<void>

// Update completeWorkoutSession to log program history
export async function completeWorkoutSession(
  id: string,
  endTime: number,
  duration: number
): Promise<void> {
  // ... existing logic ...

  // If this was a program workout, log history and advance day
  const session = await getWorkoutSessionById(id);
  if (session?.programId && session?.programDayId) {
    await logProgramHistory({
      programId: session.programId,
      programDayId: session.programDayId,
      workoutSessionId: id,
      performedAt: endTime,
      durationSeconds: duration,
    });

    await advanceProgramDay(session.programId);
  }
}
```

---

## 5. Service Layer

### New File: `src/features/programs/api/programService.ts`

Higher-level business logic wrapping repository functions:

```typescript
import { Program, ProgramDay, ProgramDayExercise } from '@/types';
import * as programRepo from '@/src/lib/db/repositories/programs';

// Program Management
export async function fetchAllPrograms(): Promise<Program[]>
export async function fetchProgramById(id: string): Promise<Program | null>
export async function saveProgram(program: Omit<Program, 'days'>): Promise<void>
export async function removeProgram(id: string): Promise<void>
export async function activateProgram(id: string): Promise<void>

// Program Day Management
export async function saveProgramDay(programId: string, day: Partial<ProgramDay>): Promise<void>
export async function removeProgramDay(dayId: string): Promise<void>
export async function reorderProgramDays(programId: string, dayIds: string[]): Promise<void>

// Program Day Exercise Management
export async function saveProgramDayExercise(dayId: string, exercise: Partial<ProgramDayExercise>): Promise<void>
export async function removeProgramDayExercise(exerciseId: string): Promise<void>
export async function reorderDayExercises(dayId: string, exerciseIds: string[]): Promise<void>

// Program Execution
export async function getActiveProgramInfo(): Promise<{
  program: Program | null;
  nextDay: ProgramDay | null;
} | null>

export async function startProgramDay(
  programId: string,
  programDayId: string
): Promise<{
  sessionId: string;
  exercises: ProgramDayExercise[];
}>

// Manually select a different day (doesn't update current_day_index)
export async function startCustomProgramDay(
  programId: string,
  programDayId: string
): Promise<{
  sessionId: string;
  exercises: ProgramDayExercise[];
}>
```

---

## 6. State Management

### Update: `src/stores/workoutStore.ts`

Add program context to active workout state:

```typescript
interface WorkoutStore {
  // ... existing fields ...

  // Program context (if current workout is from a program)
  programId?: string;
  programDayId?: string;
  programDayName?: string;

  // Actions
  setProgramContext: (programId: string, programDayId: string, programDayName: string) => void;
  clearProgramContext: () => void;
}
```

---

## 7. Navigation Changes

### Option A: Add Programs Tab to Bottom Navigation

Update `app/(tabs)/_layout.tsx` to add a new tab:

```typescript
<Tabs.Screen
  name="programs"
  options={{
    title: 'Programs',
    tabBarIcon: ({ color }) => <IconSymbol name="list.dash" color={color} />,
  }}
/>
```

Create `app/(tabs)/programs.tsx` that links to program list.

### Option B: Keep Programs in Home Stack

Add program screens to home stack navigation:
- Link from Home screen to Programs
- Programs use same stack as templates

**Recommendation**: Use Option B for minimal UI changes. Add "Manage Programs" button on Home screen.

---

## 8. New Screens/Components

### Screen: `app/programs/program-list.tsx`

**Purpose**: List all programs, show which is active, allow create/edit/delete.

**Features**:
- Display all programs
- Highlight active program
- "Create Program" button
- Tap program to edit
- Swipe to delete
- Long press to activate

**Data Flow**:
```
Screen → programService.fetchAllPrograms() → Display list
Activate → programService.activateProgram(id) → Refresh
Delete → programService.removeProgram(id) → Refresh
```

---

### Screen: `app/programs/program-builder.tsx`

**Purpose**: Create or edit a program and its days.

**Features**:
- Input: Program name, description
- List of program days
- Add/remove/reorder days
- Tap day to edit exercises
- Save program

**Data Flow**:
```
Load → programService.fetchProgramById(id) if editing
Add Day → Navigate to program-day-editor
Save → programService.saveProgram() → Navigate back
```

**Note**: This screen is the "overview" for the program. Days are edited on separate screen.

---

### Screen: `app/programs/program-day-editor.tsx`

**Purpose**: Edit exercises for a specific program day.

**Features**:
- Display day name (editable)
- List exercises for this day
- Add/remove/reorder exercises
- Exercise inputs: name, sets, reps, weight, rest time
- Save day

**Data Flow**:
```
Load → programRepo.getProgramDayById(dayId) + exercises
Add Exercise → Create ProgramDayExercise
Save → programService.saveProgramDay() → Navigate back
```

**UI**: Very similar to `template-builder.tsx` but for a single program day.

---

### Screen: `app/programs/select-program-day.tsx`

**Purpose**: Let user choose which program day to perform (override next day).

**Features**:
- Display all days in the program
- Highlight the "Next Day" (based on current_day_index)
- Allow selecting any day
- "Start Workout" button

**Data Flow**:
```
Load → programService.fetchProgramById(programId)
Select Day → Navigate to start-workout with programDayId
```

**Called From**: Home screen when user taps "Choose Different Day" for active program.

---

### Update Screen: `app/(tabs)/index.tsx` (Home)

**Changes**:
- Add "Active Program" section at top (if a program is active)
- Show program name and next day name
- Buttons:
  - "Start Next Day" (starts current_day_index day)
  - "Choose Different Day" (navigates to select-program-day)
- Add "Manage Programs" button in Quick Actions section

**Data Flow**:
```
Load → programService.getActiveProgramInfo()
Display → Program name + Next day name
Start Next Day → Navigate to start-workout with programDayId
Choose Different Day → Navigate to select-program-day
```

---

### Update Screen: `app/home/start-workout.tsx`

**Changes**:
- Accept optional query params: `programId`, `programDayId`
- If provided, load exercises from program day instead of template
- Display program context in UI ("Starting: Upper Body - Push/Pull/Legs")
- Pass program context to workout session creation

**Data Flow**:
```
If programDayId provided:
  → Load programRepo.getProgramDayById(programDayId)
  → Load exercises for that day
  → Create workout with program context
Else:
  → Use existing template flow
```

---

### Update Screen: `app/home/active-workout.tsx`

**Changes**:
- Display program context if present (small banner at top)
- No functional changes to workout execution
- Program context stored in workoutStore

---

### Component: `src/features/programs/components/ProgramCard.tsx`

**Purpose**: Display a program in the program list.

**Props**:
```typescript
interface ProgramCardProps {
  program: Program;
  isActive: boolean;
  onPress: () => void;
  onActivate: () => void;
  onDelete: () => void;
}
```

**UI**:
- Program name (bold if active)
- Description
- Number of days
- Active badge (if isActive)
- Actions: Edit, Activate, Delete

---

### Component: `src/features/programs/components/ProgramDayCard.tsx`

**Purpose**: Display a program day in the day list.

**Props**:
```typescript
interface ProgramDayCardProps {
  day: ProgramDay;
  isNextDay: boolean;
  onPress: () => void;
  onDelete: () => void;
}
```

**UI**:
- Day name
- Day index (Day 1, Day 2, etc.)
- Number of exercises
- "Next" badge (if isNextDay)
- Actions: Edit, Delete

---

### Component: `src/features/programs/components/DayExerciseRow.tsx`

**Purpose**: Display/edit exercise in program day editor.

**Props**:
```typescript
interface DayExerciseRowProps {
  exercise: ProgramDayExercise;
  onUpdate: (exercise: ProgramDayExercise) => void;
  onDelete: () => void;
}
```

**UI**: Similar to template exercise rows.

---

## 9. Core Logic Flow

### Starting a Program Workout

#### Flow 1: Start Next Day (Default)

```
User taps "Start Next Day" on Home
  ↓
Load active program → programService.getActiveProgramInfo()
  ↓
Get program.currentDayIndex → Find day at that index
  ↓
Navigate to start-workout?programDayId={dayId}&programId={programId}
  ↓
start-workout loads exercises from program_day_exercises
  ↓
User taps "Begin Workout"
  ↓
Create workout_session with programId, programDayId, programDayName
  ↓
Navigate to active-workout
```

#### Flow 2: Choose Different Day (Manual Selection)

```
User taps "Choose Different Day" on Home
  ↓
Navigate to select-program-day?programId={programId}
  ↓
Display all days in program, highlight next day
  ↓
User selects a day
  ↓
Navigate to start-workout?programDayId={dayId}&programId={programId}
  ↓
... (same as Flow 1 from here)
```

**Important**: Manually choosing a different day does NOT update `current_day_index`. The index only advances when a workout is completed.

---

### Completing a Program Workout

```
User completes workout → Taps "Finish Workout"
  ↓
workoutStore has programId, programDayId, programDayName
  ↓
Call completeWorkoutSession(sessionId, endTime, duration)
  ↓
Inside completeWorkoutSession:
  - Update workout_sessions table (set end_time, duration)
  - IF programId exists:
    ↓
    Insert into program_history (programId, programDayId, workoutSessionId, performedAt)
    ↓
    Call advanceProgramDay(programId)
      ↓
      Get current_day_index from programs table
      ↓
      Get total number of days
      ↓
      Increment: newIndex = (current_day_index + 1) % totalDays
      ↓
      Update programs.current_day_index = newIndex
  ↓
Navigate to workout-summary
```

**Result**: Next time user starts a program workout, the next day will be loaded.

---

### Program Day Progression Example

**Program**: Upper/Lower Split
- Day 0: Upper Body
- Day 1: Lower Body

**Initial State**: `current_day_index = 0`

1. User starts program → loads Day 0 (Upper Body)
2. User completes workout → `current_day_index = 1`
3. User starts program → loads Day 1 (Lower Body)
4. User completes workout → `current_day_index = 0` (wraps around)
5. User starts program → loads Day 0 (Upper Body) again

**If User Manually Chooses Day 1 in Step 1**:
- User starts Day 1 (Lower Body)
- User completes workout → `current_day_index` still advances from 0 to 1
- Next workout will be Day 1 again (because index is now 1)
  - **Actually**: This is a design choice. Should manually selecting a day treat it as "the day at current_day_index"? Or should it complete whatever day they selected?

**Design Decision Needed**: When user manually selects a day:
  - **Option A**: Treat it as completing that specific day, advance based on that day's index
  - **Option B**: Treat it as completing the "current_day_index" day, advance normally
  - **Option C**: Do not advance at all (user must do next day to advance)

**Recommendation**: **Option A** - The day they complete determines progression. If they skip ahead, the sequence follows from there.

---

## 10. Migration Strategy

### Migration 2: Add Program Tables

File: `src/lib/db/migrations.ts`

Update `CURRENT_DB_VERSION` to `2`.

Add `migration2` function:

```typescript
const migration2: Migration = async (db: SQLite.SQLiteDatabase) => {
  console.log('Running migration 2: Add program tables');

  // Create programs table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS programs (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      is_active INTEGER NOT NULL DEFAULT 0,
      current_day_index INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);

  // Create program_days table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS program_days (
      id TEXT PRIMARY KEY NOT NULL,
      program_id TEXT NOT NULL,
      day_index INTEGER NOT NULL,
      name TEXT NOT NULL,
      scheduled_weekday INTEGER,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE
    );
  `);

  // Create program_day_exercises table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS program_day_exercises (
      id TEXT PRIMARY KEY NOT NULL,
      program_day_id TEXT NOT NULL,
      exercise_name TEXT NOT NULL,
      "order" INTEGER NOT NULL,
      target_sets INTEGER,
      target_reps INTEGER,
      target_weight REAL,
      rest_seconds INTEGER,
      notes TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (program_day_id) REFERENCES program_days(id) ON DELETE CASCADE
    );
  `);

  // Create program_history table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS program_history (
      id TEXT PRIMARY KEY NOT NULL,
      program_id TEXT NOT NULL,
      program_day_id TEXT NOT NULL,
      workout_session_id TEXT NOT NULL,
      performed_at INTEGER NOT NULL,
      duration_seconds INTEGER,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE,
      FOREIGN KEY (program_day_id) REFERENCES program_days(id) ON DELETE CASCADE,
      FOREIGN KEY (workout_session_id) REFERENCES workout_sessions(id) ON DELETE CASCADE
    );
  `);

  // Add indexes
  await db.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_program_days_program_id
    ON program_days(program_id, day_index);
  `);

  await db.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_program_day_exercises_program_day_id
    ON program_day_exercises(program_day_id);
  `);

  await db.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_program_history_program_id
    ON program_history(program_id, performed_at DESC);
  `);

  await db.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_program_history_workout_session_id
    ON program_history(workout_session_id);
  `);

  // Modify workout_sessions table to add program fields
  // SQLite doesn't support ADD COLUMN with FOREIGN KEY, so we do it without FK
  await db.execAsync(`
    ALTER TABLE workout_sessions ADD COLUMN program_id TEXT;
  `);

  await db.execAsync(`
    ALTER TABLE workout_sessions ADD COLUMN program_day_id TEXT;
  `);

  await db.execAsync(`
    ALTER TABLE workout_sessions ADD COLUMN program_day_name TEXT;
  `);

  console.log('Migration 2 complete');
};
```

Add to migrations array:
```typescript
const migrations: Migration[] = [
  migration1,
  migration2,
];
```

---

## 11. Implementation Order

Follow this order to ensure dependencies are met:

### Step 1: Database Foundation (Core Data)
1. Update `types.ts` with new interfaces
2. Update `src/lib/db/schema.ts` (add table definitions to exports for documentation)
3. Update `src/lib/db/migrations.ts` (add migration 2)
4. Create `src/lib/db/repositories/programs.ts` (repository layer)
5. Test migration by restarting app

### Step 2: Service Layer (Business Logic)
6. Create `src/features/programs/api/programService.ts`
7. Update `src/stores/workoutStore.ts` (add program context)
8. Update `src/lib/db/repositories/sessions.ts` (add program fields)

### Step 3: UI Components (Reusable Parts)
9. Create `src/features/programs/components/ProgramCard.tsx`
10. Create `src/features/programs/components/ProgramDayCard.tsx`
11. Create `src/features/programs/components/DayExerciseRow.tsx`

### Step 4: Program Management Screens (CRUD)
12. Create `app/programs/_layout.tsx`
13. Create `app/programs/program-list.tsx`
14. Create `app/programs/program-builder.tsx`
15. Create `app/programs/program-day-editor.tsx`

### Step 5: Program Execution Screens (Workout Flow)
16. Create `app/programs/select-program-day.tsx`
17. Update `app/(tabs)/index.tsx` (add active program card)
18. Update `app/home/start-workout.tsx` (support program context)
19. Update `app/home/active-workout.tsx` (display program context)

### Step 6: History Integration
20. Update `app/history/workout-detail.tsx` (show program day name)
21. Update `app/(tabs)/analytics.tsx` (optional: filter by program)

### Step 7: Testing & Polish
22. Test program creation
23. Test day creation and exercise management
24. Test program activation
25. Test starting next day
26. Test manual day selection
27. Test workout completion and day advancement
28. Test wrap-around (last day → first day)
29. Test history tracking

---

## 12. Edge Cases & Considerations

### 1. Deleting a Program
- If program is active, deactivate it first
- CASCADE deletes: program_days, program_day_exercises, program_history
- Workout sessions remain (program fields become NULL or are preserved as history)

### 2. Only One Active Program
- When activating a program, deactivate all others
- SQL: `UPDATE programs SET is_active = 0` then `UPDATE programs SET is_active = 1 WHERE id = ?`

### 3. Reordering Days
- Update `day_index` for affected days
- Ensure no gaps in sequence (0, 1, 2, ...)
- Recalculate if current_day_index is out of bounds

### 4. Empty Program (No Days)
- Prevent activation if program has no days
- Show warning in UI

### 5. Manually Selecting Same Day as Next Day
- Treat as normal execution
- No special logic needed

### 6. User Deletes a Day That Is Current
- If current_day_index >= new total days, reset to 0
- Handle in `deleteProgramDay()` function

### 7. Migration Safety
- Migration 2 runs on existing databases
- workout_sessions gets new nullable columns
- Existing sessions have NULL program fields (backwards compatible)

### 8. Program vs Template Coexistence
- User can still create/use templates
- Templates and programs are independent
- Home screen shows both options

---

## 13. UI/UX Guidelines

### Minimal and Clean
- Use existing UI components from `components/ui/`
- Follow same styling patterns as templates
- Use `ThemedView`, `ThemedText`, `IconSymbol`

### Program Card Design
```
┌────────────────────────────────────┐
│ 🎯 Upper/Lower Split      [ACTIVE] │
│ Push and pull focus                │
│ 2 days • Next: Upper Body          │
└────────────────────────────────────┘
```

### Active Program Card on Home
```
┌────────────────────────────────────┐
│ ACTIVE PROGRAM                     │
│ Upper/Lower Split                  │
│ Next: Day 1 - Upper Body          │
│                                    │
│ [Start Next Day] [Choose Day]     │
└────────────────────────────────────┘
```

### Program Day List
```
┌────────────────────────────────────┐
│ Day 1: Upper Body          [NEXT]  │
│ 5 exercises                        │
└────────────────────────────────────┘
┌────────────────────────────────────┐
│ Day 2: Lower Body                  │
│ 4 exercises                        │
└────────────────────────────────────┘
```

### Choosing a Day
```
SELECT PROGRAM DAY

┌────────────────────────────────────┐
│ Day 1: Upper Body          [NEXT]  │ ← Highlighted
│ 5 exercises                        │
└────────────────────────────────────┘
┌────────────────────────────────────┐
│ Day 2: Lower Body                  │
│ 4 exercises                        │
└────────────────────────────────────┘

                [Start Workout]
```

---

## 14. Testing Checklist

### Program Management
- [ ] Create a new program
- [ ] Edit program name and description
- [ ] Delete a program
- [ ] Activate a program (deactivates others)
- [ ] Cannot activate program with no days

### Day Management
- [ ] Add day to program
- [ ] Edit day name
- [ ] Delete day from program
- [ ] Reorder days (drag and drop or up/down buttons)

### Exercise Management
- [ ] Add exercise to day
- [ ] Edit exercise (name, sets, reps, weight)
- [ ] Delete exercise from day
- [ ] Reorder exercises within day

### Program Execution
- [ ] Start next program day from home
- [ ] Choose different day manually
- [ ] Exercises load correctly from program day
- [ ] Workout session tracks program context
- [ ] Complete workout advances day index
- [ ] Day index wraps around at end of program

### History
- [ ] Program history is logged
- [ ] Workout detail shows program day name
- [ ] Analytics (if updated) shows program data

### Edge Cases
- [ ] Delete day that is current day (index resets)
- [ ] Delete last day in program
- [ ] Manually select last day, complete it (wraps to first)
- [ ] Multiple programs exist, only one active
- [ ] Templates still work independently

---

## 15. Open Questions for User

Before implementation, please confirm:

1. **Manual Day Selection Behavior**: When user manually selects a different day (not the next day), should completing that workout:
   - **A**: Advance from that day's index (skip ahead in sequence)
   - **B**: Advance from current_day_index regardless of which day they did
   - **C**: Not advance at all (only completing next day advances)

   **Recommendation**: Option A (advance based on completed day)

2. **Navigation**: Should Programs have their own tab, or live in Home stack?
   - **A**: New "Programs" tab in bottom navigation
   - **B**: "Manage Programs" button on Home screen → program-list

   **Recommendation**: Option B (keep Home as central hub)

3. **Scheduled Weekdays**: The schema includes `scheduled_weekday` field. Should the UI:
   - **A**: Show it as metadata only (no enforcement)
   - **B**: Skip it for now (add later if needed)

   **Recommendation**: Option B (YAGNI - add if needed)

4. **Program Priority**: Should active program replace template quick actions on home, or coexist?
   - **A**: Active program card appears at top, templates below
   - **B**: Active program replaces "Quick Start" section

   **Recommendation**: Option A (show both, program at top)

---

## Summary

This plan provides:
- Complete database schema (4 new tables)
- Full TypeScript type definitions
- Repository and service layer architecture
- UI component and screen specifications
- Navigation structure
- Step-by-step implementation order
- Testing checklist
- UX guidelines for minimal, clean design

**Total New Files**: ~15
**Modified Files**: ~8
**Estimated Complexity**: High (full feature implementation)

Once you confirm the open questions and approve this plan, I'll proceed with implementation following the defined order.
