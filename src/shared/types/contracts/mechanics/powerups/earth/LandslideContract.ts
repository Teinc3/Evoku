import type EarthPUP from "@shared/types/enums/mechanics/powerups/earth";
import type PUPBaseContract from "../PUPContract";
import type CellIndexContract from "../../extendables/CellIndexContract";


export default interface LandslideBaseContract extends PUPBaseContract {
    action: EarthPUP.LANDSLIDE;
}

// Landslide is an rAOE powerup
export interface LandslideContractS2C extends LandslideBaseContract, CellIndexContract {}