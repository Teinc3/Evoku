import type FirePUP from "../../../enums/actions/mechanics/powerups/fire";
import type { InfernoContractC2S, InfernoContractS2C } from "../../../contracts/mechanics/powerups/fire/InfernoContract";
import type { MetabolicContractC2S, MetabolicContractS2C } from "../../../contracts/mechanics/powerups/fire/MetabolicContract";


export default interface FirePUPActionMap {
    [FirePUP.USE_INFERNO]: InfernoContractC2S;
    [FirePUP.INFERNO_USED]: InfernoContractS2C;
    [FirePUP.USE_METABOLIC]: MetabolicContractC2S;
    [FirePUP.METABOLIC_USED]: MetabolicContractS2C;
}