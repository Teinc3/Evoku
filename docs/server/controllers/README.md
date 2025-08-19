# Controllers

Game controllers manage the flow and logic of match gameplay,
coordinating between models and handling player interactions.

## GameState Controller
Path: [/docs/server/controllers/GameState.md](/docs/server/controllers/GameState.md)

The central game mechanics controller that manages player states,
board validation, and game logic for Sudoku matches. Handles move validation,
progress tracking, and coordinates with the timing subsystem for action validation.

## Lifecycle Controller  
Path: [/docs/server/controllers/Lifecycle.md](/docs/server/controllers/Lifecycle.md)

Orchestrates match lifecycle transitions including game initialization, player join/leave events,
and match termination. Manages the overall flow from pre-game to game-over states
and coordinates with game state for progress-based transitions.
