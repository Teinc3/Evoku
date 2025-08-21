# BaseCellModel

Core cell implementation providing fundamental cell state management and validation for Evoku game boards.

## Overview

`BaseCellModel` represents individual cells on a game board, managing values, constraints, 
cooldowns, and effect integration. This class provides the foundation for all cell implementations
and contains the core game mechanics for cell behavior.

## Class Declaration

```typescript
class BaseCellModel implements ICellState
```

## Key Features

- **Value Management**: Stores and validates cell values (0-9 for Sudoku)
- **Fixed Cell Support**: Handles pre-filled puzzle clues that cannot be changed
- **Individual Cooldowns**: Per-cell rate limiting (10 seconds default)
- **Effect Integration**: Supports temporal effects that modify cell behavior
- **State Integrity**: Hash computation for synchronization and anti-cheat
- **Progress Tracking**: Determines contribution to puzzle completion

## Constructor

```typescript
constructor(value?: number, fixed?: boolean, effects?: BaseEffectModel[])
```

Creates a new cell with optional initial state.

**Parameters:**
- `value` - Initial cell value (0-9, default: 0)
- `fixed` - Whether cell is fixed/pre-filled (default: false)  
- `effects` - Array of effects applied to this cell (default: [])

## Properties

### Static Properties

- `CELL_COOLDOWN_DURATION: 10000` - Cell cooldown duration in milliseconds

### Instance Properties

- `value: number` - Current cell value (0-9)
- `fixed: boolean` - Whether the cell is fixed (cannot be changed by players)
- `effects: BaseEffectModel[]` - Array of active effects on this cell
- `lastCooldownEnd: number` - Timestamp when this cell's cooldown ends

## Core Methods

### validate(value, time?)

Validates if the cell can be set to a new value without actually changing it.

```typescript
public validate(value: number, time?: number): boolean
```

**Parameters:**
- `value` - Value to validate (0-9)
- `time` - Optional timestamp for cooldown and effect checks

**Returns:** `boolean` - Whether the change would be allowed

**Validation Rules:**
1. Value must be an integer between 0-9
2. Cell must not be fixed (pre-filled)
3. Cell cooldown must have expired (if time provided)
4. No effects can be blocking the change

### update(value, time?)

Directly updates the cell value and cooldown state.

```typescript
public update(value: number, time?: number): void
```

**Parameters:**
- `value` - New value to set (0-9)
- `time` - Optional timestamp for cooldown management

**Behavior:**
- Sets cell value directly (bypasses validation)
- Updates cooldown end time if time provided
- Does not check constraints or effects

**Note:** This method bypasses all validation - use platform-specific `set()` methods for validated updates.

### computeHash()

Generates a hash of the cell's current state.

```typescript
public computeHash(): number
```

**Returns:** `number` - 32-bit integer hash of cell state

**Hash Components:**
- Cell value
- Fixed status
- Cooldown state (lastCooldownEnd)
- All active effects (via effect hashes)

### progress(solution, time?)

Determines if this cell contributes to board completion progress.

```typescript
public progress(solution: number, time?: number): boolean
```

**Parameters:**
- `solution` - The correct value for this cell
- `time` - Optional timestamp for effect validation

**Returns:** `boolean` - Whether cell contributes to progress

