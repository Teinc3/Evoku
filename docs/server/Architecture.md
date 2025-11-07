# Server Architecture

This document outlines the file structure for the Evoku game server. Each directory and file has a specific, single responsibility to ensure the codebase is modular and scalable.

## File Structure

```
src/server/
├── core/
│   ├── HTTPServer.ts
│   └── WSServer.ts
├── game/
│   ├── controllers/
│   │   ├── lifecycle.ts
│   │   └── state.ts
│   └── time/
├── managers/
│   ├── MatchmakingManager.ts
│   ├── SessionManager.ts
│   └── RoomManager.ts
├── handlers/
│   ├── match/
│   ├── system/
│   ├── EnumHandler.ts
│   └── UnionHandler.ts
├── models/
│   ├── networking/
│   │   ├── Session.ts
│   │   ├── Room.ts
│   │   ├── SyncProfile.ts
│   │   └── ServerSocket.ts
│   └── logic/
│       ├── Board.ts
│       └── Cell.ts
├── tests/
├── types/
└── index.ts
```

## Directory Structure

- index.ts: The main entry point for the server. It initializes and orchestrates the HTTPServer and WSServer.

### /core

Contains the foundational components for running the application.

- HTTPServer.ts: Manages the Express.js application and handles all standard HTTP API/routing requests.

- WSServer.ts: Manages the WebSocket server, attaching to the HTTP server and handling raw WebSocket connections.

### /game

Contains all logic related to managing game state.

#### /controllers

- state.ts: GameStateController holds the current state of the game and manages state through exposing a public API.

- lifecycle.ts: LifecycleController controls the lifecycle of the game,
including game initialisations, phase transitions, and result declarations.

#### /time

Holds TimeCoordinator, a facade comprising timing-related utilities and logic.

#### /matchmaking

- index.ts: Manages the queue of players waiting for a game and is responsible for creating new rooms when a match is found.

### /managers

- MatchmakingManager.ts (TBD): Responsible for managing the matchmaking process, including player grouping and room creation.

- SessionManager.ts: The single source of truth for all active player sessions. Creates, manages, and destroys Session objects.

- RoomManager.ts: Manages the lifecycle of all active game rooms. Creates, tracks, and destroys Room objects.

### /models

Contains data models that represent the state of the certain objects in the game.

#### /networking

- Session.ts: Represents a single connected player, wrapping their WebSocket connection and holding their state (e.g., nickname, online status, current room).

- Room.ts: Represents a single game instance, containing the game state and the list of players in the match.

- ServerSocket.ts: A wrapper around the WebSocket connection that automatically encodes/decodes packets into Data Contracts.
It provides methods to send and receive packets, ensuring type safety.

#### /logic

- Board.ts: Represents the game board, holding the state of all cells and providing methods to manipulate the board (e.g., placing a piece, checking for a win).

- Cell.ts: Represents a single cell on the game board, holding its state (e.g., occupied by which player) and providing methods to manipulate the cell.

### /handlers

- EnumHandler.ts: A base class for handling packets related to specific enum types.
- UnionHandler.ts: A base class for triaging packets related to union types of enums to children handlers.
- match/: Contains handlers for match-related actions, such as gameplay or lifecycle actions.
- system/: Contains handlers for system non-match actions, such as player authentication and matchmaking.

### /tests

Contains integration tests for server components and functionality.
Note: Unit Tests are located alongside the module they test, in the same directory,
while E2E tests are located in the `src/tests` directory.