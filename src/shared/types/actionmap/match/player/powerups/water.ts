import type WaterPUPActions from "../../../../enums/actions/match/player/powerups/water";
import type { 
  PurityContractC2S, PurityContractS2C 
} from "../../../../contracts/match/player/powerups/water/PurityContract";
import type { 
  CryoContractC2S, CryoContractS2C 
} from "../../../../contracts/match/player/powerups/water/CryoContract";


export default interface WaterPUPActionMap {
  [WaterPUPActions.USE_CRYO]: CryoContractC2S;
  [WaterPUPActions.CRYO_USED]: CryoContractS2C;
  [WaterPUPActions.USE_PURITY]: PurityContractC2S;
  [WaterPUPActions.PURITY_USED]: PurityContractS2C;
}