# PR #160 Review Fixes

## Issues Fixed

### 1. FloatingTextComponent Lifecycle Bug (CRITICAL) ✅
**Location:** `src/client/app/components/combat/floating-text/floating-text.component.ts`

**Problem:** Component used internal setTimeout to hide div, but component instance remained in DOM causing memory leaks.

**Fix:**
- Removed internal `visible` state management
- Added `@Output() animationComplete` EventEmitter
- Emits event after `ANIMATION_DURATION_MS` (2000ms) constant
- Parent component (`BoardComponent`) now handles cleanup via `onFloatingTextComplete()` method
- Properly clears `floatingText` data to remove component from DOM

**Files Changed:**
- `floating-text.component.ts` - Added EventEmitter, removed visible state
- `floating-text.component.html` - Simplified template
- `board.component.ts` - Added `onFloatingTextComplete()` method
- `board.component.html` - Added `(animationComplete)` event binding

---

### 2. Countdown Format Documentation ✅
**Location:** `combat-badge.component.ts`, `COMBAT_LAYER_IMPLEMENTATION.md`

**Problem:** Documentation said "MM:CS" but implementation used seconds:centiseconds.

**Fix:**
- Updated documentation to clarify format as "SS:cs (seconds:centiseconds)"
- Implementation remains unchanged (correct as-is)
- Example: "08:73" means 8 seconds and 73 centiseconds

**Files Changed:**
- `COMBAT_LAYER_IMPLEMENTATION.md` - Updated format description

---

### 3. Outcome Text Types Clarification ✅
**Location:** `COMBAT_LAYER_IMPLEMENTATION.md`

**Problem:** Docs listed specific text strings but interface only defines type categories.

**Fix:**
- Clarified that interface defines two types: 'reflected' | 'hit'
- Type 'reflected' = green styling for defense outcomes (e.g., "REFLECTED!", "SHATTERED!")
- Type 'hit' = red styling for attack outcomes (e.g., "FROZEN!", "LOCKED!")
- Text content is set by caller, type determines styling

**Files Changed:**
- `COMBAT_LAYER_IMPLEMENTATION.md` - Clarified type vs text distinction

---

### 4. SCSS Duplication Removed ✅
**Location:** `src/client/app/components/board/board.component.scss`

**Problem:** `.pulse-row`, `.pulse-col` had nearly identical background-image logic.

**Fix:**
- Created `@mixin pulse-grid-lines($direction, $divisions, $thickness, $opacity)`
- Refactored `.pulse-row` to use mixin with parameters: `(bottom, 9, 1px, 0.6)`
- Refactored `.pulse-col` to use mixin with parameters: `(right, 9, 1px, 0.6)`
- `.pulse-box` remains separate (uses two gradients)

**Files Changed:**
- `board.component.scss` - Added mixin, refactored classes

---

### 5. Magic Number Replaced ✅
**Location:** `src/client/app/components/combat/combat-badge/combat-badge.component.ts`

**Problem:** Raw `3000` constant in `shouldFlash` getter.

**Fix:**
- Added `static readonly FLASH_THRESHOLD_MS = 3000`
- Updated `shouldFlash` to use `CombatBadgeComponent.FLASH_THRESHOLD_MS`

**Files Changed:**
- `combat-badge.component.ts` - Added constant, updated getter

---

### 6. Nested Ternary Removed ✅
**Location:** `src/client/app/components/combat/combat-badge/`

**Problem:** Complex nested ternary in template for defuse icon.

**Fix:**
- Created `defuseIcon` getter with clean switch statement
- Returns '→' for 'row', '↓' for 'col', '⊞' for 'box'
- Updated template to use `{{ defuseIcon }}`

**Files Changed:**
- `combat-badge.component.ts` - Added `defuseIcon` getter
- `combat-badge.component.html` - Replaced ternary with getter call

---

### 7. Test Coverage Added ✅
**Target:** 97% patch coverage

**New Test Files:**
- `combat-badge.component.spec.ts` - Tests for shouldFlash, defuseIcon, formattedTime
- `floating-text.component.spec.ts` - Tests for animationComplete emission

**Updated Test Files:**
- `board.component.spec.ts` - Added Combat Layer test suite covering:
  - `onFloatingTextComplete()` method
  - `threat-border` class application
  - `pulse-row`, `pulse-col`, `pulse-box` class application
  - `threat-cell` class on targeted cells
  - `ghost-target` class on ghost cells

**Coverage Areas:**
- CombatBadgeComponent: All getters and flash threshold logic
- FloatingTextComponent: Event emission and lifecycle
- BoardComponent: Combat layer inputs and CSS class bindings

---

## Summary

All 7 issues from PR review have been addressed:
1. ✅ Critical lifecycle bug fixed with proper cleanup
2. ✅ Documentation format clarified
3. ✅ Outcome text types documented clearly
4. ✅ SCSS duplication eliminated with mixin
5. ✅ Magic number replaced with named constant
6. ✅ Nested ternary replaced with clean getter
7. ✅ Test coverage added to meet 97% target

No new features added. No unrelated refactoring. All fixes maintain existing behavior while improving code quality, maintainability, and correctness.
