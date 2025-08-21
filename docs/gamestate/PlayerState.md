# Player State Interfaces

This document describes the TypeScript interfaces that define the structure of player game state in Evoku.
These interfaces provide type-safe contracts for game state data across client and server implementations.

## Overview

The player state system consists of hierarchical interfaces that represent:
- **Player identification and game association**
- **Complete game state including board, powerups, and progress**
- **Board state with cells and global cooldowns**
- **Individual cell states with values, effects, and constraints**

## Core Interfaces

### IPlayerState<SpecificBoardState>

The root interface representing a player and their associated game state.

```typescript
interface IPlayerState<SpecificBoardState extends IBoardState = IBoardState> {
  playerID: number;
  gameState?: GameState<SpecificBoardState>;
}
```

**Type Parameters:**
- `SpecificBoardState` - Allows platform-specific board state implementations (extends `IBoardState`)

**Properties:**
- `playerID: number` - Unique identifier for the player
- `gameState?: GameState<SpecificBoardState>` - Optional complete game state (undefined when player not in game)

**Usage Examples:**

```typescript
// Basic player state
const player: IPlayerState = {
  playerID: 1,
  gameState: undefined // Player not currently in a game
};

// Player with active game state
const activePlayer: IPlayerState = {
  playerID: 1,
  gameState: {
    boardState: { /* board data */ },
    pupProgress: 75,
    powerups: [{ type: 1 }, { type: 3 }]
  }
};

// Platform-specific board state
const serverPlayer: IPlayerState<ServerBoardState> = {
  playerID: 1,
  gameState: {
    boardState: serverSpecificBoardData,
    pupProgress: 50,
    powerups: []
  }
};
```

### GameState<SpecificBoardState>

Interface representing the complete state of an active game.

```typescript
interface GameState<SpecificBoardState extends IBoardState = IBoardState> {
  boardState: SpecificBoardState;
  pupProgress: number;
  powerups: Array<PUPState>;
}
```

**Type Parameters:**
- `SpecificBoardState` - Platform-specific board state type

**Properties:**
- `boardState: SpecificBoardState` - Current state of the game board
- `pupProgress: number` - Power-up progress (0-100 representing percentage)
- `powerups: Array<PUPState>` - Collection of active power-ups

**Usage Scenarios:**

```typescript
// Game state with progress tracking
const gameState: GameState = {
  boardState: {
    globalLastCooldownEnd: 8000,
    board: [/* 81 cell states for 9x9 Sudoku */]
  },
  pupProgress: 45, // 45% progress toward next power-up
  powerups: [
    { type: 1 }, // Freeze effect
    { type: 2 }  // Speed boost
  ]
};

// Empty game state (new game)
const newGame: GameState = {
  boardState: {
    globalLastCooldownEnd: 0,
    board: Array(81).fill({
      value: 0,
      fixed: false,
      effects: [],
      lastCooldownEnd: 0
    })
  },
  pupProgress: 0,
  powerups: []
};
```

## Supporting Interfaces

### IBoardState

Defines the structure of board state data.

```typescript
interface IBoardState {
  globalLastCooldownEnd: number;
  board: BoardCellStates; // Array of ICellState
}
```

**Properties:**
- `globalLastCooldownEnd: number` - Timestamp when global board cooldown expires
- `board: BoardCellStates` - Array of cell states (typically 81 cells for 9x9 Sudoku)

### ICellState

Defines the structure of individual cell state data.

```typescript
interface ICellState {
  value: number;           // Cell value (0-9, where 0 = empty)
  fixed: boolean;          // Whether cell is pre-filled (puzzle clue)
  effects: ICellEffectState[];  // Active effects on this cell
  lastCooldownEnd: number; // Timestamp when cell cooldown expires
}
```

### ICellEffectState

Defines the structure of effect state data.

```typescript
interface ICellEffectState {
  startedAt: number;    // Timestamp when effect began
  lastUntil?: number;   // Optional timestamp when effect ends
}
```

