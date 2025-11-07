import type FirePUPActions from "../../../../enums/actions/match/player/powerups/fire";
import type {
  MetabolicContractC2S, MetabolicContractS2C
} from "../../../../contracts/match/player/powerups/fire";
import type {
  InfernoContractC2S, InfernoContractS2C
} from "../../../../contracts/match/player/powerups/fire";


export default interface FirePUPActionMap {
  [FirePUPActions.USE_INFERNO]: InfernoContractC2S;
  [FirePUPActions.INFERNO_USED]: InfernoContractS2C;
  [FirePUPActions.USE_METABOLIC]: MetabolicContractC2S;
  [FirePUPActions.METABOLIC_USED]: MetabolicContractS2C;
}