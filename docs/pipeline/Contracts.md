# Data Contract Documentation

This document outlines the data contracts used within the Evoku project,
detailing the structure, types, and usage of data objects that are passed through the Packet Pipeline.
It serves as a guide for developers to understand how to create, use,
and test these contracts effectively within the application layer,
and how they interact with the underlying network protocol.


## Overview

Each internal object handled through the Packet Pipeline is bound by a specific contract,
which all extend [`IDataContract`](/src/shared/types/contracts/IDataContract.ts).
The generic type of such objects is referred to as `GenericContract` in the codebase.

Contracts are stored in the [`/src/shared/types/contracts/`](/src/shared/types/contracts/) directory.

Example:
```ts
export default abstract class CustomCodec<GenericContract extends IDataContract>
```

During handling and routing of these data objects, an `action` property can be augmented
into the object using [`AugmentAction`](/src/shared/types/utils/AugmentAction.ts),
which maps the property to an Enum acting as a type discriminator.
This is used by an Event Bus to route the object to the correct handler,
or to allow wrapping the packet ID in the object for serialization.
The Enums have a union type [`ActionEnum`](/src/shared/types/enums/actions/index.ts).


## Contract Types

### Base Contracts

#### IDataContract
```ts
export default interface IDataContract {}
```
All contracts must extend this base interface for consistency.

#### AugmentAction

AugmentAction is a utility type that extends a contract with an `action` property.
It looks up the corresponding contract using the `ActionMap`.
This type is used when coding packets to include the action (packetID) in the buffer.

```ts
type AugmentAction<Action extends keyof ActionMap> = ActionMap[Action] & {
    action: ActionMap[Action]["action"];
};

// Usage example:
// AugmentedPingContract now requires explicit action declaration
// { action: Networking.PING, ...}
type AugmentedPingContract = AugmentAction<PingContract>;
```

#### IExtendableContract
An extendable contract, allowing for additional common fields to be added to
any contract without modifying the original interface.

```ts
export default interface IExtendableContract {}
```

## Contract Examples

Contracts are stored and nested in a similar structure to that of `ActionEnum`.

### Simple Networking Contract
```ts
export default interface PingContract extends IDataContract {
    clientTime: number;
    serverTime: number;
}
```

### Player Action Contract
```ts
export default interface SetCellContract extends PlayerActionContract {
    index: number;        // Cell position in game grid
    value: number;        // New cell value
}
```

## Contract Guidelines

### Naming Conventions
- **Interfaces**: `{Purpose}Contract` (e.g., `PingContract`, `SetCellContract`)
- **Actions**: `{Group}.{ACTION}` (e.g., `Networking.PING`)
- **Fields**: `camelCase` (e.g., `clientTime`, `playerID`)
- **Factory Functions**: `create{Object}` (e.g., `createPacket`, `createArrayCodec`)

### Type Safety Rules
1. All contracts must extend `IDataContract`
2. All extendable/injectable contract fragments must extend `IExtendableContract`
3. Use `AugmentAction` to ensure action property is correctly typed when passing into the pipeline

### Best Practices
- Group related and common fields into extendable contracts (`ActionContractS2C`)
- Avoid deeply nesting structures - it will complicate serialisation

### Flow for new contracts

1. Define interface extending appropriate base and extendable contracts
2. Add action to relevant enum
3. Update actionmap to associate new action with contract
4. Create packet using factory function and inject new/reusable codecs