# ServerBoardModel

Server-side implementation of the game board with authoritative game logic.

## Overview

`ServerBoardModel` extends `BaseBoardModel` to provide server-authoritative board operations.
It adds server-specific functionality on top of the shared game logic provided by the base class.

This class inherits all properties and methods from [BaseBoardModel](/docs/gamestate/models/Board.md) and adds server-specific extensions documented below.

## Class Hierarchy

```
BaseBoardModel<ServerCellModel>
└── ServerBoardModel
```

## Key Features

- **Authoritative validation**: Server validates all cell changes before applying them
- **Server-specific extensions**: Adds `setCell()` method for validated updates
- **Objective tracking**: Monitors board completion and objectives (planned feature)

## Server-Specific Properties

- `CellModelClass: typeof ServerCellModel` - Cell model class used for this board

## Methods

### Server-Specific Methods

### setCell(cellIndex, value, time?)

Authoritative method to validate and set a cell value on the server.

```typescript
public setCell(cellIndex: number, value: number, time?: number): boolean
```

**Parameters:**
- `cellIndex` - Index of the cell to set (0-80 for 9x9 board)
- `value` - New value to set (1-9, or 0 to clear)
- `time` - Optional server timestamp for cooldown validation

**Returns:** `boolean` - Whether the value was successfully set

**Validation Process:**
1. Calls inherited `validate()` method from BaseBoardModel
2. If valid, calls inherited `update()` method to apply change
3. Returns success/failure status

**Validation Rules:**
*All validation is handled by the inherited BaseBoardModel methods:*
1. Cell index must be valid (0 ≤ index < board.length)
2. Value must be valid (0-9)
3. Cell must not be fixed (pre-filled)
4. Global cooldown must have expired
5. Cell-specific cooldown must have expired
6. Cell effects must allow the change

### checkBoardObjectives(cellIndex)

Check for completed objectives after a cell change.

```typescript
public checkBoardObjectives(cellIndex: number): number
```

**Parameters:**
- `cellIndex` - Index of the cell that was changed

**Returns:** `number` - Number of objectives completed (currently always 0)

**Note:** This is a placeholder for future objective system implementation.

## Usage Examples

### Basic Board Setup

```typescript
// Create empty 9x9 board
const board = new ServerBoardModel(new Array(81).fill(0));

// Set initial fixed cells (puzzle clues)
const fixedCells = [1, 5, 9, 2, 8, 3, 7, 4, 6];
for (let i = 0; i < fixedCells.length; i++) {
    if (fixedCells[i] !== 0) {
        board.board[i].fixed = true;
        board.board[i].value = fixedCells[i];
    }
}
```

### Authoritative Move Validation

```typescript
const currentTime = Date.now();
const success = board.setCell(0, 5, currentTime);

if (success) {
    console.log('Move accepted');
    // Broadcast move to all clients
} else {
    console.log('Move rejected');
    // Send rejection reason to client
}
```

### Board State Monitoring

```typescript
// Check board completion
const solution = [1, 2, 3, ...]; // Complete solution array
const completionPercentage = board.progress(solution, currentTime);

// Verify board integrity
const stateHash = board.computeHash();
```

## Best Practices

1. **Always use `setCell()`** for player moves - never call `update()` directly
2. **Provide timestamps** for accurate cooldown management
3. **Check return values** - `setCell()` returns false if the move is invalid
4. **Monitor board state** - Use `computeHash()` for state synchronization
5. **Handle cooldowns gracefully** - Inform players when moves are rejected due to cooldowns

## Integration Notes

- Works with `GameStateController` for complete game logic
- Integrates with time service for accurate cooldown management
- Supports future objective and power-up systems
- Provides foundation for anti-cheat verification

## Future Enhancements

- Complete objective checking implementation
- Advanced validation rules (Sudoku constraints)
- Power-up effect integration
- Performance optimizations for large boards