### PUPState

Defines the structure of power-up state data.

```typescript
interface PUPState {
  type: number; // Power-up type identifier
}
```

## Type Safety and Generics

### Platform-Specific Implementations

The generic type system allows different board state implementations:

```typescript
// Server-specific board state with additional validation data
interface ServerBoardState extends IBoardState {
  validationHash: string;
  lastModified: number;
}

// Client-specific board state with UI optimization data  
interface ClientBoardState extends IBoardState {
  selectedCell?: number;
  highlightedCells: number[];
}

// Strongly typed player states
const serverPlayer: IPlayerState<ServerBoardState> = { /* ... */ };
const clientPlayer: IPlayerState<ClientBoardState> = { /* ... */ };
```

### Type Constraints

The type system ensures compatibility while maintaining flexibility:

```typescript
// ✅ Valid: ServerBoardState extends IBoardState
const validPlayer: IPlayerState<ServerBoardState> = { /* ... */ };

// ❌ Invalid: String does not extend IBoardState
// const invalidPlayer: IPlayerState<string> = { /* ... */ };
```

## Integration with Models

These interfaces work with model classes that implement game logic:

```typescript
// Models implement logic that operates on interface data
class BaseBoardModel<PlatformCellModel> {
  constructor(private state: IBoardState) { }
  
  // Model methods operate on interface data
  public validate(cellIndex: number, value: number): boolean {
    const cell = this.state.board[cellIndex];
    return cell.value !== value && !cell.fixed;
  }
}

// Platform-specific models use platform-specific state types
class ServerBoardModel extends BaseBoardModel<ServerCellModel> {
  constructor(private serverState: ServerBoardState) {
    super(serverState);
  }
}
```

## State Lifecycle

### Player State Transitions

```typescript
// 1. Player connects (no game state)
const connectedPlayer: IPlayerState = {
  playerID: 1,
  gameState: undefined
};

// 2. Player joins game (game state created)
const gamePlayer: IPlayerState = {
  playerID: 1,
  gameState: {
    boardState: initialBoardState,
    pupProgress: 0,
    powerups: []
  }
};

// 3. Player makes progress (state updated)
const progressPlayer: IPlayerState = {
  playerID: 1,
  gameState: {
    boardState: updatedBoardState,
    pupProgress: 25,
    powerups: [{ type: 1 }] // Earned power-up
  }
};

// 4. Player leaves game (game state removed)
const disconnectedPlayer: IPlayerState = {
  playerID: 1,
  gameState: undefined
};
```

## Best Practices

### Interface Usage

1. **Use generics for platform-specific state**
   ```typescript
   function handlePlayer<T extends IBoardState>(player: IPlayerState<T>) {
     // Type-safe access to platform-specific board state
   }
   ```

2. **Check for game state presence**
   ```typescript
   if (player.gameState) {
     // Safe to access game state properties
     const progress = player.gameState.pupProgress;
   }
   ```

3. **Validate state structure**
   ```typescript
   function isValidPlayerState(data: any): data is IPlayerState {
     return typeof data.playerID === 'number' &&
            (data.gameState === undefined || isValidGameState(data.gameState));
   }
   ```

### State Immutability

Treat interface data as immutable for predictable state management:

```typescript
// ✅ Good: Create new state objects
const updatedPlayer: IPlayerState = {
  ...player,
  gameState: {
    ...player.gameState!,
    pupProgress: newProgress
  }
};

// ❌ Avoid: Mutating existing state
player.gameState!.pupProgress = newProgress;
```

## Integration Points

- **Networking**: Interfaces define serializable state for client-server communication
- **Storage**: Interfaces provide structure for state persistence and restoration  
- **Validation**: Type system catches state structure errors at compile time
- **Models**: Model classes implement business logic that operates on interface data
- **UI**: Client interfaces can extend base interfaces with UI-specific properties

These interfaces provide the foundation for type-safe, platform-agnostic game state management in Evoku.