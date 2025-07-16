import type NetworkingActionMap from "./networking";
import type MechanicsActionMap from "./mechanics/";


export default interface ActionMap extends NetworkingActionMap, MechanicsActionMap {}