**Criteria for Progress Contribution:**
- Cell is not fixed (pre-filled clues don't count)
- Cell value matches the solution value
- No effects are blocking progress contribution

## Usage Examples

### Basic Cell Operations

```typescript
// Create different types of cells
const emptyCell = new BaseCellModel();
const prefilledCell = new BaseCellModel(5, true);
const effectCell = new BaseCellModel(0, false, [freezeEffect]);

// Check current state
console.log(`Cell value: ${emptyCell.value}`);
console.log(`Is fixed: ${prefilledCell.fixed}`);
console.log(`Has effects: ${effectCell.effects.length > 0}`);
```

### Validation and Updates

```typescript
const cell = new BaseCellModel();
const currentTime = Date.now();

// Validate before updating
if (cell.validate(7, currentTime)) {
  console.log('Change would be valid');
  
  // Safe to update
  cell.update(7, currentTime);
  console.log(`Cell now contains: ${cell.value}`);
} else {
  console.log('Change would be rejected');
}
```

### Cooldown Management

```typescript
const cell = new BaseCellModel();
const time1 = 1000;
const time2 = 5000;  // 5 seconds later
const time3 = 15000; // 15 seconds later

// First update sets cooldown
cell.update(1, time1);
console.log(`Cooldown until: ${cell.lastCooldownEnd}`); // 11000

// Check validation during cooldown
console.log(`Can change at time 5000: ${cell.validate(2, time2)}`); // false

// Check after cooldown expires  
console.log(`Can change at time 15000: ${cell.validate(3, time3)}`); // true
```

### Progress Tracking

```typescript
const cell = new BaseCellModel(7, false); // Non-fixed cell with value 7
const solution = 7; // Correct answer is 7
const currentTime = Date.now();

if (cell.progress(solution, currentTime)) {
  console.log('Cell contributes to board completion');
} else {
  console.log('Cell does not count toward progress');
}

// Fixed cells never contribute to progress
const fixedCell = new BaseCellModel(7, true);
console.log(`Fixed cell contributes: ${fixedCell.progress(7)}`); // false
```

### State Hashing and Synchronization

```typescript
const cell1 = new BaseCellModel(5, false);
const cell2 = new BaseCellModel(5, false);

// Same state should produce same hash
console.log(cell1.computeHash() === cell2.computeHash()); // true

// Different states produce different hashes
cell2.value = 6;
console.log(cell1.computeHash() === cell2.computeHash()); // false

// Hash includes all state components
cell2.value = 5;
cell2.lastCooldownEnd = 1000;
console.log(cell1.computeHash() === cell2.computeHash()); // false
```

### Effect Integration

```typescript
// Cell with blocking effect
const blockingEffect = new SomeEffect(startTime, endTime);
const cell = new BaseCellModel(0, false, [blockingEffect]);

// Effects can block validation
const duringEffect = startTime + 1000;
const afterEffect = endTime + 1000;

console.log(`Can change during effect: ${cell.validate(5, duringEffect)}`); // false
console.log(`Can change after effect: ${cell.validate(5, afterEffect)}`); // true

// Effects affect progress calculation
console.log(`Progress during effect: ${cell.progress(5, duringEffect)}`);
console.log(`Progress after effect: ${cell.progress(5, afterEffect)}`);
```

## Effect System Integration

### Effect Validation

Effects can modify cell behavior through two main methods:

1. **validateSetValue()** - Controls whether cell values can be changed
2. **blockSetProgress()** - Controls whether cell contributes to progress

```typescript
// Example effect that blocks changes for 5 seconds
class FreezeEffect extends BaseEffectModel {
  validateSetValue(time?: number): boolean {
    return time === undefined || time >= this.lastUntil;
  }
}
```

### Effect State Inclusion

Cell hashes include all effect states to ensure complete synchronization:

```typescript
const cell = new BaseCellModel(5);
const hashWithoutEffects = cell.computeHash();

cell.effects.push(new FreezeEffect(1000, 6000));
const hashWithEffects = cell.computeHash();

// Hashes will be different due to effect inclusion
console.log(hashWithoutEffects !== hashWithEffects); // true
```

## Cooldown System

### Purpose and Design

Cell cooldowns prevent spam and ensure fair gameplay:
- **Duration**: 10 seconds per cell (configurable via static property)
- **Scope**: Individual per cell (independent of other cells)
- **Timing**: Based on provided timestamps (usually server time)

### Cooldown Scenarios

```typescript
const cell = new BaseCellModel();

// Set value with cooldown
cell.update(1, 1000); // Cooldown until 11000

// Validation respects cooldown
console.log(cell.validate(2, 5000));  // false (still on cooldown)
console.log(cell.validate(2, 12000)); // true (cooldown expired)

// Multiple cooldown cycles
cell.update(2, 15000); // New cooldown until 25000
cell.update(3, 30000); // New cooldown until 40000
```

## Platform Extension Patterns

### Server Implementation

```typescript
class ServerCellModel extends BaseCellModel {
  public set(value: number, time?: number): boolean {
    if (this.validate(value, time)) {
      this.update(value, time);
      return true;
    }
    return false;
  }
  
  // Additional server-specific methods...
}
```

### Client Implementation

```typescript
class ClientCellModel extends BaseCellModel {
  private pendingValue?: number;
  
  public setPending(value: number): void {
    this.pendingValue = value;
    // Update UI to show pending state
  }
  
  public confirmPending(): void {
    if (this.pendingValue !== undefined) {
      this.value = this.pendingValue;
      this.pendingValue = undefined;
    }
  }
}
```

## Best Practices

1. **Validate before updating** - Always call `validate()` before `update()`
2. **Provide timestamps** - Essential for cooldown and effect management
3. **Handle fixed cells** - Check `fixed` property before allowing changes
4. **Monitor effect states** - Effects can significantly modify cell behavior
5. **Use hashes for verification** - Detect state desyncs and tampering
6. **Respect cooldowns** - Essential for fair multiplayer gameplay
7. **Cache hash calculations** - For performance in large board operations

## Integration Points

- **Board Models**: Cells are managed by board implementations
- **Effect System**: Effects modify cell validation and progress behavior
- **Time Service**: Cooldowns and effects require accurate time synchronization
- **State Synchronization**: Hash methods enable client-server verification
- **UI Systems**: Cell state changes should trigger appropriate UI updates

## Type System Integration

### Cell Constructor Type

```typescript
export type CellModelConstructor<T extends BaseCellModel> = 
  new (value?: number, fixed?: boolean, effects?: BaseEffectModel[]) => T;
```

This type ensures that platform-specific cell classes maintain constructor compatibility.

### Interface Compliance

```typescript
interface ICellState {
  value: number;
  fixed: boolean;
  effects: BaseEffectModel[];
}
```

BaseCellModel implements this interface to ensure consistent state structure.

## Future Extensibility

The cell model is designed to support future enhancements:

- **Variable value ranges** - Currently 0-9, but extensible
- **Complex constraints** - Beyond simple value validation
- **Advanced effect types** - More sophisticated effect interactions
- **Performance optimizations** - Efficient hash computation and validation
- **Extended metadata** - Additional cell properties as needed

## Anti-Cheat Considerations

The cell model provides several anti-cheat mechanisms:

- **Hash verification** - Detect unauthorized state changes
- **Cooldown enforcement** - Prevent rapid manipulation
- **Effect validation** - Ensure effects are properly applied
- **Fixed cell protection** - Prevent modification of puzzle clues
- **Value range enforcement** - Reject invalid values

These features work together to ensure game integrity in multiplayer environments.