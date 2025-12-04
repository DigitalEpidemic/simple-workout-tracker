# Phase 7 - Testing & Code Coverage Plan

## Current Status

**Total Lines of Code:** ~19,000 lines
**Current Coverage:** 37.09% (Statements)
**Test Framework:** Jest + React Native Testing Library
**Coverage Tool:** Jest Coverage (configured with lcov, html, json reports)

---

## Coverage Report Summary

### Overall Statistics

- **Statements:** 37.09%
- **Branches:** 32.76%
- **Functions:** 36.87%
- **Lines:** 36.82%

### Test Infrastructure ✅

- [x] Jest installed and configured
- [x] React Native Testing Library installed
- [x] Code coverage configured
- [x] Test scripts added to package.json
- [x] Mock setup for Expo modules (SQLite, Router, Notifications, Haptics)
- [x] Baseline coverage report generated

---

## Testing Strategy

### Priority Levels

**P0 (Critical)** - Core business logic that affects data integrity:

- Database operations (repositories)
- State management (stores)
- Service layer (API services)
- Utility functions (calculations, validators, formatters)

**P1 (High)** - User-facing features and workflows:

- Workout execution flow
- Template/Program management
- PR tracking
- Analytics calculations

**P2 (Medium)** - UI components with logic:

- Custom hooks
- Complex UI components with state
- Form validation

**P3 (Low)** - Presentational components:

- Simple UI components
- Layout components
- Route components (covered by E2E)

---

## Testing Roadmap

### Phase 7.1 - Core Utilities & Business Logic (P0)

**Target: 80%+ coverage for critical paths**

#### 7.1.1 - Database Layer Testing

**Priority: P0** | **Estimated Coverage Gain: ~2,000 lines**

Files to test:

- `src/lib/db/repositories/templates.ts` (~427 lines)
- `src/lib/db/repositories/sessions.ts` (~533 lines)
- `src/lib/db/repositories/programs.ts` (~646 lines)
- `src/lib/db/repositories/pr-records.ts` (~407 lines)
- `src/lib/db/repositories/settings.ts` (~157 lines)
- `src/lib/db/repositories/sets.ts` (~478 lines)
- `src/lib/db/repositories/analytics.ts` (~332 lines)
- `src/lib/db/helpers.ts` (~94 lines)
- `src/lib/db/migrations.ts` (~292 lines)

Test approach:

- Mock SQLite database operations
- Test CRUD operations for each repository
- Test error handling (constraint violations, not found, etc.)
- Test edge cases (empty results, null values, etc.)
- Test migrations (up/down scenarios)

Example test structure:

```typescript
// src/lib/db/repositories/_tests_/templates.test.ts

describe("Template Repository", () => {
  describe("createTemplate", () => {
    it("should create a new template with exercises");

    it("should throw error when name is missing");

    it("should handle database constraint violations");
  });

  describe("getTemplateById", () => {
    it("should return template with exercises");

    it("should return null when template not found");
  });

  // ... more tests
});
```

#### 7.1.2 - Utility Functions Testing

**Priority: P0** | **Estimated Coverage Gain: ~400 lines**

Files to test:

- `src/lib/utils/calculations.ts` (PR calculations, volume, etc.)
- `src/lib/utils/validators.ts` (input validation)
- `src/lib/utils/formatters.ts` (~173 lines)
- `src/lib/utils/id.ts` (~1 line - simple)

Test approach:

- Test all calculation formulas with known inputs/outputs
- Test edge cases (zero, negative numbers, invalid inputs)
- Test formatters with various units and locales
- Test validators with valid and invalid data

#### 7.1.3 - Store Testing

**Priority: P0** | **Estimated Coverage Gain: ~200 lines**

Files to test:

- `src/stores/workoutStore.ts` (~44 lines)
- `src/stores/settingsStore.ts` (~137 lines)
- `src/stores/timerStore.ts`

Test approach:

- Test state initialization
- Test state updates
- Test persistence (if applicable)
- Test state resets/clear

---

### Phase 7.2 - Service Layer Testing (P0-P1)

**Target: 75%+ coverage**

#### 7.2.1 - Feature Service Testing

**Priority: P0-P1** | **Estimated Coverage Gain: ~900 lines**

Files to test:

- `src/features/templates/api/templateService.ts` (~206 lines)
- `src/features/workouts/api/workoutService.ts` (~114 lines)
- `src/features/workouts/api/prService.ts` (~142 lines)
- `src/features/programs/api/programService.ts` (~373 lines)
- `src/features/history/api/historyService.ts` (~157 lines)
- `src/features/history/api/calendarService.ts` (~103 lines)
- `src/features/history/api/exerciseHistoryService.ts` (~71 lines)

Test approach:

- Mock repository layer
- Test service orchestration logic
- Test business rules
- Test error propagation
- Test transaction handling

