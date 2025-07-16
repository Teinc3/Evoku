import type EarthPUP from "../../../enums/mechanics/powerups/earth";
import type ExcavateBaseContract from "../../../contracts/mechanics/powerups/earth/ExcavateContract";
import type LandslideBaseContract from "../../../contracts/mechanics/powerups/earth/LandslideContract";


export default interface EarthPUPActionMap {
    [EarthPUP.EXCAVATE]: ExcavateBaseContract;
    [EarthPUP.LANDSLIDE]: LandslideBaseContract;
}
