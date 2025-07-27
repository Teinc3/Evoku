# Handlers

Handlers are server-side components that triage and process inbound packet data
from the client. They are responsible for forwarding the data to the corresponding
logical components of the game.

A list of handlers can be found in the [`/src/server/handlers`](/src/server/handlers)
directory. Similarly to all other objects, classes and types within the data pipeline,
handlers are organised in the exact same way within the file structure. 

All Data Handlers must implement the [`IDataHandler`](/src/server/types/handler.ts)
interface, which wraps the `handleData` function.

Analogous to the composition of ActionEnum, handlers navigate the data pipeline
by using two types of Handlers: `EnumHandler` and `UnionHandler`. The following 
sections will describe these two types of handlers in greater detail.

## EnumHandler

An `EnumHandler` is a handler that exists at the lowest level of the hierarchy.
It is only responsible for routing data of a single enum type.

When creating a low-level handler that extends EnumHandler, you must do the following:
- Set the Generic type to the corresponding Enum Type
- Create the mapping between each Enum member that is **C2S** and its
  corresponding handler functions (that you usually create within the class)
- Remember to call the `setHandlerMap` function!

If a packet that is not expected by the handler is received (i.e. it is a S2C packet),
a warning is given in the console. However, to improve security in the future,
the plan will be to disconnect the session or shadowban the user.

An example of an EnumHandler is the `LobbyHandler`, which is responsible for
routing lobby-related data to the corresponding matchmaking game logic:
```ts
export default class LobbyHandler extends EnumHandler<LobbyActions> {
  constructor() {
    super();

    const handlerMap = {
      [LobbyActions.JOIN_QUEUE]: this.handleJoinQueue,
      [LobbyActions.LEAVE_QUEUE]: this.handleLeaveQueue
    };

    this.setHandlerMap(handlerMap);
  }

  private handleJoinQueue(_session: SessionModel, _data: AugmentAction<LobbyActions>): boolean {
    // Logic for handling join queue action
    // ...
  }

  private handleLeaveQueue(_session: SessionModel, _data: AugmentAction<LobbyActions>): boolean {
    // Logic for handling leave queue action
    // ...
  }
}
```

There might be cases where there are no C2S packets available for a specific enum category.
But due to type safety and future-proofing of the data pipeline,
these handlers will still be implemented, albeit with an empty handlerMap.

## UnionHandler

A `UnionHandler` is a handler that exists at a higher level of the hierarchy.
It is responsible for routing data of union types of either enums,
or other union types.

UnionHandler essentially acts as a triage point for incoming data by mapping
an array of tuples containing each a TypeGuard and a corresponding injected handler
through the `handleData` function.

The process of creating a UnionHandler is way simpler than creating an EnumHandler.
You may simply obtain the injected children handlers in the constructor,
create the mapping with the imported typeguards and the handlers,
and return it into the base constructor through `super`.

An example of a UnionHandler is the `MatchHandler`, which is a high-level handler
that triages data from `MatchActions` into the 3 children types of handlers:
```ts
export default class MatchHandler extends UnionHandler<MatchActions> {
  constructor(
    lifecycleHandler: IDataHandler<LifecycleActions>,
    playerHandler: IDataHandler<PlayerActions>,
    protocolHandler: IDataHandler<ProtocolActions>
  ) {
    super([
      [isLifecycleActionsData, lifecycleHandler],
      [isPlayerActionsData, playerHandler],
      [isProtocolActionsData, protocolHandler]
    ] as SomeHandlerMapEntry<MatchActions>[]);
  }
}
```