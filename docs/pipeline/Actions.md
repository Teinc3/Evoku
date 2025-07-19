# Actions Documentation
Actions are uniquely discriminated enum types that represent specific operations or events in game.
They are used to define the structure and behavior of data contracts that are passed through the Data Pipeline.

## Action Categories

ActionEnum is a type union of all further action enums/types:

```ts
type ActionEnum = Networking | Mechanics | Lifecycle
```

### Networking Actions
```ts
enum Networking {
    PING = -10,    // Client-server ping
    PONG = -11     // Server response to ping
}
```

### Game Mechanics

Game Mechanics is a union of both Gameplay and Powerups:
```ts
export type Mechanics = Gameplay | Powerups;
```

### Gameplay Actions
```ts
enum Gameplay {
    SET_CELL = -1,
    CELL_SET = -2,
    DRAW_PUP = -3,
    PUP_DRAWN = -4,
    REJECT_ACTION = -9
}
```

### Lifecycle Actions
```ts
enum Lifecycle {
    JOIN_QUEUE = -50,
    LEAVE_QUEUE = -51,
    QUEUE_UPDATE = -52,
    MATCH_FOUND = -53,
    GAME_INIT = -54,
    GAME_OVER = -55
}
```

### Powerups
The Powerups type is a union of all powerup enums, corresponding to the 5 elements:

```ts
type Powerups = EarthPUP | FirePUP | WaterPUP | MetalPUP | WoodPUP;
```

A more detailed breakdown of each powerup will be documented in the powerups documentation.


## ActionMap

The ActionMap is a static TypeScript interface that maps an action enum to its corresponding contract type.
This allows the compiler to enforce strict type safety when working with actions and their data contracts.

The inheritance structure similar to that of the ActionEnum compositions:
```ts
export default interface ActionMap extends 
    NetworkingActionMap,
    MechanicsActionMap,
    LifecycleActionMap
    {}
```

Where each individual map may look something like this:

```ts
export default interface LifecycleActionMap {
    [Lifecycle.JOIN_QUEUE]: JoinQueueContract;
    [Lifecycle.LEAVE_QUEUE]: LeaveQueueContract;
    [Lifecycle.QUEUE_UPDATE]: QueueUpdateContract;
    [Lifecycle.MATCH_FOUND]: MatchFoundContract;
    [Lifecycle.GAME_INIT]: GameInitContract;
    [Lifecycle.GAME_OVER]: GameOverContract;
}
```

Note that each Action Map interface must only contains keys from one action enum.

It is possible to combine multiple action maps into one single unified ActionMap interface.
As usual, the Mechanics ActionMap is comprised of both Gameplay and Powerups action maps:

```ts
export default interface MechanicsActionMap extends GameplayActionMap, PUPActionMap {}
```

Where the Powerups ActionMap is a union of all powerup enums:

```ts
export default interface PUPActionMap extends
    EarthPUPActionMap,
    FirePUPActionMap,
    WaterPUPActionMap,
    WoodPUPActionMap,
    MetalPUPActionMap {}
```