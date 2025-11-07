import type ProtocolActions from "./protocol";
import type PlayerActions from "./player";
import type LifecycleActions from "./lifecycle";


type MatchActions = LifecycleActions | PlayerActions | ProtocolActions;

export type { MatchActions as default, MatchActions }

export { default as LifecycleActions } from "./lifecycle";
export { default as ProtocolActions } from "./protocol";
export * from "./player";
