# GameStateController

**Path:** `src/server/game/controllers/state.ts`

The GameStateController is the central logical module that handles game mechanics
and stateful interactions for Sudoku matches. It manages individual player game states,
validates moves, tracks progress, and coordinates with the timing subsystem to ensure fair gameplay.

## Overview

The GameStateController serves as the core game logic coordinator, maintaining:
- Per-player board states and solutions
- Move validation and timing enforcement
- Progress tracking and completion detection
- Integration with TimeService for action validation

## Core Responsibilities

### Player Management
- **Add/Remove Players:** Manages player participation during pre-game phase
- **State Initialization:** Sets up individual game states with transformed board puzzles
- **Progress Tracking:** Monitors completion percentage for phase transitions

### Game Logic
- **Move Validation:** Validates cell placement attempts with timing constraints
- **Board Management:** Maintains separate board instances per player with transformations
- **Solution Verification:** Provides hints and validates completion

### Timing Integration
- **Action Assessment:** Coordinates with TimeService for move timing validation
- **Cooldown Enforcement:** Ensures moves respect rate limiting constraints
- **Server Time Synchronization:** Provides accurate timing for move validation

## API Reference

### Constructor
```typescript
constructor(
  timeService: TimeService,
  difficulty: "easy" | "medium" | "hard" | "expert" | "impossible" = "easy"
)
```

Creates a new GameStateController with the specified difficulty level.

**Parameters:**
- `timeService` - The timing subsystem for action validation
- `difficulty` - Puzzle difficulty level (default: "easy")

### Player Management

#### addPlayer(playerID: number): boolean
Adds a player to the game during pre-initialization phase.

**Parameters:**
- `playerID` - Unique identifier for the player

**Returns:** `true` if player was successfully added, `false` if match already started

**Example:**
```typescript
const added = gameState.addPlayer(12345);
if (added) {
  console.log('Player added successfully');
}
```

#### removePlayer(playerID: number): boolean
Removes a player from the game, preserving their state.

**Parameters:**
- `playerID` - Unique identifier for the player

**Returns:** `true` if player was successfully removed

### Game Operations

#### setCellValue(playerID: number, data: ActionMap[MechanicsActions.SET_CELL])
Applies a move to a player's board with timing validation.

**Parameters:**
- `playerID` - Player making the move
- `data` - Move data containing `{ clientTime, cellIndex, value }`

**Returns:**
```typescript
{
  result: boolean;
  serverTime?: number; // Present if result is true
}
```

**Validation Process:**
1. Timing assessment via TimeService
2. Board state validation  
3. Cooldown enforcement
4. Server time synchronization

**Example:**
```typescript
const result = gameState.setCellValue(playerID, {
  clientTime: 1640995200000,
  cellIndex: 15,
  value: 7
});

if (result.result) {
  console.log(`Move accepted at server time: ${result.serverTime}`);
}
```

#### initGameStates(): number[]
Initializes game states for all players and returns the base board configuration.

**Returns:** Array representing the initial puzzle state

**Usage:**
```typescript
const initialBoard = gameState.initGameStates();
// Broadcast initialBoard to all players
```

#### getSolution(playerID: number, cellIndex: number): number | undefined
Retrieves the solution value for a specific cell (hint system).

**Parameters:**
- `playerID` - Player requesting the hint
- `cellIndex` - Cell position (0-80 for 9x9 Sudoku)

**Returns:** Solution value or `undefined` if unavailable

### Utility Methods

#### computeHash(): number
Computes a hash of the complete game state for validation and synchronization.

**Returns:** Numeric hash representing current state

#### setCallbacks(callbacks: GameLogicCallbacks): void
Sets callback functions for lifecycle integration.

**Parameters:**
- `callbacks` - Object containing `getMatchStatus` and `onBoardProgressUpdate`

## State Management

### Player State Structure
```typescript
interface IPlayerState<T> {
  playerID: number;
  gameState?: {
    boardState: T;
    // Additional state properties
  };
}
```

### Board Transformations
Each player receives a unique board transformation to prevent cheating:
- **Base Board:** Original puzzle and solution pair
- **Player Boards:** Structurally transformed but logically equivalent
- **Solution Mapping:** Per-player solution arrays for hint system

## Progress Tracking

The controller monitors board completion and triggers callbacks:

### Progress Calculation
- **Cell Completion:** Percentage of correctly filled cells
- **Phase Thresholds:** 33%, 66%, 100% completion markers
- **Real-time Updates:** Progress reported on each successful move

### Lifecycle Integration
```typescript
// Progress updates trigger lifecycle transitions
private checkBoardProgresses(playerIDs: number[] = []): void {
  // Calculate progress for specified players
  // Report to lifecycle controller via callbacks
}
```

## Error Handling

### Move Validation Errors
- **Timing Violations:** Moves outside sync tolerance rejected
- **Invalid Players:** Unknown player IDs return failure
- **Board Constraints:** Invalid moves (duplicates, conflicts) rejected
- **Cooldown Violations:** Moves within cooldown period rejected

### State Consistency
- **Hash Validation:** State integrity checking via computeHash()
- **Player Synchronization:** Coordinated state updates
- **Recovery Mechanisms:** Graceful handling of invalid states

## Integration Patterns

### TimeService Coordination
```typescript
// Two-phase timing validation
const estServerTime = this.timeService.assessTiming(playerID, clientTime);
if (estServerTime < 0) return { result: false };

// Apply move with estimated time
const result = board.setCell(cellIndex, value, estServerTime);

// Synchronize actual server time
const serverTime = this.timeService.updateLastActionTime(
  playerID, 
  MechanicsActions.SET_CELL, 
  clientTime
);
```

### Lifecycle Callbacks
```typescript
const callbacks: GameLogicCallbacks = {
  getMatchStatus: () => this.status,
  onBoardProgressUpdate: progressData => this.handleProgress(progressData)
};
gameState.setCallbacks(callbacks);
```

## Testing Considerations

### Unit Test Coverage
- **Player Management:** Add/remove operations and state validation
- **Move Validation:** Valid and invalid move scenarios
- **Progress Tracking:** Completion detection and callback triggering
- **Timing Integration:** Coordination with mocked TimeService
- **Error Handling:** Invalid inputs and edge cases

### Mock Dependencies
- **TimeService:** Mock timing validation and server time
- **BoardModel:** Mock board state and validation logic
- **Callbacks:** Verify lifecycle integration calls


## Security Considerations

### Move Validation
- **Server Authority:** All moves validated server-side
- **Timing Enforcement:** Prevents speedhacking via timing validation
- **Board Isolation:** Player-specific transformations prevent solution sharing
- **Rate Limiting:** Cooldown enforcement prevents move spamming

### State Integrity
- **Hash Verification:** Tamper detection via state hashing
- **Player Isolation:** Separate state instances prevent interference
- **Solution Protection:** Per-player solution arrays prevent cheating
