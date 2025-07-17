import type PUPBaseContract from "../PUPContract";
import type CellIndexContract from "../../../extendables/CellIndexContract";
import type { ActionContractC2S, ActionContractS2C } from "../../../base/ActionContract";


export default interface LandslideBaseContract extends PUPBaseContract {}
// Landslide is an rAOE powerup
export interface LandslideContractC2S extends LandslideBaseContract, ActionContractC2S {}
export interface LandslideContractS2C extends LandslideBaseContract, CellIndexContract, ActionContractS2C {}