import type LifecycleActionMap from "./lifecycle";
import type PlayerActionMap from "./player";
import type ProtocolActionMap from "./protocol";


export default interface MatchActionMap
    extends LifecycleActionMap, ProtocolActionMap, PlayerActionMap {}