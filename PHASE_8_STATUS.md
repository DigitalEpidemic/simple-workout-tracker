# Phase 8: Multi-Day Programs - Implementation Status

## ✅ COMPLETED - Foundation & Placeholders

### Database Layer (100% Complete)
- ✅ **4 new TypeScript interfaces** in [types.ts](types.ts)
  - `Program`, `ProgramDay`, `ProgramDayExercise`, `ProgramHistoryEntry`
  - Updated `WorkoutSession` with program fields (lines 73-75)
- ✅ **4 new database tables** in [schema.ts](src/lib/db/schema.ts)
  - `programs`, `program_days`, `program_day_exercises`, `program_history`
  - Proper indexes and foreign keys
- ✅ **Migration 2** in [migrations.ts](src/lib/db/migrations.ts)
  - DB version bumped to 2
  - Adds program tables and 3 new columns to `workout_sessions`
  - Will run automatically on next app start

### Repository Layer (100% Complete)
- ✅ **[programs.ts](src/lib/db/repositories/programs.ts)** - Full CRUD repository (550+ lines)
  - Program management: create, update, delete, activate, getAll, getById
  - Day management: create, update, delete, reorder, getByProgramId
  - Exercise management: create, update, delete, reorder, getByDayId
  - Execution: advanceProgramDay, getNextProgramDay, logProgramHistory
- ✅ **Updated [sessions.ts](src/lib/db/repositories/sessions.ts)**
  - Modified `createSession` to accept program fields (line 240)
  - Modified `completeSession` to auto-log history and advance day (lines 337-351)

### Service Layer (100% Complete)
- ✅ **[programService.ts](src/features/programs/api/programService.ts)** - Business logic
  - Program: fetchAll, fetchById, create, update, remove, activate
  - Day: add, update, remove, reorder
  - Exercise: add, update, remove, reorder
  - Execution: getActiveProgram, getActiveProgramInfo, getProgramHistory

### UI Components (100% Complete)
- ✅ **[ProgramCard.tsx](src/features/programs/components/ProgramCard.tsx)**
  - Displays program with active badge, day count, next day info
- ✅ **[ProgramDayCard.tsx](src/features/programs/components/ProgramDayCard.tsx)**
  - Displays day with "NEXT" indicator, exercise count
- ✅ **[DayExerciseRow.tsx](src/features/programs/components/DayExerciseRow.tsx)**
  - Displays exercise with targets, rest time, notes

### Screens (Placeholders Created)
- ✅ **[program-list.tsx](app/programs/program-list.tsx)** - Lists all programs (loads data, shows "Coming Soon")
- ✅ **[program-builder.tsx](app/programs/program-builder.tsx)** - Create/edit program (placeholder)
- ✅ **[program-day-editor.tsx](app/programs/program-day-editor.tsx)** - Edit day exercises (placeholder)
- ✅ **[select-program-day.tsx](app/programs/select-program-day.tsx)** - Choose day (placeholder)

### Integration (Placeholders Added)
- ✅ **[Home screen](app/(tabs)/index.tsx:175-183)** - "Manage Programs" button added
- ✅ **[start-workout.tsx](app/home/start-workout.tsx:45-59)** - Accepts programDayId param with TODO
- ✅ **[active-workout.tsx](app/home/active-workout.tsx:390-394)** - Displays program day name if present

---

## ⏳ TODO - Full Screen Implementation

All placeholder screens need full implementation. Each screen has clear TODOs and follows existing patterns.

### 1. Program List Screen (`app/programs/program-list.tsx`)
**TODO:**
- Load programs with day counts
- Implement activate program (with validation: must have days)
- Implement delete program (with confirmation)
- Navigate to program-builder for create/edit

**Pattern:** Similar to [template-list.tsx](app/home/template-list.tsx)

---

### 2. Program Builder Screen (`app/programs/program-builder.tsx`)
**TODO:**
- Text inputs for program name & description
- List of program days (draggable to reorder)
- Add/delete day buttons
- Tap day to navigate to day editor
- Save program button

**Pattern:** Similar to [template-builder.tsx](app/home/template-builder.tsx) but for days instead of exercises

**Data Flow:**
```typescript
// Loading existing program
const program = await fetchProgramById(programId);
setDays(program.days);

// Adding a new day
const newDay = await addProgramDay(programId, "Upper Body");
setDays([...days, newDay]);

// Saving
await updateExistingProgram(programId, name, description);
```

---

### 3. Program Day Editor Screen (`app/programs/program-day-editor.tsx`)
**TODO:**
- Text input for day name
- List of exercises (draggable to reorder)
- Add exercise modal (name, sets, reps, weight, rest time, notes)
- Edit exercise (tap to open modal)
- Delete exercise (swipe)
- Save button

**Pattern:** Nearly identical to [template-builder.tsx](app/home/template-builder.tsx)

**Data Flow:**
```typescript
// Load day
const day = await getProgramDayById(dayId);
setExercises(day.exercises);

// Add exercise
const exercise = await addProgramDayExercise(dayId, {
  exerciseName: name,
  targetSets: 3,
  targetReps: 10,
  targetWeight: 135,
  restSeconds: 90,
});

// Reorder
await reorderProgramDayExercises(newOrderedIds);
```

---

