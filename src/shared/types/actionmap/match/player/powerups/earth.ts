import type EarthPUPActions from "../../../../enums/actions/match/player/powerups/earth";
import type {
  LandslideContractS2C, LandslideContractC2S
} from "../../../../contracts/match/player/powerups/earth/LandslideContract";
import type {
  ExcavateContractC2S, ExcavateContractS2C
} from "../../../../contracts/match/player/powerups/earth/ExcavateContract";


export default interface EarthPUPActionMap {
  [EarthPUPActions.USE_EXCAVATE]: ExcavateContractC2S;
  [EarthPUPActions.EXCAVATE_USED]: ExcavateContractS2C;
  [EarthPUPActions.USE_LANDSLIDE]: LandslideContractC2S;
  [EarthPUPActions.LANDSLIDE_USED]: LandslideContractS2C;
}
