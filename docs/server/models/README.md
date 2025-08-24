# Server Models

Server models are classes that are expected to be instantiated many times over the application lifecycle.
Each model represents a specific concept or entity within the server's domain.

For convenience, models are separated based on their functionality and purpose.

## Networking-related Models

### Session
Path: [/docs/server/models/networking/Session.md](/docs/server/models/networking/Session.md)

This section documents the **Session** class in detail, which represents a connected client to the server. 

### Room
Path: [/docs/server/models/networking/Room.md](/docs/server/models/networking/Room.md)

This section documents the **Room** class's API and interactions with external methods,
which provides an environment for connected clients to play against each other.

## Logic-related Models

*Server models extend shared base classes from the gamestate package. For base functionality, see [Game State Models](/docs/gamestate/models/README.md).*

### Server Board
Path: [/docs/server/models/logic/Board.md](/docs/server/models/logic/Board.md)

This section documents the **ServerBoardModel** class, which extends BaseBoardModel 
to provide server-authoritative board operations with validation and objective tracking.

### Server Cell
Path: [/docs/server/models/logic/Cell.md](/docs/server/models/logic/Cell.md)

This section documents the **ServerCellModel** class, which extends BaseCellModel
to provide server-authoritative cell operations with cooldown management and validation.