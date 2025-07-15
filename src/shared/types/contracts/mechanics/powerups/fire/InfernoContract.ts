import type FirePUP from "@shared/types/enums/mechanics/powerups/fire";
import type PUPBaseContract from "../PUPContract";
import type CellIndexContract from "../../extendables/CellIndexContract";


export default interface InfernoBaseContract extends PUPBaseContract, CellIndexContract {
    action: FirePUP.INFERNO;
}