---

### Phase 7.3 - Custom Hooks Testing (P1-P2)

**Target: 70%+ coverage**

#### 7.3.1 - Workout Hooks Testing

**Priority: P1** | **Estimated Coverage Gain: ~300 lines**

Files to test:

- `src/features/workouts/hooks/useWorkout.ts` (~27 lines)
- `src/features/workouts/hooks/useExercise.ts` (~152 lines)
- `src/features/workouts/hooks/useTimer.ts` (~56 lines)
- `src/features/history/hooks/useExerciseHistory.ts` (~43 lines)
- `src/hooks/useWeightDisplay.ts` (~50 lines)

Test approach:

- Use `@testing-library/react-hooks` for hook testing
- Mock underlying services/repositories
- Test hook state updates
- Test hook side effects
- Test cleanup on unmount

Example:

```typescript
import { renderHook, act } from "@testing-library/react-hooks";

describe("useWorkout", () => {
  it("should initialize workout state", () => {
    const { result } = renderHook(() => useWorkout());

    expect(result.current.isActive).toBe(false);
  });

  it("should start workout", () => {
    const { result } = renderHook(() => useWorkout());

    act(() => {
      result.current.startWorkout("template-1");
    });

    expect(result.current.isActive).toBe(true);
  });
});
```

---

### Phase 7.4 - Component Testing (P2-P3)

**Target: 60%+ coverage for components with logic**

#### 7.4.1 - UI Component Testing

**Priority: P2** | **Estimated Coverage Gain: ~800 lines**

Files to test (prioritize components with logic):

- `components/ui/button.tsx` (~95 lines)
- `components/ui/input.tsx` (~114 lines)
- `components/ui/card.tsx` (~50 lines)
- `components/ui/badge.tsx` (~93 lines)
- `src/features/templates/components/TemplateCard.tsx` (~75 lines)
- `src/features/programs/components/ProgramCard.tsx` (~88 lines)
- `src/features/programs/components/ProgramDayCard.tsx` (~65 lines)
- `src/features/workouts/components/*` (various)

Test approach:

- Test rendering with different props
- Test user interactions (press, input, etc.)
- Test conditional rendering
- Test accessibility
- Snapshot tests for visual regression

Example:

```typescript
import { render, fireEvent } from "@testing-library/react-native";

describe("Button", () => {
  it("should render with label", () => {
    const { getByText } = render(<Button label="Click me" />);

    expect(getByText("Click me")).toBeTruthy();
  });

  it("should call onPress when pressed", () => {
    const onPress = jest.fn();

    const { getByText } = render(<Button label="Click me" onPress={onPress} />);

    fireEvent.press(getByText("Click me"));

    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
```

#### 7.4.2 - Analytics Components Testing

**Priority: P2** | **Estimated Coverage Gain: ~400 lines**

Files to test:

- `src/features/analytics/components/ExerciseProgressionChart.tsx` (~86 lines)

- `src/features/analytics/components/VolumeChart.tsx` (~70 lines)

- `src/features/analytics/components/PRTimelineChart.tsx` (~80 lines)

- `src/features/analytics/components/ExerciseSelector.tsx` (~169 lines)

- `src/features/analytics/types/filters.ts` (~92 lines)

---

### Phase 7.5 - Integration Testing (P1)

**Target: Cover critical user flows**

#### 7.5.1 - Critical User Flows

**Priority: P1** | **Estimated Coverage Gain: indirect**

Flows to test:

1. **Template Creation Flow**

- Create template → Add exercises → Save → Verify in list

2. **Workout Execution Flow**

- Select template → Start workout → Complete sets → Finish workout → Verify history

3. **Program Creation & Execution Flow**

- Create program → Add days → Add exercises → Activate → Execute day → Verify progression

4. **PR Tracking Flow**

- Complete workout with PR → Verify PR recorded → Check analytics

5. **Settings Flow**

- Change weight unit → Verify display updates across app
- Change rest timer → Verify used in workouts

Test approach:

- Mock database at a higher level
- Test multiple components/services working together
- Verify data flow through the system
- Test error scenarios

---

### Phase 7.6 - Screen/Route Testing (P3)

**Target: 40%+ coverage (mainly integration)**

#### 7.6.1 - Route Component Testing

**Priority: P3** | **Estimated Coverage Gain: ~2,000 lines**

Files (test as integration tests):

- `app/(tabs)/*.tsx` (~850 lines total)
- `app/home/*.tsx` (~1,800 lines total)
- `app/programs/*.tsx` (~900 lines total)
- `app/history/*.tsx` (~800 lines total)

Test approach:

- Focus on navigation flows
- Test error states
- Test loading states
- Mock navigation hooks
- Consider E2E for full screen testing

---

## Testing Guidelines

