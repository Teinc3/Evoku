import type PUPActionMap from "./powerups";
import type MechanicsActionMap from "./mechanics";


export default interface PlayerActionMap extends MechanicsActionMap, PUPActionMap {}
