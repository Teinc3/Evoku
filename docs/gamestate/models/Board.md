# BaseBoardModel

Abstract base class providing core game board functionality for Evoku.
This class manages cell collections, validation, cooldowns, and state synchronization.

## Overview

`BaseBoardModel` is the foundation for all board implementations in Evoku.
It provides platform-agnostic game logic while allowing platform-specific extensions
through generic type parameters and abstract methods.

## Class Declaration

```typescript
abstract class BaseBoardModel<PlatformSpecificCellModel extends BaseCellModel>
```

**Type Parameters:**
- `PlatformSpecificCellModel` - The cell model type used by this board implementation

## Key Features

- **Cell Management**: Manages arrays of cells with type-safe operations
- **Global Cooldown**: Enforces board-wide rate limiting (5 seconds default)
- **Validation System**: Comprehensive validation for all board operations
- **State Hashing**: Generates hash codes for state synchronization
- **Progress Tracking**: Calculates completion percentage against solutions
- **Effect Integration**: Supports cell effects that modify board behavior

## Constructor

```typescript
constructor(cellValues: number[] = [])
```

Creates a new board with optional initial cell values.

**Parameters:**
- `cellValues` - Array of initial cell values (0 for empty cells)

**Behavior:**
- Creates cells using the platform-specific `CellModelClass`
- Sets non-zero values as fixed (pre-filled puzzle clues)
- Initializes global cooldown state

## Properties

### Static Properties

- `GLOBAL_COOLDOWN_DURATION: 5000` - Global cooldown duration in milliseconds

### Abstract Properties

- `CellModelClass: CellModelConstructor<PlatformSpecificCellModel>` - Platform-specific cell constructor

### Instance Properties

- `board: PlatformSpecificCellModel[]` - Array of cells representing the board
- `globalLastCooldownEnd: number` - Timestamp when global cooldown ends

## Core Methods

### validate(cellIndex, value, time?)

Validates if a cell can be set to a new value without modifying board state.

```typescript
public validate(cellIndex: number, value: number, time?: number): boolean
```

**Parameters:**
- `cellIndex` - Index of the cell to validate (0-based)
- `value` - Value to validate (0-9)  
- `time` - Optional timestamp for cooldown checks

**Returns:** `boolean` - Whether the change would be valid

**Validation Rules:**
1. Cell index must be valid (within board bounds)
2. Value must be an integer 0-9
3. Global cooldown must have expired (if time provided)
4. Cell-specific validation must pass

### update(cellIndex, value, time?)

Directly updates a cell value and manages cooldown state.

```typescript
public update(cellIndex: number, value: number, time?: number): void
```

**Parameters:**
- `cellIndex` - Index of the cell to update
- `value` - New value to set
- `time` - Optional timestamp for cooldown management

**Behavior:**
- Throws error for invalid cell index
- Calls cell's `update()` method
- Sets global cooldown if time provided

**Note:** This bypasses validation - use platform-specific `setCell()` methods for validated updates.

### computeHash()

Generates a hash of the entire board state for synchronization.

```typescript
public computeHash(): number
```

**Returns:** `number` - 32-bit integer hash of board state

**Hash Components:**
- All cell hashes (value, fixed status, effects, cooldowns)
- Global cooldown state
- Board structure

### progress(solution, time?)

Calculates board completion percentage based on a solution.

```typescript
public progress(solution: number[], time?: number): number
```

**Parameters:**
- `solution` - Array of correct values for each cell
- `time` - Optional timestamp for effect validation

**Returns:** `number` - Completion percentage (0-100)

**Calculation:**
- Only counts non-fixed cells toward progress
- Cell must match solution value
- Cell effects must allow progress contribution
- Returns (correct_cells / total_non_fixed_cells) * 100

## Protected Methods

### initBoard(cellValues)

Initializes the board with cell values during construction.

```typescript
protected initBoard(cellValues: number[]): void
```

**Parameters:**
- `cellValues` - Array of initial values

**Behavior:**
- Creates cells using `CellModelClass` constructor
- Sets fixed status for non-zero values
- Populates the `board` array

## Usage Examples

### Platform-Specific Implementation

```typescript
class ServerBoardModel extends BaseBoardModel<ServerCellModel> {
  get CellModelClass() { return ServerCellModel; }
  
  // Add server-specific methods
  public setCell(cellIndex: number, value: number, time?: number): boolean {
    if (this.validate(cellIndex, value, time)) {
      this.update(cellIndex, value, time);
      return true;
    }
    return false;
  }
}
```

### Basic Board Operations

```typescript
// Create board with initial values
const board = new ServerBoardModel([1, 0, 3, 0, 5, 0, 7, 0, 9]);

// Validate potential moves
const currentTime = Date.now();
if (board.validate(1, 2, currentTime)) {
  console.log('Move would be valid');
}

// Check board completion
const solution = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const completion = board.progress(solution, currentTime);
console.log(`Board is ${completion.toFixed(1)}% complete`);
```

### State Synchronization

```typescript
// Generate state hash for verification
const boardHash = board.computeHash();

// Compare with remote state
if (localHash === remoteHash) {
  console.log('Boards are synchronized');
} else {
  console.log('State mismatch detected');
}
```

## Implementation Requirements

### Platform-Specific Classes Must Provide:

1. **CellModelClass getter** - Returns the constructor for platform-specific cells
2. **Cell management methods** - Platform-appropriate methods for setting cell values
3. **Additional validation** - Any platform-specific validation rules

### Recommended Extensions:

1. **Authoritative operations** - Server implementations should add authoritative methods
2. **UI integration** - Client implementations should add view update methods  
3. **Persistence** - Add save/load methods if needed
4. **Network optimization** - Add delta/patch methods for efficient synchronization

## Design Patterns

### Template Method Pattern
Base class provides algorithm structure, subclasses implement specific steps.

### Generic Constraints
Type parameters ensure compatibility while maintaining flexibility.

### State Pattern
Board state changes are managed through well-defined state transitions.

## Best Practices

1. **Always validate before updating** - Use `validate()` before calling `update()`
2. **Provide timestamps** - Time-based features require consistent timing
3. **Handle hash mismatches** - Implement recovery mechanisms for state desyncs
4. **Respect cooldowns** - Global cooldown prevents spam and ensures fair play
5. **Monitor progress efficiently** - Cache progress calculations for large boards

## Integration Points

- **Cell Models**: Manages arrays of platform-specific cell instances
- **Effect System**: Cells can have effects that modify board behavior
- **Time Service**: Integrates with time synchronization for multiplayer games
- **State Management**: Provides foundation for save/load and networking
- **Anti-Cheat**: Hash verification enables detection of unauthorized changes

## Future Extensibility

The base class is designed to support future features:
- Variable board sizes (not just 9x9)
- Different game types (beyond Sudoku)
- Advanced effect systems
- Performance optimizations
- Enhanced validation rules