import type PUPActionMap from "./powerups";
import type GameplayActionMap from "./gameplay";


export default interface MechanicsActionMap extends GameplayActionMap, PUPActionMap {}