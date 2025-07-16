import type NetworkingActionMap from "./networking";
import type GameplayActionMap from "./mechanics/";


export default interface ActionMap extends NetworkingActionMap, GameplayActionMap {}