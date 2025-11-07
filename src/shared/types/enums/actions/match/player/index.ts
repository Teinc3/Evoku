import type PUPActions from "./powerups";
import type MechanicsActions from "./mechanics";


type PlayerActions = MechanicsActions | PUPActions;

export type { PlayerActions as default, PlayerActions }

export { default as MechanicsActions } from "./mechanics";
export * from "./powerups";