### 4. Select Program Day Screen (`app/programs/select-program-day.tsx`)
**TODO:**
- Load active program
- Display all days using `ProgramDayCard`
- Highlight next day (based on `currentDayIndex`)
- Tap day to navigate to start-workout with params

**Data Flow:**
```typescript
const info = await getActiveProgramInfo();
const { program, nextDay } = info;

// On day selection
router.push(`/home/start-workout?programId=${programId}&programDayId=${dayId}`);
```

---

### 5. Start Workout Screen Integration (`app/home/start-workout.tsx`)
**TODO (lines 45-59):**
```typescript
// Load program day instead of template
if (programDayId) {
  const day = await getProgramDayById(programDayId);

  // Convert to template-like format for display
  const templateLike = {
    name: day.name,
    exercises: day.exercises.map(e => ({
      name: e.exerciseName,
      targetSets: e.targetSets,
      targetReps: e.targetReps,
      targetWeight: e.targetWeight,
      // ... etc
    }))
  };

  // On start, pass program context to startWorkoutFromTemplate
  // or create new function startWorkoutFromProgramDay
}
```

**Important:** When creating workout session, pass `programId`, `programDayId`, `programDayName` fields.

---

### 6. Active Program Card on Home Screen (`app/(tabs)/index.tsx`)
**TODO:** Add above "Quick Start" section (before line 151)

```typescript
// Load active program info
const [activeProgram, setActiveProgram] = useState<any>(null);

useEffect(() => {
  loadActiveProgram();
}, []);

async function loadActiveProgram() {
  const info = await getActiveProgramInfo();
  setActiveProgram(info);
}

// In render, before Quick Actions:
{activeProgram && (
  <ThemedView style={styles.section}>
    <ThemedText type="subtitle">Active Program</ThemedText>
    <Card style={styles.programCard}>
      <ThemedText style={styles.programName}>
        {activeProgram.program.name}
      </ThemedText>
      <ThemedText style={styles.nextDay}>
        Next: Day {activeProgram.nextDay.dayIndex + 1} - {activeProgram.nextDay.name}
      </ThemedText>
      <View style={styles.programActions}>
        <Pressable
          onPress={() => router.push(
            `/home/start-workout?programId=${activeProgram.program.id}&programDayId=${activeProgram.nextDay.id}`
          )}
        >
          <ThemedText>Start Next Day</ThemedText>
        </Pressable>
        <Pressable
          onPress={() => router.push(`/programs/select-program-day?programId=${activeProgram.program.id}`)}
        >
          <ThemedText>Choose Different Day</ThemedText>
        </Pressable>
      </View>
    </Card>
  </ThemedView>
)}
```

---

## 🔑 Key Implementation Notes

### Program Execution Flow
1. User activates a program → only one can be active
2. Home shows "Active Program" card with next day
3. User taps "Start Next Day" OR "Choose Different Day"
4. Exercises load from program day
5. User completes workout
6. **Automatic:** Program history logged + day advances + wraps around at end

### Day Advancement Logic (IMPLEMENTED in sessions.ts:337-351)
```typescript
// When workout completes:
if (session.programId && session.programDayId) {
  await logProgramHistory({
    programId: session.programId,
    programDayId: session.programDayId,
    workoutSessionId: id,
    performedAt: endTime,
    durationSeconds: duration,
  });

  await advanceProgramDay(session.programId);
  // ^ This increments current_day_index and wraps around
}
```

### Important Design Decisions (Confirmed)
- ✅ Manual day selection: Completing that day advances from that day's index (Option A)
- ✅ Navigation: Programs via "Manage Programs" button, no separate tab (Option B)
- ✅ Scheduled weekdays: Skipped for now (Option B - YAGNI)
- ✅ Home layout: Active program at top, templates below (Option A)

---

## 🧪 Testing the Migration

1. **Start the app** - Migration 2 will run automatically
2. **Check logs** for "Running migration 2: Add program tables"
3. **Verify tables created:**
   - Open SQLite database in viewer
   - Confirm: `programs`, `program_days`, `program_day_exercises`, `program_history`
   - Confirm: `workout_sessions` has 3 new nullable columns

4. **Test program list screen:**
   - Navigate to Home → "Manage Programs"
   - Should show empty state
   - No crashes

---

## 📊 Progress Summary

| Component | Status | Lines of Code |
|-----------|--------|---------------|
| Database Schema | ✅ Complete | ~270 |
| Migration | ✅ Complete | ~110 |
| Repository Layer | ✅ Complete | ~550 |
| Service Layer | ✅ Complete | ~320 |
| UI Components | ✅ Complete | ~450 |
| Placeholder Screens | ✅ Complete | ~200 |
| Integration TODOs | ✅ Added | ~50 |
| **TOTAL** | **✅ Foundation Done** | **~1,950 lines** |

**Remaining:** ~500-800 lines for full screen implementations

---

## Next Steps

1. **Test database migration** (restart app, check logs)
2. **Implement program-list screen** (CRUD operations)
3. **Implement program-builder screen** (manage days)
4. **Implement program-day-editor screen** (manage exercises)
5. **Implement select-program-day screen** (choose day)
6. **Complete start-workout integration** (load program day)
7. **Complete home screen integration** (active program card)
8. **End-to-end testing**

All TODOs are clearly marked with "TODO Phase 8" or "TODO:" comments in the code.
