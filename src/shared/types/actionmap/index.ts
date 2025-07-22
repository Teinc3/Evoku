import type NetworkingActionMap from "./networking";
import type MechanicsActionMap from "./mechanics";
import type LifecycleActionMap from "./lifecycle";


export default interface ActionMap extends 
  NetworkingActionMap,
  MechanicsActionMap,
  LifecycleActionMap
{}