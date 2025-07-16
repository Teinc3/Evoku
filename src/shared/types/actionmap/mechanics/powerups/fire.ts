import type FirePUP from "../../../enums/mechanics/powerups/fire";
import type InfernoBaseContract from "../../../contracts/mechanics/powerups/fire/InfernoContract";
import type MetabolicBaseContract from "../../../contracts/mechanics/powerups/fire/MetabolicContract";


export default interface FirePUPActionMap {
    [FirePUP.INFERNO]: InfernoBaseContract;
    [FirePUP.METABOLIC]: MetabolicBaseContract;
}