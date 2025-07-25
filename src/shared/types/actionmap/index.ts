import type SystemActionMap from "./system";
import type MatchActionMap from "./match";


export default interface ActionMap extends MatchActionMap, SystemActionMap {}