### General Testing Best Practices

1. **AAA Pattern** - Arrange, Act, Assert
2. **One assertion per test** (when possible)
3. **Descriptive test names** - "should do X when Y"
4. **Test behavior, not implementation**
5. **Mock external dependencies** (SQLite, navigation, etc.)
6. **Avoid test interdependence** - each test should be independent

### Mock Strategy

#### Already Mocked (in jest.setup.js):

- expo-sqlite
- expo-router
- expo-notifications
- expo-haptics
- react-native-chart-kit
- react-native-draggable-flatlist
- react-native-reanimated
- react-native-gesture-handler

#### To Mock Per Test:

- Repository functions (when testing services)
- Service functions (when testing hooks/components)
- Navigation functions (when testing routes)

### Coverage Targets

| Category                    | Target Coverage |
| --------------------------- | --------------- |
| Utilities                   | 90%+            |
| Repositories                | 85%+            |
| Services                    | 80%+            |
| Stores                      | 85%+            |
| Hooks                       | 75%+            |
| Components (with logic)     | 70%+            |
| Components (presentational) | 50%+            |
| Routes                      | 40%+            |
| **Overall Project**         | **60%+**        |

---

## Implementation Order

### Week 1: Foundation (Phase 7.1)

- Set up testing patterns and examples
- Test utilities (calculations, validators, formatters)
- Test core stores

### Week 2: Data Layer (Phase 7.1 cont.)

- Test all repository functions
- Test database migrations
- Test database helpers

### Week 3: Business Logic (Phase 7.2)

- Test all service layer functions
- Test error handling
- Test edge cases

### Week 4: Application Logic (Phase 7.3)

- Test custom hooks
- Test state management integration

### Week 5: UI Layer (Phase 7.4)

- Test UI components with logic
- Test feature components
- Add snapshot tests

### Week 6: Integration & Polish (Phase 7.5-7.6)

---

## Test File Organization

```
src/
├── lib/
│   ├── db/
│   │   ├── repositories/
│   │   │   ├── __tests__/
│   │   │   │   ├── templates.test.ts
│   │   │   │   ├── sessions.test.ts
│   │   │   │   ├── programs.test.ts
│   │   │   │   └── ...
│   │   ├── __tests__/
│   │   │   ├── helpers.test.ts
│   │   │   └── migrations.test.ts
│   ├── utils/
│   │   ├── __tests__/
│   │   │   ├── calculations.test.ts
│   │   │   ├── validators.test.ts
│   │   │   └── formatters.test.ts
├── features/
│   ├── templates/
│   │   ├── api/
│   │   │   └── __tests__/
│   │   │       └── templateService.test.ts
│   │   ├── components/
│   │   │   └── __tests__/
│   │   │       └── TemplateCard.test.tsx
│   │   └── hooks/
│   │       └── __tests__/
├── stores/
│   └── __tests__/
│       ├── workoutStore.test.ts
│       └── settingsStore.test.ts
└── hooks/
    └── __tests__/
        └── useWeightDisplay.test.ts
```

---

## Commands Reference

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage

# Generate coverage and watch
npm run test:coverage:watch

# Run specific test file
npm test -- templates.test.ts

# Run tests for a specific folder
npm test -- src/lib/utils

# View coverage report
open coverage/lcov-report/index.html
```

---

## Coverage Thresholds (Future)

Once baseline coverage is established, add to `jest.config.js`:

```javascript
coverageThreshold: {
  global: {
    branches: 60,
    functions: 65,
    lines: 65,
    statements: 65,
  },
  // Stricter thresholds for critical code
  './src/lib/utils/*.ts': {
    branches: 90,
    functions: 90,
    lines: 90,
    statements: 90,
  },
  './src/lib/db/repositories/*.ts': {
    branches: 85,
    functions: 85,
    lines: 85,
    statements: 85,
  },
}
```

---

## Success Criteria

✅ **Phase 7.1 Complete When:**

- All utility functions tested (90%+ coverage)
- All stores tested (85%+ coverage)
- All repositories tested (85%+ coverage)
- Database migrations tested

✅ **Phase 7.2 Complete When:**

- All service layer functions tested (80%+ coverage)
- Error handling verified
- Edge cases documented

✅ **Phase 7.3 Complete When:**

- All custom hooks tested (75%+ coverage)
- Hook cleanup verified
- State updates validated

✅ **Phase 7.4 Complete When:**

- Critical UI components tested (70%+ coverage)
- User interactions validated
- Accessibility verified

✅ **Phase 7.5 Complete When:**

- 5 critical user flows tested end-to-end
- Integration points verified
- Error recovery tested

✅ **Phase 7 Complete When:**

- Overall project coverage ≥ 60%
- All critical paths tested
- CI/CD pipeline enforces coverage
- Test documentation complete
