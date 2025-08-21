# Game State Models

This section documents the core game state models that provide the foundation for Evoku's game logic.
These models are shared between client and server implementations and contain the essential game mechanics.

## Model Overview

The game state is composed of three interconnected model types:

### Base Board Model
Path: [Board.md](Board.md)

The `BaseBoardModel` class manages the overall game board state, including:
- Collection of cells that make up the game board
- Global cooldown management for rate limiting
- Board-wide validation and state integrity
- Progress tracking and completion detection
- State hashing for synchronization

### Base Cell Model
Path: [Cell.md](Cell.md)  

The `BaseCellModel` class represents individual cells on the game board:
- Cell value storage and constraints (0-9 for Sudoku)
- Fixed cell management (pre-filled puzzle clues)
- Per-cell cooldown system for spam prevention
- Effect integration for temporal modifications
- Individual cell validation and state hashing

### Base Effect Model
Path: [Effect.md](Effect.md)

The `BaseEffectModel` class provides temporal effects that modify game behavior:
- Time-based effect duration management
- Cell value change validation override
- Progress tracking modification
- State hashing for effect verification
- Extensible architecture for different effect types

## Architecture Principles

### Shared Core Logic
Base models contain all game logic that should be consistent across platforms.
This ensures that game rules are identical whether running on client or server.

### Platform Extensions
Server and client implementations extend these base models to add platform-specific features:
- Server: Authoritative validation, anti-cheat, persistence
- Client: UI integration, optimistic updates, local state

### Type Safety  
TypeScript generics ensure type safety across the model hierarchy while maintaining flexibility
for platform-specific implementations.

### Hash-based Integrity
All models implement hash computation for state verification, enabling:
- Client-server state synchronization
- Anti-cheat detection
- Rollback and recovery mechanisms
- State debugging and diagnostics

## Integration

These models work together to provide complete game state management:

1. **Board** contains an array of **Cells**
2. **Cells** can have multiple **Effects** applied
3. **Effects** modify how **Cells** behave during validation and progress tracking
4. All models provide hash computation for state synchronization

The models are designed to be platform-agnostic while providing the foundation
for platform-specific implementations that add networking, persistence, UI, and other features.