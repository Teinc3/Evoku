# LifecycleController

**Path:** `src/server/game/controllers/lifecycle.ts`

The LifecycleController orchestrates match lifecycle transitions for a Room, 
managing the flow from pre-game setup through game completion. It coordinates player join/leave events,
game initialization timing, and victory conditions.

## Overview

The LifecycleController serves as the match orchestrator, handling:
- Match status transitions (PREINIT → ONGOING → ENDED)
- Player join/leave event processing
- Game start timing and conditions
- Victory determination and game over handling

## Core Responsibilities

### Match Status Management
- **Status Tracking:** Maintains current match state (PREINIT, ONGOING, ENDED)
- **Transition Logic:** Enforces valid state transitions
- **Status Queries:** Provides current status to other components

### Game Initialization
- **Start Conditions:** Triggers game start when requirements met (≥2 players)
- **Timing Control:** 5-second delay after minimum players reached
- **State Setup:** Coordinates with GameState and TimeService initialization

### Player Events
- **Join Handling:** Processes new player arrivals and start conditions
- **Leave Handling:** Manages player departures and forfeit scenarios
- **Victory Detection:** Determines winners when opponents leave

### Game Completion
- **Progress Monitoring:** Receives completion updates from GameState
- **Victory Conditions:** Handles different game over scenarios
- **Broadcast Coordination:** Notifies all players of match outcomes

## API Reference

### Constructor
```typescript
constructor(
  room: RoomModel,
  stateController: GameStateController
)
```

Creates a new LifecycleController for the specified room.

**Parameters:**
- `room` - The room model containing participants and communication
- `stateController` - Game state controller for logic coordination

### Properties

#### matchStatus: MatchStatus (readonly)
Returns the current match status.

**Values:**
- `PREINIT` - Pre-game setup phase
- `ONGOING` - Active game in progress  
- `ENDED` - Game completed or terminated

### Event Handlers

#### onPlayerJoined(): void
Handles player join events and evaluates start conditions.

**Behavior:**
- Checks if ≥2 players present
- Schedules game start with 5-second delay (idempotent)
- Only triggers during PREINIT phase

**Example:**
```typescript
// Called when player joins room
lifecycle.onPlayerJoined();
// If 2+ players: schedules start in 5 seconds
```

#### onPlayerLeft(): void
Handles player departure and forfeit scenarios.

**Behavior:**
- Cancels pending start timer if needed
- Declares remaining player as winner if only one left
- Ignores during ENDED phase or when 2+ players remain

**Victory Conditions:**
```typescript
if (room.participants.size === 1) {
  // Declare remaining player winner by forfeit
  const winnerID = getLastPlayerID();
  onGameOver(winnerID, GameOverReason.FORFEIT);
}
```

### Game Management

#### initGame(): void
Initializes the game when start conditions are met.

**Process:**
1. Transition status to ONGOING
2. Start TimeService for synchronization
3. Initialize player game states
4. Broadcast initial board to all participants

**Example:**
```typescript
// Automatically called after join delay
lifecycle.initGame();
// Status: PREINIT → ONGOING
// Broadcasts: GAME_INIT with cellValues
```

#### close(): void
Resets controller state when closing room.

**Cleanup:**
- Cancels any pending start timers
- Sets status to ENDED
- Prepares for controller disposal

## State Transitions

### Match Status Flow
```
PREINIT → ONGOING → ENDED
  ↑         ↓        ↑
  |    onGameOver    |
  |                  |
  └─── close() ──────┘
```

### Player Event Impact
```
PREINIT + playerJoin(≥2) → scheduleStart(5s) → ONGOING
ONGOING + playerLeave(1 remaining) → ENDED(forfeit)
ANY + close() → ENDED
```

## Callback Integration

### GameState Coordination
The controller sets up bidirectional communication with GameState:

```typescript
const callbacks: GameLogicCallbacks = {
  getMatchStatus: () => this.status,
  onBoardProgressUpdate: progressData => this.onBoardProgressUpdate(progressData)
};
stateController.setCallbacks(callbacks);
```

### Progress Monitoring
```typescript
private onBoardProgressUpdate(progressData: { playerID: number; progress: number }[]): void {
  // Check for 100% completion
  const winner = progressData.find(p => p.progress >= 100);
  if (winner) {
    this.onGameOver(winner.playerID, GameOverReason.SCORE);
  }
  
  // Future: Phase transitions at 33%, 66%
}
```

