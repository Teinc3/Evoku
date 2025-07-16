import type PUPBaseContract from "../PUPContract";
import type CellIndexContract from "../../../extendables/CellIndexContract";


export default interface LandslideBaseContract extends PUPBaseContract {}

// Landslide is an rAOE powerup
export interface LandslideContractC2S extends LandslideBaseContract {}
export interface LandslideContractS2C extends LandslideBaseContract, CellIndexContract {}