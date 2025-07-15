import type FirePUP from "@shared/types/enums/mechanics/powerups/fire";
import type PUPBaseContract from "../PUPContract";


export default interface MetabolicBaseContract extends PUPBaseContract {
    action: FirePUP.METABOLIC;
}