## Game Over Handling

### Victory Scenarios
- **Score Victory:** Player reaches 100% board completion
- **Forfeit Victory:** Opponent leaves, remaining player wins
- **Future:** Time-based, phase-based victories

### Game Over Process
```typescript
private onGameOver(winnerID: number, reason: GameOverReason): void {
  if (this.status === MatchStatus.ENDED) return;
  
  this.status = MatchStatus.ENDED;
  this.room.broadcast(LifecycleActions.GAME_OVER, { winnerID, reason });
}
```

## Timer Management

### Start Timer
- **Delay:** 5-second countdown after ≥2 players join
- **Idempotent:** Multiple join events don't create multiple timers
- **Cancellation:** Cleared if players leave before start

```typescript
// Schedule start (idempotent)
if (!this.startTimer && this.room.participants.size >= 2) {
  this.startTimer = setTimeout(() => {
    this.startTimer = null;
    this.initGame();
  }, 5000);
}
```

## Broadcasting

### Game Events
The controller broadcasts key lifecycle events:

#### GAME_INIT
```typescript
// Sent when game starts
this.room.broadcast(LifecycleActions.GAME_INIT, { 
  cellValues: initialBoard 
});
```

#### GAME_OVER
```typescript
// Sent when game ends
this.room.broadcast(LifecycleActions.GAME_OVER, { 
  winnerID: number, 
  reason: GameOverReason 
});
```

## Error Handling

### Invalid State Transitions
- **Double Start:** `initGame()` ignored if not in PREINIT
- **Double End:** `onGameOver()` ignored if already ENDED
- **Invalid Events:** Player events ignored in inappropriate states

### Timer Safety
- **Null Checks:** Timer operations protected against null access
- **Cleanup:** Timers cleared on state transitions and disposal
- **Race Conditions:** Idempotent operations prevent duplicate timers

## Testing Considerations

### Unit Test Coverage
- **State Transitions:** Valid and invalid transition scenarios
- **Player Events:** Join/leave handling with various player counts
- **Timer Logic:** Start scheduling, cancellation, and execution
- **Callback Integration:** GameState communication verification
- **Game Over Scenarios:** Different victory conditions and reasons

### Mock Dependencies
- **RoomModel:** Mock participant management and broadcasting
- **GameStateController:** Mock state initialization and callbacks
- **Timers:** Use Jest fake timers for deterministic testing

### Test Scenarios
```typescript
describe('LifecycleController', () => {
  it('should schedule start when 2 players join');
  it('should cancel start timer when player leaves');
  it('should declare forfeit winner when opponent leaves');
  it('should handle progress updates and completion');
  it('should prevent multiple game starts');
});
```

## Integration Patterns

### Room Coordination
```typescript
// The controller integrates tightly with Room
class LifecycleController {
  constructor(private room: RoomModel, private stateController: GameStateController) {
    // Room provides participants, broadcasting, timeService
    // StateController provides game logic callbacks
  }
}
```

### TimeService Integration
```typescript
// Game initialization starts timing
public initGame(): void {
  this.status = MatchStatus.ONGOING;
  this.room.timeService.start(); // Begin time synchronization
  // ... rest of initialization
}
```



## Security Considerations

### State Integrity
- **Controlled Transitions:** Only valid state changes allowed
- **Player Validation:** Events only processed for valid participants
- **Timer Protection:** Start conditions verified before scheduling

### Game Fairness
- **Consistent Timing:** 5-second delay provides fair start conditions
- **Forfeit Protection:** Prevents abuse of leave/rejoin mechanics
- **Status Verification:** Game over conditions properly validated

## Future Extensions

### Phase-Based Gameplay
```typescript
// Commented code shows planned phase transitions
private onBoardProgressUpdate(progressData) {
  // Phase 2 completion (66% progress)
  // Phase 1 completion (33% progress) 
  // Different victory conditions per phase
}
```

### Enhanced Victory Conditions
- **Time-based:** Fastest completion wins
- **Phase-based:** First to reach phase milestones
- **Multiplayer:** Support for >2 players with ranking
