# ActionMap

The ActionMap is a static TypeScript interface that maps an action enum to its corresponding contract type.
This allows the compiler to enforce strict type safety when working with actions and their data contracts.

## Structure

ActionMaps can be found within the [`/src/shared/types/actionmap/`](/src/shared/types/actionmap/) directory.

The inheritance structure similar to the composition of ActionEnum,
but differs in that instead of type unions, it uses extendable interfaces to replace type unions.

Examples may include:
```ts
export default interface ActionMap extends MatchActionMap, SystemActionMap {}
```
and
```ts
export default interface PlayerActionMap extends MechanicsActionMap, PUPActionMap {}
```

At the bottom level, each ActionMap interface must only contain keys from one action enum,
and may look something like this:

```ts
export default interface EarthPUPActionMap {
  [EarthPUPActions.USE_EXCAVATE]: ExcavateContractC2S;
  [EarthPUPActions.EXCAVATE_USED]: ExcavateContractS2C;
  [EarthPUPActions.USE_LANDSLIDE]: LandslideContractC2S;
  [EarthPUPActions.LANDSLIDE_USED]: LandslideContractS2C;
}
```

## Use Cases

The ActionMap is extremely powerful - it forces the developer to define a contract
for every single enum or action that they add into the type definition for ActionEnum.

This also forces factories that create certain packet codecs to obey the contract interface
as linked in the ActionMap, so that the compiler can ensure that the correct data structure is
defined when encoding or decoding packets related to corresponding actions.