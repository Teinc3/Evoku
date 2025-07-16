import type EarthPUP from "../../../enums/mechanics/powerups/earth";
import type { ExcavateContractC2S, ExcavateContractS2C } from "../../../contracts/mechanics/powerups/earth/ExcavateContract";
import type { LandslideContractS2C, LandslideContractC2S } from "../../../contracts/mechanics/powerups/earth/LandslideContract";


export default interface EarthPUPActionMap {
    [EarthPUP.USE_EXCAVATE]: ExcavateContractC2S;
    [EarthPUP.EXCAVATE_USED]: ExcavateContractS2C;
    [EarthPUP.USE_LANDSLIDE]: LandslideContractC2S;
    [EarthPUP.LANDSLIDE_USED]: LandslideContractS2C;
}
