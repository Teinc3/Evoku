import type SystemActions from "./system";
import type MatchActions from "./match";


type ActionEnum = MatchActions | SystemActions;

export type { ActionEnum as default, ActionEnum }

export * from "./match";
export * from "./system";
