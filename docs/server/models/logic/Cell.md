# ServerCellModel

Server-side implementation of individual game board cells with authoritative validation and state management.

## Overview

`ServerCellModel` extends `BaseCellModel` to provide server-authoritative cell operations.

This class inherits all properties and methods from [BaseCellModel](/docs/gamestate/models/Cell.md) and adds server-specific extensions documented below.

## Key Features

- **Authoritative setting**: Server validates and applies all cell changes
- **Server-specific extensions**: Adds `set()` method for validated updates

## Methods

## Key Features

- **Authoritative setting**: Server validates and applies all cell changes via `set()` method
- **Server-side validation**: Adds server-specific validation and state management

**Inherited from BaseCellModel:**
- Individual cooldown management (10-second per-cell cooldown)
- Effect integration (cell-specific effects that modify behavior)
- State integrity (hash computation for anti-cheat verification)
- Value management and constraints (0-9 for Sudoku)
- Fixed cell support (pre-filled puzzle clues)

*See [BaseCellModel documentation](/docs/gamestate/models/Cell.md) for complete details on inherited functionality.*

## Constructor

```typescript
constructor(value?: number, fixed?: boolean, effects?: BaseEffectModel[])
```

Creates a new server cell with optional initial state.

**Parameters:**
- `value` - Initial cell value (0-9, default: 0)
- `fixed` - Whether cell is fixed/pre-filled (default: false)
- `effects` - Array of effects applied to this cell (default: [])

## Properties

*Inherits all properties from [BaseCellModel](/docs/gamestate/models/Cell.md). See base class documentation for complete details.*

## Methods

### Server-Specific Methods

### set(value, time?)

Authoritative method to validate and set a cell value on the server.

```typescript
public set(value: number, time?: number): boolean
```

**Parameters:**
- `value` - New value to set (0-9)
- `time` - Optional server timestamp for cooldown validation

**Returns:** `boolean` - Whether the value was successfully set

**Validation Process:**
1. Calls inherited `validate()` method from BaseCellModel
2. If valid, calls inherited `update()` method to apply the change
3. Returns `true` on success, `false` on failure

**Validation Rules:**
*All validation is handled by the inherited BaseCellModel methods:*
- Value must be 0-9
- Cell must not be fixed
- Cell cooldown must have expired
- No effects can be blocking the change

## Usage Examples

### Basic Cell Operations

```typescript
// Create a new empty cell
const cell = new ServerCellModel();

// Create a fixed cell with value
const fixedCell = new ServerCellModel(5, true);

// Create a cell with effects
const cellWithEffects = new ServerCellModel(0, false, [freezeEffect]);
```

### Authoritative Value Setting

```typescript
const currentTime = Date.now();

// Try to set cell value
if (cell.set(7, currentTime)) {
    console.log('Cell value updated to 7');
    // Notify clients of change
} else {
    console.log('Cell change rejected');
    // Check why: fixed, cooldown, or effects
}
```

### Validation Before Setting

```typescript
// Check if a change would be valid
if (cell.validate(3, currentTime)) {
    // Safe to proceed with set()
    const success = cell.set(3, currentTime);
} else {
    // Determine rejection reason
    if (cell.fixed) {
        console.log('Cell is fixed');
    } else if (cell.lastCooldownEnd > currentTime) {
        const waitTime = cell.lastCooldownEnd - currentTime;
        console.log(`Cell on cooldown for ${waitTime}ms`);
    }
}
```

### Progress Tracking

```typescript
const solution = 4; // Correct value for this cell
const currentTime = Date.now();

if (cell.progress(solution, currentTime)) {
    console.log('Cell contributes to board completion');
} else {
    console.log('Cell does not count toward progress');
}
```

### State Integrity

```typescript
// Generate state hash for anti-cheat
const cellHash = cell.computeHash();

// Compare with client-reported hash
if (clientHash === cellHash) {
    console.log('Cell state verified');
} else {
    console.log('Potential desync or tampering detected');
}
```

## Effect Integration

### Working with Effects

```typescript
// Cell with temporary freeze effect
const freezeEffect = new FreezeEffect(startTime, endTime);
const cell = new ServerCellModel(0, false, [freezeEffect]);

// Effect blocks changes during its duration
const canChange = cell.validate(5, currentTime);
if (!canChange && currentTime < freezeEffect.lastUntil) {
    console.log('Cell is frozen by effect');
}
```

### Effect State in Hashes

```typescript
// Hash includes effect states
const hashWithEffects = cell.computeHash();

// Remove effect and compare
cell.effects = [];
const hashWithoutEffects = cell.computeHash();
// Hashes will be different
```

## Cooldown Management

### Understanding Cooldowns

- **Purpose**: Prevent rapid-fire changes and spam
- **Duration**: 10 seconds per cell
- **Scope**: Individual per cell (not global)
- **Timing**: Based on server timestamp

### Cooldown Scenarios

```typescript
const cell = new ServerCellModel();
const time1 = 1000;
const time2 = 5000;  // 5 seconds later
const time3 = 15000; // 15 seconds later

// First change
cell.set(1, time1); // Success, cooldown until 11000

// Second change (too soon)
cell.set(2, time2); // Fails, still on cooldown

// Third change (cooldown expired)
cell.set(3, time3); // Success, new cooldown until 25000
```

## Best Practices

1. **Use `set()` for player moves** - Provides full validation
2. **Check `validate()` first** - Avoid unnecessary rejections
3. **Provide timestamps** - Essential for accurate cooldown management
4. **Handle fixed cells** - They cannot be changed by players
5. **Monitor effects** - They can modify cell behavior significantly
6. **Use hashes for verification** - Detect state desyncs early

## Integration Notes

- Used by `ServerBoardModel` for all cell operations
- Integrates with effect system for modified behaviors
- Supports time service for accurate cooldown tracking
- Provides anti-cheat capabilities through state hashing

## Anti-Cheat Considerations

- All changes must go through server validation
- Client predictions should match server authority
- Hash mismatches indicate potential tampering
- Cooldown enforcement prevents rapid manipulation

## Future Enhancements

- Cell-specific effect types (power-ups, penalties)
- Variable cooldown durations based on game state
- Advanced validation rules (Sudoku constraints)
- Performance optimizations for effect processing
