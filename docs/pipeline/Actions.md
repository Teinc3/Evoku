# Actions Documentation

Actions are uniquely discriminated enum types that represent specific operations or events in game.
They are used to define the structure and behavior of data contracts that are passed through the Data Pipeline.

## Action Categories

Actions are stored in the [`/src/shared/types/action/`](/src/shared/types/action/) directory.

ActionEnum is a type union of 2 categories of actions: `MatchActions` and `SystemActions`.
These categories represent fundamentally, where an action is performed,
either in a game/match, or outside of one.

```ts
type ActionEnum = MatchActions | SystemActions;
```

Both categories are further divided into nested subcategories or enums, as shown below:

## MatchActions

MatchActions is a type union containing the following 3 categories:

```ts
type MatchActions = LifecycleActions | PlayerActions | ProtocolActions;
```

### LifecycleActions

LifecycleActions is an enum that represents actions related to the lifecycle within a match.
Actions related to "Phase change", as well as crucial gamestate changes are included here.

```ts
enum LifecycleActions {
  GAME_INIT = -60,
  GAME_OVER = -61
}
```

### PlayerActions

PlayerActions is a type union of all actions that a player can perform during a match.

```ts
type PlayerActions = MechanicsActions | PUPActions
```

#### MechanicsActions

MechanicsActions is an enum that represents actions related to the general mechanics of the game,
but excludes Powerup categories, due to their numerous and complex nature.

```ts
enum MechanicsActions {
  SET_CELL = -1,
  CELL_SET = -2,
  DRAW_PUP = -3,
  PUP_DRAWN = -4
}
```

#### PUPActions

PUPActions is a type union of all powerup enums, corresponding to the 5 elements:

```ts
type PUPActions = EarthPUPActions | FirePUPActions | WaterPUPActions | MetalPUPActions | WoodPUPActions;
```

##### WaterPUPActions

WaterPUPActions is an enum that represents actions related to Water-elemental powerups.

```ts
enum WaterPUPActions {
  USE_CRYO = 10,
  CRYO_USED = 11,
  USE_CASCADE = 12,
  CASCADE_USED = 13,
}
```

##### FirePUPActions

FirePUPActions is an enum that represents actions related to Fire-elemental powerups.

```ts
enum FirePUPActions {
  USE_INFERNO = 20,
  INFERNO_USED = 21,
  USE_METABOLIC = 22,
  METABOLIC_USED = 23,
}
```

##### WoodPUPActions

WoodPUPActions is an enum that represents actions related to Wood-elemental powerups.

```ts
enum WoodPUPActions {
  USE_ENTANGLE = 30,
  ENTANGLE_USED = 31,
  USE_WISDOM = 32,
  WISDOM_USED = 33,
}
```

##### MetalPUPActions

MetalPUPActions is an enum that represents actions related to Metal-elemental powerups.

```ts
enum MetalPUPActions {
  USE_LOCK = 40,
  LOCK_USED = 41,
  USE_FORGE = 42,
  FORGE_USED = 43,
}
```

##### EarthPUPActions

EarthPUPActions is an enum that represents actions related to Earth-elemental powerups.

```ts
enum EarthPUPActions {
  USE_LANDSLIDE = 50,
  LANDSLIDE_USED = 51,
  USE_EXCAVATE = 52,
  EXCAVATE_USED = 53
}
```

### ProtocolActions

ProtocolActions is an enum that represents actions related to the underlying events in a match.
They are not influenced by player actions, and the player do not have control over them,
nor are they aware of them, but are crucial to the game state.

```ts
enum ProtocolActions {
  PING = -10,
  PONG = -11,
  REJECT_ACTION = -12
}
```

## SystemActions

SystemActions is a type union containing the following 2 categories:

```ts
type SystemActions = SessionActions | LobbyActions;
```

### LobbyActions

LobbyActions is an enum that represents actions related to the lobby system,
which is the pre-game phase where players can join or leave queues, and matches are formed.

```ts
enum LobbyActions {
    JOIN_QUEUE = -50,
    LEAVE_QUEUE = -51,
    QUEUE_UPDATE = -52,
    MATCH_FOUND = -53,
}
```

### SessionActions

SessionActions is an enum that represents actions related to the session management,
which includes actions that are performed outside of a match context, such as user authentication.

```ts
enum SessionActions {
  HEARTBEAT = -20
}
```