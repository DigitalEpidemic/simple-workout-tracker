✅ Core Requirements (Based on What You Want)
Your multi-day program system must support:

1. Programs with multiple “days”

Example:
Day 1: Upper Body
Day 2: Lower Body
Day 3: Arms
etc.

Each “day” belongs to a program and has its own list of exercises.

2. Users can perform the next program day on any date

This is crucial:

- The calendar day does not matter.
- Program days are sequential, NOT tied to real calendar days.

Examples:

- Upper = Monday in the template, but user can run it Sunday.
- Lower = Wednesday in the template, but user can run it Tuesday.
  The schedule is logical, not date-bound.

3. When the user completes a program day, the next one becomes “current”

Example:

- Completed “Upper” → next day is “Lower”.
- Completed “Lower” → next day is “Arms”.
  When reaching the end, loop or stop depending on program settings.

4. User can override and choose any day manually
   At the gym something is taken → the user chooses another day’s exercises.

5. Historical tracking of which program day was performed & when

Needed for analytics and progression:

- Program ID
- Day ID
- Date performed
- Exercises & sets done

🧠 Architectural Model (Recommended & battle-tested)

Here is the exact schema I recommend. This is designed to be easy to query and perfect for SQLite.

📦 Database Schema (SQLite)
Programs Table

Each multi-day program (e.g., “Upper/Lower Split”, “PPL”, “5-Day Strength”)

```
programs(
  id PK,
  name TEXT,
  description TEXT,
  is_active INTEGER (boolean),
  current_day_index INTEGER
)
```

current_day_index tracks which program day is next to run.

ProgramDays Table
Each “Day” in the program (Upper Day, Lower Day, Push Day, etc.)

```
program_days(
  id PK,
  program_id FK,
  day_index INTEGER,     -- 0-based order in the program
  name TEXT,             -- e.g. "Upper Body Day"
  scheduled_weekday INTEGER NULL -- optional: 1=Mon, 2=Tue... (for metadata only)
)
```

scheduled_weekday is purely informational and not enforced.

ProgramDayExercises Table
Same schema you've already designed for templates, just nested under a program day.

```
program_day_exercises(
  id PK,
  program_day_id FK,
  exercise_name TEXT,
  sets INTEGER,
  reps TEXT,     -- string to support "12" or "12-10-8"
  rest_seconds INTEGER,
  rpe INTEGER NULL
)
```

ProgramHistory Table
Records which program day was completed and when.

```
program_history(
  id PK,
  program_id FK,
  program_day_id FK,
  performed_at DATETIME,
  duration_seconds INTEGER
)
```

🔧 Core Logic Flow (What the App Should Do)

1. Starting a workout

When the user taps Start Program:

- Find active program → programs.is_active = true
- Load current_day_index
- Display that day’s list of exercises
- Show option “Choose Different Day”

2. Completing a program day

When the user taps Finish Workout:

1.  Insert record into program_history
2.  Increment programs.current_day_index
3.  If current_day_index ≥ #days, reset to 0 (loop)
    This makes the program auto-progress.

4.  If user chooses a different day
    User taps “Change Day”:

- Show list of all days in the program
- Let them choose one
- This does not change current_day_index

IMPORTANT:
Only after finishing does the logical sequence progress.

4. Date-flexibility logic (what you want)
   There is no date enforcement.

- If programmed for Wednesday but today is Tuesday → allowed
- If user missed a day → the program does not shift backward
- It’s not tied to real-world time

Your logic simply follows:
“Next day in sequence = next day to perform.”

🎨 UI/UX Flow Recommendation

Home Screen

- Active program card → “Continue Program Day: Upper Body”
- Button → “Pick a Different Day”

Program Details Screen
Show all days:

- Upper (Next)
- Lower
- Arms
- Etc.

Workout Screen

- Exercises for the selected day
- When finished:
  - "[✓] Complete Day"
  - Log + advance sequence

💡 Example: Upper/Lower Split (Your Example)

Program
“UL 2-Day Split”

Program Days

- Day 0 → Upper Body
- Day 1 → Lower Body

User flow:

1. Monday → performs Upper
   → current_day_index = 1

2. Wednesday unavailable → performs Lower on Tuesday
   → still valid
   → current_day_index = 0

3. Next workout even a week later → Upper again.

No rules broken.
