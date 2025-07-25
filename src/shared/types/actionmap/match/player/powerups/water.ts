import type WaterPUPActions from "../../../../enums/actions/match/player/powerups/water";
import type { 
  CryoContractC2S, CryoContractS2C 
} from "../../../../contracts/match/player/powerups/water/CryoContract";
import type { 
  CascadeContractC2S, CascadeContractS2C 
} from "../../../../contracts/match/player/powerups/water/CascadeContract";


export default interface WaterPUPActionMap {
  [WaterPUPActions.USE_CRYO]: CryoContractC2S;
  [WaterPUPActions.CRYO_USED]: CryoContractS2C;
  [WaterPUPActions.USE_CASCADE]: CascadeContractC2S;
  [WaterPUPActions.CASCADE_USED]: CascadeContractS2C;
}