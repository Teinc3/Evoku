# Game State Documentation

This section documents the game state interfaces and models that form the foundation of Evoku's game logic.
The game state consists of TypeScript interfaces that define the state structure, and model classes that implement the game logic.

## Overview

The game state is organized into two main layers:

1. **State Interfaces** - TypeScript interfaces that define the shape of game state data
2. **State Models** - Classes that implement game logic and operate on state data

## State Structure

### Player State
Path: [PlayerState.md](PlayerState.md)

Documents the `IPlayerState` interface, which represents the complete game state for a player including:
- Player identification
- Game state (board, powerups, progress)
- State generics for platform-specific board implementations

### State Models  
Path: [models/README.md](models/README.md)

Documents the model classes that implement game logic for state interfaces:
- **BaseBoardModel** - Implements board game logic and validation
- **BaseCellModel** - Implements individual cell behavior and constraints
- **BaseEffectModel** - Implements temporal effects that modify game behavior

## Architecture

### Interface Layer
Game state interfaces define the structure of state data:

```typescript
IPlayerState<SpecificBoardState>
├── playerID: number
└── gameState: GameState<SpecificBoardState>
    ├── boardState: IBoardState
    ├── pupProgress: number  
    └── powerups: PUPState[]
```

### Model Layer
Model classes provide game logic that operates on state interfaces:

```
BaseBoardModel<T>           (implements board logic)
├── ServerBoardModel        (server-specific)
└── ClientBoardModel        (client-specific)

BaseCellModel               (implements cell logic)
├── ServerCellModel         (server-specific)
└── ClientCellModel         (client-specific)

BaseEffectModel             (implements effect logic)
├── ServerEffectModel       (server-specific)
└── ClientEffectModel       (client-specific)
```

## Key Concepts

### Platform Abstraction
State interfaces are platform-agnostic, while model implementations can be platform-specific:
- **Shared interfaces** ensure consistent state structure
- **Platform-specific models** add features like networking, persistence, or UI integration

### Type Safety
TypeScript generics ensure type safety across the state/model hierarchy:
- `IPlayerState<SpecificBoardState>` allows different board state implementations
- Models use generics to maintain type compatibility with their state interfaces

### Separation of Concerns
- **Interfaces** define data structure and contracts
- **Models** implement business logic and validation
- **Platform implementations** add environment-specific features