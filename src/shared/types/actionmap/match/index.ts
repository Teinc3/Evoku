import type ProtocolActionMap from "./protocol";
import type PlayerActionMap from "./player";
import type LifecycleActionMap from "./lifecycle";


export default interface MatchActionMap
  extends LifecycleActionMap, ProtocolActionMap, PlayerActionMap {}
