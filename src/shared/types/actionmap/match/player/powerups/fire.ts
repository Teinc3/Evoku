import type FirePUP from "../../../../enums/actions/match/player/powerups/fire";
import type { 
  MetabolicContractC2S, MetabolicContractS2C
} from "../../../../contracts/match/player/powerups/fire/MetabolicContract";
import type {
  InfernoContractC2S, InfernoContractS2C
} from "../../../../contracts/match/player/powerups/fire/InfernoContract";


export default interface FirePUPActionMap {
  [FirePUP.USE_INFERNO]: InfernoContractC2S;
  [FirePUP.INFERNO_USED]: InfernoContractS2C;
  [FirePUP.USE_METABOLIC]: MetabolicContractC2S;
  [FirePUP.METABOLIC_USED]: MetabolicContractS2C;
}